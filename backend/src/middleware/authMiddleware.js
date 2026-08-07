import jwt from "jsonwebtoken";

import User from "../models/User.js";

export const protect = async (
    req,
    res,
    next
) => {

    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {

            token =
                req.headers.authorization.split(" ")[1];

        }

        if (!token) {
            throw new Error(
                "Not authorized. No token provided."
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id)
            .select("-password");

        if (!user) {
            throw new Error("User not found.");
        }

        if (!user.isActive) {
            throw new Error(
                "Your account has been deactivated."
            );
        }

        req.user = user;

        next();

    } catch (error) {

        next(error);

    }

};



export const authorize = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {

            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to perform this action.",
            });

        }

        next();

    };

};