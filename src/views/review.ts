import type { AppState } from "../types";
import { dueWords, markRemembered, markNeedReview } from "../engine/reviewQueue";
import { buildQuestions, judge, type QuestionKind, type SelfTestQuestion } from "../engine/selfTest";
import { bankWords } from "../data/wordbank";
import { addXp } from "../engine/progress";
import { recordDailyWord, grantFreezeIfDue } from "../engine/streak";
import { checkAchievements } from "../data/achievements";
import { ACHIEVEMENTS } from "../data/achievements";
import { wordInfo } from "../data/words";
import { sCorrect, sWrong, sLevelUp } from "../fx/audio";
import { burstStars, confettiBurst, toast } from "../fx/fx";

export let reviewState: AppState;
export let reviewSave: () => void;

export function bindReview(state: AppState, save: () => void): void {
  reviewState = state;
  reviewSave = save;
}

const ROUND_KINDS: QuestionKind[] = ["word2meaning", "meaning2word", "pickBreakdown", "rootMeaning"];

export function renderReview(root: HTMLElement, state: AppState): void {
  reviewState = state;
  grantFreezeIfDue(state);
  root.innerHTML = "";

  const due = dueWords(state);
  const learned = Object.keys(state.wordStats).filter(w => state.wordStats[w]!.correct > 0);

  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `<h2>🔁 复习</h2>
    <div class="muted">用选择题复习，不用打字。错题会按 FSRS 间隔（1 → 3 → 7 → 15 天…）自动回来找你。</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
      <div class="pill fire">到期复习 <span class="val">${due.length}</span> 词</div>
      <div class="pill">已掌握 <span class="val">${learned.length}</span> 词</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
      <button class="btn btn--green" id="startDue" ${due.length === 0 ? "disabled" : ""}>🚀 开始复习这 ${due.length} 词</button>
      <button class="btn btn--blue" id="startDaily">🎲 随机自测（日常词汇 10 题）</button>
      <button class="btn" id="startLearned" ${learned.length < 4 ? "disabled" : ""}>📚 自测已学过的词</button>
    </div>`;
  root.appendChild(head);

  const stage = document.createElement("div");
  stage.id = "reviewStage";
  root.appendChild(stage);

  head.querySelector("#startDue")!.addEventListener("click", () => startRound(stage, due, state));
  head.querySelector("#startDaily")!.addEventListener("click", () => {
    const words = bankWords("daily");
    startRound(stage, pickRandom(words, 12), state);
  });
  head.querySelector("#startLearned")!.addEventListener("click", () => {
    startRound(stage, pickRandom(learned, 12), state);
  });

  if (due.length === 0) {
    stage.innerHTML = `<div class="card"><div class="muted">当前没有到期复习词 —— 可以先去「单词板块」或「词根词缀库」标记学习，或者点上面的随机自测练手。</div></div>`;
  }
}

function pickRandom(arr: string[], n: number): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!; a[i] = a[j]!; a[j] = t;
  }
  return a.slice(0, n);
}

function startRound(stage: HTMLElement, words: string[], state: AppState): void {
  const questions: SelfTestQuestion[] = buildQuestions(words, ROUND_KINDS, Math.min(12, Math.max(4, words.length)));
  if (questions.length === 0) {
    stage.innerHTML = `<div class="card"><div class="muted">词库不足，无法出题。</div></div>`;
    return;
  }
  let idx = 0;
  let correct = 0;

  const draw = () => {
    const q = questions[idx]!;
    stage.innerHTML = `<div class="card">
      <div class="muted">第 ${idx + 1} / ${questions.length} 题 · ${KIND_LABEL[q.kind]}</div>
      <div style="font-weight:900;font-size:18px;margin:10px 0 12px">${q.prompt}</div>
      <div id="opts" style="display:flex;flex-direction:column;gap:8px;max-width:520px">
        ${q.options.map((o, i) => `<button class="btn quiz-option" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")}
      </div>
      <div id="fb" class="muted" style="margin-top:12px"></div>
    </div>`;

    stage.querySelectorAll(".quiz-option").forEach(b => b.addEventListener("click", () => {
      const choice = Number(b.getAttribute("data-i"));
      const ok = judge(q, choice);
      b.classList.add(ok ? "ok" : "bad");
      const info = wordInfo(q.wordId);
      if (ok) {
        correct++;
        sCorrect();
        burstStars(stage);
        markRemembered(state, q.wordId);
        addXp(state, 5);
        recordDailyWord(state);
        const unlocked = checkAchievements(state);
        for (const id of unlocked) toast("🏅 新成就：" + ACHIEVEMENTS[id]!.name);
      } else {
        sWrong();
        stage.querySelector(`[data-i="${q.answer}"]`)!.classList.add("ok");
        markNeedReview(state, q.wordId);
      }
      reviewSave();
      const fb = stage.querySelector("#fb") as HTMLElement;
      fb.innerHTML = `${ok ? "✅ 正确" : "❌ 正确答案已标出"} · ${q.explain}${info ? `<div class="muted" style="margin-top:4px">${info.phonetic}</div>` : ""}`;
      stage.querySelectorAll(".quiz-option").forEach(x => ((x as HTMLButtonElement).disabled = true));
      const next = document.createElement("button");
      next.className = "btn btn--blue";
      next.style.marginTop = "12px";
      next.textContent = idx + 1 < questions.length ? "下一题 →" : "查看结果";
      next.addEventListener("click", () => {
        idx++;
        if (idx < questions.length) draw();
        else finish();
      });
      stage.appendChild(next);
    }));
  };

  const finish = () => {
    const score = Math.round((correct / questions.length) * 100);
    stage.innerHTML = `<div class="card" style="text-align:center">
      <div style="font-size:38px">${score >= 80 ? "🎉" : "💪"}</div>
      <b>答对 ${correct}/${questions.length} · 正确率 ${score}%</b>
      <div class="muted" style="margin-top:6px">错题已进入复习队列，会按间隔自动重现</div>
      <div style="margin-top:12px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn--green" id="againBtn">🔁 再来一轮</button>
        <button class="btn" id="rootsBtn">🌱 去逛词根家族</button>
      </div>
    </div>`;
    if (score >= 80) { confettiBurst(); sLevelUp(); }
    stage.querySelector("#againBtn")!.addEventListener("click", () => startRound(stage, pickRandom(bankWords("daily"), 12), state));
    stage.querySelector("#rootsBtn")!.addEventListener("click", () =>
      window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "roots" } })));
  };

  draw();
}

const KIND_LABEL: Record<QuestionKind, string> = {
  word2meaning: "看词选义",
  meaning2word: "看义选词",
  pickBreakdown: "选正确拆解",
  rootMeaning: "选词根含义",
};
