// Validates src/data/leetcode-map.json after hand edits: references, duplicates, URLs, hint ladder.
import map from '../src/data/leetcode-map.json';
import { PROBLEM_BY_ID } from '../src/data/problems';
import { TOPIC_BY_ID, PATTERN_LABEL } from '../src/data/topics';
import { getLesson, hasLesson } from '../src/data/lessons';

const errors: string[] = [];
const seen = new Set<string>();
const nums = new Set<number>();
for (const q of map.questions as Record<string, any>[]) {
  const at = `${q.id}:`;
  if (seen.has(q.id)) errors.push(`${at} duplicate id`);
  seen.add(q.id);
  if (nums.has(q.number)) errors.push(`${at} duplicate number ${q.number}`);
  nums.add(q.number);
  if (!/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/.test(q.url)) errors.push(`${at} bad url ${q.url}`);
  if (!['Easy', 'Medium', 'Hard'].includes(q.difficulty)) errors.push(`${at} bad difficulty`);
  if (!TOPIC_BY_ID[q.topic]) errors.push(`${at} unknown topic ${q.topic}`);
  if (!PATTERN_LABEL[q.pattern]) errors.push(`${at} unknown pattern ${q.pattern}`);
  if (!q.concepts?.length) errors.push(`${at} needs at least one concept`);
  for (const t of q.concepts ?? []) if (!TOPIC_BY_ID[t] || !hasLesson(t)) errors.push(`${at} concept ${t} has no lesson`);
  if (q.patternTemplate && !getLesson('python', q.patternTemplate).lang?.template) errors.push(`${at} template topic ${q.patternTemplate} has no template`);
  if (!q.warmups?.length || q.warmups.length > 2) errors.push(`${at} needs 1–2 warm-ups`);
  for (const w of q.warmups ?? []) {
    if (!PROBLEM_BY_ID[w]?.builtin) errors.push(`${at} warm-up ${w} is not a built-in problem`);
    if (w === q.id) errors.push(`${at} cannot be its own warm-up`);
  }
  if (q.hints?.length !== 3) errors.push(`${at} needs exactly 3 hints`);
  if (!q.summary || q.summary.length > 160) errors.push(`${at} summary missing or too long`);
}
console.log(`${map.questions.length} questions checked`);
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
console.log('mapping OK');
