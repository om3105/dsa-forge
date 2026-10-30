import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  BookOpen, Brain, CalendarDays, ChartNoAxesColumn, Layers, ListChecks, Menu, NotebookPen, RotateCcw,
  LogOut, Route as RouteIcon, Settings as SettingsIcon, SquareTerminal, Sun, Timer, TriangleAlert,
} from 'lucide-react';
import { actions, dueReviews, useApp } from './store/store';
import { applyTheme } from './lib/theme';
import { streak } from './lib/stats';
import { ToastHost } from './components/ui';
import { signOut, useAuth } from './lib/auth';
import AuthPage from './pages/AuthPage';
import { EngineStatus } from './components/EngineStatus';
import { COURSE_LABEL, type CourseId } from './types';

// Every page is loaded on first visit, so the sign-in screen and first paint only download what they need.
const CourseSelect = lazy(() => import('./pages/CourseSelect'));
const Today = lazy(() => import('./pages/Today'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Problems = lazy(() => import('./pages/Problems'));
const Revise = lazy(() => import('./pages/Revise'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const Notes = lazy(() => import('./pages/Notes'));
const Gotchas = lazy(() => import('./pages/Gotchas'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const LeetCodeMap = lazy(() => import('./pages/LeetCodeMap'));
const LeetCodeQuestion = lazy(() => import('./pages/LeetCodeQuestion'));
const TopicPage = lazy(() => import('./pages/Topic').then((m) => ({ default: m.TopicPage })));
const TopicsIndex = lazy(() => import('./pages/Topic').then((m) => ({ default: m.TopicsIndex })));
// The editor-heavy pages pull in Monaco; load them only when visited.
const ProblemWorkspace = lazy(() => import('./pages/ProblemWorkspace'));
const Scratchpad = lazy(() => import('./pages/Scratchpad'));
const Interview = lazy(() => import('./pages/Interview'));
const BuildPage = lazy(() => import('./pages/StageEditors').then((m) => ({ default: m.BuildPage })));
const GuidedPage = lazy(() => import('./pages/StageEditors').then((m) => ({ default: m.GuidedPage })));
const ResolvePage = lazy(() => import('./pages/StageEditors').then((m) => ({ default: m.ResolvePage })));

export function useCourse() {
  const app = useApp();
  const course = (app.settings.lastCourse ?? 'python') as CourseId;
  return { course, c: app.courses[course], settings: app.settings, app };
}

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { course, c, settings } = useCourse();
  const due = Math.min(dueReviews(c).length, settings.dailyReviewCap);
  const s = streak(c);
  const link = (to: string, label: string, Icon: typeof Sun, extra?: React.ReactNode) => (
    <NavLink to={to} end={to === '/'} onClick={onNavigate}>
      <Icon size={15} strokeWidth={1.75} />
      <span>{label}</span>
      {extra}
    </NavLink>
  );
  return (
    <aside className="sidebar">
      <div className="brand">DSA <span className="brand-sub">Forge</span></div>
      <div className="course-switch" role="group" aria-label="Course">
        {(['python', 'java'] as CourseId[]).map((id) => (
          <button key={id} aria-pressed={course === id} onClick={() => actions.chooseCourse(id)} title={COURSE_LABEL[id]}>
            {id === 'python' ? 'Python' : 'Java'}
          </button>
        ))}
      </div>
      <nav className="nav">
        <div className="nav-group">
          {link('/', 'Today', Sun)}
          {link('/revise', 'Revise', RotateCcw, due > 0 ? <span className="count">{due}</span> : null)}
          {link('/roadmap', 'Roadmap', CalendarDays)}
          {link('/problems', 'Problems', ListChecks)}
          {link('/leetcode', 'LeetCode Map', RouteIcon)}
        </div>
        <div className="nav-group">
          <div className="nav-group-label">Learn</div>
          {link('/lessons', 'Topics', BookOpen)}
          {link('/flashcards', 'Flashcards', Layers)}
          {link('/notes', 'Notes', NotebookPen)}
          {link('/gotchas', 'Language gotchas', TriangleAlert)}
        </div>
        <div className="nav-group">
          <div className="nav-group-label">Practice</div>
          {link('/interview', 'Interview mode', Timer)}
          {link('/scratchpad', 'Scratchpad', SquareTerminal)}
          {link('/dashboard', 'Progress', ChartNoAxesColumn)}
        </div>
        <div className="nav-group">
          {link('/settings', 'Settings', SettingsIcon)}
        </div>
      </nav>
      <div className="sidebar-foot stack">
        <AccountRow />
        <div className="spread">
          <span className="row"><Brain size={13} strokeWidth={1.75} /> Streak</span>
          <span className="mono">{s.current === 0 ? 'none yet' : `${s.current} ${s.current === 1 ? 'day' : 'days'}`}</span>
        </div>
        <EngineStatus compact />
      </div>
    </aside>
  );
}

function AccountRow() {
  const { user } = useAuth();
  if (!user) return null;
  const name = user.displayName || user.email || 'Account';
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  return (
    <div className="account-row">
      <Link to="/settings" className="account-link" title={user.email ?? ''}>
        {user.photoURL ? <img className="avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{initials}</span>}
        <span className="account-text"><span className="account-name">{name}</span>{user.displayName && <span className="account-email">{user.email}</span>}</span>
      </Link>
      <button className="icon-btn" title="Sign out" aria-label="Sign out" onClick={() => void signOut()}><LogOut size={14} /></button>
    </div>
  );
}

/** Phone navigation: the four most-used sections plus the full menu. */
function TabBar({ onMenu }: { onMenu: () => void }) {
  const { c, settings } = useCourse();
  const due = Math.min(dueReviews(c).length, settings.dailyReviewCap);
  const item = (to: string, label: string, Icon: typeof Sun, badge?: number) => (
    <NavLink to={to} end={to === '/'}>
      <Icon size={19} strokeWidth={1.75} />
      {label}
      {badge ? <span className="badge">{badge}</span> : null}
    </NavLink>
  );
  return (
    <nav className="tabbar" aria-label="Main">
      {item('/', 'Today', Sun)}
      {item('/revise', 'Revise', RotateCcw, due)}
      {item('/lessons', 'Topics', BookOpen)}
      {item('/problems', 'Problems', ListChecks)}
      <button onClick={onMenu} aria-label="More sections"><Menu size={19} strokeWidth={1.75} />More</button>
    </nav>
  );
}

function Shell() {
  const authState = useAuth();
  if (!authState.ready) return <div className="empty">Loading…</div>;
  if (!authState.user) return <AuthPage />;
  return <SignedInShell key={authState.user.uid} />;
}

function SignedInShell() {
  const { app, course, settings } = useCourse();
  const [navOpen, setNavOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { applyTheme(settings.theme, course); }, [settings.theme, course]);
  useEffect(() => { setNavOpen(false); }, [loc.pathname]);

  if (!app.loaded) return <div className="empty">Loading your progress…</div>;
  if (!settings.lastCourse) return <CourseSelect />;
  const fullBleed = loc.pathname.startsWith('/problem/') || loc.pathname.startsWith('/scratchpad') || loc.pathname.startsWith('/interview/') || /^\/(build|guided|resolve)\//.test(loc.pathname);

  return (
    <div className={`app${navOpen ? ' nav-open' : ''}${fullBleed ? ' full-bleed' : ''}`}>
      <div className="mobile-bar">
        <button className="icon-btn" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Menu size={18} /></button>
        <span style={{ fontWeight: 700 }}>DSA Forge</span>
        <span className="tag" style={{ marginLeft: 'auto', color: 'var(--accent-ink)' }}>{course === 'python' ? 'Python' : 'Java'}</span>
      </div>
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}
      <Sidebar onNavigate={() => setNavOpen(false)} />
      <TabBar onMenu={() => setNavOpen(true)} />
      <main className="main" style={fullBleed ? { overflow: 'hidden' } : undefined}>
        <Suspense fallback={<div className="empty">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/revise" element={<Revise />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/problem/:id" element={<ProblemWorkspace />} />
            <Route path="/leetcode" element={<LeetCodeMap />} />
            <Route path="/leetcode/:id" element={<LeetCodeQuestion />} />
            <Route path="/lessons" element={<TopicsIndex />} />
            <Route path="/lessons/:topic" element={<TopicPage />} />
            <Route path="/build/:topic" element={<BuildPage />} />
            <Route path="/guided/:topic/:pid" element={<GuidedPage />} />
            <Route path="/resolve/:topic/:pid" element={<ResolvePage />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/gotchas" element={<Gotchas />} />
            <Route path="/interview/*" element={<Interview />} />
            <Route path="/scratchpad" element={<Scratchpad />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<div className="page"><p>Not found.</p></div>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
      <ToastHost />
    </HashRouter>
  );
}
