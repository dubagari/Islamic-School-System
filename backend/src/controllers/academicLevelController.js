import {
    createAcademicLevelService,
    getAcademicLevelsService,
    getAcademicLevelByIdService,
    updateAcademicLevelService,
    deleteAcademicLevelService,
} from "../services/academicLevelService.js";


// ======================================================
// Create Academic Level
// ======================================================

export const createAcademicLevelController = async (
    req,
    res,
    next
) => {

    try {

        const academicLevel =
            await createAcademicLevelService(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Academic level created successfully.",
            data: academicLevel,
        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get All Academic Levels
// ======================================================

export const getAcademicLevelsController = async (
    req,
    res,
    next
) => {

    try {

        const academicLevels =
            await getAcademicLevelsService();

        return res.status(200).json({
            success: true,
            data: academicLevels,
        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Academic Level By ID
// ======================================================

export const getAcademicLevelByIdController = async (
    req,
    res,
    next
) => {

    try {

        const academicLevel =
            await getAcademicLevelByIdService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: academicLevel,
        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Update Academic Level
// ======================================================

export const updateAcademicLevelController = async (
    req,
    res,
    next
) => {

    try {

        const academicLevel =
            await updateAcademicLevelService(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Academic level updated successfully.",
            data: academicLevel,
        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Academic Level
// ======================================================

export const deleteAcademicLevelController = async (
    req,
    res,
    next
) => {

    try {

        const academicLevel =
            await deleteAcademicLevelService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Academic level deleted successfully.",
            data: academicLevel,
        });

    } catch (error) {

        next(error);

    }

};