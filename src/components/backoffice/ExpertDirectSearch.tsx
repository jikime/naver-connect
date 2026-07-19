"use client";

// ExpertDirectSearch — 전문가를 카테고리·키워드로 직접 검색하고 연락하는 기능(FR-BO-07).
// 근거: ARCHITECTURE.md §5.2 getExpertServices, FR-BO-07
// 연락 CTA는 백엔드가 없는 목업이라 실제 발송 없이 연락 시트(Sheet) + mailto: 링크로만
// 동작한다(NFR-02) — members.json(비민감)에서 전문가 이름만 조회해 붙인다.

import { useState } from "react";
import { ExpertServiceCard } from "@/components/backoffice/ExpertServiceCard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import membersSeed from "@/data/members.json";
import { cn } from "@/lib/utils";
import type { ExpertService } from "@/types";

const ALL = "전체";

type MemberSeed = { id: string; name: string };
const members = membersSeed as MemberSeed[];

function ExpertContactAction({ service }: { service: ExpertService }) {
  const name =
    members.find((m) => m.id === service.expert_id)?.name ?? service.expert_id;
  const mockEmail = `${service.expert_id.toLowerCase()}@sen-ax-network.example`;
  const mailSubject = encodeURIComponent(
    `[백오피스 문의] ${name} 전문가 · ${service.category}`,
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm">연락하기</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>{name} 전문가에게 연락</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-4 text-sm">
          <p className="text-guud-text-muted-2">
            {service.category} · {service.profile_badge}
          </p>
          <p className="border border-dashed border-guud-text-faint px-2 py-1.5 text-xs text-guud-text-faint">
            목업 연락처: {mockEmail} (실제 발송 없음, 시연용)
          </p>
          <Button asChild size="sm">
            <a href={`mailto:${mockEmail}?subject=${mailSubject}`}>
              메일 앱으로 문의 작성
            </a>
          </Button>
          <SheetClose asChild>
            <Button size="sm" variant="outline">
              닫기
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ExpertDirectSearch({
  services,
}: {
  services: ExpertService[];
}) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>(ALL);

  const categories = [
    ALL,
    ...Array.from(new Set(services.map((s) => s.category))),
  ];

  const filtered = services.filter((service) => {
    if (category !== ALL && service.category !== category) {
      return false;
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      const haystack =
        `${service.category} ${service.certification} ${service.profile_badge} ${service.experience_tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(kw)) {
        return false;
      }
    }
    return true;
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-bold text-foreground">
        전문가 직접 검색
      </h2>
      <input
        type="search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="키워드로 검색 (예: 공모사업 정산, 정책분석)"
        className="h-10 w-full border border-transparent border-b-input bg-transparent px-0 py-1 text-base outline-none placeholder:text-muted-foreground focus-visible:border-b-ring"
        aria-label="전문가 키워드 검색"
      />
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="카테고리 필터"
      >
        {categories.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={category === option}
            onClick={() => setCategory(option)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              category === option
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-muted text-guud-text-muted-2",
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-guud-text-muted-2">
          조건에 맞는 전문가가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <div key={service.expert_id} className="flex flex-col gap-2">
              <ExpertServiceCard service={service} />
              <ExpertContactAction service={service} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
