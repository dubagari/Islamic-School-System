import {
    assignSubjectsToClassService,
    getAllClassSubjectsService,
    getClassSubjectsByClassService,
    removeClassSubjectService,
    updateClassSubjectService,


} from "../services/classSubjectService.js";

export const assignSubjectsToClass = async (req, res) => {
    try {

        const assignments = await assignSubjectsToClassService(req.body);

        return res.status(201).json({
            success: true,
            message: "Subjects assigned successfully.",
            data: assignments,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};

export const getAllClassSubjects = async (req, res) => {
    try {

        const assignments = await getAllClassSubjectsService();

        return res.status(200).json({
            success: true,
            data: assignments,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

export const getClassSubjectsByClass = async (req, res) => {
    try {

        const assignments = await getClassSubjectsByClassService(
            req.params.classId
        );

        return res.status(200).json({
            success: true,
            data: assignments,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


export const updateClassSubject = async (req, res) => {
    try {

        const assignment = await updateClassSubjectService(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Assignment updated successfully.",
            data: assignment,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};


export const removeClassSubject = async (req, res) => {

    try {

        await removeClassSubjectService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Subject removed from class.",
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};