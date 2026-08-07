import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

export const loginService = async (
    identifier,
    password
) => {

    const user = await User.findOne({
        $or: [
            {
                username: identifier,
            },
            {
                email: identifier,
            },
        ],
    });

    if (!user) {
        throw new Error("Invalid username/email or password.");
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
        throw new Error("Invalid username/email or password.");
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