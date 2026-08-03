import { createAcademicSectionService } from "../services/academicSectionService.js";

export const createAcademicSection = async (req, res) => {

    try {

        const section = await createAcademicSectionService(req.body);

        res.status(201).json({
            success: true,
            message: "Academic section created successfully.",
            data: section,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};