import type { AppState } from "../types";

/** 视频课 —— Task 9 实现完整视图 */
export function renderVideos(root: HTMLElement, state: AppState): void {
  root.innerHTML = `<div class="card"><h2>🎬 视频课</h2><div class="muted">视频课建设中</div></div>`;
}
