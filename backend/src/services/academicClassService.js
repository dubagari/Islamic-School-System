import AcademicClass from "../models/AcademicClass.js";
import AcademicLevel from "../models/AcademicLevel.js";
import User from "../models/User.js";

// ======================================================
// Create Academic Class
// ======================================================

export const createAcademicClassService = async (data) => {
    const {
        name,
        academicLevel,
        capacity,
        classTeacher,
        description,
        isActive,
    } = data;

    // Check Academic Level
    const level = await AcademicLevel.findById(
        academicLevel
    );

    if (!level) {
        throw new Error(
            "Academic level not found."
        );
    }

    // Check duplicate class within the same level
    const existingClass =
        await AcademicClass.findOne({
            name,
            academicLevel,
        });

    if (existingClass) {
        throw new Error(
            "Academic class already exists under this academic level."
        );
    }

    // Check class teacher if provided
    if (classTeacher) {
        const teacher = await User.findById(
            classTeacher
        );

        if (!teacher) {
            throw new Error(
                "Class teacher not found."
            );
        }

        if (teacher.role !== "teacher") {
            throw new Error(
                "Selected user is not a teacher."
            );
        }
    }

    return await AcademicClass.create({
        name,
        academicLevel,
        capacity,
        classTeacher:
            classTeacher || null,
        description,
        isActive,
    });
};

// ======================================================
// Get All Academic Classes
// ======================================================

export const getAcademicClassesService =
    async () => {
        return await AcademicClass.find()
            .populate(
                "academicLevel",
                "name courseCode section"
            )
            .populate(
                "classTeacher",
                "fullName username email"
            )
            .sort({
                createdAt: -1,
            });
    };

// ======================================================
// Get Academic Classes By Academic Level
// ======================================================

export const getAcademicClassesByLevelService =
    async (academicLevel) => {
        const level =
            await AcademicLevel.findById(
                academicLevel
            );

        if (!level) {
            throw new Error(
                "Academic level not found."
            );
        }

        return await AcademicClass.find({
            academicLevel,
        })
            .populate(
                "academicLevel",
                "name courseCode section"
            )
            .populate(
                "classTeacher",
                "fullName username email"
            )
            .sort({
                name: 1,
            });
    };

// ======================================================
// Get Academic Class By ID
// ======================================================

export const getAcademicClassByIdService =
    async (id) => {
        const academicClass =
            await AcademicClass.findById(id)
                .populate(
                    "academicLevel",
                    "name courseCode section"
                )
                .populate(
                    "classTeacher",
                    "fullName username email"
                );

        if (!academicClass) {
            throw new Error(
                "Academic class not found."
            );
        }

        return academicClass;
    };

// ======================================================
// Update Academic Class
// ======================================================

export const updateAcademicClassService =
    async (id, data) => {
        const academicClass =
            await AcademicClass.findById(id);

        if (!academicClass) {
            throw new Error(
                "Academic class not found."
            );
        }

        const newAcademicLevel =
            data.academicLevel ||
            academicClass.academicLevel;

        const newName =
            data.name || academicClass.name;

        // Check Academic Level
        const level =
            await AcademicLevel.findById(
                newAcademicLevel
            );

        if (!level) {
            throw new Error(
                "Academic level not found."
            );
        }

        // Check duplicate class
        const existingClass =
            await AcademicClass.findOne({
                name: newName,
                academicLevel:
                    newAcademicLevel,
                _id: {
                    $ne: id,
                },
            });

        if (existingClass) {
            throw new Error(
                "Academic class already exists under this academic level."
            );
        }

        // Check class teacher
        if (data.classTeacher) {
            const teacher =
                await User.findById(
                    data.classTeacher
                );

            if (!teacher) {
                throw new Error(
                    "Class teacher not found."
                );
            }

            if (teacher.role !== "teacher") {
                throw new Error(
                    "Selected user is not a teacher."
                );
            }
        }

        Object.assign(
            academicClass,
            data
        );

        await academicClass.save();

        return academicClass;
    };

// ======================================================
// Delete Academic Class
// ======================================================

export const deleteAcademicClassService =
    async (id) => {
        const academicClass =
            await AcademicClass.findById(id);

        if (!academicClass) {
            throw new Error(
                "Academic class not found."
            );
        }

        await academicClass.deleteOne();

        return academicClass;
    };