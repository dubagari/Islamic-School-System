import AcademicClass from "../models/AcademicClass.js";
import AcademicLevel from "../models/AcademicLevel.js";
import User from "../models/User.js";
import Student from "../models/Student.js";

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

export const getAcademicClassByIdService =    async (id) => {
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

export const updateAcademicClassService =    async (id, data) => {
        const academicClass = await AcademicClass.findById(id);

        if (!academicClass) {
            throw new Error("Academic class not found.");
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

export const deleteAcademicClassService =    async (id) => {
        const academicClass = await AcademicClass.findById(id);

        if (!academicClass) {
            throw new Error(
                "Academic class not found."
            );
        }

        await academicClass.deleteOne();

        return academicClass;
    };


    // ======================================================
// Assign Student To Academic Class
// Admin
// ======================================================

export const assignStudentToAcademicClassService =    async (studentId, academicClassId) => {

        // --------------------------------------------------
        // 1. Find student
        // --------------------------------------------------

        const student =
            await Student.findById(studentId);

        if (!student) {
            throw new Error(
                "Student not found."
            );
        }

        // --------------------------------------------------
        // 2. Student must be active
        // --------------------------------------------------

        if (!student.isActive) {
            throw new Error(
                "Cannot assign an inactive student."
            );
        }

        if (student.status !== "Active") {
            throw new Error(
                "Student must have Active status."
            );
        }

        // --------------------------------------------------
        // 3. Find academic class
        // --------------------------------------------------

        const academicClass =
            await AcademicClass.findById(
                academicClassId
            );

        if (!academicClass) {
            throw new Error(
                "Academic class not found."
            );
        }

        // --------------------------------------------------
        // 4. Class must be active
        // --------------------------------------------------

        if (!academicClass.isActive) {
            throw new Error(
                "Cannot assign student to an inactive class."
            );
        }

        // --------------------------------------------------
        // 5. Check if student is already in this class
        // --------------------------------------------------

        if (
            student.academicClass &&
            student.academicClass.toString() ===
                academicClass._id.toString()
        ) {
            throw new Error(
                "Student is already assigned to this class."
            );
        }

        // --------------------------------------------------
        // 6. Check class capacity
        // --------------------------------------------------

        const studentsInClass =
            await Student.countDocuments({
                academicClass:
                    academicClass._id,
                isActive: true,
                status: "Active",
            });

        if (
            studentsInClass >=
            academicClass.capacity
        ) {
            throw new Error(
                "Academic class has reached its capacity."
            );
        }

        // --------------------------------------------------
        // 7. Assign student
        // --------------------------------------------------

        student.academicClass =
            academicClass._id;

        await student.save();

        // --------------------------------------------------
        // 8. Return populated student
        // --------------------------------------------------

        return await Student.findById(
            student._id
        )
            .populate(
                "academicClass"
            )
            .populate(
                "user",
                "-password"
            );
    };