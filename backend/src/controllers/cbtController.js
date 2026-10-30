import {
    createCbtQuestionService,
    getCbtQuestionsService,
    getCbtQuestionByIdService,
    updateCbtQuestionService,
    deleteCbtQuestionService,
} from "../services/cbtQuestionService.js";

import {
    createCbtExamService,
    getCbtExamsService,
    getCbtExamByIdService,
    updateCbtExamService,
    deleteCbtExamService,
    publishCbtExamService,
    publishCbtResultsService,
    getCbtExamQuestionsService,
    attachCbtQuestionsService,
    updateCbtExamQuestionService,
    reorderCbtExamQuestionsService,
    removeCbtExamQuestionService,
    getCbtExamAttemptsService,
    getCbtExamStatisticsService,
    voidCbtAttemptService,
} from "../services/cbtExamService.js";

import {
    getStudentCbtExamsService,
    startCbtAttemptService,
    getStudentCbtAttemptService,
    saveCbtAnswersService,
    submitCbtAttemptService,
    getCbtAttemptResultService,
    getStudentCbtAttemptsService,
    getStudentCbtAttemptsForStudentService,
} from "../services/cbtAttemptService.js";

const send = (res, status, message, data, extra = {}) => {
    res.status(status).json({
        success: true,
        message,
        data,
        ...extra,
    });
};

// ======================================================
// Question Bank
// Admin / Teacher
// ======================================================

export const createCbtQuestionController = async (
    req,
    res,
    next
) => {
    try {
        const question = await createCbtQuestionService(
            req.body,
            req.user
        );

        send(
            res,
            201,
            "Question created successfully.",
            question
        );
    } catch (error) {
        next(error);
    }
};

export const getCbtQuestionsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getCbtQuestionsService(
            req.validatedQuery || req.query,
            req.user
        );

        send(
            res,
            200,
            "Questions retrieved successfully.",
            result.data,
            { pagination: result.pagination }
        );
    } catch (error) {
        next(error);
    }
};

export const getCbtQuestionByIdController = async (
    req,
    res,
    next
) => {
    try {
        const question = await getCbtQuestionByIdService(
            req.params.id,
            req.user
        );

        send(
            res,
            200,
            "Question retrieved successfully.",
            question
        );
    } catch (error) {
        next(error);
    }
};

export const updateCbtQuestionController = async (
    req,
    res,
    next
) => {
    try {
        const question = await updateCbtQuestionService(
            req.params.id,
            req.body,
            req.user
        );

        send(
            res,
            200,
            "Question updated successfully.",
            question
        );
    } catch (error) {
        next(error);
    }
};

export const deleteCbtQuestionController = async (
    req,
    res,
    next
) => {
    try {
        const question = await deleteCbtQuestionService(
            req.params.id,
            req.user
        );

        send(
            res,
            200,
            "Question deleted successfully.",
            question
        );
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Exams
// Admin / Teacher
// ======================================================

export const createCbtExamController = async (
    req,
    res,
    next
) => {
    try {
        const exam = await createCbtExamService(
            req.body,
            req.user
        );

        send(
            res,
            201,
            "CBT exam created successfully.",
            exam
        );
    } catch (error) {
        next(error);
    }
};

export const getCbtExamsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getCbtExamsService(
            req.validatedQuery || req.query,
            req.user
        );

        send(
            res,
            200,
            "CBT exams retrieved successfully.",
            result.data,
            { pagination: result.pagination }
        );
    } catch (error) {
        next(error);
    }
};

export const getCbtExamByIdController = async (
    req,
    res,
    next
) => {
    try {
        const exam = await getCbtExamByIdService(
            req.params.id,
            req.user
        );

        send(
            res,
            200,
            "CBT exam retrieved successfully.",
            exam
        );
    } catch (error) {
        next(error);
    }
};

export const updateCbtExamController = async (
    req,
    res,
    next
) => {
    try {
        const exam = await updateCbtExamService(
            req.params.id,
            req.body,
            req.user
        );

        send(
            res,
            200,
            "CBT exam updated successfully.",
            exam
        );
    } catch (error) {
        next(error);
    }
};

export const deleteCbtExamController = async (
    req,
    res,
    next
) => {
    try {
        const exam = await deleteCbtExamService(
            req.params.id,
            req.user
        );

        send(
            res,
            200,
            "CBT exam deleted successfully.",
            exam
        );
    } catch (error) {
        next(error);
    }
};

export const publishCbtExamController = async (
    req,
    res,
    next
) => {
    try {
        const exam = await publishCbtExamService(
            req.params.id,
            req.body,
            req.user
        );

        send(
            res,
            200,
            exam.isPublished
                ? "CBT exam published successfully."
                : "CBT exam unpublished successfully.",
            exam
        );
    } catch (error) {
        next(error);
    }
};

