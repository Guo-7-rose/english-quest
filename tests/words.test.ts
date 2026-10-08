import { describe, it, expect } from "vitest";
import { getStage, getChapter, genWordFormQuestions } from "../src/data/words";

describe("words", () => {
  it("四个阶段均有章节且 id 规范", () => {
    for (const st of [1, 2, 3] as const) {
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

  it("词表已剔除功能词，且按常用度排序（第 1 章应是高频实词）", () => {
    const FUNCTION = new Set(["the", "a", "an", "of", "and", "in", "to", "is", "are", "be", "have", "it", "that", "for", "you", "he", "we", "they", "on", "at"]);
    const ultraCommon = new Set(["help", "write", "happy", "water", "book", "time", "day", "work", "good", "school", "family", "friend", "state", "part", "system", "point"]);
    for (const st of [1, 2, 3] as const) {
      const first = getStage(st)[0]!;
      const funcHits = first.words.filter(w => FUNCTION.has(w.word));
      expect(funcHits.length, `阶段${st} 第1章不应含功能词`).toBe(0);
      const commonHits = first.words.filter(w => ultraCommon.has(w.word)).length;
      expect(commonHits, `阶段${st} 第1章命中常用实词数`).toBeGreaterThan(0);
    }
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
    for (const st of [1, 2, 3] as const) {
      for (const ch of getStage(st)) {
        for (const w of ch.words) {
          expect(/^[a-z]+$/.test(w.word)).toBe(true);
          expect(w.meaning.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
