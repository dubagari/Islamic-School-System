import { useState } from "react";

import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import { InputField, SelectField } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { PagedFooter } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";

import {
  extractErrorMessage,
  formatDate,
  useGetStudentAttendanceQuery,
  useGetStudentProfileQuery,
  type AttendanceRecord,
} from "@/features/student/api";

const PAGE_SIZE = 15;

const STATUSES = ["Present", "Absent", "Late", "Excused"] as const;

export function StudentAttendancePage() {
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: profileEnvelope,
    isError: isProfileError,
    error: profileError,
  } = useGetStudentProfileQuery();

  const studentId = profileEnvelope?.data?._id ?? "";

  const {
    data: envelope,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentAttendanceQuery(
    {
      studentId,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      limit: PAGE_SIZE,
    },
    { skip: !studentId },
  );

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "date",
      header: "Date",
      sortValue: (r) => r.date ?? "",
      render: (r) => formatDate(r.date),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status ?? ""} />,
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (r) => r.remarks?.trim() || "—",
    },
  ];

  const mobileCard = (r: AttendanceRecord) => (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-medium text-ink-900">{formatDate(r.date)}</p>
        {r.remarks?.trim() && (
          <p className="mt-0.5 text-xs text-ink-500">{r.remarks}</p>
        )}
      </div>
      <StatusBadge status={r.status ?? ""} />
    </div>
  );

  if (isProfileError) {
    return (
      <div>
        <PageHeader
          title="My attendance"
          arabic="الحضور"
          description="Your daily attendance records."
        />
        <div className="max-w-md">
          <EmptyState
            title="Student profile unavailable"
            description={extractErrorMessage(profileError)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My attendance"
        arabic="الحضور"
        description="Your daily attendance records for the selected period."
      />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>
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
        </div>
      </Card>

      <StatGrid cols={4} className="mb-6">
        <StatCard
          label="Attendance rate"
          value={
            envelope?.summary && envelope.summary.total > 0
              ? `${envelope.summary.attendanceRate}%`
              : "—"
          }
          sub={`${envelope?.summary?.total ?? 0} record${(envelope?.summary?.total ?? 0) === 1 ? "" : "s"}`}
          tone="primary"
        />
        <StatCard
          label="Present"
          value={envelope?.summary?.Present ?? "—"}
          tone="default"
        />
        <StatCard
          label="Absent"
          value={envelope?.summary?.Absent ?? "—"}
          tone="danger"
          sub={envelope?.summary ? `Excused: ${envelope.summary.Excused}` : undefined}
        />
        <StatCard
          label="Late"
          value={envelope?.summary?.Late ?? "—"}
          tone="warning"
        />
      </StatGrid>

      <Card padded={false}>
        {isError ? (
          <div className="p-5">
            <EmptyState
              title="Could not load attendance"
              description={extractErrorMessage(error)}
              action={
                <Button size="sm" variant="outline" onClick={() => void refetch()}>
                  Retry
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={envelope?.data ?? []}
              isLoading={isLoading}
              emptyTitle="No attendance records"
              emptyDescription="Records will appear once your class attendance is marked."
              rowKey={(r) => r._id}
              mobileCard={mobileCard}
            />
            <PagedFooter pagination={envelope?.pagination} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
