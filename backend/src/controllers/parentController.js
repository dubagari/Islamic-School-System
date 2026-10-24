import {
    createParentService,
    getParentsService,
    getParentByIdService,
    updateParentService,
    deactivateParentService,
    linkStudentsToParentService,
    unlinkStudentFromParentService,
    getParentProfileService,
    getParentChildrenService,
    getParentDashboardService,
    getParentChildOverviewService,
    getParentChildInvoicesService,
    getParentChildPaymentsService,
} from "../services/parentService.js";

import { getStudentAttendanceService } from "../services/attendanceService.js";
import {
    getStudentResultsService,
    getReportCardService,
    getTranscriptService,
} from "../services/resultService.js";
import { getStudentFeeSummaryService } from "../services/financeService.js";

// ======================================================
// Admin: Parent Account Management
// ======================================================

export const createParentController = async (
    req,
    res,
    next
) => {
    try {
        const parent = await createParentService(
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Parent account created successfully.",
            data: parent,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getParentsService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message: "Parents retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentByIdController = async (
    req,
    res,
    next
) => {
    try {
        const parent = await getParentByIdService(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Parent retrieved successfully.",
            data: parent,
        });
    } catch (error) {
        next(error);
    }
};

export const updateParentController = async (
    req,
    res,
    next
) => {
    try {
        const parent = await updateParentService(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Parent updated successfully.",
            data: parent,
        });
    } catch (error) {
        next(error);
    }
};

export const deactivateParentController = async (
    req,
    res,
    next
) => {
    try {
        const parent =
            await deactivateParentService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Parent deactivated successfully.",
            data: parent,
        });
    } catch (error) {
        next(error);
    }
};

export const linkStudentsController = async (
    req,
    res,
    next
) => {
    try {
        const parent =
            await linkStudentsToParentService(
                req.params.id,
                req.body.studentIds
            );

        res.status(200).json({
            success: true,
            message: "Students linked successfully.",
            data: parent,
        });
    } catch (error) {
        next(error);
    }
};

export const unlinkStudentController = async (
    req,
    res,
    next
) => {
    try {
        const parent =
            await unlinkStudentFromParentService(
                req.params.id,
                req.params.studentId
            );

        res.status(200).json({
            success: true,
            message: "Student unlinked successfully.",
            data: parent,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Parent Portal
// ======================================================

export const getParentProfileController = async (
    req,
    res,
    next
) => {
    try {
        const parent = await getParentProfileService(
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Parent profile retrieved successfully.",
            data: parent,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentChildrenController = async (
    req,
    res,
    next
) => {
    try {
        const children = await getParentChildrenService(
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Children retrieved successfully.",
            count: children.length,
            data: children,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentDashboardController = async (
    req,
    res,
    next
) => {
    try {
        const dashboard =
            await getParentDashboardService(req.user);

        res.status(200).json({
            success: true,
            message:
                "Parent dashboard retrieved successfully.",
            parent: dashboard.parent,
            summary: dashboard.summary,
            data: dashboard.children,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentChildOverviewController = async (
    req,
    res,
    next
) => {
    try {
        const overview =
            await getParentChildOverviewService(
                req.user,
                req.params.studentId
            );

        res.status(200).json({
            success: true,
            message:
                "Child overview retrieved successfully.",
            student: overview.student,
            attendance: overview.attendance,
            results: overview.results,
            fees: overview.fees,
            records: overview.records,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentChildAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getStudentAttendanceService(
            req.params.studentId,
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message:
                "Child attendance retrieved successfully.",
            student: result.student,
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentChildResultsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getStudentResultsService(
            req.params.studentId,
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message:
                "Child results retrieved successfully.",
            student: result.student,
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentChildReportCardController = async (
    req,
    res,
    next
) => {
    try {
        const reportCard = await getReportCardService(
            req.params.studentId,
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message:
                "Child report card generated successfully.",
            student: reportCard.student,
            academicSession: reportCard.academicSession,
            academicSemester:
                reportCard.academicSemester,
            data: reportCard.results,
            summary: reportCard.summary,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentChildTranscriptController = async (
    req,
    res,
    next
) => {
    try {
        const transcript = await getTranscriptService(
            req.params.studentId,
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message:
                "Child transcript generated successfully.",
            student: transcript.student,
            data: transcript.sessions,
            summary: transcript.summary,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentChildFeesController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getStudentFeeSummaryService(
            req.params.studentId,
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message:
                "Child fee summary retrieved successfully.",
            student: result.student,
            summary: result.summary,
            data: result.invoices,
            payments: result.payments,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentChildInvoicesController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await getParentChildInvoicesService(
                req.user,
                req.params.studentId,
                req.validatedQuery || req.query
            );

        res.status(200).json({
            success: true,
            message:
                "Child invoices retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

export const getParentChildPaymentsController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await getParentChildPaymentsService(
                req.user,
                req.params.studentId,
                req.validatedQuery || req.query
            );

        res.status(200).json({
            success: true,
            message:
                "Child payments retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};
