import Assessment from "../models/Assessment.js";
import AssessmentScore from "../models/AssessmentScore.js";
import CbtAttempt from "../models/CbtAttempt.js";
import CbtAttemptAnswer from "../models/CbtAttemptAnswer.js";
import CbtExam from "../models/CbtExam.js";
import CbtExamQuestion from "../models/CbtExamQuestion.js";
import ClassSubject from "../models/ClassSubject.js";
import Student from "../models/Student.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import {
    assertStudentAccess,
    getStudentForUser,
} from "./accessControlService.js";
import {
    buildPagination,
    getPagination,
} from "../utils/pagination.js";
import {
    badRequest,
    conflict,
    forbidden,
    notFound,
} from "../utils/AppError.js";

// ======================================================
// Helpers
// ======================================================

const shuffle = (items) => {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
};

const getExamOrFail = async (examId) => {
    const exam = await CbtExam.findById(examId);

    if (!exam) {
        throw notFound("CBT exam not found.");
    }

    return exam;
};

const isExamAvailable = (exam) => {
    const now = Date.now();

    return (
        exam.isPublished &&
        exam.isActive &&
        !exam.isClosed &&
        new Date(exam.startAt).getTime() <= now &&
        new Date(exam.endAt).getTime() > now
    );
};

const isResultVisible = (exam, attempt) => {
    if (attempt.status !== "Submitted") {
        return false;
    }

    if (exam.resultVisibility === "Hidden") {
        return false;
    }

    if (exam.resultVisibility === "Immediate") {
        return true;
    }

    return exam.resultsPublished === true;
};

const assertStudentEligible = async (student, exam) => {
    const classSubject = await ClassSubject.findById(
        exam.classSubject
    );

    if (!classSubject) {
        throw notFound("Class subject not found.");
    }

    const enrolled = await StudentEnrollment.exists({
        student: student._id,
        academicClass: classSubject.academicClass,
        academicSession: exam.academicSession,
        status: "Active",
        isActive: true,
    });

    if (
        !enrolled &&
        student.academicClass?.toString() !==
            classSubject.academicClass.toString()
    ) {
        throw forbidden(
            "You are not enrolled in the class for this exam."
        );
    }

    return classSubject;
};

const getAttemptOrFail = async (attemptId) => {
    const attempt = await CbtAttempt.findById(attemptId);

    if (!attempt) {
        throw notFound("CBT attempt not found.");
    }

    return attempt;
};

const getAttemptAccess = async (attempt, user) => {
    const student = await assertStudentAccess(
        user,
        attempt.student
    );

    return student;
};

const buildOptionOrder = (exam, examQuestions) =>
    examQuestions.map((question) => {
        const keys = question.options.map(
            (option) => option.key
        );

        return {
            question: question._id,
            keys: exam.shuffleOptions ? shuffle(keys) : keys,
        };
    });

