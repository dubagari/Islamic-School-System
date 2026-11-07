import mongoose from "mongoose";

const cbtAttemptAnswerSchema = new mongoose.Schema(
    {
        attempt: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CbtAttempt",
            required: true,
            index: true,
        },

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

        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CbtExamQuestion",
            required: true,
        },

        selectedAnswer: {
            type: String,
            trim: true,
            default: "",
        },

        isCorrect: {
            type: Boolean,
            default: false,
        },

        marksAwarded: {
            type: Number,
            default: 0,
            min: 0,
        },

        answeredAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

cbtAttemptAnswerSchema.index(
    {
        attempt: 1,
        question: 1,
    },
    {
        unique: true,
    }
);

const CbtAttemptAnswer = mongoose.model(
    "CbtAttemptAnswer",
    cbtAttemptAnswerSchema
);

export default CbtAttemptAnswer;
