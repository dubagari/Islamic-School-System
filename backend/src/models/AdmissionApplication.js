import mongoose from "mongoose";

const admissionApplicationSchema = new mongoose.Schema(
    {
        // ======================================================
        // Applicant Information
        // ======================================================

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
            enum: ["Male", "Female"],
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

        // ======================================================
        // Parent / Guardian Information
        // ======================================================

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

        // ======================================================
        // Academic Information
        // ======================================================

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

        // ======================================================
        // Admission
        // ======================================================

        applicationNumber: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
            ],
            default: "Pending",
        },

        statusReason: {
            type: String,
            trim: true,
            default: "",
        },

        // ======================================================
        // Approval Information
        // ======================================================

        approvedAt: {
            type: Date,
            default: null,
        },

        rejectedAt: {
            type: Date,
            default: null,
        },

        // ======================================================
        // Payment Information
        // ======================================================

paymentStatus: {
    type: String,
    enum: [
        "Pending",
        "Paid",
        "Failed",
        "Cancelled",
    ],
    default: "Pending",
},

paymentMethod: {
    type: String,
    enum: [
        "Paystack",
        "Cash",
        null,
    ],
    default: null,
},

paymentReference: {
    type: String,
    trim: true,
    default: null,
},

paymentAmount: {
    type: Number,
    min: 0,
    default: 0,
},

paidAt: {
    type: Date,
    default: null,
},

paymentConfirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
},

        registrationNumber: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const AdmissionApplication = mongoose.model("AdmissionApplication", admissionApplicationSchema);

export default AdmissionApplication;