import Class from "../models/Class.js";

export const createClassService = async (classData) => {

    // Validate capacity
    if (classData.capacity < 1) {
        throw new Error("Class capacity must be greater than zero.");
    }

    // Check duplicate name
    const existingName = await Class.findOne({
        name: classData.name,
    });

    if (existingName) {
        throw new Error("Class name already exists.");
    }

    // Check duplicate code
    const existingCode = await Class.findOne({
        code: classData.code.toUpperCase(),
    });

    if (existingCode) {
        throw new Error("Class code already exists.");
    }

    // Check duplicate level
    const existingLevel = await Class.findOne({
        level: classData.level,
    });

    if (existingLevel) {
        throw new Error("Class level already exists.");
    }

    return await Class.create({
        ...classData,
        code: classData.code.toUpperCase(),
    });
};