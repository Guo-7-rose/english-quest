import { describe, it, expect } from "vitest";
import { getGrammarStage } from "../src/data/grammar";
import { judgeGrammar, recordGrammarAnswer, finishGrammarUnit } from "../src/engine/grammar";
import { defaultState } from "../src/store/storage";

describe("grammar", () => {
  it("阶段一 10 个单元", () => {
    const units = getGrammarStage(1);
    expect(units.length).toBe(10);
    expect(units[0]!.id).toBe("g1-1");
    expect(units[0]!.questions.length).toBeGreaterThanOrEqual(8);
    expect(units.every(u => u.knowledge.length > 0)).toBe(true);
  });

  it("判定与进度记录", () => {
    const u = getGrammarStage(1)[0]!;
    expect(judgeGrammar(u, 0, u.questions[0]!.answer)).toBe(true);
    const s = defaultState();
    recordGrammarAnswer(s, u.id, 0, 0);
    expect(s.grammar[u.id]).toBeDefined();
    expect(s.grammar[u.id]!.answers[0]).toBe(0);
  });

  it("单元结算得分", () => {
    const u = getGrammarStage(1)[0]!;
    const s = defaultState();
    u.questions.forEach((q, i) => recordGrammarAnswer(s, u.id, i, q.answer));
    finishGrammarUnit(s, u.id, u);
    expect(s.grammar[u.id]!.done).toBe(true);
    expect(s.grammar[u.id]!.score).toBe(100);
  });
});
