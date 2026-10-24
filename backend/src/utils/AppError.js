// ======================================================
// Application Error
// ======================================================

export default class AppError extends Error {
    constructor(message, statusCode = 500, errors = null) {
        super(message);

        this.name = "AppError";
        this.statusCode = statusCode;

        if (errors) {
            this.errors = errors;
        }

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export const badRequest = (message, errors = null) =>
    new AppError(message, 400, errors);

export const unauthorized = (message = "Not authorized.") =>
    new AppError(message, 401);

export const forbidden = (message = "You do not have permission to perform this action.") =>
    new AppError(message, 403);

export const notFound = (message = "Resource not found.") =>
    new AppError(message, 404);

export const conflict = (message, errors = null) =>
    new AppError(message, 409, errors);

export const unprocessable = (message, errors = null) =>
    new AppError(message, 422, errors);
