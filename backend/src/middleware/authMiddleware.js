import jwt from "jsonwebtoken";

import User from "../models/User.js";
import {
    forbidden,
    unauthorized,
} from "../utils/AppError.js";

// ======================================================
// Routes that remain accessible before a password change
// ======================================================

const PASSWORD_CHANGE_ALLOWLIST = [
    "/api/v2/auth/change-password",
    "/api/v2/auth/profile",
];

const isPasswordChangeAllowed = (url = "") =>
    PASSWORD_CHANGE_ALLOWLIST.some((allowed) =>
        url.split("?")[0].endsWith(allowed)
    );

// ======================================================
// Protect
// ======================================================

export const protect = async (req, res, next) => {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            throw unauthorized("Not authorized. No token provided.");
        }

        const token = header.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            throw unauthorized("User not found.");
        }

        if (!user.isActive) {
            throw forbidden("Your account has been deactivated.");
        }

        req.user = user;

        if (
            user.mustChangePassword &&
            !isPasswordChangeAllowed(req.originalUrl)
        ) {
            return res.status(403).json({
                success: false,
                code: "PASSWORD_CHANGE_REQUIRED",
                message:
                    "You must change your password before accessing this resource.",
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Authorize
// ======================================================

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(unauthorized());
        }

        if (!roles.includes(req.user.role)) {
            return next(
                forbidden(
                    "You do not have permission to perform this action."
                )
            );
        }

        next();
    };
};

// ======================================================
// Require Role Helper (explicit usage)
// ======================================================

export const requireRole = (...roles) => authorize(...roles);
