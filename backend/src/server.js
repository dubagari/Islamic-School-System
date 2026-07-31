import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();
connectDB();

const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Test Route
app.get("/", (req, res) => {
    res.send("Islamic School API is running...");
});


// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});