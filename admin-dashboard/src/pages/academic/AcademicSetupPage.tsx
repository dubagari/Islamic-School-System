import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import {
  Fieldset,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  academicClassLabel,
  apiErrorInfo,
  levelLabel,
  refId,
  sectionLabel,
  teacherUserLabel,
  useCreateAcademicClassMutation,
  useCreateAcademicLevelMutation,
  useCreateAcademicSectionMutation,
  useCreateAcademicSemesterMutation,
  useCreateAcademicSessionMutation,
  useCreateSubjectMutation,
  useDeleteAcademicClassMutation,
  useDeleteAcademicLevelMutation,
  useDeleteAcademicSectionMutation,
  useDeleteAcademicSemesterMutation,
  useDeleteAcademicSessionMutation,
  useDeleteSubjectMutation,
  useListAcademicClassesQuery,
  useListAcademicLevelsQuery,
  useListAcademicSectionsQuery,
  useListAcademicSemestersQuery,
  useListAcademicSessionsQuery,
  useListSubjectsQuery,
  useListTeacherUsersQuery,
  useUpdateAcademicClassMutation,
  useUpdateAcademicLevelMutation,
  useUpdateAcademicSectionMutation,
  useUpdateAcademicSemesterMutation,
  useUpdateAcademicSessionMutation,
  useUpdateSubjectMutation,
  type AcademicClassRecord,
  type AcademicLevelRecord,
  type AcademicSectionRecord,
  type AcademicSemesterRecord,
  type AcademicSessionRecord,
  type SemesterName,
  type SubjectRecord,
} from "@/features/academic/api";

import { cn } from "@/lib/cn";

const PAGE_SIZE = 20;
const SEMESTER_NAMES: SemesterName[] = ["First Semester", "Second Semester"];

