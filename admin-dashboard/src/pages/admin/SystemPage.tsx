import { useMemo, useState, type ReactNode } from "react";
import {
  Database,
  HardDrive,
  RefreshCcw,
  Server,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";

import { getApiErrorMessage } from "@/features/staff/api";
import {
  useGetHealthQuery,
  useGetSystemDatabaseQuery,
  useGetSystemInfoQuery,
  useSyncIndexesMutation,
  type HealthData,
  type SystemDatabaseData,
  type SystemInfoData,
  type SyncIndexesData,
} from "@/features/admin/api";

function healthData(payload: ApiLike<HealthData> | HealthData | undefined): HealthData | undefined {
  if (!payload) return undefined;
  if ("success" in (payload as Record<string, unknown>)) {
    return (payload as ApiLike<HealthData>).data;
  }
  return payload as HealthData;
}

type ApiLike<T> = { success: boolean; data: T };

function fmtUptime(seconds: unknown): string {
  const value =
    typeof seconds === "number"
      ? seconds
      : typeof seconds === "string" && /^\d+(\.\d+)?$/.test(seconds)
        ? Number(seconds)
        : NaN;
  if (Number.isNaN(value)) return "";
  const days = Math.floor(value / 86_400);
  const hours = Math.floor((value % 86_400) / 3_600);
  const minutes = Math.floor((value % 3_600) / 60);
  return [days ? `${days}d` : "", hours ? `${hours}h` : "", `${minutes}m`]
    .filter(Boolean)
    .join(" ");
}

function fmtBytes(value: unknown): string {
  const bytes =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+(\.\d+)?$/.test(value)
        ? Number(value)
        : NaN;
  if (Number.isNaN(bytes)) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let unit = 0;
  while (v >= 1024 && unit < units.length - 1) {
    v /= 1024;
    unit += 1;
  }
  return `${v.toFixed(1)} ${units[unit]}`;
}

const UNIT_LABELS: Record<string, string> = {
  env: "Environment",
  environment: "Environment",
  nodeEnv: "Node environment",
  version: "Version",
  status: "Status",
  uptime: "Uptime",
  uptimeSeconds: "Uptime",
  timestamp: "Timestamp",
  database: "Database",
  databaseName: "Database name",
  host: "Host",
  collections: "Collections",
};

const ENV_TONES: Record<string, BadgeTone> = {
  production: "success",
  development: "warning",
  test: "info",
};

export function SystemPage() {
  const [confirmSync, setConfirmSync] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncIndexesData | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const {
    data: infoEnvelope,
    isLoading: loadingInfo,
    isError: infoError,
    error: infoErrorBag,
    refetch: refetchInfo,
  } = useGetSystemInfoQuery();

  const {
    data: dbEnvelope,
    isLoading: loadingDb,
    isError: dbError,
    error: dbErrorBag,
    refetch: refetchDb,
  } = useGetSystemDatabaseQuery();

  const {
    data: healthEnvelope,
    isLoading: loadingHealth,
    isError: healthError,
    refetch: refetchHealth,
  } = useGetHealthQuery(undefined, { pollingInterval: 60 });

  const [syncIndexes, { isLoading: syncing }] = useSyncIndexesMutation();

  const info: SystemInfoData | undefined = infoEnvelope?.data;
  const db: SystemDatabaseData | undefined = dbEnvelope?.data;
  const health = healthData(healthEnvelope);

  const infoRows = useMemo(
    () => scalarRows(info),
    [info],
  );
  const dbRows = useMemo(
    () => scalarRows(db),
    [db],
  );

  const runSync = () => {
    void (async () => {
      setBannerError(null);
      try {
        const result = await syncIndexes().unwrap();
        setConfirmSync(false);
        setSyncResult(result?.data ?? null);
      } catch (err) {
        setConfirmSync(false);
        setBannerError(getApiErrorMessage(err, "Index synchronization failed."));
      }
    })();
  };

  return (
    <div>
      <PageHeader
        title="System"
        description="Runtime information, database statistics, and maintenance operations."
        actions={
          <Button
            icon={<RefreshCcw className="size-4" aria-hidden />}
            loading={syncing}
            onClick={() => setConfirmSync(true)}
          >
            Sync indexes
          </Button>
        }
      />

      {bannerError && (
        <Alert
          tone="error"
          title="Maintenance operation failed"
          className="mb-4"
          onDismiss={() => setBannerError(null)}
        >
          {bannerError}
        </Alert>
      )}

      {/* Health indicator — public /health (section 2) */}
      <Card
        className="mb-4"
        title="API health"
        description="GET /health — public status dot and environment"
        actions={
          <Button size="sm" variant="ghost" onClick={() => void refetchHealth()}>
            Refresh
          </Button>
        }
      >
        {healthError ? (
          <Alert tone="error" title="Health check failed">
            The API did not respond to /health. Try refreshing.
          </Alert>
        ) : loadingHealth && !health ? (
          <div
            className="h-6 w-48 animate-pulse rounded bg-ink-100"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Loading health status…</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-900">
              <span
                className="inline-block size-2.5 rounded-full bg-primary-600"
                role="img"
                aria-label="API status: responding"
              />
              Responding
            </span>
            {health?.env ?? health?.environment ? (
              <Badge tone={ENV_TONES[(health.env ?? health.environment) as string] ?? "info"}>
                Env: {health.env ?? health.environment}
              </Badge>
            ) : null}
            {typeof health?.timestamp === "string" && (
              <span className="text-xs text-ink-500">
                {new Date(health.timestamp).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="System info"
          description="GET /system/info — application and record counts"
          actions={
            <Button size="sm" variant="ghost" onClick={() => void refetchInfo()}>
              Refresh
            </Button>
          }
        >
          <SystemRows
            rows={infoRows}
            nested={nestedEntries(info, "counts")}
            isLoading={loadingInfo}
            icon={<Server className="size-4" aria-hidden />}
            error={infoError}
            errorText={getApiErrorMessage(infoErrorBag, "Request failed.")}
          />
        </Card>

        <Card
          title="Database"
          description="GET /system/database — storage and collection statistics"
          actions={
            <Button size="sm" variant="ghost" onClick={() => void refetchDb()}>
              Refresh
            </Button>
          }
        >
          <SystemRows
            rows={dbRows}
            isLoading={loadingDb}
            icon={<Database className="size-4" aria-hidden />}
            error={dbError}
            errorText={getApiErrorMessage(dbErrorBag, "Request failed.")}
          />
        </Card>
      </div>

      <Card
        className="mt-4"
        title="Maintenance"
        description="POST /system/sync-indexes — run after schema or index changes."
        bodyClassName="space-y-2"
      >
        <p className="flex items-center gap-2 text-sm text-ink-700">
          <HardDrive className="size-4 text-ink-400" aria-hidden />
          Synchronizing indexes builds missing indexes and can drop obsolete ones.
          It may fail if existing data violates a new unique index — inspect the
          per-model results.
        </p>
        <Button
          icon={<RefreshCcw className="size-4" aria-hidden />}
          loading={syncing}
          onClick={() => setConfirmSync(true)}
        >
          Sync indexes
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmSync}
        title="Sync database indexes"
        confirmLabel="Sync indexes"
        loading={syncing}
        tone="danger"
        onClose={() => setConfirmSync(false)}
        description="This is a maintenance operation: obsolete indexes may be removed and unique-index conflicts can fail the run."
        onConfirm={runSync}
      />

      {syncResult && (
        <Dialog
          open
          onClose={() => setSyncResult(null)}
          size="lg"
          title="Index synchronization results"
          description="Per-model outcomes returned by the server."
          footer={
            <Button variant="outline" onClick={() => setSyncResult(null)}>
              Close
            </Button>
          }
        >
          <pre className="max-h-72 overflow-auto rounded-lg border border-ink-100 bg-forest-50/60 p-3 font-mono text-xs text-ink-800">
            {prettySync(syncResult)}
          </pre>
        </Dialog>
      )}
    </div>
  );
}

function scalarRows(
  source: Record<string, unknown> | undefined,
): { label: string; value: string }[] {
  if (!source || typeof source !== "object") {
    return [];
  }
  const rows: { label: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(source)) {
    if (
      key === "counts" ||
      key === "collections" ||
      key === "indexes" ||
      key === "_id" ||
      raw === null ||
      typeof raw === "object"
    ) {
      continue;
    }
    const label = UNIT_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
    let value = String(raw);
    if (key.toLowerCase().includes("uptime")) {
      value = fmtUptime(raw) || value;
    } else if (/bytes|size|storage|raw/i.test(key)) {
      value = fmtBytes(raw) || value;
    }
    rows.push({ label, value });
  }
  return rows;
}

function nestedEntries(
  source: Record<string, unknown> | undefined,
  key: string,
): Record<string, unknown> | undefined {
  const value = source?.[key];
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function SystemRows({
  rows,
  nested,
  isLoading,
  icon,
  error,
  errorText,
}: {
  rows: { label: string; value: string }[];
  nested?: Record<string, unknown>;
  isLoading: boolean;
  icon: ReactNode;
  error: boolean;
  errorText: string;
}) {
  return (
    <div>
      {error ? (
        <Alert tone="error" title="Could not load data">
          {errorText}
        </Alert>
      ) : isLoading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <span className="sr-only">Loading…</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 w-2/3 animate-pulse rounded bg-ink-100" />
          ))}
        </div>
      ) : rows.length === 0 && !nested ? (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          {icon}
          No information returned by the server.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.length > 0 && (
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {rows.map((row) => (
                <div key={row.label} className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    {row.label}
                  </dt>
                  <dd className="truncate text-sm text-ink-900" title={row.value}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {nested && Object.keys(nested).length > 0 && (
            <div>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Records per collection
              </h3>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                {Object.entries(nested).map(([name, count]) => (
                  <li
                    key={name}
                    className="flex items-center justify-between gap-2 rounded-md border border-ink-100 bg-forest-50/40 px-2 py-1 font-mono text-xs"
                  >
                    <span className="truncate text-ink-800" title={name}>
                      {name}
                    </span>
                    <span className="text-ink-500">{String(count)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function prettySync(result: Record<string, unknown>): string {
  const lines: string[] = [];
  const findResults = (node: unknown, depth = 0): Record<string, unknown> | undefined => {
    if (!node || typeof node !== "object" || depth > 2) return undefined;
    const obj = node as Record<string, unknown>;
    for (const key of ["results", "perModel", "models"]) {
      if (obj[key] && typeof obj[key] === "object") {
        return obj[key] as Record<string, unknown>;
      }
    }
    for (const value of Object.values(obj)) {
      const found = findResults(value, depth + 1);
      if (found) return found;
    }
    return undefined;
  };
  const results = findResults(result);
  if (results) {
    for (const [model, outcome] of Object.entries(results)) {
      let status = "ok";
      if (typeof outcome === "string") {
        status = outcome;
      } else if (outcome && typeof outcome === "object") {
        const o = outcome as Record<string, unknown>;
        status =
          typeof o.status === "string"
            ? o.status
            : o.ok === true || o.synced === true
              ? "synced"
              : stringifyShort(outcome);
        const created =
          typeof o.created === "number"
            ? ` (created ${o.created})`
            : typeof o.indexesCreated === "number"
              ? ` (created ${o.indexesCreated})`
              : "";
        lines.push(`${model}: ${status}${created}`);
        continue;
      } else {
        status = stringifyShort(outcome);
      }
      lines.push(`${model}: ${status}`);
    }
    return lines.join("\n");
  }
  return JSON.stringify(result, null, 2);
}

function stringifyShort(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