export const publishCbtResultsController = async (
    req,
    res,
    next
) => {
    try {
        const exam = await publishCbtResultsService(
            req.params.id,
            req.body,
            req.user
        );

        send(
            res,
            200,
            exam.resultsPublished
                ? "CBT results published successfully."
                : "CBT results hidden successfully.",
            exam
        );
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Exam Questions
// Admin / Teacher
// ======================================================

export const getCbtExamQuestionsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getCbtExamQuestionsService(
            req.params.id,
            req.user
        );

        send(
            res,
            200,
            "Exam questions retrieved successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

export const attachCbtQuestionsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await attachCbtQuestionsService(
            req.params.id,
            req.body,
            req.user
        );

        send(
            res,
            200,
            "Questions added to the exam successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

export const updateCbtExamQuestionController = async (
    req,
    res,
    next
) => {
    try {
        const examQuestion =
            await updateCbtExamQuestionService(
                req.params.id,
                req.params.examQuestionId,
                req.body,
                req.user
            );

        send(
            res,
            200,
            "Exam question updated successfully.",
            examQuestion
        );
    } catch (error) {
        next(error);
    }
};

export const reorderCbtExamQuestionsController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await reorderCbtExamQuestionsService(
                req.params.id,
                req.body,
                req.user
            );

        send(
            res,
            200,
            "Exam questions reordered successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

export const removeCbtExamQuestionController = async (
    req,
    res,
    next
) => {
    try {
        const result = await removeCbtExamQuestionService(
            req.params.id,
            req.params.examQuestionId,
            req.user
        );

        send(
            res,
            200,
            "Question removed from the exam successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Exam Attempts / Statistics
// Admin / Teacher
// ======================================================

export const getCbtExamAttemptsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getCbtExamAttemptsService(
            req.params.id,
            req.validatedQuery || req.query,
            req.user
        );

        send(
            res,
            200,
            "Exam attempts retrieved successfully.",
            result.data,
            {
                pagination: result.pagination,
                summary: result.summary,
                exam: result.exam,
            }
        );
    } catch (error) {
        next(error);
    }
};

export const getCbtExamStatisticsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getCbtExamStatisticsService(
            req.params.id,
            req.user
        );

        send(
            res,
            200,
            "Exam statistics retrieved successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

export const voidCbtAttemptController = async (
    req,
    res,
    next
) => {
    try {
        const result = await voidCbtAttemptService(
            req.params.attemptId,
            req.user
        );

        send(
            res,
            200,
            "Attempt voided successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Student Exams / Attempts
// Student
// ======================================================

export const getStudentCbtExamsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getStudentCbtExamsService(
            req.validatedQuery || req.query,
            req.user
        );

        send(
            res,
            200,
            "Available CBT exams retrieved successfully.",
            result.data,
            { pagination: result.pagination }
        );
    } catch (error) {
        next(error);
    }
};

export const startCbtAttemptController = async (
    req,
    res,
    next
) => {
    try {
        const result = await startCbtAttemptService(
            req.params.examId,
            req.user,
            {
                ip: req.ip,
                userAgent: req.get("user-agent") || "",
            }
        );

        send(
            res,
            200,
            "CBT attempt started successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

export const getStudentCbtAttemptController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getStudentCbtAttemptService(
            req.params.attemptId,
            req.user
        );

        send(
            res,
            200,
            "CBT attempt retrieved successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

export const saveCbtAnswersController = async (
    req,
    res,
    next
) => {
    try {
        const result = await saveCbtAnswersService(
            req.params.attemptId,
            req.body,
            req.user
        );

        send(
            res,
            200,
            "Answers saved successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

export const submitCbtAttemptController = async (
    req,
    res,
    next
) => {
    try {
        const result = await submitCbtAttemptService(
            req.params.attemptId,
            req.user,
            {
                ip: req.ip,
            }
        );

        send(
            res,
            200,
            "CBT attempt submitted successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

export const getStudentCbtAttemptsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getStudentCbtAttemptsService(
            req.validatedQuery || req.query,
            req.user
        );

        send(
            res,
            200,
            "CBT attempts retrieved successfully.",
            result.data,
            {
                pagination: result.pagination,
                student: result.student,
            }
        );
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Shared Result / Student Attempts
// Admin / Teacher / Student / Parent
// ======================================================

export const getCbtAttemptResultController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getCbtAttemptResultService(
            req.params.attemptId,
            req.user
        );

        send(
            res,
            200,
            "CBT attempt result retrieved successfully.",
            result
        );
    } catch (error) {
        next(error);
    }
};

export const getStudentCbtAttemptsForStudentController =
    async (req, res, next) => {
        try {
            const result =
                await getStudentCbtAttemptsForStudentService(
                    req.params.studentId,
                    req.validatedQuery || req.query,
                    req.user
                );

            send(
                res,
                200,
                "Student CBT attempts retrieved successfully.",
                result.data,
                {
                    pagination: result.pagination,
                    student: result.student,
                }
            );
        } catch (error) {
            next(error);
        }
    };
