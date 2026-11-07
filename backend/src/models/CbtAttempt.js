import mongoose from "mongoose";

const optionOrderSchema = new mongoose.Schema(
    {
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CbtExamQuestion",
            required: true,
        },

        keys: {
            type: [String],
            default: [],
        },
    },
    {
        _id: false,
    }
);

const cbtAttemptSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CbtExam",
            required: true,
            index: true,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
        },

        attemptNumber: {
            type: Number,
            default: 1,
            min: 1,
        },

        status: {
            type: String,
            enum: ["InProgress", "Submitted", "Voided"],
            default: "InProgress",
        },

        startedAt: {
            type: Date,
            default: Date.now,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        submittedAt: {
            type: Date,
            default: null,
        },

        autoSubmitted: {
            type: Boolean,
            default: false,
        },

        score: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalMarks: {
            type: Number,
            default: 0,
            min: 0,
        },

        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        passed: {
            type: Boolean,
            default: false,
        },

        questionOrder: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "CbtExamQuestion",
                },
            ],
            default: [],
        },

        optionOrder: {
            type: [optionOrderSchema],
            default: [],
        },

        startedIp: {
            type: String,
            trim: true,
            default: "",
        },

        submittedIp: {
            type: String,
            trim: true,
            default: "",
        },

        userAgent: {
            type: String,
            trim: true,
            default: "",
        },

        linkedScoreStatus: {
            type: String,
            enum: [
                "None",
                "Applied",
                "Updated",
                "SkippedManualScore",
                "NotLinked",
            ],
            default: "None",
        },
    },
    {
        timestamps: true,
    }
);

cbtAttemptSchema.index(
    {
        exam: 1,
        student: 1,
        attemptNumber: 1,
    },
    {
        unique: true,
    }
);

cbtAttemptSchema.index({
    exam: 1,
    status: 1,
});

const CbtAttempt = mongoose.model(
    "CbtAttempt",
    cbtAttemptSchema
);

export default CbtAttempt;
