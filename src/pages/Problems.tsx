import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Code2, Route, X } from 'lucide-react';
import { useCourse } from '../App';
import { PROBLEMS, PROBLEM_BY_ID } from '../data/problems';
import { PATTERN_LABEL, TOPICS, TOPIC_BY_ID } from '../data/topics';
import { helpList } from '../lib/stats';
import { LC_BY_ID } from '../lib/lcmap';
import { problemHref } from '../components/ProblemRow';
import { ProblemLogForm } from '../components/ProblemLogForm';
import { DiffTag, Kbd, STATUS_LABEL, StatusDot } from '../components/ui';
import type { Difficulty, ProblemStatus } from '../types';

export default function Problems() {
  const { course, c } = useCourse();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'help' ? 'help' : 'all';
  const openId = params.get('open');
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('');
  const [pattern, setPattern] = useState('');
  const [diff, setDiff] = useState<'' | Difficulty>('');
  const [status, setStatus] = useState<'' | ProblemStatus>('');
  const [source, setSource] = useState<'' | 'builtin' | 'external'>('');
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        search.current?.focus();
      }
      if (e.key === 'Escape' && openId) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PROBLEMS.filter((p) => {
      const st = c.problems[p.id]?.status ?? 'not-started';
      return (!needle || p.title.toLowerCase().includes(needle) || p.summary.toLowerCase().includes(needle))
        && (!topic || p.topic === topic)
        && (!pattern || p.pattern === pattern || c.problems[p.id]?.pattern === pattern)
        && (!diff || p.difficulty === diff)
        && (!status || st === status)
        && (!source || (source === 'builtin') === p.builtin);
    });
  }, [q, topic, pattern, diff, status, source, c.problems]);

  const help = helpList(c);
  // confidence / time / tries columns only appear once something has been logged
  const anyLogged = Object.values(c.problems).some((l) => l.attempts > 0 || l.confidence != null || l.minutes != null);
  const open = (id: string) => { params.set('open', id); setParams(params, { replace: true }); };
  const close = () => { params.delete('open'); setParams(params, { replace: true }); };
  const setTab = (t: string) => { if (t === 'all') params.delete('tab'); else params.set('tab', t); setParams(params, { replace: true }); };
  const openP = openId ? PROBLEM_BY_ID[openId] : undefined;
  const counts = { solved: 0, help: 0, attempted: 0 };
  for (const l of Object.values(c.problems)) {
    if (l.status === 'solved') counts.solved++;
    else if (l.status === 'solved-with-help') counts.help++;
    else if (l.status === 'attempted') counts.attempted++;
  }

  return (
    <div className="page wide" style={{ maxWidth: 1280 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Problem tracker</div>
          <h1>Problems</h1>
          <div className="muted small mono" style={{ marginTop: 4 }}>
            {counts.solved} solved, {counts.help} with help, {counts.attempted} attempted, {PROBLEMS.length} total
          </div>
        </div>
        <div className="tabs" style={{ border: 0, padding: 0 }} role="tablist">
          <button role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>All problems</button>
          <button role="tab" aria-selected={tab === 'help'} onClick={() => setTab('help')}>Wrong / needed help ({help.length})</button>
        </div>
      </div>

      {tab === 'all' && (
        <>
          <div className="row wrap" style={{ marginBottom: 12 }}>
            <input ref={search} type="search" placeholder="Search problems" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
            <Kbd>/</Kbd>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
              <option value="">All topics</option>
              {TOPICS.filter((t) => t.id !== 'mock' && PROBLEMS.some((p) => p.topic === t.id)).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <select value={pattern} onChange={(e) => setPattern(e.target.value)} aria-label="Pattern">
              <option value="">All patterns</option>
              {Object.entries(PATTERN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={diff} onChange={(e) => setDiff(e.target.value as Difficulty | '')} aria-label="Difficulty">
              <option value="">Any difficulty</option>
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProblemStatus | '')} aria-label="Status">
              <option value="">Any status</option>
              {(Object.keys(STATUS_LABEL) as ProblemStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select value={source} onChange={(e) => setSource(e.target.value as '' | 'builtin' | 'external')} aria-label="Source">
              <option value="">Built-in + external</option>
              <option value="builtin">Built-in (runnable here)</option>
              <option value="external">External links</option>
            </select>
            <span className="faint small mono" style={{ marginLeft: 'auto' }}>{rows.length} shown</span>
          </div>
          <table className="t">
            <thead>
              <tr>
                <th style={{ width: 24 }} />
                <th>Problem</th>
                <th className="hide-sm">Topic</th>
                <th className="hide-sm">Pattern</th>
                <th>Level</th>
                {anyLogged && <th className="num">Conf.</th>}
                {anyLogged && <th className="num hide-sm">Time</th>}
                {anyLogged && <th className="num hide-sm">Tries</th>}
                <th style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const l = c.problems[p.id];
                return (
                  <tr key={p.id} className={`clickable${openId === p.id ? ' selected' : ''}`} onClick={() => open(p.id)}>
                    <td><StatusDot s={l?.status ?? 'not-started'} /></td>
                    <td>{p.title}{l?.helpUsed && <span className="tag" style={{ marginLeft: 6 }} title="A hint was revealed">help used</span>}</td>
                    <td className="muted small hide-sm">{TOPIC_BY_ID[p.topic]?.title}</td>
                    <td className="hide-sm"><span className="tag">{PATTERN_LABEL[l?.pattern ?? p.pattern] ?? p.pattern}</span></td>
                    <td><DiffTag d={p.difficulty} /></td>
                    {anyLogged && <td className="num">{l?.confidence ?? ''}</td>}
                    {anyLogged && <td className="num hide-sm">{l?.minutes != null ? `${l.minutes}m` : ''}</td>}
                    {anyLogged && <td className="num hide-sm">{l?.attempts || ''}</td>}
                    <td onClick={(e) => e.stopPropagation()}>
                      {p.builtin
                        ? <Link to={`/problem/${p.id}`} className="icon-btn" title="Open in editor"><Code2 size={15} /></Link>
                        : <Link to={problemHref(p)} className="icon-btn" title="Prerequisite path and LeetCode link"><Route size={14} /></Link>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty">No problems match these filters.</div>}
        </>
      )}

      {tab === 'help' && (
        <>
          <p className="muted small" style={{ maxWidth: 680 }}>
            Problems you attempted without solving, needed help with, rated low confidence, or failed in review, ordered by how urgently to re-solve
            (wrong count, help, low confidence, time since last touch). A problem leaves this list once it survives two spaced reviews rated Good or Easy.
          </p>
          {help.length === 0 ? <div className="empty">Nothing here yet. That is either very good or you have not logged anything.</div> : (
            <table className="t">
              <thead><tr><th>#</th><th>Problem</th><th>Status</th><th className="num">Wrong</th><th className="num">Conf.</th><th className="hide-sm">Your note</th><th /></tr></thead>
              <tbody>
                {help.map(({ problem: p, log }, i) => (
                  <tr key={p.id} className="clickable" onClick={() => open(p.id)}>
                    <td className="mono faint">{i + 1}</td>
                    <td>{p.title} <DiffTag d={p.difficulty} /></td>
                    <td className="small">{STATUS_LABEL[log.status]}</td>
                    <td className="num">{log.wrong}</td>
                    <td className="num">{log.confidence ?? '–'}</td>
                    <td className="small muted hide-sm" style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.explanation ?? '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Link className="btn sm" to={problemHref(p)}>Re-solve</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {openP && (
        <>
          <div className="scrim" onClick={close} />
          <aside className="drawer" aria-label="Problem log">
            <div className="drawer-head">
              <div>
                <div className="eyebrow">{TOPIC_BY_ID[openP.topic]?.title}, {PATTERN_LABEL[openP.pattern]}</div>
                <h2>{openP.title}</h2>
              </div>
              <button className="icon-btn" onClick={close} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="drawer-body stack-16">
              <p className="muted">{openP.summary}</p>
              <div className="row">
                <DiffTag d={openP.difficulty} />
                {openP.builtin
                  ? <Link className="btn sm primary" to={`/problem/${openP.id}`}><Code2 size={13} /> Open in editor</Link>
                  : null}
                {LC_BY_ID[openP.id] && <Link className={`btn sm${openP.builtin ? '' : ' primary'}`} to={`/leetcode/${openP.id}`}><Route size={13} /> LeetCode #{LC_BY_ID[openP.id].number} path</Link>}
                <span className="faint small">{openP.builtin ? 'tests included' : 'link unlocks after the prerequisites'}</span>
              </div>
              <hr />
              <ProblemLogForm course={course} p={openP} />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
