import {
    createAcademicSectionService,
    getAllAcademicSectionsService,
    getAcademicSectionByIdService,
    updateAcademicSectionService,
    deleteAcademicSectionService,
} from "../services/academicSectionService.js";

export const createAcademicSection = async (req, res) => {

    try {

        const section = await createAcademicSectionService(req.body);

        res.status(201).json({
            success: true,
            message: "Academic section created successfully.",
            data: section,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};



export const getAllAcademicSectionsController = async (req, res) => {
    try {
        const sections = await getAllAcademicSectionsService();

        res.status(200).json({
            success: true,
            data: sections,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAcademicSectionByIdController = async (req, res) => {
    try {
        const section = await getAcademicSectionByIdService(req.params.id);

        res.status(200).json({
            success: true,
            data: section,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateAcademicSectionController = async (req, res) => {
    try {
        const section = await updateAcademicSectionService(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Academic section updated successfully.",
            data: section,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteAcademicSectionController = async (req, res) => {
    try {
        const section = await deleteAcademicSectionService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Academic section deactivated successfully.",
            data: section,
        });
    } catch (error) {
            res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};