import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import dns from "node:dns";

import admissionRoutes from "./routes/admissionRoutes.js";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();
connectDB();

const app = express();



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Route
app.get("/", (req, res) => {
  res.send("Darul Ulum Management System API");
});

// Routes
app.use("/api/admissions", admissionRoutes);


// Server
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});