import { z } from "zod";

import { objectId, optionalObjectId } from "./common.js";

// ======================================================
// Academic Section
// ======================================================

export const createAcademicSectionSchema = z.object({
    name: z.string().trim().min(1).max(100),
    code: z.string().trim().min(1).max(20),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
});

export const updateAcademicSectionSchema =
    createAcademicSectionSchema.partial();

// ======================================================
// Academic Level
// ======================================================

export const createAcademicLevelSchema = z.object({
    name: z.string().trim().min(1).max(100),
    levelNumber: z.coerce.number().int().min(1),
    section: objectId,
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
});

export const updateAcademicLevelSchema =
    createAcademicLevelSchema.partial();

// ======================================================
// Academic Session
// ======================================================

export const createAcademicSessionSchema = z.object({
    name: z.string().trim().min(1).max(100),
    startDate: z.string().trim().refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "Start date must be a valid date."
    ),
    endDate: z.string().trim().refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "End date must be a valid date."
    ),
    isCurrent: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

export const updateAcademicSessionSchema =
    createAcademicSessionSchema.partial();

// ======================================================
// Academic Semester
// ======================================================

export const createAcademicSemesterSchema = z.object({
    name: z.enum(["First Semester", "Second Semester"]),
    academicSession: objectId,
    startDate: z.string().trim().refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "Start date must be a valid date."
    ),
    endDate: z.string().trim().refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "End date must be a valid date."
    ),
    isCurrent: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

export const updateAcademicSemesterSchema =
    createAcademicSemesterSchema.partial();

// ======================================================
// Academic Class
// ======================================================

export const createAcademicClassSchema = z.object({
    name: z.string().trim().min(1).max(100),
    academicLevel: objectId,
    capacity: z.coerce.number().int().min(1),
    classTeacher: optionalObjectId.nullable().optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
});

export const updateAcademicClassSchema =
    createAcademicClassSchema.partial();

export const assignStudentToClassSchema = z.object({
    studentId: objectId,
    academicClassId: objectId,
});

// ======================================================
// Subject
// ======================================================

export const createSubjectSchema = z.object({
    name: z.string().trim().min(1).max(100),
    prefix: z.string().trim().min(1).max(20),
    section: objectId,
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

// ======================================================
// Class Subject
// ======================================================

export const createClassSubjectSchema = z.object({
    academicClass: objectId,
    subject: objectId,
    academicSemester: objectId,
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
});

export const updateClassSubjectSchema = z.object({
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
});

// ======================================================
// Student Enrollment
// ======================================================

export const createStudentEnrollmentSchema = z.object({
    student: objectId,
    academicSession: objectId,
    academicClass: objectId,
});

export const updateStudentEnrollmentSchema = z.object({
    academicClass: optionalObjectId,
    status: z
        .enum(["Active", "Completed", "Transferred", "Withdrawn"])
        .optional(),
});

// ======================================================
// Student Record
// ======================================================

export const createStudentRecordSchema = z.object({
    student: objectId,
    academicSession: objectId,
    academicSemester: objectId,
    academicClass: objectId,
    recordType: z.enum([
        "Promotion",
        "Transfer",
        "Withdrawal",
        "Suspension",
        "Graduation",
        "Disciplinary",
        "General",
    ]),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    previousClass: optionalObjectId.nullable().optional(),
    newClass: optionalObjectId.nullable().optional(),
    recordDate: z
        .string()
        .trim()
        .refine(
            (value) => !Number.isNaN(Date.parse(value)),
            "Record date must be a valid date."
        )
        .optional(),
});

export const updateStudentRecordSchema = z.object({
    academicSession: optionalObjectId,
    academicSemester: optionalObjectId,
    academicClass: optionalObjectId,
    recordType: z
        .enum([
            "Promotion",
            "Transfer",
            "Withdrawal",
            "Suspension",
            "Graduation",
            "Disciplinary",
            "General",
        ])
        .optional(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    previousClass: optionalObjectId.nullable().optional(),
    newClass: optionalObjectId.nullable().optional(),
    recordDate: z
        .string()
        .trim()
        .refine(
            (value) => !Number.isNaN(Date.parse(value)),
            "Record date must be a valid date."
        )
        .optional(),
    isActive: z.boolean().optional(),
});
