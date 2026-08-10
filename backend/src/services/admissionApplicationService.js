import AdmissionApplication from "../models/AdmissionApplication.js";
import Counter from "../models/Counter.js";

// ======================================================
// Generate Application Number
// Format: DU/ADM/2026/00001
// ======================================================

const generateApplicationNumber = async () => {
    const year = new Date().getFullYear();

    const counter = await Counter.findOneAndUpdate(
        {
            key: `admission_application_${year}`,
        },
        {
            $inc: {
                sequence: 1,
            },
        },
        {
            new: true,
            upsert: true,
        }
    );

    const sequence = String(counter.sequence).padStart(
        5,
        "0"
    );

    return `DU/ADM/${year}/${sequence}`;
};

// ======================================================
// Create Admission Application
// ======================================================

export const createAdmissionApplicationService =
    async (data) => {
        const {
            firstName,
            middleName,
            lastName,
            gender,
            dateOfBirth,
            email,
            phone,
            address,
            parentName,
            parentPhone,
            parentEmail,
            relationship,
            currentLevel,
            previousMadrasa,
        } = data;

        // ----------------------------------------------
        // Basic duplicate check
        // ----------------------------------------------

        const existingApplication =
            await AdmissionApplication.findOne({
                phone,
                status: {
                    $in: [
                        "Pending",
                        "Approved",
                    ],
                },
            });

        if (existingApplication) {
            throw new Error(
                "An active admission application already exists for this phone number."
            );
        }

        // ----------------------------------------------
        // Generate application number
        // ----------------------------------------------

        const applicationNumber =
            await generateApplicationNumber();

        // ----------------------------------------------
        // Create application
        // ----------------------------------------------

        const application =
            await AdmissionApplication.create({
                firstName,
                middleName,
                lastName,
                gender,
                dateOfBirth,
                email,
                phone,
                address,
                parentName,
                parentPhone,
                parentEmail,
                relationship,
                currentLevel,
                previousMadrasa,

                applicationNumber,

                status: "Pending",
                statusReason: "",

                paymentStatus: "Pending",
                registrationNumber: null,
            });

        return application;
    };

// ======================================================
// Get All Admission Applications
// ======================================================

export const getAdmissionApplicationsService =
    async () => {
        return await AdmissionApplication.find()
            .sort({
                createdAt: -1,
            });
    };

// ======================================================
// Get Application By ID
// ======================================================

export const getAdmissionApplicationByIdService =
    async (id) => {
        const application =
            await AdmissionApplication.findById(id);

        if (!application) {
            throw new Error(
                "Admission application not found."
            );
        }

        return application;
    };

// ======================================================
// Get Application By Application Number
// ======================================================

export const getAdmissionApplicationByNumberService =
    async (applicationNumber) => {
        const application =
            await AdmissionApplication.findOne({
                applicationNumber,
            });

        if (!application) {
            throw new Error(
                "Admission application not found."
            );
        }

        return application;
    };

// ======================================================
// Approve Admission Application
// ======================================================

export const approveAdmissionApplicationService =
    async (id) => {
        const application =
            await AdmissionApplication.findById(id);

        if (!application) {
            throw new Error(
                "Admission application not found."
            );
        }

        if (application.status === "Approved") {
            throw new Error(
                "Admission application is already approved."
            );
        }

        if (application.status === "Rejected") {
            throw new Error(
                "A rejected application cannot be approved."
            );
        }

        application.status = "Approved";
        application.approvedAt = new Date();
        application.rejectedAt = null;
        application.statusReason = "";

        await application.save();

        return application;
    };

// ======================================================
// Reject Admission Application
// ======================================================

export const rejectAdmissionApplicationService =
    async (id, reason = "") => {
        const application =
            await AdmissionApplication.findById(id);

        if (!application) {
            throw new Error(
                "Admission application not found."
            );
        }

        if (application.status === "Approved") {
            throw new Error(
                "An approved application cannot be rejected."
            );
        }

        if (application.status === "Rejected") {
            throw new Error(
                "Admission application is already rejected."
            );
        }

        application.status = "Rejected";
        application.rejectedAt = new Date();
        application.approvedAt = null;
        application.statusReason = reason;

        await application.save();

        return application;
    };

// ======================================================
// Update Admission Application
// ======================================================

export const updateAdmissionApplicationService =
    async (id, data) => {
        const application =
            await AdmissionApplication.findById(id);

        if (!application) {
            throw new Error(
                "Admission application not found."
            );
        }

        // Do not allow these to be changed manually
        delete data.applicationNumber;
        delete data.registrationNumber;
        delete data.paymentStatus;

        // Do not allow applicant to manually change
        // admission status through the general update route
        delete data.status;
        delete data.approvedAt;
        delete data.rejectedAt;

        Object.assign(application, data);

        await application.save();

        return application;
    };