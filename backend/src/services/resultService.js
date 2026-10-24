import Assessment from "../models/Assessment.js";
import AssessmentScore from "../models/AssessmentScore.js";
import Result from "../models/Result.js";
import AcademicSession from "../models/AcademicSession.js";
import AcademicSemester from "../models/AcademicSemester.js";
import ClassSubject from "../models/ClassSubject.js";
import Student from "../models/Student.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import {
    assertStudentAccess,
    assertTeacherClassSubjectAccess,
} from "./accessControlService.js";
import {
    createStudentAudienceNotifications,
} from "./communicationService.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import {
    calculateGradePointAverage,
    calculateWeightedScore,
    getGrade,
} from "../utils/grading.js";
import {
    badRequest,
    forbidden,
    notFound,
} from "../utils/AppError.js";

// ======================================================
// Helpers
// ======================================================

const getClassSubjectOrFail = async (classSubjectId) => {
    const classSubject = await ClassSubject.findById(
        classSubjectId
    );

    if (!classSubject) {
        throw notFound("Class subject not found.");
    }

    return classSubject;
};

const getSemesterOrFail = async (academicSemesterId) => {
    const semester = await AcademicSemester.findById(
        academicSemesterId
    );

    if (!semester) {
        throw notFound("Academic semester not found.");
    }

    return semester;
};

