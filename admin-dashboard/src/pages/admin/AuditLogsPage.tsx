import { useMemo, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { InputField, SelectField } from "@/components/ui/Fields";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";

import { getApiErrorMessage } from "@/features/staff/api";
import {
  useGetAuditLogsQuery,
  type AuditLog,
} from "@/features/admin/api";
import type { UserRef } from "@/features/communication/api";

const PAGE_SIZE = 20;

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function methodTone(method: string): BadgeTone {
  switch (method) {
    case "DELETE":
      return "danger";
    case "PUT":
    case "PATCH":
      return "warning";
    case "POST":
      return "info";
    default:
      return "neutral";
  }
}

function userRefLabel(value: UserRef | string | null | undefined): string {
  if (!value) return "Unknown";
  if (typeof value === "string") return value;
  return value.fullName || `@${value.username ?? value._id}`;
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: "timestamp",
    dir: "desc",
  });
  const [userFilter, setUserFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [pathFilter, setPathFilter] = useState("");
  const [successFilter, setSuccessFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetAuditLogsQuery({
    page,
    limit: PAGE_SIZE,
    user: userFilter || undefined,
    role: roleFilter || undefined,
    method: methodFilter || undefined,
    path: pathFilter || undefined,
    success: successFilter === "" ? undefined : successFilter,
    from: fromFilter || undefined,
    to: toFilter || undefined,
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const onSortChange = (key: string | null) => {
    setSort((prev) =>
      prev.key === key
        ? key
          ? { key, dir: "desc" }
          : { key: null, dir: "asc" }
        : { key, dir: "asc" },
    );
  };

  const columns: Column<AuditLog>[] = useMemo(
    () => [
      {
        key: "timestamp",
        header: "Timestamp",
        sortValue: (l) => l.createdAt,
        render: (l) => (
          <span className="whitespace-nowrap text-xs text-ink-800">
            {fmtDateTime(l.createdAt)}
          </span>
        ),
      },
      {
        key: "user",
        header: "User",
        sortValue: (l) => userRefLabel(l.user),
        render: (l) => (
          <div className="text-xs">
            <p className="font-medium text-ink-900">{userRefLabel(l.user)}</p>
            {l.role && <p className="text-ink-500">{l.role}</p>}
          </div>
        ),
      },
      {
        key: "method",
        header: "Method",
        sortValue: (l) => l.method,
        render: (l) => <Badge tone={methodTone(l.method)}>{l.method}</Badge>,
      },
      {
        key: "path",
        header: "Path",
        sortValue: (l) => l.path,
        render: (l) => (
          <span className="block max-w-xs truncate font-mono text-xs text-ink-800" title={l.path}>
            {l.path}
          </span>
        ),
      },
      {
        key: "success",
        header: "Result",
        align: "center",
        sortValue: (l) => (l.success ? 1 : 0),
        render: (l) => (
          <span className="inline-flex items-center gap-1.5">
            <Badge tone={l.success ? "success" : "danger"}>
              {l.success ? "Passing" : "Failing"}
            </Badge>
            {l.statusCode !== undefined && l.statusCode !== null && (
              <span className="text-xs text-ink-500">{l.statusCode}</span>
            )}
          </span>
        ),
      },
      {
        key: "ip",
        header: "IP",
        render: (l) => (
          <span className="font-mono text-xs text-ink-600">{l.ip || "—"}</span>
        ),
      },
      {
        key: "userAgent",
        header: "User agent",
        render: (l) => (
          <span
            className="block max-w-[220px] truncate text-xs text-ink-500"
            title={l.userAgent ?? undefined}
          >
            {l.userAgent || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const resetFilters = () => {
    setUserFilter("");
    setRoleFilter("");
    setMethodFilter("");
    setPathFilter("");
    setSuccessFilter("");
    setFromFilter("");
    setToFilter("");
    setPage(1);
  };

  const hasFilters =
    userFilter || roleFilter || methodFilter || pathFilter || successFilter || fromFilter || toFilter;

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Authenticated write requests are logged automatically. Secrets are redacted server-side."
      />

      {isError && (
        <Alert tone="error" title="Could not load audit logs" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{getApiErrorMessage(error, "Request failed.")}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <Card padded={false}>
        <div className="grid gap-3 border-b border-ink-100 p-4 md:grid-cols-4">
          <InputField
            label="User (ID)"
            hint="Filter by user ID"
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setPage(1);
            }}
          />
          <SelectField
            label="Role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </SelectField>
          <SelectField
            label="Method"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All methods</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Result"
            value={successFilter}
            onChange={(e) => {
              setSuccessFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="true">Passing</option>
            <option value="false">Failing</option>
          </SelectField>
          <InputField
            label="Path search"
            value={pathFilter}
            placeholder="e.g. /invoices"
            onChange={(e) => {
              setPathFilter(e.target.value);
              setPage(1);
            }}
          />
          <InputField
            label="From"
            type="date"
            value={fromFilter}
            onChange={(e) => {
              setFromFilter(e.target.value);
              setPage(1);
            }}
          />
          <InputField
            label="To"
            type="date"
            value={toFilter}
            onChange={(e) => {
              setToFilter(e.target.value);
              setPage(1);
            }}
          />
          <div className="flex items-end">
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          emptyTitle="No audit logs"
          emptyDescription={
            hasFilters
              ? "Try adjusting or clearing the filters."
              : "Authenticated write activity will be logged here."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(l) => l._id}
          sort={sort}
          onSortChange={onSortChange}
          onRowClick={(l) => setDetail(l)}
          mobileCard={(l) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Badge tone={methodTone(l.method)}>{l.method}</Badge>
                <span className="inline-flex items-center gap-1.5">
                  <Badge tone={l.success ? "success" : "danger"}>
                    {l.success ? "Passing" : "Failing"}
                  </Badge>
                  {l.statusCode !== undefined && l.statusCode !== null && (
                    <span className="text-xs text-ink-500">{l.statusCode}</span>
                  )}
                </span>
              </div>
              <p className="break-all font-mono text-xs text-ink-800">{l.path}</p>
              <p className="text-xs text-ink-500">
                {userRefLabel(l.user)}
                {l.role ? ` · ${l.role}` : ""}
              </p>
              <p className="text-xs text-ink-500">{fmtDateTime(l.createdAt)}</p>
              <p className="truncate text-xs text-ink-400" title={l.userAgent ?? undefined}>
                {l.userAgent || "—"}
              </p>
            </div>
          )}
        />

        <PagedFooter pagination={pagination} onPageChange={setPage} />
      </Card>

      {detail && (
        <Dialog
          open
          onClose={() => setDetail(null)}
          size="lg"
          title="Audit log detail"
          description={`${detail.method} ${detail.path}`}
          footer={
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          }
        >
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
              Timestamp
            </dt>
            <dd className="text-ink-800">{fmtDateTime(detail.createdAt)}</dd>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
              User
            </dt>
            <dd className="text-ink-800">
              {userRefLabel(detail.user)}
              {detail.role ? ` (${detail.role})` : ""}
            </dd>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
              Result
            </dt>
            <dd className="text-ink-800">
              {detail.success ? "Passing" : "Failing"}
              {detail.statusCode !== undefined && detail.statusCode !== null
                ? ` · ${detail.statusCode}`
                : ""}
            </dd>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
              IP
            </dt>
            <dd className="font-mono text-xs text-ink-800">{detail.ip || "—"}</dd>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
              User agent
            </dt>
            <dd className="break-all text-xs text-ink-700">
              {detail.userAgent || "—"}
            </dd>
          </dl>
          {detail.requestBody !== undefined && detail.requestBody !== null ? (
            <div className="mt-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
                Request body (secrets redacted server-side)
              </h3>
              <pre className="max-h-64 overflow-auto rounded-lg border border-ink-100 bg-forest-50/60 p-3 font-mono text-xs text-ink-800">
                {prettyJson(detail.requestBody)}
              </pre>
            </div>
          ) : (
            <p className="mt-4 text-xs text-ink-500">
              No request body recorded for this entry.
            </p>
          )}
        </Dialog>
      )}
    </div>
  );
}
