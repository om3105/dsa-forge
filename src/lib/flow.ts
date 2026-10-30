/* The 7-stage topic learning flow (4 stages for foundation topics).
   Stage completion is derived from course state, so it stays consistent with the tracker,
   the editor and the review schedule. A failed topic review reopens Pattern and Guided practice. */
import type { CourseId, CourseState, LcQuestion, Problem } from '../types';
import { LC_QUESTIONS } from '../data/lcQuestions';
import { PROBLEM_BY_ID } from '../data/problems';
import { ROADMAP } from '../data/roadmap';
import { TOPIC_BY_ID } from '../data/topics';
import { BUILD_BY_TOPIC } from '../data/flow/build';

export type StageKey = 'understand' | 'visualize' | 'build' | 'pattern' | 'guided' | 'solve' | 'recall';
export type StageStatus = 'locked' | 'active' | 'done';

export const STAGE_META: Record<StageKey, { title: string; short: string; minutes: number }> = {
  understand: { title: 'Understand', short: 'Theory + concept check', minutes: 20 },
  visualize: { title: 'Visualize', short: 'Walkthrough in predict mode', minutes: 10 },
  build: { title: 'Build', short: 'Implement it from scratch', minutes: 30 },
  pattern: { title: 'Pattern', short: 'Signals, template, spot-the-pattern', minutes: 15 },
  guided: { title: 'Guided practice', short: 'Plan first, hints available', minutes: 20 },
  solve: { title: 'Solve', short: 'Mapped LeetCode problems', minutes: 0 },
  recall: { title: 'Recall', short: 'Spaced topic reviews', minutes: 10 },
};

export const FOUNDATION_TOPICS = new Set(['lang-basics', 'lang-collections', 'complexity']);
const FULL: StageKey[] = ['understand', 'visualize', 'build', 'pattern', 'guided', 'solve', 'recall'];
const LIGHT: StageKey[] = ['understand', 'build', 'guided', 'recall'];
export const stagesFor = (topic: string): StageKey[] => (FOUNDATION_TOPICS.has(topic) ? LIGHT : FULL);
export const hasFlow = (topic: string) => !!TOPIC_BY_ID[topic] && topic !== 'mock';

/** Easy built-in problems for Stage 5 (Guided practice). */
export const GUIDED: Record<string, string[]> = {
  'lang-basics': ['running-sum-of-1d-array'],
  'lang-collections': ['contains-duplicate'],
  complexity: ['best-time-to-buy-and-sell-stock'],
  arrays: ['maximum-subarray'],
  'prefix-sum': ['find-pivot-index'],
  strings: ['valid-anagram', 'longest-common-prefix'],
  hashing: ['two-sum'],
  'two-pointers': ['squares-of-a-sorted-array', 'move-zeroes'],
  'sliding-window': ['maximum-sum-subarray-of-size-k', 'minimum-size-subarray-sum'],
  recursion: ['fibonacci-number'],
  sorting: ['sort-colors'],
  'binary-search': ['binary-search', 'search-insert-position'],
  'linked-list': ['reverse-linked-list', 'middle-of-the-linked-list'],
  stack: ['valid-parentheses'],
  'monotonic-stack': ['daily-temperatures'],
  queue: ['number-of-recent-calls'],
  intervals: ['merge-intervals'],
  trees: ['maximum-depth-of-binary-tree', 'invert-binary-tree'],
  bst: ['kth-smallest-element-in-a-bst'],
  heaps: ['last-stone-weight'],
  graphs: ['flood-fill'],
  'topo-sort': ['course-schedule'],
  'shortest-path': ['network-delay-time'],
  'union-find': ['number-of-provinces'],
  greedy: ['jump-game'],
  'dp-1d': ['climbing-stairs'],
  'dp-2d': ['unique-paths'],
  'dp-knapsack': ['partition-equal-subset-sum'],
  backtracking: ['subsets'],
  tries: ['implement-trie-prefix-tree'],
  bits: ['single-number', 'missing-number'],
};

/** Hints for problems that are not in the LeetCode map. */
export const EXTRA_HINTS: Record<string, string[]> = {
  'maximum-sum-subarray-of-size-k': ['Compute the first window\'s sum.', 'Slide by one: add the entering element, subtract the leaving one.', 'Track the maximum window sum.'],
};

