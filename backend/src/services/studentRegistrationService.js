import bcrypt from "bcryptjs";

import AcademicClass from "../models/AcademicClass.js";
import AcademicLevel from "../models/AcademicLevel.js";
import AdmissionApplication from "../models/AdmissionApplication.js";
import Student from "../models/Student.js";
import User from "../models/User.js";

import { escapeRegex } from "../utils/search.js";
import {
    generateStudentRegistrationNumber,
} from "./studentRegistrationNumberService.js";

// ======================================================
// Convert the applicant's free-text level into a concrete
// academic class where a single confident match exists.
// ======================================================

export const resolveAcademicClassForLevel = async (
    applicationLevel
) => {
    const level = String(applicationLevel ?? "").trim();
    if (!level) {
        return null;
    }

    const levelRegex = new RegExp(
        `^${escapeRegex(level)}$`,
        "i"
    );

    // Prefer an exact class-name match.
    const exactClass = await AcademicClass.findOne({
        name: levelRegex,
        isActive: true,
    });

    if (exactClass) {
        return exactClass;
    }

    // Fall back to a unique matching academic level.
    const matchingLevel = await AcademicLevel.findOne({
        name: levelRegex,
        isActive: true,
    }).lean();

    if (!matchingLevel) {
        return null;
    }

    const levelClasses = await AcademicClass.find({
        academicLevel: matchingLevel._id,
        isActive: true,
    })
        .sort({ name: 1 })
        .lean();

    // Keep registration conservative: if several classes share the
    // level, leave class assignment to admin.
    return levelClasses.length === 1
        ? levelClasses[0]
        : null;
};

// ======================================================
// Default student login
// ======================================================

export const DEFAULT_STUDENT_PASSWORD = "password";

export const buildStudentLogin = (registrationNumber) => ({
    username: registrationNumber,
    defaultPassword: DEFAULT_STUDENT_PASSWORD,
    mustChangePassword: true,
});

// ======================================================
// Complete Student Registration
// Called only after payment has been confirmed.
// Safe to call again; regenerating the same registration number
// is prevented by the application claim below.
// ======================================================

export const completeStudentRegistrationService =
    async (applicationId) => {

        // --------------------------------------------------
        // 1. Load application and verify prerequisites
        // --------------------------------------------------

        const application =
            await AdmissionApplication.findById(applicationId);

        if (!application) {
            throw new Error("Admission application not found.");
        }

        if (application.status !== "Approved") {
            throw new Error(
                "Admission application must be approved before registration."
            );
        }

        if (application.paymentStatus !== "Paid") {
            throw new Error(
                "Payment must be completed before student registration."
            );
        }

        // --------------------------------------------------
        // 2. If an earlier call already claimed a number and
        //    created the student, return the existing record.
        // --------------------------------------------------

        const findExistingStudent = async () => {
            if (!application.registrationNumber) {
                return null;
            }

            return Student.findOne({
                admissionApplication: application._id,
                registrationNumber: application.registrationNumber,
            });
        };

        let existingStudent = await findExistingStudent();
        if (existingStudent) {
            return {
                student: existingStudent,
                login: buildStudentLogin(
                    application.registrationNumber
                ),
            };
        }

        // --------------------------------------------------
        // 3. Atomically claim the registration number so two
        //    concurrent registrations cannot both win.
        // --------------------------------------------------

        let registrationNumber = application.registrationNumber;

        if (!registrationNumber) {
            const generated =
                await generateStudentRegistrationNumber();

            const claimed =
                await AdmissionApplication.findOneAndUpdate(
                    {
                        _id: application._id,
                        registrationNumber: null,
                    },
                    {
                        $set: {
                            registrationNumber: generated,
                        },
                    },
                    {
                        new: true,
                    }
                );

            if (claimed) {
                registrationNumber = claimed.registrationNumber;
                application.registrationNumber = registrationNumber;
            } else {
                // Another request won the claim or an old number already
                // exists in memory.
                const refreshed =
                    await AdmissionApplication.findById(application._id);
                registrationNumber =
                    refreshed?.registrationNumber ||
                    application.registrationNumber;

                if (!registrationNumber) {
                    throw new Error(
                        "Unable to lock this application for student registration."
                    );
                }

                existingStudent = await findExistingStudent();
                if (existingStudent) {
                    return {
                        student: existingStudent,
                        login: buildStudentLogin(registrationNumber),
                    };
                }
            }
        }

        // --------------------------------------------------
        // 4. Create student
        // --------------------------------------------------

        const matchedClass = await resolveAcademicClassForLevel(application.currentLevel);

        const student =
            await Student.create({
                admissionApplication: application._id,
                applicationNumber: application.applicationNumber,
                registrationNumber,
                firstName: application.firstName,
                middleName: application.middleName,
                lastName: application.lastName,
                gender: application.gender,
                dateOfBirth: application.dateOfBirth,
                email: application.email,
                phone: application.phone,
                address: application.address,
                parentName: application.parentName,
                parentPhone: application.parentPhone,
                parentEmail: application.parentEmail,
                relationship: application.relationship,
                currentLevel: application.currentLevel,
                previousMadrasa: application.previousMadrasa,
                academicClass: matchedClass?._id || null,
                status: "Active",
                paymentStatus: "Paid",
                paidAt: application.paidAt,
                isActive: true,
            });

        // --------------------------------------------------
        // 5. Create student user
        // --------------------------------------------------

        const login = buildStudentLogin(registrationNumber);
        const hashedPassword =
            await bcrypt.hash(login.defaultPassword, 10);

        const user =
            await User.create({
                fullName:
                    [
                        student.firstName,
                        student.middleName,
                        student.lastName,
                    ]
                        .filter(Boolean)
                        .join(" "),
                email: student.email,
                username: student.registrationNumber,
                password: hashedPassword,
                role: "student",
                student: student._id,
                mustChangePassword: true,
            });

        // --------------------------------------------------
        // 6. Link account back to student
        // --------------------------------------------------

        student.user = user._id;
        await student.save();

        // --------------------------------------------------
        // 7. Re-fetch the application to expose the claimed
        //    registration number to admin/payments flows.
        // --------------------------------------------------

        const updatedApplication =
            await AdmissionApplication.findById(application._id);

        return {
            student,
            application: updatedApplication,
            academicClass: matchedClass || null,
            login,
        };
    };
