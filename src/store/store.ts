import { useSyncExternalStore } from 'react';
import type { CodeRecord, CourseId, CourseState, Flashcard, InterviewSession, ProblemLog, Rating, ReviewItem, Settings } from '../types';
import { COURSES } from '../types';
import { addDays, newItem, rescheduleFromConfidence, review, today } from '../lib/srs';
import { topicCards } from '../data/lessons';
import { topicsToEnroll } from '../lib/flow';
import { KEYS, getRepo, localRepo, type Repo } from './repo';

const LOCAL_PISTON = 'http://localhost:2000';
// The deployed site uses the cloud runner (runner/); local development keeps the local Piston.
const DEFAULT_SERVER = import.meta.env.VITE_RUNNER_URL || LOCAL_PISTON;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  pistonUrl: DEFAULT_SERVER,
  engine: 'auto',
  timeoutMs: 5000,
  memoryMb: 256,
  dailyReviewCap: 25,
  pythonVersion: '*',
  javaVersion: '*',
  skipLock: false,
};

export const emptyCourse = (course: CourseId): CourseState => ({
  version: 1, course, completedDays: {}, problems: {}, reviews: {}, customCards: [],
  notes: {}, lessonsDone: {}, activity: {}, interviews: [],
  templatesReviewed: {}, recall: {}, skipPassed: {}, hintsUsed: {},
  topics: {}, plans: {}, resolves: {},
});

interface AppState {
  loaded: boolean;
  settings: Settings;
  courses: Record<CourseId, CourseState>;
}

let state: AppState = {
  loaded: false,
  settings: DEFAULT_SETTINGS,
  courses: { python: emptyCourse('python'), java: emptyCourse('java') },
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, () => state);
}
export const getState = () => state;

// ---------------- persistence ----------------
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
// each pending write remembers the account it belongs to, so switching users never mixes data
const pendingWrites = new Map<string, { value: unknown; repo: Repo }>();
async function write(key: string) {
  if (!pendingWrites.has(key)) return;
  const { value, repo } = pendingWrites.get(key)!;
  pendingWrites.delete(key);
  await repo.set(key, value);
}
function persist(key: string, value: unknown) {
  pendingWrites.set(key, { value, repo: activeRepoNow });
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => void write(key), 250);
}
// Flush debounced writes when the tab is hidden or closed.
const flushAll = () => Promise.all([...pendingWrites.keys()].map((k) => { clearTimeout(timers[k]); return write(k); }));
/** Write everything still waiting in the debounce queue (before sign-out). */
export const flushPending = () => flushAll().catch(() => undefined);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void flushAll(); });
window.addEventListener('pagehide', () => void flushAll());

let activeRepoNow: Repo = localRepo;

/** Data saved in this browser before accounts existed is copied into the account the first time it signs in. */
async function migrateLocalData(repo: Repo) {
  if (repo === localRepo) return;
  const hasCloud = (await repo.get(KEYS.settings)) !== undefined || (await Promise.all(COURSES.map((c) => repo.get(KEYS.course(c))))).some(Boolean);
  if (hasCloud) return;
  const keys = [KEYS.settings, ...COURSES.map((c) => KEYS.course(c))];
  for (const c of COURSES) keys.push(...(await localRepo.keys(KEYS.codePrefix(c))));
  for (const k of keys) {
    const v = await localRepo.get(k);
    if (v !== undefined) await repo.set(k, v);
  }
}

export async function loadAll() {
  await flushAll().catch(() => undefined);
  const repo = await getRepo();
  activeRepoNow = repo;
  codeCache.clear();
  state = { ...state, loaded: false };
  emit();
  try { await migrateLocalData(repo); } catch (e) { console.warn('local data migration failed', e); }
  const settings = { ...DEFAULT_SETTINGS, ...((await repo.get<Settings>(KEYS.settings)) ?? {}) };
  // A localhost server URL (the old default, or one set while developing) can never work on the
  // hosted site, so use the cloud runner there instead.
  const isLocal = (host: string) => /^(localhost|127\.0\.0\.1)$/.test(host);
  let savedHost = '';
  try { savedHost = new URL(settings.pistonUrl).hostname; } catch { /* not a URL */ }
  if (isLocal(savedHost) && DEFAULT_SERVER !== LOCAL_PISTON && !isLocal(location.hostname)) {
    settings.pistonUrl = DEFAULT_SERVER;
  }
  const courses = { ...state.courses };
  for (const c of COURSES) {
    const saved = await repo.get<CourseState>(KEYS.course(c));
    const base = saved ? { ...emptyCourse(c), ...saved } : emptyCourse(c);
    courses[c] = enrollTopics(base);
    if (courses[c] !== base) await repo.set(KEYS.course(c), courses[c]); // persist newly scheduled topic reviews
  }
  state = { loaded: true, settings, courses };
  emit();
}

