
import bcrypt from "bcryptjs";

import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import { generateNumber } from "./counterService.js";

// ======================================================
// Generate Default Password
// ======================================================

const generateDefaultPassword = (teacherNumber) => {
    // Example:
    // Teacher Number: TCH/2026/00001
    // Password: TCH00001

    const numberPart =
        teacherNumber.split("/").pop();

    return `TCH${numberPart}`;
};

// ======================================================
// Create Teacher
// ======================================================

export const createTeacherService = async (data) => {
    const {
        firstName,
        middleName,
        lastName,
        gender,
        dateOfBirth,
        email,
        phone,
        address,
        qualification,
        specialization,
        employmentDate,
        employmentType
    } = data;

    // ==================================================
    // Check Email
    // ==================================================

    if (email) {
        const existingTeacher =
            await Teacher.findOne({
                email: email.toLowerCase(),
            });

        if (existingTeacher) {
            throw new Error(
                "A teacher with this email already exists."
            );
        }

        const existingUser =
            await User.findOne({
                email: email.toLowerCase(),
            });

        if (existingUser) {
            throw new Error(
                "A user with this email already exists."
            );
        }
    }

    // ==================================================
    // Generate Teacher Number
    // ==================================================

    const teacherNumber =
        await generateNumber(
            "teacher",
            "TCH"
        );

    // ==================================================
    // Generate Default Password
    // ==================================================

    const defaultPassword =
        generateDefaultPassword(
            teacherNumber
        );

    const hashedPassword =
        await bcrypt.hash(
            defaultPassword,
            10
        );

    // ==================================================
    // Create Teacher Profile
    // ==================================================

    const teacher =
        await Teacher.create({
            teacherNumber,
            firstName,
            middleName,
            lastName,
            gender,
            dateOfBirth,
            employmentType,
            email,
            phone,
            address,
            qualification,
            specialization,
            employmentDate,
            status: "Active",
            isActive: true,
        });

    // ==================================================
    // Create User Account
    // ==================================================

    const username =
        teacherNumber;

    const user =
        await User.create({
            fullName:
                [
                    firstName,
                    middleName,
                    lastName,
                ]
                    .filter(Boolean)
                    .join(" "),

            username,

            email:
                email
                    ? email.toLowerCase()
                    : undefined,

            password:
                hashedPassword,

            role: "teacher",

            teacher:
                teacher._id,

            mustChangePassword: true,

            isActive: true,
        });

    // ==================================================
    // Connect Teacher To User
    // ==================================================

    teacher.user = user._id;

    await teacher.save();

    // ==================================================
    // Return Teacher Information
    // ==================================================

    return {
        teacher,
        login: {
            username,
            defaultPassword,
            mustChangePassword:
                true,
        },
    };
};

// ======================================================
// Get All Teachers
// ======================================================

export const getTeachersService = async () => {
    return await Teacher.find()
        .populate(
            "user",
            "username email role isActive mustChangePassword lastLogin"
        )
        .sort({
            createdAt: -1,
        });
};

// ======================================================
// Get Teacher By ID
// ======================================================

export const getTeacherByIdService =    async (id) => {
        const teacher =
            await Teacher.findById(id)
                .populate(
                    "user",
                    "username email role isActive mustChangePassword lastLogin"
                );

        if (!teacher) {
            throw new Error(
                "Teacher not found."
            );
        }

        return teacher;
    };

// ======================================================
// Get Teacher By Teacher Number
// ======================================================

export const getTeacherByNumberService =    async (teacherNumber) => {
        const teacher =
            await Teacher.findOne({
                teacherNumber:
                    teacherNumber.toUpperCase(),
            }).populate(
                "user",
                "username email role isActive mustChangePassword lastLogin"
            );

        if (!teacher) {
            throw new Error(
                "Teacher not found."
            );
        }

        return teacher;
    };

// ======================================================
// Update Teacher
// ======================================================

