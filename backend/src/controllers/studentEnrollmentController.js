import {
    createStudentEnrollmentService,
    getAllStudentEnrollmentsService,
    getStudentEnrollmentByIdService,
    getStudentEnrollmentHistoryService,
    getCurrentStudentEnrollmentService,
    updateStudentEnrollmentService,
    deactivateStudentEnrollmentService,
} from "../services/studentEnrollmentService.js";

// ======================================================
// Create Student Enrollment
// Admin
// ======================================================

export const createStudentEnrollmentController =
    async (req, res, next) => {

        console.log("ENROLLMENT BODY:", req.body);
        try {
            const enrollment =
                await createStudentEnrollmentService(
                    req.body
                );

            res.status(201).json({
                success: true,
                message:
                    "Student enrolled successfully.",
                data: enrollment,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get All Student Enrollments
// Admin
// ======================================================

export const getAllStudentEnrollmentsController =
    async (req, res, next) => {
        try {
            const enrollments =
                await getAllStudentEnrollmentsService();

            res.status(200).json({
                success: true,
                message:
                    "Student enrollments retrieved successfully.",
                data: enrollments,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Student Enrollment By ID
// Admin
// ======================================================

export const getStudentEnrollmentByIdController =
    async (req, res, next) => {
        try {
            const { enrollmentId } =
                req.params;

            const enrollment =
                await getStudentEnrollmentByIdService(
                    enrollmentId
                );

            res.status(200).json({
                success: true,
                message:
                    "Student enrollment retrieved successfully.",
                data: enrollment,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Student Enrollment History
// Admin
// ======================================================

export const getStudentEnrollmentHistoryController =
    async (req, res, next) => {
        try {
            const { studentId } =
                req.params;

            const enrollments =
                await getStudentEnrollmentHistoryService(
                    studentId
                );

            res.status(200).json({
                success: true,
                message:
                    "Student enrollment history retrieved successfully.",
                data: enrollments,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Current Student Enrollment
// Admin
// ======================================================

export const getCurrentStudentEnrollmentController =
    async (req, res, next) => {
        try {
            const { studentId } =
                req.params;

            const enrollment =
                await getCurrentStudentEnrollmentService(
                    studentId
                );

            res.status(200).json({
                success: true,
                message:
                    "Current student enrollment retrieved successfully.",
                data: enrollment,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Update Student Enrollment
// Admin
// ======================================================

export const updateStudentEnrollmentController =
    async (req, res, next) => {
        try {
            const { enrollmentId } =
                req.params;

            const enrollment =
                await updateStudentEnrollmentService(
                    enrollmentId,
                    req.body
                );

            res.status(200).json({
                success: true,
                message:
                    "Student enrollment updated successfully.",
                data: enrollment,
            });
        } catch (error) {
            next(error);
        }
    };



// ======================================================
// Deactivate Student Enrollment
// Admin
// ======================================================

export const deactivateStudentEnrollmentController =
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const enrollment =
                await deactivateStudentEnrollmentService(
                    id
                );

            res.status(200).json({
                success: true,
                message:
                    "Student enrollment deactivated successfully.",
                data: enrollment,
            });
        } catch (error) {
            next(error);
        }
    };