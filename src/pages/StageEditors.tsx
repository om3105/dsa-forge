/* Editor pages used by the topic flow: Build (Stage 3), Guided practice (Stage 5), and the
   blank-editor re-solve inside a topic review (Stage 7). */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { useCourse } from '../App';
import { actions } from '../store/store';
import { BUILD_BY_TOPIC } from '../data/flow/build';
import { PROBLEM_BY_ID } from '../data/problems';
import { TOPIC_BY_ID } from '../data/topics';
import { LC_BY_ID } from '../data/lcQuestions';
import { EXTRA_HINTS } from '../lib/flow';
import { expectedFor, formatInputs } from '../lib/harness';
import { SolveView } from '../components/SolveView';
import { CodeBlock, DiffTag, Md, toast } from '../components/ui';
import type { CourseId, CourseState, Problem } from '../types';

function Statement({ p, course, title }: { p: Problem; course: CourseId; title?: string }) {
  const exp = expectedFor(p);
  const samples = (p.tests ?? []).map((t, i) => ({ t, i })).filter(({ t }) => t.sample);
  return (
    <div className="stack-16">
      <div>
        <h1>{title ?? p.title}</h1>
        <div className="row"><DiffTag d={p.difficulty} /><span className="tag">{TOPIC_BY_ID[p.topic]?.title}</span></div>
      </div>
      <div className="prose"><Md text={p.statement ?? p.summary} lang={course} /></div>
      {samples.map(({ t, i }, k) => (
        <div key={i}>
          <div className="io-label">Example {k + 1}</div>
          <div className="io-box">{formatInputs([t.input])}{'\n'}<span className="faint">Output: </span>{JSON.stringify(exp[i])}</div>
        </div>
      ))}
      <div className="faint small">{samples.length} sample + {(p.tests ?? []).length - samples.length} hidden tests run on Submit.</div>
    </div>
  );
}

const back = (topic: string, stage: string) => (
  <Link to={`/lessons/${topic}?stage=${stage}`} className="icon-btn" title="Back to the topic"><ArrowLeft size={16} /></Link>
);

// ------------------------------------------------------------------ Stage 3
export function BuildPage() {
  const { topic = '' } = useParams();
  const { course, c } = useCourse();
  const task = BUILD_BY_TOPIC[topic];
  const [tab, setTab] = useState<'task' | 'ref'>('task');
  if (!task) return <div className="page"><p>No build task for this topic.</p></div>;
  const passed = !!c.problems[task.id]?.passedAt;
  const left = (
    <>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'task'} onClick={() => setTab('task')}>Task</button>
        <button role="tab" aria-selected={tab === 'ref'} onClick={() => setTab('ref')}>Reference {passed ? '' : '(locked)'}</button>
      </div>
      <div className="pane-scroll statement">
        {tab === 'task' ? (
          <div className="stack-16">
            <div className="eyebrow">Stage 3: Build from scratch</div>
            <Statement p={task} course={course} />
            <p className="small muted">The editor starts with method signatures only. Write the whole structure yourself, without the built-in version.</p>
          </div>
        ) : passed ? (
          <div className="stack">
            <p className="small muted">A clean reference implementation. Compare it with yours: naming, edge cases, complexity.</p>
            <CodeBlock code={task.ref[course]} lang={course} />
          </div>
        ) : <p className="faint small">Pass every hidden test to see the reference implementation.</p>}
      </div>
    </>
  );
  return (
    <SolveView course={course} problem={task} left={left}
      toolbarLeft={<>{back(topic, 'build')}<span style={{ fontWeight: 600 }}>{TOPIC_BY_ID[topic]?.title}: {task.title}</span></>}
      afterAccepted={() => <div className="callout ok small">All tests passed. Stage 3 is complete. <button className="btn sm" onClick={() => setTab('ref')}>Compare with the reference</button></div>} />
  );
}

// ------------------------------------------------------------------ Stage 5
export function hintsFor(p: Problem): string[] {
  return LC_BY_ID[p.id]?.hints ?? EXTRA_HINTS[p.id] ?? p.hints ?? [];
}

export function HintLadder({ course, c, p }: { course: CourseId; c: CourseState; p: Problem }) {
  const hints = hintsFor(p);
  const used = c.hintsUsed[p.id] ?? 0;
  if (!hints.length) return null;
  return (
    <div className="panel panel-pad stack">
      <div className="spread"><span className="row" style={{ gap: 6 }}><Lightbulb size={14} /><strong className="small">Hint ladder</strong></span><span className="mono small faint">{used}/{hints.length}</span></div>
      {hints.slice(0, used).map((h, i) => <div key={i} className="small note"><span className="faint">Hint {i + 1}. </span>{h}</div>)}
      {used < hints.length && <div><button className="btn sm" onClick={() => actions.revealHint(course, p.id, used + 1)}>Reveal hint {used + 1}</button> <span className="faint small">marks "help used"</span></div>}
    </div>
  );
}

