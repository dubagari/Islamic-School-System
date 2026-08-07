import AcademicSection from "../models/AcademicSection.js";

// ======================================================
// Create Academic Section
// ======================================================

export const createAcademicSectionService = async (
    data
) => {

    const { name, code } = data;

    const existingSection =
        await AcademicSection.findOne({
            $or: [
                {
                    name,
                },
                {
                    code,
                },
            ],
        });

    if (existingSection) {
        throw new Error(
            "Academic section already exists."
        );
    }

    return await AcademicSection.create(data);

};

// ======================================================
// Get All Academic Sections
// ======================================================

export const getAcademicSectionsService =
    async () => {

        return await AcademicSection.find()
            .sort({
                createdAt: -1,
            });

    };

// ======================================================
// Get Academic Section By ID
// ======================================================

export const getAcademicSectionByIdService =
    async (id) => {

        const academicSection =
            await AcademicSection.findById(id);

        if (!academicSection) {
            throw new Error(
                "Academic section not found."
            );
        }

        return academicSection;

    };

// ======================================================
// Update Academic Section
// ======================================================

export const updateAcademicSectionService =
    async (id, data) => {

        const academicSection =
            await AcademicSection.findById(id);

        if (!academicSection) {
            throw new Error(
                "Academic section not found."
            );
        }

        if (
            data.name ||
            data.code
        ) {

            const existingSection =
                await AcademicSection.findOne({
                    _id: {
                        $ne: id,
                    },
                    $or: [
                        {
                            name: data.name,
                        },
                        {
                            code: data.code,
                        },
                    ],
                });

            if (existingSection) {
                throw new Error(
                    "Academic section already exists."
                );
            }

        }

        Object.assign(
            academicSection,
            data
        );

        await academicSection.save();

        return academicSection;

    };

// ======================================================
// Delete Academic Section
// ======================================================

export const deleteAcademicSectionService =
    async (id) => {

        const academicSection =
            await AcademicSection.findById(id);

        if (!academicSection) {
            throw new Error(
                "Academic section not found."
            );
        }

        await academicSection.deleteOne();

        return academicSection;

    };