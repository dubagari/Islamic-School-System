import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        audience: {
            type: String,
            enum: [
                "all",
                "students",
                "teachers",
                "parents",
                "class",
            ],
            default: "all",
            index: true,
        },

        academicClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            default: null,
        },

        priority: {
            type: String,
            enum: ["Low", "Normal", "High", "Urgent"],
            default: "Normal",
        },

        publishAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        expiresAt: {
            type: Date,
            default: null,
        },

        isPublished: {
            type: Boolean,
            default: true,
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        notifiedAt: {
            type: Date,
            default: null,
        },

        recipientCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

announcementSchema.index({
    isPublished: 1,
    publishAt: -1,
});

const Announcement = mongoose.model(
    "Announcement",
    announcementSchema
);

export default Announcement;
