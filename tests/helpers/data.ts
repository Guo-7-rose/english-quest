/**
 * 测试用数据注入：把 src/data 下的 JSON 直接塞进数据层缓存，
 * 让单元测试无需网络即可跑通按需加载逻辑。
 */
import { __setDataForTest, __clearDataForTest } from "../../src/data/store";
import { ensureDaily } from "../../src/data/wordbank";
import { ensureWords } from "../../src/data/words";
import { ensureMnemonicAssets } from "../../src/engine/mnemonic";
import { ensureRoots } from "../../src/data/roots";
import { ensureCore } from "../../src/data/ensure";

import roots from "../../src/data/roots.json";
import commonStems from "../../src/data/common-stems.json";
import wordEn from "../../src/data/word-en.json";
import words1 from "../../src/data/words-stage1.json";
import words2 from "../../src/data/words-stage2.json";
import words3 from "../../src/data/words-stage3.json";
import daily from "../../src/data/wordbank-daily.json";

export function injectAllData(): void {
  __setDataForTest("roots", roots);
  __setDataForTest("commonStems", commonStems);
  __setDataForTest("wordEn", wordEn);
  __setDataForTest("words1", words1);
  __setDataForTest("words2", words2);
  __setDataForTest("words3", words3);
  __setDataForTest("daily", daily);
}

/** 注入并让各层缓存就绪（beforeAll / beforeEach 里 await 它） */
export async function prepareData(): Promise<void> {
  injectAllData();
  await ensureDaily();
  await ensureRoots();
  await ensureMnemonicAssets();
  await ensureWords();
}

/** 注入 + 只等核心数据（集成测试里让导航保持同步） */
export async function prepareCore(): Promise<void> {
  injectAllData();
  await ensureCore();
}

export { __clearDataForTest };
