
import {
    createSubjectService,
    getSubjectsService,
    getSubjectByIdService,
    updateSubjectService,
    deleteSubjectService,
} from "../services/subjectService.js";


// ======================================================
// Create Subject
// ======================================================

export const createSubjectController = async (
    req,
    res,
    next
) => {

    try {

        const subject =
            await createSubjectService(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Subject created successfully.",
            data: subject,
        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get All Subjects
// ======================================================

export const getSubjectsController = async (
    req,
    res,
    next
) => {

    try {

        const subjects =
            await getSubjectsService();

        return res.status(200).json({
            success: true,
            data: subjects,
        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Subject By ID
// ======================================================

export const getSubjectByIdController = async (
    req,
    res,
    next
) => {

    try {

        const subject =
            await getSubjectByIdService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: subject,
        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Update Subject
// ======================================================

export const updateSubjectController = async (
    req,
    res,
    next
) => {

    try {

        const subject =
            await updateSubjectService(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Subject updated successfully.",
            data: subject,
        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Subject
// ======================================================

export const deleteSubjectController = async (
    req,
    res,
    next
) => {

    try {

        const subject =
            await deleteSubjectService(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Subject deleted successfully.",
            data: subject,
        });

    } catch (error) {

        next(error);

    }

};