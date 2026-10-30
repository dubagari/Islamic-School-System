import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, PencilLine, Users } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { InputField, SelectField, TextareaField } from "@/components/ui/Fields";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";

import {
  ATTENDANCE_STATUSES,
  attendanceCount,
  fmtRate,
  getApiErrorMessage,
  studentName,
  useBulkMarkAttendanceMutation,
  useGetAcademicSemestersQuery,
  useGetAcademicSessionsQuery,
  useGetClassAttendanceQuery,
  useGetClassAttendanceSummaryQuery,
  useGetMyClassesQuery,
  useUpdateAttendanceRecordMutation,
  type AttendanceRecord,
  type AttendanceStatus,
  type BulkAttendancePayload,
  type StudentRefLite,
} from "@/features/teacher/api";

const PAGE_SIZE = 10;

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function pickDefault<
  T extends { _id: string; isCurrent?: boolean; isActive?: boolean },
>(items: T[] | undefined): string {
  if (!items || items.length === 0) return "";
  const current =
    items.find((item) => item.isCurrent) ?? items.find((item) => item.isActive);
  return (current ?? items[0])._id;
}

export function ClassAttendancePage() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("class") ?? "";

  const myClassesQ = useGetMyClassesQuery();
  const sessionsQ = useGetAcademicSessionsQuery();
  const semestersQ = useGetAcademicSemestersQuery();

  const myClasses = myClassesQ.data?.data ?? [];

  const [classId, setClassId] = useState(preselected);
  const [sessionId, setSessionId] = useState("");
  const [semesterId, setSemesterId] = useState(searchParams.get("semester") ?? "");
  const [date, setDate] = useState(todayIso());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [markOpen, setMarkOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    if (preselected && preselected !== classId) {
      setClassId(preselected);
      setPage(1);
    }
  }, [preselected, classId]);

  useEffect(() => {
    if (semesterId === "") {
      setSemesterId(pickDefault(semestersQ.data?.data));
    }
  }, [semestersQ.data, semesterId]);

  useEffect(() => {
    if (sessionId === "") {
      setSessionId(pickDefault(sessionsQ.data?.data));
    }
  }, [sessionsQ.data, sessionId]);

  const records = useGetClassAttendanceQuery(
    {
      academicClass: classId,
      date: date || undefined,
      from: from || undefined,
      to: to || undefined,
      academicSession: sessionId || undefined,
      academicSemester: semesterId || undefined,
      page,
      limit: PAGE_SIZE,
    },
    { skip: !classId },
  );

  const recordsList = records.data?.data ?? [];
  const summary = records.data?.summary;

  const [bulkMark, { isLoading: marking }] = useBulkMarkAttendanceMutation();
  const [updateRecord, { isLoading: updating }] = useUpdateAttendanceRecordMutation();

  const submitEdit = (record: AttendanceRecord, status: AttendanceStatus, remarks: string) => {
    void (async () => {
      setBannerError(null);
      try {
        await updateRecord({ id: record._id, status, remarks: remarks.trim() || undefined }).unwrap();
        setEditing(null);
        setNotice("Attendance record updated.");
      } catch (err) {
        setBannerError(getApiErrorMessage(err));
      }
    })();
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "date",
      header: "Date",
      sortValue: (record) => record.date,
      render: (record) => fmtDay(record.date),
    },
    {
      key: "student",
      header: "Student",
      sortValue: (record) => studentName(record.student),
      render: (record) => (
        <span className="font-medium text-ink-900">{studentName(record.student)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (record) => record.status,
      render: (record) => <StatusBadge status={record.status} />,
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (record) => record.remarks ?? "—",
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (record) => (
        <Button
          size="sm"
          variant="outline"
          icon={<PencilLine className="size-3.5" aria-hidden />}
          onClick={() => setEditing(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Class attendance"
        description="Pick a class you teach, then mark daily attendance for its students."
        actions={
          <Button
            icon={<Users className="size-4" aria-hidden />}
            disabled={!classId}
            onClick={() => setMarkOpen(true)}
          >
            Mark attendance
          </Button>
        }
      />

      {bannerError && (
        <Alert tone="error" className="mb-4" onDismiss={() => setBannerError(null)}>
          {bannerError}
        </Alert>
      )}

      {notice && (
        <Alert tone="success" className="mb-4" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Class"
            required
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Select class…</option>
            {myClasses.map((row) => (
              <option key={row.assignmentId} value={row.class._id}>
                {row.class.name} — {row.subject.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Academic session"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          >
            <option value="">All sessions</option>
            {(sessionsQ.data?.data ?? []).map((session) => (
              <option key={session._id} value={session._id}>
                {session.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Semester"
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
          >
            <option value="">All semesters</option>
            {(semestersQ.data?.data ?? []).map((semester) => (
              <option key={semester._id} value={semester._id}>
                {semester.name}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
          <InputField
            label="From"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <InputField
            label="To"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {summary && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="success">Present {attendanceCount(summary, "Present") ?? 0}</Badge>
          <Badge tone="danger">Absent {attendanceCount(summary, "Absent") ?? 0}</Badge>
          <Badge tone="warning">Late {attendanceCount(summary, "Late") ?? 0}</Badge>
          <Badge tone="info">Excused {attendanceCount(summary, "Excused") ?? 0}</Badge>
          {summary.total !== undefined && <Badge tone="neutral">Total {summary.total}</Badge>}
          <Badge tone="gold">Rate {fmtRate(summary.attendanceRate)}</Badge>
        </div>
      )}

      {records.isError && (
        <Alert tone="error" title="Could not load attendance" className="mb-4">
          {getApiErrorMessage(records.error)}
        </Alert>
      )}

      <Card padded={false}>
        <DataTable
          columns={columns}
          data={recordsList}
          isLoading={records.isLoading}
          emptyTitle={classId ? "No attendance records" : "No class selected"}
          emptyDescription={
            classId
              ? "Nothing recorded yet for this selection — use “Mark attendance” to record today."
              : "Pick a class above to view its attendance."
          }
          emptyAction={
            classId ? (
              <Button onClick={() => setMarkOpen(true)}>Mark attendance</Button>
            ) : undefined
          }
          rowKey={(record) => record._id}
          mobileCard={(record) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-ink-900">{studentName(record.student)}</p>
                <StatusBadge status={record.status} />
              </div>
              <p className="text-xs text-ink-500">
                {fmtDay(record.date)} · Remarks: {record.remarks ?? "—"}
              </p>
              <Button
                size="sm"
                variant="outline"
                icon={<PencilLine className="size-3.5" aria-hidden />}
                onClick={() => setEditing(record)}
              >
                Edit
              </Button>
            </div>
          )}
        />
        <PagedFooter pagination={records.data?.pagination} onPageChange={setPage} />
      </Card>

      {markOpen && (
        <MarkAttendanceDialog
          classId={classId}
          sessionId={sessionId || undefined}
          semesterId={semesterId || undefined}
          date={date}
          marking={marking}
          onClose={() => setMarkOpen(false)}
          onSubmit={async (payload) => {
            try {
              const result = await bulkMark(payload).unwrap();
              setMarkOpen(false);
              setNotice(
                `Attendance saved for ${fmtDay(result.data.date ?? payload.date)}${result.data.summary?.total !== undefined ? ` — ${result.data.summary.total} students` : ""}.` +
                  " Absent students and their parents have been notified.",
              );
            } catch (err) {
              setBannerError(getApiErrorMessage(err));
            }
          }}
        />
      )}

      {editing && (
        <EditAttendanceDialog
          record={editing}
          loading={updating}
          onClose={() => setEditing(null)}
          onSubmit={submitEdit}
        />
      )}
    </div>
  );
}

function fmtDay(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function MarkAttendanceDialog({
  classId,
  sessionId,
  semesterId,
  date,
  marking,
  onClose,
  onSubmit,
}: {
  classId: string;
  sessionId: string | undefined;
  semesterId: string | undefined;
  date: string;
  marking: boolean;
  onClose: () => void;
  onSubmit: (payload: BulkAttendancePayload) => Promise<void>;
}) {
  const summary = useGetClassAttendanceSummaryQuery(
    { academicClass: classId, academicSession: sessionId, academicSemester: semesterId },
    { skip: !classId },
  );

  const students = summary.data?.data ?? [];
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Mark attendance"
      description={`Recording for ${fmtDay(date)}${semesterId ? "" : " — no semester selected, showing all semesters"}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={marking}>
            Cancel
          </Button>
          <Button
            loading={marking}
            disabled={students.length === 0}
            icon={<CheckCircle2 className="size-4" aria-hidden />}
            onClick={() =>
              void onSubmit({
                academicClass: classId,
                academicSession: sessionId,
                academicSemester: semesterId,
                date,
                records: students.map((entry) => ({
                  student: refStudentId(entry.student),
                  status: marks[refStudentId(entry.student)] ?? "Present",
                })),
              })
            }
          >
            Save attendance
          </Button>
        </>
      }
    >
      {summary.isError ? (
        <Alert tone="error" title="Could not load students">
          {getApiErrorMessage(summary.error)}
        </Alert>
      ) : summary.isLoading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <span className="sr-only">Loading students…</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-ink-100" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <Alert tone="info">
          No students found for this class and semester. Confirm the class has
          enrolments for the selected session.
        </Alert>
      ) : (
        <div className="space-y-2">
          {students.map((entry) => {
            const studentId = refStudentId(entry.student);
            return (
              <div
                key={studentId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-100 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {studentName(entry.student)}
                  </p>
                  <p className="text-xs text-ink-500">
                    Present {entry.present} · Absent {entry.absent} · Late {entry.late}
                  </p>
                </div>
                <select
                  className="block rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  aria-label={`Status for ${studentName(entry.student)}`}
                  value={marks[studentId] ?? "Present"}
                  onChange={(e) =>
                    setMarks((prev) => ({
                      ...prev,
                      [studentId]: e.target.value as AttendanceStatus,
                    }))
                  }
                >
                  {ATTENDANCE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}

function refStudentId(value: StudentRefLite | string): string {
  return typeof value === "string" ? value : value._id;
}

function EditAttendanceDialog({
  record,
  loading,
  onClose,
  onSubmit,
}: {
  record: AttendanceRecord;
  loading: boolean;
  onClose: () => void;
  onSubmit: (record: AttendanceRecord, status: AttendanceStatus, remarks: string) => void;
}) {
  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [remarks, setRemarks] = useState(record.remarks ?? "");

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit attendance record"
      description={`${studentName(record.student)} · ${fmtDay(record.date)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button loading={loading} onClick={() => onSubmit(record, status, remarks)}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField
          label="Status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
        >
          {["Present", "Absent", "Late", "Excused", "Leave"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <TextareaField
          label="Remarks"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>
    </Dialog>
  );
}
