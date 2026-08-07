import Subject from "../models/Subject.js";
import AcademicSection from "../models/AcademicSection.js";

// ======================================================
// Private Helper Functions
// ======================================================

const findAcademicSectionOrThrow = async (
    sectionId
) => {

    const academicSection =
        await AcademicSection.findById(
            sectionId
        );

    if (!academicSection) {
        throw new Error(
            "Academic section not found."
        );
    }

    return academicSection;

};

const ensureSubjectDoesNotExist = async (
    name,
    section,
    level,
    excludeId = null
) => {

    const filter = {
        name,
        section,
        level,
    };

    if (excludeId) {

        filter._id = {
            $ne: excludeId,
        };

    }

    const existingSubject =
        await Subject.findOne(filter);

    if (existingSubject) {
        throw new Error(
            "Subject already exists for this section and level."
        );
    }

};

// ======================================================
// Create Subject
// ======================================================

export const createSubjectService = async (
    data
) => {

    await findAcademicSectionOrThrow(
        data.section
    );

    await ensureSubjectDoesNotExist(
        data.name,
        data.section,
        data.level
    );

    return await Subject.create(data);

};

// ======================================================
// Get All Subjects
// ======================================================

export const getSubjectsService = async () => {

    return await Subject.find()

        .populate(
            "section",
            "name code"
        )

        .sort({
            createdAt: -1,
        });

};

// ======================================================
// Get Subject By ID
// ======================================================

export const getSubjectByIdService = async (
    id
) => {

    const subject =
        await Subject.findById(id)

            .populate(
                "section",
                "name code"
            );

    if (!subject) {
        throw new Error(
            "Subject not found."
        );
    }

    return subject;

};

// ======================================================
// Update Subject
// ======================================================

export const updateSubjectService = async (
    id,
    data
) => {

    const subject =
        await Subject.findById(id);

    if (!subject) {
        throw new Error(
            "Subject not found."
        );
    }

    const section =
        data.section ||
        subject.section;

    const level =
        data.level ||
        subject.level;

    const name =
        data.name ||
        subject.name;

    await findAcademicSectionOrThrow(
        section
    );

    await ensureSubjectDoesNotExist(
        name,
        section,
        level,
        id
    );

    Object.assign(
        subject,
        data
    );

    await subject.save();

    return subject;

};

// ======================================================
// Delete Subject
// ======================================================

export const deleteSubjectService = async (
    id
) => {

    const subject =
        await Subject.findById(id);

    if (!subject) {
        throw new Error(
            "Subject not found."
        );
    }

    await subject.deleteOne();

    return subject;

};