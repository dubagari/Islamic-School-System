# Darul Ulum Management System — API Reference

> Version: v2
> Base URL: `http://localhost:5000`
> API prefix: `/api/v2`

---

## 1. Conventions

### Response envelope

Successful requests return:

```json
{
  "success": true,
  "message": "Human-readable message.",
  "data": {}
}
```

Paginated endpoints also return:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 82,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Errors return an appropriate HTTP status and:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address."
    }
  ]
}
```

### Authentication

Send the JWT as a bearer token:

```http
Authorization: Bearer <token>
```

Tokens are issued by `POST /api/v2/auth/login`. The token payload contains the
user ID and role. Protected routes enforce role-based authorization.

If a user has `mustChangePassword: true`, only these routes are allowed until
the password is changed:

- `PATCH /api/v2/auth/change-password`
- `GET /api/v2/auth/profile`

All other protected requests return `403` with code `PASSWORD_CHANGE_REQUIRED`.

### Pagination, search, and filters

List endpoints accept:

| Parameter | Description |
| --- | --- |
| `page` | 1-based page number, default `1` |
| `limit` | Page size, default `20`, maximum generally `200` |
| `search` | Case-insensitive text search on the module's supported fields |
| `sort` | Sort field where supported |
| `order` | `asc` or `desc` where supported |

Module-specific filters are documented with each endpoint.

### Validation and safe queries

All request bodies, route parameters, and query strings are validated with Zod.
Validated query values are available to controllers as `req.validatedQuery`.
MongoDB operators are stripped from untrusted request input by the request
sanitizer.

### Rate limiting

Global API requests are rate-limited. Authentication endpoints have a stricter
limiter. A `429` response means the client should retry after the indicated
window.

---

## 2. Health and Root

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Health check with environment and timestamp |
| `GET` | `/` | Public | API name, status, and version |

---

## 3. Authentication

Base path: `/api/v2/auth`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/login` | Public | Log in with username or email |
| `PATCH` | `/change-password` | Authenticated | Change current password |
| `GET` | `/profile` | Authenticated | Get the authenticated user's profile |

### Login

```json
{
  "identifier": "admin",
  "password": "Admin123@"
}
```

`identifier` accepts either a username or an email address.

### Change password

```json
{
  "currentPassword": "OldPassword123@",
  "newPassword": "NewPassword123@"
}
```

Changing the password clears `mustChangePassword`.

---

## 4. Academic Setup

### 4.1 Academic Sections

Base path: `/api/v2/academic-sections` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create a section |
| `GET` | `/` | List sections |
| `GET` | `/:id` | Get one section |
| `PATCH` | `/:id` | Update a section |
| `DELETE` | `/:id` | Delete a section |

Create body:

```json
{
  "name": "Junior Secondary",
  "code": "JSS",
  "description": "Junior secondary section",
  "isActive": true
}
```

### 4.2 Academic Levels

Base path: `/api/v2/academic-levels` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create a level |
| `GET` | `/` | List levels |
| `GET` | `/:id` | Get one level |
| `PATCH` | `/:id` | Update a level |
| `DELETE` | `/:id` | Delete a level |

Create body requires `name`, `levelNumber`, and `section`.

### 4.3 Academic Sessions

Base path: `/api/v2/academic-sessions` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create a session |
| `GET` | `/` | List sessions |
| `GET` | `/:id` | Get one session |
| `PATCH` | `/:id` | Update a session |
| `DELETE` | `/:id` | Delete a session |

Create body requires `name`, `startDate`, and `endDate`. `isCurrent` and
`isActive` are optional. Only one session should be current for new admissions
and default reporting.

### 4.4 Academic Semesters

Base path: `/api/v2/academic-semesters` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create a semester |
| `GET` | `/` | List semesters |
| `GET` | `/:id` | Get one semester |
| `PATCH` | `/:id` | Update a semester |
| `DELETE` | `/:id` | Delete a semester |

Create body:

```json
{
  "name": "First Semester",
  "academicSession": "<sessionId>",
  "startDate": "2026-09-01",
  "endDate": "2027-01-31",
  "isCurrent": true,
  "isActive": true
}
```

`name` is one of `First Semester` or `Second Semester`.

### 4.5 Academic Classes

