import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  Users,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  fmtRate,
  isErrorStatus,
  useGetMyClassesQuery,
  useGetTeacherAttendanceMeQuery,
  useGetTeacherDashboardQuery,
  useGetTeacherProfileQuery,
} from "@/features/teacher/api";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";

export function TeacherDashboardPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const navigate = useNavigate();

  const dashboard = useGetTeacherDashboardQuery();
  const profile = useGetTeacherProfileQuery();
  const myClasses = useGetMyClassesQuery();
  const myAttendance = useGetTeacherAttendanceMeQuery({ page: 1, limit: 1 });

  const teacher = dashboard.data?.data.teacher;
  const account = dashboard.data?.data.account;
  const profileMissing =
    profile.isError && isErrorStatus(profile.error, 404);

  const classes = myClasses.data?.data ?? [];
  const summary = myAttendance.data?.summary;

  const classSubjectCount = new Set(
    classes.map((row) => `${row.class._id}:${row.subject._id}`),
  ).size;

  const greeting = teacher?.fullName ?? currentUser?.fullName ?? "Teacher";

  return (
    <div>
      <PageHeader
        title={`As-salāmu ʿalaykum, ${greeting}`}
        arabic="أهلاً وسهلاً"
        description={
          teacher?.specialization
            ? `${teacher.employmentType ?? "Teacher"} · ${teacher.specialization}`
            : "Your teaching dashboard — classes, attendance, assessments, and results."
        }
      />

      {profileMissing && (
        <Alert
          tone="warning"
          title="No teacher profile linked to this account"
          className="mb-4"
        >
          Your login is active, but no Teacher record is linked to it yet. Ask
          the school administration to link a teacher profile — until then only
          your account details are shown below.
        </Alert>
      )}

      <div className="space-y-6">
        <StatGrid cols={4}>
          <StatCard
            label="My classes"
            value={
              myClasses.data && classes.length > 0 ? classes.length : "—"
            }
            sub="Assigned class-subjects"
            icon={<Users className="size-4" aria-hidden />}
            tone="primary"
            loading={myClasses.isLoading}
          />
          <StatCard
            label="Class-subject pairs"
            value={
              myClasses.data && classes.length > 0 ? classSubjectCount : "—"
            }
            sub="Unique teaching slots"
            icon={<BookOpen className="size-4" aria-hidden />}
            tone="default"
            loading={myClasses.isLoading}
          />
          <StatCard
            label="My attendance rate"
            value={fmtRate(summary?.attendanceRate)}
            sub="From your recent records"
            icon={<CalendarCheck2 className="size-4" aria-hidden />}
            tone="gold"
            loading={myAttendance.isLoading}
          />
          <StatCard
            label="Account status"
            value={
              dashboard.isLoading
                ? "—"
                : teacher?.isActive === false
                  ? "Inactive"
                  : "Active"
            }
            sub={
              teacher?.teacherNumber
                ? `Staff № ${teacher.teacherNumber}`
                : (account?.username ?? "—")
            }
            icon={<ClipboardList className="size-4" aria-hidden />}
            tone={teacher?.isActive === false ? "danger" : "primary"}
            loading={dashboard.isLoading}
          />
        </StatGrid>

        <div>
          <SectionTitle
            actions={
            <Button
              size="sm"
              variant="outline"
              iconRight={<ArrowRight className="size-3.5" aria-hidden />}
              onClick={() => navigate("/teacher/classes")}
            >
              View all
            </Button>
          }
          >
            My classes
          </SectionTitle>

          {myClasses.isLoading ? (
            <div
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              role="status"
              aria-live="polite"
            >
              <span className="sr-only">Loading classes…</span>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-card border border-ink-100 bg-white"
                />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-500">
                No classes assigned yet — once administration assigns you to
                class-subjects they will appear here.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {classes.map((row) => (
                <Card key={row.assignmentId} className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {row.class.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {row.subject.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{row.subject.code ?? row.courseCode ?? "—"}</Badge>
                    <Badge tone="info">{row.semester.name}</Badge>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<CalendarCheck2 className="size-3.5" aria-hidden />}
                      onClick={() =>
                        navigate(
                          `/teacher/attendance?class=${row.class._id}&semester=${row.semester._id}`,
                        )
                      }
                    >
                      Attendance
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<BookOpen className="size-3.5" aria-hidden />}
                      onClick={() => navigate("/teacher/assessments")}
                    >
                      Assessments
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card
          title="My account"
          description="Login details for this portal account."
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/teacher/results")}
            >
              Results
            </Button>
          }
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-ink-500">Teacher</dt>
              <dd className="mt-1 font-medium text-ink-900">
                {teacher?.fullName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-500">Username</dt>
              <dd className="mt-1 font-medium text-ink-900">
                {account?.username ?? currentUser?.username ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-500">Email</dt>
              <dd className="mt-1 font-medium text-ink-900">
                {account?.email ?? currentUser?.email ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-500">Password</dt>
              <dd className="mt-1">
                {account?.mustChangePassword === true ? (
                  <Badge tone="warning">Change required</Badge>
                ) : (
                  <Badge tone="success">OK</Badge>
                )}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
