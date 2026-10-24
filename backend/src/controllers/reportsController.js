import {
    getDashboardReportService,
    getEnrollmentReportService,
    getAttendanceReportService,
    getAcademicReportService,
    getFinanceReportService,
    getStudentRosterReportService,
    getTeacherWorkloadReportService,
} from "../services/reportsService.js";

// ======================================================
// Dashboard
// ======================================================

export const getDashboardReportController = async (
    req,
    res,
    next
) => {
    try {
        const report = await getDashboardReportService();

        res.status(200).json({
            success: true,
            message: "Dashboard report retrieved successfully.",
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Enrollment
// ======================================================

export const getEnrollmentReportController = async (
    req,
    res,
    next
) => {
    try {
        const report = await getEnrollmentReportService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message:
                "Enrollment report retrieved successfully.",
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Attendance
// ======================================================

export const getAttendanceReportController = async (
    req,
    res,
    next
) => {
    try {
        const report = await getAttendanceReportService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message:
                "Attendance report retrieved successfully.",
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Academic Performance
// ======================================================

export const getAcademicReportController = async (
    req,
    res,
    next
) => {
    try {
        const report = await getAcademicReportService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message:
                "Academic report retrieved successfully.",
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Finance
// ======================================================

export const getFinanceReportController = async (
    req,
    res,
    next
) => {
    try {
        const report = await getFinanceReportService(
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message: "Finance report retrieved successfully.",
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Student Roster
// ======================================================

export const getStudentRosterReportController = async (
    req,
    res,
    next
) => {
    try {
        const report =
            await getStudentRosterReportService(
                req.validatedQuery || req.query
            );

        res.status(200).json({
            success: true,
            message:
                "Student roster retrieved successfully.",
            data: report.data,
            pagination: report.pagination,
            summary: report.summary,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Teacher Workload
// ======================================================

export const getTeacherWorkloadReportController = async (
    req,
    res,
    next
) => {
    try {
        const report =
            await getTeacherWorkloadReportService(
                req.validatedQuery || req.query
            );

        res.status(200).json({
            success: true,
            message:
                "Teacher workload report retrieved successfully.",
            data: report.data,
            pagination: report.pagination,
            summary: report.summary,
        });
    } catch (error) {
        next(error);
    }
};
