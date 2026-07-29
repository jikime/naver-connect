---
schema_version: shuzzi-md/v1
doc_kind: narrative_note
project_slug: hackathon-naverconnect
created_at: 2026-07-29T10:11:03+09:00
updated_at: 2026-07-29T10:25:27+09:00
timezone: Asia/Seoul
research_status: complete_claude_merged
---

# Naver Connect 해외 사례·온보딩·개인 스키마 리서치

## 0. 조사 범위와 판정 기준

- 2026-07-29 기준 공식 제품 페이지, 공식 도움말, 공공·표준기관 문서, 원 논문을 우선했다.
- 공식 근거가 없는 전환율·완료율 수치는 제외했다.
- “현재 제품에서 확인된 사실”과 “Naver Connect에 옮긴 아이디어”를 구분했다.
- 유사 서비스뿐 아니라 업종과 무관하게 온보딩이 재미·참여·첫 가치 체감을 만드는 사례를 포함했다.
- Codex 3개 트랙과 Claude 9개 트랙의 원자료 약 116개 엔트리를 합쳤다.
- 중복과 출처 불명 수치를 걷어낸 선별본은 제품·서비스·커뮤니티 사례 74개와 표준·연구 묶음 17개다. Claude 쪽 9종 원자료 전문과 URL은 [`20260729_research_raw.md`](./20260729_research_raw.md)에 보존했다.

## 1. 현재 Naver Connect를 먼저 해석하면

이 프로젝트는 단순 회원 디렉터리가 아니다.

1. 관계: 주간 추천, 모듬, 회원 검색
2. 기회: 생태계 지도, 격차 리포트, 지식 그래프
3. 실행: 협업 프로젝트, 외부 자원, 공동 백오피스

현재 7단계 온보딩은 조직·지역·미션, 비공개 필요, 공개 제공 역량, 협업 성향, 개인정보 고지, 후속질문, 최종 동의를 수집한다. 공개/비공개 JSON 물리 분리와 DAL masking은 강점이다.

반면 다음 제약이 있다.

- 온보딩 완료 전까지 실질 가치가 거의 보이지 않는다.
- `기업가/전문가`가 필요와 제공 방향까지 고정한다.
- `readiness`와 수정된 `trustConnections` 일부가 finalize 과정에서 손실된다.
- 추천은 정적 JSON/키워드 점수이고, 최종 저장은 세션 플래그뿐이다.
- C 레이어 표시명 `비사회적기업`은 일반기업 외 공공·학계·언론·전문기관까지 포함하므로 부정확하다.

## 2. 가장 가까운 해외 사례 35개

### 2.1 기술·전문성·자원 매칭