export const updateTeacherService =    async (id, data) => {
        const teacher =
            await Teacher.findById(id);

        if (!teacher) {
            throw new Error(
                "Teacher not found."
            );
        }

        // ----------------------------------------------
        // Prevent changing teacher number manually
        // ----------------------------------------------

        delete data.teacherNumber;

        // ----------------------------------------------
        // Email check
        // ----------------------------------------------

        if (data.email) {
            const email =
                data.email.toLowerCase();

            const existingTeacher =
                await Teacher.findOne({
                    email,
                    _id: {
                        $ne: id,
                    },
                });

            if (existingTeacher) {
                throw new Error(
                    "A teacher with this email already exists."
                );
            }

            data.email = email;
        }

        // ----------------------------------------------
        // Handle Status
        // ----------------------------------------------

        if (data.status) {
            const allowedStatuses = [
                "Active",
                "Suspended",
                "Retired",
                "Resigned",
                "Terminated",
            ];

            if (
                !allowedStatuses.includes(
                    data.status
                )
            ) {
                throw new Error(
                    "Invalid teacher status."
                );
            }

            data.statusDate =
                new Date();

            // ------------------------------------------
            // Automatically update isActive
            // ------------------------------------------

            if (
                data.status === "Active"
            ) {
                data.isActive = true;
            } else {
                data.isActive = false;
            }
        }

        Object.assign(
            teacher,
            data
        );

        await teacher.save();

        // ==================================================
        // Synchronize User Account
        // ==================================================

        if (teacher.user) {
            const user =
                await User.findById(
                    teacher.user
                );

            if (user) {
                if (
                    data.email
                ) {
                    user.email =
                        data.email;
                }

                user.isActive =
                    teacher.isActive;

                await user.save();
            }
        }

        return teacher;
    };

// ======================================================
// Delete Teacher
// ======================================================

export const deleteTeacherService =    async (id) => {
        const teacher =
            await Teacher.findById(id);

        if (!teacher) {
            throw new Error(
                "Teacher not found."
            );
        }

        // ----------------------------------------------
        // Do not delete the User automatically.
        // We can deactivate it instead.
        // ----------------------------------------------

        if (teacher.user) {
            await User.findByIdAndUpdate(
                teacher.user,
                {
                    isActive: false,
                }
            );
        }

        await teacher.deleteOne();

        return teacher;
    };


    // ======================================================
// Get Own Teacher Profile
// Teacher
// ======================================================

export const getTeacherProfileService = async (userId) => {
    // --------------------------------------------------
    // 1. Find the logged-in user
    // --------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
        throw new Error(
            "User account not found."
        );
    }

    // --------------------------------------------------
    // 2. Make sure this is a teacher account
    // --------------------------------------------------

    if (user.role !== "teacher") {
        throw new Error(
            "This account is not a teacher account."
        );
    }

    // --------------------------------------------------
    // 3. Make sure user is linked to a teacher
    // --------------------------------------------------

    if (!user.teacher) {
        throw new Error(
            "Teacher profile is not linked to this account."
        );
    }

    // --------------------------------------------------
    // 4. Find the actual Teacher document
    // --------------------------------------------------

    const teacher =
        await Teacher.findById(user.teacher)
            .populate(
                "user",
                "-password"
            );

    if (!teacher) {
        throw new Error(
            "Teacher profile not found."
        );
    }

    // --------------------------------------------------
    // 5. Return teacher profile
    // --------------------------------------------------

    return teacher;
};

// ======================================================
// Get Teacher Dashboard
// Teacher
// ======================================================

export const getTeacherDashboardService = async (userId) => {
    // --------------------------------------------------
    // 1. Find logged-in user
    // --------------------------------------------------

    const user = await User.findById(userId)
        .select("-password");

    if (!user) {
        throw new Error(
            "User account not found."
        );
    }

    // --------------------------------------------------
    // 2. Verify teacher account
    // --------------------------------------------------

    if (user.role !== "teacher") {
        throw new Error(
            "This account is not a teacher account."
        );
    }

    // --------------------------------------------------
    // 3. Verify teacher link
    // --------------------------------------------------

    if (!user.teacher) {
        throw new Error(
            "Teacher profile is not linked to this account."
        );
    }

    // --------------------------------------------------
    // 4. Get teacher
    // --------------------------------------------------

    const teacher =
        await Teacher.findById(
            user.teacher
        );

    if (!teacher) {
        throw new Error(
            "Teacher profile not found."
        );
    }

    // --------------------------------------------------
    // 5. Return dashboard
    // --------------------------------------------------

    return {
        teacher: {
            id: teacher._id,
            teacherNumber:
                teacher.teacherNumber,
            fullName:
                teacher.fullName,
            specialization:
                teacher.specialization,
            employmentType:
                teacher.employmentType,
            status:
                teacher.status,
            isActive:
                teacher.isActive,
        },

        account: {
            username:
                user.username,
            email:
                user.email,
            role:
                user.role,
            mustChangePassword:
                user.mustChangePassword,
        },
    };
};