import type { AppState } from "../types";

export function renderGrammar(root: HTMLElement, state: AppState): void {
  root.innerHTML = `<div class="card"><h2>📖 语法训练</h2><div class="muted">语法单元即将上线</div></div>`;
}