const TABS = [
  { key: "sections", label: "Sections" },
  { key: "levels", label: "Levels" },
  { key: "sessions", label: "Sessions" },
  { key: "semesters", label: "Semesters" },
  { key: "classes", label: "Classes" },
  { key: "subjects", label: "Subjects" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

type SortState = { key: string | null; dir: SortDir };

function useTableUi() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const onSortChange = useCallback((key: string | null) => {
    setSort((prev) =>
      prev.key === key
        ? key
          ? { key, dir: "desc" }
          : { key: null, dir: "asc" }
        : { key, dir: "asc" },
    );
  }, []);

  return { page, setPage, sort, onSortChange, search, searchInput, setSearchInput };
}

function ActiveCell({ active }: { active: boolean }) {
  return active ? (
    <Badge tone="success">Active</Badge>
  ) : (
    <Badge tone="neutral">Inactive</Badge>
  );
}

function CurrentCell({ current }: { current: boolean }) {
  return current ? (
    <Badge tone="gold">Current</Badge>
  ) : (
    <span className="text-ink-400">—</span>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="w-full lg:max-w-xs">
      <InputField
        label="Search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-ink-300 text-primary-700 focus:ring-primary-500"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-ink-500">{hint}</span>}
      </span>
    </label>
  );
}

type Feedback = {
  notice: string | null;
  setNotice: (message: string | null) => void;
  actionError: string | null;
  setActionError: (message: string | null) => void;
};

function useFeedback(): Feedback {
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  return { notice, setNotice, actionError, setActionError };
}

type TabAlertsProps = {
  label: string;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  feedback: Feedback;
};

function TabAlerts({ label, isError, error, onRetry, feedback }: TabAlertsProps) {
  return (
    <>
      {isError && (
        <Alert
          tone="error"
          title={`Could not load ${label}`}
          className="mb-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span>{(error as Error | undefined)?.message ?? "Request failed."}</span>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        </Alert>
      )}
      {feedback.notice && (
        <Alert
          tone="success"
          className="mb-4"
          onDismiss={() => feedback.setNotice(null)}
        >
          {feedback.notice}
        </Alert>
      )}
      {feedback.actionError && (
        <Alert
          tone="error"
          className="mb-4"
          onDismiss={() => feedback.setActionError(null)}
        >
          {feedback.actionError}
        </Alert>
      )}
    </>
  );
}

export function AcademicSetupPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const active: TabKey = TABS.some((t) => t.key === rawTab)
    ? (rawTab as TabKey)
    : "sections";

  const setTab = (key: TabKey) =>
    setSearchParams({ tab: key }, { replace: true });

  return (
    <div>
      <PageHeader
        title="Academic setup"
        arabic="الإعداد الأكاديمي"
        description="Manage sections, levels, sessions, semesters, classes and subjects that define the academic structure."
      />

      <div
        role="tablist"
        aria-label="Academic setup areas"
        className="mb-4 flex flex-wrap gap-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active}
            onClick={() => setTab(tab.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab.key === active
                ? "border-primary-700 bg-primary-700 text-white"
                : "border-ink-200 bg-white text-ink-700 hover:border-primary-300 hover:text-primary-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "sections" && <SectionsTab />}
      {active === "levels" && <LevelsTab />}
      {active === "sessions" && <SessionsTab />}
      {active === "semesters" && <SemestersTab />}
      {active === "classes" && <ClassesTab />}
      {active === "subjects" && <SubjectsTab />}
    </div>
  );
}


type SectionForm = {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
};

const EMPTY_SECTION: SectionForm = {
  name: "",
  code: "",
  description: "",
  isActive: true,
};

function SectionDialog({
  item,
  onClose,
  onSaved,
}: {
  item?: AcademicSectionRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [createSection, { isLoading: creating }] =
    useCreateAcademicSectionMutation();
  const [updateSection, { isLoading: updating }] =
    useUpdateAcademicSectionMutation();
  const busy = creating || updating;

  const [form, setForm] = useState<SectionForm>(
    item
      ? {
          name: item.name,
          code: item.code ?? "",
          description: item.description ?? "",
          isActive: item.isActive,
        }
      : EMPTY_SECTION,
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<SectionForm>) =>
    setForm((f) => ({ ...f, ...patch }));
  const valid = form.name.trim() && form.code.trim();

  const submit = () => {
    void (async () => {
      setFields({});
      setError(null);
      const body = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };
      try {
        if (item) {
          await updateSection({ id: item._id, ...body }).unwrap();
          onSaved("Section updated.");
        } else {
          await createSection(body).unwrap();
          onSaved("Section created.");
        }
      } catch (err) {
        const info = apiErrorInfo(err);
        setFields(info.fieldErrors);
        setError(info.message);
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? "Edit section" : "New section"}
      description="Sections group academic levels (e.g. Junior Secondary, Senior Secondary)."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={!valid}>
            {item ? "Save changes" : "Create section"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert tone="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <InputField
          label="Name"
          required
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Junior Secondary"
          error={fields.name}
        />
        <InputField
          label="Code"
          required
          className="font-mono uppercase"
          value={form.code}
          onChange={(e) => set({ code: e.target.value.toUpperCase() })}
          placeholder="e.g. JSS"
          error={fields.code}
          hint="Short uppercase identifier used in course codes."
        />
        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional description…"
        />
        <Fieldset legend="Status">
          <CheckboxField
            label="Active"
            checked={form.isActive}
            onChange={(checked) => set({ isActive: checked })}
            hint="Inactive sections are hidden from new admissions."
          />
        </Fieldset>
      </div>
    </Dialog>
  );
}

function SectionsTab() {
  const ui = useTableUi();
  const feedback = useFeedback();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicSectionRecord | null>(null);
  const [deleting, setDeleting] = useState<AcademicSectionRecord | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useListAcademicSectionsQuery({
    page: ui.page,
    limit: PAGE_SIZE,
    search: ui.search || undefined,
  });

  const [deleteSection, { isLoading: removing }] =
    useDeleteAcademicSectionMutation();

  const confirmDelete = () => {
    if (!deleting) return;
    void (async () => {
      try {
        await deleteSection(deleting._id).unwrap();
        feedback.setNotice(
          `Section "${deleting.name}" deleted.`,
        );
        setDeleting(null);
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
        setDeleting(null);
      }
    })();
  };

  const columns: Column<AcademicSectionRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortValue: (r) => r.name,
        render: (r) => <span className="font-medium text-ink-900">{r.name}</span>,
      },
      {
        key: "code",
        header: "Code",
        sortValue: (r) => r.code,
        render: (r) => (
          <span className="font-mono text-xs text-ink-700">{r.code}</span>
        ),
      },
      {
        key: "description",
        header: "Description",
        render: (r) => (
          <span className="block max-w-xs truncate text-ink-600">
            {r.description || "—"}
          </span>
        ),
      },
      {
        key: "isActive",
        header: "Status",
        align: "center",
        render: (r) => <ActiveCell active={r.isActive} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (r) => (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const filterActive = Boolean(ui.search);

  return (
    <div>
      <TabAlerts
        label="sections"
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        feedback={feedback}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <SearchBox
            value={ui.searchInput}
            onChange={ui.setSearchInput}
            placeholder="Search by name or code…"
          />
            <Button
              className="lg:mb-1"
              icon={<Plus className="size-4" aria-hidden />}
              onClick={() => setCreateOpen(true)}
            >
              New section
            </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle={isError ? "Could not load sections" : "No sections found"}
          emptyDescription={
            isError
              ? "Check the error above and try again."
              : filterActive
                ? "No sections match your search."
                : "Create the first section to start building the structure."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(r) => r._id}
          sort={ui.sort}
          onSortChange={ui.onSortChange}
        />

        <PagedFooter pagination={data?.pagination} onPageChange={ui.setPage} />
      </Card>

      {createOpen && (
        <SectionDialog
          onClose={() => setCreateOpen(false)}
          onSaved={(message) => {
            setCreateOpen(false);
            feedback.setNotice(message);
          }}
        />
      )}
      {editing && (
        <SectionDialog
          key={editing._id}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            feedback.setNotice(message);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete section "${deleting?.name ?? ""}"?`}
        description="This permanently removes the section."
        tone="danger"
        confirmLabel="Delete"
        loading={removing}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}


type LevelForm = {
  name: string;
  levelNumber: number | "";
  section: string;
  description: string;
  isActive: boolean;
};

function LevelsTab() {
  const ui = useTableUi();
  const feedback = useFeedback();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicLevelRecord | null>(null);
  const [deleting, setDeleting] = useState<AcademicLevelRecord | null>(null);
  const [sectionFilter, setSectionFilter] = useState("");

  const { data: sectionsData } = useListAcademicSectionsQuery({ limit: 200 });
  const sections = sectionsData?.data ?? [];

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useListAcademicLevelsQuery({
    page: ui.page,
    limit: PAGE_SIZE,
    search: ui.search || undefined,
    section: sectionFilter || undefined,
  });

  const [updateLevel] = useUpdateAcademicLevelMutation();
  const [deleteLevel, { isLoading: removing }] = useDeleteAcademicLevelMutation();

  const confirmDelete = () => {
    if (!deleting) return;
    void (async () => {
      try {
        await deleteLevel(deleting._id).unwrap();
        feedback.setNotice(`Level "${deleting.name}" deleted.`);
        setDeleting(null);
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
        setDeleting(null);
      }
    })();
  };

  const toggleActive = (level: AcademicLevelRecord) => {
    void (async () => {
      try {
        await updateLevel({
          id: level._id,
          isActive: !level.isActive,
        }).unwrap();
        feedback.setNotice(
          `Level "${level.name}" ${level.isActive ? "deactivated" : "activated"}.`,
        );
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
      }
    })();
  };

  const columns: Column<AcademicLevelRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortValue: (r) => r.name,
        render: (r) => <span className="font-medium text-ink-900">{r.name}</span>,
      },
      {
        key: "levelNumber",
        header: "Level #",
        align: "center",
        sortValue: (r) => r.levelNumber,
        render: (r) => (
          <span className="font-mono text-xs text-ink-700">{r.levelNumber}</span>
        ),
      },
      {
        key: "section",
        header: "Section",
        sortValue: (r) => sectionLabel(r.section),
        render: (r) => sectionLabel(r.section),
      },
      {
        key: "isActive",
        header: "Status",
        align: "center",
        render: (r) => <ActiveCell active={r.isActive} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (r) => (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
              {r.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <TabAlerts
        label="levels"
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        feedback={feedback}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
            <SearchBox
              value={ui.searchInput}
              onChange={ui.setSearchInput}
              placeholder="Search levels…"
            />
            <div className="w-full sm:w-44">
              <SelectField
                label="Section"
                value={sectionFilter}
                onChange={(e) => {
                  setSectionFilter(e.target.value);
                  ui.setPage(1);
                }}
              >
                <option value="">All sections</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          <Button className="lg:mb-1" onClick={() => setCreateOpen(true)}>
            New level
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle={isError ? "Could not load levels" : "No levels found"}
          emptyDescription={
            isError
              ? "Check the error above and try again."
              : "Levels are created per section (level numbers are unique within a section)."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(r) => r._id}
          sort={ui.sort}
          onSortChange={ui.onSortChange}
        />

        <PagedFooter pagination={data?.pagination} onPageChange={ui.setPage} />
      </Card>

      {createOpen && (
        <LevelDialog
          sections={sections}
          onClose={() => setCreateOpen(false)}
          onSaved={(message) => {
            setCreateOpen(false);
            feedback.setNotice(message);
          }}
        />
      )}
      {editing && (
        <LevelDialog
          key={editing._id}
          item={editing}
          sections={sections}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            feedback.setNotice(message);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete level "${deleting?.name ?? ""}"?`}
        description="This permanently removes the level."
        tone="danger"
        confirmLabel="Delete"
        loading={removing}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function LevelDialog({
  item,
  sections,
  onClose,
  onSaved,
}: {
  item?: AcademicLevelRecord;
  sections: AcademicSectionRecord[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [createLevel, { isLoading: creating }] = useCreateAcademicLevelMutation();
  const [updateLevel, { isLoading: updating }] = useUpdateAcademicLevelMutation();
  const busy = creating || updating;

  const [form, setForm] = useState<LevelForm>(
    item
      ? {
          name: item.name,
          levelNumber: item.levelNumber,
          section: refId(item.section),
          description: item.description ?? "",
          isActive: item.isActive,
        }
      : { name: "", levelNumber: "", section: "", description: "", isActive: true },
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<LevelForm>) => setForm((f) => ({ ...f, ...patch }));
  const valid = form.name.trim() && form.levelNumber !== "" && form.section;

  const submit = () => {
    void (async () => {
      setFields({});
      setError(null);
      const body = {
        name: form.name.trim(),
        levelNumber: Number(form.levelNumber),
        section: form.section,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };
      try {
        if (item) {
          await updateLevel({ id: item._id, ...body }).unwrap();
          onSaved("Level updated.");
        } else {
          await createLevel(body).unwrap();
          onSaved("Level created.");
        }
      } catch (err) {
        const info = apiErrorInfo(err);
        setFields(info.fieldErrors);
        setError(info.message);
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? "Edit level" : "New level"}
      description="Levels belong to a section; level numbers are unique within each section."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={!valid}>
            {item ? "Save changes" : "Create level"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert tone="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <SelectField
          label="Section"
          required
          value={form.section}
          onChange={(e) => set({ section: e.target.value })}
          error={fields.section}
        >
          <option value="">Select section…</option>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Name"
            required
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Primary 5"
            error={fields.name}
          />
          <InputField
            label="Level number"
            required
            type="number"
            min={0}
            value={form.levelNumber}
            onChange={(e) =>
              set({ levelNumber: e.target.value === "" ? "" : Number(e.target.value) })
            }
            placeholder="e.g. 5"
            error={fields.levelNumber}
          />
        </div>
        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional description…"
        />
        <Fieldset legend="Status">
          <CheckboxField
            label="Active"
            checked={form.isActive}
            onChange={(checked) => set({ isActive: checked })}
          />
        </Fieldset>
      </div>
    </Dialog>
  );
}


type SessionForm = {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
};

function SessionsTab() {
  const ui = useTableUi();
  const feedback = useFeedback();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicSessionRecord | null>(null);
  const [deleting, setDeleting] = useState<AcademicSessionRecord | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useListAcademicSessionsQuery({
    page: ui.page,
    limit: PAGE_SIZE,
    search: ui.search || undefined,
  });

  const [updateSession] = useUpdateAcademicSessionMutation();
  const [deleteSession, { isLoading: removing }] =
    useDeleteAcademicSessionMutation();

  const confirmDelete = () => {
    if (!deleting) return;
    void (async () => {
      try {
        await deleteSession(deleting._id).unwrap();
        feedback.setNotice(`Session "${deleting.name}" deleted.`);
        setDeleting(null);
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
        setDeleting(null);
      }
    })();
  };

  const setCurrent = (session: AcademicSessionRecord) => {
    void (async () => {
      try {
        await updateSession({ id: session._id, isCurrent: true }).unwrap();
        feedback.setNotice(
          `"${session.name}" is now the current session.`,
        );
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
      }
    })();
  };

  const toggleActive = (session: AcademicSessionRecord) => {
    void (async () => {
      try {
        await updateSession({
          id: session._id,
          isActive: !session.isActive,
        }).unwrap();
        feedback.setNotice(
          `Session "${session.name}" ${session.isActive ? "deactivated" : "activated"}.`,
        );
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
      }
    })();
  };

  const columns: Column<AcademicSessionRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Session",
        sortValue: (r) => r.name,
        render: (r) => <span className="font-medium text-ink-900">{r.name}</span>,
      },
      {
        key: "startDate",
        header: "Start",
        sortValue: (r) => r.startDate,
        render: (r) => fmtDate(r.startDate),
      },
      {
        key: "endDate",
        header: "End",
        sortValue: (r) => r.endDate,
        render: (r) => fmtDate(r.endDate),
      },
      {
        key: "isCurrent",
        header: "Current",
        align: "center",
        render: (r) => <CurrentCell current={r.isCurrent} />,
      },
      {
        key: "isActive",
        header: "Status",
        align: "center",
        render: (r) => <ActiveCell active={r.isActive} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (r) => (
          <div className="flex justify-end gap-1.5">
            {!r.isCurrent && (
              <Button size="sm" variant="ghost" onClick={() => setCurrent(r)}>
                Set current
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
              {r.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <TabAlerts
        label="sessions"
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        feedback={feedback}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <SearchBox
            value={ui.searchInput}
            onChange={ui.setSearchInput}
            placeholder="Search sessions…"
          />
          <Button className="lg:mb-1" onClick={() => setCreateOpen(true)}>
            New session
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle={isError ? "Could not load sessions" : "No sessions found"}
          emptyDescription={
            isError
              ? "Check the error above and try again."
              : "Only one session should be current — it is used for new admissions and reporting."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(r) => r._id}
          sort={ui.sort}
          onSortChange={ui.onSortChange}
        />

        <PagedFooter pagination={data?.pagination} onPageChange={ui.setPage} />
      </Card>

      {createOpen && (
        <SessionDialog
          onClose={() => setCreateOpen(false)}
          onSaved={(message) => {
            setCreateOpen(false);
            feedback.setNotice(message);
          }}
        />
      )}
      {editing && (
        <SessionDialog
          key={editing._id}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            feedback.setNotice(message);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete session "${deleting?.name ?? ""}"?`}
        description="This permanently removes the session."
        tone="danger"
        confirmLabel="Delete"
        loading={removing}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function SessionDialog({
  item,
  onClose,
  onSaved,
}: {
  item?: AcademicSessionRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [createSession, { isLoading: creating }] =
    useCreateAcademicSessionMutation();
  const [updateSession, { isLoading: updating }] =
    useUpdateAcademicSessionMutation();
  const busy = creating || updating;

  const [form, setForm] = useState<SessionForm>(
    item
      ? {
          name: item.name,
          startDate: item.startDate?.slice(0, 10) ?? "",
          endDate: item.endDate?.slice(0, 10) ?? "",
          isCurrent: item.isCurrent,
          isActive: item.isActive,
        }
      : { name: "", startDate: "", endDate: "", isCurrent: false, isActive: true },
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<SessionForm>) => setForm((f) => ({ ...f, ...patch }));
  const valid =
    form.name.trim() && form.startDate && form.endDate && form.endDate >= form.startDate;

  const submit = () => {
    void (async () => {
      setFields({});
      setError(null);
      const body = {
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        isCurrent: form.isCurrent,
        isActive: form.isActive,
      };
      try {
        if (item) {
          await updateSession({ id: item._id, ...body }).unwrap();
          onSaved("Session updated.");
        } else {
          await createSession(body).unwrap();
          onSaved("Session created.");
        }
      } catch (err) {
        const info = apiErrorInfo(err);
        setFields(info.fieldErrors);
        setError(info.message);
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? "Edit session" : "New session"}
      description="Academic sessions span a full school year (e.g. 2026/2027)."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={!valid}>
            {item ? "Save changes" : "Create session"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert tone="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <InputField
          label="Name"
          required
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. 2026/2027"
          error={fields.name}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Start date"
            required
            type="date"
            value={form.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            error={fields.startDate}
          />
          <InputField
            label="End date"
            required
            type="date"
            value={form.endDate}
            onChange={(e) => set({ endDate: e.target.value })}
            error={fields.endDate}
          />
        </div>
        <Fieldset legend="Status">
          <div className="space-y-2">
            <CheckboxField
              label="Current session"
              checked={form.isCurrent}
              onChange={(checked) => set({ isCurrent: checked })}
              hint="Used for new admissions and default reporting. Only one session should be current."
            />
            <CheckboxField
              label="Active"
              checked={form.isActive}
              onChange={(checked) => set({ isActive: checked })}
            />
          </div>
        </Fieldset>
      </div>
    </Dialog>
  );
}


type SemesterForm = {
  name: SemesterName;
  academicSession: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
};

function SemestersTab() {
  const ui = useTableUi();
  const feedback = useFeedback();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicSemesterRecord | null>(null);
  const [deleting, setDeleting] = useState<AcademicSemesterRecord | null>(null);
  const [sessionFilter, setSessionFilter] = useState("");

  const { data: sessionsData } = useListAcademicSessionsQuery({ limit: 200 });
  const sessions = sessionsData?.data ?? [];

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useListAcademicSemestersQuery({
    page: ui.page,
    limit: PAGE_SIZE,
    search: ui.search || undefined,
    academicSession: sessionFilter || undefined,
  });

  const [updateSemester] = useUpdateAcademicSemesterMutation();
  const [deleteSemester, { isLoading: removing }] =
    useDeleteAcademicSemesterMutation();

  const confirmDelete = () => {
    if (!deleting) return;
    void (async () => {
      try {
        await deleteSemester(deleting._id).unwrap();
        feedback.setNotice(`Semester "${deleting.name}" deleted.`);
        setDeleting(null);
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
        setDeleting(null);
      }
    })();
  };

  const toggleActive = (semester: AcademicSemesterRecord) => {
    void (async () => {
      try {
        await updateSemester({
          id: semester._id,
          isActive: !semester.isActive,
        }).unwrap();
        feedback.setNotice(
          `Semester "${semester.name}" ${semester.isActive ? "deactivated" : "activated"}.`,
        );
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
      }
    })();
  };

  const columns: Column<AcademicSemesterRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Semester",
        sortValue: (r) => r.name,
        render: (r) => (
          <Badge tone={r.name === "First Semester" ? "info" : "neutral"}>
            {r.name}
          </Badge>
        ),
      },
      {
        key: "session",
        header: "Session",
        sortValue: (r) =>
          typeof r.academicSession === "object" && r.academicSession !== null
            ? r.academicSession.name
            : "",
        render: (r) => sessionName(r.academicSession),
      },
      {
        key: "startDate",
        header: "Start",
        sortValue: (r) => r.startDate,
        render: (r) => fmtDate(r.startDate),
      },
      {
        key: "endDate",
        header: "End",
        sortValue: (r) => r.endDate,
        render: (r) => fmtDate(r.endDate),
      },
      {
        key: "isCurrent",
        header: "Current",
        align: "center",
        render: (r) => <CurrentCell current={r.isCurrent} />,
      },
      {
        key: "isActive",
        header: "Status",
        align: "center",
        render: (r) => <ActiveCell active={r.isActive} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (r) => (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
              {r.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <TabAlerts
        label="semesters"
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        feedback={feedback}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
            <SearchBox
              value={ui.searchInput}
              onChange={ui.setSearchInput}
              placeholder="Search semesters…"
            />
            <div className="w-full sm:w-44">
              <SelectField
                label="Session"
                value={sessionFilter}
                onChange={(e) => {
                  setSessionFilter(e.target.value);
                  ui.setPage(1);
                }}
              >
                <option value="">All sessions</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                    {s.isCurrent ? " (current)" : ""}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          <Button className="lg:mb-1" onClick={() => setCreateOpen(true)}>
            New semester
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle={isError ? "Could not load semesters" : "No semesters found"}
          emptyDescription={
            isError
              ? "Check the error above and try again."
              : "Semesters belong to a session (First or Second Semester)."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(r) => r._id}
          sort={ui.sort}
          onSortChange={ui.onSortChange}
        />

        <PagedFooter pagination={data?.pagination} onPageChange={ui.setPage} />
      </Card>

      {createOpen && (
        <SemesterDialog
          sessions={sessions}
          onClose={() => setCreateOpen(false)}
          onSaved={(message) => {
            setCreateOpen(false);
            feedback.setNotice(message);
          }}
        />
      )}
      {editing && (
        <SemesterDialog
          key={editing._id}
          item={editing}
          sessions={sessions}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            feedback.setNotice(message);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete semester "${deleting?.name ?? ""}"?`}
        description="This permanently removes the semester."
        tone="danger"
        confirmLabel="Delete"
        loading={removing}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function sessionName(
  value: AcademicSessionRecord | string | null | undefined,
): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.name;
}

function SemesterDialog({
  item,
  sessions,
  onClose,
  onSaved,
}: {
  item?: AcademicSemesterRecord;
  sessions: AcademicSessionRecord[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [createSemester, { isLoading: creating }] =
    useCreateAcademicSemesterMutation();
  const [updateSemester, { isLoading: updating }] =
    useUpdateAcademicSemesterMutation();
  const busy = creating || updating;

  const [form, setForm] = useState<SemesterForm>(
    item
      ? {
          name: item.name,
          academicSession: refId(item.academicSession),
          startDate: item.startDate?.slice(0, 10) ?? "",
          endDate: item.endDate?.slice(0, 10) ?? "",
          isCurrent: item.isCurrent,
          isActive: item.isActive,
        }
      : {
          name: "First Semester",
          academicSession: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          isActive: true,
        },
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<SemesterForm>) =>
    setForm((f) => ({ ...f, ...patch }));
  const valid =
    form.name && form.academicSession && form.startDate && form.endDate && form.endDate >= form.startDate;

  const submit = () => {
    void (async () => {
      setFields({});
      setError(null);
      const body = {
        name: form.name,
        academicSession: form.academicSession,
        startDate: form.startDate,
        endDate: form.endDate,
        isCurrent: form.isCurrent,
        isActive: form.isActive,
      };
      try {
        if (item) {
          await updateSemester({ id: item._id, ...body }).unwrap();
          onSaved("Semester updated.");
        } else {
          await createSemester(body).unwrap();
          onSaved("Semester created.");
        }
      } catch (err) {
        const info = apiErrorInfo(err);
        setFields(info.fieldErrors);
        setError(info.message);
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? "Edit semester" : "New semester"}
      description="Each session has a First and Second Semester."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={!valid}>
            {item ? "Save changes" : "Create semester"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert tone="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Session"
            required
            value={form.academicSession}
            onChange={(e) => set({ academicSession: e.target.value })}
            error={fields.academicSession}
          >
            <option value="">Select session…</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Semester"
            required
            value={form.name}
            onChange={(e) => set({ name: e.target.value as SemesterName })}
            error={fields.name}
          >
            {SEMESTER_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Start date"
            required
            type="date"
            value={form.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            error={fields.startDate}
          />
          <InputField
            label="End date"
            required
            type="date"
            value={form.endDate}
            onChange={(e) => set({ endDate: e.target.value })}
            error={fields.endDate}
          />
        </div>
        <Fieldset legend="Status">
          <div className="space-y-2">
            <CheckboxField
              label="Current semester"
              checked={form.isCurrent}
              onChange={(checked) => set({ isCurrent: checked })}
            />
            <CheckboxField
              label="Active"
              checked={form.isActive}
              onChange={(checked) => set({ isActive: checked })}
            />
          </div>
        </Fieldset>
      </div>
    </Dialog>
  );
}


type ClassForm = {
  name: string;
  academicLevel: string;
  capacity: number | "";
  classTeacher: string;
  description: string;
  isActive: boolean;
};

function ClassesTab() {
  const ui = useTableUi();
  const feedback = useFeedback();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicClassRecord | null>(null);
  const [deleting, setDeleting] = useState<AcademicClassRecord | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useListAcademicClassesQuery({
    page: ui.page,
    limit: PAGE_SIZE,
    search: ui.search || undefined,
  });

  const [deleteClass, { isLoading: removing }] = useDeleteAcademicClassMutation();

  const confirmDelete = () => {
    if (!deleting) return;
    void (async () => {
      try {
        await deleteClass(deleting._id).unwrap();
        feedback.setNotice(
          `Class "${academicClassLabel(deleting)}" deleted.`,
        );
        setDeleting(null);
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
        setDeleting(null);
      }
    })();
  };

  const columns: Column<AcademicClassRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Class",
        sortValue: (r) => academicClassLabel(r),
        render: (r) => (
          <span className="font-medium text-ink-900">{academicClassLabel(r)}</span>
        ),
      },
      {
        key: "level",
        header: "Level",
        sortValue: (r) => levelLabel(r.academicLevel),
        render: (r) => levelLabel(r.academicLevel),
      },
      {
        key: "capacity",
        header: "Capacity",
        align: "center",
        sortValue: (r) => r.capacity ?? 0,
        render: (r) => (
          <span className="font-mono text-xs text-ink-700">{r.capacity ?? "—"}</span>
        ),
      },
      {
        key: "classTeacher",
        header: "Class teacher",
        sortValue: (r) => teacherUserLabel(r.classTeacher),
        render: (r) => teacherUserLabel(r.classTeacher),
      },
      {
        key: "isActive",
        header: "Status",
        align: "center",
        render: (r) => <ActiveCell active={r.isActive} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (r) => (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <TabAlerts
        label="classes"
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        feedback={feedback}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <SearchBox
            value={ui.searchInput}
            onChange={ui.setSearchInput}
            placeholder="Search classes…"
          />
          <Button className="lg:mb-1" onClick={() => setCreateOpen(true)}>
            New class
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle={isError ? "Could not load classes" : "No classes found"}
          emptyDescription={
            isError
              ? "Check the error above and try again."
              : "Classes are arms within an academic level (e.g. JSS 1A)."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(r) => r._id}
          sort={ui.sort}
          onSortChange={ui.onSortChange}
        />

        <PagedFooter pagination={data?.pagination} onPageChange={ui.setPage} />
      </Card>

      {createOpen && (
        <ClassDialog
          onClose={() => setCreateOpen(false)}
          onSaved={(message) => {
            setCreateOpen(false);
            feedback.setNotice(message);
          }}
        />
      )}
      {editing && (
        <ClassDialog
          key={editing._id}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            feedback.setNotice(message);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete class "${deleting ? academicClassLabel(deleting) : ""}"?`}
        description="This permanently removes the class."
        tone="danger"
        confirmLabel="Delete"
        loading={removing}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function ClassDialog({
  item,
  onClose,
  onSaved,
}: {
  item?: AcademicClassRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [createAcademicClass, { isLoading: creating }] =
    useCreateAcademicClassMutation();
  const [updateAcademicClass, { isLoading: updating }] =
    useUpdateAcademicClassMutation();
  const busy = creating || updating;

  const { data: levelsData } = useListAcademicLevelsQuery({ limit: 200 });
  const { data: teachersData } = useListTeacherUsersQuery();
  const levels = levelsData?.data ?? [];
  const teachers = (teachersData?.data ?? []).filter((t) => t.isActive);

  const [form, setForm] = useState<ClassForm>(
    item
      ? {
          name: item.name,
          academicLevel: refId(item.academicLevel),
          capacity: item.capacity ?? "",
          classTeacher: refId(item.classTeacher),
          description: item.description ?? "",
          isActive: item.isActive,
        }
      : {
          name: "",
          academicLevel: "",
          capacity: "",
          classTeacher: "",
          description: "",
          isActive: true,
        },
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<ClassForm>) => setForm((f) => ({ ...f, ...patch }));
  const valid = form.name.trim() && form.academicLevel && form.capacity !== "" && Number(form.capacity) > 0;

  const submit = () => {
    void (async () => {
      setFields({});
      setError(null);
      const body = {
        name: form.name.trim(),
        academicLevel: form.academicLevel,
        capacity: Number(form.capacity),
        classTeacher: form.classTeacher || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };
      try {
        if (item) {
          await updateAcademicClass({ id: item._id, ...body }).unwrap();
          onSaved("Class updated.");
        } else {
          await createAcademicClass(body).unwrap();
          onSaved("Class created.");
        }
      } catch (err) {
        const info = apiErrorInfo(err);
        setFields(info.fieldErrors);
        setError(info.message);
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? "Edit class" : "New class"}
      description="Classes are arms within a level (e.g. JSS 1A)."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={!valid}>
            {item ? "Save changes" : "Create class"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert tone="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Name"
            required
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. JSS 1A"
            error={fields.name}
          />
          <InputField
            label="Capacity"
            required
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) =>
              set({ capacity: e.target.value === "" ? "" : Number(e.target.value) })
            }
            placeholder="e.g. 40"
            error={fields.capacity}
          />
        </div>
        <SelectField
          label="Academic level"
          required
          value={form.academicLevel}
          onChange={(e) => set({ academicLevel: e.target.value })}
          error={fields.academicLevel}
        >
          <option value="">Select level…</option>
          {levels.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
              {l.section && typeof l.section === "object"
                ? ` (${l.section.name})`
                : ""}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Class teacher"
          value={form.classTeacher}
          onChange={(e) => set({ classTeacher: e.target.value })}
          error={fields.classTeacher}
          hint="Optional. Only active teacher users are listed."
        >
          <option value="">No class teacher</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>
              {t.fullName} (@{t.username})
            </option>
          ))}
        </SelectField>
        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional description…"
        />
        <Fieldset legend="Status">
          <CheckboxField
            label="Active"
            checked={form.isActive}
            onChange={(checked) => set({ isActive: checked })}
          />
        </Fieldset>
      </div>
    </Dialog>
  );
}


type SubjectForm = {
  name: string;
  prefix: string;
  section: string;
  description: string;
  isActive: boolean;
};

function SubjectsTab() {
  const ui = useTableUi();
  const feedback = useFeedback();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectRecord | null>(null);
  const [deleting, setDeleting] = useState<SubjectRecord | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useListSubjectsQuery({
    page: ui.page,
    limit: PAGE_SIZE,
    search: ui.search || undefined,
  });

  const [updateSubject] = useUpdateSubjectMutation();
  const [deleteSubject, { isLoading: removing }] = useDeleteSubjectMutation();

  const confirmDelete = () => {
    if (!deleting) return;
    void (async () => {
      try {
        await deleteSubject(deleting._id).unwrap();
        feedback.setNotice(`Subject "${deleting.name}" deleted.`);
        setDeleting(null);
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
        setDeleting(null);
      }
    })();
  };

  const toggleActive = (subject: SubjectRecord) => {
    void (async () => {
      try {
        await updateSubject({
          id: subject._id,
          isActive: !subject.isActive,
        }).unwrap();
        feedback.setNotice(
          `Subject "${subject.name}" ${subject.isActive ? "deactivated" : "activated"}.`,
        );
      } catch (err) {
        feedback.setActionError(apiErrorInfo(err).message);
      }
    })();
  };

  const columns: Column<SubjectRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortValue: (r) => r.name,
        render: (r) => <span className="font-medium text-ink-900">{r.name}</span>,
      },
      {
        key: "prefix",
        header: "Prefix",
        sortValue: (r) => r.prefix,
        render: (r) => (
          <span className="font-mono text-xs text-ink-700">{r.prefix}</span>
        ),
      },
      {
        key: "section",
        header: "Section",
        sortValue: (r) => sectionLabel(r.section),
        render: (r) => sectionLabel(r.section),
      },
      {
        key: "isActive",
        header: "Status",
        align: "center",
        render: (r) => <ActiveCell active={r.isActive} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (r) => (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
              {r.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <TabAlerts
        label="subjects"
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        feedback={feedback}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <SearchBox
            value={ui.searchInput}
            onChange={ui.setSearchInput}
            placeholder="Search by subject name or prefix…"
          />
          <Button className="lg:mb-1" onClick={() => setCreateOpen(true)}>
            New subject
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle={isError ? "Could not load subjects" : "No subjects found"}
          emptyDescription={
            isError
              ? "Check the error above and try again."
              : "Subjects belong to a section and use short prefixes for course codes."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(r) => r._id}
          sort={ui.sort}
          onSortChange={ui.onSortChange}
        />

        <PagedFooter pagination={data?.pagination} onPageChange={ui.setPage} />
      </Card>

      {createOpen && (
        <SubjectDialog
          onClose={() => setCreateOpen(false)}
          onSaved={(message) => {
            setCreateOpen(false);
            feedback.setNotice(message);
          }}
        />
      )}
      {editing && (
        <SubjectDialog
          key={editing._id}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            feedback.setNotice(message);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete subject "${deleting?.name ?? ""}"?`}
        description="This permanently removes the subject."
        tone="danger"
        confirmLabel="Delete"
        loading={removing}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function SubjectDialog({
  item,
  onClose,
  onSaved,
}: {
  item?: SubjectRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [createSubject, { isLoading: creating }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: updating }] = useUpdateSubjectMutation();
  const busy = creating || updating;

  const { data: sectionsData } = useListAcademicSectionsQuery({ limit: 200 });
  const sections = sectionsData?.data ?? [];

  const [form, setForm] = useState<SubjectForm>(
    item
      ? {
          name: item.name,
          prefix: item.prefix ?? "",
          section: refId(item.section),
          description: item.description ?? "",
          isActive: item.isActive,
        }
      : { name: "", prefix: "", section: "", description: "", isActive: true },
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<SubjectForm>) => setForm((f) => ({ ...f, ...patch }));
  const valid = form.name.trim() && form.prefix.trim() && form.section;

  const submit = () => {
    void (async () => {
      setFields({});
      setError(null);
      const body = {
        name: form.name.trim(),
        prefix: form.prefix.trim().toUpperCase(),
        section: form.section,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };
      try {
        if (item) {
          await updateSubject({ id: item._id, ...body }).unwrap();
          onSaved("Subject updated.");
        } else {
          await createSubject(body).unwrap();
          onSaved("Subject created.");
        }
      } catch (err) {
        const info = apiErrorInfo(err);
        setFields(info.fieldErrors);
        setError(info.message);
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? "Edit subject" : "New subject"}
      description="Subject prefixes feed into class-subject course codes."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={!valid}>
            {item ? "Save changes" : "Create subject"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert tone="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Name"
            required
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Arabic Language"
            error={fields.name}
          />
          <InputField
            label="Prefix"
            required
            className="font-mono uppercase"
            value={form.prefix}
            onChange={(e) => set({ prefix: e.target.value.toUpperCase() })}
            placeholder="e.g. ARL"
            error={fields.prefix}
          />
        </div>
        <SelectField
          label="Section"
          required
          value={form.section}
          onChange={(e) => set({ section: e.target.value })}
          error={fields.section}
        >
          <option value="">Select section…</option>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional description…"
        />
        <Fieldset legend="Status">
          <CheckboxField
            label="Active"
            checked={form.isActive}
            onChange={(checked) => set({ isActive: checked })}
          />
        </Fieldset>
      </div>
    </Dialog>
  );
}

