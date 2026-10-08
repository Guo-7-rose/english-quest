import { describe, it, expect } from "vitest";
import { allThemes, allExpressions, bankWords, getTheme } from "../src/data/wordbank";

describe("日常词包与表达包", () => {
  it("18 个生活主题，每主题至少 30 词", () => {
    const themes = allThemes();
    expect(themes.length).toBe(18);
    for (const t of themes) {
      expect(t.words.length, t.title).toBeGreaterThanOrEqual(30);
      expect(t.icon.length).toBeGreaterThan(0);
    }
  });

  it("主题词条带音标或释义，且为纯字母单词", () => {
    for (const t of allThemes()) {
      for (const w of t.words) {
        expect(/^[a-z]+$/.test(w.word), t.title + ":" + w.word).toBe(true);
        expect((w.phonetic.length > 0) || (w.meaning.length > 0), w.word).toBe(true);
      }
    }
  });

  it("生活表达包 ≥ 45 条且字段齐全", () => {
    const ex = allExpressions();
    expect(ex.length).toBeGreaterThanOrEqual(45);
    for (const e of ex) {
      expect(e.zh.length).toBeGreaterThan(0);
      expect(e.en.length).toBeGreaterThan(0);
      expect(e.example.length).toBeGreaterThan(0);
    }
  });

  it("日常词表去重后超过 500 词", () => {
    const words = bankWords("daily");
    expect(words.length).toBeGreaterThan(500);
    expect(new Set(words).size).toBe(words.length);
  });

  it("三个考试词表可访问", () => {
    expect(bankWords("zk").length).toBeGreaterThan(3000);
    expect(bankWords("gk").length).toBeGreaterThan(3000);
    expect(bankWords("cet4").length).toBeGreaterThan(3000);
  });

  it("getTheme 按 id 取主题", () => {
    expect(getTheme("family")?.title).toContain("家庭");
    expect(getTheme("nope")).toBeUndefined();
  });
});