const buildAttemptPayload = async (attempt, exam) => {
    const examQuestions = await CbtExamQuestion.find({
        exam: exam._id,
    }).sort({ order: 1 });

    const questionMap = new Map(
        examQuestions.map((question) => [
            question._id.toString(),
            question,
        ])
    );

    const orderedIds =
        attempt.questionOrder?.length > 0
            ? attempt.questionOrder
                  .map(String)
                  .filter((id) => questionMap.has(id))
            : examQuestions.map((question) =>
                  question._id.toString()
              );

    const optionOrderMap = new Map(
        (attempt.optionOrder || []).map((entry) => [
            entry.question.toString(),
            entry.keys,
        ])
    );

    const answers = await CbtAttemptAnswer.find({
        attempt: attempt._id,
    });

    const answerMap = new Map(
        answers.map((answer) => [
            answer.question.toString(),
            answer,
        ])
    );

    const questions = orderedIds.map((id) => {
        const question = questionMap.get(id);
        const optionOrder =
            optionOrderMap.get(id) ||
            question.options.map((option) => option.key);

        const optionMap = new Map(
            question.options.map((option) => [
                option.key,
                option,
            ])
        );

        const options = optionOrder
            .map((key) => optionMap.get(key))
            .filter(Boolean)
            .map((option) => ({
                key: option.key,
                text: option.text,
            }));

        const saved = answerMap.get(id);

        return {
            _id: question._id,
            questionText: question.questionText,
            type: question.type,
            marks: question.marks,
            options,
            selectedAnswer: saved?.selectedAnswer || "",
        };
    });

    return {
        exam: {
            _id: exam._id,
            title: exam.title,
            description: exam.description,
            instructions: exam.instructions,
            durationMinutes: exam.durationMinutes,
            totalMarks: exam.totalMarks,
            passMark: exam.passMark,
            startAt: exam.startAt,
            endAt: exam.endAt,
            resultVisibility: exam.resultVisibility,
        },
        attempt: {
            _id: attempt._id,
            attemptNumber: attempt.attemptNumber,
            status: attempt.status,
            startedAt: attempt.startedAt,
            expiresAt: attempt.expiresAt,
            submittedAt: attempt.submittedAt,
            autoSubmitted: attempt.autoSubmitted,
        },
        serverTime: new Date(),
        questions:
            attempt.status === "InProgress" ? questions : [],
    };
};

const applyLinkedAssessmentScore = async (exam, attempt) => {
    if (!exam.linkedAssessment) {
        attempt.linkedScoreStatus = "NotLinked";

        await attempt.save();

        return;
    }

    const assessment = await Assessment.findById(
        exam.linkedAssessment
    );

    if (!assessment) {
        attempt.linkedScoreStatus = "NotLinked";

        await attempt.save();

        return;
    }

    const existing = await AssessmentScore.findOne({
        assessment: assessment._id,
        student: attempt.student,
    });

    if (existing && existing.source !== "CBT") {
        attempt.linkedScoreStatus = "SkippedManualScore";

        await attempt.save();

        return;
    }

    const scaledScore = Math.min(
        Number(assessment.maxScore),
        Number(
            (
                (Number(attempt.percentage) / 100) *
                Number(assessment.maxScore)
            ).toFixed(2)
        )
    );

    await AssessmentScore.findOneAndUpdate(
        {
            assessment: assessment._id,
            student: attempt.student,
        },
        {
            $set: {
                score: scaledScore,
                remarks: `CBT: ${exam.title} (attempt ${attempt.attemptNumber})`,
                recordedBy: exam.createdBy,
                source: "CBT",
                cbtExam: exam._id,
                cbtAttempt: attempt._id,
            },
        },
        {
            upsert: true,
            returnDocument: "after",
            setDefaultsOnInsert: true,
        }
    );

    attempt.linkedScoreStatus = existing
        ? "Updated"
        : "Applied";

    await attempt.save();
};

const finalizeAttempt = async (
    attempt,
    exam,
    { autoSubmitted = false } = {}
) => {
    if (attempt.status !== "InProgress") {
        return attempt;
    }

    const examQuestions = await CbtExamQuestion.find({
        exam: exam._id,
    });

    const questionMap = new Map(
        examQuestions.map((question) => [
            question._id.toString(),
            question,
        ])
    );

    const answers = await CbtAttemptAnswer.find({
        attempt: attempt._id,
    });

    const totalMarks = examQuestions.reduce(
        (sum, question) =>
            sum + Number(question.marks || 0),
        0
    );

    let score = 0;

    const answerUpdates = answers.map((answer) => {
        const question = questionMap.get(
            answer.question.toString()
        );

        const isCorrect =
            Boolean(question) &&
            Boolean(answer.selectedAnswer) &&
            String(answer.selectedAnswer).toLowerCase() ===
                String(question.correctAnswer).toLowerCase();

        const marksAwarded = isCorrect
            ? Number(question.marks || 0)
            : 0;

        score += marksAwarded;

        return {
            updateOne: {
                filter: { _id: answer._id },
                update: {
                    $set: {
                        isCorrect,
                        marksAwarded,
                    },
                },
            },
        };
    });

    const percentage =
        totalMarks > 0
            ? Number(
                  ((score / totalMarks) * 100).toFixed(2)
              )
            : 0;

    attempt.status = "Submitted";
    attempt.submittedAt = new Date();
    attempt.autoSubmitted = autoSubmitted;
    attempt.score = Number(score.toFixed(2));
    attempt.totalMarks = totalMarks;
    attempt.percentage = percentage;
    attempt.passed = percentage >= Number(exam.passMark);

    await attempt.save();

    if (answerUpdates.length > 0) {
        await CbtAttemptAnswer.bulkWrite(answerUpdates);
    }

    await applyLinkedAssessmentScore(exam, attempt);

    return attempt;
};

