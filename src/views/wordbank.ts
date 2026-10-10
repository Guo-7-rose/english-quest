import type { AppState } from "../types";
import { allThemes, allExpressions, getTheme, bankWords, bankMeta, BANK_ORDER, type BankId } from "../data/wordbank";
import { buildMnemonic } from "../engine/mnemonic";
import { familyOfWord } from "../data/roots";
import { wordInfo } from "../data/words";
import { markRemembered, markNeedReview } from "../engine/reviewQueue";
import { addXp } from "../engine/progress";
import { sCorrect } from "../fx/audio";
import { burstStars, toast } from "../fx/fx";
import { layerBadge, statusIcon } from "./shared";

export let bankState: AppState;
export let bankSave: () => void;

export function bindWordbank(state: AppState, save: () => void): void {
  bankState = state;
  bankSave = save;
}

const PAGE_SIZE = 50;

export function renderWordbank(root: HTMLElement, state: AppState, arg?: string): void {
  bankState = state;
  root.innerHTML = "";
  if (!arg) return renderBankList(root, state);
  if (arg === "daily") return renderDaily(root, state);
  if (arg.startsWith("daily:")) return renderTheme(root, state, arg.slice(6));
  const bank = arg as BankId;
  if (BANK_ORDER.includes(bank)) return renderWordList(root, state, bank);
  renderBankList(root, state);
}

function nav(view: string, arg?: string): void {
  window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view, arg } }));
}

function renderBankList(root: HTMLElement, state: AppState): void {
  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `<h2>📚 单词板块</h2>
    <div class="muted">全部板块可自由进入，按 <b>日常 → 初中 → 高中 → 四级</b> 的推荐顺序排列</div>`;
  root.appendChild(head);

  BANK_ORDER.forEach((bank, i) => {
    const meta = bankMeta(bank);
    const words = bankWords(bank);
    const learned = words.filter(w => state.wordStats[w]?.correct).length;
    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;cursor:pointer";
    card.innerHTML = `
      <div>
        <div style="font-weight:900;font-size:17px">${meta.icon} ${meta.title} <span class="muted" style="font-size:13px">${words.length} 词</span></div>
        <div class="muted" style="margin-top:2px">${meta.desc}</div>
      </div>
      <div style="text-align:right">
        <div class="pill">已学 <span class="val">${learned}</span></div>
        <button class="btn btn--green" style="margin-top:6px">进入</button>
      </div>`;
    card.addEventListener("click", () => nav("wordbank", bank));
    root.appendChild(card);
    if (i === 0) {
      const tip = document.createElement("div");
      tip.className = "muted";
      tip.style.cssText = "margin:-8px 0 14px 4px";
      tip.textContent = "👆 从日常词汇开始最实用";
      root.appendChild(tip);
    }
  });
}

function renderDaily(root: HTMLElement, state: AppState): void {
  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `<button class="btn" id="back">← 返回板块</button>
    <h2 style="margin-top:10px">🏠 日常词汇</h2>
    <div class="muted">18 个生活场景主题，先学马上能用上的词</div>`;
  root.appendChild(head);
  head.querySelector("#back")!.addEventListener("click", () => nav("wordbank"));

  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px";
  grid.innerHTML = allThemes().map(t => {
    const learned = t.words.filter(w => state.wordStats[w.word]?.correct).length;
    return `<div class="card" data-theme="${t.id}" style="margin:0;padding:12px;cursor:pointer">
      <div style="font-size:22px">${t.icon}</div>
      <div style="font-weight:900;margin:4px 0">${t.title}</div>
      <div class="muted">${t.words.length} 词 · 已学 ${learned}</div>
    </div>`;
  }).join("");
  root.appendChild(grid);
  grid.querySelectorAll("[data-theme]").forEach(el => el.addEventListener("click", () =>
    nav("wordbank", "daily:" + el.getAttribute("data-theme"))));

  const ex = document.createElement("div");
  ex.className = "card";
  ex.innerHTML = `<h2>💬 生活表达包（${allExpressions().length} 条）</h2>
    <div class="muted">「这句中文用英文怎么说」——背的是能直接说出口的表达</div>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
      ${allExpressions().map(e => `
        <div style="border-left:4px solid var(--yellow);padding:6px 10px;background:#FFFDF5;border-radius:8px">
          <div><b>${e.zh}</b> → <span style="color:var(--green);font-weight:900">${e.en}</span></div>
          <div class="muted">${e.note}</div>
          <div style="font-size:13px;font-style:italic;margin-top:2px">${e.example}</div>
        </div>`).join("")}
    </div>`;
  root.appendChild(ex);
}

function renderTheme(root: HTMLElement, state: AppState, themeId: string): void {
  const t = getTheme(themeId);
  if (!t) { nav("wordbank", "daily"); return; }
  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `<button class="btn" id="back">← 返回日常词汇</button>
    <h2 style="margin-top:10px">${t.icon} ${t.title} <span class="muted" style="font-size:14px">${t.words.length} 词</span></h2>
    <button class="btn btn--green" id="startCard" style="margin-top:10px">🚀 开始背这一组（卡片模式）</button>`;
  root.appendChild(head);
  head.querySelector("#back")!.addEventListener("click", () => nav("wordbank", "daily"));
  head.querySelector("#startCard")!.addEventListener("click", () => nav("wordcard", "daily:" + themeId));
  const list = document.createElement("div");
  list.className = "card";
  list.id = "wordList";
  root.appendChild(list);
  renderRows(list, state, t.words.map(w => w.word), t.words);
}

