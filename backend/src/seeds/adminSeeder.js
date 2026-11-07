import bcrypt from "bcryptjs";

import User from "../models/User.js";

const seedAdmin = async () => {

    try {

        const adminExists = await User.findOne({
            role: "admin",
        });

        const superAdminExists = await User.findOne({
            role: "super_admin",
        });

        await User.updateMany(
            {
                role: "super_admin",
                mustChangePassword: true,
            },
            {
                $set: {
                    mustChangePassword: false,
                },
            }
        );

        if (adminExists) {

            if (!superAdminExists) {
                adminExists.role = "super_admin";
                adminExists.mustChangePassword = false;

                await adminExists.save();

                console.log(
                    "Existing admin account promoted to super admin."
                );
            }

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
            role: "super_admin",
            isActive: true,
            mustChangePassword: false,
        });

        console.log(
            "Default super admin account created successfully."
        );

    } catch (error) {

        console.error(
            "Error creating admin account:",
            error.message
        );

    }

};

export default seedAdmin;