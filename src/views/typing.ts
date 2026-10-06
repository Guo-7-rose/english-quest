import type { AppState, Word } from "../types";
import { getChapter } from "../data/words";
import { createSession, type TypingSession } from "../engine/typing";
import { buildDailySession } from "../engine/daily";
import { scheduleReview } from "../engine/review";
import { addXp, xpForWord, completeChapter } from "../engine/progress";
import { recordDailyWord } from "../engine/streak";
import { checkAchievements } from "../data/achievements";
import { sCorrect, sWrong, sKey, sLevelUp, speakWord } from "../fx/audio";
import { burstStars, confettiBurst, shakeEl, popEl, toast } from "../fx/fx";
import { ACHIEVEMENTS } from "../data/achievements";

let session: TypingSession | null = null;
let mode: "follow" | "dictation" | "listening" = "dictation";
let chapterId: string | null = null;
let wordTags: ("new" | "review")[] = [];

export let currentState: AppState;
export let saveCurrent: () => void;
export let refreshTopbar: () => void;

export function bindTyping(state: AppState, save: () => void, refresh: () => void): void {
  currentState = state;
  saveCurrent = save;
  refreshTopbar = refresh;
}

export function setTypingMode(m: typeof mode): void { mode = m; }

export function renderTypingView(root: HTMLElement, state: AppState, chId: string): void {
  const ch = getChapter(chId) ?? null;
  chapterId = ch ? ch.id : null;
  root.innerHTML = "";
  if (!ch) {
    root.innerHTML = `<div class="card"><h2>章节不存在</h2><div class="muted">请先在地图选择章节</div></div>`;
    return;
  }
  {
    const daily = buildDailySession(state, ch.id);
    wordTags = daily.tags;
    session = createSession(daily.words);
  }
  session.stats.combo = 0;

  const stage = document.createElement("div");
  stage.className = "word-stage";
  stage.id = "wordStage";
  stage.innerHTML = `
    <div class="combo-badge" id="comboBadge">🔥 连击 x0</div>
    <div class="hint-zh" id="hintZh"></div>
    <div class="hint-ph" id="hintPh"></div>
    <div class="letters" id="letters"></div>
    <div class="progress-dots" id="dots"></div>
    <div class="live-stats">
      <div>⏱ <span class="num" id="statTime">00:00</span></div>
      <div>⌨️ 已打 <span class="num" id="statCount">0</span> 词</div>
      <div>🚀 WPM <span class="num" id="statWpm">0</span></div>
      <div>🎯 正确率 <span class="num" id="statAcc">100%</span></div>
    </div>
    <div class="muted" style="margin-top:12px">
      <button class="btn btn--ghost" id="modeBtn"></button>
      <span id="tip"> · 回车确认 · Esc 跳过</span>
    </div>`;
  root.appendChild(stage);
  const summary = document.createElement("div");
  summary.id = "chapterSummary";
  root.appendChild(summary);

  document.getElementById("modeBtn")!.addEventListener("click", cycleMode);
  refreshModeBtn();
  renderWord();
  startTicker();
}

function cycleMode(): void {
  mode = mode === "dictation" ? "listening" : mode === "listening" ? "follow" : "dictation";
  refreshModeBtn();
  renderWord();
  toast(mode === "follow" ? "跟打模式：照着单词打" : mode === "listening" ? "听写模式：听发音盲打" : "默写模式：看释义盲打");
}

function refreshModeBtn(): void {
  const btn = document.getElementById("modeBtn");
  if (btn) btn.textContent = "🎮 模式：" + (mode === "follow" ? "跟打" : mode === "listening" ? "听写" : "默写") + "（点击切换）";
}

function renderWord(): void {
  if (!session || session.done) { renderSummary(); return; }
  const word = session.current!;
  const showMeaning = currentState.settings.showMeaning;
  document.getElementById("hintZh")!.textContent =
    mode === "follow" ? word.word
      : mode === "listening" ? (showMeaning ? "🔊 听音猜词（" + word.meaning.join("；") + "）" : "🔊 听音猜词")
      : showMeaning ? word.meaning.join("；") : "（释义已隐藏）";
  document.getElementById("hintPh")!.textContent =
    mode === "follow" ? word.phonetic : word.phonetic + "  （" + word.word.length + " 个字母）";
  const letters = document.getElementById("letters")!;
  letters.innerHTML = "";
  [...word.word].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = mode === "follow" ? ch : "•";
    s.id = "ch" + i;
    letters.appendChild(s);
  });
  if (mode === "listening") speakWord(word.word);
  renderDots();
  updateLetters();
}

function updateLetters(): void {
  if (!session || !session.current) return;
  const s = session;
  const word = session.current.word;
  [...word].forEach((_, i) => {
    const el = document.getElementById("ch" + i);
    if (!el) return;
    el.classList.remove("typed-ok", "typed-bad", "caret");
    if (i < s.typed.length) el.classList.add(s.typed[i] === word[i] ? "typed-ok" : "typed-bad");
    else if (i === s.typed.length) el.classList.add("caret");
  });
}

function renderDots(): void {
  if (!session) return;
  const s = session;
  const dots = document.getElementById("dots")!;
  dots.innerHTML = "";
  session.words.forEach((_, i) => {
    const d = document.createElement("div");
    const r = s.wordResult[i];
    d.className = "dot" + (r === true ? " on" : r === false ? " err" : "");
    dots.appendChild(d);
  });
}

