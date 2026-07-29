---
schema_version: shuzzi-md/v1
doc_kind: narrative_note
project_slug: hackathon-naverconnect
created_at: 2026-07-29T11:05:48+09:00
updated_at: 2026-07-29T11:36:00+09:00
timezone: Asia/Seoul
status: proposed_for_joint_approval
---

# Naver Connect 사람↔사람 추천검색·Supabase·임베딩 스키마 계획

## 0. 목표

최적화 대상은 프로필 조회나 클릭률이 아니다.

> 한 사람이 받은 첫 세 추천 안에서, 양쪽 모두 만나고 싶고 실제 대화·협업으로 이어지는 연결을 최소 한 건 만드는 것.

따라서 `A가 B를 좋아할 확률`만 계산하지 않고 아래를 모두 계산한다.

1. A의 현재 Need를 B의 Offer가 얼마나 해결하는가
2. B의 현재 Need를 A의 Offer가 얼마나 해결하는가
3. 두 사람이 실제로 참여할 수 있는가
4. 왜 양쪽에 이익인지 저장된 근거로 설명할 수 있는가
5. 특정 인기 회원에게 노출이 몰리지 않는가

## 1. 2026-07-29 실제 데이터 인벤토리

Supabase service role REST를 이용해 행 값은 출력하지 않고 테이블·컬럼·비식별 집계만 확인했다.

| 데이터 | Supabase | JSON | 현재 추천 활용 |
|---|---:|---:|---|
| 개인 profile | 3 | 회원 8 | DB profile은 `id/name/role`뿐이고 JSON ID와 교집합 0. 현재 매칭에는 부적합 |
| 회원↔조직 연결 | 조직 row 중 member_id 8 | affiliation_org_id 8 | 8명 전원이 DB 조직과 연결 가능 |
| 조직 | 80 | 80 | 소속·생태계 맥락 feature |
| 조직 관계 | 60 | 60 | 실제 40, 가설 20. graph proximity와 연결 유형 feature |
| 협업 사례 | 40 | 40 | 완료 27, 진행 중 13. 경험·근거 후보 |
| subgroup | 80 | 80 | 기존 A/B/C 분류. 표시 용어는 versioned vocabulary로 교체 |
| 개인 추천 이력 | 없음 | 11 | regression smoke 및 피드백 schema seed |
| match score | 없음 | JSON | 현행 keyword baseline |
| 태그 | 없음 | 12 | 초기 local taxonomy |
| project proposal | 0 | seed 존재 | 향후 협업 결과 연결 |

조직 구성은 사회적경제 45, 영리플랫폼 14, 중간지원 13, 공공 8이다. 관계 유형은 자원공유·서비스결합·역량강화·금융연계·정책연구·경험이전 등 14종이다.

결론:

- 다음 UI는 Supabase의 80개 조직·60개 관계·40개 사례를 생태계 맥락으로 실제 활용할 수 있다.
- 개인 매칭의 핵심 Need/Offer/경험/가용성은 아직 JSON에만 있고 충분하지 않다.
- Supabase의 기존 `profile` 3행은 소유권과 의미를 확인하기 전 신규 people schema에 자동 병합하지 않는다.
- DB write와 migration은 유효한 target 확인과 사용자 승인 전 수행하지 않는다.

### 1.1 현행 레포의 자기소개와 추천 엔진

#### 자기소개 저장 여부

- Supabase `profile`은 3행이며 컬럼은 `id`, `name`, `role`, `created_at`뿐이다. 자기소개·mission·경험 컬럼은 없다.
- `src/data/members.json`에는 8명 각각의 `mission_statement`가 있고 프로필 화면이 이를 표시한다. 이는 DB가 아니라 공개 JSON seed다.
- 온보딩 UI는 mission, Need/Offer, 후속 인터뷰 등을 draft에서 받지만 `handleFinalize`가 mission·조직·지역·trust·readiness·availability를 `OnboardingFinalizeInput`에 전달하지 않는다.
- 더 근본적으로 `finalizeOnboarding(vc, _profile)`은 `_profile`을 사용하지 않고 Zustand 세션의 완료 boolean만 변경한다. 새로고침하면 사라지며 DB·JSON 어느 쪽에도 저장되지 않는다.

따라서 현재는 “자기소개가 DB에 저장되어 있다”고 볼 수 없다. `mission_statement`는 seed copy이고 온보딩에서 사용자가 수정한 내용도 영속화되지 않는다.

#### 추천 방식

1. `src/data/private/recommendations.json`의 수동 작성 추천 11건을 읽는다.
2. 현재 persona에게 수신된 추천만 필터한다. 공공중간지원 subtype은 1:1을 제거하고 모듬만 남긴다.
3. `match_scores.json`의 56개 방향성 pair에서 shared/complementary keyword를 읽는다.
4. 운영자 세션 가중치로 `40 + keyword weight 합 × 12`를 계산하고 0~100으로 clamp한다.
5. 공통점 그룹은 점수 내림차순, 차이점 그룹은 `hot_lead && 퍼즐형`을 먼저 놓고 이후 점수순으로 정렬한다.
6. 화면은 각 그룹 최대 15건, 처음 5건을 보여준다.
7. A→B와 B→A가 각각 별도 authored record이지만, 두 방향 점수를 결합한 reciprocal 계산은 없다.
8. 거절·후기·운영자 승인·가중치 변경은 세션 store에만 남고 실제 학습·DB write는 없다.

