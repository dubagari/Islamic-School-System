import mongoose from "mongoose";

import AcademicClass from "../models/AcademicClass.js";
import AcademicSession from "../models/AcademicSession.js";
import AcademicTerm from "../models/AcademicTerm.js";
import Subject from "../models/Subject.js";
import ClassSubject from "../models/ClassSubject.js";

// ======================================================
// Private Helper Functions
// ======================================================


const findAcademicClassOrThrow = async (academicClassId) => {

    const academicClass =
        await AcademicClass.findById(academicClassId);

    if (!academicClass) {
        throw new Error("Academic class not found.");
    }

    return academicClass;

};



const findAcademicSessionOrThrow = async (academicSessionId) => {

    const academicSession =
        await AcademicSession.findById(academicSessionId);

    if (!academicSession) {
        throw new Error("Academic session not found.");
    }

    return academicSession;

};



const findAcademicTermOrThrow = async (academicTermId) => {

    const academicTerm =
        await AcademicTerm.findById(academicTermId);

    if (!academicTerm) {
        throw new Error("Academic term not found.");
    }

    return academicTerm;

};


const findSubjectOrThrow = async (subjectId) => {

    const subject =
        await Subject.findById(subjectId);

    if (!subject) {
        throw new Error("Subject not found.");
    }

    return subject;

};

const validateSubjectBelongsToAcademicClass = (
    subject,
    academicClass
) => {

    if (!subject.section.equals(academicClass.section)) {
        throw new Error(
            `${subject.name} belongs to another academic section.`
        );
    }

    if (subject.level !== academicClass.level) {
        throw new Error(
            `${subject.name} belongs to another academic level.`
        );
    }

};

const ensureSubjectAssignmentDoesNotExist = async (
    academicClassId,
    subjectId,
    academicSessionId,
    academicTermId
) => {

    const existingAssignment =
        await ClassSubject.findOne({
            academicClass: academicClassId,
            subject: subjectId,
            academicSession: academicSessionId,
            academicTerm: academicTermId,
        });

    if (existingAssignment) {
        throw new Error(
            "Subject has already been assigned to this class."
        );
    }

};

// ======================================================
// Create Services
// ======================================================

export const assignSubjectsToClassService = async (data) => {

    const dbSession = await mongoose.startSession();

    try {

        dbSession.startTransaction();

        const {
            academicClass: academicClassId,
            academicSession: academicSessionId,
            academicTerm: academicTermId,
            subjects,
        } = data;

        if (!Array.isArray(subjects) || subjects.length === 0) {
            throw new Error(
                "Please select at least one subject."
            );
        }

        const academicClass =
            await findAcademicClassOrThrow(
                academicClassId
            );

        await findAcademicSessionOrThrow(
            academicSessionId
        );

        await findAcademicTermOrThrow(
            academicTermId
        );

        const createdAssignments = [];

        for (const subjectId of subjects) {

            const subject =
                await findSubjectOrThrow(subjectId);

            validateSubjectBelongsToAcademicClass(
                subject,
                academicClass
            );

            await ensureSubjectAssignmentDoesNotExist(
                academicClassId,
                subjectId,
                academicSessionId,
                academicTermId
            );

            const assignment = await ClassSubject.create(
                [
                    {
                        academicClass: academicClassId,
                        subject: subjectId,
                        academicSession: academicSessionId,
                        academicTerm: academicTermId,
                    },
                ],
                {
                    session: dbSession,
                }
            );

            createdAssignments.push(assignment[0]);

        }

        await dbSession.commitTransaction();

        return await ClassSubject.find({
            _id: {
                $in: createdAssignments.map(
                    assignment => assignment._id
                ),
            },
        })
            .populate("academicClass", "name code level")
            .populate("subject", "name code level prefix")
            .populate("academicSession", "name")
            .populate("academicTerm", "name")
            .populate("teachers", "fullName email");

    } catch (error) {

        await dbSession.abortTransaction();

        throw error;

    } finally {

        dbSession.endSession();

    }

};


// ======================================================
// Read Services
// ======================================================
export const getAllClassSubjectsService = async () => {

    return await ClassSubject.find()

        .populate("academicClass", "name code level")

        .populate("subject", "name code level prefix")

        .populate("academicSession", "name")

        .populate("academicTerm", "name")

        .populate("teachers", "fullName email")

        .sort({
            createdAt: -1,
        });

};

export const getClassSubjectByIdService = async (id) => {

    const assignment = await ClassSubject.findById(id)

        .populate("academicClass", "name code level")

        .populate("subject", "name code level prefix")

        .populate("academicSession", "name")

        .populate("academicTerm", "name")

        .populate("teachers", "fullName email");

    if (!assignment) {
        throw new Error("Class subject assignment not found.");
    }

    return assignment;

};


export const getClassSubjectsByClassService = async (
    academicClassId
) => {

    return await ClassSubject.find({
        academicClass: academicClassId,
    })

        .populate("subject", "name code level prefix")

        .populate("academicSession", "name")

        .populate("academicTerm", "name")

        .populate("teachers", "fullName email")

        .sort({
            "subject.code": 1,
        });

};


// ======================================================
// Update Services
// ======================================================

export const updateClassSubjectService = async (
    id,
    data
) => {

    const assignment = await ClassSubject.findById(id);

    if (!assignment) {
        throw new Error(
            "Class subject assignment not found."
        );
    }

    Object.assign(assignment, data);

    await assignment.save();

    return await assignment.populate([
        {
            path: "academicClass",
            select: "name code level",
        },
        {
            path: "subject",
            select: "name code level prefix",
        },
        {
            path: "academicSession",
            select: "name",
        },
        {
            path: "academicTerm",
            select: "name",
        },
        {
            path: "teachers",
            select: "fullName email",
        },
    ]);

};


// ======================================================
// Delete Services
// ======================================================
export const deleteClassSubjectService = async (id) => {

    const assignment = await ClassSubject.findById(id);

    if (!assignment) {
        throw new Error("Class subject assignment not found.");
    }

    await assignment.deleteOne();

    return assignment;

};