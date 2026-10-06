import { describe, it, expect } from "vitest";
import { getStage, getChapter, genWordFormQuestions } from "../src/data/words";

describe("words", () => {
  it("四个阶段均有章节且 id 规范", () => {
    for (const st of [1, 2, 3, 4] as const) {
      const chs = getStage(st);
      expect(chs.length).toBeGreaterThan(0);
      expect(chs[0]!.id).toBe(`${st}-1`);
      expect(chs.every(c => c.words.length > 0)).toBe(true);
    }
  });

  it("按 id 取章节", () => {
    const ch = getChapter("1-1")!;
    expect(ch.title).toContain("第1章");
  });

  it("词形变化题生成（复数/过去式/三单）", () => {
    const stage1words = getStage(1).flatMap(c => c.words);
    const apple = stage1words.find(w => w.id === "apple");
    if (apple) {
      const qs = genWordFormQuestions(apple);
      expect(qs).toContainEqual({ wordId: "apple", prompt: "apple 的复数形式是？", answer: "apples", kind: "plural" });
    }
    const withPast = stage1words.find(w => w.exchange["d"] && w.exchange["d"].length > 0);
    if (withPast) {
      const kinds = genWordFormQuestions(withPast).map(q => q.kind);
      expect(kinds).toContain("past");
    }
  });

  it("无 exchange 的词不生成题目", () => {
    const qs = genWordFormQuestions({ id: "x", word: "x", phonetic: "", meaning: ["-"], exchange: {} });
    expect(qs).toEqual([]);
  });

  it("词条字段完整（纯字母词、有释义）", () => {
    for (const st of [1, 2, 3, 4] as const) {
      for (const ch of getStage(st)) {
        for (const w of ch.words) {
          expect(/^[a-z]+$/.test(w.word)).toBe(true);
          expect(w.meaning.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
