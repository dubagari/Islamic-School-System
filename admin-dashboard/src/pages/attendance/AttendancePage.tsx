import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Users } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { FormField, Input, Select } from "@/components/ui/Fields";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";
import {
  useListMyChildrenQuery,
  useBulkMarkAttendanceMutation,
  useGetClassAttendanceQuery,
  useGetClassAttendanceSummaryQuery,
  useGetClassRosterQuery,
  useGetStudentAttendanceQuery,
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
  type AttendanceRecord,
  type ClassAttendanceSummary,
} from "@/features/academics-records/api";
import { getApiErrorMessage } from "@/features/staff/api";
import {
  classLabel,
  refName,
  useGetAcademicClassesQuery,
  useGetAcademicSemestersQuery,
  useGetAcademicSessionsQuery,
  type AcademicClass,
} from "@/features/students/api";
import { cn } from "@/lib/cn";

const HISTORY_PAGE_SIZE = 10;

function localISODate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
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

const selectStyles: Record<AttendanceStatus, string> = {
  Present: "border-primary-700 bg-primary-700 text-white",
  Absent: "border-red-700 bg-red-700 text-white",
  Late: "border-gold-600 bg-gold-500 text-ink-900",
  Excused: "border-sky-700 bg-sky-600 text-white",
};

type MarkerDraft = { status: AttendanceStatus; remarks: string };

type MarkerState = Record<string, MarkerDraft>;

const defaultDraft = (): MarkerDraft => ({ status: "Present", remarks: "" });

type PersonLike = {
  fullName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  registrationNumber?: string;
};

function rosterName(student: unknown): string {
  if (!student || typeof student === "string") return "—";
  const person = student as PersonLike;
  return (
    person.fullName ||
    [person.firstName, person.middleName, person.lastName]
      .filter(Boolean)
      .join(" ") ||
    "—"
  );
}

export function AttendancePage() {
  const user = useAppSelector(selectCurrentUser);
  const role = user?.role;
  const canMark = role === "admin" || role === "teacher";

  return (
    <div>
      <PageHeader
        title="Student Attendance"
        arabic="الحضور"
        description="Mark daily class attendance and review recorded attendance history."
      />
      {canMark ? (
        <MarkerAndHistory />
      ) : (
        <AttendanceHistoryForMe role={role === "student" ? "student" : "parent"} />
      )}
    </div>
  );
}

// ======================================================
// Admin + teacher marking and class history
// ======================================================

