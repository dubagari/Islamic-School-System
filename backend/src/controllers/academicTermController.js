import {
    createAcademicTermService,
    getAcademicTermsService,
    getAcademicTermByIdService,
    updateAcademicTermService,
    deleteAcademicTermService,
} from "../services/academicTermService.js";


// ======================================================
// Create Academic Term
// ======================================================

export const createAcademicTermController = async (
    req,
    res,
    next
) => {

    try {

        const academicTerm =
            await createAcademicTermService(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "Academic term created successfully.",

            data: academicTerm,

        });


    } catch (error) {

        next(error);

    }

};



// ======================================================
// Get All Academic Terms
// ======================================================

export const getAcademicTermsController = async (
    req,
    res,
    next
) => {

    try {

        const academicTerms =
            await getAcademicTermsService();


        return res.status(200).json({

            success: true,

            data: academicTerms,

        });


    } catch (error) {

        next(error);

    }

};



// ======================================================
// Get Academic Term By ID
// ======================================================

export const getAcademicTermByIdController = async (
    req,
    res,
    next
) => {

    try {

        const academicTerm =
            await getAcademicTermByIdService(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            data: academicTerm,

        });


    } catch (error) {

        next(error);

    }

};



// ======================================================
// Update Academic Term
// ======================================================

export const updateAcademicTermController = async (
    req,
    res,
    next
) => {

    try {

        const academicTerm =
            await updateAcademicTermService(
                req.params.id,
                req.body
            );


        return res.status(200).json({

            success: true,

            message:
                "Academic term updated successfully.",

            data: academicTerm,

        });


    } catch (error) {

        next(error);

    }

};



// ======================================================
// Delete Academic Term
// ======================================================

export const deleteAcademicTermController = async (
    req,
    res,
    next
) => {

    try {

        const academicTerm =
            await deleteAcademicTermService(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            message:
                "Academic term deleted successfully.",

            data: academicTerm,

        });


    } catch (error) {

        next(error);

    }

};