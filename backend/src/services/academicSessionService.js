import AcademicSession from "../models/AcademicSession.js";



const ensureAcademicSessionDoesNotOverlap = async (
    startDate,
    endDate,
    excludeId = null
) => {

    const filter = {
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

    const existingSession =
        await AcademicSession.findOne(filter);

    if (existingSession) {
        throw new Error(
            "Academic session dates overlap with an existing session."
        );
    }

};

// ======================================================
// Create Academic Session
// ======================================================

export const createAcademicSessionService = async (
    data
) => {

    const {
        name,
        startDate,
        endDate,
        isCurrent,
    } = data;

    const existingSession =
        await AcademicSession.findOne({
            name,
        });

    if (existingSession) {
        throw new Error(
            "Academic session already exists."
        );
    }

    if (new Date(startDate) >= new Date(endDate)) {
        throw new Error(
            "End date must be after start date."
        );
    }

    await ensureAcademicSessionDoesNotOverlap(
    startDate,
    endDate
);
    if (isCurrent) {

        await AcademicSession.updateMany(
            {},
            {
                isCurrent: false,
            }
        );

    }

    return await AcademicSession.create(data);

};

// ======================================================
// Get All Academic Sessions
// ======================================================

export const getAcademicSessionsService =
    async () => {

        return await AcademicSession.find()
            .sort({
                startDate: -1,
            });

    };

// ======================================================
// Get Academic Session By ID
// ======================================================

export const getAcademicSessionByIdService =
    async (id) => {

        const academicSession =
            await AcademicSession.findById(id);

        if (!academicSession) {
            throw new Error(
                "Academic session not found."
            );
        }

        return academicSession;

    };

// ======================================================
// Update Academic Session
// ======================================================

export const updateAcademicSessionService = async (
    id,
    data
) => {

    const academicSession =
        await AcademicSession.findById(id);

    if (!academicSession) {
        throw new Error(
            "Academic session not found."
        );
    }

    const sessionStartDate =
        data.startDate || academicSession.startDate;

    const sessionEndDate =
        data.endDate || academicSession.endDate;

    if (
        new Date(sessionStartDate) >=
        new Date(sessionEndDate)
    ) {
        throw new Error(
            "End date must be after start date."
        );
    }

    await ensureAcademicSessionDoesNotOverlap(
        sessionStartDate,
        sessionEndDate,
        id
    );

    if (data.isCurrent) {

        await AcademicSession.updateMany(
            {},
            {
                isCurrent: false,
            }
        );

    }

    Object.assign(
        academicSession,
        data
    );

    await academicSession.save();

    return academicSession;

};

// ======================================================
// Delete Academic Session
// ======================================================

export const deleteAcademicSessionService =
    async (id) => {

        const academicSession =
            await AcademicSession.findById(id);

        if (!academicSession) {
            throw new Error(
                "Academic session not found."
            );
        }

        await academicSession.deleteOne();

        return academicSession;

    };