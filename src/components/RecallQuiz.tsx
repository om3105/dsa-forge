import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { Flashcard } from '../types';
import { TOPIC_BY_ID } from '../data/topics';
import { Inline } from './ui';

/** Flip-and-self-grade quiz. Reports which cards were missed so they can go into the review deck. */
export function RecallQuiz({ cards, passMark, onDone, intro }: {
  cards: Flashcard[];
  passMark: number;
  intro?: string;
  onDone: (passed: boolean, missed: Flashcard[]) => void;
}) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [missed, setMissed] = useState<Flashcard[]>([]);
  const [finished, setFinished] = useState<null | { passed: boolean; got: number }>(null);

  if (!cards.length) return <p className="small faint">No flashcards exist for these topics yet.</p>;

  if (finished) {
    return (
      <div className={`callout small ${finished.passed ? 'ok' : 'warn'}`}>
        {finished.got}/{cards.length} recalled. {finished.passed
          ? 'Passed.'
          : `You need ${passMark}. The missed cards were added to your review deck for tomorrow. Reread the lesson section and try again.`}
      </div>
    );
  }

  const card = cards[i];
  const grade = (ok: boolean) => {
    const m = ok ? missed : [...missed, card];
    if (i + 1 < cards.length) { setMissed(m); setI(i + 1); setShown(false); return; }
    const got = cards.length - m.length;
    const passed = got >= passMark;
    setFinished({ passed, got });
    onDone(passed, m);
  };

  return (
    <div className="stack">
      {intro && <p className="small muted" style={{ margin: 0 }}>{intro}</p>}
      <div className="flash" style={{ minHeight: 0 }}>
        <div className="spread" style={{ padding: '8px 12px 0' }}>
          <span className="eyebrow">{TOPIC_BY_ID[card.topic]?.title}</span>
          <span className="mono small faint">{i + 1}/{cards.length}</span>
        </div>
        <div style={{ padding: '12px 16px 16px' }}><Inline text={card.front} /></div>
        {shown && <div style={{ padding: '12px 16px', borderTop: '1px dashed var(--border-strong)' }} className="muted"><Inline text={card.back} /></div>}
      </div>
      {!shown ? (
        <div><button className="btn sm" onClick={() => setShown(true)}>Show answer</button> <span className="faint small">answer in your head first</span></div>
      ) : (
        <div className="row">
          <button className="btn sm" onClick={() => grade(true)}><Check size={13} /> I recalled it</button>
          <button className="btn sm" onClick={() => grade(false)}><X size={13} /> I missed it</button>
        </div>
      )}
    </div>
  );
}
