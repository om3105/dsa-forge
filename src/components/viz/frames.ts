/* Walkthrough generators. Each runs the real algorithm on a small input and records frames.
   A frame's `predict` asks what happens in the transition to the NEXT frame (used by predict mode). */

export type CellState = 'dim' | 'hl' | 'hot' | 'good' | 'bad' | undefined;
export interface Predict { q: string; options: string[]; answer: number }
interface Base { caption: string; predict?: Predict; side?: { label: string; value: string }[] }
export interface ArrayFrame extends Base { kind: 'array'; cells: (string | number)[]; states: CellState[]; ptrs: Record<number, string>; extraRow?: { label: string; cells: (string | number)[] } }
export interface TreeFrame extends Base { kind: 'tree'; nodes: { id: string; x: number; y: number; label: string; state?: CellState }[]; edges: [string, string][]; directed?: boolean }
export interface TableFrame extends Base { kind: 'table'; rows: string[]; cols: string[]; cells: (string | number)[][]; states: CellState[][] }
export type Frame = ArrayFrame | TreeFrame | TableFrame;

const arr = (cells: (string | number)[], caption: string, opts: Partial<ArrayFrame> = {}): ArrayFrame =>
  ({ kind: 'array', cells, states: opts.states ?? cells.map(() => undefined), ptrs: opts.ptrs ?? {}, side: opts.side, caption, extraRow: opts.extraRow, predict: opts.predict });
const P = (q: string, options: string[], answer: number): Predict => ({ q, options, answer });
const yesNo = (q: string, yes: boolean) => P(q, ['Yes', 'No'], yes ? 0 : 1);
/** distinct numeric options containing the answer */
function numOpts(ans: number, extra: number[]): { options: string[]; answer: number } {
  const set = [...new Set([ans, ...extra])].slice(0, 4).sort((a, b) => a - b);
  return { options: set.map(String), answer: set.indexOf(ans) };
}
const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

// ------------------------------------------------------------------ arrays & pointers
function twoPointers(): Frame[] {
  const a = [1, 3, 4, 6, 8, 11], target = 10;
  const f: Frame[] = [];
  let lo = 0, hi = a.length - 1;
  f.push(arr(a, `Sorted array, target = ${target}. One pointer at each end.`, { ptrs: { [lo]: 'lo', [hi]: 'hi' } }));
  while (lo < hi) {
    const s = a[lo] + a[hi];
    const states = a.map((_, i) => (i === lo || i === hi ? 'hot' : i < lo || i > hi ? 'dim' : undefined)) as CellState[];
    const prev = f[f.length - 1];
    if (s === target) {
      prev.predict = P(`${a[lo]} + ${a[hi]} = ${s}. What happens?`, ['lo++', 'hi--', 'Found the pair'], 2);
      f.push(arr(a, `${a[lo]} + ${a[hi]} = ${s}. Found it without checking all ${a.length * (a.length - 1) / 2} pairs.`, { states: states.map((x) => (x === 'hot' ? 'good' : x)), ptrs: { [lo]: 'lo', [hi]: 'hi' } }));
      break;
    }
    prev.predict = P(`${a[lo]} + ${a[hi]} = ${s}, target ${target}. Which pointer moves?`, ['lo++', 'hi--', 'Found the pair'], s < target ? 0 : 1);
    if (s < target) lo++; else hi--;
    f.push(arr(a, s < target ? `${s} < ${target}: too small, so ${a[lo - 1]} can't be in the pair → lo++.` : `${s} > ${target}: too big, ${a[hi + 1]} can't be in the pair → hi--.`,
      { states: a.map((_, i) => (i === lo || i === hi ? 'hot' : i < lo || i > hi ? 'dim' : undefined)), ptrs: { [lo]: 'lo', [hi]: 'hi' }, side: [{ label: 'last sum', value: String(s) }] }));
  }
  return f;
}

function slidingWindow(): Frame[] {
  const s = 'abcabcbb'.split('');
  const f: Frame[] = [arr(s, 'Longest substring without repeats. The window [L, R] always holds distinct characters.')];
  const last: Record<string, number> = {};
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    const repeat = last[c] !== undefined && last[c] >= left;
    f[f.length - 1].predict = yesNo(`Next character '${c}' enters. Does the left edge have to move?`, repeat);
    let note = `Add '${c}'.`;
    if (repeat) { note = `'${c}' is already in the window (index ${last[c]}) → L jumps to ${last[c] + 1}.`; left = last[c] + 1; }
    last[c] = right;
    best = Math.max(best, right - left + 1);
    f.push(arr(s, `${note} Window length ${right - left + 1}, best ${best}.`, {
      states: s.map((_, i) => (i >= left && i <= right ? (i === right ? 'hot' : 'hl') : 'dim')),
      ptrs: left === right ? { [left]: 'L R' } : { [left]: 'L', [right]: 'R' },
      side: [{ label: 'best', value: String(best) }, { label: 'last seen', value: Object.entries(last).map(([k, v]) => `${k}:${v}`).join(' ') }],
    }));
  }
  f.push(arr(s, `Each character entered and left at most once: O(n). Answer = ${best}.`));
  return f;
}

function binarySearch(): Frame[] {
  const a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target = 23;
  const f: Frame[] = [arr(a, `Find ${target}. lo = 0, hi = n; the answer is always inside [lo, hi).`)];
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const goLeft = a[mid] >= target;
    f.push(arr(a, `mid = ${mid}, a[mid] = ${a[mid]}.`, {
      states: a.map((_, i) => (i === mid ? 'hot' : i < lo || i >= hi ? 'dim' : 'hl')),
      ptrs: { [lo]: 'lo', [mid]: lo === mid ? 'lo mid' : 'mid', ...(hi < a.length ? { [hi]: 'hi' } : {}) },
      predict: P(`a[mid] = ${a[mid]}, target ${target}. Which half survives?`, ['hi = mid (keep left part)', 'lo = mid + 1 (keep right part)'], goLeft ? 0 : 1),
    }));
    if (goLeft) hi = mid; else lo = mid + 1;
  }
  f.push(arr(a, `lo == hi == ${lo}: a[${lo}] = ${a[lo]}. At most ${Math.ceil(Math.log2(a.length + 1))} steps, O(log n).`, { states: a.map((_, i) => (i === lo ? 'good' : 'dim')), ptrs: { [lo]: 'lo=hi' } }));
  return f;
}

