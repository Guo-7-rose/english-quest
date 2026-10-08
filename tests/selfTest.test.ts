import { describe, it, expect } from "vitest";
import { buildQuestions, judge } from "../src/engine/selfTest";

const WORDS = ["help", "water", "happy", "import", "teacher", "juice", "family", "school", "book", "time", "work", "friend"];

describe("自测引擎", () => {
  it("看词选义：4 个选项且答案正确", () => {
    const qs = buildQuestions(WORDS, ["word2meaning"], 5);
    expect(qs.length).toBe(5);
    for (const q of qs) {
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.kind).toBe("word2meaning");
      expect(judge(q, q.answer)).toBe(true);
      expect(judge(q, (q.answer + 1) % 4)).toBe(false);
    }
  });

  it("看义选词：选项是英文单词", () => {
    const qs = buildQuestions(WORDS, ["meaning2word"], 3);
    for (const q of qs) {
      expect(q.options.every(o => /^[a-zA-Z' -]+$/.test(o))).toBe(true);
      expect(q.prompt.length).toBeGreaterThan(0);
    }
  });

  it("选拆解：只对有词源/构词的词出题，且选项为拆解式", () => {
    const qs = buildQuestions(WORDS, ["pickBreakdown"], 5);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.options.length).toBe(4);
      expect(q.explain.length).toBeGreaterThan(0);
      expect(q.kind).toBe("pickBreakdown");
    }
  });

  it("选词根含义：题干含词根，选项为含义", () => {
    const qs = buildQuestions(WORDS, ["rootMeaning"], 3);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.options.length).toBe(4);
      expect(q.kind).toBe("rootMeaning");
    }
  });

  it("混合题型按顺序轮换生成", () => {
    const qs = buildQuestions(WORDS, ["word2meaning", "meaning2word"], 4);
    expect(qs.map(q => q.kind)).toEqual(["word2meaning", "meaning2word", "word2meaning", "meaning2word"]);
  });

  it("请求数量超过词库容量时不报错", () => {
    const qs = buildQuestions(["help", "water"], ["word2meaning"], 10);
    expect(qs.length).toBeLessThanOrEqual(10);
    expect(qs.length).toBeGreaterThan(0);
  });
});
