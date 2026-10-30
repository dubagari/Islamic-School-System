import AcademicClass from "../models/AcademicClass.js";
import AcademicSession from "../models/AcademicSession.js";
import AcademicSemester from "../models/AcademicSemester.js";
import AdmissionApplication from "../models/AdmissionApplication.js";
import Attendance from "../models/Attendance.js";
import ClassSubject from "../models/ClassSubject.js";
import Invoice from "../models/Invoice.js";
import Parent from "../models/Parent.js";
import Payment from "../models/Payment.js";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import Subject from "../models/Subject.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import User from "../models/User.js";
import {
    getCollectionsService,
    getFinanceSummaryService,
} from "./financeService.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import {
    buildSearchFilter,
    escapeRegex,
} from "../utils/search.js";
import { DEFAULT_GRADE_SCALE } from "../utils/grading.js";

// ======================================================
// Date / Academic Context Helpers
// ======================================================

const startOfUtcDay = (value = new Date()) => {
    const date = new Date(value);

    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
        )
    );
};

const endOfUtcDay = (value = new Date()) => {
    const date = startOfUtcDay(value);

    return new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
};

const resolveAcademicContext = async (query = {}) => {
    let session = null;
    let semester = null;

    if (query.academicSemester) {
        semester = await AcademicSemester.findById(
            query.academicSemester
        );

        if (query.academicSession) {
            session = await AcademicSession.findById(
                query.academicSession
            );
        } else if (semester) {
            session = await AcademicSession.findById(
                semester.academicSession
            );
        }

        return { session, semester };
    }

    if (query.academicSession) {
        session = await AcademicSession.findById(
            query.academicSession
        );

        return { session, semester: null };
    }

    session =
        (await AcademicSession.findOne({
            isCurrent: true,
            isActive: true,
        })) ||
        (await AcademicSession.findOne({
            isActive: true,
        }).sort({ startDate: -1 }));

    if (session) {
        semester =
            (await AcademicSemester.findOne({
                academicSession: session._id,
                isCurrent: true,
                isActive: true,
            })) ||
            (await AcademicSemester.findOne({
                academicSession: session._id,
                isActive: true,
            }).sort({ startDate: -1 }));
    }

    return { session, semester };
};

const percentage = (numerator, denominator) => {
    if (!denominator) {
        return 0;
    }

    return Number(
        ((numerator / denominator) * 100).toFixed(2)
    );
};

const average = (value) => Number((value || 0).toFixed(2));

const gradeDistributionFromRows = (rows) => {
    const distribution = {};

    DEFAULT_GRADE_SCALE.forEach((grade) => {
        distribution[grade.letterGrade] = 0;
    });

    rows.forEach((row) => {
        distribution[row._id] = row.count;
    });

    return distribution;
};

const createGroupBucket = (label) => ({
    label,
    total: 0,
    male: 0,
    female: 0,
    active: 0,
    completed: 0,
    transferred: 0,
    withdrawn: 0,
});

const addEnrollmentToBucket = (bucket, enrollment) => {
    bucket.total += 1;

    if (enrollment.student?.gender === "Male") {
        bucket.male += 1;
    } else if (enrollment.student?.gender === "Female") {
        bucket.female += 1;
    }

    const statusKey = enrollment.status.toLowerCase();

    if (Object.prototype.hasOwnProperty.call(bucket, statusKey)) {
        bucket[statusKey] += 1;
    }
};

const groupedEnrollments = (enrollments, selector) => {
    const map = new Map();

    enrollments.forEach((enrollment) => {
        const { key, label } = selector(enrollment);

        if (!map.has(key)) {
            map.set(key, createGroupBucket(label));
        }

        addEnrollmentToBucket(map.get(key), enrollment);
    });

    return [...map.values()].sort((a, b) =>
        a.label.localeCompare(b.label)
    );
};

// ======================================================
// Dashboard
// ======================================================

