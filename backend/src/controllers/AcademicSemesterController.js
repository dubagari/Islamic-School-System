import {
    createAcademicSemesterService,
    getAcademicSemestersService,
    getAcademicSemesterByIdService,
    updateAcademicSemesterService,  
    deleteAcademicSemesterService,
} from "../services/academicSemesterService.js";


// ======================================================
// Create Academic Semester
// ======================================================

export const createAcademicSemesterController = async (
    req,
    res,
    next
) => {

    try {

        const academicSemester =
            await createAcademicSemesterService(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "Academic semester created successfully.",

            data: academicSemester,

        });


    } catch (error) {

        next(error);

    }

};



// ======================================================
// Get All Academic Semesters
// ======================================================

export const getAcademicSemestersController = async (
    req,
    res,
    next
) => {

    try {

        const academicSemesters =
            await getAcademicSemestersService();


        return res.status(200).json({

            success: true,

            data: academicSemesters,

        });


    } catch (error) {

        next(error);

    }

};



// ======================================================
// Get Academic Semester By ID
// ======================================================

export const getAcademicSemesterByIdController = async (
    req,
    res,
    next
) => {

    try {

        const academicSemester =
            await getAcademicSemesterByIdService(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            data: academicSemester,

        });


    } catch (error) {

        next(error);

    }

};



// ======================================================
// Update Academic Semester
// ======================================================

export const updateAcademicSemesterController = async (
    req,
    res,
    next
) => {

    try {

        const academicSemester =
            await updateAcademicSemesterService(
                req.params.id,
                req.body
            );


        return res.status(200).json({

            success: true,

            message:
                "Academic semester updated successfully.",

            data: academicSemester,

        });


    } catch (error) {

        next(error);

    }

};



// ======================================================
// Delete Academic Semester
// ======================================================

export const deleteAcademicSemesterController = async (
    req,
    res,
    next
) => {

    try {

        const academicSemester =
            await deleteAcademicSemesterService(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            message:
                "Academic semester deleted successfully.",

            data: academicSemester, 

        });


    } catch (error) {

        next(error);

    }

};