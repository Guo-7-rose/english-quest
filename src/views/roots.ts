import type { AppState, RootFamily, RootWordRef } from "../types";
import { allFamilies, familiesByType, getFamily, familyBankWords } from "../data/roots";
import { buildMnemonic, type MnemonicLayer } from "../engine/mnemonic";
import { markRemembered, markNeedReview } from "../engine/reviewQueue";
import { sCorrect } from "../fx/audio";
import { burstStars, toast } from "../fx/fx";

export let rootsState: AppState;
export let rootsSave: () => void | undefined;

export function bindRoots(state: AppState, save: () => void): void {
  rootsState = state;
  rootsSave = save;
}

const TYPE_LABEL: Record<RootFamily["type"], string> = { root: "词根", prefix: "前缀", suffix: "后缀" };
const TYPE_COLOR: Record<RootFamily["type"], string> = { root: "#1CB0F6", prefix: "#58CC02", suffix: "#CE82FF" };
const LAYER_LABEL: Record<MnemonicLayer, string> = { etymology: "词源", construction: "构词", mnemonic: "助记" };
const LAYER_COLOR: Record<MnemonicLayer, string> = { etymology: "#1CB0F6", construction: "#58CC02", mnemonic: "#FF9600" };

function layerBadge(layer: MnemonicLayer): string {
  return `<span style="display:inline-block;font-size:11px;font-weight:900;color:#fff;background:${LAYER_COLOR[layer]};border-radius:8px;padding:1px 7px;margin-right:6px;">${LAYER_LABEL[layer]}</span>`;
}

export function renderRoots(root: HTMLElement, state: AppState, familyKey?: string): void {
  rootsState = state;
  root.innerHTML = "";
  if (familyKey) renderFamily(root, state, familyKey);
  else renderOverview(root, state);
}

