import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            trim: true,
        },

        text: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        _id: false,
    }
);

const cbtQuestionSchema = new mongoose.Schema(
    {
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
            index: true,
        },

        questionText: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: ["MultipleChoice", "TrueFalse"],
            required: true,
        },

        options: {
            type: [optionSchema],
            default: [],
        },

        correctAnswer: {
            type: String,
            required: true,
            trim: true,
        },

        explanation: {
            type: String,
            trim: true,
            default: "",
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Medium",
        },

        defaultMarks: {
            type: Number,
            default: 1,
            min: 1,
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

cbtQuestionSchema.index({
    subject: 1,
    type: 1,
    difficulty: 1,
    isActive: 1,
});

cbtQuestionSchema.index({
    questionText: "text",
});

const CbtQuestion = mongoose.model(
    "CbtQuestion",
    cbtQuestionSchema
);

export default CbtQuestion;
