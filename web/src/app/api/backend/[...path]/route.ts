import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

/** Prefer server-only BACKEND_URL; fall back to public URL for local/dev. */
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api";

function unavailableResponse() {
  return NextResponse.json(
    {
      code: "BACKEND_UNAVAILABLE",
      message: "Server yangilanmoqda. Iltimos, birozdan so‘ng qayta urinib ko‘ring.",
    },
    { status: 503 },
  );
}

function bearerFromAuthorization(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function resolveAccessToken(request: NextRequest): Promise<string | null> {
  const fromRequestCookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (fromRequestCookie) return fromRequestCookie;

  const fromStore = (await cookies()).get(AUTH_COOKIE)?.value;
  if (fromStore) return fromStore;

  // Upstream proxies (e.g. Vercel → VPS Next) forward Bearer, not the browser cookie.
  return bearerFromAuthorization(request.headers.get("Authorization"));
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const token = await resolveAccessToken(request);

  const target = new URL(`${BACKEND_URL.replace(/\/$/, "")}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const res = await fetch(target, init);
    const responseHeaders = new Headers();

    const passthrough = ["Content-Type", "Content-Disposition", "Content-Length"];
    for (const key of passthrough) {
      const value = res.headers.get(key);
      if (value) responseHeaders.set(key, value);
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch {
    return unavailableResponse();
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
