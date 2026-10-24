import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        feeType: {
            type: String,
            enum: [
                "Tuition",
                "Registration",
                "Exam",
                "Books",
                "Uniform",
                "Transport",
                "Hostel",
                "Development",
                "Other",
            ],
            default: "Tuition",
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
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

        academicClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            required: true,
            index: true,
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

feeStructureSchema.index(
    {
        academicSession: 1,
        academicSemester: 1,
        academicClass: 1,
        name: 1,
    },
    {
        unique: true,
    }
);

const FeeStructure = mongoose.model(
    "FeeStructure",
    feeStructureSchema
);

export default FeeStructure;