function renderOverview(root: HTMLElement, state: AppState): void {
  const fams = allFamilies();
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>🌱 词根词缀库</h2>
    <div class="muted">共 <b>${fams.length}</b> 个词根/前缀/后缀家族，全部可自由浏览（来自 ECDICT 词源库 · MIT）</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center">
      <button class="btn on" data-type="all">全部</button>
      <button class="btn" data-type="root">词根 ${familiesByType("root").length}</button>
      <button class="btn" data-type="prefix">前缀 ${familiesByType("prefix").length}</button>
      <button class="btn" data-type="suffix">后缀 ${familiesByType("suffix").length}</button>
      <input id="rootsSearch" placeholder="搜索词根或单词，如 port / import" style="flex:1;min-width:200px;padding:8px 12px;border:2px solid #E5E5E5;border-radius:12px;font-family:inherit;font-size:14px" />
    </div>`;
  root.appendChild(card);

  const grid = document.createElement("div");
  grid.id = "rootsGrid";
  grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px";
  root.appendChild(grid);

  let filterType: "all" | RootFamily["type"] = "all";
  let query = "";

  const draw = () => {
    let list = filterType === "all" ? fams : familiesByType(filterType);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(f =>
        f.name.includes(q) || f.meaning.toLowerCase().includes(q) || f.meaningZh.includes(q) ||
        f.words.some(w => w.word.startsWith(q))
      );
    }
    grid.innerHTML = list.length === 0
      ? `<div class="muted">没有匹配的家族</div>`
      : list.slice(0, 200).map(f => `
        <div class="card" data-key="${f.key}" style="margin:0;padding:12px;cursor:pointer;border-color:${TYPE_COLOR[f.type]}33">
          <div style="font-weight:900;font-size:17px;color:${TYPE_COLOR[f.type]}">${f.name}${f.type === "suffix" ? "" : ""}</div>
          <div class="muted" style="margin:2px 0 6px">${TYPE_LABEL[f.type]}${f.origin ? " · " + f.origin : ""}</div>
          <div style="font-size:13px;font-weight:700">${f.meaningZh || f.meaning}</div>
          <div class="muted" style="margin-top:6px">${f.words.length} 个同族词</div>
        </div>`).join("");
    grid.querySelectorAll("[data-key]").forEach(el => el.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "roots", arg: el.getAttribute("data-key")! } }));
    }));
    if (list.length > 200) {
      const more = document.createElement("div");
      more.className = "muted";
      more.textContent = `仅显示前 200 个（共 ${list.length} 个），用搜索缩小范围`;
      grid.appendChild(more);
    }
  };

  card.querySelectorAll("[data-type]").forEach(b => b.addEventListener("click", () => {
    filterType = b.getAttribute("data-type") as typeof filterType;
    card.querySelectorAll("[data-type]").forEach(x => x.classList.toggle("on", x === b));
    draw();
  }));
  (card.querySelector("#rootsSearch") as HTMLInputElement).addEventListener("input", (e) => {
    query = (e.target as HTMLInputElement).value.trim();
    draw();
  });
  draw();
}

function renderFamily(root: HTMLElement, state: AppState, key: string): void {
  const f = getFamily(key);
  if (!f) {
    root.innerHTML = `<div class="card"><h2>未找到该家族</h2><button class="btn" id="backRoots">返回词根库</button></div>`;
    root.querySelector("#backRoots")!.addEventListener("click", () =>
      window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "roots" } })));
    return;
  }
  const bankWords = familyBankWords(f);
  const bankSet = new Set(bankWords.map(w => w.word));

  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `
    <button class="btn" id="backRoots" style="margin-bottom:10px">← 返回词根库</button>
    <h2 style="color:${TYPE_COLOR[f.type]}">${f.name} <span class="muted" style="font-size:14px">${f.aliases.length ? "（" + f.aliases.join(" / ") + "）" : ""}</span></h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
      <span class="pill" style="border-color:${TYPE_COLOR[f.type]}">${TYPE_LABEL[f.type]}</span>
      ${f.origin ? `<span class="pill">来源：${f.origin}</span>` : ""}
      <span class="pill">同族词 ${f.words.length}</span>
      ${bankWords.length ? `<span class="pill fire">词表相关 ${bankWords.length}</span>` : ""}
    </div>
    <div style="font-weight:900;font-size:16px">${f.meaningZh || ""}</div>
    <div class="muted">${f.meaning}</div>`;
  root.appendChild(head);
  head.querySelector("#backRoots")!.addEventListener("click", () =>
    window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: "roots" } })));

  const list = document.createElement("div");
  list.className = "card";
  const ordered = [...f.words].sort((a, b) => (bankSet.has(b.word) ? 1 : 0) - (bankSet.has(a.word) ? 1 : 0));
  list.innerHTML = `<h2>📖 同族词（${f.words.length}）</h2>
    <div class="muted">标 🔥 的是初中/高中/四级词表里的词</div>
    <div id="famWords" style="margin-top:10px;display:flex;flex-direction:column;gap:6px"></div>`;
  root.appendChild(list);
  const box = list.querySelector("#famWords")!;

  for (const w of ordered) {
    const m = buildMnemonic(w.word);
    const row = document.createElement("div");
    row.className = "wrow";
    row.innerHTML = `
      <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
        <b style="font-size:16px">${w.word}</b>
        ${bankSet.has(w.word) ? "🔥" : ""}
        <span class="muted">${w.phonetic}</span>
        ${layerBadge(m.layer)}
        <span style="font-size:13px">${w.meaning[0] ?? ""}</span>
      </div>
      ${m.formula ? `<div class="muted" style="margin-top:4px">${m.formula}</div>` : ""}`;
    const detail = document.createElement("div");
    detail.style.display = "none";
    detail.style.cssText = "display:none;margin-top:8px;padding-top:8px;border-top:1px dashed #E5E5E5";
    row.appendChild(detail);

    row.addEventListener("click", (ev) => {
      if ((ev.target as HTMLElement).tagName === "BUTTON") return;
      const open = detail.style.display !== "none";
      if (open) { detail.style.display = "none"; return; }
      const mm = buildMnemonic(w.word);
      detail.style.display = "block";
      detail.innerHTML = `
        <div style="font-weight:900;margin-bottom:6px">${layerBadge(mm.layer)}${LAYER_LABEL[mm.layer]}层拆解</div>
        ${mm.parts.length ? `<div style="margin-bottom:6px">${mm.parts.map(p => `<span class="pill" style="margin:2px">${p.text} = ${p.gloss}</span>`).join(" + ")}</div>` : ""}
        ${mm.formula ? `<div style="font-weight:800;margin-bottom:4px">${mm.formula}</div>` : ""}
        <div class="muted" style="margin-bottom:6px">${mm.note}</div>
        <div style="margin-bottom:6px">${w.meaning.map(x => `<div style="font-size:13px">· ${x}</div>`).join("")}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn--green" data-act="ok">✅ 记住了</button>
          <button class="btn btn--yellow" data-act="review">🔁 需复习</button>
        </div>`;
      detail.querySelector('[data-act="ok"]')!.addEventListener("click", () => {
        markRemembered(rootsState, w.word);
        rootsSave();
        sCorrect();
        burstStars(row);
        toast("✅ " + w.word + " 已标记记住（+2 XP 记账于自测）");
      });
      detail.querySelector('[data-act="review"]')!.addEventListener("click", () => {
        markNeedReview(rootsState, w.word);
        rootsSave();
        toast("🔁 " + w.word + " 已加入复习队列");
      });
    });
    box.appendChild(row);
  }
}
