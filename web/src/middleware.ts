import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  roleHomePath,
  verifySessionToken,
} from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const session = await verifySessionToken(token);

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isDriverRoute = pathname === "/driver" || pathname.startsWith("/driver/");
  const isLoginPage = pathname === "/";

  if (isAdminRoute) {
    if (!session) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/driver", request.url));
    }
    return NextResponse.next();
  }

  if (isDriverRoute) {
    if (!session) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "DRIVER") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL(roleHomePath(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin", "/admin/:path*", "/driver", "/driver/:path*"],
};
