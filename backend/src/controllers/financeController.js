import {
    createFeeStructureService,
    getFeeStructuresService,
    getFeeStructureByIdService,
    updateFeeStructureService,
    deleteFeeStructureService,
    createInvoiceService,
    generateInvoicesService,
    getInvoicesService,
    getInvoiceByIdService,
    updateInvoiceService,
    cancelInvoiceService,
    deleteInvoiceService,
    getInvoicePaymentsService,
    getStudentFeeSummaryService,
    createPaymentService,
    getPaymentsService,
    getPaymentByIdService,
    reversePaymentService,
    getFinanceSummaryService,
    getCollectionsService,
    getOutstandingInvoicesService,
} from "../services/financeService.js";

// ======================================================
// Fee Structures
// ======================================================

export const createFeeStructureController = async (
    req,
    res,
    next
) => {
    try {
        const feeStructure =
            await createFeeStructureService(
                req.body,
                req.user
            );

        res.status(201).json({
            success: true,
            message: "Fee structure created successfully.",
            data: feeStructure,
        });
    } catch (error) {
        next(error);
    }
};

export const getFeeStructuresController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getFeeStructuresService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message: "Fee structures retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

export const getFeeStructureByIdController = async (
    req,
    res,
    next
) => {
    try {
        const feeStructure =
            await getFeeStructureByIdService(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Fee structure retrieved successfully.",
            data: feeStructure,
        });
    } catch (error) {
        next(error);
    }
};

export const updateFeeStructureController = async (
    req,
    res,
    next
) => {
    try {
        const feeStructure =
            await updateFeeStructureService(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Fee structure updated successfully.",
            data: feeStructure,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteFeeStructureController = async (
    req,
    res,
    next
) => {
    try {
        const feeStructure =
            await deleteFeeStructureService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Fee structure deleted successfully.",
            data: feeStructure,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Invoices
// ======================================================

export const createInvoiceController = async (
    req,
    res,
    next
) => {
    try {
        const invoice = await createInvoiceService(
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            message: "Invoice created successfully.",
            data: invoice,
        });
    } catch (error) {
        next(error);
    }
};

export const generateInvoicesController = async (
    req,
    res,
    next
) => {
    try {
        const result = await generateInvoicesService(
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            message: "Invoice generation completed.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getInvoicesController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getInvoicesService(
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Invoices retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

export const getInvoiceByIdController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getInvoiceByIdService(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Invoice retrieved successfully.",
            data: result.invoice,
            payments: result.payments,
        });
    } catch (error) {
        next(error);
    }
};

export const updateInvoiceController = async (
    req,
    res,
    next
) => {
    try {
        const invoice = await updateInvoiceService(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Invoice updated successfully.",
            data: invoice,
        });
    } catch (error) {
        next(error);
    }
};

export const cancelInvoiceController = async (
    req,
    res,
    next
) => {
    try {
        const invoice = await cancelInvoiceService(
            req.params.id,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Invoice cancelled successfully.",
            data: invoice,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteInvoiceController = async (
    req,
    res,
    next
) => {
    try {
        const invoice = await deleteInvoiceService(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Invoice deleted successfully.",
            data: invoice,
        });
    } catch (error) {
        next(error);
    }
};

export const getInvoicePaymentsController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await getInvoicePaymentsService(
                req.params.id,
                req.user
            );

        res.status(200).json({
            success: true,
            message: "Invoice payments retrieved successfully.",
            invoice: result.invoice,
            data: result.payments,
        });
    } catch (error) {
        next(error);
    }
};

export const getStudentFeeSummaryController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await getStudentFeeSummaryService(
                req.params.studentId,
                req.validatedQuery || req.query,
                req.user
            );

        res.status(200).json({
            success: true,
            message: "Student fee summary retrieved successfully.",
            student: result.student,
            summary: result.summary,
            data: result.invoices,
            payments: result.payments,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Payments
// ======================================================

export const createPaymentController = async (
    req,
    res,
    next
) => {
    try {
        const result = await createPaymentService(
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            message: "Payment recorded successfully.",
            data: result.payment,
            invoice: result.invoice,
        });
    } catch (error) {
        next(error);
    }
};

export const getPaymentsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getPaymentsService(
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Payments retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

export const getPaymentByIdController = async (
    req,
    res,
    next
) => {
    try {
        const payment = await getPaymentByIdService(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Payment retrieved successfully.",
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};

export const reversePaymentController = async (
    req,
    res,
    next
) => {
    try {
        const result = await reversePaymentService(
            req.params.id,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Payment reversed successfully.",
            data: result.payment,
            invoice: result.invoice,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Finance Reports
// ======================================================

export const getFinanceSummaryController = async (
    req,
    res,
    next
) => {
    try {
        const summary = await getFinanceSummaryService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message: "Finance summary retrieved successfully.",
            data: summary,
        });
    } catch (error) {
        next(error);
    }
};

export const getCollectionsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getCollectionsService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message: "Collections retrieved successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getOutstandingInvoicesController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await getOutstandingInvoicesService(
                req.validatedQuery || req.query
            );

        res.status(200).json({
            success: true,
            message: "Outstanding invoices retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};
