import type { AppState } from "../types";
import {
  createSession, current, rate, isFinished, progress, suggestNewCount, pickNewWords,
  type CardSession, type Rating,
} from "../engine/wordCard";
import { markRemembered, markVague, markNeedReview, markMastered, dueWords } from "../engine/reviewQueue";
import { buildMnemonic } from "../engine/mnemonic";
import { familyOfWord } from "../data/roots";
import { wordInfo } from "../data/words";
import { bankWords, bankMeta, allThemes, getTheme, type BankId } from "../data/wordbank";
import { addXp } from "../engine/progress";
import { recordDailyWord } from "../engine/streak";
import { checkAchievements, ACHIEVEMENTS } from "../data/achievements";
import { sCorrect, sWrong, sLevelUp, speakWord, sKey } from "../fx/audio";
import { burstStars, confettiBurst, toast } from "../fx/fx";
import { layerBadge } from "./shared";
import { getGrammarUnits } from "../data/grammar";

export let cardState: AppState;
export let cardSave: () => void;

export function bindWordCard(state: AppState, save: () => void): void {
  cardState = state;
  cardSave = save;
}

const LEARN_BANKS: BankId[] = ["daily", "zk", "gk", "cet4"];
const GROUP_SIZES = [10, 20, 30, 50];

let groupSize = 20;
let session: CardSession | null = null;
let reveal = false;
let sessionLabel = "";
let ratedWrong: string[] = [];   // 本轮标记为模糊/忘记的词（用于「再刷一遍」）

export function renderWordCard(root: HTMLElement, state: AppState, arg?: string): void {
  cardState = state;
  root.innerHTML = "";
  if (!arg) return renderHome(root, state);
  if (arg === "review") return startReview(root, state);
  const { words, label } = resolveWords(state, arg);
  if (words.length === 0) {
    root.innerHTML = `<div class="card"><h2>这一组没有可学的词</h2><div class="muted">换个板块试试</div></div>`;
    return;
  }
  startSession(root, state, words, label);
}

/** arg: daily | daily:<themeId> | zk | gk | cet4 */
function resolveWords(state: AppState, arg: string): { words: string[]; label: string } {
  if (arg.startsWith("daily:")) {
    const t = getTheme(arg.slice(6));
    if (!t) return { words: [], label: "日常词汇" };
    return { words: t.words.map(w => w.word), label: t.icon + " " + t.title };
  }
  if (arg === "daily") {
    return { words: bankWords("daily"), label: "🏠 日常词汇" };
  }
  const bank = arg as BankId;
  if (LEARN_BANKS.includes(bank)) {
    const meta = bankMeta(bank);
    return { words: bankWords(bank), label: meta.icon + " " + meta.title };
  }
  return { words: [], label: "" };
}

