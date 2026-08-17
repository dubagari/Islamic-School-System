
import Student from "../models/Student.js";
import User from "../models/User.js";

import bcrypt from "bcryptjs";


// ======================================================
// Get All Students
// Admin
// ======================================================

export const getAllStudentsService = async () => {
    const students = await Student.find()
        .populate(
            "user",
            "-password"
        )
        .populate(
            "academicClass"
        )
        .sort({
            createdAt: -1,
        });

    return students;
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
    console.log(
        "PROFILE SERVICE - USER ID:",
        userId
    );

    const user =
        await User.findById(userId);

    console.log(
        "PROFILE SERVICE - USER:",
        user
    );

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

    console.log(
        "PROFILE SERVICE - STUDENT ID:",
        user.student
    );

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

    console.log(
        "PROFILE SERVICE - STUDENT:",
        student
    );

    if (!student) {
        throw new Error(
            "Student profile not found."
        );
    }

    return student;
};


// ======================================================
// Reset Student Password
// Admin only
// ======================================================

export const resetStudentPasswordService = async (
    studentId
) => {

    // --------------------------------------------------
    // 1. Find student
    // --------------------------------------------------

    const student =
        await Student.findById(studentId);

    if (!student) {
        throw new Error(
            "Student not found."
        );
    }

    // --------------------------------------------------
    // 2. Make sure student has a user account
    // --------------------------------------------------

    if (!student.user) {
        throw new Error(
            "Student does not have a user account."
        );
    }

    // --------------------------------------------------
    // 3. Find user account
    // --------------------------------------------------

    const user =
        await User.findById(student.user);

    if (!user) {
        throw new Error(
            "Student user account not found."
        );
    }

    // --------------------------------------------------
    // 4. Generate temporary password
    // Example: STU260002
    // --------------------------------------------------

    const temporaryPassword =
        `STU${student.registrationNumber
            .replace(/\//g, "")
            .slice(-6)}`;

    // --------------------------------------------------
    // 5. Hash temporary password
    // --------------------------------------------------

    const hashedPassword =
        await bcrypt.hash(
            temporaryPassword,
            10
        );

    // --------------------------------------------------
    // 6. Update user account
    // --------------------------------------------------

    user.password = hashedPassword;

    user.mustChangePassword = true;

    await user.save();

    // --------------------------------------------------
    // 7. Return reset information
    // --------------------------------------------------

    return {
        student: {
            id: student._id,
            fullName: student.fullName,
            registrationNumber:
                student.registrationNumber,
        },

        login: {
            username:
                user.username,

            temporaryPassword,

            mustChangePassword: true,
        },
    };
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