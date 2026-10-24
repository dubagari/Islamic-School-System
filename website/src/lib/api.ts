const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v2";

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