const getQuestionBreakdown = async (
    attempt,
    exam,
    canReview
) => {
    const examQuestions = await CbtExamQuestion.find({
        exam: exam._id,
    }).sort({ order: 1 });

    const answers = await CbtAttemptAnswer.find({
        attempt: attempt._id,
    });

    const answerMap = new Map(
        answers.map((answer) => [
            answer.question.toString(),
            answer,
        ])
    );

    return examQuestions.map((question) => {
        const answer = answerMap.get(
            question._id.toString()
        );

        const entry = {
            question: question._id,
            questionText: question.questionText,
            type: question.type,
            marks: question.marks,
            selectedAnswer: answer?.selectedAnswer || "",
            isCorrect: Boolean(answer?.isCorrect),
            marksAwarded: answer?.marksAwarded || 0,
        };

        if (canReview) {
            entry.options = question.options;
            entry.correctAnswer = question.correctAnswer;
            entry.explanation = question.explanation;
        }

        return entry;
    });
};

const buildResultPayload = async (
    attempt,
    exam,
    user
) => {
    const staff =
        user.role === "admin" || user.role === "teacher";
    const visible = isResultVisible(exam, attempt);
    const canReview =
        staff || (visible && exam.allowReview === true);

    const payload = {
        exam: {
            _id: exam._id,
            title: exam.title,
            totalMarks: exam.totalMarks,
            passMark: exam.passMark,
            resultVisibility: exam.resultVisibility,
            resultsPublished: exam.resultsPublished,
            allowReview: exam.allowReview,
        },
        attempt: {
            _id: attempt._id,
            attemptNumber: attempt.attemptNumber,
            status: attempt.status,
            startedAt: attempt.startedAt,
            expiresAt: attempt.expiresAt,
            submittedAt: attempt.submittedAt,
            autoSubmitted: attempt.autoSubmitted,
        },
        resultVisible: visible,
        canReview,
    };

    if (!visible && !staff) {
        return payload;
    }

    payload.attempt = {
        ...payload.attempt,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        passed: attempt.passed,
        linkedScoreStatus: attempt.linkedScoreStatus,
    };

    payload.breakdown = await getQuestionBreakdown(
        attempt,
        exam,
        canReview
    );

    return payload;
};

// ======================================================
// Student Exam List
// ======================================================

