import crypto from "node:crypto";

import { buildAdmissionLetterPdf } from "../services/admissionPdfService.js";
import { getSchoolFeeAmount } from "../services/financeService.js";
import {
    confirmCashPaymentService,
    getAdmissionLetterByPhoneService,
    getAdmissionPaymentSummaryService,
    handlePaystackWebhookService,
    initializePaystackPaymentService,
    verifyPaystackPaymentService,
} from "../services/admissionPaymentService.js";

// ======================================================
// Public application payment summary
// ======================================================

export const getAdmissionPaymentSummaryController = async (
    req,
    res,
    next
) => {
    try {
        const { applicationNumber } = req.params;
        const { phone } = req.validatedQuery || req.query;

        const summary = await getAdmissionPaymentSummaryService({
            applicationNumber,
            phone,
        });

        res.status(200).json({
            success: true,
            message: "Admission payment summary retrieved successfully.",
            data: summary,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Public admission letter download (paid applications only)
// ======================================================

const sendAdmissionLetterPdf = (res, application, pdf) => {
    const safeNumber = String(
        application.applicationNumber || "admission-letter"
    ).replace(/[^A-Za-z0-9]+/g, "-");

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="admission-letter-${safeNumber}.pdf"`,
        "Content-Length": pdf.length,
        "Cache-Control": "no-store",
    });

    res.send(pdf);
};

export const getAdmissionPaymentLetterController = async (
    req,
    res,
    next
) => {
    try {
        const { applicationNumber } = req.params;
        const { phone } = req.validatedQuery || req.query;

        const application = await getAdmissionLetterByPhoneService({
            applicationNumber,
            phone: String(phone ?? ""),
        });

        const schoolFee = await getSchoolFeeAmount();

        const pdf = await buildAdmissionLetterPdf(application, {
            schoolFee,
        });

        sendAdmissionLetterPdf(res, application, pdf);
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Confirm Cash Payment
// ======================================================

export const confirmCashPaymentController = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const { amount, paymentReference } = req.body;

        const confirmedBy = req.user?._id || null;

        const application = await confirmCashPaymentService({
            applicationId,
            amount,
            paymentReference,
            confirmedBy,
        });

        res.status(200).json({
            success: true,
            message: "Cash payment confirmed successfully.",
            data: application,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Initialize Paystack Payment
// ======================================================

export const initializePaystackPaymentController = async (
    req,
    res,
    next
) => {
    try {
        const {
            applicationNumber,
            phone,
            email,
        } = req.body;

        const payment = await initializePaystackPaymentService({
            applicationNumber,
            phone,
            email,
        });

        res.status(200).json({
            success: true,
            message: "Paystack payment initialized successfully.",
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Verify Paystack Payment
// ======================================================

export const verifyPaystackPaymentController = async (req, res, next) => {
    try {
        const { reference, phone } = req.body;

        const result = await verifyPaystackPaymentService({
            reference,
            phone,
        });

        res.status(200).json({
            success: true,
            message: "Paystack payment verified successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Paystack Webhook
// ======================================================

export const paystackWebhookController = async (req, res, next) => {
    try {
        const signature = req.get("x-paystack-signature") || "";
        const secret = process.env.PAYSTACK_SECRET_KEY;

        if (!secret) {
            return res.status(503).json({
                success: false,
                message: "Paystack is not configured.",
            });
        }

        const rawBody = req.rawBody;

        if (!rawBody) {
            return res.status(400).json({
                success: false,
                message: "Missing raw webhook payload.",
            });
        }

        const expectedSignature = crypto
            .createHmac("sha512", secret)
            .update(rawBody)
            .digest("hex");

        const signatureBuffer = Buffer.from(signature, "utf8");
        const expectedBuffer = Buffer.from(expectedSignature, "utf8");

        if (
            signatureBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid Paystack webhook signature.",
            });
        }

        const event = req.body;
        await handlePaystackWebhookService(event);

        res.status(200).json({
            success: true,
            message: "Paystack webhook processed.",
        });
    } catch (error) {
        next(error);
    }
};
