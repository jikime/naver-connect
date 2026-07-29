/**
 * 최근 열람한 은하 노드. 로그인 사용자의 Supabase 상태에 저장한다.
 * Newest first, capped at 5 entries.
 */
import {
  hydrateRuntimeState,
  type RecentGalaxyNode,
  setRuntimeStateValue,
} from "@/lib/dal/runtime-state";

export type RecentNode = RecentGalaxyNode;

const MAX_RECENT = 5;

export async function getRecentNodes(): Promise<RecentNode[]> {
  const state = await hydrateRuntimeState();
  return state.recentGalaxyNodes.slice(0, MAX_RECENT);
}

export async function addRecentNode(node: RecentNode): Promise<void> {
  const state = await hydrateRuntimeState();
  const next = [
    node,
    ...state.recentGalaxyNodes.filter((item) => item.id !== node.id),
  ].slice(0, MAX_RECENT);
  await setRuntimeStateValue("recentGalaxyNodes", next);
}
