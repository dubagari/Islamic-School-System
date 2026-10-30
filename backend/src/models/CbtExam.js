import mongoose from "mongoose";

const cbtExamSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        instructions: {
            type: String,
            trim: true,
            default: "",
        },

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

        startAt: {
            type: Date,
            required: true,
        },

        endAt: {
            type: Date,
            required: true,
        },

        durationMinutes: {
            type: Number,
            required: true,
            min: 1,
        },

        passMark: {
            type: Number,
            default: 50,
            min: 0,
            max: 100,
        },

        maxAttempts: {
            type: Number,
            default: 1,
            min: 1,
            max: 5,
        },

        totalMarks: {
            type: Number,
            default: 0,
            min: 0,
        },

        shuffleQuestions: {
            type: Boolean,
            default: true,
        },

        shuffleOptions: {
            type: Boolean,
            default: true,
        },

        resultVisibility: {
            type: String,
            enum: ["AfterPublish", "Immediate", "Hidden"],
            default: "AfterPublish",
        },

        allowReview: {
            type: Boolean,
            default: false,
        },

        linkedAssessment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assessment",
            default: null,
        },

        isPublished: {
            type: Boolean,
            default: false,
        },

        isClosed: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        resultsPublished: {
            type: Boolean,
            default: false,
        },

        resultsPublishedAt: {
            type: Date,
            default: null,
        },

        resultsPublishedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
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

cbtExamSchema.index({
    classSubject: 1,
    academicSession: 1,
    academicSemester: 1,
});

cbtExamSchema.index({
    isPublished: 1,
    startAt: 1,
    endAt: 1,
});

const CbtExam = mongoose.model("CbtExam", cbtExamSchema);

export default CbtExam;
