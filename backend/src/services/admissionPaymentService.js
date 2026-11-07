import AdmissionApplication from "../models/AdmissionApplication.js";
import SystemSetting from "../models/SystemSetting.js";

import { env } from "../config/env.js";
import { badRequest, conflict, notFound } from "../utils/AppError.js";
import { phoneMatchesApplication } from "./admissionApplicationService.js";
import { getSchoolFeeAmount } from "./financeService.js";
import { handleSchoolFeePaystackWebhookService } from "./schoolFeePaymentService.js";
import {
    completeStudentRegistrationService,
} from "./studentRegistrationService.js";

// ======================================================
// Helpers
// ======================================================

const isEmail = (value = "") =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const paystackHeaders = (secretKey) => ({
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
});

const paystackError = (response, result, fallback) =>
    badRequest(
        result?.message ||
            (response.ok ? fallback : `${fallback} (${response.status})`)
    );

const paystackCallbackUrl = () => {
    if (env.paystackCallbackUrl) {
        return env.paystackCallbackUrl.replace(/\/+$/, "");
    }

    const portalUrl = env.portalPublicUrl.replace(/\/+$/, "");
    if (!portalUrl) {
        return null;
    }

    return `${portalUrl}/admission-payment/callback`;
};

const serializePaymentApplication = (application) => ({
    _id: application._id,
    applicationNumber: application.applicationNumber,
    firstName: application.firstName,
    middleName: application.middleName,
    lastName: application.lastName,
    currentLevel: application.currentLevel,
    status: application.status,
    paymentStatus: application.paymentStatus,
    paymentMethod: application.paymentMethod,
    paymentReference: application.paymentReference,
    paymentAmount: application.paymentAmount,
    paidAt: application.paidAt,
    registrationNumber: application.registrationNumber,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
});

// ======================================================
// Confirm Cash Payment
// ======================================================

export const confirmCashPaymentService = async ({
    applicationId,
    amount,
    paymentReference,
    confirmedBy,
}) => {
    const application =
        await AdmissionApplication.findById(applicationId);

    if (!application) {
        throw notFound("Admission application not found.");
    }

    if (application.status !== "Approved") {
        throw badRequest(
            "Admission application must be approved before payment."
        );
    }

    if (application.paymentStatus === "Paid") {
        throw conflict("Admission payment has already been completed.");
    }

    if (!amount || amount <= 0) {
        throw badRequest("A valid payment amount is required.");
    }

    application.paymentStatus = "Paid";
    application.paymentMethod = "Cash";
    application.paymentReference =
        paymentReference || `CASH-${Date.now()}`;
    application.paymentAmount = amount;
    application.paidAt = new Date();
    application.paymentConfirmedBy = confirmedBy || null;

    await application.save();

    return application;
};

// ======================================================
// Public application lookup
// ======================================================

export const getAdmissionPaymentSummaryService = async ({
    applicationNumber,
    phone,
}) => {
    const application = await AdmissionApplication.findOne({
        applicationNumber,
    });

    if (!application || !phoneMatchesApplication(application, phone)) {
        throw notFound(
            "Application not found or phone number does not match."
        );
    }

    // The amount due is always the currently configured admission fee;
    // application.paymentAmount only exists after an initialization and
    // would otherwise show as 0 before payment.
    const feeAmount = await getAdmissionFeeAmount();

    // Expected school fee (SystemSetting school.fee) so applicants can see
    // what they will owe after registration.
    const schoolFee = await getSchoolFeeAmount();

    return {
        application: serializePaymentApplication(application),
        feeAmount,
        schoolFee,
        emailRequired: !(
            application.email?.trim() || application.parentEmail?.trim()
        ),
    };
};

// ======================================================
// Public admission letter download (paid applications only)
// ======================================================

export const getAdmissionLetterByPhoneService = async ({
    applicationNumber,
    phone,
}) => {
    const application = await AdmissionApplication.findOne({
        applicationNumber,
    });

    if (!application || !phoneMatchesApplication(application, phone)) {
        throw notFound(
            "Application not found or phone number does not match."
        );
    }

    if (application.status !== "Approved") {
        throw badRequest(
            "This application has not been approved for admission."
        );
    }

    if (application.paymentStatus !== "Paid") {
        throw badRequest(
            "The admission letter unlocks once the admission fee is paid."
        );
    }

    return application;
};

// ======================================================
// Initialize Paystack Payment
// ======================================================

