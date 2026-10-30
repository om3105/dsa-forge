/* LeetCode-style solving surface: [left panel] | [editor / console]. Used by the problem page and interview mode. */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Play, RotateCcw, Send } from 'lucide-react';
import type { CourseId, Problem } from '../types';
import { actions, loadCode, saveCode, snapshotCode, useApp } from '../store/store';
import { expectedFor, formatInputs, parseCustomInput, starterCode } from '../lib/harness';
import { judge, type JudgeOutcome } from '../lib/judge';
import { preload } from '../lib/exec';
import CodeEditor, { type EditorHandle } from './CodeEditor';
import { EngineStatus } from './EngineStatus';
import { Kbd, MOD, Split } from './ui';

interface Props {
  course: CourseId;
  problem: Problem;
  left: ReactNode;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  /** called after each submit */
  onSubmitted?: (o: JudgeOutcome) => void;
  /** render extra content under an accepted submit (e.g. logging prompt) */
  afterAccepted?: (o: JudgeOutcome) => ReactNode;
  locked?: ReactNode;
  /** start from the starter code and never save over your stored draft (topic reviews, reopened practice) */
  fresh?: boolean;
}

export function SolveView({ course, problem: p, left, toolbarLeft, toolbarRight, onSubmitted, afterAccepted, locked, fresh }: Props) {
  const { settings } = useApp();
  const [code, setCode] = useState<string | null>(null);
  const samples = useMemo(() => (p.tests ?? []).filter((t) => t.sample).map((t) => t.input), [p]);
  const [custom, setCustom] = useState(() => formatInputs(samples));
  const [tab, setTab] = useState<'input' | 'result'>('input');
  const [busy, setBusy] = useState<false | 'run' | 'submit'>(false);
  const [outcome, setOutcome] = useState<JudgeOutcome | null>(null);
  const [caseIdx, setCaseIdx] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0); // on phones, running jumps to the Code tab where results appear
  const editor = useRef<EditorHandle | null>(null);

  useEffect(() => {
    let alive = true;
    setCode(null);
    setOutcome(null);
    setCustom(formatInputs((p.tests ?? []).filter((t) => t.sample).map((t) => t.input)));
    if (fresh) setCode(starterCode(course, p));
    else void loadCode(course, p.id).then((rec) => { if (alive) setCode(rec?.current || starterCode(course, p)); });
    preload(course); // warm up the in-browser runtime in the background if it will be needed
    return () => { alive = false; };
  }, [course, p, fresh]);

  const onChange = (v: string) => { setCode(v); if (!fresh) saveCode(course, p.id, v); };

  const exec = useCallback(async (kind: 'run' | 'submit') => {
    if (busy || code == null || locked) return;
    let inputs: unknown[][];
    let expected: (unknown | undefined)[];
    if (kind === 'submit') {
      inputs = (p.tests ?? []).map((t) => t.input);
      expected = expectedFor(p);
    } else {
      const parsed = parseCustomInput(p, custom);
      if (parsed.error) {
        setOutcome(null);
        setTab('result');
        setRunError(parsed.error);
        return;
      }
      inputs = parsed.cases;
      // if a custom case equals a stored test, we know its expected output
      const all = p.tests ?? [];
      const exp = expectedFor(p);
      expected = inputs.map((inp) => {
        const k = all.findIndex((t) => JSON.stringify(t.input) === JSON.stringify(inp));
        return k >= 0 ? exp[k] : undefined;
      });
    }
    setRunError(null);
    setRunCount((n) => n + 1);
    setBusy(kind);
    setTab('result');
    try {
      const o = await judge(settings, course, p, code, inputs, expected, kind);
      setOutcome(o);
      editor.current?.setMarkers(o.markers);
      const firstBad = o.cases.findIndex((x) => x.passed === false);
      setCaseIdx(firstBad >= 0 ? firstBad : 0);
      if (kind === 'submit') {
        const passed = o.verdict === 'Accepted' ? o.total : o.passed;
        if (!fresh) snapshotCode(course, p.id, code, passed, o.total);
        if (o.verdict !== 'Engine Error') actions.recordSubmit(course, p.id, passed, o.total);
        onSubmitted?.(o);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, code, custom, course, p, settings, onSubmitted, locked]);

  // global shortcuts (when focus is outside Monaco)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'Enter') return;
      e.preventDefault();
      void exec(e.shiftKey ? 'submit' : 'run');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exec]);

  const reset = () => {
    if (!confirmReset()) return;
    const s = starterCode(course, p);
    setCode(s);
    if (!fresh) saveCode(course, p.id, s);
  };

  return (
    <div className="ws">
      <div className="ws-bar">
        {toolbarLeft}
        <div className="grow" />
        <EngineStatus course={course} />
        {toolbarRight}
        <button className="btn sm ghost hide-sm" onClick={reset} title="Reset to starter code"><RotateCcw size={13} /></button>
        <button className="btn sm" onClick={() => void exec('run')} disabled={!!busy || !!locked}>
          <Play size={13} /> {busy === 'run' ? 'Running…' : 'Run'} <span className="hide-sm"><Kbd>{MOD}</Kbd><Kbd>↵</Kbd></span>
        </button>
        <button className="btn sm primary" onClick={() => void exec('submit')} disabled={!!busy || !!locked}>
          <Send size={13} /> {busy === 'submit' ? 'Judging…' : 'Submit'} <span className="hide-sm"><Kbd>{MOD}</Kbd><Kbd>⇧</Kbd><Kbd>↵</Kbd></span>
        </button>
      </div>
      <div className="ws-body">
        <Split id="solve-h" initial={42} min={20} tabs={['Problem', 'Code']} showSecond={runCount}>
          <div className="pane-scroll" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>{left}</div>
          <Split id="solve-v" dir="v" initial={64} min={15}>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {locked && <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'color-mix(in srgb, var(--bg) 88%, transparent)', display: 'grid', placeItems: 'center', padding: 24 }}>{locked}</div>}
              {code == null ? <div className="empty">Loading…</div> : (
                <CodeEditor course={course} value={code} onChange={onChange} onRun={() => void exec('run')} onSubmit={() => void exec('submit')} onReady={(h) => { editor.current = h; }} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
              <div className="tabs" role="tablist">
                <button role="tab" aria-selected={tab === 'input'} onClick={() => setTab('input')}>Testcase</button>
                <button role="tab" aria-selected={tab === 'result'} onClick={() => setTab('result')}>Result</button>
              </div>
              <div className="pane-scroll">
                {tab === 'input' ? (
                  <div className="stack">
                    <div className="faint small">
                      One JSON value per line per parameter ({paramList(p)}). Separate test cases with a blank line. <button className="btn sm ghost" onClick={() => setCustom(formatInputs(samples))}>Reset to samples</button>
                    </div>
                    <textarea className="mono" rows={8} value={custom} onChange={(e) => setCustom(e.target.value)} spellCheck={false} />
                  </div>
                ) : (
                  <ResultView outcome={outcome} busy={busy} runError={runError} caseIdx={caseIdx} setCaseIdx={setCaseIdx} afterAccepted={afterAccepted} />
                )}
              </div>
            </div>
          </Split>
        </Split>
      </div>
    </div>
  );
}

