#!/usr/bin/env tsx
// scripts/import-social-enterprise.ts — 사회적기업 CSV/XLSX 파일을 Supabase에 upsert.
// 사용: npx tsx scripts/import-social-enterprise.ts <파일경로>
// 지원 형식: .csv, .xlsx, .xls
// 데이터 출처: https://seis.or.kr 또는 https://www.data.go.kr/data/3070094/fileData.do

import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import * as dotenv from "dotenv";
import { Pool } from "pg";
import * as XLSX from "xlsx";

dotenv.config({ path: join(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  ssl: { rejectUnauthorized: false },
});

/** 주소 문자열 → {sido, sigungu} */
function parseRegion(address: string): { sido: string; sigungu: string } {
  if (!address) return { sido: "기타", sigungu: "기타" };
  const parts = address.trim().split(/\s+/);
  const sido = parts[0] ?? "기타";
  const sigungu = parts[1] ?? "기타";
  return { sido, sigungu };
}

/** 인증유형 → subgroup_code 추정 */
function inferSubgroupCode(certType: string): string {
  if (!certType) return "A1";
  if (certType.includes("일자리")) return "A1";
  if (certType.includes("사회서비스")) return "A3";
  if (certType.includes("혼합")) return "A5";
  if (certType.includes("협동조합")) return "A4";
  return "A1";
}

/** 분야 키워드 → field_tags 추정 */
function inferFieldTags(name: string, address: string): number[] {
  const text = (name + " " + address).toLowerCase();
  const tags: number[] = [];
  if (text.includes("의료") || text.includes("병원")) tags.push(1);
  if (text.includes("돌봄") || text.includes("복지") || text.includes("요양"))
    tags.push(2);
  if (text.includes("주택") || text.includes("주거")) tags.push(3);
  if (text.includes("에너지") || text.includes("태양광")) tags.push(4);
  if (text.includes("먹거리") || text.includes("식품") || text.includes("농"))
    tags.push(5);
  if (text.includes("교통") || text.includes("이동") || text.includes("운송"))
    tags.push(6);
  if (text.includes("환경") || text.includes("생태")) tags.push(4);
  if (text.includes("문화") || text.includes("예술")) tags.push(9);
  if (text.includes("교육") || text.includes("학습")) tags.push(13);
  return tags.length > 0 ? [...new Set(tags)] : [10];
}

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(
      "사용법: npx tsx scripts/import-social-enterprise.ts <파일경로>",
    );
    console.error(
      "예시: npx tsx scripts/import-social-enterprise.ts C:\\Users\\neoar\\Downloads\\사회적기업현황.xlsx",
    );
    process.exit(1);
  }

  const ext = extname(filePath).toLowerCase();
  if (![".csv", ".xlsx", ".xls"].includes(ext)) {
    console.error(`지원하지 않는 파일 형식: ${ext}`);
    process.exit(1);
  }

  console.log(`▶ 파일 읽는 중: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });
  console.log(`  ${rows.length}행 읽음`);

  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;

  try {
    for (const row of rows) {
      // 컬럼명은 파일마다 다를 수 있으므로 유연하게 매핑
      const name = (
        row["기업명"] ||
        row["법인명"] ||
        row["기관명"] ||
        row["name"] ||
        ""
      ).trim();
      const regNo = (
        row["사업자등록번호"] ||
        row["사업자번호"] ||
        row["reg_no"] ||
        ""
      )
        .replace(/-/g, "")
        .trim();
      const address = (
        row["주소"] ||
        row["사업장주소"] ||
        row["address"] ||
        ""
      ).trim();
      const certType = (
        row["인증유형"] ||
        row["유형"] ||
        row["cert_type"] ||
        ""
      ).trim();
      const empCount = parseInt(
        (row["근로자수"] || row["종사자수"] || row["employees"] || "0").replace(
          /[^0-9]/g,
          "",
        ),
        10,
      );

      if (!name) {
        skipped++;
        continue;
      }

      const orgId = `ORG-PUBLIC-${regNo || name.slice(0, 10).replace(/\s/g, "")}`;
      const region = parseRegion(address);
      const subgroupCode = inferSubgroupCode(certType);
      const fieldTags = inferFieldTags(name, address);

      await client.query(
        `INSERT INTO organizations
          (id, name, region, field_tags, actor_type, ai_confidence, source,
           verified_by, last_checked_at, buying_power,
           org_registration_no, certification_type, address,
           employees_count, is_public_data, subgroup_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           certification_type = EXCLUDED.certification_type,
           employees_count = EXCLUDED.employees_count,
           updated_at = NOW()`,
        [
          orgId,
          name,
          JSON.stringify(region),
          fieldTags,
          "사회적경제",
          0.85,
          "공공데이터(사회적기업정보시스템)",
          [],
          40,
          regNo || null,
          certType || null,
          address || null,
          Number.isNaN(empCount) ? null : empCount,
          true,
          subgroupCode,
        ],
      );

      // subgroup_map도 동기화
      await client.query(
        `INSERT INTO subgroup_map (org_id, subgroup_code, subgroup_label, kind, rationale)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (org_id) DO NOTHING`,
        [
          orgId,
          subgroupCode,
          "사회적기업형",
          "activist",
          `공공데이터 import: ${certType}`,
        ],
      );

      inserted++;
      if (inserted % 100 === 0) {
        console.log(`  ${inserted}개 처리 중...`);
      }
    }

    console.log(`\n✅ import 완료: ${inserted}개 upsert, ${skipped}개 건너뜀`);

    const count = await client.query<{ cnt: string }>(
      "SELECT COUNT(*)::text AS cnt FROM organizations WHERE is_public_data = TRUE",
    );
    console.log(`   현재 공공데이터 기관 총 ${count.rows[0].cnt}개`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ import 실패:", err);
  process.exit(1);
});
