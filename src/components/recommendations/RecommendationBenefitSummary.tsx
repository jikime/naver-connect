import type { Recommendation } from "@/types";

interface Props {
  recommendation: Recommendation;
  reasonKeywords?: string[];
  compact?: boolean;
}

export function RecommendationBenefitSummary({
  recommendation,
  reasonKeywords = [],
  compact = false,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-guud-hairline bg-background">
      <div className="grid divide-y divide-guud-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <section className={compact ? "p-3" : "p-4"}>
          <h3 className="font-mono text-[0.625rem] font-medium tracking-[0.12em] text-guud-text-muted-2 uppercase">
            나에게 좋은 이유
          </h3>
          <p className="mt-2 text-sm leading-6 text-foreground">
            {recommendation.message.your_benefit}
          </p>
        </section>
        <section className={compact ? "p-3" : "p-4"}>
          <h3 className="font-mono text-[0.625rem] font-medium tracking-[0.12em] text-guud-text-muted-2 uppercase">
            상대에게 좋은 이유
          </h3>
          <p className="mt-2 text-sm leading-6 text-foreground">
            {recommendation.message.their_benefit}
          </p>
        </section>
      </div>

      {reasonKeywords.length > 0 && (
        <section
          className={`border-t border-guud-hairline ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-mono text-[0.625rem] font-medium tracking-[0.12em] text-guud-text-muted-2 uppercase">
              연결 근거
            </h3>
            {reasonKeywords.slice(0, 5).map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
              >
                {keyword}
              </span>
            ))}
          </div>
        </section>
      )}

      <section
        className={`border-t border-guud-hairline bg-muted ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}
      >
        <h3 className="font-mono text-[0.625rem] font-medium tracking-[0.12em] text-guud-text-muted-2 uppercase">
          첫 대화 주제
        </h3>
        <p className="mt-1.5 text-sm leading-6 font-medium text-foreground">
          {recommendation.message.first_action}
        </p>
      </section>
    </div>
  );
}
