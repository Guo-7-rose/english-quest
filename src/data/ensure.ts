import { ensureDaily, dailyReady } from "./wordbank";
import { ensureWords, wordsReady } from "./words";
import { ensureMnemonicAssets, mnemonicAssetsReady } from "../engine/mnemonic";

/**
 * 核心数据统一入口：日常词包 + 助记资产（词源/词干/英文释义）+ 三个考试词表。
 * 应用外壳先渲染出来（秒开），这份数据在后台流式加载；视图等它就绪后重绘。
 */
let corePromise: Promise<void> | null = null;

export function ensureCore(): Promise<void> {
  if (!corePromise) {
    corePromise = (async () => {
      await ensureDaily();
      await ensureMnemonicAssets();
      await ensureWords();
    })();
  }
  return corePromise;
}

/** 首屏之后在后台预取，让后续板块秒开 */
export function preloadCore(): void {
  void ensureCore().catch(() => { /* 后台预取失败可忽略，进板块时会给提示 */ });
}

export function coreReady(): boolean {
  return corePromise !== null;
}

/** 核心数据是否已经真正就绪（三个来源都加载完） */
export function coreLoaded(): boolean {
  return dailyReady() && mnemonicAssetsReady() && wordsReady();
}
