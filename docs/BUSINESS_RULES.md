# Darul Ulum Management System — Business Rules

This document describes the rules the backend enforces. These rules are
independent of the frontend and should be treated as the source of truth when
building screens, reports, and automations.

---

## 1. Admissions

### Application submission

- An admission application can be submitted without authentication.
- Required applicant details: first name, last name, gender, date of birth,
  phone, address, parent/guardian name, parent/guardian phone, relationship, and
  current level.
- Middle name, email, parent email, and previous madrasa are optional.
- A unique application number is generated for every application.
- An application starts with status `Pending` and payment status `Pending`.
- Applicants can check status publicly by application number. The response must
  not expose internal administration data.

### Approval and rejection

- Only an admin can approve or reject an application.
- An approved application is eligible for payment and registration.
- A rejected application cannot proceed to payment or registration.
- Rejection may include an optional reason.
- Approval does not create a student account and does not generate a
  registration number.

### Admission payment

- Only an admin can confirm an admission payment.
- Cash payments are recorded directly.
- Paystack payments are initialized and then verified using the payment
  reference.
- A failed, cancelled, or unverified Paystack payment does not count as paid.
- The payment amount must be positive.

### Registration

- Only an admin can register an approved applicant.
- An application must be approved and paid before registration.
- Registration creates the student profile and a unique registration number.
- Registration creates a student user account where applicable.
- A registration number must never exist before payment.
- A student account created through registration must change the password at
  first login.

---

## 2. Authentication and Accounts

- Users log in with either username or email plus password.
- Deactivated users cannot log in.
- Passwords are stored as bcrypt hashes; plaintext passwords are never stored.
- JWT tokens contain the user ID and role.
- All protected routes verify the token and load the current user.
- Role-based authorization is enforced on the server.
- A user with `mustChangePassword: true` can only call:
  - `PATCH /api/v2/auth/change-password`
  - `GET /api/v2/auth/profile`
- All other protected routes return `403` with code
  `PASSWORD_CHANGE_REQUIRED` until the password is changed.
- Changing a password requires the current password.
- New passwords must be at least 8 characters.
- Admin password resets set `mustChangePassword: true`.
- Admins cannot deactivate their own account.
- Admins cannot use the admin reset endpoint on their own account; they must use
  the change-password endpoint.

---

## 3. Academic Structure

### Sessions

- A session has a unique name, start date, end date, current flag, and active
  flag.
- New academic setup and default reports should resolve to the current active
  session.
- Historical sessions remain available for reports, results, and transcripts.

### Semesters

- Semester names are `First Semester` and `Second Semester`.
- A semester belongs to exactly one session.
- A session cannot contain two semesters with the same name.
- Semester dates must be valid dates.

### Sections, levels, and classes

- A level belongs to one section.
- A level name and level number are unique within a section.
- A class belongs to one level.
- Class capacity must be at least 1.
- A class teacher, when assigned, must be a valid teacher user.
- Classes can be deactivated without deleting historical records.

### Subjects and class subjects

- A subject belongs to one section and has a name and prefix.
- A class subject links one subject to one class in one semester.
- The same subject cannot be assigned twice to the same class and semester.
- Subject course codes are shared across class arms within a level. Course codes
  are therefore **not globally unique**.
- Deleting a class subject must not silently corrupt existing results; dependent
  data should be handled explicitly or blocked.

### Teacher assignments

- A teacher assignment links a teacher **user** to a class subject.
- The same teacher cannot be assigned twice to the same class subject.
- Inactive assignments do not grant teacher access.
- A teacher may access a class when they are:
  - the class teacher of that class, or
  - actively assigned to at least one class subject in that class.

---

## 4. Student Records and Enrollment

- A student profile is created from an approved, paid admission application.
- Registration numbers and application numbers are unique.
- A student may have multiple enrollment records over time.
- Only one enrollment should be active for a student in a given session.
- Enrollment statuses are `Active`, `Completed`, `Transferred`, and `Withdrawn`.
- Active enrollment is required for attendance and result participation.
- Student records document promotions, transfers, withdrawals, suspensions,
  graduation, disciplinary actions, and general notes.
- Historical records are retained when a student is withdrawn or graduates.
- Deactivating a student does not erase their academic or financial history.

---

## 5. Attendance

### Student attendance

- Attendance is recorded daily per student, per class.
- One record exists per student, class, and UTC-normalized date.
- Attendance cannot be recorded for a future date.
- Valid statuses are `Present`, `Absent`, `Late`, and `Excused`.
- Duplicate students in one bulk request are rejected.
- Students must belong to the selected class or have an active enrollment in it.
- Admin users can mark attendance for any class.
- Teachers can mark attendance only for classes they are class teacher of or
  teach a subject in.
