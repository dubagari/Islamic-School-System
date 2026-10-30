import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ban, Eye, Plus, X } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import {
  Input,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  INVOICE_STATUSES,
  formatNaira,
  toFieldErrors,
  useCancelInvoiceMutation,
  useCreateInvoiceMutation,
  useGetInvoicesQuery,
  type Invoice,
  type InvoiceStatus,
} from "@/features/finance/api";
import {
  isPopulated,
  refName,
  useGetAcademicClassesQuery,
  useGetAcademicSemestersQuery,
  useGetAcademicSessionsQuery,
  useGetStudentsQuery,
  type Student,
} from "@/features/students/api";

const PAGE_SIZE = 20;

type ItemRow = {
  id: number;
  name: string;
  description: string;
  amount: string;
};

let itemSeq = 0;
const newItemRow = (): ItemRow => {
  itemSeq += 1;
  return { id: itemSeq, name: "", description: "", amount: "" };
};

export function InvoicesPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [sessionFilter, setSessionFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: null,
    dir: "asc",
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useGetInvoicesQuery({
    page,
    limit: PAGE_SIZE,
    search: searchText || undefined,
    academicSession: sessionFilter || undefined,
    academicSemester: semesterFilter || undefined,
    academicClass: classFilter || undefined,
    status: statusFilter || undefined,
  });

  const { data: sessionsData } = useGetAcademicSessionsQuery();
  const { data: semestersData } = useGetAcademicSemestersQuery(
    sessionFilter ? { academicSession: sessionFilter } : undefined,
  );
  const { data: classesData } = useGetAcademicClassesQuery();
  const { data: studentsData } = useGetStudentsQuery({ limit: 200 });

  const sessions = sessionsData?.data ?? [];
  const semesters = semestersData?.data ?? [];
  const classes = classesData?.data ?? [];
  const students = (studentsData?.data ?? []) as Student[];

  const invoices = query.data?.data;
  const pagination = query.data?.pagination;
  const summary = query.data?.summary;

  const [cancelInvoice, { isLoading: cancelling }] = useCancelInvoiceMutation();

  const columns: Column<Invoice>[] = useMemo(
    () => [
      {
        key: "invoiceNumber",
        header: "Invoice #",
        sortValue: (i) => i.invoiceNumber,
        render: (i) => (
          <Link
            to={`/fees/invoices/${i._id}`}
            className="font-mono text-xs font-medium text-primary-700 hover:underline"
          >
            {i.invoiceNumber}
          </Link>
        ),
      },
      {
        key: "student",
        header: "Student",
        render: (i) => {
          const s = i.student;
          return isPopulated(s) ? (
            <div className="flex flex-col">
              <Link
                to={`/students/${s._id}`}
                className="font-medium text-primary-700 hover:underline"
              >
                {[s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ") ||
                  "—"}
              </Link>
              <span className="font-mono text-xs text-ink-500">
                {s.registrationNumber}
              </span>
            </div>
          ) : (
            "—"
          );
        },
      },
      {
        key: "totalAmount",
        header: "Total",
        align: "end",
        sortValue: (i) => i.totalAmount,
        className: "font-medium tabular-nums text-ink-900",
        render: (i) => formatNaira(i.totalAmount),
      },
      {
        key: "amountPaid",
        header: "Paid",
        align: "end",
        sortValue: (i) => i.amountPaid,
        className: "tabular-nums",
        render: (i) => formatNaira(i.amountPaid),
      },
      {
        key: "balance",
        header: "Balance",
        align: "end",
        sortValue: (i) => i.balance,
        className: "tabular-nums",
        render: (i) => formatNaira(i.balance),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (i) => i.status,
        render: (i) => <StatusBadge status={i.status} />,
      },
      {
        key: "dueDate",
        header: "Due date",
        sortValue: (i) => i.dueDate ?? "",
        render: (i) => fmtDate(i.dueDate),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (i) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<Eye className="size-3.5" aria-hidden />}
              onClick={(ev) => {
                ev.stopPropagation();
                navigate(`/fees/invoices/${i._id}`);
              }}
            >
              View
            </Button>
            {i.status !== "Cancelled" && i.status !== "Paid" && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Ban className="size-3.5" aria-hidden />}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setCancelTarget(i);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        ),
      },
    ],
    [navigate],
  );

  const mobileCard = (i: Invoice) => {
    const s = i.student;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs font-medium text-primary-700">
              {i.invoiceNumber}
            </p>
            <p className="font-medium text-ink-900">
              {isPopulated(s)
                ? [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ")
                : "—"}
            </p>
          </div>
          <StatusBadge status={i.status} />
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-ink-500">Reg #</dt>
          <dd className="font-mono text-ink-800">
            {isPopulated(s) ? s.registrationNumber : "—"}
          </dd>
          <dt className="text-ink-500">Total</dt>
          <dd className="tabular-nums text-ink-800">{formatNaira(i.totalAmount)}</dd>
          <dt className="text-ink-500">Paid</dt>
          <dd className="tabular-nums text-ink-800">{formatNaira(i.amountPaid)}</dd>
          <dt className="text-ink-500">Balance</dt>
          <dd className="tabular-nums text-ink-800">{formatNaira(i.balance)}</dd>
          <dt className="text-ink-500">Due</dt>
          <dd className="text-ink-800">{fmtDate(i.dueDate)}</dd>
        </dl>
        <div className="mt-1 flex gap-2">
          <Link to={`/fees/invoices/${i._id}`}>
            <Button size="sm" variant="outline">
              View
            </Button>
          </Link>
          {i.status !== "Cancelled" && i.status !== "Paid" && (
            <Button size="sm" variant="ghost" onClick={() => setCancelTarget(i)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
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

  const filtersChanged = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Invoices generated from fee structures or created manually."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            Create invoice
          </Button>
        }
      />

      {summary && (
        <StatGrid className="mb-6">
          <StatCard
            label="Billed (filtered)"
            value={formatNaira(summary.totalBilled)}
            sub={`${summary.invoices} invoice(s) in result`}
          />
          <StatCard
            label="Paid (filtered)"
            tone="primary"
            value={formatNaira(summary.totalPaid)}
          />
          <StatCard
            label="Outstanding (filtered)"
            tone="gold"
            value={formatNaira(summary.totalBalance)}
          />
        </StatGrid>
      )}

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
            label="Status"
            value={statusFilter}
            onChange={(e) =>
              filtersChanged(
                () => setStatusFilter(e.target.value as InvoiceStatus | ""),
              )
            }
          >
            <option value="">All statuses</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>
          <div>
            <label
              htmlFor="invoice-search"
              className="mb-1.5 block text-xs font-medium text-ink-700"
            >
              Search
            </label>
            <Input
              id="invoice-search"
              type="search"
              placeholder="Invoice #, name, reg #…"
              value={searchText}
              onChange={(e) => filtersChanged(() => setSearchText(e.target.value))}
            />
          </div>
        </div>

        {query.isError && (
          <Alert tone="error" title="Could not load invoices" className="m-4">
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
          data={invoices}
          isLoading={query.isLoading}
          emptyTitle="No invoices found"
          emptyDescription={
            sessionFilter || semesterFilter || classFilter || statusFilter || searchText
              ? "Try adjusting or clearing the filters."
              : "Generate invoices from fee structures or create one manually."
          }
          emptyAction={
            query.isError ? (
              <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(i) => i._id}
          onRowClick={(i) => navigate(`/fees/invoices/${i._id}`)}
          sort={sort}
          onSortChange={onSortChange}
          mobileCard={mobileCard}
        />

        <PagedFooter pagination={pagination} onPageChange={setPage} />
      </Card>

      <CreateInvoiceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        sessions={sessions}
        classes={classes}
        students={students}
        onDone={(message) => {
          setCreateOpen(false);
          setNotice(message);
        }}
      />

      <CancelInvoiceDialog
        invoice={cancelTarget}
        closing={cancelling}
        onClose={() => setCancelTarget(null)}
        onDone={() => {
          setCancelTarget(null);
          setNotice("Invoice cancelled successfully.");
        }}
        onCancelInvoice={async (id, reason) => {
          await cancelInvoice({ id, reason }).unwrap();
        }}
      />
    </div>
  );
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

// ======================================================
// Manual invoice creation (POST /invoices — items builder)
// ======================================================

function CreateInvoiceDialog({
  open,
  onClose,
  sessions,
  classes,
  students,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  sessions: { _id: string; name: string; isCurrent: boolean }[];
  classes: { _id: string; name: string }[];
  students: Student[];
  onDone: (message: string) => void;
}) {
  const [student, setStudent] = useState("");
  const [session, setSession] = useState("");
  const [semester, setSemester] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItemRow()]);

  const [formError, setFormError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

  const semestersQuery = useGetAcademicSemestersQuery(
    session ? { academicSession: session } : undefined,
  );
  const semesters = semestersQuery.data?.data ?? [];

  const [createInvoiceMutation, { isLoading: creatingInvoice }] =
    useCreateInvoiceMutation();

  const selectedStudent = students.find((s) => s._id === student);
  const itemsTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const valid =
    student !== "" &&
    session !== "" &&
    semester !== "" &&
    items.length > 0 &&
    items.every((item) => item.name.trim() !== "" && item.amount !== "" && Number(item.amount) >= 0);

  if (!open) return null;

  const submit = () => {
    void (async () => {
      setFormError(null);
      setItemErrors({});

      const badItems: Record<number, string> = {};
      items.forEach((item, index) => {
        if (item.name.trim() === "") {
          badItems[index] = "Item name is required.";
        } else if (item.amount === "" || Number.isNaN(Number(item.amount))) {
          badItems[index] = "Amount is required.";
        } else if (Number(item.amount) < 0) {
          badItems[index] = "Amount must be greater than or equal to zero.";
        }
      });
      if (Object.keys(badItems).length > 0) {
        setItemErrors(badItems);
        return;
      }

      try {
        await createInvoiceMutation({
            student,
            academicSession: session,
            academicSemester: semester,
            academicClass: classId || undefined,
            items: items.map((item) => ({
              name: item.name.trim(),
              description: item.description.trim() || undefined,
              amount: Number(item.amount),
            })),
            dueDate: dueDate || undefined,
            notes: notes.trim() || undefined,
          });
        onDone("Invoice created successfully.");
      } catch (err) {
        const mapped = toFieldErrors(err);
        setFormError(mapped.message);
      }
    })();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create invoice"
      description="Build a manual invoice with one or more line items."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creatingInvoice}>
            Cancel
          </Button>
          <Button onClick={submit} loading={creatingInvoice} disabled={!valid}>
            Create invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField
          label="Student"
          required
          value={student}
          error={formError && !student ? formError : undefined}
          onChange={(e) => setStudent(e.target.value)}
        >
          <option value="">Select student…</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {[s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ")} (
              {s.registrationNumber})
            </option>
          ))}
        </SelectField>

        <div className="grid gap-4 sm:grid-cols-2">
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
            {semesters.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
                {s.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Class"
            hint={
              selectedStudent
                ? "Defaults to the student's current class if left blank."
                : "Optional."
            }
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">
              {selectedStudent && isPopulated(selectedStudent.academicClass)
                ? `Student's class (${refName(selectedStudent.academicClass)})`
                : "Student's current class"}
            </option>
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
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <fieldset className="rounded-card border border-ink-100 bg-forest-50/50 p-4">
          <legend className="px-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Invoice items
          </legend>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-ink-100 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-ink-700">Item {index + 1}</p>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="rounded p-0.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() =>
                        setItems((prev) => prev.filter((row) => row.id !== item.id))
                      }
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <InputField
                    label="Name"
                    required
                    value={item.name}
                    maxLength={150}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.id === item.id ? { ...row, name: e.target.value } : row,
                        ),
                      )
                    }
                  />
                  <InputField
                    label="Amount (₦)"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    aria-invalid={itemErrors[index] ? "true" : undefined}
                    value={item.amount}
                    error={itemErrors[index]}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.id === item.id ? { ...row, amount: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="mt-3">
                  <InputField
                    label="Description"
                    maxLength={500}
                    value={item.description}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((row) =>
                          row.id === item.id
                            ? { ...row, description: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            icon={<Plus className="size-3.5" aria-hidden />}
            onClick={() => setItems((prev) => [...prev, newItemRow()])}
          >
            Add item
          </Button>

          <p className="mt-3 text-sm font-medium tabular-nums text-ink-900">
            Total: {formatNaira(itemsTotal)}
          </p>
        </fieldset>

        <TextareaField
          label="Notes"
          hint="Optional, up to 1000 characters."
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {formError && (
          <Alert tone="error" title="Could not create invoice">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}

// ======================================================
// Cancel invoice (POST /invoices/:id/cancel — reason required;
// the server blocks cancellation when payments exist)
// ======================================================

function CancelInvoiceDialog({
  invoice,
  closing,
  onClose,
  onDone,
  onCancelInvoice,
}: {
  invoice: Invoice | null;
  closing: boolean;
  onClose: () => void;
  onDone: () => void;
  onCancelInvoice: (id: string, reason: string) => Promise<unknown>;
}) {
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  if (!invoice) return null;

  const hasPayments = Number(invoice.amountPaid) > 0;
  const valid = reason.trim() !== "";

  const submit = () => {
    void (async () => {
      setFormError(null);
      setReasonError(null);
      if (!valid) {
        setReasonError("A cancellation reason is required.");
        return;
      }
      try {
        await onCancelInvoice(invoice._id, reason.trim());
        onDone();
      } catch (err) {
        const mapped = toFieldErrors(err);
        if (mapped.fields.reason) {
          setReasonError(mapped.fields.reason);
        }
        setFormError(mapped.message);
      }
    })();
  };

  return (
    <Dialog
      open={invoice !== null}
      onClose={onClose}
      title="Cancel invoice"
      description={
        hasPayments
          ? `${invoice.invoiceNumber} has recorded payments — the server will reject cancellation until the payments are reversed.`
          : `Cancel invoice ${invoice.invoiceNumber}? This takes effect immediately.`
      }
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={closing}>
            Keep invoice
          </Button>
          <Button variant="danger" onClick={submit} loading={closing} icon={<Ban className="size-4" aria-hidden />}>
            Cancel invoice
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextareaField
          label="Reason"
          required
          maxLength={500}
          value={reason}
          error={reasonError ?? undefined}
          placeholder="Why is this invoice being cancelled?"
          onChange={(e) => setReason(e.target.value)}
        />
        {formError && (
          <Alert tone="error" title="Could not cancel invoice">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
