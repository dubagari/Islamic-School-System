import { z } from "zod";

import { dateString, objectId } from "./common.js";

export const assessmentType = z.enum([
    "Quiz",
    "Test",
    "Assignment",
    "Midterm",
    "Exam",
    "Project",
    "Practical",
]);

const paginationFields = {
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
};

// ======================================================
// Assessments
// ======================================================

export const createAssessmentSchema = z.object({
    classSubject: objectId,
    name: z.string().trim().min(1).max(150),
    type: assessmentType,
    maxScore: z.coerce
        .number()
        .positive("Maximum score must be greater than zero.")
        .max(1000),
    weight: z.coerce.number().min(0).max(100),
    date: dateString.optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
});

export const updateAssessmentSchema = z
    .object({
        name: z.string().trim().min(1).max(150).optional(),
        type: assessmentType.optional(),
        maxScore: z.coerce
            .number()
            .positive("Maximum score must be greater than zero.")
            .max(1000)
            .optional(),
        weight: z.coerce.number().min(0).max(100).optional(),
        date: dateString.optional(),
        description: z.string().trim().max(500).optional(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export const assessmentQuerySchema = z
    .object({
        classSubject: objectId.optional(),
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        type: assessmentType.optional(),
        isActive: z.enum(["true", "false"]).optional(),
        ...paginationFields,
    })
    .passthrough();

// ======================================================
// Scores
// ======================================================

export const scoreEntrySchema = z.object({
    records: z
        .array(
            z.object({
                student: objectId,
                score: z.coerce
                    .number()
                    .min(0, "Score cannot be negative."),
                remarks: z.string().trim().max(500).optional(),
            })
        )
        .min(1, "At least one score is required.")
        .max(500),
});

export const updateScoreSchema = z
    .object({
        score: z.coerce
            .number()
            .min(0, "Score cannot be negative.")
            .optional(),
        remarks: z.string().trim().max(500).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

// ======================================================
// Results
// ======================================================

export const computeResultsSchema = z.object({
    classSubject: objectId,
    academicSemester: objectId.optional(),
});

export const publishResultsSchema = z.object({
    classSubject: objectId,
    academicSemester: objectId.optional(),
    studentIds: z.array(objectId).max(500).optional(),
    isPublished: z.boolean().optional(),
});

export const resultQuerySchema = z
    .object({
        student: objectId.optional(),
        classSubject: objectId.optional(),
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        isPublished: z.enum(["true", "false"]).optional(),
        ...paginationFields,
    })
    .passthrough();

export const reportCardQuerySchema = z
    .object({
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
    })
    .passthrough();

export const transcriptQuerySchema = z
    .object({
        academicSession: objectId.optional(),
    })
    .passthrough();
