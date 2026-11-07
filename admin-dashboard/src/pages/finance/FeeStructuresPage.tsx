import { useMemo, useState } from "react";
import { BadgeCheck, Ban, WandSparkles } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  FEE_TYPES,
  formatNaira,
  toFieldErrors,
  useCreateFeeStructureMutation,
  useGenerateInvoicesMutation,
  useGetFeeStructuresQuery,
  useUpdateFeeStructureMutation,
  type FeeStructure,
  type FeeType,
} from "@/features/finance/api";
import {
  isPopulated,
  refName,
  useGetAcademicClassesQuery,
  useGetAcademicSemestersQuery,
  useGetAcademicSessionsQuery,
  type AcademicSession,
} from "@/features/students/api";

const PAGE_SIZE = 20;

const ACTIVE_FILTER_OPTIONS: { label: string; value: "true" | "false" | "" }[] = [
  { label: "All structures", value: "" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

export function FeeStructuresPage() {
  const [page, setPage] = useState(1);
  const [sessionFilter, setSessionFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<FeeType | "">("");
  const [activeFilter, setActiveFilter] = useState<"true" | "false" | "">("");
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: null,
    dir: "asc",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [toggleTarget, setToggleTarget] = useState<FeeStructure | null>(null);
  const [generateTarget, setGenerateTarget] = useState<FeeStructure | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useGetFeeStructuresQuery({
    page,
    limit: PAGE_SIZE,
    academicSession: sessionFilter || undefined,
    academicSemester: semesterFilter || undefined,
    academicClass: classFilter || undefined,
    feeType: typeFilter || undefined,
    isActive: activeFilter || undefined,
  });

  const { data: sessionsData } = useGetAcademicSessionsQuery();
  const { data: semestersData } = useGetAcademicSemestersQuery(
    sessionFilter ? { academicSession: sessionFilter } : undefined,
  );
  const { data: classesData } = useGetAcademicClassesQuery();

  const sessions = sessionsData?.data ?? [];
  const semesters = semestersData?.data ?? [];
  const classes = classesData?.data ?? [];

  const structures = query.data?.data;
  const pagination = query.data?.pagination;

  const [createFeeStructure, { isLoading: creating }] =
    useCreateFeeStructureMutation();
  const [updateFeeStructure, { isLoading: updating }] =
    useUpdateFeeStructureMutation();
  const [generateInvoices, { isLoading: generating }] =
    useGenerateInvoicesMutation();

  const columns: Column<FeeStructure>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Fee",
        sortValue: (f) => f.name,
        render: (f) => (
          <div className="flex flex-col">
            <span className="font-medium text-ink-900">{f.name}</span>
            {f.description && (
              <span className="line-clamp-1 text-xs text-ink-500">
                {f.description}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "feeType",
        header: "Type",
        sortValue: (f) => FEE_TYPES.indexOf(f.feeType),
        render: (f) => <Badge tone="gold">{f.feeType}</Badge>,
      },
      {
        key: "amount",
        header: "Amount",
        align: "end",
        sortValue: (f) => f.amount,
        className: "font-medium tabular-nums text-ink-900",
        render: (f) => formatNaira(f.amount),
      },
      {
        key: "academicSession",
        header: "Session",
        render: (f) => refName(f.academicSession),
      },
      {
        key: "academicSemester",
        header: "Semester",
        render: (f) => refName(f.academicSemester),
      },
      {
        key: "academicClass",
        header: "Class",
        render: (f) => refName(f.academicClass),
      },
      {
        key: "isActive",
        header: "Status",
        align: "center",
        sortValue: (f) => (f.isActive ? 0 : 1),
        render: (f) =>
          f.isActive ? (
            <Badge tone="success">Active</Badge>
          ) : (
            <Badge tone="neutral">Inactive</Badge>
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (f) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(ev) => {
                ev.stopPropagation();
                setEditing(f);
              }}
            >
              Edit
            </Button>
            {f.isActive ? (
              <Button
                size="sm"
                variant="ghost"
                icon={<Ban className="size-3.5" aria-hidden />}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setToggleTarget(f);
                }}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                icon={<BadgeCheck className="size-3.5" aria-hidden />}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setToggleTarget(f);
                }}
              >
                Activate
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<WandSparkles className="size-3.5" aria-hidden />}
              onClick={(ev) => {
                ev.stopPropagation();
                setGenerateTarget(f);
                setGenerateOpen(true);
              }}
            >
              Generate
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const mobileCard = (f: FeeStructure) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink-900">{f.name}</p>
          <p className="text-xs text-ink-500">
            {f.feeType} · {refName(f.academicClass)} · {refName(f.academicSemester)}
          </p>
        </div>
        {f.isActive ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="neutral">Inactive</Badge>
        )}
      </div>
      <p className="text-lg font-bold tabular-nums text-ink-900">
        {formatNaira(f.amount)}
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={(ev) => {
            ev.stopPropagation();
            setEditing(f);
          }}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(ev) => {
            ev.stopPropagation();
            setToggleTarget(f);
          }}
        >
          {f.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(ev) => {
            ev.stopPropagation();
            setGenerateTarget(f);
            setGenerateOpen(true);
          }}
        >
          Generate invoices
        </Button>
      </div>
    </div>
  );

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

  return (
    <div>
      <PageHeader
        title="Fee Structures"
        description="Define per-class, per-semester fees used to generate invoices."
        actions={
          <Button
            icon={<WandSparkles className="size-4" aria-hidden />}
            onClick={() => {
              setGenerateTarget(null);
              setGenerateOpen(true);
            }}
          >
            Generate invoices
          </Button>
        }
      />

      <Alert
        tone="info"
        className="mb-4"
        title="Creating a fee structure"
      >
        Duplicate names within the same class and semester are rejected. Structures
        used on invoices cannot be deleted — deactivate instead.
      </Alert>

      {notice && (
        <Alert
          tone="success"
          title="Done"
          className="mb-4"
          onDismiss={() => setNotice(null)}
        >
          {notice}
        </Alert>
      )}

      {actionError && (
        <Alert
          tone="error"
          title="Action failed"
          className="mb-4"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      <Card padded={false}>
        <div className="grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <SelectField
            label="Session"
            value={sessionFilter}
            onChange={(e) =>
              filtersChanged(() => {
                setSessionFilter(e.target.value);
                setSemesterFilter("");
              })
            }
          >
            <option value="">All sessions</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
                {s.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Semester"
            value={semesterFilter}
            onChange={(e) => filtersChanged(() => setSemesterFilter(e.target.value))}
          >
            <option value="">All semesters</option>
            {semesters.map((sem) => (
              <option key={sem._id} value={sem._id}>
                {sem.name}
                {sem.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Class"
            value={classFilter}
            onChange={(e) => filtersChanged(() => setClassFilter(e.target.value))}
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Fee type"
            value={typeFilter}
            onChange={(e) =>
              filtersChanged(() => setTypeFilter(e.target.value as FeeType | ""))
            }
          >
            <option value="">All types</option>
            {FEE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Status"
            value={activeFilter}
            onChange={(e) =>
              filtersChanged(
                () => setActiveFilter(e.target.value as "true" | "false" | ""),
              )
            }
          >
            {ACTIVE_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
        </div>

        {query.isError && (
          <Alert tone="error" title="Could not load fee structures" className="m-4">
            <div className="flex items-center gap-3">
              <span>
                {(query.error as Error | undefined)?.message ?? "Request failed."}
              </span>
              <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={structures}
          isLoading={query.isLoading}
          emptyTitle="No fee structures found"
          emptyDescription={
            sessionFilter || semesterFilter || classFilter || typeFilter || activeFilter
              ? "Try adjusting or clearing the filters."
              : "Create a fee structure to start billing."
          }
          emptyAction={
            query.isError ? (
              <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
                Retry
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}>
                Create fee structure
              </Button>
            )
          }
          rowKey={(f) => f._id}
          sort={sort}
          onSortChange={onSortChange}
          mobileCard={mobileCard}
        />

        <PagedFooter pagination={pagination} onPageChange={setPage} />
      </Card>

      <FeeStructureDialog
        key={editing?._id ?? "new"}
        open={dialogOpen}
        editing={editing}
        sessions={sessions}
        semesters={semesters}
        classes={classes}
        sessionFilter={sessionFilter}
        semesterFilter={semesterFilter}
        classFilter={classFilter}
        creating={creating}
        updating={updating}
        onNotify={setNotice}
        onDone={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onCreate={async (body) => {
          await createFeeStructure(body).unwrap();
          return "Fee structure created successfully.";
        }}
        onUpdate={async (id, body) => {
          await updateFeeStructure({ id, ...body }).unwrap();
          return "Fee structure updated successfully.";
        }}
      />

      <ConfirmDialog
        open={toggleTarget !== null}
        tone="danger"
        title={toggleTarget?.isActive ? "Deactivate fee structure" : "Activate fee structure"}
        confirmLabel={toggleTarget?.isActive ? "Deactivate" : "Activate"}
        description={
          toggleTarget?.isActive
            ? "Inactive structures are excluded from invoice generation."
            : undefined
        }
          loading={updating}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => {
          void (async () => {
            if (!toggleTarget) return;
            try {
              await updateFeeStructure({
                id: toggleTarget._id,
                isActive: !toggleTarget.isActive,
              }).unwrap();
              setNotice(`Fee structure ${toggleTarget.isActive ? "deactivated" : "activated"}.`);
              setToggleTarget(null);
            } catch (err) {
              setToggleTarget(null);
              setActionError(
                (err as { data?: { message?: string } })?.data?.message ??
                  "Fee structure update failed.",
              );
            }
          })();
        }}
      />

      <GenerateInvoicesDialog
        open={generateOpen}
        preset={
          generateTarget
            ? {
                academicSession: refIdOrEmpty(generateTarget.academicSession),
                academicSemester: refIdOrEmpty(generateTarget.academicSemester),
                academicClass: refIdOrEmpty(generateTarget.academicClass),
              }
            : null
        }
        sessions={sessionsData?.data ?? []}
        classes={classesData?.data ?? []}
        generating={generating}
        onCancel={() => {
          setGenerateOpen(false);
          setGenerateTarget(null);
        }}
        onDone={(message) => {
          setGenerateOpen(false);
          setGenerateTarget(null);
          setNotice(message);
          setPage(1);
        }}
        onGenerate={async (body) => {
          const result = await generateInvoices(body).unwrap();
          return `Generated ${result.data.created} invoice(s); skipped ${result.data.skipped} student(s) who already had one.`;
        }}
      />
    </div>
  );
}

function refIdOrEmpty(value: { _id: string } | string): string {
  return isPopulated(value) ? value._id : (value as string);
}

type FeeStructureDialogBody = {
  name: string;
  feeType: FeeType;
  description?: string;
  amount: number;
  academicSession: string;
  academicSemester: string;
  academicClass: string;
};

function FeeStructureDialog({
  open,
  editing,
  sessions,
  semesters,
  classes,
  sessionFilter,
  semesterFilter,
  classFilter,
  creating,
  updating,
  onDone,
  onClose,
  onNotify,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  editing: FeeStructure | null;
  sessions: { _id: string; name: string; isCurrent: boolean }[];
  semesters: {
    _id: string;
    name: string;
    isCurrent: boolean;
    academicSession?: AcademicSession | string;
  }[];
  classes: { _id: string; name: string }[];
  sessionFilter: string;
  semesterFilter: string;
  classFilter: string;
  creating: boolean;
  updating: boolean;
  loading?: boolean;
  onDone: () => void;
  onClose: () => void;
  onNotify: (message: string) => void;
  onCreate: (body: FeeStructureDialogBody) => Promise<string>;
  onUpdate: (
    id: string,
    body: {
      name: string;
      feeType: FeeType;
      description: string;
      amount: number;
      isActive: boolean;
    },
  ) => Promise<string>;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [feeType, setFeeType] = useState<FeeType>(editing?.feeType ?? "Tuition");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amountText, setAmountText] = useState(editing ? String(editing.amount) : "");
  const [session, setSession] = useState(
    editing && isPopulated(editing.academicSession)
      ? editing.academicSession._id
      : sessionFilter,
  );
  const [semester, setSemester] = useState(
    editing && isPopulated(editing.academicSemester)
      ? editing.academicSemester._id
      : semesterFilter,
  );
  const [classId, setClassId] = useState(
    editing && isPopulated(editing.academicClass)
      ? editing.academicClass._id
      : classFilter,
  );
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const amountValue = Number(amountText);
  const amountValid = amountText !== "" && amountValue >= 0 && !Number.isNaN(amountValue);
  const busy = creating || updating;

  const isCreate = editing === null;
  const valid =
    name.trim() !== "" &&
    amountValid &&
    (isCreate ? session !== "" && semester !== "" && classId !== "" : true);

  const submit = () => {
    void (async () => {
      setFormError(null);
      setFieldErrors({});
      try {
        if (isCreate) {
          const message = await onCreate({
            name: name.trim(),
            feeType,
            description: description.trim() || undefined,
            amount: amountValue,
            academicSession: session,
            academicSemester: semester,
            academicClass: classId,
          });
          onNotify(message);
          onDone();
        } else {
          const message = await onUpdate(editing._id, {
            name: name.trim(),
            feeType,
            description: description.trim(),
            amount: amountValue,
            isActive,
          });
          onNotify(message);
          onDone();
        }
      } catch (err) {
        const mapped = toFieldErrors(err);
        setFieldErrors(mapped.fields);
        setFormError(mapped.message);
      }
    })();
  };

  return (
    <Dialog
      open={open}
      title={isCreate ? "Create fee structure" : "Edit fee structure"}
      description={
        isCreate
          ? "A fee structure defines the amount billed per class and semester."
          : "Session, semester, and class are fixed on existing structures."
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={!valid}>
            {isCreate ? "Create" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!isCreate && (
          <Alert tone="info">
            Enable isActive to make the structure available for invoice generation.
          </Alert>
        )}

        <InputField
          label="Name"
          required
          value={name}
          error={fieldErrors.name}
          maxLength={150}
          placeholder="First Semester Tuition"
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Fee type"
            required
            value={feeType}
            error={fieldErrors.feeType}
            onChange={(e) => setFeeType(e.target.value as FeeType)}
          >
            {FEE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </SelectField>

          <InputField
            label="Amount (₦)"
            required
            type="number"
            min="0"
            step="0.01"
            aria-invalid={amountValid || amountText === "" ? undefined : "true"}
            value={amountText}
            error={
              fieldErrors.amount ??
              (amountValid || amountText === ""
                ? undefined
                : "Amount must be greater than or equal to zero.")
            }
            onChange={(e) => setAmountText(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Academic session"
            required={isCreate}
            disabled={Boolean(editing)}
            value={session}
            error={fieldErrors.academicSession}
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
          </SelectField>

          <SelectField
            label="Academic semester"
            required={isCreate}
            disabled={Boolean(editing)}
            value={semester}
            error={fieldErrors.academicSemester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <option value="">Select semester…</option>
            {semesters
              .filter(
                (s) =>
                  !session ||
                  (isPopulated(s.academicSession)
                    ? s.academicSession._id
                    : (s.academicSession as string)) === session,
              )
              .map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                  {s.isCurrent ? " (current)" : ""}
                </option>
              ))}
          </SelectField>

          <SelectField
            label="Academic class"
            required={isCreate}
            disabled={Boolean(editing)}
            value={classId}
            error={fieldErrors.academicClass}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </div>

        <TextareaField
          label="Description"
          hint="Optional, up to 500 characters."
          maxLength={500}
          value={description}
          error={fieldErrors.description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {!isCreate && (
          <SelectField
            label="Status"
            value={isActive ? "true" : "false"}
            onChange={(e) => setIsActive(e.target.value === "true")}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </SelectField>
        )}

        {formError && (
          <Alert tone="error" title="Could not save fee structure">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}

function GenerateInvoicesDialog({
  open,
  preset,
  sessions,
  classes,
  generating,
  onCancel,
  onDone,
  onGenerate,
}: {
  open: boolean;
  preset: {
    academicSession: string;
    academicSemester: string;
    academicClass: string;
  } | null;
  sessions: { _id: string; name: string; isCurrent: boolean }[];
  classes: { _id: string; name: string }[];
  generating: boolean;
  onCancel: () => void;
  onDone: (message: string) => void;
  onGenerate: (body: {
    academicSession: string;
    academicSemester: string;
    academicClass: string;
    dueDate?: string;
    notes?: string;
  }) => Promise<string>;
}) {
  const [session, setSession] = useState(preset?.academicSession ?? "");
  const [semester, setSemester] = useState(preset?.academicSemester ?? "");
  const [classId, setClassId] = useState(preset?.academicClass ?? "");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  const semesters = useGetAcademicSemestersQuery(
    session ? { academicSession: session } : undefined,
  );
  const semesterOptions = semesters.data?.data ?? [];

  const valid = session !== "" && semester !== "" && classId !== "";

  if (!open) return null;

  const submit = () => {
    void (async () => {
      setFormError(null);
      try {
        const message = await onGenerate({
          academicSession: session,
          academicSemester: semester,
          academicClass: classId,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
        });
        onDone(message);
      } catch (err) {
        setFormError(
          (err as { data?: { message?: string } })?.data?.message ??
            "Invoice generation failed.",
        );
      }
    })();
  };

  return (
    <Dialog
      open
      title="Generate invoices"
      description="Creates one invoice per active student in the class from active fee structures. Students who already have a semester invoice are skipped."
      onClose={onCancel}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={generating}>
            Cancel
          </Button>
          <Button onClick={submit} loading={generating} disabled={!valid}>
            Generate
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField
          label="Academic session"
          required
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
        </SelectField>

        <SelectField
          label="Academic semester"
          required
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">Select semester…</option>
          {semesterOptions.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
              {s.isCurrent ? " (current)" : ""}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Academic class"
          required
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">Select class…</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </SelectField>

        <InputField
          label="Due date"
          type="date"
          value={dueDate}
          hint="Defaults to 30 days from now."
          onChange={(e) => setDueDate(e.target.value)}
        />

        <TextareaField
          label="Notes"
          hint="Optional note added to each generated invoice."
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {formError && (
          <Alert tone="error" title="Could not generate invoices">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
