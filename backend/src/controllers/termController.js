import { createTermService } from "../services/termService.js";

export const createTerm = async (req, res) => {
    try {
        const term = await createTermService(req.body);

        res.status(201).json({
            success: true,
            message: "Academic term created successfully.",
            data: term,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};