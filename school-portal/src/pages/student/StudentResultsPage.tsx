import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import { SelectField } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { PagedFooter } from "@/components/ui/Pagination";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import { cn } from "@/lib/cn";

import {
  extractErrorMessage,
  gradeTone,
  ordinal,
  refName,
  useGetAcademicSessionsQuery,
  useGetStudentProfileQuery,
  useGetStudentReportCardQuery,
  useGetStudentResultsQuery,
  useGetStudentTranscriptQuery,
  type ResultRecord,
} from "@/features/student/api";

type TabKey = "report" | "transcript" | "detail";

const TABS: { key: TabKey; label: string }[] = [
  { key: "report", label: "Report card" },
  { key: "transcript", label: "Transcript" },
  { key: "detail", label: "Results detail" },
];

const DETAIL_PAGE_SIZE = 10;

function subjectLabel(result: ResultRecord): string {
  const classSubject = result.classSubject;
  if (classSubject && typeof classSubject === "object") {
    const subject = classSubject.subject;
    if (subject && typeof subject === "object" && subject.name) {
      return subject.name;
    }
    if (classSubject.courseCode) return classSubject.courseCode;
  }
  return "—";
}

function scoreText(result: ResultRecord): string {
  if (result.totalScore === undefined || result.totalScore === null) return "—";
  return String(result.totalScore);
}

function gradeText(result: ResultRecord): string {
  return result.letterGrade || "—";
}

const resultColumns: Column<ResultRecord>[] = [
  {
    key: "subject",
    header: "Subject",
    sortValue: (r) => subjectLabel(r),
    render: (r) => (
      <div>
        <p className="font-medium text-ink-900">{subjectLabel(r)}</p>
        {r.classSubject &&
          typeof r.classSubject === "object" &&
          r.classSubject.courseCode && (
            <p className="text-xs text-ink-500">{r.classSubject.courseCode}</p>
          )}
      </div>
    ),
  },
  {
    key: "average",
    header: "Average",
    align: "end",
    sortValue: (r) => r.totalScore ?? -1,
    render: (r) => scoreText(r),
  },
  {
    key: "grade",
    header: "Grade",
    align: "center",
    render: (r) => <Badge tone={gradeTone(r.letterGrade)}>{gradeText(r)}</Badge>,
  },
  {
    key: "remark",
    header: "Remark",
    render: (r) => r.remark || "—",
  },
];

const resultMobileCard = (r: ResultRecord) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-start justify-between gap-2">
      <p className="font-medium text-ink-900">{subjectLabel(r)}</p>
      <Badge tone={gradeTone(r.letterGrade)}>{gradeText(r)}</Badge>
    </div>
    <p className="text-xs text-ink-500">
      Average {scoreText(r)} · {r.remark || "No remark"}
    </p>
  </div>
);

function QueryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="max-w-xl">
      <EmptyState
        title="Could not load results"
        description={message}
        action={
          onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

function NoResults({ message }: { message: string }) {
  return (
    <div className="max-w-md">
      <EmptyState
        title="No results published yet"
        description={message}
      />
    </div>
  );
}

function noResultsFound(message: string): boolean {
  return /no results/i.test(message);
}

function objectKey(ref: unknown, fallback: string): string {
  if (ref && typeof ref === "object" && "_id" in ref) {
    const id = (ref as { _id: unknown })._id;
    if (typeof id === "string" && id) return id;
  }
  return fallback;
}

export function StudentResultsPage() {
  const [tab, setTab] = useState<TabKey>("report");
  const [session, setSession] = useState("");

  const {
    data: profileEnvelope,
    isError: isProfileError,
    error: profileError,
  } = useGetStudentProfileQuery();

  const studentId = profileEnvelope?.data?._id ?? "";

  const { data: sessionsEnvelope, isLoading: isLoadingSessions } =
    useGetAcademicSessionsQuery();

  const sessions = sessionsEnvelope?.data ?? [];
  const sessionValue = session || undefined;

  return (
    <div>
      <PageHeader
        title="My results"
        arabic="نتائج"
        description="Published subject results, semester report cards and your full transcript."
      />

      {isProfileError && (
        <div className="mb-4 max-w-md">
          <EmptyState
            title="Student profile unavailable"
            description={extractErrorMessage(profileError)}
          />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Results views"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                tab === t.key
                  ? "border-primary-700 bg-primary-700 text-white"
                  : "border-ink-200 bg-white text-ink-700 hover:border-primary-300 hover:text-primary-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <SelectField
            label="Academic session"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            hint={
              isLoadingSessions && sessions.length === 0
                ? "Loading sessions…"
                : undefined
            }
          >
            <option value="">All / current</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name ?? "Session"}
                {s.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {tab === "report" && (
        <ReportCardSection studentId={studentId} academicSession={sessionValue} />
      )}
      {tab === "transcript" && (
        <TranscriptSection studentId={studentId} academicSession={sessionValue} />
      )}
      {tab === "detail" && (
        <ResultsDetailSection
          studentId={studentId}
          academicSession={sessionValue}
        />
      )}
    </div>
  );
}

function ReportCardSection({
  studentId,
  academicSession,
}: {
  studentId: string;
  academicSession?: string;
}) {
  const {
    data: envelope,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentReportCardQuery(
    { studentId, academicSession },
    { skip: !studentId },
  );

  if (isLoading) return <PageLoader />;

  if (isError) {
    const message = extractErrorMessage(error);
    if (noResultsFound(message)) return <NoResults message={message} />;
    return <QueryError message={message} onRetry={() => void refetch()} />;
  }

  const results = envelope?.data ?? [];
  const summary = envelope?.summary;

  if (results.length === 0 || !summary) {
    return (
      <NoResults message="Once your school publishes results for the selected semester, your report card will appear here." />
    );
  }

  const position =
    summary.position !== undefined && summary.position !== null
      ? `${ordinal(summary.position)} of ${summary.classSize ?? "—"}`
      : "—";

  return (
    <div className="space-y-6">
      <Card
        title={
          envelope?.student?.fullName
            ? `${envelope.student.fullName}${
                envelope.student.registrationNumber
                  ? ` · ${envelope.student.registrationNumber}`
                  : ""
              }`
            : "Report card"
        }
        description={`${envelope?.academicSession?.name ?? "—"} · ${
          envelope?.academicSemester?.name ?? "—"
        }`}
      >
        <StatGrid cols={4}>
          <StatCard label="GPA" value={summary.gpa ?? "—"} tone="primary" />
          <StatCard
            label="Class position"
            value={position}
            sub={summary.classSize ? `Class size ${summary.classSize}` : undefined}
            tone="gold"
          />
          <StatCard
            label="Overall average"
            value={summary.averageScore ?? "—"}
            sub={`Overall grade — ${summary.letterGrade ?? "—"}`}
          />
          <StatCard
            label="Subjects"
            value={summary.subjects ?? results.length}
            sub={summary.remark || undefined}
          />
        </StatGrid>
      </Card>

      <Card padded={false}>
        <DataTable
          columns={resultColumns}
          data={results}
          rowKey={(r) => r._id}
          mobileCard={resultMobileCard}
          emptyTitle="No results published yet"
          emptyDescription="Published results for this semester will appear here."
        />
      </Card>
    </div>
  );
}

function TranscriptSection({
  studentId,
  academicSession,
}: {
  studentId: string;
  academicSession?: string;
}) {
  const {
    data: envelope,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentTranscriptQuery(
    { studentId, academicSession },
    { skip: !studentId },
  );

  if (isLoading) return <PageLoader />;

  if (isError) {
    const message = extractErrorMessage(error);
    if (noResultsFound(message)) return <NoResults message={message} />;
    return <QueryError message={message} onRetry={() => void refetch()} />;
  }

  const sessions = envelope?.data ?? [];
  const overall = envelope?.summary;

  if (sessions.length === 0) {
    return (
      <NoResults message="Your transcript is built from published results across semesters." />
    );
  }

  return (
    <div className="space-y-6">
      <Card
        title={
          envelope?.student?.fullName
            ? `${envelope.student.fullName}${
                envelope.student.registrationNumber
                  ? ` · ${envelope.student.registrationNumber}`
                  : ""
              }`
            : "Transcript"
        }
        description={
          overall
            ? `${overall.totalSubjects ?? 0} subject${(overall.totalSubjects ?? 0) === 1 ? "" : "s"} · Lifetime average ${overall.averageScore ?? "—"} · GPA ${overall.gpa ?? "—"}`
            : undefined
        }
      >
        <StatGrid cols={3}>
          <StatCard label="Subjects" value={overall?.totalSubjects ?? "—"} />
          <StatCard
            label="Lifetime average"
            value={overall?.averageScore ?? "—"}
            tone="primary"
          />
          <StatCard label="Lifetime GPA" value={overall?.gpa ?? "—"} tone="gold" />
        </StatGrid>
      </Card>

      {sessions.map((sessionGroup, sessionIndex) => (
        <Card
          key={objectKey(sessionGroup.academicSession, `session-${sessionIndex}`)}
          title={refName(sessionGroup.academicSession) ?? "Academic session"}
          description={
            sessionGroup.summary
              ? `${sessionGroup.summary.subjects ?? 0} subject${
                  (sessionGroup.summary.subjects ?? 0) === 1 ? "" : "s"
                } · Average ${sessionGroup.summary.averageScore ?? "—"} · GPA ${
                  sessionGroup.summary.gpa ?? "—"
                }`
              : undefined
          }
        >
          <div className="space-y-4">
            {(sessionGroup.semesters ?? []).map(
              (semesterGroup, semesterIndex) => (
                <div
                  key={objectKey(
                    semesterGroup.academicSemester,
                    `semester-${semesterIndex}`,
                  )}
                  className="rounded-card border border-ink-100"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-2.5">
                    <p className="text-sm font-semibold text-ink-900">
                      {refName(semesterGroup.academicSemester) ?? "Semester"}
                    </p>
                    <Badge tone="info">
                      GPA {semesterGroup.summary?.gpa ?? "—"}
                    </Badge>
                  </div>
                  <div className="px-1 py-1">
                    <DataTable
                      columns={resultColumns}
                      data={semesterGroup.results ?? []}
                      rowKey={(r) => r._id}
                      mobileCard={resultMobileCard}
                      emptyTitle="No published results"
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ResultsDetailSection({
  studentId,
  academicSession,
}: {
  studentId: string;
  academicSession?: string;
}) {
  const [page, setPage] = useState(1);

  const {
    data: envelope,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentResultsQuery(
    { studentId, academicSession, page, limit: DETAIL_PAGE_SIZE },
    { skip: !studentId },
  );

  const columns: Column<ResultRecord>[] = [
    ...resultColumns,
    {
      key: "semester",
      header: "Semester",
      sortValue: (r) => refName(r.academicSemester) ?? "",
      render: (r) => refName(r.academicSemester) ?? "—",
    },
    {
      key: "published",
      header: "Published",
      render: (r) =>
        r.isPublished ? (
          <Badge tone="success">Published</Badge>
        ) : (
          <Badge tone="neutral">Pending</Badge>
        ),
    },
  ];

  const results = envelope?.data ?? [];

  if (isLoading) return <PageLoader />;

  if (isError) {
    const message = extractErrorMessage(error);
    if (noResultsFound(message)) return <NoResults message={message} />;
    return <QueryError message={message} onRetry={() => void refetch()} />;
  }

  return (
    <Card padded={false}>
      <DataTable
        columns={columns}
        data={results}
        rowKey={(r) => r._id}
        mobileCard={resultMobileCard}
        emptyTitle="No results published yet"
        emptyDescription="Published subject results will appear here once they are released."
      />
      <PagedFooter pagination={envelope?.pagination} onPageChange={setPage} />
    </Card>
  );
}
