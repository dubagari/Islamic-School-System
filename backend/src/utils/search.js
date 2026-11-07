// ======================================================
// Safe Search Helpers
// ======================================================

export const escapeRegex = (value = "") =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchRegex = (value = "") =>
    new RegExp(escapeRegex(String(value).trim()), "i");

export const buildSearchFilter = (search, fields) => {
    if (!search || fields.length === 0) {
        return {};
    }

    const regex = searchRegex(search);

    return {
        $or: fields.map((field) => ({
            [field]: regex,
        })),
    };
};