/** 背单词首页：选板块 + 选每组数量 + 今日建议 + 复习入口 */
function renderHome(root: HTMLElement, state: AppState): void {
  const due = dueWords(state).length;
  const learned = Object.keys(state.wordStats).filter(w => state.wordStats[w]!.correct > 0).length;
  const suggested = suggestNewCount(due);

  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `
    <h2>✏️ 背单词</h2>
    <div class="muted">看单词先自评，选完才显示释义与词源拆解 —— 选择会决定它下次什么时候再出现</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
      <div class="pill fire">到期复习 <span class="val">${due}</span> 词</div>
      <div class="pill">已学 <span class="val">${learned}</span> 词</div>
      <div class="pill">今日已学 <span class="val">${state.profile.dailyWordsToday}</span> 词</div>
    </div>
    <div class="muted" style="margin-top:10px">💡 今天建议学 <b>${suggested}</b> 个新词（你有 ${due} 个到期复习：复习多就少学新词，避免以后越滚越多）</div>
    <div style="margin-top:12px">
      <div class="muted" style="margin-bottom:6px">每组单词数量</div>
      <div id="sizes" style="display:flex;gap:8px;flex-wrap:wrap"></div>
    </div>`;
  root.appendChild(head);

  const sizes = head.querySelector("#sizes")!;
  for (const n of GROUP_SIZES) {
    const b = document.createElement("button");
    b.className = "btn" + (n === groupSize ? " on" : "");
    b.textContent = n + " 个";
    b.addEventListener("click", () => {
      groupSize = n;
      renderHome(root, state);
    });
    sizes.appendChild(b);
  }
  sizes.insertAdjacentHTML("beforeend", `<span class="muted" style="align-self:center">当前：一组 ${groupSize} 个词</span>`);

  if (due > 0) {
    const rv = document.createElement("div");
    rv.className = "card";
    rv.style.cssText = "border-color:#FFE08A;background:#FFFBE6;cursor:pointer";
    rv.innerHTML = `<b>🔁 先复习到期的 ${due} 个词</b><div class="muted">用同一套卡片自评，把这些清掉再学新词更稳</div>`;
    rv.addEventListener("click", () => nav("wordcard", "review"));
    root.appendChild(rv);
  }

  const list = document.createElement("div");
  list.innerHTML = `<div class="card"><h2>📚 选一组开始背</h2><div class="muted">按 日常 → 初中 → 高中 → 四级 的顺序最实用</div></div>`;
  root.appendChild(list);

  for (const bank of LEARN_BANKS) {
    const meta = bankMeta(bank);
    const pool = bankWords(bank);
    const learnedSet = new Set(Object.keys(state.wordStats).filter(w => state.wordStats[w]!.correct > 0));
    const fresh = pool.filter(w => !learnedSet.has(w)).length;
    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer";
    card.innerHTML = `
      <div>
        <div style="font-weight:900;font-size:16px">${meta.icon} ${meta.title}</div>
        <div class="muted">共 ${pool.length} 词 · 未学 ${fresh} 词</div>
      </div>
      <button class="btn btn--green">🚀 开始背 ${groupSize} 个</button>`;
    card.addEventListener("click", () => nav("wordcard", bank));
    root.appendChild(card);
  }

  const themeBox = document.createElement("div");
  themeBox.className = "card";
  themeBox.innerHTML = `<h2>🗂️ 按主题背（日常词汇）</h2><div class="muted">想学哪个场景就点哪个</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:10px">
      ${allThemes().map(t => `<button class="btn" data-theme="${t.id}">${t.icon} ${t.title}</button>`).join("")}
    </div>`;
  root.appendChild(themeBox);
  themeBox.querySelectorAll("[data-theme]").forEach(b =>
    b.addEventListener("click", () => nav("wordcard", "daily:" + b.getAttribute("data-theme"))));
}

