import AdmissionApplication from "../models/AdmissionApplication.js";
import { generateNumber } from "../utils/generateNumber.js";

export const submitAdmissionApplicationService = async (applicationData) => {
    const admissionNumber = await generateNumber("admission", "ADM");

    const newApplication = {
        ...applicationData,
        admissionNumber,
    };

    return await AdmissionApplication.create(newApplication);
};



export const getAdmissionsService = async (query) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Status Filter
    if (query.status && query.status !== "All") {
        filter.status = query.status;
    }

    // Search
    if (query.search) {
        filter.$or = [
            {
                admissionNumber: {
                    $regex: query.search,
                    $options: "i",
                },
            },
            {
                firstName: {
                    $regex: query.search,
                    $options: "i",
                },
            },
            {
                lastName: {
                    $regex: query.search,
                    $options: "i",
                },
            },
        ];
    }

  const admissions = await AdmissionApplication.find(filter)
    .select(
        "admissionNumber firstName middleName lastName currentLevel status parentName phone createdAt"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
        

    const totalRecords = await AdmissionApplication.countDocuments(filter);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
        admissions,
        pagination: {
            currentPage: page,
            totalPages,
            totalRecords,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
        filters: {
            search: query.search || "",
            status: query.status || "All",
        },
        sort: {
            field: "createdAt",
            order: "desc",
        },
    };
};