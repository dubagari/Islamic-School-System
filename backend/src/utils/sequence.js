import Counter from "../models/Counter.js";

// ======================================================
// Generate A Year-Scoped Sequence Number
// Example: INV-2026-0001
// ======================================================

export const generateSequenceNumber = async ({
    key,
    prefix,
    date = new Date(),
    padding = 4,
}) => {
    const year = date.getFullYear();

    const counter = await Counter.findOneAndUpdate(
        {
            key: `${key}-${year}`,
        },
        {
            $inc: {
                sequence: 1,
            },
        },
        {
            returnDocument: "after",
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );

    return `${prefix}-${year}-${String(
        counter.sequence
    ).padStart(padding, "0")}`;
};