function PlanForm({ course, p, existing, onDone }: { course: CourseId; p: Problem; existing?: { brute: string; optimized: string; complexity: string }; onDone?: () => void }) {
  const [brute, setBrute] = useState(existing?.brute ?? '');
  const [optimized, setOptimized] = useState(existing?.optimized ?? '');
  const [complexity, setComplexity] = useState(existing?.complexity ?? '');
  const ok = brute.trim().length > 5 && optimized.trim().length > 5 && complexity.trim().length > 2;
  return (
    <div className="panel panel-pad stack">
      <strong className="small">Your plan (before coding)</strong>
      <label className="field"><span>Brute force idea</span><textarea rows={2} value={brute} onChange={(e) => setBrute(e.target.value)} placeholder="Try every … → O(n²)" /></label>
      <label className="field"><span>Optimized idea</span><textarea rows={2} value={optimized} onChange={(e) => setOptimized(e.target.value)} placeholder="The repeated work is … so I will …" /></label>
      <label className="field"><span>Complexity</span><input type="text" className="mono" value={complexity} onChange={(e) => setComplexity(e.target.value)} placeholder="O(n) time, O(1) space" /></label>
      <div><button className="btn sm primary" disabled={!ok} onClick={() => { actions.savePlan(course, p.id, { brute: brute.trim(), optimized: optimized.trim(), complexity: complexity.trim() }); toast('Plan saved, the editor is unlocked.'); onDone?.(); }}>Save plan and start coding</button></div>
    </div>
  );
}

export function GuidedPage() {
  const { topic = '', pid = '' } = useParams();
  const { course, c } = useCourse();
  const p = PROBLEM_BY_ID[pid];
  const [editPlan, setEditPlan] = useState(false);
  if (!p) return <div className="page"><p>Problem not found.</p></div>;
  const reo = c.topics[topic]?.reopenedAt ?? 0;
  const plan = c.plans[pid];
  const planned = (plan?.at ?? 0) > reo;
  const reopenedRun = reo > 0 && (c.problems[pid]?.passedAt ?? 0) <= reo;
  const left = (
    <div className="pane-scroll statement stack-16">
      <div className="eyebrow">Stage 5: Guided practice{reopenedRun ? ' (reopened, starting fresh)' : ''}</div>
      <Statement p={p} course={course} />
      {planned && !editPlan ? (
        <div className="panel panel-pad small stack">
          <div className="spread"><strong>Your plan</strong><button className="btn sm ghost" onClick={() => setEditPlan(true)}>Edit</button></div>
          <div><span className="faint">Brute force: </span>{plan.brute}</div>
          <div><span className="faint">Optimized: </span>{plan.optimized}</div>
          <div><span className="faint">Complexity: </span><span className="mono">{plan.complexity}</span></div>
        </div>
      ) : <PlanForm course={course} p={p} existing={planned ? plan : undefined} onDone={() => setEditPlan(false)} />}
      <HintLadder course={course} c={c} p={p} />
    </div>
  );
  return (
    <SolveView course={course} problem={p} left={left} fresh={reopenedRun}
      locked={planned ? undefined : <div className="panel panel-pad" style={{ maxWidth: 420 }}><h2 style={{ marginBottom: 8 }}>Plan first</h2><p className="small muted" style={{ margin: 0 }}>Write the brute force idea, the optimized idea and the complexity on the left. The editor unlocks after that.</p></div>}
      toolbarLeft={<>{back(topic, 'guided')}<span style={{ fontWeight: 600 }}>{p.title}</span></>}
      afterAccepted={() => <div className="callout ok small">All tests passed. {c.problems[pid]?.helpUsed ? 'A hint was used, and that is recorded in the tracker.' : 'No hints used.'} <Link to={`/lessons/${topic}?stage=guided`}>Back to the topic</Link></div>} />
  );
}

// ------------------------------------------------------------------ Stage 7 re-solve
export function ResolvePage() {
  const { topic = '', pid = '' } = useParams();
  const { course } = useCourse();
  const nav = useNavigate();
  const p = PROBLEM_BY_ID[pid];
  if (!p) return <div className="page"><p>Problem not found.</p></div>;
  const left = (
    <div className="pane-scroll statement stack-16">
      <div className="eyebrow">Topic review: re-solve from memory</div>
      <Statement p={p} course={course} />
      <p className="small muted">Blank editor, no hints, no old code. Your saved solution is untouched.</p>
    </div>
  );
  return (
    <SolveView course={course} problem={p} left={left} fresh
      toolbarLeft={<><Link to="/revise" className="icon-btn" title="Back to the review"><ArrowLeft size={16} /></Link><span style={{ fontWeight: 600 }}>Re-solve: {p.title}</span></>}
      onSubmitted={(o) => { if (o.verdict === 'Accepted') actions.markResolve(course, topic, pid); }}
      afterAccepted={() => <div className="callout ok small">Re-solved from memory. <button className="btn sm primary" onClick={() => nav('/revise')}>Back to the review</button></div>} />
  );
}
