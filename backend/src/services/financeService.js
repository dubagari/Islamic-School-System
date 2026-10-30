import FeeStructure from "../models/FeeStructure.js";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import AcademicClass from "../models/AcademicClass.js";
import AcademicSession from "../models/AcademicSession.js";
import AcademicSemester from "../models/AcademicSemester.js";
import Student from "../models/Student.js";
import {
    assertStudentAccess,
    getParentForUser,
    getStudentForUser,
} from "./accessControlService.js";
import {
    createStudentAudienceNotifications,
} from "./communicationService.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import { escapeRegex } from "../utils/search.js";
import { generateSequenceNumber } from "../utils/sequence.js";
import {
    badRequest,
    forbidden,
    notFound,
} from "../utils/AppError.js";

// ======================================================
// Helpers
// ======================================================

const populateInvoice = (query) =>
    query
        .populate(
            "student",
            "firstName middleName lastName registrationNumber academicClass parentName parentPhone parentEmail"
        )
        .populate(
            "academicClass",
            "name academicLevel"
        )
        .populate(
            "academicSession",
            "name startDate endDate"
        )
        .populate(
            "academicSemester",
            "name startDate endDate"
        )
        .populate(
            "issuedBy",
            "fullName username role"
        );

const populatePayment = (query) =>
    query
        .populate(
            "student",
            "firstName middleName lastName registrationNumber"
        )
        .populate(
            "invoice",
            "invoiceNumber totalAmount amountPaid balance status dueDate"
        )
        .populate(
            "recordedBy",
            "fullName username role"
        )
        .populate(
            "reversedBy",
            "fullName username role"
        );

const ensureAcademicContext = async ({
    academicSession,
    academicSemester,
    academicClass,
}) => {
    const [session, semester, classRecord] =
        await Promise.all([
            AcademicSession.findById(academicSession),
            AcademicSemester.findById(academicSemester),
            AcademicClass.findById(academicClass),
        ]);

    if (!session) {
        throw notFound("Academic session not found.");
    }

    if (!semester) {
        throw notFound("Academic semester not found.");
    }

    if (!classRecord) {
        throw notFound("Academic class not found.");
    }

    if (
        semester.academicSession.toString() !==
        academicSession.toString()
    ) {
        throw badRequest(
            "Academic semester does not belong to the selected academic session."
        );
    }

    return {
        session,
        semester,
        classRecord,
    };
};

const refreshOverdueInvoices = async (extraFilter = {}) => {
    await Invoice.updateMany(
        {
            status: {
                $in: ["Unpaid", "Partially Paid"],
            },
            dueDate: {
                $ne: null,
                $lt: new Date(),
            },
            ...extraFilter,
        },
        {
            $set: {
                status: "Overdue",
            },
        }
    );
};

const calculateInvoiceStatus = (invoice) => {
    if (invoice.status === "Cancelled") {
        return "Cancelled";
    }

    if (Number(invoice.balance) <= 0) {
        return "Paid";
    }

    if (
        invoice.dueDate &&
        new Date(invoice.dueDate).getTime() <
            new Date().getTime()
    ) {
        return "Overdue";
    }

    if (Number(invoice.amountPaid) > 0) {
        return "Partially Paid";
    }

    return "Unpaid";
};

export const recalculateInvoice = async (invoiceId) => {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    const totals = await Payment.aggregate([
        {
            $match: {
                invoice: invoice._id,
                status: "Completed",
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
            },
        },
    ]);

    const amountPaid = Number(
        (totals[0]?.total || 0).toFixed(2)
    );

    invoice.amountPaid = amountPaid;
    invoice.balance = Math.max(
        Number(
            (
                Number(invoice.totalAmount) - amountPaid
            ).toFixed(2)
        ),
        0
    );
    invoice.status = calculateInvoiceStatus(invoice);

    await invoice.save();

    return invoice;
};

