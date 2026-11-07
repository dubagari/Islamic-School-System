import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, TrendingDown, TrendingUp } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SelectField } from "@/components/ui/Fields";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  getApiErrorMessage,
  refId,
  refName,
  studentName,
  useGetAcademicSemestersQuery,
  useGetAcademicSessionsQuery,
  useGetClassResultsQuery,
  useGetMyAssignmentsQuery,
  type Result,
  type TeacherAssignment,
} from "@/features/teacher/api";

const PAGE_SIZE = 10;

function gradeTone(grade: string): BadgeTone {
  switch (grade.trim().toUpperCase()) {
    case "A":
      return "success";
    case "B":
      return "info";
    case "C":
    case "D":
      return "warning";
    case "F":
      return "danger";
    default:
      return "neutral";
  }
}

function assignmentLabel(
  value: TeacherAssignment["classSubject"],
): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  const cls = refName(value.academicClass) ?? "Class";
  const subject = refName(value.subject) ?? "Subject";
  return `${cls} — ${subject}`;
}

function fmtNumber(value: number | undefined): string {
  return value === undefined || Number.isNaN(value)
    ? "—"
    : value.toLocaleString();
}

export function TeacherResultsPage() {
  const navigate = useNavigate();
  const assignmentsQ = useGetMyAssignmentsQuery();
  const sessionsQ = useGetAcademicSessionsQuery();
  const semestersQ = useGetAcademicSemestersQuery();

  const assignments = assignmentsQ.data?.data ?? [];

  const [classSubject, setClassSubject] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [published, setPublished] = useState("");
  const [page, setPage] = useState(1);

  const results = useGetClassResultsQuery(
    {
      classSubject,
      academicSession: sessionId || undefined,
      academicSemester: semesterId || undefined,
      isPublished: published === "" ? undefined : published === "yes",
      page,
      limit: PAGE_SIZE,
    },
    { skip: !classSubject },
  );

  const rows = results.data?.data ?? [];
  const summary = results.data?.summary;

  const columns: Column<Result>[] = [
    {
      key: "student",
      header: "Student",
      sortValue: (row) => studentName(row.student),
      render: (row) => (
        <span className="font-medium text-ink-900">
          {studentName(row.student)}
        </span>
      ),
    },
    {
      key: "score",
      header: "Score",
      align: "end",
      sortValue: (row) => row.score,
      render: (row) => fmtNumber(row.score),
    },
    {
      key: "average",
      header: "Average",
      align: "end",
      sortValue: (row) => row.average ?? 0,
      render: (row) => fmtNumber(row.average),
    },
    {
      key: "grade",
      header: "Grade",
      align: "center",
      sortValue: (row) => row.grade ?? "",
      render: (row) =>
        row.grade ? (
          <Badge tone={gradeTone(row.grade)}>{row.grade}</Badge>
        ) : (
          <Badge tone="neutral">—</Badge>
        ),
    },
    {
      key: "published",
      header: "Published",
      align: "center",
      sortValue: (row) => (row.isPublished ? 1 : 0),
      render: (row) =>
        row.isPublished ? (
          <Badge tone="success">Published</Badge>
        ) : (
          <Badge tone="warning">Unpublished</Badge>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Class results"
        description="Computed results per student for one of your class-subjects."
      />

      {results.isError && (
        <Alert tone="error" title="Could not load results" className="mb-4">
          {getApiErrorMessage(results.error)}
        </Alert>
      )}

      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Class-subject"
            required
            value={classSubject}
            onChange={(e) => {
              setClassSubject(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Select class-subject…</option>
            {assignments.map((assignment) => (
              <option
                key={assignment._id}
                value={refId(assignment.classSubject) ?? ""}
              >
                {assignmentLabel(assignment.classSubject)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Academic session"
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setSemesterId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All semesters</option>
            {(semestersQ.data?.data ?? []).map((semester) => (
              <option key={semester._id} value={semester._id}>
                {semester.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Publication state"
            value={published}
            onChange={(e) => {
              setPublished(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="yes">Published</option>
            <option value="no">Unpublished</option>
          </SelectField>
        </div>
      </Card>

      <StatGrid cols={3} className="mb-4">
        <StatCard
          label="Pass rate"
          value={
            summary?.passRate !== undefined
              ? `${Number(summary.passRate).toFixed(1)}%`
              : "—"
          }
          sub="Students scoring at or above the pass mark"
          icon={<Award className="size-4" aria-hidden />}
          tone="primary"
          loading={results.isLoading}
        />
        <StatCard
          label="Highest score"
          value={fmtNumber(summary?.highest)}
          sub="Top result in this class-subject"
          icon={<TrendingUp className="size-4" aria-hidden />}
          tone="default"
          loading={results.isLoading}
        />
        <StatCard
          label="Lowest score"
          value={fmtNumber(summary?.lowest)}
          sub="Bottom result in this class-subject"
          icon={<TrendingDown className="size-4" aria-hidden />}
          tone="warning"
          loading={results.isLoading}
        />
      </StatGrid>

      <Card padded={false}>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={results.isLoading || !classSubject}
          emptyTitle={classSubject ? "No results yet" : "No class-subject selected"}
          emptyDescription={
            classSubject
              ? "Nothing has been computed for this selection — run “Compute results” on the Assessments page first."
              : "Pick a class-subject above to view computed results."
          }
          emptyAction={
            classSubject ? (
              <Button onClick={() => navigate("/teacher/assessments")}>
                Go to Assessments
              </Button>
            ) : undefined
          }
          rowKey={(row) => row._id}
          mobileCard={(row) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-ink-900">
                  {studentName(row.student)}
                </p>
                {row.grade ? (
                  <Badge tone={gradeTone(row.grade)}>{row.grade}</Badge>
                ) : (
                  <Badge tone="neutral">—</Badge>
                )}
              </div>
              <p className="text-xs text-ink-500">
                Score {fmtNumber(row.score)} · Average {fmtNumber(row.average)} ·{" "}
                {row.isPublished ? "Published" : "Unpublished"}
              </p>
            </div>
          )}
        />
        <PagedFooter
          pagination={results.data?.pagination}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
