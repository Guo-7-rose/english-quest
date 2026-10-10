/**
 * 安装到主屏幕的引导
 * - Android/Chrome：监听 beforeinstallprompt，展示页面内安装按钮
 * - iOS/Safari：展示一次性图文指引（分享 → 添加到主屏幕）
 * - 已安装或已关闭过就不再打扰（localStorage 记录）
 */

const DISMISS_KEY = "eq:installPromptDismissed";
const IOS_HINT_KEY = "eq:iosHintShown";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches === true || nav.standalone === true;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
}

function isWeChat(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function dismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}

function dismiss(): void {
  try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* 忽略 */ }
  document.getElementById("installBar")?.remove();
}

/** 微信/QQ 内置浏览器：给出「在浏览器中打开」的提示（内置浏览器不支持安装 PWA） */
export function safeAreaHint(): void {
  if (!isWeChat()) return;
  if (document.getElementById("wechatHint")) return;
  const bar = document.createElement("div");
  bar.id = "wechatHint";
  bar.className = "notice";
  bar.innerHTML = `📱 微信内打开无法安装到主屏幕 —— 点右上角 <b>⋯</b> → <b>在浏览器打开</b>，就能装成 App 了
    <button class="btn btn--ghost" id="wechatHintClose" style="margin-left:8px">知道了</button>`;
  document.body.appendChild(bar);
  bar.querySelector("#wechatHintClose")!.addEventListener("click", () => bar.remove());
}

function showInstallBar(onInstall: () => void): void {
  if (dismissed() || isStandalone() || document.getElementById("installBar")) return;
  const bar = document.createElement("div");
  bar.id = "installBar";
  bar.className = "install-bar";
  bar.innerHTML = `
    <span>📲 装到主屏幕，像 App 一样用（可离线）</span>
    <span style="display:flex;gap:8px">
      <button class="btn btn--green" id="installGo">安装</button>
      <button class="btn btn--ghost" id="installLater">以后</button>
    </span>`;
  document.body.appendChild(bar);
  bar.querySelector("#installGo")!.addEventListener("click", () => { onInstall(); dismiss(); });
  bar.querySelector("#installLater")!.addEventListener("click", dismiss);
}

function showIOSHint(): void {
  try { if (localStorage.getItem(IOS_HINT_KEY) === "1") return; } catch { /* 忽略 */ }
  if (dismissed() || isStandalone() || document.getElementById("iosHint")) return;
  const tip = document.createElement("div");
  tip.id = "iosHint";
  tip.className = "notice";
  tip.innerHTML = `🍎 iPhone 安装方法：点底部 <b>分享</b> 按钮（方框＋向上箭头）→ 下滑找到 <b>添加到主屏幕</b> → 添加
    <button class="btn btn--ghost" id="iosHintClose" style="margin-left:8px">知道了</button>`;
  document.body.appendChild(tip);
  try { localStorage.setItem(IOS_HINT_KEY, "1"); } catch { /* 忽略 */ }
  tip.querySelector("#iosHintClose")!.addEventListener("click", () => tip.remove());
}

export function initInstallPrompt(): void {
  if (location.protocol === "file:") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    showInstallBar(() => { void deferredPrompt?.prompt(); deferredPrompt = null; });
  });

  window.addEventListener("appinstalled", () => {
    dismiss();
    deferredPrompt = null;
  });

  if (isIOS()) {
    // 等页面稳定后再提示，避免打断首屏
    window.setTimeout(showIOSHint, 4000);
  }

  safeAreaHint();
}
