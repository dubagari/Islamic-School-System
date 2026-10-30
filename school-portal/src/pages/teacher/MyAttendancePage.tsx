import { useState } from "react";
import { CalendarCheck2, CalendarRange } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { InputField, SelectField } from "@/components/ui/Fields";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";

import {
  fmtRate,
  getApiErrorMessage,
  refName,
  useGetTeacherAttendanceMeQuery,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/features/teacher/api";

const PAGE_SIZE = 10;

const STATUS_FILTERS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Excused",
  "Leave",
];

export function MyAttendancePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const attendance = useGetTeacherAttendanceMeQuery({
    from: from || undefined,
    to: to || undefined,
    status: (status || undefined) as AttendanceStatus | undefined,
    page,
    limit: PAGE_SIZE,
  });

  const records = attendance.data?.data ?? [];
  const summary = attendance.data?.summary;

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "date",
      header: "Date",
      sortValue: (record) => record.date,
      render: (record) => fmtDay(record.date),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (record) => record.status,
      render: (record) => <StatusBadge status={record.status} />,
    },
    {
      key: "recordedBy",
      header: "Recorded by",
      render: (record) => refName(record.recordedBy) ?? "—",
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (record) => record.remarks ?? "—",
    },
  ];

  return (
    <div>
      <PageHeader
        title="My attendance"
        description="Your own sign-in attendance as recorded by the school."
      />

      {attendance.isError && (
        <Alert tone="error" title="Could not load attendance" className="mb-4">
          {getApiErrorMessage(attendance.error)}
        </Alert>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Present"
          value={summary && summary.total > 0 ? summary.Present : "—"}
          icon={<CalendarCheck2 className="size-4" aria-hidden />}
          tone="primary"
          loading={attendance.isLoading}
        />
        <StatCard
          label="Absent"
          value={summary && summary.total > 0 ? summary.Absent : "—"}
          tone="danger"
          loading={attendance.isLoading}
        />
        <StatCard
          label="Late"
          value={summary && summary.total > 0 ? summary.Late : "—"}
          tone="warning"
          loading={attendance.isLoading}
        />
        <StatCard
          label="Excused"
          value={summary && summary.total > 0 ? summary.Excused : "—"}
          loading={attendance.isLoading}
        />
        <StatCard
          label="Attendance rate"
          value={fmtRate(summary?.attendanceRate)}
          sub={summary && summary.total > 0 ? `${summary.total} records` : undefined}
          icon={<CalendarRange className="size-4" aria-hidden />}
          tone="gold"
          loading={attendance.isLoading}
        />
      </div>

      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            label="From"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <InputField
            label="To"
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
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {STATUS_FILTERS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </div>
      </Card>

      <Card padded={false}>
        <DataTable
          columns={columns}
          data={records}
          isLoading={attendance.isLoading}
          emptyTitle="No attendance records"
          emptyDescription="No records match this date range yet — try widening the range."
          rowKey={(record) => record._id}
          mobileCard={(record) => (
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-ink-900">{fmtDay(record.date)}</p>
                <p className="text-xs text-ink-500">
                  Recorded by {refName(record.recordedBy) ?? "—"}
                </p>
              </div>
              <StatusBadge status={record.status} />
            </div>
          )}
        />
        <PagedFooter pagination={attendance.data?.pagination} onPageChange={setPage} />
      </Card>
    </div>
  );
}

function fmtDay(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
