import type { AppState } from "../types";
import { getStage } from "../data/words";
import { toast } from "../fx/fx";

const STAGE_META = [
  { id: 1, color: "🟢", name: "阶段一 · 基础", desc: "小初核心词 + 语法入门" },
  { id: 2, color: "🟡", name: "阶段二 · 进阶", desc: "高中 3500 + 语法进阶" },
  { id: 3, color: "🔵", name: "阶段三 · 高手", desc: "四级词汇 + 语法高级" },
  { id: 4, color: "🟣", name: "阶段四 · 大师", desc: "雅思/托福 + 长难句" },
];

export function renderMap(root: HTMLElement, state: AppState): void {
  root.innerHTML = "";
  const cont = document.createElement("div");
  STAGE_META.forEach((meta) => {
    const chs = getStage(meta.id as 1 | 2 | 3 | 4);
    if (chs.length === 0) return;
    const card = document.createElement("div");
    card.className = "card stage";
    card.innerHTML = `<div class="rail"></div>
      <div class="title">${meta.color} ${meta.name} <span class="muted">${meta.desc}</span></div>
      <div class="nodes"></div>`;
    const nodes = card.querySelector(".nodes")!;
    chs.forEach((ch, i) => {
      const p = state.stageProgress[meta.id as 1 | 2 | 3 | 4][ch.id];
      const isOpen = i === 0 || (p && p.state !== "locked");
      const node = document.createElement("div");
      node.className = "node" + (p?.state === "done" ? " done" : !isOpen ? " locked" : "");
      node.innerHTML = `<div class="bubble">${!isOpen ? "🔒" : p?.state === "done" ? "⭐" : "▶"}</div>
        <div class="stars">${p ? "★".repeat(p.stars) + "☆".repeat(3 - p.stars) : ""}</div>
        <div class="label">第${ch.no}关</div>`;
      node.addEventListener("click", () => {
        if (!isOpen) { toast("🔒 该关卡还未解锁，先通关前面的吧！"); return; }
        window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "typing", chapterId: ch.id } }));
      });
      nodes.appendChild(node);
    });
    cont.appendChild(card);
  });
  root.appendChild(cont);
}