Base path: `/api/v2/academic-classes` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create a class |
| `GET` | `/` | List classes |
| `GET` | `/level/:academicLevel` | List classes in a level |
| `PATCH` | `/assign-student` | Assign a student to a class |
| `GET` | `/:id` | Get one class |
| `PUT` | `/:id` | Replace class details |
| `DELETE` | `/:id` | Delete a class |

Create body requires `name`, `academicLevel`, and `capacity`. `classTeacher` is
an optional user ID and must reference a teacher user.

Assign-student body:

```json
{
  "studentId": "<studentId>",
  "academicClassId": "<academicClassId>"
}
```

### 4.6 Subjects

Base path: `/api/v2/subjects` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create a subject |
| `GET` | `/` | List subjects |
| `GET` | `/:id` | Get one subject |
| `PATCH` | `/:id` | Update a subject |
| `DELETE` | `/:id` | Delete a subject |

Create body requires `name`, `prefix`, and `section`.

### 4.7 Class Subjects

Base path: `/api/v2/class-subjects` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Assign a subject to a class semester |
| `GET` | `/` | List class subjects |
| `GET` | `/section/:section` | List class subjects in a section |
| `GET` | `/:id` | Get one class subject |
| `PUT` | `/:id` | Update a class subject |
| `DELETE` | `/:id` | Delete a class subject |

Create body:

```json
{
  "academicClass": "<academicClassId>",
  "subject": "<subjectId>",
  "academicSemester": "<academicSemesterId>",
  "description": "Optional description",
  "isActive": true
}
```

A subject cannot be assigned twice to the same class and semester. Course codes
are shared across class arms in the same level and are not globally unique.

### 4.8 Teacher Assignments

Base path: `/api/v2/teacher-assignments`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/my-assignments` | Teacher | Current teacher's assignments |
| `GET` | `/my-classes` | Teacher | Current teacher's classes |
| `POST` | `/` | Admin | Assign a teacher to a class subject |
| `GET` | `/` | Admin | List assignments |
| `GET` | `/teacher/:teacher` | Admin | Assignments for a teacher user |
| `GET` | `/:id` | Admin | Get one assignment |
| `PUT` | `/:id` | Admin | Update an assignment |
| `DELETE` | `/:id` | Admin | Delete an assignment |

Create body:

```json
{
  "teacher": "<teacherUserId>",
  "classSubject": "<classSubjectId>",
  "assignedDate": "2026-09-01",
  "isActive": true
}
```

`teacher` references the teacher's **User** account, not the Teacher profile ID.

---

## 5. Admissions and Student Registration

### 5.1 Admission Applications

Base path: `/api/v2/admission-applications`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/` | Public | Submit an application |
| `GET` | `/number/:applicationNumber?phone=...` | Public | Check an application by number |
| `GET` | `/number/:applicationNumber/pdf?phone=...` | Public | Download the application PDF |
| `GET` | `/` | Admin | List applications |
| `GET` | `/:id` | Admin | Get an application |
| `GET` | `/:id/pdf` | Admin | Download the application PDF |
| `PATCH` | `/:id` | Admin | Update an application |
| `PATCH` | `/:id/approve` | Admin | Approve an application |
| `PATCH` | `/:id/reject` | Admin | Reject an application |

Public lookup and PDF routes require a `phone` query parameter. It must match
the applicant or parent phone number on the application (compared by last 10
digits), otherwise the API returns `404`.

Create body:

```json
{
  "firstName": "Musa",
  "middleName": "Ibrahim",
  "lastName": "Abdullah",
  "gender": "Male",
  "dateOfBirth": "2014-03-12",
  "email": "musa@example.com",
  "phone": "08030000000",
  "address": "Kano, Nigeria",
  "parentName": "Ibrahim Abdullah",
  "parentPhone": "08030000001",
  "parentEmail": "ibrahim@example.com",
  "relationship": "Father",
  "currentLevel": "Primary 5",
  "previousMadrasa": "Optional"
}
```

List filters: `page`, `limit`, `search`, `status`, `paymentStatus`.

Reject body may contain an optional `reason`.

### 5.2 Admission Payments

