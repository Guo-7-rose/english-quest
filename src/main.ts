import "./styles/base.css";
import "./styles/components.css";
import { loadAll, save } from "./store/storage";
import type { AppState } from "./types";
import { renderHome } from "./views/home";
import { renderWordbank, bindWordbank } from "./views/wordbank";
import { renderRoots, bindRoots } from "./views/roots";
import { renderGrammar, bindGrammar } from "./views/grammar";
import { renderVideos } from "./views/videos";
import { renderReview, bindReview } from "./views/review";
import { renderWordCard, bindWordCard } from "./views/wordCard";
import { renderStats } from "./views/stats";
import { renderSettings, applyTheme } from "./views/settings";
import { initAudio } from "./fx/audio";
import { initInstallPrompt } from "./fx/install";
import { ensureCore, preloadCore, coreLoaded } from "./data/ensure";
import { loadingHTML } from "./views/shared";

/** 需要核心数据（词源/词表/助记）的板块，进入前先确保数据就绪 */
const DATA_VIEWS = new Set(["wordcard", "wordbank", "roots", "review", "stats"]);

let state: AppState = loadAll();
const app = document.getElementById("app")!;
let currentView = "home";

app.innerHTML = `
  <div class="app">
    <div class="topbar">
      <div class="logo" id="logo">🏝️ 英闯岛 <span>English Quest</span></div>
      <div class="stats-pills" id="pills" style="display:flex;gap:10px;"></div>
    </div>
    <nav class="main-nav" id="nav"></nav>
    <main id="views"></main>
  </div>
  <nav class="tabbar" id="tabbar"></nav>
  <div class="sheet" id="sheet" hidden>
    <div class="sheet-inner">
      <div class="sheet-title">更多板块</div>
      <button class="btn" data-sheet-view="videos">🎬 视频课</button>
      <button class="btn" data-sheet-view="review">🔁 复习</button>
      <button class="btn" data-sheet-view="stats">📊 数据</button>
      <button class="btn" data-sheet-view="settings">⚙️ 设置</button>
      <button class="btn btn--ghost" id="sheetClose">关闭</button>
    </div>
  </div>`;

const NAVS: Array<[string, string]> = [
  ["home", "🏠 学习面板"],
  ["wordcard", "✏️ 背单词"],
  ["wordbank", "📚 单词板块"],
  ["roots", "🌱 词根词缀库"],
  ["grammar", "📖 语法训练"],
  ["videos", "🎬 视频课"],
  ["review", "🔁 复习"],
  ["stats", "📊 数据"],
  ["settings", "⚙️ 设置"],
];

/** 手机底部标签栏：5 个主项 + 更多 */
const TABS: Array<[string, string, string]> = [
  ["home", "🏠", "面板"],
  ["wordcard", "✏️", "背单词"],
  ["wordbank", "📚", "单词"],
  ["roots", "🌱", "词根"],
  ["grammar", "📖", "语法"],
];
const SHEET_VIEWS = ["videos", "review", "stats", "settings"];

function renderTabbar(): void {
  const bar = document.getElementById("tabbar")!;
  const moreActive = SHEET_VIEWS.includes(currentView);
  bar.innerHTML =
    TABS.map(([v, icon, label]) =>
      `<button class="tab${v === currentView ? " on" : ""}" data-view="${v}"><span class="tab-icon">${icon}</span><span class="tab-label">${label}</span></button>`
    ).join("") +
    `<button class="tab${moreActive ? " on" : ""}" id="moreTab"><span class="tab-icon">⋯</span><span class="tab-label">更多</span></button>`;
  bar.querySelectorAll("[data-view]").forEach(b =>
    b.addEventListener("click", () => navigate(b.getAttribute("data-view")!)));
  bar.querySelector("#moreTab")!.addEventListener("click", () => toggleSheet(true));
}

function toggleSheet(open: boolean): void {
  const sheet = document.getElementById("sheet")!;
  sheet.hidden = !open;
  sheet.classList.toggle("open", open);
}

