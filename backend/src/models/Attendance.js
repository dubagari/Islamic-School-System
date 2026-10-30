import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
        },

        academicClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            required: true,
            index: true,
        },

        academicSession: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSession",
            required: true,
            index: true,
        },

        academicSemester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSemester",
            required: true,
            index: true,
        },

        date: {
            type: Date,
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["Present", "Absent", "Late", "Excused"],
            default: "Present",
            required: true,
        },

        remarks: {
            type: String,
            trim: true,
            default: "",
        },

        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// One attendance record per student per class per day
attendanceSchema.index(
    {
        student: 1,
        academicClass: 1,
        date: 1,
    },
    {
        unique: true,
    }
);

attendanceSchema.index({
    academicClass: 1,
    date: 1,
    status: 1,
});

const Attendance = mongoose.model(
    "Attendance",
    attendanceSchema
);

export default Attendance;
