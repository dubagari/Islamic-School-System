
import mongoose from "mongoose";

const teacherAssignmentSchema = new mongoose.Schema(
    {
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        classSubject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ClassSubject",
            required: true,
        },

        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        assignedDate: {
            type: Date,
            default: Date.now,
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

// Prevent assigning the same teacher
// to the same class subject more than once.
teacherAssignmentSchema.index(
    {
        teacher: 1,
        classSubject: 1,
    },
    {
        unique: true,
    }
);

const TeacherAssignment = mongoose.model(
    "TeacherAssignment",
    teacherAssignmentSchema
);

export default TeacherAssignment;

