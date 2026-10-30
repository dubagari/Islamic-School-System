import bcrypt from "bcryptjs";

import Attendance from "../models/Attendance.js";
import AcademicSemester from "../models/AcademicSemester.js";
import Invoice from "../models/Invoice.js";
import Parent from "../models/Parent.js";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import StudentRecord from "../models/StudentRecord.js";
import User from "../models/User.js";
import {
    assertStudentAccess,
    getParentForUser,
} from "./accessControlService.js";
import {
    getInvoicesService,
    getPaymentsService,
    getStudentFeeSummaryService,
} from "./financeService.js";
import { getStudentAttendanceService } from "./attendanceService.js";
import { getStudentResultsService } from "./resultService.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import { escapeRegex } from "../utils/search.js";
import {
    badRequest,
    notFound,
} from "../utils/AppError.js";

// ======================================================
// Helpers
// ======================================================

const populateParent = (query) =>
    query
        .populate(
            "user",
            "fullName username email role isActive mustChangePassword lastLogin"
        )
        .populate({
            path: "students",
            select:
                "firstName middleName lastName registrationNumber academicClass status isActive parentName parentPhone parentEmail",
            populate: {
                path: "academicClass",
                select: "name academicLevel",
            },
        });

const validateStudents = async (studentIds) => {
    const uniqueIds = [
        ...new Set(studentIds.map((id) => id.toString())),
    ];

    const students = await Student.find({
        _id: { $in: uniqueIds },
        isActive: true,
    }).select("_id");

    if (students.length !== uniqueIds.length) {
        throw notFound(
            "One or more students were not found or are inactive."
        );
    }

    return uniqueIds;
};

const attendanceSummaryForStudent = async (
    studentId,
    academicSemester
) => {
    const filter = {
        student: studentId,
    };

    if (academicSemester) {
        filter.academicSemester = academicSemester;
    }

    const rows = await Attendance.aggregate([
        { $match: filter },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    const summary = {
        Present: 0,
        Absent: 0,
        Late: 0,
        Excused: 0,
        total: 0,
        attendanceRate: 0,
    };

    rows.forEach((row) => {
        summary[row._id] = row.count;
        summary.total += row.count;
    });

    if (summary.total > 0) {
        summary.attendanceRate = Number(
            (
                ((summary.Present + summary.Late) /
                    summary.total) *
                100
            ).toFixed(2)
        );
    }

    return summary;
};

const feeSummaryForStudent = async (studentId) => {
    const invoices = await Invoice.find({
        student: studentId,
        status: { $ne: "Cancelled" },
    }).select("totalAmount amountPaid balance status");

    return {
        invoices: invoices.length,
        totalBilled: Number(
            invoices
                .reduce(
                    (sum, invoice) =>
                        sum + Number(invoice.totalAmount),
                    0
                )
                .toFixed(2)
        ),
        totalPaid: Number(
            invoices
                .reduce(
                    (sum, invoice) =>
                        sum + Number(invoice.amountPaid),
                    0
                )
                .toFixed(2)
        ),
        totalBalance: Number(
            invoices
                .reduce(
                    (sum, invoice) =>
                        sum + Number(invoice.balance),
                    0
                )
                .toFixed(2)
        ),
    };
};

const resultSummaryForStudent = async (studentId) => {
    const results = await Result.find({
        student: studentId,
        isPublished: true,
    }).select("totalScore letterGrade gradePoint");

    if (results.length === 0) {
        return {
            subjects: 0,
            averageScore: 0,
            gpa: 0,
            grades: {},
        };
    }

    const grades = {};

    results.forEach((result) => {
        grades[result.letterGrade] =
            (grades[result.letterGrade] || 0) + 1;
    });

    return {
        subjects: results.length,
        averageScore: Number(
            (
                results.reduce(
                    (sum, result) =>
                        sum + Number(result.totalScore),
                    0
                ) / results.length
            ).toFixed(2)
        ),
        gpa: Number(
            (
                results.reduce(
                    (sum, result) =>
                        sum + Number(result.gradePoint),
                    0
                ) / results.length
            ).toFixed(2)
        ),
        grades,
    };
};

// ======================================================
// Create Parent Account
// Admin
// ======================================================

export const createParentService = async (data) => {
    const studentIds = await validateStudents(
        data.studentIds
    );

    const existingUser = await User.findOne({
        $or: [
            { username: data.username },
            ...(data.email
                ? [{ email: data.email.toLowerCase() }]
                : []),
        ],
    });

    if (existingUser) {
        throw badRequest(
            "A user with this username or email already exists."
        );
    }

    const hashedPassword = await bcrypt.hash(
        data.password,
        10
    );

    let user;

    try {
        user = await User.create({
            fullName: data.fullName,
            username: data.username,
            email: data.email
                ? data.email.toLowerCase()
                : undefined,
            password: hashedPassword,
            role: "parent",
            mustChangePassword: true,
            isActive: true,
        });

        const parent = await Parent.create({
            user: user._id,
            phone: data.phone || "",
            alternatePhone: data.alternatePhone || "",
            address: data.address || "",
            occupation: data.occupation || "",
            students: studentIds,
            isActive: true,
        });

        user.parent = parent._id;
        await user.save();

        return await populateParent(
            Parent.findById(parent._id)
        );
    } catch (error) {
        if (user?._id) {
            await User.findByIdAndDelete(user._id);
        }

        throw error;
    }
};

// ======================================================
// List Parents
// Admin
// ======================================================

export const getParentsService = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === "true";
    }

    if (query.search) {
        const regex = new RegExp(
            escapeRegex(query.search),
            "i"
        );

        const userIds = await User.find({
            role: "parent",
            $or: [
                { fullName: regex },
                { username: regex },
                { email: regex },
            ],
        }).distinct("_id");

        filter.user = { $in: userIds };
    }

    const [parents, total] = await Promise.all([
        populateParent(Parent.find(filter))
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Parent.countDocuments(filter),
    ]);

    return paginatedResult(parents, total, {
        page,
        limit,
    });
};

