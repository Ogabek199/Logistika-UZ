import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function unavailableResponse() {
  return NextResponse.json(
    {
      code: "BACKEND_UNAVAILABLE",
      message: "Server yangilanmoqda. Iltimos, birozdan so‘ng qayta urinib ko‘ring.",
    },
    { status: 503 },
  );
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  const target = new URL(`${BACKEND_URL}/${path.join("/")}`);
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
