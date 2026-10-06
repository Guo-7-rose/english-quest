let ctx: AudioContext | null = null;
let soundOn = true;
let ttsOn = true;

export function initAudio(): void {
  if (!ctx) { try { ctx = new AudioContext(); } catch { /* 忽略 */ } }
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

export function setSoundEnabled(on: boolean): void { soundOn = on; }
export function setTtsEnabled(on: boolean): void { ttsOn = on; }

function beep(freq: number, dur: number, type: OscillatorType, vol = 0.15): void {
  if (!soundOn || !ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch { /* 忽略 */ }
}

export const sCorrect = () => beep(880, .12, "triangle", .2);
export const sWrong = () => beep(180, .25, "sawtooth", .15);
export const sKey = () => beep(620, .04, "sine", .05);
export const sLevelUp = () => { beep(523, .12, "square", .15); setTimeout(() => beep(659, .12, "square", .15), 120); setTimeout(() => beep(784, .2, "square", .15), 240); };
export const sUnlock = () => { beep(784, .1, "triangle", .18); setTimeout(() => beep(1046, .18, "triangle", .18), 110); };

export function speakWord(word: string): void {
  if (!ttsOn) return;
  try {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US";
    u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch { /* 忽略 */ }
}
