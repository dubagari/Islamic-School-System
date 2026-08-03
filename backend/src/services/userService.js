import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const createStudentAccount = async (student) => {
  // Check if an account already exists
  const existingUser = await User.findOne({
    username: student.registrationNumber,
  });

  if (existingUser) {
    throw new Error("Student account already exists.");
  }

  // Hash the default password
  const hashedPassword = await bcrypt.hash("password", 10);

  // Create the account
  const user = await User.create({
    fullName: `${student.firstName} ${student.middleName || ""} ${student.lastName}`.trim(),

    username: student.registrationNumber,

    email: student.email || null,

    password: hashedPassword,

    role: "student",

    student: student._id,

    mustChangePassword: true,
  });

  return {
    user,
    login: {
      username: user.username,
      temporaryPassword: "password",
    },
  };
};