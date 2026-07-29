// ESLint flat config — 민감 시드(src/data/private/*) import를 DAL 밖에서 빌드 타임 차단.
// 근거: ARCHITECTURE.md §2 콜아웃·ADR-03/04·NFR-07, TASKS.md T-005
//
// Biome 2.2는 "폴더 예외가 있는 import 제한"(only-DAL override)을 깔끔히 지원하지 못해
// 이 규칙만 ESLint로 분리한다. 포맷/일반 린트는 계속 Biome이 담당(package.json의
// `lint` 스크립트가 `biome check && eslint ...`로 둘 다 실행 — T-005 게이트3 확정 사항).
import tseslint from "typescript-eslint";

const PRIVATE_SEED_PATTERNS = ["@/data/private/*", "**/data/private/*"];

export default tseslint.config(
  {
    ignores: ["node_modules/**", ".next/**", "next-env.d.ts"],
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: PRIVATE_SEED_PATTERNS.map((group) => ({
            group: [group],
            message:
              "민감 시드(src/data/private/*)는 DAL(src/lib/dal/**) 밖에서 import할 수 없습니다(ADR-03, NFR-07). DAL 모듈을 경유하세요.",
          })),
        },
      ],
    },
  },
  {
    // DAL 내부는 민감 시드를 재조립하는 유일한 지점이라 예외를 둔다(ADR-03).
    files: ["src/lib/dal/**/*.ts", "src/lib/dal/**/*.tsx"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    // 테스트 파일은 번들 대상이 아니며, 누출 검사(probe) 목적으로 민감 시드를 직접 읽는다.
    files: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    // C3: 서버 매칭 서비스는 private 원본을 읽는 유일한 비-DAL 지점 — route/테스트만 접근한다.
    files: ["src/lib/server/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    // P1-1: 클라이언트 도달 존(app/components/stores)과 DAL 배럴은 민감 people 모듈을
    // import할 수 없다 — Client bundle에 needs/consents 원문이 실리는 경로를 빌드 타임 차단.
    files: [
      "src/app/**/*.ts",
      "src/app/**/*.tsx",
      "src/components/**/*.ts",
      "src/components/**/*.tsx",
      "src/stores/**/*.ts",
      "src/lib/dal/index.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...PRIVATE_SEED_PATTERNS.map((group) => ({
              group: [group],
              message:
                "민감 시드(src/data/private/*)는 클라이언트 존에서 import할 수 없습니다(ADR-03, NFR-07).",
            })),
            {
              group: [
                "@/lib/dal/people",
                "@/lib/dal/people-engine",
                "**/dal/people",
                "**/dal/people-engine",
              ],
              message:
                "people·people-engine은 민감 원문을 import하는 서버/스크립트 전용 모듈입니다 — 클라이언트 존·DAL 배럴에서 import 금지(P1-1). 파생 DTO(src/data/people/derived/*)를 사용하세요.",
            },
            {
              group: ["@/lib/server/*", "**/lib/server/*"],
              message:
                "lib/server(매칭 서비스)는 private 원본을 읽는 서버 전용 모듈입니다 — 클라이언트 존에서 import 금지(C3). /api/matching 경유 또는 DAL 클라이언트(getMatchingBundle)를 사용하세요. type-only import는 next 빌드에서 소거되므로 DAL 내부에서만 허용.",
            },
          ],
        },
      ],
    },
  },
  {
    // route handler는 서버 실행 — lib/server import는 허용하되 private 시드 직접 import는
    // 계속 금지한다(ADR-03: 원본 접근은 DAL·lib/server만). 클라존 블록(src/app/**)이
    // lib/server 금지를 다시 켜므로, flat config 우선순위상 이 블록이 그 뒤에 와야 한다(C4 수정).
    files: ["src/app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: PRIVATE_SEED_PATTERNS.map((group) => ({
            group: [group],
            message:
              "민감 시드(src/data/private/*)는 route에서도 직접 import할 수 없습니다(ADR-03). lib/server 서비스 모듈을 경유하세요.",
          })),
        },
      ],
    },
  },
);
