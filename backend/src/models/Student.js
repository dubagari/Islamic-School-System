import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        registrationNumber: {
            type: String,
            required: true,
            unique: true,
        },

        admissionNumber: {
            type: String,
            required: true,
            unique: true,
        },

        firstName: {
            type: String,
            required: true,
        },

        middleName: {
            type: String,
        },

        lastName: {
            type: String,
            required: true,
        },

        gender: {
            type: String,
            required: true,
        },

        dateOfBirth: {
            type: Date,
            required: true,
        },

        email: {
            type: String,
        },

        phone: {
            type: String,
            required: true,
        },

        address: {
            type: String,
        },

        parentName: {
            type: String,
            required: true,
        },

        parentPhone: {
            type: String,
            required: true,
        },

        relationship: {
            type: String,
            required: true,
        },

        currentLevel: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            default: "Active",
            enum: [
                "Active",
                "Inactive",
                "Graduated",
                "Suspended"
            ],
        },

        paymentStatus: {
            type: String,
            default: "Paid",
            enum: [
                "Paid",
                "Unpaid"
            ],
        },
    },
    {
        timestamps: true,
    }
);


const Student = mongoose.model("Student", studentSchema);

export default Student;