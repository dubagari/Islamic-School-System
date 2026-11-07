import "dotenv/config";

import assert from "node:assert/strict";
import dns from "node:dns";
import { once } from "node:events";
import { test } from "node:test";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const databaseName = (uri) => {
    const withoutQuery = uri.split("?")[0];
    return withoutQuery.slice(withoutQuery.lastIndexOf("/") + 1);
};

const deriveSmokeUri = (uri) => {
    const parsed = new URL(uri);
    const sourceName = parsed.pathname.replace(/^\//, "") || "cbt";
    parsed.pathname = `/${sourceName}_cbt_smoke`;
    return parsed.toString();
};

const TEST_DB_URI =
    process.env.CBT_SMOKE_MONGO_URI ||
    (process.env.MONGO_URI
        ? deriveSmokeUri(process.env.MONGO_URI)
        : "mongodb://127.0.0.1:27017/darul_ulum_cbt_smoke");
const TEST_PASSWORD = "CbtSmoke!234";

const createFixture = async (models) => {
    const {
        AcademicClass,
        AcademicLevel,
        AcademicSection,
        AcademicSemester,
        AcademicSession,
        AdmissionApplication,
        Assessment,
        ClassSubject,
        Parent,
        Student,
        StudentEnrollment,
        Subject,
        Teacher,
        TeacherAssignment,
        User,
    } = models;

    const suffix = `${Date.now()}${process.pid}`.slice(-12);
    const password = await bcrypt.hash(TEST_PASSWORD, 4);

    const section = await AcademicSection.create({
        name: `CBT Smoke Section ${suffix}`,
        code: `SMK${suffix}`.toUpperCase(),
    });

    const level = await AcademicLevel.create({
        name: `CBT Smoke Level ${suffix}`,
        levelNumber: 1,
        section: section._id,
    });

    const academicClass = await AcademicClass.create({
        name: `CBT Smoke Class ${suffix}`,
        academicLevel: level._id,
        capacity: 30,
    });

    const academicSession = await AcademicSession.create({
        name: `CBT Smoke Session ${suffix}`,
        startDate: new Date(Date.now() - 30 * 86400000),
        endDate: new Date(Date.now() + 30 * 86400000),
        isCurrent: true,
    });

    const academicSemester = await AcademicSemester.create({
        name: "First Semester",
        academicSession: academicSession._id,
        startDate: new Date(Date.now() - 30 * 86400000),
        endDate: new Date(Date.now() + 30 * 86400000),
        isCurrent: true,
    });

    const subject = await Subject.create({
        name: `CBT Smoke Subject ${suffix}`,
        prefix: `SMK${suffix}`.toUpperCase(),
        section: section._id,
    });

    const classSubject = await ClassSubject.create({
        academicClass: academicClass._id,
        subject: subject._id,
        academicSemester: academicSemester._id,
        courseCode: `CBT${suffix}`.toUpperCase(),
    });

    const userPayload = (role, label = role) => ({
        fullName: `CBT Smoke ${label}`,
        username: `cbt_${label}_${suffix}`,
        email: `cbt_${label}_${suffix}@example.test`,
        password,
        role,
        mustChangePassword: false,
        isActive: true,
    });

    const admin = await User.create(userPayload("admin"));
    const teacherUser = await User.create(userPayload("teacher"));
    const studentUser = await User.create(userPayload("student"));
    const parentUser = await User.create(userPayload("parent"));
    const outsiderParentUser = await User.create(
        userPayload("parent", "outsider_parent")
    );
    const unassignedTeacherUser = await User.create(
        userPayload("teacher", "unassigned_teacher")
    );

    const teacher = await Teacher.create({
        teacherNumber: `T-${suffix}`.toUpperCase(),
        firstName: "CBT",
        lastName: "Teacher",
        gender: "Male",
        status: "Active",
        employmentType: "Full Time",
        user: teacherUser._id,
        isActive: true,
    });

    await Teacher.create({
        teacherNumber: `U-${suffix}`.toUpperCase(),
        firstName: "Unassigned",
        lastName: "Teacher",
        gender: "Female",
        status: "Active",
        employmentType: "Full Time",
        user: unassignedTeacherUser._id,
        isActive: true,
    });

    teacherUser.teacher = teacher._id;
    await teacherUser.save();

    academicClass.classTeacher = teacherUser._id;
    await academicClass.save();

    const applicationNumber = `APP-${suffix}`;
    const registrationNumber = `REG-${suffix}`;

    const admission = await AdmissionApplication.create({
        firstName: "CBT",
        lastName: "Student",
        gender: "Male",
        dateOfBirth: new Date("2010-01-01"),
        phone: "08000000000",
        address: "CBT smoke test address",
        parentName: "CBT Parent",
        parentPhone: "08000000001",
        relationship: "Father",
        currentLevel: "JSS1",
        applicationNumber,
        registrationNumber,
        status: "Approved",
        paymentStatus: "Paid",
        paymentAmount: 1000,
        paidAt: new Date(),
    });

    const student = await Student.create({
        user: studentUser._id,
        admissionApplication: admission._id,
        applicationNumber,
        registrationNumber,
        firstName: "CBT",
        lastName: "Student",
        gender: "Male",
        dateOfBirth: new Date("2010-01-01"),
        phone: "08000000000",
        address: "CBT smoke test address",
        parentName: "CBT Parent",
        parentPhone: "08000000001",
        relationship: "Father",
        currentLevel: "JSS1",
        academicClass: academicClass._id,
        status: "Active",
        paymentStatus: "Paid",
        isActive: true,
    });

    studentUser.student = student._id;
    await studentUser.save();

    const parent = await Parent.create({
        user: parentUser._id,
        phone: "08000000001",
        students: [student._id],
        isActive: true,
    });

    parentUser.parent = parent._id;
    await parentUser.save();

    await Parent.create({
        user: outsiderParentUser._id,
        phone: "08000000002",
        students: [],
        isActive: true,
    });

    await StudentEnrollment.create({
        student: student._id,
        academicSession: academicSession._id,
        academicClass: academicClass._id,
        status: "Active",
        isActive: true,
    });

    await TeacherAssignment.create({
        teacher: teacherUser._id,
        classSubject: classSubject._id,
        assignedBy: admin._id,
        isActive: true,
    });

    const assessment = await Assessment.create({
        classSubject: classSubject._id,
        academicSession: academicSession._id,
        academicSemester: academicSemester._id,
        name: `CBT Smoke Assessment ${suffix}`,
        type: "Quiz",
        maxScore: 10,
        weight: 10,
        createdBy: admin._id,
    });

    return {
        admin,
        academicClass,
        academicSemester,
        academicSession,
        assessment,
        classSubject,
        parentUser,
        student,
        studentUser,
        subject,
        suffix,
        teacherUser,
        unassignedTeacherUser,
        outsiderParentUser,
    };
};

test("CBT end-to-end role smoke test", async (t) => {
    const dbName = databaseName(TEST_DB_URI);

    assert.match(
        dbName,
        /smoke/i,
        `Refusing to run against database "${dbName}". The test database name must contain "smoke".`
    );

    process.env.NODE_ENV = "test";
    process.env.MONGO_URI = TEST_DB_URI;
    process.env.JWT_EXPIRES_IN = "1h";

    if (
        !process.env.JWT_SECRET ||
        process.env.JWT_SECRET.length < 32
    ) {
        process.env.JWT_SECRET =
            "cbt-smoke-test-secret-at-least-32-characters";
    }

    const { default: app } = await import("../src/app.js");

    const models = {
        AcademicClass: (
            await import("../src/models/AcademicClass.js")
        ).default,
        AcademicLevel: (
            await import("../src/models/AcademicLevel.js")
        ).default,
        AcademicSection: (
            await import("../src/models/AcademicSection.js")
        ).default,
        AcademicSemester: (
            await import("../src/models/AcademicSemester.js")
        ).default,
        AcademicSession: (
            await import("../src/models/AcademicSession.js")
        ).default,
        AdmissionApplication: (
            await import("../src/models/AdmissionApplication.js")
        ).default,
        Assessment: (
            await import("../src/models/Assessment.js")
        ).default,
        AssessmentScore: (
            await import("../src/models/AssessmentScore.js")
        ).default,
        CbtAttempt: (
            await import("../src/models/CbtAttempt.js")
        ).default,
        CbtAttemptAnswer: (
            await import("../src/models/CbtAttemptAnswer.js")
        ).default,
        ClassSubject: (
            await import("../src/models/ClassSubject.js")
        ).default,
        Parent: (await import("../src/models/Parent.js")).default,
        Student: (await import("../src/models/Student.js")).default,
        StudentEnrollment: (
            await import("../src/models/StudentEnrollment.js")
        ).default,
        Subject: (await import("../src/models/Subject.js")).default,
        Teacher: (await import("../src/models/Teacher.js")).default,
        TeacherAssignment: (
            await import("../src/models/TeacherAssignment.js")
        ).default,
        User: (await import("../src/models/User.js")).default,
    };

    await mongoose.connect(TEST_DB_URI, {
        serverSelectionTimeoutMS: 5000,
    });
    await mongoose.connection.dropDatabase();

    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}/api/v2`;

    t.after(async () => {
        await new Promise((resolve, reject) => {
            server.close((error) =>
                error ? reject(error) : resolve()
            );
        });

        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });

    const request = async (
        method,
        path,
        { token, body } = {}
    ) => {
        const response = await fetch(`${baseUrl}${path}`, {
            method,
            headers: {
                Accept: "application/json",
                ...(body === undefined
                    ? {}
                    : { "Content-Type": "application/json" }),
                ...(token
                    ? { Authorization: `Bearer ${token}` }
                    : {}),
            },
            body:
                body === undefined
                    ? undefined
                    : JSON.stringify(body),
        });

        const text = await response.text();
        let payload = null;

        try {
            payload = text ? JSON.parse(text) : null;
        } catch {
            payload = text;
        }

        return {
            status: response.status,
            body: payload,
            text,
        };
    };

    const expectStatus = (response, expected, label) => {
        assert.equal(
            response.status,
            expected,
            `${label}: expected HTTP ${expected}, got ${response.status} (${response.text})`
        );
    };

    const login = async (identifier, role) => {
        const response = await request("POST", "/auth/login", {
            body: {
                identifier,
                password: TEST_PASSWORD,
            },
        });

        expectStatus(response, 200, `login ${role}`);
        assert.equal(response.body.success, true);
        assert.equal(response.body.data.user.role, role);
        assert.ok(response.body.data.token);

        return {
            token: response.body.data.token,
            user: response.body.data.user,
        };
    };

    const fixture = await createFixture(models);
    const sessions = {};

    t.diagnostic(`Using isolated database: ${dbName}`);

    await t.test("roles log in once and tokens remain valid", async () => {
        sessions.admin = await login(
            fixture.admin.username,
            "admin"
        );
        sessions.teacher = await login(
            fixture.teacherUser.username,
            "teacher"
        );
        sessions.student = await login(
            fixture.studentUser.username,
            "student"
        );
        sessions.parent = await login(
            fixture.parentUser.username,
            "parent"
        );
        sessions.outsiderParent = await login(
            fixture.outsiderParentUser.username,
            "parent"
        );
        sessions.unassignedTeacher = await login(
            fixture.unassignedTeacherUser.username,
            "teacher"
        );

        for (const [role, session] of Object.entries(sessions)) {
            const profile = await request(
                "GET",
                "/auth/profile",
                { token: session.token }
            );

            expectStatus(profile, 200, `${role} profile`);
            assert.equal(profile.body.data.username, session.user.username);
        }
    });

    const context = {};
    const getExamQuestions = async () => {
        const response = await request(
            "GET",
            `/cbt/exams/${context.examId}/questions`,
            { token: sessions.teacher.token }
        );

        expectStatus(response, 200, "list exam questions");
        return response.body.data.questions;
    };

    const getAttemptResult = async (attemptId, session) => {
        const response = await request(
            "GET",
            `/cbt/attempts/${attemptId}/result`,
            { token: session.token }
        );

        expectStatus(response, 200, "get attempt result");
        return response.body.data;
    };

    const startAttempt = async (examId) => {
        const response = await request(
            "POST",
            `/cbt/student/exams/${examId}/start`,
            { token: sessions.student.token }
        );

        expectStatus(response, 200, "start attempt");
        return response.body.data;
    };

    const saveAnswers = async (attemptId, answers) => {
        const response = await request(
            "PATCH",
            `/cbt/student/attempts/${attemptId}/answers`,
            {
                token: sessions.student.token,
                body: { answers },
            }
        );

        expectStatus(response, 200, "save answers");
        return response.body.data;
    };

    const submitAttempt = async (attemptId) => {
        const response = await request(
            "POST",
            `/cbt/student/attempts/${attemptId}/submit`,
            { token: sessions.student.token }
        );

        expectStatus(response, 200, "submit attempt");
        return response.body.data;
    };

    await t.test("teacher authors and publishes the exam", async () => {
        const mcQuestion = await request("POST", "/cbt/questions", {
            token: sessions.teacher.token,
            body: {
                subject: fixture.subject._id,
                questionText: "Which is the first pillar of Islam?",
                type: "MultipleChoice",
                options: [
                    { key: "A", text: "Shahadah" },
                    { key: "B", text: "Salah" },
                    { key: "C", text: "Zakah" },
                ],
                correctAnswer: "A",
                explanation: "The Shahadah is the declaration of faith.",
                difficulty: "Easy",
                defaultMarks: 2,
            },
        });

        expectStatus(mcQuestion, 201, "teacher creates MC question");

        const tfQuestion = await request("POST", "/cbt/questions", {
            token: sessions.teacher.token,
            body: {
                subject: fixture.subject._id,
                questionText: "The Quran has 114 surahs.",
                type: "TrueFalse",
                correctAnswer: "true",
                difficulty: "Easy",
                defaultMarks: 3,
            },
        });

        expectStatus(tfQuestion, 201, "teacher creates TrueFalse question");

        const adminQuestion = await request(
            "POST",
            "/cbt/questions",
            {
                token: sessions.admin.token,
                body: {
                    subject: fixture.subject._id,
                    questionText: "Admin-authored smoke question.",
                    type: "TrueFalse",
                    correctAnswer: "false",
                    defaultMarks: 1,
                },
            }
        );

        expectStatus(adminQuestion, 201, "admin creates question");

        context.mcQuestionId = mcQuestion.body.data._id;
        context.tfQuestionId = tfQuestion.body.data._id;

        const exam = await request("POST", "/cbt/exams", {
            token: sessions.teacher.token,
            body: {
                title: `CBT Smoke Exam ${fixture.suffix}`,
                description: "Disposable CBT smoke-test exam.",
                instructions: "Answer all questions.",
                classSubject: fixture.classSubject._id,
                startAt: new Date(Date.now() - 60000).toISOString(),
                endAt: new Date(Date.now() + 3600000).toISOString(),
                durationMinutes: 30,
                passMark: 60,
                maxAttempts: 3,
                shuffleQuestions: true,
                shuffleOptions: true,
                resultVisibility: "AfterPublish",
                linkedAssessment: fixture.assessment._id,
            },
        });

        expectStatus(exam, 201, "teacher creates exam");
        context.examId = exam.body.data._id;

        const attached = await request(
            "POST",
            `/cbt/exams/${context.examId}/questions`,
            {
                token: sessions.teacher.token,
                body: {
                    questions: [
                        {
                            question: context.mcQuestionId,
                            marks: 2,
                        },
                        {
                            question: context.tfQuestionId,
                            marks: 3,
                        },
                    ],
                },
            }
        );

        expectStatus(attached, 200, "attach exam questions");
        assert.equal(attached.body.data.length, 2);

        const examQuestions = await getExamQuestions();
        context.mcExamQuestionId = examQuestions.find(
            (question) =>
                question.questionText ===
                "Which is the first pillar of Islam?"
        )._id;
        context.tfExamQuestionId = examQuestions.find(
            (question) =>
                question.questionText ===
                "The Quran has 114 surahs."
        )._id;

        const published = await request(
            "POST",
            `/cbt/exams/${context.examId}/publish`,
            {
                token: sessions.teacher.token,
                body: { isPublished: true },
            }
        );

        expectStatus(published, 200, "publish exam");
        assert.equal(published.body.data.isPublished, true);

        const detail = await request(
            "GET",
            `/cbt/exams/${context.examId}`,
            { token: sessions.teacher.token }
        );

        expectStatus(detail, 200, "exam detail");
        assert.equal(detail.body.data.totalMarks, 5);
        assert.equal(
            detail.body.data.academicSemester._id,
            fixture.academicSemester._id.toString()
        );
        assert.equal(
            detail.body.data.academicSession._id,
            fixture.academicSession._id.toString()
        );
    });

    await t.test("student starts, resumes, saves, and submits", async () => {
        const exams = await request(
            "GET",
            "/cbt/student/exams?status=available",
            { token: sessions.student.token }
        );

        expectStatus(exams, 200, "student exam list");
        const listed = exams.body.data.find(
            (exam) => exam._id === context.examId
        );

        assert.ok(listed, "published exam should be listed");
        assert.equal(listed.status, "Available");
        assert.equal(listed.attemptsUsed, 0);
        assert.equal(listed.totalMarks, 5);

        const started = await startAttempt(context.examId);
        context.attempt1Id = started.attempt._id;

        assert.equal(started.attempt.status, "InProgress");
        assert.equal(started.attempt.attemptNumber, 1);
        assert.equal(started.questions.length, 2);
        assert.ok(started.serverTime);

        const resumed = await startAttempt(context.examId);
        assert.equal(resumed.attempt._id, context.attempt1Id);
        assert.equal(resumed.questions.length, 2);

        const saved = await saveAnswers(context.attempt1Id, [
            {
                question: context.mcExamQuestionId,
                selectedAnswer: "A",
            },
            {
                question: context.tfExamQuestionId,
                selectedAnswer: "false",
            },
        ]);

        assert.equal(saved.saved, 2);

        const attempt = await request(
            "GET",
            `/cbt/student/attempts/${context.attempt1Id}`,
            { token: sessions.student.token }
        );

        expectStatus(attempt, 200, "resume attempt");
        const mcAnswer = attempt.body.data.questions.find(
            (question) => question._id === context.mcExamQuestionId
        );
        const tfAnswer = attempt.body.data.questions.find(
            (question) => question._id === context.tfExamQuestionId
        );

        assert.equal(mcAnswer.selectedAnswer, "A");
        assert.equal(tfAnswer.selectedAnswer, "false");

        const submitted = await submitAttempt(context.attempt1Id);
        assert.equal(submitted.resultVisible, false);
        assert.equal(submitted.attempt.score, undefined);

        const adminResult = await getAttemptResult(
            context.attempt1Id,
            sessions.admin
        );

        assert.equal(adminResult.attempt.score, 2);
        assert.equal(adminResult.attempt.percentage, 40);
        assert.equal(adminResult.attempt.passed, false);
        assert.equal(adminResult.attempt.linkedScoreStatus, "Applied");

        const parentResult = await getAttemptResult(
            context.attempt1Id,
            sessions.parent
        );

        assert.equal(parentResult.resultVisible, false);
        assert.equal(parentResult.attempt.score, undefined);

        const linkedScore = await models.AssessmentScore.findOne({
            assessment: fixture.assessment._id,
            student: fixture.student._id,
        });

        assert.ok(linkedScore, "linked assessment score should exist");
        assert.equal(linkedScore.source, "CBT");
        assert.equal(linkedScore.score, 4);
        context.linkedScoreId = linkedScore._id;
    });

    await t.test("structural edits are blocked after an attempt", async () => {
        const remove = await request(
            "DELETE",
            `/cbt/exams/${context.examId}/questions/${context.mcExamQuestionId}`,
            { token: sessions.teacher.token }
        );

        expectStatus(remove, 409, "remove attached question after attempt");

        const updateMarks = await request(
            "PATCH",
            `/cbt/exams/${context.examId}/questions/${context.mcExamQuestionId}`,
            {
                token: sessions.teacher.token,
                body: { marks: 5 },
            }
        );

        expectStatus(updateMarks, 409, "update marks after attempt");
    });

    await t.test("retakes update CBT scores and protect manual scores", async () => {
        const second = await startAttempt(context.examId);
        assert.equal(second.attempt.attemptNumber, 2);
        context.attempt2Id = second.attempt._id;

        await saveAnswers(context.attempt2Id, [
            {
                question: context.mcExamQuestionId,
                selectedAnswer: "A",
            },
            {
                question: context.tfExamQuestionId,
                selectedAnswer: "true",
            },
        ]);

        await submitAttempt(context.attempt2Id);

        const secondResult = await getAttemptResult(
            context.attempt2Id,
            sessions.admin
        );

        assert.equal(secondResult.attempt.score, 5);
        assert.equal(secondResult.attempt.percentage, 100);
        assert.equal(secondResult.attempt.passed, true);
        assert.equal(secondResult.attempt.linkedScoreStatus, "Updated");

        let linkedScore = await models.AssessmentScore.findById(
            context.linkedScoreId
        );

        assert.equal(linkedScore.source, "CBT");
        assert.equal(linkedScore.score, 10);

        await models.AssessmentScore.updateOne(
            { _id: context.linkedScoreId },
            {
                $set: {
                    source: "Manual",
                    score: 7,
                    remarks: "Manual score entered by teacher",
                    cbtExam: null,
                    cbtAttempt: null,
                    recordedBy: fixture.admin._id,
                },
            }
        );

        const third = await startAttempt(context.examId);
        assert.equal(third.attempt.attemptNumber, 3);
        context.attempt3Id = third.attempt._id;

        await saveAnswers(context.attempt3Id, [
            {
                question: context.mcExamQuestionId,
                selectedAnswer: "A",
            },
            {
                question: context.tfExamQuestionId,
                selectedAnswer: "true",
            },
        ]);

        await submitAttempt(context.attempt3Id);

        const thirdResult = await getAttemptResult(
            context.attempt3Id,
            sessions.admin
        );

        assert.equal(thirdResult.attempt.linkedScoreStatus, "SkippedManualScore");

        linkedScore = await models.AssessmentScore.findById(
            context.linkedScoreId
        );

        assert.equal(linkedScore.source, "Manual");
        assert.equal(linkedScore.score, 7);
    });

    await t.test("published results are visible to student and parent", async () => {
        const publish = await request(
            "POST",
            `/cbt/exams/${context.examId}/results/publish`,
            {
                token: sessions.teacher.token,
                body: { isPublished: true },
            }
        );

        expectStatus(publish, 200, "publish results");
        assert.equal(publish.body.data.resultsPublished, true);

        const studentResult = await getAttemptResult(
            context.attempt2Id,
            sessions.student
        );

        assert.equal(studentResult.resultVisible, true);
        assert.equal(studentResult.attempt.score, 5);
        assert.equal(studentResult.attempt.percentage, 100);

        const parentResult = await getAttemptResult(
            context.attempt2Id,
            sessions.parent
        );

        assert.equal(parentResult.resultVisible, true);
        assert.equal(parentResult.attempt.score, 5);

        const attempts = await request(
            "GET",
            `/cbt/students/${fixture.student._id}/attempts`,
            { token: sessions.parent.token }
        );

        expectStatus(attempts, 200, "parent lists child attempts");
        assert.equal(attempts.body.data.length, 3);

        const exams = await request(
            "GET",
            "/cbt/student/exams",
            { token: sessions.student.token }
        );

        expectStatus(exams, 200, "student exam list after attempts");
        const listed = exams.body.data.find(
            (exam) => exam._id === context.examId
        );

        assert.equal(listed.status, "Completed");
        assert.equal(listed.attemptsUsed, 3);

        const statistics = await request(
            "GET",
            `/cbt/exams/${context.examId}/statistics`,
            { token: sessions.teacher.token }
        );

        expectStatus(statistics, 200, "exam statistics");
        assert.equal(statistics.body.data.attempts, 3);
        assert.equal(statistics.body.data.submitted, 3);
        assert.equal(statistics.body.data.average, 80);
        assert.equal(statistics.body.data.highest, 100);
        assert.equal(statistics.body.data.lowest, 40);
        assert.equal(statistics.body.data.passRate, 66.67);
    });

    await t.test("expired attempts auto-submit and reject saves", async () => {
        const timerExam = await request("POST", "/cbt/exams", {
            token: sessions.teacher.token,
            body: {
                title: `CBT Smoke Timer Exam ${fixture.suffix}`,
                classSubject: fixture.classSubject._id,
                startAt: new Date(Date.now() - 60000).toISOString(),
                endAt: new Date(Date.now() + 3600000).toISOString(),
                durationMinutes: 1,
                passMark: 50,
                maxAttempts: 1,
                resultVisibility: "Immediate",
            },
        });

        expectStatus(timerExam, 201, "create timer exam");
        const timerExamId = timerExam.body.data._id;

        const attached = await request(
            "POST",
            `/cbt/exams/${timerExamId}/questions`,
            {
                token: sessions.teacher.token,
                body: {
                    questions: [
                        {
                            question: context.mcQuestionId,
                            marks: 2,
                        },
                    ],
                },
            }
        );

        expectStatus(attached, 200, "attach timer exam question");

        const published = await request(
            "POST",
            `/cbt/exams/${timerExamId}/publish`,
            {
                token: sessions.teacher.token,
                body: { isPublished: true },
            }
        );

        expectStatus(published, 200, "publish timer exam");

        const started = await startAttempt(timerExamId);
        const timerAttemptId = started.attempt._id;

        await models.CbtAttempt.updateOne(
            { _id: timerAttemptId },
            { $set: { expiresAt: new Date(Date.now() - 1000) } }
        );

        const lateSave = await request(
            "PATCH",
            `/cbt/student/attempts/${timerAttemptId}/answers`,
            {
                token: sessions.student.token,
                body: {
                    answers: [
                        {
                            question: started.questions[0]._id,
                            selectedAnswer: "A",
                        },
                    ],
                },
            }
        );

        expectStatus(lateSave, 400, "save after expiry");

        const expiredAttempt = await request(
            "GET",
            `/cbt/student/attempts/${timerAttemptId}`,
            { token: sessions.student.token }
        );

        expectStatus(expiredAttempt, 200, "resume expired attempt");
        assert.equal(expiredAttempt.body.data.attempt.status, "Submitted");
        assert.equal(expiredAttempt.body.data.attempt.autoSubmitted, true);

        const result = await getAttemptResult(
            timerAttemptId,
            sessions.student
        );

        assert.equal(result.resultVisible, true);
        assert.equal(result.attempt.score, 0);
    });

    await t.test("admin void clears attempt data and frees a slot", async () => {
        const voided = await request(
            "PATCH",
            `/cbt/attempts/${context.attempt3Id}/void`,
            { token: sessions.admin.token }
        );

        expectStatus(voided, 200, "void attempt");
        assert.equal(voided.body.data.status, "Voided");

        const answers = await models.CbtAttemptAnswer.countDocuments({
            attempt: context.attempt3Id,
        });

        assert.equal(answers, 0);

        const manualScore = await models.AssessmentScore.findById(
            context.linkedScoreId
        );

        assert.equal(manualScore.source, "Manual");
        assert.equal(manualScore.score, 7);

        const exams = await request(
            "GET",
            "/cbt/student/exams",
            { token: sessions.student.token }
        );

        expectStatus(exams, 200, "student exam list after void");
        const listed = exams.body.data.find(
            (exam) => exam._id === context.examId
        );

        assert.equal(listed.attemptsUsed, 2);
        assert.equal(listed.status, "Available");
    });

    await t.test("role access controls are enforced", async () => {
        const studentAuthoring = await request(
            "POST",
            "/cbt/questions",
            {
                token: sessions.student.token,
                body: {
                    subject: fixture.subject._id,
                    questionText: "Student should not create this.",
                    type: "TrueFalse",
                    correctAnswer: "true",
                },
            }
        );

        expectStatus(studentAuthoring, 403, "student cannot author questions");

        const parentAuthoring = await request("POST", "/cbt/exams", {
            token: sessions.parent.token,
            body: {
                title: "Parent should not create this",
                classSubject: fixture.classSubject._id,
                startAt: new Date(Date.now() - 60000).toISOString(),
                endAt: new Date(Date.now() + 3600000).toISOString(),
                durationMinutes: 30,
            },
        });

        expectStatus(parentAuthoring, 403, "parent cannot author exams");

        const outsiderAttempts = await request(
            "GET",
            `/cbt/students/${fixture.student._id}/attempts`,
            { token: sessions.outsiderParent.token }
        );

        expectStatus(outsiderAttempts, 403, "unrelated parent denied");

        const unassignedExam = await request("POST", "/cbt/exams", {
            token: sessions.unassignedTeacher.token,
            body: {
                title: "Unassigned teacher should not create this",
                classSubject: fixture.classSubject._id,
                startAt: new Date(Date.now() - 60000).toISOString(),
                endAt: new Date(Date.now() + 3600000).toISOString(),
                durationMinutes: 30,
            },
        });

        expectStatus(unassignedExam, 403, "unassigned teacher denied");

        const unassignedQuestion = await request(
            "POST",
            "/cbt/questions",
            {
                token: sessions.unassignedTeacher.token,
                body: {
                    subject: fixture.subject._id,
                    questionText: "Unassigned teacher question.",
                    type: "TrueFalse",
                    correctAnswer: "true",
                },
            }
        );

        expectStatus(
            unassignedQuestion,
            403,
            "unassigned teacher cannot author questions"
        );
    });
});
