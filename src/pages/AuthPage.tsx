import { useState } from 'react';
import { authMessage, resetPassword, signIn, signInWithGoogle, signUp } from '../lib/auth';

type Mode = 'signin' | 'signup' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError(null); setInfo(null);
    try { await fn(); } catch (e) { setError(authMessage(e)); } finally { setBusy(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') void run(() => signIn(email.trim(), password));
    else if (mode === 'signup') void run(() => signUp(name, email.trim(), password));
    else void run(async () => { await resetPassword(email.trim()); setInfo('Check your inbox for a link to reset your password.'); });
  };

  const switchTo = (m: Mode) => { setMode(m); setError(null); setInfo(null); };

  return (
    <div className="page" style={{ maxWidth: 440, paddingTop: 72 }}>
      <div className="brand" style={{ padding: 0, marginBottom: 24 }}>DSA <span className="brand-sub">Forge</span></div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 26, marginBottom: 6 }}>
        {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
      </h1>
      <p className="muted small" style={{ marginBottom: 24 }}>
        {mode === 'reset' ? 'We will email you a link to choose a new password.' : 'Your roadmap, problem log, reviews and code are saved to your account and sync across devices.'}
      </p>

      {mode !== 'reset' && (
        <>
          <button className="btn" style={{ width: '100%', height: 36 }} disabled={busy} onClick={() => void run(signInWithGoogle)}>
            <GoogleMark /> Continue with Google
          </button>
          <div className="row" style={{ margin: '16px 0', color: 'var(--text-3)', fontSize: 12 }}>
            <span className="grow" style={{ borderTop: '1px solid var(--border)' }} /> or with email <span className="grow" style={{ borderTop: '1px solid var(--border)' }} />
          </div>
        </>
      )}

      <form className="stack-16" onSubmit={submit}>
        {mode === 'signup' && (
          <label className="field"><span>Name</span><input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
        )}
        <label className="field"><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {mode !== 'reset' && (
          <label className="field">
            <span className="spread"><span>Password</span>{mode === 'signin' && <button type="button" className="btn sm ghost" style={{ height: 'auto', padding: 0 }} onClick={() => switchTo('reset')}>Forgot password?</button>}</span>
            <input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            {mode === 'signup' && <span className="faint small">At least 6 characters.</span>}
          </label>
        )}
        {error && <div className="callout err small" role="alert">{error}</div>}
        {info && <div className="callout ok small" role="status">{info}</div>}
        <button className="btn primary" style={{ height: 36 }} disabled={busy} type="submit">
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>
      </form>

      <p className="small muted" style={{ marginTop: 20 }}>
        {mode === 'signin' && <>New here? <button className="btn sm ghost" onClick={() => switchTo('signup')}>Create an account</button></>}
        {mode === 'signup' && <>Already have an account? <button className="btn sm ghost" onClick={() => switchTo('signin')}>Sign in</button></>}
        {mode === 'reset' && <button className="btn sm ghost" onClick={() => switchTo('signin')}>Back to sign in</button>}
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z" />
      <path fill="#FBBC05" d="M10.4 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.6 10.7l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
