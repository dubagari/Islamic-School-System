import AuditLog from "../models/AuditLog.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import { escapeRegex } from "../utils/search.js";
import { notFound } from "../utils/AppError.js";

// ======================================================
// List Audit Logs
// ======================================================

export const getAuditLogsService = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.user) {
        filter.user = query.user;
    }

    if (query.role) {
        filter.role = query.role;
    }

    if (query.method) {
        filter.method = query.method;
    }

    if (query.success !== undefined) {
        filter.success = query.success === "true";
    }

    if (query.path) {
        filter.path = new RegExp(
            escapeRegex(query.path),
            "i"
        );
    }

    if (query.from || query.to) {
        filter.createdAt = {};

        if (query.from) {
            filter.createdAt.$gte = new Date(query.from);
        }

        if (query.to) {
            filter.createdAt.$lte = new Date(query.to);
        }
    }

    const [logs, total] = await Promise.all([
        AuditLog.find(filter)
            .populate(
                "user",
                "fullName username email role"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        AuditLog.countDocuments(filter),
    ]);

    return paginatedResult(logs, total, {
        page,
        limit,
    });
};

// ======================================================
// Get Audit Log By ID
// ======================================================

export const getAuditLogByIdService = async (id) => {
    const log = await AuditLog.findById(id).populate(
        "user",
        "fullName username email role"
    );

    if (!log) {
        throw notFound("Audit log not found.");
    }

    return log;
};