export const initializePaystackPaymentService = async ({
    applicationNumber,
    phone,
    email,
}) => {
    const application = await AdmissionApplication.findOne({
        applicationNumber,
    });

    if (!application || !phoneMatchesApplication(application, phone)) {
        throw notFound(
            "Application not found or phone number does not match."
        );
    }

    if (application.status !== "Approved") {
        throw badRequest(
            "Admission application must be approved before payment."
        );
    }

    if (application.paymentStatus === "Paid") {
        throw conflict("Admission payment has already been completed.");
    }

    if (application.registrationNumber) {
        throw conflict("This applicant is already registered.");
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
        throw badRequest(
            "PAYSTACK_SECRET_KEY is not configured. Set it in the backend environment."
        );
    }

    const fee = await getAdmissionFeeAmount();
    if (!fee || fee <= 0) {
        throw badRequest(
            "Admission fee is not configured. Add an admission.fee system setting."
        );
    }

    const customerEmail = application.email || application.parentEmail || email;
    if (!isEmail(customerEmail ?? "")) {
        throw badRequest(
            "A valid Paystack email is required. Add an email to the application or provide one on the payment page."
        );
    }

    const amount = Number(fee);
    const callbackUrl = paystackCallbackUrl();
    if (!callbackUrl) {
        throw badRequest(
            "A Paystack callback URL is not configured. Set PORTAL_PUBLIC_URL or PAYSTACK_CALLBACK_URL."
        );
    }

    const response = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
            method: "POST",
            headers: paystackHeaders(secret),
            body: JSON.stringify({
                email: customerEmail.trim(),
                amount: Math.round(amount * 100),
                currency: "NGN",
                callback_url: callbackUrl,
                metadata: {
                    purpose: "admission",
                    applicationId: application._id.toString(),
                    applicationNumber: application.applicationNumber,
                },
            }),
        }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
        if (result?.message === "Email is required.") {
            throw badRequest(
                "A valid email is required to start the Paystack payment."
            );
        }
        throw paystackError(response, result, "Unable to initialize Paystack payment.");
    }

    const paymentData = result.data;
    application.paymentStatus = application.paymentStatus;
    application.paymentMethod = "Paystack";
    application.paymentReference = paymentData.reference;
    application.paymentAmount = amount;
    await application.save();

    return {
        applicationNumber: application.applicationNumber,
        amount,
        reference: paymentData.reference,
        accessCode: paymentData.access_code,
        authorizationUrl: paymentData.authorization_url,
    };
};

// ======================================================
// Admission fee configuration
// ======================================================

export const getAdmissionFeeAmount = async () => {
    const setting = await SystemSetting.findOne({ key: "admission.fee" });

    if (!setting) {
        return 0;
    }

    const value =
        typeof setting.value === "number"
            ? setting.value
            : Number(setting.value);

    return Number.isFinite(value) ? Math.max(0, value) : 0;
};

// ======================================================
// Mark Paystack payment as paid
// ======================================================

const markPaystackPaymentPaid = async ({ application, transaction }) => {
    if (application.paymentStatus === "Paid") {
        return application;
    }

    const transactionAmount =
        Number(transaction.requested_amount || transaction.amount) > 0
            ? Number(transaction.requested_amount || transaction.amount) / 100
            : 0;

    const expectedAmount = application.paymentAmount || 0;
    if (Number.isFinite(expectedAmount) && expectedAmount > 0) {
        const pad = (value) => Number(value.toFixed(2));
        if (pad(transactionAmount) !== pad(expectedAmount)) {
            throw badRequest(
                "The Paystack transaction amount does not match the admission fee."
            );
        }
    }

    application.paymentStatus = "Paid";
    application.paymentMethod = "Paystack";
    application.paymentReference = transaction.reference;
    application.paymentAmount = transactionAmount || application.paymentAmount;
    application.paidAt =
        transaction.paid_at ? new Date(transaction.paid_at) : new Date();
    application.paymentConfirmedBy = null;

    await application.save();
    return application;
};

// ======================================================
// Verify Paystack payment with phone confirmation
// ======================================================

export const verifyPaystackPaymentService = async ({
    reference,
    phone,
}) => {
    if (!reference || !phone) {
        throw badRequest("Payment reference and phone are required.");
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
        throw badRequest("PAYSTACK_SECRET_KEY is not configured.");
    }

    const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
            reference
        )}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${secret}`,
            },
        }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
        throw paystackError(
            response,
            result,
            "Unable to verify the Paystack payment."
        );
    }

    const transaction = result.data;
    if (transaction.status !== "success") {
        throw badRequest(
            `Payment was not successful. Current status: ${transaction.status}`
        );
    }

    const application =
        (await AdmissionApplication.findOne({
            paymentReference: transaction.reference,
        })) ||
        (await AdmissionApplication.findOne({
            _id: transaction.metadata?.applicationId,
        }));

    if (!application) {
        throw notFound(
            "Could not match a Paystack payment to an admission application."
        );
    }

    if (!phoneMatchesApplication(application, phone)) {
        throw notFound(
            "This payment does not belong to the supplied application phone."
        );
    }

    const paid = await markPaystackPaymentPaid({ application, transaction });

    // The account is auto-created without exposing login credentials in
    // the public response; only admins can view the generated credentials.
    if (!paid.registrationNumber) {
        await completeStudentRegistrationService(paid._id).catch((error) => {
            console.error(
                "Paystack payment succeeded but registration failed:",
                error?.message || error
            );
        });
    }

    const refreshed = await AdmissionApplication.findById(paid._id);

    return {
        application: serializePaymentApplication(refreshed || paid),
    };
};

// ======================================================
// Paystack webhook
// ======================================================

export const handlePaystackWebhookService = async (event) => {    if (event?.event !== "charge.success") {
        return null;
    }

    const transaction = event.data;
    if (!transaction || transaction.status !== "success") {
        return null;
    }

    // School fee transactions share the webhook route.
    if (transaction.metadata?.purpose === "school_fee") {
        return handleSchoolFeePaystackWebhookService(event);
    }

    const application =
        (await AdmissionApplication.findOne({
            paymentReference: transaction.reference,
        })) ||
        (await AdmissionApplication.findOne({
            _id: transaction.metadata?.applicationId,
        }));

    if (!application) {
        return null;
    }

    if (application.status !== "Approved") {
        return null;
    }

    const paid = await markPaystackPaymentPaid({ application, transaction });

    if (!paid.registrationNumber) {
        await completeStudentRegistrationService(paid._id).catch((error) => {
            console.error(
                "Paystack webhook payment succeeded but registration failed:",
                error?.message || error
            );
        });
    }

    return AdmissionApplication.findById(paid._id);
};
