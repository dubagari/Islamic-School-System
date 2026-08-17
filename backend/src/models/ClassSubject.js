import mongoose from "mongoose";

const classSubjectSchema =
    new mongoose.Schema(
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

            academicSemester: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "AcademicSemester",
                required: true,
            },

            courseCode: {
                type: String,
                required: true,
                uppercase: true,
                trim: true,
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
        },
        {
            timestamps: true,
        }
    );

// ======================================================
// Prevent Duplicate Subject Assignment
// ======================================================

classSubjectSchema.index(
    {
        academicClass: 1,
        subject: 1,
        academicSemester: 1,
    },
    {
        unique: true,
    }
);

// ======================================================
// Prevent Duplicate Course Code
// ======================================================

classSubjectSchema.index(
    {
        courseCode: 1,
        academicSemester: 1,
    },
    {
        unique: true,
    }
);

const ClassSubject =
    mongoose.model(
        "ClassSubject",
        classSubjectSchema
    );

export default ClassSubject;