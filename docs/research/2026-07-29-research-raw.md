---
schema_version: shuzzi-md/v1
doc_kind: narrative_note
project_slug: hackathon-naverconnect
created_at: 2026-07-29T10:24:31+09:00
updated_at: 2026-07-29T12:04:20+09:00
timezone: Asia/Seoul
status: research_snapshot
---

# Naver Connect 해외 사례 리서치 — 원자료 전문 (2026-07-29)

> 작성: Claude 병렬 리서치 배치 결과 전문 보존본.
> 선별본·합의 상태는 `20260729.md`의 리서치 2/2 블록 참조. 모든 항목은 각 에이전트가 "추측 금지, 미확인 표기" 규칙 하에 수집. 미확인 표기와 출처 성격(공식/teardown) 구분을 신뢰 판단에 그대로 사용할 것.

---

## R1. 사회혁신/임팩트 네트워크

#### Ashoka Fellowship — https://www.ashoka.org/en-us/program/venture-selecting-our-ashoka-fellows
- 대상: 사회적 기업가(체인지메이커), 자기신청 불가·추천 기반.
- 수집: 노미네이션 단계 — 성명·소속·지역, 3~5줄 약력, "무엇이 새로운가", 임팩트 증거(도달범위·측정 성과), 리더십 증거, 확장 가능성 서술. 통과 시 본인 작성 2차 상세 신청서.
- 매칭: 순수 휴먼 큐레이션 — 지역 스태프 1차(인터뷰·현장방문·레퍼런스) → 외부 시니어 2차 독립 심사 → 국제 이사회. 평균 8명과 대화, 6~9개월.
- 신뢰: 5개 고정 기준(새 아이디어·창조 역량·기업가정신·임팩트·윤리성) 전 단계 동일 적용. 공개범위 통제 미확인.
- 피드백: 탈락자 피드백 미확인.
- 적용: 휴먼 2단계 검증 구조를 민감정보 공개 동의 심사·AI 매칭 최종 확인 게이트로.
- 메모: ashoka.org WebFetch 403 → WebSearch 발췌 인용 기반.

#### Impact Hub Impact Maker Membership — https://impacthub.net/impact-maker-membership/
- 수집: 이름·이메일·신분 분류(학생/기업가/기업/공공기관/투자자/기타)·스팸 방지 질문·개인정보 동의. 상세 프로필 필드 미확인.
- 매칭: 메커니즘 미확인("like-minded와 교류" 서술만).
- 적용: 1단계 라이트 가입 → 점진적 프로파일링(progressive profiling)으로 7스텝 이탈 완화.

#### Echoing Green Fellowship — https://echoinggreen.org/fellowship/apply/
- 수집: 개인 기본정보, 단체 개요·재정·분류, 리더십/사업 단답, 유사 단체 협력 방안, 이력서, 60초 영상.
- 매칭: 전문가 검토자 점수화 → 파이널리스트 패널 인터뷰(선발형).
- 피드백: 확인됨 — 루브릭 기반 수치 피드백을 지원자에게 제공(개인화 코멘트는 미제공).
- 적용: 거절 시 태그별 매칭 스코어 형태의 수치 피드백 반환 구조.

#### Zebras Unite Co-Op — https://zebrasunite.coop/join , /code-of-conduct
- 수집: 신청 필드 미확인. 절차 — 정보세션 4개 시청 → 5분 신청서 → Hylo 커뮤니티 참여. 가입비 $50+연 $120.
- 신뢰: Code of Conduct — "동의 없이 타인의 정체성을 드러내는 행위(outing) 금지, 취약계층 보호 예외". Inclusion팀 신고 대응, 피해자 기밀 우선.
- 적용: 해당 조항 문구를 민감정보 공개/비공개 동의 화면 법적 문구 초안으로.

#### Catalyst 2030 — https://catalystnow.net/become-a-member/
- 수집: 상세 미확인. 승인 기준 4종 — 미션 부합, 사회혁신 역량, 임팩트 실적, 네트워크 관여도.
- 매칭: 휴먼 큐레이션 + 구조화 시간축 — 신청→2개월 심사→온보딩 세레모니(1.5h)→온보딩 멤버 6개월(월 2h)→완전 멤버 + 인증서. 워킹그룹·버디 시스템·지역 세션.
- 적용: "온보딩 멤버→완전 멤버" 단계적 신뢰 축적 + 버디 시스템 → 신규 회원 저위험 노출→상호작용 축적 후 완전 매칭 개방.

#### Toniic — https://toniic.com/membership/
- 대상: 공인투자자·패밀리오피스·재단.
- 매칭: 확인됨 — "personalized member introductions, facilitated by dedicated Toniic team members"(전담 스태프 수동 소개).
- 신뢰: 자격요건 + Code of Conduct 동의. T100 디렉토리 members-only.
- 적용: 고신뢰 구간 한정 AI 추천 + 운영자 확인 하이브리드.

#### Acumen Academy Foundry — https://acumenacademy.org/foundry/
- 매칭: 지역 Foundry팀이 기회를 큐레이션해 대시보드 게시(휴먼). 알고리즘 미확인.
- 적용: 프로그램 "졸업" 게이트로 심화 매칭 풀 분리(활동 이력 채운 회원 전용 티어). 근거 약함 주의.