export const getStudentCbtExamsService = async (
    query,
    user
) => {
    const student = await getStudentForUser(user._id);

    const classSubjectIds = student.academicClass
        ? await ClassSubject.find({
              academicClass: student.academicClass,
              isActive: true,
          }).distinct("_id")
        : [];

    const attempts = await CbtAttempt.find({
        student: student._id,
    }).sort({ attemptNumber: -1 });

    const attemptMap = new Map();
    const usageMap = new Map();

    attempts.forEach((attempt) => {
        const key = attempt.exam.toString();

        if (!attemptMap.has(key)) {
            attemptMap.set(key, attempt);
        }

        if (attempt.status !== "Voided") {
            usageMap.set(key, (usageMap.get(key) || 0) + 1);
        }
    });

    const exams = await CbtExam.find({
        isPublished: true,
        isActive: true,
        $or: [
            { classSubject: { $in: classSubjectIds } },
            {
                _id: {
                    $in: attempts.map(
                        (attempt) => attempt.exam
                    ),
                },
            },
        ],
    })
        .populate({
            path: "classSubject",
            populate: [
                {
                    path: "subject",
                    select: "name prefix",
                },
                {
                    path: "academicClass",
                    select: "name",
                },
            ],
        })
        .populate("academicSemester", "name")
        .sort({ startAt: -1 });

    const now = Date.now();

    let data = exams.map((exam) => {
        const attempt = attemptMap.get(
            exam._id.toString()
        );
        const attemptsUsed = usageMap.get(exam._id.toString()) || 0;
        const hasAttemptsLeft =
            attemptsUsed < Number(exam.maxAttempts || 1);

        let status = "Available";

        if (attempt?.status === "InProgress") {
            status = "InProgress";
        } else if (attemptsUsed > 0 && !hasAttemptsLeft) {
            status = "Completed";
        } else if (
            exam.isClosed ||
            new Date(exam.endAt).getTime() <= now
        ) {
            status = "Closed";
        } else if (
            new Date(exam.startAt).getTime() > now
        ) {
            status = "Upcoming";
        }

        const visible = attempt
            ? isResultVisible(exam, attempt)
            : false;

        return {
            _id: exam._id,
            title: exam.title,
            description: exam.description,
            instructions: exam.instructions,
            classSubject: exam.classSubject,
            academicSemester: exam.academicSemester,
            startAt: exam.startAt,
            endAt: exam.endAt,
            durationMinutes: exam.durationMinutes,
            totalMarks: exam.totalMarks,
            passMark: exam.passMark,
            maxAttempts: exam.maxAttempts,
            attemptsUsed,
            status,
            attempt: attempt
                ? {
                      _id: attempt._id,
                      status: attempt.status,
                      attemptNumber:
                          attempt.attemptNumber,
                      submittedAt: attempt.submittedAt,
                      resultVisible: visible,
                      ...(visible
                          ? {
                                score: attempt.score,
                                totalMarks:
                                    attempt.totalMarks,
                                percentage:
                                    attempt.percentage,
                                passed: attempt.passed,
                            }
                          : {}),
                  }
                : null,
        };
    });

    if (query.status && query.status !== "all") {
        const statusFilter = String(
            query.status
        ).toLowerCase();

        data = data.filter(
            (exam) =>
                exam.status.toLowerCase() === statusFilter
        );
    }

    const page = Math.max(
        Number.parseInt(query.page, 10) || 1,
        1
    );
    const limit = Math.min(
        Number.parseInt(query.limit, 10) || 20,
        200
    );
    const skip = (page - 1) * limit;

    return {
        data: data.slice(skip, skip + limit),
        pagination: buildPagination(
            data.length,
            page,
            limit
        ),
    };
};

// ======================================================
// Start / Resume Attempt
// ======================================================

