import Assessment from "../models/Assessment.js";
import AssessmentScore from "../models/AssessmentScore.js";
import AcademicSemester from "../models/AcademicSemester.js";
import ClassSubject from "../models/ClassSubject.js";
import Student from "../models/Student.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import {
    assertTeacherClassSubjectAccess,
} from "./accessControlService.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import { escapeRegex } from "../utils/search.js";
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

const getAssessmentContext = async (classSubjectId) => {
    const classSubject = await getClassSubjectOrFail(
        classSubjectId
    );

    const semester = await getSemesterOrFail(
        classSubject.academicSemester
    );

    return {
        classSubject,
        semester,
    };
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

const populateAssessment = (query) =>
    query
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
        .populate("createdBy", "fullName username role");

const populateScore = (query) =>
    query
        .populate(
            "student",
            "firstName middleName lastName registrationNumber academicClass"
        )
        .populate(
            "recordedBy",
            "fullName username role"
        );

const getScoreStatistics = (scores) => {
    if (scores.length === 0) {
        return {
            count: 0,
            average: 0,
            highest: 0,
            lowest: 0,
        };
    }

    const values = scores.map((item) => Number(item.score));

    return {
        count: values.length,
        average: Number(
            (
                values.reduce((sum, value) => sum + value, 0) /
                values.length
            ).toFixed(2)
        ),
        highest: Math.max(...values),
        lowest: Math.min(...values),
    };
};

// ======================================================
// Create Assessment
// Admin / Teacher
// ======================================================

export const createAssessmentService = async (
    data,
    user
) => {
    const {
        classSubject,
        name,
        type,
        maxScore,
        weight,
        date,
        description,
        isActive,
    } = data;

    const context = await getAssessmentContext(
        classSubject
    );

    await assertClassSubjectAccess(user, classSubject);

    const duplicate = await Assessment.findOne({
        classSubject,
        academicSemester: context.classSubject.academicSemester,
        name: new RegExp(
            `^${escapeRegex(name)}$`,
            "i"
        ),
    });

    if (duplicate) {
        throw badRequest(
            "An assessment with this name already exists for this class subject and semester."
        );
    }

    const existing = await Assessment.find({
        classSubject,
        academicSemester: context.classSubject.academicSemester,
        isActive: true,
    }).select("weight");

    const totalWeight =
        existing.reduce(
            (sum, item) => sum + Number(item.weight || 0),
            0
        ) + Number(weight || 0);

    if (totalWeight > 100) {
        throw badRequest(
            `Total assessment weight cannot exceed 100. Current total including this assessment would be ${totalWeight}.`
        );
    }

    return await populateAssessment(
        Assessment.findById(
            (
                await Assessment.create({
                    classSubject,
                    academicSession:
                        context.semester.academicSession,
                    academicSemester:
                        context.classSubject
                            .academicSemester,
                    name,
                    type,
                    maxScore,
                    weight,
                    date: date ? new Date(date) : new Date(),
                    description: description || "",
                    isActive: isActive !== false,
                    createdBy: user._id,
                })
            )._id
        )
    );
};

// ======================================================
// List Assessments
// Admin / Teacher
// ======================================================

export const getAssessmentsService = async (
    query,
    user
) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};

    if (query.classSubject) {
        await assertClassSubjectAccess(
            user,
            query.classSubject
        );

        filter.classSubject = query.classSubject;
    } else if (user.role === "teacher") {
        const assignedClassSubjectIds =
            await TeacherAssignment.find({
                teacher: user._id,
                isActive: true,
            }).distinct("classSubject");

        filter.classSubject = {
            $in: assignedClassSubjectIds,
        };
    } else if (user.role !== "admin") {
        throw forbidden();
    }

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester = query.academicSemester;
    }

    if (query.type) {
        filter.type = query.type;
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === "true";
    }

    const [assessments, total] = await Promise.all([
        populateAssessment(Assessment.find(filter))
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Assessment.countDocuments(filter),
    ]);

    return paginatedResult(assessments, total, {
        page,
        limit,
    });
};

// ======================================================
// Get Assessment By ID
// Admin / Teacher
// ======================================================

