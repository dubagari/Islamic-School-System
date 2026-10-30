import AcademicSemester from "../models/AcademicSemester.js";
import Assessment from "../models/Assessment.js";
import AssessmentScore from "../models/AssessmentScore.js";
import CbtAttempt from "../models/CbtAttempt.js";
import CbtAttemptAnswer from "../models/CbtAttemptAnswer.js";
import CbtExam from "../models/CbtExam.js";
import CbtExamQuestion from "../models/CbtExamQuestion.js";
import CbtQuestion from "../models/CbtQuestion.js";
import ClassSubject from "../models/ClassSubject.js";
import Student from "../models/Student.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import {
    assertTeacherClassSubjectAccess,
} from "./accessControlService.js";
import {
    createStudentAudienceNotifications,
} from "./communicationService.js";
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

// ======================================================
// Helpers
// ======================================================

const populateExam = (query) =>
    query
        .populate({
            path: "classSubject",
            populate: [
                {
                    path: "subject",
                    select: "name prefix section",
                },
                {
                    path: "academicClass",
                    select: "name academicLevel",
                },
                {
                    path: "academicSemester",
                    select: "name startDate endDate",
                },
            ],
        })
        .populate(
            "academicSession",
            "name startDate endDate"
        )
        .populate(
            "academicSemester",
            "name startDate endDate"
        )
        .populate(
            "linkedAssessment",
            "name type maxScore weight"
        )
        .populate("createdBy", "fullName username role")
        .populate(
            "resultsPublishedBy",
            "fullName username role"
        );

const getExamOrFail = async (examId) => {
    const exam = await CbtExam.findById(examId);

    if (!exam) {
        throw notFound("CBT exam not found.");
    }

    return exam;
};

const getClassSubjectOrFail = async (classSubjectId) => {
    const classSubject = await ClassSubject.findById(
        classSubjectId
    );

    if (!classSubject) {
        throw notFound("Class subject not found.");
    }

    return classSubject;
};

const assertExamAccess = async (user, classSubjectId) => {
    if (!user) {
        throw forbidden();
    }

    if (user.role === "admin") {
        return;
    }

    if (user.role !== "teacher") {
        throw forbidden();
    }

    await assertTeacherClassSubjectAccess(
        user._id,
        classSubjectId
    );
};

const assertNoAttempts = async (examId, action) => {
    const attempts = await CbtAttempt.exists({
        exam: examId,
        status: { $ne: "Voided" },
    });

    if (attempts) {
        throw conflict(
            `The exam already has attempts. You cannot ${action}.`
        );
    }
};

const recalculateExamTotalMarks = async (examId) => {
    const questions = await CbtExamQuestion.find({
        exam: examId,
    }).select("marks");

    const totalMarks = questions.reduce(
        (sum, question) =>
            sum + Number(question.marks || 0),
        0
    );

    await CbtExam.updateOne(
        { _id: examId },
        {
            $set: { totalMarks },
        }
    );

    return totalMarks;
};

const assertLinkedAssessment = async ({
    linkedAssessment,
    classSubject,
    academicSemester,
}) => {
    if (!linkedAssessment) {
        return null;
    }

    const assessment = await Assessment.findById(
        linkedAssessment
    );

    if (!assessment) {
        throw notFound("Linked assessment not found.");
    }

    if (
        assessment.classSubject.toString() !==
            classSubject._id.toString() ||
        assessment.academicSemester.toString() !==
            academicSemester.toString()
    ) {
        throw badRequest(
            "The linked assessment must belong to the same class subject and semester as the exam."
        );
    }

    return assessment;
};

const getEligibleStudentIds = async (exam) => {
    const classSubject = await ClassSubject.findById(
        exam.classSubject
    );

    if (!classSubject) {
        return [];
    }

    const enrolledStudentIds =
        await StudentEnrollment.find({
            academicClass: classSubject.academicClass,
            academicSession: exam.academicSession,
            status: "Active",
            isActive: true,
        }).distinct("student");

    return await Student.find({
        isActive: true,
        $or: [
            { _id: { $in: enrolledStudentIds } },
            { academicClass: classSubject.academicClass },
        ],
    }).distinct("_id");
};

