// /collab-cases — 협업사례 입력·조회 + 시뮬레이션(FR-CS-01/02, v1.3 Supabase 연동).
// 근거: PRD §8.16, ARCHITECTURE.md §3, TASKS #28
// v1.3: async Server Component에서 DB 데이터를 fetch해 CollabCasesView에 props로 전달.
// 세션 내 write(inputCollabCase)는 기존 방식(Zustand) 유지.

import type { Metadata } from "next";
import { CollabCasesView } from "@/components/collaboration/CollabCasesView";
import {
  getCollabCasesFromDB,
  getCollabRelationsFromDB,
  getOrganizationsFromDB,
} from "@/lib/dal/collaboration-server";
import { getDatasetDocument } from "@/lib/dal/server-datasets";
import type { Field, SubgroupMapEntry } from "@/types";

export const metadata: Metadata = {
  title: "협업사례 | 사회혁신기업가네트워크 AX 플랫폼",
};

export default async function CollabCasesPage() {
  const [cases, relations, orgs, fields, subgroupMap] = await Promise.all([
    getCollabCasesFromDB(),
    getCollabRelationsFromDB(),
    getOrganizationsFromDB(),
    getDatasetDocument<Field[]>("fields"),
    getDatasetDocument<SubgroupMapEntry[]>("subgroup-map"),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-guud-hairline bg-guud-header-band">
        <div className="mx-auto w-full max-w-7xl space-y-3 px-6 py-14 sm:px-10 lg:px-16">
          <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
            [ LAYER 02 · COLLAB CASES ]
          </p>
          <h1 className="font-heading text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            협업 <span className="text-primary">사례</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-guud-text-muted-2">
            진행됐거나 진행 중인 협력 사례를 확인하고, 우리 조직 기준으로 가능한
            협업 조합을 시뮬레이션해보세요. 새로운 사례도 직접 입력할 수
            있습니다.
          </p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
        <CollabCasesView
          initialCases={cases}
          initialRelations={relations}
          initialOrgs={orgs}
          initialFields={fields.data}
          initialSubgroupMap={subgroupMap.data}
        />
      </div>
    </div>
  );
}
