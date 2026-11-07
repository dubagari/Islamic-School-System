import { useEffect, useMemo, useState } from "react";
import { ClipboardList, PencilLine, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import { FormField, InputField, SelectField, TextareaField } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  useCreateAssessmentMutation,
  useDeleteAssessmentMutation,
  useGetClassRosterQuery,
  useListAssessmentScoresQuery,
  useListAssessmentsQuery,
  useListClassSubjectsQuery,
  useSaveAssessmentScoresMutation,
  useUpdateAssessmentMutation,
  ASSESSMENT_TYPES,
  type Assessment,
  type AssessmentBody,
  type AssessmentType,
  type ClassSubjectRef,
  type RosterStudent,
} from "@/features/academics-records/api";
import { getApiErrorMessage } from "@/features/staff/api";
import {
  useGetAcademicSemestersQuery,
} from "@/features/students/api";
import { cn } from "@/lib/cn";

type Tab = "assessments" | "scores";

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function subjectLabel(cs: ClassSubjectRef): string {
  const subject = cs.subject;
  const subjectName =
    typeof subject === "object" && subject !== null
      ? subject.name ?? subject.prefix ?? "—"
      : "—";
  const className =
    typeof cs.academicClass === "object" && cs.academicClass !== null
      ? cs.academicClass.name
      : undefined;
  return className ? `${subjectName} — ${className}` : subjectName;
}

function classSubjectClassId(cs: ClassSubjectRef | undefined): string {
  if (!cs) return "";
  return typeof cs.academicClass === "object" && cs.academicClass !== null
    ? cs.academicClass._id
    : "";
}

function studentDisplayName(student: unknown): string {
  if (!student || typeof student === "string") return "—";
  const person = student as {
    fullName?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
  };
  return (
    person.fullName ||
    [person.firstName, person.middleName, person.lastName]
      .filter(Boolean)
      .join(" ") ||
    "—"
  );
}

