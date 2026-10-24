import { useState } from "react";
import { CircleCheck, Copy, UserPlus } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  useGetAdmissionsQuery,
  useRegisterStudentMutation,
  toFieldErrors,
  type AdmissionApplication,
  type StudentRegistrationResult,
} from "@/features/admissions/api";

const PAGE_LIMIT = 20;

type Feedback = { tone: "success" | "error"; message: string } | null;

export function AdmissionRegistrationPage() {
  const [page, setPage] = useState(1);

  const [pendingRegistration, setPendingRegistration] =
    useState<AdmissionApplication | null>(null);
  const [registration, setRegistration] =
    useState<StudentRegistrationResult | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Server-side query params: only Approved + Paid are supported as filters
  // (see API_REFERENCE 5.1). Applications that already hold a
  // registrationNumber are filtered out client-side, since the list endpoint
  // is not documented to support a registrationNumber filter.
  const { data, isLoading, isError, refetch } = useGetAdmissionsQuery({
    page,
    limit: PAGE_LIMIT,
    status: "Approved",
    paymentStatus: "Paid",
  });

  const [registerStudent, registerResult] = useRegisterStudentMutation();

  const applications = data?.data?.filter(
    (item) => !item.registrationNumber,
  );

  const columns: Column<AdmissionApplication>[] = [
    {
      key: "applicationNumber",
      header: "Application #",
      render: (item) => (
        <span className="font-mono text-[13px] text-ink-800">
          {item.applicationNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "name",
      header: "Applicant",
      render: (item) => (
        <span className="font-medium text-ink-900">
          {[item.firstName, item.middleName, item.lastName]
            .filter(Boolean)
            .join(" ")}
        </span>
      ),
    },
    { key: "currentLevel", header: "Level", render: (item) => item.currentLevel },
    {
      key: "level",
      header: "Justification",
      render: (item) => (
        <span className="text-xs text-ink-500">
          Approved · Paid
          {item.paymentAmount ? ` · ₦${item.paymentAmount.toLocaleString()}` : ""}
          {item.paymentReference ? ` · ${item.paymentReference}` : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (item) => (
        <Button
          size="sm"
          variant="primary"
          icon={<UserPlus className="size-3.5" aria-hidden />}
          onClick={() => {
            setFeedback(null);
            setPendingRegistration(item);
          }}
        >
          Register
        </Button>
      ),
    },
  ];

  const handleRegister = async () => {
    if (!pendingRegistration) return;
    try {
      const result = await registerStudent(pendingRegistration._id).unwrap();
      setRegistration(result.data);
      setFeedback({ tone: "success", message: result.message });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: toFieldErrors(error).message,
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Student registration"
        description="Register approved, paid applicants as students and issue their registration numbers."
      />

      {feedback && (
        <Alert
          tone={feedback.tone}
          onDismiss={() => setFeedback(null)}
          className="mb-4"
        >
          {feedback.message}
        </Alert>
      )}

      {registration && (
        <RegistrationResultCard
          registration={registration}
          onClose={() => setRegistration(null)}
        />
      )}

      {isError && (
        <Alert tone="error" title="Failed to load registrations" className="mb-4">
          Something went wrong while fetching approved, paid applications.
          <Button size="sm" variant="outline" className="ms-2" onClick={() => refetch()}>
            Retry
          </Button>
        </Alert>
      )}

      {isLoading && !data ? (
        <Card padded={false}>
          <PageLoader />
        </Card>
      ) : (
        <Card padded={false}>
          <DataTable
            columns={columns}
            data={applications}
            isLoading={false}
            rowKey={(item) => item._id}
            emptyTitle="No applications to register"
            emptyDescription="Approved applications with confirmed payment and no registration number will appear here."
            emptyAction={
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            }
            mobileCard={(item) => (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ink-500">
                    {item.applicationNumber ?? "—"}
                  </span>
                </div>
                <p className="font-medium text-ink-900">
                  {[item.firstName, item.middleName, item.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                <p className="text-xs text-ink-500">
                  {item.currentLevel} · Paid ·{" "}
                  {item.paymentAmount
                    ? `₦${item.paymentAmount.toLocaleString()}`
                    : "—"}
                </p>
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    icon={<UserPlus className="size-3.5" aria-hidden />}
                    onClick={() => {
                      setFeedback(null);
                      setPendingRegistration(item);
                    }}
                  >
                    Register
                  </Button>
                </div>
              </div>
            )}
          />
          <PagedFooter pagination={data?.pagination} onPageChange={setPage} />
        </Card>
      )}

      <ConfirmDialog
        open={pendingRegistration !== null}
        onClose={() => setPendingRegistration(null)}
        onConfirm={handleRegister}
        title="Complete registration"
        confirmLabel="Register student"
        loading={registerResult.isLoading}
        description={
          pendingRegistration
            ? `Register ${
                pendingRegistration.firstName
              } ${pendingRegistration.lastName} as a student? A registration number and a student login account will be generated.`
            : undefined
        }
      />
    </>
  );
}

// ======================================================
// Registration result
// ======================================================

function RegistrationResultCard({
  registration,
  onClose,
}: {
  registration: StudentRegistrationResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { username, defaultPassword } = registration.login;

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(
        `Username: ${username}\nDefault password: ${defaultPassword}`,
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card
      title="Student registered successfully"
      className="mb-4 border-primary-200"
      actions={
        <>
          <Button
            size="sm"
            variant="outline"
            icon={
              copied ? (
                <CircleCheck className="size-3.5" aria-hidden />
              ) : (
                <Copy className="size-3.5" aria-hidden />
              )
            }
            onClick={() => void copyCredentials()}
          >
            {copied ? "Copied" : "Copy credentials"}
          </Button>
        </>
      }
    >
      <dl className="mb-3 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-ink-500">Student</dt>
          <dd className="mt-0.5 font-medium text-ink-900">
            {[registration.student.firstName, registration.student.middleName, registration.student.lastName]
              .filter(Boolean)
              .join(" ")}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-ink-500">Registration number</dt>
          <dd className="mt-0.5 font-mono font-medium text-ink-900">
            {registration.student.registrationNumber}
          </dd>
        </div>
      </dl>

      <pre className="rounded-lg border border-ink-100 bg-forest-50 p-4 font-mono text-[13px] leading-relaxed text-ink-900">
        {`Username:         ${username}
Default password: ${defaultPassword}`}
      </pre>

      <Alert tone="info" className="mt-3">
        Shown once — ask the student to change the password at first login.
      </Alert>

      <div className="mt-3 text-right">
        <Button size="sm" variant="outline" onClick={onClose}>
          Dismiss
        </Button>
      </div>
    </Card>
  );
}
