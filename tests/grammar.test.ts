import { describe, it, expect } from "vitest";
import { getGrammarUnits, getGrammarUnit } from "../src/data/grammar";
import { builtinVideos } from "../src/data/videos";
import { judgeGrammarAnswer, recordGrammarResult } from "../src/engine/grammar";
import { defaultState } from "../src/store/storage";

const VIDEO_IDS = new Set(builtinVideos().map(v => v.id));

describe("语法单元（英语思维六段式）", () => {
  it("核心语法单元 ≥ 12 个且编号连续无重复", () => {
    const units = getGrammarUnits();
    expect(units.length).toBeGreaterThanOrEqual(12);
    const nos = units.map(u => u.no);
    expect(new Set(nos).size).toBe(nos.length);
    expect(nos).toEqual([...nos].sort((a, b) => a - b));
    expect(nos[0]).toBe(1);
  });

  it("每单元六段内容齐全（英语思维/规则/例句/常见错误/练习/视频）", () => {
    for (const u of getGrammarUnits()) {
      expect(u.title.length, u.id).toBeGreaterThan(0);
      expect(u.thinking.length, u.id + " thinking").toBeGreaterThan(40);
      expect(u.rules.length, u.id + " rules").toBeGreaterThanOrEqual(3);
      expect(u.examples.length, u.id + " examples").toBeGreaterThanOrEqual(3);
      expect(u.mistakes.length, u.id + " mistakes").toBeGreaterThanOrEqual(3);
      expect(u.questions.length, u.id + " questions").toBeGreaterThanOrEqual(6);
      expect(u.videos.length, u.id + " videos").toBeGreaterThanOrEqual(1);
    }
  });

  it("规则与题目字段完整，答案下标合法且有解析", () => {
    for (const u of getGrammarUnits()) {
      for (const r of u.rules) {
        expect(r.formula.length).toBeGreaterThan(0);
        expect(r.desc.length).toBeGreaterThan(0);
      }
      for (const q of u.questions) {
        expect(q.options.length).toBe(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
        expect(q.explain.length).toBeGreaterThan(5);
      }
    }
  });

  it("例句包含正误对照", () => {
    for (const u of getGrammarUnits()) {
      expect(u.examples.some(e => e.ok), u.id + " 应有正确例句").toBe(true);
      expect(u.examples.some(e => !e.ok), u.id + " 应有错误例句对照").toBe(true);
    }
  });

  it("关联视频全部来自已核验的内置清单", () => {
    for (const u of getGrammarUnits()) {
      for (const id of u.videos) expect(VIDEO_IDS.has(id), u.id + ":" + id).toBe(true);
    }
  });

  it("按 id 取单元", () => {
    expect(getGrammarUnit("g-4")?.title).toContain("冠词");
    expect(getGrammarUnit("nope")).toBeUndefined();
  });

  it("判题与进度记录", () => {
    const u = getGrammarUnit("g-1")!;
    expect(judgeGrammarAnswer(u, 0, u.questions[0]!.answer)).toBe(true);
    expect(judgeGrammarAnswer(u, 0, (u.questions[0]!.answer + 1) % 4)).toBe(false);
    const s = defaultState();
    recordGrammarResult(s, u.id, 100);
    expect(s.grammar[u.id]!.done).toBe(true);
    expect(s.grammar[u.id]!.score).toBe(100);
  });
});
