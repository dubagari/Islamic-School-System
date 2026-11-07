import { z } from "zod";

import { objectId } from "./common.js";

// ======================================================
// Teacher
// ======================================================

export const createTeacherSchema = z.object({
    firstName: z.string().trim().min(1).max(100),
    middleName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().min(1).max(100),
    gender: z.enum(["Male", "Female"]),
    dateOfBirth: z
        .string()
        .trim()
        .refine(
            (value) => !Number.isNaN(Date.parse(value)),
            "Date of birth must be a valid date."
        )
        .optional(),
    email: z.string().trim().email("Invalid email address.").optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(500).optional(),
    qualification: z.string().trim().max(200).optional(),
    specialization: z.string().trim().max(200).optional(),
    employmentDate: z
        .string()
        .trim()
        .refine(
            (value) => !Number.isNaN(Date.parse(value)),
            "Employment date must be a valid date."
        )
        .optional(),
    employmentType: z
        .enum([
            "Full Time",
            "Contract",
            "Part-Time",
            "Temporary",
            "Volunteer",
        ])
        .optional(),
});

export const updateTeacherSchema = createTeacherSchema
    .extend({
        status: z
            .enum([
                "Active",
                "Suspended",
                "Retired",
                "Resigned",
                "Terminated",
            ])
            .optional(),
        statusReason: z.string().trim().max(500).optional(),
        isActive: z.boolean().optional(),
    })
    .partial();

// ======================================================
// Teacher Assignment
// ======================================================

export const createTeacherAssignmentSchema = z.object({
    teacher: objectId,
    classSubject: objectId,
    assignedDate: z
        .string()
        .trim()
        .refine(
            (value) => !Number.isNaN(Date.parse(value)),
            "Assigned date must be a valid date."
        )
        .optional(),
    isActive: z.boolean().optional(),
});

export const updateTeacherAssignmentSchema = z.object({
    teacher: objectId.optional(),
    classSubject: objectId.optional(),
    assignedDate: z
        .string()
        .trim()
        .refine(
            (value) => !Number.isNaN(Date.parse(value)),
            "Assigned date must be a valid date."
        )
        .optional(),
    isActive: z.boolean().optional(),
});