const assertClassSubjectAccess = async (
    user,
    classSubjectId
) => {
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

const populateResult = (query) =>
    query
        .populate(
            "student",
            "firstName middleName lastName registrationNumber academicClass"
        )
        .populate({
            path: "classSubject",
            populate: [
                {
                    path: "subject",
                    select: "name prefix",
                },
                {
                    path: "academicClass",
                    select: "name academicLevel",
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
        );

const getClassStudents = async (
    academicClass,
    academicSession
) => {
    const enrolledStudentIds =
        await StudentEnrollment.find({
            academicClass,
            academicSession,
            status: "Active",
            isActive: true,
        }).distinct("student");

    return await Student.find({
        isActive: true,
        $or: [
            {
                _id: { $in: enrolledStudentIds },
            },
            {
                academicClass,
            },
        ],
    })
        .select(
            "_id firstName middleName lastName registrationNumber academicClass"
        )
        .sort({
            lastName: 1,
            firstName: 1,
        });
};

const buildResultSummary = (results) => {
    const summary = {
        subjects: results.length,
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        gradeDistribution: {
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            E: 0,
            F: 0,
        },
    };

    if (results.length === 0) {
        return summary;
    }

    const scores = results.map(
        (result) => Number(result.totalScore)
    );

    summary.totalScore = Number(
        scores
            .reduce((sum, score) => sum + score, 0)
            .toFixed(2)
    );
    summary.averageScore = Number(
        (summary.totalScore / results.length).toFixed(2)
    );
    summary.highestScore = Math.max(...scores);
    summary.lowestScore = Math.min(...scores);
    summary.passRate = Number(
        (
            (scores.filter((score) => score >= 40).length /
                scores.length) *
            100
        ).toFixed(2)
    );

    results.forEach((result) => {
        if (
            summary.gradeDistribution[
                result.letterGrade
            ] !== undefined
        ) {
            summary.gradeDistribution[
                result.letterGrade
            ] += 1;
        }
    });

    return summary;
};

const resolveSemester = async (academicSemesterId) => {
    if (academicSemesterId) {
        return await getSemesterOrFail(
            academicSemesterId
        );
    }

    const current = await AcademicSemester.findOne({
        isCurrent: true,
        isActive: true,
    }).sort({ startDate: -1 });

    if (current) {
        return current;
    }

    const latest = await AcademicSemester.findOne({
        isActive: true,
    }).sort({ startDate: -1 });

    if (!latest) {
        throw notFound("No academic semester found.");
    }

    return latest;
};

// ======================================================
// Compute Class Results
// Admin / Teacher
// ======================================================

export const computeClassResultsService = async (
    data,
    user
) => {
    const classSubject = await getClassSubjectOrFail(
        data.classSubject
    );

    const semester = await getSemesterOrFail(
        data.academicSemester ||
            classSubject.academicSemester
    );

    if (
        classSubject.academicSemester.toString() !==
        semester._id.toString()
    ) {
        throw badRequest(
            "The class subject does not belong to the selected academic semester."
        );
    }

    await assertClassSubjectAccess(
        user,
        classSubject._id
    );

    const assessments = await Assessment.find({
        classSubject: classSubject._id,
        academicSemester: semester._id,
        isActive: true,
    })
        .select(
            "_id name type maxScore weight date"
        )
        .sort({ date: 1 });

    if (assessments.length === 0) {
        throw badRequest(
            "No active assessments exist for this class subject and semester."
        );
    }

    const students = await getClassStudents(
        classSubject.academicClass,
        semester.academicSession
    );

    if (students.length === 0) {
        throw badRequest(
            "No students are enrolled in this class."
        );
    }

    const studentIds = students.map(
        (student) => student._id
    );

    const assessmentIds = assessments.map(
        (assessment) => assessment._id
    );

    const scores = await AssessmentScore.find({
        assessment: { $in: assessmentIds },
        student: { $in: studentIds },
    }).select("assessment student score");

    const scoreMap = new Map();

    scores.forEach((score) => {
        scoreMap.set(
            `${score.student.toString()}_${score.assessment.toString()}`,
            Number(score.score)
        );
    });

    const scoredStudentIds = new Set(
        scores.map((score) => score.student.toString())
    );

    const targetStudents = students.filter((student) =>
        scoredStudentIds.has(student._id.toString())
    );

    if (targetStudents.length === 0) {
        throw badRequest(
            "No scores have been entered for this class subject and semester."
        );
    }

    const resultDocuments = targetStudents.map((student) => {
        const breakdown = assessments.map((assessment) => {
            const key = `${student._id.toString()}_${assessment._id.toString()}`;

            const score = scoreMap.has(key)
                ? scoreMap.get(key)
                : null;

            return {
                assessment: assessment._id,
                name: assessment.name,
                type: assessment.type,
                score,
                maxScore: assessment.maxScore,
                weight: assessment.weight,
                percentage:
                    score !== null &&
                    Number(assessment.maxScore) > 0
                        ? Number(
                              (
                                  (score /
                                      Number(
                                          assessment.maxScore
                                      )) *
                                  100
                              ).toFixed(2)
                          )
                        : null,
            };
        });

        const { totalScore } =
            calculateWeightedScore(breakdown);

        const grade = getGrade(totalScore);

        return {
            student: student._id,
            classSubject: classSubject._id,
            academicSession:
                semester.academicSession,
            academicSemester: semester._id,
            breakdown,
            totalScore,
            letterGrade: grade.letterGrade,
            gradePoint: grade.gradePoint,
            remark: grade.remark,
            computedBy: user._id,
            computedAt: new Date(),
        };
    });

    const targetStudentIds = targetStudents.map(
        (student) => student._id
    );

    await Result.deleteMany({
        classSubject: classSubject._id,
        academicSemester: semester._id,
        student: { $nin: targetStudentIds },
    });

    await Result.bulkWrite(
        resultDocuments.map((resultDocument) => ({
            updateOne: {
                filter: {
                    student: resultDocument.student,
                    classSubject:
                        resultDocument.classSubject,
                    academicSemester:
                        resultDocument.academicSemester,
                },
                update: {
                    $set: {
                        academicSession:
                            resultDocument.academicSession,
                        breakdown:
                            resultDocument.breakdown,
                        totalScore:
                            resultDocument.totalScore,
                        letterGrade:
                            resultDocument.letterGrade,
                        gradePoint:
                            resultDocument.gradePoint,
                        remark: resultDocument.remark,
                        computedBy:
                            resultDocument.computedBy,
                        computedAt:
                            resultDocument.computedAt,
                    },
                    $setOnInsert: {
                        isPublished: false,
                        publishedBy: null,
                        publishedAt: null,
                    },
                },
                upsert: true,
            },
        }))
    );

    const results = await populateResult(
        Result.find({
            classSubject: classSubject._id,
            academicSemester: semester._id,
            student: { $in: targetStudentIds },
        })
    ).sort({ totalScore: -1, "student.lastName": 1 });

    return {
        classSubject: {
            id: classSubject._id,
            courseCode: classSubject.courseCode,
        },
        academicSemester: {
            id: semester._id,
            name: semester.name,
        },
        assessmentsUsed: assessments.length,
        studentsProcessed: results.length,
        results,
    };
};

// ======================================================
// Get Class Results
// Admin / Teacher
// ======================================================

export const getClassResultsService = async (
    classSubject,
    query,
    user
) => {
    await assertClassSubjectAccess(user, classSubject);

    const { page, limit, skip } = getPagination(query);

    const filter = {
        classSubject,
    };

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester =
            query.academicSemester;
    }

    if (query.isPublished !== undefined) {
        filter.isPublished =
            query.isPublished === "true";
    }

    if (query.student) {
        filter.student = query.student;
    }

    const [results, total, allResults] = await Promise.all([
        populateResult(Result.find(filter))
            .sort({
                totalScore: -1,
                "student.lastName": 1,
            })
            .skip(skip)
            .limit(limit),
        Result.countDocuments(filter),
        Result.find(filter).select(
            "totalScore letterGrade"
        ),
    ]);

    return {
        ...paginatedResult(results, total, {
            page,
            limit,
        }),
        summary: buildResultSummary(allResults),
    };
};

// ======================================================
// Get Student Results
// Admin / Teacher / Student
// ======================================================

export const getStudentResultsService = async (
    studentId,
    query,
    user
) => {
    const student = await assertStudentAccess(
        user,
        studentId
    );

    const { page, limit, skip } = getPagination(query);

    const filter = {
        student: studentId,
    };

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester =
            query.academicSemester;
    }

    if (query.classSubject) {
        filter.classSubject = query.classSubject;
    }

    if (
        user.role === "student" ||
        user.role === "parent"
    ) {
        filter.isPublished = true;
    } else if (query.isPublished !== undefined) {
        filter.isPublished =
            query.isPublished === "true";
    }

    const [results, total, allResults] = await Promise.all([
        populateResult(Result.find(filter))
            .sort({
                "academicSemester.startDate": -1,
                "classSubject.courseCode": 1,
            })
            .skip(skip)
            .limit(limit),
        Result.countDocuments(filter),
        Result.find(filter).select(
            "totalScore letterGrade gradePoint"
        ),
    ]);

    const summary = buildResultSummary(allResults);

    summary.gpa = calculateGradePointAverage(
        allResults
    );

    return {
        student: {
            id: student._id,
            fullName: student.fullName,
            registrationNumber:
                student.registrationNumber,
            academicClass: student.academicClass,
        },
        ...paginatedResult(results, total, {
            page,
            limit,
        }),
        summary,
    };
};

// ======================================================
// Publish / Unpublish Results
// Admin
// ======================================================

export const publishResultsService = async (
    data,
    user
) => {
    const classSubject = await getClassSubjectOrFail(
        data.classSubject
    );

    const semester = await getSemesterOrFail(
        data.academicSemester ||
            classSubject.academicSemester
    );

    if (
        classSubject.academicSemester.toString() !==
        semester._id.toString()
    ) {
        throw badRequest(
            "The class subject does not belong to the selected academic semester."
        );
    }

    const filter = {
        classSubject: classSubject._id,
        academicSemester: semester._id,
    };

    if (
        Array.isArray(data.studentIds) &&
        data.studentIds.length > 0
    ) {
        filter.student = {
            $in: data.studentIds,
        };
    }

    const count = await Result.countDocuments(filter);

    if (count === 0) {
        throw badRequest(
            "No results found to publish. Compute results first."
        );
    }

    const isPublished = data.isPublished !== false;

    const update = {
        isPublished,
        publishedBy: isPublished ? user._id : null,
        publishedAt: isPublished ? new Date() : null,
    };

    const result = await Result.updateMany(
        filter,
        {
            $set: update,
        }
    );

    if (isPublished && result.modifiedCount > 0) {
        try {
            const studentIds = await Result.distinct(
                "student",
                filter
            );

            await createStudentAudienceNotifications({
                studentIds,
                title: "Results published",
                message: `Results for ${classSubject.courseCode} (${semester.name}) have been published and are now available in your portal.`,
                type: "result",
                referenceId: classSubject._id,
                createdBy: user._id,
            });
        } catch (error) {
            // Notifications must not block result publishing.
        }
    }

    return {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        isPublished,
        classSubject: classSubject._id,
        academicSemester: semester._id,
    };
};

// ======================================================
// Report Card
// Admin / Teacher / Student
// ======================================================

export const getReportCardService = async (
    studentId,
    query,
    user
) => {
    const student = await assertStudentAccess(
        user,
        studentId
    );

    const semester = await resolveSemester(
        query.academicSemester
    );

    const filter = {
        student: studentId,
        academicSemester: semester._id,
    };

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (
        user.role === "student" ||
        user.role === "parent"
    ) {
        filter.isPublished = true;
    }

    const results = await populateResult(
        Result.find(filter)
    ).sort({
        "classSubject.courseCode": 1,
    });

    if (results.length === 0) {
        throw notFound(
            "No results found for this student in the selected semester."
        );
    }

    const session = await AcademicSession.findById(
        semester.academicSession
    );

    const averageScore = Number(
        (
            results.reduce(
                (sum, result) =>
                    sum + Number(result.totalScore),
                0
            ) / results.length
        ).toFixed(2)
    );

    const overallGrade = getGrade(averageScore);

    const classSubjectIds = results.map(
        (result) =>
            result.classSubject?._id ||
            result.classSubject
    );

    const rankingResults = await Result.find({
        classSubject: { $in: classSubjectIds },
        academicSemester: semester._id,
        ...(user.role === "student" ||
        user.role === "parent"
            ? { isPublished: true }
            : {}),
    }).select("student totalScore");

    const byStudent = new Map();

    rankingResults.forEach((result) => {
        const key = result.student.toString();

        const current = byStudent.get(key) || {
            student: key,
            total: 0,
            count: 0,
        };

        current.total += Number(result.totalScore);
        current.count += 1;

        byStudent.set(key, current);
    });

    const ranking = Array.from(byStudent.values())
        .map((entry) => ({
            student: entry.student,
            average:
                entry.count > 0
                    ? entry.total / entry.count
                    : 0,
        }))
        .sort((a, b) => b.average - a.average);

    const position =
        ranking.findIndex(
            (entry) =>
                entry.student === student._id.toString()
        ) + 1;

    return {
        student: {
            id: student._id,
            fullName: student.fullName,
            registrationNumber:
                student.registrationNumber,
            academicClass: student.academicClass,
        },
        academicSession: session,
        academicSemester: semester,
        results,
        summary: {
            subjects: results.length,
            averageScore,
            letterGrade: overallGrade.letterGrade,
            gradePoint: overallGrade.gradePoint,
            remark: overallGrade.remark,
            gpa: calculateGradePointAverage(results),
            position: position > 0 ? position : null,
            classSize: ranking.length,
        },
    };
};

// ======================================================
// Transcript
// Admin / Teacher / Student
// ======================================================

export const getTranscriptService = async (
    studentId,
    query,
    user
) => {
    const student = await assertStudentAccess(
        user,
        studentId
    );

    const filter = {
        student: studentId,
    };

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (
        user.role === "student" ||
        user.role === "parent"
    ) {
        filter.isPublished = true;
    }

    const results = await populateResult(
        Result.find(filter)
    ).sort({
        "academicSession.startDate": 1,
        "academicSemester.startDate": 1,
        "classSubject.courseCode": 1,
    });

    const sessionMap = new Map();

    results.forEach((result) => {
        const sessionId =
            result.academicSession?._id?.toString() ||
            result.academicSession?.toString() ||
            "unknown";

        if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, {
                academicSession: result.academicSession,
                semesters: new Map(),
                results: [],
            });
        }

        const sessionEntry = sessionMap.get(sessionId);

        sessionEntry.results.push(result);

        const semesterId =
            result.academicSemester?._id?.toString() ||
            result.academicSemester?.toString() ||
            "unknown";

        if (!sessionEntry.semesters.has(semesterId)) {
            sessionEntry.semesters.set(semesterId, {
                academicSemester: result.academicSemester,
                results: [],
            });
        }

        sessionEntry.semesters
            .get(semesterId)
            .results.push(result);
    });

    const sessions = Array.from(sessionMap.values()).map(
        (sessionEntry) => {
            const semesters = Array.from(
                sessionEntry.semesters.values()
            ).map((semesterEntry) => {
                const averageScore = Number(
                    (
                        semesterEntry.results.reduce(
                            (sum, result) =>
                                sum +
                                Number(result.totalScore),
                            0
                        ) / semesterEntry.results.length
                    ).toFixed(2)
                );

                return {
                    academicSemester:
                        semesterEntry.academicSemester,
                    results: semesterEntry.results,
                    summary: {
                        subjects:
                            semesterEntry.results.length,
                        averageScore,
                        gpa: calculateGradePointAverage(
                            semesterEntry.results
                        ),
                    },
                };
            });

            const averageScore = Number(
                (
                    sessionEntry.results.reduce(
                        (sum, result) =>
                            sum + Number(result.totalScore),
                        0
                    ) / sessionEntry.results.length
                ).toFixed(2)
            );

            return {
                academicSession:
                    sessionEntry.academicSession,
                semesters,
                summary: {
                    subjects: sessionEntry.results.length,
                    averageScore,
                    gpa: calculateGradePointAverage(
                        sessionEntry.results
                    ),
                },
            };
        }
    );

    const averageScore =
        results.length > 0
            ? Number(
                  (
                      results.reduce(
                          (sum, result) =>
                              sum + Number(result.totalScore),
                          0
                      ) / results.length
                  ).toFixed(2)
              )
            : 0;

    return {
        student: {
            id: student._id,
            fullName: student.fullName,
            registrationNumber:
                student.registrationNumber,
            academicClass: student.academicClass,
        },
        sessions,
        summary: {
            totalSubjects: results.length,
            averageScore,
            gpa: calculateGradePointAverage(results),
        },
    };
};
