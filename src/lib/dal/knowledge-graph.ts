// DAL: 지식 그래프(A-v2) 조립 — 사람·조직·프로젝트·문서·시스템 5유형 노드 + 관계 엣지.
// 근거: team-lead A-v2 요청, ARCHITECTURE.md §5.2(DAL 계약), BR-01(최소 노출), ADR-03(민감 시드 단일 import).
//
// BR-01/ADR-03 준수:
//  - 민감 시드(members-private·deal_rooms·recommendations)는 직접 import하지 않고
//    각각의 유일 진입점 DAL(getMembers·getDealRooms·getRecommendationGraphEdges)만 경유한다.
//  - 비민감 공개 시드(organizations·gap_cards·region_hanbit·fields·vc_stages)만 직접 읽는다
//    (gap-report.ts·ecosystem.ts와 동일 선례).
//  - 노드 detail에는 공개 최상위 필드와 visibility.public만 투영한다.

import fieldsSeed from "@/data/fields.json";
import gapCardsSeed from "@/data/gap_cards.json";
import organizationsSeed from "@/data/organizations.json";
import regionHanbitSeed from "@/data/region_hanbit.json";
import vcStagesSeed from "@/data/vc_stages.json";
import { getDealRooms } from "@/lib/dal/deal";
import { getMembers } from "@/lib/dal/members";
import { getRecommendationGraphEdges } from "@/lib/dal/recommendations";
import type {
  Field,
  GapCard,
  KGEdge,
  KGNode,
  KnowledgeGraph,
  Organization,
  Region,
  VCStage,
  ViewerContext,
} from "@/types";

const organizations = organizationsSeed as Organization[];
const gapCards = gapCardsSeed as GapCard[];
const region = regionHanbitSeed as Region;
const fields = fieldsSeed as Field[];
const vcStages = vcStagesSeed as VCStage[];

const fieldName = (id: number) =>
  fields.find((f) => f.id === id)?.name ?? `#${id}`;
const stageName = (id: number) => {
  const s = vcStages.find((v) => v.id === id);
  return s ? `${fieldName(s.field_id)} · ${s.name}` : `단계 ${id}`;
};
const orgName = (id: string) =>
  organizations.find((o) => o.id === id)?.name ?? id;
/** 나라장터는 개별/집계 조직이 아니라 외부 공고 시스템 노드(SYS-NARA)로 표현한다. */
const isNaraOrg = (o: Organization) => o.name.includes("나라장터");

/** 정적 시스템 노드 — 내부 4종 + 외부 공고 소스 2종. */
const SYSTEM_NODES: KGNode[] = [
  {
    id: "SYS-REC",
    type: "system",
    label: "추천엔진",
    degree: 0,
    detail: {
      subtitle: "내부 시스템",
      note: "5종 매칭(거울·퍼즐·다리·취미·선배)으로 회원 간 연결을 최소 노출 원칙에 따라 제안.",
    },
  },
  {
    id: "SYS-MAP",
    type: "system",
    label: "생태계맵",
    degree: 0,
    detail: {
      subtitle: "내부 시스템",
      note: "공개 명부에서 조직을 actor_type으로 분류하고 AI 신뢰도를 부여해 지역 생태계를 지도화.",
    },
  },
  {
    id: "SYS-BO",
    type: "system",
    label: "공동 백오피스",
    degree: 0,
    detail: {
      subtitle: "내부 시스템",
      note: "실행 단계 프로젝트의 협업 규약·정산·문서를 함께 관리하는 백오피스.",
    },
  },
  {
    id: "SYS-RADAR",
    type: "system",
    label: "기회 레이더",
    degree: 0,
    detail: {
      subtitle: "내부 시스템",
      note: "외부 공고를 수집·요건 분석하고, 필요 시 팀을 역구성해 프로젝트로 연결.",
    },
  },
  {
    id: "SYS-NARA",
    type: "system",
    label: "나라장터",
    degree: 0,
    detail: {
      subtitle: "외부 공고 소스",
      note: "조달청 공공조달 공고. 기회 레이더의 외부 유입원.",
    },
  },
  {
    id: "SYS-CENTER",
    type: "system",
    label: "사경지원센터 공고",
    degree: 0,
    detail: {
      subtitle: "외부 공고 소스",
      note: "사회적경제지원센터 공모 공고. 공고 역방향 구성의 출발점.",
    },
  },
];

