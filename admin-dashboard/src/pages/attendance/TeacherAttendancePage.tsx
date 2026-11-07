import { useMemo, useState } from "react";
import { CalendarCheck2, Users } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { FormField, Input, Select, Textarea } from "@/components/ui/Fields";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";
import {
  useBulkMarkTeacherAttendanceMutation,
  useGetTeacherAttendanceSummaryQuery,
  useListTeacherAttendanceQuery,
  TEACHER_ATTENDANCE_STATUSES,
  type TeacherAttendanceRecord,
  type TeacherAttendanceStatus,
  type TeacherAttendanceSummaryEntry,
} from "@/features/academics-records/api";
import { getApiErrorMessage, useListTeachersQuery } from "@/features/staff/api";
import type { Teacher } from "@/features/staff/api";

const PAGE_SIZE = 10;

function localISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function teacherName(
  teacher:
    | TeacherAttendanceRecord["teacher"]
    | TeacherAttendanceSummaryEntry["teacher"],
): string {
  if (!teacher || typeof teacher === "string") return "—";
  return (
    [teacher.firstName, teacher.middleName, teacher.lastName]
      .filter(Boolean)
      .join(" ") || "—"
  );
}

export function TeacherAttendancePage() {
  const user = useAppSelector(selectCurrentUser);
  const role = user?.role;

  if (role && role !== "admin") {
    return (
      <div>
        <PageHeader title="Teacher Attendance" arabic="حضور المعلمين" />
        <Alert tone="error" title="Administrator access required">
          Only administrators can mark and review teacher attendance. You can
          view your own records on your teacher dashboard.
        </Alert>
      </div>
    );
  }

  return <TeacherAttendanceAdmin />;
}

