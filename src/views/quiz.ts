import type { AppState, StageId } from "../types";
import { buildStageQuiz, evaluateStageQuiz } from "../engine/quiz";
import { sCorrect, sWrong, sLevelUp } from "../fx/audio";
import { burstStars, confettiBurst, toast } from "../fx/fx";

export let quizState: AppState;
export let quizSave: () => void;

export function bindQuiz(state: AppState, save: () => void): void {
  quizState = state;
  quizSave = save;
}

export function renderQuiz(root: HTMLElement, state: AppState, stage: StageId): void {
  const quiz = buildStageQuiz(state, stage);
  const seq: Array<{ type: "word"; prompt: string; answer: string } | { type: "grammar"; q: { q: string; options: string[]; answer: number } }> = [
    ...quiz.wordQs.map(w => ({ type: "word" as const, prompt: w.prompt, answer: w.answer })),
    ...quiz.grammarQs.map(g => ({ type: "grammar" as const, q: g })),
  ];
  let idx = 0;
  let correct = 0;
  root.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";
  root.appendChild(card);
  card.innerHTML = `<h2>🎓 阶段 ${stage} 测验</h2>
    <div class="muted">共 ${seq.length} 题（拼写/词形 ${quiz.wordQs.length} + 语法 ${quiz.grammarQs.length}）· 80% 通过进入下一阶段</div>
    <div id="quizBody" style="margin-top:14px"></div>`;
  const body = card.querySelector("#quizBody")!;

  const renderQ = () => {
    const item = seq[idx]!;
    body.innerHTML = "";
    if (item.type === "word") {
      body.innerHTML = `
        <div style="font-weight:900;font-size:18px;margin-bottom:10px">Q${idx + 1}. ${item.prompt}</div>
        <div style="display:flex;gap:8px;max-width:420px">
          <input id="quizInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
            style="flex:1;font-size:18px;padding:10px 12px;border:2px solid #E5E5E5;border-radius:12px;font-family:inherit" />
          <button class="btn btn--green" id="quizSubmit">提交</button>
        </div>`;
      const input = body.querySelector("#quizInput") as HTMLInputElement;
      input.focus();
      const submit = () => {
        const val = input.value.trim().toLowerCase();
        if (!val) return;
        if (val === item.answer.toLowerCase()) { correct++; sCorrect(); burstStars(card); }
        else { sWrong(); toast("❌ 正确答案：" + item.answer); }
        advance();
      };
      body.querySelector("#quizSubmit")!.addEventListener("click", submit);
      input.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
    } else {
      const q = item.q;
      body.innerHTML = `<div style="font-weight:900;font-size:18px;margin-bottom:10px">Q${idx + 1}. ${q.q}</div>
        <div style="display:flex;flex-direction:column;gap:8px;max-width:460px">${
          q.options.map((o, i) => `<button class="btn quiz-option" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")
        }</div>`;
      body.querySelectorAll(".quiz-option").forEach(b => b.addEventListener("click", () => {
        const choice = Number(b.getAttribute("data-i"));
        b.classList.add(choice === q.answer ? "ok" : "bad");
        if (choice === q.answer) { correct++; sCorrect(); burstStars(card); }
        else { sWrong(); body.querySelector(`[data-i="${q.answer}"]`)!.classList.add("ok"); }
        setTimeout(advance, 800);
      }));
    }
  };

  const advance = () => {
    idx++;
    if (idx < seq.length) renderQ();
    else renderDone();
  };

  const renderDone = () => {
    const score = Math.round((correct / seq.length) * 100);
    const r = evaluateStageQuiz(state, stage, { score });
    quizSave();
    body.innerHTML = `<div style="text-align:center;padding:16px">
      <div style="font-size:40px">${r.passed ? "🎉" : "💪"}</div>
      <b>答对 ${correct}/${seq.length} · 得分 ${score}</b>
      <div class="muted" style="margin-top:6px">${r.passed ? "通过！下一阶段已解锁 🗝️" : "需 80 分通过，再试一次！"}</div>
      <div style="margin-top:12px;display:flex;gap:10px;justify-content:center">
        <button class="btn btn--green" id="retryQuiz">🔁 重测</button>
        <button class="btn btn--blue" id="backMap">🗺️ 回地图</button>
      </div>
    </div>`;
    if (r.passed) { confettiBurst(); sLevelUp(); }
    body.querySelector("#retryQuiz")!.addEventListener("click", () => renderQuiz(root, state, stage));
    body.querySelector("#backMap")!.addEventListener("click", () =>
      window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "map" } })));
  };

  renderQ();
}
