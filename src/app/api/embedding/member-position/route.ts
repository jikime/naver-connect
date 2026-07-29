import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";
import type { MemberEmbeddingShadow, PublicEmbeddingProfile } from "@/types";

export const runtime = "nodejs";

function isShortString(value: unknown, max = 500): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function isPublicProfile(value: unknown): value is PublicEmbeddingProfile {
  if (typeof value !== "object" || value === null) return false;
  const profile = value as Partial<PublicEmbeddingProfile>;
  return (
    typeof profile.member_id === "string" &&
    /^M-\d{3}$/.test(profile.member_id) &&
    profile.publish_profile === true &&
    typeof profile.organization === "object" &&
    profile.organization !== null &&
    isShortString(profile.organization.name, 160) &&
    isShortString(profile.organization.type, 80) &&
    isShortString(profile.organization.role, 80) &&
    typeof profile.region === "object" &&
    profile.region !== null &&
    isShortString(profile.region.sido, 40) &&
    isShortString(profile.region.sigungu, 60) &&
    Array.isArray(profile.field_tags) &&
    profile.field_tags.every(
      (tagId) => Number.isInteger(tagId) && tagId >= 1 && tagId <= 12,
    ) &&
    isShortString(profile.value_chain_stage, 120) &&
    isShortString(profile.mission_statement, 1_000) &&
    Array.isArray(profile.supply_tags) &&
    profile.supply_tags.every(
      (tag) =>
        Number.isInteger(tag?.tagId) &&
        tag.tagId >= 1 &&
        tag.tagId <= 12 &&
        isShortString(tag.detail, 1_000),
    ) &&
    Array.isArray(profile.activities) &&
    profile.activities.every((activity) => isShortString(activity, 120)) &&
    isShortString(profile.preferred_mode, 200)
  );
}

function runKureProjection(
  profile: PublicEmbeddingProfile,
): Promise<MemberEmbeddingShadow> {
  const python =
    process.env.KURE_PYTHON_BIN ??
    "/opt/homebrew/Caskroom/miniconda/base/envs/alone/bin/python";
  const script = path.join(
    process.cwd(),
    "scripts",
    "embed-onboarding-profile.py",
  );

  return new Promise((resolve, reject) => {
    const child = spawn(python, [script], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HF_HUB_OFFLINE: "1",
        TRANSFORMERS_OFFLINE: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("KURE projection timed out"));
    }, 45_000);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      if (stdout.length > 5_000_000) child.kill();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(stderr || `KURE projection exited with ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as MemberEmbeddingShadow);
      } catch {
        reject(new Error("KURE projection returned invalid JSON"));
      }
    });
    child.stdin.end(JSON.stringify({ profile }));
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const profile =
    typeof body === "object" && body !== null
      ? (body as { profile?: unknown }).profile
      : undefined;
  if (!isPublicProfile(profile)) {
    return NextResponse.json(
      { error: "invalid public profile" },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await runKureProjection(profile));
  } catch {
    return NextResponse.json(
      { error: "local KURE projection unavailable" },
      { status: 503 },
    );
  }
}
