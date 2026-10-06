import { describe, it, expect } from "vitest";
import { getStage, getChapter, genWordFormQuestions } from "../src/data/words";

describe("words", () => {
  it("阶段 1 可读且章节 id 规范", () => {
    const chs = getStage(1);
    expect(chs.length).toBeGreaterThan(0);
    expect(chs[0]!.id).toBe("1-1");
    expect(chs[0]!.words.length).toBe(3);
  });

  it("按 id 取章节", () => {
    const ch = getChapter("1-1")!;
    expect(ch.title).toContain("第1章");
  });

  it("词形变化题生成（复数/过去式/三单）", () => {
    const apple = getChapter("1-1")!.words.find(w => w.id === "apple")!;
    const qs = genWordFormQuestions(apple);
    expect(qs).toContainEqual({ wordId: "apple", prompt: "apple 的复数形式是？", answer: "apples", kind: "plural" });
    const run = getChapter("1-1")!.words.find(w => w.id === "run")!;
    const kinds = genWordFormQuestions(run).map(q => q.kind);
    expect(kinds).toContain("past");
    expect(kinds).toContain("third");
  });

  it("无 exchange 的词不生成题目", () => {
    const qs = genWordFormQuestions({ id: "x", word: "x", phonetic: "", meaning: ["-"], exchange: {} });
    expect(qs).toEqual([]);
  });
});
