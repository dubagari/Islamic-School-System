import {
    createAcademicSessionService,
    getAcademicSessionsService,
    getAcademicSessionByIdService,
    updateAcademicSessionService,
    deleteAcademicSessionService,
} from "../services/academicSessionService.js";

// ======================================================
// Create Academic Session
// ======================================================

export const createAcademicSessionController = async (
    req,
    res,
    next
) => {

    try {

        const academicSession =
            await createAcademicSessionService(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Academic session created successfully.",
            data: academicSession,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Get All Academic Sessions
// ======================================================

export const getAcademicSessionsController = async (
    req,
    res,
    next
) => {

    try {

        const academicSessions =
            await getAcademicSessionsService();

        return res.status(200).json({
            success: true,
            data: academicSessions,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Get Academic Session By ID
// ======================================================

export const getAcademicSessionByIdController = async (
    req,
    res,
    next
) => {

    try {

        const academicSession =
            await getAcademicSessionByIdService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: academicSession,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Update Academic Session
// ======================================================

export const updateAcademicSessionController = async (
    req,
    res,
    next
) => {

    try {

        const academicSession =
            await updateAcademicSessionService(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Academic session updated successfully.",
            data: academicSession,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Delete Academic Session
// ======================================================

export const deleteAcademicSessionController = async (
    req,
    res,
    next
) => {

    try {

        const academicSession =
            await deleteAcademicSessionService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Academic session deleted successfully.",
            data: academicSession,
        });

    } catch (error) {

        next(error);

    }

};