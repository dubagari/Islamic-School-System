import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";

import { env } from "../config/env.js";
import { badRequest, conflict, forbidden, notFound } from "../utils/AppError.js";
import { getParentForUser } from "./accessControlService.js";
import { createPaymentService } from "./financeService.js";
import { isSuperAdmin } from "../utils/roles.js";

// ======================================================
// Helpers
// ======================================================

const isEmail = (value = "") =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const paystackHeaders = () => ({
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
});

const paystackError = (response, result, fallback) =>
    badRequest(
        result?.message ||
            (response.ok ? fallback : `${fallback} (${response.status})`)
    );

const feeCallbackUrl = () => {
    if (env.paystackFeeCallbackUrl) {
        return env.paystackFeeCallbackUrl.replace(/\/+$/, "");
    }

    const portalUrl = env.portalPublicUrl.replace(/\/+$/, "");
    if (!portalUrl) {
        return null;
    }

    return `${portalUrl}/fee-payment/callback`;
};

const publicFeeCallbackUrl = () => {
    if (env.paystackPublicFeeCallbackUrl) {
        return env.paystackPublicFeeCallbackUrl.replace(/\/+$/, "");
    }

    const portalUrl = env.portalPublicUrl.replace(/\/+$/, "");
    if (!portalUrl) {
        return null;
    }

    return `${portalUrl}/school-fee-payment/callback`;
};

const assertInvoicePaymentAccess = async (user, invoice) => {
    if (!user) {
        throw forbidden();
    }

    if (isSuperAdmin(user.role)) {
        return;
    }

    if (user.role === "student") {
        if (
            invoice.student._id.toString() ===
            user.student?.toString()
        ) {
            return;
        }

        throw forbidden(
            "You can only pay your own invoices."
        );
    }

    if (user.role === "parent") {
        const parent = await getParentForUser(user._id);

        const isChild = parent.students.some(
            (childId) =>
                childId.toString() ===
                invoice.student._id.toString()
        );

        if (isChild) {
            return;
        }

        throw forbidden(
            "You can only pay invoices for your own children."
        );
    }

    throw forbidden();
};

const ensurePaystackConfigured = (callbackUrlOverride = null) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
        throw badRequest(
            "PAYSTACK_SECRET_KEY is not configured. Set it in the backend environment."
        );
    }

    const callbackUrl = callbackUrlOverride || feeCallbackUrl();
    if (!callbackUrl) {
        throw badRequest(
            "A Paystack callback URL is not configured. Set PORTAL_PUBLIC_URL or PAYSTACK_FEE_CALLBACK_URL."
        );
    }

    return { secret, callbackUrl };
};

const getPayableInvoice = async ({ invoiceId, user }) => {
    const invoice = await Invoice.findById(invoiceId).populate(
        "student",
        "firstName lastName registrationNumber email parentEmail"
    );

    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    await assertInvoicePaymentAccess(user, invoice);

    return invoice;
};

const transactionAmount = (transaction) =>
    Number(transaction.requested_amount || transaction.amount) / 100;

const normalizeAmount = (value) => Number(Number(value).toFixed(2));

export const publicFeeCallbackUrlForPayment = () =>
    publicFeeCallbackUrl();

// ======================================================
// Paystack initialization for a single invoice
// Used by authenticated portal payments and public
// application-number payments.
// ======================================================

export const initializeInvoicePaystackPayment = async ({
    invoice,
    email,
    fallbackEmail,
    callbackUrlOverride,
}) => {
    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    if (invoice.status === "Cancelled") {
        throw badRequest(
            "Payments cannot be made against a cancelled invoice."
        );
    }

    const { callbackUrl } = ensurePaystackConfigured(callbackUrlOverride);

    const customerEmail =
        email?.trim() ||
        fallbackEmail?.trim() ||
        invoice.student.email?.trim() ||
        invoice.student.parentEmail?.trim();

    if (!isEmail(customerEmail ?? "")) {
        throw badRequest(
            "A valid Paystack email is required. Provide one on the payment page or add an email to the student profile."
        );
    }

    const amount = Number(invoice.balance);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw badRequest("The invoice balance is not a payable amount.");
    }

    const amountKobo = Math.round(amount * 100);

    const response = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
            method: "POST",
            headers: paystackHeaders(),
            body: JSON.stringify({
                email: customerEmail,
                amount: amountKobo,
                currency: "NGN",
                callback_url: callbackUrl,
                metadata: {
                    purpose: "school_fee",
                    invoiceId: invoice._id.toString(),
                    invoiceNumber: invoice.invoiceNumber,
                    studentId: invoice.student._id.toString(),
                    amountKobo,
                },
            }),
        }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
        throw paystackError(
            response,
            result,
            "Unable to initialize Paystack payment."
        );
    }

    return {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        reference: result.data.reference,
        accessCode: result.data.access_code,
        authorizationUrl: result.data.authorization_url,
    };
};