function prefixSum(): Frame[] {
  const a = [3, 4, 7, 2, -3, 1, 4, 2], k = 7;
  const f: Frame[] = [arr(a, `Count subarrays with sum ${k}: running sum + map of how often each prefix sum appeared.`, { extraRow: { label: 'prefix', cells: a.map(() => '') }, side: [{ label: 'seen', value: '0:1' }] })];
  const seen: Record<number, number> = { 0: 1 };
  let s = 0, count = 0;
  const pre: (string | number)[] = a.map(() => '');
  a.forEach((x, i) => {
    const ns = s + x;
    const add = seen[ns - k] ?? 0;
    const o = numOpts(add, [0, 1, 2]);
    f[f.length - 1].predict = P(`Add ${x}: sum becomes ${ns}. How many subarrays ending here sum to ${k}? (look up ${ns} − ${k} = ${ns - k})`, o.options, o.answer);
    s = ns; pre[i] = s; count += add; seen[s] = (seen[s] ?? 0) + 1;
    f.push(arr(a, `sum = ${s}; seen[${s - k}] = ${add} → count = ${count}.`, {
      states: a.map((_, j) => (j === i ? 'hot' : j < i ? 'hl' : 'dim')),
      extraRow: { label: 'prefix', cells: [...pre] },
      side: [{ label: 'count', value: String(count) }, { label: 'seen', value: Object.entries(seen).map(([p, n]) => `${p}:${n}`).join('  ') }],
    }));
  });
  return f;
}

function kadane(): Frame[] {
  const a = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
  let cur = a[0], best = a[0], start = 0, bs = 0, be = 0;
  const f: Frame[] = [arr(a, `cur = best = ${a[0]}. Each step: extend the current subarray, or restart here.`, { states: a.map((_, i) => (i === 0 ? 'hot' : 'dim')) })];
  for (let i = 1; i < a.length; i++) {
    const extend = cur + a[i];
    const restart = a[i] > extend;
    f[f.length - 1].predict = P(`Next value ${a[i]}, cur = ${cur}. Extend (${extend}) or restart (${a[i]})?`, ['Extend', 'Restart'], restart ? 1 : 0);
    if (restart) { cur = a[i]; start = i; } else cur = extend;
    if (cur > best) { best = cur; bs = start; be = i; }
    f.push(arr(a, `${restart ? 'Restart' : 'Extend'}: cur = ${cur}, best = ${best}.`, {
      states: a.map((_, j) => (j >= start && j <= i ? (j === i ? 'hot' : 'hl') : j > i ? 'dim' : undefined)),
      side: [{ label: 'cur', value: String(cur) }, { label: 'best', value: `${best}  [${bs}..${be}]` }],
    }));
  }
  f.push(arr(a, `Best subarray [${bs}..${be}] with sum ${best}. One pass, O(1) memory.`, { states: a.map((_, j) => (j >= bs && j <= be ? 'good' : 'dim')) }));
  return f;
}

// ------------------------------------------------------------------ strings & hashing
function stringCounts(): Frame[] {
  const s = 'listen', t = 'silent';
  const letters = [...new Set(s.split(''))].sort();
  const count: Record<string, number> = Object.fromEntries(letters.map((c) => [c, 0]));
  const f: Frame[] = [];
  const row = () => letters.map((c) => `${c}:${count[c]}`);
  f.push(arr([...s], `Anagram check: count up for "${s}", then count down for "${t}". All counts must end at 0.`, { extraRow: { label: 'counts', cells: row() } }));
  [...s].forEach((c, i) => {
    f[f.length - 1].predict = (() => { const o = numOpts(count[c] + 1, [0, 1, 2]); return P(`Read '${c}' from s. What is count['${c}'] after?`, o.options, o.answer); })();
    count[c]++;
    f.push(arr([...s], `count['${c}'] = ${count[c]}.`, { states: [...s].map((_, j) => (j === i ? 'hot' : j < i ? 'hl' : undefined)), extraRow: { label: 'counts', cells: row() } }));
  });
  [...t].forEach((c, i) => {
    f[f.length - 1].predict = (() => { const o = numOpts(count[c] - 1, [-1, 0, 1]); return P(`Read '${c}' from t. What is count['${c}'] after?`, o.options, o.answer); })();
    count[c]--;
    f.push(arr([...t], `t: count['${c}'] = ${count[c]}.`, { states: [...t].map((_, j) => (j === i ? 'hot' : j < i ? 'hl' : undefined)), extraRow: { label: 'counts', cells: row() } }));
  });
  f.push(arr([...t], 'Every count is 0 → anagrams. O(n) time, O(alphabet) space.', { states: [...t].map(() => 'good'), extraRow: { label: 'counts', cells: row() } }));
  return f;
}

function hashTwoSum(): Frame[] {
  const a = [3, 8, 11, 5, 2], target = 13;
  const map: Record<number, number> = {};
  const f: Frame[] = [arr(a, `Two Sum, target ${target}. For each x, look up ${target} − x in the map of values seen so far.`, { side: [{ label: 'map', value: '{}' }] })];
  for (let i = 0; i < a.length; i++) {
    const need = target - a[i];
    const hit = map[need] !== undefined;
    f[f.length - 1].predict = yesNo(`x = ${a[i]}: is ${need} already in the map?`, hit);
    if (hit) {
      f.push(arr(a, `${need} was seen at index ${map[need]} → answer [${map[need]}, ${i}]. One pass, O(n).`, { states: a.map((_, j) => (j === i || j === map[need] ? 'good' : 'dim')), side: [{ label: 'map', value: JSON.stringify(map) }] }));
      break;
    }
    map[a[i]] = i;
    f.push(arr(a, `${need} not seen. Store ${a[i]} → ${i}.`, { states: a.map((_, j) => (j === i ? 'hot' : j < i ? 'hl' : undefined)), side: [{ label: 'map', value: JSON.stringify(map) }] }));
  }
  return f;
}