function MarkerAndHistory() {
  const { data: sessionsData } = useGetAcademicSessionsQuery();
  const { data: classesData } = useGetAcademicClassesQuery();

  const [session, setSession] = useState("");
  const [semester, setSemester] = useState("");
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(localISODate());
  const [marker, setMarker] = useState<MarkerState>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sessions = sessionsData?.data ?? [];

  useEffect(() => {
    if (sessions.length === 0) return;
    setSession((prev) =>
      prev || sessions.some((s) => s._id === prev)
        ? prev
        : (sessions.find((s) => s.isCurrent)?._id ?? sessions[0]._id),
    );
  }, [sessions]);

  const semestersFilter = useMemo(
    () => (session ? { academicSession: session } : undefined),
    [session],
  );
  const { data: semestersData } = useGetAcademicSemestersQuery(semestersFilter);
  const semesters = semestersData?.data ?? [];

  useEffect(() => {
    if (semesters.length === 0) return;
    setSemester((prev) =>
      prev && semesters.some((s) => s._id === prev)
        ? prev
        : (semesters.find((s) => s.isCurrent)?._id ?? semesters[0]._id),
    );
  }, [semesters]);

  const { data: rosterData, isLoading: rosterLoading, isError: rosterError } =
    useGetClassRosterQuery(
      { academicClass: classId, academicSession: session || undefined },
      { skip: !classId },
    );

  const { data: todayRecordsData, isLoading: todayLoading } =
    useGetClassAttendanceQuery(
      { academicClass: classId, date, limit: 200 },
      { skip: !classId || !date },
    );

  const roster = rosterData?.data ?? [];
  const todayRecords = todayRecordsData?.data ?? [];

  const loadKey = `${classId}:${date}`;
  useEffect(() => {
    const existing = new Map(
      todayRecords
        .filter((r) => typeof r.student !== "string" && r.student !== null)
        .map((r) => [
          (r.student as { _id: string })._id,
          { status: r.status, remarks: r.remarks ?? "" } satisfies MarkerDraft,
        ]),
    );
    setMarker(
      Object.fromEntries(
        roster.map((s) => [
          s._id,
          existing.get(s._id) ?? defaultDraft(),
        ]),
      ),
    );
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey, rosterData, todayRecordsData]);

  const [bulkMarkAttendance, { isLoading: submitting }] =
    useBulkMarkAttendanceMutation();

  const statusCounts = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Excused: 0,
    };
    for (const s of roster) {
      counts[marker[s._id]?.status ?? "Present"] += 1;
    }
    return counts;
  }, [roster, marker]);

  const canSubmit =
    Boolean(classId && session && semester && date) && roster.length > 0;

  const submitMarker = () => {
    void (async () => {
      setSubmitError(null);
      setNotice(null);
      try {
        await bulkMarkAttendance({
          academicClass: classId,
          academicSession: session,
          academicSemester: semester,
          date,
          records: roster.map((s) => ({
            student: s._id,
            status: marker[s._id]?.status ?? "Present",
            remarks: marker[s._id]?.remarks || "",
          })),
        }).unwrap();
        setNotice(
          `Attendance saved for ${roster.length} student${
            roster.length === 1 ? "" : "s"
          } on ${fmtDate(date)}.`,
        );
      } catch (err) {
        setSubmitError(getApiErrorMessage(err, "Could not save attendance."));
      }
    })();
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) =>
    setMarker((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? defaultDraft()), status },
    }));

  const setStudentRemarks = (studentId: string, remarks: string) =>
    setMarker((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? defaultDraft()), remarks },
    }));

  const markAll = (status: AttendanceStatus) =>
    setMarker((prev) => {
      const next: MarkerState = {};
      for (const s of roster) {
        next[s._id] = { ...(prev[s._id] ?? defaultDraft()), status };
      }
      return next;
    });

  return (
    <div className="space-y-6">
      <Card
        title="Mark daily attendance"
        description="Future dates cannot be marked — attendance is recorded per UTC-normalized day."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Academic session">
            {(aria) => (
              <Select
                {...aria}
                value={session}
                onChange={(e) => {
                  setSession(e.target.value);
                  setSemester("");
                }}
              >
                <option value="">Select session…</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                    {s.isCurrent ? " (current)" : ""}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="Semester">
            {(aria) => (
              <Select
                {...aria}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                disabled={!session}
              >
                <option value="">Select semester…</option>
                {semesters.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="Class">
            {(aria) => (
              <Select
                {...aria}
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Select class…</option>
                {(classesData?.data ?? []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {classLabel(c)}
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
        </div>

        {submitError && (
          <Alert
            tone="error"
            title="Could not save attendance"
            className="mt-4"
            onDismiss={() => setSubmitError(null)}
          >
            {submitError}
          </Alert>
        )}

        {notice && (
          <Alert
            tone="success"
            title="Attendance saved"
            className="mt-4"
            onDismiss={() => setNotice(null)}
          >
            {notice}
          </Alert>
        )}

        <div className="mt-4">
          {rosterError && (
            <Alert tone="error" title="Could not load the class roster">
              Check your access to this class and try again.
            </Alert>
          )}

          {classId && rosterLoading && todayLoading ? (
            <div className="space-y-3" role="status" aria-live="polite">
              <span className="sr-only">Loading roster…</span>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 p-3"
                >
                  <span className="h-3 w-40 animate-pulse rounded bg-ink-100" />
                  <span className="h-7 w-64 animate-pulse rounded bg-ink-100" />
                </div>
              ))}
            </div>
          ) : classId && roster.length === 0 ? (
            <Alert tone="warning" title="No students in this class">
              No active students are assigned to this class for the selected
              session. Enroll students before marking attendance.
            </Alert>
          ) : classId && roster.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-500">
                  <span className="font-medium text-ink-800">{roster.length}</span>{" "}
                  students · Present {statusCounts.Present} · Absent{" "}
                  {statusCounts.Absent} · Late {statusCounts.Late} · Excused{" "}
                  {statusCounts.Excused}
                  {todayRecords.length > 0 &&
                    ` · ${todayRecords.length} already recorded for this date`}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAll("Present")}
                  >
                    Mark all Present
                  </Button>
                  <Button
                    size="sm"
                    onClick={submitMarker}
                    loading={submitting}
                    disabled={!canSubmit}
                    icon={<ClipboardList className="size-4" aria-hidden />}
                  >
                    Save attendance
                  </Button>
                </div>
              </div>

              <ul className="divide-y divide-ink-100">
                {roster.map((student) => {
                  const draft = marker[student._id] ?? defaultDraft();
                  return (
                    <li key={student._id} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-40">
                          <p className="text-sm font-medium text-ink-900">
                            {rosterName(student)}
                          </p>
                          {student.registrationNumber && (
                            <p className="font-mono text-xs text-ink-500">
                              {student.registrationNumber}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <fieldset className="m-0 flex gap-1.5 border-0 p-0">
                            <legend className="sr-only">
                              Attendance status for {rosterName(student)}
                            </legend>
                            {ATTENDANCE_STATUSES.map((st) => {
                              const checked = draft.status === st;
                              return (
                                <label
                                  key={st}
                                  className={cn(
                                    "cursor-pointer select-none rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-600",
                                    checked
                                      ? selectStyles[st]
                                      : "border-ink-200 bg-white text-ink-600 hover:border-primary-300 hover:text-primary-800",
                                  )}
                                >
                                  <input
                                    type="radio"
                                    className="sr-only"
                                    name={`status-${student._id}`}
                                    value={st}
                                    checked={checked}
                                    onChange={() =>
                                      setStudentStatus(student._id, st)
                                    }
                                  />
                                  {st}
                                </label>
                              );
                            })}
                          </fieldset>
                          <Input
                            type="text"
                            aria-label={`Remarks for ${rosterName(student)}`}
                            placeholder="Remarks (optional)"
                            className="max-w-48"
                            value={draft.remarks}
                            onChange={(e) =>
                              setStudentRemarks(student._id, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex justify-end">
                <Button
                  onClick={submitMarker}
                  loading={submitting}
                  disabled={!canSubmit}
                  icon={<ClipboardList className="size-4" aria-hidden />}
                >
                  Save attendance
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-500">
              Select an academic session, semester, class and date to load the
              roster. Every student defaults to Present.
            </p>
          )}
        </div>
      </Card>

      <AttendanceHistoryCard
        classOptions={(classesData?.data ?? []) as AcademicClass[]}
      />
    </div>
  );
}

function AttendanceHistoryCard({
  classOptions,
}: {
  classOptions: AcademicClass[];
}) {
  const [page, setPage] = useState(1);
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<AttendanceStatus | "">("");
  const [student, setStudent] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: null,
    dir: "asc",
  });

  const { data: rosterData } = useGetClassRosterQuery(
    { academicClass: classId },
    { skip: !classId },
  );
  const classRoster = rosterData?.data ?? [];

  const { data, isLoading, isError, error, refetch } = useGetClassAttendanceQuery(
    {
      academicClass: classId,
      page,
      limit: HISTORY_PAGE_SIZE,
      status: status || undefined,
      student: student || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    { skip: !classId },
  );

  const { data: summaryData, isLoading: summaryLoading } =
    useGetClassAttendanceSummaryQuery(
      {
        academicClass: classId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      },
      { skip: !classId },
    );

  const records = data?.data;
  const pagination = data?.pagination;
  const summary: ClassAttendanceSummary | undefined =
    summaryData?.data ?? data?.summary;

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

  const columns: Column<AttendanceRecord>[] = useMemo(
    () => [
      {
        key: "student",
        header: "Student",
        sortValue: (r) =>
          typeof r.student === "object" && r.student !== null
            ? rosterName(r.student)
            : "",
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-medium text-ink-900">{rosterName(r.student)}</span>
            {typeof r.student === "object" &&
              r.student !== null &&
              r.student.registrationNumber && (
                <span className="font-mono text-xs text-ink-500">
                  {r.student.registrationNumber}
                </span>
              )}
          </div>
        ),
      },
      {
        key: "class",
        header: "Class",
        render: (r) => (r.academicClass ? classLabel(r.academicClass) : "—"),
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
        key: "remarks",
        header: "Remarks",
        render: (r) => r.remarks || "—",
      },
      {
        key: "markedBy",
        header: "Marked by",
        render: (r) => refName(r.markedBy ?? null) || "—",
      },
    ],
    [],
  );

  const mobileCard = (r: AttendanceRecord) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink-900">{rosterName(r.student)}</p>
          <p className="text-xs text-ink-500">
            {r.academicClass ? classLabel(r.academicClass) : "—"}
          </p>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-ink-500">Date</dt>
        <dd className="text-ink-800">{fmtDate(r.date)}</dd>
        <dt className="text-ink-500">Remarks</dt>
        <dd className="text-ink-800">{r.remarks || "—"}</dd>
        <dt className="text-ink-500">Marked by</dt>
        <dd className="text-ink-800">{refName(r.markedBy ?? null) || "—"}</dd>
      </dl>
    </div>
  );

  return (
    <div className="space-y-4">
      {classId && (summaryLoading || summary) && (
        <StatGrid cols={4}>
          <StatCard
            label="Present"
            value={summary?.present ?? "—"}
            icon={<Users className="size-4" aria-hidden />}
            tone="primary"
            loading={summaryLoading}
          />
          <StatCard
            label="Absent"
            value={summary?.absent ?? "—"}
            tone="danger"
            loading={summaryLoading}
          />
          <StatCard
            label="Late"
            value={summary?.late ?? "—"}
            tone="warning"
            loading={summaryLoading}
          />
          <StatCard
            label="Attendance rate"
            value={
              summary?.attendanceRate !== undefined
                ? `${summary.attendanceRate}%`
                : "—"
            }
            sub={
              summary?.total !== undefined ? `${summary.total} records` : undefined
            }
            icon={<CalendarDays className="size-4" aria-hidden />}
            tone="gold"
            loading={summaryLoading}
          />
        </StatGrid>
      )}

      <Card
        title="Attendance history"
        description="Filter recorded attendance for a class by date range, student and status."
      >
        <div className="grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <FormField label="Class">
            {(aria) => (
              <Select
                {...aria}
                value={classId}
                onChange={(e) =>
                  filtersChanged(() => {
                    setClassId(e.target.value);
                    setStudent("");
                  })
                }
              >
                <option value="">Select class…</option>
                {classOptions.map((c) => (
                  <option key={c._id} value={c._id}>
                    {classLabel(c)}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="Status">
            {(aria) => (
              <Select
                {...aria}
                value={status}
                onChange={(e) =>
                  filtersChanged(() =>
                    setStatus(e.target.value as AttendanceStatus | ""),
                  )
                }
              >
                <option value="">All statuses</option>
                {ATTENDANCE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="Student">
            {(aria) => (
              <Select
                {...aria}
                value={student}
                onChange={(e) => filtersChanged(() => setStudent(e.target.value))}
                disabled={!classId}
              >
                <option value="">All students</option>
                {classRoster.map((s) => (
                  <option key={s._id} value={s._id}>
                    {rosterName(s)}
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
                value={dateFrom}
                max={localISODate()}
                onChange={(e) => filtersChanged(() => setDateFrom(e.target.value))}
              />
            )}
          </FormField>

          <FormField label="To">
            {(aria) => (
              <Input
                {...aria}
                type="date"
                value={dateTo}
                max={localISODate()}
                onChange={(e) => filtersChanged(() => setDateTo(e.target.value))}
              />
            )}
          </FormField>
        </div>

        {isError && (
          <Alert tone="error" title="Could not load attendance records" className="p-4">
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
          emptyTitle="No attendance recorded for this class yet"
          emptyDescription={
            classId
              ? "Select a date range above or record attendance using the marker."
              : "Choose a class to review its recorded attendance."
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
    </div>
  );
}

// ======================================================
// Student / parent read-only view
// ======================================================

function AttendanceHistoryForMe({ role }: { role: "student" | "parent" }) {
  const selfStudentId = useAppSelector(
    (state) => selectCurrentUser(state)?.student ?? null,
  );

  const { data: childrenData } = useListMyChildrenQuery(undefined, {
    skip: role !== "parent",
  });
  const children = childrenData?.data ?? [];

  const [childId, setChildId] = useState("");
  const targetStudentId = role === "student" ? selfStudentId : childId;

  const { data, isLoading, isError, error, refetch } = useGetStudentAttendanceQuery(
    { studentId: targetStudentId ?? "" },
    { skip: !targetStudentId },
  );

  const records = data?.data ?? [];

  useEffect(() => {
    if (role === "parent" && !childId && children.length > 0) {
      setChildId(children[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData]);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "date",
      header: "Date",
      sortValue: (r) => r.date,
      render: (r) => fmtDate(r.date),
    },
    {
      key: "class",
      header: "Class",
      render: (r) => (r.academicClass ? classLabel(r.academicClass) : "—"),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (r) => r.remarks || "—",
    },
  ];

  if (role === "parent" && childrenData && children.length === 0) {
    return (
      <Card title="My children">
        <Alert tone="info">No linked children found on your account.</Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {role === "parent" && children.length > 0 && (
        <Card title="Select child">
          <FormField label="Child">
            {(aria) => (
              <Select
                {...aria}
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
              >
                {children.map((c) => (
                  <option key={c._id} value={c._id}>
                    {rosterName(c)}
                    {c.registrationNumber ? ` (${c.registrationNumber})` : ""}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </Card>
      )}

      <Card
        title={role === "student" ? "My attendance" : "Child attendance"}
        description="Attendance records visible to you and your linked parents."
      >
        {isError && (
          <Alert tone="error" title="Could not load attendance" className="mb-4">
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
          emptyTitle="No attendance records yet"
          emptyDescription="Attendance will appear here once your class teacher records it."
          mobileCard={(r) => (
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-ink-900">{fmtDate(r.date)}</p>
                <p className="text-xs text-ink-500">
                  {r.academicClass ? classLabel(r.academicClass) : "—"}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          )}
          rowKey={(r) => r._id}
        />
      </Card>
    </div>
  );
}
