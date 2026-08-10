
import {completeStudentRegistrationService} from "../services/studentRegistrationService.js";

// ======================================================
// Complete Student Registration
// ======================================================

export const completeStudentRegistrationController =
    async (req, res, next) => {
        try {
            const { applicationId } =
                req.params;

            const result =
                await completeStudentRegistrationService(
                    applicationId
                );

            res.status(201).json({
                success: true,
                message:
                    "Student registration completed successfully.",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