Base path: `/api/v2/admission-payments` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/cash/:applicationId` | Confirm a cash application payment |
| `POST` | `/paystack/initialize/:applicationId` | Initialize Paystack payment |
| `POST` | `/paystack/verify` | Verify Paystack payment |

Cash body:

```json
{
  "amount": 5000,
  "paymentReference": "CASH-001"
}
```

Paystack initialize body: `amount` and optional `email`.
Paystack verify body: `reference`.

### 5.3 Student Registration

Base path: `/api/v2/student-registration` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/:applicationId` | Register a paid, approved applicant as a student |

Registration creates the student profile, registration number, and student user
account. A registration number cannot be issued before payment confirmation.

### 5.4 Admission Photo Upload

Base path: `/api/v2/uploads`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/photo` | Public | Upload an applicant passport photo |

Send `multipart/form-data` with a single `photo` field (JPG, PNG, or WEBP, max
2MB). In production the file is stored on Cloudinary and the response contains
the secure `photoUrl` to pass to the application create endpoint. In
development, if Cloudinary is not configured, the file is stored locally under
`/uploads/admissions`.

### 5.5 Student Password Reset

Base path: `/api/v2/student-passwords` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/:studentId/reset` | Reset a student's password and require a change |

---

## 6. Students and Teachers

### 6.1 Students

Base path: `/api/v2/students`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/dashboard` | Student | Student dashboard summary |
| `GET` | `/profile` | Student | Current student's profile |
| `GET` | `/` | Admin | List students |
| `GET` | `/:studentId` | Admin, Student | Get a student profile |

Admins can search and filter the student list using the common pagination
parameters. Students can only access their own profile.

### 6.2 Student Enrollments

Base path: `/api/v2/student-enrollments` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Enroll a student in a class and session |
| `GET` | `/` | List enrollments |
| `GET` | `/student/:studentId/current` | Current enrollment |
| `GET` | `/student/:studentId/history` | Enrollment history |
| `GET` | `/student/:studentId` | Enrollments for a student |
| `GET` | `/:enrollmentId` | Get one enrollment |
| `PUT` | `/:enrollmentId` | Update class or status |
| `PUT` | `/:enrollmentId/deactivate` | Deactivate an enrollment |
| `DELETE` | `/:enrollmentId` | Delete an enrollment |

Create body:

```json
{
  "student": "<studentId>",
  "academicSession": "<academicSessionId>",
  "academicClass": "<academicClassId>"
}
```

Enrollment statuses: `Active`, `Completed`, `Transferred`, `Withdrawn`.

### 6.3 Student Records

Base path: `/api/v2/student-records` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create a student record |
| `GET` | `/` | List records |
| `GET` | `/student/:studentId/history` | Record history for a student |
| `GET` | `/:id` | Get one record |
| `PUT` | `/:id` | Update a record |
| `PUT` | `/:id/deactivate` | Deactivate a record |

Record types: `Promotion`, `Transfer`, `Withdrawal`, `Suspension`,
`Graduation`, `Disciplinary`, `General`.

### 6.4 Teachers

Base path: `/api/v2/teachers`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/profile` | Teacher | Current teacher's profile |
| `GET` | `/dashboard` | Teacher | Teacher dashboard |
| `POST` | `/` | Admin | Create a teacher and teacher user account |
| `GET` | `/` | Admin | List teachers |
| `GET` | `/number/:teacherNumber` | Admin | Find a teacher by number |
| `GET` | `/:id` | Admin | Get a teacher |
| `PUT` | `/:id` | Admin | Update a teacher |
| `DELETE` | `/:id` | Admin | Deactivate/delete a teacher |

Create body requires `firstName`, `lastName`, and `gender`. Contact,
qualification, specialization, employment date, and employment type are
optional.

Teacher statuses: `Active`, `Suspended`, `Retired`, `Resigned`, `Terminated`.

---

## 7. Attendance

### 7.1 Student Attendance

