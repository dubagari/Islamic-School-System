import Counter from "../models/Counter.js";

// ======================================================
// Generate Student Registration Number
// Format: YY/YY0001
// Example: 26/260001
// ======================================================

export const generateStudentRegistrationNumber = async () => {
    const currentYear = new Date().getFullYear();

    const year = String(currentYear).slice(-2);

    const counter = await Counter.findOneAndUpdate(
        {
            key: `student-registration-${currentYear}`,
        },
        {
            $inc: {
                sequence: 1,
            },
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );

    const sequence =
        String(counter.sequence).padStart(4, "0");

    return `${year}/${year}${sequence}`;
};