/**
 * Recently viewed galaxy nodes, persisted in localStorage.
 * Newest first, capped at 5 entries.
 */
export interface RecentNode {
  id: string;
  label: string;
  classKey: string;
  classLabel: string;
}

const STORAGE_KEY = "galaxy-recent-nodes";
const MAX_RECENT = 5;

export function getRecentNodes(): RecentNode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (n): n is RecentNode =>
          n &&
          typeof n.id === "string" &&
          typeof n.label === "string" &&
          typeof n.classKey === "string" &&
          typeof n.classLabel === "string",
      )
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function addRecentNode(node: RecentNode): void {
  try {
    const next = [
      node,
      ...getRecentNodes().filter((n) => n.id !== node.id),
    ].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures (private mode, quota) — recents are best-effort.
  }
}
