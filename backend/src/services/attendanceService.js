import Attendance from "../models/Attendance.js";
import TeacherAttendance from "../models/TeacherAttendance.js";
import AcademicClass from "../models/AcademicClass.js";
import AcademicSession from "../models/AcademicSession.js";
import AcademicSemester from "../models/AcademicSemester.js";
import Student from "../models/Student.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import Teacher from "../models/Teacher.js";
import {
    assertStudentAccess,
    assertTeacherClassAccess,
    getTeacherForUser,
} from "./accessControlService.js";
import {
    createStudentAudienceNotifications,
} from "./communicationService.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import {
    isFutureDate,
    toDateOnly,
} from "../utils/date.js";
import {
    badRequest,
    forbidden,
    notFound,
} from "../utils/AppError.js";

// ======================================================
// Helpers
// ======================================================

const assertClassAccessByRole = async (user, academicClassId) => {
    if (!user || user.role === "student") {
        throw forbidden();
    }

    if (user.role === "admin") {
        const academicClass = await AcademicClass.findById(
            academicClassId
        );

        if (!academicClass) {
            throw notFound("Academic class not found.");
        }

        return;
    }

    if (user.role !== "teacher") {
        throw forbidden();
    }

    await assertTeacherClassAccess(
        user._id,
        academicClassId
    );
};

const ensureAcademicContext = async ({
    academicClass,
    academicSession,
    academicSemester,
}) => {
    const [classRecord, session, semester] = await Promise.all([
        AcademicClass.findById(academicClass),
        AcademicSession.findById(academicSession),
        AcademicSemester.findById(academicSemester),
    ]);

    if (!classRecord) {
        throw notFound("Academic class not found.");
    }

    if (!session) {
        throw notFound("Academic session not found.");
    }

    if (!semester) {
        throw notFound("Academic semester not found.");
    }

    if (
        semester.academicSession.toString() !==
        academicSession.toString()
    ) {
        throw badRequest(
            "Academic semester does not belong to the selected academic session."
        );
    }

    return {
        classRecord,
        session,
        semester,
    };
};

const buildDateFilter = (query) => {
    if (query.date) {
        return {
            date: toDateOnly(query.date),
        };
    }

    if (!query.from && !query.to) {
        return {};
    }

    const date = {};

    if (query.from) {
        date.$gte = toDateOnly(query.from);
    }

    if (query.to) {
        date.$lte = toDateOnly(query.to);
    }

    return { date };
};

const summarizeStatuses = async (filter) => {
    const rows = await Attendance.aggregate([
        {
            $match: filter,
        },
        {
            $group: {
                _id: "$status",
                count: {
                    $sum: 1,
                },
            },
        },
    ]);

    const summary = {
        Present: 0,
        Absent: 0,
        Late: 0,
        Excused: 0,
        total: 0,
        attendanceRate: 0,
    };

    rows.forEach((row) => {
        summary[row._id] = row.count;
        summary.total += row.count;
    });

    if (summary.total > 0) {
        summary.attendanceRate = Number(
            (
                ((summary.Present + summary.Late) /
                    summary.total) *
                100
            ).toFixed(2)
        );
    }

    return summary;
};

const populateAttendance = (query) =>
    query
        .populate(
            "student",
            "firstName middleName lastName registrationNumber academicClass"
        )
        .populate(
            "academicClass",
            "name academicLevel"
        )
        .populate(
            "academicSession",
            "name startDate endDate"
        )
        .populate(
            "academicSemester",
            "name startDate endDate"
        )
        .populate(
            "recordedBy",
            "fullName username role"
        );

// ======================================================
// Mark Student Attendance (Bulk)
// Admin / Teacher
// ======================================================

