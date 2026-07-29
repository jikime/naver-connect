import { z } from "zod";
import { SELF_REGISTRATION_ROLES } from "./types";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("올바른 이메일 주소를 입력해주세요.")
  .max(254, "이메일 주소가 너무 깁니다.");

const passwordSchema = z
  .string()
  .min(10, "비밀번호는 10자 이상 입력해주세요.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "비밀번호는 영문 기준 72자 이내로 입력해주세요.",
  )
  .refine(
    (value) => /\p{L}/u.test(value) && /\p{N}/u.test(value),
    "비밀번호에는 문자와 숫자를 각각 하나 이상 포함해주세요.",
  );

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "이름을 두 글자 이상 입력해주세요.")
    .max(80, "이름은 80자 이내로 입력해주세요."),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(SELF_REGISTRATION_ROLES),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