function startReview(root: HTMLElement, state: AppState): void {
  const due = dueWords(state);
  if (due.length === 0) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h2>🔁 复习</h2><div class="muted">当前没有到期复习的词 —— 先去背几个新词吧</div>
      <button class="btn btn--green" id="goLearn" style="margin-top:10px">✏️ 去背单词</button>`;
    root.appendChild(card);
    card.querySelector("#goLearn")!.addEventListener("click", () => nav("wordcard"));
    return;
  }
  startSession(root, state, due.slice(0, groupSize), "🔁 到期复习");
}

function startSession(root: HTMLElement, state: AppState, pool: string[], label: string): void {
  const learnedSet = new Set(Object.keys(state.wordStats).filter(w => state.wordStats[w]!.correct > 0));
  const words = label.includes("复习") ? pool : pickNewWords(pool, learnedSet, groupSize);
  session = createSession(words);
  reveal = false;
  ratedWrong = [];
  sessionLabel = label;
  root.innerHTML = "";
  drawCard(root, state);
}

function nav(view: string, arg?: string): void {
  window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view, arg } }));
}

function drawCard(root: HTMLElement, state: AppState): void {
  if (!session) return;
  if (isFinished(session)) return drawSummary(root, state);
  const item = current(session)!;
  const info = wordInfo(item.word);
  const m = buildMnemonic(item.word);
  const p = progress(session);

  const card = document.createElement("div");
  card.className = "card";
  card.id = "cardBox";
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <div class="muted">${sessionLabel} · 第 ${p.done + 1} / ${p.total} 词</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="cardCounts">
        <span class="pill">✅ ${session.counts.know}</span>
        <span class="pill">🤔 ${session.counts.vague}</span>
        <span class="pill">❌ ${session.counts.forgot}</span>
        <span class="pill">⭐ ${session.counts.mastered}</span>
      </div>
    </div>
    <div style="text-align:center;padding:26px 0 18px">
      <div style="font-size:38px;font-weight:900;letter-spacing:1px" id="cardWord">${item.word}</div>
      <div class="muted" style="margin-top:6px">${info?.phonetic ?? ""}</div>
      <button class="btn btn--ghost" id="speakBtn" style="margin-top:8px">🔊 听发音</button>
    </div>
    <div id="revealArea"></div>
    <div id="rateArea" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">
      <button class="btn btn--green" data-rate="know">✅ 认识<small style="opacity:.8"> 1</small></button>
      <button class="btn btn--yellow" data-rate="vague">🤔 模糊<small style="opacity:.8"> 2</small></button>
      <button class="btn btn--red" data-rate="forgot">❌ 忘记<small style="opacity:.8"> 3</small></button>
      <button class="btn btn--purple" data-rate="mastered">⭐ 熟知<small style="opacity:.8"> 4</small></button>
    </div>`;
  root.appendChild(card);

  card.querySelector("#speakBtn")!.addEventListener("click", (e) => {
    e.stopPropagation();
    speakWord(item.word);
  });

  const revealArea = card.querySelector("#revealArea") as HTMLElement;
  const rateArea = card.querySelector("#rateArea") as HTMLElement;

  const doReveal = () => {
    reveal = true;
    const fams = familyOfWord(item.word);
    revealArea.innerHTML = `
      <div style="background:#F7FBFF;border:2px solid #DCEBFA;border-radius:14px;padding:14px;margin-bottom:12px">
        <div style="font-weight:900;margin-bottom:8px">${layerBadge(m.layer)}${m.formula || "（无拆解）"}</div>
        ${m.parts.length ? `<div style="margin-bottom:8px">${m.parts.map(x => `<span class="pill" style="margin:2px">${x.text} = ${x.gloss}</span>`).join(" + ")}</div>` : ""}
        <div class="muted" style="margin-bottom:8px">${m.note}</div>
        <div>${(info?.meaning ?? []).map(x => `<div style="font-weight:700">· ${x}</div>`).join("")}</div>
        ${fams.length ? `<div class="muted" style="margin-top:8px">同族词根：${fams.map(f => `<a href="#" data-fam="${f.key}" style="color:var(--blue);font-weight:800">${f.name}</a>`).join(" · ")}</div>` : ""}
      </div>
      <button class="btn btn--blue" id="nextBtn" style="width:100%;margin-bottom:10px">下一个 → （空格）</button>`;
    revealArea.querySelectorAll("[data-fam]").forEach(a => a.addEventListener("click", (e) => {
      e.preventDefault();
      nav("roots", a.getAttribute("data-fam")!);
    }));
    revealArea.querySelector("#nextBtn")!.addEventListener("click", () => {
      reveal = false;
      root.innerHTML = "";
      drawCard(root, state);
    });
    rateArea.style.display = "none";
  };

  const doRate = (r: Rating) => {
    if (reveal) return;
    const word = item.word;
    if (r === "know") {
      markRemembered(state, word);
      addXp(state, 3);
      const checkedIn = recordDailyWord(state);
      sCorrect();
      burstStars(card);
      if (checkedIn) { confettiBurst(); sLevelUp(); toast("🔥 打卡成功！连续 " + state.profile.streak + " 天"); }
      const unlocked = checkAchievements(state);
      for (const id of unlocked) toast("🏅 新成就：" + ACHIEVEMENTS[id]!.name);
    } else if (r === "vague") {
      markVague(state, word);
      ratedWrong.push(word);
      sKey();
    } else if (r === "forgot") {
      markNeedReview(state, word);
      ratedWrong.push(word);
      sWrong();
    } else {
      markMastered(state, word);
      addXp(state, 3);
      recordDailyWord(state);
      sCorrect();
      burstStars(card);
    }
    cardSave();
    rate(session!, r);
    // 评分后立即刷新顶部计数（不等下一张卡重绘）
    const counts = document.getElementById("cardCounts");
    if (counts) {
      counts.innerHTML = `
        <span class="pill">✅ ${session!.counts.know}</span>
        <span class="pill">🤔 ${session!.counts.vague}</span>
        <span class="pill">❌ ${session!.counts.forgot}</span>
        <span class="pill">⭐ ${session!.counts.mastered}</span>`;
    }
    doReveal();
  };

  rateArea.querySelectorAll("[data-rate]").forEach(b =>
    b.addEventListener("click", () => doRate(b.getAttribute("data-rate") as Rating)));

  // 键盘：1/2/3/4 自评，空格/回车下一个
  const onKey = (e: KeyboardEvent) => {
    if (!document.getElementById("cardBox")) { document.removeEventListener("keydown", onKey); return; }
    if (reveal) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); (revealArea.querySelector("#nextBtn") as HTMLElement)?.click(); }
      return;
    }
    const map: Record<string, Rating> = { "1": "know", "2": "vague", "3": "forgot", "4": "mastered" };
    const r = map[e.key];
    if (r) { e.preventDefault(); doRate(r); }
  };
  document.addEventListener("keydown", onKey);
}

