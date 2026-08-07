import AdmissionApplication from "../models/AdmissionApplication.js";
import { generateNumber } from "../utils/generateNumber.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { generateStudentRegistrationNumber } from "../utils/generateStudentRegistrationNumber.js";
import bcrypt from "bcryptjs";

export const submitAdmissionApplicationService = async (applicationData) => {
    const admissionNumber = await generateNumber("admission", "ADM");

    const newApplication = {
        ...applicationData,
        admissionNumber,
    };

    return await AdmissionApplication.create(newApplication);
};



export const getAdmissionsService = async (query) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Status Filter
    if (query.status && query.status !== "All") {
        filter.status = query.status;
    }

    // Search
    if (query.search) {
        filter.$or = [
            {
                admissionNumber: {
                    $regex: query.search,
                    $options: "i",
                },
            },
            {
                firstName: {
                    $regex: query.search,
                    $options: "i",
                },
            },
            {
                lastName: {
                    $regex: query.search,
                    $options: "i",
                },
            },
        ];
    }

  const admissions = await AdmissionApplication.find(filter)
    .select(
        "admissionNumber firstName middleName lastName currentLevel status parentName phone createdAt"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
        

    const totalRecords = await AdmissionApplication.countDocuments(filter);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
        admissions,
        pagination: {
            currentPage: page,
            totalPages,
            totalRecords,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
        filters: {
            search: query.search || "",
            status: query.status || "All",
        },
        sort: {
            field: "createdAt",
            order: "desc",
        },
    };
};


export const approveAdmissionApplicationService = async (admissionId) => {
    const application = await AdmissionApplication.findById(admissionId);

    if (!application) {
        throw new Error("Admission application not found.");
    }

    if (application.status === "Approved") {
        throw new Error("Admission application has already been approved.");
    }

    if (application.status === "Registered") {
        throw new Error("Student has already been registered.");
    }

    application.status = "Approved";

    await application.save();

    return application;
};

// ======================================================
// Confirm Student Payment
// ======================================================

export const confirmStudentPaymentService = async (
    admissionId
) => {

    const application = await AdmissionApplication.findById(
        admissionId
    );

    if (!application) {
        throw new Error("Admission application not found.");
    }

    if (application.status !== "Approved") {
        throw new Error(
            "Admission application must be approved before payment."
        );
    }

    const existingStudent = await Student.findOne({
        admissionNumber: application.admissionNumber,
    });

    if (existingStudent) {
        throw new Error(
            "Student has already been created."
        );
    }

    const registrationNumber =
        await generateStudentRegistrationNumber();

    const student = await Student.create({
        admissionNumber: application.admissionNumber,
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
        status: "Active",
        paymentStatus: "Paid",
    });

    const defaultPassword = "123456";

    const hashedPassword = await bcrypt.hash(
        defaultPassword,
        10
    );

    await User.create({
        fullName: `${student.firstName} ${student.lastName}`,
        username: registrationNumber,
        email: student.email,
        password: hashedPassword,
        role: "student",
        student: student._id,
        mustChangePassword: true,
    });

    return student;

};