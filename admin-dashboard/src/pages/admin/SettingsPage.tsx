import { useEffect, useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";

import { getApiErrorMessage } from "@/features/staff/api";
import type { UserRef } from "@/features/communication/api";
import { formatNaira } from "@/features/admissions/api";

import {
  useDeleteSettingMutation,
  useGetSettingsQuery,
  usePutSettingMutation,
  type Setting,
  type SettingValue,
} from "@/features/admin/api";

const CATEGORIES = [
  "general",
  "branding",
  "academic",
  "finance",
  "notifications",
  "system",
];

function settingValueLabel(value: SettingValue): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function refName(
  value: UserRef | string | null | undefined,
): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.fullName;
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function SettingsPage() {
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: null,
    dir: "asc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Setting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Setting | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetSettingsQuery();

  const settings = data?.data ?? [];

  const [putSetting, { isLoading: saving }] = usePutSettingMutation();
  const [deleteSetting, { isLoading: deleting }] = useDeleteSettingMutation();

  const feeSetting = settings.find((s) => s.key === "admission.fee");
  const feeValue =
    typeof feeSetting?.value === "number"
      ? feeSetting.value
      : Number(feeSetting?.value ?? NaN);
  const feeInitial =
    Number.isFinite(feeValue) && feeValue > 0 ? String(feeValue) : "";

  const [feeValueText, setFeeValueText] = useState("");
  const [feeUpdating, setFeeUpdating] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  useEffect(() => {
    if (feeInitial) {
      setFeeValueText(feeInitial);
    }
  }, [feeInitial]);

  const schoolFeeSetting = settings.find((s) => s.key === "school.fee");
  const schoolFeeValue =
    typeof schoolFeeSetting?.value === "number"
      ? schoolFeeSetting.value
      : Number(schoolFeeSetting?.value ?? NaN);
  const schoolFeeInitial =
    Number.isFinite(schoolFeeValue) && schoolFeeValue > 0
      ? String(schoolFeeValue)
      : "";

  const [schoolFeeValueText, setSchoolFeeValueText] = useState("");
  const [schoolFeeUpdating, setSchoolFeeUpdating] = useState(false);
  const [schoolFeeError, setSchoolFeeError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolFeeInitial) {
      setSchoolFeeValueText(schoolFeeInitial);
    }
  }, [schoolFeeInitial]);

  const onSortChange = (key: string | null) => {
    setSort((prev) =>
      prev.key === key
        ? key
          ? { key, dir: "desc" }
          : { key: null, dir: "asc" }
        : { key, dir: "asc" },
    );
  };

  const handleUpdateSchoolFee = async () => {
    const parsed = Number(schoolFeeValueText.trim());
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setSchoolFeeError("Enter a positive amount.");
      return;
    }

    try {
      setSchoolFeeUpdating(true);
      setSchoolFeeError(null);
      await putSetting({
        key: "school.fee",
        body: {
          value: parsed,
          category: "finance",
          description:
            "Expected school fee in naira, shown when no invoice has been issued.",
        },
      }).unwrap();
      await refetch();
      setNotice("School fee updated.");
    } catch (err) {
      setSchoolFeeError(
        getApiErrorMessage(err, "Could not save the school fee."),
      );
    } finally {
      setSchoolFeeUpdating(false);
    }
  };

  const handleUpdateFee = async () => {
    const parsed = Number(feeValueText.trim());
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFeeError("Enter a positive amount.");
      return;
    }

    try {
      setFeeUpdating(true);
      setFeeError(null);
      await putSetting({
        key: "admission.fee",
        body: {
          value: parsed,
          category: "finance",
          description: "Admission/acceptance fee in naira.",
        },
      }).unwrap();
      await refetch();
      setNotice("Admission fee updated.");
    } catch (err) {
      setFeeError(getApiErrorMessage(err, "Could not save the admission fee."));
    } finally {
      setFeeUpdating(false);
    }
  };

  const columns: Column<Setting>[] = [
    {
      key: "key",
      header: "Key",
      sortValue: (s) => s.key,
      render: (s) => (
        <span className="font-mono text-xs text-ink-900">{s.key}</span>
      ),
    },
    {
      key: "value",
      header: "Value",
      render: (s) => (
        <span
          className="block max-w-xs truncate font-mono text-xs text-ink-800"
          title={settingValueLabel(s.value)}
        >
          {settingValueLabel(s.value)}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortValue: (s) => s.category ?? "",
      render: (s) => s.category || "—",
    },
    {
      key: "isPublic",
      header: "Public",
      align: "center",
      render: (s) =>
        s.isPublic ? (
          <Badge tone="success">Public</Badge>
        ) : (
          <Badge tone="neutral">Private</Badge>
        ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      sortValue: (s) => s.updatedAt ?? "",
      render: (s) => (
        <div className="text-xs">
          <p className="text-ink-800">{refName(s.updatedBy)}</p>
          <p className="text-ink-500">{fmtDateTime(s.updatedAt)}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<PencilLine className="size-3.5" aria-hidden />}
            onClick={() => {
              setEditing(s);
              setFormOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="size-3.5" aria-hidden />}
            aria-label={`Delete setting: ${s.key}`}
            onClick={() => setDeleteTarget(s)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="System settings"
        description="Key-value application settings. Public settings are exposed on the public settings endpoint."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New setting
          </Button>
        }
      />

      {bannerError && (
        <Alert
          tone="error"
          className="mb-4"
          onDismiss={() => setBannerError(null)}
        >
          {bannerError}
        </Alert>
      )}

      {notice && (
        <Alert tone="success" className="mb-4" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {isError && (
        <Alert tone="error" title="Could not load settings" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{getApiErrorMessage(error, "Request failed.")}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <Card
        className="mb-4"
        title="Admission payment fee"
        description="Applicants use this fee to complete admission payment through Paystack."
      >
        <form
          id="admission-fee-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleUpdateFee();
          }}
          className="grid gap-4 sm:grid-cols-[minmax(0,200px)_auto] sm:items-end"
        >
          <InputField
            label="Amount (₦)"
            required
            type="number"
            min="1"
            step="0.01"
            inputMode="decimal"
            value={feeValueText}
            onChange={(e) => setFeeValueText(e.target.value)}
            error={feeError ?? undefined}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={feeUpdating}>
              Save fee
            </Button>
            {feeSetting && (
              <p className="text-xs text-ink-500">
                Current: {formatNaira(feeValue)}
              </p>
            )}
          </div>
        </form>
        {!feeSetting && (
          <Alert tone="warning" className="mt-4">
            No admission fee is saved yet. Set it before enabling online payments.
          </Alert>
        )}
      </Card>

      <Card
        className="mb-4"
        title="School fee"
        description="Expected school fee shown to students when no invoice has been issued. Real billing uses fee structures and generated invoices."
      >
        <form
          id="school-fee-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleUpdateSchoolFee();
          }}
          className="grid gap-4 sm:grid-cols-[minmax(0,200px)_auto] sm:items-end"
        >
          <InputField
            label="Amount (₦)"
            required
            type="number"
            min="1"
            step="0.01"
            inputMode="decimal"
            value={schoolFeeValueText}
            onChange={(e) => setSchoolFeeValueText(e.target.value)}
            error={schoolFeeError ?? undefined}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={schoolFeeUpdating}>
              Save school fee
            </Button>
            {schoolFeeSetting && (
              <p className="text-xs text-ink-500">
                Current: {formatNaira(schoolFeeValue)}
              </p>
            )}
          </div>
        </form>
        {!schoolFeeSetting && (
          <Alert tone="warning" className="mt-4">
            No school fee is saved yet. Students see a contact-the-office
            notice until it is set or an invoice is issued. Set it now?
          </Alert>
        )}
      </Card>

      <Card padded={false}>
        <DataTable
          columns={columns}
          data={settings}
          isLoading={isLoading}
          emptyTitle="No settings found"
          emptyDescription="Create a key-value setting to configure the application."
          rowKey={(s) => s.key}
          sort={sort}
          onSortChange={onSortChange}
          mobileCard={(s) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-ink-900">
                  {s.key}
                </span>
                {s.isPublic ? (
                  <Badge tone="success">Public</Badge>
                ) : (
                  <Badge tone="neutral">Private</Badge>
                )}
              </div>
              <p className="truncate font-mono text-xs text-ink-800">
                {settingValueLabel(s.value)}
              </p>
              <p className="text-xs text-ink-500">
                {s.category || "—"} · {refName(s.updatedBy)} ·{" "}
                {fmtDateTime(s.updatedAt)}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(s);
                    setFormOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        />
      </Card>

      {formOpen && (
        <SettingFormDialog
          editing={editing}
          saving={saving}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onDone={(message) => {
            setFormOpen(false);
            setEditing(null);
            setNotice(message);
          }}
          onSubmit={async (key, body) => {
            await putSetting({ key, body }).unwrap();
            return "Setting saved.";
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        tone="danger"
        title="Delete setting"
        confirmLabel="Delete"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        description={
          deleteTarget ? `This removes the "${deleteTarget.key}" setting.` : undefined
        }
        onConfirm={() => {
          void (async () => {
            if (!deleteTarget) return;
            try {
              await deleteSetting(deleteTarget.key).unwrap();
              setDeleteTarget(null);
              setNotice("Setting deleted.");
            } catch (err) {
              setDeleteTarget(null);
              setBannerError(getApiErrorMessage(err, "Delete failed."));
            }
          })();
        }}
      />
    </div>
  );
}

function SettingFormDialog({
  editing,
  saving,
  onClose,
  onDone,
  onSubmit,
}: {
  editing: Setting | null;
  saving: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
  onSubmit: (
    key: string,
    body: {
      value: SettingValue;
      category?: string;
      description?: string;
      isPublic?: boolean;
    },
  ) => Promise<string>;
}) {
  const [key, setKey] = useState(editing?.key ?? "");
  const [valueText, setValueText] = useState(
    editing
      ? typeof editing.value === "object" && editing.value !== null
        ? JSON.stringify(editing.value, null, 2)
        : String(editing.value ?? "")
      : "",
  );
  const [category, setCategory] = useState(editing?.category ?? "");
  const [description, setDescription] = useState(
    editing?.description ?? "",
  );
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? false);
  const [formError, setFormError] = useState<string | null>(null);

  // Value may be a string, number, boolean, or a JSON object (13.2).
  const parseValue = (): SettingValue | undefined => {
    const raw = valueText.trim();
    if (raw === "") return undefined;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (
        typeof parsed === "string" ||
        typeof parsed === "number" ||
        typeof parsed === "boolean" ||
        (parsed !== null && typeof parsed === "object")
      ) {
        return parsed as SettingValue;
      }
      return raw;
    } catch {
      return raw;
    }
  };

  const submit = () => {
    void (async () => {
      setFormError(null);
      try {
        const parsed = parseValue();
        if (parsed === undefined) {
          setFormError("A value is required.");
          return;
        }
        const effectiveCategory = category || "general";
        const message = await onSubmit(key.trim(), {
          value: parsed,
          category: effectiveCategory,
          description: description.trim() || undefined,
          isPublic,
        });
        onDone(message);
      } catch (err) {
        setFormError(getApiErrorMessage(err, "Saving the setting failed."));
      }
    })();
  };

  const valid = key.trim() && valueText.trim();

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? `Edit setting: ${editing.key}` : "New setting"}
      description="Keys may contain letters, numbers, dots, dashes, and underscores."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={!valid}>
            Save setting
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <InputField
          label="Key"
          required
          hint="Used to update an existing setting with the same key (PUT)."
          value={key}
          disabled={Boolean(editing)}
          onChange={(e) => setKey(e.target.value)}
        />
        <TextareaField
          label="Value"
          required
          rows={4}
          hint="Text, number, boolean, or JSON object — valid JSON is parsed, anything else is stored as text."
          value={valueText}
          onChange={(e) => setValueText(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">No category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {category && !CATEGORIES.includes(category) && (
              <option value={category}>{category} (current)</option>
            )}
          </SelectField>
          <InputField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="accent-primary-700"
          />
          Public — exposed via GET /settings/public
        </label>
        {formError && (
          <Alert tone="error" title="Could not save setting">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
