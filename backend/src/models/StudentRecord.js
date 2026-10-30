import mongoose from "mongoose";

const studentRecordSchema = new mongoose.Schema(
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
        // Academic Information
        // ======================================================

        academicSession: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSession",
            required: true,
        },

        academicSemester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSemester",
            required: true,
        },

        academicClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            required: true,
        },

        // ======================================================
        // Record Type
        // ======================================================

        recordType: {
            type: String,
            enum: [
                "Promotion",
                "Transfer",
                "Withdrawal",
                "Suspension",
                "Graduation",
                "Disciplinary",
                "General",
            ],
            required: true,
        },

        // ======================================================
        // Record Details
        // ======================================================

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        // ======================================================
        // Previous / New Class
        // Useful for promotion and transfer
        // ======================================================

        previousClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            default: null,
        },

        newClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            default: null,
        },

        // ======================================================
        // Recorded By
        // ======================================================

        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        recordDate: {
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
// Indexes
// ======================================================

studentRecordSchema.index({
    student: 1,
    academicSession: 1,
});

studentRecordSchema.index({
    recordType: 1,
});

const StudentRecord = mongoose.model(
    "StudentRecord",
    studentRecordSchema
);

export default StudentRecord;