// ------------------------------------------------------------------ sorting
function mergeStep(): Frame[] {
  const L = [2, 5, 9], R = [1, 6, 7, 10];
  const out: (string | number)[] = Array(L.length + R.length).fill('');
  let i = 0, j = 0, k = 0;
  const show = (caption: string, predict?: Predict) => arr([...L.map((x, idx) => (idx < i ? '·' : x)), '|', ...R.map((x, idx) => (idx < j ? '·' : x))], caption, {
    states: [...L.map((_, idx) => (idx === i ? 'hot' : idx < i ? 'dim' : undefined)), 'dim', ...R.map((_, idx) => (idx === j ? 'hot' : idx < j ? 'dim' : undefined))] as CellState[],
    extraRow: { label: 'merged', cells: [...out] }, predict,
  });
  const f: Frame[] = [show('Merge step of merge sort: two sorted halves, take the smaller front element each time.')];
  while (i < L.length || j < R.length) {
    const takeLeft = j >= R.length || (i < L.length && L[i] <= R[j]);
    const cand = [i < L.length ? L[i] : undefined, j < R.length ? R[j] : undefined].filter((x) => x !== undefined) as number[];
    if (cand.length === 2) f[f.length - 1].predict = P(`Fronts are ${L[i]} and ${R[j]}. Which goes next?`, [String(L[i]), String(R[j])], takeLeft ? 0 : 1);
    out[k++] = takeLeft ? L[i++] : R[j++];
    f.push(show(`Take ${out[k - 1]}${cand.length === 1 ? ' (other half is empty)' : ''}.`));
  }
  f.push(arr(out, 'Merged in O(n). log n levels of merging → O(n log n) total.', { states: out.map(() => 'good') }));
  return f;
}

// ------------------------------------------------------------------ recursion & trees
function recursionTree(): Frame[] {
  interface N { id: string; n: number; depth: number; kids: N[]; x?: number }
  let counter = 0;
  const build = (n: number, depth: number): N => ({ id: `n${counter++}`, n, depth, kids: n < 2 ? [] : [build(n - 1, depth + 1), build(n - 2, depth + 1)] });
  const root = build(4, 0);
  let xi = 0;
  const layout = (t: N) => { if (t.kids[0]) layout(t.kids[0]); t.x = xi++; if (t.kids[1]) layout(t.kids[1]); };
  layout(root);
  const all: N[] = [];
  const walk = (t: N) => { all.push(t); t.kids.forEach(walk); };
  walk(root);
  const edges: [string, string][] = all.flatMap((t) => t.kids.map((k) => [t.id, k.id] as [string, string]));
  const order: { t: N; phase: 'call' | 'ret'; val?: number }[] = [];
  const run = (t: N): number => { order.push({ t, phase: 'call' }); const v = t.n < 2 ? t.n : run(t.kids[0]) + run(t.kids[1]); order.push({ t, phase: 'ret', val: v }); return v; };
  run(root);
  const frames: Frame[] = [];
  const state: Record<string, CellState> = {};
  const labels: Record<string, string> = {};
  const seenN: Record<number, number> = {};
  order.forEach((step, idx) => {
    const t = step.t;
    if (step.phase === 'call') { state[t.id] = 'hot'; labels[t.id] = `f(${t.n})`; seenN[t.n] = (seenN[t.n] ?? 0) + 1; }
    else { state[t.id] = 'good'; labels[t.id] = `f(${t.n})=${step.val}`; }
    const next = order[idx + 1];
    let predict: Predict | undefined;
    if (next?.phase === 'call') predict = P('Which call happens next?', [...new Set([`f(${next.t.n})`, `f(${Math.max(0, next.t.n - 1)})`, `f(${next.t.n + 1})`])].sort(), 0);
    else if (next?.phase === 'ret' && next.t.n >= 2 && next.t === t) predict = undefined;
    else if (next?.phase === 'ret') { const o = numOpts(next.val!, [0, 1, 2, 3]); predict = P(`What does f(${next.t.n}) return?`, o.options, o.answer); }
    if (predict && predict.q.startsWith('Which call')) predict.answer = predict.options.indexOf(`f(${next!.t.n})`);
    frames.push({
      kind: 'tree', edges: edges.filter(([a, b]) => labels[a] && labels[b]),
      nodes: all.filter((x) => labels[x.id]).map((x) => ({ id: x.id, x: x.x!, y: x.depth, label: labels[x.id], state: x.id === t.id ? (step.phase === 'call' ? 'hot' : 'good') : state[x.id] === 'hot' ? 'hl' : state[x.id] })),
      caption: step.phase === 'call'
        ? `Call fib(${t.n})${t.n < 2 ? ', base case.' : `: needs fib(${t.n - 1}) and fib(${t.n - 2}).`}${seenN[t.n] > 1 ? ` fib(${t.n}) is computed for the ${ordinal(seenN[t.n])} time, memoization removes this.` : ''}`
        : `fib(${t.n}) returns ${step.val}.`,
      side: [{ label: 'calls so far', value: String(Object.values(seenN).reduce((a, b) => a + b, 0)) }],
      predict,
    });
  });
  return frames;
}

function treeDfs(): Frame[] {
  // max depth by post-order: tree 3 / 9, 20 / -, -, 15, 7
  const nodes = [
    { id: 'a', v: 3, x: 1.5, y: 0, kids: ['b', 'c'] }, { id: 'b', v: 9, x: 0.5, y: 1, kids: [] },
    { id: 'c', v: 20, x: 2.5, y: 1, kids: ['d', 'e'] }, { id: 'd', v: 15, x: 2, y: 2, kids: [] }, { id: 'e', v: 7, x: 3, y: 2, kids: [] },
  ];
  const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges: [string, string][] = nodes.flatMap((n) => n.kids.map((k) => [n.id, k] as [string, string]));
  const depth: Record<string, number> = {};
  const frames: Frame[] = [];
  const snap = (cur: string | null, caption: string) => frames.push({
    kind: 'tree', edges, caption,
    nodes: nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, label: depth[n.id] !== undefined ? `${n.v}·d${depth[n.id]}` : String(n.v), state: n.id === cur ? 'hot' : depth[n.id] !== undefined ? 'good' : undefined })),
  });
  snap(null, 'Max depth = 1 + max(depth(left), depth(right)). Post-order: children answer first.');
  const go = (id: string): number => {
    const n = by[id];
    const kids = n.kids.map(go);
    const d = 1 + Math.max(0, ...kids);
    const o = numOpts(d, [1, 2, 3]);
    frames[frames.length - 1].predict = P(`Node ${n.v}: children report ${kids.length ? kids.join(' and ') : 'nothing (leaf)'}. Its depth?`, o.options, o.answer);
    depth[id] = d;
    snap(id, `Node ${n.v} returns 1 + max(${kids.length ? kids.join(', ') : '0'}) = ${d}.`);
    return d;
  };
  const ans = go('a');
  snap(null, `Answer ${ans}. Every node is visited once: O(n) time, O(h) stack.`);
  return frames;
}

