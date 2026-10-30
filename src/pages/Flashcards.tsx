import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useCourse } from '../App';
import { actions } from '../store/store';
import { allCards, hasLesson } from '../data/lessons';
import { TOPICS, TOPIC_BY_ID } from '../data/topics';
import { isDue } from '../lib/srs';
import { Inline, formatDate, toast } from '../components/ui';

export default function Flashcards() {
  const { course, c } = useCourse();
  const builtin = useMemo(() => allCards(course), [course]);
  const cards = [...builtin, ...c.customCards];
  const [topic, setTopic] = useState('');
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'due' | 'custom'>('all');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [newTopic, setNewTopic] = useState(TOPICS[0].id);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const due = cards.filter((x) => { const r = c.reviews[`card:${x.id}`]; return r && isDue(r); }).length;
  const enrolled = cards.filter((x) => c.reviews[`card:${x.id}`]).length;
  const shown = cards.filter((x) => {
    const r = c.reviews[`card:${x.id}`];
    return (!topic || x.topic === topic)
      && (filter === 'all' || (filter === 'enrolled' && r) || (filter === 'due' && r && isDue(r)) || (filter === 'custom' && x.custom));
  });

  const add = () => {
    if (!front.trim() || !back.trim()) return;
    actions.addCard(course, { topic: newTopic, front: front.trim(), back: back.trim() });
    setFront(''); setBack('');
    toast('Card added and scheduled for tomorrow.');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Active recall</div>
          <h1>Flashcards</h1>
          <div className="muted small" style={{ marginTop: 4 }}>
            {cards.length} cards, {enrolled} in your schedule, {due} due. Cards enter the schedule when you complete a lesson (or add your own). They are reviewed in Revise alongside problems.
          </div>
        </div>
        <Link className="btn primary" to="/revise">Review due cards</Link>
      </div>

      <div className="cols">
        <div>
          <div className="row wrap" style={{ marginBottom: 12 }}>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
              <option value="">All topics</option>
              {TOPICS.filter((t) => hasLesson(t.id)).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <div className="seg">
              {(['all', 'enrolled', 'due', 'custom'] as const).map((f) => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}
            </div>
            <span className="faint small mono" style={{ marginLeft: 'auto' }}>{shown.length} shown, click to flip</span>
          </div>
          <div className="list">
            {shown.map((x) => {
              const r = c.reviews[`card:${x.id}`];
              return (
                <div key={x.id} className="list-row" style={{ alignItems: 'flex-start', cursor: 'pointer', padding: '10px 4px' }} onClick={() => setFlipped((f) => ({ ...f, [x.id]: !f[x.id] }))}>
                  <div className="grow">
                    <div><Inline text={x.front} /></div>
                    {flipped[x.id] && <div className="muted small note" style={{ marginTop: 6 }}><Inline text={x.back} /></div>}
                  </div>
                  <span className="faint small mono" style={{ whiteSpace: 'nowrap' }}>{TOPIC_BY_ID[x.topic]?.title}</span>
                  <span className="faint small mono" style={{ width: 80, textAlign: 'right' }}>{r ? (isDue(r) ? 'due' : formatDate(r.due)) : 'not enrolled'}</span>
                  {x.custom && <button className="icon-btn" title="Delete card" onClick={(e) => { e.stopPropagation(); actions.deleteCard(course, x.id); }}><Trash2 size={13} /></button>}
                </div>
              );
            })}
          </div>
          {shown.length === 0 && <div className="empty">No cards match.</div>}
        </div>

        <aside className="panel panel-pad stack-16">
          <h2>Add your own card</h2>
          <label className="field"><span>Topic</span>
            <select value={newTopic} onChange={(e) => setNewTopic(e.target.value)}>
              {TOPICS.filter((t) => hasLesson(t.id)).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
          <label className="field"><span>Front (question)</span><textarea rows={3} value={front} onChange={(e) => setFront(e.target.value)} placeholder="Base case for word break DP?" /></label>
          <label className="field"><span>Back (answer)</span><textarea rows={3} value={back} onChange={(e) => setBack(e.target.value)} placeholder="dp[0] = True (empty prefix)" /></label>
          <button className="btn primary" onClick={add} disabled={!front.trim() || !back.trim()}><Plus size={14} /> Add card</button>
          <p className="faint small">Good cards ask one thing and have a short answer. Write them right after you get something wrong.</p>
        </aside>
      </div>
    </div>
  );
}
