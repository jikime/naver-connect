// RegionStatusTable — 한빛구 주체 유형별 규모 테이블(FR-GR-01).
// 근거: ARCHITECTURE.md §3(L2 GapReport), TASKS.md T-017
// 시드(region_hanbit.json) 수치를 자릿수까지 그대로 렌더한다(A1/BR-08, 창작 금지).

import type { Region } from "@/types";

export function RegionStatusTable({ region }: { region: Region }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-guud-hairline bg-card">
      <table className="w-full min-w-[520px] text-left text-sm">
        <caption className="sr-only">
          {region.name} 주체 유형별 규모 현황
        </caption>
        <thead>
          <tr className="border-b border-guud-hairline bg-muted font-mono text-[0.625rem] tracking-[0.12em] text-guud-text-muted-2 uppercase">
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
              주체 유형
            </th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
              규모
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              비고
            </th>
          </tr>
        </thead>
        <tbody>
          {region.actor_counts.map((row) => (
            <tr
              key={row.label}
              className="border-b border-guud-hairline last:border-b-0"
            >
              <td className="whitespace-nowrap px-4 py-2 font-medium text-foreground">
                {row.label}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-foreground">
                {row.count}
              </td>
              <td className="px-4 py-2 text-guud-text-muted-2">
                {row.metric ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
