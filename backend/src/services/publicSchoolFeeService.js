import Invoice from "../models/Invoice.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import AcademicSession from "../models/AcademicSession.js";
import AcademicSemester from "../models/AcademicSemester.js";
import AdmissionApplication from "../models/AdmissionApplication.js";
import Payment from "../models/Payment.js";

import { badRequest, forbidden, notFound } from "../utils/AppError.js";
import { ADMIN_ROLES } from "../utils/roles.js";
import { generateSequenceNumber } from "../utils/sequence.js";
import { phoneMatchesApplication } from "./admissionApplicationService.js";
import {
    getSchoolFeeAmount,
} from "./financeService.js";
import {
    fetchPaystackSuccessfulTransaction,
    getInvoiceFromSchoolFeeTransaction,
    initializeInvoicePaystackPayment,
    publicFeeCallbackUrlForPayment,
    recordVerifiedFeePayment,
} from "./schoolFeePaymentService.js";
import {
    resolveAcademicClassForLevel,
} from "./studentRegistrationService.js";

// ======================================================
// Helpers
// ======================================================

const populateInvoice = (query) =>
    query
        .populate(
            "student",
            "firstName middleName lastName registrationNumber applicationNumber academicClass email parentEmail user"
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

const refreshStudentOverdueInvoices = async (studentId) => {
    await Invoice.updateMany(
        {
            student: studentId,
            status: { $nin: ["Paid", "Cancelled"] },
            balance: { $gt: 0 },
            dueDate: { $ne: null, $lt: new Date() },
        },
        {
            status: "Overdue",
        }
    );
};

const getStudentInvoiceList = async (studentId) =>
    populateInvoice(
        Invoice.find({
            student: studentId,
        })
    ).sort({ createdAt: -1 });

const resolveIssuerForInlineInvoice = async (student) => {
    const application = await AdmissionApplication.findById(
        student.admissionApplication
    )
        .select("paymentConfirmedBy")
        .lean();

    if (application?.paymentConfirmedBy) {
        return application.paymentConfirmedBy;
    }

    const admin = await User.findOne({
        role: { $in: ADMIN_ROLES },
        isActive: true,
    })
        .select("_id")
        .lean();

    if (admin?._id) {
        return admin._id;
    }

    return student.user || null;
};

// ======================================================
// Public school fee student resolution
// ======================================================

export const resolvePublicSchoolFeeStudentService = async ({
    applicationNumber,
    phone,
}) => {
    const normalizedApplicationNumber = String(applicationNumber ?? "").trim();

    if (!normalizedApplicationNumber || !String(phone ?? "").trim()) {
        throw notFound(
            "Student not found or phone number does not match."
        );
    }

    const student = await Student.findOne({
        applicationNumber: normalizedApplicationNumber,
    })
        .populate("academicClass", "name academicLevel")
        .populate("admissionApplication", "paymentConfirmedBy");

    if (
        !student ||
        !phoneMatchesApplication(student, phone) ||
        !student.isActive ||
        student.paymentStatus !== "Paid"
    ) {
        throw notFound(
            "Student not found or phone number does not match."
        );
    }

    return student;
};

// ======================================================
// Auto-create school fee invoice for current session
// ======================================================

export const ensureSchoolFeeInvoiceForStudentService = async (student) => {
    const session = await AcademicSession.findOne({
        isCurrent: true,
        isActive: true,
    });

    if (!session) {
        throw badRequest(
            "The school fee invoice cannot be generated automatically because the current academic session is not configured. Contact the school office."
        );
    }

    const semester = await AcademicSemester.findOne({
        academicSession: session._id,
        isCurrent: true,
        isActive: true,
    });

    if (!semester) {
        throw badRequest(
            "The school fee invoice cannot be generated automatically because the current academic semester is not configured. Contact the school office."
        );
    }

    const existingInvoice = await populateInvoice(
        Invoice.findOne({
            student: student._id,
            academicSession: session._id,
            academicSemester: semester._id,
            status: { $ne: "Cancelled" },
        }).sort({ createdAt: -1 })
    );

    if (existingInvoice) {
        return existingInvoice;
    }

    const feeAmount = Number(await getSchoolFeeAmount());

    if (!(feeAmount > 0)) {
        throw badRequest(
            "The school fee amount has not been configured yet. Contact the school office."
        );
    }

    let academicClass = student.academicClass || null;

    if (
        !academicClass ||
        typeof academicClass !== "object" ||
        !academicClass._id
    ) {
        const resolvedClass = await resolveAcademicClassForLevel(
            student.currentLevel
        );
        academicClass = resolvedClass;
    }

    if (!academicClass) {
        throw badRequest(
            "Your academic class has not been assigned yet. Contact the school office."
        );
    }

    const issuer = await resolveIssuerForInlineInvoice(student);

    if (!issuer) {
        throw badRequest(
            "The school fee invoice cannot be generated automatically. Contact the school office."
        );
    }

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const invoiceNumber = await generateSequenceNumber({
        key: "invoice",
        prefix: "INV",
    });

    const createdInvoice = await Invoice.create({
        invoiceNumber,
        student: student._id,
        academicSession: session._id,
        academicSemester: semester._id,
        academicClass: academicClass._id || academicClass,
        items: [
            {
                name: "School Fee",
                description: "School fee for the current academic semester.",
                amount: feeAmount,
            },
        ],
        totalAmount: feeAmount,
        amountPaid: 0,
        balance: feeAmount,
        status: dueDate.getTime() < Date.now() ? "Overdue" : "Unpaid",
        dueDate,
        notes: "Automatically generated from the configured school fee.",
        issuedBy: issuer,
    });

    return populateInvoice(Invoice.findById(createdInvoice._id));
};

// ======================================================
// Public school fee invoice selection
// ======================================================

export const getPublicPayableInvoiceService = async ({
    student,
    invoiceId,
}) => {
    await ensureSchoolFeeInvoiceForStudentService(student);

    if (invoiceId) {
        const invoice = await populateInvoice(
            Invoice.findById(invoiceId)
        );

        if (!invoice) {
            throw notFound("Invoice not found.");
        }

        if (invoice.student._id.toString() !== student._id.toString()) {
            throw forbidden(
                "The requested invoice does not belong to this student."
            );
        }

        if (invoice.status === "Cancelled") {
            throw badRequest(
                "Payments cannot be made against a cancelled invoice."
            );
        }

        if (Number(invoice.balance) <= 0) {
            throw badRequest("This invoice has already been fully paid.");
        }

        return invoice;
    }

    const payableInvoices = await populateInvoice(
        Invoice.find({
            student: student._id,
            status: { $ne: "Cancelled" },
            balance: { $gt: 0 },
        }).sort({ dueDate: 1, createdAt: 1 })
    );

    const invoice = payableInvoices[0];

    if (!invoice) {
        throw badRequest("There is no outstanding school fee invoice.");
    }

    return invoice;
};

// ======================================================
// Public school fee summary
// ======================================================

const buildPublicStudentReference = (student) => ({
    id: student._id,
    fullName: student.fullName,
    firstName: student.firstName,
    middleName: student.middleName,
    lastName: student.lastName,
    applicationNumber: student.applicationNumber,
    registrationNumber: student.registrationNumber,
    currentLevel: student.currentLevel,
    academicClass: student.academicClass || null,
});

export const getPublicSchoolFeeSummaryService = async (student) => {
    await refreshStudentOverdueInvoices(student._id);

    const invoices = await getStudentInvoiceList(student._id);

    const activeInvoices = invoices.filter(
        (invoice) => invoice.status !== "Cancelled"
    );

    const totalBilled = Number(
        activeInvoices
            .reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0)
            .toFixed(2)
    );

    const totalPaid = Number(
        activeInvoices
            .reduce((sum, invoice) => sum + Number(invoice.amountPaid), 0)
            .toFixed(2)
    );

    const totalBalance = Number(
        activeInvoices
            .reduce((sum, invoice) => sum + Number(invoice.balance), 0)
            .toFixed(2)
    );

    return {
        student: buildPublicStudentReference(student),
        summary: {
            invoices: activeInvoices.length,
            unpaidInvoices: activeInvoices.filter(
                (invoice) => invoice.status !== "Paid"
            ).length,
            hasInvoices: activeInvoices.length > 0,
            totalBilled,
            totalPaid,
            totalBalance,
            expectedFee: await getSchoolFeeAmount(),
        },
        invoices,
    };
};

