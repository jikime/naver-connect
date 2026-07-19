/**
 * 가치사슬 층위: 1 원천, 2 관계 산출물, 3 기회 산출물, 4 사업 산출물, 0 기반.
 * 은하 캔버스에서 궤도 레인·천체 스타일을 결정한다.
 */
export function getEntityLayer(classKey: string): 0 | 1 | 2 | 3 | 4 {
  switch (classKey) {
    case "member":
    case "org":
      return 1;
    case "collab_case":
    case "meetup":
      return 2;
    case "opportunity_card":
    case "proposal":
    case "policy_notice":
      return 3;
    case "deal_room":
    case "finance_product":
    case "expert_service":
      return 4;
    default:
      return 0; // field, tag, resource
  }
}

export function getEntityColor(classKey: string): string {
  // Neon/cyberpunk colors for the dark galaxy theme.
  // 가치사슬 층위: 원천 → 관계 산출물 → 기회 산출물 → 사업 산출물 → 기반.
  switch (classKey) {
    // 원천
    case "member":
      return "#60a5fa"; // Blue
    case "org":
      return "#34d399"; // Emerald
    // 관계 산출물
    case "collab_case":
      return "#f472b6"; // Rose
    case "meetup":
      return "#fb923c"; // Orange
    // 기회 산출물
    case "opportunity_card":
      return "#a3e635"; // Lime
    case "proposal":
      return "#e879f9"; // Fuchsia
    case "policy_notice":
      return "#38bdf8"; // Sky
    // 사업 산출물
    case "deal_room":
      return "#f87171"; // Red
    case "finance_product":
      return "#fbbf24"; // Gold
    case "expert_service":
      return "#2dd4bf"; // Teal
    // 기반
    case "field":
      return "#fcd34d"; // Amber planet
    case "tag":
      return "#a78bfa"; // Violet
    case "resource":
      return "#94a3b8"; // Gray
    default:
      return "#ffffff";
  }
}