export const markStudentAttendanceService = async (
    data,
    user
) => {
    const {
        academicClass,
        academicSession,
        academicSemester,
        date,
        records,
    } = data;

    await ensureAcademicContext({
        academicClass,
        academicSession,
        academicSemester,
    });

    await assertClassAccessByRole(user, academicClass);

    const attendanceDate = toDateOnly(date);

    if (isFutureDate(attendanceDate)) {
        throw badRequest(
            "Attendance date cannot be in the future."
        );
    }

    const studentIds = records.map((record) => record.student);

    if (new Set(studentIds).size !== studentIds.length) {
        throw badRequest(
            "The attendance list contains duplicate students."
        );
    }

    const students = await Student.find({
        _id: { $in: studentIds },
    }).select("_id academicClass");

    if (students.length !== studentIds.length) {
        const foundIds = new Set(
            students.map((student) => student._id.toString())
        );

        const missingIds = studentIds.filter(
            (studentId) => !foundIds.has(studentId)
        );

        throw notFound(
            `Student not found: ${missingIds.join(", ")}`
        );
    }

    const enrollments = await StudentEnrollment.find({
        student: { $in: studentIds },
        academicClass,
        academicSession,
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
                academicClass.toString() &&
            !enrolledIds.has(student._id.toString())
    );

    if (notInClass.length > 0) {
        throw badRequest(
            "Some students are not enrolled in the selected academic class."
        );
    }

    const existingAttendance = await Attendance.find({
        academicClass,
        date: attendanceDate,
        student: { $in: studentIds },
    }).select("student status");

    const existingStatusByStudent = new Map(
        existingAttendance.map((record) => [
            record.student.toString(),
            record.status,
        ])
    );

    await Attendance.bulkWrite(
        records.map((record) => ({
            updateOne: {
                filter: {
                    student: record.student,
                    academicClass,
                    date: attendanceDate,
                },
                update: {
                    $set: {
                        academicSession,
                        academicSemester,
                        status: record.status || "Present",
                        remarks: record.remarks || "",
                        recordedBy: user._id,
                    },
                },
                upsert: true,
            },
        }))
    );

    const newlyAbsentStudentIds = records
        .filter(
            (record) =>
                (record.status || "Present") === "Absent" &&
                existingStatusByStudent.get(
                    record.student.toString()
                ) !== "Absent"
        )
        .map((record) => record.student);

    if (newlyAbsentStudentIds.length > 0) {
        try {
            const academicClassRecord =
                await AcademicClass.findById(
                    academicClass
                ).select("name");

            await createStudentAudienceNotifications({
                studentIds: newlyAbsentStudentIds,
                title: "Absence recorded",
                message: `An absence was recorded on ${attendanceDate
                    .toISOString()
                    .slice(0, 10)}${
                    academicClassRecord?.name
                        ? ` for ${academicClassRecord.name}`
                        : ""
                }.`,
                type: "attendance",
                referenceId: academicClass,
                createdBy: user._id,
            });
        } catch (error) {
            // Notifications must not block attendance marking.
        }
    }

    const saved = await populateAttendance(
        Attendance.find({
            academicClass,
            date: attendanceDate,
        })
    ).sort({ "student.lastName": 1 });

    return {
        date: attendanceDate,
        records: saved,
        summary: await summarizeStatuses({
            academicClass,
            date: attendanceDate,
        }),
    };
};

// ======================================================
// Get Class Attendance
// Admin / Teacher
// ======================================================

export const getClassAttendanceService = async (
    academicClass,
    query,
    user
) => {
    await assertClassAccessByRole(user, academicClass);

    const { page, limit, skip } = getPagination(query);

    const filter = {
        academicClass,
        ...buildDateFilter(query),
    };

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester = query.academicSemester;
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.student) {
        filter.student = query.student;
    }

    const [records, total, summary] = await Promise.all([
        populateAttendance(Attendance.find(filter))
            .sort({ date: -1, "student.lastName": 1 })
            .skip(skip)
            .limit(limit),
        Attendance.countDocuments(filter),
        summarizeStatuses(filter),
    ]);

    return {
        ...paginatedResult(records, total, { page, limit }),
        summary,
    };
};

// ======================================================
// Get Student Attendance
// Admin / Teacher / Student
// ======================================================

export const getStudentAttendanceService = async (
    studentId,
    query,
    user
) => {
    const student = await assertStudentAccess(user, studentId);

    const { page, limit, skip } = getPagination(query);

    const filter = {
        student: studentId,
        ...buildDateFilter(query),
    };

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester = query.academicSemester;
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.academicClass) {
        filter.academicClass = query.academicClass;
    }

    const [records, total, summary] = await Promise.all([
        populateAttendance(Attendance.find(filter))
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit),
        Attendance.countDocuments(filter),
        summarizeStatuses(filter),
    ]);

    return {
        student: {
            id: student._id,
            fullName: student.fullName,
            registrationNumber: student.registrationNumber,
            academicClass: student.academicClass,
        },
        ...paginatedResult(records, total, { page, limit }),
        summary,
    };
};

// ======================================================
// Class Attendance Summary Per Student
// Admin / Teacher
// ======================================================

