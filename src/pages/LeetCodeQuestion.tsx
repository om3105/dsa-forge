import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Circle, ExternalLink, Lightbulb, Lock } from 'lucide-react';
import { useCourse } from '../App';
import { actions, loadCode, snapshotCode } from '../store/store';
import { LC_BY_ID, pickCards, questionState, retrySuggestion, templateSolves, type Step } from '../lib/lcmap';
import { getLesson, PACKS } from '../data/lessons';
import { PATTERN_LABEL, TOPIC_BY_ID } from '../data/topics';
import { RecallQuiz } from '../components/RecallQuiz';
import { Bar, CodeBlock, ConfidencePicker, DiffTag, Inline, formatDate, toast } from '../components/ui';
import { StatusPill } from './LeetCodeMap';
import type { CourseId, CourseState, LcQuestion } from '../types';

type Result = 'solved' | 'solved-with-help' | 'couldnt';

export default function LeetCodeQuestion() {
  const { id = '' } = useParams();
  const { course, c, settings } = useCourse();
  const q = LC_BY_ID[id];
  if (!q) return <div className="page"><p>Question not found.</p><Link to="/leetcode">LeetCode Map</Link></div>;
  const st = questionState(course, c, settings, q);
  const log = c.problems[q.id];

  return (
    <div className="page" style={{ maxWidth: 1080 }}>
      <div className="row small faint" style={{ marginBottom: 8 }}>
        <Link to="/leetcode" className="row" style={{ gap: 4 }}><ArrowLeft size={13} /> LeetCode Map</Link>
        <span>/</span><span>{TOPIC_BY_ID[q.topic]?.title}</span><span>· roadmap day {q.day}</span>
      </div>
      <div className="page-head" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow">LeetCode #{q.number}</div>
          <h1>{q.title}</h1>
          <p className="muted" style={{ margin: '6px 0 8px', maxWidth: 640 }}>{q.summary}</p>
          <div className="row wrap">
            <DiffTag d={q.difficulty} />
            <span className="tag">{PATTERN_LABEL[q.pattern] ?? q.pattern}</span>
            {q.premium && <span className="tag" title="Requires LeetCode Premium">Premium</span>}
            <StatusPill s={st.status} />
          </div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="spread small"><span className="muted">Prerequisite path</span><span className="mono">{st.doneCount} of {st.total} done</span></div>
          <Bar value={st.doneCount} max={st.total} />
          {st.skipped && !st.pathComplete && <div className="faint small" style={{ marginTop: 4 }}>Unlocked via concept quiz</div>}
          {st.viaFlow && !st.pathComplete && !st.skipped && <div className="faint small" style={{ marginTop: 4 }}>Unlocked by the topic's learning stages</div>}
        </div>
      </div>

      <div className="cols cols-wide-aside">
        <section className="stack-16">
          <div className="section-title"><h2>Prerequisite path</h2></div>
          {st.steps.map((s, i) => <StepPanel key={s.key} n={i + 1} step={s} q={q} course={course} c={c} />)}
          <ToolsPanel q={q} course={course} />
        </section>

        <aside className="stack-16">
          {!st.unlocked ? (
            <LockedPanel q={q} course={course} skipLock={settings.skipLock} remaining={st.total - st.doneCount} />
          ) : (
            <>
              <div className="panel panel-pad stack">
                <div className="spread"><span className="eyebrow">Unlocked</span><span className="mono small faint">#{q.number}</span></div>
                <a className="btn primary" href={q.url} target="_blank" rel="noreferrer" style={{ height: 36 }}>
                  <ExternalLink size={14} /> Solve on LeetCode
                </a>
                {q.premium && q.altUrl && (
                  <p className="small muted" style={{ margin: 0 }}>This is a LeetCode Premium question. Without Premium, the same problem is free on <a href={q.altUrl} target="_blank" rel="noreferrer">NeetCode ↗</a>.</p>
                )}
                <p className="small faint" style={{ margin: 0 }}>Opens in a new tab. Time yourself; come back here to log the result.</p>
              </div>
              <HintLadder q={q} course={course} c={c} />
              <ResultForm q={q} course={course} c={c} />
            </>
          )}
          {log?.lcResult === 'couldnt' && <RetryPanel q={q} course={course} c={c} />}
        </aside>
      </div>
    </div>
  );
}

function StepPanel({ n, step, q, course, c }: { n: number; step: Step; q: LcQuestion; course: CourseId; c: CourseState }) {
  const [open, setOpen] = useState(!step.done);
  const lesson = q.patternTemplate ? getLesson(course, q.patternTemplate) : undefined;
  return (
    <div className="panel">
      <button className="panel-head" style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', width: '100%', boxSizing: 'border-box', cursor: 'pointer', borderBottom: open ? '1px solid var(--border)' : undefined }} onClick={() => setOpen(!open)}>
        {step.done ? <Check size={15} className="done-check" /> : <Circle size={15} className="faint" />}
        <span className="mono faint small">{String.fromCharCode(96 + n)}.</span>
        <span style={{ fontWeight: 500 }} className="grow">{step.title}</span>
        <span className="small faint">{step.done ? 'done' : `${step.items.filter((x) => x.done).length}/${step.items.length}`}</span>
      </button>
      {open && (
        <div className="panel-pad stack">
          {step.key === 'concepts' && step.items.map((it) => (
            <div key={it.id} className="row">
              {it.done ? <Check size={14} className="done-check" /> : <span className="dot" />}
              <Link to={it.href!} className="grow">{it.label}</Link>
              {it.done ? <span className="faint small">completed {formatDate(c.lessonsDone[it.id])}</span>
                : <Link className="btn sm" to={it.href!}>Do Stage 1: Understand</Link>}
            </div>
          ))}
          {step.key === 'concepts' && !step.done && <p className="small faint" style={{ margin: 0 }}>A concept counts once you pass its Stage 1 concept check (2 of 3). Finishing the topic's stages 1–5 unlocks this question directly.</p>}

          {step.key === 'template' && lesson?.lang?.template && (
            <>
              {templateSolves(course, q) ? (
                <>
                  <p className="small muted" style={{ margin: 0 }}>
                    The {TOPIC_BY_ID[q.patternTemplate!]?.title} lesson's template happens to be a worked solution of this exact question, so it is not shown here.
                    Review the pattern itself instead, then write the template from memory in the scratchpad:
                  </p>
                  <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>
                    {(lesson.concept?.approach ?? []).map((a) => <li key={a}><Inline text={a} /></li>)}
                  </ol>
                  <div className="small"><span className="faint">Signals: </span>{(lesson.concept?.signals ?? []).join(', ')}</div>
                </>
              ) : (
                <>
                  <CodeBlock code={lesson.lang.template} lang={course} label={`${PACKS[course].name}, ${lesson.lang.templateTitle ?? 'template'}`} />
                  <p className="small muted" style={{ margin: 0 }}>Read it line by line and say what each part does. Better: close it and rewrite it in the scratchpad.</p>
                </>
              )}
              {step.done ? <span className="faint small">Reviewed {formatDate(c.templatesReviewed[q.patternTemplate!])}</span>
                : <div><button className="btn sm primary" onClick={() => actions.markTemplateReviewed(course, q.patternTemplate!)}>Mark template reviewed</button></div>}
            </>
          )}

          {step.key === 'warmups' && (
            <>
              {step.items.map((it) => {
                const l = c.problems[it.id];
                return (
                  <div key={it.id} className="row">
                    {it.done ? <Check size={14} className="done-check" /> : <span className="dot" />}
                    <span className="grow">{it.label}</span>
                    <span className="faint small">{it.done ? 'all tests passed' : l?.attempts ? `${l.attempts} submit(s), not all passing` : 'not attempted'}</span>
                    <Link className="btn sm" to={it.href!}>{it.done ? 'Open' : 'Solve in editor'}</Link>
                  </div>
                );
              })}
              <p className="small faint" style={{ margin: 0 }}>A warm-up counts once a Submit passes every test, including the hidden ones.</p>
            </>
          )}

          {step.key === 'recall' && (step.done
            ? <span className="faint small">Passed {formatDate(c.recall[q.id])}</span>
            : <RecallStep q={q} course={course} />)}
        </div>
      )}
    </div>
  );
}

function RecallStep({ q, course }: { q: LcQuestion; course: CourseId }) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const cards = useMemo(() => pickCards(course, q.concepts, 3, `${q.id}:${attempt}`), [course, q, attempt]);
  return (
    <div className="stack">
      <RecallQuiz key={attempt} cards={cards} passMark={Math.min(2, cards.length)}
        intro="Three cards from this question's concepts. Recall at least two to pass."
        onDone={(passed, missed) => { actions.finishRecall(course, q.id, passed, missed.map((m) => m.id)); setFailed(!passed); }} />
      {failed && <div><button className="btn sm" onClick={() => { setFailed(false); setAttempt((a) => a + 1); }}>Try three different cards</button></div>}
    </div>
  );
}

function ToolsPanel({ q, course }: { q: LcQuestion; course: CourseId }) {
  return (
    <div className="panel panel-pad">
      <div className="io-label" style={{ marginTop: 0 }}>{PACKS[course].name} tools you will need</div>
      <div className="row wrap" style={{ gap: 6 }}>{q.tools[course].map((t) => <code key={t}>{t}</code>)}</div>
      <p className="small faint" style={{ margin: '8px 0 0' }}>Unsure about one? See <Link to="/lessons/lang-collections">Built-in data structures</Link>.</p>
    </div>
  );
}

function LockedPanel({ q, course, skipLock, remaining }: { q: LcQuestion; course: CourseId; skipLock: boolean; remaining: number }) {
  const [quiz, setQuiz] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cards = useMemo(() => pickCards(course, q.concepts, 5, `skip:${q.id}:${attempt}`), [course, q, attempt]);
  return (
    <div className="panel panel-pad stack">
      <div className="row"><Lock size={16} /><h2 style={{ fontSize: 15 }}>LeetCode link locked</h2></div>
      <p className="small muted" style={{ margin: 0 }}>
        {remaining} step{remaining === 1 ? '' : 's'} left before the LeetCode link opens. They cover the pattern this question uses.
      </p>
      {skipLock && !quiz && (
        <div className="stack">
          <p className="small faint" style={{ margin: 0 }}>Skip lock is on. If you already know {q.concepts.map((t) => TOPIC_BY_ID[t]?.title).join(' and ')}, pass a 5-card quiz (4/5) to unlock every question built only on these concepts.</p>
          <div><button className="btn sm" onClick={() => setQuiz(true)}>Take the concept quiz</button></div>
        </div>
      )}
      {skipLock && quiz && (
        <>
          <RecallQuiz key={attempt} cards={cards} passMark={Math.min(4, cards.length)}
            onDone={(passed, missed) => {
              actions.finishRecall(course, `skip:${q.id}`, false, missed.map((m) => m.id));
              if (passed) { actions.passSkipQuiz(course, q.concepts); toast('Concept quiz passed. The question is unlocked.'); }
            }} />
          <div><button className="btn sm ghost" onClick={() => setAttempt((a) => a + 1)}>New quiz</button></div>
        </>
      )}
      {!skipLock && <p className="small faint" style={{ margin: 0 }}>Already know this topic? Turn on "Skip lock" on the LeetCode Map page or in Settings.</p>}
    </div>
  );
}

function HintLadder({ q, course, c }: { q: LcQuestion; course: CourseId; c: CourseState }) {
  const used = c.hintsUsed[q.id] ?? 0;
  return (
    <div className="panel panel-pad stack">
      <div className="spread"><span className="row" style={{ gap: 6 }}><Lightbulb size={14} /><strong className="small">Hint ladder</strong></span><span className="mono small faint">{used}/3 revealed</span></div>
      {q.hints.slice(0, used).map((h, i) => (
        <div key={i} className="small note"><span className="faint">Hint {i + 1}. </span>{h}</div>
      ))}
      {used < 3 ? (
        <div><button className="btn sm" onClick={() => actions.revealHint(course, q.id, used + 1)}>Reveal hint {used + 1}</button>
          <span className="faint small"> {used === 0 ? 'try for 15–20 minutes first' : 'one at a time'}</span></div>
      ) : <p className="small faint" style={{ margin: 0 }}>That's all the hints. There is no full solution here. If you are still stuck, log "Couldn't solve" and the app schedules a retry.</p>}
      {used === 0 && <p className="small faint" style={{ margin: 0 }}>Hidden by default. Revealing any hint marks "help used" in the tracker and logs the result as "Solved with help".</p>}
    </div>
  );
}

function ResultForm({ q, course, c }: { q: LcQuestion; course: CourseId; c: CourseState }) {
  const log = c.problems[q.id];
  const used = c.hintsUsed[q.id] ?? 0;
  const [result, setResult] = useState<Result | null>(null);
  const [minutes, setMinutes] = useState('');
  const [confidence, setConfidence] = useState<number | undefined>();
  const [explanation, setExplanation] = useState(log?.explanation ?? '');
  const [code, setCode] = useState('');
  // reload the saved explanation only when switching questions
  useEffect(() => { setExplanation(log?.explanation ?? ''); }, [q.id]);
  const options: [Result, string][] = [['solved', 'Solved'], ['solved-with-help', 'Solved with help'], ['couldnt', "Couldn't solve"]];

  const save = async () => {
    if (!result) return;
    if (result !== 'couldnt' && !confidence) { toast('Pick a confidence (1–5) so the review schedule knows how soon to bring it back.'); return; }
    if (code.trim()) {
      await loadCode(course, q.id); // make sure earlier history is loaded before appending
      snapshotCode(course, q.id, code.replace(/\s+$/, '') + '\n', 0, 0, 'leetcode');
    }
    actions.recordLeetCode(course, q.id, { result, minutes: minutes ? Number(minutes) : undefined, confidence, explanation, pattern: q.pattern });
    toast(result === 'couldnt' ? 'Logged. Retry scheduled in 2 days.' : 'Logged and scheduled for spaced review.');
    setResult(null); setCode(''); setMinutes('');
  };

  return (
    <div className="panel panel-pad stack-16">
      <div className="spread">
        <strong className="small">After LeetCode: log the result</strong>
        {log?.lcAt && <span className="faint small">last: {log.lcResult === 'couldnt' ? "couldn't solve" : log.lcResult?.replace(/-/g, ' ')}, {formatDate(log.lcAt)}</span>}
      </div>
      <div className="seg" role="group" style={{ flexWrap: 'wrap' }}>
        {options.map(([k, label]) => <button key={k} aria-pressed={result === k} onClick={() => setResult(k)}>{label}</button>)}
      </div>
      {result && (
        <>
          <div className="row wrap" style={{ gap: 16, alignItems: 'flex-end' }}>
            <label className="field" style={{ width: 110 }}><span>Time (min)</span><input type="number" min={0} className="mono" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
            {result !== 'couldnt' && <label className="field"><span>Confidence</span><ConfidencePicker value={confidence} onChange={setConfidence} /></label>}
          </div>
          <label className="field"><span>{result === 'couldnt' ? 'Where did you get stuck?' : 'Your approach in one paragraph'}</span>
            <textarea rows={4} value={explanation} onChange={(e) => setExplanation(e.target.value)}
              placeholder={result === 'couldnt' ? 'I tried … but could not see how to …' : 'Key insight … pattern … O(…) time, O(…) space. Edge cases …'} />
          </label>
          {result !== 'couldnt' && (
            <label className="field"><span>Accepted code (optional)</span>
              <textarea rows={6} className="mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your accepted solution to compare during reviews" spellCheck={false} />
            </label>
          )}
          {used > 0 && result === 'solved' && <p className="small faint" style={{ margin: 0 }}>You revealed {used} hint{used === 1 ? '' : 's'}, so this is logged as "Solved with help".</p>}
          <div><button className="btn primary" onClick={() => void save()}>Save result</button></div>
        </>
      )}
    </div>
  );
}

function RetryPanel({ q, course, c }: { q: LcQuestion; course: CourseId; c: CourseState }) {
  const s = retrySuggestion(course, c, q);
  const r = c.reviews[`problem:${q.id}`];
  return (
    <div className="callout warn stack small">
      <strong>Before the retry{r ? ` (due ${formatDate(r.due)})` : ''}</strong>
      <div><Link to={s.href}>{s.label}</Link></div>
      <div className="muted">{s.reason}</div>
    </div>
  );
}
