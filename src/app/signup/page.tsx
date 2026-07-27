import type { Metadata } from "next";
import { SignupPanel } from "@/components/auth/SignupPanel";

export const metadata: Metadata = {
  title: "회원가입 | 사회혁신기업가네트워크 AX 플랫폼",
};

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center bg-muted/50 px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <SignupPanel />
      </div>
    </div>
  );
}