const buildAttemptSummary = (attempts) => {
    const submitted = attempts.filter(
        (attempt) => attempt.status === "Submitted"
    );

    if (submitted.length === 0) {
        return {
            attempts: attempts.length,
            submitted: 0,
            inProgress: attempts.filter(
                (attempt) =>
                    attempt.status === "InProgress"
            ).length,
            average: 0,
            highest: 0,
            lowest: 0,
            passRate: 0,
        };
    }

    const percentages = submitted.map(
        (attempt) => Number(attempt.percentage || 0)
    );

    return {
        attempts: attempts.length,
        submitted: submitted.length,
        inProgress: attempts.filter(
            (attempt) => attempt.status === "InProgress"
        ).length,
        average: Number(
            (
                percentages.reduce(
                    (sum, value) => sum + value,
                    0
                ) / percentages.length
            ).toFixed(2)
        ),
        highest: Math.max(...percentages),
        lowest: Math.min(...percentages),
        passRate: Number(
            (
                (submitted.filter(
                    (attempt) => attempt.passed
                ).length /
                    submitted.length) *
                100
            ).toFixed(2)
        ),
    };
};

const populateAttempt = (query) =>
    query
        .populate(
            "student",
            "firstName middleName lastName registrationNumber academicClass"
        )
        .populate("exam", "title totalMarks passMark resultVisibility");

// ======================================================
// Create Exam
// Admin / Teacher
// ======================================================

export const createCbtExamService = async (
    data,
    user
) => {
    const classSubject = await getClassSubjectOrFail(
        data.classSubject
    );

    await assertExamAccess(user, classSubject._id);

    const academicSemester = classSubject.academicSemester;

    const semester = await AcademicSemester.findById(
        academicSemester
    );

    if (!semester) {
        throw notFound("Academic semester not found.");
    }

    await assertLinkedAssessment({
        linkedAssessment: data.linkedAssessment,
        classSubject,
        academicSemester,
    });

    const exam = await CbtExam.create({
        title: data.title,
        description: data.description || "",
        instructions: data.instructions || "",
        classSubject: classSubject._id,
        academicSession: semester.academicSession,
        academicSemester: semester._id,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        durationMinutes: data.durationMinutes,
        passMark: data.passMark ?? 50,
        maxAttempts: data.maxAttempts ?? 1,
        shuffleQuestions: data.shuffleQuestions !== false,
        shuffleOptions: data.shuffleOptions !== false,
        resultVisibility:
            data.resultVisibility || "AfterPublish",
        allowReview: data.allowReview === true,
        linkedAssessment: data.linkedAssessment || null,
        isActive: data.isActive !== false,
        createdBy: user._id,
    });

    return await populateExam(CbtExam.findById(exam._id));
};

// ======================================================
// List Exams
// Admin / Teacher
// ======================================================

