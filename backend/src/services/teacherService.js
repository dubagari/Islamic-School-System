import bcrypt from "bcryptjs";

import Teacher from "../models/Teacher.js";
import User from "../models/User.js";

import { generateNumber } from "../utils/generateNumber.js";


// ==============================
// Create Teacher
// ==============================
export const createTeacherService = async (teacherData) => {

    const {
        firstName,
        middleName,
        lastName,
        gender,
        dateOfBirth,
        phone,
        email,
        address,
        qualification,
        specialization,
        programme,
        employmentType,
        employmentDate,
        emergencyContactName,
        emergencyContactPhone,
        profilePhoto,
    } = teacherData;

    // Check email
    const existingTeacher = await Teacher.findOne({ email });

    if (existingTeacher) {
        throw new Error("Teacher with this email already exists.");
    }

    
    // Generate employee number
    const employeeNumber = await generateNumber("teacher", "T");

    // Create teacher first
    const teacher = await Teacher.create({
        employeeNumber,
        firstName,
        middleName,
        lastName,
        gender,
        dateOfBirth,
        phone,
        email,
        address,
        qualification,
        specialization,
        programme,
        employmentType,
        employmentDate,
        emergencyContactName,
        emergencyContactPhone,
        profilePhoto,
    });

    // Create login account
    const defaultPassword = "teacher123";

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

   const user = await User.create({
    fullName: `${firstName} ${middleName || ""} ${lastName}`.trim(),
    username: employeeNumber,
    email,
    password: hashedPassword,
    role: "teacher",
    teacher: teacher._id,
    mustChangePassword: true,
});

    // Link teacher to user
    teacher.user = user._id;

    await teacher.save();

   const populatedTeacher = await Teacher.findById(teacher._id)
    .populate("user", "-password");

return {
    teacher: populatedTeacher,
    loginCredentials: {
        username: employeeNumber,
        temporaryPassword: defaultPassword,
    },
};
};


// ==============================
// Get All Teachers
// ==============================
export const getAllTeachersService = async () => {

    return await Teacher.find()
        .populate("user", "-password")
        .sort({
            createdAt: -1,
        });

};


// ==============================
// Get Teacher By ID
// ==============================
export const getTeacherByIdService = async (id) => {

    const teacher = await Teacher.findById(id)
        .populate("user", "-password");

    if (!teacher) {
        throw new Error("Teacher not found.");
    }

    return teacher;

};


// ==============================
// Update Teacher
// ==============================
export const updateTeacherService = async (id, data) => {

    const teacher = await Teacher.findById(id);

    if (!teacher) {
        throw new Error("Teacher not found.");
    }

    // Prevent duplicate email
    if (data.email && data.email !== teacher.email) {

        const emailExists = await Teacher.findOne({
            email: data.email,
        });

        if (emailExists) {
            throw new Error("Email already exists.");
        }

        const userEmailExists = await User.findOne({
            email: data.email,
        });

        if (userEmailExists) {
            throw new Error("Email is already in use.");
        }

    }

    // Prevent duplicate phone
    if (data.phone && data.phone !== teacher.phone) {

        const phoneExists = await Teacher.findOne({
            phone: data.phone,
        });

        if (phoneExists) {
            throw new Error("Phone number already exists.");
        }

    }

    Object.assign(teacher, data);

    await teacher.save();

    // Update linked user email
    if (data.email) {

        await User.findByIdAndUpdate(
            teacher.user,
            {
                email: data.email,
            }
        );

    }

    return await Teacher.findById(id)
        .populate("user", "-password");

};


// ==============================
// Delete Teacher
// ==============================
export const deleteTeacherService = async (id) => {

    const teacher = await Teacher.findById(id);

    if (!teacher) {
        throw new Error("Teacher not found.");
    }

    // Delete user account
    if (teacher.user) {

        await User.findByIdAndDelete(
            teacher.user
        );

    }

    await teacher.deleteOne();

    return teacher;

};