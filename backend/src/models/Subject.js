import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSection",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    level: {
    type: Number,
    required: true,
},
prefix: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 5,
},

    subjectType: {
      type: String,
      enum: [
        "Theory",
        "Practical",
        "Memorization"
      ],
      default: "Theory",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    isCompulsory: {
      type: Boolean,
      default: true,
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

export default mongoose.model("Subject", subjectSchema);