// ======================================================
// Get Parent By ID
// Admin
// ======================================================

export const getParentByIdService = async (
    parentId
) => {
    const parent = await populateParent(
        Parent.findById(parentId)
    );

    if (!parent) {
        throw notFound("Parent not found.");
    }

    return parent;
};

// ======================================================
// Update Parent
// Admin
// ======================================================

export const updateParentService = async (
    parentId,
    data
) => {
    const parent = await Parent.findById(parentId);

    if (!parent) {
        throw notFound("Parent not found.");
    }

    const user = await User.findById(parent.user);

    if (!user) {
        throw notFound(
            "The user account linked to this parent was not found."
        );
    }

    if (
        data.email &&
        data.email.toLowerCase() !== user.email
    ) {
        const duplicate = await User.findOne({
            _id: { $ne: user._id },
            email: data.email.toLowerCase(),
        });

        if (duplicate) {
            throw badRequest(
                "A user with this email already exists."
            );
        }
    }

    if (data.fullName !== undefined) {
        user.fullName = data.fullName;
    }

    if (data.email !== undefined) {
        user.email = data.email
            ? data.email.toLowerCase()
            : undefined;
    }

    if (data.isActive !== undefined) {
        user.isActive = data.isActive;
        parent.isActive = data.isActive;
    }

    if (data.phone !== undefined) {
        parent.phone = data.phone;
    }

    if (data.alternatePhone !== undefined) {
        parent.alternatePhone = data.alternatePhone;
    }

    if (data.address !== undefined) {
        parent.address = data.address;
    }

    if (data.occupation !== undefined) {
        parent.occupation = data.occupation;
    }

    if (data.studentIds !== undefined) {
        parent.students = await validateStudents(
            data.studentIds
        );
    }

    await Promise.all([user.save(), parent.save()]);

    return await populateParent(
        Parent.findById(parent._id)
    );
};

// ======================================================
// Deactivate Parent
// Admin
// ======================================================

export const deactivateParentService = async (
    parentId
) => {
    const parent = await Parent.findById(parentId);

    if (!parent) {
        throw notFound("Parent not found.");
    }

    parent.isActive = false;

    await parent.save();

    await User.findByIdAndUpdate(parent.user, {
        isActive: false,
    });

    return await populateParent(
        Parent.findById(parent._id)
    );
};

// ======================================================
// Link / Unlink Students
// Admin
// ======================================================

