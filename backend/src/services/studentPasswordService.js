import bcrypt from "bcryptjs";

import Student from "../models/Student.js";
import User from "../models/User.js";

// ======================================================
// Admin - Reset Student Password
// ======================================================

export const resetStudentPasswordService = async (
    studentId
) => {
    // --------------------------------------------------
    // 1. Find student
    // --------------------------------------------------

    const student = await Student.findById(studentId);

    if (!student) {
        throw new Error("Student not found.");
    }

    // --------------------------------------------------
    // 2. Student must have a linked user account
    // --------------------------------------------------

    if (!student.user) {
        throw new Error(
            "Student does not have a user account."
        );
    }

    // --------------------------------------------------
    // 3. Find linked user
    // --------------------------------------------------

    const user = await User.findById(student.user);

    if (!user) {
        throw new Error(
            "Student user account not found."
        );
    }

    // --------------------------------------------------
    // 4. Generate temporary password
    //
    // Example:
    // 26/260001 → STU260001
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

    user.isActive = true;

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
            username: user.username,
            temporaryPassword,
            mustChangePassword: true,
        },
    };
};

