import mongoose from "mongoose";

const academicSectionSchema = new mongoose.Schema(
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

    description: {
      type: String,
      default: "",
      trim: true,
    },

    displayOrder: {
        type: Number,
        required: true,
        unique: true,
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

export default mongoose.model("AcademicSection", academicSectionSchema);