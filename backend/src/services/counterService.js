
import Counter from "../models/Counter.js";

// ======================================================
// Generate Sequential Number
// ======================================================

export const generateNumber = async (
    key,
    prefix
) => {
    const counter =
        await Counter.findOneAndUpdate(
            { key },
            {
                $inc: {
                    sequence: 1,
                },
            },
            {
                new: true,
                upsert: true,
            }
        );

    const year =
        new Date().getFullYear();

    const sequence =
        String(counter.sequence)
            .padStart(5, "0");

    return `${prefix}/${year}/${sequence}`;
};

