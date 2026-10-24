import StudentRecord from "../models/StudentRecord.js";
import Student from "../models/Student.js";
import AcademicSession from "../models/AcademicSession.js";
import AcademicSemester from "../models/AcademicSemester.js";
import AcademicClass from "../models/AcademicClass.js";
import User from "../models/User.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import { buildSearchFilter } from "../utils/search.js";

// ======================================================
// Create Student Record
// Admin
// ======================================================

export const createStudentRecordService = async (
    data,
    userId
) => {
    const {
        student,
        academicSession,
        academicSemester,
        academicClass,
        recordType,
        title,
        description,
        previousClass,
        newClass,
        recordDate,
    } = data;

    // --------------------------------------------------
    // 1. Check student
    // --------------------------------------------------

    const existingStudent =
        await Student.findById(student);

    if (!existingStudent) {
        throw new Error(
            "Student not found."
        );
    }

    // --------------------------------------------------
    // 2. Check academic session
    // --------------------------------------------------

    const session =
        await AcademicSession.findById(
            academicSession
        );

    if (!session) {
        throw new Error(
            "Academic session not found."
        );
    }

    // --------------------------------------------------
    // 3. Check academic semester
    // --------------------------------------------------

    const semester =
        await AcademicSemester.findById(
            academicSemester
        );

    if (!semester) {
        throw new Error(
            "Academic semester not found."
        );
    }

    // --------------------------------------------------
    // 4. Check academic class
    // --------------------------------------------------

    const academicClassDocument =
        await AcademicClass.findById(
            academicClass
        );

    if (!academicClassDocument) {
        throw new Error(
            "Academic class not found."
        );
    }

    // --------------------------------------------------
    // 5. Check user recording the record
    // --------------------------------------------------

    const user =
        await User.findById(userId);

    if (!user) {
        throw new Error(
            "User account not found."
        );
    }

    // --------------------------------------------------
    // 6. Create record
    // --------------------------------------------------

    const record =
        await StudentRecord.create({
            student,
            academicSession,
            academicSemester,
            academicClass,
            recordType,
            title,
            description,
            previousClass:
                previousClass || null,
            newClass:
                newClass || null,
            recordedBy: userId,
            recordDate:
                recordDate || new Date(),
            isActive: true,
        });

    // --------------------------------------------------
    // 7. Return populated record
    // --------------------------------------------------

    return await StudentRecord.findById(
        record._id
    )
        .populate(
            "student",
            "-__v"
        )
        .populate(
            "academicSession"
        )
        .populate(
            "academicSemester"
        )
        .populate(
            "academicClass"
        )
        .populate(
            "previousClass"
        )
        .populate(
            "newClass"
        )
        .populate(
            "recordedBy",
            "-password -__v"
        );
};

// ======================================================
// Get All Student Records
// Admin
// ======================================================

