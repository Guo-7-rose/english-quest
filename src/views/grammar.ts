import type { AppState } from "../types";
import { getGrammarUnits, getGrammarUnit } from "../data/grammar";
import { judgeGrammarAnswer, recordGrammarResult } from "../engine/grammar";
import { addXp } from "../engine/progress";
import { recordDailyGrammar } from "../engine/streak";
import { builtinVideos } from "../data/videos";
import { sCorrect, sWrong, sLevelUp } from "../fx/audio";
import { burstStars, confettiBurst, toast } from "../fx/fx";

export let grammarState: AppState;
export let grammarSave: () => void;

export function bindGrammar(state: AppState, save: () => void): void {
  grammarState = state;
  grammarSave = save;
}

export function renderGrammar(root: HTMLElement, state: AppState, unitId?: string): void {
  grammarState = state;
  root.innerHTML = "";
  if (unitId) renderUnit(root, state, unitId);
  else renderList(root, state);
}

function nav(arg?: string): void {
  window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "grammar", arg } }));
}

function renderList(root: HTMLElement, state: AppState): void {
  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `<h2>📖 语法训练（英语思维版）</h2>
    <div class="muted">每个单元六段结构：<b>英语思维开篇 → 规则 → 正误例句 → 常见错误 → 练习 → 配套视频</b>。全部单元自由进入，无解锁限制。</div>`;
  root.appendChild(head);

  for (const u of getGrammarUnits()) {
    const p = state.grammar[u.id];
    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer";
    card.innerHTML = `
      <div>
        <div style="font-weight:900;font-size:16px">📘 第 ${u.no} 单元 · ${u.title}</div>
        <div class="muted" style="margin-top:2px">${u.rules.length} 条规则 · ${u.questions.length} 道练习 · ${u.videos.length} 个视频</div>
      </div>
      <div style="text-align:right">
        ${p?.done ? `<div class="pill">上次得分 <span class="val">${p.score}</span></div>` : `<div class="pill">未练习</div>`}
        <button class="btn btn--green" style="margin-top:6px">${p?.done ? "再学一遍" : "开始"}</button>
      </div>`;
    card.addEventListener("click", () => nav(u.id));
    root.appendChild(card);
  }
}