export const getAssessmentByIdService = async (
    assessmentId,
    user
) => {
    const assessment = await populateAssessment(
        Assessment.findById(assessmentId)
    );

    if (!assessment) {
        throw notFound("Assessment not found.");
    }

    await assertClassSubjectAccess(
        user,
        assessment.classSubject._id
    );

    return assessment;
};

// ======================================================
// Update Assessment
// Admin / Teacher
// ======================================================

export const updateAssessmentService = async (
    assessmentId,
    data,
    user
) => {
    const assessment = await Assessment.findById(
        assessmentId
    );

    if (!assessment) {
        throw notFound("Assessment not found.");
    }

    await assertClassSubjectAccess(
        user,
        assessment.classSubject
    );

    if (data.name) {
        const duplicate = await Assessment.findOne({
            _id: { $ne: assessment._id },
            classSubject: assessment.classSubject,
            academicSemester:
                assessment.academicSemester,
            name: new RegExp(
                `^${escapeRegex(data.name)}$`,
                "i"
            ),
        });

        if (duplicate) {
            throw badRequest(
                "An assessment with this name already exists for this class subject and semester."
            );
        }
    }

    if (data.maxScore !== undefined) {
        const overflowingScores =
            await AssessmentScore.countDocuments({
                assessment: assessment._id,
                score: { $gt: data.maxScore },
            });

        if (overflowingScores > 0) {
            throw badRequest(
                "The new maximum score is lower than some recorded scores."
            );
        }
    }

    if (data.weight !== undefined) {
        const others = await Assessment.find({
            _id: { $ne: assessment._id },
            classSubject: assessment.classSubject,
            academicSemester:
                assessment.academicSemester,
            isActive: true,
        }).select("weight");

        const totalWeight =
            others.reduce(
                (sum, item) =>
                    sum + Number(item.weight || 0),
                0
            ) + Number(data.weight);

        if (totalWeight > 100) {
            throw badRequest(
                `Total assessment weight cannot exceed 100. Current total including this assessment would be ${totalWeight}.`
            );
        }
    }

    if (data.name !== undefined) {
        assessment.name = data.name;
    }

    if (data.type !== undefined) {
        assessment.type = data.type;
    }

    if (data.maxScore !== undefined) {
        assessment.maxScore = data.maxScore;
    }

    if (data.weight !== undefined) {
        assessment.weight = data.weight;
    }

    if (data.date !== undefined) {
        assessment.date = new Date(data.date);
    }

    if (data.description !== undefined) {
        assessment.description = data.description;
    }

    if (data.isActive !== undefined) {
        assessment.isActive = data.isActive;
    }

    await assessment.save();

    return await populateAssessment(
        Assessment.findById(assessment._id)
    );
};

// ======================================================
// Delete Assessment
// Admin / Teacher
// ======================================================

export const deleteAssessmentService = async (
    assessmentId,
    user
) => {
    const assessment = await Assessment.findById(
        assessmentId
    );

    if (!assessment) {
        throw notFound("Assessment not found.");
    }

    await assertClassSubjectAccess(
        user,
        assessment.classSubject
    );

    await AssessmentScore.deleteMany({
        assessment: assessment._id,
    });

    await assessment.deleteOne();

    return assessment;
};

// ======================================================
// Enter Scores (Bulk)
// Admin / Teacher
// ======================================================

