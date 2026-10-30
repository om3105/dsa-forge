import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCourse } from '../App';
import { actions } from '../store/store';
import { TOPICS, TOPIC_BY_ID } from '../data/topics';
import { PROBLEM_BY_ID } from '../data/problems';
import { hasLesson } from '../data/lessons';
import { Md } from '../components/ui';

const TEMPLATE = `## The pattern in my words

## How I recognise it

## Template I remember

## Mistakes I made
`;

export default function Notes() {
  const { course, c } = useCourse();
  const [params, setParams] = useSearchParams();
  const topic = params.get('topic') ?? TOPICS[0].id;
  const [q, setQ] = useState('');
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState(c.notes[topic] ?? '');

  useEffect(() => { setDraft(c.notes[topic] ?? ''); setPreview(false); }, [topic, course]);
  useEffect(() => {
    if (draft === (c.notes[topic] ?? '')) return;
    const t = setTimeout(() => actions.setNote(course, topic, draft), 400);
    return () => clearTimeout(t);
  }, [draft, topic, course, c.notes]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out: { kind: 'note' | 'problem'; id: string; title: string; snippet: string }[] = [];
    const snip = (text: string) => {
      const i = text.toLowerCase().indexOf(needle);
      return (i > 40 ? '…' : '') + text.slice(Math.max(0, i - 40), i + needle.length + 60).replace(/\n/g, ' ') + '…';
    };
    for (const [tid, text] of Object.entries(c.notes)) {
      if (text.toLowerCase().includes(needle) || TOPIC_BY_ID[tid]?.title.toLowerCase().includes(needle)) out.push({ kind: 'note', id: tid, title: TOPIC_BY_ID[tid]?.title ?? tid, snippet: snip(text) });
    }
    for (const [pid, log] of Object.entries(c.problems)) {
      if (log.explanation?.toLowerCase().includes(needle)) out.push({ kind: 'problem', id: pid, title: PROBLEM_BY_ID[pid]?.title ?? pid, snippet: snip(log.explanation) });
    }
    return out;
  }, [q, c.notes, c.problems]);

  return (
    <div className="page wide" style={{ maxWidth: 1200 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Your own words</div>
          <h1>Notes</h1>
        </div>
        <input type="search" placeholder="Search notes and problem explanations" value={q} onChange={(e) => setQ(e.target.value)} className="notes-search" />
      </div>

      {q.trim() ? (
        <section>
          <div className="section-title"><h2>{results.length} result(s) in this course</h2></div>
          <div className="list">
            {results.map((r) => (
              <Link key={r.kind + r.id} to={r.kind === 'note' ? `/notes?topic=${r.id}` : `/problems?open=${r.id}`} className="list-row" onClick={() => setQ('')} style={{ alignItems: 'flex-start' }}>
                <span className="tag" style={{ width: 64, justifyContent: 'center' }}>{r.kind}</span>
                <div className="grow"><div style={{ fontWeight: 500 }}>{r.title}</div><div className="muted small">{r.snippet}</div></div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="notes-layout">
          <nav className="list" style={{ alignSelf: 'start' }}>
            {TOPICS.filter((t) => hasLesson(t.id)).map((t) => (
              <button key={t.id} className="list-row" onClick={() => setParams({ topic: t.id })}
                style={{ all: 'unset', display: 'flex', gap: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 13, background: t.id === topic ? 'var(--bg-sunk)' : undefined, boxShadow: t.id === topic ? 'inset 2px 0 0 var(--accent)' : undefined, borderBottom: '1px solid var(--border)' }}>
                <span className="grow">{t.title}</span>
                {c.notes[t.id]?.trim() ? <span className="dot solved" title="has notes" /> : null}
              </button>
            ))}
          </nav>
          <div className="stack">
            <div className="spread">
              <h2>{TOPIC_BY_ID[topic]?.title}</h2>
              <div className="row">
                <Link className="btn sm ghost" to={`/lessons/${topic}`}>Open lesson</Link>
                {!draft && <button className="btn sm" onClick={() => setDraft(TEMPLATE)}>Use template</button>}
                <div className="seg">
                  <button aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button>
                  <button aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
                </div>
              </div>
            </div>
            {preview ? (
              <div className="panel panel-pad prose" style={{ minHeight: 400 }}>{draft.trim() ? <Md text={draft} lang={course} /> : <p className="faint">Nothing written yet.</p>}</div>
            ) : (
              <textarea className="mono" style={{ minHeight: 480 }} value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder={'Write the pattern in your own words. Markdown-lite: ## headings, - lists, `code`, ``` code blocks ```.\nSaved automatically.'} />
            )}
            <div className="faint small">Saved automatically, shown during concept reviews.</div>
          </div>
        </div>
      )}
    </div>
  );
}
