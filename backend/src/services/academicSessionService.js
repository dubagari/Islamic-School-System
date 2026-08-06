import AcademicSession from "../models/AcademicSession.js";
import { generateAcademicSessionName } from "../utils/generateAcademicSessionName.js";


export const createAcademicSessionService = async (data) => {

    if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new Error("End date must be after the start date.");
    }

    const sessionName = generateAcademicSessionName(
        data.startDate,
        data.endDate
    );

    const existingSession = await AcademicSession.findOne({
        name: sessionName,
    });

    if (existingSession) {
        throw new Error("Academic session already exists.");
    }

    if (data.isCurrent) {
        await AcademicSession.updateMany(
            {},
            { isCurrent: false }
        );
    }

    return await AcademicSession.create({
        ...data,
        name: sessionName,
    });
};

export const getAllAcademicSessionsService = async () => {

    return await AcademicSession.find()

        .sort({
            startDate: -1,
        });

};

export const getAcademicSessionByIdService = async (id) => {

    const session = await AcademicSession.findById(id);

    if (!session) {
        throw new Error("Academic session not found.");
    }

    return session;
};

export const updateAcademicSessionService = async (id, data) => {

    const session = await AcademicSession.findById(id);

    if (!session) {
        throw new Error("Academic session not found.");
    }

    if (data.startDate || data.endDate) {

        const startDate = data.startDate || session.startDate;
        const endDate = data.endDate || session.endDate;

        if (new Date(startDate) >= new Date(endDate)) {
            throw new Error("End date must be after the start date.");
        }

        data.name = generateAcademicSessionName(
            startDate,
            endDate
        );
    }

    if (data.isCurrent) {
        await AcademicSession.updateMany(
            {},
            { isCurrent: false }
        );
    }

    Object.assign(session, data);

    await session.save();

    return session;
};

export const deleteAcademicSessionService = async (id) => {

    const session = await AcademicSession.findById(id);

    if (!session) {
        throw new Error("Academic session not found.");
    }

    session.isActive = false;

    await session.save();

    return session;
};
