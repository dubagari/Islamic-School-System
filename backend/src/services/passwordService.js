import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const changePasswordService = async (userId,currentPassword,newPassword) => {
  // Find the user
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new Error("Current password is incorrect.");
  }

  const samePassword = await bcrypt.compare(newPassword, user.password);

if (samePassword) {
    throw new Error("New password must be different from the current password.");
}

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user
  user.password = hashedPassword;
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();

  await user.save();

  return {
    mustChangePassword: user.mustChangePassword,
  };
};