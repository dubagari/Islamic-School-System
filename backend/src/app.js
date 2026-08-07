import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";

import errorMiddleware from "./middleware/errorMiddleware.js";


const app = express();

// ==========================================
// Middlewares
// ==========================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ==========================================
// Routes
// ==========================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Darul Ulum Management System API is running.",
    });
});

app.use("/api/v2/auth", authRoutes);

// ==========================================
// Global Error Handler
// ==========================================

app.use(errorMiddleware);

export default app;