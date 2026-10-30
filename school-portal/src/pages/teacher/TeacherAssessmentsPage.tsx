import { useEffect, useState } from "react";
import { Calculator, PencilLine, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { InputField, SelectField } from "@/components/ui/Fields";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";

import {
  getApiErrorMessage,
  refId,
  refName,
  studentName,
  useBulkUpsertAssessmentScoresMutation,
  useComputeResultsMutation,
  useCreateAssessmentMutation,
  useDeleteAssessmentMutation,
  useGetAcademicSemestersQuery,
  useGetAcademicSessionsQuery,
  useGetAssessmentScoresQuery,
  useGetAssessmentsQuery,
  useGetClassResultsQuery,
  useGetMyAssignmentsQuery,
  useUpdateAssessmentMutation,
  type AcademicSemesterRef,
  type AcademicSessionRef,
  type Assessment,
  type ComputeResultsResponse,
  type StudentRefLite,
  type TeacherAssignment,
} from "@/features/teacher/api";

const PAGE_SIZE = 10;

const ASSESSMENT_TYPES = [
  "Quiz",
  "Test",
  "Classwork",
  "Assignment",
  "Project",
  "Midterm",
  "Exam",
] as const;

export function TeacherAssessmentsPage() {
  const assignmentsQ = useGetMyAssignmentsQuery();
  const sessionsQ = useGetAcademicSessionsQuery();
  const semestersQ = useGetAcademicSemestersQuery();

  const assignments = assignmentsQ.data?.data ?? [];

  const [classSubject, setClassSubject] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);
  const [scoring, setScoring] = useState<Assessment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const [deleteAssessment, { isLoading: deleting }] = useDeleteAssessmentMutation();

  const assessments = useGetAssessmentsQuery({
    classSubject: classSubject || undefined,
    academicSession: sessionId || undefined,
    academicSemester: semesterId || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const rows = assessments.data?.data ?? [];

  const columns: Column<Assessment>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (a) => a.name,
      render: (a) => (
        <div>
          <p className="font-medium text-ink-900">{a.name}</p>
          {refName(a.classSubject) && (
            <p className="mt-0.5 text-xs text-ink-500">
              {classSubjectLabel(a.classSubject)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortValue: (a) => a.type,
      render: (a) => <Badge tone="info">{a.type || "—"}</Badge>,
    },
    {
      key: "maxScore",
      header: "Max score",
      align: "end",
      sortValue: (a) => a.maxScore,
      render: (a) => a.maxScore.toLocaleString(),
    },
    {
      key: "weight",
      header: "Weight",
      align: "end",
      sortValue: (a) => a.weight,
      render: (a) => `${a.weight ?? 0}%`,
    },
    {
      key: "dueDate",
      header: "Due date",
      sortValue: (a) => a.dueDate ?? "",
      render: (a) => fmtDay(a.dueDate),
    },
    {
      key: "isActive",
      header: "Active",
      sortValue: (a) => (a.isActive ? 1 : 0),
      render: (a) =>
        a.isActive ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="neutral">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" onClick={() => setScoring(a)}>
            Scores
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<PencilLine className="size-3.5" aria-hidden />}
            aria-label={`Edit assessment: ${a.name}`}
            onClick={() => {
              setEditing(a);
              setFormOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="size-3.5" aria-hidden />}
            aria-label={`Delete assessment: ${a.name}`}
            onClick={() => setDeleteTarget(a)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Assessments"
        description="Classwork, tests and exams for your assigned class-subjects."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New assessment
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
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Class-subject"
            value={classSubject}
            onChange={(e) => {
              setClassSubject(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All my class-subjects</option>
            {assignments.map((assignment) => (
              <option key={assignment._id} value={refId(assignment.classSubject) ?? ""}>
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
        </div>
      </Card>

      <Card padded={false}>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={assessments.isLoading}
          emptyTitle="No assessments yet"
          emptyDescription={
            classSubject
              ? "Create one for this class-subject — start with a short quiz or classwork."
              : "Choose a class-subject above or create your first assessment."
          }
          emptyAction={
            <Button
              icon={<Plus className="size-4" aria-hidden />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New assessment
            </Button>
          }
          rowKey={(a) => a._id}
          mobileCard={(a) => (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{a.type || "—"}</Badge>
                {a.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
              </div>
              <p className="font-medium text-ink-900">{a.name}</p>
              <p className="text-xs text-ink-500">
                Max {a.maxScore.toLocaleString()} · Weight {a.weight ?? 0}% · Due {fmtDay(a.dueDate)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setScoring(a)}>
                  Scores
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(a); setFormOpen(true); }}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(a)}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        />
        <PagedFooter pagination={assessments.data?.pagination} onPageChange={setPage} />
      </Card>

      <section className="mt-8">
        <SectionTitle>Compute results</SectionTitle>
        <ComputeResultsCard
          assignments={assignments}
          sessions={sessionsQ.data?.data ?? []}
          semesters={semestersQ.data?.data ?? []}
          defaultClassSubject={classSubject}
          defaultSession={sessionId}
          defaultSemester={semesterId}
          onDone={(message) => setNotice(message)}
          onError={(message) => setBannerError(message)}
        />
      </section>

      {formOpen && (
        <AssessmentFormDialog
          editing={editing}
          assignments={assignments}
          assessments={rows}
          sessions={sessionsQ.data?.data ?? []}
          semesters={semestersQ.data?.data ?? []}
          defaults={{ classSubject, sessionId, semesterId }}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onDone={(message) => {
            setFormOpen(false);
            setEditing(null);
            setNotice(message);
          }}
          onError={(message) => setBannerError(message)}
        />
      )}

      {scoring && (
        <ScoresDialog
          key={scoring._id}
          assessment={scoring}
          onClose={() => setScoring(null)}
          onDone={(message) => {
            setScoring(null);
            setNotice(message);
          }}
          onError={(message) => setBannerError(message)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        tone="danger"
        title="Delete assessment"
        confirmLabel="Delete"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        description={
          deleteTarget
            ? `This removes "${deleteTarget.name}" and its scores.`
            : undefined
        }
        onConfirm={() => {
          void (async () => {
            if (!deleteTarget) return;
            try {
              await deleteAssessment(deleteTarget._id).unwrap();
              setDeleteTarget(null);
              setNotice("Assessment deleted.");
            } catch (err) {
              setDeleteTarget(null);
              setBannerError(getApiErrorMessage(err));
            }
          })();
        }}
      />
    </div>
  );
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

function classSubjectLabel(
  value: Assessment["classSubject"],
): string {
  if (value && typeof value === "object") {
    const parts = [
      refName(value.academicClass),
      refName(value.subject),
    ].filter(Boolean) as string[];
    return parts.length > 0 ? parts.join(" — ") : (value.name ?? "—");
  }
  return refName(value) ?? "—";
}

function fmtDay(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function AssessmentFormDialog({
  editing,
  assignments,
  assessments,
  sessions,
  semesters,
  defaults,
  onClose,
  onDone,
  onError,
}: {
  editing: Assessment | null;
  assignments: TeacherAssignment[];
  assessments: Assessment[];
  sessions: AcademicSessionRef[];
  semesters: AcademicSemesterRef[];
  defaults: { classSubject: string; sessionId: string; semesterId: string };
  onClose: () => void;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [createAssessment, { isLoading: creating }] = useCreateAssessmentMutation();
  const [updateAssessment, { isLoading: updating }] = useUpdateAssessmentMutation();

  const defaultClassSubject = refId(editing?.classSubject) ?? defaults.classSubject;
  const defaultSession = refId(editing?.academicSession) ?? defaults.sessionId;
  const defaultSemester = refId(editing?.academicSemester) ?? defaults.semesterId;

  const [classSubject, setClassSubject] = useState(defaultClassSubject);
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<string>(editing?.type ?? ASSESSMENT_TYPES[0]);
  const [maxScore, setMaxScore] = useState(
    editing ? String(editing.maxScore) : "100",
  );
  const [weight, setWeight] = useState(
    editing?.weight !== undefined ? String(editing.weight) : "",
  );
  const [dueDate, setDueDate] = useState(editing?.dueDate?.slice(0, 10) ?? "");
  const [session, setSession] = useState(defaultSession);
  const [semester, setSemester] = useState(defaultSemester);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);

  const existingWeight = assessments
    .filter(
      (a) =>
        a.isActive &&
        a._id !== editing?._id &&
        refId(a.classSubject) === classSubject,
    )
    .reduce((sum, a) => sum + (a.weight ?? 0), 0);
  const remainingWeight = Math.max(0, 100 - existingWeight);

  const numericMax = Number(maxScore);
  const valid =
    Boolean(classSubject) &&
    Boolean(name.trim()) &&
    Boolean(type) &&
    Number.isFinite(numericMax) &&
    numericMax > 0 &&
    (!weight || (Number.isFinite(Number(weight)) && Number(weight) >= 0));

  const submit = () => {
    void (async () => {
      onError("");
      const payload = {
        classSubject,
        name: name.trim(),
        type,
        maxScore: numericMax,
        ...(weight && Number(weight) > 0 ? { weight: Number(weight) } : {}),
        ...(dueDate ? { dueDate } : {}),
        ...(session ? { academicSession: session } : {}),
        ...(semester ? { academicSemester: semester } : {}),
        isActive,
      };
      try {
        if (editing) {
          await updateAssessment({ id: editing._id, ...payload }).unwrap();
          onDone("Assessment updated.");
        } else {
          await createAssessment(payload).unwrap();
          onDone("Assessment created — open “Scores” to record marks.");
        }
      } catch (err) {
        onError(getApiErrorMessage(err));
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={editing ? "Edit assessment" : "New assessment"}
      description="Weights are used when computing results — keep the total per subject within 100%."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button loading={creating || updating} disabled={!valid} onClick={submit}>
            {editing ? "Save changes" : "Create assessment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField
          label="Class-subject"
          required
          value={classSubject}
          onChange={(e) => setClassSubject(e.target.value)}
        >
          <option value="">Select class-subject…</option>
          {assignments.map((assignment) => (
            <option key={assignment._id} value={refId(assignment.classSubject) ?? ""}>
              {assignmentLabel(assignment.classSubject)}
            </option>
          ))}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <SelectField
            label="Type"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {ASSESSMENT_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Max score"
            required
            type="number"
            min={1}
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
          />
          <InputField
            label="Weight (%)"
            type="number"
            min={0}
            max={100}
            hint={`Existing weights for this class-subject: ${existingWeight}% · up to ${remainingWeight}% left of 100%`}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <InputField
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <SelectField
            label="Academic session"
            value={session}
            onChange={(e) => setSession(e.target.value)}
          >
            <option value="">Inherit from assignment</option>
            {sessions.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Academic semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <option value="">Inherit from assignment</option>
            {semesters.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Status"
            value={isActive ? "active" : "inactive"}
            onChange={(e) => setIsActive(e.target.value === "active")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectField>
        </div>
        {existingWeight >= 100 && (
          <Alert tone="warning">
            This class-subject already carries {existingWeight}% assessed weight.
            Consider deactivating an older assessment before adding more.
          </Alert>
        )}
      </div>
    </Dialog>
  );
}

function ScoresDialog({
  assessment,
  onClose,
  onDone,
  onError,
}: {
  assessment: Assessment;
  onClose: () => void;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const scoresQ = useGetAssessmentScoresQuery(assessment._id);
  const [saveScores, { isLoading: saving }] =
    useBulkUpsertAssessmentScoresMutation();

  const [scores, setScores] = useState<
    Record<string, { score: string; remarks: string }>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!scoresQ.data) return;
    const scoresData = scoresQ.data.data;
    const next: Record<string, { score: string; remarks: string }> = {};
    for (const entry of scoresData.scores) {
      const studentId = scoreStudentId(entry.student);
      next[studentId] = {
        score: String(entry.score),
        remarks: entry.remarks ?? "",
      };
    }
    setScores(next);
  }, [scoresQ.data]);

  const scoreList = scoresQ.data?.data.scores ?? [];
  const statistics = scoresQ.data?.data.statistics;

  const submit = () => {
    void (async () => {
      setFormError(null);
      const records = scoreList.map((entry) => {
        const studentId = scoreStudentId(entry.student);
        const raw = scores[studentId];
        return {
          student: studentId,
          score: raw ? Number(raw.score) : 0,
          remarks: raw?.remarks.trim() ? raw.remarks.trim() : undefined,
        };
      });
      const invalid = records.some(
        (record) =>
          !Number.isFinite(record.score) ||
          record.score < 0 ||
          record.score > assessment.maxScore,
      );
      if (records.length === 0 || invalid) {
        setFormError(
          `Every score must be a number between 0 and ${assessment.maxScore}.`,
        );
        return;
      }
      try {
        await saveScores({ id: assessment._id, records }).unwrap();
        onDone(`Scores saved for ${assessmentTitle(assessment)}.`);
      } catch (err) {
        onError(getApiErrorMessage(err));
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`Scores — ${assessment.name}`}
      description={`Max score ${assessment.maxScore.toLocaleString()} · weight ${assessment.weight ?? 0}% · ${assessmentTitle(assessment)}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            loading={saving}
            disabled={scoreList.length === 0}
            onClick={submit}
          >
            Save scores
          </Button>
        </>
      }
    >
      {scoresQ.isError ? (
        <Alert tone="error" title="Could not load scores">
          {getApiErrorMessage(scoresQ.error)}
        </Alert>
      ) : statistics ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="neutral">Students {statistics.count.toLocaleString()}</Badge>
          <Badge tone="gold">Average {statistics.average.toLocaleString()}</Badge>
          <Badge tone="success">Highest {statistics.highest.toLocaleString()}</Badge>
          <Badge tone="danger">Lowest {statistics.lowest.toLocaleString()}</Badge>
        </div>
      ) : null}
      {formError && (
        <Alert tone="error" className="mb-4">
          {formError}
        </Alert>
      )}
      {scoresQ.isLoading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <span className="sr-only">Loading scores…</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-ink-100" />
          ))}
        </div>
      ) : scoreList.length === 0 ? (
        <Alert tone="info">
          No students found for this assessment — confirm enrolments exist for
          the selected session.
        </Alert>
      ) : (
        <div className="space-y-2">
          {scoreList.map((entry) => {
            const studentId = scoreStudentId(entry.student);
            const current = scores[studentId] ?? { score: "", remarks: "" };
            const parsed = Number(current.score);
            const invalidRow =
              current.score !== "" &&
              (!Number.isFinite(parsed) ||
                parsed < 0 ||
                parsed > assessment.maxScore);
            return (
              <div
                key={studentId}
                className="flex flex-wrap items-center gap-2 rounded-card border border-ink-100 px-3 py-2"
              >
                <p className="min-w-16 flex-1 truncate text-sm font-medium text-ink-900">
                  {studentName(entry.student)}
                </p>
                <input
                  type="number"
                  min={0}
                  max={assessment.maxScore}
                  aria-label={`Score for ${studentName(entry.student)}`}
                  aria-invalid={invalidRow ? "true" : undefined}
                  className={`w-20 rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                    invalidRow
                      ? "border-red-400 ring-red-400/30"
                      : "border-ink-200 focus:border-primary-500 focus:ring-primary-500/30"
                  }`}
                  value={current.score}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [studentId]: { ...current, score: e.target.value },
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Remarks"
                  aria-label={`Remarks for ${studentName(entry.student)}`}
                  className="w-40 rounded-lg border border-ink-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  value={current.remarks}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [studentId]: { ...current, remarks: e.target.value },
                    }))
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}


function scoreStudentId(value: StudentRefLite | string): string {
  return typeof value === "string" ? value : value._id;
}

function assessmentTitle(assessment: Assessment): string {
  if (assessment.classSubject && typeof assessment.classSubject === "object") {
    const parts = [
      refName(assessment.classSubject.academicClass),
      refName(assessment.classSubject.subject),
    ].filter(Boolean) as string[];
    if (parts.length > 0) return parts.join(" — ");
  }
  return assessment.name;
}

function ComputeResultsCard({
  assignments,
  sessions,
  semesters,
  defaultClassSubject,
  defaultSession,
  defaultSemester,
  onDone,
  onError,
}: {
  assignments: TeacherAssignment[];
  sessions: AcademicSessionRef[];
  semesters: AcademicSemesterRef[];
  defaultClassSubject: string;
  defaultSession: string;
  defaultSemester: string;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [classSubject, setClassSubject] = useState(defaultClassSubject);
  const [session, setSession] = useState(defaultSession);
  const [semester, setSemester] = useState(defaultSemester);
  const [computed, setComputed] = useState<ComputeResultsResponse | null>(null);

  const [computeResults, { isLoading }] = useComputeResultsMutation();

  const summaryQ = useGetClassResultsQuery(
    {
      classSubject,
      academicSession: session || undefined,
      academicSemester: semester || undefined,
      page: 1,
      limit: 1,
    },
    { skip: !classSubject || !computed },
  );

  const submit = () => {
    void (async () => {
      onError("");
      try {
        const result = await computeResults({
          classSubject,
          academicSession: session || undefined,
          academicSemester: semester || undefined,
        }).unwrap();
        setComputed(result.data);
        onDone(
          `Results computed — ${result.data.studentsProcessed} students from ${result.data.assessmentsUsed} assessments.`,
        );
      } catch (err) {
        onError(getApiErrorMessage(err));
      }
    })();
  };

  const summary = computed ? summaryQ.data?.summary : undefined;

  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Class-subject"
          value={classSubject}
          onChange={(e) => {
            setClassSubject(e.target.value);
            setComputed(null);
          }}
        >
          <option value="">Select class-subject…</option>
          {assignments.map((assignment) => (
            <option key={assignment._id} value={refId(assignment.classSubject) ?? ""}>
              {assignmentLabel(assignment.classSubject)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Academic session"
          value={session}
          onChange={(e) => {
            setSession(e.target.value);
            setComputed(null);
          }}
        >
          <option value="">Any session</option>
          {sessions.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Academic semester"
          value={semester}
          onChange={(e) => {
            setSemester(e.target.value);
            setComputed(null);
          }}
        >
          <option value="">Any semester</option>
          {semesters.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          icon={<Calculator className="size-4" aria-hidden />}
          loading={isLoading}
          disabled={!classSubject}
          onClick={submit}
        >
          Compute results
        </Button>
        {computed && (
          <p className="text-xs text-ink-500">
            {computed.studentsProcessed.toLocaleString()} students —{" "}
            {computed.assessmentsUsed} assessments used.
          </p>
        )}
      </div>
      {summary && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge
            tone={gradeTone(
              summary.passRate !== undefined && summary.passRate >= 50 ? "A" : "F",
            )}
          >
            Pass rate{" "}
            {summary.passRate !== undefined
              ? `${Number(summary.passRate).toFixed(1)}%`
              : "—"}
          </Badge>
          <Badge tone="gold">Highest {summary.highest ?? "—"}</Badge>
          <Badge tone="danger">Lowest {summary.lowest ?? "—"}</Badge>
        </div>
      )}
    </Card>
  );
}
