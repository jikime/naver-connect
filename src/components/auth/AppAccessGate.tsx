"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect } from "react";
import { useViewerContextStore } from "@/stores/viewer-context";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);

function isOperatorRoute(pathname: string): boolean {
  return pathname.startsWith("/operator") || pathname.startsWith("/admin");
}

export function AppAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  useEffect(() => {
    const viewer = useViewerContextStore.getState();
    if (user) {
      viewer.setViewer({ role: user.role, personaId: user.personaId });
    } else if (status === "unauthenticated") {
      viewer.reset();
    }
  }, [status, user]);

  useEffect(() => {
    if (status === "loading") return;
    if (!user && !PUBLIC_ROUTES.has(pathname)) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (
      user &&
      user.role !== "운영자" &&
      !user.onboardingComplete &&
      pathname !== "/onboarding"
    ) {
      router.replace("/onboarding");
      return;
    }
    if (user && (pathname === "/login" || pathname === "/signup")) {
      router.replace(
        user.role === "운영자" || user.onboardingComplete
          ? "/home"
          : "/onboarding",
      );
      return;
    }
    if (user?.role === "운영자" && pathname === "/profile") {
      router.replace("/home");
      return;
    }
    if (user && user.role !== "운영자" && isOperatorRoute(pathname)) {
      router.replace("/home");
    }
  }, [pathname, router, status, user]);

  const loading = status === "loading" && !PUBLIC_ROUTES.has(pathname);
  const needsRedirect =
    status !== "loading" &&
    ((!user && !PUBLIC_ROUTES.has(pathname)) ||
      (user &&
        user.role !== "운영자" &&
        !user.onboardingComplete &&
        pathname !== "/onboarding") ||
      (user !== undefined &&
        (pathname === "/login" || pathname === "/signup")) ||
      (user?.role === "운영자" && pathname === "/profile") ||
      (user && user.role !== "운영자" && isOperatorRoute(pathname)));

  if (loading || needsRedirect) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="text-sm text-guud-text-muted-2">
          {loading ? "세션을 확인하고 있어요…" : "이동하고 있어요…"}
        </p>
      </div>
    );
  }

  return children;
}