Base path: `/api/v2/attendance`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/bulk` | Admin, Teacher | Mark or update a class's daily attendance |
| `GET` | `/class/:academicClass/summary` | Admin, Teacher | Class attendance summary |
| `GET` | `/class/:academicClass` | Admin, Teacher | Class attendance records |
| `GET` | `/student/:studentId` | Admin, Teacher, Student, Parent | Student attendance records |
| `PATCH` | `/:id` | Admin, Teacher | Update one record |
| `DELETE` | `/:id` | Admin | Delete one record |

Bulk mark body:

```json
{
  "academicClass": "<academicClassId>",
  "academicSession": "<academicSessionId>",
  "academicSemester": "<academicSemesterId>",
  "date": "2026-10-23",
  "records": [
    {
      "student": "<studentId>",
      "status": "Present",
      "remarks": ""
    },
    {
      "student": "<studentId2>",
      "status": "Absent",
      "remarks": "Sick"
    }
  ]
}
```

Statuses: `Present`, `Absent`, `Late`, `Excused`.

One record is stored per student, class, and UTC-normalized date. Duplicate
students in the request are rejected, as are future dates. A teacher may mark
attendance for a class they are class teacher of or teach a subject in.

The student/parent attendance response is access-checked. Newly recorded
absences create in-app notifications for the student and linked parents.

### 7.2 Teacher Attendance

Base path: `/api/v2/teacher-attendance`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/bulk` | Admin | Mark teacher attendance |
| `GET` | `/me` | Teacher | Current teacher's attendance |
| `GET` | `/summary` | Admin, Teacher | Attendance summary |
| `GET` | `/` | Admin | List teacher attendance |
| `PATCH` | `/:id` | Admin | Update a record |
| `DELETE` | `/:id` | Admin | Delete a record |

Teacher attendance statuses: `Present`, `Absent`, `Late`, `Excused`, `Leave`.

---

## 8. Assessments and Results

### 8.1 Assessments

Base path: `/api/v2/assessments` — Admin and Teacher.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create an assessment |
| `GET` | `/` | List assessments |
| `POST` | `/:id/scores` | Enter or update scores for students |
| `GET` | `/:id/scores` | List scores for an assessment |
| `PATCH` | `/scores/:scoreId` | Update one score |
| `DELETE` | `/scores/:scoreId` | Delete one score |
| `GET` | `/:id` | Get an assessment |
| `PATCH` | `/:id` | Update an assessment |
| `DELETE` | `/:id` | Delete an assessment and its scores |

Create body:

```json
{
  "classSubject": "<classSubjectId>",
  "name": "First Test",
  "type": "Test",
  "maxScore": 20,
  "weight": 20,
  "date": "2026-10-20",
  "description": "Optional"
}
```

Assessment types: `Quiz`, `Test`, `Assignment`, `Midterm`, `Exam`, `Project`,
`Practical`.

The total weight of active assessments for a class subject and semester cannot
exceed `100`.

Score entry body:

```json
{
  "records": [
    {
      "student": "<studentId>",
      "score": 18,
      "remarks": "Good"
    }
  ]
}
```

A score cannot be negative or greater than the assessment's maximum score.
Teachers can only manage assessments and scores for class subjects they are
assigned to.

### 8.2 Results

Base path: `/api/v2/results`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/compute` | Admin, Teacher | Compute weighted results for a class subject |
| `POST` | `/publish` | Admin | Publish or unpublish results |
| `GET` | `/class/:classSubject` | Admin, Teacher | Results for a class subject |
| `GET` | `/student/:studentId` | Admin, Teacher, Student, Parent | Results for a student |
| `GET` | `/report-card/:studentId` | Admin, Teacher, Student, Parent | Student report card |
| `GET` | `/transcript/:studentId` | Admin, Teacher, Student, Parent | Student transcript |

Compute body:

```json
{
  "classSubject": "<classSubjectId>",
  "academicSemester": "<academicSemesterId>"
}
```

Publish body:

```json
{
  "classSubject": "<classSubjectId>",
  "academicSemester": "<academicSemesterId>",
  "studentIds": ["<studentId>"],
  "isPublished": true
}
```

`studentIds` is optional. Omitting it publishes all computed results for the
class subject. Unpublishing sets `isPublished: false`, clears publisher metadata,
and does not delete the computed results.

Results are upserted by student, class subject, and semester. Recomputing keeps
the existing publication state. Students and parents only see published results.
Publishing sends in-app notifications to affected students and linked parents.

The default grading scale is A–F, with pass at `50`:

| Score | Grade | Points | Remark |
| --- | --- | --- | --- |
| 70–100 | A | 5 | Excellent |
| 60–69 | B | 4 | Very Good |
| 50–59 | C | 3 | Good |
| 45–49 | D | 2 | Fair |
| 40–44 | E | 1 | Pass |
| 0–39 | F | 0 | Fail |

---

## 9. Finance

### 9.1 Fee Structures

Base path: `/api/v2/fee-structures` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create a fee structure |
| `GET` | `/` | List fee structures |
| `PATCH` | `/:id` | Update a fee structure |
| `GET` | `/:id` | Get a fee structure |
| `DELETE` | `/:id` | Delete a fee structure |

Create body:

```json
{
  "name": "First Semester Tuition",
  "feeType": "Tuition",
  "amount": 25000,
  "academicSession": "<sessionId>",
  "academicSemester": "<semesterId>",
  "academicClass": "<classId>",
  "description": "Optional"
}
```

Fee types: `Tuition`, `Registration`, `Exam`, `Books`, `Uniform`, `Transport`,
`Hostel`, `Development`, `Other`.

### 9.2 Invoices

Base path: `/api/v2/invoices`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/generate` | Admin | Generate invoices from fee structures |
| `POST` | `/` | Admin | Create an invoice manually |
| `GET` | `/student/:studentId/summary` | Admin, Student, Parent | Fee summary for a student |
| `GET` | `/` | Admin, Student, Parent | List invoices |
| `GET` | `/:id/payments` | Admin, Student, Parent | Payments for an invoice |
| `GET` | `/:id` | Admin, Student, Parent | Get an invoice |
| `PATCH` | `/:id` | Admin | Update due date or notes |
| `POST` | `/:id/cancel` | Admin | Cancel an invoice |
| `DELETE` | `/:id` | Admin | Delete an unpaid invoice |

