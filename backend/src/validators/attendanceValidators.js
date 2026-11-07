import { z } from "zod";

import { dateString, objectId } from "./common.js";

export const studentAttendanceStatus = z.enum([
    "Present",
    "Absent",
    "Late",
    "Excused",
]);

export const teacherAttendanceStatus = z.enum([
    "Present",
    "Absent",
    "Late",
    "Excused",
    "Leave",
]);

const paginationFields = {
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
};

const dateRangeRefinement = (query) =>
    !query.from ||
    !query.to ||
    Date.parse(query.from) <= Date.parse(query.to);

const dateRangeMessage = {
    message: "The from date must be on or before the to date.",
    path: ["from"],
};

// ======================================================
// Student Attendance
// ======================================================

export const markStudentAttendanceSchema = z.object({
    academicClass: objectId,
    academicSession: objectId,
    academicSemester: objectId,
    date: dateString,
    records: z
        .array(
            z.object({
                student: objectId,
                status: studentAttendanceStatus.optional(),
                remarks: z.string().trim().max(500).optional(),
            })
        )
        .min(1, "At least one attendance record is required.")
        .max(500),
});

export const studentAttendanceQuerySchema = z
    .object({
        date: dateString.optional(),
        from: dateString.optional(),
        to: dateString.optional(),
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        status: studentAttendanceStatus.optional(),
        student: objectId.optional(),
        ...paginationFields,
    })
    .passthrough()
    .refine(dateRangeRefinement, dateRangeMessage);

export const updateStudentAttendanceSchema = z
    .object({
        status: studentAttendanceStatus.optional(),
        remarks: z.string().trim().max(500).optional(),
    })
    .refine(
        (data) =>
            data.status !== undefined || data.remarks !== undefined,
        {
            message: "At least one field must be provided.",
        }
    );

// ======================================================
// Teacher Attendance
// ======================================================

export const markTeacherAttendanceSchema = z.object({
    date: dateString,
    records: z
        .array(
            z.object({
                teacher: objectId,
                status: teacherAttendanceStatus.optional(),
                checkIn: z.string().trim().max(10).optional(),
                checkOut: z.string().trim().max(10).optional(),
                remarks: z.string().trim().max(500).optional(),
            })
        )
        .min(1, "At least one attendance record is required.")
        .max(500),
});

export const teacherAttendanceQuerySchema = z
    .object({
        date: dateString.optional(),
        from: dateString.optional(),
        to: dateString.optional(),
        teacher: objectId.optional(),
        status: teacherAttendanceStatus.optional(),
        ...paginationFields,
    })
    .passthrough()
    .refine(dateRangeRefinement, dateRangeMessage);

export const updateTeacherAttendanceSchema = z
    .object({
        status: teacherAttendanceStatus.optional(),
        checkIn: z.string().trim().max(10).optional(),
        checkOut: z.string().trim().max(10).optional(),
        remarks: z.string().trim().max(500).optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field must be provided.",
        }
    );
