import Subject from "../models/Subject.js";
import AcademicSection from "../models/AcademicSection.js";
import { generateSubjectCode } from "../utils/generateSubjectCode.js";
import { formatTitle } from "../utils/formatTitle.js";


export const createSubjectService = async (subjectData) => {

    // Check section exists
    const section = await AcademicSection.findById(
        subjectData.section
    );

    if (!section) {
        throw new Error("Academic section not found.");
    }

    const prefix = subjectData.prefix?.trim().toUpperCase();

    if (!prefix) {
        throw new Error("Subject prefix is required.");
    }

    // Format subject name
    const subjectName = formatTitle(subjectData.name);


    // Check duplicate subject name in same section
   

  const existingSubject = await Subject.findOne({
    section: subjectData.section,
    level: subjectData.level,
    name: subjectName,
});


    if (existingSubject) {
        throw new Error(
            "Subject already exists in this section."
        );
    }


    // Generate or use custom code
    let subjectCode;


    if (subjectData.code) {

        subjectCode = subjectData.code
            .trim()
            .toUpperCase();

    } else {

        subjectCode = await generateSubjectCode(
    subjectData.prefix,
    subjectData.level
);

    }


    // Check duplicate code
    const existingCode = await Subject.findOne({
        code: subjectCode,
    });


    if (existingCode) {
        throw new Error(
            "Subject code already exists."
        );
    }


    // Create subject
   return await Subject.create({
    section: subjectData.section,
    name: subjectName,
    code: subjectCode,
    level: subjectData.level,
    prefix,
    subjectType: subjectData.subjectType || "Theory",
    description: subjectData.description || "",
    isCompulsory: subjectData.isCompulsory ?? true,
    isActive: true,
});
};


export const getAllSubjectsService = async () => {

    return await Subject.find()

        .populate("section", "name code")

        .sort({
            section: 1,
            level: 1,
            displayOrder: 1,
        });

};


export const getSubjectByIdService = async (id) => {

    const subject = await Subject.findById(id)

        .populate("section", "name code");

    if (!subject) {
        throw new Error("Subject not found.");
    }

    return subject;
};

export const updateSubjectService = async (id, data) => {

    const subject = await Subject.findById(id);

    if (!subject) {
        throw new Error("Subject not found.");
    }

    if (data.code) {

        const existingCode = await Subject.findOne({
            code: data.code.toUpperCase(),
            _id: { $ne: id },
        });

        if (existingCode) {
            throw new Error("Subject code already exists.");
        }

        data.code = data.code.toUpperCase();
    }

    if (data.name) {

        const existingSubject = await Subject.findOne({
            section: subject.section,
            level: subject.level,
            name: data.name,
            _id: { $ne: id },
        });

        if (existingSubject) {
            throw new Error("Subject already exists.");
        }
    }

    if (data.displayOrder) {

        const existingOrder = await Subject.findOne({
            section: subject.section,
            level: subject.level,
            displayOrder: data.displayOrder,
            _id: { $ne: id },
        });

        if (existingOrder) {
            throw new Error("Display order already exists.");
        }
    }

    Object.assign(subject, data);

    await subject.save();

    return subject;
};

export const deleteSubjectService = async (id) => {

    const subject = await Subject.findById(id);

    if (!subject) {
        throw new Error("Subject not found.");
    }

    subject.isActive = false;

    await subject.save();

    return subject;
};