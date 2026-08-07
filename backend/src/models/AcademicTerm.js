import mongoose from "mongoose";

const academicTermSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            enum: [
                "First Term",
                "Second Term",
                "Third Term",
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

academicTermSchema.index(
    {
        academicSession: 1,
        name: 1,
    },
    {
        unique: true,
    }
);

const AcademicTerm = mongoose.model("AcademicTerm", academicTermSchema);

export default AcademicTerm;