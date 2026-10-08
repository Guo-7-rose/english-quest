import { describe, it, expect } from "vitest";
import { buildMnemonic, mnemonicOf } from "../src/engine/mnemonic";

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
    expect(m.formula).toBe("");
    expect(m.note.length).toBeGreaterThan(0);
  });

  it("mnemonicOf 对预生成表命中时返回对应条目", () => {
    expect(mnemonicOf("import")?.layer).toBe("etymology");
  });

  it("不存在的词返回 undefined（不抛错）", () => {
    expect(mnemonicOf("zzzznotaword")).toBeUndefined();
  });
});
