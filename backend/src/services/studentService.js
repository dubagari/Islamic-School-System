
import Student from "../models/Student.js";
import User from "../models/User.js";

import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import { buildSearchFilter } from "../utils/search.js";


// ======================================================
// Get All Students
// Admin
// ======================================================

export const getAllStudentsService = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {
        ...buildSearchFilter(query.search, [
            "registrationNumber",
            "applicationNumber",
            "firstName",
            "middleName",
            "lastName",
            "phone",
            "parentName",
            "parentPhone",
        ]),
    };

    if (query.status) {
        filter.status = query.status;
    }

    if (query.isActive !== undefined) {
        filter.isActive =
            query.isActive === true || query.isActive === "true";
    }

    if (query.academicClass) {
        filter.academicClass = query.academicClass;
    }

    if (query.paymentStatus) {
        filter.paymentStatus = query.paymentStatus;
    }

    const [students, total] = await Promise.all([
        Student.find(filter)
            .populate("user", "-password")
            .populate("academicClass")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Student.countDocuments(filter),
    ]);

    return paginatedResult(students, total, { page, limit });
};

// ======================================================
// Get Student By ID
// Admin
// ======================================================

export const getStudentByIdService = async (
    studentId
) => {
    const student =
        await Student.findById(studentId)
            .populate(
                "user",
                "-password"
            )
            .populate(
                "academicClass"
            );

    if (!student) {
        throw new Error(
            "Student not found."
        );
    }

    return student;
};

// ======================================================
// Get Own Student Profile
// Student
// ======================================================



export const getStudentProfileService = async (
    userId
) => {
    const user =
        await User.findById(userId);

    if (!user) {
        throw new Error(
            "User account not found."
        );
    }

    if (user.role !== "student") {
        throw new Error(
            "This account is not a student account."
        );
    }

    if (!user.student) {
        throw new Error(
            "Student profile is not linked to this account."
        );
    }

    const student =
        await Student.findById(
            user.student
        )
            .populate(
                "user",
                "-password"
            )
            .populate(
                "academicClass"
            );

    if (!student) {
        throw new Error(
            "Student profile not found."
        );
    }

    return student;
};


// ======================================================
// Get Student Dashboard
// Student
// ======================================================

export const getStudentDashboardService = async (    userId) => {

    // --------------------------------------------------
    // 1. Find logged-in user
    // --------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
                throw new Error("User account not found.");
    }

    // --------------------------------------------------
    // 2. Make sure this is a student
    // --------------------------------------------------

    if (user.role !== "student") {
        throw new Error(
            "This account is not a student account."
        );
    }

    // --------------------------------------------------
    // 3. Make sure student is linked
    // --------------------------------------------------

    if (!user.student) {
        throw new Error(
            "Student profile is not linked to this account."
        );
    }

    // --------------------------------------------------
    // 4. Get student
    // --------------------------------------------------

    const student =
        await Student.findById(user.student)
            .populate(
                "academicClass"
            );

    if (!student) {
        throw new Error(
            "Student profile not found."
        );
    }

    // --------------------------------------------------
    // 5. Return dashboard summary
    // --------------------------------------------------

    return {
        student: {
            id: student._id,
            fullName: student.fullName,
            registrationNumber:
                student.registrationNumber,
            applicationNumber:
                student.applicationNumber,
            currentLevel:
                student.currentLevel,
            academicClass:
                student.academicClass,
            status:
                student.status,
            paymentStatus:
                student.paymentStatus,
            isActive:
                student.isActive,
        },

        account: {
            username:
                user.username,
            email:
                user.email,
            role:
                user.role,
            mustChangePassword:
                user.mustChangePassword,
        },
    };
};

