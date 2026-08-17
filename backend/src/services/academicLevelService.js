import AcademicLevel from "../models/AcademicLevel.js";
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


const ensureAcademicLevelDoesNotExist = async (
    name,
    section,
    excludeId = null
) => {

    const filter = {
        name,
        section,
    };

    if (excludeId) {

        filter._id = {
            $ne: excludeId,
        };

    }

    const existingLevel =
        await AcademicLevel.findOne(filter);

    if (existingLevel) {

        throw new Error(
            "Academic level already exists in this section."
        );

    }

};


// ======================================================
// Create Academic Level
// ======================================================

export const createAcademicLevelService = async (
    data
) => {

    await findAcademicSectionOrThrow(
        data.section
    );

    await ensureAcademicLevelDoesNotExist(
        data.name,
        data.section
    );

    return await AcademicLevel.create(
        data
    );

};


// ======================================================
// Get All Academic Levels
// ======================================================

export const getAcademicLevelsService = async () => {

    return await AcademicLevel.find()

        .populate(
            "section",
            "name code"
        )

        .sort({
            createdAt: -1,
        });

};


// ======================================================
// Get Academic Level By ID
// ======================================================

export const getAcademicLevelByIdService = async (
    id
) => {

    const academicLevel =
        await AcademicLevel.findById(id)

            .populate(
                "section",
                "name code"
            );

    if (!academicLevel) {

        throw new Error(
            "Academic level not found."
        );

    }

    return academicLevel;

};


// ======================================================
// Update Academic Level
// ======================================================

export const updateAcademicLevelService = async (
    id,
    data
) => {

    const academicLevel =
        await AcademicLevel.findById(id);

    if (!academicLevel) {

        throw new Error(
            "Academic level not found."
        );

    }

    const name =
        data.name ||
        academicLevel.name;

    const section =
        data.section ||
        academicLevel.section;

    await findAcademicSectionOrThrow(
        section
    );

    await ensureAcademicLevelDoesNotExist(
        name,
        section,
        id
    );

    Object.assign(
        academicLevel,
        data
    );

    await academicLevel.save();

    return academicLevel;

};


// ======================================================
// Delete Academic Level
// ======================================================

export const deleteAcademicLevelService = async (
    id
) => {

    const academicLevel =
        await AcademicLevel.findById(id);

    if (!academicLevel) {

        throw new Error(
            "Academic level not found."
        );

    }

    await academicLevel.deleteOne();

    return academicLevel;

};