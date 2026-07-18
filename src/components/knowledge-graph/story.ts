// 기회 스토리 모드(#19) — "잠재→실제 전환"을 5단계로 재생하기 위한 프레임 모델.
// 근거: team-lead #19. 주인공 서사 = 박준호(M-002)↔김서연(M-001) 퍼즐형 핫리드가
// 만남으로 성사되어 케어안심주택 케어링크 딜룸(DR-01)의 씨앗이 되는 흐름.
// 모든 프레임은 실제 그래프(getKnowledgeGraph)에서 파생한다 — 새 데이터 창작 없음.

import type { KnowledgeGraph } from "@/types";

export interface StoryFrame {
  title: string;
  caption: string;
  revealNodes: Set<string>;
  revealEdges: Set<string>;
  /** 점선→실선으로 굳히는 엣지(만남 성사). */
  solidEdges: Set<string>;
  /** 레드 파티클이 흐르는 엣지(성사의 순간에만). */
  particleEdges: Set<string>;
  /** 관계명(매칭유형) 라벨을 노출할 엣지. */
  labelEdges: Set<string>;
  /** 강조(테두리) 노드 — 딜룸 승격 등. */
  focusNodes: Set<string>;
  /** 커버리지 카드 오버레이 노출(마무리). */
  showCoverage: boolean;
}

export interface Story {
  frames: StoryFrame[];
  protagonist: string;
}

const S = (arr: string[] = []) => new Set(arr);

export function buildStory(graph: KnowledgeGraph): Story {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const isMember = (id: string) => byId.get(id)?.type === "member";
  const memberIds = graph.nodes
    .filter((n) => n.type === "member")
    .map((n) => n.id)
    .sort();

  const recEdges = graph.edges.filter(
    (e) => isMember(e.source) && isMember(e.target),
  );
  const recEdgeIds = recEdges.map((e) => e.id);
  // 주인공 = 강조(전환 기회) 추천 엣지 = 박준호↔김서연 퍼즐형 핫리드.
  const protagonist = recEdges.find((e) => e.emphasis) ?? recEdges[0] ?? null;
  const realRecIds = recEdges.filter((e) => e.kind === "real").map((e) => e.id);

  const protaMembers = protagonist
    ? [protagonist.source, protagonist.target]
    : [];
  const protaMemberSet = new Set(protaMembers);
  // 주인공 회원의 소속 조직.
  const membershipEdges = graph.edges.filter(
    (e) => e.rel === "소속" && protaMemberSet.has(e.source),
  );
  const protaOrgs = new Set(membershipEdges.map((e) => e.target));

  const DR = "DR-01";
  const hasDeal = byId.has(DR);
  // 딜룸으로 향하는 엣지 중 주인공 회원/조직이 연결된 것만.
  const dealEdges = graph.edges.filter((e) => {
    const other =
      e.source === DR ? e.target : e.target === DR ? e.source : null;
    if (!other) return false;
    return protaOrgs.has(other) || protaMemberSet.has(other);
  });

  const protaEdgeId = protagonist ? [protagonist.id] : [];
  const dealSceneNodes = [...memberIds, ...protaOrgs, ...(hasDeal ? [DR] : [])];
  const dealSceneEdges = [
    ...protaEdgeId,
    ...membershipEdges.map((e) => e.id),
    ...dealEdges.map((e) => e.id),
  ];

  const frames: StoryFrame[] = [
    {
      title: "온보딩",
      caption: "8명의 기업가·전문가가 온보딩으로 네트워크에 들어옵니다.",
      revealNodes: S(memberIds),
      revealEdges: S(),
      solidEdges: S(),
      particleEdges: S(),
      labelEdges: S(),
      focusNodes: S(),
      showCoverage: false,
    },
    {
      title: "추천",
      caption:
        "추천엔진이 매칭유형(거울·퍼즐·다리·취미·선배)별로 연결을 제안합니다. 점선은 아직 성사되지 않은 잠재 연결입니다.",
      revealNodes: S(memberIds),
      revealEdges: S(recEdgeIds),
      solidEdges: S(),
      particleEdges: S(),
      labelEdges: S(recEdgeIds),
      focusNodes: S(),
      showCoverage: false,
    },
    {
      title: "만남 성사",
      caption:
        "박준호 ↔ 김서연 퍼즐형 핫리드가 만남으로 이어집니다. 점선이 실선으로 굳고, 성사의 순간 연결을 따라 붉은 흐름이 지납니다.",
      revealNodes: S(memberIds),
      revealEdges: S(recEdgeIds),
      solidEdges: S([...realRecIds, ...protaEdgeId]),
      particleEdges: S(protaEdgeId),
      labelEdges: S(protaEdgeId),
      focusNodes: S(protaMembers),
      showCoverage: false,
    },
    {
      title: "딜룸 씨앗 승격",
      caption:
        "성사된 연결이 '케어안심주택 케어링크' 딜룸의 씨앗으로 승격됩니다. 두 조직이 참여 조직으로 붙습니다.",
      revealNodes: S(dealSceneNodes),
      revealEdges: S(dealSceneEdges),
      solidEdges: S(protaEdgeId),
      particleEdges: S(),
      labelEdges: S(protaEdgeId),
      focusNodes: S(hasDeal ? [DR] : protaMembers),
      showCoverage: false,
    },
    {
      title: "마무리",
      caption:
        "이렇게 잠재 연결 하나가 실제 사업으로 바뀝니다. 이런 전환이 쌓여 한빛구의 연결 커버리지가 채워집니다.",
      revealNodes: S(dealSceneNodes),
      revealEdges: S(dealSceneEdges),
      solidEdges: S(protaEdgeId),
      particleEdges: S(),
      labelEdges: S(),
      focusNodes: S(hasDeal ? [DR] : protaMembers),
      showCoverage: true,
    },
  ];

  const protagonistLabel = protagonist
    ? `${byId.get(protagonist.source)?.label} ↔ ${byId.get(protagonist.target)?.label}`
    : "";

  return { frames, protagonist: protagonistLabel };
}
