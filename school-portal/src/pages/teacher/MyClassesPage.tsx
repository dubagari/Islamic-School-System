import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  fmtDate,
  getApiErrorMessage,
  refName,
  useGetMyClassesQuery,
} from "@/features/teacher/api";

export function MyClassesPage() {
  const navigate = useNavigate();
  const myClasses = useGetMyClassesQuery();
  const rows = myClasses.data?.data ?? [];

  const columns: Column<(typeof rows)[number]>[] = useMemo(
    () => [
      {
        key: "class",
        header: "Class",
        sortValue: (row) => row.class.name,
        render: (row) => (
          <span className="font-medium text-ink-900">{row.class.name}</span>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        sortValue: (row) => row.subject.name,
        render: (row) => (
          <div>
            <p>{row.subject.name}</p>
            {row.description && (
              <p className="max-w-xs truncate text-xs text-ink-500" title={row.description}>
                {row.description}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "courseCode",
        header: "Course code",
        sortValue: (row) => row.subject.code ?? row.courseCode ?? "",
        render: (row) => row.subject.code ?? row.courseCode ?? "—",
      },
      {
        key: "semester",
        header: "Semester",
        sortValue: (row) => row.semester.name,
        render: (row) =>
          row.semester.name
            ? `${row.semester.name}${refName(row.semester.academicSession) ? ` · ${refName(row.semester.academicSession)}` : ""}`
            : "—",
      },
      {
        key: "assignedDate",
        header: "Assigned",
        sortValue: (row) => row.assignedDate ?? "",
        render: (row) => fmtDate(row.assignedDate),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (row) => (
          <Button
            size="sm"
            variant="outline"
            icon={<CalendarCheck2 className="size-3.5" aria-hidden />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                `/teacher/attendance?class=${row.class._id}&semester=${row.semester._id}`,
              );
            }}
          >
            Attendance
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="My classes"
        description="Every class-subject assigned to you. Open a row to take attendance for that class."
      />

      {myClasses.isError && (
        <Alert
          tone="error"
          title="Could not load your classes"
          className="mb-4"
        >
          {getApiErrorMessage(myClasses.error)}
        </Alert>
      )}

      <Card padded={false}>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={myClasses.isLoading}
          emptyTitle="No classes assigned yet"
          emptyDescription="Once administration assigns you class-subjects they will appear here."
          rowKey={(row) => row.assignmentId}
          onRowClick={(row) =>
            navigate(
              `/teacher/attendance?class=${row.class._id}&semester=${row.semester._id}`,
            )
          }
          mobileCard={(row) => (
            <div className="flex flex-col gap-2">
              <p className="font-medium text-ink-900">{row.class.name}</p>
              <p className="text-sm text-ink-700">{row.subject.name}</p>
              <div className="flex flex-wrap gap-2 text-xs text-ink-500">
                <span>Code: {row.subject.code ?? row.courseCode ?? "—"}</span>
                <span>· {row.semester.name ?? "—"}</span>
                <span>· Assigned {fmtDate(row.assignedDate)}</span>
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  );
}
