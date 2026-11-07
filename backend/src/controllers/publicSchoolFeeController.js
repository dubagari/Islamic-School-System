import {
    initializePublicSchoolFeePaymentService,
    lookupPublicSchoolFeeSummaryService,
    verifyPublicSchoolFeePaymentService,
} from "../services/publicSchoolFeeService.js";

// ======================================================
// Public school-fee lookup
// ======================================================

export const lookupPublicSchoolFeeSummaryController = async (
    req,
    res,
    next
) => {
    try {
        const result = await lookupPublicSchoolFeeSummaryService(req.body);

        res.status(200).json({
            success: true,
            message: "School fee summary retrieved successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Public school-fee Paystack initialization
// ======================================================

export const initializePublicSchoolFeePaymentController = async (
    req,
    res,
    next
) => {
    try {
        const result = await initializePublicSchoolFeePaymentService(
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Paystack payment initialized.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Public school-fee Paystack verification
// ======================================================

export const verifyPublicSchoolFeePaymentController = async (
    req,
    res,
    next
) => {
    try {
        const result = await verifyPublicSchoolFeePaymentService(req.body);

        res.status(200).json({
            success: true,
            message: "Payment verified successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