function bstSearch(): Frame[] {
  const nodes = [
    { id: '8', x: 3, y: 0 }, { id: '3', x: 1, y: 1 }, { id: '10', x: 5, y: 1 }, { id: '1', x: 0, y: 2 }, { id: '6', x: 2, y: 2 },
    { id: '14', x: 6, y: 2 }, { id: '4', x: 1.5, y: 3 }, { id: '7', x: 2.5, y: 3 }, { id: '13', x: 5.5, y: 3 },
  ];
  const kids: Record<string, [string?, string?]> = { 8: ['3', '10'], 3: ['1', '6'], 10: [undefined, '14'], 6: ['4', '7'], 14: ['13', undefined] };
  const edges: [string, string][] = Object.entries(kids).flatMap(([p, [l, r]]) => [l, r].filter(Boolean).map((c) => [p, c!] as [string, string]));
  const target = 7;
  const path: string[] = [];
  const frames: Frame[] = [];
  const snap = (cur: string | null, caption: string, done = false) => frames.push({
    kind: 'tree', edges, caption,
    nodes: nodes.map((n) => ({ id: n.id, x: n.x * 0.8, y: n.y, label: n.id, state: n.id === cur ? (done ? 'good' : 'hot') : path.includes(n.id) ? 'hl' : undefined })),
  });
  snap(null, `Search for ${target}. Compare at each node: smaller → left, larger → right.`);
  let cur: string | undefined = '8';
  while (cur) {
    const v: number = Number(cur);
    path.push(cur);
    if (v === target) { snap(cur, `Found ${target} after ${path.length} comparisons, O(h).`, true); break; }
    const dir = target < v ? 'left' : 'right';
    snap(cur, `${target} ${target < v ? '<' : '>'} ${v} → go ${dir}.`);
    frames[frames.length - 2].predict = P(`At node ${v}, looking for ${target}: which way?`, ['Left', 'Right', 'Found it'], target < v ? 0 : 1);
    cur = kids[cur]?.[target < v ? 0 : 1];
  }
  frames[frames.length - 2].predict = P(`At node ${target}, looking for ${target}: which way?`, ['Left', 'Right', 'Found it'], 2);
  return frames;
}

function heapPush(): Frame[] {
  const heap = [1, 3, 5, 7, 9, 8];
  const x = 2;
  const frames: Frame[] = [];
  const show = (a: number[], hot: number, caption: string) => {
    frames.push(arr(a, caption, { states: a.map((_, i) => (i === hot ? 'hot' : undefined)), ptrs: hot >= 0 ? { [hot]: 'x' } : {}, side: [{ label: 'children of i', value: '2i+1, 2i+2' }] }));
  };
  show(heap, -1, `Min-heap stored in an array. Push ${x}: append at the end, then sift up while smaller than the parent.`);
  const a = [...heap, x];
  let i = a.length - 1;
  frames[frames.length - 1].predict = (() => { const o = numOpts(i, [i - 1, 2, 3]); return P(`At which index does ${x} land first?`, o.options, o.answer); })();
  show(a, i, `Appended at index ${i}. Parent is index ${(i - 1) >> 1} (value ${a[(i - 1) >> 1]}).`);
  while (i > 0) {
    const p = (i - 1) >> 1;
    const swap = a[p] > a[i];
    frames[frames.length - 1].predict = yesNo(`Parent ${a[p]} vs ${a[i]}: swap?`, swap);
    if (!swap) { show(a, i, `${a[p]} ≤ ${a[i]}: heap property holds. Stop.`); break; }
    [a[p], a[i]] = [a[i], a[p]];
    i = p;
    show(a, i, `Swapped: ${x} moves up to index ${i}.`);
  }
  frames.push(arr(a, `Done in O(log n) swaps. The minimum is always a[0] = ${a[0]}.`, { states: a.map((_, j) => (j === 0 ? 'good' : undefined)) }));
  return frames;
}

// ------------------------------------------------------------------ linked lists, stacks, queues
function linkedReverse(): Frame[] {
  const vals = [1, 2, 3, 4];
  const f: Frame[] = [];
  const draw = (prevIdx: number, curIdx: number, caption: string): ArrayFrame => {
    const cells = vals.map((v, i) => `${i < curIdx && i > 0 ? '←' : ''}${v}${i >= curIdx && i < vals.length - 1 ? '→' : ''}`);
    const ptrs: Record<number, string> = {};
    if (prevIdx >= 0) ptrs[prevIdx] = 'prev';
    if (curIdx < vals.length) ptrs[curIdx] = (ptrs[curIdx] ? ptrs[curIdx] + ' ' : '') + 'cur';
    return arr(cells, caption, { states: vals.map((_, i) => (i < curIdx ? 'good' : i === curIdx ? 'hot' : undefined)), ptrs });
  };
  f.push(draw(-1, 0, 'prev = null, cur = head. Flip one arrow per step.'));
  for (let i = 0; i < vals.length; i++) {
    f[f.length - 1].predict = P(`cur = ${vals[i]}. After this step, ${vals[i]}.next points to…`, ['null', ...vals.filter((_, j) => j !== i).map(String)].slice(0, 4), 0);
    f[f.length - 1].predict!.answer = f[f.length - 1].predict!.options.indexOf(i === 0 ? 'null' : String(vals[i - 1]));
    f.push(draw(i, i + 1, `Save next, point ${vals[i]}.next to ${i === 0 ? 'null' : vals[i - 1]}, then advance prev and cur.`));
  }
  f.push(arr(vals.slice().reverse().map((v, i) => `${v}${i < vals.length - 1 ? '→' : ''}`), 'cur is null; prev is the new head. O(n) time, O(1) space.', { states: vals.map(() => 'good') }));
  return f;
}

function stackBrackets(): Frame[] {
  const s = '{[()]}('.split('');
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const st: string[] = [];
  const f: Frame[] = [arr(s, 'Valid brackets: push openers; a closer must match the top.', { side: [{ label: 'stack (bottom → top)', value: '[]' }] })];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const closer = c in pairs;
    f[f.length - 1].predict = P(`Next char '${c}'. What happens?`, ['Push it', 'Pop and compare', 'Mismatch → invalid'], closer ? (st[st.length - 1] === pairs[c] ? 1 : 2) : 0);
    if (closer) st.pop(); else st.push(c);
    f.push(arr(s, closer ? `'${c}' matches the top → pop.` : `'${c}' is an opener → push.`, { states: s.map((_, j) => (j === i ? 'hot' : j < i ? 'hl' : undefined)), side: [{ label: 'stack (bottom → top)', value: `[${st.join(' ')}]` }] }));
  }
  f[f.length - 1].predict = yesNo('End of input. Is the string valid?', st.length === 0);
  f.push(arr(s, `End: stack still holds ${st.join(' ')} → invalid (an opener was never closed).`, { states: s.map((_, j) => (j === s.length - 1 ? 'bad' : undefined)), side: [{ label: 'stack', value: `[${st.join(' ')}]` }] }));
  return f;
}

