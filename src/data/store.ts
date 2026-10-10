/**
 * 数据按需加载层
 *
 * 目标：让应用外壳（界面与逻辑）很小、秒开，大块数据（词源库 / 词表 / 助记资产）
 * 在真正需要时再拉取，并由 Service Worker 长期缓存。
 *
 * 三种数据来源，优先级从高到低：
 * 1. window.__EQ_DATA__ —— 离线单文件版构建时内联的数据（file:// 双击可用）
 * 2. 测试注入（__setDataForTest）—— 让单元测试无需网络
 * 3. fetch(`./data/xxx.json`) —— 正常网页运行
 */

export type DataKey =
  | "roots"
  | "commonStems"
  | "wordEn"
  | "words1"
  | "words2"
  | "words3"
  | "daily"
  | "grammar1"
  | "grammar2"
  | "grammar3"
  | "grammar4"
  | "videos";

const FILES: Record<DataKey, string> = {
  roots: "roots.json",
  commonStems: "common-stems.json",
  wordEn: "word-en.json",
  words1: "words-stage1.json",
  words2: "words-stage2.json",
  words3: "words-stage3.json",
  daily: "wordbank-daily.json",
  grammar1: "grammar-core-1.json",
  grammar2: "grammar-core-2.json",
  grammar3: "grammar-core-3.json",
  grammar4: "grammar-core-4.json",
  videos: "videos.json",
};

const cache = new Map<DataKey, unknown>();
const inflight = new Map<DataKey, Promise<unknown>>();

function inlineData(): Partial<Record<DataKey, unknown>> | undefined {
  return (globalThis as { __EQ_DATA__?: Partial<Record<DataKey, unknown>> }).__EQ_DATA__;
}

export function isLoaded(key: DataKey): boolean {
  if (cache.has(key)) return true;
  const inline = inlineData();
  return inline?.[key] !== undefined;
}

export function getLoaded<T>(key: DataKey): T | undefined {
  if (cache.has(key)) return cache.get(key) as T;
  const inline = inlineData();
  if (inline?.[key] !== undefined) {
    cache.set(key, inline[key]);
    return inline[key] as T;
  }
  return undefined;
}

/** 加载一块数据（同一块只会真正请求一次） */
export async function load<T>(key: DataKey): Promise<T> {
  const cached = getLoaded<T>(key);
  if (cached !== undefined) return cached;
  const existing = inflight.get(key);
  if (existing) return (await existing) as T;

  const p = (async () => {
    const res = await fetch(`./data/${FILES[key]}`, { cache: "force-cache" });
    if (!res.ok) throw new Error(`数据加载失败：${FILES[key]} (HTTP ${res.status})`);
    const json = (await res.json()) as T;
    cache.set(key, json);
    return json;
  })();
  inflight.set(key, p);
  try {
    return (await p) as T;
  } finally {
    inflight.delete(key);
  }
}

/** 后台预取（失败静默，不影响主流程） */
export function preload(keys: DataKey[]): void {
  for (const k of keys) {
    if (isLoaded(k)) continue;
    void load(k).catch(() => { /* 后台预取失败可忽略 */ });
  }
}

/** 测试注入（仅测试使用） */
export function __setDataForTest(key: DataKey, value: unknown): void {
  cache.set(key, value);
}

export function __clearDataForTest(): void {
  cache.clear();
  inflight.clear();
}