export const getDashboardReportService = async () => {
    const context = await resolveAcademicContext({});

    const todayStart = startOfUtcDay();
    const todayEnd = endOfUtcDay();
    const monthStart = new Date(
        Date.UTC(
            todayStart.getUTCFullYear(),
            todayStart.getUTCMonth(),
            1
        )
    );

    const [
        totalStudents,
        activeStudents,
        activeTeachers,
        activeParents,
        activeClasses,
        pendingAdmissions,
        activeEnrollments,
        newStudentsThisMonth,
        attendanceRows,
        finance,
        publishedResults,
        pendingResults,
        recentAdmissions,
        recentPayments,
    ] = await Promise.all([
        Student.countDocuments({}),
        Student.countDocuments({
            status: "Active",
            isActive: true,
        }),
        Teacher.countDocuments({
            status: "Active",
            isActive: true,
        }),
        Parent.countDocuments({ isActive: true }),
        AcademicClass.countDocuments({ isActive: true }),
        AdmissionApplication.countDocuments({
            status: "Pending",
        }),
        context.session
            ? StudentEnrollment.countDocuments({
                  academicSession: context.session._id,
                  status: "Active",
                  isActive: true,
              })
            : StudentEnrollment.countDocuments({
                  status: "Active",
                  isActive: true,
              }),
        Student.countDocuments({
            createdAt: { $gte: monthStart },
        }),
        Attendance.aggregate([
            {
                $match: {
                    date: {
                        $gte: todayStart,
                        $lte: todayEnd,
                    },
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]),
        getFinanceSummaryService({
            academicSession: context.session?._id,
            academicSemester: context.semester?._id,
        }),
        context.semester
            ? Result.countDocuments({
                  academicSemester: context.semester._id,
                  isPublished: true,
              })
            : Result.countDocuments({ isPublished: true }),
        context.semester
            ? Result.countDocuments({
                  academicSemester: context.semester._id,
                  isPublished: false,
              })
            : Result.countDocuments({ isPublished: false }),
        AdmissionApplication.find({})
            .select(
                "firstName middleName lastName applicationNumber status paymentStatus createdAt"
            )
            .sort({ createdAt: -1 })
            .limit(5),
        Payment.find({ status: "Completed" })
            .populate(
                "student",
                "firstName middleName lastName registrationNumber"
            )
            .populate("invoice", "invoiceNumber")
            .sort({ paidAt: -1 })
            .limit(5),
    ]);

    const attendance = {
        Present: 0,
        Absent: 0,
        Late: 0,
        Excused: 0,
        total: 0,
        attendanceRate: 0,
    };

    attendanceRows.forEach((row) => {
        attendance[row._id] = row.count;
        attendance.total += row.count;
    });

    attendance.attendanceRate = percentage(
        attendance.Present + attendance.Late,
        attendance.total
    );

    return {
        academicContext: {
            session: context.session,
            semester: context.semester,
        },
        people: {
            students: {
                total: totalStudents,
                active: activeStudents,
                newThisMonth: newStudentsThisMonth,
            },
            teachers: {
                active: activeTeachers,
            },
            parents: {
                active: activeParents,
            },
        },
        academics: {
            activeClasses,
            activeEnrollments,
            pendingAdmissions,
            publishedResults,
            pendingResults,
        },
        attendanceToday: attendance,
        finance,
        recentAdmissions,
        recentPayments,
    };
};

// ======================================================
// Enrollment Report
// ======================================================

export const getEnrollmentReportService = async (
    query
) => {
    const context = await resolveAcademicContext(query);

    const session =
        query.academicSession && context.session
            ? context.session
            : context.session;

    const filter = {};

    if (session) {
        filter.academicSession = session._id;
    }

    if (query.academicClass) {
        filter.academicClass = query.academicClass;
    }

    if (query.status) {
        filter.status = query.status;
    }

    let enrollments = await StudentEnrollment.find(filter)
        .populate(
            "student",
            "firstName middleName lastName registrationNumber gender status academicClass"
        )
        .populate({
            path: "academicClass",
            select: "name academicLevel",
            populate: {
                path: "academicLevel",
                select: "name levelNumber",
            },
        })
        .sort({ enrollmentDate: -1 });

    if (query.academicLevel) {
        enrollments = enrollments.filter(
            (enrollment) =>
                enrollment.academicClass?.academicLevel?._id
                    ?.toString() ===
                query.academicLevel.toString()
        );
    }

    const groupBy = query.groupBy || "class";

    const selectors = {
        class: (enrollment) => ({
            key:
                enrollment.academicClass?._id?.toString() ||
                "unassigned",
            label:
                enrollment.academicClass?.name ||
                "Unassigned",
        }),
        level: (enrollment) => ({
            key:
                enrollment.academicClass?.academicLevel?._id
                    ?.toString() || "unassigned",
            label:
                enrollment.academicClass?.academicLevel?.name ||
                "Unassigned",
        }),
        gender: (enrollment) => ({
            key: enrollment.student?.gender || "Unknown",
            label: enrollment.student?.gender || "Unknown",
        }),
        status: (enrollment) => ({
            key: enrollment.status,
            label: enrollment.status,
        }),
    };

    const byClass = groupedEnrollments(
        enrollments,
        selectors.class
    );
    const byLevel = groupedEnrollments(
        enrollments,
        selectors.level
    );
    const byGender = groupedEnrollments(
        enrollments,
        selectors.gender
    );
    const byStatus = groupedEnrollments(
        enrollments,
        selectors.status
    );

    const breakdownByGroup = {
        class: byClass,
        level: byLevel,
        gender: byGender,
        status: byStatus,
    };

    return {
        academicSession: session,
        groupBy,
        total: enrollments.length,
        summary: {
            male: enrollments.filter(
                (enrollment) =>
                    enrollment.student?.gender === "Male"
            ).length,
            female: enrollments.filter(
                (enrollment) =>
                    enrollment.student?.gender === "Female"
            ).length,
            active: enrollments.filter(
                (enrollment) =>
                    enrollment.status === "Active"
            ).length,
        },
        breakdown: breakdownByGroup[groupBy],
        byClass,
        byLevel,
        byGender,
        byStatus,
    };
};

// ======================================================
// Attendance Report
// ======================================================

export const getAttendanceReportService = async (
    query
) => {
    const context = await resolveAcademicContext(query);

    const from = query.from
        ? startOfUtcDay(query.from)
        : startOfUtcDay(
              new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
          );

    const to = query.to
        ? endOfUtcDay(query.to)
        : endOfUtcDay();

    const filter = {
        date: {
            $gte: from,
            $lte: to,
        },
    };

    if (context.session) {
        filter.academicSession = context.session._id;
    }

    if (context.semester) {
        filter.academicSemester = context.semester._id;
    }

    if (query.academicClass) {
        filter.academicClass = query.academicClass;
    }

    if (query.student) {
        filter.student = query.student;
    }

    if (query.status) {
        filter.status = query.status;
    }

    const [statusRows, dailyRows, classRows, studentRows] =
        await Promise.all([
            Attendance.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]),
            Attendance.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$date",
                            },
                        },
                        Present: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Present"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        Absent: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Absent"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        Late: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Late"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        Excused: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Excused"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        total: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Attendance.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$academicClass",
                        Present: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Present"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        Absent: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Absent"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        Late: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Late"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        Excused: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Excused"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        total: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: AcademicClass.collection.name,
                        localField: "_id",
                        foreignField: "_id",
                        as: "academicClass",
                    },
                },
                {
                    $unwind: {
                        path: "$academicClass",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        className: {
                            $ifNull: [
                                "$academicClass.name",
                                "Unassigned",
                            ],
                        },
                        Present: 1,
                        Absent: 1,
                        Late: 1,
                        Excused: 1,
                        total: 1,
                    },
                },
                { $sort: { className: 1 } },
            ]),
            Attendance.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: "$student",
                        Present: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Present"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        Absent: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Absent"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        Late: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Late"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        Excused: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Excused"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        total: { $sum: 1 },
                    },
                },
                {
                    $addFields: {
                        attendanceRate: {
                            $cond: [
                                { $gt: ["$total", 0] },
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                {
                                                    $add: [
                                                        "$Present",
                                                        "$Late",
                                                    ],
                                                },
                                                "$total",
                                            ],
                                        },
                                        100,
                                    ],
                                },
                                0,
                            ],
                        },
                    },
                },
                {
                    $lookup: {
                        from: Student.collection.name,
                        localField: "_id",
                        foreignField: "_id",
                        as: "student",
                    },
                },
                {
                    $unwind: {
                        path: "$student",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        student: {
                            _id: 1,
                            firstName: 1,
                            middleName: 1,
                            lastName: 1,
                            registrationNumber: 1,
                        },
                        Present: 1,
                        Absent: 1,
                        Late: 1,
                        Excused: 1,
                        total: 1,
                        attendanceRate: {
                            $round: ["$attendanceRate", 2],
                        },
                    },
                },
                {
                    $sort: {
                        attendanceRate: 1,
                        "student.lastName": 1,
                    },
                },
                { $limit: 200 },
            ]),
        ]);

    const summary = {
        Present: 0,
        Absent: 0,
        Late: 0,
        Excused: 0,
        total: 0,
        uniqueStudents: studentRows.length,
        attendanceRate: 0,
    };

    statusRows.forEach((row) => {
        summary[row._id] = row.count;
        summary.total += row.count;
    });

    summary.attendanceRate = percentage(
        summary.Present + summary.Late,
        summary.total
    );

    const byDay = dailyRows.map((row) => ({
        date: row._id,
        Present: row.Present,
        Absent: row.Absent,
        Late: row.Late,
        Excused: row.Excused,
        total: row.total,
        attendanceRate: percentage(
            row.Present + row.Late,
            row.total
        ),
    }));

    const byClass = classRows.map((row) => ({
        ...row,
        attendanceRate: percentage(
            row.Present + row.Late,
            row.total
        ),
    }));

    const byStudent = studentRows.map((row) => ({
        student: {
            ...row.student,
            fullName: [
                row.student?.firstName,
                row.student?.middleName,
                row.student?.lastName,
            ]
                .filter(Boolean)
                .join(" "),
        },
        Present: row.Present,
        Absent: row.Absent,
        Late: row.Late,
        Excused: row.Excused,
        total: row.total,
        attendanceRate: row.attendanceRate,
    }));

    const byStatus = Object.keys(summary)
        .filter((key) =>
            ["Present", "Absent", "Late", "Excused"].includes(
                key
            )
        )
        .map((key) => ({
            status: key,
            count: summary[key],
            percentage: percentage(summary[key], summary.total),
        }));

    const breakdownByGroup = {
        day: byDay,
        class: byClass,
        student: byStudent,
        status: byStatus,
    };

    const groupBy = query.groupBy || "day";

    return {
        period: { from, to },
        academicSession: context.session,
        academicSemester: context.semester,
        groupBy,
        summary,
        breakdown: breakdownByGroup[groupBy],
        byDay,
        byClass,
        byStudent,
        byStatus,
    };
};

