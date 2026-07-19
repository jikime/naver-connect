"use client";

// MemberSearch — 회원 키워드 검색(v1.1 · 1-4, 신규 화면). 이름·조직·분야·공급 태그로 필터링한다.
// 근거: ARCHITECTURE.md §3(L2 MemberSearch), FR-SR-01/02
// 검색 결과는 searchMembers(DAL)가 이미 visibilityMask를 통과시켜 공개층만 담아 반환한다
// (BR-01, FR-GL-03) — 이 컴포넌트는 입력·렌더만 담당하고 별도 마스킹을 하지 않는다.

import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFields, searchMembers } from "@/lib/dal";
import { useViewerContext } from "@/stores/viewer-context";
import type { Field, MaskedMember } from "@/types";

export function MemberSearch() {
  const vc = useViewerContext();
  const [query, setQuery] = useState("");
  const [fieldId, setFieldId] = useState<number | "all">("all");
  const [fields, setFields] = useState<Field[]>([]);
  const [results, setResults] = useState<MaskedMember[] | null>(null);
  const fieldSelectId = useId();
  const queryInputId = useId();

  useEffect(() => {
    getFields().then(setFields);
  }, []);

  useEffect(() => {
    let cancelled = false;
    searchMembers(vc, query, fieldId === "all" ? undefined : fieldId).then(
      (result) => {
        if (!cancelled) setResults(result);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [vc, query, fieldId]);

  const fieldName = (id: number) =>
    fields.find((f) => f.id === id)?.name ?? `분야 #${id}`;

  return (
    <div className="space-y-6 px-[30px] py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label
            htmlFor={queryInputId}
            className="mb-1 text-xs font-semibold text-guud-text-muted-2"
          >
            이름·조직·키워드로 검색
          </Label>
          <Input
            id={queryInputId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 재가돌봄, 사회주택, 김서연"
          />
        </div>
        <div>
          <Label
            htmlFor={fieldSelectId}
            className="mb-1 text-xs font-semibold text-guud-text-muted-2"
          >
            분야
          </Label>
          <Select
            value={String(fieldId)}
            onValueChange={(v) => setFieldId(v === "all" ? "all" : Number(v))}
          >
            <SelectTrigger id={fieldSelectId} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 분야</SelectItem>
              {fields.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {results === null ? (
        <p className="text-sm text-guud-text-muted-2">검색 중입니다…</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-guud-text-muted-2">
          조건에 맞는 회원이 없습니다.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case">
                    {member.member_type}
                  </Badge>
                  {member.field_tags.map((id) => (
                    <Badge
                      key={id}
                      className="rounded-full border border-border bg-background px-2.5 py-0.5 font-semibold tracking-normal text-guud-text-muted-2 normal-case"
                    >
                      {fieldName(id)}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="text-base normal-case tracking-normal">
                  {member.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-guud-text-muted-2">
                <p>
                  {member.org.name} · {member.region.sido}{" "}
                  {member.region.sigungu}
                </p>
                {member.visibility.public.supply_tags[0] && (
                  <p>공급: {member.visibility.public.supply_tags[0].detail}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
