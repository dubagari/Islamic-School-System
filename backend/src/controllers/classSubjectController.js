import {
    assignSubjectsToClassService,
    getAllClassSubjectsService,
    getClassSubjectByIdService,
    getClassSubjectsByClassService,
    updateClassSubjectService,
    deleteClassSubjectService,
} from "../services/classSubjectService.js";

// ======================================================
// Create Controllers
// ======================================================

export const assignSubjectsToClassController = async (
    req,
    res,
    next
) => {

    try {

        const assignments =
            await assignSubjectsToClassService(req.body);

        return res.status(201).json({
            success: true,
            message: "Subjects assigned to class successfully.",
            data: assignments,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Read Controllers
// ======================================================

export const getAllClassSubjectsController = async (
    req,
    res,
    next
) => {

    try {

        const assignments =
            await getAllClassSubjectsService();

        return res.status(200).json({
            success: true,
            data: assignments,
        });

    } catch (error) {

        next(error);

    }

};

export const getClassSubjectByIdController = async (
    req,
    res,
    next
) => {

    try {

        const assignment =
            await getClassSubjectByIdService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: assignment,
        });

    } catch (error) {

        next(error);

    }

};

export const getClassSubjectsByClassController = async (
    req,
    res,
    next
) => {

    try {

        const assignments =
            await getClassSubjectsByClassService(
                req.params.academicClassId
            );

        return res.status(200).json({
            success: true,
            data: assignments,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Update Controllers
// ======================================================

export const updateClassSubjectController = async (
    req,
    res,
    next
) => {

    try {

        const assignment =
            await updateClassSubjectService(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Class subject updated successfully.",
            data: assignment,
        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Delete Controllers
// ======================================================

export const deleteClassSubjectController = async (
    req,
    res,
    next
) => {

    try {

        const assignment =
            await deleteClassSubjectService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Class subject deleted successfully.",
            data: assignment,
        });

    } catch (error) {

        next(error);

    }

};