const PACT_ID = "DOC-PACT";
const REPORT_ID = "DOC-REPORT";

/**
 * 지식 그래프 전경(A-v2). 실데이터를 DAL 경유로만 읽어 공개층으로 투영한다.
 * 뷰어에 따라 마스킹 대상 필드를 애초에 담지 않으므로(BR-01) 구조는 뷰어 불변이지만,
 * DAL 계약(ADR-05)상 ViewerContext를 받아 하위 DAL에 전달한다.
 */
export async function getKnowledgeGraph(
  vc: ViewerContext,
): Promise<KnowledgeGraph> {
  const [members, dealRooms, recEdges] = await Promise.all([
    getMembers(vc),
    getDealRooms(vc),
    getRecommendationGraphEdges(vc),
  ]);

  const nodes: KGNode[] = [];
  const edges: KGEdge[] = [];
  const nodeIds = new Set<string>();
  const pushNode = (n: KGNode) => {
    if (nodeIds.has(n.id)) return;
    nodeIds.add(n.id);
    nodes.push(n);
  };
  const pushEdge = (
    source: string,
    target: string,
    rel: string,
    kind: KGEdge["kind"] = "real",
    emphasis = false,
  ) => {
    edges.push({
      id: `${source}__${target}__${rel}`,
      source,
      target,
      rel,
      kind,
      emphasis,
    });
  };

  // ---- 사람(Member) 8 — 공개 최상위 + visibility.public만 ----
  for (const m of members) {
    pushNode({
      id: m.id,
      type: "member",
      label: m.name,
      degree: 0,
      field: m.field_tags?.[0],
      detail: {
        subtitle: `${m.org.name} · ${m.org.role}`,
        rows: [
          {
            k: "구분",
            v: m.expert_subtype
              ? `전문가 · ${m.expert_subtype}`
              : m.member_type,
          },
          { k: "지역", v: `${m.region.sido} ${m.region.sigungu}` },
          { k: "가치사슬 단계", v: m.value_chain_stage },
        ],
        quote: m.mission_statement,
        tags: [
          {
            k: "공급(공개)",
            items: m.visibility.public.supply_tags.map((t) => t.detail),
          },
          { k: "협력 활동", items: m.visibility.public.activities },
        ],
        note: `선호: ${m.visibility.public.preferred_mode}`,
      },
    });
  }

  // ---- 조직: 개별 노출 vs 집계 ----
  // 개별 = 회원 소속 조직(member_id 보유) ∪ 딜룸 참여 조직. 나머지는 actor_type별 "+N개" 집계.
  const dealOrgIds = new Set(dealRooms.flatMap((d) => d.participating_orgs));
  const individualIds = new Set<string>([
    ...organizations.filter((o) => o.member_id).map((o) => o.id),
    ...dealOrgIds,
  ]);

  const orgNode = (o: Organization): KGNode => ({
    id: o.id,
    type: "org",
    label: o.name,
    degree: 0,
    field: o.field_tags[0],
    detail: {
      subtitle: `${o.actor_type} · ${o.region.sido} ${o.region.sigungu}`,
      rows: [
        { k: "가치사슬 단계", v: stageName(o.value_chain_stage_id) },
        {
          k: "출처 · AI 신뢰도",
          v: `${o.source} · ${Math.round(o.ai_confidence * 100)}%`,
        },
        ...(o.verified_by.length
          ? [{ k: "검증 회원", v: o.verified_by.join(", ") }]
          : []),
      ],
      tags: [{ k: "분야", items: o.field_tags.map(fieldName) }],
    },
  });

  for (const o of organizations) {
    if (isNaraOrg(o)) continue; // 시스템 노드로 대체
    if (individualIds.has(o.id)) pushNode(orgNode(o));
  }

  // 집계 노드(actor_type별)
  const aggBuckets = new Map<Organization["actor_type"], Organization[]>();
  for (const o of organizations) {
    if (isNaraOrg(o) || individualIds.has(o.id)) continue;
    const list = aggBuckets.get(o.actor_type) ?? [];
    list.push(o);
    aggBuckets.set(o.actor_type, list);
  }
  const aggIds: string[] = [];
  for (const [actor, list] of aggBuckets) {
    const id = `AGG-${actor}`;
    aggIds.push(id);
    pushNode({
      id,
      type: "agg",
      label: `${actor} +${list.length}`,
      degree: 0,
      detail: {
        subtitle: `${actor} · ${list.length}개 조직`,
        note: "생태계맵이 공개 명부에서 발견한 조직. 과밀을 피해 개별 노출 대신 집계로 접었다.",
        list: { k: "포함 조직", items: list.map((o) => o.name) },
      },
    });
  }

  // ---- 프로젝트(딜룸) 4 — 중심 앵커 ----
  for (const d of dealRooms) {
    pushNode({
      id: d.id,
      type: "project",
      label: d.title,
      degree: 0,
      detail: {
        subtitle: `${d.stage} · ${d.source_type}`,
        rows: [{ k: "발원 근거", v: d.source_ref }],
        tags: [{ k: "참여 조직", items: d.participating_orgs.map(orgName) }],
        gates: (["G1", "G2", "G3", "G4"] as const).map((g) => ({
          label: g,
          passed: d.gate_status[g].passed,
        })),
        note: d.agreement_doc.note,
      },
    });
  }

  // ---- 문서 5 — 격차 리포트 + 기회카드 3 + 협업 규약 ----
  pushNode({
    id: REPORT_ID,
    type: "doc",
    label: "격차 리포트",
    degree: 0,
    detail: {
      subtitle: `${region.name} 지역 진단`,
      rows: [
        {
          k: "커버리지",
          v: `잠재 ${region.coverage.potential} / 실제 ${region.coverage.actual} (${region.coverage.rate}%)`,
        },
        { k: "강조 축", v: region.highlighted_gap_axis },
      ],
      list: {
        k: "실측",
        items: region.actor_counts
          .slice(0, 6)
          .map(
            (a) => `${a.label} ${a.count}${a.metric ? ` · ${a.metric}` : ""}`,
          ),
      },
    },
  });
  for (const card of gapCards) {
    pushNode({
      id: `DOC-${card.id}`,
      type: "doc",
      label: `기회카드 ${card.id}`,
      degree: 0,
      detail: {
        subtitle: card.title,
        rows: [{ k: "현재 연결 수", v: String(card.connection_count) }],
        quote: card.phenomenon,
        tags: [{ k: "제안 액션", items: card.actions.map((a) => a.type) }],
      },
    });
  }
  pushNode({
    id: PACT_ID,
    type: "doc",
    label: "협업 규약",
    degree: 0,
    detail: {
      subtitle: "'잘 헤어지는 규칙'",
      note: "프로젝트가 실행에 들어가기 전 맺는 협업 규약. 서명 완료는 실선, 준비·미체결은 점선.",
      list: {
        k: "규약 항목",
        items: [
          "역할·기여 분담",
          "비용·수익 배분",
          "의사결정 방식",
          "IP 귀속",
          "중단·탈퇴 규정",
        ],
      },
    },
  });

  // ---- 시스템 6 ----
  for (const s of SYSTEM_NODES) pushNode(s);

  // ==== 엣지 ====
  const orgById = new Map(organizations.map((o) => [o.id, o]));
  const memberIds = new Set(members.map((m) => m.id));

  // 소속(사람→조직) + 참여(사람→프로젝트)
  for (const o of organizations) {
    if (o.member_id && memberIds.has(o.member_id) && nodeIds.has(o.id)) {
      pushEdge(o.member_id, o.id, "소속");
    }
  }
  // 담당(조직→프로젝트) + 참여(회원 소속 조직의 회원→프로젝트)
  for (const d of dealRooms) {
    for (const orgId of d.participating_orgs) {
      if (!nodeIds.has(orgId)) continue;
      pushEdge(orgId, d.id, "담당");
      const mId = orgById.get(orgId)?.member_id;
      if (mId && memberIds.has(mId)) pushEdge(mId, d.id, "참여");
    }
  }

  // 생성(프로젝트→협업규약): G3 통과 시 실선(서명), 아니면 점선(준비/미체결)
  for (const d of dealRooms) {
    const signed = d.gate_status.G3.passed;
    pushEdge(
      d.id,
      PACT_ID,
      signed ? "생성(서명)" : "생성(준비)",
      signed ? "real" : "potential",
    );
    // 실행 단계 백오피스 연결 대기(잠재)
    if (signed) pushEdge(d.id, "SYS-BO", "사용(대기)", "potential");
  }

  // 근거(기회카드→격차 리포트, 문서→문서)
  for (const card of gapCards) pushEdge(`DOC-${card.id}`, REPORT_ID, "근거");

  // 발원(기회카드→프로젝트): source_ref가 해당 카드를 지목하면 잠재가 실제로 전환된 것 → 강조
  for (const d of dealRooms) {
    for (const card of gapCards) {
      if (d.source_ref.includes(card.id)) {
        pushEdge(`DOC-${card.id}`, d.id, "발원", "real", true);
      }
    }
  }

  // 사용(프로젝트→시스템): source_type으로 매핑
  const sysBySource: Record<string, string> = {
    핫리드: "SYS-REC",
    모임: "SYS-REC",
    격차기회카드: "SYS-MAP",
    외부공고: "SYS-RADAR",
    공고역방향: "SYS-RADAR",
  };
  for (const d of dealRooms) {
    const sys = sysBySource[d.source_type];
    if (sys) pushEdge(d.id, sys, "사용");
  }

  // 시스템 관계
  pushEdge("SYS-NARA", "SYS-RADAR", "공고 유입");
  pushEdge("SYS-CENTER", "SYS-RADAR", "공고 유입");
  pushEdge("SYS-MAP", REPORT_ID, "격차 분석");
  for (const aggId of aggIds) pushEdge("SYS-MAP", aggId, "발견");
  pushEdge("SYS-BO", PACT_ID, "규약 관리", "potential");

  // 딜룸 참여 회원 집합(전환 기회 판정 + 추천엔진 허브 산정에 사용)
  const dealMemberSets = dealRooms.map(
    (d) =>
      new Set(
        d.participating_orgs
          .map((oid) => orgById.get(oid)?.member_id)
          .filter((x): x is string => Boolean(x)),
      ),
  );
  const bothInSameDeal = (a: string, b: string) =>
    dealMemberSets.some((s) => s.has(a) && s.has(b));

  // 추천(사람↔사람) — 왕복 쌍 dedupe, 매칭유형 라벨. accepted면 실선, 아니면 점선.
  // 전환 기회(강조): 잠재 추천이면서 두 회원이 같은 딜룸에 공동 참여 → 성사되어가는 연결.
  const recDegree = new Map<string, number>();
  const seenPairs = new Set<string>();
  for (const re of recEdges) {
    if (!memberIds.has(re.from) || !memberIds.has(re.to)) continue;
    const key =
      re.rec_kind === "모듬"
        ? `mu:${re.from}->${re.to}`
        : [re.from, re.to].sort().join("~");
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    const pairAccepted =
      re.status === "accepted" ||
      recEdges.some(
        (x) =>
          x.rec_kind !== "모듬" &&
          [x.from, x.to].sort().join("~") === key &&
          x.status === "accepted",
      );
    const kind = pairAccepted ? "real" : "potential";
    const emphasis = kind === "potential" && bothInSameDeal(re.from, re.to);
    const label =
      re.rec_kind === "모듬" ? `${re.match_type}(모듬)` : re.match_type;
    pushEdge(re.from, re.to, label, kind, emphasis);
    recDegree.set(re.from, (recDegree.get(re.from) ?? 0) + 1);
    recDegree.set(re.to, (recDegree.get(re.to) ?? 0) + 1);
  }

  // 추천 생성(시스템→사람): 추천 연결이 가장 많은 상위 2인 허브에 엔진을 잇는다(파생값).
  const recHubs = [...recDegree.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);
  for (const hub of recHubs) pushEdge("SYS-REC", hub, "추천 생성");

  // ---- 방어적 정리 + 차수 집계 ----
  const validEdges = edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
  );
  const degree = new Map<string, number>();
  for (const e of validEdges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  for (const n of nodes) n.degree = degree.get(n.id) ?? 0;

  return {
    nodes,
    edges: validEdges,
    meta: {
      region: region.name,
      coveragePotential: region.coverage.potential,
      coverageActual: region.coverage.actual,
      coverageRate: region.coverage.rate,
    },
  };
}
