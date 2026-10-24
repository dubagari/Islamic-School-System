import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  ScrollText,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SelectField } from "@/components/ui/Fields";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { PagedFooter } from "@/components/ui/Pagination";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  classNameRef,
  displayName,
  getErrorMessage,
  nameRef,
  useGetAcademicSessionsQuery,
  useGetChildReportCardQuery,
  useGetChildResultsQuery,
  useGetChildTranscriptQuery,
  type ResultListItem,
} from "@/features/parent/api";

type ResultsTab = "report-card" | "transcript" | "results";

const TABS: { id: ResultsTab; label: string; icon: typeof FileSpreadsheet }[] = [
  { id: "report-card", label: "Report card", icon: FileSpreadsheet },
  { id: "transcript", label: "Transcript", icon: ScrollText },
  { id: "results", label: "Results", icon: ClipboardList },
];

function gradeTone(letterGrade: string): "success" | "info" | "warning" | "danger" | "neutral" {
  switch (letterGrade.trim().toUpperCase()) {
    case "A":
      return "success";
    case "B":
    case "C":
      return "info";
    case "D":
    case "E":
      return "warning";
    case "F":
      return "danger";
    default:
      return "neutral";
  }
}

function ordinal(position: number | null | undefined): string {
  if (position === null || position === undefined) return "—";
  const suffix =
    position % 100 >= 11 && position % 100 <= 13
      ? "th"
      : position % 10 === 1
        ? "st"
        : position % 10 === 2
          ? "nd"
          : position % 10 === 3
            ? "rd"
            : "th";
  return `${position}${suffix}`;
}

function subjectLabel(result: ResultListItem): string {
  if (typeof result.classSubject === "object" && result.classSubject) {
    const subject = result.classSubject.subject;
    if (subject) {
      return `${subject.prefix ?? ""} ${subject.name ?? ""}`.trim() || "—";
    }
  }
  return "—";
}

function reportColumns() {
  const columns: Column<ResultListItem>[] = [
    {
      key: "subject",
      header: "Subject",
      sortValue: (row) => subjectLabel(row),
      render: (row) => (
        <span className="font-medium text-ink-900">{subjectLabel(row)}</span>
      ),
    },
    {
      key: "score",
      header: "Score",
      align: "end",
      sortValue: (row) => row.totalScore,
      render: (row) => Number(row.totalScore ?? 0).toFixed(1),
    },
    {
      key: "grade",
      header: "Grade",
      render: (row) => (
        <Badge tone={gradeTone(row.letterGrade)}>{row.letterGrade || "—"}</Badge>
      ),
    },
    {
      key: "remark",
      header: "Remark",
      render: (row) => row.remark?.trim() || "—",
    },
  ];
  return columns;
}

function resultsColumns() {
  const columns: Column<ResultListItem>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (row) => (
        <span className="font-medium text-ink-900">{subjectLabel(row)}</span>
      ),
    },
    {
      key: "session",
      header: "Session",
      render: (row) => nameRef(row.academicSession),
    },
    {
      key: "semester",
      header: "Semester",
      render: (row) => nameRef(row.academicSemester),
    },
    {
      key: "score",
      header: "Score",
      align: "end",
      sortValue: (row) => row.totalScore,
      render: (row) => Number(row.totalScore ?? 0).toFixed(1),
    },
    {
      key: "grade",
      header: "Grade",
      render: (row) => (
        <Badge tone={gradeTone(row.letterGrade)}>{row.letterGrade || "—"}</Badge>
      ),
    },
    {
      key: "isPublished",
      header: "Status",
      render: (row) =>
        row.isPublished ? (
          <StatusBadge status="Published" />
        ) : (
          <StatusBadge status="Pending" />
        ),
    },
  ];
  return columns;
}