function monotonicStack(): Frame[] {
  const t = [73, 74, 75, 71, 69, 72, 76, 73];
  const ans = t.map(() => 0 as number | string);
  const stack: number[] = [];
  const f: Frame[] = [arr(t, 'Daily temperatures. Stack of indices still waiting for a warmer day (decreasing temps).', { extraRow: { label: 'answer', cells: [...ans] } })];
  t.forEach((x, i) => {
    let pops = 0;
    for (let k = stack.length - 1; k >= 0 && t[stack[k]] < x; k--) pops++;
    const o = numOpts(pops, [0, 1, 2, 3]);
    f[f.length - 1].predict = P(`${x} arrives. How many indices get popped?`, o.options, o.answer);
    const popped: number[] = [];
    while (stack.length && t[stack[stack.length - 1]] < x) { const j = stack.pop()!; ans[j] = i - j; popped.push(j); }
    stack.push(i);
    f.push(arr(t, popped.length ? `${x} is warmer than ${popped.map((j) => t[j]).join(', ')} → pop; they waited ${popped.map((j) => i - j).join(', ')} day(s).` : `${x} is not warmer than the top → push.`, {
      states: t.map((_, j) => (j === i ? 'hot' : popped.includes(j) ? 'good' : stack.includes(j) ? 'hl' : j > i ? 'dim' : undefined)),
      extraRow: { label: 'answer', cells: [...ans] }, side: [{ label: 'stack (indices)', value: `[${stack.join(', ')}]` }],
    }));
  });
  f.push(arr(t, 'Leftovers never found a warmer day. Each index pushed and popped once → O(n).', { extraRow: { label: 'answer', cells: [...ans] } }));
  return f;
}

function dequeMax(): Frame[] {
  const a = [1, 3, -1, -3, 5, 3, 6], k = 3;
  const dq: number[] = [];
  const out: number[] = [];
  const f: Frame[] = [arr(a, `Sliding window max, k = ${k}. Deque of indices with decreasing values; the front is the max.`, { side: [{ label: 'deque', value: '[]' }] })];
  a.forEach((x, i) => {
    let popsBack = 0;
    for (let q = dq.length - 1; q >= 0 && a[dq[q]] <= x; q--) popsBack++;
    const o = numOpts(popsBack, [0, 1, 2]);
    f[f.length - 1].predict = P(`${x} arrives. How many indices are popped from the back?`, o.options, o.answer);
    while (dq.length && a[dq[dq.length - 1]] <= x) dq.pop();
    dq.push(i);
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) out.push(a[dq[0]]);
    f.push(arr(a, `${popsBack ? `Popped ${popsBack} smaller value(s); ` : ''}push ${i}.${i >= k - 1 ? ` Window max = ${a[dq[0]]}.` : ''}`, {
      states: a.map((_, j) => (j === i ? 'hot' : j > i - k && j <= i ? 'hl' : 'dim')),
      side: [{ label: 'deque (indices)', value: `[${dq.join(', ')}]` }, { label: 'maxes', value: `[${out.join(', ')}]` }],
    }));
  });
  return f;
}

// ------------------------------------------------------------------ intervals & greedy
function mergeIntervals(): Frame[] {
  const iv = [[1, 3], [2, 6], [8, 10], [9, 12], [15, 18]];
  const merged: number[][] = [];
  const cells = iv.map(([s, e]) => `${s}-${e}`);
  const f: Frame[] = [arr(cells, 'Sorted by start. Compare each interval with the last merged one.', { extraRow: { label: 'merged', cells: [] } })];
  iv.forEach(([s, e], i) => {
    const last = merged[merged.length - 1];
    const prevEnd = last?.[1];
    const overlap = !!last && s <= last[1];
    if (i > 0) f[f.length - 1].predict = P(`[${s}, ${e}] vs last merged [${last[0]}, ${last[1]}]?`, ['Merge (extend end)', 'Start a new interval'], overlap ? 0 : 1);
    if (overlap) last[1] = Math.max(last[1], e); else merged.push([s, e]);
    f.push(arr(cells, overlap ? `${s} ≤ ${prevEnd}: overlaps → end becomes ${last[1]}.` : i === 0 ? `First interval [${s}, ${e}].` : `${s} > previous end → new interval.`, {
      states: cells.map((_, j) => (j === i ? 'hot' : j < i ? 'hl' : undefined)), extraRow: { label: 'merged', cells: merged.map(([a, b]) => `${a}-${b}`) },
    }));
  });
  return f;
}

function greedyJump(): Frame[] {
  const a = [2, 3, 1, 1, 0, 4];
  let far = 0;
  const f: Frame[] = [arr(a, 'Jump Game: track the farthest index reachable so far.', { side: [{ label: 'farthest', value: '0' }] })];
  for (let i = 0; i < a.length; i++) {
    if (i > far) {
      f[f.length - 1].predict = yesNo(`Can we stand on index ${i}?`, false);
      f.push(arr(a, `Index ${i} > farthest ${far} → stuck. Answer: false.`, { states: a.map((_, j) => (j === i ? 'bad' : j <= far ? 'hl' : 'dim')) }));
      return f;
    }
    const nf = Math.max(far, i + a[i]);
    const o = numOpts(nf, [far, i + a[i] + 1, nf + 1]);
    f[f.length - 1].predict = P(`At index ${i} (jump ${a[i]}), farthest was ${far}. New farthest?`, o.options, o.answer);
    const prevFar = far;
    far = nf;
    f.push(arr(a, `farthest = max(${prevFar}, ${i} + ${a[i]}) = ${far}.`, { states: a.map((_, j) => (j === i ? 'hot' : j <= far ? 'hl' : 'dim')), ptrs: { [Math.min(far, a.length - 1)]: 'far' }, side: [{ label: 'farthest', value: String(far) }] }));
  }
  return f;
}