export const startCbtAttemptService = async (
    examId,
    user,
    reqInfo = {}
) => {
    const student = await getStudentForUser(user._id);

    const exam = await getExamOrFail(examId);

    if (!isExamAvailable(exam)) {
        throw badRequest(
            "This exam is not currently open for attempts."
        );
    }

    await assertStudentEligible(student, exam);

    const existing = await CbtAttempt.findOne({
        exam: exam._id,
        student: student._id,
    }).sort({ attemptNumber: -1 });

    if (existing?.status === "InProgress") {
        if (
            new Date(existing.expiresAt).getTime() <=
            Date.now()
        ) {
            await finalizeAttempt(existing, exam, {
                autoSubmitted: true,
            });

            throw conflict(
                "Your attempt time has expired and the attempt was submitted."
            );
        }

        return await buildAttemptPayload(existing, exam);
    }

    const attempts = await CbtAttempt.find({
        exam: exam._id,
        student: student._id,
    }).sort({ attemptNumber: -1 });

    const validAttempts = attempts.filter(
        (attempt) => attempt.status !== "Voided"
    );

    if (validAttempts.length >= exam.maxAttempts) {
        throw conflict(
            "You have already used all attempts for this exam."
        );
    }

    const examQuestions = await CbtExamQuestion.find({
        exam: exam._id,
    }).sort({ order: 1 });

    if (examQuestions.length === 0) {
        throw badRequest(
            "This exam does not contain any questions."
        );
    }

    const questionIds = examQuestions.map(
        (question) => question._id
    );

    const nextAttemptNumber =
        attempts.length > 0
            ? Number(attempts[0].attemptNumber) + 1
            : 1;

    const startedAt = new Date();

    const expiresAt = new Date(
        Math.min(
            startedAt.getTime() +
                Number(exam.durationMinutes) * 60 * 1000,
            new Date(exam.endAt).getTime()
        )
    );

    const attempt = await CbtAttempt.create({
        exam: exam._id,
        student: student._id,
        attemptNumber: nextAttemptNumber,
        status: "InProgress",
        startedAt,
        expiresAt,
        totalMarks: exam.totalMarks,
        questionOrder: exam.shuffleQuestions
            ? shuffle(questionIds)
            : questionIds,
        optionOrder: buildOptionOrder(
            exam,
            examQuestions
        ),
        startedIp: reqInfo.ip || "",
        userAgent: reqInfo.userAgent || "",
    });

    return await buildAttemptPayload(attempt, exam);
};

// ======================================================
// Get / Resume Attempt
// ======================================================

export const getStudentCbtAttemptService = async (
    attemptId,
    user
) => {
    const attempt = await getAttemptOrFail(attemptId);

    await getAttemptAccess(attempt, user);

    const exam = await getExamOrFail(attempt.exam);

    if (
        attempt.status === "InProgress" &&
        new Date(attempt.expiresAt).getTime() <=
            Date.now()
    ) {
        await finalizeAttempt(attempt, exam, {
            autoSubmitted: true,
        });
    }

    return await buildAttemptPayload(attempt, exam);
};

// ======================================================
// Save Answers
// ======================================================

export const saveCbtAnswersService = async (
    attemptId,
    data,
    user
) => {
    const attempt = await getAttemptOrFail(attemptId);

    await getAttemptAccess(attempt, user);

    const exam = await getExamOrFail(attempt.exam);

    if (attempt.status !== "InProgress") {
        throw conflict(
            "This attempt has already been submitted."
        );
    }

    if (
        new Date(attempt.expiresAt).getTime() <=
        Date.now()
    ) {
        await finalizeAttempt(attempt, exam, {
            autoSubmitted: true,
        });

        throw badRequest(
            "Time has expired. Your attempt was submitted automatically."
        );
    }

    const questionIds = data.answers.map(
        (answer) => answer.question
    );

    if (
        new Set(questionIds).size !== questionIds.length
    ) {
        throw badRequest(
            "The answer list contains duplicate questions."
        );
    }

    const examQuestions = await CbtExamQuestion.find({
        exam: exam._id,
        _id: { $in: questionIds },
    });

    if (examQuestions.length !== questionIds.length) {
        throw badRequest(
            "One or more answers reference a question that is not part of this exam."
        );
    }

    const questionMap = new Map(
        examQuestions.map((question) => [
            question._id.toString(),
            question,
        ])
    );

    const updates = data.answers.map((answer) => {
        const question = questionMap.get(answer.question);
        const requested = String(
            answer.selectedAnswer || ""
        ).trim();

        let selectedAnswer = "";

        if (requested) {
            const matched = question.options.find(
                (option) =>
                    option.key.toLowerCase() ===
                    requested.toLowerCase()
            );

            if (!matched) {
                throw badRequest(
                    `Selected answer is not a valid option for question ${question._id}.`
                );
            }

            selectedAnswer = matched.key;
        }

        return {
            updateOne: {
                filter: {
                    attempt: attempt._id,
                    question: question._id,
                },
                update: {
                    $set: {
                        exam: exam._id,
                        student: attempt.student,
                        selectedAnswer,
                        answeredAt: new Date(),
                    },
                },
                upsert: true,
            },
        };
    });

    await CbtAttemptAnswer.bulkWrite(updates);

    return {
        saved: updates.length,
        serverTime: new Date(),
        expiresAt: attempt.expiresAt,
    };
};

