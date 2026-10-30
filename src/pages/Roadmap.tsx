import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useCourse } from '../App';
import { actions, currentDay } from '../store/store';
import { ROADMAP, TOTAL_DAYS } from '../data/roadmap';
import { PHASES, TOPIC_BY_ID } from '../data/topics';
import { PROBLEM_BY_ID } from '../data/problems';
import { STAGE_META, dayMinutes, dayPlan, hasFlow, topicFlow } from '../lib/flow';
import { addDays, today } from '../lib/srs';
import { ProblemRow } from '../components/ProblemRow';
import { Bar, formatDate } from '../components/ui';

export default function Roadmap() {
  const { course, c } = useCourse();
  const cur = currentDay(c, TOTAL_DAYS);
  const [open, setOpen] = useState<number | null>(cur <= TOTAL_DAYS ? cur : null);
  const t = today();
  const doneToday = Object.values(c.completedDays).includes(t);

  // Projected dates: remaining days are laid out one per day starting today (or tomorrow if today's is done).
  const projected: Record<number, string> = {};
  let offset = doneToday ? 1 : 0;
  for (const d of ROADMAP) if (!c.completedDays[d.day]) projected[d.day] = addDays(t, offset++);
  const completed = Object.keys(c.completedDays).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">60-day plan</div>
          <h1>Roadmap</h1>
          <div className="muted small" style={{ marginTop: 4 }}>
            Dates are estimates. If you miss a day, the rest of the plan moves back by a day and nothing is skipped.
          </div>
        </div>
        <div style={{ minWidth: 200 }}>
          <div className="spread small"><span className="muted">Progress</span><span className="mono">{completed}/{TOTAL_DAYS}</span></div>
          <Bar value={completed} max={TOTAL_DAYS} />
        </div>
      </div>

      {([1, 2, 3, 4] as const).map((ph) => {
        const days = ROADMAP.filter((d) => d.phase === ph);
        const doneN = days.filter((d) => c.completedDays[d.day]).length;
        return (
          <section key={ph} style={{ marginBottom: 32 }}>
            <div className="section-title">
              <h2>Phase {ph}: {PHASES[ph].title} <span className="faint mono" style={{ fontWeight: 400 }}>days {PHASES[ph].days[0]}–{PHASES[ph].days[1]}</span></h2>
              <span className="faint small mono">{doneN}/{days.length}</span>
            </div>
            <p className="small muted" style={{ marginBottom: 8 }}>{PHASES[ph].goal}</p>
            <table className="t">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>Day</th>
                  <th>Topic</th>
                  <th className="hide-sm">Pattern focus</th>
                  <th className="hide-sm">Topic stage</th>
                  <th className="num">Solved</th>
                  <th className="num hide-sm">Est.</th>
                  <th className="num">Date</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => {
                  const probs = d.problems.map((id) => PROBLEM_BY_ID[id]);
                  const solved = probs.filter((p) => ['solved', 'solved-with-help'].includes(c.problems[p.id]?.status ?? '')).length;
                  const isOpen = open === d.day;
                  const done = !!c.completedDays[d.day];
                  return (
                    <Fragment key={d.day}>
                      <tr className={`clickable day-row${d.day === cur ? ' current' : ''}`} onClick={() => setOpen(isOpen ? null : d.day)}>
                        <td className="mono">
                          <span className="row" style={{ gap: 4 }}>
                            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            {String(d.day).padStart(2, '0')}
                          </span>
                        </td>
                        <td>
                          <span className="row">
                            {done && <Check size={14} className="done-check" />}
                            <span style={{ fontWeight: d.day === cur ? 600 : 400 }}>{d.title}</span>
                            {d.mock && <span className="tag">mock</span>}
                          </span>
                        </td>
                        <td className="muted small hide-sm" style={{ maxWidth: 360 }}>{d.focus}</td>
                        <td className="small hide-sm mono">{hasFlow(d.topic) ? (() => { const f = topicFlow(c, d.topic); return f.current ? `Stage ${f.index + 1}/${f.total}` : `${f.total}/${f.total} ✓`; })() : '—'}</td>
                        <td className="num">{solved}/{probs.length}</td>
                        <td className="num hide-sm">{Math.round(dayMinutes(d.day) / 60 * 10) / 10}h</td>
                        <td className="num">{done ? formatDate(c.completedDays[d.day]) : formatDate(projected[d.day])}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={7} style={{ background: 'var(--bg-elev)', padding: '12px 16px' }}>
                            <div className="spread" style={{ marginBottom: 8 }}>
                              <div className="small muted">
                                Topic: {TOPIC_BY_ID[d.topic].title}
                                {hasFlow(d.topic) && !d.mock && <>, <Link to={`/lessons/${d.topic}`}>open topic stages</Link></>}
                                {d.mock && <>, <Link to="/interview">start a mock interview</Link></>}
                              </div>
                              <button className={`btn sm${done ? '' : ' primary'}`} onClick={(e) => { e.stopPropagation(); actions.toggleDay(course, d.day); }}>
                                {done ? 'Mark not done' : <><Check size={13} /> Mark day complete</>}
                              </button>
                            </div>
                            <div className="row wrap small" style={{ gap: 6, marginBottom: 8 }}>
                              <span className="faint">Today's stages:</span>
                              {dayPlan(d.day).map((st) => (
                                <span key={st.key} className="tag" title={st.key !== 'mock' ? STAGE_META[st.key].short : 'Timed session'}>{st.label}, {st.minutes}m</span>
                              ))}
                            </div>
                            <div className="list">
                              {probs.map((p) => <ProblemRow key={p.id} p={p} log={c.problems[p.id]} />)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
