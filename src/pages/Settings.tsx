import { useRef, useState } from 'react';
import { useCourse } from '../App';
import { actions, exportData, importData } from '../store/store';
import { checkServer, useEngineState } from '../lib/exec';
import { EngineStatus } from '../components/EngineStatus';
import { toast } from '../components/ui';
import { resetPassword, signOut, useAuth } from '../lib/auth';
import type { Settings } from '../types';

export default function SettingsPage() {
  const { course, settings } = useCourse();
  const engine = useEngineState();
  const [url, setUrl] = useState(settings.pistonUrl);
  const [testing, setTesting] = useState(false);
  const [confirmReset, setConfirmReset] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Settings>) => actions.setSettings(patch);

  const test = async () => {
    setTesting(true);
    set({ pistonUrl: url.trim() });
    const ok = await checkServer(url.trim(), true);
    setTesting(false);
    toast(ok ? 'The server is reachable.' : 'Could not reach a server at that URL.');
  };

  const doExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dsa-forge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doImport = async (f: File) => {
    try {
      await importData(JSON.parse(await f.text()));
      toast('Backup restored.');
    } catch (e) {
      toast(`Import failed: ${(e as Error).message}`);
    }
  };

  const javaRt = engine.serverRuntimes.filter((r) => r.startsWith('java-'));
  const pyRt = engine.serverRuntimes.filter((r) => r.startsWith('python-'));

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="page-head"><div><div className="eyebrow">Preferences</div><h1>Settings</h1></div></div>

      <AccountSection />

      <section className="stack-16" style={{ marginBottom: 40 }}>
        <div className="section-title"><h2>Appearance</h2></div>
        <label className="field"><span>Theme</span>
          <div className="seg">
            {(['system', 'light', 'dark'] as const).map((t) => <button key={t} aria-pressed={settings.theme === t} onClick={() => set({ theme: t })}>{t[0].toUpperCase() + t.slice(1)}</button>)}
          </div>
        </label>
      </section>

      <section className="stack-16" style={{ marginBottom: 40 }}>
        <div className="section-title"><h2>Code execution</h2><EngineStatus /></div>
        <label className="field"><span>Engine</span>
          <div className="seg">
            <button aria-pressed={settings.engine === 'auto'} onClick={() => set({ engine: 'auto' })}>Auto (server, else browser)</button>
            <button aria-pressed={settings.engine === 'server'} onClick={() => set({ engine: 'server' })}>Server only</button>
            <button aria-pressed={settings.engine === 'browser'} onClick={() => set({ engine: 'browser' })}>Browser only</button>
          </div>
        </label>
        <div className="row wrap" style={{ alignItems: 'flex-end' }}>
          <label className="field grow"><span>Server URL</span>
            <input type="url" className="mono" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:2000" />
          </label>
          <button className="btn" onClick={() => void test()} disabled={testing}>{testing ? 'Testing…' : 'Save & test'}</button>
        </div>
        <div className="small muted">
          Server status: <span className="mono">{engine.server}</span>
          {engine.server === 'online' && <>, Python: <span className="mono">{pyRt.join(', ') || 'not installed'}</span>, Java: <span className="mono">{javaRt.join(', ') || 'not installed'}</span></>}
        </div>
        <div className="row wrap" style={{ gap: 16 }}>
          <label className="field" style={{ width: 160 }}><span>Python version on server</span>
            <input type="text" className="mono" value={settings.pythonVersion} onChange={(e) => set({ pythonVersion: e.target.value })} />
          </label>
          <label className="field" style={{ width: 160 }}><span>Java version on server</span>
            <input type="text" className="mono" value={settings.javaVersion} onChange={(e) => set({ javaVersion: e.target.value })} />
          </label>
          <label className="field" style={{ width: 140 }}><span>Time limit (ms)</span>
            <input type="number" className="mono" min={1000} max={15000} step={500} value={settings.timeoutMs} onChange={(e) => set({ timeoutMs: Math.max(1000, Math.min(15000, Number(e.target.value) || 5000)) })} />
          </label>
          <label className="field" style={{ width: 140 }}><span>Memory cap (MB)</span>
            <input type="number" className="mono" min={64} max={1024} step={64} value={settings.memoryMb} onChange={(e) => set({ memoryMb: Math.max(64, Number(e.target.value) || 256) })} />
          </label>
        </div>
        <div className="callout small stack">
          <div><strong>Server (recommended):</strong> real CPython and a real JDK. The hosted app uses the cloud runner (<code>runner/</code>, on Render), which sleeps when idle, so the first run after a break can take up to a minute while it wakes; until then runs fall back to the browser. For local development you can run Piston instead: <code>cd piston && docker compose up -d && ./install-runtimes.sh</code> and use <code>http://localhost:2000</code>.</div>
          <div><strong>Browser fallback:</strong> Python runs in Pyodide (CPython compiled to WebAssembly, ~10 MB on first use, then cached). Java runs in CheerpJ, a Java 8 JVM in the browser; it needs <code>public/tools.jar</code> (<code>npm run fetch:tools-jar</code>) and compiles Java 8 syntax only (no <code>var</code>, records or <code>List.of</code>).</div>
          <div>The memory cap applies to Python on the server. On the server Java relies on the time limit, and in the browser neither cap can be enforced strictly, the time limit is, by terminating the runtime.</div>
        </div>
      </section>

      <section className="stack-16" style={{ marginBottom: 40 }}>
        <div className="section-title"><h2>Revision</h2></div>
        <label className="field" style={{ width: 220 }}><span>Daily review cap</span>
          <input type="number" className="mono" min={5} max={200} value={settings.dailyReviewCap} onChange={(e) => set({ dailyReviewCap: Math.max(5, Number(e.target.value) || 25) })} />
          <span className="faint small">Most overdue and shakiest items are shown first; the rest wait.</span>
        </label>
      </section>

      <section className="stack-16" style={{ marginBottom: 40 }}>
        <div className="section-title"><h2>LeetCode Map</h2></div>
        <label className="row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.skipLock} onChange={(e) => set({ skipLock: e.target.checked })} />
          <span>Skip lock via concept quiz</span>
        </label>
        <p className="small faint" style={{ margin: 0 }}>Off by default. When on, a locked question offers a 5-card quiz on its concepts; passing 4/5 unlocks every question built only on those concepts, without the full prerequisite path.</p>
      </section>

      <section className="stack-16" style={{ marginBottom: 40 }}>
        <div className="section-title"><h2>Your data</h2></div>
        <p className="small muted">Both courses, code, notes, flashcards and schedules are stored in your account (Cloud Firestore, cached on this device for offline use). A JSON export is still handy as an extra backup.</p>
        <div className="row wrap">
          <button className="btn primary" onClick={() => void doExport()}>Export JSON backup</button>
          <button className="btn" onClick={() => file.current?.click()}>Import backup…</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = ''; }} />
        </div>
        <p className="small faint">Import replaces all current data in both courses.</p>
      </section>

      <section className="stack-16">
        <div className="section-title"><h2>Reset {course === 'python' ? 'Python' : 'Java'} course</h2></div>
        <p className="small muted">Deletes all progress, code, notes, cards and schedules for this course only. The other course is untouched.</p>
        <div className="row">
          <input type="text" placeholder={`type "reset ${course}"`} value={confirmReset} onChange={(e) => setConfirmReset(e.target.value)} className="mono" />
          <button className="btn danger" disabled={confirmReset !== `reset ${course}`} onClick={() => { void actions.resetCourse(course); setConfirmReset(''); toast('Course reset.'); }}>Reset course</button>
        </div>
      </section>
    </div>
  );
}

function AccountSection() {
  const { user } = useAuth();
  if (!user) return null;
  const google = user.providerData.some((p) => p.providerId === 'google.com');
  return (
    <section className="stack-16" style={{ marginBottom: 40 }}>
      <div className="section-title"><h2>Account</h2></div>
      <dl className="kv">
        <dt>Name</dt><dd>{user.displayName || '—'}</dd>
        <dt>Email</dt><dd>{user.email}{!google && !user.emailVerified ? <span className="faint">, not verified (check your inbox)</span> : null}</dd>
        <dt>Sign-in</dt><dd>{google ? 'Google' : 'Email and password'}</dd>
      </dl>
      <div className="row wrap">
        {!google && user.email && <button className="btn" onClick={() => void resetPassword(user.email!).then(() => toast('Password reset email sent.'))}>Change password</button>}
        <button className="btn" onClick={() => void signOut()}>Sign out</button>
      </div>
    </section>
  );
}