- 제외: MakeSense·Global Shapers — 매칭 메커니즘 공식 문서 부실로 제외.

---

## R2. 비영리-전문가/자원 매칭

#### Catchafire — https://www.catchafire.org/ (온보딩: https://help.catchafire.org/en/articles/1963889 , 평점: /1963948)
- 대상: 전문직 스킬기부 자원봉사자(35개 스킬셋) ↔ 비영리/사회적기업. 재단 후원 멤버십 다수.
- 수집: (봉사자) 이름·사진·직함·위치·자기소개·링크, 35개 스킬셋, 24개 cause area, 프로젝트 유형 선호, 참여 전 퀴즈. (단체) 프로젝트 니즈 카테고리, RAV(특정 봉사자 지목).
- 매칭: 자체 알고리즘 — 스킬·경험·최근 활동·유사 규모 프로젝트 완료 이력·타 단체 평점 (https://www.prnewswire.com/news-releases/catchafire-launches-scalable-skills-based-volunteer-matching-service-103637714.html). RAV 병행.
- 신뢰: 참여 전 퀴즈. 2025년부터 단체 간 봉사자 평점 상호열람. 프로필 공개범위 본인 편집.
- 피드백: 완료 후 "Rate Experience" — 공개 테스티모니얼(포트폴리오 노출) + 자문팀 전달용 비공개 피드백 이원화. 1시간 임팩트 콜. 평점 매칭 재투입.
- 적용: 공개 테스티모니얼+비공개 운영 피드백 이원화, 상호 평점의 가중치 재투입.

#### Taproot Foundation (Taproot+) — https://taprootfoundation.org/taproot-plus
- 수집: (단체) 5분 무료 계정+니즈. (봉사자) 5분 프로필 — 스킬셋·관심 cause. 세부 미확인.
- 매칭: 하이브리드 — 상시 500+ 사전기획 프로젝트 브라우징 + 스태프 매치메이킹/트레이닝 병행.
- 적용: 셀프서비스 + 컨시어지 병행 → "AI 추천 후 사람 검수".

#### VolunteerMatch (2024~ Idealist 통합) — https://www.volunteermatch.org/ , 등록요건 https://vmhelp.zendesk.com/hc/en-us/articles/213979208
- 수집·검증: (단체) EIN이 IRS 면세단체 DB와 매칭 필수 + IRS 결정서/주 면세 링크/정관 중 1개 + 자체 웹사이트 필수.
- 매칭: 위치/관심사/일정/원격 검색·필터형. AI 추천 미확인.
- 적용: "공식 서류 최소 1개 검증"으로 공급측 계정 진위 담보.

#### MovingWorlds (Experteering) — https://movingworlds.org/experteering-process
- 매칭: 서치+필터 + 사람 개입 소개 혼합 — 지원자가 "관심 이유 + 내 스킬이 어떻게 도움되는지" 서술 → 도입콜(미션·산출물·팀·시간·성공기준) 후 확정. 단체 역방향 소개 요청 가능.
- 피드백: 사후 임팩트 설문, 스토리 공유, 얼럼나이 네트워크, 포럼.
- 적용: 매칭 확정 전 "소개 사유 서술 + 도입콜" 저비용 휴먼 검수로 거절률 인하.

#### DataKind — https://www.datakind.org/join-us/volunteer/
- 수집: rosterfy 계정 — 연락처, 스킬별 사용빈도/숙련도 자기평가, 선택 사진·소개. 통과 시 교육영상 → 서약서 → 월례 온보딩콜.
- 매칭: 공지·지원 기반(뉴스레터 calls for volunteers). 스태프/위원회 스코핑. 알고리즘 미확인.
- 적용: "필수 교육 이수 + 서약서"를 민감정보 동의 스텝의 강한 확약 절차로.

#### Common Impact — https://commonimpact.org/what-is-skills-based-volunteering/
- 매칭: 컨시어지 6단계 — 소싱→검증(vet)→스코핑→준비→운영→평가.
- 적용: AI 매칭이 애매한 고신뢰 케이스의 휴먼-인-더-루프 백업 절차.

#### Points of Light Engage — https://www.pointsoflight.org/for-volunteers/
- 매칭: 검색·필터형("part research engine, part registration portal"). 알고리즘 미확인.
- 적용: Daily Point of Light Award식 표창 = 리텐션 장치.

- 메모: 다수 공식 도메인 WebFetch 403 → 공식 도메인 인덱싱 스니펫으로 확인. Pro Bono Net은 공개 정보 부족으로 제외.

---

## R3. AI 비즈니스 네트워킹 + 행사 매치메이킹

(제외: Shapr — 2026년 앱스토어 삭제·사실상 중단. Polywork — 2025-01 종료.)

#### Lunchclub — https://lunchclub.com/ , privacy: /privacy
- 수집: 이름·사진·국가·도시·학교, 관심사·프로젝트·"Ask me about", 이메일/전화, (구글 연동) 연락처·캘린더.
- 매칭: ML로 주 1회 1:1 매칭. 알고리즘 세부 미확인(협업 필터링 언급은 3차 소스만).
- 프라이버시: 위치정보 외부 비공유 명시. 프로필 공개 세부 미확인.
- 피드백: 공식 문구 미확인(미팅 후 평가 UX는 3차 소스 일관 언급).
- 적용: 주 1회 저빈도·고관련성 추천 → 회원 피로 최소화 + 거울/퍼즐 축 구분 제시.

#### Brella — https://www.brella.io/event-matchmaking , https://help-organizers.brella.io/en/articles/177659-introduction
- 수집: 카테고리 → 관심사 → intent(networking/trading/investing/recruiting/mentoring) 3단, 페르소나·산업·직무·자기소개.
- 매칭: "AI 추천 기반" 명시, 내부 구조 미확인.
- 프라이버시: GDPR, 최초 접속 동의/거부. 익명화 매치메이킹 데이터 소유권 회사 귀속 명시 (https://www.brella.io/privacy-notice-service).
- 피드백: "self-teaching mechanism" 서술만, 세부 미확인.
- 적용: 카테고리→관심사→intent 3단 구조를 수요/공급 태그+협력성향 계층 수집 UI에.

#### Grip — https://www.grip.events/products/event-matchmaking , https://support.grip.events/revolutionizing-event-networking-with-advanced-ai-powered-solutions
- 매칭: 16개 ML 알고리즘+NLP+딥러닝, 명시적(설문)+암묵적(행동) 선호 결합, 상호 관심 시 매칭(데이팅앱식).
- 프라이버시: GDPR/CCPA, 능동 로그인+동의 후 노출, 마케팅 별도 옵트인 (https://support.grip.events/grip-and-gdpr-ensuring-data-protection-and-matchmaking-success).
- 피드백: Interested/Skip 스와이프 → 프로필 갱신·향후 추천 반영 + 미팅 후 평가(rate)도 추천 개선에 사용 — **공식 문서로 확인된 유일한 이중 피드백 루프**.
- 적용: 즉시신호(스와이프)와 사후신호(평가) 분리 수집 → 거절사유 피드백 루프의 직접 레퍼런스.

#### b2match — https://www.b2match.com/value-adds/event-matchmaking , GDPR: https://support.b2match.com/gdpr
- 매칭: "AI Meeting Recommender". 세부 미확인.
- 프라이버시: GDPR, EU Google Cloud, 주최자=Data Controller. 주최자가 프로필 웹 공개 결정 + 참가자 개별 목록 숨김 옵션(이중 옵트아웃).
- 미팅: Approval mode(수동 수락/거절) vs Automatic mode.
- 적용: 조직 단위 정책 + 개인 단위 예외의 프라이버시 계층.

#### Swapcard — https://www.swapcard.com/platform/artificial-intelligence
- 매칭: 추천엔진 "Gismo" — 사람·세션·전시업체·상품 노드 지식그래프 + "TF-IDF 커스텀 변형+random walk"(제품 페이지 서술, 엔지니어링 블로그 원문 미확인). 프로필+실시간 행동 결합.
- 피드백: 프로필 업데이트·북마크·커넥트가 AI에 반영되는 지속 학습 서술.
- 적용: 정적 태그 + 동적 신호(클릭·수락률) 결합의 지식그래프형 접근.

#### Bizzabo — https://www.bizzabo.com/event-management-software/event-networking-platform
- "이름·직함·회사만으로는 부족" 문제의식 (https://www.bizzabo.com/blog/improve-event-networking-attendee-data). 수백 데이터 포인트 AI 서술, 세부 미확인.
- 적용: 수요/공급 태그 분리 수집의 근거 인용.

#### RingCentral Events (구 Hopin) — https://events-support.ringcentral.com/hc/en-us/articles/5016822508948
- 매칭: 관심사 필터 + Speed Networking(Random/By ticket type) 룰 기반.
- 프라이버시: "Organizer만 연락 가능" 설정, 참가자 음소거. 완전 옵트아웃 미확인.
- 적용: AI 이전 MVP 매칭 로직 baseline.

#### LinkedIn PYMK — https://www.linkedin.com/blog/engineering/recommendations/building-a-large-scale-recommendation-system-people-you-may-know
- 수집: 프로필(직장·학교·업계), 가져온 주소록, 1·2·3차 인맥. "메시지 내용은 스캔 안 함" 명시 (https://www.linkedin.com/help/linkedin/answer/a544682).
- 매칭: L0 후보생성(그래프 랜덤워크+EBR+휴리스틱) → L1 경량 랭킹(LR/XGBoost) → L2 DNN → 공정성/다양성 재순위기.
- 피드백: 제거한 추천 최근 500개 재추천 억제 명시. 폐루프 학습 여부 미확인.
- 적용: 소규모에선 "1차 필터(태그) → 2차 랭킹(성향/거절이력)"으로 단순화.

**공통 관찰**: 8개 중 미팅 후 평점의 추천 재반영이 공식 확인된 곳은 Grip 1곳. 즉시 피드백 반영 확인은 Grip·LinkedIn 2곳. 나머지는 마케팅 서술만.

---

## R4. 커뮤니티/멤버십 온보딩

#### On Deck — https://joinodf.com/ , https://www.intros.ai/case-study/on-deck
- 수집: (VC) 투자 경험·섹터·커뮤니티 가치 질문 + 2분 Loom 영상. (Founder) 매칭 설문 — "Give & Take"(제공 스킬 vs 필요 스킬), "Must-have"(재정 리스크 감수 일치), 유사성 척도(투입 시간), 다중비교(협업 시간대).
- 매칭: Intros.ai 엔진 가중치 매칭. 지표: 매칭 강도 4.7/5, 89% 최소 1회 참여.
- 신뢰: 심사 3축 — Ability/Culture("받기만 하는" 지원자 배제)/Stage.
- 적용: Give&Take 상호보완 질문 → 공급/수요 가중치. 문화적합 질문 → AI 인터뷰 프롬프트.

#### Hampton — https://joinhampton.com/faq
- 대상: 매출 $1M+/펀딩 $3M+/엑싯 $5M+ 창업가.
- 매칭: Mirror(동단계)·Mentor(선배)·Mentee(후배) 3분할 Core Group 8~10인, 90일 내 배정, 유급 진행자, 월 1회 대면.
- 신뢰: 4단계 심사(서류→인터뷰→**커뮤니티 거부권(veto)**→창립자 승인). 멤버 디렉토리 가입 후에만. No-Solicitation + 45일 환불.
- 적용: 커뮤니티 거부권 신뢰 장치, Mirror/Mentor/Mentee 3분할 소그룹 로직.

#### South Park Commons — https://www.southparkcommons.com/faq/
- 평가 프레임: "velocity × acceleration" — 빌더 성향, 리더십, 도메인 전문성, 리스크 감수, 호기심, 정서 지능.
- 피드백: accountability groups, 포럼, 스피커 시리즈 상시 운영.
- 적용: 정성 평가축 → AI 후속 질문 설계. accountability group → 확정 후 재활성화 장치.

#### Chief — https://chief.com/membership-criteria
- 매칭: Core Group을 전문 목표·역할·회사 규모·책임·생애 단계로 큐레이션, 4개 여정. 코치는 업무 스타일·직무·산업·책임 정합 + 1주 내 "Chemistry" 세션.
- 적용: 다축 매칭 로직, 연 1회 트랙 전환 = 재온보딩·프로필 갱신 트리거.

#### YC Co-Founder Matching — https://www.ycombinator.com/cofounder-matching
- 매칭: 프로필 추천 → 개인화 메시지 초대 → 상호 수락 시 매치.
- 신뢰: "승인된 사용자에게만 프로필 공개" — 승인제 접근 통제.
- 적용: 승인 회원 한정 공개 + 초대→상호 수락 이중 옵트인.

#### Discourse Trust Levels — https://meta.discourse.org/t/trust-level-permissions-reference/224824 , https://blog.discourse.org/2018/06/understanding-discourse-trust-levels/
- 구조: 설문 없음, 행동 로그 기반 권한 점진 개방. TL0→1: 주제 5, 글 30, 10분. TL1→2: 15일 방문, 좋아요 주1/받1, 답글 3주제, 주제 20, 글 100, 60분. TL2→3(최근 100일): 50% 일수 방문, 10주제 답글, 최근 주제 25% 조회, 좋아요 받20/주30. TL4는 수동.
- 적용: 활동 기반 "신뢰 레벨"로 노출 범위·매칭 우선순위 점진 개방.

#### Orbit Model — https://github.com/orbit-love/orbit-model
- 구조: presence×commitment = "Love" 점수 → Orbit 1~4 레벨. 레벨별 개입 차등.
- 적용: 활동 레벨 자동 분류 → 매칭 노출 우선순위·운영자 개입 강도 차등.

#### Lunchclub (커뮤니티 관점) — 1차 출처 제한적. R3 참조.

---

## R5. 개인/조직/스킬/임팩트 데이터 표준

#### schema.org Person/Organization — https://schema.org/Person , https://schema.org/Organization
- 필드: Person — worksFor, jobTitle, hasOccupation, memberOf, affiliation, alumniOf, hasCredential, knowsAbout, skills, knows, colleague. Organization — member/memberOf, employee, **makesOffer(공급)**, **seeks(수요)**, parent/subOrganization, funder/sponsor/founder. 823 Types·1,529 Properties.
- 거버넌스: Steering Group + W3C Community Group, V30.0 (https://schema.org/docs/howwework.html).
- 적용: 최상위 필드명 정렬로 향후 연동 비용 절감. makesOffer/seeks 페어 = 공급/수요 태그 골격.

#### ESCO — https://esco.ec.europa.eu/en/about-esco/what-esco
- 구조: 직업 3,039 + 스킬 13,939, 28개 언어, 직업-스킬 essential/optional 연결. v1.2.1 (2025-10).
- 적용: "조직 수요 태그 ↔ 개인 스킬 태그" 다대다 매핑 레이어.

#### O*NET — https://www.onetcenter.org/content.html
- 구조: Content Model 6영역 — Abilities 52·Work Styles 21 / Skills·Knowledge·Education / 경험 / Work Activities 계층(19,000+ task→2,000+ detailed→325 intermediate→41 generalized) / 직업특수 / 인력특성. 직업 1,016.
- 적용: 스킬을 추상도별 계층(범주→세부역량→구체 활동)으로 나누는 참조모델.

#### Lightcast Open Skills — https://lightcast.io/open-skills
- 구조: 34,000+ 스킬, 3단 계층(Category→Subcategory→Skill), 기계가독 ID, Common/Specialized/Certification 구분. 2주 갱신, 공개 changelog.
- 적용: 3단 계층+유형 구분 → 자유 텍스트에서 태그 자동 추출 파이프라인 기반.

#### HR Open Standards — https://www.hropenstandards.org/standards
- 구조: Trusted Career Profile(TCP) — 스킬·이력·역량·자격·배지 이동형 위변조방지 레코드. CompetencyDefinitions/PositionCompetencyModel.
- 적용: 역량을 별도 엔티티로 정의하고 개인·포지션이 참조하는 정규화 — 스킬을 문자열 태그가 아닌 참조형 엔티티로.

#### Open Badges 3.0 (1EdTech, W3C VC 기반) — https://www.imsglobal.org/spec/ob/v3p0
- 구조: Achievement / AchievementCredential / AchievementSubject / Issuer / Alignment(외부 프레임워크 정렬) / Evidence / Result. VC 2.0 서명·폐기 확인·DID.
- 적용: 활동 인증·봉사시간 증명을 Issuer-Achievement-Subject 3자 구조로 → 추후 검증가능 자격증 승격 용이.

#### IRIS+ (GIIN) — https://iris.thegiin.org/
- 구조: Catalog of Metrics + Core Metrics Sets + Thematic Taxonomy + SDG 매핑. 5.3c (2025-12).
- 적용: 임팩트 지표를 "카탈로그에서 선택"하게 하여 조직 간 비교·집계 가능.

#### CIDS (Common Approach) — https://ontology.commonapproach.org/cids-en.html
- 구조: OWL 온톨로지 v3.2.0 — Organization, Program, Service, Activity, ImpactModel, OutcomeChain, Outcome, StakeholderOutcome, Indicator, ImpactReport, Stakeholder, Theme, ImpactRisk, Counterfactual 등. CC BY-SA 4.0.
- 적용: 자유 서술 + 구조화 지표 병행으로 상호운용 가능한 임팩트 데이터.

#### Candid PCS — https://taxonomy.candid.org/
- 구조: 6 Facet — Subjects(무엇)/Populations(누구)/Org Type/Transaction Type(어떻게 지원)/Support Strategies(어떻게 실행)/Geo(어디). 3~4년 주기 개정, CC BY 4.0.
- 적용: 활동분야 태그를 단일 카테고리가 아닌 다축(multi-facet)으로.

#### LinkedIn Skills Graph — https://www.linkedin.com/blog/engineering/data/building-maintaining-the-skills-taxonomy-that-powers-linkedins-skills-graph
- 구조: 스킬 39,000, 별칭 374,000(26 로케일), 연결 200,000+. 다중 부모/자식 그래프(트리 아님). 분류사 수동 큐레이션 + KGBert ML 하이브리드.
- 적용: 스킬의 다중 소속(사회복지+마케팅 동시) 표현에 그래프 모델.

---

## R6. 임베딩·reciprocal 매칭·평가

#### LinkedIn PYMK 시스템 — https://www.linkedin.com/blog/engineering/recommendations/building-a-large-scale-recommendation-system-people-you-may-know
- 구조: L0 후보 수천(그래프 n-hop 랜덤워크, EBR, 규칙) → L1 수백(XGBoost/LR) → L2 DNN(참여확률·가치) → 공정성·다양성·파워유저 억제 재순위기.
- 평가: L0 Recall@3,000~5,000, L1 Recall@500~800, L2 AUC·Precision@k·ECE, 온라인 A/B.
- 적용: 소규모에선 후보생성 2소스(그래프 워크+임베딩 유사도) + 경량 다양성 재순위만.

#### LinkedIn LiGNN (SIGKDD 2024) — https://arxiv.org/abs/2402.11139
- temporal GNN + graph densification(콜드스타트). 온라인: 잡 회신 +1%, 광고 CTR +2% 등.
- 적용: "태그 유사도 기반 가상 엣지 보강" 원리만 차용. GNN 자체는 오버스펙.

#### LinkedIn 이종 엔티티 추천 — https://www.linkedin.com/blog/engineering/optimization/building-a-heterogeneous-social-network-recommendation-system
- 타입별 독립 Edge-FPR → 크로스타입 XGBoost 보정. 신규 엔티티 확률적 노출 보장.
- 적용: 회원-회원 외 회원-모임/이벤트 이종 추천 시 타입별 스코어링 후 공통 보정. 신규 회원 최소 노출 보장.

#### LinkedIn Two-Tower 잡매칭 — https://www.linkedin.com/blog/engineering/platform-platformization/using-embeddings-to-up-its-match-game-for-job-seekers
- 요청 타워(쿼리+관심 임베딩+문맥) vs 잡 타워, softmax loss, 코사인 매칭. 인배치 네거티브.
- 적용: 수요↔공급 교차 유사도와 직접 대응. 소규모에선 인배치 네거티브 다양성 부족 → 별도 네거티브 풀 필요.

#### Indeed 행동시퀀스 임베딩 — https://engineering.indeedblog.com/blog/2026/06/distilling-long-tail-user-behavior-into-scalable-embeddings-for-job-search/
- 수치+범주+멀티핫+행동시퀀스(최대 256) → DCN 단일 벡터. 오프라인 AUC +1.6~3.5%, 온라인 지원율 +5.24% 등.
- 적용: 행동 로그 축적 후 별도 feature group 벡터로 확장하는 경로. 초기엔 텍스트/태그 우선.

#### Xia et al. 2015 (온라인 데이팅 reciprocal) — https://arxiv.org/abs/1501.06247
- 20만 명, 프로필 20필드. s(x,y)와 s(y,x)를 **조화평균**으로 결합, 양쪽 양수일 때만 점수.
- 참고: RECON (Pizzato 2010, https://dl.acm.org/doi/10.1145/1864708.1864747) — 상호성 반영 시 Top-10 성공률 23%→42%.
- 평가: I-Precision/Recall(접촉), R-Precision/Recall(상호 교환). 최소 5회 교환자만 학습.
- 적용: 조화평균 = 일방적 매칭 억제 성질 → 교차 유사도 결합식 1순위 후보.

#### Revisiting Reciprocal RecSys (2024) — https://arxiv.org/abs/2408.09748
- 문제: 양측 독립 단방향 평가의 중복 카운트 결함 지적. 신규 지표 — CRecall/CPrecision(중복 제외), SRecall/SPrecision(양쪽 동시추천=안정성), RNDCG@K.
- 방법: 인과추론 3처리(ŷ₁₀/ŷ₀₁/ŷ₁₁) 예측 후 재순위.
- 적용: SRecall류 채택으로 "일방적 추천" vs "실제 상호 매치" 구분 평가. 5-core 필터링 전제라 소규모 초기엔 그대로 적용 곤란.

#### Grip/Brella 벤더 기술 — R3 참조. 평가 방법 공개 문서 없음 → 이 카테고리는 자체 A/B 관행. 경쟁 UX 벤치마크로만.

---

## R7. 신박한 온보딩 (도메인 무관)

#### Duolingo — teardown: https://userguiding.com/blog/duolingo-onboarding-ux , https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html
- 신박: 가입을 온보딩 맨 끝으로 지연 — 언어→목표→배치테스트→스트릭 목표→Day1 이후에야 계정 생성. 손실회피 활용.
- 수치: 지연 가입 DAU +20%는 teardown 인용 — 1차 공식 수치 미확인.
- 적용: 무거운 동의 스텝 후치 + 태그 선택 직후 "매칭 가능 회원 3명 미리보기" 즉시 가치.

#### Hinge — teardown: https://first-run-ux.kryshiggins.com/hinge-dating-app-first-time-user-experience-the/ ; 공식: https://hinge.co/newsroom/hinge-2025-product-evolution
- 신박: 필드마다 인라인 "Why?" 링크. 프롬프트 카드 선택 후 답변(자유 bio 대체). AI Prompt Feedback.
- 수치: Match Note 테스트 — 2,000명 중 약 2/3 긍정(공식 뉴스룸).
- 적용: 민감정보 필드별 인라인 "왜 필요한가" + 한 줄 인터뷰를 프롬프트 카드 선택형으로.

#### Co-Star — 공식: https://apps.apple.com/us/app/co-star-personalized-astrology/id1264782561 ; teardown: https://ixd.prattsi.org/2024/09/design-critique-co-star-ios-app/
- 신박: 생년월일·시간·장소 3입력 → 몇 분 내 개인화 리딩 즉시 반환. 1화면 1항목.
- 적용: 성향 스텝 완료 직후 "당신은 '연결자' 유형" 즉각 개인화 피드백.

#### Headspace — teardown: https://tearthemdown.medium.com/product-teardown-headspace-user-onboarding-personalisation-b6effd0df1d7
- 신박: 선택마다 상단 카피·일러스트 실시간 변경 + 자동 이동 없이 명시적 '계속' 버튼(선택의 의식화).
- 적용: 태그 선택 화면의 반응형 카피 + 명시적 확인 버튼.

#### Finch — teardown: https://medium.com/@deepthi.aipm/ux-teardown-finch-self-care-app-18122357fae7
- 신박: 온보딩=알 부화 의식(색·이름·대명사·성격). "설정"이 아닌 "돌봄 시작" 서사.
- 적용: 스텝1을 "나의 커뮤니티 카드 만들기" 의식으로 — 행정→환영 전환.

#### Spotify — 공식: https://newsroom.spotify.com/2026-03-13/taste-profile-beta-announcement/
- 신박: 취향 선택 즉시 개인화된 홈(빈 화면 회피). Taste Profile로 개인화 로직 자체를 노출·조정 가능.
- 적용: 태그 선택 종료 즉시 확정 전 매칭 카드 미리 채움.

#### Typeform — 공식: https://www.typeform.com/blog/create-better-online-forms
- 신박: 1화면 1질문 + 조건부 로직. 공식 블로그: "10문항 미만 완료율 최고, 6문항 스윗스팟"(방법론 미명시 — 참고용으로만).
- 적용: 스텝 내부도 1문항=1화면, 조건부 로직으로 불필요 질문 스킵.

#### Superhuman — First Round Review(준공식): https://review.firstround.com/superhuman-onboarding-playbook/
- 신박: 1:1 컨시어지 온보딩(90분→30분). 보도 기준 활성화율 약 2배, 65%+ 통화 중 완전 전환.
- 적용: 앵커 조직 등 고가치 회원군에 1:1 온보딩 콜 병행.

#### Noom — teardown: https://www.revenuecat.com/blog/growth/web-to-app-onboarding-funnel/ , https://www.thebehavioralscientist.com/articles/noom-product-critique-onboarding
- 신박: 113화면 10~15분 퀴즈를 "심리 교육 겸 커밋먼트"로 설계. 민감 질문 앞 "왜 묻는지" 선제시 + 취약 답변 직후 공감 카피. 슬라이더 스펙트럼 응답.
- 적용: 질문마다 마이크로 교육 + 민감 답변 후 공감 카피.

---

## R8. 대화형/AI 네이티브/커뮤니티형 온보딩

#### Discord — 공식: https://discord.com/blog/community-onboarding-welcome-your-new-members , https://support.discord.com/hc/en-us/articles/1500000466882
- 신박: 온보딩=게이트 — 규칙 동의+질문 완료 전 발화 차단. 답변→채널·역할 1:1 매핑.
- 적용: 민감정보 동의를 체크박스 나열이 아닌 "동의해야 진입하는 게이트 화면"으로 분리. 응답이 즉시 보이는 결과로 매핑.

#### Slack Donut — 공식: https://www.donut.com/ , https://help.donut.ai/en/articles/3024637-intro-types
- 신박: 온보딩을 "정보 입력"이 아닌 "사람과 연결"로 프레이밍. 매칭 타입 4종(Standard/Cross-group/Within-group/Lottery).
- 적용: "이 태그면 이런 회원과 연결" 미리보기 = 입력이 곧 관계 형성.

#### Noom — R7 참조 (진행바 모멘텀, 색상 피드백 추가 확인).

#### Woebot — teardown: https://uxwritinghub.com/woebot-case-study-in-conversation-design-for-mental-health-products/
- 신박: 자유 텍스트 대신 버튼형 응답 기본 + 유머 톤 완충. 사전 승인 문장 뱅크(임의 생성 아님).
- 적용: AI 인터뷰를 버튼 선택지+자유 입력 보조 하이브리드로.

#### Typeform — R7 참조.

#### LinkedIn 프로필 게이지 — 공식: https://www.linkedin.com/help/linkedin/answer/a594698
- 3단계(Beginner→Intermediate→All-star), 7개 권장 섹션. 게이지는 본인에게만 노출.
- 주의: "40배" 수치는 공식 1차 출처 미확인 — 사용 금지.
- 적용: 확정 후에도 항목별 완성도 게이지 상시 노출. 인과 수치는 내부 데이터 검증 전 사용 금지.

#### Replika vs Pi — teardown(편향 가능성 명시): https://aicompanionguides.com/blog/platform-comparison-top-10-side-by-side/
- 대조: Replika=성격 퀴즈+아바타 게임화 / Pi=군더더기 없이 바로 대화.
- 적용: "캐릭터 생성형(재미)" vs "바로 대화형(간결)" 중 톤 하나를 명확히 선택. 신뢰 기반 네트워크엔 동의 UX는 Pi식 간결이 안전.

#### Duolingo — R7 참조 ("온보딩 없는 온보딩", learn-by-doing).
- 추가 적용: AI 인터뷰를 "형식적 질문"이 아니라 "답하는 즉시 매칭 프리뷰가 만들어지는 태스크"로.

#### Notion AI — 공식: https://www.notion.com/blog/introducing-notion-3-0 ; teardown: https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users
- 신박: 정적 워크스루 제거, 핵심 질문 2개(무엇이 필요한가/어떻게 일하는가)로 최소화 + AI가 백그라운드에서 컨텍스트 파악.
- 적용: 폼 질문 최소화, 디테일은 AI 인터뷰가 대화로 채우는 역할 분담.

#### Hinge — R7 참조 (프롬프트 카테고리·Esther Perel 협업 세트·AI Prompt Feedback).

---

## R9. 역할명 용어 조사

### A. 영문 용어 공식 사용례

| 용어 | 기관+URL | 정의/뉘앙스 | 평가 |
|---|---|---|---|
| Changemaker | Ashoka https://www.ashoka.org/en-us/story/what-does-change-maker-mean | "someone who is taking creative action to solve a social problem." 보편주의(누구나). | 매우 수평적. Ashoka 브랜드 색 강함. |
| Social innovator | Schwab https://www.schwabfound.org/about ; Skoll https://skoll.org/ | 단일 정의문 미확인. "pioneering social innovators…" | 수평·확장적, "pioneering"에 엘리트 뉘앙스 소폭. |
| Ecosystem builder | Kauffman https://www.kauffman.org/currents/the-economy-needs-ecosystem-builders/ | "individuals who focus their work on building a system of support and resources for entrepreneurs…" | 수평적 인프라 구축자. 스타트업 어휘 색채. |
| Enabler | 단일 공식 정의 미확인 (OECD 2021 "enabling ecosystem"만) | — | 조력·보조 뉘앙스, "지원 도구"로 읽힐 위험. 신중. |
| Intermediary | 42 USC §12653s(a)(2) https://www.law.cornell.edu/definitions/uscode.php?def_id=42-USC-326728723-494366937 | "experienced and capable nonprofit entity… capacity building assistance" | 기능적·중립적이나 사무적. |
| Practitioner | 사회혁신 특화 정의 미확인 | 일반 명사 | 수평적이나 generic, 정체성 표현력 약함. |
| Field builder | Bridgespan https://www.bridgespan.org/insights/field-building-for-equitable-systems-change | "coalition-based approach to changing systems…" | 협력·연대 지향. 국내 생소. |
| Community weaver / convener | Aspen Weave https://weavers.org/about/ ; BMP Ecosystem Map https://buildingmovement.org/wp-content/uploads/2020/10/Ecosystem-Roles-2020.pdf ; https://collaborativeleadersnetwork.org/leaders/the-role-of-the-convenor/ | "quietly creating connection… leading with love" / "convening power to pull people together" | 후보 중 가장 존중·관계 중심. 번역어 미정착. |
| Catalyst | Bridgespan https://www.bridgespan.org/insights/funding-field-catalysts | "mobilize and galvanize myriad actors… for equitable systems change" | 능동·수평. "함께 반응을 일으키는 존재" — 좋은 후보. |
| Steward | Community Commons https://www.communitycommons.org/collections/Stewardship | "power must be built and distributed with others, not consolidated." | 원칙 부합. 한국어 직역(청지기/관리인)은 위계적 — 주의. |

### B. 국내 공식 사용례

- 사회혁신(개념) 정의: 서울시 https://news.seoul.go.kr/gov/archives/2435 — "사회적 목표와 필요를 충족시키는 새로운 아이디어를 디자인·개발·발전시키는 프로세스". **"사회혁신가"(사람) 정의문은 미확인**. 아쇼카 한국(https://www.ashoka.org/ko-kr)의 "사회혁신가"는 펠로우급 검증 개인 지칭 — 권위 뉘앙스.
- "사회적경제 활동가": 진흥원 페이지에 정의문 미확인. 지자체 사업명 관용 사용.
- 중간지원조직: 사회적경제기본법안(미제정) — "가교(연계)역할… 생태계 조성 지원 조직" (2차 출처, 원문 재확인 실패 — 신뢰도 하향 표기).
- **"사회혁신지원가": 기존 사용례 미확인 → 신규 조어(coined)로 판단.** 백지 정의 가능(장점) vs 학습비용(리스크).
- 소셜벤처: 기보 소셜벤처스퀘어 https://sv.kibo.or.kr/Info/SocvntDef.do — 공식 정의 확인.
- 임팩트얼라이언스 https://impactalliance.net/pages/about — "문제를 해결하는" 조직과 "돕는" 조직 구분 서술 = 은연중 주역/보조 위계 → 반면교사.
- 루트임팩트 https://rootimpact.org/about/ — "체인지메이커" 자체 브랜드 언어 채택 대표 사례.

### C. 회피 표현

| 표현 | 문제 | 대체 |
|---|---|---|
| 공급자/수요자 | 사람을 거래 대상으로 축소(플랫폼 노동 비인간화 인접 담론 — https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003241388 ; 해당 어휘 직접 비판 학술 근거는 미확인) | 구성원, 참여 조직, 파트너 |
| 벤더/공급업체 | 발주-납품 구도 고정(하도급법 규율 어휘) | 협력 조직, 파트너 기관 |
| 갑을/하청/용역 | 위계 전제. 사회혁신 중간지원조직 논의에서도 "용역위탁 방식" 문제 지적(한국사회연대경제학회 2025.8 보고서 — 안정 URL 없음, 자료명 인용) | 협력 사업, 공동수행, 불가피 시 "사업 수행기관" |
| 인적자원 | "something to be used, or used up" — https://goodworkinstitute.org/we-are-not-human-resources/ ; https://nonprofitquarterly.org/liberating-human-resources-finding-a-path-to-a-new-hr-paradigm/ | 구성원, 동료, People & Culture류 |

### D. canonical_role ↔ display_label 매핑 초안 + 적용 옵션

기본 매핑: entrepreneur=기업가, professional(+4 하위)=전문가, operator=운영자 유지. 신규 — `social_innovation_activist`=**사회혁신활동가**, `social_innovation_supporter`=**사회혁신지원가** (고정 후보).

| 옵션 | 방식 | 장점 | 리스크 |
|---|---|---|---|
| 1 대체 | 기존 역할 값을 재명명·흡수 | 일관성·브랜드 명확 | 마이그레이션 + 권한 로직 전수 점검 |
| 2 병행 | 기존=조직·기능 축, 신규=활동 성격 교차 태그 | 스키마 무변경, 다차원 정체성 | UI 복잡도, role/tag 혼란 |
| 3 라벨만 | enum 유지, 표시 문자열만 교체 | 리스크 최소, 되돌리기 쉬움 | 코드-화면 어긋남, 임시방편 |

권고: 옵션3 선배포 → 안정 후 옵션1 2단계. 옵션2는 "지원가/활동가"가 기존 3역할과 안 겹치는 새 축일 때만 — 이번 조사로는 그 전제 미확인.
