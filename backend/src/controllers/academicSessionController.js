import {
    createAcademicSessionService,
    getAllAcademicSessionsService,
    getAcademicSessionByIdService,
    updateAcademicSessionService,
    deleteAcademicSessionService,
} from "../services/academicSessionService.js";

export const createAcademicSessionController = async (req, res, next) => {
    try {
        const session = await createAcademicSessionService(req.body);

        res.status(201).json({
            success: true,
            message: "Academic session created successfully.",
            data: session,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllAcademicSessionsController = async (req, res, next) => {
    try {
        const sessions = await getAllAcademicSessionsService();

        res.status(200).json({
            success: true,
            data: sessions,
        });
    } catch (error) {
        next(error);
    }
};

export const getAcademicSessionByIdController = async (req, res, next) => {
    try {
        const session = await getAcademicSessionByIdService(req.params.id);

        res.status(200).json({
            success: true,
            data: session,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAcademicSessionController = async (req, res, next) => {
    try {
        const session = await updateAcademicSessionService(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Academic session updated successfully.",
            data: session,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAcademicSessionController = async (req, res, next) => {
    try {
        const session = await deleteAcademicSessionService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Academic session deactivated successfully.",
            data: session,
        });
    } catch (error) {
        next(error);
    }
};