// DAL: people 도메인 read — Need(민감)/Offer(공개)/ImpactIntent(공개)/Consent(민감).
// needs·consents 민감 시드의 유일 import 지점은 이 파일과 people-engine.ts(비배럴)뿐이다(ADR-03, T-005).
// Need는 본인·운영자 외에는 반환하지 않는다(visibilityMask와 동일 규칙 — isPrivilegedViewer 재사용).
// 근거: plans/generic-mixing-seahorse.md M0-4, people_match_retrieval_plan.md §4.1, ARCHITECTURE.md §5.2 DAL 계약

import { isPrivilegedViewer } from "@/lib/access/visibility-mask";
import { getDataset } from "@/lib/dal/datasets";
import type {
  CapabilityOfferV1,
  ConsentRecordV1,
  ImpactIntentV1,
  NeedIntentV1,
  ViewerContext,
} from "@/types";

/** 공개 Offer 전건 — 마스킹 불요(공개층). */
export async function getCapabilityOffers(
  _vc: ViewerContext,
): Promise<CapabilityOfferV1[]> {
  return getDataset<CapabilityOfferV1[]>("capability-offers");
}

/** 공개 ImpactIntent 전건 — 거울형(공통점) 축의 원천. */
export async function getImpactIntents(
  _vc: ViewerContext,
): Promise<ImpactIntentV1[]> {
  return getDataset<ImpactIntentV1[]>("impact-intents");
}

/**
 * Need 조회 — 본인 것만, 운영자는 전체. 그 외 뷰어에게는 빈 배열(민감층 fail-closed).
 * 엔진의 전건 접근은 배럴 밖 people-engine.ts를 사용한다.
 */
export async function getNeedIntents(
  vc: ViewerContext,
): Promise<NeedIntentV1[]> {
  const needs = await getDataset<NeedIntentV1[]>("people-needs");
  if (vc.role === "운영자") return needs;
  return needs.filter(
    (n) => n.owner.kind === "person" && isPrivilegedViewer(vc, n.owner.id),
  );
}

/** 본인(또는 운영자가 지정한 회원)의 동의 영수증. */
export async function getConsentRecords(
  vc: ViewerContext,
  personId?: string,
): Promise<ConsentRecordV1[]> {
  const consents = await getDataset<ConsentRecordV1[]>("people-consents");
  const target = personId ?? vc.personaId;
  if (!isPrivilegedViewer(vc, target)) return [];
  return consents.filter((c) => c.person_id === target);
}
