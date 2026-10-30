import type { CourseState, Problem, ProblemLog } from '../types';
import { PROBLEMS, PROBLEM_BY_ID } from '../data/problems';
import { CORE_PATTERNS, TOPICS } from '../data/topics';
import { addDays, today } from './srs';

export const READINESS_TARGETS = { problems: 225, mocks: 5 };

export function streak(c: CourseState): { current: number; best: number; activeToday: boolean } {
  const days = new Set(Object.keys(c.activity).filter((d) => c.activity[d] > 0));
  const t = today();
  const activeToday = days.has(t);
  let cur = 0;
  let d = activeToday ? t : addDays(t, -1);
  while (days.has(d)) { cur++; d = addDays(d, -1); }
  let best = 0;
  const sorted = [...days].sort();
  let run = 0;
  let prev = '';
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return { current: cur, best, activeToday };
}

const isSolved = (l?: ProblemLog) => l?.status === 'solved' || l?.status === 'solved-with-help';

/** "Well understood": solved unaided with confidence ≥ 4, or has survived at least two spaced reviews. */
export function wellUnderstood(c: CourseState, pid: string): boolean {
  const log = c.problems[pid];
  if (!isSolved(log)) return false;
  const r = c.reviews[`problem:${pid}`];
  if (r && r.step >= 2 && r.lastRating !== 'again') return true;
  return log!.status === 'solved' && (log!.confidence ?? 0) >= 4;
}

export interface TopicStat {
  topic: string;
  total: number;
  solved: number;
  wellUnderstood: number;
  avgConfidence: number | null;
  wrong: number;
  lapses: number;
  mastery: number; // 0..100
  lessonDone: boolean;
}

export function topicStats(c: CourseState): TopicStat[] {
  return TOPICS.filter((t) => t.id !== 'mock').map((t) => {
    const probs = PROBLEMS.filter((p) => p.topic === t.id);
    const logs = probs.map((p) => c.problems[p.id]).filter(Boolean) as ProblemLog[];
    const solvedLogs = logs.filter(isSolved);
    const confs = solvedLogs.map((l) => l.confidence).filter((x): x is number => typeof x === 'number');
    const avgConfidence = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null;
    const reviews = probs.map((p) => c.reviews[`problem:${p.id}`]).filter(Boolean);
    const conceptReview = c.reviews[`concept:${t.id}`];
    const allReviews = conceptReview ? [...reviews, conceptReview] : reviews;
    const lapses = allReviews.reduce((s, r) => s + r!.lapses, 0);
    const wrong = logs.reduce((s, l) => s + l.wrong, 0);
    const wu = probs.filter((p) => wellUnderstood(c, p.id)).length;

    // Mastery blends coverage, self-rated confidence and spaced-review retention.
    const coverage = probs.length ? Math.min(1, solvedLogs.length / Math.min(probs.length, 6)) : (c.lessonsDone[t.id] ? 1 : 0);
    const confidence = avgConfidence == null ? 0 : (avgConfidence - 1) / 4;
    const retention = allReviews.length
      ? allReviews.reduce((s, r) => s + Math.min(r!.step, 4) / 4, 0) / allReviews.length
      : 0;
    const penalty = Math.min(0.3, (wrong + lapses) * 0.03);
    const mastery = Math.round(100 * Math.max(0, 0.45 * coverage + 0.3 * confidence + 0.25 * retention - penalty));
    return {
      topic: t.id, total: probs.length, solved: solvedLogs.length, wellUnderstood: wu,
      avgConfidence, wrong, lapses, mastery, lessonDone: !!c.lessonsDone[t.id],
    };
  });
}

/** Topics you have started and are struggling with. */
export function weakTopics(stats: TopicStat[]): TopicStat[] {
  return stats
    .filter((s) => s.solved + s.wrong > 0 && (s.wrong + s.lapses >= 2 || (s.avgConfidence ?? 5) < 3 || (s.solved >= 3 && s.mastery < 40)))
    .sort((a, b) => a.mastery - b.mastery || b.wrong + b.lapses - (a.wrong + a.lapses));
}

export interface HelpItem { problem: Problem; log: ProblemLog; score: number }

/** "Wrong / needed help" list, most urgent first. Items leave the list after a successful spaced review. */
export function helpList(c: CourseState): HelpItem[] {
  const out: HelpItem[] = [];
  for (const [pid, log] of Object.entries(c.problems)) {
    const p = PROBLEM_BY_ID[pid];
    if (!p) continue;
    const r = c.reviews[`problem:${pid}`];
    const recovered = r && r.lastRating && r.lastRating !== 'again' && r.lastRating !== 'hard' && r.step >= 2;
    const needs = log.status === 'solved-with-help' || log.status === 'attempted' || log.wrong > 0 || (log.confidence ?? 5) <= 2;
    if (!needs || recovered) continue;
    const ageDays = (Date.now() - log.updatedAt) / 86400000;
    const score = log.wrong * 3 + (log.status === 'solved-with-help' ? 4 : 0) + (log.status === 'attempted' ? 3 : 0)
      + (5 - (log.confidence ?? 3)) * 2 + Math.min(ageDays, 14) * 0.5 + (r?.lapses ?? 0) * 2;
    out.push({ problem: p, log, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

export interface Readiness {
  wellUnderstood: number;
  solved: number;
  patternsCovered: string[];
  patternsMissing: string[];
  mocks: number;
  overall: number; // 0..100
}

export function readiness(c: CourseState): Readiness {
  const wu = PROBLEMS.filter((p) => wellUnderstood(c, p.id));
  const solved = Object.values(c.problems).filter(isSolved).length;
  const perPattern = new Map<string, number>();
  for (const p of wu) perPattern.set(p.pattern, (perPattern.get(p.pattern) ?? 0) + 1);
  const covered = CORE_PATTERNS.filter((pt) => (perPattern.get(pt) ?? 0) >= 2);
  const missing = CORE_PATTERNS.filter((pt) => !covered.includes(pt));
  const mocks = c.interviews.filter((s) => s.endedAt).length;
  const overall = Math.round(100 * (
    0.5 * Math.min(1, wu.length / READINESS_TARGETS.problems)
    + 0.35 * (covered.length / CORE_PATTERNS.length)
    + 0.15 * Math.min(1, mocks / READINESS_TARGETS.mocks)
  ));
  return { wellUnderstood: wu.length, solved, patternsCovered: covered, patternsMissing: missing, mocks, overall };
}
