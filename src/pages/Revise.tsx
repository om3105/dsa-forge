import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Code2, ExternalLink } from 'lucide-react';
import { useCourse } from '../App';
import { actions, loadCode } from '../store/store';
import { cardMap, reviewQueue } from '../lib/items';
import { dateKey, overdueDays, previewIntervals, ratingLabel, today } from '../lib/srs';
import { pickCards } from '../lib/lcmap';
import { resolveCandidate } from '../lib/flow';
import { LC_BY_ID } from '../data/lcQuestions';
import { RecallQuiz } from '../components/RecallQuiz';
import { PROBLEM_BY_ID } from '../data/problems';
import { PATTERN_LABEL, TOPIC_BY_ID } from '../data/topics';
import { getLesson } from '../data/lessons';
import { CodeBlock, DiffTag, Inline, Kbd, Md, formatDate, plural } from '../components/ui';
import type { CodeRecord, CourseId, CourseState, Flashcard, Rating, ReviewItem } from '../types';

type Filter = 'all' | 'problem' | 'concept' | 'card';
const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy'];

export default function Revise() {
  const { course, c, settings } = useCourse();
  const [filter, setFilter] = useState<Filter>('all');
  // Snapshot the queue so rating an item doesn't reshuffle what you are looking at.
  const [ids, setIds] = useState<string[]>([]);
  const [pos, setPos] = useState(0);
  useEffect(() => {
    const kinds = filter === 'all' ? undefined : [filter];
    setIds(reviewQueue(course, c, settings.dailyReviewCap, kinds).map((r) => r.id));
    setPos(0);
    // rebuild only when course or filter changes
  }, [course, filter]);
  const cards = useMemo(() => cardMap(course, c), [course, c]);
  const item = ids[pos] ? c.reviews[ids[pos]] : undefined;
  const totalDue = reviewQueue(course, c, 100_000).length;

  return (
    <div className="page" style={{ maxWidth: 920 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Spaced repetition</div>
          <h1>Revise today</h1>
          <div className="muted small" style={{ marginTop: 4 }}>
            Try to recall the answer, then reveal it. Forgot brings it back tomorrow, Hard sooner than usual, Good and Easy later (1, 3, 7, 15, then 30 days).
          </div>
        </div>
        <div className="seg" role="group" aria-label="Filter">
          {(['all', 'problem', 'concept', 'card'] as Filter[]).map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'card' ? 'Cards' : f[0].toUpperCase() + f.slice(1) + 's'}</button>
          ))}
        </div>
      </div>

      {ids.length === 0 || pos >= ids.length ? (
        <div className="panel panel-pad stack">
          <h2>{ids.length === 0 ? 'Nothing due right now.' : `Done. ${plural(ids.length, 'item')} reviewed.`}</h2>
          <p className="muted small">
            {totalDue > 0 ? `${totalDue} item(s) still due beyond today's cap of ${settings.dailyReviewCap}. Come back tomorrow, or raise the cap in Settings.` : 'Next items will appear on their due dates.'}
          </p>
          <div className="row"><Link className="btn" to="/">Back to Today</Link><Link className="btn" to="/flashcards">Browse flashcards</Link></div>
        </div>
      ) : item ? (
        <>
          <div className="spread small faint mono" style={{ marginBottom: 8 }}>
            <span>{pos + 1} / {ids.length}, {item.kind}</span>
            <span>{overdueDays(item) > 0 ? `${overdueDays(item)}d overdue, ` : ''}reviewed {item.reviews}×, lapses {item.lapses}</span>
          </div>
          <ReviewCard key={item.id} course={course} c={c} item={item} cards={cards} onRate={(r) => { actions.rate(course, item.id, r); setPos((p) => p + 1); }}
            onFail={() => { actions.failTopicReview(course, item.refId); setPos((p) => p + 1); }} />
        </>
      ) : (
        <div className="empty">This item no longer exists. <button className="btn sm" onClick={() => setPos((p) => p + 1)}>Skip</button></div>
      )}
    </div>
  );
}

