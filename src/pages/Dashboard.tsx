import { Link } from 'react-router-dom';
import { useCourse } from '../App';
import { READINESS_TARGETS, readiness, streak, topicStats, weakTopics } from '../lib/stats';
import { addDays, today } from '../lib/srs';
import { reviewQueue } from '../lib/items';
import { PATTERN_LABEL, TOPIC_BY_ID, CORE_PATTERNS } from '../data/topics';
import { Bar, plural } from '../components/ui';

export default function Dashboard() {
  const { course, c, settings } = useCourse();
  const s = streak(c);
  const stats = topicStats(c);
  const started = stats.filter((x) => x.solved > 0 || x.lessonDone || x.wrong > 0);
  const weak = weakTopics(stats).slice(0, 6);
  const r = readiness(c);
  const due = reviewQueue(course, c, 100_000);
  const overdue = due.filter((x) => x.due < today()).length;
  const upcoming = Object.values(c.reviews).filter((x) => x.due > today() && x.due <= addDays(today(), 7)).length;
  const t = today();
  const heat = Array.from({ length: 60 }, (_, i) => addDays(t, i - 59));
  const level = (n: number) => (n === 0 ? '' : n < 3 ? 'l1' : n < 8 ? 'l2' : 'l3');
  const totalSolved = stats.reduce((a, x) => a + x.solved, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{course === 'python' ? 'Python' : 'Java'} course</div>
          <h1>Progress</h1>
        </div>
      </div>

      {totalSolved === 0 && s.best === 0 && due.length === 0 ? (
        <p className="muted" style={{ marginBottom: 32 }}>Nothing to show yet. Your streak, solved problems and reviews appear here once you start the first topic.</p>
      ) : (
      <div className="stat-strip" style={{ marginBottom: 32 }}>
        <div><div className="stat">{s.current}<small>days</small></div><div className="label">current streak, best {s.best}</div></div>
        <div><div className="stat">{totalSolved}</div><div className="label">problems solved</div></div>
        <div><div className="stat">{r.wellUnderstood}</div><div className="label">well understood</div></div>
        <div><div className="stat">{due.length}</div><div className="label">due now, {overdue} overdue</div></div>
        <div><div className="stat">{upcoming}</div><div className="label">due in next 7 days</div></div>
      </div>
      )}

      <div className="cols" style={{ marginBottom: 32 }}>
        <section>
          <div className="section-title"><h2>Readiness for 15 LPA-level interviews</h2><span className="mono">{r.overall}%</span></div>
          <div className="panel panel-pad stack-16">
            <div>
              <div className="spread small"><span>Well-understood problems</span><span className="mono">{r.wellUnderstood} / {READINESS_TARGETS.problems}</span></div>
              <Bar value={r.wellUnderstood} max={READINESS_TARGETS.problems} />
              <div className="faint small" style={{ marginTop: 4 }}>Counts problems solved unaided with confidence ≥ 4, or that survived two spaced reviews. Raw "solved" count is {r.solved}.</div>
            </div>
            <div>
              <div className="spread small"><span>Core patterns covered (≥ 2 solid problems each)</span><span className="mono">{r.patternsCovered.length} / {CORE_PATTERNS.length}</span></div>
              <Bar value={r.patternsCovered.length} max={CORE_PATTERNS.length} />
              {r.patternsMissing.length > 0 && (
                <div className="row wrap" style={{ marginTop: 8, gap: 4 }}>
                  <span className="faint small">Missing:</span>
                  {r.patternsMissing.map((p) => <span key={p} className="tag">{PATTERN_LABEL[p] ?? p}</span>)}
                </div>
              )}
            </div>
            <div>
              <div className="spread small"><span>Timed mock interviews completed</span><span className="mono">{r.mocks} / {READINESS_TARGETS.mocks}</span></div>
              <Bar value={r.mocks} max={READINESS_TARGETS.mocks} />
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {r.overall < 40 ? 'Early days. Keep revision first and do one roadmap day at a time.'
                : r.overall < 75 ? 'Solid progress. Watch the weak topics below and start doing a mock every few days.'
                  : 'Close to the target. Keep mocks regular and keep your review backlog near zero.'}
            </p>
          </div>
        </section>

        <aside className="stack-24">
          <section>
            <div className="section-title"><h2>Activity, last 60 days</h2></div>
            <div className="heat" aria-label="Daily activity">
              {heat.map((d) => <i key={d} className={level(c.activity[d] ?? 0)} title={`${d}: ${c.activity[d] ?? 0} actions`} />)}
            </div>
          </section>
          <section>
            <div className="section-title"><h2>Weak topics</h2></div>
            {weak.length === 0 ? <p className="small faint">None flagged yet. A topic is flagged after 2+ wrong attempts or review lapses, an average confidence under 3, or mastery under 40 after 3+ solves.</p> : (
              <div className="list">
                {weak.map((w) => (
                  <Link key={w.topic} to={`/lessons/${w.topic}`} className="list-row" style={{ minHeight: 34 }}>
                    <span className="grow small">{TOPIC_BY_ID[w.topic].title}</span>
                    <span className="faint small mono">{w.wrong + w.lapses} misses, {w.mastery}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <section>
            <div className="section-title"><h2>Revision backlog</h2></div>
            <p className="small muted">{due.length === 0 ? 'Clear.' : `${plural(due.length, 'item')} due; daily cap ${settings.dailyReviewCap}. At that pace the backlog clears in ~${Math.ceil(due.length / settings.dailyReviewCap)} day(s).`}</p>
            <Link className="btn sm" to="/revise">Open revision</Link>
          </section>
        </aside>
      </div>

      <section>
        <div className="section-title"><h2>Mastery by topic</h2><span className="faint small" title="45% coverage, 30% confidence, 25% review retention, minus misses">how it's scored</span></div>
        {started.length === 0 ? <p className="small muted">Topics appear here as you work on them.</p> : (
        <table className="t">
          <thead>
            <tr><th>Topic</th><th style={{ width: '30%' }}>Mastery</th><th className="num">Solved</th><th className="num hide-sm">Solid</th><th className="num hide-sm">Avg conf.</th><th className="num hide-sm">Misses</th><th className="hide-sm">Lesson</th></tr>
          </thead>
          <tbody>
            {started.map((x) => (
              <tr key={x.topic}>
                <td><Link to={`/lessons/${x.topic}`} style={{ color: 'var(--text)' }}>{TOPIC_BY_ID[x.topic].title}</Link></td>
                <td><div className="row"><div className="grow"><Bar value={x.mastery} thin /></div><span className="mono small" style={{ width: 28, textAlign: 'right' }}>{x.mastery}</span></div></td>
                <td className="num">{x.solved}/{x.total}</td>
                <td className="num hide-sm">{x.wellUnderstood}</td>
                <td className="num hide-sm">{x.avgConfidence == null ? '' : x.avgConfidence.toFixed(1)}</td>
                <td className="num hide-sm">{x.wrong + x.lapses || ''}</td>
                <td className="small hide-sm">{x.lessonDone ? 'done' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </section>
    </div>
  );
}