const assertInvoiceAccess = async (user, invoice) => {
    if (!user) {
        throw forbidden();
    }

    if (user.role === "admin") {
        return;
    }

    if (user.role === "student") {
        if (
            invoice.student.toString() ===
            user.student?.toString()
        ) {
            return;
        }

        throw forbidden(
            "You can only access your own invoices."
        );
    }

    if (user.role === "parent") {
        const parent = await getParentForUser(user._id);

        const isChild = parent.students.some(
            (childId) =>
                childId.toString() ===
                invoice.student.toString()
        );

        if (isChild) {
            return;
        }

        throw forbidden(
            "You can only access invoices for your own children."
        );
    }

    throw forbidden();
};

const assertPaymentAccess = async (user, payment) => {
    if (!user) {
        throw forbidden();
    }

    if (user.role === "admin") {
        return;
    }

    if (user.role === "student") {
        if (
            payment.student.toString() ===
            user.student?.toString()
        ) {
            return;
        }

        throw forbidden(
            "You can only access your own payments."
        );
    }

    if (user.role === "parent") {
        const parent = await getParentForUser(user._id);

        const isChild = parent.students.some(
            (childId) =>
                childId.toString() ===
                payment.student.toString()
        );

        if (isChild) {
            return;
        }

        throw forbidden(
            "You can only access payments for your own children."
        );
    }

    throw forbidden();
};

const getScopedStudentFilter = async (user) => {
    if (user.role === "admin") {
        return null;
    }

    if (user.role === "student") {
        const student = await getStudentForUser(user._id);

        return student._id;
    }

    if (user.role === "parent") {
        const parent = await getParentForUser(user._id);

        return {
            $in: parent.students,
        };
    }

    throw forbidden();
};

const applyScopedStudentFilter = (
    filter,
    scopedStudent,
    query
) => {
    if (!scopedStudent) {
        if (query.student) {
            filter.student = query.student;
        }

        return;
    }

    if (query.student) {
        const allowed = scopedStudent.$in
            ? scopedStudent.$in.some(
                  (studentId) =>
                      studentId.toString() ===
                      query.student.toString()
              )
            : scopedStudent.toString() ===
              query.student.toString();

        if (!allowed) {
            throw forbidden(
                "You can only access records for your own children."
            );
        }

        filter.student = query.student;

        return;
    }

    filter.student = scopedStudent;
};

// ======================================================
// Fee Structures
// ======================================================

export const createFeeStructureService = async (
    data,
    user
) => {
    await ensureAcademicContext(data);

    const duplicate = await FeeStructure.findOne({
        academicSession: data.academicSession,
        academicSemester: data.academicSemester,
        academicClass: data.academicClass,
        name: new RegExp(
            `^${escapeRegex(data.name)}$`,
            "i"
        ),
    });

    if (duplicate) {
        throw badRequest(
            "A fee structure with this name already exists for the selected class and semester."
        );
    }

    return await FeeStructure.create({
        ...data,
        createdBy: user._id,
    });
};

export const getFeeStructuresService = async (
    query
) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester =
            query.academicSemester;
    }

    if (query.academicClass) {
        filter.academicClass = query.academicClass;
    }

    if (query.feeType) {
        filter.feeType = query.feeType;
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === "true";
    }

    if (query.search) {
        const regex = new RegExp(
            escapeRegex(query.search),
            "i"
        );

        filter.$or = [
            { name: regex },
            { description: regex },
        ];
    }

    const [feeStructures, total] = await Promise.all([
        FeeStructure.find(filter)
            .populate("academicSession", "name")
            .populate("academicSemester", "name")
            .populate("academicClass", "name")
            .populate("createdBy", "fullName username")
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit),
        FeeStructure.countDocuments(filter),
    ]);

    return paginatedResult(feeStructures, total, {
        page,
        limit,
    });
};

export const getFeeStructureByIdService = async (
    feeStructureId
) => {
    const feeStructure = await FeeStructure.findById(
        feeStructureId
    )
        .populate("academicSession", "name")
        .populate("academicSemester", "name")
        .populate("academicClass", "name")
        .populate("createdBy", "fullName username");

    if (!feeStructure) {
        throw notFound("Fee structure not found.");
    }

    return feeStructure;
};