export const getClassAttendanceSummaryService = async (
    academicClass,
    query,
    user
) => {
    await assertClassAccessByRole(user, academicClass);

    const filter = {
        academicClass,
        ...buildDateFilter(query),
    };

    if (query.academicSession) {
        filter.academicSession = query.academicSession;
    }

    if (query.academicSemester) {
        filter.academicSemester = query.academicSemester;
    }

    if (query.student) {
        filter.student = query.student;
    }

    const data = await Attendance.aggregate([
        {
            $match: filter,
        },
        {
            $group: {
                _id: "$student",
                present: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Present"] },
                            1,
                            0,
                        ],
                    },
                },
                absent: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Absent"] },
                            1,
                            0,
                        ],
                    },
                },
                late: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Late"] },
                            1,
                            0,
                        ],
                    },
                },
                excused: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Excused"] },
                            1,
                            0,
                        ],
                    },
                },
                total: {
                    $sum: 1,
                },
            },
        },
        {
            $lookup: {
                from: "students",
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
                _id: 0,
                studentId: "$_id",
                student: {
                    _id: "$student._id",
                    firstName: "$student.firstName",
                    middleName: "$student.middleName",
                    lastName: "$student.lastName",
                    registrationNumber:
                        "$student.registrationNumber",
                    academicClass: "$student.academicClass",
                },
                present: 1,
                absent: 1,
                late: 1,
                excused: 1,
                total: 1,
                attendanceRate: {
                    $cond: [
                        { $gt: ["$total", 0] },
                        {
                            $round: [
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                {
                                                    $add: [
                                                        "$present",
                                                        "$late",
                                                    ],
                                                },
                                                "$total",
                                            ],
                                        },
                                        100,
                                    ],
                                },
                                2,
                            ],
                        },
                        0,
                    ],
                },
            },
        },
        {
            $sort: {
                "student.lastName": 1,
                "student.firstName": 1,
            },
        },
    ]);

    return {
        count: data.length,
        data,
    };
};

// ======================================================
// Update Attendance
// Admin / Teacher
// ======================================================

export const updateStudentAttendanceService = async (
    attendanceId,
    data,
    user
) => {
    const attendance = await Attendance.findById(
        attendanceId
    );

    if (!attendance) {
        throw notFound("Attendance record not found.");
    }

    await assertClassAccessByRole(
        user,
        attendance.academicClass
    );

    if (data.status !== undefined) {
        attendance.status = data.status;
    }

    if (data.remarks !== undefined) {
        attendance.remarks = data.remarks;
    }

    attendance.recordedBy = user._id;

    await attendance.save();

    return await populateAttendance(
        Attendance.findById(attendance._id)
    );
};

// ======================================================
// Delete Attendance
// Admin
// ======================================================

export const deleteStudentAttendanceService = async (
    attendanceId
) => {
    const attendance = await Attendance.findById(
        attendanceId
    );

    if (!attendance) {
        throw notFound("Attendance record not found.");
    }

    await attendance.deleteOne();

    return attendance;
};

// ======================================================
// Mark Teacher Attendance (Bulk)
// Admin
// ======================================================

export const markTeacherAttendanceService = async (
    data,
    user
) => {
    const { date, records } = data;

    const attendanceDate = toDateOnly(date);

    if (isFutureDate(attendanceDate)) {
        throw badRequest(
            "Attendance date cannot be in the future."
        );
    }

    const teacherIds = records.map((record) => record.teacher);

    if (new Set(teacherIds).size !== teacherIds.length) {
        throw badRequest(
            "The attendance list contains duplicate teachers."
        );
    }

    const teachers = await Teacher.find({
        _id: { $in: teacherIds },
    }).select("_id");

    if (teachers.length !== teacherIds.length) {
        const foundIds = new Set(
            teachers.map((teacher) => teacher._id.toString())
        );

        const missingIds = teacherIds.filter(
            (teacherId) => !foundIds.has(teacherId)
        );

        throw notFound(
            `Teacher not found: ${missingIds.join(", ")}`
        );
    }

    await TeacherAttendance.bulkWrite(
        records.map((record) => ({
            updateOne: {
                filter: {
                    teacher: record.teacher,
                    date: attendanceDate,
                },
                update: {
                    $set: {
                        status: record.status || "Present",
                        checkIn: record.checkIn || "",
                        checkOut: record.checkOut || "",
                        remarks: record.remarks || "",
                        recordedBy: user._id,
                    },
                },
                upsert: true,
            },
        }))
    );

    const saved = await TeacherAttendance.find({
        date: attendanceDate,
    })
        .populate(
            "teacher",
            "firstName middleName lastName teacherNumber"
        )
        .sort({ "teacher.lastName": 1 });

    return {
        date: attendanceDate,
        records: saved,
        summary: await summarizeTeacherAttendance({
            date: attendanceDate,
        }),
    };
};

// ======================================================
// Teacher Attendance Summary
// ======================================================