- Attendance rate is calculated as `(Present + Late) / Total * 100`.
- A newly recorded absence generates an in-app notification for the student and
  linked parents.
- Updating a record from `Absent` to another status does not create a new absence
  notification.

### Teacher attendance

- Teacher attendance is recorded daily per teacher.
- Valid statuses are `Present`, `Absent`, `Late`, `Excused`, and `Leave`.
- Check-in/check-out values are optional short time strings.
- Only admins can mark or modify teacher attendance.
- Teachers can view their own attendance.

---

## 6. Assessments and Results

### Assessments

- Assessments belong to a class subject.
- Valid types are `Quiz`, `Test`, `Assignment`, `Midterm`, `Exam`, `Project`, and
  `Practical`.
- Maximum score must be greater than zero.
- Weight must be between 0 and 100.
- The sum of active assessment weights for a class subject and semester cannot
  exceed 100.
- Scores cannot be negative or greater than the assessment maximum.
- Teachers may manage only class subjects they are assigned to.
- Deleting an assessment also deletes its scores.
- Inactive assessments must not contribute to result computation.

### Results

- Results are computed per student, class subject, and semester.
- The weighted score is calculated from assessment percentages and weights.
- Results are upserted, not duplicated.
- Recomputing a result preserves its existing publication state.
- Letter grades and grade points use the default A–F scale unless a configured
  scale is introduced.
- Pass mark is 50.
- Results are unpublished by default.
- Students and parents can only view published results.
- Publish/unpublish is an admin-only action.
- Publishing results notifies affected students and linked parents.
- Report cards and transcripts must only expose published results to students
  and parents.
- Results and transcripts must retain historical session and semester context.

### Default grading scale

| Score | Grade | Points | Remark |
| --- | --- | --- | --- |
| 70–100 | A | 5 | Excellent |
| 60–69 | B | 4 | Very Good |
| 50–59 | C | 3 | Good |
| 45–49 | D | 2 | Fair |
| 40–44 | E | 1 | Pass |
| 0–39 | F | 0 | Fail |

---

## 6A. Computer-Based Testing (CBT)

### Question bank

- Questions belong to a subject and are reusable across exams.
- Supported types are `MultipleChoice` and `TrueFalse`; multiple-choice
  questions have 2-6 options and exactly one correct answer.
- Teachers may manage questions only for subjects they are assigned to.
- A question used by an exam cannot be deleted; deactivate it instead.

### Exams

- An exam belongs to a class subject, and its semester is inherited from that
  class subject.
- `durationMinutes` must be between 1 and 480. `passMark` is a percentage from
  0 to 100. `maxAttempts` is 1-5.
- Only published and active exams are visible to students, and only inside the
  exam availability window.
- Exam questions are copied into exam-specific records, so editing the bank
  later does not alter a live exam.
- Attaching, detaching, reordering, or changing marks is blocked after the first
  non-voided attempt.
- Deleting an exam is blocked after the first non-voided attempt.
- A linked assessment must belong to the same class subject and semester as the
  exam.

### Attempts and grading

- A student may have only one `InProgress` attempt per exam at a time.
- Starting again while an attempt is active resumes it and returns saved
  answers.
- A student may retake an exam until the number of non-voided attempts reaches
  `maxAttempts`.
- An attempt expires at the earlier of its start time plus the exam duration and
  the exam end time. Expired attempts auto-submit.
- Answer saves are validated against the question's options; expired or
  already-submitted attempts reject further saves.
- Grading is automatic on submission: unanswered questions score zero, correct
  answers earn the question's marks, and `percentage = round(score / totalMarks
  * 100)`.
- `passed` is true when the percentage is greater than or equal to `passMark`.
- Result visibility is controlled by `resultVisibility`:
  - `Immediate`: visible as soon as the attempt is submitted.
  - `AfterPublish`: visible only after results are published.
  - `Hidden`: never shown to students or parents.
- Detailed answer review requires `allowReview` and a visible result; staff can
  always review.
- When linked to an assessment, a submitted attempt writes an `AssessmentScore`
  with `source: "CBT"`. A manually entered score is never overwritten; the
  attempt records `linkedScoreStatus: "SkippedManualScore"`.
- Only admins may void an attempt. Voiding removes its answers and any linked
  CBT score, and frees that attempt slot.

### Notifications

- Publishing an exam notifies eligible students.
- Releasing results notifies affected students and linked parents.

---

## 7. Finance

### Fee structures

- A fee structure belongs to a session, semester, and class.
- Amounts cannot be negative.
- Fee types are `Tuition`, `Registration`, `Exam`, `Books`, `Uniform`,
  `Transport`, `Hostel`, `Development`, and `Other`.
- Inactive fee structures cannot be used to generate new invoices.

### Invoices

- An invoice belongs to one student, session, and semester.
- An invoice contains one or more items.
- Item amounts cannot be negative.
- Invoice number format is `INV-YYYY-####`.
- Invoice statuses are `Unpaid`, `Partially Paid`, `Paid`, `Overdue`, and
  `Cancelled`.
