import type { Metadata } from "next";
import { MemberHome } from "@/components/auth/MemberHome";

export const metadata: Metadata = {
  title: "서비스 홈 | 사회혁신기업가네트워크 AX 플랫폼",
};

export default function HomePage() {
  return <MemberHome />;
}
