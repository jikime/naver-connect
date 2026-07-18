// 추천 상세 라우트 — 동적 세그먼트. Next.js 16은 params가 Promise이므로 await params로 받는다
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md 확인).
// 근거: ARCHITECTURE.md §3(L1 /recommendations/[id]), TASKS.md T-013, FR-RC-03~07

import { RecommendationDetail } from "@/components/recommendations/RecommendationDetail";

export default async function RecommendationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecommendationDetail id={id} />;
}
