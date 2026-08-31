
import User from "../models/User.js";
import ClassSubject from "../models/ClassSubject.js";
import TeacherAssignment from "../models/TeacherAssignment.js";

// ======================================================
// Create Teacher Assignment
// ======================================================

export const createTeacherAssignmentService = async (data) => {
    const {
        teacher,
        classSubject,
        assignedBy,
        assignedDate,
        isActive,
    } = data;

    // --------------------------------------------------
    // Check Teacher
    // --------------------------------------------------

    const teacherUser = await User.findById(teacher);

    if (!teacherUser) {
        throw new Error("Teacher not found.");
    }

    if (teacherUser.role !== "teacher") {
        throw new Error(
            "Selected user is not a teacher."
        );
    }

    if (!teacherUser.isActive) {
        throw new Error(
            "Teacher account is inactive."
        );
    }

    // --------------------------------------------------
    // Check Class Subject
    // --------------------------------------------------

    const classSubjectRecord =
        await ClassSubject.findById(classSubject);

    if (!classSubjectRecord) {
        throw new Error(
            "Class subject not found."
        );
    }

    if (!classSubjectRecord.isActive) {
        throw new Error(
            "Class subject is inactive."
        );
    }

    // --------------------------------------------------
    // Check Assigned By User
    // --------------------------------------------------

    const assignedByUser =
        await User.findById(assignedBy);

    if (!assignedByUser) {
        throw new Error(
            "Assigning user not found."
        );
    }

    // --------------------------------------------------
    // Check Duplicate Assignment
    // --------------------------------------------------

    const existingAssignment =
        await TeacherAssignment.findOne({
            teacher,
            classSubject,
        });

    if (existingAssignment) {
        throw new Error(
            "This teacher is already assigned to this class subject."
        );
    }

    // --------------------------------------------------
    // Create Assignment
    // --------------------------------------------------

    const assignment =
        await TeacherAssignment.create({
            teacher,
            classSubject,
            assignedBy,
            assignedDate,
            isActive,
        });

    // --------------------------------------------------
    // Return Populated Assignment
    // --------------------------------------------------

    return await TeacherAssignment.findById(
        assignment._id
    )
        .populate(
            "teacher",
            "fullName email username role employeeNumber"
        )
        .populate({
            path: "classSubject",
            populate: [
                {
                    path: "academicClass",
                    populate: {
                        path: "academicLevel",
                        select:
                            "name levelNumber section",
                    },
                },
                {
                    path: "subject",
                    select: "name prefix",
                },
                {
                    path: "academicSemester",
                    select:
                        "name startDate endDate",
                },
            ],
        })
        .populate(
            "assignedBy",
            "fullName email username role"
        );
};

// ======================================================
// Get All Teacher Assignments
// ======================================================

export const getTeacherAssignmentsService =
    async () => {
        return await TeacherAssignment.find()
            .populate(
                "teacher",
                "fullName email username role employeeNumber"
            )
            .populate({
                path: "classSubject",
                populate: [
                    {
                        path: "academicClass",
                        populate: {
                            path: "academicLevel",
                            select:
                                "name levelNumber section",
                        },
                    },
                    {
                        path: "subject",
                        select: "name prefix",
                    },
                    {
                        path: "academicSemester",
                        select:
                            "name startDate endDate",
                    },
                ],
            })
            .populate(
                "assignedBy",
                "fullName email username role"
            )
            .sort({
                createdAt: -1,
            });
};

// ======================================================
// Get Teacher Assignments By Teacher
// ======================================================

export const getTeacherAssignmentsByTeacherService =
    async (teacher) => {
        const teacherUser =
            await User.findById(teacher);

        if (!teacherUser) {
            throw new Error(
                "Teacher not found."
            );
        }

        if (teacherUser.role !== "teacher") {
            throw new Error(
                "Selected user is not a teacher."
            );
        }

        return await TeacherAssignment.find({
            teacher,
            isActive: true,
        })
            .populate({
                path: "classSubject",
                populate: [
                    {
                        path: "academicClass",
                        populate: {
                            path: "academicLevel",
                            select:
                                "name levelNumber section",
                        },
                    },
                    {
                        path: "subject",
                        select: "name prefix",
                    },
                    {
                        path: "academicSemester",
                        select:
                            "name startDate endDate",
                    },
                ],
            })
            .sort({
                createdAt: -1,
            });
};

