import {submitAdmissionApplicationService, getAdmissionsService} from "../services/admissionService.js";


export const submitAdmissionApplication = async (req, res) => {
    try {
        const application = await submitAdmissionApplicationService(req.body);

        res.status(201).json({
            success: true,
            message: "Admission application submitted successfully.",
            data: application,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAdmissions = async (req, res) => {
    try {
        const result = await getAdmissionsService(req.query);
        

        res.status(200).json({
            success: true,
            data: result.admissions,
            pagination: result.pagination,
            filters: result.filters,
            sort: result.sort,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};