Generate body:

```json
{
  "academicSession": "<sessionId>",
  "academicSemester": "<semesterId>",
  "academicClass": "<classId>",
  "studentIds": ["<studentId>"],
  "dueDate": "2026-11-30",
  "notes": "Optional"
}
```

Manual invoice body:

```json
{
  "student": "<studentId>",
  "academicSession": "<sessionId>",
  "academicSemester": "<semesterId>",
  "academicClass": "<classId>",
  "items": [
    {
      "feeStructure": "<feeStructureId>",
      "name": "Tuition",
      "amount": 25000
    }
  ],
  "dueDate": "2026-11-30",
  "notes": "Optional"
}
```

Invoice statuses: `Unpaid`, `Partially Paid`, `Paid`, `Overdue`, `Cancelled`.
Status is recalculated from completed payments.

### 9.3 Payments

Base path: `/api/v2/payments`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/` | Admin | Record a payment |
| `GET` | `/` | Admin, Student, Parent | List payments |
| `GET` | `/:id` | Admin, Student, Parent | Get a payment |
| `POST` | `/:id/reverse` | Admin | Reverse a completed payment |

Create body:

```json
{
  "invoice": "<invoiceId>",
  "amount": 10000,
  "method": "Cash",
  "reference": "BANK-001",
  "paidAt": "2026-10-23",
  "notes": "Optional"
}
```

Payment methods: `Cash`, `Bank Transfer`, `Card`, `Paystack`, `Cheque`, `Other`.

Payments cannot exceed the outstanding balance. Payment statuses are `Completed`
and `Reversed`. Reversing a payment recalculates the invoice. Recording and
reversing payments create in-app notifications for the student and linked
parents.

Invoice and receipt numbers are generated from the `Counter` collection using
`INV-YYYY-####` and `RCPT-YYYY-####` formats.

### 9.4 Finance Reports

Base path: `/api/v2/finance` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/summary` | Totals for billed, collected, outstanding, and status counts |
| `GET` | `/collections` | Collections grouped by day, month, or payment method |
| `GET` | `/outstanding` | Paginated outstanding invoice list |

Common filters: `academicSession`, `academicSemester`, `academicClass`, `from`,
`to`, `groupBy`.

---

## 10. Parent Portal

### 10.1 Parent Administration

Base path: `/api/v2/parents` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/` | Create a parent user and profile |
| `GET` | `/` | List parents |
| `POST` | `/:id/students` | Link students |
| `DELETE` | `/:id/students/:studentId` | Unlink a student |
| `GET` | `/:id` | Get a parent |
| `PATCH` | `/:id` | Update a parent |
| `DELETE` | `/:id` | Deactivate a parent |

Create body:

```json
{
  "fullName": "Ibrahim Abdullah",
  "username": "parent.ibrahim",
  "email": "ibrahim@example.com",
  "password": "Parent123@",
  "phone": "08030000001",
  "address": "Kano",
  "occupation": "Trader",
  "studentIds": ["<studentId>"]
}
```