- Status is derived from the total amount and completed payments.
- A fully paid invoice cannot accept more payments.
- Payments cannot exceed the outstanding balance.
- Overpayment is rejected.
- Overdue status is recalculated based on the due date and unpaid balance.
- Cancelled invoices cannot accept payments.
- An invoice with payments should not be deleted; cancel it instead.
- Invoice generation from fee structures applies only to eligible students in
  the selected class and session.

### Payments

- A payment belongs to one invoice and one student.
- Amount must be positive.
- Payment methods are `Cash`, `Bank Transfer`, `Card`, `Paystack`, `Cheque`, and
  `Other`.
- Receipt number format is `RCPT-YYYY-####`.
- Payment statuses are `Completed` and `Reversed`.
- Reversing a payment requires a reason.
- Reversing a payment updates the invoice balance and status.
- Reversed payments do not count toward collections.
- Recording and reversing payments notify the student and linked parents.
- Receipt and invoice counters are atomic and must not produce duplicates.

### Access to finance data

- Admins can view and manage all invoices and payments.
- Students can view only their own invoices, payments, and fee summary.
- Parents can view only invoices and payments for linked children.
- Finance reports are admin-only.

---

## 8. Parent Portal

- A parent account has one Parent profile linked to one User account.
- A parent can be linked to multiple students.
- A parent can access a child's data only while the link is active.
- Unlinking a student must immediately remove that parent's access.
- Parent child routes enforce the link on every request.
- Parents see only published results, report cards, and transcripts.
- Parents see only their linked children's attendance, fees, invoices, and
  payments.
- Deactivating a parent user blocks login without deleting historical records.

---

## 9. Communication

### Announcements

- Only admins can create, update, publish, or delete announcements.
- Audiences are `all`, `students`, `teachers`, `parents`, and `class`.
- A class announcement requires an academic class.
- Priorities are `Low`, `Normal`, `High`, and `Urgent`.
- Announcement feeds are filtered by role and class visibility.
- Expired announcements are not shown as active content.
- Publishing an announcement broadcasts in-app notifications to the audience.
- Read receipts are tracked per user.
- A user cannot read another user's announcement read state.

### Direct messages

- Any authenticated user can send a direct message to another active user.
- Messages have an inbox and sent view.
- Only the recipient can mark a received message as read.
- Conversation views must include only messages between the authenticated user
  and the selected user.
- Message notifications are sent to the recipient.

### Notifications

- Notifications are always scoped to the recipient.
- Users can mark one or all notifications as read.
- Users can delete their own notifications.
- Admins can broadcast notifications by role or explicit user list.
- Notification types are `announcement`, `message`, `fee`, `result`,
  `attendance`, and `system`.
- Automatic notifications are created for published results, fee payments,
  payment reversals, and newly recorded absences.

---

## 10. Reports

- Reports are admin-only.
- Dashboard reports use the current active session and semester when available.
- Enrollment reports default to the current session.
- Attendance reports default to the last 30 days and the current semester.
- Academic reports default to published results in the current session and
  semester.
- Finance reports default to the current session and semester and exclude
  cancelled invoices.
- Attendance rate uses `(Present + Late) / Total`.
- Pass rate uses a score of 50 or higher.
- Reports must not leak passwords, tokens, or private parent contact data beyond
  what the requesting admin needs.

---

## 11. System Administration

- Only admins can manage users, settings, system information, indexes, and audit
  logs.
- User accounts are soft-deactivated; historical records remain.
- Admin password resets require a password change on next login.
- System settings are stored as key/value pairs with category, description, and
  public visibility flag.
- Only public settings are exposed without authentication.
- Audit logs capture authenticated mutation requests.
- Sensitive request fields (`password`, `token`, `secret`, `authorization`, etc.)
  are redacted before being stored.
- Audit logging failure must never block the underlying business operation.
- Index synchronization is an explicit admin maintenance action.
- Database statistics and system information must not expose credentials or
  connection secrets.

---

## 12. Data Integrity and Security

- Request bodies, query strings, and route parameters are validated with Zod.
- MongoDB operator injection is blocked by sanitizing request input.
- Passwords are never returned by API responses.
- Unauthorized data access returns `403`; missing resources return `404`.
- Duplicate unique values return `409` where possible.
- Validation failures return `400`.
- Authentication failures return `401`.
- Payment, result, and attendance operations are transactional enough to avoid
  partial updates; notification failures are isolated from the main operation.
- Indexed uniqueness rules are part of the business rules, not just database
  implementation details.
- Obsolete indexes must be removed with the system index synchronization
  operation after schema changes.
