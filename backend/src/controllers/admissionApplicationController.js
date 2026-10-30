import { buildAdmissionApplicationPdf } from "../services/admissionPdfService.js";
import {
    createAdmissionApplicationService,
    getAdmissionApplicationsService,
    getAdmissionApplicationByIdService,
    getAdmissionApplicationByNumberService,
    approveAdmissionApplicationService,
    rejectAdmissionApplicationService,
    updateAdmissionApplicationService,
} from "../services/admissionApplicationService.js";

const sendApplicationPdf = (res, application, pdf) => {
    const safeNumber = String(
        application.applicationNumber || "application"
    ).replace(/[^A-Za-z0-9]+/g, "-");

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="admission-${safeNumber}.pdf"`,
        "Content-Length": pdf.length,
        "Cache-Control": "no-store",
    });

    res.send(pdf);
};

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
            const result =
                await getAdmissionApplicationsService(
                    req.validatedQuery || req.query
                );

            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
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

            const phone =
                req.validatedQuery?.phone;

            const application =
                await getAdmissionApplicationByNumberService(
                    applicationNumber,
                    phone
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
// Get Application PDF By Number (Public)
// ======================================================

export const getAdmissionApplicationByNumberPdfController =
    async (req, res, next) => {
        try {
            const { applicationNumber } = req.params;
            const phone = req.validatedQuery?.phone;

            const application =
                await getAdmissionApplicationByNumberService(
                    applicationNumber,
                    phone
                );

            const pdf =
                await buildAdmissionApplicationPdf(
                    application
                );

            sendApplicationPdf(res, application, pdf);
        } catch (error) {
            next(error);
        }
    };

// ======================================================
// Get Application PDF By ID (Admin)
// ======================================================

export const getAdmissionApplicationByIdPdfController =
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const application =
                await getAdmissionApplicationByIdService(
                    id
                );

            const pdf =
                await buildAdmissionApplicationPdf(
                    application
                );

            sendApplicationPdf(res, application, pdf);
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