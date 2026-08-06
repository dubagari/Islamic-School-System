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

export const getAllAcademicSectionsService = async () => {
    return await AcademicSection.find()
        .sort({ displayOrder: 1 });
};

export const getAcademicSectionByIdService = async (id) => {

    const section = await AcademicSection.findById(id);

    if (!section) {
        throw new Error("Academic section not found.");
    }

    return section;
};

export const updateAcademicSectionService = async (id, data) => {

    const section = await AcademicSection.findById(id);

    if (!section) {
        throw new Error("Academic section not found.");
    }

    if (data.name && data.name !== section.name) {

        const existingName = await AcademicSection.findOne({
            name: data.name,
            _id: { $ne: id },
        });

        if (existingName) {
            throw new Error("Academic section name already exists.");
        }
    }

    if (data.code && data.code !== section.code) {

        const existingCode = await AcademicSection.findOne({
            code: data.code.toUpperCase(),
            _id: { $ne: id },
        });

        if (existingCode) {
            throw new Error("Academic section code already exists.");
        }

        data.code = data.code.toUpperCase();
    }

    if (
        data.displayOrder &&
        data.displayOrder !== section.displayOrder
    ) {
        const existingOrder = await AcademicSection.findOne({
            displayOrder: data.displayOrder,
            _id: { $ne: id },
        });

        if (existingOrder) {
            throw new Error("Display order already exists.");
        }
    }

    Object.assign(section, data);

    await section.save();

    return section;
};

export const deleteAcademicSectionService = async (id) => {

    const section = await AcademicSection.findById(id);

    if (!section) {
        throw new Error("Academic section not found.");
    }

    section.isActive = false;

    await section.save();

    return section;
};