export const updateFeeStructureService = async (
    feeStructureId,
    data
) => {
    const feeStructure = await FeeStructure.findById(
        feeStructureId
    );

    if (!feeStructure) {
        throw notFound("Fee structure not found.");
    }

    if (data.name && data.name !== feeStructure.name) {
        const duplicate = await FeeStructure.findOne({
            _id: { $ne: feeStructure._id },
            academicSession: feeStructure.academicSession,
            academicSemester:
                feeStructure.academicSemester,
            academicClass: feeStructure.academicClass,
            name: new RegExp(
                `^${escapeRegex(data.name)}$`,
                "i"
            ),
        });

        if (duplicate) {
            throw badRequest(
                "A fee structure with this name already exists for the selected class and semester."
            );
        }
    }

    Object.assign(feeStructure, data);

    await feeStructure.save();

    return feeStructure;
};

export const deleteFeeStructureService = async (
    feeStructureId
) => {
    const feeStructure = await FeeStructure.findById(
        feeStructureId
    );

    if (!feeStructure) {
        throw notFound("Fee structure not found.");
    }

    const usedByInvoice = await Invoice.countDocuments({
        "items.feeStructure": feeStructure._id,
    });

    if (usedByInvoice > 0) {
        throw badRequest(
            "This fee structure has been used on invoices. Deactivate it instead of deleting it."
        );
    }

    await feeStructure.deleteOne();

    return feeStructure;
};

// ======================================================
// Invoices
// ======================================================

export const createInvoiceService = async (
    data,
    user
) => {
    const student = await Student.findById(data.student);

    if (!student) {
        throw notFound("Student not found.");
    }

    const academicClass =
        data.academicClass || student.academicClass;

    if (!academicClass) {
        throw badRequest(
            "An academic class is required for the invoice."
        );
    }

    await ensureAcademicContext({
        academicSession: data.academicSession,
        academicSemester: data.academicSemester,
        academicClass,
    });

    const feeStructureIds = data.items
        .map((item) => item.feeStructure)
        .filter(Boolean);

    if (feeStructureIds.length > 0) {
        const feeStructures = await FeeStructure.find({
            _id: { $in: feeStructureIds },
        });

        if (
            feeStructures.length !==
            new Set(feeStructureIds.map(String)).size
        ) {
            throw notFound(
                "One or more fee structures were not found."
            );
        }

        const invalid = feeStructures.find(
            (feeStructure) =>
                feeStructure.academicSession.toString() !==
                    data.academicSession.toString() ||
                feeStructure.academicSemester.toString() !==
                    data.academicSemester.toString() ||
                feeStructure.academicClass.toString() !==
                    academicClass.toString()
        );

        if (invalid) {
            throw badRequest(
                "All linked fee structures must belong to the selected session, semester and class."
            );
        }
    }

    const totalAmount = Number(
        data.items
            .reduce(
                (sum, item) =>
                    sum + Number(item.amount || 0),
                0
            )
            .toFixed(2)
    );

    if (totalAmount <= 0) {
        throw badRequest(
            "Invoice total must be greater than zero."
        );
    }

    const invoiceNumber = await generateSequenceNumber({
        key: "invoice",
        prefix: "INV",
    });

    const dueDate = data.dueDate
        ? new Date(data.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
        invoiceNumber,
        student: student._id,
        academicSession: data.academicSession,
        academicSemester: data.academicSemester,
        academicClass,
        items: data.items,
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
        status:
            dueDate.getTime() < Date.now()
                ? "Overdue"
                : "Unpaid",
        dueDate,
        notes: data.notes || "",
        issuedBy: user._id,
    });

    return await populateInvoice(
        Invoice.findById(invoice._id)
    );
};

