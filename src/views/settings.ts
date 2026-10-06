import type { AppState } from "../types";

export function renderSettings(root: HTMLElement, state: AppState): void {
  root.innerHTML = `<div class="card"><h2>⚙️ 设置</h2><div class="muted">设置面板即将上线</div></div>`;
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
