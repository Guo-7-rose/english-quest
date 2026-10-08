import { describe, it, expect, beforeEach, vi } from "vitest";

describe("app shell 集成（v2 八板块）", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `<div id="app"></div>`;
    localStorage.clear();
  });

  it("启动后渲染 8 个板块导航与学习面板", async () => {
    await import("../src/main");
    const nav = document.querySelectorAll("nav button");
    expect(nav.length).toBe(8);
    expect(document.querySelector("#view-home")).not.toBeNull();
    expect(document.querySelector("#pills")!.textContent).toContain("天");
  });

  it("导航无任何锁定状态", async () => {
    await import("../src/main");
    const labels = [...document.querySelectorAll("nav button")].map(b => b.textContent ?? "");
    expect(labels.join(" ")).toContain("单词板块");
    expect(labels.join(" ")).toContain("词根词缀库");
    expect(labels.join(" ")).toContain("视频课");
    expect(document.body.textContent).not.toContain("未解锁");
    expect(document.querySelectorAll("[disabled]").length).toBe(0);
  });

  it("八个板块全部可切换", async () => {
    await import("../src/main");
    for (const v of ["wordbank", "roots", "grammar", "videos", "review", "stats", "settings", "home"]) {
      (document.querySelector(`[data-view="${v}"]`) as HTMLElement).click();
      expect(document.querySelector(`#view-${v}`)).not.toBeNull();
    }
  });

  it("语法板块：单元列表可进入", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="grammar"]') as HTMLElement).click();
    expect(document.querySelectorAll("#view-grammar .card").length).toBeGreaterThan(2);
  });

  it("词根词缀库：家族网格 → 家族页 → 同族词", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="roots"]') as HTMLElement).click();
    const cards = document.querySelectorAll("#rootsGrid [data-key]");
    expect(cards.length).toBeGreaterThan(50);
    // 进入第一个家族
    (cards[0] as HTMLElement).click();
    expect(document.querySelector("#famWords")).not.toBeNull();
    expect(document.querySelectorAll("#famWords > div").length).toBeGreaterThan(0);
    // 点开一个词看三层拆解与标记按钮
    const row = document.querySelector("#famWords > div") as HTMLElement;
    row.click();
    expect(row.textContent).toContain("记住了");
  });

  it("词根词缀库：搜索可按词根名或单词过滤", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="roots"]') as HTMLElement).click();
    const input = document.querySelector("#rootsSearch") as HTMLInputElement;
    input.value = "port";
    input.dispatchEvent(new Event("input"));
    const keys = [...document.querySelectorAll("#rootsGrid [data-key]")].map(e => e.getAttribute("data-key"));
    expect(keys.some(k => (k ?? "").includes("port"))).toBe(true);
  });

  it("数据中心：概览/热力图/成就墙/错题本", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="stats"]') as HTMLElement).click();
    expect(document.querySelectorAll("#view-stats .badge").length).toBeGreaterThan(5);
    expect(document.querySelector("#view-stats")!.textContent).toContain("错题本");
    expect(document.querySelector("#view-stats .heatmap .day")).not.toBeNull();
  });

  it("设置：开关/每日目标/主题渲染", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="settings"]') as HTMLElement).click();
    expect(document.querySelector("#view-settings")!.textContent).toContain("每日目标");
    expect(document.querySelector("#view-settings")!.textContent).toContain("重置全部数据");
    expect(document.querySelectorAll("#view-settings .btn").length).toBeGreaterThan(6);
  });
});
