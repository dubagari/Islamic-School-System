import {
    createAcademicSectionService,
    getAcademicSectionsService,
    getAcademicSectionByIdService,
    updateAcademicSectionService,
    deleteAcademicSectionService,
} from "../services/academicSectionService.js";

// ======================================================
// Create Academic Section
// ======================================================

export const createAcademicSectionController = async (
    req,
    res,
    next
) => {

    try {

        const academicSection =
            await createAcademicSectionService(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Academic section created successfully.",
            data: academicSection,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Get All Academic Sections
// ======================================================

export const getAcademicSectionsController = async (
    req,
    res,
    next
) => {

    try {

        const academicSections =
            await getAcademicSectionsService();

        return res.status(200).json({
            success: true,
            data: academicSections,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Get Academic Section By ID
// ======================================================

export const getAcademicSectionByIdController = async (
    req,
    res,
    next
) => {

    try {

        const academicSection =
            await getAcademicSectionByIdService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: academicSection,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Update Academic Section
// ======================================================

export const updateAcademicSectionController = async (
    req,
    res,
    next
) => {

    try {

        const academicSection =
            await updateAcademicSectionService(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Academic section updated successfully.",
            data: academicSection,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Delete Academic Section
// ======================================================

export const deleteAcademicSectionController = async (
    req,
    res,
    next
) => {

    try {

        const academicSection =
            await deleteAcademicSectionService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Academic section deleted successfully.",
            data: academicSection,
        });

    } catch (error) {

        next(error);

    }

};