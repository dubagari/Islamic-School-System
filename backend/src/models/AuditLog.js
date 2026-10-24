import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        role: {
            type: String,
            trim: true,
            default: "",
        },

        method: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        path: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        statusCode: {
            type: Number,
            required: true,
        },

        success: {
            type: Boolean,
            default: true,
            index: true,
        },

        ip: {
            type: String,
            trim: true,
            default: "",
        },

        userAgent: {
            type: String,
            trim: true,
            default: "",
        },

        requestBody: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

auditLogSchema.index({
    createdAt: -1,
});

auditLogSchema.index({
    user: 1,
    createdAt: -1,
});

const AuditLog = mongoose.model(
    "AuditLog",
    auditLogSchema
);

export default AuditLog;
