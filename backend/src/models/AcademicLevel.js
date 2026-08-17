import mongoose from "mongoose";

const academicLevelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        levelNumber: {
            type: Number,
            required: true,
            min: 1,
        },

        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSection",
            required: true,
        },

        description: {
            type: String,
            trim: true,
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

// Prevent duplicate levels within the same section
academicLevelSchema.index(
    {
        name: 1,
        section: 1,
    },
    {
        unique: true,
    }
);

// Prevent duplicate level numbers within the same section
academicLevelSchema.index(
    {
        levelNumber: 1,
        section: 1,
    },
    {
        unique: true,
    }
);

const AcademicLevel = mongoose.model(
    "AcademicLevel",
    academicLevelSchema
);

export default AcademicLevel;