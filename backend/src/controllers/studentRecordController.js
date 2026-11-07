import {
    createStudentRecordService,
    getAllStudentRecordsService,
    getStudentRecordByIdService,
    getStudentRecordHistoryService,
    updateStudentRecordService,
    deactivateStudentRecordService,
} from "../services/studentRecordService.js";

// ======================================================
// Create Student Record
// Admin
// ======================================================

export const createStudentRecordController =
    async (req, res, next) => {
        try {
            const record =
                await createStudentRecordService(
                    req.body,
                    req.user._id
                );

            res.status(201).json({
                success: true,
                message:
                    "Student record created successfully.",
                data: record,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get All Student Records
// Admin
// ======================================================

export const getAllStudentRecordsController =
    async (req, res, next) => {
        try {
            const result =
                await getAllStudentRecordsService(
                    req.validatedQuery || req.query
                );

            res.status(200).json({
                success: true,
                message:
                    "Student records retrieved successfully.",
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Student Record By ID
// Admin
// ======================================================

export const getStudentRecordByIdController =
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const record =
                await getStudentRecordByIdService(
                    id
                );

            res.status(200).json({
                success: true,
                message:
                    "Student record retrieved successfully.",
                data: record,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Student Record History
// Admin
// ======================================================

export const getStudentRecordHistoryController =
    async (req, res, next) => {
        try {
            const { studentId } =
                req.params;

            const records =
                await getStudentRecordHistoryService(
                    studentId
                );

            res.status(200).json({
                success: true,
                message:
                    "Student record history retrieved successfully.",
                data: records,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Update Student Record
// Admin
// ======================================================

export const updateStudentRecordController =
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const record =
                await updateStudentRecordService(
                    id,
                    req.body
                );

            res.status(200).json({
                success: true,
                message:
                    "Student record updated successfully.",
                data: record,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Deactivate Student Record
// Admin
// ======================================================

export const deactivateStudentRecordController =
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const record =
                await deactivateStudentRecordService(
                    id
                );

            res.status(200).json({
                success: true,
                message:
                    "Student record deactivated successfully.",
                data: record,
            });
        } catch (error) {
            next(error);
        }
    };