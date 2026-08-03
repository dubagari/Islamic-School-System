import Session from "../models/Session.js";
import { generateSessionName } from "../utils/generateSessionName.js";

export const createSessionService = async (sessionData) => {

    if (new Date(sessionData.startDate) >= new Date(sessionData.endDate)) {
    throw new Error("End date must be after the start date.");
}
    const sessionName = generateSessionName(
        sessionData.startDate,
        sessionData.endDate
    );

    const existingSession = await Session.findOne({
        name: sessionName,
    });

    if (existingSession) {
        throw new Error("Academic session already exists.");
    }

    if (sessionData.isCurrent) {
        await Session.updateMany({}, { isCurrent: false });
    }

  

    return await Session.create({
        ...sessionData,
        name: sessionName,
    });
};

