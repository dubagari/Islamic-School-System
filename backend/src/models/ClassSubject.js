import mongoose from "mongoose";

const classSubjectSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },

   teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
}],

   status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
},
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate assignments
classSubjectSchema.index(
  {
    academicClass: 1,
    subject: 1,
    session: 1,
    term: 1,
  },
  { unique: true }
);

export default mongoose.model("ClassSubject", classSubjectSchema);