import mongoose from "mongoose";

const studentEnrollmentSchema = new mongoose.Schema(
    {
        // ======================================================
        // Student
        // ======================================================

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        // ======================================================
        // Academic Session
        // ======================================================

        academicSession: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSession",
            required: true,
        },

        // ======================================================
        // Academic Class
        // ======================================================

        academicClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            required: true,
        },

        // ======================================================
        // Enrollment Status
        // ======================================================

        status: {
            type: String,
            enum: [
                "Active",
                "Completed",
                "Transferred",
                "Withdrawn",
            ],
            default: "Active",
        },

        // ======================================================
        // Enrollment Date
        // ======================================================

        enrollmentDate: {
            type: Date,
            default: Date.now,
        },

        // ======================================================
        // General
        // ======================================================

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// ======================================================
// Prevent duplicate enrollment
// Same student cannot be enrolled in the same session twice
// ======================================================

studentEnrollmentSchema.index(
    {
        student: 1,
        academicSession: 1,
    },
    {
        unique: true,
    }
);

const StudentEnrollment = mongoose.model(
    "StudentEnrollment",
    studentEnrollmentSchema
);

export default StudentEnrollment;