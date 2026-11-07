import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { InputField, Select } from "@/components/ui/Fields";

import {
  classLabel,
  refName,
  studentFullName,
  useGetStudentsQuery,
  type Student,
  type StudentStatus,
} from "@/features/students/api";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { label: string; value: StudentStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "Active" },
  { label: "Suspended", value: "Suspended" },
  { label: "Graduated", value: "Graduated" },
  { label: "Withdrawn", value: "Withdrawn" },
  { label: "Expelled", value: "Expelled" },
];

export function StudentsPage() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StudentStatus | "">("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: null,
    dir: "asc",
  });

  const { data: studentsData, isLoading, isError, error, refetch } =
    useGetStudentsQuery({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
    });

  const students = studentsData?.data;
  const pagination = studentsData?.pagination;

  const columns: Column<Student>[] = useMemo(
    () => [
      {
        key: "registrationNumber",
        header: "Reg #",
        className: "font-mono text-xs",
        sortValue: (s) => s.registrationNumber,
        render: (s) => <span className="font-mono text-xs">{s.registrationNumber || "—"}</span>,
      },
      {
        key: "fullName",
        header: "Name",
        sortValue: (s) => studentFullName(s),
        render: (s) => (
          <div className="flex flex-col">
            <span className="font-medium text-ink-900">{studentFullName(s)}</span>
            <span className="text-xs text-ink-500">
              Guardian: {s.parentName || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "academicClass",
        header: "Class",
        render: (s) => refName(classLabel(s.academicClass)),
      },
      {
        key: "gender",
        header: "Gender",
        sortValue: (s) => s.gender,
        render: (s) => s.gender || "—",
      },
      {
        key: "status",
        header: "Status",
        sortValue: (s) => s.status,
        render: (s) => <StatusBadge status={s.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (s) => (
          <Button
            size="sm"
            variant="outline"
            icon={<Eye className="size-3.5" aria-hidden />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/students/${s._id}`);
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const mobileCard = (s: Student) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink-900">{studentFullName(s)}</p>
          <p className="font-mono text-xs text-ink-500">{s.registrationNumber}</p>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-ink-500">Class</dt>
        <dd className="text-ink-800">{refName(classLabel(s.academicClass))}</dd>
        <dt className="text-ink-500">Gender</dt>
        <dd className="text-ink-800">{s.gender || "—"}</dd>
        <dt className="text-ink-500">Guardian</dt>
        <dd className="text-ink-800">{s.parentName || "—"}</dd>
      </dl>
      <Button
        size="sm"
        variant="outline"
        className="mt-1 self-start"
        icon={<Eye className="size-3.5" aria-hidden />}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/students/${s._id}`);
        }}
      >
        View
      </Button>
    </div>
  );

  const changeSearch = (value: string) => {
    setSearchInput(value);
    window.clearTimeout((window as unknown as { __studentsSearchTimer?: number }).__studentsSearchTimer);
    (window as unknown as { __studentsSearchTimer?: number }).__studentsSearchTimer =
      window.setTimeout(() => {
        setSearch(value);
        setPage(1);
      }, 400);
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

  return (
    <div>
      <PageHeader
        title="Students"
        description="Directory of registered students with class, guardian and enrollment status."
      />

      {isError && (
        <Alert
          tone="error"
          title="Could not load students"
          className="mb-4"
        >
          <div className="flex items-center gap-3">
            <span>{(error as Error | undefined)?.message ?? "Request failed."}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <InputField
              label="Search"
              placeholder="Name, reg #, phone or guardian…"
              value={searchInput}
              onChange={(e) => changeSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:max-w-52">
            <label className="mb-1.5 block text-xs font-medium text-ink-700" htmlFor="students-status">
              Status
            </label>
            <Select
              id="students-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StudentStatus | "");
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={students}
          isLoading={isLoading}
          emptyTitle="No students found"
          emptyDescription={
            search || status
              ? "Try adjusting the search or status filter."
              : "No students have been registered yet."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(s) => s._id}
          onRowClick={(s) => navigate(`/students/${s._id}`)}
          sort={sort}
          onSortChange={onSortChange}
          mobileCard={mobileCard}
        />

        <PagedFooter
          pagination={pagination}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
