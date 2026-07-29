"use client";

import { SessionProvider } from "next-auth/react";
import { type ReactNode, useEffect } from "react";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.localStorage.removeItem("ax-auth-session");
  }, []);
  return <SessionProvider>{children}</SessionProvider>;
}
