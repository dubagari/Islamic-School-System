import {
    getSystemInfoService,
    getDatabaseStatsService,
    syncIndexesService,
} from "../services/systemService.js";
import {
    getAuditLogsService,
    getAuditLogByIdService,
} from "../services/auditLogService.js";
import {
    getUsersService,
    getUserByIdService,
    updateUserService,
    resetUserPasswordService,
    deactivateUserService,
} from "../services/userAdminService.js";
import {
    getSettingsService,
    getSettingService,
    getPublicSettingsService,
    upsertSettingService,
    deleteSettingService,
} from "../services/settingsService.js";

// ======================================================
// System
// ======================================================

export const getSystemInfoController = async (
    req,
    res,
    next
) => {
    try {
        const info = await getSystemInfoService();

        res.status(200).json({
            success: true,
            message:
                "System information retrieved successfully.",
            data: info,
        });
    } catch (error) {
        next(error);
    }
};

export const getDatabaseStatsController = async (
    req,
    res,
    next
) => {
    try {
        const stats = await getDatabaseStatsService();

        res.status(200).json({
            success: true,
            message:
                "Database statistics retrieved successfully.",
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};

export const syncIndexesController = async (
    req,
    res,
    next
) => {
    try {
        const result = await syncIndexesService();

        res.status(200).json({
            success: result.failed === 0,
            message:
                result.failed === 0
                    ? "Model indexes synchronized successfully."
                    : "Index synchronization completed with failures.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Audit Logs
// ======================================================

export const getAuditLogsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getAuditLogsService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message: "Audit logs retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

export const getAuditLogByIdController = async (
    req,
    res,
    next
) => {
    try {
        const log = await getAuditLogByIdService(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Audit log retrieved successfully.",
            data: log,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Users
// ======================================================

export const getUsersController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getUsersService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

export const getUserByIdController = async (
    req,
    res,
    next
) => {
    try {
        const user = await getUserByIdService(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "User retrieved successfully.",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserController = async (
    req,
    res,
    next
) => {
    try {
        const user = await updateUserService(
            req.params.id,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "User updated successfully.",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const resetUserPasswordController = async (
    req,
    res,
    next
) => {
    try {
        const result = await resetUserPasswordService(
            req.params.id,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message:
                "User password reset successfully. The user must change it on next login.",
            data: result.user,
            temporaryPassword: result.temporaryPassword,
        });
    } catch (error) {
        next(error);
    }
};

export const deactivateUserController = async (
    req,
    res,
    next
) => {
    try {
        const user = await deactivateUserService(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "User deactivated successfully.",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Settings
// ======================================================

export const getSettingsController = async (
    req,
    res,
    next
) => {
    try {
        const settings = await getSettingsService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message: "System settings retrieved successfully.",
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

export const getSettingController = async (
    req,
    res,
    next
) => {
    try {
        const setting = await getSettingService(
            req.params.key
        );

        res.status(200).json({
            success: true,
            message: "System setting retrieved successfully.",
            data: setting,
        });
    } catch (error) {
        next(error);
    }
};

export const getPublicSettingsController = async (
    req,
    res,
    next
) => {
    try {
        const settings = await getPublicSettingsService();

        res.status(200).json({
            success: true,
            message:
                "Public system settings retrieved successfully.",
            data: settings.settings,
            values: settings.values,
        });
    } catch (error) {
        next(error);
    }
};

export const upsertSettingController = async (
    req,
    res,
    next
) => {
    try {
        const setting = await upsertSettingService(
            req.params.key,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "System setting saved successfully.",
            data: setting,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteSettingController = async (
    req,
    res,
    next
) => {
    try {
        const setting = await deleteSettingService(
            req.params.key
        );

        res.status(200).json({
            success: true,
            message: "System setting deleted successfully.",
            data: setting,
        });
    } catch (error) {
        next(error);
    }
};
