import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Copy, SquareTerminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty, ProblemStatus } from '../types';

// ---------------------------------------------------------------- inline markdown
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('`')) out.push(<code key={`${keyBase}-${i++}`}>{tok.slice(1, -1)}</code>);
    else out.push(<strong key={`${keyBase}-${i++}`}>{tok.slice(2, -2)}</strong>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Inline({ text }: { text: string }) {
  return <>{inline(text, 'i')}</>;
}

/** Minimal markdown: paragraphs, - lists, 1. lists, ```code```, `inline`, **bold**. No HTML injection. */
export function Md({ text, lang }: { text: string; lang?: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, '').split('\n');
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) body.push(lines[i++]);
      i++;
      blocks.push(<CodeBlock key={k++} code={body.join('\n')} lang={lang ?? 'python'} />);
      continue;
    }
    if (/^\s*[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*] /, ''));
      blocks.push(<ul key={k++}>{items.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\. /, ''));
      blocks.push(<ol key={k++}>{items.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith('### ')) { blocks.push(<h3 key={k++}>{inline(line.slice(4), `h${k}`)}</h3>); i++; continue; }
    if (line.startsWith('## ')) { blocks.push(<h2 key={k++}>{inline(line.slice(3), `h${k}`)}</h2>); i++; continue; }
    if (!line.trim()) { i++; continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*([-*] |\d+\. |```|#{2,3} )/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={k++}>{inline(para.join(' '), `p${k}`)}</p>);
  }
  return <>{blocks}</>;
}

// ---------------------------------------------------------------- code highlighting
const KW: Record<string, Set<string>> = {
  python: new Set('def return if elif else for while in not and or is None True False class import from as with try except finally raise lambda yield pass break continue global nonlocal assert del'.split(' ')),
  java: new Set('public private protected static final class interface extends implements return if else for while do new int long double float boolean char byte short void null true false import package try catch finally throw throws this super switch case default break continue var instanceof String Integer Long Character Boolean List Map Set Deque Queue ArrayList HashMap HashSet TreeMap TreeSet ArrayDeque PriorityQueue LinkedList Arrays Collections Math StringBuilder Comparator Override'.split(' ')),
};

export function highlight(code: string, lang: string): ReactNode[] {
  const kw = KW[lang] ?? KW.python;
  const comment = lang === 'java' ? /\/\/[^\n]*|\/\*[\s\S]*?\*\//y : /#[^\n]*/y;
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;
  let plain = '';
  const flush = () => { if (plain) { out.push(plain); plain = ''; } };
  const tryRe = (re: RegExp) => { re.lastIndex = i; const m = re.exec(code); return m ? m[0] : null; };
  while (i < code.length) {
    let m: string | null;
    if ((m = tryRe(comment))) { flush(); out.push(<span key={k++} className="tok-c">{m}</span>); i += m.length; continue; }
    if ((m = tryRe(/"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y))) { flush(); out.push(<span key={k++} className="tok-s">{m}</span>); i += m.length; continue; }
    if ((m = tryRe(/\b\d[\d_]*(\.\d+)?([eE][+-]?\d+)?[Ll]?\b/y))) { flush(); out.push(<span key={k++} className="tok-n">{m}</span>); i += m.length; continue; }
    if ((m = tryRe(/[A-Za-z_]\w*/y))) {
      if (kw.has(m)) { flush(); out.push(<span key={k++} className="tok-k">{m}</span>); }
      else if (code[i + m.length] === '(') { flush(); out.push(<span key={k++} className="tok-f">{m}</span>); }
      else plain += m;
      i += m.length;
      continue;
    }
    plain += code[i++];
  }
  flush();
  return out;
}

export function CodeBlock({ code, lang, label, scratch = true }: { code: string; lang: string; label?: string; scratch?: boolean }) {
  const [copied, setCopied] = useState(false);
  const nav = useNavigate();
  return (
    <div className="code-block">
      {label && <div className="code-label">{label}</div>}
      <div className="code-actions">
        <button className="icon-btn" title="Copy" onClick={() => { void navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        {scratch && (
          <button className="icon-btn" title="Open in scratchpad" onClick={() => nav('/scratchpad', { state: { code } })}>
            <SquareTerminal size={14} />
          </button>
        )}
      </div>
      <pre><code>{highlight(code, lang)}</code></pre>
    </div>
  );
}

// ---------------------------------------------------------------- small bits
export const Kbd = ({ children }: { children: ReactNode }) => <kbd>{children}</kbd>;
export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD = isMac ? '⌘' : 'Ctrl';

export function Shortcut({ keys }: { keys: string[] }) {
  return <span className="row" style={{ gap: 2, display: 'inline-flex' }}>{keys.map((k, i) => <Fragment key={i}><kbd>{k}</kbd></Fragment>)}</span>;
}

export const DiffTag = ({ d }: { d: Difficulty }) => <span className={`tag diff-${d}`}>{d}</span>;

export const STATUS_LABEL: Record<ProblemStatus, string> = {
  'not-started': 'Not started', attempted: 'Attempted', solved: 'Solved', 'solved-with-help': 'Solved with help',
};
export const StatusDot = ({ s }: { s: ProblemStatus }) => (s === 'not-started'
  ? <span style={{ width: 8, flex: 'none', display: 'inline-block' }} aria-hidden />
  : <span className={`dot ${s}`} title={STATUS_LABEL[s]} aria-label={STATUS_LABEL[s]} />);

export function Bar({ value, max = 100, thin }: { value: number; max?: number; thin?: boolean }) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return <div className={`bar${thin ? ' thin' : ''}`} role="meter" aria-valuenow={value} aria-valuemax={max}><i style={{ width: `${pct}%` }} /></div>;
}

export function ConfidencePicker({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <div className="confidence" role="group" aria-label="Confidence 1 to 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} aria-pressed={value === n} onClick={() => onChange(n)} title={['', 'Could not do it again', 'Shaky', 'Okay', 'Solid', 'Could teach it'][n]}>{n}</button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- resizable split
export function useNarrow(query = '(max-width: 760px)') {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return narrow;
}

/** Resizable two-pane split. On phones a horizontal split with `tabs` becomes two full-size tabs
 *  (both panes stay mounted, so editor state survives switching). `showSecond` switches to the second tab whenever it changes. */
export function Split({ dir = 'h', initial = 50, min = 15, id, children, tabs, showSecond }: { dir?: 'h' | 'v'; initial?: number; min?: number; id: string; children: [ReactNode, ReactNode]; tabs?: [string, string]; showSecond?: number }) {
  const narrow = useNarrow();
  const [tab, setTab] = useState(0);
  useEffect(() => { if (showSecond) setTab(1); }, [showSecond]);
  const key = `split:${id}`;
  const [pct, setPct] = useState<number>(() => {
    try { const v = Number(localStorage.getItem(key)); return v > 0 ? v : initial; } catch { return initial; }
  });
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const onDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setDrag(true);
    const el = ref.current!;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const p = dir === 'h' ? ((ev.clientX - r.left) / r.width) * 100 : ((ev.clientY - r.top) / r.height) * 100;
      setPct(Math.max(min, Math.min(100 - min, p)));
    };
    const up = () => { setDrag(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [dir, min]);
  useEffect(() => { try { localStorage.setItem(key, String(pct)); } catch { /* ignore */ } }, [key, pct]);
  if (narrow && tabs && dir === 'h') {
    return (
      <div className="split-tabs">
        <div className="seg split-tabs-bar" role="tablist">
          {tabs.map((t, i) => <button key={t} role="tab" aria-pressed={tab === i} aria-selected={tab === i} onClick={() => setTab(i)}>{t}</button>)}
        </div>
        <div className="pane" style={{ display: tab === 0 ? 'flex' : 'none' }}>{children[0]}</div>
        <div className="pane" style={{ display: tab === 1 ? 'flex' : 'none' }}>{children[1]}</div>
      </div>
    );
  }
  return (
    <div ref={ref} className={`split${dir === 'v' ? ' v' : ''}`} style={drag ? { userSelect: 'none', cursor: dir === 'h' ? 'col-resize' : 'row-resize' } : undefined}>
      <div className="pane" style={{ flex: `0 0 ${pct}%` }}>{children[0]}</div>
      <div className={`gutter${drag ? ' dragging' : ''}`} onPointerDown={onDown} role="separator" aria-orientation={dir === 'h' ? 'vertical' : 'horizontal'}
        onDoubleClick={() => setPct(initial)} title="Drag to resize, double-click to reset" />
      <div className="pane" style={{ flex: '1 1 0' }}>{children[1]}</div>
    </div>
  );
}

// ---------------------------------------------------------------- toast
let toastFn: (msg: string) => void = () => {};
export const toast = (msg: string) => toastFn(msg);
export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    toastFn = (m) => { setMsg(m); clearTimeout(t); t = setTimeout(() => setMsg(null), 2600); };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}

export function formatDate(d: string | number): string {
  const date = typeof d === 'number' ? new Date(d) : new Date(`${d}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function plural(n: number, w: string, p = `${w}s`) { return `${n} ${n === 1 ? w : p}`; }
