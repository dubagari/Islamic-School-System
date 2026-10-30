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

const cbtExamQuestionSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CbtExam",
            required: true,
            index: true,
        },

        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CbtQuestion",
            required: true,
        },

        order: {
            type: Number,
            required: true,
            min: 1,
        },

        marks: {
            type: Number,
            required: true,
            min: 1,
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
    },
    {
        timestamps: true,
    }
);

cbtExamQuestionSchema.index(
    {
        exam: 1,
        order: 1,
    },
    {
        unique: true,
    }
);

cbtExamQuestionSchema.index(
    {
        exam: 1,
        question: 1,
    },
    {
        unique: true,
    }
);

const CbtExamQuestion = mongoose.model(
    "CbtExamQuestion",
    cbtExamQuestionSchema
);

export default CbtExamQuestion;
