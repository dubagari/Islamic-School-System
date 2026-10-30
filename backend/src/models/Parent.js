import mongoose from "mongoose";

const parentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        phone: {
            type: String,
            trim: true,
            default: "",
        },

        alternatePhone: {
            type: String,
            trim: true,
            default: "",
        },

        address: {
            type: String,
            trim: true,
            default: "",
        },

        occupation: {
            type: String,
            trim: true,
            default: "",
        },

        students: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Student",
                },
            ],
            default: [],
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

parentSchema.index({
    students: 1,
});

const Parent = mongoose.model("Parent", parentSchema);

export default Parent;
