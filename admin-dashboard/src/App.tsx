import { Navigate, Route, Routes, useLocation, Outlet } from "react-router-dom";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser, selectIsAuthenticated } from "@/features/auth/authSlice";
import { AppShell } from "@/components/layout/AppShell";

import { LoginPage } from "@/pages/auth/LoginPage";
import { ChangePasswordPage } from "@/pages/auth/ChangePasswordPage";
import { ProfilePage } from "@/pages/auth/ProfilePage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";

const AdmissionsListPage = lazy(() =>
  import("@/pages/admissions/AdmissionsListPage").then((m) => ({
    default: m.AdmissionsListPage,
  })),
);
const AdmissionDetailPage = lazy(() =>
  import("@/pages/admissions/AdmissionDetailPage").then((m) => ({
    default: m.AdmissionDetailPage,
  })),
);
const AdmissionPaymentsPage = lazy(() =>
  import("@/pages/admissions/AdmissionPaymentsPage").then((m) => ({
    default: m.AdmissionPaymentsPage,
  })),
);
const AdmissionRegistrationPage = lazy(() =>
  import("@/pages/admissions/AdmissionRegistrationPage").then((m) => ({
    default: m.AdmissionRegistrationPage,
  })),
);

const StudentsPage = lazy(() =>
  import("@/pages/students/StudentsPage").then((m) => ({ default: m.StudentsPage })),
);
const StudentDetailPage = lazy(() =>
  import("@/pages/students/StudentDetailPage").then((m) => ({
    default: m.StudentDetailPage,
  })),
);
const EnrollmentsPage = lazy(() =>
  import("@/pages/students/EnrollmentsPage").then((m) => ({
    default: m.EnrollmentsPage,
  })),
);
const StudentRecordsPage = lazy(() =>
  import("@/pages/students/StudentRecordsPage").then((m) => ({
    default: m.StudentRecordsPage,
  })),
);

const TeachersPage = lazy(() =>
  import("@/pages/teachers/TeachersPage").then((m) => ({ default: m.TeachersPage })),
);
const TeacherDetailPage = lazy(() =>
  import("@/pages/teachers/TeacherDetailPage").then((m) => ({
    default: m.TeacherDetailPage,
  })),
);

const ParentsPage = lazy(() =>
  import("@/pages/parents/ParentsPage").then((m) => ({ default: m.ParentsPage })),
);

