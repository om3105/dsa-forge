import { useEffect, useState } from 'react';
import type { CourseId, Problem, ProblemLog, ProblemStatus } from '../types';
import { actions, useApp } from '../store/store';
import { PATTERN_LABEL } from '../data/topics';
import { ConfidencePicker, STATUS_LABEL, toast } from './ui';

const STATUSES: ProblemStatus[] = ['not-started', 'attempted', 'solved', 'solved-with-help'];

/** The per-problem log: status, time, pattern, own explanation, confidence. Saved explicitly. */
export function ProblemLogForm({ course, p, defaultMinutes, onSaved }: { course: CourseId; p: Problem; defaultMinutes?: number; onSaved?: () => void }) {
  const app = useApp();
  const log: ProblemLog | undefined = app.courses[course].problems[p.id];
  const [status, setStatus] = useState<ProblemStatus>(log?.status ?? 'not-started');
  const [minutes, setMinutes] = useState<string>(log?.minutes != null ? String(log.minutes) : defaultMinutes ? String(defaultMinutes) : '');
  const [pattern, setPattern] = useState(log?.pattern ?? '');
  const [explanation, setExplanation] = useState(log?.explanation ?? '');
  const [confidence, setConfidence] = useState<number | undefined>(log?.confidence);

  useEffect(() => {
    setStatus(log?.status ?? 'not-started');
    setMinutes(log?.minutes != null ? String(log.minutes) : defaultMinutes ? String(defaultMinutes) : '');
    setPattern(log?.pattern ?? '');
    setExplanation(log?.explanation ?? '');
    setConfidence(log?.confidence);
    // only when switching problems
  }, [p.id, course]);

  useEffect(() => {
    if (defaultMinutes && !log?.minutes) setMinutes(String(defaultMinutes));
  }, [defaultMinutes]);

  const solvedish = status === 'solved' || status === 'solved-with-help';
  const save = () => {
    if (solvedish && !confidence) { toast('Pick a confidence (1–5) so the review schedule knows how soon to bring it back.'); return; }
    actions.logProblem(course, p.id, {
      status,
      minutes: minutes ? Number(minutes) : undefined,
      pattern: pattern || undefined,
      explanation: explanation.trim() || undefined,
      confidence,
    });
    toast(solvedish ? 'Saved. Scheduled for spaced review.' : 'Saved.');
    onSaved?.();
  };

  return (
    <div className="stack-16">
      <label className="field">
        <span>Status</span>
        <div className="seg" role="group">
          {STATUSES.map((s) => <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>{STATUS_LABEL[s]}</button>)}
        </div>
      </label>
      <div className="row wrap" style={{ gap: 16, alignItems: 'flex-end' }}>
        <label className="field" style={{ width: 120 }}>
          <span>Time (min)</span>
          <input type="number" min={0} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="mono" />
        </label>
        <label className="field grow">
          <span>Pattern used</span>
          <select value={pattern} onChange={(e) => setPattern(e.target.value)}>
            <option value="">—</option>
            {Object.entries(PATTERN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Confidence {solvedish && <span className="faint">(required when solved)</span>}</span>
        <ConfidencePicker value={confidence} onChange={setConfidence} />
        <span className="faint small">1 = could not redo it, 3 = okay, 5 = could teach it. Low confidence comes back sooner.</span>
      </label>
      <label className="field">
        <span>Your approach in one paragraph</span>
        <textarea rows={6} value={explanation} onChange={(e) => setExplanation(e.target.value)}
          placeholder="Brute force was … The key insight is … so I used … Time O(…), space O(…). Edge cases: …" />
        <span className="faint small">Shown to you during review after you try to recall it. Write it for future-you.</span>
      </label>
      <div className="row">
        <button className="btn primary" onClick={save}>Save log</button>
        {log && <span className="faint small">{log.attempts} submit{log.attempts === 1 ? '' : 's'}, {log.wrong} wrong/help</span>}
      </div>
    </div>
  );
}
