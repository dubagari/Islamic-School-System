import { createClassService } from "../services/classService.js";

export const createClass = async (req, res) => {
    try {
        const schoolClass = await createClassService(req.body);

        res.status(201).json({
            success: true,
            message: "Class created successfully.",
            data: schoolClass,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};