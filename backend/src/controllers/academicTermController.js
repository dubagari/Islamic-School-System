import {
    createAcademicTermService,
    getAllAcademicTermsService,
    getAcademicTermByIdService,
    updateAcademicTermService,
    deleteAcademicTermService,
} from "../services/academicTermService.js";

export const createAcademicTermController = async (req, res, next) => {
    try {
        const term = await createAcademicTermService(req.body);

        res.status(201).json({
            success: true,
            message: "Academic term created successfully.",
            data: term,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllAcademicTermsController = async (req, res, next) => {
    try {
        const terms = await getAllAcademicTermsService();

        res.status(200).json({
            success: true,
            data: terms,
        });
    } catch (error) {
        next(error);
    }
};

export const getAcademicTermByIdController = async (req, res, next) => {
    try {
        const term = await getAcademicTermByIdService(req.params.id);

        res.status(200).json({
            success: true,
            data: term,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAcademicTermController = async (req, res, next) => {
    try {
        const term = await updateAcademicTermService(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Academic term updated successfully.",
            data: term,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAcademicTermController = async (req, res, next) => {
    try {
        const term = await deleteAcademicTermService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Academic term deactivated successfully.",
            data: term,
        });
    } catch (error) {
        next(error);
    }
};