import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";

import app from "./app.js";
import connectDB from "./config/db.js";
import seedAdmin from "./seeds/adminSeeder.js";

dotenv.config();

// ==========================================
// Database Connection
// ==========================================

connectDB();
seedAdmin();

// ==========================================
// Server
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server is running on port ${PORT}`
    );

});