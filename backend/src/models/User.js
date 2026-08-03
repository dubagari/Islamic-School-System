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
      lowercase: true,
      trim: true,
      default: null,

      validate: {
        validator: function (value) {
          if (["admin", "teacher"].includes(this.role)) {
            return !!value;
          }
          return true;
        },
        message: "Email is required for administrators and teachers.",
      },
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent"],
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
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

export default mongoose.model("User", userSchema);