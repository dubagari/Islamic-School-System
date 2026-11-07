import { z } from "zod";

import { dateString, objectId } from "./common.js";

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
// Dashboard
// ======================================================

export const dashboardQuerySchema = z
    .object({})
    .passthrough();

// ======================================================
// Enrollment
// ======================================================

export const enrollmentReportQuerySchema = z
    .object({
        academicSession: objectId.optional(),
        academicClass: objectId.optional(),
        academicLevel: objectId.optional(),
        status: z
            .enum([
                "Active",
                "Completed",
                "Transferred",
                "Withdrawn",
            ])
            .optional(),
        groupBy: z
            .enum(["class", "level", "gender", "status"])
            .optional(),
    })
    .passthrough();

// ======================================================
// Attendance
// ======================================================

export const attendanceReportQuerySchema = z
    .object({
        from: dateString.optional(),
        to: dateString.optional(),
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        academicClass: objectId.optional(),
        student: objectId.optional(),
        status: z
            .enum(["Present", "Absent", "Late", "Excused"])
            .optional(),
        groupBy: z
            .enum(["day", "class", "student", "status"])
            .optional(),
    })
    .passthrough()
    .refine(dateRangeRefinement, dateRangeMessage);

// ======================================================
// Academic Performance
// ======================================================

export const academicReportQuerySchema = z
    .object({
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        academicClass: objectId.optional(),
        classSubject: objectId.optional(),
        includeUnpublished: z
            .enum(["true", "false"])
            .optional(),
    })
    .passthrough();

// ======================================================
// Finance
// ======================================================

export const financeReportQuerySchema = z
    .object({
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        academicClass: objectId.optional(),
        from: dateString.optional(),
        to: dateString.optional(),
        groupBy: z
            .enum(["day", "month", "method"])
            .optional(),
    })
    .passthrough()
    .refine(dateRangeRefinement, dateRangeMessage);

// ======================================================
// Rosters / Workload
// ======================================================

export const studentRosterQuerySchema = z
    .object({
        academicClass: objectId.optional(),
        status: z
            .enum([
                "Active",
                "Suspended",
                "Graduated",
                "Withdrawn",
                "Expelled",
            ])
            .optional(),
        gender: z.enum(["Male", "Female"]).optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough();

export const teacherWorkloadQuerySchema = z
    .object({
        status: z
            .enum([
                "Active",
                "Suspended",
                "Retired",
                "Resigned",
                "Terminated",
            ])
            .optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough();