export const getAllStudentRecordsService =
    async (query = {}) => {
        const { page, limit, skip } = getPagination(query);

        const filter = {
            ...buildSearchFilter(query.search, [
                "title",
                "description",
            ]),
        };

        if (query.student) {
            filter.student = query.student;
        }

        if (query.academicSession) {
            filter.academicSession = query.academicSession;
        }

        if (query.academicClass) {
            filter.academicClass = query.academicClass;
        }

        if (query.recordType) {
            filter.recordType = query.recordType;
        }

        if (query.isActive !== undefined) {
            filter.isActive =
                query.isActive === true || query.isActive === "true";
        }

        const [records, total] = await Promise.all([
            StudentRecord.find(filter)
                .populate("student", "-__v")
                .populate("academicSession")
                .populate("academicSemester")
                .populate("academicClass")
                .populate("previousClass")
                .populate("newClass")
                .populate("recordedBy", "-password -__v")
                .sort({ recordDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit),
            StudentRecord.countDocuments(filter),
        ]);

        return paginatedResult(records, total, { page, limit });
    };

// ======================================================
// Get Student Record By ID
// Admin
// ======================================================

export const getStudentRecordByIdService =
    async (recordId) => {

        const record =
            await StudentRecord.findById(
                recordId
            )
                .populate(
                    "student",
                    "-__v"
                )
                .populate(
                    "academicSession"
                )
                .populate(
                    "academicSemester"
                )
                .populate(
                    "academicClass"
                )
                .populate(
                    "previousClass"
                )
                .populate(
                    "newClass"
                )
                .populate(
                    "recordedBy",
                    "-password -__v"
                );

        if (!record) {
            throw new Error(
                "Student record not found."
            );
        }

        return record;
    };

// ======================================================
// Get Student Record History
// Admin
// ======================================================

export const getStudentRecordHistoryService =
    async (studentId) => {

        const student =
            await Student.findById(
                studentId
            );

        if (!student) {
            throw new Error(
                "Student not found."
            );
        }

        return await StudentRecord.find({
            student: studentId,
            isActive: true,
        })
            .populate(
                "academicSession"
            )
            .populate(
                "academicSemester"
            )
            .populate(
                "academicClass"
            )
            .populate(
                "previousClass"
            )
            .populate(
                "newClass"
            )
            .populate(
                "recordedBy",
                "-password -__v"
            )
            .sort({
                recordDate: -1,
                createdAt: -1,
            });
    };

// ======================================================
// Update Student Record
// Admin
// ======================================================

export const updateStudentRecordService =
    async (recordId, data) => {

        const record =
            await StudentRecord.findById(
                recordId
            );

        if (!record) {
            throw new Error(
                "Student record not found."
            );
        }

        // ----------------------------------------------
        // Prevent changing student
        // ----------------------------------------------

        delete data.student;

        // ----------------------------------------------
        // Validate session
        // ----------------------------------------------

        if (data.academicSession) {

            const session =
                await AcademicSession.findById(
                    data.academicSession
                );

            if (!session) {
                throw new Error(
                    "Academic session not found."
                );
            }
        }

        // ----------------------------------------------
        // Validate semester
        // ----------------------------------------------

        if (data.academicSemester) {

            const semester =
                await AcademicSemester.findById(
                    data.academicSemester
                );

            if (!semester) {
                throw new Error(
                    "Academic semester not found."
                );
            }
        }

        // ----------------------------------------------
        // Validate class
        // ----------------------------------------------

        if (data.academicClass) {

            const academicClassDocument =
                await AcademicClass.findById(
                    data.academicClass
                );

            if (!academicClassDocument) {
                throw new Error(
                    "Academic class not found."
                );
            }
        }

        // ----------------------------------------------
        // Validate record type
        // ----------------------------------------------

        if (data.recordType) {

            const allowedRecordTypes = [
                "Promotion",
                "Transfer",
                "Withdrawal",
                "Suspension",
                "Graduation",
                "Disciplinary",
                "General",
            ];

            if (
                !allowedRecordTypes.includes(
                    data.recordType
                )
            ) {
                throw new Error(
                    "Invalid student record type."
                );
            }
        }

        Object.assign(
            record,
            data
        );

        await record.save();

        return await StudentRecord.findById(
            record._id
        )
            .populate(
                "student",
                "-__v"
            )
            .populate(
                "academicSession"
            )
            .populate(
                "academicSemester"
            )
            .populate(
                "academicClass"
            )
            .populate(
                "previousClass"
            )
            .populate(
                "newClass"
            )
            .populate(
                "recordedBy",
                "-password -__v"
            );
    };

// ======================================================
// Deactivate Student Record
// Admin
// ======================================================

export const deactivateStudentRecordService =
    async (recordId) => {

        const record =
            await StudentRecord.findById(
                recordId
            );

        if (!record) {
            throw new Error(
                "Student record not found."
            );
        }

        record.isActive = false;

        await record.save();

        return record;
    };