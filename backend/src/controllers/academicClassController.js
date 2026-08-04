import { createAcademicClassService } from "../services/academicClassService.js";

export const createAcademicClass = async (req, res) => {
  try {
    const academicClass = await createAcademicClassService(req.body);

    return res.status(201).json({
      success: true,
      message: "Academic class created successfully.",
      data: academicClass,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};