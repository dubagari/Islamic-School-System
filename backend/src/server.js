import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import dns from "node:dns";




import admissionRoutes from "./routes/admissionRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import termRoutes from "./routes/termRoutes.js";
import academicClassRoutes from "./routes/academicClassRoutes.js";
import academicSectionRoutes from "./routes/academicSectionRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import classSubjectRoutes from "./routes/classSubjectRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";

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
app.use("/api/v1/admissions", admissionRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/password", passwordRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/terms", termRoutes);
app.use("/api/v1/academic-classes", academicClassRoutes);
app.use("/api/v1/academic-sections", academicSectionRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/class-subjects", classSubjectRoutes);
app.use("/api/v1/teachers", teacherRoutes);



// Server
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});