export function AssessmentsPage() {
  const [tab, setTab] = useState<Tab>("assessments");
  const [semesterId, setSemesterId] = useState("");
  const [classSubjectId, setClassSubjectId] = useState("");
  const [scoresAssessmentId, setScoresAssessmentId] = useState("");

  const { data: semestersData } = useGetAcademicSemestersQuery();
  const semesters = semestersData?.data ?? [];

  useEffect(() => {
    if (semesters.length === 0) return;
    setSemesterId((prev) =>
      prev && semesters.some((s) => s._id === prev)
        ? prev
        : (semesters.find((s) => s.isCurrent)?._id ?? semesters[0]._id),
    );
  }, [semesters]);

  const { data: classSubjectsData, isLoading: classSubjectsLoading } =
    useListClassSubjectsQuery(
      { academicSemester: semesterId || undefined, isActive: true },
      { skip: !semesterId },
    );
  const classSubjects = classSubjectsData?.data ?? [];
  const selectedClassSubject = classSubjects.find((cs) => cs._id === classSubjectId);

  const { data: assessmentsData, isLoading: assessmentsLoading, isError, error, refetch } =
    useListAssessmentsQuery(
      { classSubject: classSubjectId, limit: 200 },
      { skip: !classSubjectId },
    );
  const assessments = assessmentsData?.data ?? [];
  const selectedAssessment = assessments.find((a) => a._id === scoresAssessmentId);

  const [createAssessment, { isLoading: creating }] = useCreateAssessmentMutation();
  const [updateAssessment, { isLoading: updating }] = useUpdateAssessmentMutation();
  const [deleteAssessment, { isLoading: deleting }] = useDeleteAssessmentMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [toDelete, setToDelete] = useState<Assessment | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const weightUsed = assessments
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + (a.weight ?? 0), 0);

  const columns: Column<Assessment>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Assessment",
        sortValue: (a) => a.name,
        render: (a) => (
          <div className="flex flex-col">
            <span className="font-medium text-ink-900">{a.name}</span>
            {a.description && (
              <span className="text-xs text-ink-500">{a.description}</span>
            )}
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        sortValue: (a) => a.type,
        render: (a) => <Badge tone="info">{a.type}</Badge>,
      },
      {
        key: "maxScore",
        header: "Max score",
        align: "end",
        sortValue: (a) => a.maxScore,
        render: (a) => a.maxScore,
      },
      {
        key: "weight",
        header: "Weight",
        align: "end",
        sortValue: (a) => a.weight,
        render: (a) => `${a.weight}%`,
      },
      {
        key: "date",
        header: "Date",
        sortValue: (a) => a.date,
        render: (a) => fmtDate(a.date),
      },
      {
        key: "isActive",
        header: "Status",
        align: "center",
        render: (a) =>
          a.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>,
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (a) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setScoresAssessmentId(a._id);
                setTab("scores");
              }}
            >
              Enter scores
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<PencilLine className="size-3.5" aria-hidden />}
              onClick={() => setEditing(a)}
              aria-label={`Edit ${a.name}`}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 className="size-3.5" aria-hidden />}
              onClick={() => setToDelete(a)}
              className="text-red-700 hover:bg-red-50"
              aria-label={`Delete ${a.name}`}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Assessments"
        arabic="التقييم"
        description="Create assessments, manage their weightings, and record student scores."
      />

      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField
            label="Semester"
            value={semesterId}
            onChange={(e) => {
              setSemesterId(e.target.value);
              setClassSubjectId("");
              setScoresAssessmentId("");
            }}
          >
            <option value="">Select semester…</option>
            {semesters.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
                {s.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Class subject"
            required
            value={classSubjectId}
            onChange={(e) => {
              setClassSubjectId(e.target.value);
              setScoresAssessmentId("");
            }}
            hint="Only subjects assigned to a class and semester can have assessments."
          >
            <option value="">Select class subject…</option>
            {classSubjects.map((cs) => (
              <option key={cs._id} value={cs._id}>
                {subjectLabel(cs)}
              </option>
            ))}
          </SelectField>

          <div className="flex items-end gap-2">
            <div className="flex-1 rounded-lg border border-ink-100 bg-forest-50/60 px-3 py-2 text-xs">
              <p className="text-ink-500">
                Weight used for active assessments
              </p>
              <p
                className={cn(
                  "mt-0.5 text-base font-bold",
                  weightUsed > 100 ? "text-red-700" : "text-ink-900",
                )}
              >
                {weightUsed} / 100%
              </p>
            </div>
          </div>
        </div>

        {classSubjectsLoading && semesterId && (
          <p className="mt-3 text-xs text-ink-500" role="status" aria-live="polite">
            Loading class subjects…
          </p>
        )}
      </Card>

      {classSubjectId && (
        <div className="mb-4 flex gap-1 rounded-lg border border-ink-100 bg-white p-1 shadow-card sm:w-fit">
          {(
            [
              { id: "assessments", label: "Assessments" },
              { id: "scores", label: "Scores entry" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-primary-700 text-white"
                  : "text-ink-700 hover:bg-forest-50",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {notice && (
        <Alert
          tone={notice.tone}
          title={notice.tone === "success" ? "Saved" : "Something went wrong"}
          className="mb-4"
          onDismiss={() => setNotice(null)}
        >
          {notice.message}
        </Alert>
      )}

      {tab === "assessments" ? (
        <Card
          title={`Assessments${selectedClassSubject ? ` — ${subjectLabel(selectedClassSubject)}` : ""}`}
          padded={false}
          actions={
            <Button
              size="sm"
              icon={<Plus className="size-4" aria-hidden />}
              disabled={!classSubjectId}
              onClick={() => setCreateOpen(true)}
            >
              New assessment
            </Button>
          }
        >
          {isError ? (
            <div className="p-5">
              <Alert tone="error" title="Could not load assessments">
                <div className="flex items-center gap-3">
                  <span>{getApiErrorMessage(error, "Request failed.")}</span>
                  <Button size="sm" variant="outline" onClick={() => void refetch()}>
                    Retry
                  </Button>
                </div>
              </Alert>
            </div>
          ) : !classSubjectId ? (
            <div className="p-5">
              <EmptyState
                title="Select a class subject"
                description="Choose a semester and class subject to manage its assessments."
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={assessments}
              isLoading={assessmentsLoading}
              emptyTitle="No assessments for this subject yet"
              emptyDescription="Create the first assessment to start recording scores."
              rowKey={(a) => a._id}
            />
          )}
        </Card>
      ) : (
        <ScoresEntrySection
          classSubject={selectedClassSubject}
          assessments={assessments}
          selectedAssessment={selectedAssessment}
          onSelectAssessment={setScoresAssessmentId}
          onSaved={(message) => {
            setNotice({ tone: "success", message });
            setTab("scores");
          }}
        />
      )}

      <AssessmentDialog
        key={editing?._id ?? "new"}
        open={createOpen || editing !== null}
        editing={editing}
        classSubjectId={classSubjectId}
        weightUsed={weightUsed}
        creating={creating || updating}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onSubmit={async (body) => {
          if (editing) {
            await updateAssessment({ id: editing._id, body }).unwrap();
            return "Assessment updated successfully.";
          }
          await createAssessment(body).unwrap();
          return "Assessment created successfully.";
        }}
        onDone={(message) => {
          setCreateOpen(false);
          setEditing(null);
          setNotice({ tone: "success", message });
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        tone="danger"
        title="Delete assessment"
        confirmLabel="Delete"
        loading={deleting}
        onClose={() => setToDelete(null)}
        description={
          toDelete
            ? `"${toDelete.name}" and all of its recorded student scores will be permanently removed.`
            : undefined
        }
        onConfirm={() => {
          void (async () => {
            if (!toDelete) return;
            try {
              await deleteAssessment(toDelete._id).unwrap();
              setToDelete(null);
              setNotice({ tone: "success", message: "Assessment deleted." });
              if (scoresAssessmentId === toDelete._id) {
                setScoresAssessmentId("");
              }
            } catch (err) {
              setToDelete(null);
              setNotice({
                tone: "error",
                message: getApiErrorMessage(err, "Could not delete assessment."),
              });
            }
          })();
        }}
      />
    </div>
  );
}

// ======================================================
// Create / edit assessment dialog
// ======================================================

function AssessmentDialog({
  open,
  editing,
  classSubjectId,
  weightUsed,
  creating,
  onClose,
  onSubmit,
  onDone,
}: {
  open: boolean;
  editing: Assessment | null;
  classSubjectId: string;
  weightUsed: number;
  creating: boolean;
  onClose: () => void;
  onSubmit: (body: AssessmentBody) => Promise<string>;
  onDone: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AssessmentType>("Test");
  const [maxScore, setMaxScore] = useState("20");
  const [weight, setWeight] = useState("20");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const assembled = editing;
  useEffect(() => {
    if (assembled) {
      setName(assembled.name);
      setType(assembled.type);
      setMaxScore(String(assembled.maxScore));
      setWeight(String(assembled.weight));
      setDate(assembled.date?.slice(0, 10) ?? "");
      setDescription(assembled.description ?? "");
    } else if (open) {
      setName("");
      setType("Test");
      setMaxScore("20");
      setWeight("20");
      setDate("");
      setDescription("");
    }
  }, [assembled, open]);

  const maxScoreNum = Number(maxScore);
  const weightNum = Number(weight);
  const valid =
    Boolean(classSubjectId) &&
    name.trim().length > 0 &&
    Number.isFinite(maxScoreNum) &&
    maxScoreNum > 0 &&
    Number.isFinite(weightNum) &&
    weightNum >= 0 &&
    weightNum <= 100 &&
    Boolean(date);

  const projected =
    editing && editing.isActive
      ? weightUsed - (editing.weight ?? 0) + (Number.isFinite(weightNum) ? weightNum : 0)
      : weightUsed + (Number.isFinite(weightNum) ? weightNum : 0);

  const submit = () => {
    void (async () => {
      setFormError(null);
      try {
        const message = await onSubmit({
          classSubject: classSubjectId,
          name: name.trim(),
          type,
          maxScore: maxScoreNum,
          weight: weightNum,
          date,
          ...(description.trim() ? { description: description.trim() } : {}),
        });
        onDone(message);
      } catch (err) {
        setFormError(getApiErrorMessage(err, "Could not save the assessment."));
      }
    })();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit assessment" : "New assessment"}
      description="The total weight of active assessments for this subject and semester cannot exceed 100."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={submit} loading={creating} disabled={!valid}>
            {editing ? "Save changes" : "Create assessment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <InputField
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. First Test"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as AssessmentType)}
          >
            {ASSESSMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </SelectField>

          <InputField
            label="Date"
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InputField
            label="Max score"
            required
            type="number"
            min={1}
            step="1"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            error={
              maxScore !== "" && (!Number.isFinite(maxScoreNum) || maxScoreNum <= 0)
                ? "Max score must be a positive number."
                : undefined
            }
          />
          <InputField
            label="Weight (%)"
            required
            type="number"
            min={0}
            max={100}
            step="1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            error={
              weight !== "" &&
              (!Number.isFinite(weightNum) || weightNum < 0 || weightNum > 100)
                ? "Weight must be between 0 and 100."
                : undefined
            }
            hint={
              editing && editing.isActive
                ? `Projected total weight: ${Math.round(projected)}% / 100%`
                : `Projected total weight: ${Math.round(projected)}% / 100%`
            }
          />
        </div>

        <TextareaField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional short description"
          rows={2}
        />

        {projected > 100 && (
          <Alert tone="warning" title="Weight budget exceeded">
            The active assessments for this subject and semester would total{" "}
            {Math.round(projected)}%, above the 100% maximum. The server may
            reject this change.
          </Alert>
        )}

        {formError && (
          <Alert tone="error" title="Could not save the assessment">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}

// ======================================================
// Scores entry
// ======================================================

function ScoresEntrySection({
  classSubject,
  assessments,
  selectedAssessment,
  onSelectAssessment,
  onSaved,
}: {
  classSubject: ClassSubjectRef | undefined;
  assessments: Assessment[];
  selectedAssessment: Assessment | undefined;
  onSelectAssessment: (id: string) => void;
  onSaved: (message: string) => void;
}) {
  const [drafts, setDrafts] = useState<
    Record<string, { score: string; remarks: string }>
  >({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: scoresData, isLoading: scoresLoading } = useListAssessmentScoresQuery(
    selectedAssessment?._id ?? "",
    { skip: !selectedAssessment },
  );

  const { data: rosterData, isLoading: rosterLoading } = useGetClassRosterQuery(
    { academicClass: classSubjectClassId(classSubject) },
    { skip: !classSubject },
  );

  const roster: RosterStudent[] = rosterData?.data ?? [];
  const scores = scoresData?.data ?? [];

  const loadedKey = `${selectedAssessment?._id ?? ""}:${scoresData ? scores.length : "x"}:${roster.length}`;
  useEffect(() => {
    const existing = new Map(
      scores
        .filter((sc) => typeof sc.student !== "string" && sc.student !== null)
        .map((sc) => [
          (sc.student as { _id: string })._id,
          { score: String(sc.score), remarks: sc.remarks ?? "" },
        ]),
    );
    setDrafts(
      Object.fromEntries(
        roster.map((s) => [
          s._id,
          existing.get(s._id) ?? { score: "", remarks: "" },
        ]),
      ),
    );
    setSaveError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedKey]);

  const [saveAssessmentScores, { isLoading: saving }] =
    useSaveAssessmentScoresMutation();

  const maxScore = selectedAssessment?.maxScore ?? 0;

  const invalidDraft = (raw: string): string | null => {
    if (raw === "") return null;
    const num = Number(raw);
    if (!Number.isFinite(num)) return "Enter a number.";
    if (num < 0) return "Score cannot be negative.";
    if (num > maxScore) return `Score cannot exceed ${maxScore}.`;
    return null;
  };

  const editableRows = roster.filter((s) => {
    const error = invalidDraft(drafts[s._id]?.score ?? "");
    return error === null;
  });

  const saveDrafts = () => {
    void (async () => {
      if (!selectedAssessment) return;
      setSaveError(null);
      const records = roster
        .filter((s) => (drafts[s._id]?.score ?? "") !== "")
        .filter((s) => invalidDraft(drafts[s._id]?.score ?? "") === null)
        .map((s) => {
          const num = Number(drafts[s._id].score);
          return {
            student: s._id,
            score: Math.min(Math.max(num, 0), maxScore),
            remarks: drafts[s._id]?.remarks || "",
          };
        });
      if (records.length === 0) {
        setSaveError("Enter at least one score before saving.");
        return;
      }
      try {
        await saveAssessmentScores({
          assessmentId: selectedAssessment._id,
          records,
        }).unwrap();
        onSaved(
          `Scores saved for ${records.length} student${
            records.length === 1 ? "" : "s"
          }.`,
        );
      } catch (err) {
        setSaveError(getApiErrorMessage(err, "Could not save scores."));
      }
    })();
  };

  return (
    <Card
      title={`Scores entry${selectedAssessment ? ` — ${selectedAssessment.name}` : ""}`}
      padded={false}
      description={
        selectedAssessment
          ? `Type: ${selectedAssessment.type} · Max score: ${selectedAssessment.maxScore} · Weight: ${selectedAssessment.weight}%`
          : undefined
      }
      actions={
        selectedAssessment ? (
          <Button
            size="sm"
            icon={<ClipboardList className="size-4" aria-hidden />}
            onClick={saveDrafts}
            loading={saving}
            disabled={editableRows.length === 0}
          >
            Save scores
          </Button>
        ) : undefined
      }
    >
      <div className="border-b border-ink-100 p-4">
        <SelectField
          label="Assessment"
          required
          value={selectedAssessment?._id ?? ""}
          onChange={(e) => onSelectAssessment(e.target.value)}
          disabled={assessments.length === 0}
        >
          <option value="">Select assessment…</option>
          {assessments.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name} ({a.type}, max {a.maxScore})
            </option>
          ))}
        </SelectField>
      </div>

      {saveError && (
        <div className="p-4">
          <Alert tone="error" title="Could not save scores" onDismiss={() => setSaveError(null)}>
            {saveError}
          </Alert>
        </div>
      )}

      {!selectedAssessment ? (
        <div className="p-5">
          <EmptyState
            title="Select an assessment"
            description="Choose an assessment above to enter or update student scores."
          />
        </div>
      ) : rosterLoading || scoresLoading ? (
        <div className="space-y-3 p-5" role="status" aria-live="polite">
          <span className="sr-only">Loading score sheet…</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-2/3 animate-pulse rounded bg-ink-100" />
          ))}
        </div>
      ) : roster.length === 0 ? (
        <div className="p-5">
          <Alert tone="warning" title="No students in this class">
            Enroll students in this class before entering scores.
          </Alert>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {roster.map((student) => {
            const draft = drafts[student._id] ?? { score: "", remarks: "" };
            const error = invalidDraft(draft.score);
            return (
              <li key={student._id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-44">
                    <p className="text-sm font-medium text-ink-900">
                      {studentDisplayName(student)}
                    </p>
                    {student.registrationNumber && (
                      <p className="font-mono text-xs text-ink-500">
                        {student.registrationNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-28">
                      <FormField label="Score" error={error ?? undefined}>
                        {(aria) => (
                          <input
                            {...aria}
                            type="number"
                            className={cn(
                              "block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30",
                              error && "border-red-400 ring-1 ring-red-400/30",
                            )}
                            min={0}
                            max={maxScore}
                            step="0.5"
                            aria-invalid={error ? "true" : undefined}
                            value={draft.score}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [student._id]: {
                                  ...draft,
                                  score: e.target.value,
                                },
                              }))
                            }
                          />
                        )}
                      </FormField>
                    </div>
                    <div className="w-56">
                      <FormField label="Remarks">
                        {(aria) => (
                          <input
                            {...aria}
                            type="text"
                            className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                            placeholder="Optional"
                            value={draft.remarks}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [student._id]: {
                                  ...draft,
                                  remarks: e.target.value,
                                },
                              }))
                            }
                          />
                        )}
                      </FormField>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}


