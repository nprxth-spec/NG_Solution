import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { verifyAdminSessionCookie } from "@/lib/admin-session";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    if (process.env.NODE_ENV === "production" && !process.env.ADMIN_SESSION_TOKEN) {
      return NextResponse.redirect(
        new URL("/admin/login?error=config", req.url),
      );
    }

    const token = req.cookies.get("admin_session")?.value;
    if (!(await verifyAdminSessionCookie(token))) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  }

  const publicPaths = ["/", "/login", "/terms", "/privacy", "/data"];
  const isPublic = publicPaths.includes(pathname);

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$|.*\\.ico$).*)",
  ],
};
