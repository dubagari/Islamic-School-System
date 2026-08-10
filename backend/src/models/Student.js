
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        // ==================================================
        // User Account
        // ==================================================

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // ==================================================
        // Admission Information
        // ==================================================

        admissionApplication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdmissionApplication",
            required: true,
            unique: true,
        },

        applicationNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        registrationNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        // ==================================================
        // Personal Information
        // ==================================================

        firstName: {
            type: String,
            required: true,
            trim: true,
        },

        middleName: {
            type: String,
            trim: true,
            default: "",
        },

        lastName: {
            type: String,
            required: true,
            trim: true,
        },

        gender: {
            type: String,
            enum: [
                "Male",
                "Female",
            ],
            required: true,
        },

        dateOfBirth: {
            type: Date,
            required: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },

        // ==================================================
        // Parent / Guardian Information
        // ==================================================

        parentName: {
            type: String,
            required: true,
            trim: true,
        },

        parentPhone: {
            type: String,
            required: true,
            trim: true,
        },

        parentEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },

        relationship: {
            type: String,
            required: true,
            trim: true,
        },

        // ==================================================
        // Academic Information
        // ==================================================

        currentLevel: {
            type: String,
            required: true,
            trim: true,
        },

        previousMadrasa: {
            type: String,
            trim: true,
            default: "",
        },

        academicClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            default: null,
        },

        // ==================================================
        // Student Status
        // ==================================================

        status: {
            type: String,
            enum: [
                "Active",
                "Suspended",
                "Graduated",
                "Withdrawn",
                "Expelled",
            ],
            default: "Active",
        },

        statusReason: {
            type: String,
            trim: true,
            default: "",
        },

        // ==================================================
        // Payment
        // ==================================================

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid",
            ],
            default: "Pending",
        },

        paidAt: {
            type: Date,
            default: null,
        },

        // ==================================================
        // General
        // ==================================================

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
// Full Name Virtual
// ======================================================

studentSchema.virtual("fullName").get(function () {
    return [
        this.firstName,
        this.middleName,
        this.lastName,
    ]
        .filter(Boolean)
        .join(" ");
});

// Allow virtuals in JSON responses
studentSchema.set(
    "toJSON",
    {
        virtuals: true,
    }
);

const Student =
    mongoose.model(
        "Student",
        studentSchema
    );

export default Student;