export function ChildResultsPage() {
  const { studentId = "" } = useParams<{ studentId: string }>();

  const [tab, setTab] = useState<ResultsTab>("report-card");
  const [academicSession, setAcademicSession] = useState("");
  const [page, setPage] = useState(1);

  const { data: sessionsData } = useGetAcademicSessionsQuery();

  if (!studentId) {
    return (
      <Alert tone="warning" title="No child selected">
        Use the parent overview to pick a child.
      </Alert>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumb={
          <div className="flex items-center gap-2">
            <Link to="/parent" className="hover:text-ink-800">
              Parent overview
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink-700">Results</span>
          </div>
        }
        title="Results"
        arabic="النتائج"
        description="Published report cards, transcript, and subject results."
      />

      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Results views"
          className="flex flex-wrap gap-2"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              role="tab"
              aria-selected={tab === id}
              variant={tab === id ? "primary" : "outline"}
              size="sm"
              icon={<Icon className="size-3.5" aria-hidden />}
              onClick={() => setTab(id)}
            >
              {label}
            </Button>
          ))}
        </div>

        <Card padded={false} className="p-5">
          <SelectField
            label="Academic session"
            className="max-w-xs"
            value={academicSession}
            onChange={(e) => {
              setAcademicSession(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All sessions</option>
            {(sessionsData?.data ?? []).map((session) => (
              <option key={session._id} value={session._id}>
                {session.name}
                {session.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>
        </Card>

        {tab === "report-card" && (
          <ReportCardTab studentId={studentId} academicSession={academicSession} />
        )}
        {tab === "transcript" && (
          <TranscriptTab studentId={studentId} academicSession={academicSession} />
        )}
        {tab === "results" && (
          <ResultsListTab
            studentId={studentId}
            academicSession={academicSession}
            page={page}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

function ReportCardTab({
  studentId,
  academicSession,
}: {
  studentId: string;
  academicSession: string;
}) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetChildReportCardQuery(
    { studentId, params: { academicSession: academicSession || undefined } },
    { skip: !studentId },
  );

  const columns = useMemo(() => reportColumns(), []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    const message = getErrorMessage(error);
    return (
      <Alert
        tone={/no results found/i.test(message) ? "info" : "error"}
        title={
          /no results found/i.test(message)
            ? "No published report card"
            : "Could not load the report card"
        }
      >
        <div className="flex items-center gap-3">
          <span>{message}</span>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  const summary = data?.summary;
  const semesterName = nameRef(data?.academicSemester);
  const sessionName = nameRef(data?.academicSession);

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard
          label={`GPA · ${semesterName === "—" ? "Current semester" : semesterName}`}
          value={summary?.gpa !== undefined ? Number(summary.gpa).toFixed(2) : "—"}
          icon={<GraduationCap className="size-4" aria-hidden />}
          tone="primary"
        />
        <StatCard
          label="Average score"
          value={
            summary ? Number(summary.averageScore ?? 0).toFixed(1) : "—"
          }
          sub={summary?.letterGrade ? summary.remark || `Grade ${summary.letterGrade}` : "—"}
          icon={<BookOpen className="size-4" aria-hidden />}
          tone="gold"
        />
        <StatCard
          label="Position"
          value={
            summary
              ? `${ordinal(summary.position)} of ${summary.classSize ?? "—"}`
              : "—"
          }
          sub={
            sessionName === "—" ? undefined : `Session: ${sessionName}`
          }
          icon={<ClipboardList className="size-4" aria-hidden />}
          tone="primary"
        />
        <StatCard
          label="Subjects"
          value={summary?.subjects ?? "—"}
          sub={`${classNameRef(data?.student?.academicClass)}`}
          icon={<FileSpreadsheet className="size-4" aria-hidden />}
        />
      </StatGrid>

      <Card padded={false}>
        <div className="border-b border-ink-100 px-5 py-4">
          <p className="text-sm font-semibold text-ink-900">
            {data?.student?.fullName || displayName(data?.student) || "—"}
            {data?.student?.registrationNumber
              ? ` · ${data.student.registrationNumber}`
              : ""}
          </p>
          <p className="text-xs text-ink-500">
            {classNameRef(data?.student?.academicClass)}
            {semesterName === "—" ? "" : ` · ${sessionName} · ${semesterName}`}
          </p>
        </div>
        <DataTable
          columns={columns}
          data={data?.data}
          rowKey={(row) => row._id}
          emptyTitle="No published subject results"
          emptyDescription="Publish a semester's results to generate the report card."
          mobileCard={(row) => (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink-900">
                {subjectLabel(row)}
              </p>
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <span>{Number(row.totalScore ?? 0).toFixed(1)}</span>
                <Badge tone={gradeTone(row.letterGrade)}>
                  {row.letterGrade}
                </Badge>
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  );
}

function TranscriptTab({
  studentId,
  academicSession,
}: {
  studentId: string;
  academicSession: string;
}) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetChildTranscriptQuery(
    { studentId, params: { academicSession: academicSession || undefined } },
    { skip: !studentId },
  );

  const columns = useMemo(() => reportColumns(), []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <Alert tone="error" title="Could not load the transcript">
        <div className="flex items-center gap-3">
          <span>{getErrorMessage(error)}</span>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  const sessions = data?.data ?? [];

  return (
    <div className="space-y-4">
      <StatGrid cols={3}>
        <StatCard
          label="Overall GPA"
          value={
            data?.summary?.gpa !== undefined
              ? Number(data.summary.gpa).toFixed(2)
              : "—"
          }
          icon={<GraduationCap className="size-4" aria-hidden />}
          tone="primary"
        />
        <StatCard
          label="Overall average"
          value={
            data?.summary
              ? Number(data.summary.averageScore ?? 0).toFixed(1)
              : "—"
          }
          icon={<BookOpen className="size-4" aria-hidden />}
          tone="gold"
        />
        <StatCard
          label="Total subjects"
          value={data?.summary?.totalSubjects ?? "—"}
          icon={<FileSpreadsheet className="size-4" aria-hidden />}
        />
      </StatGrid>

      {sessions.length === 0 ? (
        <div className="max-w-lg">
          <Alert tone="info" title="No published results yet">
            The transcript will build up as semesters are published for{" "}
            {data?.student?.fullName || "the student"}
          </Alert>
        </div>
      ) : (
        sessions.map((session) => (
          <Card
            key={session.academicSession?._id ?? session.academicSession?.name ?? "session"}
            padded={false}
            title={nameRef(session.academicSession)}
            description={
              session.summary
                ? `Average ${Number(session.summary.averageScore ?? 0).toFixed(2)} · GPA ${Number(session.summary.gpa ?? 0).toFixed(2)} · ${session.summary.subjects} subject${session.summary.subjects === 1 ? "" : "s"}`
                : undefined
            }
          >
            <div className="space-y-4 p-5">
              {session.semesters.map((semester) => (
                <div key={semester.academicSemester?._id ?? semester.academicSemester?.name ?? "semester"}>
                  <SectionTitle
                    className="mb-2"
                    actions={
                      <Badge tone="gold">
                        GPA {semester.summary ? Number(semester.summary.gpa).toFixed(2) : "—"}
                      </Badge>
                    }
                  >
                    {nameRef(semester.academicSemester)} · Average{" "}
                    {semester.summary
                      ? Number(semester.summary.averageScore).toFixed(1)
                      : "—"}
                  </SectionTitle>
                  <DataTable
                    className="mb-2"
                    columns={columns}
                    data={semester.results}
                    rowKey={(row) => row._id}
                    mobileCard={(row) => (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-ink-900">
                          {subjectLabel(row)}
                        </p>
                        <span className="text-xs text-ink-500">
                          {Number(row.totalScore ?? 0).toFixed(1)} · {row.letterGrade}
                        </span>
                      </div>
                    )}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function ResultsListTab({
  studentId,
  academicSession,
  page,
  onPageChange,
}: {
  studentId: string;
  academicSession: string;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const PAGE_SIZE = 10;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetChildResultsQuery(
    {
      studentId,
      params: {
        page,
        limit: PAGE_SIZE,
        academicSession: academicSession || undefined,
      },
    },
    { skip: !studentId },
  );

  const columns = useMemo(() => resultsColumns(), []);

  return (
    <div className="space-y-4">
      <StatGrid cols={3}>
        <StatCard
          label="Average score"
          value={
            data?.summary ? Number(data.summary.averageScore ?? 0).toFixed(1) : "—"
          }
          icon={<BookOpen className="size-4" aria-hidden />}
          tone="primary"
        />
        <StatCard
          label="GPA"
          value={
            data?.summary?.gpa !== undefined
              ? Number(data.summary.gpa).toFixed(2)
              : "—"
          }
          icon={<GraduationCap className="size-4" aria-hidden />}
          tone="gold"
        />
        <StatCard
          label="Subjects"
          value={data?.summary?.subjects ?? "—"}
          sub={
            data?.summary && data.summary.passRate !== undefined
              ? `${Number(data.summary.passRate).toFixed(0)}% pass rate`
              : undefined
          }
          icon={<ClipboardList className="size-4" aria-hidden />}
        />
      </StatGrid>

      {isError && (
        <Alert tone="error" title="Could not load results">
          <div className="flex items-center gap-3">
            <span>{getErrorMessage(error)}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <Card padded={false}>
        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle="No published results"
          emptyDescription="No published subject results match the selected filters."
          rowKey={(row) => row._id}
          mobileCard={(row) => (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {subjectLabel(row)}
                </p>
                <p className="text-xs text-ink-500">
                  {nameRef(row.academicSemester)} ·{" "}
                  {nameRef(row.academicSession)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-900">
                  {Number(row.totalScore ?? 0).toFixed(1)}
                </span>
                <Badge tone={gradeTone(row.letterGrade)}>
                  {row.letterGrade}
                </Badge>
              </div>
            </div>
          )}
        />
        <PagedFooter pagination={data?.pagination} onPageChange={onPageChange} />
      </Card>
    </div>
  );
}
