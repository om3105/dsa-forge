import { actions } from '../store/store';
import { PROBLEMS } from '../data/problems';
import { TOTAL_DAYS } from '../data/roadmap';
import type { CourseId } from '../types';

const DETAILS: Record<CourseId, { title: string; lines: string[] }> = {
  python: {
    title: 'DSA with Python',
    lines: ['Lists, dicts, sets, comprehensions, collections, heapq, bisect', 'Solutions as plain functions with type hints', 'Runs on the code server or in the browser via Pyodide'],
  },
  java: {
    title: 'DSA with Java',
    lines: ['Arrays, StringBuilder, Collections Framework, Comparator', 'LeetCode-style Solution classes', 'Runs on the code server or in the browser via CheerpJ'],
  },
};

export default function CourseSelect() {
  const builtin = PROBLEMS.filter((p) => p.builtin).length;
  return (
    <div className="page" style={{ maxWidth: 760, paddingTop: 64 }}>
      <div className="brand" style={{ padding: 0, marginBottom: 8 }}>DSA <span className="brand-sub">Forge</span></div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 30, margin: '8px 0 12px' }}>Pick the language you will interview in.</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        Each course has its own {TOTAL_DAYS}-day roadmap, lessons, problem log, flashcards and review schedule.
        Progress never mixes between them. You can switch any time from the sidebar.
      </p>
      <p className="faint small" style={{ marginBottom: 32 }}>
        {PROBLEMS.length} curated problems per course, {builtin} runnable here with hidden tests, the rest link out to LeetCode/NeetCode and are tracked the same way.
      </p>
      <div className="course-pick">
        {(['python', 'java'] as CourseId[]).map((id) => (
          <div key={id} data-course={id}>
            <div>
              <h2 style={{ fontSize: 17, marginBottom: 6 }}>{DETAILS[id].title}</h2>
              <ul className="muted small" style={{ margin: 0, paddingLeft: 18 }}>
                {DETAILS[id].lines.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </div>
            <button className="btn primary" onClick={() => actions.chooseCourse(id)}
              style={{ background: id === 'python' ? '#2C6E73' : '#9C6418', borderColor: 'transparent', color: '#F7F5F0' }}>
              Start {id === 'python' ? 'Python' : 'Java'}
            </button>
          </div>
        ))}
      </div>
      <p className="faint small" style={{ marginTop: 24 }}>Progress is saved to your account and syncs across devices. You can also export a JSON backup from Settings.</p>
    </div>
  );
}