export const getCbtExamsService = async (
    query,
    user
) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.classSubject) {
        await assertExamAccess(user, query.classSubject);
        filter.classSubject = query.classSubject;
    } else if (user.role === "teacher") {
        const classSubjectIds = await TeacherAssignment.find({
            teacher: user._id,
            isActive: true,
        }).distinct("classSubject");

        filter.classSubject = { $in: classSubjectIds };
    } else if (user.role !== "admin") {
        throw forbidden();
    }

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester = query.academicSemester;
    }

    if (query.isPublished !== undefined) {
        filter.isPublished = query.isPublished === "true";
    }

    if (query.isClosed !== undefined) {
        filter.isClosed = query.isClosed === "true";
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === "true";
    }

    if (query.search) {
        filter.$or = [
            { title: searchRegex(query.search) },
            { description: searchRegex(query.search) },
        ];
    }

    const [exams, total] = await Promise.all([
        populateExam(CbtExam.find(filter))
            .sort({ startAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        CbtExam.countDocuments(filter),
    ]);

    return paginatedResult(exams, total, {
        page,
        limit,
    });
};

// ======================================================
// Get Exam By ID
// Admin / Teacher
// ======================================================

export const getCbtExamByIdService = async (
    examId,
    user
) => {
    const exam = await populateExam(
        CbtExam.findById(examId)
    );

    if (!exam) {
        throw notFound("CBT exam not found.");
    }

    await assertExamAccess(user, exam.classSubject._id);

    const questionCount = await CbtExamQuestion.countDocuments(
        { exam: exam._id }
    );

    return {
        ...exam.toObject(),
        questionCount,
    };
};

// ======================================================
// Update Exam
// Admin / Teacher
// ======================================================

export const updateCbtExamService = async (
    examId,
    data,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    const hasAttempts = await CbtAttempt.exists({
        exam: exam._id,
        status: { $ne: "Voided" },
    });

    const structuralFields = [
        "startAt",
        "endAt",
        "durationMinutes",
        "shuffleQuestions",
        "shuffleOptions",
        "linkedAssessment",
    ];

    if (
        hasAttempts &&
        structuralFields.some(
            (field) =>
                data[field] !== undefined &&
                String(data[field]) !==
                    String(exam[field] ?? "")
        )
    ) {
        throw conflict(
            "Structural exam settings cannot be changed after attempts have started. You may still update the title, instructions, pass mark, and visibility."
        );
    }

    if (
        data.startAt !== undefined ||
        data.endAt !== undefined
    ) {
        const startAt = new Date(
            data.startAt ?? exam.startAt
        );
        const endAt = new Date(
            data.endAt ?? exam.endAt
        );

        if (endAt.getTime() <= startAt.getTime()) {
            throw badRequest(
                "The exam end time must be after the start time."
            );
        }
    }

    if (data.linkedAssessment !== undefined) {
        await assertLinkedAssessment({
            linkedAssessment: data.linkedAssessment,
            classSubject: {
                _id: exam.classSubject,
            },
            academicSemester: exam.academicSemester,
        });

        await AssessmentScore.deleteMany({
            source: "CBT",
            cbtExam: exam._id,
        });
    }

    if (data.title !== undefined) {
        exam.title = data.title;
    }

    if (data.description !== undefined) {
        exam.description = data.description;
    }

    if (data.instructions !== undefined) {
        exam.instructions = data.instructions;
    }

    if (data.startAt !== undefined) {
        exam.startAt = new Date(data.startAt);
    }

    if (data.endAt !== undefined) {
        exam.endAt = new Date(data.endAt);
    }

    if (data.durationMinutes !== undefined) {
        exam.durationMinutes = data.durationMinutes;
    }

    if (data.passMark !== undefined) {
        exam.passMark = data.passMark;
    }

    if (data.maxAttempts !== undefined) {
        exam.maxAttempts = data.maxAttempts;
    }

    if (data.shuffleQuestions !== undefined) {
        exam.shuffleQuestions = data.shuffleQuestions;
    }

    if (data.shuffleOptions !== undefined) {
        exam.shuffleOptions = data.shuffleOptions;
    }

    if (data.resultVisibility !== undefined) {
        exam.resultVisibility = data.resultVisibility;
    }

    if (data.allowReview !== undefined) {
        exam.allowReview = data.allowReview;
    }

    if (data.linkedAssessment !== undefined) {
        exam.linkedAssessment = data.linkedAssessment;
    }

    if (data.isActive !== undefined) {
        exam.isActive = data.isActive;
    }

    if (data.isClosed !== undefined) {
        exam.isClosed = data.isClosed;
    }

    await exam.save();

    return await populateExam(CbtExam.findById(exam._id));
};

// ======================================================
// Delete Exam
// Admin / Teacher
// ======================================================

export const deleteCbtExamService = async (
    examId,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    await assertNoAttempts(exam._id, "delete it");

    await Promise.all([
        CbtExamQuestion.deleteMany({ exam: exam._id }),
        AssessmentScore.deleteMany({
            source: "CBT",
            cbtExam: exam._id,
        }),
    ]);

    await exam.deleteOne();

    return exam;
};

// ======================================================
// Publish / Unpublish Exam
// Admin / Teacher
// ======================================================

export const publishCbtExamService = async (
    examId,
    data,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    const isPublished = data.isPublished !== false;

    if (isPublished) {
        const questionCount =
            await CbtExamQuestion.countDocuments({
                exam: exam._id,
            });

        if (questionCount === 0) {
            throw badRequest(
                "Add at least one question before publishing the exam."
            );
        }

        if (
            new Date(exam.endAt).getTime() <= Date.now()
        ) {
            throw badRequest(
                "The exam end time has already passed."
            );
        }
    }

    const wasPublished = exam.isPublished;

    exam.isPublished = isPublished;

    if (!isPublished) {
        exam.isClosed = false;
    }

    await exam.save();

    if (!wasPublished && isPublished) {
        try {
            const studentIds = await getEligibleStudentIds(
                exam
            );

            await createStudentAudienceNotifications({
                studentIds,
                title: "New CBT exam available",
                message: `${exam.title} is now available. Check the exam schedule and start before it closes.`,
                type: "exam",
                referenceId: exam._id,
                createdBy: user._id,
            });
        } catch (error) {
            // Notifications must never block publishing.
        }
    }

    return await populateExam(CbtExam.findById(exam._id));
};

// ======================================================
// Publish / Unpublish Results
// Admin / Teacher
// ======================================================

export const publishCbtResultsService = async (
    examId,
    data,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    const isPublished = data.isPublished !== false;

    exam.resultsPublished = isPublished;
    exam.resultsPublishedAt = isPublished
        ? new Date()
        : null;
    exam.resultsPublishedBy = isPublished
        ? user._id
        : null;

    await exam.save();

    if (isPublished) {
        try {
            const studentIds = await CbtAttempt.distinct(
                "student",
                {
                    exam: exam._id,
                    status: "Submitted",
                }
            );

            await createStudentAudienceNotifications({
                studentIds,
                title: "CBT results published",
                message: `Results for ${exam.title} are now available in your portal.`,
                type: "exam",
                referenceId: exam._id,
                createdBy: user._id,
            });
        } catch (error) {
            // Notification failure is non-fatal.
        }
    }

    return await populateExam(CbtExam.findById(exam._id));
};

// ======================================================
// List Exam Questions
// Admin / Teacher
// ======================================================

export const getCbtExamQuestionsService = async (
    examId,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    const questions = await CbtExamQuestion.find({
        exam: exam._id,
    })
        .sort({ order: 1 })
        .populate("question", "difficulty defaultMarks");

    return {
        exam: await populateExam(
            CbtExam.findById(exam._id)
        ),
        questions,
        totalMarks: questions.reduce(
            (sum, question) => sum + Number(question.marks || 0),
            0
        ),
    };
};

// ======================================================
// Attach Questions From Bank
// Admin / Teacher
// ======================================================

export const attachCbtQuestionsService = async (
    examId,
    data,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    await assertNoAttempts(
        exam._id,
        "change its questions"
    );

    const classSubject = await getClassSubjectOrFail(
        exam.classSubject
    );

    const questionIds = data.questions.map(
        (item) => item.question
    );

    if (
        new Set(questionIds).size !== questionIds.length
    ) {
        throw badRequest(
            "The question list contains duplicates."
        );
    }

    const bankQuestions = await CbtQuestion.find({
        _id: { $in: questionIds },
        isActive: true,
    });

    if (bankQuestions.length !== questionIds.length) {
        throw notFound(
            "One or more selected questions were not found or are inactive."
        );
    }

    const invalidSubject = bankQuestions.find(
        (question) =>
            question.subject.toString() !==
            classSubject.subject.toString()
    );

    if (invalidSubject) {
        throw badRequest(
            "All questions must belong to the subject of this class subject."
        );
    }

    const existing = await CbtExamQuestion.find({
        exam: exam._id,
    })
        .select("question order")
        .sort({ order: -1 });

    const existingQuestionIds = new Set(
        existing.map((item) =>
            item.question.toString()
        )
    );

    const duplicate = questionIds.find((questionId) =>
        existingQuestionIds.has(questionId)
    );

    if (duplicate) {
        throw conflict(
            "One or more selected questions are already attached to this exam."
        );
    }

    const startOrder =
        existing.length > 0
            ? Number(existing[0].order) + 1
            : 1;

    const marksByQuestion = new Map(
        data.questions.map((item) => [
            item.question,
            item.marks,
        ])
    );

    const bankById = new Map(
        bankQuestions.map((question) => [
            question._id.toString(),
            question,
        ])
    );

    const documents = questionIds.map(
        (questionId, index) => {
            const bankQuestion = bankById.get(questionId);
            const requestedMarks =
                marksByQuestion.get(questionId);

            return {
                exam: exam._id,
                question: bankQuestion._id,
                order: startOrder + index,
                marks:
                    requestedMarks ??
                    bankQuestion.defaultMarks ??
                    1,
                questionText: bankQuestion.questionText,
                type: bankQuestion.type,
                options: bankQuestion.options,
                correctAnswer: bankQuestion.correctAnswer,
                explanation: bankQuestion.explanation || "",
            };
        }
    );

    await CbtExamQuestion.insertMany(documents);

    await recalculateExamTotalMarks(exam._id);

    return await CbtExamQuestion.find({
        exam: exam._id,
    })
        .sort({ order: 1 })
        .populate("question", "difficulty defaultMarks");
};

// ======================================================
// Update / Reorder / Remove Exam Questions
// Admin / Teacher
// ======================================================

export const updateCbtExamQuestionService = async (
    examId,
    examQuestionId,
    data,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    await assertNoAttempts(
        exam._id,
        "change its questions"
    );

    const examQuestion = await CbtExamQuestion.findOne({
        _id: examQuestionId,
        exam: exam._id,
    });

    if (!examQuestion) {
        throw notFound("Exam question not found.");
    }

    examQuestion.marks = data.marks;

    await examQuestion.save();

    await recalculateExamTotalMarks(exam._id);

    return examQuestion;
};

export const reorderCbtExamQuestionsService = async (
    examId,
    data,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    await assertNoAttempts(
        exam._id,
        "reorder its questions"
    );

    const examQuestions = await CbtExamQuestion.find({
        exam: exam._id,
    }).select("_id order");

    const existingIds = examQuestions.map((question) =>
        question._id.toString()
    );
    const requestedIds = data.order.map(String);

    if (
        requestedIds.length !== existingIds.length ||
        new Set(requestedIds).size !== requestedIds.length ||
        requestedIds.some(
            (id) => !existingIds.includes(id)
        )
    ) {
        throw badRequest(
            "The reorder list must contain every exam question exactly once."
        );
    }

    await CbtExamQuestion.bulkWrite(
        requestedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, exam: exam._id },
                update: {
                    $set: {
                        order: 10000 + index,
                    },
                },
            },
        }))
    );

    await CbtExamQuestion.bulkWrite(
        requestedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, exam: exam._id },
                update: { $set: { order: index + 1 } },
            },
        }))
    );

    return await CbtExamQuestion.find({
        exam: exam._id,
    })
        .sort({ order: 1 })
        .populate("question", "difficulty defaultMarks");
};

