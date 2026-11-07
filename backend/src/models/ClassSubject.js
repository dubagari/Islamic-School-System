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
// Course Code Lookup
// ======================================================
// Course codes are shared by all class arms in the same
// level, so they are indexed but not unique.

classSubjectSchema.index({
    courseCode: 1,
    academicSemester: 1,
});

const ClassSubject =
    mongoose.model(
        "ClassSubject",
        classSubjectSchema
    );

export default ClassSubject;