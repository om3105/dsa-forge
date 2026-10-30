/* LeetCode question mapping: prerequisite path, lock state and retry suggestions. */
import type { CourseId, CourseState, Flashcard, LcQuestion, Settings } from '../types';
import { LC_BY_ID, LC_QUESTIONS } from '../data/lcQuestions';
import { flowUnlocksQuestion } from './flow';
import { PROBLEM_BY_ID } from '../data/problems';
import { TOPIC_BY_ID } from '../data/topics';
import { getLesson, topicCards } from '../data/lessons';
import { topicStats } from './stats';
import { snake } from './harness';

export { LC_BY_ID, LC_QUESTIONS };

export type StepKey = 'concepts' | 'template' | 'warmups' | 'recall';
export interface StepItem { id: string; label: string; done: boolean; href?: string }
export interface Step { key: StepKey; title: string; done: boolean; items: StepItem[] }
export type LcStatus = 'locked' | 'unlocked' | 'solved' | 'retry';

export interface QuestionState {
  steps: Step[];
  /** unlocked by finishing the topic's learning stages */
  viaFlow?: boolean;
  doneCount: number;
  total: number;
  /** every prerequisite step complete */
  pathComplete: boolean;
  /** unlocked through the skip-lock concept quiz */
  skipped: boolean;
  unlocked: boolean;
  status: LcStatus;
}

// Template functions whose names differ from the judge signature but still solve the question.
const TEMPLATE_ALIASES: Record<string, string[]> = {
  'longest-common-subsequence': ['lcs'],
  'two-sum-ii-input-array-is-sorted': ['two_sum_sorted'],
  'longest-substring-without-repeating-characters': ['longest_unique'],
  'sort-an-array': ['merge_sort'],
  'middle-of-the-linked-list': ['middle'],
  'merge-two-sorted-lists': ['merge'],
};

/** True when the lesson template is a worked solution of this exact question (then it is hidden on the question page). */
export function templateSolves(course: CourseId, q: LcQuestion): boolean {
  const t = q.patternTemplate ? getLesson(course, q.patternTemplate).lang?.template : undefined;
  const p = PROBLEM_BY_ID[q.id];
  if (!t) return false;
  // aliases are Python template names; Java templates use the judge's method names
  const names = course === 'python' ? [...(TEMPLATE_ALIASES[q.id] ?? [])] : [];
  if (p?.signature) {
    const n = p.signature.kind === 'function' ? p.signature.name : p.signature.className;
    names.push(course === 'python' && p.signature.kind === 'function' ? snake(n) : n);
  }
  return names.some((n) => new RegExp(`(def |class |\\s)${n}\\(|class ${n}\\b`).test(t));
}

export const templateExists = (course: CourseId, topic: string | null) => !!topic && !!getLesson(course, topic).lang?.template;

export function questionState(course: CourseId, c: CourseState, settings: Settings, q: LcQuestion): QuestionState {
  const steps: Step[] = [];
  const concepts: StepItem[] = q.concepts.map((t) => ({ id: t, label: TOPIC_BY_ID[t]?.title ?? t, done: !!c.lessonsDone[t], href: `/lessons/${t}?stage=understand` }));
  steps.push({ key: 'concepts', title: 'Read the concept lesson' + (concepts.length > 1 ? 's' : ''), done: concepts.every((x) => x.done), items: concepts });
  if (templateExists(course, q.patternTemplate)) {
    const t = q.patternTemplate!;
    const item = { id: t, label: `${TOPIC_BY_ID[t]?.title} template`, done: !!c.templatesReviewed[t], href: `/lessons/${t}?stage=pattern` };
    steps.push({ key: 'template', title: 'Review the pattern template', done: item.done, items: [item] });
  }
  const warm: StepItem[] = q.warmups.map((id) => ({ id, label: PROBLEM_BY_ID[id]?.title ?? id, done: !!c.problems[id]?.passedAt, href: `/problem/${id}` }));
  steps.push({ key: 'warmups', title: 'Pass the warm-up' + (warm.length > 1 ? 's' : '') + ' in the editor', done: warm.every((x) => x.done), items: warm });
  const recall = { id: q.id, label: 'Recall check (3 flashcards)', done: !!c.recall[q.id] };
  steps.push({ key: 'recall', title: 'Answer quick recall flashcards', done: recall.done, items: [recall] });

  const doneCount = steps.filter((s) => s.done).length;
  const pathComplete = doneCount === steps.length;
  const skipped = settings.skipLock && q.concepts.every((t) => !!c.skipPassed[t]);
  const log = c.problems[q.id];
  const solved = log?.status === 'solved' || log?.status === 'solved-with-help';
  // a question you already solved (here or before the lock existed) never re-locks
  // the topic learning flow (stages 1–5 of every concept) also unlocks it, Easy → Medium → Hard
  const viaFlow = flowUnlocksQuestion(course, c, q);
  const unlocked = pathComplete || skipped || viaFlow || solved || !!log?.lcAt;
  const status: LcStatus = solved ? 'solved' : log?.lcResult === 'couldnt' ? 'retry' : unlocked ? 'unlocked' : 'locked';
  return { steps, doneCount, total: steps.length, pathComplete, skipped, viaFlow, unlocked, status };
}

/** Deterministic shuffle so a question's recall cards are stable per attempt but differ between questions. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
export function pickCards(course: CourseId, topics: string[], n: number, seed: string): Flashcard[] {
  const pool = topics.flatMap((t) => topicCards(course, t));
  const rnd = seeded(seed);
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr.slice(0, n);
}

export interface RetrySuggestion { label: string; reason: string; href: string }

/** After "Couldn't solve": point at the weakest prerequisite. */
export function retrySuggestion(course: CourseId, c: CourseState, q: LcQuestion): RetrySuggestion {
  const shakyWarmup = q.warmups
    .map((id) => ({ id, log: c.problems[id] }))
    .filter((w) => w.log && (w.log.wrong > 0 || (w.log.confidence ?? 5) <= 3))
    .sort((a, b) => (b.log!.wrong - a.log!.wrong) || ((a.log!.confidence ?? 5) - (b.log!.confidence ?? 5)))[0];
  if (shakyWarmup) {
    return {
      label: `Re-solve the warm-up "${PROBLEM_BY_ID[shakyWarmup.id].title}" from scratch`,
      reason: `It took ${shakyWarmup.log!.wrong} failed attempt(s)${shakyWarmup.log!.confidence ? ` and you rated it ${shakyWarmup.log!.confidence}/5` : ''}; the LeetCode question builds directly on it.`,
      href: `/problem/${shakyWarmup.id}`,
    };
  }
  const stats = topicStats(c);
  const weakest = [...q.concepts].sort((a, b) => (stats.find((s) => s.topic === a)?.mastery ?? 0) - (stats.find((s) => s.topic === b)?.mastery ?? 0))[0];
  const tpl = q.patternTemplate && q.concepts.includes(q.patternTemplate) ? q.patternTemplate : weakest;
  return {
    label: `Revisit the ${TOPIC_BY_ID[tpl]?.title} lesson — especially "When to use it" and the template`,
    reason: `Mastery for ${TOPIC_BY_ID[weakest]?.title} is the lowest among this question's concepts. Rewrite the template from memory in the scratchpad, then retry.`,
    href: `/lessons/${tpl}`,
  };
}

export function leetcodeLabel(q: LcQuestion) {
  return `${q.number}. ${q.title}`;
}
