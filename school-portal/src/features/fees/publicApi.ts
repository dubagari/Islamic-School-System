import { apiRequest } from "@/app/api";

export type PublicSchoolFeeStudent = {
  id: string;
  fullName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  applicationNumber: string;
  registrationNumber?: string | null;
  currentLevel?: string | null;
  academicClass?: { _id: string; name?: string } | string | null;
};

export type PublicSchoolFeeInvoiceItem = {
  name?: string;
  description?: string;
  amount?: number;
};

export type PublicSchoolFeeInvoice = {
  _id: string;
  invoiceNumber: string;
  totalAmount?: number;
  amountPaid?: number;
  balance?: number;
  status?: string;
  dueDate?: string | null;
  items?: PublicSchoolFeeInvoiceItem[];
  academicSession?: { _id: string; name?: string } | string | null;
  academicSemester?: { _id: string; name?: string } | string | null;
  academicClass?: { _id: string; name?: string } | string | null;
  createdAt?: string;
};

export type PublicSchoolFeeSummary = {
  invoices: number;
  unpaidInvoices: number;
  hasInvoices: boolean;
  totalBilled: number;
  totalPaid: number;
  totalBalance: number;
  expectedFee?: number;
};

export type PublicSchoolFeeLookup = {
  student: PublicSchoolFeeStudent;
  summary: PublicSchoolFeeSummary;
  invoices: PublicSchoolFeeInvoice[];
};

export type PublicFeePaystackInitialization = {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  reference: string;
  accessCode?: string;
  authorizationUrl: string;
};

export type PublicFeePaymentVerification = {
  invoice: PublicSchoolFeeInvoice | null;
  payment: {
    receiptNumber?: string;
    amount?: number;
    paidAt?: string | null;
    reference?: string;
    method?: string;
  } | null;
};

export function publicFeeErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Something went wrong. Please try again.";
}

export async function lookupPublicSchoolFeeSummary({
  applicationNumber,
  phone,
}: {
  applicationNumber: string;
  phone: string;
}): Promise<PublicSchoolFeeLookup> {
  const envelope = await apiRequest<PublicSchoolFeeLookup>(
    "/public-school-fees/lookup",
    {
      method: "POST",
      body: {
        applicationNumber: applicationNumber.trim(),
        phone: phone.trim(),
      },
    },
  );

  return envelope.data;
}

export async function initializePublicSchoolFeePayment({
  applicationNumber,
  phone,
  invoiceId,
  email,
}: {
  applicationNumber: string;
  phone: string;
  invoiceId?: string;
  email?: string;
}): Promise<PublicFeePaystackInitialization> {
  const envelope = await apiRequest<PublicFeePaystackInitialization>(
    "/public-school-fees/paystack/initialize",
    {
      method: "POST",
      body: {
        applicationNumber: applicationNumber.trim(),
        phone: phone.trim(),
        ...(!invoiceId ? {} : { invoiceId }),
        ...(!email?.trim() ? {} : { email: email.trim() }),
      },
    },
  );

  return envelope.data;
}

export async function verifyPublicSchoolFeePayment({
  applicationNumber,
  phone,
  reference,
}: {
  applicationNumber: string;
  phone: string;
  reference: string;
}): Promise<PublicFeePaymentVerification> {
  const envelope = await apiRequest<PublicFeePaymentVerification>(
    "/public-school-fees/paystack/verify",
    {
      method: "POST",
      body: {
        applicationNumber: applicationNumber.trim(),
        phone: phone.trim(),
        reference,
      },
    },
  );

  return envelope.data;
}

type PublicFeeStorageValue = {
  applicationNumber: string;
  phone: string;
  invoiceNumber?: string;
};

export const publicSchoolFeeStorage = {
  set: (value: PublicFeeStorageValue) =>
    sessionStorage.setItem(
      "dums.publicSchoolFee",
      JSON.stringify(value),
    ),
  get: (): PublicFeeStorageValue | null => {
    try {
      const parsed = JSON.parse(
        sessionStorage.getItem("dums.publicSchoolFee") ?? "",
      ) as PublicFeeStorageValue | null;

      if (!parsed?.applicationNumber || !parsed?.phone) return null;
      return parsed;
    } catch {
      return null;
    }
  },
  updatePartial: (value: Partial<PublicFeeStorageValue>) => {
    const current = publicSchoolFeeStorage.get();
    if (!current) return;
    publicSchoolFeeStorage.set({ ...current, ...value });
  },
  clear: () => sessionStorage.removeItem("dums.publicSchoolFee"),
};
