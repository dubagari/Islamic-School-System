import Counter from "../models/Counter.js";

export const generateStudentRegistrationNumber = async () => {
    const currentYear = new Date().getFullYear();

    const shortYear = String(currentYear).slice(-2);

    const counter = await Counter.findOneAndUpdate(
        {
            name: "student",
            year: currentYear,
        },
        {
            $inc: { value: 1 },
        },
        
        {
            returnDocument: "after",
            upsert: true
        }
    );

    const sequence = String(counter.value).padStart(4, "0");

    return `${shortYear}/${shortYear}${sequence}`;
};