import { Building2, Lightbulb, Users } from "lucide-react";

const FORMATION_PATHS = [
  {
    title: "공정한 다자 연결",
    description:
      "공공·중간지원 회원은 특정 1:1 대신 여러 참여자가 함께 만나는 모둠으로 추천돼요.",
    icon: Building2,
  },
  {
    title: "격차 카드에서 개설",
    description:
      "지역 생태계에서 발견한 연결 공백을 주제로, 필요한 분야의 회원을 모아요.",
    icon: Lightbulb,
  },
  {
    title: "회원 제안으로 개설",
    description:
      "공통 관심사나 기존 추천 대화가 발전하면 학습·취미 모둠으로 이어져요.",
    icon: Users,
  },
];

export function MeetupFormationGuide() {
  return (
    <section
      aria-labelledby="meetup-formation-title"
      className="rounded-2xl border border-guud-hairline bg-guud-header-band p-5 sm:p-6"
    >
      <div className="max-w-2xl">
        <p className="font-mono text-[0.625rem] font-medium tracking-[0.16em] text-guud-text-muted-2 uppercase">
          [ HOW GROUPS FORM ]
        </p>
        <h2
          id="meetup-formation-title"
          className="mt-2 font-heading text-2xl font-medium tracking-tight text-foreground"
        >
          모둠은 이렇게 만들어져요
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-guud-text-muted-2">
          현재는 아래 세 가지 개설 경로가 있고, 카드마다 어떤 경로로
          만들어졌는지 표시합니다.
        </p>
      </div>
      <ol className="mt-5 grid gap-3 lg:grid-cols-3">
        {FORMATION_PATHS.map((path, index) => {
          const Icon = path.icon;
          return (
            <li
              key={path.title}
              className="rounded-xl border border-guud-hairline bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="font-mono text-[0.625rem] font-medium tracking-[0.12em] text-guud-text-muted-2">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {path.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-guud-text-muted-2">
                {path.description}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
