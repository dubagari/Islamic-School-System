
import {
    createTeacherAssignmentService,
    getTeacherAssignmentsService,
    getTeacherAssignmentsByTeacherService,
    getTeacherAssignmentByIdService,
    updateTeacherAssignmentService,
    deleteTeacherAssignmentService,
} from "../services/teacherAssignmentService.js";

// ======================================================
// Create Teacher Assignment
// ======================================================

export const createTeacherAssignmentController =
    async (req, res, next) => {
        try {
            const assignment =
                await createTeacherAssignmentService(
                    req.body
                );

            res.status(201).json({
                success: true,
                message:
                    "Teacher assigned successfully.",
                data: assignment,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get All Teacher Assignments
// ======================================================

export const getTeacherAssignmentsController =
    async (req, res, next) => {
        try {
            const assignments =
                await getTeacherAssignmentsService();

            res.status(200).json({
                success: true,
                data: assignments,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Assignments By Teacher
// ======================================================

export const getTeacherAssignmentsByTeacherController =
    async (req, res, next) => {
        try {
            const { teacher } =
                req.params;

            const assignments =
                await getTeacherAssignmentsByTeacherService(
                    teacher
                );

            res.status(200).json({
                success: true,
                data: assignments,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Assignment By ID
// ======================================================

export const getTeacherAssignmentByIdController =
    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            const assignment =
                await getTeacherAssignmentByIdService(
                    id
                );

            res.status(200).json({
                success: true,
                data: assignment,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Update Teacher Assignment
// ======================================================

export const updateTeacherAssignmentController =
    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            const assignment =
                await updateTeacherAssignmentService(
                    id,
                    req.body
                );

            res.status(200).json({
                success: true,
                message:
                    "Teacher assignment updated successfully.",
                data: assignment,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Delete Teacher Assignment
// ======================================================

export const deleteTeacherAssignmentController =
    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            const assignment =
                await deleteTeacherAssignmentService(
                    id
                );

            res.status(200).json({
                success: true,
                message:
                    "Teacher assignment deleted successfully.",
                data: assignment,
            });
        } catch (error) {
            next(error);
        }
    };

