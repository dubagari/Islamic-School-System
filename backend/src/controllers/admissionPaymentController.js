
import {
    confirmCashPaymentService,
    initializePaystackPaymentService,
    verifyPaystackPaymentService,
} from "../services/admissionPaymentService.js";

// ======================================================
// Confirm Cash Payment
// ======================================================

export const confirmCashPaymentController =
    async (req, res, next) => {
        try {
            const { applicationId } =
                req.params;

            const {
                amount,
                paymentReference,
            } = req.body;

            // The authenticated admin should be
            // available through req.user
            const confirmedBy =
                req.user?.id || null;

            const application =
                await confirmCashPaymentService({
                    applicationId,
                    amount,
                    paymentReference,
                    confirmedBy,
                });

            res.status(200).json({
                success: true,
                message:
                    "Cash payment confirmed successfully.",
                data: application,
            });
        } catch (error) {
            next(error);
        }
    };


// ======================================================
// Initialize Paystack Payment
// ======================================================

export const initializePaystackPaymentController =
    async (req, res, next) => {
        try {
            const { applicationId } =
                req.params;

            const {
                amount,
                email,
            } = req.body;

            const payment =
                await initializePaystackPaymentService({
                    applicationId,
                    amount,
                    email,
                });

            res.status(200).json({
                success: true,
                message:
                    "Paystack payment initialized successfully.",
                data: payment,
            });
        } catch (error) {
            next(error);
        }
    };


// ======================================================
// Verify Paystack Payment
// ======================================================

export const verifyPaystackPaymentController =
    async (req, res, next) => {
        try {
            const {
                reference,
            } = req.body;

            const application =
                await verifyPaystackPaymentService({
                    reference,
                });

            res.status(200).json({
                success: true,
                message:
                    "Paystack payment verified successfully.",
                data: application,
            });
        } catch (error) {
            next(error);
        }
    };