function setSettings(patch: Partial<Settings>) {
  state = { ...state, settings: { ...state.settings, ...patch } };
  persist(KEYS.settings, state.settings);
  emit();
}

/** Topics that just finished their learning stages enter spaced repetition (Stage 7). */
function enrollTopics(c: CourseState): CourseState {
  const ids = topicsToEnroll(c);
  if (!ids.length) return c;
  const reviews = { ...c.reviews };
  for (const t of ids) reviews[`concept:${t}`] = newItem('concept', t);
  return { ...c, reviews };
}

function updateCourse(course: CourseId, fn: (c: CourseState) => CourseState) {
  const next = enrollTopics(fn(state.courses[course]));
  state = { ...state, courses: { ...state.courses, [course]: next } };
  persist(KEYS.course(course), next);
  emit();
}

const bump = (c: CourseState): Record<string, number> => {
  const t = today();
  return { ...c.activity, [t]: (c.activity[t] ?? 0) + 1 };
};

// ---------------- actions ----------------
export const actions = {
  setSettings,

  chooseCourse(course: CourseId) {
    setSettings({ lastCourse: course });
    if (!state.courses[course].startedOn) updateCourse(course, (c) => ({ ...c, startedOn: today() }));
  },

  toggleDay(course: CourseId, day: number) {
    updateCourse(course, (c) => {
      const completedDays = { ...c.completedDays };
      if (completedDays[day]) delete completedDays[day];
      else completedDays[day] = today();
      return { ...c, completedDays, activity: completedDays[day] ? bump(c) : c.activity };
    });
  },

  logProblem(course: CourseId, pid: string, patch: Partial<ProblemLog>) {
    updateCourse(course, (c) => {
      const prev: ProblemLog = c.problems[pid] ?? { status: 'not-started', attempts: 0, wrong: 0, updatedAt: Date.now() };
      const next: ProblemLog = { ...prev, ...patch, updatedAt: Date.now() };
      const becameSolved = (next.status === 'solved' || next.status === 'solved-with-help') && prev.status !== next.status;
      if (becameSolved) next.solvedAt = Date.now();
      if (next.status === 'solved-with-help' && prev.status !== 'solved-with-help') next.wrong = prev.wrong + 1;
      const reviews = { ...c.reviews };
      const rid = `problem:${pid}`;
      if (next.status === 'solved' || next.status === 'solved-with-help') {
        const withHelp = next.status === 'solved-with-help';
        const conf = next.confidence ?? (withHelp ? 2 : 3);
        if (!reviews[rid]) reviews[rid] = newItem('problem', pid, { confidence: conf, withHelp });
        else if (becameSolved) reviews[rid] = rescheduleFromConfidence(reviews[rid], conf, withHelp);
      }
      return { ...c, problems: { ...c.problems, [pid]: next }, reviews, activity: becameSolved ? bump(c) : c.activity };
    });
  },

  recordSubmit(course: CourseId, pid: string, passed: number, total: number) {
    updateCourse(course, (c) => {
      const prev: ProblemLog = c.problems[pid] ?? { status: 'not-started', attempts: 0, wrong: 0, updatedAt: Date.now() };
      const allPass = passed === total;
      const next: ProblemLog = {
        ...prev,
        attempts: prev.attempts + 1,
        wrong: prev.wrong + (allPass ? 0 : 1),
        passedAt: allPass ? Date.now() : prev.passedAt,
        status: prev.status === 'not-started' ? 'attempted' : prev.status,
        updatedAt: Date.now(),
      };
      return { ...c, problems: { ...c.problems, [pid]: next }, activity: bump(c) };
    });
  },

  rate(course: CourseId, reviewId: string, rating: Rating) {
    updateCourse(course, (c) => {
      const item = c.reviews[reviewId];
      if (!item) return c;
      const reviews = { ...c.reviews, [reviewId]: review(item, rating) };
      let problems = c.problems;
      if (item.kind === 'problem' && rating === 'again') {
        const p = c.problems[item.refId];
        if (p) problems = { ...problems, [item.refId]: { ...p, wrong: p.wrong + 1, updatedAt: Date.now() } };
      }
      return { ...c, reviews, problems, activity: bump(c) };
    });
  },

  /** Lesson finished: schedule the concept and enrol its flashcards. */
  completeLesson(course: CourseId, topic: string) {
    updateCourse(course, (c) => {
      const reviews = { ...c.reviews };
      for (const card of topicCards(course, topic)) {
        const id = `card:${card.id}`;
        if (!reviews[id]) reviews[id] = newItem('card', card.id);
      }
      return { ...c, lessonsDone: { ...c.lessonsDone, [topic]: today() }, reviews, activity: bump(c) };
    });
  },

  addCard(course: CourseId, card: Omit<Flashcard, 'id' | 'custom'>) {
    const id = `custom:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    updateCourse(course, (c) => ({
      ...c,
      customCards: [...c.customCards, { ...card, id, custom: true }],
      reviews: { ...c.reviews, [`card:${id}`]: newItem('card', id) },
      activity: bump(c),
    }));
  },

  deleteCard(course: CourseId, id: string) {
    updateCourse(course, (c) => {
      const reviews = { ...c.reviews };
      delete reviews[`card:${id}`];
      return { ...c, customCards: c.customCards.filter((x) => x.id !== id), reviews };
    });
  },

  markTemplateReviewed(course: CourseId, topic: string) {
    updateCourse(course, (c) => ({ ...c, templatesReviewed: { ...c.templatesReviewed, [topic]: today() }, activity: bump(c) }));
  },

  /** Recall check for a LeetCode question: missed cards go into the spaced-repetition deck due tomorrow. */
  finishRecall(course: CourseId, qid: string, passed: boolean, missedCardIds: string[]) {
    updateCourse(course, (c) => {
      const reviews = { ...c.reviews };
      for (const id of missedCardIds) {
        const rid = `card:${id}`;
        reviews[rid] = reviews[rid] ? review(reviews[rid], 'again') : newItem('card', id, { confidence: 1 });
      }
      return { ...c, reviews, recall: passed ? { ...c.recall, [qid]: today() } : c.recall, activity: bump(c) };
    });
  },

  passSkipQuiz(course: CourseId, topics: string[]) {
    updateCourse(course, (c) => {
      const skipPassed = { ...c.skipPassed };
      for (const t of topics) skipPassed[t] = today();
      return { ...c, skipPassed, activity: bump(c) };
    });
  },

  /** Revealing a hint marks "help used" on the problem in the tracker. */
  revealHint(course: CourseId, qid: string, count: number) {
    updateCourse(course, (c) => {
      const prev: ProblemLog = c.problems[qid] ?? { status: 'not-started', attempts: 0, wrong: 0, updatedAt: Date.now() };
      return {
        ...c,
        hintsUsed: { ...c.hintsUsed, [qid]: Math.max(c.hintsUsed[qid] ?? 0, count) },
        problems: { ...c.problems, [qid]: { ...prev, helpUsed: true, updatedAt: Date.now() } },
      };
    });
  },

  // ---------------- 7-stage topic flow ----------------
  passUnderstand(course: CourseId, topic: string, score: number) {
    updateCourse(course, (c) => {
      const t = c.topics[topic] ?? {};
      const reviews = { ...c.reviews };
      for (const card of topicCards(course, topic)) {
        const id = `card:${card.id}`;
        if (!reviews[id]) reviews[id] = newItem('card', card.id);
      }
      return {
        ...c, reviews,
        topics: { ...c.topics, [topic]: { ...t, understandAt: t.understandAt ?? Date.now(), mcq: Math.max(t.mcq ?? 0, score) } },
        lessonsDone: { ...c.lessonsDone, [topic]: c.lessonsDone[topic] ?? today() },
        activity: bump(c),
      };
    });
  },

  recordMcq(course: CourseId, topic: string, score: number) {
    updateCourse(course, (c) => ({ ...c, topics: { ...c.topics, [topic]: { ...(c.topics[topic] ?? {}), mcq: Math.max(c.topics[topic]?.mcq ?? 0, score) } } }));
  },

  finishVisualize(course: CourseId, topic: string, correct: number, total: number) {
    updateCourse(course, (c) => {
      const t = c.topics[topic] ?? {};
      return { ...c, topics: { ...c.topics, [topic]: { ...t, visualizeAt: t.visualizeAt ?? Date.now(), predict: { correct, total } } }, activity: bump(c) };
    });
  },

  passPattern(course: CourseId, topic: string, score: number) {
    updateCourse(course, (c) => ({
      ...c,
      topics: { ...c.topics, [topic]: { ...(c.topics[topic] ?? {}), patternAt: Date.now(), spot: score } },
      templatesReviewed: { ...c.templatesReviewed, [topic]: today() },
      activity: bump(c),
    }));
  },

  recordSpot(course: CourseId, topic: string, score: number) {
    updateCourse(course, (c) => ({ ...c, topics: { ...c.topics, [topic]: { ...(c.topics[topic] ?? {}), spot: score } } }));
  },

  savePlan(course: CourseId, pid: string, plan: { brute: string; optimized: string; complexity: string }) {
    updateCourse(course, (c) => ({ ...c, plans: { ...c.plans, [pid]: { ...plan, at: Date.now() } }, activity: bump(c) }));
  },

  markResolve(course: CourseId, topic: string, pid: string) {
    updateCourse(course, (c) => ({ ...c, resolves: { ...c.resolves, [topic]: { pid, at: Date.now() } }, activity: bump(c) }));
  },

  /** Failed topic review: back to 1 day, and Pattern + Guided practice must be redone. */
  failTopicReview(course: CourseId, topic: string) {
    updateCourse(course, (c) => {
      const rid = `concept:${topic}`;
      const reviews = c.reviews[rid] ? { ...c.reviews, [rid]: review(c.reviews[rid], 'again') } : c.reviews;
      const t = c.topics[topic] ?? {};
      return { ...c, reviews, topics: { ...c.topics, [topic]: { ...t, reopenedAt: Date.now(), reopenCount: (t.reopenCount ?? 0) + 1 } }, activity: bump(c) };
    });
  },

  /** Result reported after attempting a question on LeetCode. Feeds the tracker and the review schedule. */
  recordLeetCode(course: CourseId, qid: string, r: { result: 'solved' | 'solved-with-help' | 'couldnt'; minutes?: number; confidence?: number; explanation?: string; pattern?: string }) {
    updateCourse(course, (c) => {
      const prev: ProblemLog = c.problems[qid] ?? { status: 'not-started', attempts: 0, wrong: 0, updatedAt: Date.now() };
      const now = Date.now();
      // any revealed hint turns "solved" into "solved with help"
      if (r.result === 'solved' && (prev.helpUsed || (c.hintsUsed[qid] ?? 0) > 0)) r = { ...r, result: 'solved-with-help' };
      const solved = r.result !== 'couldnt';
      const next: ProblemLog = {
        ...prev,
        status: solved ? r.result as ProblemLog['status'] : (prev.status === 'solved' || prev.status === 'solved-with-help' ? prev.status : 'attempted'),
        minutes: r.minutes ?? prev.minutes,
        confidence: r.confidence ?? prev.confidence,
        explanation: r.explanation?.trim() || prev.explanation,
        pattern: r.pattern ?? prev.pattern,
        attempts: prev.attempts + 1,
        wrong: prev.wrong + (r.result === 'solved' ? 0 : 1),
        lcResult: r.result,
        lcAt: now,
        updatedAt: now,
        solvedAt: solved ? now : prev.solvedAt,
      };
      const reviews = { ...c.reviews };
      const rid = `problem:${qid}`;
      if (solved) {
        const conf = r.confidence ?? (r.result === 'solved-with-help' ? 2 : 3);
        reviews[rid] = reviews[rid]
          ? rescheduleFromConfidence(reviews[rid], conf, r.result === 'solved-with-help')
          : newItem('problem', qid, { confidence: conf, withHelp: r.result === 'solved-with-help' });
      } else {
        // couldn't solve: retry in 2 days, starting the ladder again
        const base = reviews[rid] ?? newItem('problem', qid, { confidence: 1 });
        reviews[rid] = { ...base, step: 0, interval: 2, due: addDays(today(), 2), lapses: base.lapses + (reviews[rid] ? 1 : 0), lastRating: 'again' };
      }
      return { ...c, problems: { ...c.problems, [qid]: next }, reviews, activity: bump(c) };
    });
  },

  setNote(course: CourseId, topic: string, text: string) {
    updateCourse(course, (c) => ({ ...c, notes: { ...c.notes, [topic]: text } }));
  },

  saveInterview(course: CourseId, s: InterviewSession) {
    updateCourse(course, (c) => {
      const others = c.interviews.filter((x) => x.id !== s.id);
      return { ...c, interviews: [...others, s].sort((a, b) => a.startedAt - b.startedAt), activity: s.endedAt ? bump(c) : c.activity };
    });
  },

  async resetCourse(course: CourseId) {
    const repo = await getRepo();
    for (const k of await repo.keys(KEYS.codePrefix(course))) await repo.del(k);
    codeCache.clear();
    updateCourse(course, () => ({ ...emptyCourse(course), startedOn: today() }));
  },
};

// ---------------- code storage (separate keys; can be large) ----------------
const codeCache = new Map<string, CodeRecord>();

export async function loadCode(course: CourseId, pid: string): Promise<CodeRecord | undefined> {
  const key = KEYS.code(course, pid);
  if (codeCache.has(key)) return codeCache.get(key);
  const repo = await getRepo();
  const rec = await repo.get<CodeRecord>(key);
  if (rec) codeCache.set(key, rec);
  return rec;
}

export function saveCode(course: CourseId, pid: string, code: string) {
  const key = KEYS.code(course, pid);
  const prev = codeCache.get(key) ?? { current: '', snapshots: [] };
  const rec = { ...prev, current: code };
  codeCache.set(key, rec);
  persist(key, rec);
}

export function snapshotCode(course: CourseId, pid: string, code: string, passed: number, total: number, source: 'editor' | 'leetcode' = 'editor') {
  const key = KEYS.code(course, pid);
  const prev = codeCache.get(key) ?? { current: source === 'editor' ? code : '', snapshots: [] };
  const last = prev.snapshots[prev.snapshots.length - 1];
  const snapshots = last && last.code === code ? prev.snapshots : [...prev.snapshots, { at: Date.now(), code, passed, total, source }].slice(-20);
  // code pasted from LeetCode is history only; it does not replace the editor draft
  const rec = { current: source === 'editor' ? code : prev.current, snapshots };
  codeCache.set(key, rec);
  persist(key, rec);
}

// ---------------- export / import ----------------
export interface ExportFile {
  app: 'dsa-forge';
  version: 1;
  exportedAt: string;
  settings: Settings;
  courses: Record<CourseId, CourseState>;
  code: Record<CourseId, Record<string, CodeRecord>>;
}

export async function exportData(): Promise<ExportFile> {
  const repo = await getRepo();
  const code = { python: {}, java: {} } as ExportFile['code'];
  for (const c of COURSES) {
    for (const k of await repo.keys(KEYS.codePrefix(c))) {
      const rec = await repo.get<CodeRecord>(k);
      if (rec) code[c][k.slice(KEYS.codePrefix(c).length)] = rec;
    }
  }
  return { app: 'dsa-forge', version: 1, exportedAt: new Date().toISOString(), settings: state.settings, courses: state.courses, code };
}

export async function importData(raw: unknown): Promise<void> {
  const data = raw as ExportFile;
  if (!data || data.app !== 'dsa-forge' || data.version !== 1 || !data.courses) throw new Error('This is not a DSA Forge export file.');
  const repo = await getRepo();
  for (const c of COURSES) {
    for (const k of await repo.keys(KEYS.codePrefix(c))) await repo.del(k);
    for (const [pid, rec] of Object.entries(data.code?.[c] ?? {})) await repo.set(KEYS.code(c, pid), rec);
    const course = { ...emptyCourse(c), ...(data.courses[c] ?? {}) };
    await repo.set(KEYS.course(c), course);
  }
  await repo.set(KEYS.settings, { ...DEFAULT_SETTINGS, ...data.settings });
  codeCache.clear();
  await loadAll();
}

// ---------------- derived helpers ----------------
export function currentDay(c: CourseState, total: number): number {
  for (let d = 1; d <= total; d++) if (!c.completedDays[d]) return d;
  return total + 1;
}

export function dueReviews(c: CourseState, on = today()): ReviewItem[] {
  return Object.values(c.reviews).filter((r) => r.due <= on);
}
