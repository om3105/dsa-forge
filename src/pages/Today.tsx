import { Link } from 'react-router-dom';
import { ArrowRight, Check, CircleAlert } from 'lucide-react';
import { useCourse } from '../App';
import { actions, currentDay } from '../store/store';
import { ROADMAP, TOTAL_DAYS } from '../data/roadmap';
import { PHASES, TOPIC_BY_ID } from '../data/topics';
import { PROBLEM_BY_ID } from '../data/problems';
import { STAGE_META, dayMinutes, dayPlan, hasFlow, topicFlow } from '../lib/flow';
import { Stepper } from './Topic';
import { addDays, daysBetween, overdueDays, today } from '../lib/srs';
import { cardMap, itemTitle, reviewQueue } from '../lib/items';
import { helpList, readiness, streak } from '../lib/stats';
import { ProblemRow, problemHref } from '../components/ProblemRow';
import { formatDate, plural } from '../components/ui';

export default function Today() {
  const { course, c, settings } = useCourse();
  const dayNo = currentDay(c, TOTAL_DAYS);
  const day = ROADMAP[Math.min(dayNo, TOTAL_DAYS) - 1];
  const allDone = dayNo > TOTAL_DAYS;
  const t = today();
  const allDue = reviewQueue(course, c, 10_000);
  const queue = allDue.slice(0, settings.dailyReviewCap);
  const backlog = allDue.length - queue.length;
  const cards = cardMap(course, c);
  const s = streak(c);
  const help = helpList(c).slice(0, 4);
  const ready = readiness(c);
  const completedCount = Object.keys(c.completedDays).length;
  const remaining = TOTAL_DAYS - completedCount;
  const doneToday = Object.values(c.completedDays).includes(t);
  const projected = addDays(t, Math.max(0, remaining - (doneToday ? 0 : 1)));
  const originalEnd = c.startedOn ? addDays(c.startedOn, TOTAL_DAYS - 1) : undefined;
  const behind = originalEnd ? daysBetween(originalEnd, projected) : 0;
  const dayProblems = day ? day.problems.map((id) => PROBLEM_BY_ID[id]).filter(Boolean) : [];
  const solvedToday = dayProblems.filter((p) => ['solved', 'solved-with-help'].includes(c.problems[p.id]?.status ?? '')).length;
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{dateLabel}, {course === 'python' ? 'Python' : 'Java'} course</div>
          <h1>{allDone ? 'Roadmap complete' : `Day ${day.day}: ${day.title}`}</h1>
          {!allDone && <div className="muted small" style={{ marginTop: 4 }}>Phase {day.phase}, {PHASES[day.phase].title}. {day.focus}</div>}
        </div>
        {!allDone && (
          <div className="day-meter hide-sm" title={`${completedCount} of ${TOTAL_DAYS} roadmap days complete`}>
            <div className="spread small"><span className="muted">Roadmap</span><Link to="/roadmap" className="mono">{completedCount}/{TOTAL_DAYS} days</Link></div>
            <div className="bar"><i style={{ width: `${(100 * completedCount) / TOTAL_DAYS}%` }} /></div>
          </div>
        )}
      </div>

      <div className="cols">
        <div className="stack-24">
          {/* 1. revision always comes first */}
          <section>
            <div className="section-title"><h2>Revise first</h2>{queue.length > 0 && <span className="faint small mono">{queue.length} due{backlog > 0 ? `, +${backlog} backlog` : ''}</span>}</div>
            {queue.length === 0 ? (
              <div className="panel panel-pad row small" style={{ gap: 10 }}>
                <span className="ok-badge"><Check size={13} /></span>
                <span><strong>All caught up.</strong> <span className="muted">Anything you solve or learn comes back for review after 1, 3, 7, 15 and 30 days.</span></span>
              </div>
            ) : (
              <div className="panel">
                <div className="list" style={{ borderTop: 0 }}>
                  {queue.slice(0, 5).map((r) => (
                    <div key={r.id} className="list-row" style={{ padding: '8px 14px' }}>
                      <span className={`kind kind-${r.kind}`}>{r.kind === 'card' ? 'card' : r.kind === 'concept' ? 'topic' : 'problem'}</span>
                      <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemTitle(r, cards)}</span>
                      {overdueDays(r) > 0 && <span className="faint small mono">{overdueDays(r)}d late</span>}
                    </div>
                  ))}
                </div>
                <div className="spread" style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                  <span className="faint small">{queue.length > 5 ? `+ ${queue.length - 5} more, ` : ''}recall first, then check</span>
                  <Link className="btn primary" to="/revise">Start revision <ArrowRight size={14} /></Link>
                </div>
              </div>
            )}
            {backlog > 0 && <p className="small muted" style={{ marginTop: 8 }}>Backlog of {backlog}: the daily cap is {settings.dailyReviewCap} (change it in Settings), and the most overdue items come first.</p>}
          </section>

          {/* 2. the next stage of today's topic */}
          {!allDone && (
            <section>
              <div className="section-title"><h2>Next up</h2><span className="faint small mono">~{Math.round(dayMinutes(day.day) / 5) * 5} min today</span></div>
              {hasFlow(day.topic) && !day.mock && (() => {
                const f = topicFlow(c, day.topic);
                const next = f.current;
                return (
                  <div className="panel next-up">
                    <div className="next-up-main">
                      <span className="next-up-num">{next ? f.index + 1 : <Check size={16} />}</span>
                      <div className="grow">
                        <div className="eyebrow">{TOPIC_BY_ID[day.topic].title}, stage {next ? f.index + 1 : f.total} of {f.total}</div>
                        <div className="next-up-title">{next ? STAGE_META[next].title : 'All stages done'}</div>
                        <div className="muted small">{next ? STAGE_META[next].short : 'Keep the topic fresh with its spaced reviews.'}{next && STAGE_META[next].minutes ? `, about ${STAGE_META[next].minutes} min` : ''}</div>
                      </div>
                      {next && <Link className="btn primary" style={{ height: 34 }} to={`/lessons/${day.topic}?stage=${next}`}>Start <ArrowRight size={14} /></Link>}
                    </div>
                    <div style={{ padding: '0 14px 14px' }}><Stepper topic={day.topic} c={c} compact /></div>
                  </div>
                );
              })()}
              {day.mock && (
                <div className="panel next-up">
                  <div className="next-up-main">
                    <span className="next-up-num">M</span>
                    <div className="grow">
                      <div className="eyebrow">Mock interview day</div>
                      <div className="next-up-title">Timed mock: 2 problems, 45 minutes</div>
                      <div className="muted small">{plural(c.interviews.filter((x) => x.endedAt).length, 'mock')} done so far</div>
                    </div>
                    <Link className="btn primary" style={{ height: 34 }} to="/interview">Start <ArrowRight size={14} /></Link>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 3. today's problems */}
          {!allDone && (
            <section>
              <div className="section-title"><h2>Today's problems</h2><span className="faint small mono">{solvedToday}/{dayProblems.length} solved</span></div>
              <div className="panel">
                <div style={{ padding: '0 8px' }}>
                  <div className="list" style={{ borderTop: 0 }}>
                    {dayProblems.map((p) => <ProblemRow key={p.id} p={p} log={c.problems[p.id]} />)}
                  </div>
                </div>
                <div className="spread wrap" style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', gap: 12 }}>
                  <span className="faint small">Plan: {dayPlan(day.day).map((st) => `${st.label} ${st.minutes}m`).join(', ')}</span>
                  <button className="btn" onClick={() => actions.toggleDay(course, day.day)}><Check size={14} /> Mark day {day.day} complete</button>
                </div>
              </div>
              <p className="small faint" style={{ marginTop: 8 }}>You can finish the day with unsolved problems. They stay in the tracker, and logging them brings them back for review.</p>
            </section>
          )}
          {allDone && (
            <div className="callout ok">All {TOTAL_DAYS} days are complete. Keep the daily revision going and use Interview mode a few times a week. Check the readiness view in Progress.</div>
          )}
        </div>

        {/* side column */}
        <aside className="stack-24">
          {s.current === 0 && ready.solved === 0 ? (
            <p className="small muted" style={{ margin: 0 }}>No streak yet. Finish one stage or solve one problem today to start one.</p>
          ) : (
            <div className="stat-strip" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div><div className="stat">{s.current}<small>{s.current === 1 ? 'day' : 'days'}</small></div><div className="label">streak{s.best > s.current ? `, best ${s.best}` : ''}</div></div>
              <div><div className="stat">{ready.solved}<small>of 225</small></div><div className="label">solved, {ready.wellUnderstood} solid</div></div>
            </div>
          )}

          <section>
            <div className="section-title"><h2>This week</h2><span className="faint small mono">{s.activeToday ? 'active today' : 'not yet today'}</span></div>
            <div className="week">
              {Array.from({ length: 7 }, (_, i) => addDays(t, i - 6)).map((d) => {
                const n = c.activity[d] ?? 0;
                return (
                  <div key={d} className={`week-day${d === t ? ' today' : ''}`} title={`${d}: ${n} actions`}>
                    <i className={n === 0 ? '' : n < 3 ? 'l1' : n < 8 ? 'l2' : 'l3'} />
                    <span>{new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="section-title"><h2>Pace</h2></div>
            <dl className="kv">
              <dt>Completed</dt><dd className="mono">{completedCount} / {TOTAL_DAYS} days</dd>
              <dt>Finish at 1 day/day</dt><dd className="mono">{formatDate(projected)}</dd>
              {originalEnd && <><dt>Original target</dt><dd className="mono">{formatDate(originalEnd)}</dd></>}
            </dl>
            {behind > 0 && (
              <p className="small muted" style={{ marginTop: 8 }}>
                {plural(behind, 'day')} behind the original date. Nothing is skipped: the plan continues from Day {Math.min(dayNo, TOTAL_DAYS)}. Revision still comes first each day.
              </p>
            )}
          </section>

          <section>
            <div className="section-title"><h2>Re-solve next</h2><Link to="/problems?tab=help" className="small">all</Link></div>
            {help.length === 0 ? (
              <p className="small faint">Problems you got wrong or needed help with will show up here, most urgent first.</p>
            ) : (
              <div className="list">
                {help.map(({ problem: p, log }) => (
                  <Link key={p.id} to={problemHref(p)} className="list-row" style={{ minHeight: 34 }}>
                    <CircleAlert size={14} style={{ color: 'var(--warn)', flex: 'none' }} />
                    <span className="grow small">{p.title}</span>
                    <span className="faint small mono">{log.wrong}× wrong</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
