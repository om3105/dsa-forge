import { useCourse } from '../App';
import { PACKS } from '../data/lessons';
import { CodeBlock } from '../components/ui';

export default function Gotchas() {
  const { course } = useCourse();
  const pack = PACKS[course];
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">{pack.name} course</div>
          <h1>Language gotchas for interviews</h1>
          <div className="muted small" style={{ marginTop: 4 }}>The bugs that pass the sample tests and fail the hidden ones. Read this before every mock.</div>
        </div>
      </div>
      <div className="stack-24">
        {pack.gotchas.map((g, i) => (
          <section key={g.title} className="prose" style={{ maxWidth: 'none' }}>
            <h2 style={{ marginTop: 0 }}><span className="faint mono" style={{ fontSize: 13, marginRight: 8 }}>{String(i + 1).padStart(2, '0')}</span>{g.title}</h2>
            <p>{g.body}</p>
            {(g.bad || g.good) && (
              <div className="cols-2" style={{ gap: 12 }}>
                {g.bad && <CodeBlock code={g.bad} lang={course} label="Avoid" />}
                {g.good && <CodeBlock code={g.good} lang={course} label="Prefer" />}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
