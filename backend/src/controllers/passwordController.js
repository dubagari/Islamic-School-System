import { changePasswordService } from "../services/passwordService.js";

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await changePasswordService(
      req.user.id,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};