import rateLimit from "express-rate-limit";

const jsonMessage = (message) => ({
    success: false,
    message,
});

// ======================================================
// General API Limiter
// ======================================================

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: jsonMessage(
        "Too many requests. Please try again later."
    ),
});

// ======================================================
// Authentication Limiter
// ======================================================

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: jsonMessage(
        "Too many login attempts. Please try again in 15 minutes."
    ),
});

// ======================================================
// Payment Limiter
// ======================================================

export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: jsonMessage(
        "Too many payment requests. Please try again later."
    ),
});