const isSolved = (s?: string) => s === 'solved' || s === 'solved-with-help';
const RANK = { Easy: 0, Medium: 1, Hard: 2 } as const;

export function topicQuestions(topic: string): LcQuestion[] {
  return LC_QUESTIONS.filter((q) => q.topic === topic).sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty] || a.day - b.day);
}

export function solveTarget(topic: string): number {
  const core = topicQuestions(topic).filter((q) => q.difficulty !== 'Hard').length;
  return Math.min(3, core);
}

export interface StageView { key: StageKey; status: StageStatus; detail: string }
export interface TopicFlow { stages: StageView[]; current: StageKey | null; index: number; total: number; doneCount: number; reopened: boolean }

export function stageDone(c: CourseState, topic: string, key: StageKey): boolean {
  const t = c.topics[topic] ?? {};
  const reo = t.reopenedAt ?? 0;
  switch (key) {
    case 'understand': return !!t.understandAt;
    case 'visualize': return !!t.visualizeAt;
    case 'build': return !!c.problems[`build-${topic}`]?.passedAt || !BUILD_BY_TOPIC[topic];
    case 'pattern': return (t.patternAt ?? 0) > reo;
    case 'guided': return (GUIDED[topic] ?? []).every((pid) => (c.problems[pid]?.passedAt ?? 0) > reo && (c.plans[pid]?.at ?? 0) > reo);
    case 'solve': {
      const qs = topicQuestions(topic).filter((q) => q.difficulty !== 'Hard');
      return qs.filter((q) => isSolved(c.problems[q.id]?.status)).length >= solveTarget(topic);
    }
    case 'recall': {
      const r = c.reviews[`concept:${topic}`];
      return !!r && r.step >= 2 && r.lastRating !== 'again';
    }
  }
}

export function topicFlow(c: CourseState, topic: string): TopicFlow {
  const keys = stagesFor(topic);
  let blocked = false;
  const stages: StageView[] = keys.map((key) => {
    const done = stageDone(c, topic, key);
    const status: StageStatus = done && !(key === 'recall' && blocked) ? 'done' : blocked ? 'locked' : 'active';
    if (!done) blocked = true;
    return { key, status, detail: stageDetail(c, topic, key) };
  });
  const cur = stages.find((s) => s.status === 'active') ?? null;
  return {
    stages, current: cur?.key ?? null, index: cur ? keys.indexOf(cur.key) : keys.length,
    total: keys.length, doneCount: stages.filter((s) => s.status === 'done').length,
    reopened: !!c.topics[topic]?.reopenedAt && (!stageDone(c, topic, 'pattern') || !stageDone(c, topic, 'guided')),
  };
}

function stageDetail(c: CourseState, topic: string, key: StageKey): string {
  const t = c.topics[topic] ?? {};
  switch (key) {
    case 'understand': return t.mcq != null ? `concept check ${t.mcq}/3` : '3-question check';
    case 'visualize': return t.predict ? `predictions ${t.predict.correct}/${t.predict.total}` : 'predict mode';
    case 'build': return c.problems[`build-${topic}`]?.passedAt ? 'all tests passed' : 'from scratch';
    case 'pattern': return t.spot != null ? `spot quiz ${t.spot}/4` : 'spot the pattern';
    case 'guided': { const g = GUIDED[topic] ?? []; return `${g.filter((pid) => c.problems[pid]?.passedAt).length}/${g.length} passed`; }
    case 'solve': { const qs = topicQuestions(topic); return `${qs.filter((q) => isSolved(c.problems[q.id]?.status)).length}/${solveTarget(topic)} needed`; }
    case 'recall': { const r = c.reviews[`concept:${topic}`]; return r ? `next ${r.due}` : 'after the topic'; }
  }
}

/** Every stage before Solve (or before Recall for foundations) is done. */
export function readyForSolve(c: CourseState, topic: string): boolean {
  const keys = stagesFor(topic);
  const stop = keys.includes('solve') ? keys.indexOf('solve') : keys.indexOf('recall');
  return keys.slice(0, stop).every((k) => stageDone(c, topic, k));
}

