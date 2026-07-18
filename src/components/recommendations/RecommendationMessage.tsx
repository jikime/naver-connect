// RecommendationMessage — 추천 5문장 구조 렌더(소개/접점=원문 인용/당신의 이익/상대의 이익/첫 행동).
// 근거: ARCHITECTURE.md §4.2 Recommendation.message(BR-06 받는사람 이익 먼저), TASKS.md T-013,
//       FR-RC-03/05/06/07. 최소노출 마스킹(FR-RC-06)은 DAL(withSessionAndMask)이 이미 적용해
//       message.contact_point로 내려주므로, 여기서는 min_exposure_note와 값이 같은지 비교해
//       "비공개층 최소 노출" 안내만 표시한다(창작·재마스킹 없음).

import type { Recommendation } from "@/types";

export function RecommendationMessage({ rec }: { rec: Recommendation }) {
  const isMinExposure = rec.message.contact_point === rec.min_exposure_note;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-base leading-relaxed text-foreground">
          {rec.message.intro}
        </p>
      </section>

      <section>
        <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-guud-text-muted-2 uppercase">
          접점
        </h3>
        <blockquote className="border-l-2 border-guud-hairline pl-3 text-sm leading-relaxed text-foreground italic">
          “{rec.message.contact_point}”
        </blockquote>
        {isMinExposure && (
          <p className="mt-1 text-xs text-guud-text-muted-2">
            본인·운영자가 아니어서 비공개 수요는 최소 노출 범위로만
            요약되었습니다.
          </p>
        )}
      </section>

      <section className="border border-guud-hairline p-3">
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-guud-text-muted-2 uppercase">
          당신의 이익
        </h3>
        <p className="text-sm leading-relaxed text-foreground">
          {rec.message.your_benefit}
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-guud-text-muted-2 uppercase">
          상대의 이익
        </h3>
        <p className="text-sm leading-relaxed text-foreground">
          {rec.message.their_benefit}
        </p>
      </section>

      <section className="bg-muted p-3">
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-guud-text-muted-2 uppercase">
          첫 행동
        </h3>
        <p className="text-sm leading-relaxed font-medium text-foreground">
          {rec.message.first_action}
        </p>
      </section>

      <p className="text-xs text-guud-text-muted-2">
        작성 방향: {rec.authored_direction} (A→B/B→A 각각 개별 작성, 복붙 대칭
        금지 · FR-RC-07)
      </p>
    </div>
  );
}
