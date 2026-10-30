import { Link } from 'react-router-dom';
import { Code2, Lock, Route } from 'lucide-react';
import type { Problem, ProblemLog } from '../types';
import { PATTERN_LABEL } from '../data/topics';
import { LC_BY_ID, questionState } from '../lib/lcmap';
import { useApp } from '../store/store';
import { DiffTag, StatusDot } from './ui';

/** Built-in problems open in the editor; LeetCode-only ones open their prerequisite path (the link is gated there). */
export function problemHref(p: Problem) {
  if (p.builtin) return `/problem/${p.id}`;
  return LC_BY_ID[p.id] ? `/leetcode/${p.id}` : `/problems?open=${p.id}`;
}

export function ProblemRow({ p, log, showTopic }: { p: Problem; log?: ProblemLog; showTopic?: string }) {
  const app = useApp();
  const course = app.settings.lastCourse ?? 'python';
  const q = LC_BY_ID[p.id];
  const st = q ? questionState(course, app.courses[course], app.settings, q) : undefined;
  return (
    <div className="list-row">
      <StatusDot s={log?.status ?? 'not-started'} />
      <Link to={problemHref(p)} className="grow" style={{ color: 'var(--text)' }}>
        {p.title}
        {showTopic && <span className="faint small">, {showTopic}</span>}
      </Link>
      <span className="tag hide-sm">{PATTERN_LABEL[p.pattern] ?? p.pattern}</span>
      <DiffTag d={p.difficulty} />
      {p.builtin && <Link to={`/problem/${p.id}`} className="btn sm" title="Open in the editor (tests included)"><Code2 size={13} /> Solve</Link>}
      {q && (st?.unlocked
        ? <Link to={`/leetcode/${p.id}`} className="btn sm ghost" title={`LeetCode #${q.number}`}><Route size={13} /> LeetCode</Link>
        : <Link to={`/leetcode/${p.id}`} className="lock-chip" title={`LeetCode #${q.number} unlocks after its prerequisites`}><Lock size={11} /> {st?.doneCount}/{st?.total}</Link>)}
    </div>
  );
}
