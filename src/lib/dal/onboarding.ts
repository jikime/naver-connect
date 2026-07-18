// DAL: 온보딩 read — 12태그·정적 인터뷰 스크립트(비민감 시드).
// 근거: ARCHITECTURE.md §5.2, FR-ON-06, FR-DA-03
// vc 불요 함수는 §5.2 각주대로 첫 인자 ViewerContext 예외를 허용한다(공개 참조 데이터라 마스킹 대상 아님).

import interviewScriptsSeed from "@/data/interview_scripts.json";
import tagsSeed from "@/data/tags.json";
import type {
  InterviewScript,
  InterviewScriptsSeed,
  OnboardingScriptMeta,
  Tag,
} from "@/types";

const tags = tagsSeed as Tag[];
const scripts = interviewScriptsSeed as InterviewScriptsSeed;

/** 12태그 전건(FR-DA-03). */
export async function getTags(): Promise<Tag[]> {
  return tags;
}

/** 태그별 온보딩 후속질문(FR-ON-06). */
export async function getInterviewScript(
  tagId: number,
): Promise<InterviewScript> {
  const script = scripts.scripts.find((s) => s.tag_id === tagId);
  if (!script) {
    throw new Error(`InterviewScript not found for tag_id: ${tagId}`);
  }
  return script;
}

/** 핫리드 심화질문·민감정보 고지·클로징·LLM 교체 노트(FR-ON-05/07/10). */
export async function getOnboardingMeta(): Promise<OnboardingScriptMeta> {
  return scripts.meta;
}
