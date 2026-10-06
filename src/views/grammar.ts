import type { AppState } from "../types";
import { getGrammarStage, ALL_GRAMMAR } from "../data/grammar";
import { judgeGrammar, recordGrammarAnswer, finishGrammarUnit } from "../engine/grammar";
import { addXp } from "../engine/progress";
import { recordDailyGrammar } from "../engine/streak";
import { sCorrect, sWrong, sLevelUp } from "../fx/audio";
import { burstStars, confettiBurst, toast } from "../fx/fx";

export let grammarState: AppState;
export let grammarSave: () => void;

export function bindGrammar(state: AppState, save: () => void): void {
  grammarState = state;
  grammarSave = save;
}

export function renderGrammar(root: HTMLElement, state: AppState, unitId?: string): void {
  root.innerHTML = "";
  const units = getGrammarStage(1);
  if (!unitId) {
    const cont = document.createElement("div");
    cont.innerHTML = `<div class="card"><h2>📖 语法训练 · 阶段一</h2><div class="muted">先学知识卡，再做题闯关（答对 +5 XP）</div></div>`;
    units.forEach((u, i) => {
      const p = state.grammar[u.id];
      const unlocked = i === 0 || !!state.grammar[units[i - 1]!.id]?.done;
      const row = document.createElement("div");
      row.className = "card";
      row.style.cssText = "display:flex;justify-content:space-between;align-items:center;";
      row.innerHTML = `<div><b>${unlocked ? "📘" : "🔒"} ${u.title}</b>${p?.done ? ` <span class="muted">得分 ${p.score}</span>` : ""}</div>
        <button class="btn ${p?.done ? "" : "btn--green"}" ${unlocked ? "" : "disabled"}>${p?.done ? "再练一次" : "开始"}</button>`;
      row.querySelector("button")!.addEventListener("click", () => renderGrammar(root, state, u.id));
      cont.appendChild(row);
    });
    root.appendChild(cont);
    return;
  }
  renderUnit(root, state, unitId);
}

function renderUnit(root: HTMLElement, state: AppState, unitId: string): void {
  const unit = ALL_GRAMMAR.find(u => u.id === unitId)!;
  const p = state.grammar[unitId] ?? { done: false, score: 0, answers: [] };
  state.grammar[unitId] = p;
  root.innerHTML = "";
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>📖 ${unit.title}</h2>
    <div class="knowledge">📚 <b>知识卡片：</b>${unit.knowledge}</div>
    <div id="quiz"></div>`;
  root.appendChild(card);

  const quiz = card.querySelector("#quiz")!;
  let idx = 0;
  const renderQ = () => {
    const q = unit.questions[idx]!;
    quiz.innerHTML = `<div style="font-weight:900;margin:12px 0 8px">Q${idx + 1} / ${unit.questions.length}　${q.q}</div>
      <div style="display:flex;flex-direction:column;gap:8px;max-width:460px">${
        q.options.map((o, i) => `<button class="btn quiz-option" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")
      }</div>`;
    quiz.querySelectorAll(".quiz-option").forEach(b => b.addEventListener("click", () => {
      const choice = Number(b.getAttribute("data-i"));
      const ok = judgeGrammar(unit, idx, choice);
      recordGrammarAnswer(state, unitId, idx, choice);
      b.classList.add(ok ? "ok" : "bad");
      if (ok) {
        sCorrect();
        burstStars(card);
        addXp(state, 5);
      } else {
        sWrong();
        quiz.querySelector(`[data-i="${unit.questions[idx]!.answer}"]`)!.classList.add("ok");
      }
      grammarSave();
      setTimeout(() => { idx++; idx < unit.questions.length ? renderQ() : renderDone(); }, 900);
    }));
  };
  const renderDone = () => {
    finishGrammarUnit(state, unitId, unit);
    const doneP = state.grammar[unitId]!;
    quiz.innerHTML = `<div style="text-align:center;padding:16px">
      <div style="font-size:36px">${doneP.score >= 80 ? "🎉" : "💪"}</div>
      <b>单元完成！得分 ${doneP.score}</b>
      <div class="muted" style="margin-top:6px">${doneP.score >= 80 ? "已达标，计入每日目标" : "建议再练一次巩固"}</div>
      <button class="btn btn--green" id="againBtn" style="margin-top:12px">🔁 再来一次</button>
    </div>`;
    if (doneP.score >= 80) {
      const newly = recordDailyGrammar(state);
      grammarSave();
      if (newly) { confettiBurst(); sLevelUp(); toast("🔥 打卡成功！连续 " + state.profile.streak + " 天"); }
    } else {
      grammarSave();
    }
    quiz.querySelector("#againBtn")!.addEventListener("click", () => renderUnit(root, state, unitId));
  };
  renderQ();
}
