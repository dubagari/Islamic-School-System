import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Student from "../models/Student.js";
import User from "../models/User.js";
import { forbidden } from "../utils/AppError.js";
import {
    assertStudentSchoolFeePortalAccessService,
} from "./publicSchoolFeeService.js";

const resolveLoginIdentifier = async (identifier) => {
    const normalizedIdentifier = String(identifier ?? "").trim();
    if (!normalizedIdentifier) {
        throw new Error(
            "Invalid application/registration number, email, or password."
        );
    }

    const user = await User.findOne({
        $or: [
            {
                username: normalizedIdentifier,
            },
            {
                email: normalizedIdentifier,
            },
        ],
    });

    if (user) {
        return user;
    }

    const student = await Student.findOne({
        applicationNumber: normalizedIdentifier,
    }).select("user");

    if (!student?.user) {
        return null;
    }

    return User.findById(student.user);
};

export const loginService = async (
    identifier,
    password
) => {

    const user = await resolveLoginIdentifier(identifier);

    if (!user) {
        throw new Error(
            "Invalid application/registration number, email, or password."
        );
    }

    if (!user.isActive) {
        throw new Error("Your account has been deactivated.");
    }

    const isPasswordCorrect =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!isPasswordCorrect) {
        throw new Error(
            "Invalid application/registration number, email, or password."
        );
    }

    // Students cannot access the portal until their admission fee is
    // confirmed paid. Accounts are only created after payment, but this
    // guard also covers any manually created/inactive student accounts.
    if (user.role === "student") {
        const student = await Student.findById(user.student).select(
            "isActive paymentStatus"
        );

        if (!student) {
            throw forbidden(
                "Your student profile is not linked to this account. Contact the school office."
            );
        }

        if (!student.isActive) {
            throw forbidden(
                "Your student account is inactive. Contact the school office."
            );
        }

        if (student.paymentStatus !== "Paid") {
            throw forbidden(
                "Your portal is locked until the admission fee is paid. Contact the school office."
            );
        }

        await assertStudentSchoolFeePortalAccessService(student._id);
    }

    user.lastLogin = new Date();

    await user.save();

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN,
        }
    );

    return {
        token,
        user: {
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            role: user.role,
            mustChangePassword:
                user.mustChangePassword,
        },
    };

};



export const changePasswordService = async (
    userId,
    currentPassword,
    newPassword
) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    const isPasswordCorrect =
        await bcrypt.compare(
            currentPassword,
            user.password
        );

    if (!isPasswordCorrect) {
        throw new Error("Current password is incorrect.");
    }

    const hashedPassword =
        await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    user.mustChangePassword = false;

    await user.save();

    return user;

};



export const getProfileService = async (
    userId
) => {

    const user = await User.findById(userId)
        .select("-password");

    if (!user) {
        throw new Error("User not found.");
    }

    return user;

};

