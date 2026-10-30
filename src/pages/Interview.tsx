import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Flag, Timer } from 'lucide-react';
import { useCourse } from '../App';
import { actions } from '../store/store';
import { BUILTIN_PROBLEMS, PROBLEM_BY_ID } from '../data/problems';
import { TOPIC_BY_ID } from '../data/topics';
import { expectedFor, formatInputs } from '../lib/harness';
import { SolveView } from '../components/SolveView';
import { DiffTag, Md, formatDate, plural } from '../components/ui';
import type { CourseState, InterviewSession, Problem } from '../types';

const CHECKLIST: [string, string][] = [
  ['clarified', 'Asked clarifying questions (input size, duplicates, negatives, empty input)'],
  ['brute', 'Stated a brute-force approach and its complexity first'],
  ['complexity', 'Explained the final time and space complexity correctly'],
  ['edge', 'Considered edge cases (empty, single element, all same, overflow, large n)'],
  ['tested', 'Walked through an example / tested with my own cases before submitting'],
  ['clean', 'Clean code: meaningful names, helper functions, no dead code'],
  ['talked', 'Kept talking while coding instead of going silent'],
  ['time', 'Managed time (did not get stuck > 10 min without changing approach)'],
];

export default function Interview() {
  return (
    <Routes>
      <Route index element={<Setup />} />
      <Route path="s/:id" element={<Session />} />
    </Routes>
  );
}

function pickProblems(c: CourseState, count: number, scope: 'studied' | 'all'): Problem[] {
  const studied = new Set(Object.keys(c.lessonsDone));
  let pool = BUILTIN_PROBLEMS.filter((p) => p.signature && (scope === 'all' || studied.has(p.topic)));
  if (pool.length < 4) pool = BUILTIN_PROBLEMS.filter((p) => p.signature);
  const recent = (p: Problem) => (c.problems[p.id]?.solvedAt ?? 0) > Date.now() - 7 * 86400000;
  const weight = (p: Problem) => (p.difficulty === 'Medium' ? 6 : p.difficulty === 'Hard' ? 2 : 2) * (recent(p) ? 0.2 : 1) * (c.problems[p.id]?.status === 'solved' ? 0.6 : 1);
  const chosen: Problem[] = [];
  const want = count === 1 ? ['Medium'] : ['Medium', Math.random() < 0.35 ? 'Hard' : 'Medium'];
  for (const d of want) {
    const cand = pool.filter((p) => !chosen.includes(p) && p.difficulty === d && !chosen.some((x) => x.topic === p.topic));
    const list = cand.length ? cand : pool.filter((p) => !chosen.includes(p));
    const total = list.reduce((s, p) => s + weight(p), 0);
    let r = Math.random() * total;
    const pick = list.find((p) => (r -= weight(p)) <= 0) ?? list[list.length - 1];
    if (pick) chosen.push(pick);
  }
  return chosen;
}

