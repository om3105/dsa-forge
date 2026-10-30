import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activeEngine, checkServer, useEngineState } from '../lib/exec';
import { useApp } from '../store/store';
import type { CourseId } from '../types';

/** Shows which engine will run code for the current course: Server (Piston) or Browser (WebAssembly). */
export function EngineStatus({ compact, course }: { compact?: boolean; course?: CourseId }) {
  const { settings } = useApp();
  const lang = course ?? settings.lastCourse ?? 'python';
  const st = useEngineState();
  useEffect(() => {
    if (settings.engine !== 'browser') void checkServer(settings.pistonUrl);
    const t = setInterval(() => { if (settings.engine !== 'browser') void checkServer(settings.pistonUrl); }, 60000);
    return () => clearInterval(t);
  }, [settings.pistonUrl, settings.engine]);

  const engine = activeEngine(settings, lang);
  const browserState = st.browser[lang];
  let dot = 'offline';
  let label: string;
  if (engine === 'server') {
    dot = st.server === 'online' ? 'online' : st.server === 'checking' ? 'loading' : 'offline';
    label = st.server === 'online' ? 'Server' : st.server === 'checking' ? 'Checking server…' : 'Server offline';
  } else {
    dot = browserState === 'ready' ? 'online' : browserState === 'loading' ? 'loading' : browserState === 'error' ? 'error' : 'offline';
    label = browserState === 'loading' ? `Browser, ${lang === 'java' ? 'warming up JVM' : 'loading Pyodide'}…` : browserState === 'error' ? 'Browser, error' : 'Browser';
  }
  const title = engine === 'server'
    ? `Running on the code server at ${settings.pistonUrl}`
    : `Running in your browser (${lang === 'java' ? 'CheerpJ, Java 8 syntax; the first warm-up takes about a minute' : 'Pyodide, Python 3.12'}). ${settings.engine === 'auto' ? 'Code server not reachable.' : ''}${st.browserMessage && browserState === 'error' ? ' ' + st.browserMessage : ''}`;
  if (compact) {
    return (
      <Link to="/settings" className="spread" style={{ color: 'inherit' }} title={title}>
        <span className="row"><span className={`dot ${dot}`} /> Engine</span>
        <span className="mono">{label}</span>
      </Link>
    );
  }
  return <span className="engine-pill" title={title}><span className={`dot ${dot}`} />{label}</span>;
}
