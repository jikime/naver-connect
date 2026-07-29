import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/LoginPanel";

export const metadata: Metadata = {
  title: "로그인 | 사회혁신기업가네트워크 AX 플랫폼",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center bg-muted/50 px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <LoginPanel
          showReviewAccounts={process.env.SHOW_REVIEW_ACCOUNTS !== "false"}
        />
      </div>
    </div>
  );
}
