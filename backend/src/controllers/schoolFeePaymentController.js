import {
    initializeSchoolFeePaymentService,
    verifySchoolFeePaymentService,
} from "../services/schoolFeePaymentService.js";

// ======================================================
// Initialize School Fee Payment
// ======================================================

export const initializeSchoolFeePaymentController = async (
    req,
    res,
    next
) => {
    try {
        const { invoiceId } = req.params;
        const { email } = req.body || {};

        const result =
            await initializeSchoolFeePaymentService({
                invoiceId,
                user: req.user,
                email,
            });

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
// Verify School Fee Payment
// ======================================================

export const verifySchoolFeePaymentController = async (
    req,
    res,
    next
) => {
    try {
        const { reference } = req.body || {};

        const result =
            await verifySchoolFeePaymentService({
                reference,
                user: req.user,
            });

        res.status(200).json({
            success: true,
            message: "Payment verified successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
