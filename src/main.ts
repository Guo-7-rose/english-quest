import "./styles/base.css";
import "./styles/components.css";
import { loadAll, save } from "./store/storage";
import type { AppState } from "./types";
import { renderHome } from "./views/home";
import { renderWordbank } from "./views/wordbank";
import { renderRoots, bindRoots } from "./views/roots";
import { renderGrammar, bindGrammar } from "./views/grammar";
import { renderVideos } from "./views/videos";
import { renderReview } from "./views/review";
import { renderStats } from "./views/stats";
import { renderSettings, applyTheme } from "./views/settings";
import { initAudio } from "./fx/audio";

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
  </div>`;

const NAVS: Array<[string, string]> = [
  ["home", "🏠 学习面板"],
  ["wordbank", "📚 单词板块"],
  ["roots", "🌱 词根词缀库"],
  ["grammar", "📖 语法训练"],
  ["videos", "🎬 视频课"],
  ["review", "🔁 复习"],
  ["stats", "📊 数据"],
  ["settings", "⚙️ 设置"],
];

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
  refreshTopbar();
  const root = document.getElementById("views")!;
  root.innerHTML = `<section id="view-${view}" style="display:block"></section>`;
  const el = document.getElementById(`view-${view}`)!;
  if (view === "home") renderHome(el, state);
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

function persist(): void { save(state); }
bindGrammar(state, persist);
bindRoots(state, persist);
applyTheme(state.settings.theme);
renderNav();
refreshTopbar();
navigate("home");

document.addEventListener("pointerdown", initAudio, { once: true });
