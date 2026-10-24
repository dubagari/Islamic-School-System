import mongoose from "mongoose";

const breakdownSchema = new mongoose.Schema(
    {
        assessment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assessment",
        },
        name: String,
        type: String,
        score: Number,
        maxScore: Number,
        weight: Number,
        percentage: Number,
    },
    {
        _id: false,
    }
);

const resultSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
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

        breakdown: {
            type: [breakdownSchema],
            default: [],
        },

        totalScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 0,
        },

        letterGrade: {
            type: String,
            required: true,
            default: "F",
        },

        gradePoint: {
            type: Number,
            required: true,
            default: 0,
        },

        remark: {
            type: String,
            trim: true,
            default: "",
        },

        isPublished: {
            type: Boolean,
            default: false,
            index: true,
        },

        publishedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        publishedAt: {
            type: Date,
            default: null,
        },

        computedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        computedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

resultSchema.index(
    {
        student: 1,
        classSubject: 1,
        academicSemester: 1,
    },
    {
        unique: true,
    }
);

resultSchema.index({
    classSubject: 1,
    academicSemester: 1,
    totalScore: -1,
});

const Result = mongoose.model("Result", resultSchema);

export default Result;
