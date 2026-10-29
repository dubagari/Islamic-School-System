import CbtExamQuestion from "../models/CbtExamQuestion.js";
import CbtQuestion from "../models/CbtQuestion.js";
import ClassSubject from "../models/ClassSubject.js";
import Subject from "../models/Subject.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import {
    assertTeacherSubjectAccess,
} from "./accessControlService.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import { searchRegex } from "../utils/search.js";
import {
    badRequest,
    conflict,
    forbidden,
    notFound,
} from "../utils/AppError.js";

const TRUE_FALSE_OPTIONS = [
    { key: "true", text: "True" },
    { key: "false", text: "False" },
];

const populateQuestion = (query) =>
    query
        .populate("subject", "name prefix section")
        .populate("createdBy", "fullName username role");

const getSubjectOrFail = async (subjectId) => {
    const subject = await Subject.findById(subjectId);

    if (!subject) {
        throw notFound("Subject not found.");
    }

    return subject;
};

const assertQuestionAccess = async (user, subjectId) => {
    if (!user) {
        throw forbidden();
    }

    if (user.role === "admin") {
        return;
    }

    if (user.role !== "teacher") {
        throw forbidden();
    }

    await assertTeacherSubjectAccess(user._id, subjectId);
};

const normalizeQuestionContent = ({
    type,
    options,
    correctAnswer,
}) => {
    if (type === "TrueFalse") {
        const answer = String(correctAnswer || "")
            .trim()
            .toLowerCase();

        if (answer !== "true" && answer !== "false") {
            throw badRequest(
                "True/False answers must be either true or false."
            );
        }

        return {
            options: TRUE_FALSE_OPTIONS,
            correctAnswer: answer,
        };
    }

    if (!Array.isArray(options) || options.length < 2) {
        throw badRequest(
            "A multiple-choice question requires at least two options."
        );
    }

    if (options.length > 6) {
        throw badRequest(
            "A question cannot have more than six options."
        );
    }

    const cleaned = options.map((option) => ({
        key: String(option.key || "").trim(),
        text: String(option.text || "").trim(),
    }));

    if (
        cleaned.some(
            (option) => !option.key || !option.text
        )
    ) {
        throw badRequest(
            "Every option must have a key and text."
        );
    }

    const keys = cleaned.map((option) =>
        option.key.toLowerCase()
    );

    if (new Set(keys).size !== keys.length) {
        throw badRequest("Option keys must be unique.");
    }

    const matched = cleaned.find(
        (option) =>
            option.key.toLowerCase() ===
            String(correctAnswer || "")
                .trim()
                .toLowerCase()
    );

    if (!matched) {
        throw badRequest(
            "The correct answer must match one of the option keys."
        );
    }

    return {
        options: cleaned,
        correctAnswer: matched.key,
    };
};

// ======================================================
// Create Question
// Admin / Teacher
// ======================================================

export const createCbtQuestionService = async (
    data,
    user
) => {
    await getSubjectOrFail(data.subject);
    await assertQuestionAccess(user, data.subject);

    const type = data.type || "MultipleChoice";

    const normalized = normalizeQuestionContent({
        type,
        options: data.options,
        correctAnswer: data.correctAnswer,
    });

    const question = await CbtQuestion.create({
        subject: data.subject,
        questionText: data.questionText,
        type,
        options: normalized.options,
        correctAnswer: normalized.correctAnswer,
        explanation: data.explanation || "",
        difficulty: data.difficulty || "Medium",
        defaultMarks: data.defaultMarks ?? 1,
        isActive: data.isActive !== false,
        createdBy: user._id,
    });

    return await populateQuestion(
        CbtQuestion.findById(question._id)
    );
};

// ======================================================
// List Questions
// Admin / Teacher
// ======================================================

export const getCbtQuestionsService = async (
    query,
    user
) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.subject) {
        await assertQuestionAccess(user, query.subject);
        filter.subject = query.subject;
    } else if (user.role === "teacher") {
        const classSubjectIds = await TeacherAssignment.find({
            teacher: user._id,
            isActive: true,
        }).distinct("classSubject");

        const subjectIds = await ClassSubject.find({
            _id: { $in: classSubjectIds },
            isActive: true,
        }).distinct("subject");

        filter.subject = { $in: subjectIds };
    } else if (user.role !== "admin") {
        throw forbidden();
    }

    if (query.type) {
        filter.type = query.type;
    }

    if (query.difficulty) {
        filter.difficulty = query.difficulty;
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === "true";
    }

    if (query.search) {
        filter.questionText = searchRegex(query.search);
    }

    const [questions, total] = await Promise.all([
        populateQuestion(CbtQuestion.find(filter))
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        CbtQuestion.countDocuments(filter),
    ]);

    return paginatedResult(questions, total, {
        page,
        limit,
    });
};

// ======================================================
// Get Question By ID
// Admin / Teacher
// ======================================================

export const getCbtQuestionByIdService = async (
    questionId,
    user
) => {
    const question = await populateQuestion(
        CbtQuestion.findById(questionId)
    );

    if (!question) {
        throw notFound("Question not found.");
    }

    await assertQuestionAccess(user, question.subject._id);

    return question;
};

// ======================================================
// Update Question
// Admin / Teacher
// ======================================================

export const updateCbtQuestionService = async (
    questionId,
    data,
    user
) => {
    const question = await CbtQuestion.findById(
        questionId
    );

    if (!question) {
        throw notFound("Question not found.");
    }

    if (data.subject) {
        await getSubjectOrFail(data.subject);
        await assertQuestionAccess(user, data.subject);
    } else {
        await assertQuestionAccess(
            user,
            question.subject
        );
    }

    const type = data.type ?? question.type;
    const options =
        data.options ?? question.options.map((option) => ({
            key: option.key,
            text: option.text,
        }));
    const correctAnswer =
        data.correctAnswer ?? question.correctAnswer;

    const normalized = normalizeQuestionContent({
        type,
        options,
        correctAnswer,
    });

    if (data.subject !== undefined) {
        question.subject = data.subject;
    }

    if (data.questionText !== undefined) {
        question.questionText = data.questionText;
    }

    question.type = type;
    question.options = normalized.options;
    question.correctAnswer = normalized.correctAnswer;

    if (data.explanation !== undefined) {
        question.explanation = data.explanation;
    }

    if (data.difficulty !== undefined) {
        question.difficulty = data.difficulty;
    }

    if (data.defaultMarks !== undefined) {
        question.defaultMarks = data.defaultMarks;
    }

    if (data.isActive !== undefined) {
        question.isActive = data.isActive;
    }

    await question.save();

    return await populateQuestion(
        CbtQuestion.findById(question._id)
    );
};

// ======================================================
// Delete Question
// Admin / Teacher
// ======================================================

export const deleteCbtQuestionService = async (
    questionId,
    user
) => {
    const question = await CbtQuestion.findById(
        questionId
    );

    if (!question) {
        throw notFound("Question not found.");
    }

    await assertQuestionAccess(user, question.subject);

    const used = await CbtExamQuestion.exists({
        question: question._id,
    });

    if (used) {
        throw conflict(
            "This question is used by an exam. Deactivate it instead of deleting it."
        );
    }

    await question.deleteOne();

    return question;
};
