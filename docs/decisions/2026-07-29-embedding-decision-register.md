---
schema_version: shuzzi-md/v1
doc_kind: narrative_note
project_slug: hackathon-naverconnect
created_at: 2026-07-29T11:35:00+09:00
updated_at: 2026-07-29T11:35:00+09:00
timezone: Asia/Seoul
status: recommended_defaults
---

# Naver Connect DB 연결·임베딩 결정 기록

## 0. 결정 원칙

추천의 단위는 막연한 사람 순위가 아니라 `사람 + 함께 이야기하거나 실행할 구체적인 활동 주제`다. 클릭보다 양측 수락, 만남, 30/90일 내 협업 시작을 우선한다.

## 1. 권고 기본값

| ID | 결정 | 기본값 | 변경 조건 |
|---|---|---|---|
| D-01 | 첫 추천 단위 | 사람 3명 + 각 사람과의 활동/대화 주제 | 사용자 검증에서 주제 없는 카드 선호가 명확할 때 |
| D-02 | 원천 전환 | M0~M3 JSON-first, M4 승인 후 Supabase | JSON/DB dual-read parity와 RLS 검증 완료 |
| D-03 | 외부 블로그 반입 | 소유자 제공 export/API + 사용 허가만 | Naver/소유자가 별도 자동 접근을 명시 허가 |
| D-04 | 외부 인물의 추천 자격 | evidence/operator search only | 해당 인물이 discoverability·matching consent를 직접 승인 |
| D-05 | 임베딩 공간 | evidence와 people matching 분리 | 평가에서 통합 공간의 우위와 누출 없음이 입증 |
| D-06 | M2 모델 | `nlpai-lab/KURE-v1` 한국어 1순위, `BAAI/bge-m3` 다국어 기준선; 둘 다 1024-d normalized cosine, shadow only | 동일 gold set의 품질·비용·지연 비교 |
| D-07 | 검색 | taxonomy/exact + lexical + dense + org graph를 RRF 후 rerank | ablation에서 불필요한 채널이 확인될 때 |
| D-08 | 현재 규모 인덱스 | 8명 전수 exact cosine, HNSW 없음 | match document가 수만 건으로 증가 |
| D-09 | 사람 벡터 단위 | 사람 1벡터 금지; activity/need/offer/impact/experience별 문서 | 없음 |
| D-10 | 외부 근거 영향 | 미확인 0점, 운영자 확인 후 capped evidence boost | 본인 확인 시 canonical match document로 승격 |
| D-11 | entity link | stable ID 또는 독립 근거 2개 + 충돌 없음; fuzzy는 검수 | 없음 |
| D-12 | 현재 활동 추론 | 블로그 경력에서 Need/activity/availability 자동 추론 금지 | 본인 확인 |
| D-13 | 공개 기본값 | 활동 주제·대략 지역 공개 선택 가능; Need·capacity·정확 일정 matching-private | 본인의 목적별 동의 변경 |
| D-14 | UI | 기존 `/profile`을 활동 중심으로 확장하고 관계 경로 drawer 추가 | 사용성 테스트 |
| D-15 | 용어 | 사회혁신활동가·사회혁신지원가 preferred, change history 유지 | vocabulary release 승인 |
| D-16 | 로그인 데이터 모드 | `APP_MODE=demo|pilot`, `DATA_SOURCE=json|db` 명시; silent persona fallback 금지 | 없음 |

## 2. 온보딩 최소 입력 권고

완료를 위해 네 개의 장문을 강제하지 않는다.

1. `activity_intent` 1개 — 앞으로 30~90일 안에 해보고 싶은 활동
2. 연결 방향 — `도움이 필요함 / 보탤 수 있음 / 둘 다`
3. 선택한 방향의 `need_intent` 또는 `capability_offer` 1개
4. 기간·지역·온/오프라인·capacity
5. 공개·매칭·임베딩 목적별 동의

반대 방향과 경험 근거는 추천 미리보기를 본 뒤 adaptive 질문으로 보강한다. 경험이 없다는 이유로 가입을 막지 않되, 근거 부족을 추천 설명에서 숨기지 않는다.

## 3. canonical schema

### 사람·조직

- `people`
- `organizations`
- `affiliations`
- `role_assertions`
- `entity_aliases`

### 현재 의향과 근거

- `impact_intents`
- `activity_intents`
- `activity_requirements`
- `activity_contributions`
- `need_intents`
- `capability_offers`
- `experiences`
- `experience_skills`
- `collaboration_preferences`

### 외부 자료 staging

- `source_authorizations`
- `source_artifacts`
- `source_documents`
- `source_chunks`
- `entity_mentions`
- `entity_link_candidates`
- `entity_link_decisions`
- `profile_claims`

### 추천·임베딩

- `match_documents`
- `embedding_spaces`
- `embedding_records`
- `recommendation_runs`
- `recommendation_candidates`
- `recommendation_exposures`
- `introduction_requests`
- `meeting_outcomes`
- `collaboration_outcomes`

### 동의·안전·변경 이력

- `consent_records`
- `profile_revisions`
- `blocks`
- `deletion_requests`
- `term_concepts`
- `term_label_revisions`
- `vocabulary_releases`
- `vocabulary_change_events`

