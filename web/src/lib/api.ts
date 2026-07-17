const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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
  accessToken: string;
  user: AuthUser;
};

const TOKEN_KEY = "logistika_token";
const USER_KEY = "logistika_user";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

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
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message =
      (typeof window !== "undefined" &&
        localStorage.getItem("logistika_locale") === "ru" &&
        "Произошла ошибка") ||
      "Xatolik yuz berdi";
    try {
      const body = await res.json();
      message = body.message || body.error || message;
      if (Array.isArray(message)) message = message.join(", ");
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Fetch a file with auth headers and trigger a browser download. */
export async function downloadFile(
  path: string,
  options: RequestInit = {},
  fallbackName = "document.pdf",
): Promise<void> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message =
      (typeof window !== "undefined" &&
        localStorage.getItem("logistika_locale") === "ru" &&
        "Произошла ошибка") ||
      "Xatolik yuz berdi";
    try {
      const body = await res.json();
      message = body.message || body.error || message;
      if (Array.isArray(message)) message = message.join(", ");
    } catch {
      /* ignore */
    }
    throw new Error(message);
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
