import { useEffect, useMemo, useState } from "react";
import { Calculator, Printer, ShieldCheck, ShieldOff } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import { FormField, Select } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";
import {
  useComputeResultsMutation,
  useGetClassSubjectResultsQuery,
  useGetStudentAcademicResultsQuery,
  useGetStudentReportCardQuery,
  useGetStudentTranscriptQuery,
  useListClassSubjectsQuery,
  useListMyChildrenQuery,
  usePublishResultsMutation,
  type ClassSubjectRef,
  type ClassSubjectResult,
  type ClassResultsSummary,
  type ComputeResultsBody,
  type PublishResultsBody,
  type TranscriptPeriod,
} from "@/features/academics-records/api";
import { getApiErrorMessage } from "@/features/staff/api";
import {
  classLabel,
  isPopulated,
  refName,
  useGetAcademicClassesQuery,
  useGetAcademicSemestersQuery,
  useGetAcademicSessionsQuery,
} from "@/features/students/api";
import { cn } from "@/lib/cn";

// ======================================================
// Helpers
// ======================================================

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function subjectLabel(value: string | ClassSubjectRef): string {
  if (typeof value === "string") return "—";
  const subject = value.subject;
  const subjectName =
    typeof subject === "object" && subject !== null
      ? subject.name ?? subject.prefix ?? "—"
      : "—";
  const className =
    typeof value.academicClass === "object" && value.academicClass !== null
      ? value.academicClass.name
      : undefined;
  return className ? `${subjectName} — ${className}` : subjectName;
}

function studentDisplayName(student: unknown): string {
  if (!student || typeof student === "string") return "—";
  const person = student as {
    fullName?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    registrationNumber?: string;
  };
  return (
    person.fullName ||
    [person.firstName, person.middleName, person.lastName]
      .filter(Boolean)
      .join(" ") ||
    "—"
  );
}

const gradeBarTones: Record<string, string> = {
  A: "bg-primary-600",
  B: "bg-sky-500",
  C: "bg-gold-500",
  D: "bg-ink-400",
  E: "bg-amber-500",
  F: "bg-red-500",
};

