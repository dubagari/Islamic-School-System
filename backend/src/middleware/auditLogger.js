import AuditLog from "../models/AuditLog.js";

// ======================================================
// Redact Sensitive Request Fields
// ======================================================

const SENSITIVE_KEYS = new Set([
    "password",
    "currentpassword",
    "newpassword",
    "confirmpassword",
    "temporarypassword",
    "token",
    "accesstoken",
    "refreshtoken",
    "authorization",
    "secret",
    "apikey",
    "api_key",
]);

const redactValue = (value, depth = 0) => {
    if (depth > 6) {
        return "[TRUNCATED]";
    }

    if (Array.isArray(value)) {
        return value
            .slice(0, 100)
            .map((item) => redactValue(item, depth + 1));
    }

    if (value && typeof value === "object") {
        const output = {};

        Object.entries(value)
            .slice(0, 100)
            .forEach(([key, nestedValue]) => {
                if (
                    SENSITIVE_KEYS.has(
                        key.toLowerCase().replace(/[^a-z0-9_]/g, "")
                    )
                ) {
                    output[key] = "[REDACTED]";
                    return;
                }

                output[key] = redactValue(
                    nestedValue,
                    depth + 1
                );
            });

        return output;
    }

    if (typeof value === "string" && value.length > 2000) {
        return `${value.slice(0, 2000)}...`;
    }

    return value;
};

const writeAuditLog = (req, res) => {
    if (!req.user) {
        return;
    }

    AuditLog.create({
        user: req.user._id,
        role: req.user.role,
        method: req.method,
        path: req.originalUrl.split("?")[0],
        statusCode: res.statusCode,
        success: res.statusCode < 400,
        ip: req.ip || req.socket?.remoteAddress || "",
        userAgent: req.get("user-agent") || "",
        requestBody: redactValue(req.body),
    }).catch(() => {
        // Audit logging must never break a request.
    });
};

// ======================================================
// Audit Mutation Requests
// ======================================================

const auditLogger = (req, res, next) => {
    if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
        return next();
    }

    res.on("finish", () => {
        writeAuditLog(req, res);
    });

    return next();
};

export default auditLogger;
