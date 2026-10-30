/* Step-through walkthrough with Next / Previous / Play and an optional predict mode:
   before each step that has a question, you commit to an answer, then the step is revealed. */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react';
import { GENERATORS, type CellState, type Frame } from './viz/frames';

function Side({ side }: { side?: { label: string; value: string }[] }) {
  if (!side?.length) return null;
  return <div className="viz-side">{side.map((s) => <div key={s.label}><div className="label">{s.label}</div><div className="mono">{s.value}</div></div>)}</div>;
}

function renderFrame(f: Frame): ReactNode {
  if (f.kind === 'array') {
    return (
      <div>
        <div className="cells">{f.cells.map((c, i) => <div key={i} className={`cell ${f.states[i] ?? ''}`}><span className="idx">{i}</span>{c}</div>)}</div>
        <div className="ptrs">{f.cells.map((_, i) => <div key={i}>{f.ptrs[i] ?? ''}</div>)}</div>
        {f.extraRow && (
          <div className="row" style={{ marginTop: 8, gap: 4 }}>
            <div className="cells">{f.extraRow.cells.map((c, i) => <div key={i} className="cell" style={{ height: 28, fontSize: 12, borderStyle: 'dashed' }}>{c}</div>)}</div>
            <span className="faint small mono" style={{ marginLeft: 8 }}>{f.extraRow.label}</span>
          </div>
        )}
        <Side side={f.side} />
      </div>
    );
  }
  if (f.kind === 'table') {
    return (
      <table className="t" style={{ width: 'auto' }}>
        <thead><tr><th />{f.cols.map((c, j) => <th key={j} className="num">{c}</th>)}</tr></thead>
        <tbody>
          {f.rows.map((r, i) => (
            <tr key={i}>
              <th className="num">{r}</th>
              {f.cells[i].map((v, j) => (
                <td key={j} className="num" style={{ background: f.states[i][j] === 'hot' ? 'var(--accent)' : f.states[i][j] === 'hl' ? 'var(--accent-soft)' : undefined, color: f.states[i][j] === 'hot' ? 'var(--bg)' : undefined, width: 40 }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  const W = 64, H = 64;
  const maxX = Math.max(...f.nodes.map((n) => n.x), 1);
  const maxY = Math.max(...f.nodes.map((n) => n.y), 1);
  const pos = (n: { x: number; y: number }) => [32 + n.x * W, 24 + n.y * H];
  const byId = Object.fromEntries(f.nodes.map((n) => [n.id, n]));
  const fill = (s?: CellState) => (s === 'hot' ? 'var(--accent)' : s === 'good' ? 'var(--ok-soft)' : s === 'hl' ? 'var(--accent-soft)' : s === 'bad' ? 'var(--err-soft)' : 'var(--bg)');
  const stroke = (s?: CellState) => (s === 'hot' || s === 'hl' ? 'var(--accent)' : s === 'good' ? 'var(--ok)' : s === 'bad' ? 'var(--err)' : 'var(--border-strong)');
  return (
    <div>
      <svg width={64 + maxX * W + 48} height={48 + maxY * H} role="img" aria-label="diagram">
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-3)" /></marker></defs>
        {f.edges.map(([a, b]) => {
          if (!byId[a] || !byId[b]) return null;
          const [x1, y1] = pos(byId[a]); const [x2, y2] = pos(byId[b]);
          const len = Math.hypot(x2 - x1, y2 - y1) || 1;
          const shrink = f.directed ? 16 / len : 0;
          return <line key={a + '>' + b} x1={x1} y1={y1} x2={x2 - (x2 - x1) * shrink} y2={y2 - (y2 - y1) * shrink} stroke="var(--border-strong)" strokeWidth={1} markerEnd={f.directed ? 'url(#arrow)' : undefined} />;
        })}
        {f.nodes.map((n) => {
          const [x, y] = pos(n);
          const w = Math.max(28, n.label.length * 7.5 + 12);
          return (
            <g key={n.id}>
              <rect x={x - w / 2} y={y - 12} width={w} height={24} rx={3} fill={fill(n.state)} stroke={stroke(n.state)} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fill={n.state === 'hot' ? 'var(--bg)' : 'var(--text)'}>{n.label}</text>
            </g>
          );
        })}
      </svg>
      <Side side={f.side} />
    </div>
  );
}

export interface PredictResult { correct: number; total: number }

export function hasVisual(topic: string) { return !!GENERATORS[topic]; }

export function Visualizer({ topic, predictMode = false, onFinish }: { topic: string; predictMode?: boolean; onFinish?: (r: PredictResult) => void }) {
  const gen = GENERATORS[topic];
  const frames = useMemo(() => gen?.make() ?? [], [gen]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  useEffect(() => { setI(0); setAnswers({}); setFinished(false); setPlaying(false); }, [topic, predictMode]);

  const f = frames[i];
  const needsAnswer = predictMode && !!f?.predict && answers[i] === undefined;
  const asked = Object.keys(answers).map(Number);
  const correct = asked.filter((k) => answers[k] === frames[k].predict!.answer).length;

  useEffect(() => {
    if (!playing) return;
    if (i >= frames.length - 1 || needsAnswer) { setPlaying(false); return; }
    const t = setTimeout(() => setI((x) => x + 1), 1400);
    return () => clearTimeout(t);
  }, [playing, i, frames.length, needsAnswer]);

  useEffect(() => {
    if (i === frames.length - 1 && frames.length && !finished && (!predictMode || frames.every((fr, k) => !fr.predict || answers[k] !== undefined || k === frames.length - 1))) {
      setFinished(true);
      const total = frames.filter((fr, k) => fr.predict && k < frames.length - 1).length;
      onFinish?.({ correct, total });
    }
  }, [i, frames, finished, predictMode, answers, correct, onFinish]);

  if (!gen) return <p className="faint small">No walkthrough for this topic.</p>;
  const prevQ = i > 0 && predictMode ? frames[i - 1].predict : undefined;
  const prevA = answers[i - 1];

  return (
    <div className="viz">
      <div className="panel-head">
        <span>{gen.title}</span>
        <span className="mono">{predictMode && asked.length > 0 ? `predictions ${correct}/${asked.length}, ` : ''}step {i + 1}/{frames.length}</span>
      </div>
      <div className="viz-stage">{renderFrame(f)}</div>
      {prevQ && prevA !== undefined && (
        <div className={`viz-caption small ${prevA === prevQ.answer ? '' : ''}`} style={{ color: prevA === prevQ.answer ? 'var(--ok)' : 'var(--err)', paddingBottom: 0 }}>
          {prevA === prevQ.answer ? <><Check size={13} /> You predicted correctly.</> : <><X size={13} /> You said "{prevQ.options[prevA]}", it was "{prevQ.options[prevQ.answer]}".</>}
        </div>
      )}
      <div className="viz-caption">{f.caption}</div>
      {needsAnswer && (
        <div className="viz-caption stack" style={{ background: 'var(--bg)' }}>
          <strong className="small">Predict: {f.predict!.q}</strong>
          <div className="row wrap">
            {f.predict!.options.map((o, k) => (
              <button key={k} className="btn sm" onClick={() => { setAnswers((a) => ({ ...a, [i]: k })); setI((x) => Math.min(frames.length - 1, x + 1)); }}>{o}</button>
            ))}
          </div>
        </div>
      )}
      <div className="viz-controls">
        <button className="btn sm" onClick={() => { setPlaying(false); setI((x) => Math.max(0, x - 1)); }} disabled={i === 0}><ChevronLeft size={14} /> Previous</button>
        <button className="btn sm" disabled={needsAnswer} onClick={() => { if (i >= frames.length - 1) setI(0); setPlaying((p) => !p); }}>
          {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play</>}
        </button>
        <button className="btn sm" onClick={() => { setPlaying(false); setI((x) => Math.min(frames.length - 1, x + 1)); }} disabled={i === frames.length - 1 || needsAnswer}>Next <ChevronRight size={14} /></button>
        <button className="icon-btn" title="Restart" onClick={() => { setPlaying(false); setI(0); setAnswers({}); setFinished(false); }}><RotateCcw size={13} /></button>
        {!predictMode && <input type="range" min={0} max={frames.length - 1} value={i} onChange={(e) => { setPlaying(false); setI(Number(e.target.value)); }} style={{ flex: 1 }} aria-label="Step" />}
        {predictMode && <span className="faint small" style={{ marginLeft: 'auto' }}>{needsAnswer ? 'Answer to continue' : ''}</span>}
      </div>
    </div>
  );
}
