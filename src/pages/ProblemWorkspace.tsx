import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { useCourse } from '../App';
import { PROBLEM_BY_ID } from '../data/problems';
import { PATTERN_LABEL, TOPIC_BY_ID } from '../data/topics';
import { actions, loadCode } from '../store/store';
import { expectedFor, formatInputs } from '../lib/harness';
import { LC_BY_ID, LC_QUESTIONS } from '../lib/lcmap';
import { SolveView } from '../components/SolveView';
import { ProblemLogForm } from '../components/ProblemLogForm';
import { CodeBlock, ConfidencePicker, DiffTag, Md, formatDate, toast } from '../components/ui';
import type { CodeRecord } from '../types';

export default function ProblemWorkspace() {
  const { id = '' } = useParams();
  const { course, c } = useCourse();
  const p = PROBLEM_BY_ID[id];
  const [tab, setTab] = useState<'desc' | 'log' | 'subs'>('desc');
  const [hint, setHint] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [subs, setSubs] = useState<CodeRecord | undefined>();
  const [quickConf, setQuickConf] = useState<number | undefined>();

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - openedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [openedAt]);
  useEffect(() => { if (tab === 'subs' && p) void loadCode(course, p.id).then(setSubs); }, [tab, course, p]);

  if (!p || !p.builtin) {
    return <div className="page"><p>Problem not found or not runnable here.</p><Link to="/problems">Back to problems</Link></div>;
  }
  const log = c.problems[p.id];
  const warmupFor = LC_QUESTIONS.filter((q) => q.warmups.includes(p.id)).slice(0, 6);
  const minutes = Math.max(1, Math.round(elapsed / 60));
  const samples = (p.tests ?? []).map((t, i) => ({ t, i })).filter(({ t }) => t.sample);
  const exp = expectedFor(p);
  const hidden = (p.tests ?? []).length - samples.length;
  const mm = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const left = (
    <>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'desc'} onClick={() => setTab('desc')}>Description</button>
        <button role="tab" aria-selected={tab === 'log'} onClick={() => setTab('log')}>Log</button>
        <button role="tab" aria-selected={tab === 'subs'} onClick={() => setTab('subs')}>Submissions</button>
      </div>
      <div className="pane-scroll statement">
        {tab === 'desc' && (
          <div className="stack-16">
            <div>
              <h1>{p.title}</h1>
              <div className="row wrap">
                <DiffTag d={p.difficulty} />
                <span className="tag">{TOPIC_BY_ID[p.topic]?.title}</span>
                {log?.status && log.status !== 'not-started' && <span className="tag">{log.status.replace(/-/g, ' ')}</span>}
              </div>
            </div>
            <div className="prose"><Md text={p.statement ?? p.summary} lang={course} /></div>
            {samples.map(({ t, i }, k) => (
              <div key={i} className="example">
                <div className="io-label">Example {k + 1}</div>
                <div className="io-box">
                  {formatInputs([t.input]).split('\n').map((line, j) => (
                    <div key={j}><span className="faint">{p.signature?.kind === 'function' ? p.signature.params[j]?.name : j === 0 ? 'operations' : 'arguments'} = </span>{line}</div>
                  ))}
                  <div><span className="faint">output = </span>{JSON.stringify(exp[i])}</div>
                </div>
              </div>
            ))}
            {p.constraints && (
              <div>
                <div className="io-label">Constraints</div>
                <ul className="small mono" style={{ margin: 0, paddingLeft: 18 }}>{p.constraints.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
            <div className="faint small">{samples.length} sample + {hidden} hidden tests (edge cases) run on Submit.</div>
            {p.hints?.length ? (
              hint ? <div className="callout small"><Lightbulb size={13} /> {p.hints.join(' ')}</div>
                : <button className="btn sm ghost" onClick={() => setHint(true)}><Lightbulb size={13} /> Show hint <span className="faint">(counts as help)</span></button>
            ) : null}
            {LC_BY_ID[p.id] && <div className="small"><Link to={`/leetcode/${p.id}`}>LeetCode #{LC_BY_ID[p.id].number}, prerequisite path and link</Link></div>}
            {warmupFor.length > 0 && <div className="small faint">Warm-up for: {warmupFor.map((q, i) => <span key={q.id}>{i ? ', ' : ''}<Link to={`/leetcode/${q.id}`}>{q.number}. {q.title}</Link></span>)}</div>}
          </div>
        )}
        {tab === 'log' && <ProblemLogForm course={course} p={p} defaultMinutes={minutes} />}
        {tab === 'subs' && (
          <div className="stack-16">
            {!subs?.snapshots.length ? <p className="faint small">No submissions yet. Every Submit saves a snapshot, so you can compare old and new solutions during reviews.</p>
              : [...subs.snapshots].reverse().map((s) => (
                <div key={s.at}>
                  <div className="spread small" style={{ marginBottom: 4 }}>
                    <span className="mono">{formatDate(s.at)} {new Date(s.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    {s.source === 'leetcode' ? <span className="faint">pasted from LeetCode</span> : <span className={s.passed === s.total ? 'diff-Easy' : 'diff-Hard'}>{s.passed}/{s.total} passed</span>}
                  </div>
                  <CodeBlock code={s.code} lang={course} scratch={false} />
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <SolveView
      course={course}
      problem={p}
      left={left}
      toolbarLeft={(
        <>
          <Link to="/problems" className="icon-btn" title="Back to problems"><ArrowLeft size={16} /></Link>
          <span style={{ fontWeight: 600 }} className="hide-sm">{p.title}</span>
          <span className="tag hide-sm">{PATTERN_LABEL[p.pattern]}</span>
        </>
      )}
      toolbarRight={<span className="mono faint small hide-sm" title="Time since you opened this problem">{mm}</span>}
      afterAccepted={() => (
        log?.status === 'solved' || log?.status === 'solved-with-help' ? (
          <div className="callout ok small">Already logged as {log.status.replace(/-/g, ' ')}. Update the Log tab if your understanding changed.</div>
        ) : (
          <div className="callout ok small stack">
            <div>Accepted in ~{minutes} min. Log it so it enters spaced revision. How confident are you that you could redo this cold in a week?</div>
            <div className="row wrap">
              <ConfidencePicker value={quickConf} onChange={setQuickConf} />
              <button className="btn sm primary" disabled={!quickConf} onClick={() => {
                actions.logProblem(course, p.id, { status: hint ? 'solved-with-help' : 'solved', confidence: quickConf, minutes, pattern: log?.pattern ?? p.pattern });
                toast('Logged. Add your one-paragraph explanation in the Log tab.');
                setTab('log');
              }}>Log as {hint ? 'solved with help' : 'solved'}</button>
              {!hint && <button className="btn sm ghost" onClick={() => setHint(true)}>I needed help</button>}
            </div>
          </div>
        )
      )}
    />
  );
}
