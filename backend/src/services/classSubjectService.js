import ClassSubject from "../models/ClassSubject.js";
import AcademicClass from "../models/AcademicClass.js";
import Subject from "../models/Subject.js";
import AcademicSemester from "../models/AcademicSemester.js";

// ======================================================
// Generate Course Code
// ======================================================

const generateCourseCode = (
    prefix,
    levelNumber,
    semesterNumber
) => {
    return `${prefix}${levelNumber}0${semesterNumber}`;
};

// ======================================================
// Create Class Subject
// ======================================================

export const createClassSubjectService = async (
    data
) => {
    const {
        academicClass,
        subject,
        academicSemester,
        description,
        isActive,
    } = data;

    // --------------------------------------------------
    // Check Academic Class
    // --------------------------------------------------

    const classData =
        await AcademicClass.findById(
            academicClass
        ).populate("academicLevel");

    if (!classData) {
        throw new Error(
            "Academic class not found."
        );
    }

    // --------------------------------------------------
    // Check Academic Level
    // --------------------------------------------------

    const academicLevel =
        classData.academicLevel;

    if (!academicLevel) {
        throw new Error(
            "Academic level not found for this class."
        );
    }

    // --------------------------------------------------
    // Check Subject
    // --------------------------------------------------

    const subjectData =
        await Subject.findById(subject);

    if (!subjectData) {
        throw new Error(
            "Subject not found."
        );
    }

    // --------------------------------------------------
    // Check Academic Semester
    // --------------------------------------------------

    const semesterData =
        await AcademicSemester.findById(
            academicSemester
        );

    if (!semesterData) {
        throw new Error(
            "Academic semester not found."
        );
    }

    // --------------------------------------------------
    // Check Section Compatibility
    // --------------------------------------------------

    const classSection =
        academicLevel.section?.toString();

    const subjectSection =
        subjectData.section?.toString();

    if (
        classSection !== subjectSection
    ) {
        throw new Error(
            "Subject and academic class must belong to the same academic section."
        );
    }

    // --------------------------------------------------
    // Validate Level Number
    // --------------------------------------------------

    const levelNumber =
        academicLevel.levelNumber;

    if (
        !levelNumber ||
        levelNumber < 1
    ) {
        throw new Error(
            "Academic level number is invalid."
        );
    }

    // --------------------------------------------------
    // Determine Semester Number
    // --------------------------------------------------

    const semesterName =
        semesterData.name
            .toLowerCase()
            .trim();

    let semesterNumber;

    if (
        semesterName.includes("first")
    ) {
        semesterNumber = 1;
    } else if (
        semesterName.includes("second")
    ) {
        semesterNumber = 2;
    } else {
        throw new Error(
            "Academic semester must be First Semester or Second Semester."
        );
    }

    // --------------------------------------------------
    // Generate Course Code
    // --------------------------------------------------

    const courseCode =
        generateCourseCode(
            subjectData.prefix,
            levelNumber,
            semesterNumber
        );

    // --------------------------------------------------
    // Check Duplicate Class Subject
    // --------------------------------------------------

    const existingClassSubject =
        await ClassSubject.findOne({
            academicClass,
            subject,
            academicSemester,
        });

    if (existingClassSubject) {
        throw new Error(
            "This subject is already assigned to this class for this academic semester."
        );
    }

    // --------------------------------------------------
    // Check Duplicate Course Code
    // --------------------------------------------------

    const existingCourseCode =
        await ClassSubject.findOne({
            courseCode,
            academicSemester,
        });

    if (existingCourseCode) {
        throw new Error(
            "This course code already exists for this academic semester."
        );
    }

    // --------------------------------------------------
    // Create Class Subject
    // --------------------------------------------------

    const classSubject =
        await ClassSubject.create({
            academicClass,
            subject,
            academicSemester,
            courseCode,
            description:
                description || "",
            isActive:
                isActive ?? true,
        });

    // --------------------------------------------------
    // Return Populated Result
    // --------------------------------------------------

    return await ClassSubject.findById(
        classSubject._id
    )
        .populate({
            path: "academicClass",
            populate: {
                path: "academicLevel",
                select:
                    "name levelNumber section",
            },
        })
        .populate(
            "subject",
            "name prefix"
        )
        .populate(
            "academicSemester",
            "name startDate endDate"
        );
};

// ======================================================
// Get All Class Subjects
// ======================================================

export const getClassSubjectsService =
    async () => {

        return await ClassSubject.find()
            .populate({
                path: "academicClass",
                populate: {
                    path: "academicLevel",
                    select:
                        "name levelNumber section",
                },
            })
            .populate(
                "subject",
                "name prefix"
            )
            .populate(
                "academicSemester",
                "name startDate endDate"
            )
            .sort({
                courseCode: 1,
            });
    };

// ======================================================
// Get Class Subjects By Section
// ======================================================

export const getClassSubjectsBySectionService =
    async (sectionId) => {

        const classes =
            await AcademicClass.find()
                .populate(
                    "academicLevel"
                );

        const classIds =
            classes
                .filter(
                    (item) =>
                        item.academicLevel
                            ?.section
                            ?.toString() ===
                        sectionId
                )
                .map(
                    (item) =>
                        item._id
                );

        return await ClassSubject.find({
            academicClass: {
                $in: classIds,
            },
        })
            .populate({
                path: "academicClass",
                populate: {
                    path: "academicLevel",
                    select:
                        "name levelNumber section",
                },
            })
            .populate(
                "subject",
                "name prefix"
            )
            .populate(
                "academicSemester",
                "name startDate endDate"
            )
            .sort({
                courseCode: 1,
            });
    };

// ======================================================
// Get Class Subject By ID
// ======================================================

export const getClassSubjectByIdService =
    async (id) => {

        const classSubject =
            await ClassSubject.findById(
                id
            )
                .populate({
                    path: "academicClass",
                    populate: {
                        path: "academicLevel",
                        select:
                            "name levelNumber section",
                    },
                })
                .populate(
                    "subject",
                    "name prefix"
                )
                .populate(
                    "academicSemester",
                    "name startDate endDate"
                );

        if (!classSubject) {
            throw new Error(
                "Class subject not found."
            );
        }

        return classSubject;
    };

// ======================================================
// Update Class Subject
// ======================================================

export const updateClassSubjectService =
    async (id, data) => {

        const classSubject =
            await ClassSubject.findById(
                id
            );

        if (!classSubject) {
            throw new Error(
                "Class subject not found."
            );
        }

        // Core relationships cannot be changed
        if (
            data.academicClass ||
            data.subject ||
            data.academicSemester
        ) {
            throw new Error(
                "Academic class, subject, and academic semester cannot be changed after creation."
            );
        }

        if (
            data.description !==
            undefined
        ) {
            classSubject.description =
                data.description;
        }

        if (
            data.isActive !==
            undefined
        ) {
            classSubject.isActive =
                data.isActive;
        }

        await classSubject.save();

        return await getClassSubjectByIdService(
            id
        );
    };

// ======================================================
// Delete Class Subject
// ======================================================

export const deleteClassSubjectService =
    async (id) => {

        const classSubject =
            await ClassSubject.findById(
                id
            );

        if (!classSubject) {
            throw new Error(
                "Class subject not found."
            );
        }

        await classSubject.deleteOne();

        return classSubject;
    };