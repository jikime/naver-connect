// DAL: 분야(Field) read — 회원 검색·모듬 목록의 분야 필터 드롭다운에 쓰는 8+확장5 분야 목록.
// 근거: ARCHITECTURE.md §4.2(Field), FR-SR-01, FR-MG-01. 비민감 시드라 마스킹 불필요.

import fieldsSeed from "@/data/fields.json";
import type { Field } from "@/types";

const seed = fieldsSeed as Field[];

/** 전 분야 목록(8+확장5). 필터 드롭다운 용도라 ViewerContext 불요 함수로 둔다(T-002 예외 허용). */
export async function getFields(): Promise<Field[]> {
  return seed;
}
