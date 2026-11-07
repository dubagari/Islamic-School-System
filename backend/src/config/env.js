// ======================================================
// Environment Validation
// ======================================================

const requiredVariables = [
    "MONGO_URI",
    "JWT_SECRET",
];

export const validateEnv = () => {
    const missing = requiredVariables.filter(
        (name) => !process.env[name]
    );

    if (process.env.NODE_ENV === "production") {
        const cloudinaryVariables = [
            "CLOUDINARY_CLOUD_NAME",
            "CLOUDINARY_API_KEY",
            "CLOUDINARY_API_SECRET",
        ];

        missing.push(
            ...cloudinaryVariables.filter(
                (name) => !process.env[name]
            )
        );
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}. ` +
            "Copy .env.example to .env and fill in the values."
        );
    }

    if (process.env.NODE_ENV === "production") {
        if (process.env.JWT_SECRET.length < 32) {
            throw new Error(
                "JWT_SECRET must be at least 32 characters in production."
            );
        }
    }
};

export const env = {
    get nodeEnv() {
        return process.env.NODE_ENV || "development";
    },

    get isProduction() {
        return this.nodeEnv === "production";
    },

    get port() {
        return Number(process.env.PORT) || 5000;
    },

    get jwtExpiresIn() {
        return process.env.JWT_EXPIRES_IN || "1d";
    },

    get corsOrigins() {
        return (process.env.CORS_ORIGINS || "")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean);
    },

    get paystackSecretKey() {
        return process.env.PAYSTACK_SECRET_KEY || "";
    },

    get paystackCallbackUrl() {
        return (process.env.PAYSTACK_CALLBACK_URL || "").replace(/\/+$/, "");
    },

    get paystackFeeCallbackUrl() {
        return (process.env.PAYSTACK_FEE_CALLBACK_URL || "").replace(/\/+$/, "");
    },

    get paystackPublicFeeCallbackUrl() {
        return (process.env.PAYSTACK_PUBLIC_FEE_CALLBACK_URL || "").replace(
            /\/+$/,
            ""
        );
    },

    get portalPublicUrl() {
        return (process.env.PORTAL_PUBLIC_URL || "").replace(/\/+$/, "");
    },

    get cloudinaryFolder() {
        return (
            process.env.CLOUDINARY_FOLDER ||
            "darul-ulum/admissions"
        );
    },
};
