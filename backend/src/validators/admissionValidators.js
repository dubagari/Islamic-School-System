import { z } from "zod";

const baseApplication = {
    firstName: z.string().trim().min(1, "First name is required.").max(100),
    middleName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().min(1, "Last name is required.").max(100),
    gender: z.enum(["Male", "Female"]),
    dateOfBirth: z
        .string()
        .trim()
        .refine(
            (value) => !Number.isNaN(Date.parse(value)),
            "Date of birth must be a valid date."
        ),
    email: z.string().trim().email("Invalid email address.").optional().or(z.literal("")),
    phone: z.string().trim().min(1, "Phone number is required.").max(30),
    address: z.string().trim().min(1, "Address is required.").max(500),
    parentName: z.string().trim().min(1, "Parent name is required.").max(150),
    parentPhone: z.string().trim().min(1, "Parent phone is required.").max(30),
    parentEmail: z.string().trim().email("Invalid parent email address.").optional().or(z.literal("")),
    relationship: z.string().trim().min(1, "Relationship is required.").max(100),
    currentLevel: z.string().trim().min(1, "Current level is required.").max(100),
    previousMadrasa: z.string().trim().max(200).optional(),
    photoUrl: z
        .string()
        .trim()
        .max(500)
        .optional()
        .or(z.literal("")),
};

export const createAdmissionApplicationSchema = z.object(baseApplication);

export const updateAdmissionApplicationSchema = z
    .object(baseApplication)
    .partial();

export const rejectAdmissionApplicationSchema = z.object({
    reason: z.string().trim().max(500).optional(),
});

export const admissionLookupQuerySchema = z
    .object({
        phone: z
            .string()
            .trim()
            .min(1, "Phone number is required.")
            .max(30),
    })
    .passthrough();

export const admissionApplicationQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(200).optional(),
        search: z.string().trim().max(100).optional(),
        status: z.enum(["Pending", "Approved", "Rejected"]).optional(),
        paymentStatus: z
            .enum(["Pending", "Paid", "Failed", "Cancelled"])
            .optional(),
    })
    .passthrough();