// ======================================================
// Get Teacher Assignment By ID
// ======================================================

export const getTeacherAssignmentByIdService =
    async (id) => {
        const assignment =
            await TeacherAssignment.findById(id)
                .populate(
                    "teacher",
                    "fullName email username role employeeNumber"
                )
                .populate({
                    path: "classSubject",
                    populate: [
                        {
                            path: "academicClass",
                            populate: {
                                path: "academicLevel",
                                select:
                                    "name levelNumber section",
                            },
                        },
                        {
                            path: "subject",
                            select:
                                "name prefix",
                        },
                        {
                            path: "academicSemester",
                            select:
                                "name startDate endDate",
                        },
                    ],
                })
                .populate(
                    "assignedBy",
                    "fullName email username role"
                );

        if (!assignment) {
            throw new Error(
                "Teacher assignment not found."
            );
        }

        return assignment;
    };

// ======================================================
// Update Teacher Assignment
// ======================================================

export const updateTeacherAssignmentService =
    async (id, data) => {
        const assignment =
            await TeacherAssignment.findById(id);

        if (!assignment) {
            throw new Error(
                "Teacher assignment not found."
            );
        }

        // --------------------------------------------------
        // If teacher is being changed
        // --------------------------------------------------

        if (data.teacher) {
            const teacherUser =
                await User.findById(
                    data.teacher
                );

            if (!teacherUser) {
                throw new Error(
                    "Teacher not found."
                );
            }

            if (
                teacherUser.role !==
                "teacher"
            ) {
                throw new Error(
                    "Selected user is not a teacher."
                );
            }

            if (!teacherUser.isActive) {
                throw new Error(
                    "Teacher account is inactive."
                );
            }
        }

        // --------------------------------------------------
        // If class subject is being changed
        // --------------------------------------------------

        if (data.classSubject) {
            const classSubjectRecord =
                await ClassSubject.findById(
                    data.classSubject
                );

            if (!classSubjectRecord) {
                throw new Error(
                    "Class subject not found."
                );
            }

            if (
                !classSubjectRecord.isActive
            ) {
                throw new Error(
                    "Class subject is inactive."
                );
            }
        }

        const newTeacher =
            data.teacher ||
            assignment.teacher;

        const newClassSubject =
            data.classSubject ||
            assignment.classSubject;

        // --------------------------------------------------
        // Check Duplicate Assignment
        // --------------------------------------------------

        const existingAssignment =
            await TeacherAssignment.findOne({
                teacher: newTeacher,
                classSubject:
                    newClassSubject,
                _id: {
                    $ne: id,
                },
            });

        if (existingAssignment) {
            throw new Error(
                "This teacher is already assigned to this class subject."
            );
        }

        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        Object.assign(
            assignment,
            data
        );

        await assignment.save();

        return await getTeacherAssignmentByIdService(
            id
        );
    };

// ======================================================
// Delete Teacher Assignment
// ======================================================

export const deleteTeacherAssignmentService =
    async (id) => {
        const assignment =
            await TeacherAssignment.findById(id);

        if (!assignment) {
            throw new Error(
                "Teacher assignment not found."
            );
        }

        await assignment.deleteOne();

        return assignment;
    };
// ======================================================
// Get My Teacher Assignments
// Teacher
// ======================================================

export const getMyTeacherAssignmentsService =  async (teacherUserId) => {

        const assignments =
            await TeacherAssignment.find({
                teacher: teacherUserId,
                isActive: true,
            })
                .populate({
                    path: "classSubject",
                    populate: [
                        {
                            path: "academicClass",
                            populate: {
                                path: "academicLevel",
                                select: "name levelNumber section",
                            },
                        },
                        {
                            path: "subject",
                            select: "name prefix",
                        },
                        {
                            path: "academicSemester",
                            select: "name startDate endDate",
                        },
                    ],
                })
                .populate(
                    "assignedBy",
                    "fullName username email role"
                )
                .sort({
                    assignedDate: -1,
                });

        return assignments;
    };