function confirmReset() {
  // a non-blocking confirm would need a dialog; reset is rare and recoverable via Submissions history
  return window.confirm('Replace your code with the starter code? Previous submissions stay in the Submissions tab.');
}

function paramList(p: Problem) {
  const s = p.signature!;
  if (s.kind === 'design') return 'line 1: operations, line 2: arguments';
  return s.params.map((x) => x.name).join(', ') || 'no parameters';
}

const show = (v: unknown) => JSON.stringify(v);

function ResultView({ outcome: o, busy, runError, caseIdx, setCaseIdx, afterAccepted }: {
  outcome: JudgeOutcome | null; busy: false | 'run' | 'submit'; runError: string | null;
  caseIdx: number; setCaseIdx: (i: number) => void; afterAccepted?: (o: JudgeOutcome) => ReactNode;
}) {
  if (busy) return <div className="faint small">{busy === 'run' ? 'Running…' : 'Judging against all tests…'} The first in-browser run downloads the runtime and can take a while; later runs are fast.</div>;
  if (runError) return <div className="callout err small">{runError}</div>;
  if (!o) return <div className="faint small">Run your code to see output here.</div>;
  const ok = o.verdict === 'Accepted' || (o.kind === 'run' && o.verdict === 'Finished' && o.cases.every((x) => x.ok));
  const title = o.kind === 'run' && o.verdict === 'Accepted' ? 'Sample cases passed' : o.verdict;
  const c = o.cases[caseIdx];
  return (
    <div className="stack-16">
      <div className="spread">
        <div className={`verdict ${ok ? 'ok' : 'bad'}`}>{title}</div>
        <div className="faint small mono">
          {o.kind === 'submit' && `${o.verdict === 'Accepted' ? o.total : o.passed}/${o.total} passed, `}
          {o.exec.engine}, {o.exec.wallMs} ms total{o.maxMicros ? `, slowest case ${(o.maxMicros / 1000).toFixed(1)} ms` : ''}
        </div>
      </div>
      {o.errorText && <pre className="io-box console err" style={{ margin: 0 }}>{o.errorText}</pre>}
      {o.verdict === 'Accepted' && o.kind === 'submit' && afterAccepted?.(o)}
      {o.cases.length > 0 && (
        <>
          <div className="case-tabs" role="tablist">
            {o.cases.map((x, i) => (
              <button key={i} role="tab" aria-selected={i === caseIdx} onClick={() => setCaseIdx(i)}>
                <span className={`dot ${x.passed === true ? 'solved' : x.passed === false ? 'error' : 'offline'}`} />
                Case {i + 1}
              </button>
            ))}
          </div>
          {c && (
            <div>
              {c.error ? <><div className="io-label">Error</div><pre className="io-box console err" style={{ margin: 0 }}>{c.error}</pre></> : (
                <>
                  <div className="io-label">Output</div>
                  <div className="io-box">{show(c.output)}</div>
                  {c.expected !== undefined && <><div className="io-label">Expected</div><div className="io-box">{show(c.expected)}</div></>}
                </>
              )}
              {c.stdout && <><div className="io-label">Stdout</div><pre className="io-box console" style={{ margin: 0 }}>{c.stdout}</pre></>}
              {c.micros != null && !c.error && <div className="faint small mono" style={{ marginTop: 6 }}>{(c.micros / 1000).toFixed(2)} ms</div>}
            </div>
          )}
        </>
      )}
      {(o.trailing || o.exec.stderr) && o.verdict !== 'Compile Error' && o.verdict !== 'Runtime Error' && (
        <div>
          <div className="io-label">Console</div>
          <pre className="io-box console" style={{ margin: 0 }}>{[o.trailing, o.exec.stderr].filter(Boolean).join('\n')}</pre>
        </div>
      )}
    </div>
  );
}
