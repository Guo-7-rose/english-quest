import type { AppState } from "../types";
import { ACHIEVEMENTS } from "../data/achievements";
import { heatmapDays } from "../engine/streak";
import { learnedCount } from "../engine/reviewQueue";
import { allFamilies } from "../data/roots";
import { bankWords } from "../data/wordbank";
import { getGrammarUnits } from "../data/grammar";
import { toast } from "../fx/fx";

export function renderStats(root: HTMLElement, state: AppState): void {
  root.innerHTML = "";
  const learned = learnedCount(state);
  const totalBank = new Set([...bankWords("daily"), ...bankWords("zk"), ...bankWords("gk"), ...bankWords("cet4")]).size;
  const grammarDone = Object.values(state.grammar).filter(g => g.done).length;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>📊 数据中心</h2>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <div class="pill">✅ 已学 <span class="val">${learned}</span> 词</div>
      <div class="pill">📚 词库总量 <span class="val">${totalBank}</span> 词</div>
      <div class="pill">🌱 词根家族 <span class="val">${allFamilies().length}</span> 个</div>
      <div class="pill">📖 语法单元 <span class="val">${grammarDone}/${getGrammarUnits().length}</span></div>
      <div class="pill fire">🔥 连续打卡 <span class="val">${state.profile.streak}</span> 天</div>
      <div class="pill">🏅 成就 <span class="val">${Object.keys(state.achievements).length}/${Object.keys(ACHIEVEMENTS).length}</span></div>
    </div>`;
  root.appendChild(card);

  const heat = document.createElement("div");
  heat.className = "card";
  heat.innerHTML = `<h2>📅 打卡日历</h2><div class="heatmap" id="hm"></div>`;
  root.appendChild(heat);
  const hm = heat.querySelector("#hm")!;
  heatmapDays(state).forEach(d => {
    const el = document.createElement("div");
    el.className = "day" + (d.checked ? " lv3" : d.isFuture ? "" : " lv1");
    el.title = d.date;
    hm.appendChild(el);
  });

  const wall = document.createElement("div");
  wall.className = "card";
  wall.innerHTML = `<h2>🏅 成就墙</h2><div class="badge-wall"></div>`;
  root.appendChild(wall);
  const bw = wall.querySelector(".badge-wall")!;
  Object.entries(ACHIEVEMENTS).forEach(([id, a]) => {
    const got = !!state.achievements[id];
    const b = document.createElement("div");
    b.className = "badge" + (got ? "" : " locked");
    b.innerHTML = `<div class="icon">${a.icon}</div><b>${a.name}</b><div class="muted">${a.desc}</div>`;
    bw.appendChild(b);
  });

  const mb = document.createElement("div");
  mb.className = "card";
  mb.innerHTML = `<h2>📕 错题本</h2><div class="muted">共 ${state.mistakes.length} 条</div>
    <div id="mistakeList" style="margin-top:10px"></div>
    <button class="btn btn--red" id="clearMistakes" style="margin-top:10px">🗑️ 清空错题本</button>`;
  root.appendChild(mb);
  const list = mb.querySelector("#mistakeList")!;
  list.innerHTML = state.mistakes.slice(-50).reverse().map(m =>
    `<div class="pill" style="margin:4px">${m.word} <span class="muted">${new Date(m.ts).toLocaleDateString()}</span></div>`).join("") || `<div class="muted">暂无错题</div>`;
  mb.querySelector("#clearMistakes")!.addEventListener("click", () => {
    state.mistakes = [];
    renderStats(root, state);
    toast("错题本已清空");
  });
}
