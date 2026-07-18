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
);
