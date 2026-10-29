# Changelog

Every completed feature, newest first.

## v0.6.0 - Computer-Based Testing (CBT)

### Backend

- Added `CbtQuestion`, `CbtExam`, `CbtExamQuestion`, `CbtAttempt`, and
  `CbtAttemptAnswer` models.
- Added question bank CRUD with teacher subject scoping.
- Added exam CRUD, publishing, result release, statistics, and attempt
  monitoring.
- Added question attachment, marks, ordering, and per-exam snapshots.
- Added student exam listing, start/resume, answer saving, submission,
  auto-submit, and result endpoints.
- Added automatic grading, pass marks, attempt limits, and admin voiding.
- Added optional linked assessment scoring with `source: "CBT"`; manual scores
  are never overwritten.
- Added `exam` notification type for exam publication and result release.
- Added CBT routes under `/api/v2/cbt`.
- Added an isolated end-to-end CBT smoke test covering all roles.

### Admin dashboard

- Added CBT Exams, exam detail, and Question Bank pages.
- Added CBT navigation and API tags.

### School portal

- Added teacher CBT authoring pages for exams and question bank.
- Added student CBT exam list, timed attempt runner, and result review.
- Added parent child CBT attempt history and result view.

### Documentation

- Documented CBT API endpoints, business rules, architecture, and roadmap.
- Added CBT requests to the Postman collection.

## Earlier versions

- v0.1.0 - Authentication, admissions, student registration, sessions, academic
  terms.
