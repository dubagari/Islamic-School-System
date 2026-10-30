import crypto from "crypto";

import bcrypt from "bcryptjs";

import User from "../models/User.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import {
    buildSearchFilter,
} from "../utils/search.js";
import {
    badRequest,
    notFound,
} from "../utils/AppError.js";

// ======================================================
// Helpers
// ======================================================

const populateUser = (query) =>
    query
        .select("-password")
        .populate(
            "teacher",
            "teacherNumber firstName middleName lastName status isActive"
        )
        .populate(
            "student",
            "registrationNumber firstName middleName lastName status isActive academicClass"
        )
        .populate(
            "parent",
            "phone isActive students"
        );

// ======================================================
// List Users
// ======================================================

export const getUsersService = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {
        ...buildSearchFilter(query.search, [
            "fullName",
            "username",
            "email",
        ]),
    };

    if (query.role) {
        filter.role = query.role;
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === "true";
    }

    const [users, total] = await Promise.all([
        populateUser(User.find(filter))
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments(filter),
    ]);

    return paginatedResult(users, total, {
        page,
        limit,
    });
};

// ======================================================
// Get User By ID
// ======================================================

export const getUserByIdService = async (userId) => {
    const user = await populateUser(
        User.findById(userId)
    );

    if (!user) {
        throw notFound("User not found.");
    }

    return user;
};

// ======================================================
// Update User
// ======================================================

export const updateUserService = async (
    userId,
    data,
    actingUser
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw notFound("User not found.");
    }

    if (
        user._id.toString() ===
            actingUser._id.toString() &&
        data.isActive === false
    ) {
        throw badRequest(
            "You cannot deactivate your own account."
        );
    }

    if (
        data.email &&
        data.email.toLowerCase() !== user.email
    ) {
        const duplicate = await User.findOne({
            _id: { $ne: user._id },
            email: data.email.toLowerCase(),
        });

        if (duplicate) {
            throw badRequest(
                "A user with this email already exists."
            );
        }
    }

    if (data.fullName !== undefined) {
        user.fullName = data.fullName;
    }

    if (data.email !== undefined) {
        user.email = data.email
            ? data.email.toLowerCase()
            : undefined;
    }

    if (data.isActive !== undefined) {
        user.isActive = data.isActive;
    }

    if (data.mustChangePassword !== undefined) {
        user.mustChangePassword =
            data.mustChangePassword;
    }

    await user.save();

    return await populateUser(
        User.findById(user._id)
    );
};

// ======================================================
// Reset A User's Password
// ======================================================

export const resetUserPasswordService = async (
    userId,
    data,
    actingUser
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw notFound("User not found.");
    }

    if (
        user._id.toString() ===
        actingUser._id.toString()
    ) {
        throw badRequest(
            "Use the change-password endpoint to change your own password."
        );
    }

    const generated =
        !data.newPassword ||
        String(data.newPassword).trim() === "";

    const newPassword = generated
        ? `Tmp@${crypto
              .randomBytes(8)
              .toString("hex")}`
        : data.newPassword;

    user.password = await bcrypt.hash(
        newPassword,
        10
    );
    user.mustChangePassword = true;

    await user.save();

    return {
        user: await populateUser(
            User.findById(user._id)
        ),
        temporaryPassword: generated
            ? newPassword
            : null,
    };
};

// ======================================================
// Deactivate User
// ======================================================

export const deactivateUserService = async (
    userId,
    actingUser
) => {
    if (userId.toString() === actingUser._id.toString()) {
        throw badRequest(
            "You cannot deactivate your own account."
        );
    }

    const user = await User.findById(userId);

    if (!user) {
        throw notFound("User not found.");
    }

    user.isActive = false;

    await user.save();

    return await populateUser(
        User.findById(user._id)
    );
};