function RateButtons({ item, onRate, hideAgain }: { item: ReviewItem; onRate: (r: Rating) => void; hideAgain?: boolean }) {
  const prev = previewIntervals(item);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
      const i = ['1', '2', '3', '4'].indexOf(e.key);
      if (i >= 0 && !(hideAgain && i === 0)) onRate(RATINGS[i]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRate, hideAgain]);
  return (
    <div className="rate-row">
      {RATINGS.filter((r) => !hideAgain || r !== 'again').map((r) => { const i = RATINGS.indexOf(r); return (
        <button key={r} className={`btn${r === 'good' ? ' primary' : ''}`} onClick={() => onRate(r)}>
          <span>{ratingLabel[r]} <Kbd>{i + 1}</Kbd></span>
          <small style={r === 'good' ? { color: 'inherit', opacity: 0.8 } : undefined}>next in {prev[r]}d</small>
        </button>
      ); })}
    </div>
  );
}

function useReveal() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === ' ' && !shown) { e.preventDefault(); setShown(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shown]);
  return [shown, () => setShown(true)] as const;
}

function ReviewCard({ course, c, item, cards, onRate, onFail }: { course: CourseId; c: CourseState; item: ReviewItem; cards: Map<string, Flashcard>; onRate: (r: Rating) => void; onFail: () => void }) {
  if (item.kind === 'problem') return <ProblemReview course={course} c={c} item={item} onRate={onRate} />;
  if (item.kind === 'concept') return <TopicReview course={course} c={c} item={item} onRate={onRate} onFail={onFail} />;
  return <CardReview card={cards.get(item.refId)} item={item} onRate={onRate} />;
}

function ProblemReview({ course, c, item, onRate }: { course: CourseId; c: CourseState; item: ReviewItem; onRate: (r: Rating) => void }) {
  const p = PROBLEM_BY_ID[item.refId];
  const log = c.problems[item.refId];
  const [shown, reveal] = useReveal();
  const [code, setCode] = useState<CodeRecord | undefined>();
  const [guessPattern, setGuessPattern] = useState('');
  const [guessApproach, setGuessApproach] = useState('');
  useEffect(() => { void loadCode(course, item.refId).then(setCode); }, [course, item.refId]);
  const lastSnap = code?.snapshots[code.snapshots.length - 1];

  return (
    <div className="panel">
      <div className="panel-pad stack-16">
        <div className="spread">
          <div>
            <div className="eyebrow">{TOPIC_BY_ID[p.topic]?.title}</div>
            <h2 style={{ fontSize: 18 }}>{p.title}</h2>
          </div>
          <DiffTag d={p.difficulty} />
        </div>
        <div className="prose" style={{ fontSize: 14 }}>
          {p.statement ? <Md text={p.statement} lang={course} /> : <p>{p.summary}</p>}
        </div>
        <div className="cols-2">
          <label className="field"><span>Which pattern?</span>
            <input type="text" value={guessPattern} onChange={(e) => setGuessPattern(e.target.value)} placeholder="e.g. sliding window" />
          </label>
          <label className="field"><span>Approach and complexity, from memory</span>
            <textarea rows={3} value={guessApproach} onChange={(e) => setGuessApproach(e.target.value)} placeholder="Say it out loud or type it. Then reveal." />
          </label>
        </div>
        {!shown && <div><button className="btn primary" onClick={reveal}>Reveal my notes <Kbd>Space</Kbd></button></div>}
      </div>
      {shown && (
        <div className="panel-pad stack-16" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <dl className="kv">
            <dt>Pattern</dt><dd>{PATTERN_LABEL[log?.pattern ?? p.pattern] ?? p.pattern}{log?.pattern && log.pattern !== p.pattern ? <span className="faint"> (catalogue: {PATTERN_LABEL[p.pattern]})</span> : null}</dd>
            <dt>Last log</dt><dd>{log ? <>confidence {log.confidence ?? '–'}, {log.minutes != null ? `${log.minutes} min, ` : ''}{log.wrong} wrong/help</> : '—'}</dd>
          </dl>
          <div>
            <div className="io-label">Your explanation</div>
            {log?.explanation ? <div className="prose small"><p><Inline text={log.explanation} /></p></div> : <p className="faint small">No explanation saved. Write one in the tracker after this review, it makes the next review much more useful.</p>}
          </div>
          {lastSnap && (
            <div>
              <div className="io-label">Your last saved code, {formatDate(lastSnap.at)}, {lastSnap.source === 'leetcode' ? 'pasted from LeetCode' : `${lastSnap.passed}/${lastSnap.total} tests`}</div>
              <CodeBlock code={lastSnap.code} lang={course} />
            </div>
          )}
          {p.hints?.length ? <div className="callout small"><strong>Hint:</strong> {p.hints[0]}</div> : null}
          <div className="row">
            {p.builtin
              ? <Link className="btn sm" to={`/problem/${p.id}`}><Code2 size={13} /> Re-solve in editor</Link>
              : <Link className="btn sm" to={`/leetcode/${p.id}`}><ExternalLink size={13} /> Re-solve on LeetCode</Link>}
            <Link className="btn sm ghost" to={`/problems?open=${p.id}`}>Edit log</Link>
          </div>
          <RateButtons item={item} onRate={onRate} />
        </div>
      )}
    </div>
  );
}

