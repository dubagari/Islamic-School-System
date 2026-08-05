import mongoose from "mongoose";

import AcademicClass from "../models/AcademicClass.js";
import ClassSubject from "../models/ClassSubject.js";
import Subject from "../models/Subject.js";
import Session from "../models/Session.js";
import Term from "../models/Term.js";

export const assignSubjectsToClassService = async (data) => {

    const dbSession = await mongoose.startSession();

    dbSession.startTransaction();

    try {

        const {
            class: classId,
            session,
            term,
            subjects,
        } = data;

        if (!subjects || subjects.length === 0) {
            throw new Error("Please select at least one subject.");
        }

        const academicClass = await AcademicClass.findById(classId);

        if (!academicClass) {
            throw new Error("Academic class not found.");
        }

        const academicSession = await Session.findById(session);

        if (!academicSession) {
            throw new Error("Academic session not found.");
        }

        const academicTerm = await Term.findById(term);

        if (!academicTerm) {
            throw new Error("Academic term not found.");
        }

        const createdAssignments = [];

        for (const subjectId of subjects) {

            const subject = await Subject.findById(subjectId);

            if (!subject) {
                throw new Error("One or more selected subjects do not exist.");
            }

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

            const existingAssignment = await ClassSubject.findOne({
                class: classId,
                subject: subjectId,
                session,
                term,
            });

            if (existingAssignment) {
                throw new Error(
                    `${subject.name} has already been assigned to this class.`
                );
            }

            const assignment = await ClassSubject.create(
                [
                    {
                        class: classId,
                        subject: subjectId,
                        session,
                        term,
                    },
                ],
                {
                    session: dbSession,
                }
            );

            createdAssignments.push(assignment[0]);
        }

        await dbSession.commitTransaction();

        dbSession.endSession();

        return createdAssignments;

    } catch (error) {

        await dbSession.abortTransaction();

        dbSession.endSession();

        throw error;
    }
};


export const getAllClassSubjectsService = async () => {

    return await ClassSubject.find()

        .populate("class", "name code level")

        .populate("subject", "name code level")

        .populate("session", "name")

        .populate("term", "name")

        .populate("teachers", "fullName email")

        .sort({
            createdAt: -1,
        });

};

export const getClassSubjectsByClassService = async (classId) => {

    return await ClassSubject.find({
        class: classId,
    })

        .populate("subject", "name code level")

        .populate("session", "name")

        .populate("term", "name")

        .populate("teachers", "fullName email")

        .sort({
            "subject.code": 1,
        });

};


export const removeClassSubjectService = async (id) => {

    const assignment = await ClassSubject.findById(id);

    if (!assignment) {
        throw new Error("Assignment not found.");
    }

    await assignment.deleteOne();

    return assignment;
};

export const updateClassSubjectService = async (id, data) => {

    const assignment = await ClassSubject.findById(id);

    if (!assignment) {
        throw new Error("Assignment not found.");
    }

    Object.assign(assignment, data);

    await assignment.save();

    return assignment;
};