// ------------------------------------------------------------------ graphs
function graphBfs(): Frame[] {
  const pos: Record<string, [number, number]> = { A: [0, 1], B: [1, 0], C: [1, 2], D: [2, 0], E: [2, 1], F: [3, 1] };
  const adj: Record<string, string[]> = { A: ['B', 'C'], B: ['A', 'D', 'E'], C: ['A', 'E'], D: ['B', 'F'], E: ['B', 'C', 'F'], F: ['D', 'E'] };
  const edges: [string, string][] = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'E'], ['D', 'F'], ['E', 'F']];
  const dist: Record<string, number> = { A: 0 };
  const q = ['A'];
  const done = new Set<string>();
  const frames: Frame[] = [];
  const snap = (cur: string | null, caption: string) => frames.push({
    kind: 'tree', edges, caption, side: [{ label: 'queue', value: `[${q.join(', ')}]` }],
    nodes: Object.keys(pos).map((id) => ({ id, x: pos[id][0] * 1.4, y: pos[id][1] * 0.9 + 0.2, label: dist[id] !== undefined ? `${id}·${dist[id]}` : id, state: id === cur ? 'hot' : done.has(id) ? 'good' : dist[id] !== undefined ? 'hl' : undefined })),
  });
  snap(null, 'BFS from A. Labels show distance once discovered. Mark a node when it is pushed.');
  while (q.length) {
    const opts = [...new Set([q[0], ...Object.keys(pos).filter((x) => x !== q[0] && !done.has(x))])].slice(0, 3).sort();
    frames[frames.length - 1].predict = P('Which node is processed next?', opts, opts.indexOf(q[0]));
    const u = q.shift()!;
    const found: string[] = [];
    for (const v of adj[u]) if (dist[v] === undefined) { dist[v] = dist[u] + 1; q.push(v); found.push(v); }
    snap(u, found.length ? `Pop ${u} (distance ${dist[u]}). Discover ${found.join(', ')} at distance ${dist[u] + 1}.` : `Pop ${u}. Neighbours already discovered.`);
    done.add(u);
  }
  snap(null, 'Nodes were reached in increasing distance. The first visit is the shortest path. O(V + E).');
  return frames;
}

function topoKahn(): Frame[] {
  const pos: Record<string, [number, number]> = { A: [0, 0], B: [0, 2], C: [1, 1], D: [2, 0], E: [2, 2] };
  const edgesList: [string, string][] = [['A', 'C'], ['B', 'C'], ['C', 'D'], ['C', 'E'], ['B', 'E']];
  const indeg: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  edgesList.forEach(([, v]) => indeg[v]++);
  const ready = Object.keys(indeg).filter((k) => indeg[k] === 0).sort();
  const order: string[] = [];
  const frames: Frame[] = [];
  const snap = (cur: string | null, caption: string) => frames.push({
    kind: 'tree', directed: true, edges: edgesList, caption,
    nodes: Object.keys(pos).map((id) => ({ id, x: pos[id][0] * 1.6, y: pos[id][1] * 0.8, label: order.includes(id) ? `${id}✓` : `${id}·in${indeg[id]}`, state: id === cur ? 'hot' : order.includes(id) ? 'good' : ready.includes(id) ? 'hl' : undefined })),
    side: [{ label: 'ready (in-degree 0)', value: `[${ready.join(', ')}]` }, { label: 'order', value: order.join(' → ') || '—' }],
  });
  snap(null, "Kahn's algorithm: start with nodes of in-degree 0 (labels show in-degree).");
  while (ready.length) {
    const u = ready.shift()!;
    const opts = [...new Set([u, ...Object.keys(pos).filter((x) => !order.includes(x) && x !== u)])].slice(0, 3).sort();
    frames[frames.length - 1].predict = P('Taking the smallest ready node, which is output next?', opts, opts.indexOf(u));
    order.push(u);
    const freed: string[] = [];
    edgesList.filter(([a]) => a === u).forEach(([, v]) => { indeg[v]--; if (indeg[v] === 0) { ready.push(v); freed.push(v); } });
    ready.sort();
    snap(u, `Output ${u}; decrement its neighbours.${freed.length ? ` ${freed.join(', ')} now ready.` : ''}`);
  }
  snap(null, `All ${order.length} nodes output → no cycle. Order: ${order.join(' → ')}. O(V + E).`);
  return frames;
}

function dijkstra(): Frame[] {
  const pos: Record<string, [number, number]> = { S: [0, 1], A: [1, 0], B: [1, 2], C: [2, 1], T: [3, 1] };
  const w: [string, string, number][] = [['S', 'A', 4], ['S', 'B', 1], ['B', 'A', 2], ['A', 'C', 1], ['B', 'C', 5], ['C', 'T', 3]];
  const dist: Record<string, number> = { S: 0 };
  const done = new Set<string>();
  const frames: Frame[] = [];
  const snap = (cur: string | null, caption: string) => frames.push({
    kind: 'tree', directed: true, edges: w.map(([a, b]) => [a, b] as [string, string]), caption,
    nodes: Object.keys(pos).map((id) => ({ id, x: pos[id][0] * 1.5, y: pos[id][1] * 0.8, label: dist[id] !== undefined ? `${id}·${dist[id]}` : `${id}·∞`, state: id === cur ? 'hot' : done.has(id) ? 'good' : dist[id] !== undefined ? 'hl' : undefined })),
    side: [{ label: 'edges', value: w.map(([a, b, c]) => `${a}→${b}:${c}`).join('  ') }],
  });
  snap(null, 'Dijkstra from S. Always finalise the unfinished node with the smallest tentative distance.');
  while (true) {
    const cand = Object.keys(dist).filter((x) => !done.has(x)).sort((a, b) => dist[a] - dist[b] || a.localeCompare(b));
    if (!cand.length) break;
    const u = cand[0];
    const opts = [...new Set([u, ...cand.slice(1), ...Object.keys(pos).filter((x) => !done.has(x))])].slice(0, 3).sort();
    frames[frames.length - 1].predict = P('Which node is finalised next?', opts, opts.indexOf(u));
    done.add(u);
    const upd: string[] = [];
    w.filter(([a]) => a === u).forEach(([, v, c]) => { if (!done.has(v) && (dist[v] === undefined || dist[u] + c < dist[v])) { dist[v] = dist[u] + c; upd.push(`${v}=${dist[v]}`); } });
    snap(u, `Finalise ${u} (${dist[u]}).${upd.length ? ` Relax: ${upd.join(', ')}.` : ''}`);
  }
  snap(null, `Shortest S→T = ${dist.T}. With a heap: O((V + E) log V).`);
  return frames;
}

