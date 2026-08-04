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


    // Format subject name
    const subjectName = formatTitle(subjectData.name);


    // Check duplicate subject name in same section
   

   const existingSubject = await Subject.findOne({
    section: subjectData.section,
    prefix: subjectData.prefix.toUpperCase(),
    level: subjectData.level,
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
    prefix: subjectData.prefix.toUpperCase(),
    subjectType: subjectData.subjectType || "Theory",
    description: subjectData.description || "",
    isCompulsory: subjectData.isCompulsory ?? true,
    isActive: true,
});
};