function handleKey(e: KeyboardEvent): void {
  const view = document.getElementById("view-typing");
  if (!view || view.style.display === "none" || !session || session.done) return;
  if (e.key === "Escape") { session.skip(); renderWord(); return; }
  if (e.key === "Enter") { onEnter(); return; }
  if (/^[a-zA-Z]$/.test(e.key)) { session.input(e.key); sKey(); updateLetters(); }
}

function onEnter(): void {
  if (!session || session.done) return;
  const r = session.submit();
  const answeredIdx = session.index - 1;
  const stage = document.getElementById("wordStage")!;
  if (r.ok) {
    sCorrect();
    burstStars(stage);
    // 复习词答对 → 按 FSRS 良好评分调度
    if (wordTags[answeredIdx] === "review") scheduleReview(currentState, r.word.id, 3);
    const xp = xpForWord(session.stats.combo);
    const leveled = addXp(currentState, xp);
    currentState.profile.maxCombo = Math.max(currentState.profile.maxCombo, session.stats.maxCombo);
    const checkedIn = recordDailyWord(currentState);
    const newAch = checkAchievements(currentState);
    saveCurrent();
    refreshTopbar();
    if (leveled) { sLevelUp(); confettiBurst(); toast("🆙 升级！Lv." + currentState.profile.level); }
    if (checkedIn) { confettiBurst(); sLevelUp(); toast("🔥 打卡成功！连续 " + currentState.profile.streak + " 天"); }
    newAch.forEach(id => toast("🏅 新成就：" + ACHIEVEMENTS[id]!.name));
    const badge = document.getElementById("comboBadge")!;
    badge.textContent = session.stats.combo >= 3 ? "🔥 连击 x" + session.stats.combo : "连击 x" + session.stats.combo;
    badge.classList.toggle("hot", session.stats.combo >= 3);
    popEl(badge);
    if ([5, 10, 20, 50].includes(session.stats.combo)) { confettiBurst(); sLevelUp(); toast("🎊 " + session.stats.combo + " 连击！里程碑达成"); }
    updateLiveStats();
    renderWord();
  } else if (r.revealed) {
    sWrong();
    shakeEl(stage);
    toast("💡 答案是：" + r.word.word + "，已加入复习队列");
    queueForReview(r.word);
    updateLiveStats();
    renderWord();
  } else {
    sWrong();
    shakeEl(stage);
    toast("❌ 不对哦，再试一次！");
    updateLiveStats();
  }
}

function queueForReview(word: Word): void {
  scheduleReview(currentState, word.id, 1);   // Again 评分，进入 FSRS 学习队列
  currentState.mistakes.push({ word: word.id, wrongAnswer: "", ts: Date.now() });
  saveCurrent();
}

function updateLiveStats(): void {
  if (!session) return;
  document.getElementById("statCount")!.textContent = String(session.stats.total);
  document.getElementById("statAcc")!.textContent = session.accuracy() + "%";
}

let tickerTimer: number | undefined;
function startTicker(): void {
  window.clearTimeout(tickerTimer);
  const tick = () => {
    if (!session || session.done) return;
    const view = document.getElementById("view-typing");
    const timeEl = document.getElementById("statTime");
    const wpmEl = document.getElementById("statWpm");
    if (!view || view.style.display === "none" || !timeEl || !wpmEl) return;  // 视图已销毁/隐藏，停止
    const sec = session.elapsed();
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(Math.floor(sec % 60)).padStart(2, "0");
    timeEl.textContent = m + ":" + s;
    wpmEl.textContent = String(session.wpm());
    tickerTimer = window.setTimeout(tick, 500);
  };
  tick();
}

function renderSummary(): void {
  if (!session || !chapterId) return;
  const acc = session.accuracy();
  const wpm = session.wpm();
  const stars = acc >= 95 ? 3 : acc >= 80 ? 2 : acc >= 60 ? 1 : 0;
  currentState.profile.totalMinutes += Math.round(session.elapsed() / 60);
  completeChapter(currentState, chapterId, acc, wpm);
  saveCurrent();
  refreshTopbar();
  const box = document.getElementById("chapterSummary")!;
  box.innerHTML = `
    <div class="card" style="text-align:center">
      <h2>🎉 本章完成！</h2>
      <div style="font-size:40px">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>
      <div class="muted">正确率 ${acc}% · WPM ${wpm} · 最高连击 x${session.stats.maxCombo}</div>
      <div style="margin-top:12px;display:flex;gap:10px;justify-content:center">
        <button class="btn btn--green" id="retryBtn">🔁 再练一次</button>
        <button class="btn btn--blue" id="nextBtn">▶️ 下一章</button>
      </div>
    </div>`;
  document.getElementById("retryBtn")!.addEventListener("click", () =>
    renderTypingView(document.getElementById("view-typing")!, currentState, chapterId!));
  document.getElementById("nextBtn")!.addEventListener("click", () => {
    const parts = chapterId!.split("-").map(Number) as [number, number];
    const nid = `${parts[0]}-${parts[1] + 1}`;
    if (getChapter(nid)) renderTypingView(document.getElementById("view-typing")!, currentState, nid);
    else { toast("已是本阶段最后一章！"); window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "map" } })); }
  });
  confettiBurst();
}

export function attachTypingKeys(): void { document.addEventListener("keydown", handleKey); }
