import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: [
                "admin",
                "teacher",
                "student",
            ],
            required: true,
        },

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            default: null,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            default: null,
        },

        mustChangePassword: {
            type: Boolean,
            default: true,
        },

        isActive: {
    type: Boolean,
    default: true,
},

lastLogin: {
    type: Date,
    default: null,
},

    },
    {
        timestamps: true,
    }
);

const User = mongoose.model(
    "User",
    userSchema
);

export default User;