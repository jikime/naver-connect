import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/LoginPanel";

export const metadata: Metadata = {
  title: "로그인 | 사회혁신기업가네트워크 AX 플랫폼",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center px-5 py-12 sm:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <LoginPanel />
      </div>
    </div>
  );
}
