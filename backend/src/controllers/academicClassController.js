import {
    createAcademicClassService,
    getAllAcademicClassesService,
    getAcademicClassByIdService,
    updateAcademicClassService,
    deleteAcademicClassService,
} from "../services/academicClassService.js";


export const createAcademicClassController = async (req, res, next) => {
    try {
        const academicClass = await createAcademicClassService(req.body);

        res.status(201).json({
            success: true,
            message: "Academic class created successfully.",
            data: academicClass,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllAcademicClassesController = async (req, res, next) => {
    try {
        const academicClasses = await getAllAcademicClassesService();

        res.status(200).json({
            success: true,
            data: academicClasses,
        });
    } catch (error) {
        next(error);
    }
};

export const getAcademicClassByIdController = async (req, res, next) => {
    try {
        const academicClass = await getAcademicClassByIdService(req.params.id);

        res.status(200).json({
            success: true,
            data: academicClass,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAcademicClassController = async (req, res, next) => {
    try {
        const academicClass = await updateAcademicClassService(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Academic class updated successfully.",
            data: academicClass,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAcademicClassController = async (req, res, next) => {
    try {
        const academicClass = await deleteAcademicClassService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Academic class deactivated successfully.",
            data: academicClass,
        });
    } catch (error) {
        next(error);
    }
};




export const getAcademicClasses = async (req, res) => {
    try {

        const classes = await getAcademicClassesService();

        return res.status(200).json({
            success: true,
            data: classes,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};