export const bulkUpsertScoresService = async (
    assessmentId,
    data,
    user
) => {
    const assessment = await Assessment.findById(
        assessmentId
    );

    if (!assessment) {
        throw notFound("Assessment not found.");
    }

    if (!assessment.isActive) {
        throw badRequest(
            "Scores cannot be entered for an inactive assessment."
        );
    }

    await assertClassSubjectAccess(
        user,
        assessment.classSubject
    );

    const classSubject = await getClassSubjectOrFail(
        assessment.classSubject
    );

    const records = data.records;

    const studentIds = records.map(
        (record) => record.student
    );

    if (new Set(studentIds).size !== studentIds.length) {
        throw badRequest(
            "The score list contains duplicate students."
        );
    }

    const invalidScore = records.find(
        (record) =>
            Number(record.score) >
            Number(assessment.maxScore)
    );

    if (invalidScore) {
        throw badRequest(
            `Score for student ${invalidScore.student} exceeds the maximum score of ${assessment.maxScore}.`
        );
    }

    const students = await Student.find({
        _id: { $in: studentIds },
    }).select("_id academicClass");

    if (students.length !== studentIds.length) {
        const found = new Set(
            students.map((student) =>
                student._id.toString()
            )
        );

        const missing = studentIds.filter(
            (studentId) => !found.has(studentId)
        );

        throw notFound(
            `Student not found: ${missing.join(", ")}`
        );
    }

    const enrollments = await StudentEnrollment.find({
        student: { $in: studentIds },
        academicClass: classSubject.academicClass,
        academicSession: assessment.academicSession,
        status: "Active",
        isActive: true,
    }).select("student");

    const enrolledIds = new Set(
        enrollments.map((enrollment) =>
            enrollment.student.toString()
        )
    );

    const notInClass = students.filter(
        (student) =>
            student.academicClass?.toString() !==
                classSubject.academicClass.toString() &&
            !enrolledIds.has(student._id.toString())
    );

    if (notInClass.length > 0) {
        throw badRequest(
            "Some students are not enrolled in the class for this assessment."
        );
    }

    await AssessmentScore.bulkWrite(
        records.map((record) => ({
            updateOne: {
                filter: {
                    assessment: assessment._id,
                    student: record.student,
                },
                update: {
                    $set: {
                        score: record.score,
                        remarks: record.remarks || "",
                        recordedBy: user._id,
                    },
                },
                upsert: true,
            },
        }))
    );

    const scores = await populateScore(
        AssessmentScore.find({
            assessment: assessment._id,
        })
    ).sort({ "student.lastName": 1 });

    return {
        assessment: {
            id: assessment._id,
            name: assessment.name,
            type: assessment.type,
            maxScore: assessment.maxScore,
            weight: assessment.weight,
        },
        scores,
        statistics: getScoreStatistics(scores),
    };
};

// ======================================================
// Get Assessment Scores
// Admin / Teacher
// ======================================================

export const getAssessmentScoresService = async (
    assessmentId,
    user
) => {
    const assessment = await Assessment.findById(
        assessmentId
    );

    if (!assessment) {
        throw notFound("Assessment not found.");
    }

    await assertClassSubjectAccess(
        user,
        assessment.classSubject
    );

    const scores = await populateScore(
        AssessmentScore.find({
            assessment: assessment._id,
        })
    ).sort({ "student.lastName": 1 });

    return {
        assessment,
        scores,
        statistics: getScoreStatistics(scores),
    };
};

// ======================================================
// Update Score
// Admin / Teacher
// ======================================================

export const updateScoreService = async (
    scoreId,
    data,
    user
) => {
    const score = await AssessmentScore.findById(
        scoreId
    ).populate("assessment");

    if (!score) {
        throw notFound("Assessment score not found.");
    }

    await assertClassSubjectAccess(
        user,
        score.assessment.classSubject
    );

    if (
        data.score !== undefined &&
        Number(data.score) >
            Number(score.assessment.maxScore)
    ) {
        throw badRequest(
            `Score cannot exceed the maximum score of ${score.assessment.maxScore}.`
        );
    }

    if (data.score !== undefined) {
        score.score = data.score;
    }

    if (data.remarks !== undefined) {
        score.remarks = data.remarks;
    }

    score.recordedBy = user._id;

    await score.save();

    return await populateScore(
        AssessmentScore.findById(score._id)
    );
};

// ======================================================
// Delete Score
// Admin / Teacher
// ======================================================

export const deleteScoreService = async (
    scoreId,
    user
) => {
    const score = await AssessmentScore.findById(
        scoreId
    ).populate("assessment");

    if (!score) {
        throw notFound("Assessment score not found.");
    }

    await assertClassSubjectAccess(
        user,
        score.assessment.classSubject
    );

    await score.deleteOne();

    return score;
};
