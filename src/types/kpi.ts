// KPI — 1단계 6 + 2단계 4 + 3단계 파일럿(가정치)
// 근거: ARCHITECTURE.md §4.2, FR-KP-01~03, BR-09, §14/M-3
// 시드: src/data/kpis.json (비민감)

export interface Kpi {
  id: string;
  stage: 1 | 2 | 3;
  label: string;
  target: number;
  current: number;
  unit: "%" | "건" | "인" | "점";
  /** FR-KP-03 가정치 뱃지(BR-09) */
  is_assumption: boolean;
  /** §14: 1단계 6종만 true */
  shown_in_mvp: boolean;
}
