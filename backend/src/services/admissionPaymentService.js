import AdmissionApplication from "../models/AdmissionApplication.js";

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
        await AdmissionApplication.findById(
            applicationId
        );

    if (!application) {
        throw new Error(
            "Admission application not found."
        );
    }

    if (application.status !== "Approved") {
        throw new Error(
            "Admission application must be approved before payment."
        );
    }

    if (application.paymentStatus === "Paid") {
        throw new Error(
            "Admission payment has already been completed."
        );
    }

    if (!amount || amount <= 0) {
        throw new Error(
            "A valid payment amount is required."
        );
    }

    application.paymentStatus = "Paid";

    application.paymentMethod = "Cash";

    application.paymentReference =
        paymentReference ||
        `CASH-${Date.now()}`;

    application.paymentAmount = amount;

    application.paidAt = new Date();

    application.paymentConfirmedBy =
        confirmedBy || null;

    await application.save();

    return application;
};


// ======================================================
// Initialize Paystack Payment
// ======================================================

export const initializePaystackPaymentService =
    async ({
        applicationId,
        amount,
        email,
    }) => {

        const application =
            await AdmissionApplication.findById(
                applicationId
            );

        if (!application) {
            throw new Error(
                "Admission application not found."
            );
        }

        if (application.status !== "Approved") {
            throw new Error(
                "Admission application must be approved before payment."
            );
        }

        if (application.paymentStatus === "Paid") {
            throw new Error(
                "Admission payment has already been completed."
            );
        }

        if (!amount || amount <= 0) {
            throw new Error(
                "A valid payment amount is required."
            );
        }

        const paystackSecretKey =
            process.env.PAYSTACK_SECRET_KEY;

        if (!paystackSecretKey) {
            throw new Error(
                "PAYSTACK_SECRET_KEY is not configured."
            );
        }

        const customerEmail =
            email || application.email;

        if (!customerEmail) {
            throw new Error(
                "A valid email address is required for Paystack payment."
            );
        }

        // Paystack expects amount in kobo
        const amountInKobo =
            Math.round(amount * 100);

        const response =
            await fetch(
                "https://api.paystack.co/transaction/initialize",
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${paystackSecretKey}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        email:
                            customerEmail,

                        amount:
                            amountInKobo,

                        metadata: {
                            applicationId:
                                application._id.toString(),

                            applicationNumber:
                                application.applicationNumber,
                        },
                    }),
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.status
        ) {
            throw new Error(
                result.message ||
                "Unable to initialize Paystack payment."
            );
        }

        const paymentData =
            result.data;

        // Save the Paystack reference
        // but DO NOT mark payment as paid yet.
        application.paymentMethod =
            "Paystack";

        application.paymentReference =
            paymentData.reference;

        application.paymentAmount =
            amount;

        await application.save();

        return {
            authorizationUrl:
                paymentData.authorization_url,

            accessCode:
                paymentData.access_code,

            reference:
                paymentData.reference,

            amount,

            applicationNumber:
                application.applicationNumber,
        };
    };


// ======================================================
// Verify Paystack Payment
// ======================================================

export const verifyPaystackPaymentService =
    async ({
        reference,
    }) => {

        if (!reference) {
            throw new Error(
                "Paystack payment reference is required."
            );
        }

        const paystackSecretKey =
            process.env.PAYSTACK_SECRET_KEY;

        if (!paystackSecretKey) {
            throw new Error(
                "PAYSTACK_SECRET_KEY is not configured."
            );
        }

        const response =
            await fetch(
                `https://api.paystack.co/transaction/verify/${encodeURIComponent(
                    reference
                )}`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${paystackSecretKey}`,
                    },
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.status
        ) {
            throw new Error(
                result.message ||
                "Unable to verify Paystack payment."
            );
        }

        const transaction =
            result.data;

        // --------------------------------------------------
        // Only successful transactions are accepted
        // --------------------------------------------------

        if (
            transaction.status !==
            "success"
        ) {
            throw new Error(
                `Payment was not successful. Current status: ${transaction.status}`
            );
        }

        // --------------------------------------------------
        // Find admission application
        // --------------------------------------------------

        const application =
            await AdmissionApplication.findOne({
                paymentReference:
                    transaction.reference,
            });

        if (!application) {
            throw new Error(
                "Admission application associated with this payment was not found."
            );
        }

        if (
            application.status !==
            "Approved"
        ) {
            throw new Error(
                "Admission application must be approved before payment."
            );
        }

        // --------------------------------------------------
        // Prevent duplicate payment
        // --------------------------------------------------

        if (
            application.paymentStatus ===
            "Paid"
        ) {
            return application;
        }

        // --------------------------------------------------
        // Convert Paystack kobo to naira
        // --------------------------------------------------

        const paidAmount =
            transaction.amount / 100;

        // --------------------------------------------------
        // Mark payment as paid
        // --------------------------------------------------

        application.paymentStatus =
            "Paid";

        application.paymentMethod =
            "Paystack";

        application.paymentReference =
            transaction.reference;

        application.paymentAmount =
            paidAmount;

        application.paidAt =
            new Date();

        application.paymentConfirmedBy =
            null;

        await application.save();

        return application;
    };
