import {
    createAcademicClassService,
    getAcademicClassesService,
    getAcademicClassesByLevelService,
    getAcademicClassByIdService,
    updateAcademicClassService,
    deleteAcademicClassService,
    assignStudentToAcademicClassService,
} from "../services/academicClassService.js";

// ======================================================
// Create Academic Class
// ======================================================

export const createAcademicClassController =    async (req, res, next) => {
        try {
            const academicClass = await createAcademicClassService(req.body);

            res.status(201).json({
                success: true,
                message:
                    "Academic class created successfully.",
                data: academicClass,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get All Academic Classes
// ======================================================

export const getAcademicClassesController =    async (req, res, next) => {
        try {
            const academicClasses = await getAcademicClassesService();

            res.status(200).json({
                success: true,
                data: academicClasses,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Academic Classes By Academic Level
// ======================================================

export const getAcademicClassesByLevelController =    async (req, res, next) => {
        try {
            const { academicLevel } = req.params;

            const academicClasses =
                await getAcademicClassesByLevelService(
                    academicLevel
                );

            res.status(200).json({
                success: true,
                data: academicClasses,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Academic Class By ID
// ======================================================

export const getAcademicClassByIdController =    async (req, res, next) => {
        try {
            const { id } = req.params;

            const academicClass =
                await getAcademicClassByIdService(
                    id
                );

            res.status(200).json({
                success: true,
                data: academicClass,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Update Academic Class
// ======================================================

export const updateAcademicClassController =    async (req, res, next) => {
        try {
            const { id } = req.params;

            const academicClass =
                await updateAcademicClassService(
                    id,
                    req.body
                );

            res.status(200).json({
                success: true,
                message:
                    "Academic class updated successfully.",
                data: academicClass,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Delete Academic Class
// ======================================================

export const deleteAcademicClassController =    async (req, res, next) => {
        try {
            const { id } = req.params;

            const academicClass =
                await deleteAcademicClassService(
                    id
                );

            res.status(200).json({
                success: true,
                message:
                    "Academic class deleted successfully.",
                data: academicClass,
            });
        } catch (error) {
            next(error);
        }
    };

    // ======================================================
// Assign Student To Academic Class
// Admin
// ======================================================

export const assignStudentToAcademicClassController =    async (req, res, next) => {

        try {

            const {
                studentId,
                academicClassId,
            } = req.body;

            if (
                !studentId ||
                !academicClassId
            ) {
                throw new Error(
                    "studentId and academicClassId are required."
                );
            }

            const student = await assignStudentToAcademicClassService(studentId, academicClassId);

            res.status(200).json({
                success: true,
                message:
                    "Student assigned to academic class successfully.",
                data: student,
            });

        } catch (error) {

            next(error);

        }
    };