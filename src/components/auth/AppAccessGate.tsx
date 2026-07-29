"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuthSessionStore } from "@/stores/auth-session";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);

function isOperatorRoute(pathname: string): boolean {
  return pathname.startsWith("/operator") || pathname.startsWith("/admin");
}

export function AppAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthSessionStore((state) => state.user);
  const hasHydrated = useAuthSessionStore((state) => state.hasHydrated);
  const setHasHydrated = useAuthSessionStore((state) => state.setHasHydrated);

  useEffect(() => {
    void Promise.resolve(useAuthSessionStore.persist.rehydrate()).finally(() =>
      setHasHydrated(true),
    );
  }, [setHasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user && !PUBLIC_ROUTES.has(pathname)) {
      router.replace("/login");
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

    if (
      user?.onboardingComplete &&
      (pathname === "/login" || pathname === "/signup")
    ) {
      router.replace("/home");
      return;
    }

    if (user?.role === "운영자" && pathname === "/profile") {
      router.replace("/home");
      return;
    }

    if (user && user.role !== "운영자" && isOperatorRoute(pathname)) {
      router.replace("/home");
    }
  }, [hasHydrated, pathname, router, user]);

  if (!hasHydrated && !PUBLIC_ROUTES.has(pathname)) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="text-sm text-guud-text-muted-2">
          세션을 확인하고 있어요…
        </p>
      </div>
    );
  }

  const needsRedirect =
    hasHydrated &&
    ((!user && !PUBLIC_ROUTES.has(pathname)) ||
      (user &&
        user.role !== "운영자" &&
        !user.onboardingComplete &&
        pathname !== "/onboarding") ||
      (user?.onboardingComplete &&
        (pathname === "/login" || pathname === "/signup")) ||
      (user?.role === "운영자" && pathname === "/profile") ||
      (user && user.role !== "운영자" && isOperatorRoute(pathname)));

  if (needsRedirect) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="text-sm text-guud-text-muted-2">이동하고 있어요…</p>
      </div>
    );
  }

  return children;
}
