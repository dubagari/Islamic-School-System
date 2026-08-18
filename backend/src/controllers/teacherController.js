
import {
    createTeacherService,
    getTeachersService,
    getTeacherByIdService,
    getTeacherByNumberService,
    updateTeacherService,
    deleteTeacherService,
    getTeacherProfileService,
    getTeacherDashboardService,
} from "../services/teacherService.js";

// ======================================================
// Create Teacher
// ======================================================

export const createTeacherController =    async (req, res, next) => {
        try {
            const result =
                await createTeacherService(
                    req.body
                );

            res.status(201).json({
                success: true,
                message:
                    "Teacher created successfully.",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get All Teachers
// ======================================================

export const getTeachersController =    async (req, res, next) => {
        try {
            const teachers =
                await getTeachersService();

            res.status(200).json({
                success: true,
                data: teachers,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Teacher By ID
// ======================================================

export const getTeacherByIdController =    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            const teacher =
                await getTeacherByIdService(
                    id
                );

            res.status(200).json({
                success: true,
                data: teacher,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Teacher By Teacher Number
// ======================================================

export const getTeacherByNumberController =    async (req, res, next) => {
        try {
            const { teacherNumber } =
                req.params;

            const teacher =
                await getTeacherByNumberService(
                    teacherNumber
                );

            res.status(200).json({
                success: true,
                data: teacher,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Update Teacher
// ======================================================

export const updateTeacherController =    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            const teacher =
                await updateTeacherService(
                    id,
                    req.body
                );

            res.status(200).json({
                success: true,
                message:
                    "Teacher updated successfully.",
                data: teacher,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Delete Teacher
// ======================================================

export const deleteTeacherController =    async (req, res, next) => {
        try {
            const { id } =
                req.params;

            const teacher =
                await deleteTeacherService(
                    id
                );

            res.status(200).json({
                success: true,
                message: "Teacher deleted successfully.",
                data: teacher,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Own Teacher Profile
// Teacher
// ======================================================

export const getTeacherProfileController =    async (req, res, next) => {
        try {
            console.log("TEACHER PROFILE CONTROLLER:", req.user._id);

            const teacher = await getTeacherProfileService(req.user._id);

            console.log("TEACHER PROFILE RESULT:", teacher);

            res.status(200).json({
                success: true,
                message:
                    "Teacher profile retrieved successfully.",
                data: teacher,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Teacher Dashboard
// Teacher
// ======================================================

export const getTeacherDashboardController =    async (req, res, next) => {
        try {
            const dashboard =
                await getTeacherDashboardService(
                    req.user._id
                );

            res.status(200).json({
                success: true,
                message:
                    "Teacher dashboard retrieved successfully.",
                data: dashboard,
            });
        } catch (error) {
            next(error);
        }
    };