현재 사람 추천에는 Supabase의 organizations/collab_relations/collab_cases를 사용하지 않으며 embedding·FTS·graph candidate generation도 없다.

### 1.2 Supabase 콘텐츠와 외부 Naver 블로그

처음 인벤토리에서는 사람 추천 관련 6개 테이블만 확인해 콘텐츠 계열을 누락했다. 추가 확인 결과:

- `content_item` 4건: 연대경제·사회적금융 관련 topic, 3건 partially_published·1건 review
- `asset` 72건: card 36, caption 16, blog 4, reels/shorts/alt/credit 각 4
- blog asset 4건은 `meta.title`, `meta.body`를 가지며 본문 길이는 1,273~2,693자
- `channel_status` 20건: Instagram·YouTube·Facebook·Naver 발행 흐름
- `audit_log` 95건: approved/published/edit/inbox_ingest 등 콘텐츠 운영 이력

그러나 이것은 현재 확인 가능한 범위에서 **회원 블로그 크롤링 corpus가 아니라 별도 콘텐츠 제작·발행 파이프라인**이다.

- blog asset에 `source_url`, `author`, `person_id`, `member_id`가 없다.
- `content_item`과 Naver Connect 회원·조직을 잇는 foreign key가 없다.
- 현재 repo에는 `content_item`/`asset`을 읽는 DAL이나 blog crawler/import 코드가 없다.
- REST OpenAPI에 crawler/ingest RPC도 노출돼 있지 않다.

따라서 이 4개 blog body는 사람 추천 embedding에 사용하면 안 된다.

