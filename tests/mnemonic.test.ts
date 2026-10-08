import { describe, it, expect } from "vitest";
import { buildMnemonic, mnemonicOf } from "../src/engine/mnemonic";
import { bankWords } from "../src/data/wordbank";

describe("三层助记覆盖率（全词表）", () => {
  it("每个词都有可展示的助记内容，并统计三层分布", () => {
    const words = [...bankWords("daily"), ...bankWords("zk"), ...bankWords("gk"), ...bankWords("cet4")];
    const dist: Record<string, number> = { etymology: 0, construction: 0, mnemonic: 0 };
    let empty = 0;
    for (const w of words) {
      const m = buildMnemonic(w);
      dist[m.layer] = (dist[m.layer] ?? 0) + 1;
      const hasContent = m.parts.length > 0 || m.formula.length > 0 || m.note.length > 0;
      if (!hasContent) empty++;
    }
    const total = words.length;
    const pct = (n: number) => ((n / total) * 100).toFixed(1) + "%";
    console.log(`[三层分布] 总词数 ${total} | 词源 ${dist.etymology} (${pct(dist.etymology!)}) | 构词 ${dist.construction} (${pct(dist.construction!)}) | 助记 ${dist.mnemonic} (${pct(dist.mnemonic!)}) | 空 ${empty}`);
    expect(empty).toBe(0);
    expect(total).toBeGreaterThan(10000);
  });
});

describe("三层助记引擎", () => {
  it("词源层：import 走 ECDICT 词源（im- 向内 + port 搬运）", () => {
    const m = buildMnemonic("import");
    expect(m.layer).toBe("etymology");
    expect(m.formula).toContain("im");
    expect(m.formula).toContain("port");
  });

  it("构词层：unhappy = un- + happy（词干是完整常用词）", () => {
    const m = buildMnemonic("unhappy");
    expect(m.layer).toBe("construction");
    expect(m.formula).toContain("un");
    expect(m.formula).toContain("happy");
  });

  it("构词层：teacher = teach + -er", () => {
    const m = buildMnemonic("teacher");
    expect(m.layer).toBe("construction");
    expect(m.formula).toContain("teach");
  });

  it("假词源守门：advice 不得判为构词（ad- 非能产前缀）", () => {
    expect(buildMnemonic("advice").layer).not.toBe("construction");
  });

  it("假词源守门：afraid / beach / album / angel 均不得判为构词", () => {
    for (const w of ["afraid", "beach", "album", "angel"]) {
      expect(buildMnemonic(w).layer, w).not.toBe("construction");
    }
  });

  it("助记层：无词源无构词的词回落 mnemonic 且不编造词源", () => {
    const m = buildMnemonic("juice");
    expect(m.layer).toBe("mnemonic");
    expect(m.parts).toEqual([]);              // 不谎报词源部件
    expect(m.formula).not.toContain("+");     // 「+」是词源/构词专用记号
    expect(m.note.length).toBeGreaterThan(0);
  });

  it("助记层升级：音节分块 + 英文释义（weather 无词源家族）", () => {
    const m = buildMnemonic("weather");
    expect(m.layer).toBe("mnemonic");
    expect(m.formula).toContain("·");            // 音节分块
    expect(m.note).toContain("英文释义");
    expect(m.parts).toEqual([]);                 // 不是词源拆解，不谎报 parts
  });

  it("hospital 有真实词源（hosp 词根），应判为词源层", () => {
    const m = buildMnemonic("hospital");
    expect(m.layer).toBe("etymology");
    expect(m.formula).toContain("hosp");
    expect(m.parts.length).toBeGreaterThan(0);
  });

  it("助记层的音节分块不得被当成词源拆解", () => {
    for (const w of ["hospital", "weather", "umbrella", "library"]) {
      const m = buildMnemonic(w);
      if (m.layer === "mnemonic") {
        expect(m.parts).toEqual([]);
      }
    }
  });

  it("mnemonicOf 对预生成表命中时返回对应条目", () => {
    expect(mnemonicOf("import")?.layer).toBe("etymology");
  });

  it("不存在的词返回 undefined（不抛错）", () => {
    expect(mnemonicOf("zzzznotaword")).toBeUndefined();
  });
});
