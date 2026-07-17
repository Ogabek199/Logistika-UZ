import { jwtVerify } from "jose";

export const AUTH_COOKIE = "logistika_token";

export type SessionRole = "ADMIN" | "DRIVER";

export type Session = {
  sub: string;
  role: SessionRole;
  name: string;
};

function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV !== "production" ? "dev-secret" : undefined);
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const role = payload.role as SessionRole | undefined;
    const sub = payload.sub as string | undefined;
    const name = payload.name as string | undefined;
    if (!role || !sub || !name) return null;
    if (role !== "ADMIN" && role !== "DRIVER") return null;
    return { sub, role, name };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(
  maxAgeSeconds = 60 * 60 * 24 * 7,
  secure = process.env.NODE_ENV === "production",
) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function isHttpsRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() === "https";
  }
  return new URL(request.url).protocol === "https:";
}

export function roleHomePath(role: SessionRole) {
  return role === "ADMIN" ? "/admin" : "/driver";
}
