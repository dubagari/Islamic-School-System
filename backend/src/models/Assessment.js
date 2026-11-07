import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
    {
        classSubject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ClassSubject",
            required: true,
            index: true,
        },

        academicSession: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSession",
            required: true,
            index: true,
        },

        academicSemester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSemester",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: [
                "Quiz",
                "Test",
                "Assignment",
                "Midterm",
                "Exam",
                "Project",
                "Practical",
            ],
            required: true,
        },

        maxScore: {
            type: Number,
            required: true,
            min: 1,
        },

        weight: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 0,
        },

        date: {
            type: Date,
            default: Date.now,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

assessmentSchema.index(
    {
        classSubject: 1,
        academicSemester: 1,
        name: 1,
    },
    {
        unique: true,
    }
);

const Assessment = mongoose.model(
    "Assessment",
    assessmentSchema
);

export default Assessment;