function renderNav(): void {
  const nav = document.getElementById("nav")!;
  nav.innerHTML = NAVS.map(([v, label]) =>
    `<button class="btn${v === currentView ? " on" : ""}" data-view="${v}">${label}</button>`).join("");
  nav.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => navigate(b.getAttribute("data-view")!)));
}

function refreshTopbar(): void {
  const pills = document.getElementById("pills")!;
  pills.innerHTML = `
    <div class="pill fire">🔥 <span class="val">${state.profile.streak}</span> 天</div>
    <div class="pill">⚡ <span class="val">${state.profile.xp}</span> XP</div>
    <div class="pill">🏅 Lv.<span class="val">${state.profile.level}</span></div>`;
}

function navigate(view: string, arg?: string): void {
  currentView = view;
  renderNav();
  renderTabbar();
  refreshTopbar();
  toggleSheet(false);
  const root = document.getElementById("views")!;
  root.innerHTML = `<section id="view-${view}" style="display:block"></section>`;
  const el = document.getElementById(`view-${view}`)!;

  // 数据门控：外壳与首页立即渲染（秒开），需要大块数据的板块先给加载态
  if (DATA_VIEWS.has(view) && !coreLoaded()) {
    el.innerHTML = loadingHTML("正在加载学习数据…（首次会稍慢，之后离线秒开）");
    void ensureCore()
      .then(() => { if (currentView === view) renderView(el, view, arg); })
      .catch(() => {
        el.innerHTML = `<div class="card"><h2>😕 数据加载失败</h2>
          <div class="muted">检查网络后刷新重试；已加载过的内容离线也能用。</div></div>`;
      });
    window.scrollTo({ top: 0 });
    return;
  }
  renderView(el, view, arg);
  window.scrollTo({ top: 0 });
}

function renderView(el: HTMLElement, view: string, arg?: string): void {
  if (view === "home") renderHome(el, state);
  else if (view === "wordcard") renderWordCard(el, state, arg);
  else if (view === "wordbank") renderWordbank(el, state, arg);
  else if (view === "roots") renderRoots(el, state, arg);
  else if (view === "grammar") renderGrammar(el, state, arg);
  else if (view === "videos") renderVideos(el, state);
  else if (view === "review") renderReview(el, state);
  else if (view === "stats") renderStats(el, state);
  else if (view === "settings") renderSettings(el, state);
}

window.addEventListener("eq:navigate", (e) => {
  const d = (e as CustomEvent).detail as { view: string; arg?: string };
  navigate(d.view, d.arg);
});

document.getElementById("logo")!.addEventListener("click", () => navigate("home"));
document.getElementById("sheetClose")!.addEventListener("click", () => toggleSheet(false));
document.getElementById("sheet")!.addEventListener("click", (e) => {
  if (e.target === document.getElementById("sheet")) toggleSheet(false);
});
document.querySelectorAll("[data-sheet-view]").forEach(b =>
  b.addEventListener("click", () => navigate(b.getAttribute("data-sheet-view")!)));

function persist(): void { save(state); }
bindGrammar(state, persist);
bindRoots(state, persist);
bindWordbank(state, persist);
bindReview(state, persist);
bindWordCard(state, persist);
applyTheme(state.settings.theme);
renderNav();
renderTabbar();
refreshTopbar();
navigate("home");

// 首屏渲染完再在后台预取数据，用户点进板块时通常已经就绪
window.setTimeout(preloadCore, 300);

document.addEventListener("pointerdown", initAudio, { once: true });

// 安装到主屏幕的引导（Android 原生安装事件 / iOS 图文指引 / 微信提示）
initInstallPrompt();

// PWA：仅在 http(s) 下注册 Service Worker（file:// 打开时静默跳过，功能不受影响）
if (location.protocol === "http:" || location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker?.register("./sw.js").catch(() => { /* 离线/不支持时忽略 */ });
  });
}
