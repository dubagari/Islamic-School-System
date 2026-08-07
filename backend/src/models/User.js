import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            required: true,
            enum: [
                "admin",
                "teacher",
                "student",
                "parent",
            ],
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        mustChangePassword: {
            type: Boolean,
            default: true,
        },

        lastLogin: {
            type: Date,
        },

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;