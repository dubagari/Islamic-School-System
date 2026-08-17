import {
    createAdmissionApplicationService,
    getAdmissionApplicationsService,
    getAdmissionApplicationByIdService,
    getAdmissionApplicationByNumberService,
    approveAdmissionApplicationService,
    rejectAdmissionApplicationService,
    updateAdmissionApplicationService,
} from "../services/admissionApplicationService.js";

// ======================================================
// Create Admission Application
// ======================================================

export const createAdmissionApplicationController =
    async (req, res, next) => {
        try {
            const application =
                await createAdmissionApplicationService(
                    req.body
                );

            res.status(201).json({
                success: true,
                message:
                    "Admission application submitted successfully.",
                data: application,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get All Admission Applications
// ======================================================

export const getAdmissionApplicationsController =
    async (req, res, next) => {
        try {
            const applications =
                await getAdmissionApplicationsService();

            res.status(200).json({
                success: true,
                data: applications,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Admission Application By ID
// ======================================================

export const getAdmissionApplicationByIdController =
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const application =
                await getAdmissionApplicationByIdService(
                    id
                );

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Admission Application By Number
// ======================================================

export const getAdmissionApplicationByNumberController =
    async (req, res, next) => {
        try {
            const { applicationNumber } =
                req.params;

            const application =
                await getAdmissionApplicationByNumberService(
                    applicationNumber
                );

            res.status(200).json({
                success: true,
                data: application,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Approve Admission Application
// ======================================================

export const approveAdmissionApplicationController =
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const application =
                await approveAdmissionApplicationService(
                    id
                );

            res.status(200).json({
                success: true,
                message:
                    "Admission application approved successfully.",
                data: application,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Reject Admission Application
// ======================================================

export const rejectAdmissionApplicationController =
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const { reason } = req.body;

            const application =
                await rejectAdmissionApplicationService(
                    id,
                    reason
                );

            res.status(200).json({
                success: true,
                message:
                    "Admission application rejected successfully.",
                data: application,
            });
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Update Admission Application
// ======================================================

export const updateAdmissionApplicationController =
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const application =
                await updateAdmissionApplicationService(
                    id,
                    req.body
                );

            res.status(200).json({
                success: true,
                message:
                    "Admission application updated successfully.",
                data: application,
            });
        } catch (error) {
            next(error);
        }
    };