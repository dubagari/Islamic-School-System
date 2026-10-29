import mongoose from "mongoose";

const assessmentScoreSchema = new mongoose.Schema(
    {
        assessment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assessment",
            required: true,
            index: true,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
        },

        score: {
            type: Number,
            required: true,
            min: 0,
        },

        remarks: {
            type: String,
            trim: true,
            default: "",
        },

        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        source: {
            type: String,
            enum: ["Manual", "CBT"],
            default: "Manual",
        },

        cbtExam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CbtExam",
            default: null,
        },

        cbtAttempt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CbtAttempt",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

assessmentScoreSchema.index(
    {
        assessment: 1,
        student: 1,
    },
    {
        unique: true,
    }
);

const AssessmentScore = mongoose.model(
    "AssessmentScore",
    assessmentScoreSchema
);

export default AssessmentScore;
