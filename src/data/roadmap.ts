import type { RoadmapDay } from '../types';
import { PROBLEM_BY_ID } from './problems';

type Row = [topic: string, title: string, focus: string, problems: string[], mock?: boolean];

const ROWS: Row[] = [
  // Phase 1, Foundations (1–10)
  ['lang-basics', 'Language basics and I/O', 'Write, run and debug small programs. Loops, functions, reading input fast.', ['running-sum-of-1d-array', 'longest-common-prefix', 'find-the-index-of-the-first-occurrence-in-a-string']],
  ['lang-collections', 'Built-in data structures', 'Know the cost of every operation on your language\'s list, map and set.', ['contains-duplicate', 'valid-anagram', 'first-unique-character-in-a-string', 'majority-element']],
  ['complexity', 'Big-O in practice', 'For each problem write the brute force first, state its Big-O, then improve it.', ['best-time-to-buy-and-sell-stock', 'squares-of-a-sorted-array', 'merge-sorted-array']],
  ['arrays', 'Arrays: traversal and Kadane', 'In-place updates and the "extend or restart" idea.', ['maximum-subarray', 'product-of-array-except-self', 'rotate-array', 'move-zeroes']],
  ['prefix-sum', 'Prefix sums', 'Turn range-sum questions into O(1) lookups; combine with a hash map.', ['find-pivot-index', 'range-sum-query-immutable', 'subarray-sum-equals-k', 'contiguous-array']],
  ['strings', 'Strings', 'Immutable strings, building output efficiently, character counts.', ['valid-palindrome', 'reverse-words-in-a-string', 'valid-palindrome-ii', 'string-compression']],
  ['hashing', 'Hashing I: seen-sets and maps', '"Have I seen the complement?" and frequency maps.', ['two-sum', 'ransom-note', 'isomorphic-strings', 'group-anagrams']],
  ['hashing', 'Hashing II: smarter keys', 'Choosing the right key: sorted word, prefix mod k, (row, col, box).', ['longest-consecutive-sequence', 'valid-sudoku', 'subarray-sums-divisible-by-k', 'encode-and-decode-strings']],
  ['two-pointers', 'Two pointers', 'Opposite ends on sorted input; read/write pointers for in-place.', ['two-sum-ii-input-array-is-sorted', '3sum', 'container-with-most-water', 'remove-duplicates-from-sorted-array', 'trapping-rain-water']],
  ['sliding-window', 'Sliding window', 'Fixed and variable windows; what makes a window valid?', ['maximum-sum-subarray-of-size-k', 'maximum-average-subarray-i', 'longest-substring-without-repeating-characters', 'minimum-size-subarray-sum', 'longest-repeating-character-replacement']],
  // Phase 2, Core techniques (11–25)
  ['recursion', 'Recursion I', 'Base case, smaller input, trust the recursive call. Draw the call tree.', ['fibonacci-number', 'reverse-string', 'power-of-two']],
  ['recursion', 'Recursion II + window practice', 'Divide the input in half (fast power); revisit windows with counts.', ['powx-n', 'k-th-symbol-in-grammar', 'permutation-in-string', 'fruit-into-baskets', 'max-consecutive-ones-iii']],
  ['sorting', 'Sorting', 'Implement merge sort once; then use the library with custom comparators.', ['sort-an-array', 'sort-colors', 'largest-number']],
  ['intervals', 'Intervals', 'Sort by start, then merge or sweep.', ['merge-intervals', 'insert-interval', 'meeting-rooms', 'sort-characters-by-frequency']],
  ['binary-search', 'Binary search I', 'One template: lo, hi, mid, and a condition that is monotonic.', ['binary-search', 'search-insert-position', 'sqrtx', 'find-first-and-last-position-of-element-in-sorted-array']],
  ['binary-search', 'Binary search II: rotated and 2D', 'Which half is sorted? Treat a matrix as one array.', ['search-in-rotated-sorted-array', 'find-minimum-in-rotated-sorted-array', 'search-a-2d-matrix', 'find-peak-element']],
  ['binary-search', 'Binary search on the answer', 'When "can I do it with X?" is monotonic, search over X.', ['koko-eating-bananas', 'capacity-to-ship-packages-within-d-days', 'time-based-key-value-store', 'median-of-two-sorted-arrays']],
  ['linked-list', 'Linked lists I', 'Draw boxes and arrows. Dummy head. Reverse in place.', ['reverse-linked-list', 'merge-two-sorted-lists', 'middle-of-the-linked-list', 'linked-list-cycle']],
  ['linked-list', 'Linked lists II: fast and slow', 'Gap pointers and middle-finding as building blocks.', ['remove-nth-node-from-end-of-list', 'palindrome-linked-list', 'reorder-list', 'linked-list-cycle-ii']],
  ['linked-list', 'Linked lists III: design', 'Combine a hash map with a doubly linked list.', ['add-two-numbers', 'copy-list-with-random-pointer', 'lru-cache']],
  ['stack', 'Stacks I', 'Matching pairs and keeping extra state per element.', ['valid-parentheses', 'min-stack', 'evaluate-reverse-polish-notation', 'implement-queue-using-stacks']],
  ['stack', 'Stacks II: parsing', 'Nested structures and expression evaluation.', ['decode-string', 'asteroid-collision', 'basic-calculator-ii']],
  ['monotonic-stack', 'Monotonic stack', '"Next greater/smaller" in one pass.', ['daily-temperatures', 'next-greater-element-ii', 'daily-temperatures-ii', 'online-stock-span']],
  ['monotonic-stack', 'Monotonic stack II', 'Use the stack to find both boundaries of each bar.', ['largest-rectangle-in-histogram', 'remove-k-digits', 'car-fleet']],
  ['queue', 'Queues, deques + Phase 2 checkpoint', 'Monotonic deque. End the phase with one timed 45-minute session.', ['sliding-window-maximum', 'number-of-recent-calls', 'design-circular-queue']],
  // Phase 3, Trees, graphs, greedy (26–40)
  ['trees', 'Binary trees I: DFS', 'Every tree problem: what do I need from my children?', ['maximum-depth-of-binary-tree', 'invert-binary-tree', 'same-tree', 'binary-tree-inorder-traversal']],
  ['trees', 'Binary trees II: return values', 'Return one thing, update a global answer with another.', ['diameter-of-binary-tree', 'balanced-binary-tree', 'subtree-of-another-tree', 'path-sum']],
  ['trees', 'Binary trees III: BFS', 'Level order with a queue and a level-size loop.', ['binary-tree-level-order-traversal', 'binary-tree-right-side-view', 'binary-tree-zigzag-level-order-traversal', 'count-good-nodes-in-binary-tree']],
  ['trees', 'Binary trees IV: harder DFS', 'Build trees from traversals; path sums through any node.', ['lowest-common-ancestor-of-a-binary-tree', 'construct-binary-tree-from-preorder-and-inorder-traversal', 'binary-tree-maximum-path-sum', 'serialize-and-deserialize-binary-tree']],
  ['bst', 'Binary search trees', 'In-order is sorted; pass bounds down.', ['validate-binary-search-tree', 'search-in-a-binary-search-tree', 'insert-into-a-binary-search-tree', 'kth-smallest-element-in-a-bst', 'lowest-common-ancestor-of-a-binary-search-tree']],
  ['heaps', 'Heaps I: top-k', 'Size-k heap keeps the k best seen so far.', ['kth-largest-element-in-an-array', 'last-stone-weight', 'kth-largest-element-in-a-stream', 'k-closest-points-to-origin']],
  ['heaps', 'Heaps II: merge and median', 'k-way merge and two heaps for the median.', ['top-k-frequent-elements', 'task-scheduler', 'reorganize-string', 'merge-k-sorted-lists', 'find-median-from-data-stream']],
  ['graphs', 'Graphs I: DFS on grids', 'A grid is a graph. Mark visited before you recurse.', ['flood-fill', 'number-of-islands', 'max-area-of-island', 'find-if-path-exists-in-graph']],
  ['graphs', 'Graphs II: DFS from the border', 'Reverse the question: start from the edges or the target.', ['clone-graph', 'pacific-atlantic-water-flow', 'surrounded-regions', 'number-of-enclaves']],
  ['graphs', 'Graphs III: BFS shortest steps', 'BFS gives shortest paths in unweighted graphs; multi-source BFS.', ['rotting-oranges', '01-matrix', 'shortest-path-in-binary-matrix', 'word-ladder']],
  ['topo-sort', 'Topological sort', 'Kahn\'s algorithm; a cycle means no valid order.', ['course-schedule', 'course-schedule-ii', 'find-eventual-safe-states', 'alien-dictionary']],
  ['shortest-path', 'Dijkstra', 'Min-heap of (distance, node); skip stale entries.', ['network-delay-time', 'path-with-minimum-effort', 'cheapest-flights-within-k-stops', 'swim-in-rising-water']],
  ['union-find', 'Union-Find', 'find with path compression, union by size.', ['number-of-provinces', 'redundant-connection', 'number-of-connected-components-in-an-undirected-graph', 'accounts-merge', 'min-cost-to-connect-all-points']],
  ['greedy', 'Greedy I', 'State the greedy choice and why it is safe before coding.', ['jump-game', 'jump-game-ii', 'assign-cookies', 'gas-station']],
  ['greedy', 'Greedy II: intervals + checkpoint', 'Sort by end time. End the phase with a timed session.', ['non-overlapping-intervals', 'meeting-rooms-ii', 'partition-labels', 'minimum-number-of-arrows-to-burst-balloons', 'hand-of-straights']],
  // Phase 4, DP and interview polish (41–60)
  ['dp-1d', 'DP I: from recursion to tables', 'Recursion → memo → table → two variables.', ['climbing-stairs', 'min-cost-climbing-stairs', 'house-robber']],
  ['dp-1d', 'DP II: 1D states', 'Define dp[i] in one sentence before writing code.', ['house-robber-ii', 'coin-change', 'decode-ways', 'palindromic-substrings']],
  ['dp-1d', 'DP III: multiple states', 'When one number per index is not enough, keep two or three.', ['word-break', 'maximum-subarray-sum-with-one-deletion', 'best-time-to-buy-and-sell-stock-with-cooldown']],
  ['dp-2d', 'DP IV: grids', 'dp[r][c] from top and left; compress to one row.', ['unique-paths', 'minimum-path-sum', 'unique-paths-ii', 'maximal-square']],
  ['dp-2d', 'DP V: two strings', 'dp[i][j] over prefixes of both strings.', ['longest-common-subsequence', 'edit-distance', 'longest-palindromic-subsequence', 'interleaving-string']],
  ['dp-knapsack', 'DP VI: knapsack', 'Take / skip each item; iterate capacity backwards for 0/1.', ['partition-equal-subset-sum', 'target-sum', 'coin-change-ii', 'last-stone-weight-ii', 'ones-and-zeroes']],
  ['dp-knapsack', 'DP VII: LIS and memoized DFS', 'O(n^2) LIS, then patience sorting; DFS + memo on grids.', ['longest-increasing-subsequence', 'russian-doll-envelopes', 'longest-increasing-path-in-a-matrix']],
  ['backtracking', 'Backtracking I', 'Choose → explore → un-choose. Draw the decision tree.', ['subsets', 'subsets-ii', 'permutations', 'letter-combinations-of-a-phone-number']],
  ['backtracking', 'Backtracking II', 'Prune early; skip duplicates at the same depth.', ['combination-sum', 'combination-sum-ii', 'generate-parentheses', 'palindrome-partitioning']],
  ['backtracking', 'Backtracking III: grids and boards', 'Mark, recurse, unmark.', ['word-search', 'n-queens-ii', 'n-queens', 'word-break-ii']],
  ['tries', 'Tries', 'A node per character; children map/array + end flag.', ['implement-trie-prefix-tree', 'design-add-and-search-words-data-structure', 'replace-words', 'word-search-ii']],
  ['bits', 'Bit manipulation I', 'XOR cancels, n & (n - 1) drops the lowest set bit.', ['single-number', 'number-of-1-bits', 'counting-bits', 'missing-number', 'reverse-bits']],
  ['bits', 'Bits II + trie practice', 'Carry with AND and shift; per-bit counting.', ['sum-of-two-integers', 'single-number-ii', 'implement-magic-dictionary', 'longest-word-in-dictionary']],
  ['mock', 'Revision sprint: arrays and matrices', 'Re-solve without notes. Anything that takes > 30 min goes to the help list.', ['spiral-matrix', 'set-matrix-zeroes', 'rotate-image', 'maximum-product-subarray']],
  ['mock', 'Revision sprint: mixed patterns', 'Name the pattern within 3 minutes of reading each problem.', ['longest-palindromic-substring', '3sum-closest', 'boats-to-save-people', 'top-k-frequent-words', 'find-k-pairs-with-smallest-sums']],
  ['mock', 'Mock interview 1', 'Two problems, 45 minutes, talk out loud. Review with the checklist.', ['jump-game-iii', 'graph-valid-tree', 'detonate-the-maximum-bombs'], true],
  ['mock', 'Mock interview 2', 'Focus on explaining the brute force before optimizing.', ['non-decreasing-array', 'find-all-anagrams-in-a-string', 'candy'], true],
  ['mock', 'Mock interview 3', 'Focus on edge cases: empty input, duplicates, overflow.', ['evaluate-division', 'gas-station-ii', 'counting-bits-ii'], true],
  ['mock', 'Mock interview 4', 'Focus on clean code: names, helper functions, no dead code.', ['delete-node-in-a-bst', 'convert-sorted-array-to-binary-search-tree', 'minimum-window-substring'], true],
  ['mock', 'Final mock + readiness review', 'Cold re-solves of classics. Then check the readiness view and plan the next 30 days.', ['trapping-rain-water', 'longest-increasing-subsequence', 'number-of-islands', 'lru-cache'], true],
];

const MIN_BY_DIFF = { Easy: 20, Medium: 35, Hard: 50 } as const;

export const ROADMAP: RoadmapDay[] = ROWS.map(([topic, title, focus, problems, mock], i) => {
  const day = i + 1;
  const phase = (day <= 10 ? 1 : day <= 25 ? 2 : day <= 40 ? 3 : 4) as 1 | 2 | 3 | 4;
  const problemMinutes = problems.reduce((s, id) => s + (MIN_BY_DIFF[PROBLEM_BY_ID[id]?.difficulty ?? 'Medium']), 0);
  const lesson = mock ? 0 : topic === 'mock' ? 10 : 40;
  return { day, phase, topic, title, focus, problems, minutes: lesson + problemMinutes + (mock ? 15 : 0), mock };
});

export const TOTAL_DAYS = ROADMAP.length;
