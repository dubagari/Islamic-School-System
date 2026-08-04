import { createAcademicClassService, getAcademicClassesService } from "../services/academicClassService.js";

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





export const getAcademicClasses = async (req, res) => {
    try {

        const classes = await getAcademicClassesService();

        return res.status(200).json({
            success: true,
            data: classes,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};