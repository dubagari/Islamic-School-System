import StudentEnrollment from "../models/StudentEnrollment.js";
import Student from "../models/Student.js";
import AcademicSession from "../models/AcademicSession.js";
import AcademicClass from "../models/AcademicClass.js";

// ======================================================
// Create Student Enrollment
// Admin
// ======================================================

export const createStudentEnrollmentService = async (data) => {
    const {
        student,
        academicSession,
        academicClass,
    } = data;

    // --------------------------------------------------
    // 1. Check student
    // --------------------------------------------------

    const existingStudent =
        await Student.findById(student);

    if (!existingStudent) {
        throw new Error(
            "Student not found."
        );
    }

    // --------------------------------------------------
    // 2. Check academic session
    // --------------------------------------------------

    const session =
        await AcademicSession.findById(
            academicSession
        );

    if (!session) {
        throw new Error(
            "Academic session not found."
        );
    }

    // --------------------------------------------------
    // 3. Check academic class
    // --------------------------------------------------

    const academicClassDocument =
        await AcademicClass.findById(
            academicClass
        );

    if (!academicClassDocument) {
        throw new Error(
            "Academic class not found."
        );
    }

    // --------------------------------------------------
    // 4. Prevent duplicate enrollment
    // --------------------------------------------------

    const existingEnrollment =
        await StudentEnrollment.findOne({
            student,
            academicSession,
        });

    if (existingEnrollment) {
        throw new Error(
            "Student is already enrolled in this academic session."
        );
    }

    // --------------------------------------------------
    // 5. Create enrollment
    // --------------------------------------------------

    const enrollment =
        await StudentEnrollment.create({
            student,
            academicSession,
            academicClass,
            status: "Active",
            isActive: true,
        });

    // --------------------------------------------------
    // 6. Update student's current class
    // --------------------------------------------------

    existingStudent.academicClass =
        academicClass;

    await existingStudent.save();

    // --------------------------------------------------
    // 7. Return populated enrollment
    // --------------------------------------------------

    return await StudentEnrollment.findById(
        enrollment._id
    )
        .populate(
            "student",
            "-__v"
        )
        .populate(
            "academicSession"
        )
        .populate(
            "academicClass"
        );
};

// ======================================================
// Get All Student Enrollments
// Admin
// ======================================================

export const getAllStudentEnrollmentsService =
    async () => {

        return await StudentEnrollment.find()
            .populate(
                "student",
                "-__v"
            )
            .populate(
                "academicSession"
            )
            .populate(
                "academicClass"
            )
            .sort({
                createdAt: -1,
            });
    };

// ======================================================
// Get Enrollment By ID
// Admin
// ======================================================

export const getStudentEnrollmentByIdService =
    async (enrollmentId) => {

        const enrollment =
            await StudentEnrollment.findById(
                enrollmentId
            )
                .populate(
                    "student",
                    "-__v"
                )
                .populate(
                    "academicSession"
                )
                .populate(
                    "academicClass"
                );

        if (!enrollment) {
            throw new Error(
                "Student enrollment not found."
            );
        }

        return enrollment;
    };

// ======================================================
// Get Student Enrollment History
// Admin
// ======================================================

export const getStudentEnrollmentHistoryService =
    async (studentId) => {

        const student =
            await Student.findById(
                studentId
            );

        if (!student) {
            throw new Error(
                "Student not found."
            );
        }

        return await StudentEnrollment.find({
            student: studentId,
        })
            .populate(
                "academicSession"
            )
            .populate(
                "academicClass"
            )
            .sort({
                createdAt: -1,
            });
    };

// ======================================================
// Get Current Student Enrollment
// Admin
// ======================================================

export const getCurrentStudentEnrollmentService =
    async (studentId) => {

        const student =
            await Student.findById(
                studentId
            );

        if (!student) {
            throw new Error(
                "Student not found."
            );
        }

        const enrollment =
            await StudentEnrollment.findOne({
                student: studentId,
                status: "Active",
                isActive: true,
            })
                .populate(
                    "academicSession"
                )
                .populate(
                    "academicClass"
                )
                .sort({
                    createdAt: -1,
                });

        if (!enrollment) {
            throw new Error(
                "Current student enrollment not found."
            );
        }

        return enrollment;
    };

// ======================================================
// Update Student Enrollment
// Admin
// ======================================================

export const updateStudentEnrollmentService =
    async (enrollmentId, data) => {

        const enrollment =
            await StudentEnrollment.findById(
                enrollmentId
            );

        if (!enrollment) {
            throw new Error(
                "Student enrollment not found."
            );
        }

        // ----------------------------------------------
        // Prevent changing student/session
        // ----------------------------------------------

        delete data.student;
        delete data.academicSession;

        // ----------------------------------------------
        // Handle status
        // ----------------------------------------------

        if (data.status) {

            const allowedStatuses = [
                "Active",
                "Completed",
                "Transferred",
                "Withdrawn",
            ];

            if (
                !allowedStatuses.includes(
                    data.status
                )
            ) {
                throw new Error(
                    "Invalid enrollment status."
                );
            }

            if (
                data.status === "Active"
            ) {
                data.isActive = true;
            } else {
                data.isActive = false;
            }
        }

        // ----------------------------------------------
        // Validate class if changed
        // ----------------------------------------------

        if (data.academicClass) {

            const academicClassDocument =
                await AcademicClass.findById(
                    data.academicClass
                );

            if (!academicClassDocument) {
                throw new Error(
                    "Academic class not found."
                );
            }
        }

        Object.assign(
            enrollment,
            data
        );

        await enrollment.save();

        // ----------------------------------------------
        // Update student's current class
        // ----------------------------------------------

        if (
            data.academicClass &&
            enrollment.status === "Active"
        ) {

            await Student.findByIdAndUpdate(
                enrollment.student,
                {
                    academicClass:
                        data.academicClass,
                }
            );
        }

        return await StudentEnrollment.findById(
            enrollment._id
        )
            .populate(
                "student",
                "-__v"
            )
            .populate(
                "academicSession"
            )
            .populate(
                "academicClass"
            );
    };

// ======================================================
// Deactivate Student Enrollment
// Admin
// ======================================================

export const deactivateStudentEnrollmentService =
    async (enrollmentId) => {

        const enrollment =
            await StudentEnrollment.findById(
                enrollmentId
            );

        if (!enrollment) {
            throw new Error(
                "Student enrollment not found."
            );
        }

        enrollment.status =
            "Withdrawn";

        enrollment.isActive = false;

        await enrollment.save();

        return enrollment;
    };