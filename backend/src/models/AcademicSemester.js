import mongoose from "mongoose";

const academicSemesterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            enum: [
                "First Semester",
                "Second Semester",
            ],
        },

        academicSession: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSession",
            required: true,
        },

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
        },

        isCurrent: {
            type: Boolean,
            default: false,
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

academicSemesterSchema.index(
    {
        academicSession: 1,
        name: 1,
    },
    {
        unique: true,
    }
);

const AcademicSemester = mongoose.model("AcademicSemester", academicSemesterSchema);

export default AcademicSemester;