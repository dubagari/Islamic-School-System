import {
    createSubjectService,
    getAllSubjectsService,
    getSubjectByIdService,
    updateSubjectService,
    deleteSubjectService,
} from "../services/subjectService.js";

export const createSubjectController = async (req, res, next) => {
    try {
        const subject = await createSubjectService(req.body);

        res.status(201).json({
            success: true,
            message: "Subject created successfully.",
            data: subject,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllSubjectsController = async (req, res, next) => {
    try {
        const subjects = await getAllSubjectsService();

        res.status(200).json({
            success: true,
            data: subjects,
        });
    } catch (error) {
        next(error);
    }
};

export const getSubjectByIdController = async (req, res, next) => {
    try {
        const subject = await getSubjectByIdService(req.params.id);

        res.status(200).json({
            success: true,
            data: subject,
        });
    } catch (error) {
        next(error);
    }
};

export const updateSubjectController = async (req, res, next) => {
    try {
        const subject = await updateSubjectService(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Subject updated successfully.",
            data: subject,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteSubjectController = async (req, res, next) => {
    try {
        const subject = await deleteSubjectService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Subject deactivated successfully.",
            data: subject,
        });
    } catch (error) {
        next(error);
    }
};