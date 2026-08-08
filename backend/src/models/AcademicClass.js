import mongoose from "mongoose";

const academicClassSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        academicLevel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicLevel",
            required: true,
        },

        capacity: {
            type: Number,
            required: true,
            min: 1,
        },

        classTeacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
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

const AcademicClass = mongoose.model(
    "AcademicClass",
    academicClassSchema
);

export default AcademicClass;