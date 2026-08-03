import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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
      unique: true,
      min: 1,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
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

export default mongoose.model("Class", classSchema);