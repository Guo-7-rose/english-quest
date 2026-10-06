import { describe, it, expect } from "vitest";
import { createSession } from "../src/engine/typing";

const WORDS = [
  { id: "apple", word: "apple", phonetic: "/x/", meaning: ["苹果"], exchange: {} },
  { id: "cat", word: "cat", phonetic: "/x/", meaning: ["猫"], exchange: {} },
];

describe("typing session", () => {
  it("逐字符输入与正确判定", () => {
    const s = createSession(WORDS, 1000);
    for (const ch of "apple") s.input(ch);
    const r = s.submit();
    expect(r.ok).toBe(true);
    expect(s.index).toBe(1);
    expect(s.stats.total).toBe(1);
    expect(s.stats.combo).toBe(1);
  });

  it("打错需重打，累计 3 次才显示答案", () => {
    const s = createSession(WORDS, 1000);
    s.input("a"); s.input("p"); s.input("x");
    let r = s.submit();                       // 错 1
    expect(r.ok).toBe(false); expect(r.revealed).toBe(false);
    expect(s.typed).toBe("");                  // 清空重打
    s.input("a"); s.input("z");
    r = s.submit();                            // 错 2
    expect(r.revealed).toBe(false);
    r = s.submit();                            // 空提交 = 错 3
    expect(r.revealed).toBe(true);             // 显示答案并跳过
    expect(s.index).toBe(1);
    expect(s.wordResult[0]).toBe(false);
  });

  it("连击与断连击", () => {
    const s = createSession(WORDS, 1000);
    for (const ch of "apple") s.input(ch); s.submit();
    expect(s.stats.combo).toBe(1);
    s.input("c"); s.input("x"); s.submit();
    expect(s.stats.combo).toBe(0);
  });

  it("统计计算 accuracy / wpm", () => {
    const s = createSession(WORDS, 0);
    for (const ch of "apple") s.input(ch); s.submit(); // 对
    for (const ch of "cat") s.input(ch); s.submit();   // 对
    expect(s.accuracy()).toBe(100);
    expect(s.wpm(60000)).toBe(2);             // 1 分钟 2 词
    expect(s.done).toBe(true);
  });

  it("skip 记录 null 并推进", () => {
    const s = createSession(WORDS, 1000);
    s.skip();
    expect(s.index).toBe(1);
    expect(s.wordResult[0]).toBeNull();
  });
});
