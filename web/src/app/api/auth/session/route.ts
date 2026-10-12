import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  isHttpsRequest,
  sessionCookieOptions,
} from "@/lib/auth";

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

export async function POST(request: Request) {
  const body = await request.json();
  const secure = isHttpsRequest(request);

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return unavailableResponse();
  }

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(payload, { status: res.status });
  }

  const accessToken =
    typeof payload.accessToken === "string" ? payload.accessToken : "";
  if (!accessToken) {
    return NextResponse.json(
      { message: "Server token qaytarmadi. Qayta urinib ko‘ring." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ user: payload.user });
  response.cookies.set(
    AUTH_COOKIE,
    accessToken,
    sessionCookieOptions(undefined, secure),
  );
  return response;
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "", {
    ...sessionCookieOptions(0, isHttpsRequest(request)),
    maxAge: 0,
  });
  return response;
}
