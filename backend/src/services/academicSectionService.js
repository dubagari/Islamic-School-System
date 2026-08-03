import AcademicSection from "../models/AcademicSection.js";

export const createAcademicSectionService = async (sectionData) => {

    const existingName = await AcademicSection.findOne({
        name: sectionData.name,
    });

    if (existingName) {
        throw new Error("Academic section already exists.");
    }

    // Check duplicate display order
const existingDisplayOrder = await AcademicSection.findOne({
    displayOrder: sectionData.displayOrder,
});

if (existingDisplayOrder) {
    throw new Error("Display order already exists.");
}

    const existingCode = await AcademicSection.findOne({
        code: sectionData.code.toUpperCase(),
    });

    if (existingCode) {
        throw new Error("Academic section code already exists.");
    }

    return await AcademicSection.create({
        ...sectionData,
        code: sectionData.code.toUpperCase(),
    });

};