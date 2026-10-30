import {
    computeClassResultsService,
    getClassResultsService,
    getStudentResultsService,
    publishResultsService,
    getReportCardService,
    getTranscriptService,
} from "../services/resultService.js";

// ======================================================
// Compute Class Results
// Admin / Teacher
// ======================================================

export const computeClassResultsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await computeClassResultsService(
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Results computed successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Get Class Results
// Admin / Teacher
// ======================================================

export const getClassResultsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getClassResultsService(
            req.params.classSubject,
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Class results retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Get Student Results
// Admin / Teacher / Student
// ======================================================

export const getStudentResultsController = async (
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
            message: "Student results retrieved successfully.",
            student: result.student,
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Publish / Unpublish Results
// Admin
// ======================================================

export const publishResultsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await publishResultsService(
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: result.isPublished
                ? "Results published successfully."
                : "Results unpublished successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Report Card
// Admin / Teacher / Student
// ======================================================

export const getReportCardController = async (
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
            message: "Report card generated successfully.",
            student: reportCard.student,
            academicSession: reportCard.academicSession,
            academicSemester: reportCard.academicSemester,
            data: reportCard.results,
            summary: reportCard.summary,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Transcript
// Admin / Teacher / Student
// ======================================================

export const getTranscriptController = async (
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
            message: "Transcript generated successfully.",
            student: transcript.student,
            data: transcript.sessions,
            summary: transcript.summary,
        });
    } catch (error) {
        next(error);
    }
};
