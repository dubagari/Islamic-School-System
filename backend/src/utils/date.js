// ======================================================
// Date Helpers
// ======================================================

export const toDateOnly = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date.");
    }

    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
        )
    );
};

export const todayUtc = () => {
    const now = new Date();

    return new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        )
    );
};

export const isFutureDate = (value) =>
    toDateOnly(value).getTime() > todayUtc().getTime();
