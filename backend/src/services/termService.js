import Session from "../models/Session.js";
import Term from "../models/Term.js";

export const createTermService = async (termData) => {

    // Validate dates
    const startDate = new Date(termData.startDate);
    const endDate = new Date(termData.endDate);

    if (startDate >= endDate) {
        throw new Error("End date must be after the start date.");
    }

    // Check if session exists
    const session = await Session.findById(termData.session);

    if (!session) {
        throw new Error("Academic session not found.");
    }

    // Ensure term dates fall within the session
    if (
        startDate < session.startDate ||
        endDate > session.endDate
    ) {
        throw new Error(
            "Term dates must be within the selected academic session."
        );
    }

    // Prevent duplicate term in the same session
    const existingTerm = await Term.findOne({
        session: termData.session,
        name: termData.name,
    });

    if (existingTerm) {
        throw new Error(
            `${termData.name} already exists for this academic session.`
        );
    }

    // Only one current term
    if (termData.isCurrent) {
        await Term.updateMany(
            { isCurrent: true },
            { isCurrent: false }
        );
    }

    return await Term.create(termData);
};