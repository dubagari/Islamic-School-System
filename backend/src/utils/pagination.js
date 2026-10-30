// ======================================================
// Pagination Helpers
// ======================================================

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

const toPositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
};

export const getPagination = (query = {}) => {
    const page = toPositiveInteger(query.page, DEFAULT_PAGE);

    const limit = Math.min(
        toPositiveInteger(query.limit, DEFAULT_LIMIT),
        MAX_LIMIT
    );

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

export const buildPagination = (total, page, limit) => {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
};

export const paginatedResult = (data, total, pagination) => ({
    data,
    pagination: buildPagination(total, pagination.page, pagination.limit),
});
