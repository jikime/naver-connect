import { describe, expect, it } from "vitest";
import { credentialsSchema, registrationSchema } from "./validation";

describe("인증 입력 검증", () => {
  it("이메일을 소문자 정규화하고 안전한 회원가입 입력을 허용한다", () => {
    const result = registrationSchema.parse({
      name: "김연결",
      email: "  User@Example.COM ",
      password: "안전한비밀번호2026",
      role: "기업가",
    });
    expect(result.email).toBe("user@example.com");
  });

  it("운영자 자가 가입을 거부한다", () => {
    const result = registrationSchema.safeParse({
      name: "운영자",
      email: "operator@example.com",
      password: "secure-password-2026",
      role: "운영자",
    });
    expect(result.success).toBe(false);
  });

  it("로그인은 오류 노출을 줄이기 위해 비밀번호 존재 여부만 먼저 검사한다", () => {
    expect(
      credentialsSchema.safeParse({
        email: "member@example.com",
        password: "x",
      }).success,
    ).toBe(true);
  });
});
