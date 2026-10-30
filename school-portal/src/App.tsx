import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Landmark } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageLoader } from "@/components/ui/PageLoader";
import { useAppSelector } from "@/app/hooks";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "@/features/auth/authSlice";

import { LoginPage } from "@/pages/auth/LoginPage";
import { ChangePasswordPage } from "@/pages/auth/ChangePasswordPage";
import { ProfilePage } from "@/pages/auth/ProfilePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function lazyNamed<T extends ComponentType<unknown>>(
  loader: () => Promise<Record<string, unknown>>,
  name: string,
) {
  return lazy(() =>
    loader().then((m) => ({ default: m[name] as T })),
  );
}

const TeacherDashboardPage = lazyNamed(() => import("@/pages/teacher/TeacherDashboardPage"), "TeacherDashboardPage");
const MyClassesPage = lazyNamed(() => import("@/pages/teacher/MyClassesPage"), "MyClassesPage");
const ClassAttendancePage = lazyNamed(() => import("@/pages/teacher/ClassAttendancePage"), "ClassAttendancePage");
const MyAttendancePage = lazyNamed(() => import("@/pages/teacher/MyAttendancePage"), "MyAttendancePage");
const TeacherAssessmentsPage = lazyNamed(() => import("@/pages/teacher/TeacherAssessmentsPage"), "TeacherAssessmentsPage");
const TeacherResultsPage = lazyNamed(() => import("@/pages/teacher/TeacherResultsPage"), "TeacherResultsPage");
const TeacherCbtPage = lazyNamed(() => import("@/pages/teacher/TeacherCbtPage"), "TeacherCbtPage");
const TeacherCbtExamPage = lazyNamed(() => import("@/pages/teacher/TeacherCbtExamPage"), "TeacherCbtExamPage");

const StudentDashboardPage = lazyNamed(() => import("@/pages/student/StudentDashboardPage"), "StudentDashboardPage");
const StudentResultsPage = lazyNamed(() => import("@/pages/student/StudentResultsPage"), "StudentResultsPage");
const StudentAttendancePage = lazyNamed(() => import("@/pages/student/StudentAttendancePage"), "StudentAttendancePage");
const StudentFeesPage = lazyNamed(() => import("@/pages/student/StudentFeesPage"), "StudentFeesPage");
const StudentCbtPage = lazyNamed(() => import("@/pages/student/StudentCbtPage"), "StudentCbtPage");
const CbtAttemptPage = lazyNamed(() => import("@/pages/student/CbtAttemptPage"), "CbtAttemptPage");
const CbtResultPage = lazyNamed(() => import("@/pages/student/CbtResultPage"), "CbtResultPage");

const ParentDashboardPage = lazyNamed(() => import("@/pages/parent/ParentDashboardPage"), "ParentDashboardPage");
const ChildOverviewPage = lazyNamed(() => import("@/pages/parent/ChildOverviewPage"), "ChildOverviewPage");
const ChildAttendancePage = lazyNamed(() => import("@/pages/parent/ChildAttendancePage"), "ChildAttendancePage");
const ChildResultsPage = lazyNamed(() => import("@/pages/parent/ChildResultsPage"), "ChildResultsPage");
const ChildFeesPage = lazyNamed(() => import("@/pages/parent/ChildFeesPage"), "ChildFeesPage");
const ChildCbtPage = lazyNamed(() => import("@/pages/parent/ChildCbtPage"), "ChildCbtPage");
const ChildCbtResultPage = lazyNamed(() => import("@/pages/parent/ChildCbtResultPage"), "ChildCbtResultPage");

const AnnouncementsPage = lazyNamed(() => import("@/pages/shared/AnnouncementsPage"), "AnnouncementsPage");
const MessagesPage = lazyNamed(() => import("@/pages/shared/MessagesPage"), "MessagesPage");
const NotificationsPage = lazyNamed(() => import("@/pages/shared/NotificationsPage"), "NotificationsPage");

