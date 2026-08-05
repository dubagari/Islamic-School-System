import {
    createTeacherService,
    getAllTeachersService,
    getTeacherByIdService,
    updateTeacherService,
    deleteTeacherService,
} from "../services/teacherService.js";


// Create Teacher

export const createTeacher = async (req, res) => {
    try {

        const result = await createTeacherService(req.body);

res.status(201).json({
    success: true,
    message: "Teacher created successfully.",
    loginCredentials: result.loginCredentials,
    data: result.teacher,
});

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};


// Get All Teachers

export const getAllTeachers = async (req, res) => {
    try {

        const teachers = await getAllTeachersService();

        res.status(200).json({
            success: true,
            data: teachers,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// Get Teacher By ID

export const getTeacherById = async (req, res) => {
    try {

        const teacher = await getTeacherByIdService(req.params.id);

        res.status(200).json({
            success: true,
            data: teacher,
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message,
        });

    }
};


// Update Teacher

export const updateTeacher = async (req, res) => {
    try {

        const teacher = await updateTeacherService(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Teacher updated successfully.",
            data: teacher,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};

// Delete Teacher

export const deleteTeacher = async (req, res) => {
    try {

        await deleteTeacherService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Teacher deleted successfully.",
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message,
        });

    }
};