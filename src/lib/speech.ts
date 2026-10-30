/* Read-aloud using the browser's own speech engine (Web Speech API).
   No audio files: the voice comes from the device, so quality depends on the OS. Only one thing
   speaks at a time; when something new starts, whoever was speaking gets their onStop called. */

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

const RATE_KEY = 'speech:rate';
export function savedRate(): number {
  try { const r = Number(localStorage.getItem(RATE_KEY)); return r > 0 ? r : 1; } catch { return 1; }
}
export function saveRate(r: number) {
  try { localStorage.setItem(RATE_KEY, String(r)); } catch { /* private mode */ }
}

// Symbols that read badly ("nums[i] ≤ k" becomes "nums i less than or equal to k").
const REPLACE: [RegExp, string][] = [
  [/```[\s\S]*?```/g, ' '],
  [/`([^`]*)`/g, '$1'],
  [/\*\*|__|\*/g, ''],
  [/→|->/g, ' to '],
  [/←|<-/g, ' from '],
  [/≤|<=/g, ' at most '],
  [/≥|>=/g, ' at least '],
  [/≠|!=/g, ' not equal to '],
  [/==/g, ' equals '],
  [/\+=/g, ' plus equals '],
  [/ < /g, ' less than '],
  [/ > /g, ' greater than '],
  [/×/g, ' times '],
  [/−/g, ' minus '],
  [/²/g, ' squared'],
  [/\^2\b/g, ' squared'],
  [/\^/g, ' to the power '],
  [/\bO\(([^)]*)\)/g, 'O of $1'],
  [/\blog n\b/g, 'log n'],
  [/\s+/g, ' '],
];
export function toSpeech(text: string): string {
  let s = text;
  for (const [re, to] of REPLACE) s = s.replace(re, to);
  return s.trim();
}

let voice: SpeechSynthesisVoice | null | undefined;
function pickVoice(): SpeechSynthesisVoice | null {
  if (voice !== undefined) return voice;
  const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (!all.length) return null; // voices load async in Chrome; try again next time
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|premium|enhanced|neural/i.test(v.name) ? 4 : 0) +
    (/google/i.test(v.name) ? 2 : 0) +
    (/^en-(IN|GB|US)/i.test(v.lang) ? 1 : 0);
  voice = [...all].sort((a, b) => score(b) - score(a))[0];
  return voice;
}
if (speechSupported()) window.speechSynthesis.onvoiceschanged = () => { voice = undefined; };

let current: { owner: string; onStop?: () => void } | null = null;
let token = 0;

/** Speaks `text` (split into sentences, because Chrome cuts off long utterances).
 *  `owner` identifies the caller: a different owner starting to speak calls this one's `onStop`,
 *  while the same owner moving on to its next paragraph does not.
 *  `onEnd` runs only if the text finished naturally. Returns a cancel function. */
export function speak(text: string, opts: { owner: string; rate?: number; onEnd?: () => void; onStop?: () => void }): () => void {
  if (!speechSupported()) { opts.onEnd?.(); return () => {}; }
  if (current && current.owner !== opts.owner) current.onStop?.();
  window.speechSynthesis.cancel();
  const my = ++token;
  current = { owner: opts.owner, onStop: opts.onStop };
  const parts = toSpeech(text).match(/[^.!?;:]+[.!?;:]*\s*/g)?.map((p) => p.trim()).filter(Boolean) ?? [];
  if (!parts.length) { setTimeout(() => { if (my === token) opts.onEnd?.(); }, 0); return () => {}; }
  const v = pickVoice();
  // Chrome can silently stall the queue if speak() follows cancel() immediately, so leave a gap.
  setTimeout(() => {
    if (my !== token) return;
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      if (v) u.voice = v;
      u.lang = v?.lang ?? 'en-US';
      u.rate = opts.rate ?? savedRate();
      if (i === parts.length - 1) u.onend = () => { if (my === token) opts.onEnd?.(); };
      window.speechSynthesis.speak(u);
    });
  }, 120);
  return () => { if (my === token) stopSpeaking(opts.owner); };
}

/** Stops speech. With `owner`, only if that owner is the one speaking (and without calling its onStop). */
export function stopSpeaking(owner?: string) {
  if (owner && current?.owner !== owner) return;
  token++;
  const prev = current;
  current = null;
  if (speechSupported()) window.speechSynthesis.cancel();
  if (!owner) prev?.onStop?.();
}