export const generateInvoicesService = async (
    data,
    user
) => {
    await ensureAcademicContext(data);

    const feeStructures = await FeeStructure.find({
        academicSession: data.academicSession,
        academicSemester: data.academicSemester,
        academicClass: data.academicClass,
        isActive: true,
    }).sort({ name: 1 });

    if (feeStructures.length === 0) {
        throw badRequest(
            "No active fee structures exist for the selected class and semester."
        );
    }

    let students;

    if (
        Array.isArray(data.studentIds) &&
        data.studentIds.length > 0
    ) {
        students = await Student.find({
            _id: { $in: data.studentIds },
            isActive: true,
        });
    } else {
        students = await Student.find({
            academicClass: data.academicClass,
            isActive: true,
        });
    }

    if (students.length === 0) {
        throw badRequest(
            "No active students were found for the selected class."
        );
    }

    const existingInvoices = await Invoice.find({
        student: {
            $in: students.map((student) => student._id),
        },
        academicSession: data.academicSession,
        academicSemester: data.academicSemester,
        status: { $ne: "Cancelled" },
    }).select("student");

    const existingStudentIds = new Set(
        existingInvoices.map((invoice) =>
            invoice.student.toString()
        )
    );

    const items = feeStructures.map((feeStructure) => ({
        feeStructure: feeStructure._id,
        name: feeStructure.name,
        description: feeStructure.description,
        amount: feeStructure.amount,
    }));

    const totalAmount = Number(
        items
            .reduce(
                (sum, item) =>
                    sum + Number(item.amount || 0),
                0
            )
            .toFixed(2)
    );

    if (totalAmount <= 0) {
        throw badRequest(
            "The total amount for the selected fee structures must be greater than zero."
        );
    }

    const dueDate = data.dueDate
        ? new Date(data.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const createdInvoices = [];
    let skipped = 0;

    for (const student of students) {
        if (existingStudentIds.has(student._id.toString())) {
            skipped += 1;
            continue;
        }

        const invoiceNumber =
            await generateSequenceNumber({
                key: "invoice",
                prefix: "INV",
            });

        const invoice = await Invoice.create({
            invoiceNumber,
            student: student._id,
            academicSession: data.academicSession,
            academicSemester: data.academicSemester,
            academicClass: data.academicClass,
            items,
            totalAmount,
            amountPaid: 0,
            balance: totalAmount,
            status:
                dueDate.getTime() < Date.now()
                    ? "Overdue"
                    : "Unpaid",
            dueDate,
            notes: data.notes || "",
            issuedBy: user._id,
        });

        createdInvoices.push(invoice._id);
    }

    const invoices = await populateInvoice(
        Invoice.find({
            _id: { $in: createdInvoices },
        })
    ).sort({ "student.lastName": 1 });

    return {
        created: invoices.length,
        skipped,
        totalAmount,
        dueDate,
        invoices,
    };
};

export const getInvoicesService = async (
    query,
    user
) => {
    await refreshOverdueInvoices();

    const { page, limit, skip } = getPagination(query);

    const scopedStudent = await getScopedStudentFilter(
        user
    );

    const filter = {};

    applyScopedStudentFilter(
        filter,
        scopedStudent,
        query
    );

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester =
            query.academicSemester;
    }

    if (query.academicClass) {
        filter.academicClass = query.academicClass;
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.from || query.to) {
        filter.dueDate = {};

        if (query.from) {
            filter.dueDate.$gte = new Date(query.from);
        }

        if (query.to) {
            filter.dueDate.$lte = new Date(query.to);
        }
    }

    if (query.search) {
        const regex = new RegExp(
            escapeRegex(query.search),
            "i"
        );

        const matchingStudents = await Student.find({
            $or: [
                { firstName: regex },
                { middleName: regex },
                { lastName: regex },
                { registrationNumber: regex },
            ],
        }).distinct("_id");

        filter.$or = [
            { invoiceNumber: regex },
            { student: { $in: matchingStudents } },
        ];
    }

    const [invoices, total, totals] = await Promise.all([
        populateInvoice(Invoice.find(filter))
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Invoice.countDocuments(filter),
        Invoice.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalBilled: {
                        $sum: "$totalAmount",
                    },
                    totalPaid: {
                        $sum: "$amountPaid",
                    },
                    totalBalance: {
                        $sum: "$balance",
                    },
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);

    return {
        ...paginatedResult(invoices, total, {
            page,
            limit,
        }),
        summary: {
            totalBilled: Number(
                (totals[0]?.totalBilled || 0).toFixed(2)
            ),
            totalPaid: Number(
                (totals[0]?.totalPaid || 0).toFixed(2)
            ),
            totalBalance: Number(
                (totals[0]?.totalBalance || 0).toFixed(2)
            ),
            invoices: totals[0]?.count || 0,
        },
    };
};

export const getInvoiceByIdService = async (
    invoiceId,
    user
) => {
    await refreshOverdueInvoices({ _id: invoiceId });

    const invoice = await populateInvoice(
        Invoice.findById(invoiceId)
    );

    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    await assertInvoiceAccess(user, invoice);

    const payments = await populatePayment(
        Payment.find({ invoice: invoice._id })
    ).sort({ paidAt: -1 });

    return {
        invoice,
        payments,
    };
};

export const updateInvoiceService = async (
    invoiceId,
    data
) => {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    if (invoice.status === "Cancelled") {
        throw badRequest(
            "A cancelled invoice cannot be updated."
        );
    }

    if (data.dueDate !== undefined) {
        invoice.dueDate = data.dueDate
            ? new Date(data.dueDate)
            : null;
    }

    if (data.notes !== undefined) {
        invoice.notes = data.notes;
    }

    invoice.status = calculateInvoiceStatus(invoice);

    await invoice.save();

    return await populateInvoice(
        Invoice.findById(invoice._id)
    );
};

export const cancelInvoiceService = async (
    invoiceId,
    data,
    user
) => {
    await recalculateInvoice(invoiceId);

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    if (invoice.status === "Cancelled") {
        throw badRequest("Invoice is already cancelled.");
    }

    const paymentCount = await Payment.countDocuments({
        invoice: invoice._id,
        status: "Completed",
    });

    if (paymentCount > 0 || Number(invoice.amountPaid) > 0) {
        throw badRequest(
            "An invoice with recorded payments cannot be cancelled. Reverse the payments first."
        );
    }

    invoice.status = "Cancelled";
    invoice.notes = [
        invoice.notes,
        `Cancelled by ${user.fullName || user.username}: ${data.reason}`,
    ]
        .filter(Boolean)
        .join("\n");

    await invoice.save();

    return await populateInvoice(
        Invoice.findById(invoice._id)
    );
};

export const deleteInvoiceService = async (
    invoiceId
) => {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    const paymentCount = await Payment.countDocuments({
        invoice: invoice._id,
    });

    if (paymentCount > 0 || Number(invoice.amountPaid) > 0) {
        throw badRequest(
            "An invoice with payment history cannot be deleted. Cancel it instead."
        );
    }

    await invoice.deleteOne();

    return invoice;
};

export const getInvoicePaymentsService = async (
    invoiceId,
    user
) => {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    await assertInvoiceAccess(user, invoice);

    const payments = await populatePayment(
        Payment.find({ invoice: invoice._id })
    ).sort({ paidAt: -1 });

    return {
        invoice: {
            id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount,
            amountPaid: invoice.amountPaid,
            balance: invoice.balance,
            status: invoice.status,
        },
        payments,
    };
};

// ======================================================
// Student Fee Summary
// Admin / Student (own)
// ======================================================

export const getStudentFeeSummaryService = async (
    studentId,
    query,
    user
) => {
    const student = await assertStudentAccess(
        user,
        studentId
    );

    await refreshOverdueInvoices({
        student: student._id,
    });

    const invoiceFilter = {
        student: student._id,
    };

    if (query.academicSession) {
        invoiceFilter.academicSession =
            query.academicSession;
    }

    if (query.academicSemester) {
        invoiceFilter.academicSemester =
            query.academicSemester;
    }

    const invoices = await populateInvoice(
        Invoice.find(invoiceFilter)
    ).sort({ createdAt: -1 });

    const invoiceIds = invoices.map(
        (invoice) => invoice._id
    );

    const payments = await populatePayment(
        Payment.find({
            student: student._id,
            invoice: { $in: invoiceIds },
        })
    )
        .sort({ paidAt: -1 })
        .limit(50);

    const totalBilled = Number(
        invoices
            .filter(
                (invoice) =>
                    invoice.status !== "Cancelled"
            )
            .reduce(
                (sum, invoice) =>
                    sum + Number(invoice.totalAmount),
                0
            )
            .toFixed(2)
    );

    const totalPaid = Number(
        invoices
            .reduce(
                (sum, invoice) =>
                    sum + Number(invoice.amountPaid),
                0
            )
            .toFixed(2)
    );

    const totalBalance = Number(
        invoices
            .filter(
                (invoice) =>
                    invoice.status !== "Cancelled"
            )
            .reduce(
                (sum, invoice) =>
                    sum + Number(invoice.balance),
                0
            )
            .toFixed(2)
    );

    return {
        student: {
            id: student._id,
            fullName: student.fullName,
            registrationNumber:
                student.registrationNumber,
            academicClass: student.academicClass,
        },
        summary: {
            invoices: invoices.length,
            unpaidInvoices: invoices.filter(
                (invoice) =>
                    invoice.status !== "Paid" &&
                    invoice.status !== "Cancelled"
            ).length,
            totalBilled,
            totalPaid,
            totalBalance,
        },
        invoices,
        payments,
    };
};

// ======================================================
// Payments
// ======================================================

export const createPaymentService = async (
    data,
    user
) => {
    await recalculateInvoice(data.invoice);

    const invoice = await Invoice.findById(data.invoice);

    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    if (invoice.status === "Cancelled") {
        throw badRequest(
            "Payments cannot be recorded against a cancelled invoice."
        );
    }

    if (Number(invoice.balance) <= 0) {
        throw badRequest(
            "This invoice has already been fully paid."
        );
    }

    const amount = Number(data.amount);

    if (
        amount >
        Number(invoice.balance) + 0.001
    ) {
        throw badRequest(
            `Payment amount exceeds the outstanding balance of ${invoice.balance}.`
        );
    }

    const receiptNumber =
        await generateSequenceNumber({
            key: "receipt",
            prefix: "RCPT",
        });

    const payment = await Payment.create({
        receiptNumber,
        invoice: invoice._id,
        student: invoice.student,
        amount,
        method: data.method,
        reference: data.reference || "",
        paidAt: data.paidAt
            ? new Date(data.paidAt)
            : new Date(),
        notes: data.notes || "",
        recordedBy: user._id,
    });

    const updatedInvoice = await recalculateInvoice(
        invoice._id
    );

    try {
        await createStudentAudienceNotifications({
            studentIds: [invoice.student],
            title: "Payment received",
            message: `A payment of ${amount} was received for invoice ${invoice.invoiceNumber}. Receipt: ${receiptNumber}.`,
            type: "fee",
            referenceId: payment._id,
            createdBy: user._id,
        });
    } catch (error) {
        // Notifications must not block payment recording.
    }

    return {
        payment: await populatePayment(
            Payment.findById(payment._id)
        ),
        invoice: await populateInvoice(
            Invoice.findById(updatedInvoice._id)
        ),
    };
};

export const getPaymentsService = async (
    query,
    user
) => {
    const { page, limit, skip } = getPagination(query);

    const scopedStudent = await getScopedStudentFilter(
        user
    );

    const filter = {};

    applyScopedStudentFilter(
        filter,
        scopedStudent,
        query
    );

    if (query.invoice) {
        filter.invoice = query.invoice;
    }

    if (query.method) {
        filter.method = query.method;
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.from || query.to) {
        filter.paidAt = {};

        if (query.from) {
            filter.paidAt.$gte = new Date(query.from);
        }

        if (query.to) {
            filter.paidAt.$lte = new Date(query.to);
        }
    }

    if (query.search) {
        const regex = new RegExp(
            escapeRegex(query.search),
            "i"
        );

        const matchingStudents = await Student.find({
            $or: [
                { firstName: regex },
                { middleName: regex },
                { lastName: regex },
                { registrationNumber: regex },
            ],
        }).distinct("_id");

        filter.$or = [
            { receiptNumber: regex },
            { reference: regex },
            { student: { $in: matchingStudents } },
        ];
    }

    const [payments, total, totals] = await Promise.all([
        populatePayment(Payment.find(filter))
            .sort({ paidAt: -1 })
            .skip(skip)
            .limit(limit),
        Payment.countDocuments(filter),
        Payment.aggregate([
            {
                $match: {
                    ...filter,
                    status: "Completed",
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);

    return {
        ...paginatedResult(payments, total, {
            page,
            limit,
        }),
        summary: {
            totalCollected: Number(
                (totals[0]?.total || 0).toFixed(2)
            ),
            completedPayments: totals[0]?.count || 0,
        },
    };
};

export const getPaymentByIdService = async (
    paymentId,
    user
) => {
    const payment = await populatePayment(
        Payment.findById(paymentId)
    );

    if (!payment) {
        throw notFound("Payment not found.");
    }

    await assertPaymentAccess(user, payment);

    return payment;
};

export const reversePaymentService = async (
    paymentId,
    data,
    user
) => {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
        throw notFound("Payment not found.");
    }

    if (payment.status === "Reversed") {
        throw badRequest("Payment has already been reversed.");
    }

    payment.status = "Reversed";
    payment.reversedBy = user._id;
    payment.reversedAt = new Date();
    payment.reversalReason = data.reason;

    await payment.save();

    const invoice = await recalculateInvoice(
        payment.invoice
    );

    try {
        await createStudentAudienceNotifications({
            studentIds: [payment.student],
            title: "Payment reversed",
            message: `Payment ${payment.receiptNumber} for invoice ${invoice.invoiceNumber} has been reversed. Reason: ${data.reason}.`,
            type: "fee",
            referenceId: payment._id,
            createdBy: user._id,
        });
    } catch (error) {
        // Notifications must not block payment reversal.
    }

    return {
        payment: await populatePayment(
            Payment.findById(payment._id)
        ),
        invoice,
    };
};

// ======================================================
// Finance Reports
// ======================================================

export const getFinanceSummaryService = async (
    query
) => {
    await refreshOverdueInvoices();

    const invoiceFilter = {};

    if (query.academicSession) {
        invoiceFilter.academicSession =
            query.academicSession;
    }

    if (query.academicSemester) {
        invoiceFilter.academicSemester =
            query.academicSemester;
    }

    if (query.academicClass) {
        invoiceFilter.academicClass =
            query.academicClass;
    }

    const paymentFilter = {
        status: "Completed",
    };

    if (query.from || query.to) {
        paymentFilter.paidAt = {};

        if (query.from) {
            paymentFilter.paidAt.$gte = new Date(
                query.from
            );
        }

        if (query.to) {
            paymentFilter.paidAt.$lte = new Date(
                query.to
            );
        }
    }

    if (Object.keys(invoiceFilter).length > 0) {
        const invoiceIds = await Invoice.find(
            invoiceFilter
        ).distinct("_id");

        paymentFilter.invoice = { $in: invoiceIds };
    }

    const [
        invoiceTotals,
        statusCounts,
        paymentTotals,
        methods,
    ] = await Promise.all([
        Invoice.aggregate([
            {
                $match: {
                    ...invoiceFilter,
                    status: { $ne: "Cancelled" },
                },
            },
            {
                $group: {
                    _id: null,
                    totalBilled: {
                        $sum: "$totalAmount",
                    },
                    totalOutstanding: {
                        $sum: "$balance",
                    },
                    totalPaid: {
                        $sum: "$amountPaid",
                    },
                    invoices: { $sum: 1 },
                },
            },
        ]),
        Invoice.aggregate([
            { $match: invoiceFilter },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]),
        Payment.aggregate([
            { $match: paymentFilter },
            {
                $group: {
                    _id: null,
                    totalCollected: {
                        $sum: "$amount",
                    },
                    payments: { $sum: 1 },
                },
            },
        ]),
        Payment.aggregate([
            { $match: paymentFilter },
            {
                $group: {
                    _id: "$method",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
        ]),
    ]);

    const totalBilled = Number(
        (invoiceTotals[0]?.totalBilled || 0).toFixed(2)
    );
    const totalCollected = Number(
        (paymentTotals[0]?.totalCollected || 0).toFixed(
            2
        )
    );

    const byStatus = {
        Unpaid: 0,
        "Partially Paid": 0,
        Paid: 0,
        Overdue: 0,
        Cancelled: 0,
    };

    statusCounts.forEach((row) => {
        byStatus[row._id] = row.count;
    });

    return {
        invoices: {
            count: invoiceTotals[0]?.invoices || 0,
            totalBilled,
            totalPaid: Number(
                (invoiceTotals[0]?.totalPaid || 0).toFixed(
                    2
                )
            ),
            totalOutstanding: Number(
                (
                    invoiceTotals[0]?.totalOutstanding || 0
                ).toFixed(2)
            ),
            byStatus,
        },
        payments: {
            count: paymentTotals[0]?.payments || 0,
            totalCollected,
            byMethod: methods.map((row) => ({
                method: row._id,
                total: Number(row.total.toFixed(2)),
                count: row.count,
            })),
        },
        collectionRate:
            totalBilled > 0
                ? Number(
                      (
                          (totalCollected / totalBilled) *
                          100
                      ).toFixed(2)
                  )
                : 0,
    };
};

export const getCollectionsService = async (
    query
) => {
    const groupBy = query.groupBy || "day";

    const match = {
        status: "Completed",
    };

    if (query.from || query.to) {
        match.paidAt = {};

        if (query.from) {
            match.paidAt.$gte = new Date(query.from);
        }

        if (query.to) {
            match.paidAt.$lte = new Date(query.to);
        }
    }

    let groupId;

    if (groupBy === "method") {
        groupId = "$method";
    } else if (groupBy === "month") {
        groupId = {
            $dateToString: {
                format: "%Y-%m",
                date: "$paidAt",
            },
        };
    } else {
        groupId = {
            $dateToString: {
                format: "%Y-%m-%d",
                date: "$paidAt",
            },
        };
    }

    const [rows, totals] = await Promise.all([
        Payment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: groupId,
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Payment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);

    return {
        groupBy,
        total: Number(
            (totals[0]?.total || 0).toFixed(2)
        ),
        payments: totals[0]?.count || 0,
        collections: rows.map((row) => ({
            label: row._id,
            total: Number(row.total.toFixed(2)),
            count: row.count,
        })),
    };
};

export const getOutstandingInvoicesService = async (
    query
) => {
    await refreshOverdueInvoices();

    const { page, limit, skip } = getPagination(query);

    const filter = {
        balance: { $gt: 0 },
        status: { $ne: "Cancelled" },
    };

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester =
            query.academicSemester;
    }

    if (query.academicClass) {
        filter.academicClass = query.academicClass;
    }

    const [invoices, total, totals] = await Promise.all([
        populateInvoice(Invoice.find(filter))
            .sort({ balance: -1, dueDate: 1 })
            .skip(skip)
            .limit(limit),
        Invoice.countDocuments(filter),
        Invoice.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalOutstanding: {
                        $sum: "$balance",
                    },
                },
            },
        ]),
    ]);

    return {
        ...paginatedResult(invoices, total, {
            page,
            limit,
        }),
        summary: {
            totalOutstanding: Number(
                (
                    totals[0]?.totalOutstanding || 0
                ).toFixed(2)
            ),
        },
    };
};