/** Topic flow unlock for a LeetCode question: concepts ready, then Easy → Medium → optional Hard. */
export function flowUnlocksQuestion(_course: CourseId, c: CourseState, q: LcQuestion): boolean {
  // Stage 6 of the question's own topic, or every concept it builds on, is reached
  if (!readyForSolve(c, q.topic) && !q.concepts.every((t) => readyForSolve(c, t))) return false;
  if (q.difficulty === 'Easy') return true;
  const same = topicQuestions(q.topic);
  const need = q.difficulty === 'Medium' ? 'Easy' : 'Medium';
  const pool = same.filter((x) => x.difficulty === need);
  return pool.length === 0 || pool.some((x) => isSolved(c.problems[x.id]?.status));
}

/** Topics whose review should now be scheduled (stages before Recall done, not yet enrolled). */
export function topicsToEnroll(c: CourseState): string[] {
  return Object.keys(TOPIC_BY_ID).filter((t) => hasFlow(t) && !c.reviews[`concept:${t}`] && stagesFor(t).slice(0, -1).every((k) => stageDone(c, t, k)));
}

// ------------------------------------------------------------------ Stage 4 spot-the-pattern quiz
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
function shuffle<T>(a: T[], rnd: () => number): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}

export interface SpotItem { id: string; text: string; uses: boolean }
export function spotQuiz(topic: string, attempt: number): SpotItem[] {
  const pats = TOPIC_BY_ID[topic]?.patterns ?? [];
  const uses = (q: LcQuestion) => q.topic === topic || pats.includes(q.pattern);
  const rnd = seeded(`${topic}:${attempt}`);
  const pos = shuffle(LC_QUESTIONS.filter(uses), rnd).slice(0, 2);
  const neg = shuffle(LC_QUESTIONS.filter((q) => !uses(q) && q.difficulty !== 'Hard'), rnd).slice(0, 4 - pos.length);
  return shuffle([...pos, ...neg], rnd).map((q) => ({ id: q.id, text: q.summary, uses: uses(q) }));
}

// ------------------------------------------------------------------ Stage 7 re-solve candidate
/** A previously solved problem of this topic to re-solve during review — the one solved longest ago. */
export function resolveCandidate(c: CourseState, topic: string): Problem | undefined {
  const ids = new Set([...(GUIDED[topic] ?? []), ...topicQuestions(topic).map((q) => q.id)]);
  const solved = [...ids].map((id) => PROBLEM_BY_ID[id]).filter((p) => p && (isSolved(c.problems[p.id]?.status) || c.problems[p.id]?.passedAt));
  const when = (p: Problem) => c.problems[p.id]?.passedAt ?? c.problems[p.id]?.solvedAt ?? 0;
  const builtin = solved.filter((p) => p.builtin).sort((a, b) => when(a) - when(b));
  return builtin[0] ?? solved.sort((a, b) => when(a) - when(b))[0];
}

// ------------------------------------------------------------------ roadmap day plan
const MIN_BY_DIFF = { Easy: 20, Medium: 35, Hard: 50 } as const;
export interface DayStage { key: StageKey | 'mock'; label: string; minutes: number }

export function dayPlan(day: number): DayStage[] {
  const d = ROADMAP[day - 1];
  const solveMin = d.problems.reduce((s, id) => s + MIN_BY_DIFF[PROBLEM_BY_ID[id]?.difficulty ?? 'Medium'], 0);
  if (d.mock || d.topic === 'mock') {
    return [...(d.mock ? [{ key: 'mock' as const, label: 'Mock interview', minutes: 60 }] : []), { key: 'solve', label: d.mock ? 'Review the mock problems' : 'Revision sprint problems', minutes: d.mock ? 20 : solveMin }];
  }
  const first = ROADMAP.find((x) => x.topic === d.topic)?.day === day;
  const out: DayStage[] = [];
  if (first) {
    for (const k of stagesFor(d.topic)) {
      if (k === 'solve' || k === 'recall') continue;
      const mins = k === 'guided' ? STAGE_META.guided.minutes * (GUIDED[d.topic]?.length ?? 1) : STAGE_META[k].minutes;
      out.push({ key: k, label: STAGE_META[k].title, minutes: mins });
    }
  }
  out.push({ key: 'solve', label: first ? 'Solve (today\'s LeetCode set)' : 'Solve (continue the topic)', minutes: solveMin });
  return out;
}

export const dayMinutes = (day: number) => dayPlan(day).reduce((s, x) => s + x.minutes, 0);
