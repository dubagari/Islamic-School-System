import {
    createClassSubjectService,
    getClassSubjectsService,
    getClassSubjectsBySectionService,
    getClassSubjectByIdService,
    updateClassSubjectService,
    deleteClassSubjectService,
} from "../services/classSubjectService.js";

// ======================================================
// Create Class Subject
// ======================================================

export const createClassSubjectController =
    async (req, res, next) => {
        try {
            const classSubject =
                await createClassSubjectService(
                    req.body
                );

            res.status(201).json({
                success: true,
                message:
                    "Class subject created successfully.",
                data: classSubject,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get All Class Subjects
// ======================================================

export const getClassSubjectsController =
    async (req, res, next) => {
        try {
            const classSubjects =
                await getClassSubjectsService();

            res.status(200).json({
                success: true,
                data: classSubjects,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Class Subjects By Section
// ======================================================

export const getClassSubjectsBySectionController =
    async (req, res, next) => {
        try {
            const { section } =
                req.params;

            const classSubjects =
                await getClassSubjectsBySectionService(
                    section
                );

            res.status(200).json({
                success: true,
                data: classSubjects,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Class Subject By ID
// ======================================================

export const getClassSubjectByIdController =
    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            const classSubject =
                await getClassSubjectByIdService(
                    id
                );

            res.status(200).json({
                success: true,
                data: classSubject,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Update Class Subject
// ======================================================

export const updateClassSubjectController =
    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            const classSubject =
                await updateClassSubjectService(
                    id,
                    req.body
                );

            res.status(200).json({
                success: true,
                message:
                    "Class subject updated successfully.",
                data: classSubject,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Delete Class Subject
// ======================================================

export const deleteClassSubjectController =
    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            const classSubject =
                await deleteClassSubjectService(
                    id
                );

            res.status(200).json({
                success: true,
                message:
                    "Class subject deleted successfully.",
                data: classSubject,
            });
        } catch (error) {
            next(error);
        }
    };