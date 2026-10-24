import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  Users,
  Wallet,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  classNameRef,
  displayName,
  formatDate,
  formatNaira,
  getErrorMessage,
  nameRef,
  useGetChildOverviewQuery,
  type AttendanceListItem,
  type InvoiceListItem,
  type PaymentListItem,
  type ResultListItem,
} from "@/features/parent/api";

export function ChildOverviewPage() {
  const { studentId = "" } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useGetChildOverviewQuery(
    studentId,
    { skip: !studentId },
  );

  if (!studentId) {
    return (
      <Alert tone="warning" title="No child selected">
        Use the parent overview to pick a child.
      </Alert>
    );
  }

  if (isLoading) {
    return <PageLoader />;
  }

  const student = data?.student;
  const attendance = data?.attendance;
  const results = data?.results;
  const fees = data?.fees;
  const records = data?.records ?? [];

  const attendanceColumns: Column<AttendanceListItem>[] = [
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (row) => row.remarks?.trim() || "—",
    },
  ];

  const resultColumns: Column<ResultListItem>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (row) =>
        typeof row.classSubject === "object" && row.classSubject?.subject
          ? `${row.classSubject.subject.prefix ?? ""} ${row.classSubject.subject.name ?? ""}`.trim() ||
            "—"
          : "—",
    },
    {
      key: "score",
      header: "Score",
      align: "end",
      render: (row) => Number(row.totalScore ?? 0).toFixed(1),
    },
    {
      key: "grade",
      header: "Grade",
      render: (row) => (
        <Badge tone="neutral">{row.letterGrade || "—"}</Badge>
      ),
    },
  ];

  const invoiceColumns: Column<InvoiceListItem>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (row) => (
        <span className="font-medium text-ink-900">{row.invoiceNumber}</span>
      ),
    },
    {
      key: "dueDate",
      header: "Due date",
      render: (row) => formatDate(row.dueDate),
    },
    {
      key: "total",
      header: "Total",
      align: "end",
      render: (row) => formatNaira(row.totalAmount),
    },
    {
      key: "balance",
      header: "Balance",
      align: "end",
      render: (row) => formatNaira(row.balance),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const paymentColumns: Column<PaymentListItem>[] = [
    {
      key: "paidAt",
      header: "Date",
      render: (row) => formatDate(row.paidAt),
    },
    {
      key: "receipt",
      header: "Receipt",
      render: (row) =>
        row.receiptNumber?.trim() ? (
          <span className="font-medium text-ink-900">{row.receiptNumber}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "method",
      header: "Method",
      render: (row) => row.method || "—",
    },
    {
      key: "amount",
      header: "Amount",
      align: "end",
      render: (row) => formatNaira(row.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const childName = student ? student.fullName || displayName(student) : "—";

  return (
    <div>
      <PageHeader
        breadcrumb={
          <div className="flex items-center gap-2">
            <Link to="/parent" className="hover:text-ink-800">
              Parent overview
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink-700">{childName}</span>
          </div>
        }
        title={childName}
        description={[
          student?.registrationNumber,
          classNameRef(student?.academicClass) !== "—"
            ? classNameRef(student?.academicClass)
            : undefined,
          student?.status,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Button
              variant="outline"
              icon={<ArrowLeft className="size-4" aria-hidden />}
              onClick={() => void navigate("/parent")}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              icon={<Users className="size-4" aria-hidden />}
            >
              Refresh
            </Button>
          </>
        }
      />

      {isError && (
        <Alert tone="error" title="Could not load this child's records" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{getErrorMessage(error)}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <StatGrid className="mb-6">
        <StatCard
          label="Attendance rate"
          value={
            attendance?.summary?.total && attendance.summary.total > 0
              ? `${Number(attendance.summary.attendanceRate ?? 0).toFixed(1)}%`
              : "—"
          }
          sub={`${attendance?.summary?.total ?? 0} total ${attendance?.summary?.total === 1 ? "day" : "days"}`}
          icon={<CalendarCheck className="size-4" aria-hidden />}
          tone="primary"
        />
        <StatCard
          label="Published subjects"
          value={results?.summary?.subjects ?? 0}
          sub={`Average ${Number(results?.summary?.averageScore ?? 0).toFixed(1)}`}
          icon={<BookOpen className="size-4" aria-hidden />}
          tone="primary"
        />
        <StatCard
          label="Outstanding balance"
          value={fees ? formatNaira(fees.summary.totalBalance) : "—"}
          sub={fees ? `${fees.summary.invoices} invoice${fees.summary.invoices === 1 ? "" : "s"} on record` : undefined}
          icon={<Wallet className="size-4" aria-hidden />}
          tone={
            fees && fees.summary.totalBalance > 0 ? "danger" : "primary"
          }
        />
        <StatCard
          label="School records"
          value={records.length}
          sub="Most recent entries below"
          icon={<FileText className="size-4" aria-hidden />}
          tone="default"
        />
      </StatGrid>

      <StatGrid cols={3} className="mb-6">
        <Card
          title="Recent attendance"
          description="Last 5 marked days"
          actions={
            <Button
              size="sm"
              variant="outline"
              iconRight={<ClipboardList className="size-3.5" aria-hidden />}
              onClick={() => void navigate(`/parent/children/${studentId}/attendance`)}
            >
              Full attendance
            </Button>
          }
        >
          <DataTable
            columns={attendanceColumns}
            data={attendance?.recent}
            rowKey={(row) => row._id}
            emptyTitle="No attendance records"
            emptyDescription="Attendance will appear here once teachers start marking it."
            mobileCard={(row) => (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {formatDate(row.date)}
                  </p>
                  {row.remarks?.trim() && (
                    <p className="text-xs text-ink-500">{row.remarks}</p>
                  )}
                </div>
                <StatusBadge status={row.status} />
              </div>
            )}
          />
        </Card>

        <Card
          title="Recent results"
          description="Last 10 published subject results"
          actions={
            <Button
              size="sm"
              variant="outline"
              iconRight={<ClipboardList className="size-3.5" aria-hidden />}
              onClick={() => void navigate(`/parent/children/${studentId}/results`)}
            >
              All results
            </Button>
          }
        >
          <DataTable
            columns={resultColumns}
            data={results?.recent}
            rowKey={(row) => row._id}
            emptyTitle="No published results"
            emptyDescription="Results appear here once the school publishes them."
            mobileCard={(row) => (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink-900">
                  {typeof row.classSubject === "object" &&
                  row.classSubject?.subject?.name
                    ? row.classSubject.subject.name
                    : "—"}
                </p>
                <span className="text-xs text-ink-500">
                  {Number(row.totalScore ?? 0).toFixed(1)} · {row.letterGrade}
                </span>
              </div>
            )}
          />
        </Card>
      </StatGrid>

      <StatGrid cols={2} className="mb-6">
        <Card
          title="Fee summary"
          actions={
            <Button
              size="sm"
              variant="outline"
              iconRight={<ClipboardList className="size-3.5" aria-hidden />}
              onClick={() => void navigate(`/parent/children/${studentId}/fees`)}
            >
              Fees & invoices
            </Button>
          }
        >
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-ink-500">Total billed</dt>
              <dd className="mt-0.5 font-semibold text-ink-900">
                {fees ? formatNaira(fees.summary.totalBilled) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Total paid</dt>
              <dd className="mt-0.5 font-semibold text-ink-900">
                {fees ? formatNaira(fees.summary.totalPaid) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Balance</dt>
              <dd className="mt-0.5 font-semibold text-ink-900">
                {fees ? formatNaira(fees.summary.totalBalance) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Unpaid invoices</dt>
              <dd className="mt-0.5 font-semibold text-ink-900">
                {fees ? (fees.summary.unpaidInvoices ?? "—") : "—"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Recent records" description="Administrative school records">
          {records.length === 0 ? (
            <p className="text-sm text-ink-500">No records on file.</p>
          ) : (
            <ul className="space-y-3">
              {records.map((record) => (
                <li
                  key={record._id}
                  className="rounded-card border border-ink-100 bg-forest-50/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink-900">
                      {record.title}
                    </p>
                    <Badge tone="neutral">{record.recordType || "—"}</Badge>
                  </div>
                  {record.description?.trim() && (
                    <p className="mt-1 text-xs text-ink-600">
                      {record.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ink-500">
                    {formatDate(record.recordDate ?? record.createdAt)}
                    {record.academicSession
                      ? ` · ${nameRef(record.academicSession)}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent invoices" description="Latest 5 invoices">
          <DataTable
            columns={invoiceColumns}
            data={fees?.invoices}
            rowKey={(row) => row._id}
            emptyTitle="No invoices"
            mobileCard={(row) => (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {row.invoiceNumber}
                  </p>
                  <p className="text-xs text-ink-500">
                    {formatNaira(row.balance)} outstanding · due{" "}
                    {formatDate(row.dueDate)}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </div>
            )}
          />
        </Card>

        <Card title="Recent payments" description="Latest 5 payments">
          <DataTable
            columns={paymentColumns}
            data={fees?.payments}
            rowKey={(row) => row._id}
            emptyTitle="No payments"
            mobileCard={(row) => (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {row.receiptNumber || "—"}
                  </p>
                  <p className="text-xs text-ink-500">
                    {row.method || "—"} · {formatDate(row.paidAt)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink-900">
                  {formatNaira(row.amount)}
                </span>
              </div>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
