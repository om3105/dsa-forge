import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Lock, LockOpen, RotateCcw } from 'lucide-react';
import { useCourse } from '../App';
import { actions } from '../store/store';
import { LC_QUESTIONS, questionState, type LcStatus } from '../lib/lcmap';
import { PATTERN_LABEL, TOPICS, TOPIC_BY_ID } from '../data/topics';
import { PROBLEM_BY_ID } from '../data/problems';
import { DiffTag } from '../components/ui';
import type { Difficulty } from '../types';

export const STATUS_TEXT: Record<LcStatus, string> = { locked: 'Locked', unlocked: 'Unlocked', solved: 'Solved', retry: 'Retry' };

export function StatusPill({ s }: { s: LcStatus }) {
  const icon = s === 'locked' ? <Lock size={11} /> : s === 'solved' ? <Check size={11} /> : s === 'retry' ? <RotateCcw size={11} /> : <LockOpen size={11} />;
  const color = s === 'solved' ? 'var(--ok)' : s === 'retry' ? 'var(--warn)' : s === 'unlocked' ? 'var(--accent-ink)' : 'var(--text-3)';
  return <span className="tag" style={{ color, borderColor: s === 'locked' ? undefined : color }}>{icon}{STATUS_TEXT[s]}</span>;
}

export default function LeetCodeMap() {
  const { course, c, settings } = useCourse();
  const [topic, setTopic] = useState('');
  const [pattern, setPattern] = useState('');
  const [diff, setDiff] = useState<'' | Difficulty>('');
  const [status, setStatus] = useState<'' | LcStatus>('');

  const rows = useMemo(() => LC_QUESTIONS.map((q) => ({ q, st: questionState(course, c, settings, q) })), [course, c, settings]);
  const shown = rows.filter(({ q, st }) => (!topic || q.topic === topic) && (!pattern || q.pattern === pattern) && (!diff || q.difficulty === diff) && (!status || st.status === status));
  const count = (s: LcStatus) => rows.filter((r) => r.st.status === s).length;

  // group: topic (in curriculum order) → pattern
  const groups = TOPICS.map((t) => {
    const inTopic = shown.filter((r) => r.q.topic === t.id);
    const patterns = [...new Set(inTopic.map((r) => r.q.pattern))];
    return { topic: t, patterns: patterns.map((p) => ({ pattern: p, rows: inTopic.filter((r) => r.q.pattern === p).sort((a, b) => a.q.day - b.q.day) })) };
  }).filter((g) => g.patterns.length);

  return (
    <div className="page wide" style={{ maxWidth: 1240 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">LeetCode question mapping</div>
          <h1>LeetCode Map</h1>
          <div className="muted small" style={{ marginTop: 4, maxWidth: 680 }}>
            Every question has a path: the concept lesson, the pattern template, warm-up problems in the editor, and a recall check. The LeetCode link unlocks only when the path is done.
          </div>
        </div>
        <div className="mono small muted" style={{ textAlign: 'right' }}>
          <div>{count('solved')} solved, {count('retry')} retry, {count('unlocked')} unlocked, {count('locked')} locked</div>
          <label className="row" style={{ justifyContent: 'flex-end', marginTop: 6, cursor: 'pointer' }} title="For topics you already know: unlock by passing a 5-card concept quiz instead of the full path.">
            <input type="checkbox" checked={settings.skipLock} onChange={(e) => actions.setSettings({ skipLock: e.target.checked })} />
            <span style={{ fontFamily: 'var(--sans)' }}>Skip lock via concept quiz</span>
          </label>
        </div>
      </div>

      <div className="row wrap" style={{ marginBottom: 16 }}>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
          <option value="">All topics</option>
          {TOPICS.filter((t) => LC_QUESTIONS.some((q) => q.topic === t.id)).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <select value={pattern} onChange={(e) => setPattern(e.target.value)} aria-label="Pattern">
          <option value="">All patterns</option>
          {[...new Set(LC_QUESTIONS.map((q) => q.pattern))].map((p) => <option key={p} value={p}>{PATTERN_LABEL[p] ?? p}</option>)}
        </select>
        <select value={diff} onChange={(e) => setDiff(e.target.value as Difficulty | '')} aria-label="Difficulty">
          <option value="">Any difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <div className="seg" role="group" aria-label="Status">
          {(['', 'locked', 'unlocked', 'retry', 'solved'] as const).map((s) => <button key={s || 'all'} aria-pressed={status === s} onClick={() => setStatus(s)}>{s ? STATUS_TEXT[s] : 'All'}</button>)}
        </div>
        <span className="faint small mono" style={{ marginLeft: 'auto' }}>{shown.length} of {LC_QUESTIONS.length}</span>
      </div>

      {groups.length === 0 && <div className="empty">No questions match these filters.</div>}
      {groups.map((g) => (
        <section key={g.topic.id} style={{ marginBottom: 28 }}>
          <div className="section-title"><h2>{g.topic.title}</h2><Link to={`/lessons/${g.topic.id}`} className="small">lesson</Link></div>
          {g.patterns.map((pg) => (
            <div key={pg.pattern} style={{ marginBottom: 12 }}>
              <div className="eyebrow" style={{ margin: '8px 0 4px' }}>{PATTERN_LABEL[pg.pattern] ?? pg.pattern}</div>
              <div className="list">
                {pg.rows.map(({ q, st }) => (
                  <Link key={q.id} to={`/leetcode/${q.id}`} className="list-row" style={{ color: 'inherit', flexWrap: 'wrap', rowGap: 4 }}>
                    <span className="row grow" style={{ flexWrap: 'wrap', gap: 6, minWidth: 260 }}>
                      {q.concepts.map((t, ti) => (
                        <span key={t} className="tag" style={c.lessonsDone[t] ? { color: 'var(--ok)', borderColor: 'var(--ok)' } : undefined} title={`Concept: ${TOPIC_BY_ID[t]?.title}`}>
                          {c.lessonsDone[t] ? <Check size={10} /> : null}{TOPIC_BY_ID[t]?.title}{ti < q.concepts.length - 1 ? ',' : ''}
                        </span>
                      ))}
                      <ChevronRight size={12} className="faint" />
                      {q.warmups.map((w, wi) => (
                        <span key={w} className="tag" style={c.problems[w]?.passedAt ? { color: 'var(--ok)', borderColor: 'var(--ok)' } : undefined} title="Warm-up (built-in editor)">
                          {c.problems[w]?.passedAt ? <Check size={10} /> : null}{PROBLEM_BY_ID[w]?.title}{wi < q.warmups.length - 1 ? ',' : ''}
                        </span>
                      ))}
                      <ChevronRight size={12} className="faint" />
                      <span style={{ fontWeight: 500 }}>{q.number}. {q.title}</span>
                    </span>
                    <span className="row" style={{ gap: 8 }}>
                      <span className="mono small faint" title="Prerequisite steps done">{st.doneCount}/{st.total}</span>
                      <DiffTag d={q.difficulty} />
                      <span className="faint small mono hide-sm">day {q.day}</span>
                      <StatusPill s={st.status} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
