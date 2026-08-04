import Subject from "../models/Subject.js";

export const generateSubjectCode = async (prefix, level) => {

    const codePrefix = `${prefix.toUpperCase()}${level}`;

    const count = await Subject.countDocuments({
        code: {
            $regex: `^${codePrefix}`,
        },
    });

    const sequence = String(count + 1).padStart(2, "0");

    return `${codePrefix}${sequence}`;
};