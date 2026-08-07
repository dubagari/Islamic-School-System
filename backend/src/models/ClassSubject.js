import mongoose from "mongoose";

const classSubjectSchema = new mongoose.Schema(
    {
        academicClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            required: true,
        },

        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
        },

        academicSession: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSession",
            required: true,
        },

        academicTerm: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicTerm",
            required: true,
        },

        teachers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate assignments
classSubjectSchema.index(
    {
        academicClass: 1,
        subject: 1,
        academicSession: 1,
        academicTerm: 1,
    },
    {
        unique: true,
    }
);

export default mongoose.model(
    "ClassSubject",
    classSubjectSchema
);