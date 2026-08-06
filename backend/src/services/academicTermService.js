import AcademicSession from "../models/AcademicSession.js";
import AcademicTerm from "../models/AcademicTerm.js";

export const createAcademicTermService = async (data) => {


    const session = await AcademicSession.findById(data.session);

    if (!session) {
        throw new Error("Academic session not found.");
    }

    if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new Error("End date must be after the start date.");
    }

    if (
        new Date(data.startDate) < new Date(session.startDate) ||
        new Date(data.endDate) > new Date(session.endDate)
    ) {
        throw new Error("Term dates must be within the selected academic session.");
    }

    const existingTerm = await AcademicTerm.findOne({
        session: data.session,
        name: data.name,
    });

    if (existingTerm) {
        throw new Error("Academic term already exists in this session.");
    }

    if (data.isCurrent) {
        await AcademicTerm.updateMany(
            { session: data.session },
            { isCurrent: false }
        );
    }

    return await AcademicTerm.create(data);
};

export const getAllAcademicTermsService = async () => {

    return await AcademicTerm.find()

        .populate("session", "name")

        .sort({
            createdAt: -1,
        });
};

export const getAcademicTermByIdService = async (id) => {

    const term = await AcademicTerm.findById(id)

        .populate("session", "name");

    if (!term) {
        throw new Error("Academic term not found.");
    }

    return term;
};

export const updateAcademicTermService = async (id, data) => {

    const term = await AcademicTerm.findById(id);

    if (!term) {
        throw new Error("Academic term not found.");
    }

    const session = await AcademicSession.findById(term.session);

    const startDate = data.startDate || term.startDate;
    const endDate = data.endDate || term.endDate;

    if (new Date(startDate) >= new Date(endDate)) {
        throw new Error("End date must be after the start date.");
    }

    if (
        new Date(startDate) < new Date(session.startDate) ||
        new Date(endDate) > new Date(session.endDate)
    ) {
        throw new Error("Term dates must be within the selected academic session.");
    }

    if (data.isCurrent) {
        await AcademicTerm.updateMany(
            { session: term.session },
            { isCurrent: false }
        );
    }

    Object.assign(term, data);

    await term.save();

    return term;
};

export const deleteAcademicTermService = async (id) => {

    const term = await AcademicTerm.findById(id);

    if (!term) {
        throw new Error("Academic term not found.");
    }

    term.isActive = false;

    await term.save();

    return term;
};