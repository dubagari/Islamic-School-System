const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:5000/api/v2" : "https://islamic-school-system.onrender.com/api/v2");

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export function apiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    (error as { data?: unknown }).data &&
    typeof (error as { data: unknown }).data === "object"
  ) {
    const payload = (error as { data: { message?: string } }).data;
    if (payload?.message) return payload.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body: (ApiEnvelope<T> & { success: boolean }) = await response.json();

  if (!response.ok || !body.success) {
    throw new PayloadError(body.message ?? "Request failed.", response.status);
  }
  return body.data as T;
}

export class PayloadError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type UploadPayload = {
  photoUrl: string;
};

export type PublicAnnouncement = {
  _id: string;
  title: string;
  content: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  publishAt: string;
  createdAt: string;
};

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", body: formData });
  let body: ApiEnvelope<T> & { success: boolean };
  try {
    body = await response.json();
  } catch {
    throw new PayloadError("Upload failed. Please try again.", response.status);
  }
  if (!response.ok || !body.success) {
    throw new PayloadError(body.message ?? "Upload failed. Please try again.", response.status);
  }
  return body.data as T;
}

export function assetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/api\/v2\/?$/, "")}${path}`;
}

export function applicationPdfUrl(applicationNumber: string, phone: string): string {
  return `${API_BASE_URL}/admission-applications/number/${encodeURIComponent(applicationNumber)}/pdf?phone=${encodeURIComponent(phone)}`;
}

export async function fetchPublicAnnouncements(limit = 12): Promise<PublicAnnouncement[]> {
  return apiFetch<PublicAnnouncement[]>(`/announcements/public?limit=${limit}`);
}

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
