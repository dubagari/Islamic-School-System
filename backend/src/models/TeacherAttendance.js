import mongoose from "mongoose";

const teacherAttendanceSchema = new mongoose.Schema(
    {
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
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
            enum: [
                "Present",
                "Absent",
                "Late",
                "Excused",
                "Leave",
            ],
            default: "Present",
            required: true,
        },

        checkIn: {
            type: String,
            trim: true,
            default: "",
        },

        checkOut: {
            type: String,
            trim: true,
            default: "",
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

// One record per teacher per day
teacherAttendanceSchema.index(
    {
        teacher: 1,
        date: 1,
    },
    {
        unique: true,
    }
);

teacherAttendanceSchema.index({
    date: 1,
    status: 1,
});

const TeacherAttendance = mongoose.model(
    "TeacherAttendance",
    teacherAttendanceSchema
);

export default TeacherAttendance;