Link students body:

```json
{
  "studentIds": ["<studentId>", "<studentId2>"]
}
```

### 10.2 Parent Portal

Base path: `/api/v2/parent` — Parent only.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/profile` | Parent profile |
| `GET` | `/children` | Linked children |
| `GET` | `/dashboard` | Parent dashboard summary |
| `GET` | `/children/:studentId` | Child overview |
| `GET` | `/children/:studentId/attendance` | Child attendance |
| `GET` | `/children/:studentId/results` | Published child results |
| `GET` | `/children/:studentId/report-card` | Child report card |
| `GET` | `/children/:studentId/transcript` | Child transcript |
| `GET` | `/children/:studentId/fees` | Child fee summary |
| `GET` | `/children/:studentId/invoices` | Child invoices |
| `GET` | `/children/:studentId/payments` | Child payments |

All child routes verify that the requested student is linked to the
authenticated parent. Students and parents cannot see unpaid/unpublished
academic records.

---

## 11. Communication

### 11.1 Announcements

Base path: `/api/v2/announcements` — Authenticated.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/unread-count` | Authenticated | Unread announcement count |
| `POST` | `/` | Admin | Create/publish an announcement |
| `GET` | `/` | Authenticated | Role-filtered announcement feed |
| `GET` | `/:id` | Authenticated | Get one visible announcement |
| `POST` | `/:id/read` | Authenticated | Mark an announcement read |
| `PATCH` | `/:id` | Admin | Update an announcement |
| `DELETE` | `/:id` | Admin | Delete an announcement |

Create body:

```json
{
  "title": "Resumption Notice",
  "content": "School resumes on Monday.",
  "audience": "all",
  "priority": "Normal",
  "publishAt": "2026-10-20",
  "expiresAt": "2026-11-01",
  "isPublished": true
}
```

Audiences: `all`, `students`, `teachers`, `parents`, `class`. A `class`
announcement requires `academicClass`.

Priorities: `Low`, `Normal`, `High`, `Urgent`.

Publishing broadcasts in-app notifications to the selected audience.

### 11.2 Messages

Base path: `/api/v2/messages` — Authenticated.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/unread-count` | Unread message count |
| `PATCH` | `/read-all` | Mark all inbox messages read |
| `POST` | `/` | Send a direct message |
| `GET` | `/` | List inbox, sent, or all messages |
| `GET` | `/conversation/:userId` | Conversation with a user |
| `PATCH` | `/:id/read` | Mark one received message read |

Send body:

```json
{
  "recipient": "<userId>",
  "subject": "Optional subject",
  "body": "Message body"
}
```

List query: `box=inbox|sent|all`, `isRead=true|false`, `search`, `page`,
`limit`.

### 11.3 Notifications

Base path: `/api/v2/notifications` — Authenticated, except broadcast is admin.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/unread-count` | Authenticated | Unread notification count |
| `PATCH` | `/read-all` | Authenticated | Mark all notifications read |
| `POST` | `/broadcast` | Admin | Send an in-app notification broadcast |
| `GET` | `/` | Authenticated | List current user's notifications |
| `PATCH` | `/:id/read` | Authenticated | Mark one notification read |
| `DELETE` | `/:id` | Authenticated | Delete one notification |

Broadcast body:

```json
{
  "title": "System maintenance",
  "message": "The portal will be unavailable at 10 PM.",
  "type": "system",
  "role": "all",
  "userIds": []
}
```

Notification types: `announcement`, `message`, `fee`, `result`, `attendance`,
`system`.

Automatic notifications are created for:

- Published results
- Recorded and reversed fee payments
- Newly recorded student absences
- Published announcements
- Direct messages

---

## 12. Reports