const summarizeTeacherAttendance = async (filter) => {
    const rows = await TeacherAttendance.aggregate([
        {
            $match: filter,
        },
        {
            $group: {
                _id: "$status",
                count: {
                    $sum: 1,
                },
            },
        },
    ]);

    const summary = {
        Present: 0,
        Absent: 0,
        Late: 0,
        Excused: 0,
        Leave: 0,
        total: 0,
        attendanceRate: 0,
    };

    rows.forEach((row) => {
        summary[row._id] = row.count;
        summary.total += row.count;
    });

    if (summary.total > 0) {
        summary.attendanceRate = Number(
            (
                ((summary.Present + summary.Late) /
                    summary.total) *
                100
            ).toFixed(2)
        );
    }

    return summary;
};

const buildTeacherAttendanceFilter = (query) => {
    const filter = {
        ...buildDateFilter(query),
    };

    if (query.teacher) {
        filter.teacher = query.teacher;
    }

    if (query.status) {
        filter.status = query.status;
    }

    return filter;
};

// ======================================================
// Get Teacher Attendance
// Admin / Teacher (own only)
// ======================================================

export const getTeacherAttendanceService = async (
    query,
    user
) => {
    const filter = buildTeacherAttendanceFilter(query);

    if (user.role === "teacher") {
        const teacher = await getTeacherForUser(user._id);

        filter.teacher = teacher._id;
    } else if (user.role !== "admin") {
        throw forbidden();
    }

    const { page, limit, skip } = getPagination(query);

    const [records, total, summary] = await Promise.all([
        TeacherAttendance.find(filter)
            .populate(
                "teacher",
                "firstName middleName lastName teacherNumber"
            )
            .populate(
                "recordedBy",
                "fullName username role"
            )
            .sort({ date: -1, "teacher.lastName": 1 })
            .skip(skip)
            .limit(limit),
        TeacherAttendance.countDocuments(filter),
        summarizeTeacherAttendance(filter),
    ]);

    return {
        ...paginatedResult(records, total, { page, limit }),
        summary,
    };
};

// ======================================================
// Teacher Attendance Summary Per Teacher
// Admin
// ======================================================

export const getTeacherAttendanceSummaryService = async (
    query
) => {
    const filter = buildTeacherAttendanceFilter(query);

    const data = await TeacherAttendance.aggregate([
        {
            $match: filter,
        },
        {
            $group: {
                _id: "$teacher",
                present: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Present"] },
                            1,
                            0,
                        ],
                    },
                },
                absent: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Absent"] },
                            1,
                            0,
                        ],
                    },
                },
                late: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Late"] },
                            1,
                            0,
                        ],
                    },
                },
                excused: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Excused"] },
                            1,
                            0,
                        ],
                    },
                },
                leave: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Leave"] },
                            1,
                            0,
                        ],
                    },
                },
                total: {
                    $sum: 1,
                },
            },
        },
        {
            $lookup: {
                from: "teachers",
                localField: "_id",
                foreignField: "_id",
                as: "teacher",
            },
        },
        {
            $unwind: {
                path: "$teacher",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 0,
                teacherId: "$_id",
                teacher: {
                    _id: "$teacher._id",
                    firstName: "$teacher.firstName",
                    middleName: "$teacher.middleName",
                    lastName: "$teacher.lastName",
                    teacherNumber: "$teacher.teacherNumber",
                },
                present: 1,
                absent: 1,
                late: 1,
                excused: 1,
                leave: 1,
                total: 1,
                attendanceRate: {
                    $cond: [
                        { $gt: ["$total", 0] },
                        {
                            $round: [
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                {
                                                    $add: [
                                                        "$present",
                                                        "$late",
                                                    ],
                                                },
                                                "$total",
                                            ],
                                        },
                                        100,
                                    ],
                                },
                                2,
                            ],
                        },
                        0,
                    ],
                },
            },
        },
        {
            $sort: {
                "teacher.lastName": 1,
                "teacher.firstName": 1,
            },
        },
    ]);

    return {
        count: data.length,
        data,
    };
};

// ======================================================
// Update Teacher Attendance
// Admin
// ======================================================

export const updateTeacherAttendanceService = async (
    attendanceId,
    data
) => {
    const attendance = await TeacherAttendance.findById(
        attendanceId
    );

    if (!attendance) {
        throw notFound("Teacher attendance record not found.");
    }

    Object.assign(attendance, data);

    await attendance.save();

    return await TeacherAttendance.findById(
        attendance._id
    )
        .populate(
            "teacher",
            "firstName middleName lastName teacherNumber"
        )
        .populate("recordedBy", "fullName username role");
};

// ======================================================
// Delete Teacher Attendance
// Admin
// ======================================================

export const deleteTeacherAttendanceService = async (
    attendanceId
) => {
    const attendance = await TeacherAttendance.findById(
        attendanceId
    );

    if (!attendance) {
        throw notFound("Teacher attendance record not found.");
    }

    await attendance.deleteOne();

    return attendance;
};
