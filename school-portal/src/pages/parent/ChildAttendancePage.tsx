import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { InputField, SelectField } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { PagedFooter } from "@/components/ui/Pagination";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  classNameRef,
  displayName,
  formatDate,
  getErrorMessage,
  useGetChildAttendanceQuery,
  type AttendanceListItem,
  type AttendanceQueryStatus,
} from "@/features/parent/api";

const STATUSES = ["Present", "Absent", "Late", "Excused"] as const;

const PAGE_SIZE = 10;

export function ChildAttendancePage() {
  const { studentId = "" } = useParams<{ studentId: string }>();

  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<AttendanceQueryStatus | "">("");

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      from: from || undefined,
      to: to || undefined,
      status: status || undefined,
    }),
    [page, from, to, status],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetChildAttendanceQuery(
    { studentId, params },
    { skip: !studentId },
  );

  const columns: Column<AttendanceListItem>[] = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        sortValue: (row) => row.date,
        render: (row) => (
          <span className="font-medium text-ink-900">{formatDate(row.date)}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (row) => row.status,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "remarks",
        header: "Remarks",
        render: (row) =>
          row.remarks?.trim() ? (
            row.remarks
          ) : (
            <span className="text-ink-400">—</span>
          ),
      },
    ],
    [],
  );

  if (!studentId) {
    return (
      <Alert tone="warning" title="No child selected">
        Use the parent overview to pick a child.
      </Alert>
    );
  }

  const childName = data?.student
    ? data.student.fullName || displayName(data.student)
    : "Child";
  const summary = data?.summary;

  return (
    <div>
      <PageHeader
        breadcrumb={
          <div className="flex items-center gap-2">
            <Link to="/parent" className="hover:text-ink-800">
              Parent overview
            </Link>
            <span aria-hidden>/</span>
            <Link
              to={`/parent/children/${studentId}`}
              className="hover:text-ink-800"
            >
              {childName}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink-700">Attendance</span>
          </div>
        }
        title="Attendance record"
        arabic="الحضور والغياب"
        description={`Attendance for ${childName} · ${classNameRef(data?.student?.academicClass)}`}
        actions={
          <Button
            variant="outline"
            icon={<ArrowLeft className="size-4" aria-hidden />}
            onClick={() => {
              setPage(1);
              void refetch();
            }}
          >
            Refresh
          </Button>
        }
      />

      {isError && (
        <Alert tone="error" title="Could not load attendance" className="mb-4">
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
            summary?.total && summary.total > 0
              ? `${Number(summary.attendanceRate ?? 0).toFixed(1)}%`
              : "—"
          }
          icon={<CalendarCheck className="size-4" aria-hidden />}
          tone="primary"
        />
        <StatCard label="Present" value={summary?.Present ?? 0} tone="primary" />
        <StatCard label="Late" value={summary?.Late ?? 0} tone="primary" />
        <StatCard
          label="Absent"
          value={summary?.Absent ?? 0}
          tone={summary?.Absent ? "danger" : "default"}
        />
        <StatCard label="Excused" value={summary?.Excused ?? 0} tone="gold" />
        <StatCard label="Total days" value={summary?.total ?? 0} />
      </StatGrid>

      <Card padded={false} className="mb-6">
        <div className="grid gap-4 border-b border-ink-100 p-5 sm:grid-cols-3">
          <InputField
            label="From date"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <InputField
            label="To date"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AttendanceQueryStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectField>
        </div>
        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle="No attendance records"
          emptyDescription="No marked attendance matches the selected filters."
          rowKey={(row) => row._id}
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
        <PagedFooter pagination={data?.pagination} onPageChange={setPage} />
      </Card>
    </div>
  );
}
