import AcademicClass from "../models/AcademicClass.js";
import ClassSubject from "../models/ClassSubject.js";
import Parent from "../models/Parent.js";
import Student from "../models/Student.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Teacher from "../models/Teacher.js";
import {
    forbidden,
    notFound,
} from "../utils/AppError.js";

// ======================================================
// Teacher Access To A Class
// ======================================================

export const assertTeacherClassAccess = async (
    teacherUserId,
    academicClassId
) => {
    const academicClass = await AcademicClass.findById(
        academicClassId
    );

    if (!academicClass) {
        throw notFound("Academic class not found.");
    }

    if (
        academicClass.classTeacher &&
        academicClass.classTeacher.toString() === teacherUserId.toString()
    ) {
        return academicClass;
    }

    const classSubjectIds = await ClassSubject.find({
        academicClass: academicClassId,
        isActive: true,
    }).distinct("_id");

    if (classSubjectIds.length > 0) {
        const assignment = await TeacherAssignment.findOne({
            teacher: teacherUserId,
            classSubject: { $in: classSubjectIds },
            isActive: true,
        });

        if (assignment) {
            return academicClass;
        }
    }

    throw forbidden(
        "You are not assigned to this academic class."
    );
};

// ======================================================
// Teacher Access To A Class Subject
// ======================================================

export const assertTeacherClassSubjectAccess = async (
    teacherUserId,
    classSubjectId
) => {
    const classSubject = await ClassSubject.findById(
        classSubjectId
    ).populate("academicClass");

    if (!classSubject) {
        throw notFound("Class subject not found.");
    }

    const academicClass = classSubject.academicClass;

    if (
        academicClass?.classTeacher &&
        academicClass.classTeacher.toString() ===
            teacherUserId.toString()
    ) {
        return classSubject;
    }

    const assignment = await TeacherAssignment.findOne({
        teacher: teacherUserId,
        classSubject: classSubjectId,
        isActive: true,
    });

    if (!assignment) {
        throw forbidden(
            "You are not assigned to this class subject."
        );
    }

    return classSubject;
};

// ======================================================
// Teacher Access To A Subject (Question Bank)
// ======================================================

export const assertTeacherSubjectAccess = async (
    teacherUserId,
    subjectId
) => {
    const classSubjectIds = await ClassSubject.find({
        subject: subjectId,
        isActive: true,
    }).distinct("_id");

    if (classSubjectIds.length === 0) {
        throw notFound("Subject not found.");
    }

    const assignment = await TeacherAssignment.exists({
        teacher: teacherUserId,
        classSubject: { $in: classSubjectIds },
        isActive: true,
    });

    if (!assignment) {
        throw forbidden(
            "You are not assigned to this subject."
        );
    }

    return true;
};

// ======================================================
// Student Lookup For A User
// ======================================================

export const getStudentForUser = async (userId) => {
    const student = await Student.findOne({
        user: userId,
    });

    if (!student) {
        throw notFound(
            "No student profile is linked to this account."
        );
    }

    return student;
};

// ======================================================
// Teacher Lookup For A User
// ======================================================

export const getTeacherForUser = async (userId) => {
    const teacher = await Teacher.findOne({
        user: userId,
    });

    if (!teacher) {
        throw notFound(
            "No teacher profile is linked to this account."
        );
    }

    return teacher;
};

// ======================================================
// Parent Lookup For A User
// ======================================================

export const getParentForUser = async (userId) => {
    const parent = await Parent.findOne({
        user: userId,
    });

    if (!parent || !parent.isActive) {
        throw notFound(
            "No parent profile is linked to this account."
        );
    }

    return parent;
};

// ======================================================
// Access To A Student's Records
// ======================================================

export const assertStudentAccess = async (user, studentId) => {
    if (!user) {
        throw forbidden();
    }

    const student = await Student.findById(studentId);

    if (!student) {
        throw notFound("Student not found.");
    }

    if (user.role === "admin") {
        return student;
    }

    if (user.role === "student") {
        if (
            student.user &&
            student.user.toString() === user._id.toString()
        ) {
            return student;
        }

        throw forbidden(
            "You can only access your own student record."
        );
    }

    if (user.role === "parent") {
        const parent = await getParentForUser(user._id);

        const isChild = parent.students.some(
            (childId) =>
                childId.toString() === student._id.toString()
        );

        if (isChild) {
            return student;
        }

        throw forbidden(
            "You can only access the records of your own children."
        );
    }

    if (user.role === "teacher") {
        if (!student.academicClass) {
            throw forbidden(
                "Student is not assigned to an academic class."
            );
        }

        await assertTeacherClassAccess(
            user._id,
            student.academicClass
        );

        return student;
    }

    throw forbidden();
};

// ======================================================
// Enrollment Helper
// ======================================================

export const isStudentEnrolledInClass = async (
    studentId,
    academicClassId,
    academicSessionId
) => {
    const enrollment = await StudentEnrollment.findOne({
        student: studentId,
        academicClass: academicClassId,
        academicSession: academicSessionId,
        status: "Active",
        isActive: true,
    });

    return Boolean(enrollment);
};
