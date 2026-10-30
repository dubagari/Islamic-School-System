import { useMemo, useState } from "react";
import { Award, CalendarCheck, RefreshCw, UserPlus, Wallet } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import { InputField, SelectField } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  extractListOptions,
  extractReportRows,
  formatCellValue,
  getApiErrorMessage,
  prettifyKey,
  useGetAcademicsReportQuery,
  useGetAttendanceReportQuery,
  useGetEnrollmentReportQuery,
  useGetFinanceReportQuery,
  useListReportClassesQuery,
  useListReportLevelsQuery,
  useListReportSessionsQuery,
  useListReportSemestersQuery,
} from "@/features/reports/api";

type ReportType = "enrollment" | "attendance" | "academic" | "finance";

const REPORT_TYPES: { id: ReportType; label: string; icon: typeof UserPlus }[] = [
  { id: "enrollment", label: "Enrollment", icon: UserPlus },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "academic", label: "Academic", icon: Award },
  { id: "finance", label: "Finance", icon: Wallet },
];

type Filters = {
  academicSession: string;
  academicSemester: string;
  academicClass: string;
  academicLevel: string;
  status: string;
  groupBy: string;
  from: string;
  to: string;
  student: string;
  classSubject: string;
  includeUnpublished: string;
};

const INITIAL_FILTERS: Filters = {
  academicSession: "",
  academicSemester: "",
  academicClass: "",
  academicLevel: "",
  status: "",
  groupBy: "",
  from: "",
  to: "",
  student: "",
  classSubject: "",
  includeUnpublished: "",
};

const GROUP_BY_OPTIONS: Record<ReportType, string[]> = {
  // Values straight from API_REFERENCE.md section 12 "Common filters".
  enrollment: ["class", "level", "gender", "status"],
  attendance: ["day", "class", "student", "status"],
  academic: [],
  finance: ["day", "month", "method"],
};

const SHOWS: Record<
  ReportType,
  {
    session: boolean;
    semester: boolean;
    classRef: boolean;
    level: boolean;
    status: boolean;
    groupBy: boolean;
    dateRange: boolean;
    student: boolean;
    classSubject: boolean;
    includeUnpublished: boolean;
  }