## 3.1 파싱·청킹 결정

입력 종류에 따라 처리한다.

| 입력 | 파싱 | 청킹 |
|---|---|---|
| activity/need/offer/impact/experience 구조화 레코드 | 코드·용어 정규화와 안전 템플릿만 | 하지 않음. 한 레코드가 한 `MatchDocument` |
| organizations/collab_cases 구조화 DB | stable ID·관계·기간 정규화 | 자유서술 evidence만 선택적으로 |
| 소유자 제공 JSON/HTML | post 경계·제목·날짜·소제목·본문 추출, 연락처 선제 제거 | 소제목/문단 의미 경계 우선 |
| 소유자 제공 PDF | post 경계 복원, 반복 header/footer 제거, OCR 여부·페이지 provenance 기록 | section 우선, 긴 section만 token fallback |

외부 근거 문서의 초기 규칙:

1. 한 게시물은 하나의 `source_document`
2. 소제목과 문단 묶음은 하나의 `source_chunk`
3. section이 길면 KURE tokenizer 기준 450~700 token, overlap 80 token
4. 표·목록은 행/항목 경계를 보존
5. 모든 chunk에 `document_id`, heading path, page/span, redaction version, chunker version, content hash 상속
6. LLM 추출 결과는 `profile_claims.status=proposed`; 원문 대체 금지

KURE-v1과 BGE-M3가 8192 token을 지원하더라도 문서 전체를 한 벡터로 만들지 않는다. 청킹 목적은 모델 한계 회피보다 검색 정밀도, 인용 근거, 부분 수정·철회·삭제다.

## 4. 임베딩 입력 템플릿

이름·연락처·정확 위치·정확 일정은 넣지 않는다.

```text
activity_intent:
[해보고 싶은 활동] {safe_match_text}
[만들고 싶은 변화] {impact codes/text}
[대상] {population codes}
[방식] {action/mode codes}
[기간] {horizon bucket}
[원하는 역할] {desired role codes}
```

```text
need_query:
[활동] {activity title}
[필요] {safe_match_text}
[분야] {topic codes}
[필수 조건] embedding 제외, structured hard filter로 처리
```

```text
offer_candidate:
[보탤 수 있는 것] {safe_match_text}
[역량·자원] {skill/resource codes}
[근거] {approved experience safe summaries}
[수용량] embedding 제외, structured gate로 처리
```

```text
experience_evidence:
[문제] {safe problem summary}
[역할과 행동] {safe action summary}
[협업 상대 유형] {collaborator type codes}
[결과] {safe outcome summary}
```

## 5. 점수 기본형

```text
forward(A,B) = A.activity requirements/needs → B.offers + B.evidence
reverse(A,B) = B.activity requirements/needs → A.offers + A.evidence

reciprocal = combine(forward, reverse)
combine ∈ {minimum, harmonic mean, geometric mean}

pair_score =
  reciprocal
  × capacity_gate
  × feasibility_gate
  + activity/impact alignment
  + organization graph evidence
  + freshness/diversity/fairness adjustment
```

멘토링·기부·전문 자문처럼 의도적으로 비대칭인 연결은 reverse need를 강제하지 않는다. 대신 제공자의 명시적 participation intent와 기대효과를 사용한다.

## 6. 지금 사용자 확인이 필요한 두 가지

1. 블로그 소유자가 `사혁넷 사람들`의 PDF/CSV/JSON/HTML을 제공하고 내부 검색·임베딩·보존·삭제 범위를 승인할 수 있는가?
2. 첫 relevance 평가에 참여할 실제 동의 사용자 10~20명은 누구인가? 현재 8명 JSON seed는 통합·회귀 테스트에는 쓸 수 있지만 실제 추천 품질 판단을 대신할 수 없다.

두 답이 오기 전에도 M0/M1 구조화 baseline, 평가 harness, 활동 중심 프로필 목업은 진행할 수 있다. 외부 corpus ingestion과 production embedding만 보류한다.

## 7. 로그인 이후 데이터 제공 계약

현행 해커톤 UI는 인증·회원 데이터가 아니라 demo session이다.

- demo 기업가 → `M-001`
- demo 전문가 → `M-005`
- demo 운영자 → `OPERATOR`
- 신규 가입 기업가도 `M-001`, 신규 가입 전문가도 `M-005`로 연결
- 로그인 상태와 onboarding 완료 여부는 browser localStorage에만 보존
- 추천·프로필은 JSON seed와 session override를 DAL이 반환

pilot 전환 규칙:

1. Supabase Auth `user.id`와 `people.auth_user_id`를 1:1로 연결
2. 신규 가입자는 빈 `people` + onboarding draft를 만들고 기존 seed persona를 절대 상속하지 않음
3. onboarding confirmation 후 profile revision과 match documents 생성
4. `APP_MODE=demo`에서만 demo 계정과 persona switch 허용
5. `APP_MODE=pilot`에서 server session·RLS·본인 person ID만 사용
6. `DATA_SOURCE=db`의 0 rows는 정상 empty state이며 JSON fallback 조건이 아님
