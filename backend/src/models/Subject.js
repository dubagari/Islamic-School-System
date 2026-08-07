import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        prefix: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },

        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSection",
            required: true,
        },

        level: {
            type: String,
            required: true,
            enum: [
                "Beginner",
                "Intermediate",
                "Advanced",
            ],
        },

        description: {
            type: String,
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

subjectSchema.index(
    {
        name: 1,
        section: 1,
        level: 1,
    },
    {
        unique: true,
    }
);

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;