export const linkStudentsToParentService = async (
    parentId,
    studentIds
) => {
    const parent = await Parent.findById(parentId);

    if (!parent) {
        throw notFound("Parent not found.");
    }

    const validStudentIds = await validateStudents(
        studentIds
    );

    const existing = new Set(
        parent.students.map((id) => id.toString())
    );

    validStudentIds.forEach((studentId) => {
        if (!existing.has(studentId)) {
            parent.students.push(studentId);
        }
    });

    await parent.save();

    return await populateParent(
        Parent.findById(parent._id)
    );
};

export const unlinkStudentFromParentService = async (
    parentId,
    studentId
) => {
    const parent = await Parent.findById(parentId);

    if (!parent) {
        throw notFound("Parent not found.");
    }

    parent.students = parent.students.filter(
        (childId) =>
            childId.toString() !== studentId.toString()
    );

    await parent.save();

    return await populateParent(
        Parent.findById(parent._id)
    );
};

// ======================================================
// Parent Portal: Profile / Children
// Parent
// ======================================================

export const getParentProfileService = async (user) => {
    const parentProfile = await getParentForUser(
        user._id
    );

    return await populateParent(
        Parent.findById(parentProfile._id)
    );
};

export const getParentChildrenService = async (user) => {
    const parent = await getParentProfileService(user);

    return parent.students;
};

// ======================================================
// Parent Portal: Dashboard
// Parent
// ======================================================

export const getParentDashboardService = async (user) => {
    const parent = await getParentProfileService(user);

    const currentSemester = await AcademicSemester.findOne({
        isCurrent: true,
        isActive: true,
    });

    const children = await Promise.all(
        parent.students.map(async (child) => {
            const [
                attendance,
                fees,
                results,
            ] = await Promise.all([
                attendanceSummaryForStudent(
                    child._id,
                    currentSemester?._id
                ),
                feeSummaryForStudent(child._id),
                resultSummaryForStudent(child._id),
            ]);

            return {
                student: child,
                attendance,
                fees,
                results,
            };
        })
    );

    return {
        parent: {
            id: parent._id,
            fullName: parent.user.fullName,
            username: parent.user.username,
            email: parent.user.email,
            phone: parent.phone,
        },
        children,
        summary: {
            children: children.length,
            totalOutstanding: Number(
                children
                    .reduce(
                        (sum, child) =>
                            sum +
                            Number(
                                child.fees.totalBalance
                            ),
                        0
                    )
                    .toFixed(2)
            ),
        },
    };
};

// ======================================================
// Parent Portal: Child Overview
// Parent
// ======================================================

export const getParentChildOverviewService = async (
    user,
    studentId
) => {
    const student = await assertStudentAccess(
        user,
        studentId
    );

    const [attendance, results, fees, records] =
        await Promise.all([
            getStudentAttendanceService(
                studentId,
                { limit: 5 },
                user
            ),
            getStudentResultsService(
                studentId,
                { limit: 10 },
                user
            ),
            getStudentFeeSummaryService(
                studentId,
                {},
                user
            ),
            StudentRecord.find({
                student: studentId,
            })
                .populate("academicSession", "name")
                .populate("academicSemester", "name")
                .populate("academicClass", "name")
                .sort({ createdAt: -1 })
                .limit(5),
        ]);

    return {
        student: {
            id: student._id,
            fullName: student.fullName,
            registrationNumber:
                student.registrationNumber,
            academicClass: student.academicClass,
            status: student.status,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
        },
        attendance: {
            summary: attendance.summary,
            recent: attendance.data,
        },
        results: {
            summary: results.summary,
            recent: results.data,
        },
        fees: {
            summary: fees.summary,
            invoices: fees.invoices.slice(0, 5),
            payments: fees.payments.slice(0, 5),
        },
        records,
    };
};

// ======================================================
// Parent Portal: Child Invoices / Payments
// Parent
// ======================================================

export const getParentChildInvoicesService = async (
    user,
    studentId,
    query
) => {
    await assertStudentAccess(user, studentId);

    return await getInvoicesService(
        {
            ...query,
            student: studentId,
        },
        user
    );
};

export const getParentChildPaymentsService = async (
    user,
    studentId,
    query
) => {
    await assertStudentAccess(user, studentId);

    return await getPaymentsService(
        {
            ...query,
            student: studentId,
        },
        user
    );
};
