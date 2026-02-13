import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userStatus = req.auth?.user?.status;
  const userRole = req.auth?.user?.role;

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup");
  const isPendingPage = nextUrl.pathname.startsWith("/pending");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isDashboardPage = nextUrl.pathname.startsWith("/dashboard");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isInstanceApi = nextUrl.pathname.startsWith("/api/instances");

  // API 인증 라우트는 항상 허용
  if (isApiAuth) return NextResponse.next();

  // 인스턴스 API: 로그인 + 승인 필요
  if (isInstanceApi) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userStatus !== "APPROVED") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // 로그인된 사용자가 로그인/가입 페이지 접근 시 리다이렉트
  if (isLoggedIn && isAuthPage) {
    if (userStatus === "PENDING") {
      return NextResponse.redirect(new URL("/pending", nextUrl));
    }
    if (userStatus === "APPROVED") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // 인증 페이지는 미로그인 허용
  if (isAuthPage) return NextResponse.next();

  // pending 페이지: 로그인 필요
  if (isPendingPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  // 보호된 페이지 (dashboard, admin): 로그인 + 승인 필요
  if (isDashboardPage || isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (userStatus === "PENDING") {
      return NextResponse.redirect(new URL("/pending", nextUrl));
    }
    if (userStatus !== "APPROVED") {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  // 관리자 페이지: ADMIN 역할 필요
  if (isAdminPage && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|kict_ci.png).*)"],
};