function TeacherAttendanceAdmin() {
  const { data: teachersData, isLoading: teachersLoading } =
    useListTeachersQuery({ limit: 200 });
  const teachers = teachersData?.data ?? [];

  const [teacher, setTeacher] = useState("");
  const [date, setDate] = useState(localISODate());
  const [status, setStatus] = useState<TeacherAttendanceStatus>("Present");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [bulkMarkTeacherAttendance, { isLoading: submitting }] =
    useBulkMarkTeacherAttendanceMutation();

  const canSubmit = Boolean(teacher && date);

  const submitMarker = () => {
    void (async () => {
      setSubmitError(null);
      setNotice(null);
      try {
        await bulkMarkTeacherAttendance({
          records: [
            {
              teacher,
              date,
              status,
              ...(checkIn ? { checkIn } : {}),
              ...(checkOut ? { checkOut } : {}),
              ...(remarks ? { remarks } : {}),
            },
          ],
        }).unwrap();
        setNotice(`Teacher attendance saved for ${fmtDate(date)}.`);
        setRemarks("");
        setCheckIn("");
        setCheckOut("");
      } catch (err) {
        setSubmitError(
          getApiErrorMessage(err, "Could not save teacher attendance."),
        );
      }
    })();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Attendance"
        arabic="حضور المعلمين"
        description="Mark teacher attendance with check-in and check-out times, and review history."
      />

      <Card
        title="Mark teacher attendance"
        description="Statuses: Present, Absent, Late, Excused or Leave."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Teacher">
            {(aria) => (
              <Select
                {...aria}
                aria-busy={teachersLoading || undefined}
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
              >
                <option value="">Select teacher…</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.fullName} ({t.teacherNumber})
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="Date">
            {(aria) => (
              <Input
                {...aria}
                type="date"
                value={date}
                max={localISODate()}
                onChange={(e) => setDate(e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Status">
            {(aria) => (
              <Select
                {...aria}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as TeacherAttendanceStatus)
                }
              >
                {TEACHER_ATTENDANCE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Check-in">
              {(aria) => (
                <Input
                  {...aria}
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              )}
            </FormField>
            <FormField label="Check-out">
              {(aria) => (
                <Input
                  {...aria}
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              )}
            </FormField>
          </div>
        </div>

        <FormField label="Remarks" className="mt-3 max-w-xl">
          {(aria) => (
            <Textarea
              {...aria}
              rows={2}
              placeholder="Optional remarks (e.g. approved half-day leave)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          )}
        </FormField>

        {submitError && (
          <Alert
            tone="error"
            title="Could not save teacher attendance"
            className="mt-4"
            onDismiss={() => setSubmitError(null)}
          >
            {submitError}
          </Alert>
        )}

        {notice && (
          <Alert
            tone="success"
            title="Teacher attendance saved"
            className="mt-4"
            onDismiss={() => setNotice(null)}
          >
            {notice}
          </Alert>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            onClick={submitMarker}
            loading={submitting}
            disabled={!canSubmit}
            icon={<CalendarCheck2 className="size-4" aria-hidden />}
          >
            Save attendance
          </Button>
        </div>
      </Card>

      <TeacherSummaryCard teacher={teacher} dateFrom={date} dateTo={date} />

      <TeacherHistoryCard teacherOptions={teachers} />
    </div>
  );
}

function TeacherSummaryCard({
  teacher,
  dateFrom,
  dateTo,
}: {
  teacher: string;
  dateFrom: string;
  dateTo: string;
}) {
  const { data, isLoading, isError, refetch } = useGetTeacherAttendanceSummaryQuery(
    {
      teacher: teacher || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    },
  );

  const rows = data?.data ?? [];
  const single = rows.length === 1 ? rows[0] : undefined;
  const total = rows.reduce<Record<string, number>>(
    (acc, row) => {
      acc.present += row.present ?? 0;
      acc.absent += row.absent ?? 0;
      acc.late += row.late ?? 0;
      acc.excused += row.excused ?? 0;
      acc.leave += row.leave ?? 0;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0, leave: 0 },
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Attendance summary"
        description={
          teacher
            ? "Per-teacher summary for the marker date above."
            : "School-wide summary for the marker date above — select a teacher to focus on one person."
        }
        onRetry={isError ? () => void refetch() : undefined}
      />

      {isError ? (
        <Alert tone="error" title="Could not load summary">
          <div className="flex items-center gap-3">
            <span>Try adjusting the filters.</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : single ? (
        <StatGrid cols={4}>
          <StatCard
            label="Present"
            value={single.present ?? 0}
            tone="primary"
            icon={<Users className="size-4" aria-hidden />}
            loading={isLoading}
          />
          <StatCard
            label="Absent"
            value={single.absent ?? 0}
            tone="danger"
            loading={isLoading}
          />
          <StatCard
            label="Late / Leave"
            value={`${single.late ?? 0} / ${single.leave ?? 0}`}
            tone="warning"
            loading={isLoading}
          />
          <StatCard
            label="Attendance rate"
            value={
              single.attendanceRate !== undefined
                ? `${single.attendanceRate}%`
                : "—"
            }
            sub={single.total !== undefined ? `${single.total} records` : undefined}
            tone="gold"
            icon={<CalendarCheck2 className="size-4" aria-hidden />}
            loading={isLoading}
          />
        </StatGrid>
      ) : (
        <StatGrid cols={4}>
          <StatCard label="Present" value={total.present} loading={isLoading} tone="primary" />
          <StatCard label="Absent" value={total.absent} loading={isLoading} tone="danger" />
          <StatCard label="Late / Excused / Leave" value={`${total.late} / ${total.excused} / ${total.leave}`} loading={isLoading} tone="warning" />
          <StatCard
            label="Teachers covered"
            value={rows.length}
            loading={isLoading}
            tone="gold"
            sub="Averaged rate"
          />
        </StatGrid>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

function TeacherHistoryCard({
  teacherOptions,
}: {
  teacherOptions: Teacher[];
}) {
  const [page, setPage] = useState(1);
  const [teacher, setTeacher] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: null,
    dir: "asc",
  });

  const { data, isLoading, isError, error, refetch } = useListTeacherAttendanceQuery(
    {
      page,
      limit: PAGE_SIZE,
      teacher: teacher || undefined,
      from: from || undefined,
      to: to || undefined,
    },
  );

  const records = data?.data;
  const pagination = data?.pagination;

  const onSortChange = (key: string | null) => {
    setSort((prev) =>
      prev.key === key
        ? key
          ? { key, dir: "desc" }
          : { key: null, dir: "asc" }
        : { key, dir: "asc" },
    );
  };

  const filtersChanged = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const columns: Column<TeacherAttendanceRecord>[] = useMemo(
    () => [
      {
        key: "teacher",
        header: "Teacher",
        sortValue: (r) => teacherName(r.teacher),
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-medium text-ink-900">{teacherName(r.teacher)}</span>
            {typeof r.teacher === "object" && r.teacher !== null && r.teacher.teacherNumber && (
              <span className="font-mono text-xs text-ink-500">
                {r.teacher.teacherNumber}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "date",
        header: "Date",
        sortValue: (r) => r.date,
        render: (r) => fmtDate(r.date),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => r.status,
        render: (r) => <StatusBadge status={r.status} />,
      },
      {
        key: "checkIn",
        header: "Check-in",
        render: (r) => r.checkIn || "—",
      },
      {
        key: "checkOut",
        header: "Check-out",
        render: (r) => r.checkOut || "—",
      },
      {
        key: "remarks",
        header: "Remarks",
        render: (r) => r.remarks || "—",
      },
    ],
    [],
  );

  const mobileCard = (r: TeacherAttendanceRecord) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ink-900">{teacherName(r.teacher)}</p>
        <StatusBadge status={r.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-ink-500">Date</dt>
        <dd className="text-ink-800">{fmtDate(r.date)}</dd>
        <dt className="text-ink-500">Check-in</dt>
        <dd className="text-ink-800">{r.checkIn || "—"}</dd>
        <dt className="text-ink-500">Check-out</dt>
        <dd className="text-ink-800">{r.checkOut || "—"}</dd>
        <dt className="text-ink-500">Remarks</dt>
        <dd className="text-ink-800">{r.remarks || "—"}</dd>
      </dl>
    </div>
  );

  return (
    <Card
      title="Teacher attendance history"
      description="Filter by teacher and date range."
    >
      <div className="grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-3">
        <FormField label="Teacher">
          {(aria) => (
            <Select
              {...aria}
              value={teacher}
              onChange={(e) => filtersChanged(() => setTeacher(e.target.value))}
            >
              <option value="">All teachers</option>
              {teacherOptions.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label="From">
          {(aria) => (
            <Input
              {...aria}
              type="date"
              value={from}
              max={localISODate()}
              onChange={(e) => filtersChanged(() => setFrom(e.target.value))}
            />
          )}
        </FormField>

        <FormField label="To">
          {(aria) => (
            <Input
              {...aria}
              type="date"
              value={to}
              max={localISODate()}
              onChange={(e) => filtersChanged(() => setTo(e.target.value))}
            />
          )}
        </FormField>
      </div>

      {isError && (
        <Alert tone="error" title="Could not load teacher attendance" className="p-4">
          <div className="flex items-center gap-3">
            <span>{getApiErrorMessage(error, "Request failed.")}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        emptyTitle="No teacher attendance recorded yet"
        emptyDescription={
          teacher || from || to
            ? "Try adjusting or clearing the filters."
            : "Use the marker above to record teacher attendance."
        }
        emptyAction={
          isError ? (
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          ) : undefined
        }
        rowKey={(r) => r._id}
        sort={sort}
        onSortChange={onSortChange}
        mobileCard={mobileCard}
      />

      <PagedFooter pagination={pagination} onPageChange={setPage} />
    </Card>
  );
}
