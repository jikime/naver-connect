import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

function isOperatorPath(pathname: string): boolean {
  return pathname.startsWith("/operator") || pathname.startsWith("/admin");
}

export const proxy = auth((request) => {
  const pathname = request.nextUrl.pathname;
  const user = request.auth?.user;

  if (!user && !PUBLIC_PATHS.has(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user) return NextResponse.next();

  if (PUBLIC_PATHS.has(pathname) && pathname !== "/") {
    return NextResponse.redirect(
      new URL(
        user.role === "운영자" || user.onboardingComplete
          ? "/home"
          : "/onboarding",
        request.url,
      ),
    );
  }

  if (
    user.role !== "운영자" &&
    !user.onboardingComplete &&
    pathname !== "/onboarding"
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (user.role !== "운영자" && isOperatorPath(pathname)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (user.role === "운영자" && pathname === "/profile") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
