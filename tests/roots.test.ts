import { describe, it, expect } from "vitest";
import { allFamilies, familiesByType, familyOfWord, topFamilies } from "../src/data/roots";

describe("roots 词根家族数据层", () => {
  it("家族数量与字段完整性", () => {
    const fams = allFamilies();
    expect(fams.length).toBeGreaterThan(500);
    for (const f of fams.slice(0, 50)) {
      expect(f.key.length).toBeGreaterThan(0);
      expect(f.name.length).toBeGreaterThan(0);
      expect(["root", "prefix", "suffix"]).toContain(f.type);
      expect(f.meaning.length).toBeGreaterThan(0);
      expect(f.words.length).toBeGreaterThan(0);
    }
  });

  it("按类型筛选", () => {
    const prefixes = familiesByType("prefix");
    expect(prefixes.length).toBeGreaterThan(50);
    expect(prefixes.some(f => f.name === "un")).toBe(true);
    const suffixes = familiesByType("suffix");
    expect(suffixes.some(f => f.name.includes("ly") || f.name.includes("ful"))).toBe(true);
    const roots = familiesByType("root");
    expect(roots.length).toBeGreaterThan(300);
  });

  it("按单词反查家族（import 属于 port 家族）", () => {
    const fams = familyOfWord("import");
    const names = fams.map(f => f.name);
    expect(names.some(n => n.includes("port"))).toBe(true);
  });

  it("家族词条带音标或释义", () => {
    const fam = familyOfWord("import").find(f => f.name.includes("port"))!;
    const word = fam.words.find(w => w.word === "import");
    expect(word).toBeDefined();
    expect((word!.phonetic.length > 0) || (word!.meaning.length > 0)).toBe(true);
  });

  it("按阶段贡献度排序", () => {
    const top = topFamilies(5);
    expect(top.length).toBe(5);
    // 贡献度最高的家族应带较多词条
    expect(top[0]!.words.length).toBeGreaterThan(10);
  });

  it("来源语言字段存在（拉丁/希腊）", () => {
    const fams = allFamilies().filter(f => f.origin.length > 0);
    expect(fams.length).toBeGreaterThan(500);
    const origins = new Set(allFamilies().map(f => f.origin));
    expect([...origins].some(o => /Latin/i.test(o))).toBe(true);
    expect([...origins].some(o => /Greek/i.test(o))).toBe(true);
  });
});
