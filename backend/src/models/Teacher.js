
import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
    {
        // ==============================================
        // Teacher Number
        // ==============================================

        teacherNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        // ==============================================
        // Personal Information
        // ==============================================

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
        },

        // ==============================================
        // Contact Information
        // ==============================================

        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true,
        },

        phone: {
            type: String,
            trim: true,
        },

        address: {
            type: String,
            trim: true,
            default: "",
        },

        // ==============================================
        // Professional Information
        // ==============================================

        qualification: {
            type: String,
            trim: true,
            default: "",
        },

        specialization: {
            type: String,
            trim: true,
            default: "",
        },

        employmentDate: {
            type: Date,
            default: Date.now,
        },

        // ==============================================
        // Employment Status
        // ==============================================

        status: {
            type: String,
            enum: [
                "Active",
                "Suspended",
                "Retired",
                "Resigned",
                "Terminated",
            ],
            default: "Active",
            required: true,
        },

        statusReason: {
            type: String,
            trim: true,
            default: "",
        },

        statusDate: {
            type: Date,
        },

        employmentType: {
    type: String,
    required: true,
    enum: [
        "Full Time",
        "Contract",
        "Part-Time",
        "Temporary",
        "Volunteer"
    ],
    default: "Full Time"
},

        // ==============================================
        // User Account
        // ==============================================

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            unique: true,
            sparse: true,
        },

        // ==============================================
        // General Active Flag
        // ==============================================

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// ==============================================
// Virtual Full Name
// ==============================================

teacherSchema.virtual("fullName").get(function () {
    return [
        this.firstName,
        this.middleName,
        this.lastName,
    ]
        .filter(Boolean)
        .join(" ");
});

// Include virtuals when converting to JSON
teacherSchema.set("toJSON", {
    virtuals: true,
});

teacherSchema.set("toObject", {
    virtuals: true,
});

const Teacher = mongoose.model(
    "Teacher",
    teacherSchema
);

export default Teacher;