> = {
  enrollment: {
    session: true,
    semester: false,
    classRef: true,
    level: true,
    status: true,
    groupBy: true,
    dateRange: false,
    student: false,
    classSubject: false,
    includeUnpublished: false,
  },
  attendance: {
    session: true,
    semester: true,
    classRef: true,
    level: false,
    status: true,
    groupBy: true,
    dateRange: true,
    student: true,
    classSubject: false,
    includeUnpublished: false,
  },
  academic: {
    session: true,
    semester: true,
    classRef: true,
    level: false,
    status: false,
    groupBy: false,
    dateRange: false,
    student: false,
    classSubject: true,
    includeUnpublished: true,
  },
  finance: {
    session: true,
    semester: true,
    classRef: true,
    level: false,
    status: false,
    groupBy: true,
    dateRange: true,
    student: false,
    classSubject: false,
    includeUnpublished: false,
  },
};

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("enrollment");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const setFilter = (patch: Partial<Filters>) =>
    setFilters((previous) => ({ ...previous, ...patch }));

  const sessions = useListReportSessionsQuery();
  const semesters = useListReportSemestersQuery();
  const classes = useListReportClassesQuery();
  const levels = useListReportLevelsQuery();

  const sessionOptions = useMemo(
    () => extractListOptions(sessions.data?.data),
    [sessions.data],
  );
  const semesterOptions = useMemo(
    () => extractListOptions(semesters.data?.data),
    [semesters.data],
  );
  const classOptions = useMemo(
    () => extractListOptions(classes.data?.data),
    [classes.data],
  );
  const levelOptions = useMemo(
    () => extractListOptions(levels.data?.data),
    [levels.data],
  );

  const enrollmentQuery = useGetEnrollmentReportQuery(
    {
      academicSession: filters.academicSession,
      academicClass: filters.academicClass,
      academicLevel: filters.academicLevel,
      status: filters.status,
      groupBy: (filters.groupBy || undefined) as never,
    },
    { skip: reportType !== "enrollment" },
  );
  const attendanceQuery = useGetAttendanceReportQuery(
    {
      from: filters.from,
      to: filters.to,
      academicSession: filters.academicSession,
      academicSemester: filters.academicSemester,
      academicClass: filters.academicClass,
      student: filters.student,
      status: filters.status,
      groupBy: (filters.groupBy || undefined) as never,
    },
    { skip: reportType !== "attendance" },
  );
  const academicsQuery = useGetAcademicsReportQuery(
    {
      academicSession: filters.academicSession,
      academicSemester: filters.academicSemester,
      academicClass: filters.academicClass,
      classSubject: filters.classSubject,
      includeUnpublished: filters.includeUnpublished === "true",
    },
    { skip: reportType !== "academic" },
  );
  const financeQuery = useGetFinanceReportQuery(
    {
      academicSession: filters.academicSession,
      academicSemester: filters.academicSemester,
      academicClass: filters.academicClass,
      from: filters.from,
      to: filters.to,
      groupBy: (filters.groupBy || undefined) as never,
    },
    { skip: reportType !== "finance" },
  );

  const queries = {
    enrollment: enrollmentQuery,
    attendance: attendanceQuery,
    academic: academicsQuery,
    finance: financeQuery,
  };
  const active = queries[reportType];
  const { rows, summary } = useMemo(
    () => extractReportRows(active.data?.data),
    [active.data],
  );
  const columns = useMemo(() => buildColumns(rows), [rows]);
  const isError = active.isError;
  const errorMessage = isError ? getApiErrorMessage(active.error) : null;
  const show = SHOWS[reportType];

  return (
    <>
      <PageHeader
        title="Reports"
        arabic="التقارير"
        description="Live school reports with the filters documented in the API."
      />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Report type">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          const selected = type.id === reportType;
          return (
            <button
              key={type.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setReportType(type.id);
                setFilters((previous) => ({ ...previous, groupBy: "" }));
              }}
              className={
                selected
                  ? "inline-flex items-center gap-2 rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-800"
                  : "inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:border-primary-300 hover:text-primary-700"
              }
            >
              <Icon className="size-4" aria-hidden />
              {type.label}
            </button>
          );
        })}
      </div>

      <Card title={`${REPORT_TYPES.find((t) => t.id === reportType)?.label ?? ""} report filters`}
        className="mb-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {show.session && (
            <SessionField
              options={sessionOptions}
              value={filters.academicSession}
              loading={sessions.isLoading}
              onChange={(value) => setFilter({ academicSession: value })}
            />
          )}
          {show.semester && (
            <SelectField
              label="Semester"
              value={filters.academicSemester}
              onChange={(event) => setFilter({ academicSemester: event.target.value })}
            >
              <option value="">All semesters</option>
              {semesterOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          )}
          {show.classRef && (
            <SelectField
              label="Class"
              value={filters.academicClass}
              onChange={(event) => setFilter({ academicClass: event.target.value })}
            >
              <option value="">All classes</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          )}
          {show.level && (
            <SelectField
              label="Level"
              value={filters.academicLevel}
              onChange={(event) => setFilter({ academicLevel: event.target.value })}
            >
              <option value="">All levels</option>
              {levelOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          )}
          {show.status && (
            <InputField
              label="Status"
              value={filters.status}
              placeholder="e.g. active"
              onChange={(event) => setFilter({ status: event.target.value })}
            />
          )}
          {show.groupBy && GROUP_BY_OPTIONS[reportType].length > 0 && (
            <SelectField
              label="Group by"
              value={filters.groupBy}
              onChange={(event) => setFilter({ groupBy: event.target.value })}
            >
              <option value="">Default</option>
              {GROUP_BY_OPTIONS[reportType].map((value) => (
                <option key={value} value={value}>
                  {prettifyKey(value)}
                </option>
              ))}
            </SelectField>
          )}
          {show.dateRange && (
            <InputField
              label="From"
              type="date"
              value={filters.from}
              onChange={(event) => setFilter({ from: event.target.value })}
            />
          )}
          {show.dateRange && (
            <InputField
              label="To"
              type="date"
              value={filters.to}
              onChange={(event) => setFilter({ to: event.target.value })}
            />
          )}
          {show.student && (
            <InputField
              label="Student ID"
              value={filters.student}
              placeholder="Student ID"
              onChange={(event) => setFilter({ student: event.target.value })}
            />
          )}
          {show.classSubject && (
            <InputField
              label="Class subject ID"
              value={filters.classSubject}
              placeholder="Class subject ID"
              onChange={(event) => setFilter({ classSubject: event.target.value })}
            />
          )}
          {show.includeUnpublished && (
            <SelectField
              label="Results scope"
              value={filters.includeUnpublished}
              onChange={(event) =>
                setFilter({ includeUnpublished: event.target.value })
              }
            >
              <option value="">Published only (default)</option>
              <option value="true">Include unpublished</option>
            </SelectField>
          )}
        </div>
      </Card>

      <Card
        title={`${REPORT_TYPES.find((t) => t.id === reportType)?.label ?? ""} report`}
        description="Values are shown exactly as returned by the API; “—” means the field is absent."
        actions={
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className="size-4" aria-hidden />}
            onClick={() => void active.refetch()}
            loading={active.isFetching}
          >
            Refresh
          </Button>
        }
      >
        {isError && (
          <Alert tone="error" title="Failed to load report" className="mb-4">
            {errorMessage}
          </Alert>
        )}
        {!isError && !active.isLoading && rows.length === 0 && (
          <EmptyState
            title="No report data"
            description="The report returned no rows for the selected filters."
            action={
              <Button variant="outline" onClick={() => void active.refetch()}>
                Retry
              </Button>
            }
          />
        )}
        {(rows.length > 0 || active.isLoading) && (
          <DataTable
            columns={columns}
            data={rows}
            isLoading={active.isLoading}
            emptyTitle="No report rows"
            rowKey={(_row, index) => `row-${index}`}
          />
        )}
        {Object.keys(summary).length > 0 && (
          <p className="mt-2 text-xs text-ink-500">
            Summary:{" "}
            {Object.entries(summary)
              .map(([key, value]) => `${prettifyKey(key)}: ${formatCellValue(key, value)}`)
              .join(" · ")}
          </p>
        )}
      </Card>
    </>
  );
}

function SessionField({
  options,
  value,
  loading,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <SelectField
      label="Academic session"
      value={value}
      disabled={loading}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{loading ? "Loading sessions…" : "All sessions"}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </SelectField>
  );
}

function buildColumns(
  rows: Record<string, unknown>[],
): Column<Record<string, unknown>>[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (seen.has(key)) continue;
      if (value === null || value === undefined || typeof value === "object") {
        continue;
      }
      seen.add(key);
      keys.push(key);
      if (keys.length >= 9) break;
    }
    if (keys.length >= 9) break;
  }

  return keys.map((key) => ({
    key,
    header: prettifyKey(key),
    align: /rate|percent|count|total|number/i.test(key) ? ("end" as const) : undefined,
    render: (row) => formatCellValue(key, row[key]),
  }));
}