// ======================================================
// Record a successful transaction against the invoice
// ======================================================

const resolveRecordedBy = (invoice) =>
    invoice.issuedBy
        ? { _id: invoice.issuedBy }
        : invoice.student?.user
          ? { _id: invoice.student.user }
          : { _id: invoice.student._id };

export const recordVerifiedFeePayment = async ({ invoice, transaction }) => {
    const amount = normalizeAmount(transactionAmount(transaction));

    const expectedKobo = Math.round(Number(invoice.balance) * 100);
    const paidKobo = Math.round(
        Number(transaction.requested_amount || transaction.amount)
    );

    if (expectedKobo !== paidKobo) {
        throw badRequest(
            "The Paystack transaction amount does not match the invoice balance."
        );
    }

    if (Number(invoice.balance) <= 0) {
        throw conflict("This invoice has already been fully paid.");
    }

    return createPaymentService(
        {
            invoice: invoice._id,
            amount,
            method: "Paystack",
            reference: transaction.reference,
            notes: "Paid online via Paystack",
            paidAt: transaction.paid_at || transaction.createdAt,
        },
        resolveRecordedBy(invoice)
    );
};

export const fetchPaystackSuccessfulTransaction = async (reference) => {
    if (!reference) {
        throw badRequest("Payment reference is required.");
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
        throw badRequest("PAYSTACK_SECRET_KEY is not configured.");
    }

    const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
            reference
        )}`,
        {
            method: "GET",
            headers: paystackHeaders(),
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

    return transaction;
};

export const getInvoiceFromSchoolFeeTransaction = async (transaction) => {
    const invoiceId =
        transaction.metadata?.invoiceId ||
        transaction.metadata?.custom_fields?.find?.(
            (field) => field.variable_name === "invoice_id"
        )?.value;

    if (!invoiceId) {
        throw notFound(
            "Could not match a Paystack payment to an invoice."
        );
    }

    return Invoice.findById(invoiceId).populate(
        "student",
        "firstName lastName registrationNumber email parentEmail user"
    );
};

// ======================================================
// Initialize Paystack School Fee Payment (authenticated)
// ======================================================

export const initializeSchoolFeePaymentService = async ({
    invoiceId,
    user,
    email,
}) => {
    const invoice = await getPayableInvoice({ invoiceId, user });

    return initializeInvoicePaystackPayment({
        invoice,
        email,
        fallbackEmail: user.email,
    });
};

// ======================================================
// Verify Paystack School Fee Payment (authenticated)
// ======================================================

export const verifySchoolFeePaymentService = async ({
    reference,
    user,
}) => {
    const transaction = await fetchPaystackSuccessfulTransaction(reference);

    const invoice = await getInvoiceFromSchoolFeeTransaction(transaction);
    if (!invoice) {
        throw notFound("Invoice not found.");
    }

    await assertInvoicePaymentAccess(user, invoice);

    const existingPayment = await Payment.findOne({
        reference: transaction.reference,
        status: "Completed",
    });

    if (existingPayment) {
        const paidInvoice = await Invoice.findById(invoice._id);
        return { invoice: paidInvoice, payment: existingPayment };
    }

    return recordVerifiedFeePayment({ invoice, transaction });
};

// ======================================================
// Paystack webhook for school fee payments
// ======================================================

export const handleSchoolFeePaystackWebhookService = async (event) => {
    if (event?.event !== "charge.success") {
        return null;
    }

    const transaction = event.data;
    if (!transaction || transaction.status !== "success") {
        return null;
    }

    const invoiceId =
        transaction.metadata?.invoiceId ||
        transaction.metadata?.custom_fields?.find?.(
            (field) => field.variable_name === "invoice_id"
        )?.value;

    if (!invoiceId) {
        return null;
    }

    const invoice = await getInvoiceFromSchoolFeeTransaction(transaction);

    if (!invoice || invoice.status === "Cancelled") {
        return null;
    }

    return recordVerifiedFeePayment({ invoice, transaction });
};