function unionFind(): Frame[] {
  const parent = [0, 1, 2, 3, 4, 5];
  const find = (x: number): number => (parent[x] === x ? x : find(parent[x]));
  const ops: [number, number][] = [[0, 1], [2, 3], [1, 3], [4, 5], [0, 2]];
  const f: Frame[] = [arr(parent, 'parent[i] = i: six separate sets. union(a, b) links root of b under root of a.', { ptrs: { 0: 'p' } })];
  for (const [a, b] of ops) {
    const ra = find(a), rb = find(b);
    f[f.length - 1].predict = yesNo(`union(${a}, ${b}): are ${a} and ${b} already in the same set?`, ra === rb);
    if (ra === rb) f.push(arr([...parent], `find(${a}) = find(${b}) = ${ra} → already connected (this edge would close a cycle).`, { states: parent.map((_, i) => (find(i) === ra ? 'bad' : undefined)) }));
    else { parent[rb] = ra; f.push(arr([...parent], `Roots ${ra} and ${rb} differ → parent[${rb}] = ${ra}.`, { states: parent.map((_, i) => (i === rb ? 'hot' : find(i) === ra ? 'hl' : undefined)) })); }
  }
  const sets = new Set(parent.map((_, i) => find(i))).size;
  f.push(arr([...parent], `${sets} sets remain. With path compression + union by size, operations are ~O(1).`));
  return f;
}

// ------------------------------------------------------------------ DP & backtracking
function dp1d(): Frame[] {
  const a = [2, 7, 9, 3, 1];
  const dp: (number | string)[] = a.map(() => '');
  const f: Frame[] = [arr(a, 'House Robber: dp[i] = max(dp[i-1], dp[i-2] + nums[i]).', { extraRow: { label: 'dp', cells: [...dp] } })];
  a.forEach((x, i) => {
    const p1 = i >= 1 ? (dp[i - 1] as number) : 0, p2 = i >= 2 ? (dp[i - 2] as number) : 0;
    const v = Math.max(p1, p2 + x);
    const o = numOpts(v, [p1, p2 + x, x, v + 2].filter((y) => y !== v));
    f[f.length - 1].predict = P(`dp[${i}] = max(dp[${i - 1}] = ${p1}, dp[${i - 2}] + ${x} = ${p2 + x})?`, o.options, o.answer);
    dp[i] = v;
    f.push(arr(a, `dp[${i}] = ${v} (${v === p1 && i > 0 ? 'skip this house' : 'rob this house'}).`, { states: a.map((_, j) => (j === i ? 'hot' : j < i ? 'hl' : undefined)), extraRow: { label: 'dp', cells: [...dp] } }));
  });
  f.push(arr(a, `Answer dp[${a.length - 1}] = ${dp[a.length - 1]}. Only the last two values are needed → O(1) space.`, { extraRow: { label: 'dp', cells: [...dp] } }));
  return f;
}

function dpTable(): Frame[] {
  const a = 'ace', b = 'abcde';
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const frames: Frame[] = [];
  const rows = ['∅', ...a.split('')], cols = ['∅', ...b.split('')];
  const snap = (ci: number, cj: number, caption: string) => frames.push({
    kind: 'table', rows, cols, caption,
    cells: dp.map((r, i) => r.map((v, j) => (i < ci || (i === ci && j <= cj) || i === 0 || j === 0 ? v : ''))),
    states: dp.map((r, i) => r.map((_, j) => (i === ci && j === cj ? 'hot' : (i === ci - 1 && j === cj - 1) || (i === ci - 1 && j === cj) || (i === ci && j === cj - 1) ? 'hl' : undefined))),
  });
  snap(0, n, `LCS of "${a}" and "${b}". dp[i][j] = LCS of a[:i] and b[:j].`);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const eq = a[i - 1] === b[j - 1];
      frames[frames.length - 1].predict = P(`Cell ('${a[i - 1]}', '${b[j - 1]}'): where does the value come from?`, ['Diagonal + 1 (characters match)', 'Max of up and left'], eq ? 0 : 1);
      dp[i][j] = eq ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      snap(i, j, eq ? `'${a[i - 1]}' == '${b[j - 1]}': diagonal + 1 = ${dp[i][j]}.` : `'${a[i - 1]}' ≠ '${b[j - 1]}': max(up ${dp[i - 1][j]}, left ${dp[i][j - 1]}) = ${dp[i][j]}.`);
    }
  }
  snap(m, n, `Answer ${dp[m][n]}. O(m·n) time; one row of memory is enough.`);
  return frames;
}

function knapsack(): Frame[] {
  const nums = [3, 1, 4], target = 5;
  const dp = Array(target + 1).fill(false);
  dp[0] = true;
  const f: Frame[] = [];
  const cols = Array.from({ length: target + 1 }, (_, s) => String(s));
  const show = (caption: string, hot = -1) => arr(dp.map((x) => (x ? 'T' : 'F')), caption, { states: dp.map((x, s) => (s === hot ? 'hot' : x ? 'good' : undefined)), extraRow: { label: 'sum', cells: cols } });
  f.push(show(`Subset sum to ${target} with ${JSON.stringify(nums)}. dp[s] = can some subset reach s. dp[0] = T.`));
  for (const x of nums) {
    for (let s = target; s >= x; s--) {
      const v = dp[s] || dp[s - x];
      f[f.length - 1].predict = yesNo(`Item ${x}, sum ${s}: is dp[${s}] true after this item? (dp[${s}] or dp[${s} − ${x}])`, v);
      dp[s] = v;
      f.push(show(`Item ${x}: dp[${s}] = dp[${s}] or dp[${s - x}] = ${v ? 'T' : 'F'}. Iterating sums downward so ${x} is used once.`, s));
    }
  }
  f.push(show(`dp[${target}] = ${dp[target] ? 'T' : 'F'}. O(n · target).`));
  return f;
}

function subsetsTree(): Frame[] {
  const nums = [1, 2, 3];
  interface N { id: string; path: number[]; depth: number; x: number }
  const nodes: N[] = [];
  const edges: [string, string][] = [];
  let leafX = 0;
  const order: N[] = [];
  const build = (start: number, path: number[], depth: number, parent?: string): void => {
    const id = `[${path.join(',')}]`;
    const node: N = { id, path, depth, x: 0 };
    nodes.push(node);
    order.push(node);
    if (parent) edges.push([parent, id]);
    const childIds: N[] = [];
    for (let i = start; i < nums.length; i++) { const before = nodes.length; build(i + 1, [...path, nums[i]], depth + 1, id); childIds.push(nodes[before]); }
    node.x = childIds.length ? (childIds[0].x + childIds[childIds.length - 1].x) / 2 : leafX++;
  };
  build(0, [], 0);
  const frames: Frame[] = [];
  const recorded: string[] = [];
  order.forEach((n, idx) => {
    recorded.push(n.id);
    const next = order[idx + 1];
    let predict: Predict | undefined;
    if (next) {
      const opts = [...new Set([next.id, ...order.filter((o) => !recorded.includes(o.id) && o.id !== next.id).map((o) => o.id)])].slice(0, 3).sort();
      predict = P('Which subset is recorded next (depth-first)?', opts, opts.indexOf(next.id));
    }
    frames.push({
      kind: 'tree', edges: edges.filter(([a, b]) => recorded.includes(a) && recorded.includes(b)), predict,
      nodes: nodes.filter((x) => recorded.includes(x.id)).map((x) => ({ id: x.id, x: x.x * 0.9, y: x.depth, label: x.id, state: x.id === n.id ? 'hot' : 'good' })),
      caption: `Record ${n.id}. Then choose each later element, recurse, and undo the choice.`,
      side: [{ label: 'recorded', value: String(recorded.length) }],
    });
  });
  frames.push({ ...(frames[frames.length - 1] as TreeFrame), predict: undefined, caption: `All ${recorded.length} = 2^${nums.length} subsets. O(2^n · n).` });
  return frames;
}

