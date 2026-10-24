import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import {
  FormField,
  InputField,
  Select,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  RECORD_TYPES,
  classLabel,
  isPopulated,
  refName,
  studentFullName,
  useCreateStudentRecordMutation,
  useGetAcademicClassesQuery,
  useGetAcademicSessionsQuery,
  useGetAcademicSemestersQuery,
  useGetStudentRecordQuery,
  useGetStudentsQuery,
  useGetStudentRecordsQuery,
  type RecordType,
  type Student,
  type StudentRecord,
} from "@/features/students/api";

const PAGE_SIZE = 20;
const PROMOTION_TRANSFER: RecordType[] = ["Promotion", "Transfer"];

const todayISO = () => new Date().toISOString().slice(0, 10);

type RecordTone = "success" | "warning" | "danger" | "info" | "neutral" | "gold";

function recordTypeTone(recordType: string): RecordTone {
  switch (recordType) {
    case "Promotion":
    case "Graduation":
      return "success";
    case "Suspension":
      return "warning";
    case "Withdrawal":
      return "danger";
    case "Transfer":
    case "Disciplinary":
      return "info";
    default:
      return "neutral";
  }
}

export function StudentRecordsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState<RecordType | "">("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: null,
    dir: "asc",
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentRecordsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    recordType: recordType || undefined,
    academicSession: sessionFilter || undefined,
    academicClass: classFilter || undefined,
  });

  const { data: sessionsData } = useGetAcademicSessionsQuery();
  const { data: classesData } = useGetAcademicClassesQuery();
  const { data: studentsData } = useGetStudentsQuery({ limit: 200 });

  const sessions = sessionsData?.data ?? [];
  const classes = classesData?.data ?? [];
  const students = studentsData?.data ?? [];

  const records = data?.data;
  const pagination = data?.pagination;

  const [createStudentRecord, { isLoading: creating }] =
    useCreateStudentRecordMutation();

  const columns: Column<StudentRecord>[] = useMemo(
    () => [
      {
        key: "recordType",
        header: "Type",
        sortValue: (r) => r.recordType,
        render: (r) => (
          <Badge tone={recordTypeTone(r.recordType)}>{r.recordType}</Badge>
        ),
      },
      {
        key: "recordDate",
        header: "Date",
        sortValue: (r) => r.recordDate,
        render: (r) => fmtDate(r.recordDate),
      },
      {
        key: "student",
        header: "Student",
        sortValue: (r) => studentFullName(r.student),
        render: (r) =>
          isPopulated(r.student) ? (
            <div className="flex flex-col">
              <Link
                to={`/students/${r.student._id}`}
                onClick={(ev) => ev.stopPropagation()}
                className="font-medium text-primary-700 hover:underline"
              >
                {studentFullName(r.student)}
              </Link>
              <span className="font-mono text-xs text-ink-500">
                {r.student.registrationNumber}
              </span>
            </div>
          ) : (
            "—"
          ),
      },
      {
        key: "title",
        header: "Title",
        sortValue: (r) => r.title,
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-medium text-ink-900">{r.title || "—"}</span>
            {r.description && (
              <span className="max-w-xs truncate text-xs text-ink-500">
                {r.description}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "isActive",
        header: "Active",
        align: "center",
        render: (r) =>
          r.isActive ? (
            <Badge tone="success">Yes</Badge>
          ) : (
            <Badge tone="neutral">No</Badge>
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (r) => (
          <Button
            size="sm"
            variant="outline"
            onClick={(ev) => {
              ev.stopPropagation();
              setViewing(r._id);
            }}
          >
            Details
          </Button>
        ),
      },
    ],
    [],
  );

  const mobileCard = (r: StudentRecord) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ink-900">{r.title || "—"}</p>
        <Badge tone={recordTypeTone(r.recordType)}>{r.recordType}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-ink-500">Student</dt>
        <dd className="text-ink-800">
          {isPopulated(r.student) ? studentFullName(r.student) : "—"}
        </dd>
        <dt className="text-ink-500">Reg #</dt>
        <dd className="font-mono text-ink-800">
          {isPopulated(r.student) ? r.student.registrationNumber : "—"}
        </dd>
        <dt className="text-ink-500">Session</dt>
        <dd className="text-ink-800">{refName(r.academicSession)}</dd>
        <dt className="text-ink-500">Semester</dt>
        <dd className="text-ink-800">{refName(r.academicSemester)}</dd>
        <dt className="text-ink-500">Class</dt>
        <dd className="text-ink-800">{refName(classLabel(r.academicClass))}</dd>
        <dt className="text-ink-500">Date</dt>
        <dd className="text-ink-800">{fmtDate(r.recordDate)}</dd>
      </dl>
      {r.description && (
        <p className="text-xs text-ink-600">{r.description}</p>
      )}
      <Button size="sm" variant="outline" className="self-start" onClick={() => setViewing(r._id)}>
        Details
      </Button>
    </div>
  );

  const changeSearch = (value: string) => {
    setSearchInput(value);
    window.clearTimeout(
      (window as unknown as { __recordsSearchTimer?: number }).__recordsSearchTimer,
    );
    (window as unknown as { __recordsSearchTimer?: number }).__recordsSearchTimer =
      window.setTimeout(() => {
        setSearch(value);
        setPage(1);
      }, 400);
  };

  const onSortChange = (key: string | null) => {
    setSort((prev) =>
      prev.key === key
        ? key
          ? { key, dir: "desc" }
          : { key: null, dir: "asc" }
        : { key, dir: "asc" },
    );
  };

  return (
    <div>
      <PageHeader
        title="Student records"
        description="Promotions, transfers, withdrawals, suspensions, graduations and disciplinary records."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
          >
            New record
          </Button>
        }
      />

      {isError && (
        <Alert tone="error" title="Could not load student records" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{(error as Error | undefined)?.message ?? "Request failed."}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {notice && (
        <Alert
          tone="success"
          title="Record created"
          className="mb-4"
          onDismiss={() => setNotice(null)}
        >
          {notice}
        </Alert>
      )}

      {createError && (
        <Alert
          tone="error"
          title="Record creation failed"
          className="mb-4"
          onDismiss={() => setCreateError(null)}
        >
          {createError}
        </Alert>
      )}

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end">
          <div className="w-full lg:max-w-xs">
            <InputField
              label="Search"
              placeholder="Title or description…"
              value={searchInput}
              onChange={(e) => changeSearch(e.target.value)}
            />
          </div>
          <FormField label="Record type" className="w-full lg:w-44">
            {(aria) => (
              <Select
                {...aria}
                value={recordType}
                onChange={(e) => {
                  setRecordType(e.target.value as RecordType | "");
                  setPage(1);
                }}
              >
                <option value="">All types</option>
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Session" className="w-full lg:w-44">
            {(aria) => (
              <Select
                {...aria}
                value={sessionFilter}
                onChange={(e) => {
                  setSessionFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All sessions</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                    {s.isCurrent ? " (current)" : ""}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Class" className="w-full lg:w-44">
            {(aria) => (
              <Select
                {...aria}
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <Button
            variant="ghost"
            size="sm"
            className="lg:mb-1"
            icon={<Search className="size-3.5" aria-hidden />}
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setRecordType("");
              setSessionFilter("");
              setClassFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={records}
          isLoading={isLoading}
          emptyTitle="No student records found"
          emptyDescription={
            search || recordType || sessionFilter || classFilter
              ? "Try adjusting or clearing the filters."
              : "No records have been created yet."
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

      <CreateRecordDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        students={students}
        sessions={sessions}
        classes={classes}
        creating={creating}
        onCreated={(message) => {
          setCreateOpen(false);
          setNotice(message);
        }}
        onError={setCreateError}
        onCreate={async (body) => {
          await createStudentRecord(body).unwrap();
          return "Student record created successfully.";
        }}
      />

      <RecordDetailDialog id={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

const EMPTY_CREATE = {
  student: "",
  academicSession: "",
  academicSemester: "",
  academicClass: "",
  recordType: "General" as RecordType,
  title: "",
  description: "",
  previousClass: "",
  newClass: "",
  recordDate: todayISO(),
};

function CreateRecordDialog({
  open,
  onClose,
  students,
  sessions,
  classes,
  creating,
  onCreate,
  onCreated,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  students: Student[];
  sessions: { _id: string; name: string; isCurrent: boolean }[];
  classes: { _id: string; name: string }[];
  creating: boolean;
  onCreate: (
    body: Parameters<ReturnType<typeof useCreateStudentRecordMutation>[0]>[0],
  ) => Promise<string>;
  onCreated: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_CREATE });

  const { data: semestersData } = useGetAcademicSemestersQuery(
    form.academicSession ? { academicSession: form.academicSession } : undefined,
    { skip: !open },
  );
  const semesters = (semestersData?.data ?? []).filter(
    (s) => !form.academicSession || refId(s.academicSession) === form.academicSession,
  );

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const showClassChange = PROMOTION_TRANSFER.includes(form.recordType);

  const valid =
    form.student &&
    form.academicSession &&
    form.academicSemester &&
    form.academicClass &&
    form.title;

  const submit = () => {
    void (async () => {
      onError(null);
      try {
        const message = await onCreate({
          student: form.student,
          academicSession: form.academicSession,
          academicSemester: form.academicSemester,
          academicClass: form.academicClass,
          recordType: form.recordType,
          title: form.title,
          description: form.description || undefined,
          previousClass: showClassChange && form.previousClass ? form.previousClass : undefined,
          newClass: showClassChange && form.newClass ? form.newClass : undefined,
          recordDate: form.recordDate || undefined,
        });
        setForm({ ...EMPTY_CREATE });
        onCreated(message);
      } catch (err) {
        onError((err as Error | undefined)?.message ?? "Could not create the record.");
      }
    })();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create student record"
      description="Record a promotion, transfer, withdrawal, suspension, graduation or disciplinary note."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={submit} loading={creating} disabled={!valid}>
            Create record
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField
          label="Record type"
          required
          value={form.recordType}
          onChange={(e) => set({ recordType: e.target.value as RecordType })}
        >
          {RECORD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Student"
          required
          value={form.student}
          onChange={(e) => set({ student: e.target.value })}
        >
          <option value="">Select student…</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {studentFullName(s)} ({s.registrationNumber})
            </option>
          ))}
        </SelectField>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Session"
            required
            value={form.academicSession}
            onChange={(e) =>
              set({ academicSession: e.target.value, academicSemester: "" })
            }
          >
            <option value="">Select…</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Semester"
            required
            value={form.academicSemester}
            onChange={(e) => set({ academicSemester: e.target.value })}
          >
            <option value="">Select…</option>
            {semesters.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Class"
            required
            value={form.academicClass}
            onChange={(e) => set({ academicClass: e.target.value })}
          >
            <option value="">Select…</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </div>

        {showClassChange && (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Previous class"
              hint="Used for promotion and transfer records"
              value={form.previousClass}
              onChange={(e) => set({ previousClass: e.target.value })}
            >
              <option value="">None</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="New class"
              hint="Used for promotion and transfer records"
              value={form.newClass}
              onChange={(e) => set({ newClass: e.target.value })}
            >
              <option value="">None</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          </div>
        )}

        <InputField
          label="Title"
          required
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. Promotion to JSS 2"
        />

        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional details…"
        />

        <InputField
          label="Record date"
          type="date"
          value={form.recordDate}
          onChange={(e) => set({ recordDate: e.target.value })}
        />
      </div>
    </Dialog>
  );
}

function refId(value: { _id: string } | string | null | undefined): string {
  return isPopulated(value) ? value._id : "";
}

function RecordDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isLoading, isError, error } = useGetStudentRecordsDetail(id);
  const record = data?.data;

  return (
    <Dialog
      open={id !== null}
      onClose={onClose}
      title="Record details"
      size="md"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {isError ? (
        <Alert tone="error" title="Could not load record">
          {(error as Error | undefined)?.message ?? "Request failed."}
        </Alert>
      ) : isLoading || !record ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-full animate-pulse rounded bg-ink-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <DetailItem
            label="Type"
            value={<Badge tone={recordTypeTone(record.recordType)}>{record.recordType}</Badge>}
          />
          <DetailItem label="Title" value={record.title || "—"} />
          <DetailItem label="Description" value={record.description || "—"} />
          <DetailItem
            label="Student"
            value={
              isPopulated(record.student)
                ? `${studentFullName(record.student)} (${record.student.registrationNumber})`
                : "—"
            }
          />
          <DetailItem label="Session" value={refName(record.academicSession)} />
          <DetailItem label="Semester" value={refName(record.academicSemester)} />
          <DetailItem
            label="Class"
            value={refName(classLabel(record.academicClass))}
          />
          {record.previousClass && (
            <DetailItem
              label="Previous class"
              value={refName(classLabel(record.previousClass))}
            />
          )}
          {record.newClass && (
            <DetailItem
              label="New class"
              value={refName(classLabel(record.newClass))}
            />
          )}
          <DetailItem
            label="Recorded by"
            value={
              isPopulated(record.recordedBy)
                ? (record.recordedBy as { fullName?: string }).fullName ?? "—"
                : "—"
            }
          />
          <DetailItem label="Record date" value={fmtDate(record.recordDate)} />
          <DetailItem label="Active" value={record.isActive ? "Yes" : "No"} />
        </div>
      )}
    </Dialog>
  );
}

function useGetStudentRecordsDetail(id: string | null) {
  return useGetStudentRecordQuery(id ?? "", { skip: !id });
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink-50 py-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <span className="text-sm text-ink-900">{value ?? "—"}</span>
    </div>
  );
}
