# Supabase · Auth.js 운영 인증 설정

## 데이터 경계

- `ax_private.auth_users`: 이메일, bcrypt 비밀번호 해시, 로그인 상태
- `ax_private.onboarding_profiles`: 온보딩 원문과 동의 기록
- `ax_private.auth_events`: 가입·로그인 실패·잠금·완료 감사 이벤트
- `ax_private.datasets`: 동의·요구·추천·매칭처럼 보호가 필요한 서비스 데이터셋
- `ax_private.user_runtime_states`: 온보딩 결과와 사용자별 실행 상태
- `ax_core.profiles`: 사용자가 공개에 동의한 범위의 프로필
- `ax_core.datasets`: 분야·태그·조직·콘텐츠 등 공유 가능한 서비스 데이터셋
- `public`: 이 애플리케이션의 신규 테이블을 만들지 않음

`ax_core`와 `ax_private`는 Supabase **Exposed schemas에 추가하지 않는다.** 인증과
프로필 조회·쓰기는 모두 세션을 확인하는 Next.js 서버를 거쳐 직접 PostgreSQL 연결로
처리한다.

## 환경변수

`.env.example`을 기준으로 `.env.local`에 값을 입력한다. 비밀값은 Git에 커밋하거나
클라이언트 코드에 넣지 않는다.

- `NEXT_PUBLIC_SUPABASE_URL`: 프로젝트 API URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: 브라우저 공개 키
- `SUPABASE_SECRET_KEY`: 서버 전용 Secret key
- `SUPABASE_DATABASE_URL`: 로컬 관리 작업은 Session pooler(5432), Vercel 운영은
  Transaction pooler(6543) 연결 문자열
- `AUTH_SECRET`: Auth.js JWT·쿠키 암호화 키
- `AUTH_URL`: 로컬에서는 `http://localhost:3005`
- `AUTH_TRUST_HOST`: 신뢰하는 리버스 프록시 뒤에서만 `true`
- `SHOW_REVIEW_ACCOUNTS`: 로그인 화면에 심사용 계정 안내를 표시할지 여부
- `ENABLE_REVIEW_DATA`: 심사용 계정에 시드 추천·매칭 데이터를 연결할지 여부

Direct connection 주소(`db.<project-ref>.supabase.co`)는 IPv6 전용일 수 있다. 로컬에서
`ENOTFOUND`나 `ENETUNREACH`가 발생하면 Session pooler(5432)를 사용한다. Vercel처럼
함수가 수평 확장되는 서버리스 환경에서는 연결을 공유할 수 있는 Transaction
pooler(6543)를 사용하고, 애플리케이션 프로세스당 풀 크기를 1로 제한한다. Transaction
pooler에서는 named prepared statement를 사용하지 않는다.

## 적용 순서

```bash
npm run db:check
npm run db:migrate
npm run db:seed
npm run db:verify
npm run build
```

`db:check`는 연결과 스키마 유무만 읽는다. `db:migrate`부터 실제 DB에 스키마와 테이블을
생성한다. `db:seed`는 심사용 계정 3개와 35개 서비스 데이터셋을 멱등 방식으로 등록하므로
같은 원본으로 여러 번 실행해도 중복 행이 생기지 않는다. `db:verify`는 데이터셋 수,
심사용 역할·페르소나 연결, bcrypt 비밀번호 검증을 수행하되 비밀번호 자체는 출력하지 않는다.

시드 콘텐츠는 심사와 초기 기능 검증을 위한 예시 데이터다. 런타임 원천은 Supabase로
전환되었지만, 실제 운영을 시작하기 전에는 동일한 스키마에 검수된 실데이터를 적재하고
`SHOW_REVIEW_ACCOUNTS`와 `ENABLE_REVIEW_DATA`를 `false`로 내려야 한다.

## 인증 정책

- 공개 회원가입 역할은 `기업가`, `전문가`만 허용한다.
- 운영자 계정은 자가 가입으로 만들지 않는다.
- 비밀번호는 문자와 숫자를 포함한 10자 이상, bcrypt cost 12로 해시한다.
- 로그인 5회 실패 시 15분 동안 잠근다.
- Credentials 세션은 8시간짜리 암호화 JWT 쿠키로 유지한다.
- 인증 사용자 UUID와 프로필 UUID를 동일하게 사용한다.
- 클라이언트가 보내는 역할이나 사용자 ID는 권한 판단에 사용하지 않는다.
- 로그아웃 시 브라우저의 데이터·사용자 상태 캐시를 비우며, 정본은 서버 세션과 DB에 둔다.