const UsersAdminPage = lazy(() =>
  import("@/pages/admin/UsersAdminPage").then((m) => ({ default: m.UsersAdminPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/admin/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const AuditLogsPage = lazy(() =>
  import("@/pages/admin/AuditLogsPage").then((m) => ({ default: m.AuditLogsPage })),
);
const SystemPage = lazy(() =>
  import("@/pages/admin/SystemPage").then((m) => ({ default: m.SystemPage })),
);

const AcademicSetupPage = lazy(() =>
  import("@/pages/academic/AcademicSetupPage").then((m) => ({
    default: m.AcademicSetupPage,
  })),
);
const ClassSubjectsPage = lazy(() =>
  import("@/pages/academic/ClassSubjectsPage").then((m) => ({
    default: m.ClassSubjectsPage,
  })),
);
const TeacherAssignmentsPage = lazy(() =>
  import("@/pages/academic/TeacherAssignmentsPage").then((m) => ({
    default: m.TeacherAssignmentsPage,
  })),
);

const AttendancePage = lazy(() =>
  import("@/pages/attendance/AttendancePage").then((m) => ({
    default: m.AttendancePage,
  })),
);
const TeacherAttendancePage = lazy(() =>
  import("@/pages/attendance/TeacherAttendancePage").then((m) => ({
    default: m.TeacherAttendancePage,
  })),
);

const AssessmentsPage = lazy(() =>
  import("@/pages/assessments/AssessmentsPage").then((m) => ({
    default: m.AssessmentsPage,
  })),
);
const ResultsPage = lazy(() =>
  import("@/pages/assessments/ResultsPage").then((m) => ({
    default: m.ResultsPage,
  })),
);

const FinanceOverviewPage = lazy(() =>
  import("@/pages/finance/FinanceOverviewPage").then((m) => ({
    default: m.FinanceOverviewPage,
  })),
);
const FeeStructuresPage = lazy(() =>
  import("@/pages/finance/FeeStructuresPage").then((m) => ({
    default: m.FeeStructuresPage,
  })),
);
const InvoicesPage = lazy(() =>
  import("@/pages/finance/InvoicesPage").then((m) => ({
    default: m.InvoicesPage,
  })),
);
const InvoiceDetailPage = lazy(() =>
  import("@/pages/finance/InvoiceDetailPage").then((m) => ({
    default: m.InvoiceDetailPage,
  })),
);
const PaymentsPage = lazy(() =>
  import("@/pages/finance/PaymentsPage").then((m) => ({
    default: m.PaymentsPage,
  })),
);

const AnnouncementsPage = lazy(() =>
  import("@/pages/communication/AnnouncementsPage").then((m) => ({
    default: m.AnnouncementsPage,
  })),
);
const MessagesPage = lazy(() =>
  import("@/pages/communication/MessagesPage").then((m) => ({
    default: m.MessagesPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/pages/communication/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);

const ReportsPage = lazy(() =>
  import("@/pages/reports/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);

export default function App() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();
  const mustChangePassword = user?.mustChangePassword ?? false;

  const passwordGateActive =
    mustChangePassword && isAuthenticated && location.pathname !== "/change-password";

  if (passwordGateActive) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  if (isAuthenticated && location.pathname === "/login") {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated routes in the app shell */}
      <Route
        element={
          isAuthenticated ? (
            <AppShell>
              <Outlet />
            </AppShell>
          ) : (
            <RouteFallback />
          )
        }
      >
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {user?.mustChangePassword === false && (
          <>
            {/* Overview */}
            <Route
              index
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DashboardPage />
                </Suspense>
              }
            />

            {/* Admissions (admin) */}
            <Route
              path="/admissions"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdmissionsListPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admissions/:id"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdmissionDetailPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admissions/payments"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdmissionPaymentsPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admissions/registration"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdmissionRegistrationPage />
                  </Suspense>
                </AdminRoute>
              }
            />

            {/* Students */}
            <Route
              path="/students"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StudentsPage />
                </Suspense>
              }
            />
            <Route
              path="/students/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StudentDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/students/enrollments"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <EnrollmentsPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/students/records"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <StudentRecordsPage />
                  </Suspense>
                </AdminRoute>
              }
            />

            {/* Teachers */}
            <Route
              path="/teachers"
              element={
                <Suspense fallback={<PageLoader />}>
                  <TeachersPage />
                </Suspense>
              }
            />
            <Route
              path="/teachers/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <TeacherDetailPage />
                </Suspense>
              }
            />

            {/* Parents */}
            <Route
              path="/parents"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ParentsPage />
                  </Suspense>
                </AdminRoute>
              }
            />

            {/* Academic setup */}
            <Route
              path="/academic"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AcademicSetupPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/academic/class-subjects"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ClassSubjectsPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/academic/assignments"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <TeacherAssignmentsPage />
                  </Suspense>
                </AdminRoute>
              }
            />

            {/* Attendance */}
            <Route
              path="/attendance"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AttendancePage />
                </Suspense>
              }
            />
            <Route
              path="/attendance/teachers"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <TeacherAttendancePage />
                  </Suspense>
                </AdminRoute>
              }
            />

            {/* Assessments & Results */}
            <Route
              path="/assessments"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AssessmentsPage />
                </Suspense>
              }
            />
            <Route
              path="/results"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ResultsPage />
                </Suspense>
              }
            />

            {/* Finance */}
            <Route
              path="/fees"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <FinanceOverviewPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/fees/structures"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <FeeStructuresPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/fees/invoices"
              element={
                <Suspense fallback={<PageLoader />}>
                  <InvoicesPage />
                </Suspense>
              }
            />
            <Route
              path="/fees/invoices/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <InvoiceDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/fees/payments"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PaymentsPage />
                </Suspense>
              }
            />

            {/* Communication */}
            <Route
              path="/announcements"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AnnouncementsPage />
                </Suspense>
              }
            />
            <Route
              path="/messages"
              element={
                <Suspense fallback={<PageLoader />}>
                  <MessagesPage />
                </Suspense>
              }
            />
            <Route
              path="/notifications"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotificationsPage />
                </Suspense>
              }
            />

            {/* Admin */}
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <UsersAdminPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <SettingsPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AuditLogsPage />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/system"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <SystemPage />
                  </Suspense>
                </AdminRoute>
              }
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <AdminRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ReportsPage />
                  </Suspense>
                </AdminRoute>
              }
            />
          </>
        )}

        {/* Any other authenticated page */}
        <Route
          path="*"
          element={
            user?.mustChangePassword === false ? (
              <NotFoundPage />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            )
          }
        />
      </Route>

      {/* Unauthenticated visitors get redirected to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function RouteFallback() {
  return <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector(selectCurrentUser);

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