function drawSummary(root: HTMLElement, state: AppState): void {
  if (!session) return;
  const c = session.counts;
  const total = session.uniqueTotal;
  const good = c.know + c.mastered;
  const card = document.createElement("div");
  card.className = "card";
  card.style.textAlign = "center";
  card.innerHTML = `
    <div style="font-size:38px">${good / Math.max(1, total) >= 0.8 ? "🎉" : "💪"}</div>
    <h2>这一组完成！</h2>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0">
      <span class="pill">✅ 认识 <span class="val">${c.know}</span></span>
      <span class="pill">🤔 模糊 <span class="val">${c.vague}</span></span>
      <span class="pill">❌ 忘记 <span class="val">${c.forgot}</span></span>
      <span class="pill">⭐ 熟知 <span class="val">${c.mastered}</span></span>
    </div>
    <div class="muted">模糊与忘记的词已排入复习队列，会按间隔自动回来找你</div>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px">
      ${ratedWrong.length ? `<button class="btn btn--yellow" id="againWrong">🔁 再刷这 ${new Set(ratedWrong).size} 个错词</button>` : ""}
      <button class="btn btn--green" id="againGroup">↻ 再来一组</button>
      <button class="btn" id="backHome">← 回背单词首页</button>
    </div>
    <div class="muted" style="margin-top:12px">去 🌱 词根词缀库 看看这些词的家族，记得更牢</div>`;
  root.appendChild(card);
  if (good / Math.max(1, total) >= 0.8) confettiBurst();

  card.querySelector("#againWrong")?.addEventListener("click", () => {
    const words = [...new Set(ratedWrong)];
    root.innerHTML = "";
    session = createSession(words);
    ratedWrong = [];
    reveal = false;
    sessionLabel = "🔁 错词再刷";
    drawCard(root, state);
  });
  card.querySelector("#againGroup")!.addEventListener("click", () => nav("wordcard"));
  card.querySelector("#backHome")!.addEventListener("click", () => nav("wordcard"));
}

/** 供测试与外部使用：当前组大小 */
export function getGroupSize(): number {
  return groupSize;
}
export function setGroupSize(n: number): void {
  groupSize = n;
}
export { getGrammarUnits };
