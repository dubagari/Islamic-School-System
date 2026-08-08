import AcademicSemester from "../models/AcademicSemester.js";
import AcademicSession from "../models/AcademicSession.js";


// ======================================================
// Private Helper Functions
// ======================================================


const findAcademicSessionOrThrow = async (
    academicSessionId
) => {

    const academicSession =
        await AcademicSession.findById(
            academicSessionId
        );

    if (!academicSession) {
        throw new Error(
            "Academic session not found."
        );
    }

    return academicSession;

};



// Check term dates are inside session dates

const validateSemesterDatesWithinSession = (
    startDate,
    endDate,
    academicSession
) => {

    if (
        new Date(startDate) <
        new Date(academicSession.startDate)
    ) {
        throw new Error(
            "Semester start date cannot be before academic session start date."
        );
    }


    if (
        new Date(endDate) >
        new Date(academicSession.endDate)
    ) {
        throw new Error(
            "Semester end date cannot be after academic session end date."
        );
    }


    if (
        new Date(startDate) >=
        new Date(endDate)
    ) {
        throw new Error(
            "Semester end date must be after start date."
        );
    }

};



// Prevent overlapping terms in same session

const ensureSemesterDoesNotOverlap   = async (
    academicSessionId,
    startDate,
    endDate,
    excludeId = null
) => {


    const filter = {

        academicSession:
            academicSessionId,

        startDate: {
            $lte: endDate,
        },

        endDate: {
            $gte: startDate,
        },

    };


    if (excludeId) {

        filter._id = {
            $ne: excludeId,
        };

    }


    const existingTerm =
        await AcademicSemester.findOne(
            filter
        );


    if (existingTerm) {

        throw new Error(
            "Academic semester dates overlap with an existing semester."
        );

    }

};



// ======================================================
// Create Academic Semester
// ======================================================


export const createAcademicSemesterService =
async (data) => {


    const {
        name,
        academicSession,
        startDate,
        endDate,
        isCurrent,
    } = data;



    const session =
        await findAcademicSessionOrThrow(
            academicSession
        );



    validateSemesterDatesWithinSession(
        startDate,
        endDate,
        session
    );



    await ensureSemesterDoesNotOverlap(
        academicSession,
        startDate,
        endDate
    );



    if (isCurrent) {

        await AcademicSemester.updateMany(
            {},
            {
                isCurrent: false,
            }
        );

    }



    return await AcademicSemester.create(
        data
    );

};



// ======================================================
// Get All Academic Terms
// ======================================================


export const getAcademicSemestersService =
async () => {


    return await AcademicSemester.find()

        .populate(
            "academicSession",
            "name startDate endDate"
        )

        .sort({
            createdAt: -1,
        });

};



// ======================================================
// Get Academic Semester By ID
// ======================================================


export const getAcademicSemesterByIdService =
async (id) => {


    const academicSemester=
        await AcademicSemester.findById(id)

        .populate(
            "academicSession",
            "name startDate endDate"
        );


    if (!academicSemester) {

        throw new Error(
            "Academic semester not found."
        );

    }


    return academicSemester;

};



// ======================================================
// Update Academic Term
// ======================================================


export const updateAcademicSemesterService =
async (
    id,
    data
) => {


    const academicSemester =
        await AcademicSemester.findById(
            id
        );


    if (!academicSemester) {

        throw new Error(
            "Academic semester not found."
        );

    }



    const academicSessionId =
        data.academicSession ||
        academicSemester.academicSession;



    const session =
        await findAcademicSessionOrThrow(
            academicSessionId
        );



    const semesterStartDate =
        data.startDate ||
        academicSemester.startDate;



    const semesterEndDate =
        data.endDate ||
        academicSemester.endDate;



    validateSemesterDatesWithinSession(
        semesterStartDate,
        semesterEndDate,
        session
    );



    await ensureSemesterDoesNotOverlap(
        academicSessionId,
        semesterStartDate,
        semesterEndDate,
        id
    );



    if (data.isCurrent) {

        await AcademicSemester.updateMany(
            {
                _id: {
                    $ne: id,
                },
            },
            {
                isCurrent: false,
            }
        );

    }



    Object.assign(
        academicSemester,
        data
    );


    await academicSemester.save();


    return academicSemester;

};



// ======================================================
// Delete Academic Term
// ======================================================


export const deleteAcademicSemesterService =
async (id) => {


    const academicSemester =
        await AcademicSemester.findById(
            id
        );


    if (!academicSemester) {

        throw new Error(
            "Academic semester not found."
        );

    }


    await academicSemester.deleteOne();


    return academicSemester;

};