| 사례 | 공식 자료에서 확인된 핵심 | Naver Connect 적용 후보 |
|---|---|---|
| [Catchafire](https://www.catchafire.org/org_home) | 비영리단체가 범위가 정해진 프로젝트/1시간 상담을 올리고, 전문가가 경력·기술·관심 원인을 등록해 지원한다. 조직은 수락·질문·거절하고 종료 후 양측 평가를 남긴다. | “사람”보다 작고 명확한 협업 요청을 먼저 만들고, 첫 연결에 2주 trial 또는 1회 상담을 둔다. |
| [MovingWorlds](https://movingworlds.org/matching-process-orgs) | 조직이 필요한 기술을 고르면 운영팀이 scope를 검토·게시하고, 지원자의 경력·동기·이력을 검증한 뒤 계획과 실사를 진행한다. | 자유서술 요청을 바로 공개하지 않고 운영자가 “실행 가능한 요청”으로 다듬는 단계. |
| [Taproot Plus](https://taprootplus.org/help/faq?category=30) | 프로보노 프로젝트를 신중히 scope하고 지원자 screening과 프로젝트 관리를 지원한다. | “좋은 연결”보다 “완료 가능한 협업 단위”를 품질 기준으로 둔다. |
| [Common Impact](https://commonimpact.org/companies/) | 기업 임직원의 기술 기반 자원봉사를 비영리 조직 과제와 연결한다. | 개인 기술 외에 기업이 제공할 팀·시간·프로젝트형 역량을 별도 offer로 모델링한다. |
| [UN Volunteers](https://www.unv.org/become-volunteer/) | 지원자가 글로벌 talent pool 프로필을 만들고 임무·기술·가용성에 따라 기회와 연결된다. | 회원 프로필과 “현재 지원 가능한 임무”를 분리한다. |
| [UN Conecta](https://conecta.ungeneva.org/) | UN 구성원이 사람·기술·프로젝트를 가로질러 도움 요청, 자원봉사, 멘토링, job shadowing, cross-assignment를 찾는다. | 연결 유형을 1:1 소개 하나가 아니라 상담·멘토링·공동작업·섀도잉 등으로 명시한다. |
| [VolunteerMatch](https://www.volunteermatch.org/volunteers/gettingstarted/) | 개인은 지역·원인·기술·일정을, 기관은 검증 후 구체적 기회를 등록한다. “I want to help” 이후 기관이 후속 심사한다. | 사람 추천과 “이번 주 참여 가능한 작은 기회” 추천을 병행한다. |
| [Idealist](https://www.idealist.org/en/volunteer-resources/how-to-volunteer-easy-steps) | 로그인 전에도 원인·기술·위치·원격 여부로 실제 기회를 탐색할 수 있다. | 가입 전에 샘플 기회를 보여주고 온보딩 답변에 따라 즉시 preview를 바꾼다. |
| [Neighbourly](https://knowledge.neighbourly.com/charity-knowledge/neighbourly-volunteering-process) | 기업의 시간·돈·잉여물품을 지역 공익조직의 실제 필요와 연결하고 사회가치를 보고한다. | 제공 역량을 `전문성 / 시간 / 돈 / 공간·물품 / 데이터 / 네트워크`로 확장한다. |
| [Good Market](https://www.goodmarket.global/info/about/) | 사회적기업·협동조합·책임기업의 디지털 커먼즈. 공개 주장·온라인 근거·최소 기준·커뮤니티 신고를 조합하고 개선 후 재신청을 허용한다. | 신뢰를 단일 인증이 아니라 `자기 주장 + 공개 근거 + 커뮤니티 flag + 갱신`으로 만든다. |
| [Goodsted](https://www.goodsted.com/) | 파트너가 협업 workspace에서 약속·활동·측정기준·ESG 목표를 운영하고 발견 가능 여부를 opt-in한다. | 소개 이후 `약속 → 활동 → 증빙 → 결과`를 같은 데이터 흐름으로 연결한다. |

### 2.2 멘토·동료·창업 생태계 매칭

| 사례 | 공식 자료에서 확인된 핵심 | Naver Connect 적용 후보 |
|---|---|---|
| [VC4A Mentorship Marketplace](https://mentors.vc4a.com/) | 멘토는 전문성·선호·일정과 심사를 거치고, 창업가는 구체적 도움 요청을 작성한다. 최대 3명에게 요청하고 운영자 검토 후 멘토가 수락·거절한다. | 첫 추천은 후보 3명, 추천 이유, 운영자 검토, 상대 최종 수락으로 제한한다. |
| [ADPList](https://intercom.help/adplist-community/en/articles/8544615-adplist-mentor-criteria) | 멘토를 수동 심사하고 도움 가능/불가능 주제, 일정, 예약 질문을 받는다. 후기·출석률·완료 세션으로 신뢰 배지를 준다. | 전문성 신뢰와 응답성·약속 이행 신뢰를 별도 점수로 둔다. |
| [Together](https://help.togetherplatform.com/hc/en-us/articles/40469035913363-Match-Scores) | 역할·수용량·목표·기술·시간을 수집하고 각 조건을 must~somewhat로 가중한다. 자기 선택, 단측/양측 승인, 관리자 매칭을 지원한다. | 필요/제공 항목마다 `필수 / 중요 / 있으면 좋음`을 사용자가 지정한다. |
| [Mentorloop](https://mentorloop.com/how-it-works/matching/) | 자기 선택·추천·관리자 매칭을 병행하며 코호트 전체의 조합을 고려한다. 매칭 이유를 설명하고 연결 후 private Loop에서 목표·메시지·일정을 관리한다. | 개인 Top-1만 최적화하지 않고 고립·쏠림·반복 노출을 함께 본다. |
| [PushFar](https://support.pushfar.com/knowledge-base/getting-started-searching-for-a-mentor/requesting-a-mentor) | 가용성·수용 인원을 먼저 보고 기술·목표·위치·기관을 조합한다. View/Request/Dismiss가 있고 목표 공개범위를 선택한다. | capacity gate, 상대에게 알리지 않는 “이번엔 아님”, 비공개 공동 목표를 도입한다. |
| [Braindate](https://www.braindate.com/what-is-braindate/) | 직함보다 “나누고 싶은 지식 / 함께 풀고 싶은 문제”를 Topic Market에 먼저 올리고 1:1·그룹 대화를 예약한다. | 프로필보다 `도움을 줄 대화 1개 + 도움받을 대화 1개`를 먼저 만든다. |
| [Wazoku / InnoCentive](https://www.wazoku.com/how-the-wazoku-crowd-works/) | 문제를 가진 Seeker가 challenge와 IP 조건을 명시하고, 다양한 Solver가 해결안을 낸다. | 이력 유사도뿐 아니라 “예상 밖 인접 분야가 이 문제를 풀 수 있는가”를 추천한다. |

### 2.3 사회혁신·임팩트 네트워크

| 사례 | 공식 자료에서 확인된 핵심 | Naver Connect 적용 후보 |
|---|---|---|
| [WEF UpLink](https://uplink.weforum.org/innovation-challenges) | 문제별 공개 challenge → 다단계 심사 → Top Innovator cohort → 투자·산업·전문가 연결. | 관계 추천 외에 문제 기반 Opportunity 트랙을 둔다. |
| [MIT Solve](https://solve.mit.edu/innovators/become-a-solver) | 문제·대상·혁신·영향·실현가능성·people-first 설계를 평가하고, 탈락자에게 점수·benchmark·요약 피드백을 주어 재신청을 돕는다. | 매칭 실패에도 “무엇이 부족했는지”를 알려 다음 요청의 질을 높인다. |
| [Social Shifters](https://www.socialshifters.co/our-impact/) | 초기 아이디어부터 운영 조직까지 받아 학습·커뮤니티를 제공하고 우수팀에는 멘토·피치 지원을 연결한다. | 온보딩 완료 자체에 작은 학습 보상과 동료 공간을 제공한다. |
| [Ashoka](https://www.ashoka.org/en-us) | changemaker, social entrepreneur, supporter/intermediary를 구분하며 네트워크·펀드·교육·컨설팅 등 지원 생태계를 포괄한다. | 영구 직군 하나보다 다중·시점별 역할을 둔다. |
| [Acumen Academy](https://acumenacademy.org/faqs/) | 문제와 리더십을 중심으로 작은 cohort, 동료, mentor를 학습 안에서 연결한다. | 온보딩 질문을 별도 설문이 아니라 작은 문제정의 exercise로 만든다. |
| [Skoll Foundation](https://skoll.org/2023/05/10/lessons-in-trust-and-collective-action-from-the-skoll-community-of-social-innovators/) | 높은 수준의 사전 선별과 장기 관계, 지역·주제별 소규모 큐레이션을 운영한다. | 첫 연결 일부는 자동화하지 않고 trusted circle로 사람 큐레이션한다. |
| [Euclid Network](https://euclidnetwork.eu/) | 사회적기업·사회혁신가와 support organisations를 연결하고 peer learning·연구·정책·기회를 제공한다. | 개인과 지원조직, 네트워크를 같은 actor graph에서 서로 다른 역할로 표현한다. |
| [Social Enterprise World Forum](https://sewfonline.com/about-sewf/) | network-of-networks 방식으로 연중 커뮤니티·정책·연구·collective identity를 만든다. | 개별 회원뿐 아니라 기존 네트워크/모임 단위 onboarding을 지원한다. |
| [Impact Hub](https://impacthub.net/community-events/) | 지역 허브와 글로벌 네트워크가 공간·이벤트·프로그램으로 커뮤니티를 연결한다. | 디지털 추천을 지역 거점과 실제 모임으로 전환한다. |
| [Catalyst 2030](https://catalyst2030.net/wp-content/uploads/Catalyst-2030-brochure-7-May-2022.pdf) | 회원 주도 짧은 Conversation Café에서 연결·잠재 파트너·협업을 발견한다. | 첫 추천을 바로 장기 프로젝트가 아니라 짧은 주제 대화로 시작한다. |
| [SIX / Social Innovation Exchange](https://socialinnovationexchange.org/legacy/what-we-do/) | 지역·sector·seniority를 가로지르는 network-of-networks와 practitioner wisdom을 중시한다. | 매 추천 세트에 한 명의 “unusual suspect” 슬롯을 둔다. |
| [Impact Entrepreneur](https://impactentrepreneur.com/community/) | member directory, forum, 행사, 지식 콘텐츠를 결합한다. | 디렉터리만 만들지 말고 대화·학습 맥락을 관계 형성에 붙인다. |

### 2.4 행사·비즈니스 네트워킹

| 사례 | 공식 자료에서 확인된 핵심 | Naver Connect 적용 후보 |
|---|---|---|
| [Grip](https://www.grip.events/products/event-matchmaking) | 등록·온보딩과 행동을 함께 학습하고 interested/skip, 일정 예약, 사후 rating을 받는다. | 명시적 태그와 실제 행동을 분리해 저장하고 최근 행동으로 보정한다. |
| [Brella](https://help-attendees.brella.io/en/articles/180699-onboard-an-event-on-brella-mobile) | persona·industry·function·목적·소개·가용시간을 받고 사람·세션·회사 추천과 일정 예약으로 연결한다. | 온보딩 완료 보상을 “언젠가 추천”이 아니라 예약 가능한 15분 슬롯으로 보여준다. |
| [b2match](https://support.b2match.com/ai-meeting-recommendations) | 프로필과 방문·bookmark·요청·not interested를 조합하고 추천 카드에 직무·위치·pitch·기술·관심을 표시한다. | “관심 없음”을 조용한 학습 신호로 사용하고 추천 이유 필드를 구조화한다. |
| [Swapcard](https://www.swapcard.com/features/event-networking) | 목표·관심·프로필·행동을 사용하며 networking은 opt-in, visibility rule과 일정 예약을 제공한다. | discoverability와 추천 참여를 별도 동의로 분리한다. |
| [Lunchclub](https://www.lunchclub.ai/) | 배경·목표·관심사를 바탕으로 주기적인 전문 네트워킹 만남을 만든다. | “이번 주 연결받기” opt-in과 반복 가능한 작은 만남 주기를 둔다. |

## 3. 업종 무관 창의적 온보딩 사례 21개

| 패턴 | 사례 | 확인된 장치 | 차용할 것 / 피할 것 |
|---|---|---|---|
| 가입 중 핵심행동 | [Duolingo](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/) | 목표·수준을 묻는 동안 실제 수업/배치시험을 수행 | 온보딩 안에서 추천 결과 변화를 체험 / streak 죄책감 제외 |
| 실제 결과물 생성 | [GitHub Skills](https://docs.github.com/en/get-started/start-your-journey/git-and-github-learning-resources) | 설명 대신 실제 저장소에서 작은 행동을 하고 결과물을 남김 | “첫 협력 브리프”를 직접 수정·완료 |
| learning by doing | [Brilliant](https://brilliant.org/help/features/what-are-learning-paths/) | 설명과 상호작용 문제를 섞고 즉시 피드백 | 생태계 지도에 위치·막힌 곳·도울 곳을 직접 배치 |
| micro action | [Mimo](https://mimo.org/mimo-coding-app) | 큰 목표를 짧은 실제 실행으로 쪼갬 | 3분짜리 협업 상황 선택 / 형식적 streak 제외 |
| 감정적 외재화 | [Finch](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide) | 캐릭터 돌봄을 통해 자기관리 행동을 외재화 | “연결 씨앗/생태계가 자란다” / 귀여움으로 민감수집 은폐 금지 |
| 협력 퀘스트 | [Habitica](https://habitica.com/static/home) | 현실 행동을 RPG 목표·파티로 번역 | 탐험 노드만 차용 / 공개 순위·처벌 제외 |
| 세계관 | [Animal Crossing](https://www.nintendo.com/en-gb/Support/Nintendo-Switch/How-to-Start-a-New-Game-Animal-Crossing-New-Horizons--1747986.html) | 설정을 새로운 세계에 거점을 세우는 이야기로 구성 | 사회혁신 지도에 거점 배치 / 변경 불가 선택 제외 |
| 자기표현 | [Snapchat Bitmoji](https://help.snapchat.com/hc/en-us/articles/7012345832596-How-do-I-create-and-edit-my-Bitmoji-avatar) | 입력 결과가 즉시 나를 대신하는 표현으로 보임 | 외형 대신 수정 가능한 협업 archetype |
| 한 화면 한 질문 | [Typeform](https://www.typeform.com/blog/create-better-online-forms) | 짧은 질문·조건 분기·진행 표시 | 매 답변 후 “이 정보가 추천을 어떻게 바꿨는지” 표시 |
| 대화형 복잡성 축소 | [Lemonade](https://www.lemonade.com/blog/introducing-lemonade-insurance-api/) | 캐릭터 대화로 복잡한 조건을 단계 수집 | 중립적 연결 안내자 / 캐릭터로 과신 유도 금지 |
| 대화 시작점 | [Hinge](https://help.hinge.co/hc/en-us/articles/46735258688659-What-are-Convo-Starters) | 추상 소개 대신 3개 prompt를 프로필·첫 대화 anchor로 사용 | “최근 해결한 문제 / 30일 내 움직일 일 / 나눌 실패 경험” |
| opening move | [Bumble](https://support.bumble.com/hc/articles/28776942830365-Setting-Opening-Moves) | 상대가 답할 사전 질문으로 첫 메시지 부담을 줄임 | “나에게 말을 걸 때 이 질문으로 시작해 주세요” |
| 즉시 정보구조 개인화 | [Discord Community Onboarding](https://support.discord.com/hc/en-us/articles/11074987197975-Community-Onboarding-FAQ) | 답변이 즉시 역할·채널·화면을 바꾸며 언제든 수정 가능 | 관계/기회/자원/지식/모임 순서를 즉시 재구성 |
| 초기 선택을 행동이 대체 | [Netflix](https://help.netflix.com/en/node/100639) | 초기 선호는 선택 가능하며 실제 이용 행동으로 갱신 | 최초 태그는 cold-start일 뿐, 거절·수락·만남이 점차 대체 |
| 암묵 신호 | [TikTok](https://support.tiktok.com/en/getting-started/for-you/test-for-you) | skip·관심 없음·행동으로 빠르게 적응하고 이유·초기화 제공 | 카드 6개에 “더 보고 싶음/지금은 아님/도울 수 있음” / 중독 루프 제외 |
| 신뢰 릴레이 | [Substack Recommendations](https://support.substack.com/hc/en-us/articles/5036794583828-How-can-I-recommend-other-publications-on-Substack) | 이미 신뢰한 창작자의 추천으로 다음 관계 확장 | 누가 왜 신뢰하는지 최소 근거 / 유명인 편중 감시 |
| 반복되는 우연 | [Donut Intros](https://help.donut.ai/en/articles/597029-what-are-donut-intros-how-does-donut-work) | opt-in 채널에서 과거 소개를 피하며 주기적 만남·캘린더 제안 | 주간 15분 opt-in / 강제 랜덤미팅 제외 |
| 기여 후 열람 | [BeReal](https://help.bereal.com/hc/en-us/articles/7350386715165--Time-to-BeReal) | 먼저 기여해야 타인의 기여를 볼 수 있는 상호성 | “하나를 나누면 세 연결을 봐요” / 카운트다운·FOMO 제외 |
| 편집 가능한 자동 초안 | [YNAB](https://support.ynab.com/en_us/does-ynab-create-targets-automatically-HJ4k1nBWfg) | 기존 데이터를 바탕으로 목표 초안을 만들고 사용자가 수정 | 가져온 데이터로 필요/제공 초안, 모든 항목 승인제 |
| 단계적 신뢰 | [Monzo](https://monzo.com/help/opening-an-account/how-to-open-a-Monzo-Personal-Account) | 높은 신뢰 절차의 이유와 단계를 명확히 분리 | 일반 가입에는 신원인증 금지, Deal/자금 단계에서만 추가 인증 |
| 좋은 행동 인정 | [Stack Overflow](https://stackoverflow.com/help/what-are-badges) | 커뮤니티에 도움이 되는 실제 행동을 badge로 학습 | 공개 랭킹 없이 구체적 도움 요청·감사·소개 완료만 조용히 인정 |

### 3.1 Claude 병렬 조사에서 추가로 살아남은 18개 사례

| 묶음 | 추가 사례 | 채택한 이유 |
|---|---|---|
| 단계적 신뢰 | Zebras Unite, Toniic, DataKind | 정체성 노출 동의, 고신뢰 소개의 사람 검토, 교육·서약 기반 gate |
| 실패 피드백 | Echoing Green | 거절을 끝으로 만들지 않고 rubric 기반 개선 신호로 되돌림 |
| 추천 피로·후보 생성 | LinkedIn PYMK | 제거 후보 재추천 억제와 다단 후보생성 구조 |
| 커뮤니티 역할 | On Deck, Hampton, YC Co-founder Matching | Give/Take, Mirror/Mentor/Mentee, 상호 수락의 서로 다른 역할 프레임 |
| 행동 기반 신뢰 | Discourse, Orbit | 가입 시 자기주장보다 기여 행동으로 접근 범위를 점진 개방 |
| 즉시 개인화 | Spotify, Co-Star | 첫 선택 즉시 화면·리딩이 바뀌어 온보딩 완료 전 가치를 체감 |
| 설명형 질문 | Noom, Headspace | 질문의 이유, 공감 카피, 선택의 의식화 |
| AI 보조 입력 | Notion, Woebot | 질문 최소화, 버튼+자유입력, 편집 가능한 자동 구조화 |
| 고가치 연결 | Superhuman | 모든 연결을 자동화하지 않고 중요한 초기 회원은 concierge로 학습 |

## 4. Naver Connect에 가장 강하게 맞는 12개 장치

### 4.1 문제·대화가 프로필보다 먼저

Braindate, Catchafire, VC4A, Wazoku의 공통점은 “누구인지”보다 “지금 무엇을 함께 하고 싶은지”가 더 강한 매칭 신호라는 점이다.

필수 산출물:

- 지금 함께 풀 문제 1개
- 내가 나눌 수 있는 경험·자원 1개
- 첫 대화를 시작하기 좋은 질문 1개

### 4.2 온보딩 중 이미 첫 가치를 보여주기

Duolingo·Discord·GitHub Skills처럼 답이 저장만 되는 것이 아니라 곧바로 화면과 결과를 바꿔야 한다.

- 답변 하나마다 추천 미리보기 변화
- 완성 중인 공개 프로필 live preview
- 마지막에 추천 3명과 “왜 서로에게 의미가 있는지”

### 4.3 첫 추천은 3명만

VC4A와 현재 Naver Connect의 “첫 세 명” 서사는 잘 맞는다.

1. 공통점이 커서 편안한 사람
2. 필요와 제공이 맞는 보완적 사람
3. 다른 분야지만 같은 대상·문제를 보는 예상 밖의 사람

### 4.4 가용성·수용량을 유사도보다 먼저

Together, PushFar, Brella, ADPList는 좋은 상대라도 지금 시간이 없으면 나쁜 추천이 된다는 점을 명시적으로 다룬다.

- 현재 상태: open / limited / paused
- 이번 달 가능한 연결 수
- 선호 시간대가 아니라 우선 `주기`와 `방식`
- 정확 일정은 상호 수락 후 공개

### 4.5 점수보다 reciprocal explanation

추천 카드의 핵심은 87점이 아니라 아래 네 문장이다.

- 당신이 원하는 것
- 상대가 제공할 수 있는 것
- 상대도 얻는 것
- 가장 가벼운 첫 행동

### 4.6 자동 추천 + 사람 검토

첫 연결, 민감한 프로젝트, 이해충돌 가능성이 있는 매칭은 운영자가 검토한다. 자기 탐색·추천·운영자 매칭을 혼합한다.

### 4.7 상호성은 쓰되 압박은 버리기

“Give one, see three”는 유효하지만 BeReal식 시간 압박·FOMO는 쓰지 않는다.

### 4.8 조용한 거절

`이번엔 아님`, `이미 아는 사이`, `시기가 안 맞음`, `필요/제공이 다름`은 상대에게 공개하지 않고 필터·프로필 수정 후보로만 쓴다.

### 4.9 신뢰를 여러 축으로

- 자기 주장
- 증빙·소속 확인
- 기존 연결자의 endorsement
- 응답성·약속 이행
- 신고·안전

전문성, 공신력, 약속 이행을 하나의 점수로 합치지 않는다.

### 4.10 연결 뒤 private collaboration space

추천이 성공하면 공개 프로필과 분리된 공간에서 목표·일정·파일·회의·결과를 관리한다. 장기적으로 현재 Deal Room과 자연스럽게 이어진다.

### 4.11 실패도 학습 경험으로

MIT Solve처럼 “왜 매칭되지 않았는지 / 무엇을 더 구체화하면 좋은지”를 알려준다. 이전 답을 저장해 다음 요청에서 재사용한다.

### 4.12 개인 최적화 외에 생태계 건강

Mentorloop·reciprocal recommendation 연구를 따라 아래를 함께 본다.

- 특정 인기 회원으로의 노출 쏠림
- 반복 추천
- 오랫동안 연결되지 못한 회원
- 분야·지역·조직 유형 다양성
- 양쪽 수락 가능성과 수용량

## 5. 권장 온보딩 MVP

기존 7단계 구조를 완전히 버리지 않고 경험을 바꾼다.

### 장면 1 — “이번 연결에서 나는 어떻게 참여할까요?”

- 상위 정체성: 사회혁신 파트너
- 복수 역할: 사회혁신활동가 / 사회혁신지원가
- 세부 기능: 현장 실행, 연구, 전문자문, 자금·투자, 연결, 역량강화, 정책, 교육
- 영구 신분이 아니라 현재 연결 맥락임을 명시

### 장면 2 — 생태계 지도에 내 위치 놓기

- 지역은 coarse level
- 분야·가치사슬에서 현재 활동하는 곳
- 막혀 있는 곳
- 도울 수 있는 곳

### 장면 3 — 대화 카드 두 장 만들기

- “지금 함께 풀고 싶은 문제”
- “내가 나눌 수 있는 경험·자원”
- 태그는 보조, 구체적 문장이 정본
- 각 카드에 required / preferred / open 조건

### 장면 4 — 나에게 말을 거는 가장 좋은 방법

- 협업 방식
- 현재 가용상태와 수용량
- opening question
- 개인/조직 구성원/조직 대표 중 이번 참여 권한

### 장면 5 — 짧은 adaptive follow-up

- 가장 모호한 항목에 한 번에 질문 하나
- 최대 2개를 기본으로 하고 정말 필요한 경우만 3개
- 질문마다 공개/비공개와 사용 목적을 바로 표시
- AI 요약과 원문을 마지막에 함께 검토

### 장면 6 — 공개범위와 엔진 사용을 분리 동의

- 공개 프로필
- 비공개 필요의 매칭 사용
- 임베딩 생성·외부 처리
- 소개 시 전달할 요약
- 분석·모델 학습은 별도 opt-in

### 장면 7 — 첫 세 연결 미리보기

- 공통 / 보완 / 예상 밖 각 1명
- 양쪽 이익과 첫 행동
- 운영자 검토 여부
- 상대 수락 전에는 정확 연락처·프로젝트 원문·일정을 비공개

## 6. 역할·표현 용어집

### 6.1 확정·권고

| 현재/후보 | 권고 표시 | 설명 |
|---|---|---|
| 전체 회원 | 사회혁신 파트너 | 활동·지원·연결 역할을 포괄 |
| 활동가 | 사회혁신활동가 | “현장의 문제를 발견하고 해결을 실행해요.” |
| 지원가 | 사회혁신지원가 | “전문성·자원·연결로 실행을 돕고 함께해요.” |
| 비사회적기업 | 사회혁신 협력 파트너 | 일반기업·공공·학계·언론·전문기관을 중립적으로 포괄하는 임시 최우선안 |

`사회혁신활동가 / 사회혁신지원가`는 사용자의 지시에 따라 고정한다. 두 역할은 복수 선택 가능하고 연결마다 달라질 수 있어야 한다.

### 6.2 피하거나 UI에서 풀어쓸 표현

| 표현 | 문제 | UI 대안 |
|---|---|---|
| 비사회적기업 | 부정적이며 공공·학계·언론도 “기업”으로 오분류 | 사회혁신 협력 파트너 |
| 수요자 / 공급자 | 거래·일방향 프레임 | 지금 필요한 것 / 함께 제공할 수 있는 것 |
| 핫리드 | 영업 CRM 용어 | 바로 시작할 협업 / 실행 준비 과제 |
| 딜룸 | 투자·M&A 인상 | 협업 실행공간(내부 canonical은 유지 가능) |
| 전문가 | 지식 위계·거래 프레임 | 연구자, 자문가, 멘토, 역량강화 파트너 등 기능 태그 |
| 기업가 | 창업자·소유자 중심 | 사회혁신활동가 + 창업가/조직대표 세부 태그 |
| 중간지원자 | 브로커·중개업 인상 | 사회혁신지원가 + 연결자/생태계조성자 |

공식 국제 용례도 한 단어로 통일하지 않는다. [Ashoka](https://community.ashoka.org/sites/default/files/2023-11/Supporting%20System%20Changers_Final_Page.pdf)는 supporter/intermediary를 넓은 지원 생태계로, [EU Social Economy Gateway](https://social-economy-gateway.ec.europa.eu/document/download/f3d3b106-41b2-44ea-b143-b3fd96b14333_en?filename=Social+economy+strategies+at+a+glance.pdf)는 social economy organisations 외 public institutions, investors, private enterprises, universities를 ecosystem stakeholders로 부른다.

### 6.3 변경 이력을 보존하는 versioned vocabulary

표시 문자열을 사용자 데이터나 enum에 직접 저장하지 않는다. 프로필·추천·이벤트에는 변하지 않는 `concept_id`와 당시 `vocabulary_version`을 저장하고, 화면에서 그 시점의 라벨을 해석한다.

```ts
type TermStatus = "draft" | "in_review" | "active" | "retired";
type LabelKind = "preferred" | "alternative" | "deprecated" | "blocked";

interface VocabularyRelease {
  version: string;               // semver, 예: "role-terms/1.1.0"
  released_at: string;
  decision_record_ids: string[];
  approved_by: string[];
}

interface TermConcept {
  concept_id: string;            // immutable, 예: "nvc.role.001"
  canonical_code: string;        // API/분석용 stable code
  definition: string;            // 라벨이 아니라 개념의 의미
  broader_concept_ids?: string[];
  related_concept_ids?: string[];
  status: TermStatus;
}

interface TermLabelRevision {
  revision_id: string;
  concept_id: string;
  locale: "ko-KR" | "en";
  label: string;
  label_kind: LabelKind;
  valid_from: string;
  valid_until?: string;
  supersedes_revision_id?: string;
  change_reason: string;
  evidence_urls?: string[];
  proposed_by: string;
  approved_by?: string[];
  approved_at?: string;
  migration_note?: string;
}

interface VocabularyChangeEvent {
  event_id: string;
  event_type:
    | "concept.created"
    | "label.proposed"
    | "label.activated"
    | "label.deprecated"
    | "concept.split"
    | "concept.merged";
  concept_ids: string[];
  from_version?: string;
  to_version: string;
  actor_id: string;
  reason: string;
  occurred_at: string;
}
```

초기 이력은 다음처럼 적재한다.

| concept_id | legacy label | 현재 preferred label | 상태 |
|---|---|---|---|
| `nvc.role.001` | 활동가 | 사회혁신활동가 | legacy label은 deprecated alias |
| `nvc.role.002` | 지원가 | 사회혁신지원가 | legacy label은 deprecated alias |
| `nvc.role.003` | 비사회적기업 | 사회혁신 협력 파트너 | legacy label은 blocked, 검색·과거 해석에만 사용 |

운영 규칙:

1. 라벨을 덮어쓰지 않고 기존 revision의 `valid_until`을 닫은 뒤 새 revision을 append한다.
2. 단순 명칭 개선은 같은 `concept_id`, 의미가 갈라지면 `concept.split`, 합쳐지면 `concept.merged`로 새 concept를 만든다.
3. 과거 이벤트에는 `concept_id`, `vocabulary_version`, 선택적 `label_snapshot`을 함께 남겨 당시 화면을 재현한다.
4. 검색은 preferred·alternative·deprecated alias를 받되, 작성 UI에는 active preferred label만 노출한다.
5. 변경은 `draft → in_review → active` 승인 흐름과 근거·변경 사유를 거친다. 한 사람이 제안·승인을 모두 하지 않는 것을 기본으로 한다.
6. JSON-first에서는 `vocabulary/releases/*.json`과 append-only `vocabulary-change-events.jsonl`을 정본으로 두고, DB 전환 시 `term_concepts`, `term_label_revisions`, `vocabulary_releases`, `vocabulary_change_events`에 그대로 대응한다.

## 7. 개인·조직 canonical schema

### 7.1 설계 원칙

1. Person과 Organization을 분리한다.
2. 사람-조직 관계는 Affiliation으로 연결한다.
3. 역할은 다중·시점·맥락별 RoleAssertion이다.
4. 모든 actor가 NeedIntent와 CapabilityOffer를 모두 가질 수 있다.
5. 공개 / 비공개 / 시스템 파생을 물리 분리한다.
6. 임베딩은 사람 전체가 아니라 개별 need/offer/item 단위다.
7. 외부 분류는 선택적 mapping이고 한국어 local taxonomy가 정본이다.

### 7.2 핵심 엔터티

```ts
type ActorRef = {
  kind: "person" | "organization" | "project";
  id: string;
};

interface RoleAssertionV1 {
  id: string;
  display_label: string;
  canonical_role_codes: string[];
  context: {
    kind: "personal" | "organization" | "project";
    ref_id?: string;
  };
  acting_capacity:
    | "personal"
    | "organization_member"
    | "organization_representative";
  active_period?: { from?: string; until?: string };
}

interface NeedIntentV1 {
  id: string;
  owner: ActorRef;
  topic_codes: string[];
  detail_quote: string;          // 비공개 원문
  safe_share_summary?: string;   // 사용자 승인 소개문
  priority: "primary" | "normal";
  urgency: "exploring" | "active" | "time_sensitive";
  constraints: ConstraintV1[];
  valid_until?: string;
}

interface CapabilityOfferV1 {
  id: string;
  owner: ActorRef;
  topic_codes: string[];
  skill_codes: string[];
  detail: string;
  resource_types: (
    | "expertise"
    | "time"
    | "funding"
    | "space_goods"
    | "data"
    | "network"
  )[];
  evidence_refs?: string[];
  capacity?: { status: "open" | "limited" | "paused"; max_active?: number };
  valid_until?: string;
}

interface ConstraintV1 {
  kind: "region" | "mode" | "language" | "availability" | "role" | "other";
  strength: "required" | "preferred" | "open";
  values: string[];
}
```

### 7.3 공개 / 비공개 / 파생

| 공개 | 비공개·매칭 전용 | 시스템 파생 |
|---|---|---|
| 표시명, 사용자 확정 역할 | 연락처, 정확 일정 | 정규화 후보·confidence |
| 공개한 소속과 역할 | 필요 원문·우선순위 | 임베딩·모델·버전 |
| 대략 활동지역 | 정확 위치·이동 제약 | 후보 점수·reason code |
| 미션·분야·임팩트 의도 | 조직 대표 권한 근거 | 노출·추천 이력 |
| 제공 항목과 공개 근거 | 차단·숨김·거절 이유 | 품질·안전 flag |
| 협업 방식 | 상호 수락 후 공개할 정보 | 파생 provenance |

시스템 파생값도 개인정보다. 사용자는 정규화 결과와 추천 이유를 확인·수정할 수 있어야 한다.

### 7.4 기본 미수집

- 생년월일, 성별, 정치·종교, 건강·장애, 가족, 소득
- 주민번호·신분증 사본
- 정확한 집 주소
- 제3자 동의 없는 실명 trust connection
- 자유서술에서 추론한 민감 속성

## 8. taxonomy와 표준

| 표준 | 적합한 용도 | 제한 |
|---|---|---|
| [Schema.org Person/Organization](https://schema.org/Person) | Person, Organization, affiliation, skills, knowsAbout 호환 | skill 수준·근거가 약함 |
| [Schema.org Role/DefinedTerm](https://schema.org/Role) | 역할 기간과 외부 term code 연결 | 제품 도메인 확장 필요 |
| [ESCO](https://esco.ec.europa.eu/en/use-esco) | stable URI 기반 기술·직업 mapping | 한국어 미지원, local taxonomy 정본 필요 |
| [O*NET](https://www.onetcenter.org/content.html) | 기술·지식·능력·활동 보조 어휘 | 미국 노동시장 중심 |
| [UN SDGs](https://sdgs.un.org/goals) | impact goal/target 계층 | 아이콘 17개만 저장하면 너무 거침 |
| [IRIS+](https://iris.thegiin.org/metrics/) | What/Who/How Much/Contribution/Risk와 성과지표 | 개인의 “착함” 평가에 사용 금지 |
| [Impact Management Platform](https://impactmanagementplatform.org/) | impact framework 간 관계와 공공 표준 탐색 | MVP 전체 도입은 과함 |
| [W3C DPV](https://www.w3.org/community/reports/dpvcg/CG-FINAL-dpv-20240801/) | 목적·처리·수신자·보유·동의 receipt | 법률 검토를 대체하지 않음 |
| [W3C Privacy Principles](https://www.w3.org/TR/privacy-principles/) | 최소수집·목적제한·철회·handshake | 제품별 적용 설계 필요 |
| [W3C Verifiable Credentials 2.0](https://www.w3.org/TR/vc-data-model/) | 소속·자격의 issuer/holder/verifier와 선택 공개 | MVP 신분증 수집 이유가 되지 않음 |
| [Open Referral HSDS](https://docs.openreferral.org/en/3.1/hsds/overview.html) | 지역 서비스·기관·자원 데이터 교환 | 개인 추천 모델과는 별도 |
| [JSON Schema 2020-12](https://json-schema.org/understanding-json-schema/reference/schema) | JSON-first versioned validation | TS와 정본 이원화 금지 |
| [CloudEvents](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md) | JSON/DB 공통 feedback event envelope | 필요한 최소 필드만 차용 |

## 9. 임베딩 공간

### 9.1 벡터 단위

사람 한 명당 벡터 하나를 만들지 않는다.

1. `offer_capability:{offer_id}`
2. `need_intent:{need_id}`
3. `impact_intent:{intent_id}`
4. `organization_context:{affiliation_id}`
5. 선택적 `collaboration_style:{profile_id}`

거울형·취미형·선배형의 공통점 축은 M2에서 별도 `mission` 벡터를 추가하지 않고 `impact_intent`를 풍부하게 만들어 우선 커버한다. `impact_intent`에는 만들고 싶은 변화, 대상, 접근 방식, 지역·시간 범위를 넣고 `organization_context`와 구조화된 협업 방식 feature를 함께 재정렬한다. 전용 mission 벡터는 ablation에서 의미 있는 이득이 확인될 때만 추가해 사람 전체를 한 벡터로 고정하는 문제를 피한다.

### 9.2 임베딩 금지

- 이름, 이메일, 전화번호
- 실명 trust connection
- 정확 위치와 일정
- 차단·거절·안전 신고
- 민감속성과 민감속성 추론
- 운영자의 비공개 메모

비공개 필요 원문은 바로 임베딩하지 않고 PII 제거 및 사용자 확인을 거친 matching statement를 기본 입력으로 한다.

### 9.3 추천 파이프라인

```text
hard filters
  → exact taxonomy + full-text + dense 후보 합집합
  → need A → offer B 방향 적합도
  → B의 참여 의향·기대 이익
  → 협업 방식·가용성·임팩트 맥락 재정렬
  → 상호이익·노출 공정성·다양성 재정렬
  → 근거 필드 기반 reason code
  → 첫 연결은 human review
```

지역·분야는 항상 hard filter가 아니다. 사용자가 required / preferred / open을 지정한다.

### 9.4 모델 결정

현재 특정 provider로 고정하지 않는다.

- [Naver CLOVA Studio Embedding v2](https://guide.ncloud-docs.com/docs/en/clovastudio-dev-langchain)는 `bge-m3`를 제공한다.
- [BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)는 1024차원, 100개 이상 언어, 8,192 token을 지원한다.
- 현재 프로젝트에는 embedding provider key와 로컬 model cache가 없다.

권장 순서:

1. 현재 structured/keyword baseline을 보존한다.
2. 한국어 gold set과 provider adapter를 먼저 만든다.
3. local BGE-M3와 CLOVA BGE-M3를 같은 데이터로 비교한다.
4. hosted provider에 비공개 입력을 보내려면 별도 동의와 처리정책을 확인한다.

## 10. hard filters와 피드백

### 10.1 벡터 검색 전 필수 필터

- 본인, 탈퇴·비활성·비공개
- 목적별 동의 철회
- 차단·숨김·안전 신고
- 이미 아는 관계·최근 명시적 거절·cooldown
- 조직 대표권한이 필요한 요청의 대표 상태
- 이해충돌
- required 지역·언어·방식·기간
- availability paused, capacity full
- 만료된 need/offer

### 10.2 이벤트

```text
recommendation.impression
recommendation.viewed
recommendation.explanation_opened
recommendation.interested
recommendation.passed
introduction.requested
introduction.accepted
introduction.declined
meeting.scheduled
meeting.completed
outcome.would_meet_again
outcome.collaboration_started
recommendation.blocked
recommendation.reported
explanation.inaccurate
```

주의:

- impression은 선호가 아니다.
- 무응답을 부정 선호로 보지 않는다.
- 한쪽의 거절 이유를 상대에게 공개하지 않는다.
- block/report는 학습보다 먼저 즉시 필터에 반영한다.

## 11. 동의와 삭제

단일 boolean을 목적별 receipt로 분리한다.

- `publish_profile`
- `use_private_needs_for_matching`
- `generate_match_embeddings`
- `facilitate_introduction`
- `product_analytics`
- `model_training`
- 외부 API 사용 시 `external_processor_transfer`

`product_analytics`, `model_training`, 외부 전송은 기본 off가 적절하다.

철회 시:

1. discoverable=false
2. 신규 추천·소개 중단
3. 목적 관련 벡터 invalidate/delete
4. 검색 캐시·추천 feature에서 제거
5. 원문·AI 인터뷰 원문 삭제 또는 승인된 보존정책 적용
6. 이벤트의 개인 참조 제거 또는 익명 집계
7. 동의 이력과 사용자 데이터 JSON export 제공

## 12. 평가

### 12.1 오프라인

- HardFilterViolationRate = 0
- mutual acceptable pair Recall@K
- 양측 0~3 판단 기반 nDCG@K
- reciprocal coverage / stability / balanced ranking
- 양방향 점수 결합식 `min / geometric mean / harmonic mean`을 capacity·mutual acceptance gate와 조합한 실험 매트릭스
- 역할·지역·조직 유형별 exposure coverage와 Gini
- 분야·역할 diversity와 반복추천률
- 설명 source pointer 정확성
- 공개 payload의 비공개 텍스트·PII 누출 = 0
- 동의 철회 후 벡터·캐시 삭제 cascade = 100%

현재 8명·추천 11건 JSON은 regression smoke test일 뿐 품질 gold가 아니다. 합성 persona는 constraint·robustness 검사에만 쓴다. 실제 품질은 2~3명의 도메인 검토자가 blind pair label을 만들고 합의도를 확인한다.

### 12.2 온라인

- 첫 세 추천 중 최소 1개 유효 연결
- 양측 관심·수락률
- 소개·미팅 일정·완료율
- 다시 만나고 싶은 비율
- 30/90일 내 실제 후속행동·협업 시작
- 응답 부담·미응답 소개 수
- block/report/regret/cancel
- 상위 프로필 노출 집중도
- “프로필과 추천 이유가 나를 잘 표현한다”는 사용자 평가

CTR은 주요 목표가 아니다.

## 13. JSON-first → DB

### 지금

- 기존 public/private JSON 물리 분리 유지
- stable ID, schema_version, revision, updated_at
- 모든 read는 DAL 경유
- JSON Schema 또는 TS 중 하나를 정본으로 하고 자동 생성
- 공개 bundle에 private/system import가 생기면 테스트 실패
- 벡터는 Git에 커밋하지 않음
- `DATA_SOURCE=json` 명시

### 나중

- `ProfileRepository`
- `ConsentRepository`
- `FeedbackRepository`
- `EmbeddingIndex`

DB로 옮길 때 `DATA_SOURCE=db`를 명시하고 오류를 조용히 JSON으로 숨기지 않는다. DB 0 rows도 fallback 조건이 아니다. 민감층은 fail closed다.

현행 `collaboration-server.ts`의 오류·0 rows 시 silent JSON fallback은 지금 건드리지 않는다. M5 DB migration에서 `DATA_SOURCE=json|db` 규약과 오류 가시화로 정렬하고 회귀 테스트를 둔다.

예상 테이블:

- profiles, organizations, affiliations, role_assertions
- capability_offers, need_intents
- taxonomy_terms, term_mappings
- consent_events, feedback_events
- recommendation_runs, recommendation_candidates
- profile_embeddings
- blocks, representation_grants, deletion_requests

유효한 DATABASE_URL, target schema 확인, 사용자 승인 전에는 생성·seed하지 않는다.

## 14. 구현 전에 합의할 결정

1. C 레이어 표시명을 `사회혁신 협력 파트너`로 확정할지
2. 온보딩 첫 화면을 “역할 선택”과 “문제 카드 만들기” 중 무엇으로 시작할지
3. 캐릭터/연결 씨앗 세계관을 MVP에 넣을지, 따뜻한 editorial live preview만 넣을지
4. 첫 추천 3개를 `공통 / 보완 / 예상 밖`으로 고정할지
5. 비공개 need의 matching statement를 사용자가 직접 편집·승인하게 할지
6. local/CLOVA BGE-M3 평가를 M2 범위에 넣을지

## 15. 권장 구현 순서

1. versioned vocabulary schema·초기 release와 화면 카피 확정
2. readiness/trustConnections 데이터 손실 수정
3. versioned Person/Organization/Role/Need/Offer schema와 JSON validation
4. 기존 keyword baseline 평가 harness
5. 개선된 온보딩 UI와 live preview
6. consent receipt와 feedback event
7. embedding provider adapter와 shadow evaluation
8. human-reviewed reciprocal recommendation
9. 유효 DB 정보·승인 후 repository/DB migration
