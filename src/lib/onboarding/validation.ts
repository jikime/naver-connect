import { z } from "zod";

const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(4_000);
const tagId = z.number().int().positive().max(1_000_000);

export const onboardingFinalizeSchema = z
  .object({
    organization: z
      .object({ name: shortText, type: shortText, role: shortText })
      .strict(),
    region: z.object({ sido: shortText, sigungu: shortText }).strict(),
    field_tags: z.array(tagId).max(20),
    value_chain_stage: shortText,
    mission_statement: longText,
    demand_tags: z
      .array(
        z
          .object({
            tagId,
            priority: z.boolean(),
            detail_quote: longText,
            safe_match: z
              .object({ approved: z.boolean(), text: longText })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .max(10),
    supply_tags: z
      .array(z.object({ tagId, detail: longText }).strict())
      .max(10),
    activities: z.array(shortText).max(20),
    availability: shortText,
    preferred_mode: shortText,
    participation_scope: z
      .enum(["개인 자격으로 참여", "소속 기관을 대표해 참여"])
      .nullable(),
    hot_lead: z
      .object({
        flag: z.boolean(),
        project_summary: longText,
        needed_partner: longText,
        stage: shortText,
      })
      .strict()
      .nullable(),
    readiness: shortText,
    trust_connections: z
      .array(
        z
          .object({
            type: z.enum(["소개자", "아는회원", "소속모임"]),
            ref: shortText,
          })
          .strict(),
      )
      .max(30),
    consents: z
      .object({
        publish_profile: z.boolean(),
        use_private_needs_for_matching: z.boolean(),
        quote_in_intro: z.boolean(),
      })
      .strict(),
    visibility_consent: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.visibility_consent !== value.consents.publish_profile) {
      context.addIssue({
        code: "custom",
        path: ["visibility_consent"],
        message: "프로필 공개 동의 값이 일치하지 않습니다.",
      });
    }
    if (value.demand_tags.filter((item) => item.priority).length > 1) {
      context.addIssue({
        code: "custom",
        path: ["demand_tags"],
        message: "최우선 수요는 하나만 선택할 수 있습니다.",
      });
    }
  });
