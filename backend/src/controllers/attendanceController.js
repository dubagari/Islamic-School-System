import {
    markStudentAttendanceService,
    getClassAttendanceService,
    getStudentAttendanceService,
    getClassAttendanceSummaryService,
    updateStudentAttendanceService,
    deleteStudentAttendanceService,
    markTeacherAttendanceService,
    getTeacherAttendanceService,
    getTeacherAttendanceSummaryService,
    updateTeacherAttendanceService,
    deleteTeacherAttendanceService,
} from "../services/attendanceService.js";

// ======================================================
// Mark Student Attendance
// Admin / Teacher
// ======================================================

export const markStudentAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const result = await markStudentAttendanceService(
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Attendance recorded successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Get Class Attendance
// Admin / Teacher
// ======================================================

export const getClassAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const { academicClass } = req.params;

        const result = await getClassAttendanceService(
            academicClass,
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Class attendance retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Get Student Attendance
// Admin / Teacher / Student
// ======================================================

export const getStudentAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const { studentId } = req.params;

        const result = await getStudentAttendanceService(
            studentId,
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Student attendance retrieved successfully.",
            student: result.student,
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Get Class Attendance Summary
// Admin / Teacher
// ======================================================

export const getClassAttendanceSummaryController = async (
    req,
    res,
    next
) => {
    try {
        const { academicClass } = req.params;

        const result = await getClassAttendanceSummaryService(
            academicClass,
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message:
                "Class attendance summary retrieved successfully.",
            count: result.count,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Update Student Attendance
// Admin / Teacher
// ======================================================

export const updateStudentAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const attendance =
            await updateStudentAttendanceService(
                id,
                req.body,
                req.user
            );

        res.status(200).json({
            success: true,
            message: "Attendance updated successfully.",
            data: attendance,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Delete Student Attendance
// Admin
// ======================================================

export const deleteStudentAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const attendance =
            await deleteStudentAttendanceService(id);

        res.status(200).json({
            success: true,
            message: "Attendance deleted successfully.",
            data: attendance,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Mark Teacher Attendance
// Admin
// ======================================================

export const markTeacherAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const result = await markTeacherAttendanceService(
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Teacher attendance recorded successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Get Teacher Attendance
// Admin / Teacher (own)
// ======================================================

export const getTeacherAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getTeacherAttendanceService(
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Teacher attendance retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Get Teacher Attendance Summary
// Admin
// ======================================================

export const getTeacherAttendanceSummaryController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await getTeacherAttendanceSummaryService(
                req.validatedQuery || req.query
            );

        res.status(200).json({
            success: true,
            message:
                "Teacher attendance summary retrieved successfully.",
            count: result.count,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Update Teacher Attendance
// Admin
// ======================================================

export const updateTeacherAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const attendance =
            await updateTeacherAttendanceService(
                id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Teacher attendance updated successfully.",
            data: attendance,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Delete Teacher Attendance
// Admin
// ======================================================

export const deleteTeacherAttendanceController = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const attendance =
            await deleteTeacherAttendanceService(id);

        res.status(200).json({
            success: true,
            message: "Teacher attendance deleted successfully.",
            data: attendance,
        });
    } catch (error) {
        next(error);
    }
};
