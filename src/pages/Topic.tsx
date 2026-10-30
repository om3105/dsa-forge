/* Topic page: the fixed learning flow as a horizontal stepper. Each stage unlocks after the previous one. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Check, Code2, Lock, NotebookPen, RotateCcw, Route } from 'lucide-react';
import { useCourse } from '../App';
import { actions } from '../store/store';
import { PHASES, TOPICS, TOPIC_BY_ID } from '../data/topics';
import { ROADMAP } from '../data/roadmap';
import { PROBLEM_BY_ID } from '../data/problems';
import { getLesson, PACKS } from '../data/lessons';
import { understandFor, type Mcq } from '../data/flow/understand';
import { BUILD_BY_TOPIC } from '../data/flow/build';
import { BIG_O_SHEET, EXPLAIN } from '../data/flow/explain';
import {
  GUIDED, STAGE_META, hasFlow, solveTarget, spotQuiz, stagesFor, topicFlow, topicQuestions,
  type StageKey, type StageStatus,
} from '../lib/flow';
import { questionState } from '../lib/lcmap';
import { today } from '../lib/srs';
import { Visualizer, hasVisual } from '../components/Visualizer';
import { ListenBar } from '../components/ListenBar';
import { CodeBlock, DiffTag, Inline, Md, formatDate } from '../components/ui';
import { StatusPill } from './LeetCodeMap';
import type { CourseId, CourseState } from '../types';

const STATUS_TEXT: Record<StageStatus, string> = { locked: 'Locked', active: 'In progress', done: 'Done' };

export function TopicsIndex() {
  const { course, c } = useCourse();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{PACKS[course].name} course</div>
          <h1>Topics</h1>
          <div className="muted small" style={{ marginTop: 4, maxWidth: 680 }}>
            Every topic runs through Understand, Visualize, Build, Pattern, Guided practice, Solve and Recall. Foundation topics use a shorter flow: Understand, Build, Guided practice and Recall.
          </div>
        </div>
      </div>
      {([1, 2, 3, 4] as const).map((ph) => (
        <section key={ph} style={{ marginBottom: 32 }}>
          <div className="section-title"><h2>Phase {ph}: {PHASES[ph].title}</h2></div>
          <div className="list">
            {TOPICS.filter((t) => t.phase === ph && hasFlow(t.id)).map((t) => {
              const f = topicFlow(c, t.id);
              const firstDay = ROADMAP.find((d) => d.topic === t.id)?.day;
              return (
                <Link key={t.id} to={`/lessons/${t.id}`} className="list-row">
                  {f.doneCount === f.total ? <Check size={14} className="done-check" /> : <span className={`dot${f.doneCount ? ' attempted' : ''}`} />}
                  <span style={{ width: 230, fontWeight: 500 }}>{t.title}</span>
                  <span className="grow muted small hide-sm">{t.blurb}</span>
                  {f.reopened && <span className="tag" style={{ color: 'var(--warn)' }}><RotateCcw size={10} /> reopened</span>}
                  <span className="topic-progress">
                    <span className="small mono">{f.current ? `${f.index + 1}/${f.total}, ${STAGE_META[f.current].title}` : 'Done'}</span>
                    <span className="bar thin"><i style={{ width: `${(100 * f.doneCount) / f.total}%` }} /></span>
                  </span>
                  <span className="faint small mono hide-sm" style={{ width: 52, textAlign: 'right' }}>{firstDay ? `day ${firstDay}` : ''}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function Stepper({ topic, c, selected, onSelect, compact }: { topic: string; c: CourseState; selected?: StageKey; onSelect?: (k: StageKey) => void; compact?: boolean }) {
  const f = topicFlow(c, topic);
  return (
    <ol className={`stepper${compact ? ' compact' : ''}`} aria-label="Learning stages">
      {f.stages.map((s, i) => (
        <li key={s.key} className={`step ${s.status}${selected === s.key ? ' selected' : ''}`}>
          <button disabled={s.status === 'locked' || !onSelect} onClick={() => onSelect?.(s.key)} title={`${STAGE_META[s.key].title}: ${STATUS_TEXT[s.status]}, ${s.detail}`}>
            <span className="step-num">{s.status === 'done' ? <Check size={12} /> : s.status === 'locked' ? <Lock size={11} /> : i + 1}</span>
            <span className="step-text">
              <span className="step-title">{STAGE_META[s.key].title}</span>
              <span className="step-status">{STATUS_TEXT[s.status]}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function TopicPage() {
  const { topic = '' } = useParams();
  const { course, c } = useCourse();
  const [params, setParams] = useSearchParams();
  const t = TOPIC_BY_ID[topic];
  const flow = t ? topicFlow(c, topic) : undefined;
  // stay on the stage being worked on even after it completes; move on only via the stepper / Next
  const [pinned, setPinned] = useState<StageKey | null>(null);
  useEffect(() => { setPinned(null); }, [topic]);
  const requested = (params.get('stage') as StageKey | null) ?? pinned;
  const reqView = flow?.stages.find((s) => s.key === requested);
  const stage: StageKey | null = reqView && reqView.status !== 'locked' ? reqView.key : flow?.current ?? flow?.stages[flow.stages.length - 1].key ?? null;
  useEffect(() => { if (stage && !pinned) setPinned(stage); }, [stage, pinned]);
  const select = (k: StageKey) => { setPinned(k); params.set('stage', k); setParams(params, { replace: true }); document.querySelector('.main')?.scrollTo(0, 0); };
  if (!t || !hasFlow(topic) || !flow || !stage) return <div className="page"><p>Topic not found.</p><Link to="/lessons">All topics</Link></div>;
  const days = ROADMAP.filter((d) => d.topic === topic).map((d) => d.day);
  const keys = stagesFor(topic);
  const nextKey = keys[keys.indexOf(stage) + 1];
  const thisDone = flow.stages.find((s) => s.key === stage)?.status === 'done';

  return (
    <div className="page" style={{ maxWidth: 1080 }}>
      <div className="row small faint" style={{ marginBottom: 8 }}>
        <Link to="/lessons">Topics</Link><span>/</span><span>Phase {t.phase}</span>{days.length > 0 && <span>· roadmap day {days.join(', ')}</span>}
      </div>
      <div className="spread" style={{ alignItems: 'flex-start', marginBottom: 16, gap: 24 }}>
        <div>
          <h1 className="lesson-title">{t.title}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{t.blurb}</p>
        </div>
        <div className="row hide-sm">
          <span className="mono small">{flow.current ? `Stage ${flow.index + 1}/${flow.total}` : 'All stages done'}</span>
          <Link className="btn sm" to={`/notes?topic=${topic}`}><NotebookPen size={13} /> Notes</Link>
        </div>
      </div>
      <Stepper topic={topic} c={c} selected={stage} onSelect={select} />
      {flow.reopened && (
        <div className="callout warn small" style={{ margin: '16px 0 0' }}>
          A topic review was failed, so <strong>Pattern</strong> and <strong>Guided practice</strong> are reopened. Redo them (fresh code, new plan) and the topic returns to the review schedule.
        </div>
      )}
      <div className="topic-body">
      <div style={{ minWidth: 0 }}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <div>
            <div className="eyebrow">Stage {keys.indexOf(stage) + 1} of {keys.length}, ~{STAGE_META[stage].minutes || 'varies'}{STAGE_META[stage].minutes ? ' min' : ''}</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 21 }}>{STAGE_META[stage].title}</h2>
          </div>
          {thisDone && nextKey && <button className="btn sm" onClick={() => select(nextKey)}>Next: {STAGE_META[nextKey].title}</button>}
        </div>
        {stage === 'understand' && <UnderstandStage course={course} topic={topic} c={c} />}
        {stage === 'visualize' && <VisualizeStage course={course} topic={topic} c={c} />}
        {stage === 'build' && <BuildStage course={course} topic={topic} c={c} />}
        {stage === 'pattern' && <PatternStage course={course} topic={topic} c={c} />}
        {stage === 'guided' && <GuidedStage topic={topic} c={c} />}
        {stage === 'solve' && <SolveStage course={course} topic={topic} c={c} />}
        {stage === 'recall' && <RecallStage topic={topic} c={c} />}
      </div>
      <StageRail topic={topic} stage={stage} c={c} onSelect={select} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Stage 1
function UnderstandStage({ course, topic, c }: { course: CourseId; topic: string; c: CourseState }) {
  const u = understandFor(course, topic);
  const ex = EXPLAIN[topic];
  const lesson = getLesson(course, topic);
  const done = !!c.topics[topic]?.understandAt;
  const articleRef = useRef<HTMLElement>(null);
  if (!u) return <p className="faint">No theory content for this topic yet.</p>;
  // data-say marks what the Listen bar reads aloud; tables, code and the quiz are skipped.
  return (
    <article className="prose learn" style={{ maxWidth: 760 }} ref={articleRef}>
      <ListenBar target={articleRef} id={`${course}:${topic}`} />
      {ex && (
        <section>
          <p className="lead" data-say="">{ex.oneLiner}</p>
          <p className="muted" data-say="">{ex.whyCare}</p>
        </section>
      )}
      <p className="aside-note" data-say="">{u.analogy}</p>

      {ex?.terms.length ? (
        <section>
          <h2 data-say="">Terms</h2>
          <dl className="terms">{ex.terms.map(([t, d]) => <div key={t} data-say={`${t}. ${d}`}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
        </section>
      ) : null}

      {ex && (
        <section>
          <h2 data-say="">An example</h2>
          <p className="small muted" style={{ marginBottom: 8 }} data-say={`${ex.example.title}.`}>{ex.example.title}. Try it on paper first.</p>
          <ol className="trace">{ex.example.steps.map((st, i) => <li key={i} data-say=""><Inline text={st} /></li>)}</ol>
          <p style={{ marginTop: 12 }} data-say="">{ex.example.takeaway}</p>
        </section>
      )}

      {hasVisual(topic) && (
        <section>
          <h2>Watch it run</h2>
          <p className="small muted" style={{ marginBottom: 8 }}>Press <strong>Play with voice</strong> for a narrated walkthrough, or step through it yourself. The Visualize stage later asks you to predict each step.</p>
          <Visualizer topic={topic} id="theory" />
        </section>
      )}

      {lesson.concept && (
        <section>
          <h2 data-say="">The idea in more depth</h2>
          <div data-say-children=""><Md text={lesson.concept.intuition} lang={course} /></div>
        </section>
      )}
      {lesson.foundation && (
        <section>
          <h2 data-say="">In {PACKS[course].name}</h2>
          <p data-say="">{lesson.foundation.intro}</p>
          {lesson.foundation.sections.map((sec, i) => (
            <section key={i}><h3 data-say="">{sec.title}</h3><div data-say-children=""><Md text={sec.body} lang={course} /></div>{sec.code && <CodeBlock code={sec.code} lang={course} />}</section>
          ))}
        </section>
      )}

      <section>
        <h2 data-say="">Formal definition</h2>
        <p data-say=""><Inline text={u.definition} /></p>
      </section>

      {lesson.concept && (
        <section>
          <h2>How fast is it?</h2>
          <table className="t" style={{ fontSize: 13 }}>
            <thead><tr><th>Operation</th><th>Time</th><th>Extra space</th></tr></thead>
            <tbody>{lesson.concept.complexity.map((r) => <tr key={r.what}><td>{r.what}</td><td className="mono">{r.time}</td><td className="mono">{r.space}</td></tr>)}</tbody>
          </table>
          <BigOSheet />
        </section>
      )}
      {topic === 'complexity' && <BigOSheet open />}

      {ex?.confusions.length ? (
        <section>
          <h2 data-say="">Easy to get wrong</h2>
          <ul className="confusions">{ex.confusions.map((x) => <li key={x} data-say=""><Inline text={x} /></li>)}</ul>
        </section>
      ) : null}

      <section>
        <h2>Quick check</h2>
        <p className="small muted">Get 2 of 3 right to unlock the next stage. Each answer comes with an explanation.</p>
        <McqQuiz items={u.mcq} done={done} onSubmit={(score) => (score >= 2 ? actions.passUnderstand(course, topic, score) : actions.recordMcq(course, topic, score))} />
      </section>
    </article>
  );
}

function BigOSheet({ open }: { open?: boolean }) {
  return (
    <details className="cheat" open={open}>
      <summary>What do these Big-O labels mean?</summary>
      <table className="t" style={{ fontSize: 13, marginTop: 8 }}>
        <thead><tr><th>Label</th><th>In plain words</th><th>Typical example</th></tr></thead>
        <tbody>{BIG_O_SHEET.map(([o, w, e]) => <tr key={o}><td className="mono">{o}</td><td>{w}</td><td className="muted">{e}</td></tr>)}</tbody>
      </table>
    </details>
  );
}

function McqQuiz({ items, done, onSubmit }: { items: Mcq[]; done: boolean; onSubmit: (score: number) => void }) {
  const [picked, setPicked] = useState<(number | undefined)[]>(items.map(() => undefined));
  const [checked, setChecked] = useState(false);
  const score = picked.filter((p, i) => p === items[i][2]).length;
  return (
    <div className="stack-16">
      {items.map(([q, opts, ans, why], i) => (
        <div key={q} className="panel panel-pad stack">
          <strong className="small">{i + 1}. {q}</strong>
          <div className="stack" style={{ gap: 4 }}>
            {opts.map((o, k) => {
              const isPick = picked[i] === k;
              const color = checked ? (k === ans ? 'var(--ok)' : isPick ? 'var(--err)' : undefined) : undefined;
              return (
                <label key={k} className="row small" style={{ cursor: checked ? 'default' : 'pointer', color }}>
                  <input type="radio" name={`q${i}`} checked={isPick} disabled={checked} onChange={() => setPicked((p) => p.map((x, j) => (j === i ? k : x)))} />
                  <span>{o}</span>
                </label>
              );
            })}
          </div>
          {checked && <div className={`small note ${picked[i] === ans ? 'ok' : 'bad'}`}>{picked[i] === ans ? 'Correct. ' : 'Not quite. '}{why}</div>}
        </div>
      ))}
      {!checked ? (
        <div><button className="btn primary" disabled={picked.some((p) => p === undefined)} onClick={() => { setChecked(true); onSubmit(score); }}>Check answers</button></div>
      ) : (
        <div className={`callout small ${score >= 2 ? 'ok' : 'warn'}`}>
          {score}/{items.length}. {score >= 2 ? (done ? 'Stage complete.' : 'Passed. The next stage is unlocked.') : 'Reread the explanations above and the intuition, then try again.'}
          {' '}<button className="btn sm ghost" onClick={() => { setChecked(false); setPicked(items.map(() => undefined)); }}>Retake</button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Stage 2
function VisualizeStage({ course, topic, c }: { course: CourseId; topic: string; c: CourseState }) {
  const t = c.topics[topic] ?? {};
  const [predict, setPredict] = useState(true);
  const onFinish = useCallback((r: { correct: number; total: number }) => {
    if (predict) actions.finishVisualize(course, topic, r.correct, r.total);
  }, [course, topic, predict]);
  return (
    <div className="stack-16" style={{ maxWidth: 820 }}>
      <p className="muted small" style={{ margin: 0 }}>
        Step through the algorithm. In <strong>predict mode</strong> you pick what happens next before each step is shown. Finish one run in predict mode to complete the stage.
      </p>
      <div className="row">
        <div className="seg">
          <button aria-pressed={predict} onClick={() => setPredict(true)}>Predict mode</button>
          <button aria-pressed={!predict} onClick={() => setPredict(false)}>Free stepping</button>
        </div>
        {t.predict && <span className="faint small mono">last run: {t.predict.correct}/{t.predict.total} predictions correct{t.predict.total ? ` (${Math.round((100 * t.predict.correct) / t.predict.total)}%)` : ''}</span>}
      </div>
      {EXPLAIN[topic]?.watch && <div className="callout small"><strong>What to watch:</strong> {EXPLAIN[topic].watch}</div>}
      <Visualizer topic={topic} predictMode={predict} onFinish={onFinish} />
      {t.visualizeAt && <p className="small faint" style={{ margin: 0 }}>Completed {formatDate(t.visualizeAt)}. Re-run it any time; accuracy is updated each predict-mode run.</p>}
    </div>
  );
}

// ------------------------------------------------------------------ Stage 3
function BuildStage({ course, topic, c }: { course: CourseId; topic: string; c: CourseState }) {
  const task = BUILD_BY_TOPIC[topic];
  if (!task) return <p className="faint">No build task for this topic.</p>;
  const log = c.problems[task.id];
  return (
    <div className="stack-16" style={{ maxWidth: 820 }}>
      <div className="panel panel-pad stack">
        <div className="spread"><strong>{task.title}</strong><span className="faint small">{task.goal}</span></div>
        <div className="prose small"><Md text={task.statement ?? ''} lang={course} /></div>
        <p className="small faint" style={{ margin: 0 }}>You get method signatures only. Hidden tests check correctness and edge cases. Pass every test to continue.</p>
        <div className="row">
          <Link className="btn primary" to={`/build/${topic}`}><Code2 size={14} /> {log?.passedAt ? 'Open the editor again' : 'Build it in the editor'}</Link>
          {log && <span className="faint small">{log.attempts} submit(s){log.passedAt ? `, passed ${formatDate(log.passedAt)}` : ''}</span>}
        </div>
      </div>
      {log?.passedAt ? (
        <div>
          <div className="io-label">Reference implementation, compare it with yours</div>
          <CodeBlock code={task.ref[course]} lang={course} />
        </div>
      ) : <p className="small faint">The reference implementation appears here after you pass.</p>}
    </div>
  );
}

// ------------------------------------------------------------------ Stage 4
function PatternStage({ course, topic, c }: { course: CourseId; topic: string; c: CourseState }) {
  const lesson = getLesson(course, topic);
  const [attempt, setAttempt] = useState(0);
  const items = useMemo(() => spotQuiz(topic, attempt), [topic, attempt]);
  const [picks, setPicks] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);
  useEffect(() => { setPicks({}); setChecked(false); }, [items]);
  const score = items.filter((it) => picks[it.id] === it.uses).length;
  const done = (c.topics[topic]?.patternAt ?? 0) > (c.topics[topic]?.reopenedAt ?? 0);
  const ex = EXPLAIN[topic];
  if (!lesson.concept) return <p className="faint">No pattern content.</p>;
  return (
    <article className="prose learn" style={{ maxWidth: 760 }}>
      {ex?.recognize.length ? (
        <section>
          <h2>How to recognise it</h2>
          <p className="small muted">If a problem statement says something like this, think of this pattern:</p>
          <table className="t recognise">
            <thead><tr><th>The problem says…</th><th>Why that points here</th></tr></thead>
            <tbody>{ex.recognize.map(([clue, why]) => <tr key={clue}><td><em>{clue}</em></td><td>{why}</td></tr>)}</tbody>
          </table>
        </section>
      ) : null}
      <section>
        <h2>More clues</h2>
        <ul className="signals">{lesson.concept.signals.map((x) => <li key={x}><Inline text={x} /></li>)}</ul>
      </section>
      <section>
        <h2>The template, step by step</h2>
        {ex?.templateSteps.length ? <ol className="trace">{ex.templateSteps.map((x, i) => <li key={i}><Inline text={x} /></li>)}</ol> : null}
        {lesson.lang?.template ? <CodeBlock code={lesson.lang.template} lang={course} label={`${PACKS[course].name}, ${lesson.lang.templateTitle ?? 'template'}`} /> : <p className="faint">This topic has no single template.</p>}
        <p className="small muted">Read the steps, then match each one to a line of code. Better: close this page and write the template from memory in the scratchpad.</p>
      </section>
      <section>
        <h2>Applying it to a new problem</h2>
        <ol>{lesson.concept.approach.map((x) => <li key={x}><Inline text={x} /></li>)}</ol>
      </section>
      {lesson.lang?.notes.length ? (
        <section>
          <h2>{PACKS[course].name} tips</h2>
          <ul>{lesson.lang.notes.map((n) => <li key={n}><Inline text={n} /></li>)}</ul>
        </section>
      ) : null}
      <section>
        <h2>Mistakes and edge cases</h2>
        <ul className="confusions">{[...lesson.concept.mistakes, ...(lesson.lang?.mistakes ?? [])].map((m) => <li key={m}><Inline text={m} /></li>)}</ul>
      </section>
      <h2>Spot the pattern</h2>
      <p className="small muted">Which of these problems use <strong>{TOPIC_BY_ID[topic].title}</strong>? Get at least 3 of 4 right.</p>
      <div className="stack">
        {items.map((it, i) => (
          <div key={it.id} className="panel panel-pad row" style={{ alignItems: 'flex-start' }}>
            <span className="mono faint small">{i + 1}.</span>
            <span className="grow small">{it.text}</span>
            <div className="seg">
              <button aria-pressed={picks[it.id] === true} disabled={checked} onClick={() => setPicks((p) => ({ ...p, [it.id]: true }))}>Uses it</button>
              <button aria-pressed={picks[it.id] === false} disabled={checked} onClick={() => setPicks((p) => ({ ...p, [it.id]: false }))}>Doesn't</button>
            </div>
            {checked && <span className="small mono" style={{ width: 60, color: picks[it.id] === it.uses ? 'var(--ok)' : 'var(--err)' }}>{picks[it.id] === it.uses ? '✓' : it.uses ? 'uses it' : "doesn't"}</span>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        {!checked ? (
          <button className="btn primary" disabled={items.some((it) => picks[it.id] === undefined)} onClick={() => {
            setChecked(true);
            if (score >= 3) actions.passPattern(course, topic, score); else actions.recordSpot(course, topic, score);
          }}>Check</button>
        ) : (
          <div className={`callout small ${score >= 3 ? 'ok' : 'warn'}`}>
            {score}/4. {score >= 3 ? 'Passed. Guided practice is unlocked.' : 'Reread the signals above, then try a new set.'}
            {' '}<button className="btn sm ghost" onClick={() => setAttempt((a) => a + 1)}>New set</button>
          </div>
        )}
        {done && !checked && <p className="small faint">Stage complete. You can still practise with new sets.</p>}
      </div>
    </article>
  );
}

// ------------------------------------------------------------------ Stage 5
function GuidedStage({ topic, c }: { topic: string; c: CourseState }) {
  const reo = c.topics[topic]?.reopenedAt ?? 0;
  return (
    <div className="stack-16" style={{ maxWidth: 820 }}>
      <p className="muted small" style={{ margin: 0 }}>
        Easier problems in your editor. Before coding you write a short plan (brute force, optimized idea, complexity), and a three-step hint ladder is there if you get stuck. Pass every test on each problem.
      </p>
      <div className="list">
        {(GUIDED[topic] ?? []).map((pid) => {
          const p = PROBLEM_BY_ID[pid];
          const planned = (c.plans[pid]?.at ?? 0) > reo;
          const passed = (c.problems[pid]?.passedAt ?? 0) > reo;
          return (
            <div key={pid} className="list-row">
              {planned && passed ? <Check size={14} className="done-check" /> : <span className="dot" />}
              <span className="grow">{p.title}</span>
              <DiffTag d={p.difficulty} />
              <span className="small faint">{planned ? 'plan written' : 'no plan yet'}, {passed ? 'tests passed' : 'tests not passed'}{c.problems[pid]?.helpUsed ? ', hint used' : ''}</span>
              <Link className="btn sm" to={`/guided/${topic}/${pid}`}>{planned && passed ? 'Open' : 'Start'}</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Stage 6
function SolveStage({ course, topic, c }: { course: CourseId; topic: string; c: CourseState }) {
  const { settings } = useCourse();
  const qs = topicQuestions(topic);
  const solvedN = qs.filter((q) => ['solved', 'solved-with-help'].includes(c.problems[q.id]?.status ?? '')).length;
  return (
    <div className="stack-16" style={{ maxWidth: 900 }}>
      <p className="muted small" style={{ margin: 0 }}>
        The mapped LeetCode problems for this topic, Easy first. Mediums unlock after you solve an Easy, Hards (optional) after a Medium. No hints are shown unless you ask, revealing one marks "help used" in the tracker.
        Solve {solveTarget(topic)} Easy/Medium problem{solveTarget(topic) === 1 ? '' : 's'} to complete the stage ({solvedN} solved so far).
      </p>
      <div className="list">
        {qs.map((q) => {
          const st = questionState(course, c, settings, q);
          return (
            <Link key={q.id} to={`/leetcode/${q.id}`} className="list-row" style={{ color: 'inherit' }}>
              <span className="mono faint small" style={{ width: 44 }}>#{q.number}</span>
              <span className="grow">{q.title}{q.difficulty === 'Hard' && <span className="faint small">, optional</span>}</span>
              <DiffTag d={q.difficulty} />
              {c.problems[q.id]?.helpUsed && <span className="tag">help used</span>}
              <StatusPill s={st.status} />
            </Link>
          );
        })}
      </div>
      <p className="small faint" style={{ margin: 0 }}><Route size={12} /> Each problem's page has the LeetCode link and the result form (status, time, confidence, approach).</p>
    </div>
  );
}

// ------------------------------------------------------------------ Stage 7
function RecallStage({ topic, c }: { topic: string; c: CourseState }) {
  const r = c.reviews[`concept:${topic}`];
  const t = c.topics[topic] ?? {};
  if (!r) return <p className="muted">The topic enters spaced repetition once every earlier stage is done.</p>;
  return (
    <div className="stack-16" style={{ maxWidth: 760 }}>
      <dl className="kv">
        <dt>Next review</dt><dd className="mono">{formatDate(r.due)}{r.due <= today() ? ' (due)' : ''}</dd>
        <dt>Interval ladder</dt><dd className="mono">1, 3, 7, 15, then 30 days. Now on step {r.step + 1} ({r.interval}d)</dd>
        <dt>Reviews</dt><dd className="mono">{r.reviews} done, {r.lapses} failed{t.reopenCount ? `, reopened ${t.reopenCount}×` : ''}</dd>
      </dl>
      <div className="panel panel-pad small stack">
        <strong>Each review has three parts</strong>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <li>Explain the pattern from memory in 2–3 lines.</li>
          <li>Answer three flashcards.</li>
          <li>Re-solve one problem you solved before, from a blank editor, without looking at your old code.</li>
        </ol>
        <span className="faint">Fail any part and the topic reopens at Pattern and Guided practice.</span>
      </div>
      <div><Link className="btn primary" to="/revise">Go to Revise</Link></div>
    </div>
  );
}

const FINISH: Record<StageKey, string> = {
  understand: 'Score at least 2 of 3 on the concept check.',
  visualize: 'Step through one full run in predict mode.',
  build: 'Pass every hidden test in the editor.',
  pattern: 'Get at least 3 of 4 right in Spot the pattern.',
  guided: 'For each problem: write a plan, then pass all tests.',
  solve: 'Solve the required Easy/Medium LeetCode problems.',
  recall: 'Pass two spaced reviews in a row.',
};

function StageRail({ topic, stage, c, onSelect }: { topic: string; stage: StageKey; c: CourseState; onSelect: (k: StageKey) => void }) {
  const f = topicFlow(c, topic);
  const keys = stagesFor(topic);
  const i = keys.indexOf(stage);
  const status = f.stages[i]?.status;
  const next = keys[i + 1];
  const finish = stage === 'solve' ? `Solve ${solveTarget(topic)} Easy/Medium LeetCode problems.` : FINISH[stage];
  return (
    <aside className="stage-rail">
      <div className="panel panel-pad stack">
        <div className="row" style={{ gap: 8 }}>
          <strong className="small">{STAGE_META[stage].title}</strong>
          <span className={`status-pill ${status}`}>{status === 'done' ? 'Done' : status === 'active' ? 'In progress' : 'Locked'}</span>
          {STAGE_META[stage].minutes ? <span className="faint small mono">~{STAGE_META[stage].minutes} min</span> : null}
        </div>
        <div className="small"><strong>To finish:</strong> {finish}</div>
        <div className="small muted">{f.stages[i]?.detail}</div>
      </div>
      {next && (
        <div className="panel panel-pad stack">
          <div className="small"><strong>Next: {STAGE_META[next].title}.</strong> {STAGE_META[next].short}.</div>
          <button className="btn sm" disabled={status !== 'done'} onClick={() => onSelect(next)}>{status === 'done' ? `Go to ${STAGE_META[next].title}` : 'Unlocks when this stage is done'}</button>
        </div>
      )}
      <div className="small faint" style={{ padding: '0 4px' }}>{f.doneCount} of {f.total} stages done</div>
    </aside>
  );
}
