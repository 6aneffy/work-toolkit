import type { PracticeRecord, StoredStats } from "../types";

const STORAGE_KEY = "work_toolkit.stats.v1";
const MAX_RECENT = 5;

const defaultStats: StoredStats = {
  bestAccuracy: 0,
  recentRecords: [],
};

export function loadStats(): StoredStats {
  if (typeof window === "undefined") return defaultStats;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats;
    const parsed = JSON.parse(raw) as StoredStats;
    return {
      bestAccuracy: typeof parsed.bestAccuracy === "number" ? parsed.bestAccuracy : 0,
      recentRecords: Array.isArray(parsed.recentRecords) ? parsed.recentRecords : [],
    };
  } catch {
    return defaultStats;
  }
}

export function saveStats(stats: StoredStats): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // 저장 실패는 무시한다 (용량/권한 이슈)
  }
}

export function appendRecord(record: PracticeRecord): StoredStats {
  const current = loadStats();
  const nextRecords = [record, ...current.recentRecords].slice(0, MAX_RECENT);
  const nextBest = Math.max(current.bestAccuracy, record.accuracy);
  const next: StoredStats = {
    bestAccuracy: nextBest,
    recentRecords: nextRecords,
  };
  saveStats(next);
  return next;
}