/** Stage 7 topic review: explain from memory, flashcards, then re-solve a past problem from a blank editor. */
function TopicReview({ course, c, item, onRate, onFail }: { course: CourseId; c: CourseState; item: ReviewItem; onRate: (r: Rating) => void; onFail: () => void }) {
  const topic = item.refId;
  const lesson = getLesson(course, topic);
  const key = `topic-review:${course}:${topic}:${today()}`;
  const [explain, setExplain] = useState(() => { try { return sessionStorage.getItem(key + ':explain') ?? ''; } catch { return ''; } });
  const [quiz, setQuiz] = useState<null | boolean>(() => { try { const v = sessionStorage.getItem(key + ':quiz'); return v == null ? null : v === '1'; } catch { return null; } });
  const [selfReport, setSelfReport] = useState<null | boolean>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { try { sessionStorage.setItem(key + ':explain', explain); } catch { /* ignore */ } }, [explain, key]);
  const cards = useMemo(() => pickCards(course, [topic], 3, `review:${topic}:${item.reviews}:${attempt}`), [course, topic, item.reviews, attempt]);
  const cand = resolveCandidate(c, topic);
  const resolvedToday = !!cand && c.resolves[topic]?.pid === cand.id && dateKey(new Date(c.resolves[topic].at)) === today();
  const part1 = explain.trim().length >= 60 && explain.trim().split(/[.\n]/).filter((x) => x.trim()).length >= 2;
  const part3: boolean | null = !cand ? true : cand.builtin ? (resolvedToday ? true : null) : selfReport;
  const failed = quiz === false || part3 === false;
  const passed = part1 && quiz === true && part3 === true;

  return (
    <div className="panel">
      <div className="panel-pad stack-16">
        <div className="eyebrow">Topic review</div>
        <h2 style={{ fontSize: 18 }}>{TOPIC_BY_ID[topic]?.title}</h2>
        <section className="stack">
          <strong className="small">1. Explain the pattern from memory (2–3 lines) {part1 && <Check size={13} className="done-check" />}</strong>
          <textarea rows={3} value={explain} onChange={(e) => setExplain(e.target.value)} placeholder="What it is, the clues that point to it, and the core steps…" />
        </section>
        <section className="stack">
          <strong className="small">2. Flashcards {quiz === true && <Check size={13} className="done-check" />}</strong>
          {quiz === null ? (
            <RecallQuiz key={attempt} cards={cards} passMark={Math.min(2, cards.length)} onDone={(ok, missed) => {
              actions.finishRecall(course, `topic:${topic}`, false, missed.map((m) => m.id));
              setQuiz(ok);
              try { sessionStorage.setItem(key + ':quiz', ok ? '1' : '0'); } catch { /* ignore */ }
            }} />
          ) : <span className={`small ${quiz ? 'muted' : ''}`} style={quiz ? undefined : { color: 'var(--err)' }}>{quiz ? 'Passed.' : 'Fewer than 2 of 3 recalled.'}</span>}
        </section>
        <section className="stack">
          <strong className="small">3. Re-solve a past problem without your old code {part3 === true && <Check size={13} className="done-check" />}</strong>
          {!cand ? <span className="small faint">No solved problem for this topic yet, so this part is skipped.</span>
            : cand.builtin ? (
              <div className="row">
                <span className="grow small">{cand.title} <DiffTag d={cand.difficulty} /></span>
                {resolvedToday ? <span className="small muted">re-solved today</span>
                  : <><Link className="btn sm primary" to={`/resolve/${topic}/${cand.id}`}><Code2 size={13} /> Re-solve in a blank editor</Link>
                    <button className="btn sm ghost" onClick={() => setSelfReport(false)}>I can't</button></>}
              </div>
            ) : (
              <div className="row wrap">
                <span className="grow small">{cand.title} <DiffTag d={cand.difficulty} /></span>
                <a className="btn sm" href={LC_BY_ID[cand.id]?.url ?? cand.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Re-solve on LeetCode</a>
                <button className="btn sm" onClick={() => setSelfReport(true)}>Accepted again</button>
                <button className="btn sm ghost" onClick={() => setSelfReport(false)}>Couldn't</button>
              </div>
            )}
        </section>
      </div>
      {(passed || failed) && (
        <div className="panel-pad stack-16" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          {lesson.concept && <div className="small"><span className="io-label">Signals</span> {lesson.concept.signals.join(', ')}</div>}
          {lesson.lang?.template && <CodeBlock code={lesson.lang.template} lang={course} label={`compare with your explanation, ${lesson.lang.templateTitle ?? ''}`} />}
          {passed ? <RateButtons item={item} onRate={onRate} hideAgain /> : (
            <div className="callout warn small stack">
              <div>This review did not pass. The topic will be reopened at <strong>Pattern</strong> and <strong>Guided practice</strong> and come back tomorrow.</div>
              <div className="row">
                <button className="btn sm primary" onClick={onFail}>Reopen the topic</button>
                <button className="btn sm ghost" onClick={() => { setQuiz(null); setSelfReport(null); setAttempt((a) => a + 1); try { sessionStorage.removeItem(key + ':quiz'); } catch { /* ignore */ } }}>Let me retry the parts</button>
              </div>
            </div>
          )}
        </div>
      )}
      {!passed && !failed && <div className="panel-pad small faint" style={{ borderTop: '1px solid var(--border)' }}>Finish all three parts to rate the review.</div>}
    </div>
  );
}

function CardReview({ card, item, onRate }: { card?: Flashcard; item: ReviewItem; onRate: (r: Rating) => void }) {
  const [shown, reveal] = useReveal();
  if (!card) return <div className="empty">Card not found.</div>;
  return (
    <div className="stack-16">
      <div className="flash">
        <div className="eyebrow" style={{ padding: '12px 16px 0' }}>{TOPIC_BY_ID[card.topic]?.title ?? card.topic}{card.custom ? ', your card' : ''}</div>
        <div className="flash-face"><div><Inline text={card.front} /></div></div>
        {shown && <div className="flash-face flash-back"><div><Inline text={card.back} /></div></div>}
      </div>
      {!shown ? <div><button className="btn primary" onClick={reveal}>Show answer <Kbd>Space</Kbd></button></div> : <RateButtons item={item} onRate={onRate} />}
    </div>
  );
}
