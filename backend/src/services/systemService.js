import mongoose from "mongoose";

import AcademicClass from "../models/AcademicClass.js";
import AcademicSession from "../models/AcademicSession.js";
import AcademicSemester from "../models/AcademicSemester.js";
import AdmissionApplication from "../models/AdmissionApplication.js";
import Announcement from "../models/Announcement.js";
import Assessment from "../models/Assessment.js";
import AssessmentScore from "../models/AssessmentScore.js";
import Attendance from "../models/Attendance.js";
import AuditLog from "../models/AuditLog.js";
import ClassSubject from "../models/ClassSubject.js";
import FeeStructure from "../models/FeeStructure.js";
import Invoice from "../models/Invoice.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Parent from "../models/Parent.js";
import Payment from "../models/Payment.js";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import StudentRecord from "../models/StudentRecord.js";
import Subject from "../models/Subject.js";
import Teacher from "../models/Teacher.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import User from "../models/User.js";
import { badRequest } from "../utils/AppError.js";

// ======================================================
// Helpers
// ======================================================

const DATABASE_STATES = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
};

// ======================================================
// System Information
// ======================================================

export const getSystemInfoService = async () => {
    const counts = await Promise.all([
        User.countDocuments({}),
        Student.countDocuments({}),
        Teacher.countDocuments({}),
        Parent.countDocuments({}),
        AcademicSession.countDocuments({}),
        AcademicSemester.countDocuments({}),
        AcademicClass.countDocuments({}),
        Subject.countDocuments({}),
        ClassSubject.countDocuments({}),
        TeacherAssignment.countDocuments({}),
        StudentEnrollment.countDocuments({}),
        StudentRecord.countDocuments({}),
        AdmissionApplication.countDocuments({}),
        Attendance.countDocuments({}),
        Assessment.countDocuments({}),
        AssessmentScore.countDocuments({}),
        Result.countDocuments({}),
        FeeStructure.countDocuments({}),
        Invoice.countDocuments({}),
        Payment.countDocuments({}),
        Announcement.countDocuments({}),
        Message.countDocuments({}),
        Notification.countDocuments({}),
        AuditLog.countDocuments({}),
    ]);

    const keys = [
        "users",
        "students",
        "teachers",
        "parents",
        "academicSessions",
        "academicSemesters",
        "academicClasses",
        "subjects",
        "classSubjects",
        "teacherAssignments",
        "studentEnrollments",
        "studentRecords",
        "admissionApplications",
        "attendance",
        "assessments",
        "assessmentScores",
        "results",
        "feeStructures",
        "invoices",
        "payments",
        "announcements",
        "messages",
        "notifications",
        "auditLogs",
    ];

    const records = {};

    keys.forEach((key, index) => {
        records[key] = counts[index];
    });

    return {
        application: {
            name: "Darul Ulum Management System API",
            environment:
                process.env.NODE_ENV || "development",
            nodeVersion: process.version,
            mongooseVersion: mongoose.version,
            uptimeSeconds: Math.floor(
                process.uptime()
            ),
            memory: {
                rss: process.memoryUsage().rss,
                heapUsed:
                    process.memoryUsage().heapUsed,
                heapTotal:
                    process.memoryUsage().heapTotal,
            },
        },
        database: {
            state:
                DATABASE_STATES[
                    mongoose.connection.readyState
                ] || "unknown",
            name: mongoose.connection.name,
            host: mongoose.connection.host,
        },
        records,
        generatedAt: new Date(),
    };
};

// ======================================================
// Database Statistics
// ======================================================

export const getDatabaseStatsService = async () => {
    const db = mongoose.connection.db;

    if (!db) {
        throw badRequest(
            "The database connection is not ready."
        );
    }

    const [stats, collections] = await Promise.all([
        db.stats(),
        db.listCollections().toArray(),
    ]);

    const collectionStats = await Promise.all(
        collections
            .sort((a, b) =>
                a.name.localeCompare(b.name)
            )
            .map(async (collection) => {
                try {
                    const count = await db
                        .collection(collection.name)
                        .estimatedDocumentCount();

                    return {
                        name: collection.name,
                        count,
                    };
                } catch (error) {
                    return {
                        name: collection.name,
                        count: null,
                    };
                }
            })
    );

    return {
        database: db.databaseName,
        collections: collectionStats,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        objects: stats.objects,
        avgObjectSize: stats.avgObjectSize,
    };
};

// ======================================================
// Synchronize All Model Indexes
// Admin-only maintenance operation.
// ======================================================

export const syncIndexesService = async () => {
    const results = [];

    for (const modelName of mongoose.modelNames()) {
        try {
            const model = mongoose.model(modelName);

            await model.syncIndexes();

            results.push({
                model: modelName,
                status: "synced",
            });
        } catch (error) {
            results.push({
                model: modelName,
                status: "failed",
                error: error.message,
            });
        }
    }

    return {
        synced: results.filter(
            (result) => result.status === "synced"
        ).length,
        failed: results.filter(
            (result) => result.status === "failed"
        ).length,
        results,
    };
};
