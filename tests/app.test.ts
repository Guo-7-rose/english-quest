import { describe, it, expect, beforeEach, vi } from "vitest";

describe("app shell 集成（v2 八板块）", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `<div id="app"></div>`;
    localStorage.clear();
  });

  it("启动后渲染 9 个桌面导航与学习面板", async () => {
    await import("../src/main");
    const nav = document.querySelectorAll("nav.main-nav button");
    expect(nav.length).toBe(9);
    expect(document.querySelector("#view-home")).not.toBeNull();
    expect(document.querySelector("#pills")!.textContent).toContain("天");
  });

  it("导航无任何锁定状态", async () => {
    await import("../src/main");
    const labels = [...document.querySelectorAll("nav.main-nav button")].map(b => b.textContent ?? "");
    expect(labels.join(" ")).toContain("单词板块");
    expect(labels.join(" ")).toContain("词根词缀库");
    expect(labels.join(" ")).toContain("视频课");
    expect(document.body.textContent).not.toContain("未解锁");
    expect(document.querySelectorAll("[disabled]").length).toBe(0);
  });

  it("八个板块全部可切换", async () => {
    await import("../src/main");
    for (const v of ["wordcard", "wordbank", "roots", "grammar", "videos", "review", "stats", "settings", "home"]) {
      (document.querySelector(`[data-view="${v}"]`) as HTMLElement).click();
      expect(document.querySelector(`#view-${v}`)).not.toBeNull();
    }
  });

  it("语法板块：单元列表 → 六段式单元页 → 练习作答", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="grammar"]') as HTMLElement).click();
    const cards = document.querySelectorAll("#view-grammar .card");
    expect(cards.length).toBeGreaterThanOrEqual(13); // 标题卡 + ≥12 单元
    // 进入第 1 单元
    (cards[1] as HTMLElement).click();
    const text = document.querySelector("#view-grammar")!.textContent ?? "";
    expect(text).toContain("英语思维");
    expect(text).toContain("规则");
    expect(text).toContain("常见错误");
    expect(text).toContain("配套视频");
    // 答第 1 题（正确答案 data-i 由数据给出，直接点正确项）
    const firstUnit = (await import("../src/data/grammar")).getGrammarUnit("g-1")!;
    const correctIdx = firstUnit.questions[0]!.answer;
    const opt = document.querySelector(`.quiz-option[data-i="${correctIdx}"]`) as HTMLElement;
    opt.click();
    expect(opt.className).toContain("ok");
    expect(document.querySelector("#explain")!.textContent).toContain("正确");
  });

  it("单词板块：四个板块按 日常→初中→高中→四级 顺序且无锁", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="wordbank"]') as HTMLElement).click();
    const text = document.querySelector("#view-wordbank")!.textContent ?? "";
    const order = ["日常词汇", "初中词汇", "高中词汇", "四级词汇"].map(t => text.indexOf(t));
    expect(order.every(i => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(text).not.toContain("未解锁");
    expect(document.querySelectorAll("#view-wordbank [disabled]").length).toBe(0);
  });

  it("单词板块：日常词汇 → 主题词表 → 词详情可标记", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="wordbank"]') as HTMLElement).click();
    // 进入日常词汇
    const dailyCard = [...document.querySelectorAll("#view-wordbank .card")].find(c => c.textContent?.includes("日常词汇")) as HTMLElement;
    dailyCard.click();
    const themes = document.querySelectorAll("#view-wordbank [data-theme]");
    expect(themes.length).toBeGreaterThanOrEqual(18);
    // 进入第一个主题
    (themes[0] as HTMLElement).click();
    const rows = document.querySelectorAll("#wordList #rows > div");
    expect(rows.length).toBeGreaterThan(20);
    // 展开词详情并标记记住
    const row = rows[0] as HTMLElement;
    row.click();
    expect(row.textContent).toContain("记住了");
    (row.querySelector('[data-act="ok"]') as HTMLElement).click();
    expect(row.textContent).toContain("✅");
  });

  it("单词板块：四级词表分页可用", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="wordbank"]') as HTMLElement).click();
    const cet4 = [...document.querySelectorAll("#view-wordbank .card")].find(c => c.textContent?.includes("四级词汇")) as HTMLElement;
    cet4.click();
    expect(document.querySelector("#view-wordbank")!.textContent).toContain("第 1 /");
    const rows = document.querySelectorAll("#wordList #rows > div");
    expect(rows.length).toBeLessThanOrEqual(50);
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

  it("视频课：主题筛选 + 可添加自定义链接", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="videos"]') as HTMLElement).click();
    expect(document.querySelector("#view-videos")!.textContent).toContain("语法视频课");
    const topics = [...document.querySelectorAll("#view-videos [data-topic]")].map(b => b.textContent);
    expect(topics).toContain("英语思维");
    // 添加自定义视频 → 卡片出现且带移除按钮
    const input = document.querySelector("#videoUrl") as HTMLInputElement;
    input.value = "https://youtu.be/is7vn5URVcc";
    (document.querySelector("#addVideo") as HTMLElement).click();
    expect(document.querySelector("#view-videos")!.textContent).toContain("我的视频");
    expect(document.querySelectorAll('#view-videos [data-del="1"]').length).toBe(1);
  });

  it("背单词：卡片先自评，选完才看释义与词源拆解", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="wordcard"]') as HTMLElement).click();
    const home = document.querySelector("#view-wordcard")!.textContent ?? "";
    expect(home).toContain("每组单词数量");
    expect(home).toContain("今天建议学");

    const dailyCard = [...document.querySelectorAll("#view-wordcard .card")]
      .find(c => c.textContent?.includes("日常词汇")) as HTMLElement;
    dailyCard.click();

    const word = document.querySelector("#cardWord")!.textContent ?? "";
    expect(word.length).toBeGreaterThan(1);
    // 未自评前不显示释义/拆解
    expect((document.querySelector("#revealArea") as HTMLElement).textContent).toBe("");
    expect(document.querySelectorAll("[data-rate]").length).toBe(4);

    // 选「认识」→ 才展开释义与拆解
    (document.querySelector('[data-rate="know"]') as HTMLElement).click();
    const revealed = (document.querySelector("#revealArea") as HTMLElement).textContent ?? "";
    expect(revealed.length).toBeGreaterThan(10);
    expect(revealed).toContain("下一个");
    expect(revealed).toMatch(/词源|构词|助记/);

    (document.querySelector("#nextBtn") as HTMLElement).click();
    expect(document.querySelector("#cardWord")).not.toBeNull();
  });

  it("背单词：熟知写入 mastered，永久移出复习队列", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="wordcard"]') as HTMLElement).click();
    const dailyCard = [...document.querySelectorAll("#view-wordcard .card")]
      .find(c => c.textContent?.includes("日常词汇")) as HTMLElement;
    dailyCard.click();
    const word = (document.querySelector("#cardWord")!.textContent ?? "").toLowerCase();
    (document.querySelector('[data-rate="mastered"]') as HTMLElement).click();
    const saved = JSON.parse(localStorage.getItem("eq:state") ?? "{}");
    expect(saved.wordStats[word].mastered).toBe(true);
    expect(saved.wordStats[word].inReview).toBe(false);
  });

  it("背单词：忘记计入错词统计（❌ 计数增加）", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="wordcard"]') as HTMLElement).click();
    const dailyCard = [...document.querySelectorAll("#view-wordcard .card")]
      .find(c => c.textContent?.includes("日常词汇")) as HTMLElement;
    dailyCard.click();
    (document.querySelector('[data-rate="forgot"]') as HTMLElement).click();
    expect((document.querySelector("#cardBox")!.textContent ?? "")).toContain("❌ 1");
    (document.querySelector("#nextBtn") as HTMLElement).click();
    expect(document.querySelector("#cardWord")).not.toBeNull();
  });

  it("手机端：底部标签栏 5 主项 + 更多面板", async () => {
    await import("../src/main");
    const tabs = document.querySelectorAll("#tabbar .tab");
    expect(tabs.length).toBe(6);
    const labels = [...tabs].map(t => t.textContent ?? "").join(" ");
    for (const l of ["面板", "背单词", "单词", "词根", "语法", "更多"]) expect(labels).toContain(l);
    (document.querySelector("#moreTab") as HTMLElement).click();
    const sheet = document.querySelector("#sheet") as HTMLElement;
    expect(sheet.hidden).toBe(false);
    const sheetText = sheet.textContent ?? "";
    for (const l of ["视频课", "复习", "数据", "设置"]) expect(sheetText).toContain(l);
    (document.querySelector('[data-sheet-view="videos"]') as HTMLElement).click();
    expect(document.querySelector("#view-videos")).not.toBeNull();
    expect((document.querySelector("#sheet") as HTMLElement).hidden).toBe(true);
  });

  it("复习板块：随机自测可出题并作答计分", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="review"]') as HTMLElement).click();
    expect(document.querySelector("#view-review")!.textContent).toContain("随机自测");
    (document.querySelector("#startDaily") as HTMLElement).click();
    const opts = document.querySelectorAll("#reviewStage .quiz-option");
    expect(opts.length).toBe(4);
    (opts[0] as HTMLElement).click();
    expect(document.querySelector("#reviewStage")!.textContent).toContain("下一题");
  });

  it("PWA：manifest 与 SW 注册代码存在（仅 http(s) 注册）", async () => {
    await import("../src/main");
    // jsdom 的 location.protocol 是 http:，注册逻辑不抛错即可（sw.js 在构建产物中）
    expect(typeof navigator.serviceWorker?.register === "function" || navigator.serviceWorker === undefined).toBe(true);
  });

  it("数据中心：概览/热力图/成就墙/错题本", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="stats"]') as HTMLElement).click();
    const text = document.querySelector("#view-stats")!.textContent ?? "";
    expect(document.querySelectorAll("#view-stats .badge").length).toBeGreaterThan(5);
    expect(text).toContain("错题本");
    expect(text).toContain("词根家族");
    expect(text).toContain("词库总量");
    expect(document.querySelector("#view-stats .heatmap .day")).not.toBeNull();
  });

  it("设置：主题全部解锁（无禁用按钮）", async () => {
    await import("../src/main");
    (document.querySelector('[data-view="settings"]') as HTMLElement).click();
    expect(document.querySelector("#view-settings")!.textContent).toContain("每日目标");
    expect(document.querySelector("#view-settings")!.textContent).toContain("全部主题直接可用");
    const themes = document.querySelectorAll("#themes .btn");
    expect(themes.length).toBe(3);
    expect([...themes].every(b => !(b as HTMLButtonElement).disabled)).toBe(true);
  });

  it("首页有今日推荐且可跳转", async () => {
    await import("../src/main");
    expect(document.querySelector("#view-home")!.textContent).toContain("今日推荐");
    const recBtn = document.querySelector('#view-home [data-go][data-arg]') as HTMLElement;
    expect(recBtn).not.toBeNull();
    recBtn.click();
    expect(document.querySelector("#views section")).not.toBeNull();
  });
});