export const removeCbtExamQuestionService = async (
    examId,
    examQuestionId,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    await assertNoAttempts(
        exam._id,
        "remove questions"
    );

    const examQuestion = await CbtExamQuestion.findOne({
        _id: examQuestionId,
        exam: exam._id,
    });

    if (!examQuestion) {
        throw notFound("Exam question not found.");
    }

    await examQuestion.deleteOne();

    const remaining = await CbtExamQuestion.find({
        exam: exam._id,
    }).sort({ order: 1 });

    await CbtExamQuestion.bulkWrite(
        remaining.map((question, index) => ({
            updateOne: {
                filter: { _id: question._id },
                update: {
                    $set: {
                        order: 10000 + index,
                    },
                },
            },
        }))
    );

    await CbtExamQuestion.bulkWrite(
        remaining.map((question, index) => ({
            updateOne: {
                filter: { _id: question._id },
                update: { $set: { order: index + 1 } },
            },
        }))
    );

    await recalculateExamTotalMarks(exam._id);

    return examQuestion;
};

// ======================================================
// Exam Attempts / Statistics
// Admin / Teacher
// ======================================================

export const getCbtExamAttemptsService = async (
    examId,
    query,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    const { page, limit, skip } = getPagination(query);

    const filter = { exam: exam._id };

    if (query.status) {
        filter.status = query.status;
    }

    const [attempts, total, allAttempts] =
        await Promise.all([
            populateAttempt(CbtAttempt.find(filter))
                .sort({ percentage: -1, submittedAt: 1 })
                .skip(skip)
                .limit(limit),
            CbtAttempt.countDocuments(filter),
            CbtAttempt.find({ exam: exam._id }).select(
                "status percentage passed"
            ),
        ]);

    return {
        ...paginatedResult(attempts, total, {
            page,
            limit,
        }),
        summary: buildAttemptSummary(allAttempts),
        exam: {
            id: exam._id,
            title: exam.title,
            totalMarks: exam.totalMarks,
            passMark: exam.passMark,
            resultsPublished: exam.resultsPublished,
        },
    };
};

