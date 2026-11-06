import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, FileDown, ScrollText, Wallet } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";

import {
  downloadStudentAdmissionLetter,
  extractErrorMessage,
  formatNaira,
  refName,
  useGetStudentFeeSummaryQuery,
  useGetStudentProfileQuery,
} from "@/features/student/api";

export function StudentAdmissionLetterPage() {
  const {
    data: profileEnvelope,
    isLoading,
    isError,
    error: profileError,
  } = useGetStudentProfileQuery();

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const student = profileEnvelope?.data;
  const paid = (student?.paymentStatus ?? "") === "Paid";

  const studentId = student?._id ?? "";
  const {
    data: feeEnvelope,
    isLoading: isLoadingFees,
  } = useGetStudentFeeSummaryQuery(
    { studentId },
    { skip: !studentId },
  );
  const feeSummary = feeEnvelope?.summary;

  const fullName =
    student?.fullName ||
    [student?.firstName, student?.middleName, student?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "—";
  const className = refName(student?.academicClass) ?? "—";

  const handleDownload = async () => {
    if (!student) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadStudentAdmissionLetter(
        student.applicationNumber || student.registrationNumber,
      );
    } catch (err) {
      setDownloadError(
        err instanceof Error
          ? err.message
          : "Could not download the admission letter.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Admission letter"
        arabic="خطاب القبول"
        description="Your official letter of admission, unlocked after your admission fee is paid."
      />

      {isError ? (
        <Alert tone="error" title="Could not load your profile">
          {extractErrorMessage(profileError)}
        </Alert>
      ) : isLoading ? (
        <PageLoader />
      ) : (
        student && (
          <div className="max-w-xl">
            <Card>
              <div className="flex items-start gap-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                  <ScrollText className="size-6" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-bold text-ink-900">
                    Letter of admission
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    Issued to {fullName} for the {student.currentLevel ?? "—"}{" "}
                    class.
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-2">
                  <dt className="text-xs font-medium text-ink-500">Application #</dt>
                  <dd className="font-mono text-[13px] font-medium text-ink-900">
                    {student.applicationNumber ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-2">
                  <dt className="text-xs font-medium text-ink-500">Registration #</dt>
                  <dd className="font-mono text-[13px] font-medium text-ink-900">
                    {student.registrationNumber ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-2">
                  <dt className="text-xs font-medium text-ink-500">Class</dt>
                  <dd className="text-[13px] font-medium text-ink-900">{className}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-2">
                  <dt className="text-xs font-medium text-ink-500">Admission fee</dt>
                  <dd>
                    <StatusBadge status={student.paymentStatus ?? ""} />
                  </dd>
                </div>
              </dl>

              <div className="mt-4 rounded-lg border border-ink-100 bg-forest-50/40 p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 text-primary-800" aria-hidden />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-ink-700">
                    School fee
                  </h3>
                </div>

                {isLoadingFees && !feeSummary ? (
                  <p className="mt-2 text-sm text-ink-500">
                    Loading school fee information…
                  </p>
                ) : feeSummary?.hasInvoices ? (
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ink-500">
                        Total billed
                      </p>
                      <p className="font-bold text-ink-900">
                        {formatNaira(feeSummary.totalBilled)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ink-500">
                        Paid
                      </p>
                      <p className="font-bold text-ink-900">
                        {formatNaira(feeSummary.totalPaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ink-500">
                        Balance
                      </p>
                      <p className="font-bold text-ink-900">
                        {formatNaira(feeSummary.totalBalance)}
                      </p>
                    </div>
                  </div>
                ) : feeSummary?.expectedFee && feeSummary.expectedFee > 0 ? (
                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-wide text-ink-500">
                      Expected school fee
                    </p>
                    <p className="text-lg font-bold text-ink-900">
                      {formatNaira(feeSummary.expectedFee)}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      An invoice has not been issued for you yet, so you
                      cannot pay online until the school issues one.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-ink-500">
                    The school fee has not been set yet. Contact the school
                    office.
                  </p>
                )}

                <Link
                  to="/student/fees"
                  className="mt-3 inline-flex text-xs font-semibold text-primary-700 hover:text-primary-800"
                >
                  View / pay school fees →
                </Link>
              </div>

              {downloadError && (
                <Alert
                  tone="error"
                  className="mt-4"
                  onDismiss={() => setDownloadError(null)}
                >
                  {downloadError}
                </Alert>
              )}

              {paid ? (
                <Button
                  className="mt-5 w-full sm:w-auto"
                  icon={<FileDown className="size-4" aria-hidden />}
                  loading={downloading}
                  onClick={() => void handleDownload()}
                >
                  Download admission letter
                </Button>
              ) : (
                <Alert tone="warning" className="mt-5">
                  <span className="inline-flex items-center gap-1">
                    <CircleAlert className="size-3.5" aria-hidden />
                    Your admission letter unlocks after the admission fee is
                    paid. Contact the school office if you believe your payment
                    has been recorded.
                  </span>
                </Alert>
              )}
            </Card>
          </div>
        )
      )}
    </div>
  );
}
