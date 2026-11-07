import AppError from "../utils/AppError.js";

// ======================================================
// Infer a status code for legacy services that throw
// plain Error objects without a status code.
// ======================================================

const inferStatusFromMessage = (message = "") => {
    const text = message.toLowerCase();

    if (
        text.includes("not authorized") ||
        text.includes("no token") ||
        text.includes("invalid username") ||
        text.includes("invalid email or password") ||
        text.includes("invalid credentials") ||
        text.includes("token expired") ||
        text.includes("invalid token") ||
        text.includes("jwt")
    ) {
        return 401;
    }

    if (
        text.includes("permission") ||
        text.includes("deactivated") ||
        text.includes("not allowed") ||
        text.includes("forbidden")
    ) {
        return 403;
    }

    if (text.includes("not found")) {
        return 404;
    }

    if (
        text.includes("already exists") ||
        text.includes("already been") ||
        text.includes("already assigned") ||
        text.includes("already enrolled") ||
        text.includes("already registered") ||
        text.includes("already approved") ||
        text.includes("already rejected") ||
        text.includes("already completed") ||
        text.includes("duplicate") ||
        text.includes("e11000")
    ) {
        return 409;
    }

    if (
        text.includes("invalid") ||
        text.includes("required") ||
        text.includes("must ") ||
        text.includes("cannot ") ||
        text.includes("can not") ||
        text.includes("inactive") ||
        text.includes("capacity") ||
        text.includes("overlap") ||
        text.includes("valid ") ||
        text.includes("does not match") ||
        text.includes("does not belong") ||
        text.includes("not linked")
    ) {
        return 400;
    }

    return 500;
};

// ======================================================
// Normalize Known Mongoose / JWT Errors
// ======================================================

const normalizeError = (error) => {
    if (error instanceof AppError) {
        return {
            statusCode: error.statusCode,
            message: error.message,
            errors: error.errors || null,
        };
    }

    if (error.name === "ValidationError") {
        return {
            statusCode: 400,
            message: "Validation failed.",
            errors: Object.values(error.errors).map((item) => ({
                field: item.path,
                message: item.message,
            })),
        };
    }

    if (error.name === "CastError") {
        return {
            statusCode: 400,
            message: `Invalid value for ${error.path}.`,
            errors: null,
        };
    }

    if (error.code === 11000) {
        const fields = Object.keys(error.keyValue || {});

        return {
            statusCode: 409,
            message:
                fields.length > 0
                    ? `A record with this ${fields.join(", ")} already exists.`
                    : "A duplicate record already exists.",
            errors: null,
        };
    }

    if (error.name === "JsonWebTokenError") {
        return {
            statusCode: 401,
            message: "Invalid authentication token.",
            errors: null,
        };
    }

    if (error.name === "TokenExpiredError") {
        return {
            statusCode: 401,
            message: "Authentication token has expired.",
            errors: null,
        };
    }

    if (error.type === "entity.parse.failed") {
        return {
            statusCode: 400,
            message: "Invalid JSON in request body.",
            errors: null,
        };
    }

    const message = error.message || "Internal server error.";

    return {
        statusCode: error.statusCode || error.status || inferStatusFromMessage(message),
        message,
        errors: null,
    };
};

// ======================================================
// Global Error Handler
// ======================================================

const errorMiddleware = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const normalized = normalizeError(err);

    const statusCode =
        normalized.statusCode >= 400 && normalized.statusCode <= 599
            ? normalized.statusCode
            : 500;

    if (statusCode >= 500) {
        console.error("Unhandled error:", err);
    }

    const body = {
        success: false,
        message: normalized.message,
    };

    if (normalized.errors) {
        body.errors = normalized.errors;
    }

    if (err.code === "PASSWORD_CHANGE_REQUIRED") {
        body.code = err.code;
    }

    if (process.env.NODE_ENV !== "production" && statusCode >= 500) {
        body.stack = err.stack;
    }

    res.status(statusCode).json(body);
};

export default errorMiddleware;
