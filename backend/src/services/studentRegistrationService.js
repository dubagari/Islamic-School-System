import bcrypt from "bcryptjs";

import AdmissionApplication from "../models/AdmissionApplication.js";
import Student from "../models/Student.js";
import User from "../models/User.js";

import {
    generateStudentRegistrationNumber,
} from "./studentRegistrationNumberService.js";

// ======================================================
// Complete Student Registration
// Called only after payment has been confirmed
// ======================================================

export const completeStudentRegistrationService =
    async (applicationId) => {

        // --------------------------------------------------
        // 1. Find admission application
        // --------------------------------------------------

        const application =
            await AdmissionApplication.findById(
                applicationId
            );

        if (!application) {
            throw new Error(
                "Admission application not found."
            );
        }

        // --------------------------------------------------
        // 2. Application must be approved
        // --------------------------------------------------

        if (application.status !== "Approved") {
            throw new Error(
                "Admission application must be approved before registration."
            );
        }

        // --------------------------------------------------
        // 3. Payment must be completed
        // --------------------------------------------------

        if (
            application.paymentStatus !== "Paid"
        ) {
            throw new Error(
                "Payment must be completed before student registration."
            );
        }

        // --------------------------------------------------
        // 4. Prevent duplicate registration
        // --------------------------------------------------

        if (application.registrationNumber) {
            throw new Error(
                "Student has already been registered."
            );
        }

        // --------------------------------------------------
        // 5. Generate registration number
        // Example: 26/260001
        // --------------------------------------------------

        const registrationNumber =
            await generateStudentRegistrationNumber();

        // --------------------------------------------------
        // 6. Create Student
        // --------------------------------------------------

        const student =
            await Student.create({
                admissionApplication:
                    application._id,

                applicationNumber:
                    application.applicationNumber,

                registrationNumber,

                firstName:
                    application.firstName,

                middleName:
                    application.middleName,

                lastName:
                    application.lastName,

                gender:
                    application.gender,

                dateOfBirth:
                    application.dateOfBirth,

                email:
                    application.email,

                phone:
                    application.phone,

                address:
                    application.address,

                parentName:
                    application.parentName,

                parentPhone:
                    application.parentPhone,

                parentEmail:
                    application.parentEmail,

                relationship:
                    application.relationship,

                currentLevel:
                    application.currentLevel,

                previousMadrasa:
                    application.previousMadrasa,

                status: "Active",

                paymentStatus: "Paid",

                paidAt:
                    application.paidAt,

                isActive: true,
            });

        // --------------------------------------------------
        // 7. Generate temporary password
        // --------------------------------------------------

        const defaultPassword =
            `STU${registrationNumber
                .replace(/\//g, "")
                .slice(-6)}`;

        const hashedPassword =
            await bcrypt.hash(
                defaultPassword,
                10
            );



        console.log("STUDENT LOGIN DEBUG:", {
    registrationNumber,
    defaultPassword,
    hashedPassword,
});

        // --------------------------------------------------
        // 8. Create Student User
        // --------------------------------------------------

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

                email:
                    student.email,

                username:
                    student.registrationNumber,

                password:
                    hashedPassword,

                role: "student",

                student:
                    student._id,

                mustChangePassword:
                    true,
            });

        // --------------------------------------------------
        // 9. Link User to Student
        // --------------------------------------------------

        student.user = user._id;

        await student.save();

        // --------------------------------------------------
        // 10. Update Admission Application
        // --------------------------------------------------

        application.registrationNumber =
            registrationNumber;

        await application.save();

        // --------------------------------------------------
        // 11. Return registration information
        // --------------------------------------------------

        return {
            student,

            login: {
                username:
                    registrationNumber,

                defaultPassword,

                mustChangePassword:
                    true,
            },
        };
    };