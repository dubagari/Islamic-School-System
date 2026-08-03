import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const loginService = async (identifier, password) => {
        const user = await User.findOne({
    $or: [
        { username: identifier },
        { email: identifier }
    ]
    });

if (!user) {
    throw new Error("Invalid username/email or password.");
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
    throw new Error("Invalid username/email or password.");
}

if (!user.isActive) {
    throw new Error("Your account has been deactivated. Please contact the administrator.");
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
        expiresIn: "1d",
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

        mustChangePassword: user.mustChangePassword,
    },
};

};