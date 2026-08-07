import AcademicTerm from "../models/AcademicTerm.js";
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

const validateTermDatesWithinSession = (
    startDate,
    endDate,
    academicSession
) => {

    if (
        new Date(startDate) <
        new Date(academicSession.startDate)
    ) {
        throw new Error(
            "Term start date cannot be before academic session start date."
        );
    }


    if (
        new Date(endDate) >
        new Date(academicSession.endDate)
    ) {
        throw new Error(
            "Term end date cannot be after academic session end date."
        );
    }


    if (
        new Date(startDate) >=
        new Date(endDate)
    ) {
        throw new Error(
            "Term end date must be after start date."
        );
    }

};



// Prevent overlapping terms in same session

const ensureTermDoesNotOverlap = async (
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
        await AcademicTerm.findOne(
            filter
        );


    if (existingTerm) {

        throw new Error(
            "Academic term dates overlap with an existing term."
        );

    }

};



// ======================================================
// Create Academic Term
// ======================================================


export const createAcademicTermService =
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



    validateTermDatesWithinSession(
        startDate,
        endDate,
        session
    );



    await ensureTermDoesNotOverlap(
        academicSession,
        startDate,
        endDate
    );



    if (isCurrent) {

        await AcademicTerm.updateMany(
            {},
            {
                isCurrent: false,
            }
        );

    }



    return await AcademicTerm.create(
        data
    );

};



// ======================================================
// Get All Academic Terms
// ======================================================


export const getAcademicTermsService =
async () => {


    return await AcademicTerm.find()

        .populate(
            "academicSession",
            "name startDate endDate"
        )

        .sort({
            createdAt: -1,
        });

};



// ======================================================
// Get Academic Term By ID
// ======================================================


export const getAcademicTermByIdService =
async (id) => {


    const academicTerm =
        await AcademicTerm.findById(id)

        .populate(
            "academicSession",
            "name startDate endDate"
        );


    if (!academicTerm) {

        throw new Error(
            "Academic term not found."
        );

    }


    return academicTerm;

};



// ======================================================
// Update Academic Term
// ======================================================


export const updateAcademicTermService =
async (
    id,
    data
) => {


    const academicTerm =
        await AcademicTerm.findById(
            id
        );


    if (!academicTerm) {

        throw new Error(
            "Academic term not found."
        );

    }



    const academicSessionId =
        data.academicSession ||
        academicTerm.academicSession;



    const session =
        await findAcademicSessionOrThrow(
            academicSessionId
        );



    const termStartDate =
        data.startDate ||
        academicTerm.startDate;



    const termEndDate =
        data.endDate ||
        academicTerm.endDate;



    validateTermDatesWithinSession(
        termStartDate,
        termEndDate,
        session
    );



    await ensureTermDoesNotOverlap(
        academicSessionId,
        termStartDate,
        termEndDate,
        id
    );



    if (data.isCurrent) {

        await AcademicTerm.updateMany(
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
        academicTerm,
        data
    );


    await academicTerm.save();


    return academicTerm;

};



// ======================================================
// Delete Academic Term
// ======================================================


export const deleteAcademicTermService =
async (id) => {


    const academicTerm =
        await AcademicTerm.findById(
            id
        );


    if (!academicTerm) {

        throw new Error(
            "Academic term not found."
        );

    }


    await academicTerm.deleteOne();


    return academicTerm;

};