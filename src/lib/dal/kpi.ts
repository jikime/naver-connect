// DAL: KPI read — 1단계 6종만 노출(shown_in_mvp 필터).
// 근거: ARCHITECTURE.md §5.2, FR-KP-01~03, BR-09, §14/M-3(2·3단계 KPI 대시보드는 Out of Scope)

import { getDataset } from "@/lib/dal/datasets";
import type { Kpi, ViewerContext } from "@/types";

/** shown_in_mvp===true 만 필터해 반환(1단계 6종). 2·3단계 KPI는 대시보드에 노출되지 않는다. */
export async function getKpis(_vc: ViewerContext): Promise<Kpi[]> {
  const kpis = await getDataset<Kpi[]>("kpis");
  return kpis.filter((kpi) => kpi.shown_in_mvp);
}
