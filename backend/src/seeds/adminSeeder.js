import bcrypt from "bcryptjs";

import User from "../models/User.js";

const seedAdmin = async () => {

    try {

        const adminExists = await User.findOne({
            role: "admin",
        });

        if (adminExists) {

            console.log(
                "Admin account already exists."
            );

            return;

        }

        const hashedPassword =
            await bcrypt.hash(
                "Admin123@",
                10
            );

        await User.create({
            fullName: "System Administrator",
            username: "admin",
            email: "admin@darululum.com",
            password: hashedPassword,
            role: "admin",
            isActive: true,
            mustChangePassword: true,
        });

        console.log(
            "Default admin account created successfully."
        );

    } catch (error) {

        console.error(
            "Error creating admin account:",
            error.message
        );

    }

};

export default seedAdmin;