import { describe, it, expect, beforeEach, vi } from "vitest";
import { getChapter } from "../src/data/words";

const ch1 = getChapter("1-1")!;
const first = ch1.words[0]!;
const second = ch1.words[1]!;

describe("app shell 集成", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `<div id="app"></div>`;
    localStorage.clear();
  });

  it("启动后渲染 6 个导航与首页", async () => {
    await import("../src/main");
    const nav = document.querySelectorAll("nav button");
    expect(nav.length).toBe(6);
    expect(document.querySelector("#view-home")).not.toBeNull();
    expect(document.querySelector(".checkin-btn") ?? document.querySelector("#checkinBtn")).not.toBeNull();
    // 顶栏
    expect(document.querySelector("#pills")!.textContent).toContain("天");
  });

  it("切到地图渲染关卡节点", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="map"]') as HTMLElement).click();
    expect(document.querySelector("#view-map .node")).not.toBeNull();
    expect(document.querySelector("#view-map .node .bubble")!.textContent).toBe("▶");
  });

  it("地图点第 1 关进入打字视图", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="map"]') as HTMLElement).click();
    const node = document.querySelector("#view-map .node") as HTMLElement;
    node.click();
    expect(document.querySelector("#wordStage")).not.toBeNull();
    expect(document.querySelector("#hintZh")!.textContent).toContain(first.meaning[0]!.slice(0, 4));
  });

  it("打字视图端到端：输入首词判对并推进", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="typing"]') as HTMLElement).click();
    const type = (k: string) => document.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
    for (const ch of first.word) type(ch);
    // 逐字母着色
    expect(document.querySelector("#ch0")!.className).toContain("typed-ok");
    type("Enter");
    // 推进到第 2 词
    expect(document.querySelector("#hintZh")!.textContent).toContain(second.meaning[0]!.slice(0, 4));
    expect(document.querySelector("#comboBadge")!.textContent).toContain("x1");
    // XP 已增长
    expect(document.querySelector("#pills")!.textContent).toContain("10");
  });

  it("打错 3 次显示答案并进复习队列", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="typing"]') as HTMLElement).click();
    const type = (k: string) => document.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
    type("x"); type("Enter");
    type("x"); type("Enter");
    type("Enter");
    expect(document.querySelector("#hintZh")!.textContent).toContain(second.meaning[0]!.slice(0, 4));
    expect(document.querySelectorAll(".progress-dots .dot.err").length).toBe(1);
  });

  it("语法：单元列表 → 作答 → 得分", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="grammar"]') as HTMLElement).click();
    const rows = document.querySelectorAll("#view-grammar .card");
    expect(rows.length).toBe(11); // 标题卡 + 10 单元
    // 第 1 单元开始
    const firstStart = document.querySelector("#view-grammar .card button") as HTMLElement;
    firstStart.click();
    expect(document.querySelector(".knowledge")!.textContent).toContain("be 动词");
    // 答对第 1 题（点正确选项 data-i = answer 0）
    const opt = document.querySelector('.quiz-option[data-i="0"]') as HTMLElement;
    opt.click();
    expect(opt.className).toContain("ok");
  });
});