export const lookupPublicSchoolFeeSummaryService = async ({
    applicationNumber,
    phone,
}) => {
    const student = await resolvePublicSchoolFeeStudentService({
        applicationNumber,
        phone,
    });

    const invoice = await ensureSchoolFeeInvoiceForStudentService(student);

    if (!invoice) {
        throw badRequest(
            "School fee invoice is not available yet. Contact the school office."
        );
    }

    return getPublicSchoolFeeSummaryService(student);
};

// ======================================================
// Public Paystack initialize / verify
// ======================================================

export const initializePublicSchoolFeePaymentService = async ({
    applicationNumber,
    phone,
    invoiceId,
    email,
}) => {
    const student = await resolvePublicSchoolFeeStudentService({
        applicationNumber,
        phone,
    });

    const invoice = await getPublicPayableInvoiceService({
        student,
        invoiceId,
    });

    return initializeInvoicePaystackPayment({
        invoice,
        email,
        fallbackEmail: student.email || student.parentEmail,
        callbackUrlOverride: publicFeeCallbackUrlForPayment(),
    });
};

export const verifyPublicSchoolFeePaymentService = async ({
    applicationNumber,
    phone,
    reference,
}) => {
    const student = await resolvePublicSchoolFeeStudentService({
        applicationNumber,
        phone,
    });

    const transaction = await fetchPaystackSuccessfulTransaction(reference);

    const invoice = await getInvoiceFromSchoolFeeTransaction(transaction);
    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    if (invoice.student._id.toString() !== student._id.toString()) {
        throw forbidden(
            "This payment does not belong to the specified student."
        );
    }

    const existingPayment = await Payment.findOne({
        reference: transaction.reference,
        status: "Completed",
    });

    if (existingPayment) {
        const paidInvoice = await populateInvoice(
            Invoice.findById(invoice._id)
        );
        return { invoice: paidInvoice, payment: existingPayment };
    }

    const result = await recordVerifiedFeePayment({ invoice, transaction });

    return {
        invoice: await populateInvoice(Invoice.findById(result.invoice._id)),
        payment: result.payment,
    };
};

// ======================================================
// Student portal access gate
// ======================================================

export const assertStudentSchoolFeePortalAccessService = async (studentId) => {
    const unpaidInvoice = await Invoice.exists({
        student: studentId,
        status: { $ne: "Cancelled" },
        balance: { $gt: 0 },
    });

    if (unpaidInvoice) {
        throw forbidden(
            "Your portal is locked until your school fee is paid. Contact the school office."
        );
    }

    const session = await AcademicSession.findOne({
        isCurrent: true,
        isActive: true,
    });

    if (!session) {
        return;
    }

    const currentInvoices = await Invoice.find({
        student: studentId,
        academicSession: session._id,
        status: { $ne: "Cancelled" },
    }).select("balance");

    if (currentInvoices.some((invoice) => Number(invoice.balance) > 0)) {
        throw forbidden(
            "Your portal is locked until your school fee is paid. Use your application number to pay at /school-fee-payment."
        );
    }

    if (currentInvoices.length === 0) {
        const expectedFee = Number(await getSchoolFeeAmount());

        if (expectedFee > 0) {
            throw forbidden(
                "Your portal is locked until your school fee is paid. Use your application number to pay at /school-fee-payment."
            );
        }
    }
};
