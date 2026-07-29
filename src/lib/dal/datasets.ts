import type { DatasetKey } from "@/lib/data/dataset-registry";

export type DatasetLoader = <T>(key: DatasetKey) => Promise<T>;

interface DatasetResponse<T> {
  key: DatasetKey;
  data: T;
  revision: number;
  updatedAt: string;
}

const datasetCache = new Map<DatasetKey, Promise<unknown>>();

export async function getDataset<T>(key: DatasetKey): Promise<T> {
  let pending = datasetCache.get(key);
  if (!pending) {
    pending = fetch(`/api/data/${encodeURIComponent(key)}`, {
      credentials: "same-origin",
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(
          body?.message ?? `데이터 조회 실패 (${response.status})`,
        );
      }
      const body = (await response.json()) as DatasetResponse<T>;
      return body.data;
    });
    datasetCache.set(key, pending);
    pending.catch(() => datasetCache.delete(key));
  }
  return pending as Promise<T>;
}

export function clearDatasetCache(key?: DatasetKey): void {
  if (key) datasetCache.delete(key);
  else datasetCache.clear();
}
