import type { CourseId, CourseState, Flashcard, ReviewItem } from '../types';
import { PROBLEM_BY_ID } from '../data/problems';
import { TOPIC_BY_ID } from '../data/topics';
import { allCards } from '../data/lessons';
import { isDue, priority } from './srs';

const cardCache: Partial<Record<CourseId, Map<string, Flashcard>>> = {};
export function cardMap(course: CourseId, c: CourseState): Map<string, Flashcard> {
  if (!cardCache[course]) cardCache[course] = new Map(allCards(course).map((x) => [x.id, x]));
  const m = new Map(cardCache[course]);
  for (const x of c.customCards) m.set(x.id, x);
  return m;
}

export function itemTitle(item: ReviewItem, cards?: Map<string, Flashcard>): string {
  if (item.kind === 'problem') return PROBLEM_BY_ID[item.refId]?.title ?? item.refId;
  if (item.kind === 'concept') return `${TOPIC_BY_ID[item.refId]?.title ?? item.refId} — concept`;
  return cards?.get(item.refId)?.front ?? 'Flashcard';
}

export function itemTopic(item: ReviewItem, cards?: Map<string, Flashcard>): string | undefined {
  if (item.kind === 'problem') return PROBLEM_BY_ID[item.refId]?.topic;
  if (item.kind === 'concept') return item.refId;
  return cards?.get(item.refId)?.topic;
}

/** Today's revision queue, capped, highest priority first. Orphaned items (deleted cards) are skipped. */
export function reviewQueue(course: CourseId, c: CourseState, cap: number, kinds?: ReviewItem['kind'][]): ReviewItem[] {
  const cards = cardMap(course, c);
  return Object.values(c.reviews)
    .filter((r) => isDue(r))
    .filter((r) => (kinds ? kinds.includes(r.kind) : true))
    .filter((r) => r.kind !== 'card' || cards.has(r.refId))
    .filter((r) => r.kind !== 'problem' || PROBLEM_BY_ID[r.refId])
    .sort((a, b) => priority(b) - priority(a))
    .slice(0, cap);
}
