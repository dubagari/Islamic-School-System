import mongoose from "mongoose";

const admissionApplicationSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },
        email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },
        parentName: {
      type: String,
      required: true,
      trim: true,
    },

    parentPhone: {
      type: String,
      required: true,
      trim: true,
    },

    parentEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },

    relationship: {
      type: String,
      required: true,
    },
        currentLevel: {
      type: String,
      required: true,
    },

    previousMadrasa: {
      type: String,
      trim: true,
    },
        status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected"
      ],
      default: "Pending",
    },

    remarks: {
      type: String,
      trim: true,
    },
        passportPhoto: {
      type: String,
    },

      },
  {
    timestamps: true,
  }
);

export default mongoose.model("AdmissionApplication",admissionApplicationSchema);