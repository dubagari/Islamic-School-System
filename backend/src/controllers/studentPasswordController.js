import {
    resetStudentPasswordService,
} from "../services/studentPasswordService.js";

// ======================================================
// Admin - Reset Student Password
// ======================================================

export const resetStudentPasswordController =
    async (req, res, next) => {
        try {
            const { studentId } = req.params;

            const result =
                await resetStudentPasswordService(
                    studentId
                );

            res.status(200).json({
                success: true,
                message:
                    "Student password reset successfully.",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

