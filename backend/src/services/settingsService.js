import SystemSetting from "../models/SystemSetting.js";
import { escapeRegex } from "../utils/search.js";
import { notFound } from "../utils/AppError.js";

// ======================================================
// List Settings
// ======================================================

export const getSettingsService = async (query = {}) => {
    const filter = {};

    if (query.category) {
        filter.category = query.category;
    }

    if (query.isPublic !== undefined) {
        filter.isPublic = query.isPublic === "true";
    }

    if (query.search) {
        const regex = new RegExp(
            escapeRegex(query.search),
            "i"
        );

        filter.$or = [
            { key: regex },
            { description: regex },
        ];
    }

    return await SystemSetting.find(filter)
        .populate("updatedBy", "fullName username")
        .sort({ category: 1, key: 1 })
        .limit(500);
};

// ======================================================
// Get Single Setting
// ======================================================

export const getSettingService = async (key) => {
    const setting = await SystemSetting.findOne({
        key,
    }).populate("updatedBy", "fullName username");

    if (!setting) {
        throw notFound("System setting not found.");
    }

    return setting;
};

// ======================================================
// Public Settings
// ======================================================

export const getPublicSettingsService = async () => {
    const settings = await SystemSetting.find({
        isPublic: true,
    })
        .select("key value category description")
        .sort({ key: 1 });

    const values = {};

    settings.forEach((setting) => {
        values[setting.key] = setting.value;
    });

    return {
        settings,
        values,
    };
};

// ======================================================
// Create / Update Setting
// ======================================================

export const upsertSettingService = async (
    key,
    data,
    user
) => {
    const update = {
        value: data.value,
        updatedBy: user._id,
    };

    if (data.category !== undefined) {
        update.category = data.category;
    }

    if (data.description !== undefined) {
        update.description = data.description;
    }

    if (data.isPublic !== undefined) {
        update.isPublic = data.isPublic;
    }

    return await SystemSetting.findOneAndUpdate(
        { key },
        { $set: update },
        {
            returnDocument: "after",
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    ).populate("updatedBy", "fullName username");
};

// ======================================================
// Delete Setting
// ======================================================

export const deleteSettingService = async (key) => {
    const setting = await SystemSetting.findOne({
        key,
    });

    if (!setting) {
        throw notFound("System setting not found.");
    }

    await setting.deleteOne();

    return setting;
};
