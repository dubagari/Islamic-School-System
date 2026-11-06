import { API_BASE_URL, apiRequest } from "@/app/api";

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Cancelled"
  | string;

export type AdmissionPaymentApplication = {
  _id: string;
  applicationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  currentLevel?: string;
  status: "Pending" | "Approved" | "Rejected" | string;
  paymentStatus: PaymentStatus;
  paymentMethod?: "Paystack" | "Cash" | string | null;
  paymentReference?: string | null;
  paymentAmount?: number;
  paidAt?: string | null;
  registrationNumber?: string | null;
};

export type AdmissionPaymentSummary = {
  application: AdmissionPaymentApplication;
  feeAmount: number;
  schoolFee: number;
  emailRequired: boolean;
};

export type PaystackInitialization = {
  applicationNumber: string;
  amount: number;
  reference: string;
  accessCode?: string;
  authorizationUrl: string;
};

export type AdmissionPaymentVerification = {
  application: AdmissionPaymentApplication;
};

export async function getAdmissionPaymentSummary(
  applicationNumber: string,
  phone: string
): Promise<AdmissionPaymentSummary> {
  const envelope = await apiRequest<AdmissionPaymentSummary>(
    `/admission-payments/admission/${encodeURIComponent(
      applicationNumber.trim()
    )}?phone=${encodeURIComponent(phone.trim())}`
  );
  return envelope.data;
}

export async function initializeAdmissionPaystackPayment({
  applicationNumber,
  phone,
  email,
}: {
  applicationNumber: string;
  phone: string;
  email?: string;
}): Promise<PaystackInitialization> {
  const envelope = await apiRequest<PaystackInitialization>(
    "/admission-payments/paystack/initialize",
    {
      method: "POST",
      body: {
        applicationNumber,
        phone,
        ...(!email ? {} : { email }),
      },
    }
  );
  return envelope.data;
}

export async function verifyAdmissionPaystackPayment({
  reference,
  phone,
}: {
  reference: string;
  phone: string;
}): Promise<AdmissionPaymentVerification> {
  const envelope = await apiRequest<AdmissionPaymentVerification>(
    "/admission-payments/paystack/verify",
    {
      method: "POST",
      body: {
        reference,
        phone,
      },
    }
  );
  return envelope.data;
}

export const admissionPaymentStorage = {
  setPhone: (phone: string) =>
    sessionStorage.setItem("dums.admissionPaymentPhone", phone),
  getPhone: () => sessionStorage.getItem("dums.admissionPaymentPhone") ?? "",
  clear: () =>
    sessionStorage.removeItem("dums.admissionPaymentPhone"),
};

export async function downloadAdmissionLetterByPhone({
  applicationNumber,
  phone,
}: {
  applicationNumber: string;
  phone: string;
}): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/admission-payments/admission/${encodeURIComponent(
      applicationNumber.trim()
    )}/letter?phone=${encodeURIComponent(phone.trim())}`
  );

  if (!response.ok) {
    let message = "Could not download the admission letter.";

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = payload.message;
    } catch {
      // non-JSON error response
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeNumber = String(applicationNumber || "letter").replace(
    /[^A-Za-z0-9]+/g,
    "-"
  );

  link.href = url;
  link.download = `admission-letter-${safeNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