function GradeDistribution({
  summary,
  results,
}: {
  summary: ClassResultsSummary | undefined;
  results: ClassSubjectResult[] | undefined;
}) {
  const distribution = useMemo(() => {
    if (summary?.gradeDistribution?.length) {
      return summary.gradeDistribution
        .filter((entry) => entry.grade)
        .map((entry) => ({
          grade: String(entry.grade),
          count: entry.count ?? 0,
        }));
    }
    if (!results?.length) return [];
    const counts = new Map<string, number>();
    for (const r of results) {
      counts.set(r.letterGrade, (counts.get(r.letterGrade) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => a.grade.localeCompare(b.grade));
  }, [summary, results]);

  if (distribution.length === 0) return null;
  const max = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="rounded-card border border-ink-100 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        Grade distribution
      </p>
      <div className="mt-3 space-y-2">
        {distribution.map((d) => (
          <div key={d.grade} className="flex items-center gap-3">
            <span className="w-6 text-xs font-semibold text-ink-700">{d.grade}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
              <div
                className={cn(
                  "h-full rounded-full",
                  gradeBarTones[d.grade] ?? "bg-ink-400",
                )}
                style={{ width: `${Math.round((d.count / max) * 100)}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-ink-500">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// Page
// ======================================================

export function ResultsPage() {
  const user = useAppSelector(selectCurrentUser);
  const role = user?.role ?? "student";

  if (role === "student" || role === "parent") {
    return <MyResultsView role={role} studentId={user?.student ?? null} />;
  }
  return <StaffResultsView canCompute={role === "admin" || role === "teacher"} canPublish={role === "admin"} />;
}

// ======================================================
// Admin + teacher view
// ======================================================

type PublishTarget =
  | { kind: "student"; studentId: string; studentName: string; isPublished: boolean }
  | { kind: "classSubject"; isPublished: boolean };

function StaffResultsView({
  canCompute,
  canPublish,
}: {
  canCompute: boolean;
  canPublish: boolean;
}) {
  const { data: sessionsData } = useGetAcademicSessionsQuery();
  const { data: classesData } = useGetAcademicClassesQuery();
  const sessions = sessionsData?.data ?? [];
  const classes = classesData?.data ?? [];

  const [session, setSession] = useState("");
  const [semester, setSemester] = useState("");
  const [classId, setClassId] = useState("");
  const [classSubjectId, setClassSubjectId] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [publishTarget, setPublishTarget] = useState<PublishTarget | null>(null);

  useEffect(() => {
    if (sessions.length === 0) return;
    setSession((prev) =>
      prev && sessions.some((s) => s._id === prev)
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

  const { data: classSubjectsData, isLoading: classSubjectsLoading } =
    useListClassSubjectsQuery(
      {
        academicClass: classId || undefined,
        academicSemester: semester || undefined,
      },
      { skip: !classId || !semester },
    );
  const classSubjects = classSubjectsData?.data ?? [];
  const selectedClassSubject = classSubjects.find((cs) => cs._id === classSubjectId);

  const { data: resultsData, isLoading: resultsLoading, isError, error, refetch } =
    useGetClassSubjectResultsQuery(
      { classSubject: classSubjectId, academicSemester: semester || undefined },
      { skip: !classSubjectId || !semester },
    );

  const results = resultsData?.data;
  const summary = resultsData?.summary;

  const [computeResults, { isLoading: computing }] = useComputeResultsMutation();
  const [publishResults, { isLoading: publishing }] = usePublishResultsMutation();

  const computeRequest: ComputeResultsBody | null =
    classSubjectId && semester
      ? { classSubject: classSubjectId, academicSemester: semester }
      : null;

  const compute = () => {
    void (async () => {
      if (!computeRequest) return;
      setNotice(null);
      try {
        const res = await computeResults(computeRequest).unwrap();
        setNotice({ tone: "success", message: res.message || "Results computed successfully." });
      } catch (err) {
        setNotice({
          tone: "error",
          message: getApiErrorMessage(err, "Could not compute results."),
        });
      }
    })();
  };

  const runPublish = (body: PublishResultsBody) => {
    void (async () => {
      setNotice(null);
      try {
        const res = await publishResults(body).unwrap();
        setNotice({ tone: "success", message: res.message || "Publication state updated." });
      } catch (err) {
        setNotice({
          tone: "error",
          message: getApiErrorMessage(err, "Could not update publication state."),
        });
      }
    })();
  };

  const onConfirmPublish = () => {
    if (!publishTarget || !classSubjectId || !semester) return;
    runPublish(
      publishTarget.kind === "student"
        ? {
            classSubject: classSubjectId,
            academicSemester: semester,
            studentIds: [publishTarget.studentId],
            isPublished: publishTarget.isPublished,
          }
        : {
            classSubject: classSubjectId,
            academicSemester: semester,
            isPublished: publishTarget.isPublished,
          },
    );
    setPublishTarget(null);
  };

  const columns: Column<ClassSubjectResult>[] = useMemo(
    () => [
      {
        key: "student",
        header: "Student",
        sortValue: (r) => studentDisplayName(r.student),
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-medium text-ink-900">
              {studentDisplayName(r.student)}
            </span>
            {typeof r.student === "object" && r.student !== null && r.student.registrationNumber && (
              <span className="font-mono text-xs text-ink-500">
                {r.student.registrationNumber}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "totalScore",
        header: "Total score",
        align: "end",
        sortValue: (r) => r.totalScore,
        render: (r) => <span className="font-semibold">{r.totalScore}</span>,
      },
      {
        key: "letterGrade",
        header: "Grade",
        align: "center",
        sortValue: (r) => r.letterGrade,
        render: (r) => <Badge tone={r.letterGrade === "F" ? "danger" : "success"}>{r.letterGrade}</Badge>,
      },
      {
        key: "gradePoint",
        header: "Points",
        align: "center",
        sortValue: (r) => r.gradePoint,
        render: (r) => r.gradePoint,
      },
      {
        key: "remark",
        header: "Remark",
        render: (r) => r.remark || "—",
      },
      {
        key: "isPublished",
        header: "Publication",
        align: "center",
        sortValue: (r) => (r.isPublished ? 1 : 0),
        render: (r) =>
          r.isPublished ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Unpublished</Badge>,
      },
      {
        key: "computedAt",
        header: "Computed",
        sortValue: (r) => r.computedAt ?? "",
        render: (r) => fmtDate(r.computedAt ?? null),
      },
      ...(canPublish
        ? [
            {
              key: "actions",
              header: "Actions",
              align: "end" as const,
              render: (r: ClassSubjectResult) => (
                <Button
                  size="sm"
                  variant={r.isPublished ? "ghost" : "outline"}
                  icon={
                    r.isPublished ? (
                      <ShieldOff className="size-3.5" aria-hidden />
                    ) : (
                      <ShieldCheck className="size-3.5" aria-hidden />
                    )
                  }
                  onClick={() =>
                    setPublishTarget({
                      kind: "student",
                      studentId: isPopulated(r.student) ? r.student._id : "",
                      studentName: studentDisplayName(r.student),
                      isPublished: !r.isPublished,
                    })
                  }
                >
                  {r.isPublished ? "Unpublish" : "Publish"}
                </Button>
              ),
            },
          ]
        : []),
    ],
    [canPublish],
  );

  return (
    <div>
      <PageHeader
        title="Results"
        arabic="النتائج"
        description="Compute weighted results per class subject, then publish them to students and parents."
      />

      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Academic session">
            {(aria) => (
              <Select
                {...aria}
                value={session}
                onChange={(e) => {
                  setSession(e.target.value);
                  setSemester("");
                  setClassSubjectId("");
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
                onChange={(e) => {
                  setSemester(e.target.value);
                  setClassSubjectId("");
                }}
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
                onChange={(e) => {
                  setClassId(e.target.value);
                  setClassSubjectId("");
                }}
              >
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {classLabel(c)}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="Class subject">
            {(aria) => (
              <Select
                {...aria}
                value={classSubjectId}
                onChange={(e) => setClassSubjectId(e.target.value)}
                disabled={classSubjectsLoading || classSubjects.length === 0}
              >
                <option value="">
                  {classSubjectsLoading ? "Loading…" : "Select class subject…"}
                </option>
                {classSubjects.map((cs) => (
                  <option key={cs._id} value={cs._id}>
                    {subjectLabel(cs)}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>

        {classSubjectId && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {canCompute && (
              <Button
                icon={<Calculator className="size-4" aria-hidden />}
                onClick={compute}
                loading={computing}
                disabled={!computeRequest}
              >
                Compute results
              </Button>
            )}
            {canPublish && results && results.length > 0 && (
              <>
                <Button
                  variant="outline"
                  icon={<ShieldCheck className="size-4" aria-hidden />}
                  onClick={() => setPublishTarget({ kind: "classSubject", isPublished: true })}
                  disabled={publishing}
                >
                  Publish all
                </Button>
                <Button
                  variant="ghost"
                  icon={<ShieldOff className="size-4" aria-hidden />}
                  onClick={() => setPublishTarget({ kind: "classSubject", isPublished: false })}
                  disabled={publishing}
                >
                  Unpublish all
                </Button>
              </>
            )}
            <p className="text-xs text-ink-500">
              Recomputing keeps existing publication states. Students and parents
              only see published results.
            </p>
          </div>
        )}
      </Card>

      {notice && (
        <Alert
          tone={notice.tone}
          title={notice.tone === "success" ? "Done" : "Something went wrong"}
          className="mb-4"
          onDismiss={() => setNotice(null)}
        >
          {notice.message}
        </Alert>
      )}

      {classSubjectId &&
        summary &&
        (summary.average !== undefined ||
          summary.passRate !== undefined ||
          summary.highest !== undefined ||
          summary.lowest !== undefined) && (
          <div className="mb-6 space-y-4">
            <StatGrid cols={4}>
              <StatCard
                label="Average score"
                value={summary.average !== undefined ? summary.average : "—"}
                icon={<Calculator className="size-4" aria-hidden />}
                tone="primary"
              />
              <StatCard
                label="Pass rate"
                value={
                  summary.passRate !== undefined ? `${summary.passRate}%` : "—"
                }
                tone="gold"
              />
              <StatCard label="Highest" value={summary.highest ?? "—"} />
              <StatCard label="Lowest" value={summary.lowest ?? "—"} />
            </StatGrid>
            <div className="grid gap-4 lg:grid-cols-2">
              <GradeDistribution summary={summary} results={results} />
            </div>
          </div>
      )}

      <Card
        title={`Results${selectedClassSubject ? ` — ${subjectLabel(selectedClassSubject)}` : ""}`}
        description="Students and parents only ever see published results."
      >
        {isError && (
          <Alert tone="error" title="Could not load results" className="mb-4">
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
          data={results}
          isLoading={resultsLoading}
          emptyTitle="No computed results for this subject yet"
          emptyDescription={
            classSubjectId
              ? "Use Compute results to generate weighted results from recorded assessment scores."
              : "Select an academic session, semester, class and class subject."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(r) => r._id}
          mobileCard={(r) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink-900">
                    {studentDisplayName(r.student)}
                  </p>
                  <p className="text-xs text-ink-500">
                    Score {r.totalScore} · Grade {r.letterGrade} ({r.gradePoint})
                  </p>
                </div>
                {r.isPublished ? (
                  <Badge tone="success">Published</Badge>
                ) : (
                  <Badge tone="neutral">Unpublished</Badge>
                )}
              </div>
              <p className="text-xs text-ink-500">
                {r.remark || "—"} · Computed {fmtDate(r.computedAt ?? null)}
              </p>
              {canPublish && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPublishTarget({
                      kind: "student",
                      studentId: isPopulated(r.student) ? r.student._id : "",
                      studentName: studentDisplayName(r.student),
                      isPublished: !r.isPublished,
                    })
                  }
                >
                  {r.isPublished ? "Unpublish" : "Publish"}
                </Button>
              )}
            </div>
          )}
        />
      </Card>

      <ConfirmDialog
        open={publishTarget !== null}
        title={
          publishTarget?.isPublished ? "Publish results" : "Unpublish results"
        }
        confirmLabel={publishTarget?.isPublished ? "Publish" : "Unpublish"}
        loading={publishing}
        onClose={() => setPublishTarget(null)}
        description={
          publishTarget?.kind === "student"
            ? `"${publishTarget.studentName}" and their linked parents will ${
                publishTarget.isPublished ? "be able to view" : "no longer see"
              } this result.`
            : "This applies to every computed result for this class subject and semester."
        }
        onConfirm={onConfirmPublish}
      />
    </div>
  );
}

// ======================================================
// Student / parent view (printable)
// ======================================================

function MyResultsView({
  role,
  studentId,
}: {
  role: "student" | "parent";
  studentId: string | null;
}) {
  const { data: childrenData } = useListMyChildrenQuery(undefined, {
    skip: role !== "parent",
  });
  const children = childrenData?.data ?? [];

  const [childId, setChildId] = useState("");
  const targetStudentId = role === "student" ? studentId : childId;

  useEffect(() => {
    if (role === "parent" && !childId && children.length > 0) {
      setChildId(children[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData]);

  const { data: semestersData } = useGetAcademicSemestersQuery();
  const semesters = semestersData?.data ?? [];

  const [semester, setSemester] = useState("");
  const [view, setView] = useState<"results" | "report-card" | "transcript">(
    "results",
  );

  useEffect(() => {
    if (semesters.length === 0) return;
    setSemester((prev) =>
      prev && semesters.some((s) => s._id === prev)
        ? prev
        : (semesters.find((s) => s.isCurrent)?._id ?? semesters[0]._id),
    );
  }, [semesters]);

  const linkedById = useGetStudentAcademicResultsQuery(
    { studentId: targetStudentId ?? "", academicSemester: semester || undefined },
    { skip: !targetStudentId || view !== "results" },
  );

  const reportCardQuery = useGetStudentReportCardQuery(
    {
      studentId: targetStudentId ?? "",
      academicSemester: semester || undefined,
    },
    { skip: !targetStudentId || view !== "report-card" },
  );

  const transcriptQuery = useGetStudentTranscriptQuery(
    { studentId: targetStudentId ?? "" },
    { skip: !targetStudentId || view !== "transcript" },
  );

  if (role === "parent" && childrenData && children.length === 0) {
    return (
      <div>
        <PageHeader title="Results" arabic="النتائج" />
        <Alert tone="info">No linked children found on your account.</Alert>
      </div>
    );
  }

  const tabs: { id: typeof view; label: string }[] = [
    { id: "results", label: "Results" },
    { id: "report-card", label: "Report card" },
    { id: "transcript", label: "Transcript" },
  ];

  return (
    <div>
      <PageHeader
        title="Results"
        arabic="النتائج"
        description={
          role === "student"
            ? "Your published results, report card and transcript."
            : "Your linked children's published results, report cards and transcripts."
        }
        actions={
          <Button
            variant="outline"
            className="no-print print:hidden"
            icon={<Printer className="size-4" aria-hidden />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        }
      />

      {role === "parent" && children.length > 0 && (
        <Card className="no-print mb-6 print:hidden">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Child">
              {(aria) => (
                <Select
                  {...aria}
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                >
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {studentDisplayName(c)}
                      {c.registrationNumber ? ` (${c.registrationNumber})` : ""}
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
                >
                  <option value="">All semesters</option>
                  {semesters.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>
        </Card>
      )}

      {role === "student" && (
        <Card className="no-print mb-6 print:hidden">
          <FormField label="Semester">
            {(aria) => (
              <Select
                {...aria}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="">All semesters</option>
                {semesters.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </Card>
      )}

      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-1 rounded-lg border border-ink-100 bg-white p-1 shadow-card sm:w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              aria-current={view === t.id ? "page" : undefined}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                view === t.id
                  ? "bg-primary-700 text-white"
                  : "text-ink-700 hover:bg-forest-50",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          icon={<Printer className="size-4" aria-hidden />}
          onClick={() => window.print()}
        >
          Print
        </Button>
      </div>

      {view === "results" && (
        <Card title="Published results">
          {linkedById.isError && (
            <Alert tone="error" title="Could not load results" className="mb-4">
              <div className="flex items-center gap-3">
                <span>{getApiErrorMessage(linkedById.error, "Request failed.")}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void linkedById.refetch()}
                >
                  Retry
                </Button>
              </div>
            </Alert>
          )}
          <MyResultsTable
            results={linkedById.data?.data}
            isLoading={linkedById.isLoading}
          />
        </Card>
      )}

      {view === "report-card" && (
        <ReportCardView
          query={reportCardQuery}
          semesterName={refName(
            semesters.find((s) => s._id === semester) ?? null,
          )}
        />
      )}

      {view === "transcript" && <TranscriptView query={transcriptQuery} />}
    </div>
  );
}

function MyResultsTable({
  results,
  isLoading,
}: {
  results: ClassSubjectResult[] | undefined;
  isLoading: boolean;
}) {
  const columns: Column<ClassSubjectResult>[] = useMemo(
    () => [
      {
        key: "subject",
        header: "Subject",
        sortValue: (r) => subjectLabel(r.classSubject),
        render: (r) => subjectLabel(r.classSubject),
      },
      {
        key: "totalScore",
        header: "Total score",
        align: "end",
        sortValue: (r) => r.totalScore,
        render: (r) => <span className="font-semibold">{r.totalScore}</span>,
      },
      {
        key: "letterGrade",
        header: "Grade",
        align: "center",
        sortValue: (r) => r.letterGrade,
        render: (r) => r.letterGrade,
      },
      {
        key: "gradePoint",
        header: "Points",
        align: "center",
        sortValue: (r) => r.gradePoint,
        render: (r) => r.gradePoint,
      },
      {
        key: "remark",
        header: "Remark",
        render: (r) => r.remark || "—",
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={results}
      isLoading={isLoading}
      emptyTitle="No published results yet"
      emptyDescription="Results appear here once the school publishes them for you."
      rowKey={(r) => r._id}
      mobileCard={(r) => (
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-medium text-ink-900">{subjectLabel(r.classSubject)}</p>
            <p className="text-xs text-ink-500">
              Score {r.totalScore} · Grade {r.letterGrade}
            </p>
          </div>
          <span className="text-sm font-semibold">{r.gradePoint}</span>
        </div>
      )}
    />
  );
}

// ======================================================
// Printable report card
// ======================================================

function ReportCardView({
  query,
  semesterName,
}: {
  query: ReturnType<typeof useGetStudentReportCardQuery>;
  semesterName: string;
}) {
  const { data, isLoading, isError, error, refetch } = query;
  const card = data?.data;
  const periodName = refName(card?.academicSemester ?? null);
  const sessionName = refName(card?.academicSession ?? null);
  const studentLine =
    card?.student && typeof card.student !== "string"
      ? [
          card.student.registrationNumber,
          card.student.academicClass ? classLabel(card.student.academicClass) : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "";

  return (
    <Card>
      {isError ? (
        <Alert tone="error" title="Could not load report card">
          <div className="flex items-center gap-3">
            <span>{getApiErrorMessage(error, "Request failed.")}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : isLoading ? (
        <div className="space-y-3" role="status" aria-live="polite">
          <span className="sr-only">Loading report card…</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-2/3 animate-pulse rounded bg-ink-100" />
          ))}
        </div>
      ) : !card?.results?.length ? (
        <EmptyState
          title="No report card yet"
          description="The report card will be available once results are computed and published."
        />
      ) : (
        <div className="print:border-0">
          <header className="border-b border-ink-100 pb-4 text-center">
            <h2 className="text-lg font-bold text-ink-900">Report Card</h2>
            <p className="mt-1 text-sm text-ink-600">
              {studentDisplayName(card.student) || "—"}
              {studentLine ? ` · ${studentLine}` : ""}
            </p>
            <p className="text-xs text-ink-500">
              {[sessionName !== "—" ? sessionName : null, periodName !== "—" ? periodName : semesterName]
                .filter(Boolean)
                .join(" · ") || "\u00a0"}
            </p>
          </header>

          <table className="mt-4 w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-forest-50/60">
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Subject
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Score
                </th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Grade
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Remark
                </th>
              </tr>
            </thead>
            <tbody>
              {(card.results ?? []).map((r: ClassSubjectResult) => (
                <tr key={r._id} className="border-t border-ink-100">
                  <td className="px-3 py-2 text-ink-800">
                    {subjectLabel(r.classSubject)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-ink-900">
                    {r.totalScore}
                  </td>
                  <td className="px-3 py-2 text-center">{r.letterGrade}</td>
                  <td className="px-3 py-2 text-ink-600">{r.remark || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {card.summary && (
            <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-100 pt-3 text-xs text-ink-600">
              {card.summary.average !== undefined && (
                <div>
                  <dt className="text-ink-500">Average</dt>
                  <dd className="text-sm font-semibold text-ink-900">
                    {card.summary.average}
                  </dd>
                </div>
              )}
              {card.summary.gpa !== undefined && (
                <div>
                  <dt className="text-ink-500">GPA</dt>
                  <dd className="text-sm font-semibold text-ink-900">
                    {card.summary.gpa}
                  </dd>
                </div>
              )}
              {card.summary.totalStudents !== undefined && (
                <div>
                  <dt className="text-ink-500">Subjects</dt>
                  <dd className="text-sm font-semibold text-ink-900">
                    {card.summary.totalStudents}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}
    </Card>
  );
}

// ======================================================
// Printable transcript
// ======================================================

function TranscriptView({
  query,
}: {
  query: ReturnType<typeof useGetStudentTranscriptQuery>;
}) {
  const { data, isLoading, isError, error, refetch } = query;
  const transcript = data?.data;
  const periods: TranscriptPeriod[] = transcript?.periods?.length
    ? transcript.periods
    : transcript?.results
      ? [{ results: transcript.results, summary: transcript.summary }]
      : [];

  return (
    <Card>
      {isError ? (
        <Alert tone="error" title="Could not load transcript">
          <div className="flex items-center gap-3">
            <span>{getApiErrorMessage(error, "Request failed.")}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : isLoading ? (
        <div className="space-y-3" role="status" aria-live="polite">
          <span className="sr-only">Loading transcript…</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-2/3 animate-pulse rounded bg-ink-100" />
          ))}
        </div>
      ) : periods.length === 0 ? (
        <EmptyState
          title="No transcript yet"
          description="The transcript will be available once results are computed."
        />
      ) : (
        <div className="space-y-6">
          <header className="text-center">
            <h2 className="text-lg font-bold text-ink-900">Academic Transcript</h2>
            <p className="mt-1 text-sm text-ink-600">
              {studentDisplayName(transcript?.student) || "—"}
              {typeof transcript?.student === "object" &&
                transcript.student !== null &&
                transcript.student.registrationNumber &&
                ` · ${transcript.student.registrationNumber}`}
            </p>
          </header>

          {periods.map((period, index) => (
            <section key={period.title ?? index} className="border-t border-ink-100 pt-4 first:border-0 first:pt-0">
              <h3 className="text-sm font-semibold text-ink-800">
                {period.title ||
                  [
                    refName(period.academicSession ?? null),
                    refName(period.academicSemester ?? null),
                  ]
                    .filter((n) => n !== "—")
                    .join(" · ") ||
                  `Period ${index + 1}`}
              </h3>
              {(period.results ?? []).length === 0 ? (
                <p className="mt-2 text-xs text-ink-500">No results in this period.</p>
              ) : (
                <table className="mt-2 w-full min-w-[420px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 bg-forest-50/60">
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                        Subject
                      </th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                        Score
                      </th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                        Grade
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(period.results ?? []).map((r: ClassSubjectResult) => (
                      <tr key={r._id} className="border-t border-ink-100">
                        <td className="px-3 py-2 text-ink-800">
                          {subjectLabel(r.classSubject)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-ink-900">
                          {r.totalScore}
                        </td>
                        <td className="px-3 py-2 text-center">{r.letterGrade}</td>
                        <td className="px-3 py-2 text-ink-600">{r.remark || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {period.summary?.gpa !== undefined && (
                <p className="mt-2 text-xs text-ink-500">
                  GPA for this period:{" "}
                  <span className="font-semibold text-ink-900">
                    {period.summary.gpa}
                  </span>
                </p>
              )}
            </section>
          ))}

          {transcript?.summary?.gpa !== undefined && (
            <p className="border-t border-ink-100 pt-3 text-sm text-ink-600">
              Cumulative GPA:{" "}
              <span className="text-base font-bold text-ink-900">
                {transcript.summary.gpa}
              </span>
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