Base path: `/api/v2/reports` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/dashboard` | School-wide dashboard summary |
| `GET` | `/enrollment` | Enrollment breakdown |
| `GET` | `/attendance` | Attendance performance report |
| `GET` | `/academics` | Academic performance report |
| `GET` | `/finance` | Finance report |
| `GET` | `/students` | Student roster |
| `GET` | `/teachers` | Teacher workload report |

### Common filters

| Endpoint | Filters |
| --- | --- |
| `/dashboard` | None |
| `/enrollment` | `academicSession`, `academicClass`, `academicLevel`, `status`, `groupBy=class|level|gender|status` |
| `/attendance` | `from`, `to`, `academicSession`, `academicSemester`, `academicClass`, `student`, `status`, `groupBy=day|class|student|status` |
| `/academics` | `academicSession`, `academicSemester`, `academicClass`, `classSubject`, `includeUnpublished=true|false` |
| `/finance` | `academicSession`, `academicSemester`, `academicClass`, `from`, `to`, `groupBy=day|month|method` |
| `/students` | `academicClass`, `status`, `gender`, `search`, `page`, `limit` |
| `/teachers` | `status`, `search`, `page`, `limit` |

The attendance report defaults to the last 30 days and the current semester.
Academic reports default to published results unless
`includeUnpublished=true` is supplied.

---

## 13. System Administration

### 13.1 Users

Base path: `/api/v2/users` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | List users with role/status/search filters |
| `GET` | `/:id` | Get a user and linked profile |
| `PATCH` | `/:id` | Update name, email, active state, or password-change flag |
| `POST` | `/:id/reset-password` | Reset another user's password |
| `DELETE` | `/:id` | Deactivate a user |

List query: `role`, `isActive`, `search`, `page`, `limit`.

Update body may include `fullName`, `email`, `isActive`, and
`mustChangePassword`. An admin cannot deactivate their own account.

Password reset body:

```json
{
  "newPassword": "OptionalTemporary123@"
}
```

If `newPassword` is omitted, a temporary password is generated and returned once
in the response. The user must change it on next login. An admin cannot use this
endpoint to reset their own password; use `/api/v2/auth/change-password`.

### 13.2 System Settings

Base path: `/api/v2/settings`

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/public` | Public | Public settings only |
| `GET` | `/` | Admin | List settings |
| `GET` | `/:key` | Admin | Get one setting |
| `PUT` | `/:key` | Admin | Create or update a setting |
| `DELETE` | `/:key` | Admin | Delete a setting |

Setting body:

```json
{
  "value": {
    "name": "Darul Ulum",
    "motto": "Knowledge and Character"
  },
  "category": "branding",
  "description": "Public school branding",
  "isPublic": true
}
```

Keys may contain letters, numbers, dots, dashes, and underscores. Only settings
with `isPublic: true` are exposed by `/public`.

### 13.3 System Maintenance

Base path: `/api/v2/system` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/info` | Application, database, and record-count information |
| `GET` | `/database` | Database storage and collection statistics |
| `POST` | `/sync-indexes` | Synchronize all Mongoose model indexes |

`POST /sync-indexes` is a maintenance operation. Run it after schema/index
changes. It can remove obsolete indexes and can fail if existing data violates a
new unique index; inspect the returned per-model results.

### 13.4 Audit Logs

Base path: `/api/v2/audit-logs` — Admin only.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | List audit logs |
| `GET` | `/:id` | Get one audit log |

List filters: `user`, `role`, `method`, `path`, `success`, `from`, `to`, `page`,
`limit`.

Authenticated `POST`, `PATCH`, `PUT`, and `DELETE` requests are logged
automatically. Passwords, tokens, secrets, and authorization values are
redacted from the stored request body.

---

## 14. Roles and Access Summary

| Role | Main access |
| --- | --- |
| `admin` | All academic, admissions, finance, parent administration, reports, settings, audit, and system maintenance |
| `teacher` | Own profile/dashboard, assigned class subjects, assessments, scores, attendance, published result viewing |
| `student` | Own profile/dashboard, own published results, report card, transcript, own attendance, own invoices/payments |
| `parent` | Linked children's overview, attendance, published results, report card, transcript, invoices, payments |

Role checks are enforced server-side. Frontend visibility is not a security
boundary.

---

## 15. Postman Collection

Import:

- `docs/postman/Darul-Ulum.postman_collection.json`
- `docs/postman/Darul-Ulum.postman_environment.json`

Set `baseUrl`, `identifier`, and `password` in the environment, then run the
**Auth → Login** request. The collection stores the returned token in the
`token` collection variable automatically. Create requests also save some
resource IDs (sessions, classes, students, invoices, etc.) for subsequent
requests where practical.

Before running the full collection, create/seed at least one academic session,
semester, section, level, class, subject, and student. Many requests depend on
IDs that cannot be generated without those prerequisites.
