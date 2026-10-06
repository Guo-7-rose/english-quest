const PARTICLE_CHARS = ["⭐", "✨", "🌟", "💫"];

export function burstStars(el: HTMLElement): void {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = PARTICLE_CHARS[Math.floor(Math.random() * PARTICLE_CHARS.length)]!;
    p.style.left = (20 + Math.random() * 60) + "%";
    p.style.top = (30 + Math.random() * 30) + "%";
    p.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
    p.style.setProperty("--dy", (-40 - Math.random() * 90) + "px");
    p.style.setProperty("--rot", (Math.random() * 360 - 180) + "deg");
    el.appendChild(p);
    setTimeout(() => p.remove(), 950);
  }
}

const COLORS = ["#58CC02", "#FFC800", "#1CB0F6", "#CE82FF", "#FF4B4B"];
export function confettiBurst(): void {
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = COLORS[i % COLORS.length]!;
    c.style.animationDuration = (1.2 + Math.random() * 1.4) + "s";
    c.style.animationDelay = Math.random() * 0.3 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

export function shakeEl(el: HTMLElement): void {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

export function popEl(el: HTMLElement): void {
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
}

let toastEl: HTMLElement | null = null;
let toastTimer: number | undefined;
export function toast(msg: string): void {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl!.classList.remove("show"), 2600);
}
