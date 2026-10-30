import {
    createAssessmentService,
    getAssessmentsService,
    getAssessmentByIdService,
    updateAssessmentService,
    deleteAssessmentService,
    bulkUpsertScoresService,
    getAssessmentScoresService,
    updateScoreService,
    deleteScoreService,
} from "../services/assessmentService.js";

// ======================================================
// Create Assessment
// Admin / Teacher
// ======================================================

export const createAssessmentController = async (
    req,
    res,
    next
) => {
    try {
        const assessment = await createAssessmentService(
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            message: "Assessment created successfully.",
            data: assessment,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// List Assessments
// Admin / Teacher
// ======================================================

export const getAssessmentsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getAssessmentsService(
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Assessments retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Get Assessment By ID
// Admin / Teacher
// ======================================================

export const getAssessmentByIdController = async (
    req,
    res,
    next
) => {
    try {
        const assessment = await getAssessmentByIdService(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Assessment retrieved successfully.",
            data: assessment,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Update Assessment
// Admin / Teacher
// ======================================================

export const updateAssessmentController = async (
    req,
    res,
    next
) => {
    try {
        const assessment = await updateAssessmentService(
            req.params.id,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Assessment updated successfully.",
            data: assessment,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Delete Assessment
// Admin / Teacher
// ======================================================

export const deleteAssessmentController = async (
    req,
    res,
    next
) => {
    try {
        const assessment = await deleteAssessmentService(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Assessment deleted successfully.",
            data: assessment,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Enter Scores (Bulk)
// Admin / Teacher
// ======================================================

export const bulkUpsertScoresController = async (
    req,
    res,
    next
) => {
    try {
        const result = await bulkUpsertScoresService(
            req.params.id,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Scores recorded successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Get Assessment Scores
// Admin / Teacher
// ======================================================

export const getAssessmentScoresController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getAssessmentScoresService(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Assessment scores retrieved successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Update Score
// Admin / Teacher
// ======================================================

export const updateScoreController = async (
    req,
    res,
    next
) => {
    try {
        const score = await updateScoreService(
            req.params.scoreId,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Score updated successfully.",
            data: score,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Delete Score
// Admin / Teacher
// ======================================================

export const deleteScoreController = async (
    req,
    res,
    next
) => {
    try {
        const score = await deleteScoreService(
            req.params.scoreId,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Score deleted successfully.",
            data: score,
        });
    } catch (error) {
        next(error);
    }
};
