import type { AppState } from "../types";
import { resetAll, save } from "../store/storage";
import { setSoundEnabled, setTtsEnabled } from "../fx/audio";
import { toast } from "../fx/fx";

const THEMES = [
  { id: "green", name: "🟢 草地绿", needStage: 1 },
  { id: "blue", name: "🔵 天空蓝", needStage: 2 },
  { id: "purple", name: "🟣 大师紫", needStage: 3 },
];

const GOALS = [
  { words: 20, grammarUnits: 1, name: "轻松档" },
  { words: 30, grammarUnits: 2, name: "标准档" },
  { words: 50, grammarUnits: 3, name: "冲刺档" },
];

export function renderSettings(root: HTMLElement, state: AppState): void {
  root.innerHTML = "";
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>⚙️ 设置</h2>`;
  root.appendChild(card);

  const addToggle = (label: string, key: "sound" | "tts" | "showMeaning") => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:8px 0";
    row.innerHTML = `<b>${label}</b>`;
    const b = document.createElement("button");
    b.className = "btn " + (state.settings[key] ? "btn--green" : "");
    b.textContent = state.settings[key] ? "开" : "关";
    b.addEventListener("click", () => {
      state.settings[key] = !state.settings[key];
      if (key === "sound") setSoundEnabled(state.settings.sound);
      if (key === "tts") setTtsEnabled(state.settings.tts);
      save(state);
      renderSettings(root, state);
    });
    row.appendChild(b);
    card.appendChild(row);
  };
  addToggle("🔊 音效", "sound");
  addToggle("🔊 单词发音（听写用）", "tts");
  addToggle("💬 默写时显示释义", "showMeaning");

  card.insertAdjacentHTML("beforeend", `<h2 style="margin-top:16px">🎯 每日目标</h2><div class="muted">完成任意一项即自动打卡</div><div id="goals" style="display:flex;gap:10px;margin-top:10px"></div>`);
  const goals = card.querySelector("#goals")!;
  GOALS.forEach(g => {
    const active = state.profile.dailyGoal.words === g.words;
    const b = document.createElement("button");
    b.className = "btn" + (active ? " on" : "");
    b.textContent = g.name + `（${g.words} 词 / ${g.grammarUnits} 单元）`;
    b.addEventListener("click", () => {
      state.profile.dailyGoal = { words: g.words, grammarUnits: g.grammarUnits };
      save(state);
      renderSettings(root, state);
      toast("每日目标已切换：" + g.name);
    });
    goals.appendChild(b);
  });

  card.insertAdjacentHTML("beforeend", `<h2 style="margin-top:16px">🎨 主题</h2><div class="muted">全部主题直接可用（内容全解锁）</div><div id="themes" style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"></div>`);
  const themes = card.querySelector("#themes")!;
  THEMES.forEach(t => {
    const b = document.createElement("button");
    b.className = "btn" + (state.settings.theme === t.id ? " on" : "");
    b.textContent = t.name;
    b.addEventListener("click", () => {
      state.settings.theme = t.id;
      save(state);
      applyTheme(t.id);
      renderSettings(root, state);
    });
    themes.appendChild(b);
  });

  card.insertAdjacentHTML("beforeend", `<h2 style="margin-top:16px">⚠️ 危险区</h2>
    <button class="btn btn--red" id="resetBtn">🗑️ 重置全部数据</button>`);
  card.querySelector("#resetBtn")!.addEventListener("click", () => {
    if (confirm("确定清空所有学习进度？此操作不可恢复！")) {
      resetAll();
      location.reload();
    }
  });
}

export function applyTheme(id: string): void {
  const map: Record<string, { bg: string; green: string }> = {
    green: { bg: "#FFF7E8", green: "#58CC02" },
    blue: { bg: "#EEF7FF", green: "#1CB0F6" },
    purple: { bg: "#F7EEFF", green: "#A568CC" },
  };
  const t = map[id] ?? map["green"]!;
  document.documentElement.style.setProperty("--bg", t.bg);
  document.documentElement.style.setProperty("--green", t.green);
}