function renderUnit(root: HTMLElement, state: AppState, unitId: string): void {
  const u = getGrammarUnit(unitId);
  if (!u) { nav(); return; }

  const back = document.createElement("div");
  back.className = "card";
  back.innerHTML = `<button class="btn" id="backBtn">← 返回单元列表</button>
    <h2 style="margin-top:10px">第 ${u.no} 单元 · ${u.title}</h2>`;
  root.appendChild(back);
  back.querySelector("#backBtn")!.addEventListener("click", () => nav());

  const think = document.createElement("div");
  think.className = "card";
  think.style.cssText = "background:#FFFBE6;border-color:#FFE08A";
  think.innerHTML = `<h2>🧠 英语思维：为什么英语这样说</h2><div style="line-height:1.8">${u.thinking}</div>`;
  root.appendChild(think);

  const rules = document.createElement("div");
  rules.className = "card";
  rules.innerHTML = `<h2>📐 规则</h2>` + u.rules.map(r => `
    <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px dashed #EEE">
      <code style="flex:0 0 auto;background:#EEF7FF;border-radius:8px;padding:2px 8px;font-weight:800;color:#1899D6">${r.formula}</code>
      <div style="font-size:14px">${r.desc}</div>
    </div>`).join("");
  root.appendChild(rules);

  const ex = document.createElement("div");
  ex.className = "card";
  ex.innerHTML = `<h2>🔍 例句对照</h2>` + u.examples.map(e => `
    <div style="padding:6px 0;border-bottom:1px dashed #EEE">
      <div>${e.ok ? "✅" : "❌"} <b style="color:${e.ok ? "var(--green)" : "var(--red)"}">${e.en}</b></div>
      <div class="muted">${e.zh}</div>
    </div>`).join("");
  root.appendChild(ex);

  const mis = document.createElement("div");
  mis.className = "card";
  mis.innerHTML = `<h2>⚠️ 中国学习者常见错误</h2>` + u.mistakes.map(m => `<div style="padding:4px 0">· ${m}</div>`).join("");
  root.appendChild(mis);

  const quiz = document.createElement("div");
  quiz.className = "card";
  quiz.innerHTML = `<h2>✏️ 练习（${u.questions.length} 题）</h2><div id="quizBody"></div>`;
  root.appendChild(quiz);
  const body = quiz.querySelector("#quizBody") as HTMLElement;
  let idx = 0;
  let correct = 0;

  const renderQ = () => {
    const q = u.questions[idx]!;
    body.innerHTML = `<div style="font-weight:900;margin:10px 0 8px">Q${idx + 1} / ${u.questions.length}　${q.q}</div>
      <div style="display:flex;flex-direction:column;gap:8px;max-width:480px">
        ${q.options.map((o, i) => `<button class="btn quiz-option" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")}
      </div>
      <div id="explain" class="muted" style="margin-top:10px"></div>`;
    body.querySelectorAll(".quiz-option").forEach(b => b.addEventListener("click", () => {
      const choice = Number(b.getAttribute("data-i"));
      const ok = judgeGrammarAnswer(u, idx, choice);
      b.classList.add(ok ? "ok" : "bad");
      if (ok) { correct++; sCorrect(); burstStars(quiz); addXp(grammarState, 5); }
      else { sWrong(); body.querySelector(`[data-i="${q.answer}"]`)!.classList.add("ok"); }
      (body.querySelector("#explain") as HTMLElement).textContent = (ok ? "✅ 正确！" : "❌ 再看解析：") + q.explain;
      body.querySelectorAll(".quiz-option").forEach(x => ((x as HTMLButtonElement).disabled = true));
      grammarSave();
      const next = document.createElement("button");
      next.className = "btn btn--blue";
      next.style.marginTop = "10px";
      next.textContent = idx + 1 < u.questions.length ? "下一题 →" : "查看结果";
      next.addEventListener("click", () => {
        idx++;
        if (idx < u.questions.length) renderQ();
        else renderDone();
      });
      body.appendChild(next);
    }));
  };

  const renderDone = () => {
    const score = Math.round((correct / u.questions.length) * 100);
    recordGrammarResult(grammarState, u.id, score);
    const checkedIn = score >= 80 ? recordDailyGrammar(grammarState) : false;
    grammarSave();
    body.innerHTML = `<div style="text-align:center;padding:16px">
      <div style="font-size:38px">${score >= 80 ? "🎉" : "💪"}</div>
      <b>答对 ${correct}/${u.questions.length} · 得分 ${score}</b>
      <div class="muted" style="margin-top:6px">${score >= 80 ? "已达标，计入每日目标" : "建议再练一遍巩固"}</div>
      <button class="btn btn--green" id="againBtn" style="margin-top:12px">🔁 再练一遍</button>
    </div>`;
    if (score >= 80) { confettiBurst(); sLevelUp(); }
    if (checkedIn) toast("🔥 打卡成功！连续 " + grammarState.profile.streak + " 天");
    body.querySelector("#againBtn")!.addEventListener("click", () => renderUnit(root, state, unitId));
  };
  renderQ();

  const vids = document.createElement("div");
  vids.className = "card";
  const all = builtinVideos();
  vids.innerHTML = `<h2>🎬 配套视频</h2>` + u.videos.map(id => {
    const v = all.find(x => x.id === id);
    return `<div style="margin-bottom:12px">
        <div style="font-weight:800">${v?.title ?? id}</div>
        ${v?.note ? `<div class="muted">💡 ${v.note}</div>` : ""}
        <button class="btn btn--blue" data-play="${id}" style="margin-top:6px">▶ 播放</button>
        <div data-slot="${id}"></div>
      </div>`;
  }).join("") + `<div class="muted">视频需联网播放；也可到「🎬 视频课」板块浏览全部视频。</div>`;
  root.appendChild(vids);
  vids.querySelectorAll("[data-play]").forEach(b => b.addEventListener("click", () => {
    const id = b.getAttribute("data-play")!;
    const slot = vids.querySelector(`[data-slot="${id}"]`) as HTMLElement;
    slot.innerHTML = `<div style="position:relative;padding-top:56.25%;margin-top:10px;border-radius:14px;overflow:hidden;background:#000">
      <iframe src="https://www.youtube.com/embed/${id}" title="video" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe></div>`;
  }));
}
