
import {
    getAllStudentsService,
    getStudentByIdService,
    getStudentProfileService,
    getStudentDashboardService,
} from "../services/studentService.js";

// ======================================================
// Get All Students
// Admin
// ======================================================

export const getAllStudentsController =    async (req, res, next) => {
        try {
            const result =
                await getAllStudentsService(
                    req.validatedQuery || req.query
                );

            res.status(200).json({
                success: true,
                message:
                    "Students retrieved successfully.",
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Student By ID
// Admin
// ======================================================

export const getStudentByIdController =    async (req, res, next) => {
        try {
            const { studentId } = req.params;

            const student =
                await getStudentByIdService(
                    studentId
                );

            res.status(200).json({
                success: true,
                message:
                    "Student retrieved successfully.",
                data: student,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Own Student Profile
// Student
// ======================================================


export const getStudentProfileController =    async (req, res, next) => {
        try {
            const student =
                await getStudentProfileService(
                    req.user._id
                );

            res.status(200).json({
                success: true,
                message:
                    "Student profile retrieved successfully.",
                data: student,
            });
        } catch (error) {
            next(error);
        }
    };


// ======================================================
// Get Student Dashboard
// Student
// ======================================================

export const getStudentDashboardController =
    async (req, res, next) => {

        try {

            const dashboard =
                await getStudentDashboardService(
                    req.user._id
                );

            res.status(200).json({
                success: true,
                message:
                    "Student dashboard retrieved successfully.",
                data: dashboard,
            });

        } catch (error) {

            next(error);

        }
    };