export const getCbtExamStatisticsService = async (
    examId,
    user
) => {
    const exam = await getExamOrFail(examId);

    await assertExamAccess(user, exam.classSubject);

    const attempts = await CbtAttempt.find({
        exam: exam._id,
    }).select("status percentage passed");

    const summary = buildAttemptSummary(attempts);

    const questionCount =
        await CbtExamQuestion.countDocuments({
            exam: exam._id,
        });

    return {
        ...summary,
        questionCount,
        totalMarks: exam.totalMarks,
        passMark: exam.passMark,
    };
};

// ======================================================
// Void Attempt
// Admin
// ======================================================

export const voidCbtAttemptService = async (
    attemptId,
    user
) => {
    const attempt = await CbtAttempt.findById(attemptId);

    if (!attempt) {
        throw notFound("CBT attempt not found.");
    }

    const exam = await getExamOrFail(attempt.exam);

    if (user.role !== "admin") {
        await assertExamAccess(user, exam.classSubject);
    }

    if (attempt.status === "Voided") {
        return attempt;
    }

    attempt.status = "Voided";
    attempt.linkedScoreStatus = "None";

    await attempt.save();

    await Promise.all([
        AssessmentScore.deleteMany({
            source: "CBT",
            cbtAttempt: attempt._id,
        }),
        CbtAttemptAnswer.deleteMany({
            attempt: attempt._id,
        }),
    ]);

    return populateAttempt(
        CbtAttempt.findById(attempt._id)
    );
};
