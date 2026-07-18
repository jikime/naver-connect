// GovernancePrincipleBanner — 3단계 협업 거버넌스 원칙 배너(BR-13, FR-BO-05).
// 근거: PRD.md FR-BO-05·BR-13 원문("네트워크는 지분 없는 지원자·백오피스는 전문가 회원 공급·
// 모든 유료화는 무료 검증 후 도입·이해충돌 공시 의무"), TASKS.md T-008/T-020/T-021
// 백오피스 마켓·딜룸 보드 화면에 안내 배너로 표기한다(정적 텍스트, 인터랙션 없음).

const PRINCIPLES = [
  "네트워크는 지분 없는 지원자입니다.",
  "백오피스는 전문가 회원이 직접 공급합니다.",
  "모든 유료화는 무료 검증을 거친 뒤에만 도입합니다.",
  "이해충돌은 공시 의무를 따릅니다.",
];

export function GovernancePrincipleBanner() {
  return (
    <div className="border border-guud-hairline bg-muted px-4 py-3 text-xs text-guud-text-muted-2">
      <p className="mb-1 font-semibold text-foreground">
        3단계 협업 거버넌스 원칙
      </p>
      <ul className="list-disc space-y-0.5 pl-4">
        {PRINCIPLES.map((principle) => (
          <li key={principle}>{principle}</li>
        ))}
      </ul>
    </div>
  );
}
