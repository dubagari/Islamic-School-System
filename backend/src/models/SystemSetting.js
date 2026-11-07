import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        category: {
            type: String,
            trim: true,
            default: "general",
            index: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        isPublic: {
            type: Boolean,
            default: false,
            index: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const SystemSetting = mongoose.model(
    "SystemSetting",
    systemSettingSchema
);

export default SystemSetting;
