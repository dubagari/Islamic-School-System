import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  CircleCheck,
  CircleX,
  Copy,
  Link as LinkIcon,
  Wallet,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { FieldError, TextareaField } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  useApproveAdmissionMutation,
  useGetAdmissionQuery,
  useRegisterStudentMutation,
  useRejectAdmissionMutation,
  toFieldErrors,
  type StudentRegistrationResult,
} from "@/features/admissions/api";

const API_ASSET_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api/v2").replace(
  /\/api\/v2\/?$/,
  ""
);

export function AdmissionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, refetch } = useGetAdmissionQuery(id ?? "", {
    skip: !id,
  });

  const [approveAdmission, approveResult] = useApproveAdmissionMutation();
  const [rejectAdmission, rejectResult] = useRejectAdmissionMutation();
  const [registerStudent, registerResult] = useRegisterStudentMutation();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectFields, setRejectFields] = useState<Record<string, string>>({});
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [registration, setRegistration] =
    useState<StudentRegistrationResult | null>(null);

  const application = data?.data;

  const handleApprove = async () => {
    if (!application) return;
    try {
      await approveAdmission(application._id).unwrap();
      setApproveOpen(false);
    } catch (error) {
      setPageError(toFieldErrors(error).message);
      setApproveOpen(false);
    }
  };

  const handleReject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!application) return;
    try {
      const trimmed = rejectReason.trim();
      await rejectAdmission({
        id: application._id,
        reason: trimmed || undefined,
      }).unwrap();
      setRejectOpen(false);
      setRejectReason("");
    } catch (error) {
      const { message, fields } = toFieldErrors(error);
      setRejectError(message);
      setRejectFields(fields);
    }
  };

  const handleRegister = async () => {
    if (!application) return;
    try {
      const result = await registerStudent(application._id).unwrap();
      setRegistration(result.data);
    } catch (error) {
      setPageError(toFieldErrors(error).message);
    }
  };

  if (!id) {
    return (
      <>
        <PageHeader title="Admission application" />
        <Alert tone="error" title="Missing application id">
          No application id was provided in the URL.
        </Alert>
      </>
    );
  }

  if (isLoading) return <PageLoader />;

  if (isError || !application) {
    return (
      <>
        <PageHeader title="Admission application" />
        <Alert tone="error" title="Failed to load application">
          The application could not be found or loaded.
          <Button
            size="sm"
            variant="outline"
            className="ms-2"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </Alert>
      </>
    );
  }

  const canDecide = application.status === "Pending";
  const canCollectPayment =
    application.status === "Approved" && application.paymentStatus === "Pending";
  const canRegister =
    application.status === "Approved" &&
    application.paymentStatus === "Paid" &&
    !application.registrationNumber;

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link to="/admissions" className="hover:text-primary-700">
            ← Back to admissions
          </Link>
        }
        title={
          [application.firstName, application.middleName, application.lastName]
            .filter(Boolean)
            .join(" ") || "Admission application"
        }
        description={`Application ${application.applicationNumber ?? "—"}`}
        actions={
          <>
            <StatusBadge status={application.status} />
            <StatusBadge status={application.paymentStatus} />
          </>
        }
      />

      {pageError && (
        <Alert
          tone="error"
          title="Action failed"
          onDismiss={() => setPageError(null)}
          className="mb-4"
        >
          {pageError}
        </Alert>
      )}

      {registration && (
        <RegistrationResultCard
          registration={registration}
          onClose={() => setRegistration(null)}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Applicant details">
          {application.photoUrl ? (
            <img
              src={`${API_ASSET_BASE}${application.photoUrl}`}
              alt={`Passport photo of ${application.firstName}`}
              className="mb-4 h-28 w-24 rounded-lg border border-ink-200 object-cover"
            />
          ) : null}
          <dl className="divide-y divide-ink-100 text-sm">
            <DetailRow label="Application #" value={application.applicationNumber} mono />
            <DetailRow
              label="Full name"
              value={[application.firstName, application.middleName, application.lastName]
                .filter(Boolean)
                .join(" ")}
            />
            <DetailRow label="Gender" value={application.gender} />
            <DetailRow
              label="Date of birth"
              value={formatDate(application.dateOfBirth)}
            />
            <DetailRow label="Phone" value={application.phone} />
            <DetailRow label="Email" value={application.email || undefined} />
            <DetailRow label="Address" value={application.address} />
            <DetailRow label="Current level" value={application.currentLevel} />
            <DetailRow
              label="Previous madrasa"
              value={application.previousMadrasa || undefined}
            />
          </dl>
        </Card>

        <Card title="Guardian details">
          <dl className="divide-y divide-ink-100 text-sm">
            <DetailRow label="Parent / guardian" value={application.parentName} />
            <DetailRow label="Relationship" value={application.relationship} />
            <DetailRow label="Phone" value={application.parentPhone} />
            <DetailRow label="Email" value={application.parentEmail || undefined} />
          </dl>
        </Card>

        <Card title="Status timeline">
          <dl className="divide-y divide-ink-100 text-sm">
            <DetailRow
              label="Submitted"
              value={formatDateTime(application.createdAt)}
            />
            <DetailRow
              label="Approved"
              value={application.approvedAt ? formatDateTime(application.approvedAt) : undefined}
            />
            <DetailRow
              label="Rejected"
              value={application.rejectedAt ? formatDateTime(application.rejectedAt) : undefined}
            />
            {application.statusReason && (
              <DetailRow label="Status reason" value={application.statusReason} />
            )}
            <DetailRow
              label="Last updated"
              value={formatDateTime(application.updatedAt)}
            />
          </dl>
        </Card>

        <Card title="Payment info">
          <dl className="divide-y divide-ink-100 text-sm">
            <DetailRow
              label="Status"
              value={<StatusBadge status={application.paymentStatus} />}
            />
            <DetailRow
              label="Method"
              value={application.paymentMethod || undefined}
            />
            <DetailRow
              label="Reference"
              value={application.paymentReference || undefined}
              mono
            />
            <DetailRow
              label="Amount"
              value={
                application.paymentAmount
                  ? `₦${application.paymentAmount.toLocaleString()}`
                  : undefined
              }
            />
            <DetailRow
              label="Paid at"
              value={application.paidAt ? formatDateTime(application.paidAt) : undefined}
            />
          </dl>
        </Card>
      </div>

      <Card title="Actions" className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {canDecide && (
            <>
              <Button
                icon={<BadgeCheck className="size-4" aria-hidden />}
                onClick={() => setApproveOpen(true)}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                icon={<CircleX className="size-4" aria-hidden />}
                onClick={() => {
                  setRejectOpen(true);
                  setRejectError(null);
                  setRejectFields({});
                }}
              >
                Reject
              </Button>
            </>
          )}

          {canCollectPayment && (
            <Link to="/admissions/payments">
              <Button icon={<Wallet className="size-4" aria-hidden />} iconRight={<LinkIcon className="size-4" aria-hidden />}>
                Confirm payment
              </Button>
            </Link>
          )}

          {canRegister && (
            <Button
              onClick={() => {
                setRegistration(null);
                void handleRegister();
              }}
              loading={registerResult.isLoading}
              icon={<CircleCheck className="size-4" aria-hidden />}
            >
              Complete registration
            </Button>
          )}

          {application.status === "Rejected" && (
            <p className="text-xs text-ink-500">
              This application has been rejected and cannot be processed further.
            </p>
          )}

          {application.registrationNumber && (
            <p className="text-xs text-ink-500">
              Registered as{" "}
              <span className="font-mono text-ink-800">
                {application.registrationNumber}
              </span>
              .
            </p>
          )}

          {!canDecide && !canCollectPayment && !canRegister && !application.registrationNumber &&
            application.status !== "Rejected" && (
              <p className="text-xs text-ink-500">
                No actions available for this application yet.
              </p>
            )}
        </div>
      </Card>

      {/* ======================================================
          Approve (confirm) dialog
        ====================================================== */}
      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
        title="Approve application"
        confirmLabel="Approve"
        loading={approveResult.isLoading}
        description={
          application
            ? `Approve ${application.firstName} ${application.lastName}? Payment collection can then begin.`
            : undefined
        }
      />

      {/* ======================================================
          Reject dialog
        ====================================================== */}
      <Dialog
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setRejectReason("");
        }}
        title="Reject application"
        description="This application will be marked as rejected."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={rejectResult.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="reject-admission-form"
              variant="danger"
              loading={rejectResult.isLoading}
            >
              Reject
            </Button>
          </>
        }
      >
        {rejectError && (
          <Alert tone="error" onDismiss={() => setRejectError(null)} className="mb-3">
            {rejectError}
          </Alert>
        )}
        <form id="reject-admission-form" onSubmit={handleReject}>
          <TextareaField
            label="Reason (optional)"
            maxLength={500}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <FieldError error={rejectFields.reason} />
        </form>
      </Dialog>
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
            icon={copied ? <CircleCheck className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            onClick={() => void copyCredentials()}
          >
            {copied ? "Copied" : "Copy credentials"}
          </Button>
          <Link to={`/students/${registration.student._id}`}>
            <Button size="sm" variant="outline">
              View student
            </Button>
          </Link>
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

// ======================================================
// Small local helpers
// ======================================================

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd
        className={
          mono
            ? "font-mono text-[13px] text-ink-900"
            : "text-[13px] font-medium text-ink-900"
        }
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
