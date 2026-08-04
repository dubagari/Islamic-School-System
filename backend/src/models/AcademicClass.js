import mongoose from "mongoose";

const academicClassSchema = new mongoose.Schema(
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
      min: 1,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    displayOrder: {
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

// One class name per section
academicClassSchema.index(
  { section: 1, name: 1 },
  { unique: true }
);

// One level per section
academicClassSchema.index(
  { section: 1, level: 1 },
  { unique: true }
);

// One display order per section
academicClassSchema.index(
  { section: 1, displayOrder: 1 },
  { unique: true }
);

export default mongoose.model("AcademicClass", academicClassSchema);