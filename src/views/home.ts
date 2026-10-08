import type { AppState } from "../types";
import { heatmapDays, grantFreezeIfDue, useFreeze, daysSinceLastCheckin } from "../engine/streak";
import { xpNeededForLevel } from "../engine/progress";
import { toast } from "../fx/fx";

export function renderHome(root: HTMLElement, state: AppState): void {
  root.innerHTML = "";
  grantFreezeIfDue(state);

  const hero = document.createElement("div");
  hero.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;";
  hero.innerHTML = `
    <div style="flex:1.2;min-width:280px;background:linear-gradient(180deg,#FFE37A,#FFC800);border:2px solid #DBA800;border-bottom-width:6px;border-radius:20px;padding:22px;text-align:center;">
      <div style="font-size:44px;font-weight:900;color:#E66A00;line-height:1;">🔥 ${state.profile.streak} <small style="font-size:16px">天连续</small></div>
      <div class="muted" style="color:#8A5B00;">${state.profile.goalsMetToday ? "今日目标已完成，明天继续！" : "今天再来一组，完成每日目标！"}</div>
      <button class="btn btn--green" id="checkinBtn" style="margin-top:14px;width:100%;font-size:20px;padding:14px;">${state.profile.goalsMetToday ? "✅ 今日已达标" : "🎯 今日目标"}</button>
      <div class="muted" style="margin-top:8px;color:#8A5B00;">已背 ${state.profile.dailyWordsToday}/${state.profile.dailyGoal.words} 词 · 语法 ${state.profile.dailyGrammarToday}/${state.profile.dailyGoal.grammarUnits} 单元</div>
    </div>
    <div style="flex:1;min-width:280px;display:flex;flex-direction:column;gap:12px;justify-content:center;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="level-badge">Lv.${state.profile.level}</div>
        <div><div style="font-weight:900">${state.profile.level} 级</div><div class="muted">距离下一级还差 ${Math.max(0, xpNeededForLevel(state.profile.level) - state.profile.xp)} XP</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;font-weight:800;">
        <div>⚡ 经验值</div>
        <div class="xp-bar"><div class="xp-fill" style="width:${Math.min(100, state.profile.xp / xpNeededForLevel(state.profile.level) * 100)}%"></div></div>
        <div>${state.profile.xp}/${xpNeededForLevel(state.profile.level)}</div>
      </div>
    </div>`;
  root.appendChild(hero);

  const gap = daysSinceLastCheckin(state);
  if (gap === 2 && !state.profile.goalsMetToday) {
    const freeze = document.createElement("div");
    freeze.className = "card";
    freeze.style.cssText = "border-color:#FFE08A;background:#FFFBE6;";
    freeze.innerHTML = `<h2>🧊 昨天断签了！</h2><div class="muted">使用冻结卡可以补上昨天，保住连续记录（剩余 ${state.profile.freezeCards} 张）</div>
      <button class="btn btn--yellow" id="useFreezeBtn" style="margin-top:10px">🧊 使用冻结卡补签</button>`;
    root.appendChild(freeze);
    freeze.querySelector("#useFreezeBtn")!.addEventListener("click", () => {
      if (useFreeze(state)) { toast("✅ 补签成功！连续 " + state.profile.streak + " 天"); renderHome(root, state); }
      else toast("暂无可用冻结卡（每周自动补发 1 张）");
    });
  }

  const heat = document.createElement("div");
  heat.className = "card";
  heat.innerHTML = `<h2>📅 打卡日历</h2><div class="muted">🔥 连续 ${state.profile.streak} 天 · 冻结卡 x${state.profile.freezeCards}</div><div class="heatmap" id="heatmap"></div>`;
  root.appendChild(heat);
  const hm = heat.querySelector("#heatmap")!;
  heatmapDays(state).forEach(d => {
    const el = document.createElement("div");
    el.className = "day" + (d.checked ? " lv3" : d.isFuture ? "" : " lv1");
    el.title = d.date;
    hm.appendChild(el);
  });

  const tasks = document.createElement("div");
  tasks.className = "card";
  tasks.innerHTML = `<h2>🎯 今日任务</h2><div class="muted">完成任意一项即自动打卡</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
      <button class="btn" data-go="wordbank" style="border-color:#46A302;color:var(--green)">📚 学 ${state.profile.dailyGoal.words} 个词</button>
      <button class="btn" data-go="roots" style="border-color:#A568CC;color:var(--purple)">🌱 逛词根家族</button>
      <button class="btn" data-go="grammar" style="border-color:#1899D6;color:var(--blue)">📖 学 ${state.profile.dailyGoal.grammarUnits} 个语法单元</button>
      <button class="btn" data-go="videos" style="border-color:#D33131;color:var(--red)">🎬 看视频课</button>
    </div>`;
  root.appendChild(tasks);
  tasks.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () =>
    window.dispatchEvent(new CustomEvent("eq:navigate", { detail: { view: b.getAttribute("data-go") } }))));

  hero.querySelector("#checkinBtn")!.addEventListener("click", () => {
    toast(state.profile.goalsMetToday ? "今日目标已完成！" : "完成每日目标后自动打卡：学词 " + state.profile.dailyGoal.words + " 个 或 语法 " + state.profile.dailyGoal.grammarUnits + " 单元");
  });
}
