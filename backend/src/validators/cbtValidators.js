import { z } from "zod";

import { dateString, objectId } from "./common.js";

const paginationFields = {
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
};

export const cbtQuestionType = z.enum([
    "MultipleChoice",
    "TrueFalse",
]);

export const cbtDifficulty = z.enum([
    "Easy",
    "Medium",
    "Hard",
]);

export const cbtResultVisibility = z.enum([
    "AfterPublish",
    "Immediate",
    "Hidden",
]);

const optionSchema = z.object({
    key: z.string().trim().min(1).max(10),
    text: z.string().trim().min(1).max(500),
});

const trueFalseOptions = [
    { key: "true", text: "True" },
    { key: "false", text: "False" },
];

const validateQuestionShape = (data, ctx) => {
    const options =
        data.type === "TrueFalse"
            ? trueFalseOptions
            : data.options;

    if (!options || options.length < 2) {
        ctx.addIssue({
            code: "custom",
            path: ["options"],
            message:
                "At least two options are required.",
        });

        return;
    }

    if (options.length > 6) {
        ctx.addIssue({
            code: "custom",
            path: ["options"],
            message:
                "A question cannot have more than six options.",
        });
    }

    const keys = options.map((option) =>
        option.key.toLowerCase()
    );

    if (new Set(keys).size !== keys.length) {
        ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: "Option keys must be unique.",
        });
    }

    if (data.type === "TrueFalse") {
        if (
            !["true", "false"].includes(
                String(data.correctAnswer).toLowerCase()
            )
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["correctAnswer"],
                message:
                    "True/False answers must be either true or false.",
            });
        }

        return;
    }

    if (
        !keys.includes(
            String(data.correctAnswer).toLowerCase()
        )
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["correctAnswer"],
            message:
                "The correct answer must match one of the option keys.",
        });
    }
};

// ======================================================
// Question Bank
// ======================================================

export const createCbtQuestionSchema = z
    .object({
        subject: objectId,
        questionText: z
            .string()
            .trim()
            .min(1)
            .max(2000),
        type: cbtQuestionType,
        options: z.array(optionSchema).max(6).optional(),
        correctAnswer: z.string().trim().min(1).max(500),
        explanation: z
            .string()
            .trim()
            .max(2000)
            .optional(),
        difficulty: cbtDifficulty.optional(),
        defaultMarks: z.coerce
            .number()
            .positive()
            .max(100)
            .optional(),
        isActive: z.boolean().optional(),
    })
    .superRefine(validateQuestionShape);

export const updateCbtQuestionSchema = z
    .object({
        subject: objectId.optional(),
        questionText: z
            .string()
            .trim()
            .min(1)
            .max(2000)
            .optional(),
        type: cbtQuestionType.optional(),
        options: z.array(optionSchema).max(6).optional(),
        correctAnswer: z
            .string()
            .trim()
            .min(1)
            .max(500)
            .optional(),
        explanation: z
            .string()
            .trim()
            .max(2000)
            .optional(),
        difficulty: cbtDifficulty.optional(),
        defaultMarks: z.coerce
            .number()
            .positive()
            .max(100)
            .optional(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export const cbtQuestionQuerySchema = z
    .object({
        subject: objectId.optional(),
        type: cbtQuestionType.optional(),
        difficulty: cbtDifficulty.optional(),
        isActive: z.enum(["true", "false"]).optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough();

// ======================================================
// Exams
// ======================================================

export const createCbtExamSchema = z
    .object({
        title: z.string().trim().min(1).max(200),
        description: z
            .string()
            .trim()
            .max(2000)
            .optional(),
        instructions: z
            .string()
            .trim()
            .max(5000)
            .optional(),
        classSubject: objectId,
        startAt: dateString,
        endAt: dateString,
        durationMinutes: z.coerce
            .number()
            .int()
            .min(1)
            .max(480),
        passMark: z.coerce
            .number()
            .min(0)
            .max(100)
            .optional(),
        maxAttempts: z.coerce
            .number()
            .int()
            .min(1)
            .max(5)
            .optional(),
        shuffleQuestions: z.boolean().optional(),
        shuffleOptions: z.boolean().optional(),
        resultVisibility: cbtResultVisibility.optional(),
        allowReview: z.boolean().optional(),
        linkedAssessment: objectId.nullable().optional(),
        isActive: z.boolean().optional(),
    })
    .refine(
        (data) =>
            new Date(data.endAt).getTime() >
            new Date(data.startAt).getTime(),
        {
            message:
                "The exam end time must be after the start time.",
            path: ["endAt"],
        }
    );

export const updateCbtExamSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1)
            .max(200)
            .optional(),
        description: z
            .string()
            .trim()
            .max(2000)
            .optional(),
        instructions: z
            .string()
            .trim()
            .max(5000)
            .optional(),
        startAt: dateString.optional(),
        endAt: dateString.optional(),
        durationMinutes: z.coerce
            .number()
            .int()
            .min(1)
            .max(480)
            .optional(),
        passMark: z.coerce
            .number()
            .min(0)
            .max(100)
            .optional(),
        maxAttempts: z.coerce
            .number()
            .int()
            .min(1)
            .max(5)
            .optional(),
        shuffleQuestions: z.boolean().optional(),
        shuffleOptions: z.boolean().optional(),
        resultVisibility: cbtResultVisibility.optional(),
        allowReview: z.boolean().optional(),
        linkedAssessment: objectId.nullable().optional(),
        isActive: z.boolean().optional(),
        isClosed: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export const cbtExamQuerySchema = z
    .object({
        classSubject: objectId.optional(),
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        isPublished: z.enum(["true", "false"]).optional(),
        isClosed: z.enum(["true", "false"]).optional(),
        isActive: z.enum(["true", "false"]).optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough();

export const cbtExamQuestionParams = z.object({
    id: objectId,
    examQuestionId: objectId,
});

export const cbtPublishSchema = z.object({
    isPublished: z.boolean().optional(),
});

export const cbtPublishResultsSchema = z.object({
    isPublished: z.boolean().optional(),
});

// ======================================================
// Exam Questions
// ======================================================

export const attachCbtQuestionsSchema = z.object({
    questions: z
        .array(
            z.object({
                question: objectId,
                marks: z.coerce
                    .number()
                    .positive()
                    .max(100)
                    .optional(),
                order: z.coerce
                    .number()
                    .int()
                    .min(1)
                    .optional(),
            })
        )
        .min(1, "Select at least one question.")
        .max(200),
});

export const updateCbtExamQuestionSchema = z.object({
    marks: z.coerce.number().positive().max(100),
});

export const reorderCbtQuestionsSchema = z.object({
    order: z.array(objectId).min(1).max(200),
});

// ======================================================
// Student Attempts
// ======================================================

export const saveCbtAnswersSchema = z.object({
    answers: z
        .array(
            z.object({
                question: objectId,
                selectedAnswer: z
                    .string()
                    .trim()
                    .max(500),
            })
        )
        .min(1, "At least one answer is required.")
        .max(200),
});

export const cbtAttemptQuerySchema = z
    .object({
        exam: objectId.optional(),
        status: z
            .enum(["InProgress", "Submitted", "Voided"])
            .optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(500).optional(),
    })
    .passthrough();

export const cbtStudentExamQuerySchema = z
    .object({
        status: z
            .enum(["available", "upcoming", "completed", "all"])
            .optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(500).optional(),
    })
    .passthrough();
