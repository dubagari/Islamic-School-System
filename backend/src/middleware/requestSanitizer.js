// ======================================================
// Request Sanitizer
// ======================================================
//
// Strips MongoDB operator keys ($) and dotted keys from
// request bodies and params to prevent operator injection.
// ======================================================

const sanitizeValue = (value, depth = 0) => {
    if (depth > 10 || value === null || value === undefined) {
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item) => sanitizeValue(item, depth + 1));
        return;
    }

    if (typeof value !== "object") {
        return;
    }

    for (const key of Object.keys(value)) {
        if (key.startsWith("$") || key.includes(".")) {
            delete value[key];
            continue;
        }

        sanitizeValue(value[key], depth + 1);
    }
};

const requestSanitizer = (req, res, next) => {
    sanitizeValue(req.body);
    sanitizeValue(req.params);

    next();
};

export default requestSanitizer;
