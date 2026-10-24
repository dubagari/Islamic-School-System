# Darul Ulum School Management System Roadmap

> Project Version: v2
> Status: Backend core complete; frontend integration pending

---

# Phase 1: Admission Management

## Admission Application

- [x] Submit admission application
- [x] Generate admission number
- [x] Store parent/guardian information
- [x] View all applications
- [x] Pagination
- [x] Search and filtering
- [x] Approve application
- [x] Reject application
- [x] Application status portal endpoint

## Registration

- [x] Confirm payment
- [x] Generate registration number
- [x] Create student profile
- [x] Create student user account
- [x] First login support
- [x] Force password change on first login

---

# Phase 2: Authentication

- [x] Login
- [x] JWT authentication
- [x] Role-based authorization
- [x] Admin password reset
- [x] Change password
- [x] Profile endpoint
- [ ] Logout endpoint (stateless JWT; clients discard the token)

---

# Phase 3: Employee Management

- [x] Teacher registration
- [x] Teacher number generation
- [x] Teacher user accounts
- [ ] Dedicated non-teaching staff accounts

---

# Phase 4: Academic Management

- [x] Academic sections
- [x] Academic levels
- [x] Academic sessions
- [x] Semesters
- [x] Classes
- [x] Subjects
- [x] Class subjects
- [x] Teacher assignments
- [x] Student class allocation
- [ ] Timetable

---

# Phase 5: Student Management

- [x] Student profile
- [x] Student enrollment history
- [x] Promotion records
- [x] Transfer records
- [x] Withdrawal records
- [x] Student password reset
- [ ] Automated promotion workflow

---

# Phase 6: Attendance

- [x] Student attendance
- [x] Teacher attendance
- [x] Class attendance summary
- [x] Student attendance history
- [x] Attendance reports
- [x] Absence notifications

---

# Phase 7: Assessments and Results

- [x] Assessment setup
- [x] Assessment weight validation
- [x] Score entry
- [x] Result computation
- [x] Result publishing
- [x] Report cards
- [x] Transcripts
- [x] Result publication notifications

---

# Phase 8: Finance

- [x] Fee structures
- [x] Invoice generation
- [x] Manual invoices
- [x] Payment records
- [x] Receipts
- [x] Outstanding balances
- [x] Payment reversal
- [x] Fee summaries and finance reports
- [x] Payment notifications

---

# Phase 9: Parent Portal

- [x] Parent accounts
- [x] Parent-child linking
- [x] View child profile
- [x] View child attendance
- [x] View child results and report cards
- [x] View child transcript
- [x] View child fees, invoices, and payment history

---

# Phase 10: Communication

- [x] Announcements
- [x] Role/class announcement targeting
- [x] In-app notifications
- [x] Direct messages
- [x] Read tracking
- [ ] SMS notifications
- [ ] Email notifications (SMTP dependency configured; delivery service not built)

---

# Phase 11: Reports

- [x] Student roster report
- [x] Enrollment report
- [x] Attendance report
- [x] Academic performance report
- [x] Finance report
- [x] Teacher workload report
- [x] Administrative dashboard
- [ ] Separate admission funnel report (current dashboard exposes pending admissions)

---

# Phase 12: System Administration

- [x] System settings
- [x] User management
- [x] Admin password reset
- [x] Audit logs
- [x] System and database information
- [x] Model index synchronization
- [ ] Automated backup and restore

---

# Backend Delivery Notes

- API documentation: `docs/API_REFERENCE.md`
- Business rules: `docs/BUSINESS_RULES.md`
- Architecture: `docs/SYSTEM_ARCHITECTURE.md`
- Postman collection: `docs/postman/Darul-Ulum.postman_collection.json`
- Postman environment: `docs/postman/Darul-Ulum.postman_environment.json`
- All backend modules are mounted under `/api/v2`.
- Frontend implementation is the next major phase.
