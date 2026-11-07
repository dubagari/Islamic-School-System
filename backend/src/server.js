import "dotenv/config";

import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import app from "./app.js";
import connectDB from "./config/db.js";
import { env, validateEnv } from "./config/env.js";
import seedAdmin from "./seeds/adminSeeder.js";

// ==========================================
// Validate Environment
// ==========================================

validateEnv();

// ==========================================
// Start Server
// ==========================================

const startServer = async () => {
    await connectDB();

    await seedAdmin();

    const server = app.listen(env.port, () => {
        console.log(
            `Server is running on port ${env.port} (${env.nodeEnv})`
        );
    });

    const shutdown = (signal) => {
        console.log(`Received ${signal}. Shutting down...`);

        server.close(() => {
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
});