function trieInsert(): Frame[] {
  const words = ['car', 'cat', 'cart'];
  const nodes: { id: string; label: string; depth: number; end: boolean }[] = [{ id: '', label: '·', depth: 0, end: false }];
  const edges: [string, string][] = [];
  const frames: Frame[] = [];
  const layout = () => {
    const leaves: Record<string, number> = {};
    let x = 0;
    const kids = (id: string) => nodes.filter((n) => n.id.length === id.length + 1 && n.id.startsWith(id)).sort((a, b) => a.id.localeCompare(b.id));
    const place = (id: string): number => { const ks = kids(id); if (!ks.length) return (leaves[id] = x++); const xs = ks.map((k) => place(k.id)); return (leaves[id] = (xs[0] + xs[xs.length - 1]) / 2); };
    place('');
    return leaves;
  };
  const snap = (cur: string, caption: string, predict?: Predict) => {
    const xs = layout();
    frames.push({ kind: 'tree', edges: [...edges], caption, predict, nodes: nodes.map((n) => ({ id: n.id || 'root', x: xs[n.id], y: n.depth, label: n.label + (n.end ? '•' : ''), state: n.id === cur ? 'hot' : n.end ? 'good' : undefined })) });
  };
  snap('', 'Trie: one node per character. • marks the end of a word.');
  for (const w of words) {
    for (let i = 1; i <= w.length; i++) {
      const id = w.slice(0, i);
      const exists = nodes.some((n) => n.id === id);
      frames[frames.length - 1].predict = yesNo(`Inserting "${w}": does a new node get created for '${w[i - 1]}' (prefix "${id}")?`, !exists);
      if (!exists) { nodes.push({ id, label: w[i - 1], depth: i, end: false }); edges.push([i === 1 ? 'root' : w.slice(0, i - 1), id]); }
      if (i === w.length) nodes.find((n) => n.id === id)!.end = true;
      snap(id, exists ? `Prefix "${id}" already exists, reuse it.` : `Create node '${w[i - 1]}' for "${id}".${i === w.length ? ` Mark end of "${w}".` : ''}`);
    }
  }
  frames[frames.length - 1].caption += ' Insert and search cost O(word length).';
  return frames;
}

function xorBits(): Frame[] {
  const a = [4, 1, 2, 1, 2];
  let acc = 0;
  const bin = (x: number) => x.toString(2).padStart(3, '0');
  const f: Frame[] = [arr(a.map(bin), 'Single Number: XOR everything. Pairs cancel (x ^ x = 0), 0 ^ x = x.', { side: [{ label: 'acc', value: '000 (0)' }] })];
  a.forEach((x, i) => {
    const next = acc ^ x;
    const o = numOpts(next, [acc, x, acc + x === next ? next + 1 : acc + x]);
    f[f.length - 1].predict = P(`acc = ${bin(acc)} (${acc}), x = ${bin(x)} (${x}). acc ^ x = ?`, o.options, o.answer);
    acc = next;
    f.push(arr(a.map(bin), `acc ^= ${x} → ${bin(acc)} (${acc}).`, { states: a.map((_, j) => (j === i ? 'hot' : j < i ? 'hl' : undefined)), side: [{ label: 'acc', value: `${bin(acc)} (${acc})` }] }));
  });
  f.push(arr(a.map(bin), `The pairs cancelled; ${acc} is the single number. O(n) time, O(1) space.`, { states: a.map((x) => (x === acc ? 'good' : 'dim')) }));
  return f;
}

export const GENERATORS: Record<string, { title: string; make: () => Frame[] }> = {
  arrays: { title: "Kadane's algorithm", make: kadane },
  'prefix-sum': { title: 'Prefix sum + hash map', make: prefixSum },
  strings: { title: 'Anagram check with counts', make: stringCounts },
  hashing: { title: 'Two Sum with a hash map', make: hashTwoSum },
  'two-pointers': { title: 'Two pointers on a sorted array', make: twoPointers },
  'sliding-window': { title: 'Variable sliding window', make: slidingWindow },
  recursion: { title: 'Recursion tree for fib(4)', make: recursionTree },
  sorting: { title: 'The merge step of merge sort', make: mergeStep },
  'binary-search': { title: 'Binary search (lower bound)', make: binarySearch },
  'linked-list': { title: 'Reversing a linked list', make: linkedReverse },
  stack: { title: 'Bracket matching with a stack', make: stackBrackets },
  'monotonic-stack': { title: 'Monotonic stack', make: monotonicStack },
  queue: { title: 'Monotonic deque (window max)', make: dequeMax },
  intervals: { title: 'Merging sorted intervals', make: mergeIntervals },
  trees: { title: 'Post-order DFS: max depth', make: treeDfs },
  bst: { title: 'Searching a BST', make: bstSearch },
  heaps: { title: 'Heap push and sift-up', make: heapPush },
  graphs: { title: 'BFS layer by layer', make: graphBfs },
  'topo-sort': { title: "Kahn's algorithm", make: topoKahn },
  'shortest-path': { title: "Dijkstra's algorithm", make: dijkstra },
  'union-find': { title: 'Union-Find', make: unionFind },
  greedy: { title: 'Greedy farthest reach', make: greedyJump },
  'dp-1d': { title: 'House Robber DP', make: dp1d },
  'dp-2d': { title: 'Filling a DP table (LCS)', make: dpTable },
  'dp-knapsack': { title: '0/1 subset-sum DP', make: knapsack },
  backtracking: { title: 'Subsets decision tree', make: subsetsTree },
  tries: { title: 'Inserting words into a trie', make: trieInsert },
  bits: { title: 'XOR cancels pairs', make: xorBits },
};