const portalHome: Record<string, string> = {
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

function RootRedirect() {
  const user = useAppSelector(selectCurrentUser);
  return <Navigate to={portalHome[user?.role ?? ""] ?? "/use-admin"} replace />;
}

/** Admins are served by the separate administration dashboard. */
function AdminNoticePage() {
  return (
    <div className="mx-auto max-w-lg rounded-card border border-ink-100 bg-white p-10 text-center shadow-card">
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-600 ring-1 ring-gold-500/30">
        <Landmark className="size-6" aria-hidden />
      </span>
      <h1 className="text-lg font-bold text-ink-900">Administration account</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        Administrator tools live in the separate Administration Dashboard. This
        portal serves teachers, students, and parents only. You can still view
        your profile below.
      </p>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function RequireRole({ allow, children }: { allow: string[]; children: ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  if (!allow.includes(user?.role ?? "")) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (user && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </AppShell>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      <Route element={<ProtectedLayout />}>
        <Route index element={<RootRedirect />} />
        <Route path="/use-admin" element={<AdminNoticePage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Teacher */}
        <Route
          path="/teacher"
          element={
            <RequireRole allow={["teacher"]}>
              <TeacherDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <RequireRole allow={["teacher"]}>
              <MyClassesPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <RequireRole allow={["teacher"]}>
              <ClassAttendancePage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/attendance/me"
          element={
            <RequireRole allow={["teacher"]}>
              <MyAttendancePage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/assessments"
          element={
            <RequireRole allow={["teacher"]}>
              <TeacherAssessmentsPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/results"
          element={
            <RequireRole allow={["teacher"]}>
              <TeacherResultsPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/cbt"
          element={
            <RequireRole allow={["teacher"]}>
              <TeacherCbtPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/cbt/:id"
          element={
            <RequireRole allow={["teacher"]}>
              <TeacherCbtExamPage />
            </RequireRole>
          }
        />

        {/* Student */}
        <Route
          path="/student"
          element={
            <RequireRole allow={["student"]}>
              <StudentDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/student/results"
          element={
            <RequireRole allow={["student"]}>
              <StudentResultsPage />
            </RequireRole>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <RequireRole allow={["student"]}>
              <StudentAttendancePage />
            </RequireRole>
          }
        />
        <Route
          path="/student/fees"
          element={
            <RequireRole allow={["student"]}>
              <StudentFeesPage />
            </RequireRole>
          }
        />
        <Route
          path="/student/cbt"
          element={
            <RequireRole allow={["student"]}>
              <StudentCbtPage />
            </RequireRole>
          }
        />
        <Route
          path="/student/cbt/attempts/:attemptId"
          element={
            <RequireRole allow={["student"]}>
              <CbtAttemptPage />
            </RequireRole>
          }
        />
        <Route
          path="/student/cbt/results/:attemptId"
          element={
            <RequireRole allow={["student"]}>
              <CbtResultPage />
            </RequireRole>
          }
        />

        {/* Parent */}
        <Route
          path="/parent"
          element={
            <RequireRole allow={["parent"]}>
              <ParentDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/parent/children/:studentId"
          element={
            <RequireRole allow={["parent"]}>
              <ChildOverviewPage />
            </RequireRole>
          }
        />
        <Route
          path="/parent/children/:studentId/attendance"
          element={
            <RequireRole allow={["parent"]}>
              <ChildAttendancePage />
            </RequireRole>
          }
        />
        <Route
          path="/parent/children/:studentId/results"
          element={
            <RequireRole allow={["parent"]}>
              <ChildResultsPage />
            </RequireRole>
          }
        />
        <Route
          path="/parent/children/:studentId/fees"
          element={
            <RequireRole allow={["parent"]}>
              <ChildFeesPage />
            </RequireRole>
          }
        />
        <Route
          path="/parent/children/:studentId/cbt"
          element={
            <RequireRole allow={["parent"]}>
              <ChildCbtPage />
            </RequireRole>
          }
        />
        <Route
          path="/parent/children/:studentId/cbt/results/:attemptId"
          element={
            <RequireRole allow={["parent"]}>
              <ChildCbtResultPage />
            </RequireRole>
          }
        />

        {/* Shared */}
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
