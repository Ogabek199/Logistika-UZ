const API_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
    : "/api/backend";

export const BACKEND_UNAVAILABLE_CODE = "BACKEND_UNAVAILABLE";

export class ServerUnavailableError extends Error {
  readonly code = BACKEND_UNAVAILABLE_CODE;

  constructor(message = "Server unavailable") {
    super(message);
    this.name = "ServerUnavailableError";
  }
}

export function isServerUnavailable(error: unknown): boolean {
  return (
    error instanceof ServerUnavailableError ||
    (error instanceof Error &&
      (error.message.includes(BACKEND_UNAVAILABLE_CODE) ||
        /failed to fetch|networkerror|load failed|econnrefused/i.test(
          error.message,
        )))
  );
}

function redirectToMaintenance() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path.startsWith("/maintenance")) return;
  sessionStorage.setItem("logistika_return_to", path + window.location.search);
  window.location.assign("/maintenance");
}

async function readErrorMessage(res: Response, fallback: string) {
  let message = fallback;
  try {
    const body = await res.json();
    message = body.message || body.error || message;
    if (Array.isArray(message)) message = message.join(", ");
    if (body.code === BACKEND_UNAVAILABLE_CODE) {
      throw new ServerUnavailableError(
        typeof message === "string" ? message : fallback,
      );
    }
  } catch (e) {
    if (e instanceof ServerUnavailableError) throw e;
  }
  return typeof message === "string" ? message : fallback;
}

function defaultErrorMessage() {
  return (
    (typeof window !== "undefined" &&
      localStorage.getItem("logistika_locale") === "ru" &&
      "Произошла ошибка") ||
    "Xatolik yuz berdi"
  );
}

export type AuthUser = {
  id: string;
  role: "ADMIN" | "DRIVER";
  name: string;
  email?: string | null;
  phone?: string;
  vehicle?: string | null;
  plateNumber?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
};

const USER_KEY = "logistika_user";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(data: AuthResponse) {
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export async function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  await fetch("/api/auth/session", { method: "DELETE" });
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch("/api/backend/health", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function login(payload: {
  role: string;
  username?: string;
  phone?: string;
  password: string;
}): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    redirectToMaintenance();
    throw new ServerUnavailableError();
  }

  if (res.status === 503) {
    redirectToMaintenance();
    throw new ServerUnavailableError(await readErrorMessage(res, defaultErrorMessage()));
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, defaultErrorMessage()));
  }

  const data = (await res.json()) as AuthResponse;
  saveSession(data);
  return data;
}

export async function hydrateUser(): Promise<AuthUser> {
  const cached = getStoredUser();
  if (cached) return cached;
  const user = await api<AuthUser>("/auth/me");
  saveSession({ user });
  return user;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "same-origin",
    });
  } catch {
    redirectToMaintenance();
    throw new ServerUnavailableError();
  }

  if (res.status === 503) {
    redirectToMaintenance();
    throw new ServerUnavailableError(
      await readErrorMessage(res, defaultErrorMessage()),
    );
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, defaultErrorMessage()));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Fetch a file with auth cookie and trigger a browser download. */
export async function downloadFile(
  path: string,
  options: RequestInit = {},
  fallbackName = "document.pdf",
): Promise<void> {
  const headers = new Headers(options.headers || {});
  if (options.body) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "same-origin",
    });
  } catch {
    redirectToMaintenance();
    throw new ServerUnavailableError();
  }

  if (res.status === 503) {
    redirectToMaintenance();
    throw new ServerUnavailableError(
      await readErrorMessage(res, defaultErrorMessage()),
    );
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, defaultErrorMessage()));
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const name = match ? decodeURIComponent(match[1]) : fallbackName;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
