import { ZodError } from "zod";

// ======================================================
// Request Validation Middleware
// ======================================================
//
// Usage:
//   router.post("/", validate(createSchema), controller)
//   router.get("/", validate(listSchema, "query"), controller)
//
// Validated query data is available as req.validatedQuery because
// Express 5 exposes req.query as a getter that cannot be reassigned.
// ======================================================

const formatIssues = (error) =>
    error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
    }));

const validate = (schema, source = "body") => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req[source] ?? {});

            if (source === "query") {
                req.validatedQuery = result;
            } else {
                req[source] = result;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed.",
                    errors: formatIssues(error),
                });
            }

            next(error);
        }
    };
};

export default validate;
