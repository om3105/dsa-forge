/* "Listen" controls for a lesson. It reads every element inside `target` marked with `data-say`
   (or the direct paragraphs/lists of a `data-say-children` block), in page order, highlighting
   and scrolling to the one being read. A non-empty data-say value is read instead of the text. */
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Pause, Play, SkipBack, SkipForward, Square, Volume2 } from 'lucide-react';
import { saveRate, savedRate, speak, speechSupported, stopSpeaking } from '../lib/speech';

const SELECTOR = '[data-say], [data-say-children] > :is(p, ul, ol, h3, blockquote)';
const RATES = [0.9, 1, 1.25, 1.5];

export function ListenBar({ target, id }: { target: RefObject<HTMLElement | null>; id: string }) {
  const owner = `listen:${id}`;
  const [idx, setIdx] = useState(-1);      // paragraph being read, -1 when idle
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(savedRate);
  const [count, setCount] = useState(0);
  const els = useRef<HTMLElement[]>([]);

  const collect = () => {
    els.current = Array.from(target.current?.querySelectorAll<HTMLElement>(SELECTOR) ?? []);
    setCount(els.current.length);
    return els.current;
  };
  useEffect(() => { collect(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Read paragraph `idx` while playing; move on when it finishes.
  useEffect(() => {
    const list = els.current;
    list.forEach((el, k) => el.classList.toggle('speaking', k === idx));
    if (!playing || idx < 0) return;
    const el = list[idx];
    if (!el) { setPlaying(false); setIdx(-1); return; }
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - 80) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const text = el.dataset.say || el.innerText;
    return speak(text, {
      owner, rate,
      onEnd: () => setIdx((k) => k + 1),
      onStop: () => setPlaying(false),
    });
  }, [idx, playing, rate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop and clear the highlight when leaving the page.
  useEffect(() => () => { stopSpeaking(owner); els.current.forEach((el) => el.classList.remove('speaking')); }, [owner]);

  if (!speechSupported()) return null;
  const start = () => { collect(); setIdx((k) => (k < 0 || k >= els.current.length ? 0 : k)); setPlaying(true); };
  const pause = () => { setPlaying(false); stopSpeaking(owner); };
  const stop = () => { pause(); setIdx(-1); };
  const jump = (d: number) => setIdx((k) => Math.max(0, Math.min(els.current.length - 1, (k < 0 ? 0 : k) + d)));
  const changeRate = (r: number) => { setRate(r); saveRate(r); };

  return (
    <div className="listen-bar" role="group" aria-label="Listen to this lesson">
      {playing
        ? <button className="btn sm" onClick={pause}><Pause size={14} /> Pause</button>
        : <button className="btn sm primary" onClick={start}>{idx < 0 ? <><Volume2 size={14} /> Listen</> : <><Play size={14} /> Resume</>}</button>}
      {idx >= 0 && (
        <>
          <button className="icon-btn" title="Previous paragraph" onClick={() => jump(-1)} disabled={idx === 0}><SkipBack size={14} /></button>
          <button className="icon-btn" title="Next paragraph" onClick={() => jump(1)} disabled={idx >= count - 1}><SkipForward size={14} /></button>
          <button className="icon-btn" title="Stop" onClick={stop}><Square size={13} /></button>
          <span className="faint small">{idx + 1} of {count}</span>
        </>
      )}
      {idx < 0 && <span className="faint small">Reads this page aloud, about {Math.max(1, Math.round(count * 0.25))} min</span>}
      <select className="listen-rate" value={rate} onChange={(e) => changeRate(Number(e.target.value))} aria-label="Speed">
        {RATES.map((r) => <option key={r} value={r}>{r}x</option>)}
      </select>
    </div>
  );
}