function Setup() {
  const { course, c } = useCourse();
  const nav = useNavigate();
  const [count, setCount] = useState(2);
  const [minutes, setMinutes] = useState(45);
  const [scope, setScope] = useState<'studied' | 'all'>('studied');
  const active = c.interviews.find((s) => !s.endedAt);
  const done = [...c.interviews].filter((s) => s.endedAt).reverse();

  const start = () => {
    const problems = pickProblems(c, count, scope);
    const s: InterviewSession = {
      id: Date.now().toString(36), startedAt: Date.now(), durationMin: minutes,
      problemIds: problems.map((p) => p.id), plans: {}, results: {}, checklist: {},
    };
    actions.saveInterview(course, s);
    nav(`/interview/s/${s.id}`);
  };

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Timed practice</div>
          <h1>Interview mode</h1>
          <div className="muted small" style={{ marginTop: 4 }}>Like an online assessment or a live round: problems are picked for you, the clock runs, and you explain your plan before you are allowed to code.</div>
        </div>
      </div>

      {active && (
        <div className="callout warn" style={{ marginBottom: 24 }}>
          A session started {formatDate(active.startedAt)} is still open. <Link to={`/interview/s/${active.id}`}>Resume it</Link>.
        </div>
      )}

      <section className="panel panel-pad stack-16" style={{ marginBottom: 32 }}>
        <div className="row wrap" style={{ gap: 24 }}>
          <label className="field"><span>Problems</span>
            <div className="seg">{[1, 2].map((n) => <button key={n} aria-pressed={count === n} onClick={() => setCount(n)}>{n}</button>)}</div>
          </label>
          <label className="field"><span>Duration</span>
            <div className="seg">{[30, 45, 60].map((n) => <button key={n} aria-pressed={minutes === n} onClick={() => setMinutes(n)}>{n} min</button>)}</div>
          </label>
          <label className="field"><span>Pool</span>
            <div className="seg">
              <button aria-pressed={scope === 'studied'} onClick={() => setScope('studied')}>Topics I've studied</button>
              <button aria-pressed={scope === 'all'} onClick={() => setScope('all')}>Everything</button>
            </div>
          </label>
        </div>
        <ol className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
          <li>For each problem write: brute force idea, optimized idea, complexity, as if explaining to the interviewer.</li>
          <li>Then the editor unlocks. Submit runs the hidden tests. Mostly Medium, sometimes Hard, like 10–20 LPA product-company rounds.</li>
          <li>When time runs out (or you end early) you self-review with a checklist.</li>
        </ol>
        <div><button className="btn primary" onClick={start} disabled={!!active}><Timer size={14} /> Start {minutes}-minute session</button></div>
      </section>

      <section>
        <div className="section-title"><h2>History</h2><span className="faint small">{plural(done.length, 'session')}</span></div>
        {done.length === 0 ? <p className="faint small">No completed sessions yet. The roadmap schedules mocks on days 25, 40 and 56–60, but one every few days from Phase 2 on helps a lot.</p> : (
          <table className="t">
            <thead><tr><th>Date</th><th>Problems</th><th className="num">Tests</th><th className="num">Checklist</th><th className="num">Time used</th></tr></thead>
            <tbody>
              {done.map((s) => {
                const tot = s.problemIds.reduce((a, id) => a + (s.results[id]?.total ?? 0), 0);
                const pas = s.problemIds.reduce((a, id) => a + (s.results[id]?.passed ?? 0), 0);
                const ticks = Object.values(s.checklist).filter(Boolean).length;
                return (
                  <tr key={s.id} className="clickable" onClick={() => nav(`/interview/s/${s.id}`)}>
                    <td className="mono">{formatDate(s.startedAt)}</td>
                    <td>{s.problemIds.map((id) => PROBLEM_BY_ID[id]?.title).join(', ')}</td>
                    <td className="num">{tot ? `${pas}/${tot}` : '–'}</td>
                    <td className="num">{ticks}/{CHECKLIST.length}</td>
                    <td className="num">{Math.round(((s.endedAt ?? s.startedAt) - s.startedAt) / 60000)}m</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function Session() {
  const { id = '' } = useParams();
  const { course, c } = useCourse();
  const s = c.interviews.find((x) => x.id === id);
  const [idx, setIdx] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const now = useNow(!!s && !s.endedAt);
  const endAt = s ? s.startedAt + s.durationMin * 60000 : 0;
  const remaining = Math.max(0, endAt - now);
  const timeUp = !!s && !s.endedAt && remaining === 0;

  useEffect(() => { if (timeUp) setReviewing(true); }, [timeUp]);

  if (!s) return <div className="page"><p>Session not found.</p><Link to="/interview">Back</Link></div>;
  const problems = s.problemIds.map((pid) => PROBLEM_BY_ID[pid]).filter(Boolean);
  const save = (patch: Partial<InterviewSession>) => actions.saveInterview(course, { ...s, ...patch });
  if (s.endedAt || reviewing) return <ReviewScreen s={s} problems={problems} save={save} />;

  const p = problems[idx];
  const plan = s.plans[p.id];
  const mm = Math.floor(remaining / 60000), ss = Math.floor((remaining % 60000) / 1000);

  return (
    <SolveView
      key={p.id}
      course={course}
      problem={p}
      left={<PlanPanel p={p} course={course} plan={plan} onPlan={(pl) => save({ plans: { ...s.plans, [p.id]: pl } })} />}
      locked={plan ? undefined : <div className="panel panel-pad" style={{ maxWidth: 420 }}><h2 style={{ marginBottom: 8 }}>Plan before you code</h2><p className="small muted" style={{ margin: 0 }}>Fill in the brute force, optimized idea and complexity on the left, like you would say them to an interviewer. The editor unlocks after that.</p></div>}
      onSubmitted={(o) => save({ results: { ...s.results, [p.id]: { passed: o.verdict === 'Accepted' ? o.total : o.passed, total: o.total } } })}
      toolbarLeft={(
        <>
          <Link to="/interview" className="icon-btn" title="Leave (the clock keeps running)"><ArrowLeft size={16} /></Link>
          <span className={`timer${remaining < 5 * 60000 ? ' low' : ''}`} aria-live="off">{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</span>
          <div className="seg" style={{ marginLeft: 8 }}>
            {problems.map((x, i) => (
              <button key={x.id} aria-pressed={i === idx} onClick={() => setIdx(i)}>
                P{i + 1}{s.results[x.id] ? `, ${s.results[x.id].passed}/${s.results[x.id].total}` : ''}
              </button>
            ))}
          </div>
        </>
      )}
      toolbarRight={<button className="btn sm" onClick={() => setReviewing(true)}><Flag size={13} /> End</button>}
    />
  );
}

function PlanPanel({ p, course, plan, onPlan }: { p: Problem; course: string; plan?: InterviewSession['plans'][string]; onPlan: (pl: InterviewSession['plans'][string]) => void }) {
  const [brute, setBrute] = useState(plan?.brute ?? '');
  const [optimized, setOptimized] = useState(plan?.optimized ?? '');
  const [complexity, setComplexity] = useState(plan?.complexity ?? '');
  const sample = (p.tests ?? []).find((t) => t.sample);
  const exp = expectedFor(p);
  const ready = brute.trim().length > 5 && optimized.trim().length > 5 && complexity.trim().length > 2;
  return (
    <div className="pane-scroll statement stack-16">
      <div>
        <h1>{p.title}</h1>
        <div className="row"><DiffTag d={p.difficulty} /><span className="faint small">topic hidden until review</span></div>
      </div>
      <div className="prose"><Md text={p.statement ?? p.summary} lang={course} /></div>
      {sample && (
        <div className="io-box">{formatInputs([sample.input])}{'\n'}<span className="faint">Output: </span>{JSON.stringify(exp[(p.tests ?? []).indexOf(sample)])}</div>
      )}
      <hr />
      {plan ? (
        <div className="stack small">
          <div className="io-label">Your plan</div>
          <div><strong>Brute force:</strong> {plan.brute}</div>
          <div><strong>Optimized:</strong> {plan.optimized}</div>
          <div><strong>Complexity:</strong> {plan.complexity}</div>
        </div>
      ) : (
        <div className="stack-16">
          <label className="field"><span>Brute force idea</span><textarea rows={3} value={brute} onChange={(e) => setBrute(e.target.value)} placeholder="Check every pair… O(n²)" /></label>
          <label className="field"><span>Optimized idea</span><textarea rows={3} value={optimized} onChange={(e) => setOptimized(e.target.value)} placeholder="The bottleneck is … so I'll use …" /></label>
          <label className="field"><span>Time and space complexity</span><input type="text" className="mono" value={complexity} onChange={(e) => setComplexity(e.target.value)} placeholder="O(n) time, O(n) space" /></label>
          <div className="row">
            <button className="btn primary" disabled={!ready} onClick={() => onPlan({ brute: brute.trim(), optimized: optimized.trim(), complexity: complexity.trim() })}>Lock in plan and start coding</button>
            <button className="btn sm ghost" onClick={() => onPlan({ brute: brute.trim() || '(skipped)', optimized: optimized.trim() || '(skipped)', complexity: complexity.trim() || '(skipped)' })}>Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewScreen({ s, problems, save }: { s: InterviewSession; problems: Problem[]; save: (p: Partial<InterviewSession>) => void }) {
  const [reflection, setReflection] = useState(s.reflection ?? '');
  const finished = !!s.endedAt;
  const used = Math.round(((s.endedAt ?? Math.min(Date.now(), s.startedAt + s.durationMin * 60000)) - s.startedAt) / 60000);
  const ticks = Object.values(s.checklist).filter(Boolean).length;
  const verdict = useMemo(() => {
    const solved = problems.filter((p) => s.results[p.id] && s.results[p.id].passed === s.results[p.id].total).length;
    if (solved === problems.length && ticks >= 6) return 'Strong session. This would likely pass a typical round.';
    if (solved === problems.length) return 'All tests passed. Work on the communication items you left unchecked. Interviewers grade those too.';
    if (solved > 0) return 'Partial. Re-solve the unfinished problem tomorrow without the timer, then again in a week.';
    return 'Tough one. That is what mocks are for: log both problems as attempted and re-solve them in the next few days.';
  }, [problems, s.results, ticks]);

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Session review, {formatDate(s.startedAt)}, {used} of {s.durationMin} min</div>
          <h1>How did it go?</h1>
        </div>
        <Link className="btn" to="/interview">All sessions</Link>
      </div>
      <div className="stack-24">
        <section>
          <div className="section-title"><h2>Results</h2></div>
          <div className="list">
            {problems.map((p) => {
              const r = s.results[p.id];
              const pl = s.plans[p.id];
              return (
                <div key={p.id} className="list-row" style={{ alignItems: 'flex-start', padding: '10px 4px' }}>
                  <div className="grow stack">
                    <div className="row"><strong>{p.title}</strong><DiffTag d={p.difficulty} /><span className="faint small">{TOPIC_BY_ID[p.topic]?.title}</span></div>
                    {pl && <div className="small muted">Plan: {pl.optimized}, <span className="mono">{pl.complexity}</span></div>}
                  </div>
                  <span className={`mono small ${r && r.passed === r.total ? 'diff-Easy' : 'diff-Hard'}`}>{r ? `${r.passed}/${r.total} tests` : 'not submitted'}</span>
                  <Link className="btn sm" to={`/problems?open=${p.id}`}>Log</Link>
                </div>
              );
            })}
          </div>
        </section>
        <section>
          <div className="section-title"><h2>Self-review checklist</h2><span className="mono small">{ticks}/{CHECKLIST.length}</span></div>
          <div className="panel panel-pad stack">
            {CHECKLIST.map(([k, label]) => (
              <label key={k} className="row" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={!!s.checklist[k]} onChange={(e) => save({ checklist: { ...s.checklist, [k]: e.target.checked } })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>
        <section className="stack">
          <div className="section-title"><h2>What would you do differently?</h2></div>
          <textarea rows={4} value={reflection} onChange={(e) => setReflection(e.target.value)} onBlur={() => save({ reflection })} placeholder="I spent too long on … Next time I will …" />
        </section>
        <div className="callout">{verdict}</div>
        {!finished ? (
          <div><button className="btn primary" onClick={() => save({ endedAt: Math.min(Date.now(), s.startedAt + s.durationMin * 60000), reflection })}>Finish session</button></div>
        ) : <p className="faint small">Session saved. It counts toward the mock-interview target in Progress.</p>}
      </div>
    </div>
  );
}
