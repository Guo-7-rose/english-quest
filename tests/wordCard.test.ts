import { describe, it, expect } from "vitest";
import { createSession, current, rate, isFinished, progress, suggestNewCount } from "../src/engine/wordCard";
import type { CardSession } from "../src/engine/wordCard";

const WORDS = ["hospital", "weather", "umbrella", "library", "bicycle", "elephant"];

describe("卡片编排引擎", () => {
  it("建组：队列与总数正确，当前卡为首词", () => {
    const s = createSession(WORDS);
    expect(s.queue.length).toBe(6);
    expect(s.uniqueTotal).toBe(6);
    expect(current(s)?.word).toBe("hospital");
    expect(isFinished(s)).toBe(false);
  });

  it("去重：重复词只出现一次", () => {
    const s = createSession(["help", "help", "water"]);
    expect(s.uniqueTotal).toBe(2);
    expect(s.queue.length).toBe(2);
  });

  it("认识：不重排，计入结业", () => {
    const s = createSession(WORDS);
    rate(s, "know");
    expect(s.counts.know).toBe(1);
    expect(s.finished).toContain("hospital");
    expect(current(s)?.word).toBe("weather");
    expect(s.queue.length).toBe(5);
  });

  it("熟知：立即结业且不重排", () => {
    const s = createSession(WORDS);
    rate(s, "mastered");
    expect(s.counts.mastered).toBe(1);
    expect(s.finished).toContain("hospital");
    expect(s.queue.some(i => i.word === "hospital")).toBe(false);
  });

  it("模糊：当天在本轮末尾再出现一次", () => {
    const s = createSession(WORDS);
    rate(s, "vague");
    const reappear = s.queue.filter(i => i.word === "hospital").length;
    expect(reappear).toBe(1);
    expect(s.queue[s.queue.length - 1]!.word).toBe("hospital");
    expect(s.finished).not.toContain("hospital");
  });

  it("忘记：当天再出现两次（一次靠后、一次在队尾）", () => {
    const s = createSession(WORDS);
    rate(s, "forgot");
    const copies = s.queue.filter(i => i.word === "hospital");
    expect(copies.length).toBe(2);
    expect(s.queue[s.queue.length - 1]!.word).toBe("hospital");
  });

  it("上限保护：同一词当天最多出现 3 次，之后强制结业", () => {
    const s = createSession(["help"]);
    // 第 1 次：忘记 → 排入 2 次
    rate(s, "forgot");
    // 第 2 次：忘记 → 只剩 1 次额度
    rate(s, "forgot");
    // 第 3 次：仍忘记 → 达到上限，不再重排
    rate(s, "forgot");
    expect(s.queue.length).toBe(0);
    expect(isFinished(s)).toBe(true);
    expect(s.finished).toContain("help");
    expect(s.counts.forgot).toBe(3);
  });

  it("进度统计：已结业 / 总数", () => {
    const s = createSession(WORDS);
    expect(progress(s)).toEqual({ done: 0, total: 6 });
    rate(s, "know");
    rate(s, "mastered");
    expect(progress(s)).toEqual({ done: 2, total: 6 });
  });

  it("一整轮走完会结束", () => {
    const s = createSession(["a1", "b1", "c1"]);
    while (!isFinished(s)) {
      const c = current(s);
      expect(c).not.toBeNull();
      rate(s, "know");
    }
    expect(s.finished.length).toBe(3);
  });

  it("动态建议新词量：复习越多，建议新词越少", () => {
    expect(suggestNewCount(0)).toBe(30);
    expect(suggestNewCount(8)).toBe(20);
    expect(suggestNewCount(20)).toBe(10);
    expect(suggestNewCount(60)).toBe(5);
    expect(suggestNewCount(0)).toBeGreaterThan(suggestNewCount(60));
  });

  it("空词表不会崩", () => {
    const s: CardSession = createSession([]);
    expect(isFinished(s)).toBe(true);
    expect(current(s)).toBeNull();
    expect(() => rate(s, "know")).not.toThrow();
  });
});