function renderWordList(root: HTMLElement, state: AppState, bank: BankId): void {
  const meta = bankMeta(bank);
  const words = bankWords(bank);
  const pages = Math.ceil(words.length / PAGE_SIZE);
  let page = 0;

  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `<button class="btn" id="back">← 返回板块</button>
    <h2 style="margin-top:10px">${meta.icon} ${meta.title} <span class="muted" style="font-size:14px">${words.length} 词 · 每页 ${PAGE_SIZE}</span></h2>
    <div class="muted">${meta.desc}</div>
    <button class="btn btn--green" id="startCard" style="margin-top:10px">🚀 开始背这一组（卡片模式）</button>`;
  root.appendChild(head);
  head.querySelector("#back")!.addEventListener("click", () => nav("wordbank"));
  head.querySelector("#startCard")!.addEventListener("click", () => nav("wordcard", bank));

  const list = document.createElement("div");
  list.className = "card";
  list.id = "wordList";
  root.appendChild(list);

  const pager = document.createElement("div");
  pager.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:center;margin-bottom:16px";
  root.appendChild(pager);

  const draw = () => {
    const slice = words.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    renderRows(list, state, slice);
    pager.innerHTML = `
      <button class="btn" id="prev" ${page === 0 ? "disabled" : ""}>← 上一页</button>
      <span class="pill">第 ${page + 1} / ${pages} 页</span>
      <button class="btn" id="next" ${page >= pages - 1 ? "disabled" : ""}>下一页 →</button>`;
    pager.querySelector("#prev")!.addEventListener("click", () => { if (page > 0) { page--; draw(); } });
    pager.querySelector("#next")!.addEventListener("click", () => { if (page < pages - 1) { page++; draw(); } });
  };
  draw();
}

/** 词表行渲染（日常主题与考试词表共用） */
function renderRows(container: HTMLElement, state: AppState, words: string[], metaWords?: { word: string; phonetic: string; meaning: string[] }[]): void {
  const lookup = new Map<string, { phonetic: string; meaning: string[] }>();
  if (metaWords) for (const w of metaWords) lookup.set(w.word, w);
  else for (const word of words) {
    const info = wordInfo(word);
    if (info) lookup.set(word, { phonetic: info.phonetic, meaning: info.meaning });
  }
  container.innerHTML = `<h2>📖 词表</h2><div class="muted">点任意词查看词源拆解、同族词与释义</div>
    <div id="rows" style="margin-top:10px;display:flex;flex-direction:column;gap:6px"></div>`;
  const box = container.querySelector("#rows")!;
  for (const word of words) {
    const m = buildMnemonic(word);
    const stat = bankState.wordStats[word];
    const info = lookup.get(word);
    const row = document.createElement("div");
    row.className = "wrow";
    row.innerHTML = `<div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
        <b style="font-size:16px">${word}</b>
        <span class="muted">${info?.phonetic ?? ""}</span>
        ${layerBadge(m.layer)}
        <span style="font-size:13px">${info?.meaning[0] ?? ""}</span>
        <span style="margin-left:auto">${statusIcon(stat)}</span>
      </div>
      ${m.formula ? `<div class="muted" style="margin-top:4px">${m.formula}</div>` : ""}`;
    const detail = document.createElement("div");
    detail.style.cssText = "display:none;margin-top:8px;padding-top:8px;border-top:1px dashed #E5E5E5";
    row.appendChild(detail);
    row.addEventListener("click", (ev) => {
      if ((ev.target as HTMLElement).tagName === "BUTTON") return;
      if (detail.style.display !== "none") { detail.style.display = "none"; return; }
      const mm = buildMnemonic(word);
      const fams = familyOfWord(word);
      detail.style.display = "block";
      detail.innerHTML = `
        <div style="font-weight:900;margin-bottom:6px">${layerBadge(mm.layer)}${mm.parts.length ? mm.parts.map(p => `<span class="pill" style="margin:2px">${p.text} = ${p.gloss}</span>`).join(" + ") : "无拆解"}</div>
        ${mm.formula ? `<div style="font-weight:800;margin-bottom:4px">${mm.formula}</div>` : ""}
        <div class="muted" style="margin-bottom:6px">${mm.note}</div>
        <div style="margin-bottom:6px">${(info?.meaning ?? []).map(x => `<div style="font-size:13px">· ${x}</div>`).join("")}</div>
        ${fams.length ? `<div class="muted" style="margin-bottom:6px">同族词根：${fams.map(f => `<a href="#" data-fam="${f.key}" style="color:var(--blue);font-weight:800">${f.name}</a>`).join(" · ")}</div>` : ""}
        <div style="display:flex;gap:8px">
          <button class="btn btn--green" data-act="ok">✅ 记住了</button>
          <button class="btn btn--yellow" data-act="review">🔁 需复习</button>
        </div>`;
      detail.querySelectorAll("[data-fam]").forEach(a => a.addEventListener("click", (e) => {
        e.preventDefault();
        nav("roots", a.getAttribute("data-fam")!);
      }));
      detail.querySelector('[data-act="ok"]')!.addEventListener("click", () => {
        markRemembered(bankState, word);
        addXp(bankState, 2);
        bankSave();
        sCorrect();
        burstStars(row);
        toast("✅ " + word + " 已标记记住 +2 XP");
        row.querySelector("span[style*='margin-left']")!.textContent = "✅";
      });
      detail.querySelector('[data-act="review"]')!.addEventListener("click", () => {
        markNeedReview(bankState, word);
        bankSave();
        toast("🔁 " + word + " 已加入复习队列");
        row.querySelector("span[style*='margin-left']")!.textContent = "🔁";
      });
    });
    box.appendChild(row);
  }
}