// ======================================================
// Academic Performance Report
// ======================================================

export const getAcademicReportService = async (
    query
) => {
    const context = await resolveAcademicContext(query);

    const match = {};

    if (context.session) {
        match.academicSession = context.session._id;
    }

    if (context.semester) {
        match.academicSemester = context.semester._id;
    }

    if (query.classSubject) {
        match.classSubject = query.classSubject;
    }

    if (query.includeUnpublished !== "true") {
        match.isPublished = true;
    }

    const [facet] = await Result.aggregate([
        { $match: match },
        {
            $lookup: {
                from: ClassSubject.collection.name,
                localField: "classSubject",
                foreignField: "_id",
                as: "classSubjectDoc",
            },
        },
        {
            $unwind: {
                path: "$classSubjectDoc",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: Subject.collection.name,
                localField: "classSubjectDoc.subject",
                foreignField: "_id",
                as: "subjectDoc",
            },
        },
        {
            $unwind: {
                path: "$subjectDoc",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: AcademicClass.collection.name,
                localField: "classSubjectDoc.academicClass",
                foreignField: "_id",
                as: "classDoc",
            },
        },
        {
            $unwind: {
                path: "$classDoc",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $addFields: {
                subjectName: "$subjectDoc.name",
                className: "$classDoc.name",
            },
        },
        {
            $match:
                query.academicClass
                    ? {
                          "classSubjectDoc.academicClass":
                              query.academicClass,
                      }
                    : {},
        },
        {
            $facet: {
                overall: [
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 },
                            averageScore: {
                                $avg: "$totalScore",
                            },
                            highestScore: {
                                $max: "$totalScore",
                            },
                            lowestScore: {
                                $min: "$totalScore",
                            },
                            averageGpa: {
                                $avg: "$gradePoint",
                            },
                            passes: {
                                $sum: {
                                    $cond: [
                                        {
                                            $gte: [
                                                "$totalScore",
                                                50,
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ],
                grades: [
                    {
                        $group: {
                            _id: "$letterGrade",
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ],
                subjects: [
                    {
                        $group: {
                            _id: "$classSubject",
                            subjectName: {
                                $first: "$subjectName",
                            },
                            className: {
                                $first: "$className",
                            },
                            averageScore: {
                                $avg: "$totalScore",
                            },
                            highestScore: {
                                $max: "$totalScore",
                            },
                            lowestScore: {
                                $min: "$totalScore",
                            },
                            count: { $sum: 1 },
                            passes: {
                                $sum: {
                                    $cond: [
                                        {
                                            $gte: [
                                                "$totalScore",
                                                50,
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                    { $sort: { subjectName: 1 } },
                ],
                classes: [
                    {
                        $group: {
                            _id: "$className",
                            averageScore: {
                                $avg: "$totalScore",
                            },
                            count: { $sum: 1 },
                            passes: {
                                $sum: {
                                    $cond: [
                                        {
                                            $gte: [
                                                "$totalScore",
                                                50,
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                    { $sort: { _id: 1 } },
                ],
                topStudents: [
                    {
                        $group: {
                            _id: "$student",
                            averageScore: {
                                $avg: "$totalScore",
                            },
                            averageGpa: {
                                $avg: "$gradePoint",
                            },
                            subjects: { $sum: 1 },
                        },
                    },
                    { $sort: { averageScore: -1 } },
                    { $limit: 20 },
                    {
                        $lookup: {
                            from: Student.collection.name,
                            localField: "_id",
                            foreignField: "_id",
                            as: "student",
                        },
                    },
                    {
                        $unwind: {
                            path: "$student",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                ],
            },
        },
    ]);

    const overall = facet?.overall?.[0] || {
        count: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        averageGpa: 0,
        passes: 0,
    };

    return {
        academicSession: context.session,
        academicSemester: context.semester,
        summary: {
            results: overall.count,
            averageScore: average(overall.averageScore),
            highestScore: average(overall.highestScore),
            lowestScore: average(overall.lowestScore),
            averageGpa: average(overall.averageGpa),
            passes: overall.passes,
            passRate: percentage(
                overall.passes,
                overall.count
            ),
        },
        gradeDistribution: gradeDistributionFromRows(
            facet?.grades || []
        ),
        bySubject: (facet?.subjects || []).map((row) => ({
            classSubject: row._id,
            subject: row.subjectName,
            className: row.className,
            averageScore: average(row.averageScore),
            highestScore: average(row.highestScore),
            lowestScore: average(row.lowestScore),
            results: row.count,
            passRate: percentage(row.passes, row.count),
        })),
        byClass: (facet?.classes || []).map((row) => ({
            className: row._id || "Unassigned",
            averageScore: average(row.averageScore),
            results: row.count,
            passRate: percentage(row.passes, row.count),
        })),
        topStudents: (facet?.topStudents || []).map(
            (row) => ({
                student: {
                    id: row._id,
                    fullName: [
                        row.student?.firstName,
                        row.student?.middleName,
                        row.student?.lastName,
                    ]
                        .filter(Boolean)
                        .join(" "),
                    registrationNumber:
                        row.student?.registrationNumber,
                },
                averageScore: average(row.averageScore),
                averageGpa: average(row.averageGpa),
                subjects: row.subjects,
            })
        ),
    };
};

// ======================================================
// Finance Report
// ======================================================

export const getFinanceReportService = async (
    query
) => {
    const context = await resolveAcademicContext(query);

    const reportQuery = {
        ...query,
    };

    if (!query.academicSession && context.session) {
        reportQuery.academicSession = context.session._id;
    }

    if (!query.academicSemester && context.semester) {
        reportQuery.academicSemester =
            context.semester._id;
    }

    const invoiceFilter = {
        status: { $ne: "Cancelled" },
    };

    if (reportQuery.academicSession) {
        invoiceFilter.academicSession =
            reportQuery.academicSession;
    }

    if (reportQuery.academicSemester) {
        invoiceFilter.academicSemester =
            reportQuery.academicSemester;
    }

    if (query.academicClass) {
        invoiceFilter.academicClass =
            query.academicClass;
    }

    const [summary, collections, byClass] =
        await Promise.all([
            getFinanceSummaryService(reportQuery),
            getCollectionsService({
                from: query.from,
                to: query.to,
                groupBy: query.groupBy || "day",
            }),
            Invoice.aggregate([
                { $match: invoiceFilter },
                {
                    $group: {
                        _id: "$academicClass",
                        totalBilled: {
                            $sum: "$totalAmount",
                        },
                        totalPaid: {
                            $sum: "$amountPaid",
                        },
                        totalOutstanding: {
                            $sum: "$balance",
                        },
                        invoices: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: AcademicClass.collection.name,
                        localField: "_id",
                        foreignField: "_id",
                        as: "academicClass",
                    },
                },
                {
                    $unwind: {
                        path: "$academicClass",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        className: {
                            $ifNull: [
                                "$academicClass.name",
                                "Unassigned",
                            ],
                        },
                        totalBilled: 1,
                        totalPaid: 1,
                        totalOutstanding: 1,
                        invoices: 1,
                    },
                },
                { $sort: { className: 1 } },
            ]),
        ]);

    return {
        academicSession: context.session,
        academicSemester: context.semester,
        summary,
        collections,
        byClass: byClass.map((row) => ({
            ...row,
            totalBilled: average(row.totalBilled),
            totalPaid: average(row.totalPaid),
            totalOutstanding: average(
                row.totalOutstanding
            ),
            collectionRate: percentage(
                row.totalPaid,
                row.totalBilled
            ),
        })),
    };
};

// ======================================================
// Student Roster
// ======================================================

export const getStudentRosterReportService = async (
    query
) => {
    const { page, limit, skip } = getPagination(query);

    const searchFilter = buildSearchFilter(
        query.search,
        [
            "firstName",
            "middleName",
            "lastName",
            "registrationNumber",
            "phone",
            "parentName",
            "parentPhone",
        ]
    );

    const filter = {
        ...searchFilter,
    };

    if (query.academicClass) {
        filter.academicClass = query.academicClass;
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.gender) {
        filter.gender = query.gender;
    }

    const [students, total, summaryRows] =
        await Promise.all([
            Student.find(filter)
                .populate({
                    path: "academicClass",
                    select: "name academicLevel",
                    populate: {
                        path: "academicLevel",
                        select: "name levelNumber",
                    },
                })
                .populate(
                    "user",
                    "username isActive mustChangePassword"
                )
                .sort({
                    lastName: 1,
                    firstName: 1,
                })
                .skip(skip)
                .limit(limit),
            Student.countDocuments(filter),
            Student.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        male: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$gender",
                                            "Male",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        female: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$gender",
                                            "Female",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        active: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            "Active",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
        ]);

    const data = students.map((student) => {
        const object = student.toObject({
            virtuals: true,
        });

        const dateOfBirth = student.dateOfBirth
            ? new Date(student.dateOfBirth)
            : null;

        object.age = dateOfBirth
            ? Math.max(
                  0,
                  Math.floor(
                      (Date.now() -
                          dateOfBirth.getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                  )
              )
            : null;

        return object;
    });

    return {
        ...paginatedResult(data, total, {
            page,
            limit,
        }),
        summary: {
            total: summaryRows[0]?.total || 0,
            male: summaryRows[0]?.male || 0,
            female: summaryRows[0]?.female || 0,
            active: summaryRows[0]?.active || 0,
        },
    };
};

// ======================================================
// Teacher Workload
// ======================================================

export const getTeacherWorkloadReportService = async (
    query
) => {
    const { page, limit, skip } = getPagination(query);

    const searchFilter = buildSearchFilter(
        query.search,
        [
            "firstName",
            "middleName",
            "lastName",
            "teacherNumber",
            "email",
            "phone",
        ]
    );

    const filter = {
        ...searchFilter,
    };

    if (query.status) {
        filter.status = query.status;
    }

    const [teachers, total] = await Promise.all([
        Teacher.find(filter)
            .populate("user", "fullName username isActive")
            .sort({ lastName: 1, firstName: 1 })
            .skip(skip)
            .limit(limit),
        Teacher.countDocuments(filter),
    ]);

    const userIds = teachers
        .map((teacher) => teacher.user?._id)
        .filter(Boolean);

    const [
        assignmentRows,
        classTeacherRows,
        assignedTeacherIds,
    ] = await Promise.all([
        TeacherAssignment.aggregate([
            {
                $match: {
                    teacher: { $in: userIds },
                    isActive: true,
                },
            },
            {
                $lookup: {
                    from: ClassSubject.collection.name,
                    localField: "classSubject",
                    foreignField: "_id",
                    as: "classSubject",
                },
            },
            {
                $unwind: {
                    path: "$classSubject",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$teacher",
                    assignments: { $sum: 1 },
                    subjects: {
                        $addToSet: "$classSubject.subject",
                    },
                    classes: {
                        $addToSet:
                            "$classSubject.academicClass",
                    },
                },
            },
            {
                $project: {
                    assignments: 1,
                    subjectCount: {
                        $size: {
                            $filter: {
                                input: "$subjects",
                                as: "subject",
                                cond: {
                                    $ne: ["$$subject", null],
                                },
                            },
                        },
                    },
                    classCount: {
                        $size: {
                            $filter: {
                                input: "$classes",
                                as: "class",
                                cond: {
                                    $ne: ["$$class", null],
                                },
                            },
                        },
                    },
                },
            },
        ]),
        AcademicClass.aggregate([
            {
                $match: {
                    classTeacher: { $in: userIds },
                    isActive: true,
                },
            },
            {
                $group: {
                    _id: "$classTeacher",
                    classTeacherCount: { $sum: 1 },
                },
            },
        ]),
        TeacherAssignment.distinct("teacher", {
            isActive: true,
        }),
    ]);

    const assignmentMap = new Map(
        assignmentRows.map((row) => [
            row._id.toString(),
            row,
        ])
    );

    const classTeacherMap = new Map(
        classTeacherRows.map((row) => [
            row._id.toString(),
            row.classTeacherCount,
        ])
    );

    const classTeacherIds = await AcademicClass.distinct(
        "classTeacher",
        {
            isActive: true,
            classTeacher: { $ne: null },
        }
    );

    const assignedSet = new Set([
        ...assignedTeacherIds.map((id) => id.toString()),
        ...classTeacherIds.map((id) => id.toString()),
    ]);

    const activeTeacherUserIds = await Teacher.find({
        status: "Active",
        isActive: true,
        user: { $ne: null },
    }).distinct("user");

    const unassignedTeachers = activeTeacherUserIds.filter(
        (userId) => !assignedSet.has(userId.toString())
    ).length;

    const data = teachers.map((teacher) => {
        const userId = teacher.user?._id?.toString();

        const assignment = userId
            ? assignmentMap.get(userId)
            : null;

        const classTeacherCount = userId
            ? classTeacherMap.get(userId) || 0
            : 0;

        return {
            ...teacher.toObject({
                virtuals: true,
            }),
            assignments: assignment?.assignments || 0,
            subjectCount: assignment?.subjectCount || 0,
            classCount: assignment?.classCount || 0,
            classTeacherCount,
            workload:
                (assignment?.assignments || 0) +
                classTeacherCount,
        };
    });

    return {
        ...paginatedResult(data, total, {
            page,
            limit,
        }),
        summary: {
            teachers: total,
            unassignedTeachers,
        },
    };
};