// ======================================================
// Submit Attempt
// ======================================================

export const submitCbtAttemptService = async (
    attemptId,
    user,
    reqInfo = {}
) => {
    const attempt = await getAttemptOrFail(attemptId);

    await getAttemptAccess(attempt, user);

    const exam = await getExamOrFail(attempt.exam);

    if (attempt.status === "InProgress") {
        const expired =
            new Date(attempt.expiresAt).getTime() <=
            Date.now();

        attempt.submittedIp = reqInfo.ip || "";

        await finalizeAttempt(attempt, exam, {
            autoSubmitted: expired,
        });
    }

    return await buildResultPayload(
        attempt,
        exam,
        user
    );
};

// ======================================================
// Attempt Result
// ======================================================

export const getCbtAttemptResultService = async (
    attemptId,
    user
) => {
    const attempt = await getAttemptOrFail(attemptId);

    await getAttemptAccess(attempt, user);

    const exam = await getExamOrFail(attempt.exam);

    if (
        attempt.status === "InProgress" &&
        new Date(attempt.expiresAt).getTime() <=
            Date.now()
    ) {
        await finalizeAttempt(attempt, exam, {
            autoSubmitted: true,
        });
    }

    return await buildResultPayload(attempt, exam, user);
};

// ======================================================
// Attempt Lists
// ======================================================

const mapAttemptListItem = (attempt, exam, user) => {
    const staff =
        user.role === "admin" || user.role === "teacher";
    const visible = isResultVisible(exam, attempt);

    return {
        _id: attempt._id,
        exam: exam
            ? {
                  _id: exam._id,
                  title: exam.title,
                  totalMarks: exam.totalMarks,
                  passMark: exam.passMark,
              }
            : attempt.exam,
        status: attempt.status,
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        expiresAt: attempt.expiresAt,
        autoSubmitted: attempt.autoSubmitted,
        resultVisible: visible || staff,
        ...(visible || staff
            ? {
                  score: attempt.score,
                  totalMarks: attempt.totalMarks,
                  percentage: attempt.percentage,
                  passed: attempt.passed,
              }
            : {}),
    };
};

export const getStudentCbtAttemptsService = async (
    query,
    user
) => {
    const student = await getStudentForUser(user._id);

    return await getStudentCbtAttemptsForStudentService(
        student._id,
        query,
        user
    );
};

export const getStudentCbtAttemptsForStudentService = async (
    studentId,
    query,
    user
) => {
    const student = await assertStudentAccess(
        user,
        studentId
    );

    const { page, limit, skip } = getPagination(query);

    const filter = { student: student._id };

    if (query.exam) {
        filter.exam = query.exam;
    }

    if (query.status) {
        filter.status = query.status;
    }

    const [attempts, total] = await Promise.all([
        CbtAttempt.find(filter)
            .populate("exam", "title totalMarks passMark")
            .sort({ startedAt: -1 })
            .skip(skip)
            .limit(limit),
        CbtAttempt.countDocuments(filter),
    ]);

    return {
        student: {
            id: student._id,
            fullName: student.fullName,
            registrationNumber:
                student.registrationNumber,
            academicClass: student.academicClass,
        },
        ...{
            data: attempts.map((attempt) =>
                mapAttemptListItem(
                    attempt,
                    attempt.exam,
                    user
                )
            ),
            pagination: buildPagination(
                total,
                page,
                limit
            ),
        },
    };
};
