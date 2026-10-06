import { describe, it, expect } from "vitest";
import { buildStageQuiz, evaluateStageQuiz } from "../src/engine/quiz";
import { defaultState } from "../src/store/storage";

describe("stage quiz", () => {
  it("生成 20 词题 + 10 语法题", () => {
    const s = defaultState();
    const q = buildStageQuiz(s, 1);
    expect(q.wordQs.length).toBe(20);
    expect(q.grammarQs.length).toBe(10);
  });

  it("80% 通过解锁下一阶段", () => {
    const s = defaultState();
    const passed = evaluateStageQuiz(s, 1, { score: 85 });
    expect(passed.passed).toBe(true);
    expect(s.stageProgress[2]["2-1"]?.state).toBe("open");
  });

  it("低于 80% 不解锁", () => {
    const s = defaultState();
    const passed = evaluateStageQuiz(s, 1, { score: 70 });
    expect(passed.passed).toBe(false);
    expect(s.stageProgress[2]["2-1"]?.state).toBeUndefined();
  });
});
