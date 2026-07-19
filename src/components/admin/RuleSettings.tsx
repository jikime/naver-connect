"use client";

// RuleSettings — 추천 룰 설정(v1.1 · 1-5, 관리자 신규 화면). 성장스토리·회사정보 추출 키워드와
// 회원 쌍 매칭 점수를 보여주고, 운영자가 연관 키워드 가중치를 편집하면 점수를 재산출한다.
// 근거: ARCHITECTURE.md §3(L2 RuleSet), FR-RL-01/02/03
// getMatchScores는 전 역할이 읽을 수 있으나(FR-RL-01), 가중치 편집(setRuleWeights)은 운영자만
// 가능하다 — 비운영자 화면은 편집 폼 없이 읽기 전용 표만 보여준다(FR-RL-02 "WHERE 운영자").

import { useEffect, useState } from "react";
import { AssumptionBadge } from "@/components/shared/AssumptionBadge";
import { Button } from "@/components/ui/button";
import { getMatchScores, setRuleWeights } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { MatchScore, RuleWeight } from "@/types";

export function RuleSettings() {
  const vc = useViewerContext();
  const isAdmin = vc.role === "운영자";
  const [scores, setScores] = useState<MatchScore[] | null>(null);
  const [weights, setWeights] = useState<RuleWeight[]>([]);
  const [draftWeights, setDraftWeights] = useState<RuleWeight[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    getMatchScores(vc).then((result) => {
      setScores(result.scores);
      setWeights(result.weights);
      setDraftWeights(result.weights);
    });
  }, [vc]);

  function updateDraft(keyword: string, weight: number) {
    setDraftWeights((prev) =>
      prev.map((w) => (w.keyword === keyword ? { ...w, weight } : w)),
    );
    setSavedNotice(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await setRuleWeights(vc, draftWeights);
      setScores(result.scores);
      setWeights(result.weights);
      setSavedNotice(true);
    } finally {
      setSaving(false);
    }
  }

  if (scores === null) {
    return (
      <p className="px-[30px] py-6 text-sm text-guud-text-muted-2">
        불러오는 중입니다…
      </p>
    );
  }

  return (
    <div className="space-y-8 px-[30px] py-6">
      {!isAdmin && (
        <div className="border border-guud-hairline bg-muted px-4 py-3 text-sm text-guud-text-muted-2">
          가중치 편집은 운영자만 할 수 있어요. 상단 역할 스위처에서 “운영자”로
          전환하면 편집 폼이 나타나요(FR-RL-02).
        </div>
      )}

      <section>
        <h2 className="mb-1 text-sm font-semibold text-foreground">
          연관 키워드 가중치 <AssumptionBadge />
        </h2>
        <p className="mb-3 text-xs text-guud-text-muted-2">
          성장스토리·회사정보에서 추출된 키워드 세트 기반 가중치입니다(창작 목업
          — 실추출 전 시드 값).
        </p>
        <div className="space-y-2">
          {(isAdmin ? draftWeights : weights).map((w) => (
            <div key={w.keyword} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 text-foreground">{w.keyword}</span>
              {isAdmin ? (
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={w.weight}
                  onChange={(e) =>
                    updateDraft(w.keyword, Number(e.target.value))
                  }
                  className="flex-1"
                />
              ) : (
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(w.weight / 2) * 100}%` }}
                  />
                </div>
              )}
              <span className="w-10 text-right text-guud-text-muted-2">
                {w.weight.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        {isAdmin && (
          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              가중치 저장 · 점수 재산출
            </Button>
            {savedNotice && (
              <span className="text-xs text-guud-text-muted-2">
                반영됐어요(세션 한정, 새로고침 시 초기화).
              </span>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          회원 쌍 매칭 점수
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-guud-hairline text-left text-xs text-guud-text-muted-2">
                <th className="py-2 pr-3 font-semibold">회원 쌍</th>
                <th className="py-2 pr-3 font-semibold">점수</th>
                <th className="py-2 pr-3 font-semibold">축</th>
                <th className="py-2 font-semibold">근거 키워드</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr
                  key={`${s.from_member_id}-${s.to_member_id}`}
                  className="border-b border-guud-hairline"
                >
                  <td className="py-2 pr-3 text-foreground">
                    {s.from_member_id} → {s.to_member_id}
                  </td>
                  <td className="py-2 pr-3 font-semibold text-foreground">
                    {s.score}
                  </td>
                  <td className="py-2 pr-3 text-guud-text-muted-2">{s.axis}</td>
                  <td className="py-2 text-guud-text-muted-2">
                    {[...s.shared_keywords, ...s.complementary_keywords].join(
                      ", ",
                    ) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
