import { createSubjectService } from "../services/subjectService.js";


export const createSubject = async (req, res) => {
    try {

        const subject = await createSubjectService(req.body);

        return res.status(201).json({
            success: true,
            message: "Subject created successfully.",
            data: subject,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};