이후 사용자가 외부 원천으로 [사회혁신기업가네트워크 Naver 블로그](https://m.blog.naver.com/sociallnnovation?tab=1)를 제공했다. 공개 페이지를 수동 표본 확인한 결과 전체 611개 글, `사혁넷 사람들` 카테고리 522개이며 사람 소개와 조직 소개가 섞여 있다. 최신·중간·과거 표본에는 이름·직함·소속, 전문성, 해결하려는 사회문제, 프로젝트·정책·교육 경험과 결과가 있어 `experience_evidence`, `capability_offer`, `impact_context`, `organization_context`의 외부 근거 후보가 될 수 있다.

단, [Naver Blog robots.txt](https://blog.naver.com/robots.txt)는 AI training/RAG 목적의 bot 접근을 명시적으로 금지하고 일반 agent에도 `PostList.naver/nhn` 등을 차단한다. 따라서 임베딩 목적의 자동 크롤링·우회 수집은 하지 않는다.

허용된 반입 경로는 다음으로 제한한다.

1. 블로그 소유자가 직접 제공한 export/원본 파일
2. 소유자 또는 Naver가 명시적으로 허용한 API
3. 권리·사용 범위가 확인된 별도 DB/bucket

반입 후에도 외부 서술을 사람의 현재 자기진술로 덮어쓰지 않는다.

```text
source_documents
  → extracted_entity_mentions
  → entity_link_candidates
  → operator/user confirmation
  → profile claims + evidence pointers
  → approved match documents + embeddings
```

`source_document_id`, 원문 URL, 발행일, content hash, 추출기·모델 버전, DB entity link 방식과 confidence, 승인자를 남긴다. 과거 경력·전문성은 근거 후보로 쓸 수 있지만 현재 Need, activity intent, availability는 반드시 본인에게 다시 확인한다.

현재 JSON/DB seed 8명의 이름·소속과 공개 블로그 표본의 이름·소속에는 exact match가 없었다. 현행 seed와 블로그 인물을 같은 사람이라고 가정하면 안 된다. 블로그 인물은 우선 `external_person_candidate`이며, 플랫폼 회원으로 추천하려면 본인의 discoverability·matching consent와 안정적인 entity link가 추가로 필요하다.

### 1.3 현재 조직 그래프로 만들 수 있는 사람 후보

`organizations.member_id`가 있는 8개 조직을 사람의 affiliation으로 보고, DB 관계만으로 비식별 전수 계산했다.

| 신호 | 사람 pair 수 |
|---|---:|
| 전체 가능한 8명 조합 | 28 |
| 두 회원 소속 조직 간 직접 relation | 4 |
| 그중 `is_actual=true` | 2 |
| 조직 관계 2-hop 이내 | 3 |
| 같은 collab case 참여 | 2 |
| organization field tag 교집합 | 9 |
| 위 신호 합집합 | 14 |

이것만으로 첫 DB-only 후보 생성은 가능하다. 단 의미를 구분해야 한다.

- `is_actual=true` 또는 과거 공동사례: 새 사람 추천보다 **기존 관계 재연결/확장** 후보
- `is_actual=false`: 데이터가 가정한 잠재 관계. **운영자 검토 전 사실처럼 표시 금지**
- 2-hop: “아는 사람”이 아니라 **조직 생태계상 두 단계 경로**
- field overlap: 공통 관심 맥락이지 상호이익의 증거는 아님

DB-only baseline은 신규 연결과 관계 강화 두 트랙으로 분리한다.

```text
신규 연결
  = actual direct/case co-participation 제외
  + 잠재 relation
  + 2-hop path
  + field/value-chain complement

관계 강화
  = actual direct relation
  + prior collab case
  + 새로운 Need/Offer가 생긴 pair
```

## 2. 보통 추천검색은 어떻게 구성하는가

대규모 추천은 보통 후보 생성과 랭킹을 분리한다. Google의 YouTube 추천 논문과 TensorFlow Recommenders 문서도 `candidate generation/retrieval → ranking`의 2단 구조를 사용한다.

- [Google — Deep Neural Networks for YouTube Recommendations](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/)
- [TensorFlow Recommenders — Retrieval](https://www.tensorflow.org/recommenders/api_docs/python/tfrs/tasks/Retrieval)

사람 추천은 여기에 양방향성이 추가된다.

- LinkedIn PYMK는 공통 연결, 소속·기간·거리 등 여러 feature로 두 사람이 알 가능성을 분류한다. 우리 서비스는 “아는 사람”이 아니라 “서로에게 유익한 새 협업”을 찾아야 하므로 graph proximity는 보조 feature로만 쓴다.
- Reciprocal recommender 연구는 양쪽 수락이 있어야 match가 성립하므로 단방향 Precision/NDCG만으로 평가하면 부족하다고 본다.
- 추천 이유도 “내게 왜 좋은가”만이 아니라 “상대에게 왜 좋은가”를 함께 설명해야 수락 비용이 큰 상황에서 효과가 좋았다.
- 노출을 match 수만으로 최적화하면 인기 회원에게 기회가 몰릴 수 있으므로 양쪽 coverage와 fairness가 필요하다.

근거:

- [LinkedIn Engineering — People You May Know](https://engineering.linkedin.com/teams/data/artificial-intelligence/people-you-may-know)
- [KDD 2024 — Revisiting Reciprocal Recommender Systems](https://arxiv.org/abs/2408.09748)
- [Reciprocal Explanations](https://arxiv.org/abs/1807.01227)
- [RecSys 2024 — Fair Reciprocal Recommendation](https://arxiv.org/abs/2409.00720)

### Naver Connect 권장 파이프라인

```text
0. eligibility / safety hard filters
   ↓
1. 후보 생성
   exact taxonomy
   + PostgreSQL full-text
   + dense embedding
   + organization/collaboration graph
   ↓ union + Reciprocal Rank Fusion
2. 방향별 점수
   A.need → B.offer
   B.need → A.offer
   shared impact / experience / org context
   ↓
3. reciprocal pair score
   min / geometric / harmonic 비교
   × capacity × feasibility
   ↓
4. reranking
   freshness + diversity + exposure fairness + repeat suppression
   ↓
5. evidence-grounded explanation
   ↓
6. 운영자 검토 후 첫 3명
```

Supabase는 `tsvector + pgvector + RRF` hybrid search의 공식 예제를 제공한다. BGE-M3도 dense+sparse+multi-vector와 retrieval 후 reranking을 권장한다.

- [Supabase Hybrid Search](https://supabase.com/docs/guides/ai/hybrid-search)
- [Supabase Semantic Search](https://supabase.com/docs/guides/ai/semantic-search)
- [BAAI BGE-M3 model card](https://huggingface.co/BAAI/bge-m3)

## 3. 추천을 위해 추가로 받아야 하는 데이터

### 3.1 필수 온보딩 — 첫 추천이 가능한 최소 단위

| 수집 항목 | 질문/형태 | 추천에서의 용도 |
|---|---|---|
| 현재 Need 1개 | “앞으로 30~90일 안에 누구와 무엇을 풀고 싶은가?” | A→B query |
| 현재 Offer 1개 | “지금 실제로 보탤 수 있는 전문성·자원·연결은?” | candidate document |
| 경험 1개 | “비슷한 문제를 누구와 어떻게 풀었고 무엇이 달라졌나?” | 실행 가능성·근거 |
| impact intent | 만들고 싶은 변화, 대상, 접근 방식 | 거울형 공통점 |
| activity intent 1개 | “앞으로 30~90일 안에 직접 해보고 싶은 사회혁신 활동은?” | 구체적인 만남 주제·공동행동 anchor |
| 협업 조건 | 지역, 언어, 온/오프라인, 기간 | required/preferred/open filter |
| capacity | 지금 가능/제한/중단, 동시 협업 수 | hard gate |
| 연결 방식 | 상담, 멘토링, 공동기획, 자원공유 등 | interaction fit |
| acting capacity | 개인 / 조직 구성원 / 조직 대표 | 소개 권한 |
| 공개·매칭 동의 | 목적별 receipt | eligibility와 privacy |

역할명 하나로 Need/Offer 방향을 추론하지 않는다. 사회혁신활동가도 Offer를 가질 수 있고 사회혁신지원가도 Need를 가질 수 있다.

`impact_intent`, `activity_intent`, `need_intent`, `capability_offer`는 합치지 않는다.

- impact: 왜 하는가 — “지역 돌봄 격차를 줄이고 싶다”
- activity: 가까운 시기에 무엇을 해보고 싶은가 — “가을에 주민 주도 돌봄 실험을 열고 싶다”
- need: 실행에 무엇이 부족한가 — “공간과 참여자 모집 파트너가 필요하다”
- offer: 상대에게 무엇을 보탤 수 있는가 — “워크숍 설계와 퍼실리테이션이 가능하다”

활동 의향은 영구 프로필이 아니라 시점이 있는 상태다. `idea → planning → recruiting → active → paused/completed`를 기록하고 유효기간이 지난 의향은 자동 추천에서 제외한다.

### 3.2 대화에서 풍부하게 추출하되 확인받을 항목

- skills: category → competency → activity, 숙련도·최근성·근거
- experiences: 역할, 문제, 행동, 협업 상대 유형, 결과, 시기
- impact: 대상, 지역, desired outcome, 접근 방식
- needs: 단기 요청과 장기 목표, 긴급도·구체성·유효기간
- offers: 제공 가능 자원, 과거 사례, 수용량
- collaboration style: 속도, 의사결정, 커뮤니케이션, 갈등 처리

모든 AI 추출값은 다음 provenance를 가진다.

```ts
interface ExtractedField<T> {
  value: T;
  source_ref: string;
  source_span?: { start: number; end: number };
  confidence: number;
  extracted_by: { provider: string; model: string; prompt_version: string };
  visibility: "public" | "matching_private" | "system_private";
  user_confirmed_at?: string;
}
```

`user_confirmed_at`이 없는 값은 추천·임베딩 입력에 쓰지 않는다.

## 4. canonical Supabase schema

기존 `organizations`, `subgroup_map`, `collab_cases`, `collab_relations`, `project_proposals`는 유지한다. 사람 도메인을 아래처럼 추가하고 기존 `MemberProfile`은 호환 view로만 둔다.

### 4.1 원천 도메인

| 테이블 | 핵심 필드 | 목적 |
|---|---|---|
| `people` | id, auth_user_id, display_name, discoverable, onboarding_state, current_revision | 사람의 안정 ID |
| `affiliations` | person_id, organization_id, role_concept_id, acting_capacity, period, representation_status | 사람↔기존 80개 조직 연결 |
| `role_assertions` | person_id, concept_id, context_type/id, active_period, vocabulary_version | 복수·맥락 역할 |
| `experiences` | person_id, safe_summary, period, outcome, collaborator_types, visibility | 실행 경험 |
| `experience_skills` | experience_id, skill_concept_id, proficiency, evidence_ref | 경험에 근거한 기술 |
| `impact_intents` | owner, change_statement, population_codes, approach_codes, geography, horizon | 공통 미션 축 |
| `activity_intents` | owner, title, safe_match_text, action_codes, issue_codes, population_codes, desired_role_codes, stage, horizon, geography, mode, commitment_level, valid_until, status | 가까운 시기의 구체적 공동행동 축 |
| `activity_requirements` | activity_intent_id, need_intent_id, importance | 활동에 필요한 자원·역할 |
| `activity_contributions` | activity_intent_id, capability_offer_id, contribution_role | 활동에 제공할 수 있는 자원·역할 |
| `need_intents` | owner, topic_codes, safe_match_text, priority, urgency, constraints, valid_until, status | 방향성 query |
| `capability_offers` | owner, topic_codes, skill_codes, resource_types, safe_match_text, capacity, evidence_refs, valid_until | 방향성 candidate |
| `collaboration_preferences` | owner, modes, languages, pace, availability, geography, constraints | 실행 가능성 |
| `trust_claims` | subject, claim_type, evidence_ref, visibility, expires_at | 자기주장과 근거 분리 |
| `evidence_claims` | issuer, subject, evidence_type, source_ref, verified_at | 경험·소속 검증 |

원문 transcript와 safe match text를 같은 컬럼에 섞지 않는다. 원문은 private storage/table, 임베딩에는 PII 제거 후 사용자가 승인한 `safe_match_text`만 들어간다.

### 4.2 용어·버전

| 테이블 | 목적 |
|---|---|
| `term_concepts` | immutable concept_id와 정의 |
| `term_label_revisions` | preferred/alternative/deprecated/blocked 라벨 이력 |
| `vocabulary_releases` | 적용 버전과 승인자 |
| `vocabulary_change_events` | propose/activate/deprecate/split/merge append-only 이력 |
| `term_mappings` | local taxonomy ↔ ESCO/O*NET/SDG/IRIS+ 선택 mapping |

현재 mapping:

- 활동가(deprecated) → 사회혁신활동가(preferred)
- 지원가(deprecated) → 사회혁신지원가(preferred)
- 비사회적기업(blocked) → 사회혁신 협력 파트너(preferred 임시안)

### 4.3 개인정보·운영

| 테이블 | 목적 |
|---|---|
| `consent_records` | purpose, scope, processor, retention, policy_version, withdrawn_at |
| `profile_revisions` | 변경 전후와 provenance |
| `blocks` | 양방향 즉시 제외 |
| `representation_grants` | 조직 대표 권한 |
| `interaction_events` | 추천·소개·미팅·협업 funnel |
| `deletion_requests` | 원문·벡터·캐시 삭제 cascade |

### 4.4 추천 실행·평가

| 테이블 | 목적 |
|---|---|
| `recommendation_runs` | 알고리즘·데이터·vocabulary·model 버전 |
| `recommendation_candidates` | pair와 단계별 score, filter/reason codes |
| `recommendation_exposures` | 누가 언제 몇 순위로 보았는지 |
| `introduction_requests` | interest/request/accept/decline |
| `meeting_outcomes` | scheduled/completed/would_meet_again |
| `collaboration_outcomes` | 30/90일 후 실제 행동·프로젝트 |
| `pair_labels` | 도메인 검토자의 방향별 gold label |

### 4.5 외부 문서 staging·DB entity link

| 테이블 | 핵심 필드 | 목적 |
|---|---|---|
| `source_authorizations` | provider, artifact_scope, allowed_uses, approved_by, valid_from/until, withdrawn_at | 저작권·수집·임베딩 허용 근거 |
| `source_artifacts` | authorization_id, source_type, filename/resource_id, sha256, exported_at, received_at, parser_version | 소유자 제공 PDF/JSON/HTML 원본 단위 |
| `source_documents` | artifact_id, external_id, canonical_url, title, redacted_body, published_at, content_hash, revision, status | 블로그 글 한 건의 마스킹·버전 정본 |
| `source_chunks` | document_id, chunk_index, redacted_text, content_hash, token_count | 긴 근거 문서 검색 단위 |
| `entity_mentions` | document_id, entity_type, surface_text, normalized_text, context_json, extractor_version, confidence | 인물·조직·프로젝트 언급 후보 |
| `entity_link_candidates` | mention_id, target_type/id, match_method, evidence_json, confidence, review_status, reviewed_by/at | DB 엔터티 연결 검수 |
| `profile_claims` | subject_type/id, claim_type, value_json, document_id, source_time, valid_from/until, confidence, status, confirmed_by/at | 외부 서술을 canonical profile과 분리 |
| `entity_aliases` | entity_type/id, alias, valid_from/until, source_document_id, status | 과거 조직명·직함·표기 변형 |

entity link 원칙:

1. stable external ID가 양쪽에 있으면 자동 연결 가능
2. ID가 없으면 이름 일치만으로 연결하지 않고 소속·직책·활동 시점 등 독립 근거 2개 이상을 요구
3. fuzzy/embedding similarity는 후보 생성에만 사용하고 동일인 판정을 자동 승인하지 않음
4. 동명이인·조직/시점 충돌·한 글의 복수 인물은 운영자 검수
5. 문서 hash가 바뀌면 claim과 link를 재검토
6. 외부 글 작성 허가는 플랫폼에서 사람을 추천 대상으로 노출하는 동의와 별개

## 5. 임베딩용 문서 schema

사람 한 명을 하나의 벡터로 만들지 않는다. 변하는 intent와 offer를 독립 문서로 만든다.

```ts
type MatchDocumentKind =
  | "need_query"
  | "offer_candidate"
  | "activity_intent"
  | "impact_context"
  | "experience_evidence"
  | "organization_context";

interface MatchDocument {
  id: string;
  owner_person_id: string;
  source_kind: MatchDocumentKind;
  source_id: string;
  direction: "query" | "candidate" | "context";
  content: string;                 // 사용자 승인·PII 제거 text
  topic_codes: string[];
  skill_codes: string[];
  metadata: {
    region_scope?: string[];
    mode?: string[];
    language?: string[];
    valid_until?: string;
    capacity_status?: "open" | "limited" | "paused";
  };
  consent_record_id: string;
  source_revision: number;
  text_template_version: string;
  content_hash: string;
  visibility: "matching_private";
}
```

벡터 레코드는 원문과 분리한다.

```ts
interface EmbeddingRecord {
  document_id: string;
  space_id: string;
  model_provider: string;
  model_id: string;
  dimensions: number;
  normalized: boolean;
  content_hash: string;
  embedding_status: "pending" | "ready" | "failed" | "invalidated";
  generated_at?: string;
  error_code?: string;
}
```

### 5.1 두 개의 임베딩 공간

같은 모델을 써도 검색 목적을 분리한다.

| space | 입력 | 검색 목적 | 사람 추천 점수 사용 |
|---|---|---|---|
| `evidence_retrieval_v1` | 허가된 블로그·협업사례·조직 문서의 `source_chunks` | 근거와 유사 사례 찾기 | 승인된 claim의 evidence boost로만 제한 사용 |
| `people_matching_v1` | 사용자 확인된 activity/need/offer/impact/experience `MatchDocument` | 양방향 사람 매칭 | 주 점수 |

M2는 한국어 검색에 추가 학습된 `nlpai-lab/KURE-v1`을 1순위로, 원형 다국어 모델 `BAAI/bge-m3`를 기준선으로 같은 gold set에서 shadow 비교한다. 둘 다 1024차원, 8192 token, cosine, normalized vector다. KURE-v1의 공개 한국어 retrieval benchmark 우위는 우리 도메인의 사람 매칭 우위를 보장하지 않으므로 모델 ID를 먼저 고정하지 않는다. `embedding_spaces`에 provider/model/revision/dimensions/distance/preprocessing/template_version을 저장하고 서로 다른 space의 벡터를 덮어쓰거나 비교하지 않는다.

긴 외부 문서는 소제목·문단 의미 경계를 우선한다. 긴 section만 tokenizer 기준 450~700 token, overlap 80 token으로 `source_chunks`에 나눈다. 반면 매칭 문서는 intent/offer/experience 한 항목이 한 문서이므로 임의로 합치거나 다시 chunk하지 않는다.

외부 근거의 랭킹 영향:

```text
self_confirmed profile document = 1.0
operator_confirmed external claim = capped evidence boost
unconfirmed external claim = 0.0 (operator evidence search only)
```

블로그에 과거 활동이 적혀 있어도 현재 `activity_intent`, Need, availability로 추론하지 않는다.

벡터에 넣지 않는 값:

- 이름·이메일·전화번호
- 정확 위치·일정
- 실명 trust connection
- block/report/decline reason
- 민감속성 또는 자유서술에서 추론한 민감속성
- 운영자 비공개 메모
- 참여 가능 여부와 required constraints

이 값들은 hard filter 또는 구조화 feature로만 쓴다.

## 6. 실제 점수

### 6.1 후보 생성

각 query마다 다음 결과의 합집합을 만든다.

1. `need.topic_codes ∩ offer.topic_codes`
2. PostgreSQL FTS의 exact/lexical match
3. `need.safe_match_text → offer.safe_match_text` dense similarity
4. `activity_intent ↔ activity_intent` 유사·보완성과 원하는 역할 조합
5. 활동의 requirement → 상대 offer 적합성
6. 경험 evidence similarity
7. 소속 조직의 실제 relation/collab case graph

Supabase의 공식 hybrid search처럼 각 목록을 RRF로 합친다. 현재 8명 규모에서는 ANN index 없이 전수 cosine으로 exact baseline을 만든다. 수만 document가 되면 HNSW를 추가한다. Supabase는 변화하는 데이터에 HNSW를 일반적으로 권장하지만 selective metadata filter가 있으면 결과 부족이 생길 수 있으므로 iterative scan과 filter index를 함께 검증한다.

- [Supabase Vector Indexes](https://supabase.com/docs/guides/ai/vector-indexes)
- [pgvector](https://github.com/pgvector/pgvector)

### 6.2 방향별 pair score

```text
forward(A,B) =
  max/softmax(A.need_i → B.offer_j)
  + evidence(B.experience)
  + structured_topic_overlap

reverse(A,B) =
  max/softmax(B.need_i → A.offer_j)
  + evidence(A.experience)
  + structured_topic_overlap

common(A,B) =
  impact_intent_similarity
  + activity_intent_alignment
  + desired_role_complementarity
  + organization/collaboration_graph_feature
  + collaboration_style_fit
```

최종식은 미리 고정하지 않고 gold set에서 비교한다.

```text
reciprocal = combine(forward, reverse)
combine ∈ {minimum, geometric mean, harmonic mean}

pair_score =
  reciprocal
  × capacity_gate
  × feasibility_gate
  + common_weight × common
  + freshness/diversity/fairness adjustments
```

한쪽 점수가 낮은데 평균으로 가려지는 것을 막기 위해 `minimum`과 `harmonic mean`을 우선 비교한다.

### 6.3 설명

LLM이 이유를 새로 만들지 않는다. score에 사용한 source pointer로 다음 세 줄을 구성한다.

1. 당신에게 좋은 이유
2. 상대에게 좋은 이유
3. 함께 이야기할 구체적인 활동 주제와 부담이 적은 첫 행동

정확 연락처·프로젝트 원문·일정은 상호 수락 후 공개한다.

### 6.4 LinkedIn식 관계 경로 UI

[LinkedIn PYMK](https://engineering.linkedin.com/teams/data/artificial-intelligence/people-you-may-know)는 친구의 친구와 조직·기간 등 graph feature로 잠재 연결을 설명한다. Naver Connect는 현재 person graph가 없으므로 같은 외형을 쓰되 근거의 종류를 정확히 구분한다.

추천 카드:

```text
[이름]  [사회혁신활동가 / 사회혁신지원가]
[소속 조직 · 지역]

조직 생태계에서 2단계 연결
함께 해볼 활동: 주민 주도 돌봄 실험
공통 분야 2개 · 보완 역할 1개 · 연결 가능한 협업 경로 1개

[관계 경로 보기] [관심 있어요]
```

`관계 경로 보기` drawer:

```text
나
└ 내 소속 조직
  └ 관계 유형·실제/가설·근거 case
    └ 중간 조직
      └ 관계 유형·실제/가설·근거 case
        └ 상대 소속 조직
          └ 추천 상대
```

표현 규칙:

- 실제 사람 관계 edge가 없으면 “공통 지인”, “몇 다리 건너 아는 사이”라고 쓰지 않는다.
- `is_actual=true`는 “확인된 조직 관계”, false는 “연결 가능성”으로 표시한다.
- source가 collab case이면 제목·상태·기간을 근거로 열 수 있게 한다.
- 2-hop 수만 강조하지 않고, 두 사람의 Need/Offer 상호이익이 생긴 뒤 최종 추천한다.
- 카드의 주어는 막연한 “알 수도 있는 사람”이 아니라 `사람 + 함께 해볼 활동 주제`로 둔다.
- 향후 동의된 person relationship edge가 쌓이면 그때 “공통 연결 2명” UI를 별도 도입한다.

웹 구현은 기존 `@xyflow/react`, knowledge graph·collaboration map 컴포넌트를 재사용한다. 새 디자인 시스템을 만들지 않고 현재 modoomat의 웜 아이보리·테라코타·헤어라인·rounded-2xl/3xl, Pretendard+IBM Plex Mono, `guud-*` 토큰을 그대로 사용한다.

### 6.5 개인 페이지 목업 범위

현행 `/profile`에는 이미 미션, 소속·지역, 공개 활동, 신뢰 연결점, 비공개 수요가 있다. 별도 LinkedIn 복제품을 만들지 않고 이 페이지를 활동 중심으로 재구성한다.

1. **정체성 헤더** — 이름, `사회혁신활동가/사회혁신지원가`, 소속, 지역, 짧은 impact intent
2. **앞으로 해보고 싶은 활동** — active activity intent 1~3개, 단계·기간·지역·원하는 역할, 수정/중단/완료
3. **이 활동으로 연결될 사람** — 활동별 상위 3명, 양방향 Need→Offer 근거, “조직 생태계 2단계” 라벨
4. **관계 경로 drawer** — 현재 `Sheet`와 `@xyflow/react`로 조직 관계·사례·가설을 구분
5. **내가 보탤 수 있는 것과 경험** — 공개 Offer·근거 경험
6. **추천 전용 비공개층** — Need, capacity, 제한 조건, 정확 일정은 본인/운영자만 노출

목업은 우선 desktop 1장과 mobile 375px 1장, 그리고 관계 경로 drawer open 상태 1장만 만든다. 기존 `ProfileCard`, 추천 요약 카드, `Badge`, `Button`, `Sheet`와 `guud-*` 토큰을 재사용해야 구현과 이질감이 없다.

## 7. 피드백 데이터

강도 순으로 분리한다.

```text
impression
viewed
explanation_opened
interested
passed
introduction_requested
introduction_accepted / declined
meeting_scheduled
meeting_completed
would_meet_again
collaboration_started
collaboration_outcome_recorded
blocked / reported
explanation_inaccurate
```

- impression과 무응답은 부정 선호가 아니다.
- 한쪽 거절 이유는 상대에게 공개하지 않는다.
- block/report는 학습보다 먼저 hard filter에 적용한다.
- 클릭보다 mutual acceptance·meeting·collaboration을 높은 가중치로 둔다.

## 8. 평가

현재 회원 8명·추천 11건은 regression smoke일 뿐 품질 gold가 아니다.

### gold set

- 실제 또는 비식별 persona pair를 2~3명의 도메인 검토자가 blind 평가
- A가 B에게 얻는 가치 0~3
- B가 A에게 얻는 가치 0~3
- 30~90일 내 실행 가능성 0~3
- privacy/safety 위반 여부
- 합의도와 disagreement 기록

### 오프라인

- HardFilterViolationRate = 0
- mutual Recall@3, reciprocal NDCG
- bilateral coverage / stability / balanced ranking
- role·org type별 exposure coverage와 Gini
- repeat recommendation rate
- explanation source accuracy
- private text/PII leak = 0
- consent 철회 후 vector/cache 삭제 = 100%

### 온라인

- 첫 3명 중 양쪽 관심 1건 이상
- intro request → mutual accept
- meeting scheduled → completed
- would meet again
- 30/90일 collaboration started/outcome
- regret/cancel/block/report

CTR은 보조 지표다.

## 9. 구현 순서

### M0 — 데이터 계약

- versioned vocabulary 초기 release
- Person/Organization/Affiliation/Role/ImpactIntent/ActivityIntent/Need/Offer/Experience/Consent JSON Schema
- 현재 DB와 JSON의 stable ID mapping
- 개인정보·임베딩 동의문

### M1 — JSON-first 추천 기준선

- 기존 8명을 canonical schema로 무손실 변환
- onboarding finalize의 readiness/trustConnections 소실 수정
- required/preferred/open hard filters
- exact taxonomy + org graph + keyword baseline
- pair label·평가 harness

### M2 — 임베딩 shadow

- approved safe_match_text 생성·사용자 확인
- MatchDocument builder
- local KURE-v1과 BGE-M3 provider adapter 비교
- exact cosine retrieval
- min/geometric/harmonic reciprocal 실험
- 추천은 노출하지 않고 기존 baseline과 shadow 비교

### M3 — 첫 3명 human-reviewed pilot

- structured + lexical + dense + graph RRF
- reciprocal reranking과 evidence explanation
- 운영자 검토
- interest/accept/meeting feedback 수집

### M4 — Supabase migration

- 사용자 승인 후 신규 테이블·RLS·service role server-only 구현
- `DATA_SOURCE=json|db` 명시, silent fallback 금지
- DB 0 rows를 오류/fallback으로 취급하지 않음
- 유효 DB target과 `vector` extension/version 확인
- 선택된 모델 차원으로 pgvector column 생성

### M5 — 규모화

- embedding queue/retry/invalidation
- HNSW + iterative scan + metadata indexes
- exposure fairness와 repeat suppression
- 행동 신호가 충분해진 뒤 collaborative/two-tower 학습 검토

Supabase의 automatic embeddings 예시는 trigger → queue → Edge Function → retry 구조를 사용한다. 우리도 모델이 확정된 M4 이후에만 도입한다.

- [Supabase Automatic Embeddings](https://supabase.com/docs/guides/ai/automatic-embeddings)

## 10. 합의가 필요한 네 가지

1. 첫 추천 단위를 `사람 3명`으로 할지, `사람+구체적인 대화 주제 3개`로 할지
   권고: 후자. 같은 사람도 Need/Offer가 바뀌면 추천 의미가 달라진다.
2. 최소 온보딩을 Need 1 + Offer 1 + 경험 1로 확정할지
   권고: 확정. 나머지는 adaptive 질문으로 보강한다.
3. 첫 pilot의 매칭 범위를 8명 전체 전수 pair로 시작할지
   권고: 전수 pair. 이 규모에서는 ANN보다 정확한 평가와 설명이 중요하다.
4. C그룹 표시명을 `사회혁신 협력 파트너`로 임시 승인할지
   권고: vocabulary revision 구조를 전제로 승인하고 pilot feedback으로 재검토한다.

---

## 부록 A. Claude w3:p2 검토 의견 — §1.2/§4.5/§5.1 블로그 evidence 계층 (2026-07-29)

**동의**: robots.txt의 AI 자동 접근 금지 준수·수집 즉시 중단 판단, 소유자 제공 아티팩트+임베딩 허가만 반입, evidence_retrieval_v1 ↔ people_matching_v1 공간 분리, 외부 글의 현재 Need/activity/availability 자동 승격 금지, seed 8명과 공개 표본 exact match 0 → 동일인 가정 금지 — 전부 지지. disagree 없음.

**보강 제안 4건**:
1. **이중 동의 명시** — 블로그 인물 소개 글은 제3자 서술이다. 소유자(블로그 운영 주체) 제공 허가 외에 **소개된 본인의 확인(user confirmation)** 전에는 matching feature는 물론 evidence 노출도 본인 비공개로. profile_claims 승인 흐름에 "대상 본인 확인" 단계를 별도 상태로 분리 권장 (operator 확인 ≠ 본인 확인).
2. **space_id 분리 고정** — evidence_retrieval_v1과 people_matching_v1은 임베딩 모델이 같아도(BGE-M3 1024d) `space_id`를 분리해 교차 검색을 구조적으로 차단.
3. **link_candidates 자동 링크 금지** — exact match 0인 상태에서 fuzzy 자동 연결은 오귀속 위험. link 확정은 수동(operator+본인)만, 미확정 상태는 anonymous evidence로만 집계.
4. **source_authorizations 필수 필드** — 허가 문서 참조(문서/메일 ref), 허가 범위(read/embed/display), robots.txt 확인 시각, 만료. PDF 백업(100글/파일 ×6) 원문은 private storage 보관, 공개 UI 원문 표시 금지.

people_matching_v1(M1 엔진)은 이 계층과 독립적으로 진행 중 — 블로그 반입 여부와 무관하게 동작. (Claude w3:p2)
