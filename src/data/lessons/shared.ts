/* Language-neutral concept content. Templates, idioms and language notes live in python.ts / java.ts. */

export type VisualId =
  | 'two-pointers' | 'sliding-window' | 'binary-search' | 'prefix-sum' | 'recursion-tree'
  | 'graph-bfs' | 'monotonic-stack' | 'dp-table' | 'linked-list-reverse' | 'kadane';

export interface Card { front: string; back: string }

export interface ConceptLesson {
  topic: string;
  intuition: string;
  approach: string[];
  signals: string[];
  complexity: { what: string; time: string; space: string }[];
  mistakes: string[];
  visual?: VisualId;
  cards: Card[];
}

export const CONCEPTS: Record<string, ConceptLesson> = {
  complexity: {
    topic: 'complexity',
    intuition: `Big-O answers one question: **when the input gets 10x bigger, how much slower does my code get?** We ignore constants and keep the fastest-growing term, because for large inputs that is all that matters.

The practical skill is translating input limits into an allowed complexity. A typical judge runs about **10^7 to 10^8 simple operations per second**. So:

- n ≤ 10–12 → O(n!) or O(2^n · n) is fine (permutations, subsets)
- n ≤ 20–25 → O(2^n)
- n ≤ 500 → O(n^3)
- n ≤ 5,000 → O(n^2)
- n ≤ 10^5 – 10^6 → O(n log n) or O(n)
- n ≥ 10^9 → O(log n) or O(1) (math, binary search on the answer)

Read the constraints **before** thinking about the solution. They often tell you which pattern is expected.`,
    approach: [
      'Count how many times the innermost statement runs as a function of n.',
      'Nested loops over the same input usually multiply: O(n · n). Sequential loops add: O(n + n) = O(n).',
      'Halving the search space each step gives O(log n). Doing O(n) work at each of log n levels gives O(n log n).',
      'Space counts extra memory you allocate, including the recursion stack (depth × frame size).',
      'State both time and space out loud in interviews, and say which term dominates.',
    ],
    signals: ['n ≤ 20 → exponential search is allowed', 'n ≈ 10^5 → you need O(n log n) or better', 'values up to 10^9 with "minimum X such that" → binary search on the answer'],
    complexity: [
      { what: 'Single loop', time: 'O(n)', space: 'O(1)' },
      { what: 'Loop inside loop', time: 'O(n^2)', space: 'O(1)' },
      { what: 'Sort', time: 'O(n log n)', space: 'O(n) or O(log n)' },
      { what: 'Binary search', time: 'O(log n)', space: 'O(1)' },
      { what: 'All subsets', time: 'O(2^n · n)', space: 'O(n) stack' },
    ],
    mistakes: [
      'Forgetting hidden costs: slicing, string concatenation in a loop, `in` on a list, `contains` on an ArrayList are all O(n).',
      'Ignoring recursion stack space.',
      'Calling something O(1) "amortized" without knowing why (dynamic array append is amortized O(1) because of doubling).',
    ],
    cards: [
      { front: 'Roughly how many simple operations per second should you budget for a judge?', back: '10^7 – 10^8.' },
      { front: 'n ≤ 10^5. Which complexities are acceptable?', back: 'O(n log n) or O(n). O(n^2) = 10^10 is too slow.' },
      { front: 'n ≤ 20. What does that hint at?', back: 'Exponential search is fine: subsets / bitmask / backtracking, O(2^n).' },
      { front: 'Time complexity of building all subsets of n items?', back: 'O(2^n · n): 2^n subsets, each up to n long to copy.' },
      { front: 'Space complexity of a recursive DFS on a skewed tree with n nodes?', back: 'O(n) for the call stack (O(h) in general).' },
    ],
  },

  arrays: {
    topic: 'arrays',
    intuition: `An array is a row of boxes in memory. Reading or writing box i is O(1) because the address is computed directly. Inserting or deleting in the middle is O(n) because everything after it shifts.

Most array problems are solved with **one pass** that carries a small amount of state: the best so far, the minimum so far, a write index. **Kadane's algorithm** is the classic: walking left to right, the best subarray ending here either **extends** the best subarray ending at the previous index or **restarts** at this element, whichever is larger.`,
    approach: [
      'Ask: can I answer it in one pass if I remember something about the prefix (min so far, running sum, last index)?',
      'For "in-place" tasks, use a write pointer that trails a read pointer.',
      'For "product/sum except self", combine a prefix pass and a suffix pass.',
      'Kadane: cur = max(x, cur + x); best = max(best, cur).',
    ],
    signals: ['"contiguous subarray" with max/min sum → Kadane or prefix sums', '"in-place", "O(1) extra space" → read/write pointers or swapping', '"without division" → prefix and suffix products'],
    complexity: [
      { what: 'Access by index', time: 'O(1)', space: '—' },
      { what: 'Insert/delete in middle', time: 'O(n)', space: '—' },
      { what: 'Append (dynamic array)', time: 'O(1) amortized', space: '—' },
      { what: "Kadane's algorithm", time: 'O(n)', space: 'O(1)' },
    ],
    mistakes: [
      'Initialising the Kadane answer with 0, fails when all numbers are negative. Start with the first element.',
      'Off-by-one errors at the boundaries (i < n vs i <= n).',
      'Modifying an array while iterating over it with a for-each loop.',
    ],
    visual: 'kadane',
    cards: [
      { front: "Which pattern finds the maximum-sum contiguous subarray in O(n)?", back: "Kadane's algorithm: cur = max(x, cur + x), best = max(best, cur)." },
      { front: 'Why must Kadane start with nums[0] rather than 0?', back: 'If every number is negative, the answer is the largest negative number, not 0.' },
      { front: 'How do you compute "product of array except self" without division?', back: 'Left pass storing prefix products, right pass multiplying by suffix products. O(n) time, O(1) extra.' },
    ],
  },

  'prefix-sum': {
    topic: 'prefix-sum',
    intuition: `If you precompute \`prefix[i] = nums[0] + ... + nums[i-1]\`, then the sum of any range \`[l, r]\` is just \`prefix[r+1] - prefix[l]\`, O(1) instead of O(n).

A stronger version combines prefix sums with a **hash map**: a subarray ending at index j sums to k exactly when some earlier prefix equals \`prefix_j - k\`. So while scanning, keep a count of every prefix sum you have seen. This works even with negative numbers, where a sliding window would fail.`,
    approach: [
      'Build prefix with a leading 0 so empty prefixes are handled uniformly.',
      'For "count subarrays with sum k": seen = {0: 1}; for each running sum s, answer += seen[s - k]; seen[s] += 1.',
      'For "longest subarray with property": store the FIRST index where each prefix value appears.',
      'Variants: prefix XOR, prefix counts, prefix modulo k.',
    ],
    signals: ['"sum of subarray" with negatives allowed', '"number of subarrays with sum / divisible by k"', 'many range-sum queries on a static array'],
    complexity: [
      { what: 'Build prefix array', time: 'O(n)', space: 'O(n)' },
      { what: 'Range sum query', time: 'O(1)', space: '—' },
      { what: 'Prefix + hash map counting', time: 'O(n)', space: 'O(n)' },
    ],
    mistakes: [
      'Forgetting to seed the map with prefix 0 (count 1), misses subarrays starting at index 0.',
      'Updating the map before querying it (counts the empty subarray when k = 0).',
      'Using a sliding window when negatives are present.',
    ],
    visual: 'prefix-sum',
    cards: [
      { front: 'Sum of nums[l..r] using a prefix array with a leading 0?', back: 'prefix[r + 1] - prefix[l].' },
      { front: 'Which pattern counts subarrays with sum exactly k when numbers can be negative?', back: 'Prefix sum + hash map of prefix counts: add seen[s - k] at each step.' },
      { front: 'Why seed the prefix-count map with {0: 1}?', back: 'So subarrays that start at index 0 (whole prefix sums to k) are counted.' },
    ],
  },

  strings: {
    topic: 'strings',
    intuition: `Strings behave like arrays of characters, with one big difference in both Python and Java: **they are immutable**. Every "modification" creates a new string, so building a result by repeated \`+\` inside a loop can be O(n^2). Collect pieces in a list / StringBuilder and join once.

Most string problems reduce to patterns you already know: two pointers (palindromes, reversing), hashing (anagrams, character counts), sliding window (substrings). With only lowercase letters, a fixed array of 26 counts is faster and simpler than a hash map.`,
    approach: [
      'Normalise first if the problem says to ignore case or non-alphanumerics.',
      'Counting characters? Use an int[26] (or Counter) keyed by c - \'a\'.',
      'Comparing two strings for "same letters"? Compare counts, or sorted strings as a key.',
      'Building output? Append to a list / StringBuilder, join at the end.',
    ],
    signals: ['"anagram", "permutation of" → character counts', '"palindrome" → two pointers from both ends or expand around center', '"substring" with a constraint → sliding window'],
    complexity: [
      { what: 'Concatenate in a loop with +', time: 'O(n^2) worst case', space: 'O(n)' },
      { what: 'Join list / StringBuilder', time: 'O(n)', space: 'O(n)' },
      { what: 'Sort a string of length k', time: 'O(k log k)', space: 'O(k)' },
    ],
    mistakes: [
      'Repeated string concatenation inside loops.',
      'Comparing strings by identity instead of value (Java ==).',
      'Forgetting that substring/slicing copies (O(k)).',
    ],
    cards: [
      { front: 'Why is building a string with += in a loop risky?', back: 'Strings are immutable; each += may copy the whole string → O(n^2). Use join / StringBuilder.' },
      { front: 'Fastest way to compare letter counts of lowercase strings?', back: 'An int array of size 26 indexed by c - \'a\'.' },
      { front: 'Which pattern checks a palindrome in O(1) extra space?', back: 'Two pointers from both ends moving inward.' },
    ],
  },

  hashing: {
    topic: 'hashing',
    intuition: `A hash map gives average **O(1)** insert and lookup by turning a key into an array index. It lets you trade memory for time: instead of searching the array again (O(n)), remember what you have seen.

Three shapes cover most problems:
- **Seen set**: "have I seen x before?" (duplicates, cycle detection)
- **Complement map**: "have I seen target - x?" and where (Two Sum)
- **Frequency map**: "how many times does each thing occur?" (anagrams, top-k)

The creative part is choosing the **key**: a sorted word groups anagrams, a tuple (row, col) identifies a cell, a prefix sum identifies a range.`,
    approach: [
      'Write the brute force with nested loops. Ask what the inner loop is searching for.',
      'Store that thing in a map keyed by what you search with.',
      'Check the map before inserting the current element when the element must not pair with itself.',
    ],
    signals: ['"find a pair/complement"', '"duplicates", "first unique", "count occurrences"', '"group by some property" → map from canonical key to list'],
    complexity: [
      { what: 'Insert / lookup / delete', time: 'O(1) average, O(n) worst', space: 'O(n) total' },
      { what: 'Iterate all entries', time: 'O(n)', space: '—' },
    ],
    mistakes: [
      'Using a mutable object as a key (Python list, Java array). Use tuple / String / List with proper equals.',
      'Inserting before checking, so an element pairs with itself.',
      'Forgetting that iteration order is not sorted (use TreeMap / sorted() when order matters).',
    ],
    cards: [
      { front: 'Which pattern solves Two Sum in O(n)?', back: 'Hash map from value → index; for each x, check if target - x is already in the map.' },
      { front: 'What key groups anagrams together?', back: 'The sorted word (or a 26-count tuple/string).' },
      { front: 'Average and worst-case lookup cost in a hash map?', back: 'O(1) average, O(n) worst case (many collisions).' },
      { front: 'Longest consecutive sequence in O(n): key idea?', back: 'Put all numbers in a set; only start counting at x where x - 1 is not in the set.' },
    ],
  },

  'two-pointers': {
    topic: 'two-pointers',
    intuition: `Two indices walk through the data so that together they visit O(n) states instead of the O(n^2) pairs a double loop would try.

**Opposite ends** (sorted input): if the pair sum is too small, the only way to grow it is to move the left pointer right; too big, move the right pointer left. Every move safely discards a whole row of pairs.

**Same direction** (read/write): a fast pointer reads every element, a slow pointer marks where the next kept element should be written. This gives in-place filtering in O(1) extra space.`,
    approach: [
      'Is the input sorted, or can you sort it without losing what you need? → opposite-end pointers.',
      'Write down why moving a pointer cannot skip the answer. That argument IS the solution.',
      'For k-sum: sort, fix one element in a loop, run two pointers on the rest. Skip duplicates.',
      'For in-place removal: for read in range(n): if keep(nums[read]): nums[write] = nums[read]; write += 1.',
    ],
    signals: ['sorted array + pair/triplet with a target', '"in-place", "O(1) extra space", "remove duplicates"', 'palindrome checks', '"container", "trap water" (move the shorter side)'],
    complexity: [
      { what: 'Opposite-end scan', time: 'O(n)', space: 'O(1)' },
      { what: '3Sum (sort + two pointers)', time: 'O(n^2)', space: 'O(1) extra (sort aside)' },
    ],
    mistakes: [
      'Using two pointers on unsorted data where order matters (Two Sum I needs a hash map, not sorting, if you must return original indices).',
      'Not skipping duplicates in 3Sum → duplicate triplets.',
      'Infinite loop because a pointer is not moved in some branch.',
    ],
    visual: 'two-pointers',
    cards: [
      { front: 'Sorted array, find a pair summing to target in O(1) space. Pattern?', back: 'Two pointers from both ends: sum too small → left++, too big → right--.' },
      { front: 'Container With Most Water: which pointer moves?', back: 'The shorter line. The taller one can never form a larger area with a narrower width.' },
      { front: '3Sum time complexity with sort + two pointers?', back: 'O(n^2).' },
    ],
  },

  'sliding-window': {
    topic: 'sliding-window',
    intuition: `A sliding window is two pointers that describe a **contiguous range** [left, right]. Instead of recomputing each window from scratch, you **add** the element entering on the right and **remove** the element leaving on the left. Each element enters and leaves once, so the whole scan is O(n).

**Fixed size k**: slide one step at a time, add nums[right], remove nums[right - k].
**Variable size**: expand right every step; while the window is invalid, shrink from the left. Record the answer when the window is valid.

The question to answer is: **what makes a window valid, and can I check it in O(1) as it changes?** (a count map, a running sum, "length - max frequency ≤ k").`,
    approach: [
      'Define validity in one sentence (e.g. "no character appears twice").',
      'Pick the state that lets you test validity in O(1): sum, count map, number of distinct chars.',
      'Loop right from 0 to n-1: add s[right]; while invalid: remove s[left], left++; update answer.',
      'Longest valid → update after shrinking. Shortest valid → update inside the shrinking loop.',
    ],
    signals: ['"contiguous subarray/substring"', '"longest/shortest/maximum ... such that"', '"at most k distinct / k replacements"', 'all numbers positive (for sum constraints)'],
    complexity: [
      { what: 'Variable window', time: 'O(n)', space: 'O(k) for the window state' },
      { what: 'Fixed window', time: 'O(n)', space: 'O(1)' },
    ],
    mistakes: [
      'Using a sum-based window when numbers can be negative (validity is no longer monotonic). Use prefix sums.',
      'Updating the answer at the wrong place (before vs after shrinking).',
      'Forgetting to decrement/remove counts when the left pointer moves.',
    ],
    visual: 'sliding-window',
    cards: [
      { front: 'Which pattern finds the longest substring without repeating characters?', back: 'Variable sliding window with a set/last-index map; shrink left while a repeat exists.' },
      { front: 'Why does a sum-based sliding window fail with negative numbers?', back: 'Extending the window can decrease the sum, so "shrink while too big" no longer works. Use prefix sums.' },
      { front: 'Longest Repeating Character Replacement: validity condition?', back: 'window length - max char frequency in window ≤ k.' },
      { front: 'Time complexity of a sliding window scan?', back: 'O(n): each element enters and leaves the window once.' },
    ],
  },

  recursion: {
    topic: 'recursion',
    intuition: `A recursive function solves a problem by solving a **smaller version of the same problem** and combining the result. It needs:

1. **Base case**, an input small enough to answer directly (n == 0, empty list, null node).
2. **Recursive case**, call yourself on a strictly smaller input and **trust** that the call returns the right answer.
3. **Combine**, build the answer for the current input from the sub-answers.

Draw the **recursion tree**: each node is a call, children are the calls it makes. Time ≈ number of nodes × work per node; space ≈ the tree's depth (the call stack). Plain recursive Fibonacci has ~2^n nodes because the same subproblems repeat. That observation is where dynamic programming starts.`,
    approach: [
      'Write the function signature and say in words what it returns.',
      'Handle the base case(s) first.',
      'Assume the call on the smaller input works; use it.',
      'Check that every path reaches a base case (input always shrinks).',
      'Estimate depth: Python has a default limit of 1000 frames; Java\'s stack typically handles ~10^4.',
    ],
    signals: ['the problem is defined in terms of itself (trees, nested structures)', '"generate all ..." → recursion/backtracking', 'divide and conquer: split in half, solve, merge'],
    complexity: [
      { what: 'Linear recursion (n → n-1)', time: 'O(n)', space: 'O(n) stack' },
      { what: 'Halving (fast power)', time: 'O(log n)', space: 'O(log n) stack' },
      { what: 'Two branches, no memo (fib)', time: 'O(2^n)', space: 'O(n) stack' },
    ],
    mistakes: [
      'Missing or wrong base case → infinite recursion / stack overflow.',
      'Recomputing the same subproblem many times (add memoization).',
      'Sharing a mutable list between calls without copying/undoing.',
    ],
    visual: 'recursion-tree',
    cards: [
      { front: 'Three parts of every recursive solution?', back: 'Base case, recursive call on a smaller input, combine step.' },
      { front: 'Time complexity of naive recursive fib(n)?', back: 'O(2^n) (more precisely ~1.6^n): overlapping subproblems.' },
      { front: 'Base case for pow(x, n) by fast exponentiation?', back: 'n == 0 → return 1. Then half = pow(x, n/2); result = half*half (× x if n odd).' },
      { front: 'Space cost of recursion?', back: 'O(max depth) for the call stack.' },
    ],
  },

  sorting: {
    topic: 'sorting',
    intuition: `Sorting is often the first step that unlocks a simpler algorithm: after sorting, duplicates are adjacent, two pointers work, intervals can be merged left to right, and greedy choices become obvious.

You should be able to **write merge sort** (split in half, sort each half recursively, merge two sorted lists with two pointers) and **explain quicksort's partition**. In practice you use the library sort with a **custom comparator**, and that comparator is where interview bugs hide.`,
    approach: [
      'Ask whether sorted order would make the problem easier, and whether you are allowed to lose original indices.',
      'Merge sort: if len ≤ 1 return; sort halves; merge.',
      'Custom order: define a key or comparator; for "largest number" compare a+b vs b+a.',
      'Dutch national flag: three pointers low/mid/high to sort 0/1/2 in one pass.',
    ],
    signals: ['"merge/overlapping intervals"', 'pairs/triplets problems that do not need original indices', '"k-th smallest" (sort, or better: heap / quickselect)'],
    complexity: [
      { what: 'Merge sort', time: 'O(n log n)', space: 'O(n)' },
      { what: 'Quicksort (average / worst)', time: 'O(n log n) / O(n^2)', space: 'O(log n)' },
      { what: 'Library sort (Timsort / dual-pivot)', time: 'O(n log n)', space: 'O(n) / O(log n)' },
      { what: 'Counting sort (small range k)', time: 'O(n + k)', space: 'O(k)' },
    ],
    mistakes: [
      'Comparator that overflows (a - b on large ints in Java).',
      'Sorting when the problem needs original indices (store pairs (value, index) first).',
      'Forgetting the merge step\'s leftover elements.',
    ],
    cards: [
      { front: 'Merge sort time and space?', back: 'O(n log n) time, O(n) extra space; stable.' },
      { front: 'Which algorithm sorts an array of 0s, 1s and 2s in one pass?', back: 'Dutch national flag: low, mid, high pointers.' },
      { front: 'Merge intervals: first step?', back: 'Sort by start, then extend the last merged interval while starts overlap.' },
    ],
  },

  'binary-search': {
    topic: 'binary-search',
    intuition: `Binary search works on anything **monotonic**: a sorted array, or a yes/no question whose answer flips once (false, false, ..., true, true). Each step looks at the middle and throws away the half that cannot contain the answer, O(log n).

Learn **one template** and use it everywhere: find the **first index where condition(i) is true**.

\`\`\`
lo, hi = 0, n          # answer is in [lo, hi]
while lo < hi:
    mid = (lo + hi) // 2
    if condition(mid): hi = mid
    else: lo = mid + 1
return lo
\`\`\`

**Binary search on the answer**: when the question is "minimum speed / capacity / days such that it is feasible", and feasibility is monotonic, binary search over the answer value and test feasibility with a greedy check.`,
    approach: [
      'Identify the monotonic condition. Write it as a function.',
      'Decide the search range so the answer is guaranteed inside it.',
      'Use the lower-bound template; check termination with a 2-element example.',
      'Rotated arrays: at each mid one half is sorted, check whether target lies inside it.',
    ],
    signals: ['sorted input + O(log n) requirement', '"minimum/maximum value such that ..." with large limits (10^9)', 'rotated sorted array', '"find first/last position"'],
    complexity: [
      { what: 'Binary search', time: 'O(log n)', space: 'O(1)' },
      { what: 'On the answer with O(n) check', time: 'O(n log V)', space: 'O(1)' },
    ],
    mistakes: [
      'Infinite loop: using lo = mid with mid rounded down.',
      'Overflow in (lo + hi) / 2 in Java. Use lo + (hi - lo) / 2.',
      'Mixing inclusive and exclusive bounds in the same template.',
    ],
    visual: 'binary-search',
    cards: [
      { front: 'Which pattern solves "minimum eating speed to finish in h hours"?', back: 'Binary search on the answer: speed is monotonic in feasibility.' },
      { front: 'Safe midpoint formula in Java?', back: 'mid = lo + (hi - lo) / 2 (avoids int overflow).' },
      { front: 'Search in rotated sorted array: key observation?', back: 'One half around mid is always sorted; check if target lies within that half.' },
      { front: 'Time complexity of binary search?', back: 'O(log n).' },
    ],
  },

  'linked-list': {
    topic: 'linked-list',
    intuition: `A linked list is a chain of nodes, each holding a value and a pointer to the next node. There is no index access, reaching the k-th node costs O(k), but inserting or removing a node you already hold is O(1): you just rewire pointers.

Almost every linked list bug is a lost pointer. **Draw boxes and arrows**, and before you overwrite \`node.next\`, save what it pointed to. A **dummy head** node in front of the list removes special cases for the first node.

**Fast and slow pointers**: move one pointer 2 steps and one 1 step. When fast reaches the end, slow is at the middle; if there is a cycle, they meet inside it.`,
    approach: [
      'Use a dummy node when the head might change (deletions, merges).',
      'Reverse: prev = null; while cur: nxt = cur.next; cur.next = prev; prev = cur; cur = nxt.',
      'n-th from end: move fast n steps ahead, then move both until fast hits the end.',
      'Many medium problems = find middle + reverse second half + merge/compare.',
    ],
    signals: ['"in one pass", "middle", "cycle" → fast/slow', '"reverse", "reorder", "merge" → pointer rewiring with a dummy', '"O(1) get/put with eviction" → hash map + doubly linked list'],
    complexity: [
      { what: 'Access k-th node', time: 'O(k)', space: '—' },
      { what: 'Insert/delete after a known node', time: 'O(1)', space: '—' },
      { what: 'Reverse a list', time: 'O(n)', space: 'O(1)' },
    ],
    mistakes: [
      'Overwriting next before saving it.',
      'Not handling empty list / single node.',
      'Forgetting to terminate the new tail (cycle in the result).',
    ],
    visual: 'linked-list-reverse',
    cards: [
      { front: 'Which pattern detects a cycle in a linked list in O(1) space?', back: "Floyd's fast and slow pointers: they meet if there is a cycle." },
      { front: 'Why use a dummy head node?', back: 'The real head may change; the dummy removes special cases for inserting/deleting at the front.' },
      { front: 'LRU cache with O(1) get and put: data structures?', back: 'Hash map (key → node) + doubly linked list ordered by recency.' },
    ],
  },

  stack: {
    topic: 'stack',
    intuition: `A stack is last-in, first-out. Push on top, pop from top. Both O(1). It is the natural structure whenever **the most recent unfinished thing is the one you need to resolve next**: a matching bracket, an operand waiting for its operator, the previous directory in a path, an outer level of nesting.`,
    approach: [
      'Matching problems: push openers; on a closer, the top must be its partner.',
      'Expression evaluation: push numbers; on an operator, pop operands, push result.',
      'Nested structures (decode "3[a2[c]]"): push the current state when entering a level, pop when leaving.',
      'Need O(1) min? Store (value, min so far) pairs on the stack.',
    ],
    signals: ['brackets, nesting, "valid sequence"', '"evaluate expression", "decode string"', 'undo / backtrack to most recent', 'simulate collisions'],
    complexity: [{ what: 'push / pop / peek', time: 'O(1)', space: 'O(n) total' }],
    mistakes: [
      'Popping an empty stack.',
      'Forgetting to check the stack is empty at the end (unclosed brackets).',
      'Integer division semantics in RPN (truncate toward zero).',
    ],
    cards: [
      { front: 'Which data structure checks balanced brackets?', back: 'A stack of open brackets.' },
      { front: 'Min Stack with O(1) getMin: idea?', back: 'Push (value, current minimum) pairs, or keep a second stack of minimums.' },
    ],
  },

  'monotonic-stack': {
    topic: 'monotonic-stack',
    intuition: `A monotonic stack keeps its elements in increasing (or decreasing) order. When a new element arrives that breaks the order, you **pop** the elements it beats, and for each popped element, the new one is exactly its **next greater (or smaller) element**.

Every index is pushed once and popped once, so the whole scan is O(n), even though it looks like a nested loop. Store **indices**, not values, so you can compute distances and widths.`,
    approach: [
      'Next greater element: keep a decreasing stack of indices. For each i: while stack and a[stack.top] < a[i]: answer[pop] = i.',
      'Previous smaller element: increasing stack, read the top before pushing.',
      'Circular arrays: iterate 2n times using i % n.',
      'Histogram: for each bar, popping it reveals its left and right smaller boundaries.',
    ],
    signals: ['"next greater / next smaller / previous ..."', '"how many days until", "span"', 'largest rectangle, trapping water'],
    complexity: [{ what: 'Monotonic stack pass', time: 'O(n)', space: 'O(n)' }],
    mistakes: [
      'Storing values instead of indices.',
      'Strict vs non-strict comparison with duplicates.',
      'Forgetting the elements left on the stack at the end (they have no next greater).',
    ],
    visual: 'monotonic-stack',
    cards: [
      { front: 'Which pattern solves Daily Temperatures in O(n)?', back: 'Monotonic decreasing stack of indices; pop while the current temp is warmer.' },
      { front: 'Why is a monotonic stack O(n) despite the inner while loop?', back: 'Each index is pushed once and popped at most once.' },
    ],
  },

  queue: {
    topic: 'queue',
    intuition: `A queue is first-in, first-out: it processes things **in the order they arrived**. The backbone of BFS and of any "last T seconds" counter. A **deque** (double-ended queue) allows O(1) pushes and pops at both ends.

The **monotonic deque** solves sliding window maximum: keep indices whose values are decreasing. The front is the max of the current window; pop from the front when it slides out, pop from the back when a bigger element arrives (smaller ones can never be a max again).`,
    approach: [
      'Use a real deque, popping from the front of a dynamic array is O(n).',
      'Sliding window max: for each i: pop back while smaller; push i; pop front if out of window; record front once i ≥ k-1.',
      'Rate limiting / recent counter: push timestamps, pop front while too old.',
    ],
    signals: ['"max/min of every window of size k"', 'process in arrival order, BFS', '"in the last X seconds"'],
    complexity: [
      { what: 'Deque push/pop at either end', time: 'O(1)', space: '—' },
      { what: 'Sliding window max', time: 'O(n)', space: 'O(k)' },
    ],
    mistakes: ['Using list.pop(0) / ArrayList.remove(0) (O(n)).', 'Storing values in the monotonic deque instead of indices (cannot tell when they leave the window).'],
    cards: [
      { front: 'Which pattern gives the maximum of every window of size k in O(n)?', back: 'Monotonic deque of indices with decreasing values.' },
    ],
  },

  intervals: {
    topic: 'intervals',
    intuition: `Interval problems become simple once intervals are **sorted**. Sorted by start, overlapping intervals are adjacent, so one pass can merge them. Sorted by **end**, the greedy "keep the interval that finishes first" maximises how many non-overlapping intervals you can keep.

For "how many at the same time" questions, use a **sweep**: turn each interval into a +1 event at its start and a -1 event at its end, sort events, and track the running count (or use a min-heap of end times).`,
    approach: [
      'Merge: sort by start; if cur.start ≤ last.end then last.end = max(last.end, cur.end) else append.',
      'Max non-overlapping / min removals: sort by end, greedily keep.',
      'Rooms / overlaps count: sort starts and ends separately, or min-heap of end times.',
      'Clarify whether touching endpoints overlap.',
    ],
    signals: ['"intervals", "meetings", "bookings", "ranges"', '"minimum rooms/arrows/removals"'],
    complexity: [{ what: 'Sort + sweep', time: 'O(n log n)', space: 'O(n)' }],
    mistakes: ['Not sorting first.', 'Wrong boundary: [1,2] and [2,3], overlapping or not? Read the statement.', 'Mutating the input interval objects you are still reading.'],
    cards: [
      { front: 'Merge intervals: sort by what?', back: 'By start time.' },
      { front: 'Minimum intervals to remove for no overlaps: greedy rule?', back: 'Sort by end; keep each interval that starts after the last kept end.' },
      { front: 'Meeting Rooms II: two ways to count rooms?', back: 'Min-heap of end times, or sweep over sorted start/end events.' },
    ],
  },

  trees: {
    topic: 'trees',
    intuition: `A binary tree node has a value and up to two children. Almost every tree problem is solved by asking one question at each node: **"what do I need from my left and right subtrees to answer for this node?"** Then write a recursive function that returns exactly that.

- Depth: 1 + max(depth(left), depth(right))
- Same tree: values equal and both subtrees same
- Diameter: at each node, left height + right height; return height to the parent

**DFS** orders: pre-order (node, left, right), in-order (left, node, right, sorted for a BST), post-order (left, right, node, when you need children's results first). **BFS** with a queue visits level by level; process \`len(queue)\` nodes per level.`,
    approach: [
      'Decide what the recursive function returns for a subtree (height, sum, bool, node).',
      'Base case: null node.',
      'If the answer is not the return value (e.g. diameter), keep a variable outside and update it at every node.',
      'Level-related questions (right view, zigzag, level averages) → BFS with level-size loop.',
    ],
    signals: ['tree input', '"depth/height/diameter/path"', '"level", "row", "right side view" → BFS'],
    complexity: [
      { what: 'DFS / BFS over all nodes', time: 'O(n)', space: 'O(h) recursion / O(w) queue' },
    ],
    mistakes: [
      'Confusing height (edges vs nodes).',
      'Returning the global answer instead of the per-subtree value.',
      'Python recursion limit on very deep (skewed) trees.',
    ],
    visual: 'graph-bfs',
    cards: [
      { front: 'Which traversal of a BST yields sorted order?', back: 'In-order (left, node, right).' },
      { front: 'Diameter of a binary tree: what does the helper return?', back: 'The height of the subtree; the diameter is updated globally as left + right.' },
      { front: 'Level order traversal: key loop detail?', back: 'For each level, process exactly len(queue) nodes before moving on.' },
      { front: 'Base case for most tree recursions?', back: 'node is null → return the neutral value (0, true, null, etc.).' },
    ],
  },

  bst: {
    topic: 'bst',
    intuition: `A binary search tree keeps every value in the left subtree smaller than the node and every value in the right subtree larger. That gives you two things: **in-order traversal is sorted**, and you can **search by going left or right** like binary search (O(h)).

Validation must check the **whole subtree** against the node, not just the direct children, pass down a (low, high) range of allowed values.`,
    approach: [
      'Search/insert: compare and go left or right.',
      'Validate: dfs(node, low, high) and narrow the range when going down.',
      'k-th smallest: in-order traversal, stop at the k-th visited node.',
      'LCA in BST: the first node where p and q split to different sides.',
    ],
    signals: ['"BST" in the statement', '"k-th smallest", "sorted order"', '"validate"'],
    complexity: [
      { what: 'Search / insert / delete', time: 'O(h): O(log n) balanced, O(n) skewed', space: 'O(h)' },
      { what: 'In-order traversal', time: 'O(n)', space: 'O(h)' },
    ],
    mistakes: [
      'Validating only parent vs child.',
      'Using int bounds that collide with node values equal to Integer.MAX_VALUE (use long or null bounds).',
    ],
    cards: [
      { front: 'Validate BST: what do you pass down the recursion?', back: 'The (low, high) bounds every node in the subtree must lie strictly between.' },
      { front: 'LCA in a BST: rule?', back: 'If both values < node go left; both > node go right; otherwise this node is the LCA.' },
    ],
  },

  heaps: {
    topic: 'heaps',
    intuition: `A heap is a tree stored in an array that always lets you read the smallest (min-heap) or largest (max-heap) element in O(1) and remove/insert in O(log n). It is a **partially** sorted structure, perfect when you repeatedly need "the current best".

The **top-k trick**: to keep the k largest elements, use a **min-heap of size k**. The root is the smallest of your top k, so any new element bigger than it replaces it. Total O(n log k).

**Two heaps** (a max-heap for the lower half, a min-heap for the upper half) maintain a running median.`,
    approach: [
      'k largest → min-heap of size k. k smallest → max-heap of size k.',
      'Merge k sorted lists → heap of the current head of each list.',
      'Scheduling / greedy by priority → heap of (priority, item).',
      'Ties: push tuples/objects with a well-defined ordering.',
    ],
    signals: ['"k-th largest/smallest", "top k", "k closest"', '"merge k sorted"', '"running median", "schedule by priority"'],
    complexity: [
      { what: 'push / pop', time: 'O(log n)', space: '—' },
      { what: 'peek', time: 'O(1)', space: '—' },
      { what: 'heapify n items', time: 'O(n)', space: 'O(1) in place' },
      { what: 'top-k with size-k heap', time: 'O(n log k)', space: 'O(k)' },
    ],
    mistakes: ['Using a max-heap of all n items for top-k (O(n log n), more memory).', 'Comparing objects without a comparator.', 'Removing arbitrary elements from a heap (O(n)). Use lazy deletion.'],
    cards: [
      { front: 'Top-k largest elements: which heap and what size?', back: 'A min-heap of size k; pop when it exceeds k.' },
      { front: 'Running median: data structures?', back: 'Max-heap for the lower half + min-heap for the upper half, kept balanced.' },
      { front: 'Time to build a heap from n items with heapify?', back: 'O(n).' },
    ],
  },

  graphs: {
    topic: 'graphs',
    intuition: `A graph is nodes connected by edges. Represent it as an **adjacency list** (node → list of neighbours). A grid is a graph too: each cell's neighbours are the 4 (or 8) adjacent cells.

**DFS** goes deep before backtracking, natural for connectivity, counting components (islands), and exploring everything reachable. **BFS** explores in rings of increasing distance using a queue, so the first time BFS reaches a node is via the **shortest path** in an unweighted graph.

The one rule you must never forget: **mark a node visited when you add it**, otherwise you will revisit it and possibly loop forever.`,
    approach: [
      'Build adjacency list from edges (both directions if undirected).',
      'Count components: for each unvisited node, start a DFS/BFS and count += 1.',
      'Shortest steps in unweighted graph/grid: BFS, track distance per level.',
      'Multi-source BFS: put all sources in the queue at distance 0.',
      'Sometimes search backwards (from the ocean, from the border, from the target).',
    ],
    signals: ['grid of cells with connectivity', '"number of islands/provinces/components"', '"minimum steps/moves" with equal costs → BFS', 'dependencies between items (→ topological sort)'],
    complexity: [
      { what: 'BFS / DFS', time: 'O(V + E)', space: 'O(V)' },
      { what: 'Grid BFS/DFS', time: 'O(rows · cols)', space: 'O(rows · cols)' },
    ],
    mistakes: [
      'Marking visited when popping instead of when pushing (BFS) → duplicates in the queue.',
      'Recursion depth on large grids in Python.',
      'Forgetting bounds checks before indexing the grid.',
    ],
    visual: 'graph-bfs',
    cards: [
      { front: 'Which traversal gives shortest paths in an unweighted graph?', back: 'BFS.' },
      { front: 'Rotting Oranges: which pattern?', back: 'Multi-source BFS starting from all rotten oranges at once.' },
      { front: 'BFS/DFS time complexity on a graph?', back: 'O(V + E).' },
      { front: 'When should BFS mark a node visited?', back: 'When it is pushed onto the queue, not when popped.' },
    ],
  },

  'topo-sort': {
    topic: 'topo-sort',
    intuition: `A topological order lists the nodes of a directed graph so every edge goes from earlier to later, "take prerequisites before the course". It exists only if there is **no cycle**.

**Kahn's algorithm**: count each node's in-degree (number of prerequisites). Start with all nodes of in-degree 0. Repeatedly remove one, append it to the order, and decrement its neighbours' in-degrees, adding any that reach 0. If you could not output all nodes, there is a cycle.`,
    approach: [
      'Build adjacency list and in-degree array from the edge direction the statement gives (read [a, b] carefully).',
      'Queue all nodes with in-degree 0.',
      'Pop, append to order, decrement neighbours.',
      'len(order) == n ? valid order : cycle.',
    ],
    signals: ['"prerequisites", "dependencies", "build order"', '"is it possible to finish"', 'ordering letters from a sorted alien dictionary'],
    complexity: [{ what: "Kahn's algorithm", time: 'O(V + E)', space: 'O(V + E)' }],
    mistakes: ['Reversing the edge direction.', 'Forgetting isolated nodes (in-degree 0, no edges).'],
    cards: [
      { front: "How does Kahn's algorithm detect a cycle?", back: 'If fewer than n nodes are output, the rest are stuck in a cycle.' },
      { front: 'Course Schedule: which pattern?', back: 'Topological sort (Kahn) / cycle detection on a directed graph.' },
    ],
  },

  'shortest-path': {
    topic: 'shortest-path',
    intuition: `With weighted edges, BFS no longer finds shortest paths. **Dijkstra's algorithm** generalises BFS: instead of a queue, use a **min-heap ordered by distance**. The node popped first has its final shortest distance, because every other route would go through something at least as far (this requires **non-negative weights**).

When a node is pushed several times with different distances, skip the stale entries when popped.`,
    approach: [
      'dist = {source: 0}; heap = [(0, source)].',
      'Pop (d, u); if d > dist[u] skip (stale).',
      'For each (v, w): if d + w < dist[v]: update and push.',
      'Answer may be max(dist) (network delay) or dist[target].',
      'Negative weights or "at most k edges" → Bellman-Ford style relaxations.',
    ],
    signals: ['weighted edges, "minimum cost/time/effort"', '"shortest path" with non-negative weights'],
    complexity: [{ what: 'Dijkstra with binary heap', time: 'O((V + E) log V)', space: 'O(V + E)' }],
    mistakes: ['Using Dijkstra with negative weights.', 'Not skipping stale heap entries (slow but still correct) or marking visited too early.'],
    cards: [
      { front: 'Which algorithm finds shortest paths with non-negative weights?', back: "Dijkstra's algorithm with a min-heap." },
      { front: "Dijkstra's time complexity with a binary heap?", back: 'O((V + E) log V).' },
    ],
  },

  'union-find': {
    topic: 'union-find',
    intuition: `Union-Find (Disjoint Set Union) tracks which items belong to the same group, supporting two operations: **find(x)** returns the representative (root) of x's group, and **union(a, b)** merges two groups.

With **path compression** (point nodes directly at the root while finding) and **union by size/rank**, both operations are almost O(1). It shines when edges arrive one by one and you need to ask "are these connected?" or "did this edge create a cycle?"`,
    approach: [
      'parent[i] = i initially; size[i] = 1.',
      'find(x): while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x].',
      'union(a, b): ra, rb = find(a), find(b); if same → already connected (cycle!); attach smaller under larger.',
      'Count components = number of successful unions subtracted from n.',
    ],
    signals: ['"connected components" with edges given as a list', '"redundant edge", "does this create a cycle"', 'grouping by equivalence (accounts merge)', 'minimum spanning tree (Kruskal)'],
    complexity: [{ what: 'find / union', time: 'O(α(n)) ≈ O(1) amortized', space: 'O(n)' }],
    mistakes: ['Forgetting to call find before comparing (comparing parents, not roots).', '1-indexed vs 0-indexed nodes.'],
    cards: [
      { front: 'Two optimisations that make Union-Find nearly O(1)?', back: 'Path compression and union by size/rank.' },
      { front: 'Redundant Connection: pattern?', back: 'Union-Find; the first edge whose endpoints already share a root creates the cycle.' },
    ],
  },

  greedy: {
    topic: 'greedy',
    intuition: `A greedy algorithm makes the locally best choice at each step and never reconsiders. It is fast and short, but only correct when you can argue that the local choice **never hurts** the final answer (an "exchange argument": any optimal solution can be changed to include the greedy choice without getting worse).

In interviews, say the greedy rule out loud and give a one-sentence reason it is safe. If you cannot, test it against a small counterexample, if it breaks, you probably need DP.`,
    approach: [
      'Guess a rule: earliest end, largest first, farthest reach.',
      'Try to break it with a tiny example. Coin change with [1, 3, 4] and 6 breaks "largest coin first".',
      'Jump Game: track the farthest reachable index.',
      'Gas Station: if the running tank goes negative, the start must be after this point.',
    ],
    signals: ['"minimum number of ..." with a natural ordering', 'intervals and scheduling', '"can you reach"'],
    complexity: [{ what: 'Typical greedy (sort + scan)', time: 'O(n log n)', space: 'O(1)–O(n)' }],
    mistakes: ['Applying greedy where DP is required.', 'Not proving / testing the rule.'],
    cards: [
      { front: 'Jump Game: greedy state?', back: 'The farthest index reachable so far; fail if i > farthest.' },
      { front: 'Why does "largest coin first" fail for coins [1,3,4], amount 6?', back: 'Greedy gives 4+1+1 (3 coins); optimal is 3+3 (2 coins). Use DP.' },
    ],
  },

  'dp-1d': {
    topic: 'dp-1d',
    intuition: `Dynamic programming is **recursion + remembering answers**. If a recursive solution solves the same subproblem many times (draw the tree!), store each result the first time and reuse it.

The four questions:
1. **State**: what does dp[i] mean, in one sentence? ("max money robbing houses 0..i")
2. **Transition**: how is dp[i] built from smaller states? (dp[i] = max(dp[i-1], dp[i-2] + nums[i]))
3. **Base cases**: the smallest states you know directly.
4. **Order**: compute states so dependencies are ready (usually left to right).

Start top-down (recursion + memo). It is easier to get right. Then convert to a bottom-up table, then to O(1) space if only the last few states are used.`,
    approach: [
      'Write the brute-force recursion with choices at each index.',
      'Identify the parameters that change → that is your state.',
      'Add memoization. Then convert to a loop if needed.',
      'Check: does dp[i] only need dp[i-1] and dp[i-2]? Keep two variables.',
    ],
    signals: ['"number of ways", "minimum/maximum cost", "can you reach/form"', 'choices at each step that affect future options', 'greedy has a counterexample'],
    complexity: [
      { what: '1D DP with O(1) transition', time: 'O(n)', space: 'O(n) → O(1)' },
      { what: 'Coin change', time: 'O(amount · coins)', space: 'O(amount)' },
    ],
    mistakes: [
      'Undefined state ("dp[i] is something about i").',
      'Wrong initial values: 0 vs infinity vs -infinity.',
      'Off-by-one between dp index and input index.',
    ],
    visual: 'dp-table',
    cards: [
      { front: 'Four questions to define a DP?', back: 'State, transition, base case, computation order.' },
      { front: 'House Robber transition?', back: 'dp[i] = max(dp[i-1], dp[i-2] + nums[i]).' },
      { front: 'Base case for Climbing Stairs?', back: 'ways(0) = 1, ways(1) = 1; ways(n) = ways(n-1) + ways(n-2).' },
      { front: 'Coin Change: state and transition?', back: 'dp[a] = fewest coins for amount a; dp[a] = 1 + min(dp[a - c]) over coins c ≤ a; dp[0] = 0.' },
    ],
  },

  'dp-2d': {
    topic: 'dp-2d',
    intuition: `When the state needs **two indices**, the table becomes 2D. Two families dominate:

**Grids**: dp[r][c] = answer for reaching cell (r, c), built from the cell above and the cell to the left.

**Two strings**: dp[i][j] = answer for the prefixes a[:i] and b[:j]. Compare the last characters: if equal, extend dp[i-1][j-1]; otherwise take the best of dropping one character from either string (LCS) or the cheapest of insert/delete/replace (edit distance).

Draw the table for a tiny example and fill it by hand once. The transition becomes obvious.`,
    approach: [
      'Use (m+1) × (n+1) tables with an empty-prefix row/column to avoid edge cases.',
      'Fill row by row; each cell reads up, left, and up-left.',
      'Only the previous row is needed → compress to O(n) space.',
    ],
    signals: ['grid paths with right/down moves', 'two strings: "common subsequence", "edit distance", "interleave"', 'palindromic subsequence (interval DP)'],
    complexity: [{ what: 'm × n table', time: 'O(m · n)', space: 'O(m · n) → O(n)' }],
    mistakes: ['Index shift between dp[i][j] and a[i-1], b[j-1].', 'Initialising the first row/column wrong (edit distance needs i and j).'],
    visual: 'dp-table',
    cards: [
      { front: 'LCS transition?', back: 'If a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1] + 1, else max(dp[i-1][j], dp[i][j-1]).' },
      { front: 'Edit distance base cases?', back: 'dp[i][0] = i, dp[0][j] = j.' },
      { front: 'Unique Paths transition?', back: 'dp[r][c] = dp[r-1][c] + dp[r][c-1].' },
    ],
  },

  'dp-knapsack': {
    topic: 'dp-knapsack',
    intuition: `**Knapsack**: for each item you **take it or skip it**, subject to a capacity. The state is (items considered, capacity used). With a 1D array over capacity:

- **0/1 knapsack** (each item once): loop capacity **backwards** so an item is not reused in the same round.
- **Unbounded** (reuse allowed): loop capacity **forwards**.

Many problems hide a knapsack: "split into two equal-sum subsets" is "can I reach total/2?". "Assign + and -" is "count subsets with a certain sum".

**LIS**: dp[i] = length of the longest increasing subsequence ending at i = 1 + max(dp[j]) for j < i with a[j] < a[i]. The O(n log n) version keeps the smallest possible tail for each length and binary searches into it.`,
    approach: [
      'Rephrase the problem as "choose a subset with property X".',
      'Boolean reachable sums or counts of ways.',
      'Decide 0/1 vs unbounded → direction of the inner loop.',
      'For counting combinations (not permutations), loop items outer, capacity inner.',
    ],
    signals: ['"subset", "partition", "target sum", "choose items with limit"', '"longest increasing subsequence", "envelopes", "chain"'],
    complexity: [
      { what: 'Knapsack (n items, capacity W)', time: 'O(n · W)', space: 'O(W)' },
      { what: 'LIS', time: 'O(n^2) or O(n log n)', space: 'O(n)' },
    ],
    mistakes: ['Iterating capacity forwards in 0/1 knapsack (reuses items).', 'Mixing up combinations vs permutations loop order.'],
    cards: [
      { front: '0/1 knapsack with a 1D array: loop direction over capacity?', back: 'Backwards (high to low), so each item is used at most once.' },
      { front: 'Partition Equal Subset Sum reduces to?', back: 'Subset sum: can we reach total / 2? (0/1 knapsack on booleans)' },
      { front: 'LIS O(n^2) transition?', back: 'dp[i] = 1 + max(dp[j]) for j < i with a[j] < a[i].' },
    ],
  },

  backtracking: {
    topic: 'backtracking',
    intuition: `Backtracking explores a **decision tree**: at each level you make a choice, recurse to explore everything that follows from it, then **undo** the choice and try the next one.

\`\`\`
def backtrack(state):
    if state is complete: record it; return
    for choice in choices(state):
        make(choice)
        backtrack(state)
        undo(choice)
\`\`\`

The output size is usually exponential (2^n subsets, n! permutations), so the goal is not polynomial time. It is **clean code and pruning** (stop exploring branches that cannot succeed).`,
    approach: [
      'Draw the decision tree for a tiny input.',
      'Subsets/combinations: pass a start index so you only choose later elements.',
      'Permutations: track used elements.',
      'Duplicates in input: sort, and skip a value equal to the previous one at the same depth.',
      'Copy the current path when recording it.',
    ],
    signals: ['"all", "every", "generate", "list all possible"', 'n ≤ 15–20', 'constraint satisfaction: N-Queens, Sudoku, word search'],
    complexity: [
      { what: 'Subsets', time: 'O(2^n · n)', space: 'O(n)' },
      { what: 'Permutations', time: 'O(n! · n)', space: 'O(n)' },
    ],
    mistakes: ['Appending the path itself instead of a copy.', 'Forgetting to undo (pop / unmark).', 'Not pruning early (sorted candidates → break when too big).'],
    visual: 'recursion-tree',
    cards: [
      { front: 'Three steps of backtracking?', back: 'Choose, explore (recurse), un-choose.' },
      { front: 'Subsets II: how to skip duplicate subsets?', back: 'Sort; at the same depth skip nums[i] if i > start and nums[i] == nums[i-1].' },
      { front: 'Base case for generating permutations?', back: 'len(path) == n → record a copy.' },
      { front: 'Why copy the path when recording a result?', back: 'The same list keeps being mutated by later choices.' },
    ],
  },

  tries: {
    topic: 'tries',
    intuition: `A trie (prefix tree) stores words character by character: each node has children (one per next letter) and a flag marking "a word ends here". Looking up a word or a prefix of length L costs O(L), regardless of how many words are stored.

Use it when you need **prefix queries**, or to search many words in a grid at once (Word Search II), or for wildcard matching where '.' branches into all children.`,
    approach: [
      'Node: children (map or array of 26) + is_end.',
      'Insert: walk/create nodes for each char, set is_end at the last one.',
      'Search: walk; fail if a child is missing; check is_end for exact word.',
      'startsWith: same walk, ignore is_end.',
    ],
    signals: ['"prefix", "starts with", "autocomplete"', 'many words searched at once', 'wildcard matching on words'],
    complexity: [{ what: 'insert / search (length L)', time: 'O(L)', space: 'O(total characters)' }],
    mistakes: ['Forgetting the end-of-word flag (search("app") after inserting "apple").', 'Sharing a children array between nodes.'],
    cards: [
      { front: 'Trie search vs startsWith difference?', back: 'search requires the final node to be marked end-of-word; startsWith only needs the path to exist.' },
      { front: 'Trie insert time for a word of length L?', back: 'O(L).' },
    ],
  },

  bits: {
    topic: 'bits',
    intuition: `Integers are stored in binary, and bitwise operators work on all bits at once.

- \`a ^ a = 0\`, \`a ^ 0 = a\`: XOR cancels pairs (find the single number).
- \`n & (n - 1)\` clears the lowest set bit (count bits, power of two check).
- \`n & 1\` is the last bit; \`n >> 1\` drops it.
- \`1 << k\` is a mask with only bit k set; \`n & (1 << k)\` tests bit k.

A set of up to ~20 items can be a **bitmask** integer, useful for subset enumeration.`,
    approach: [
      'Pairs cancel → XOR everything.',
      'Counting → n & (n-1) loop, or dp[i] = dp[i >> 1] + (i & 1).',
      'Missing number → XOR of indices and values, or sum formula.',
      'Know your language\'s integer width and sign behaviour.',
    ],
    signals: ['"appears twice except one"', '"without using + or -"', '"count set bits", "power of two"', 'subsets of ≤ 20 items as masks'],
    complexity: [{ what: 'Bit operations', time: 'O(1) each; O(bits) loops', space: 'O(1)' }],
    mistakes: ['Operator precedence: a & b == c parses as a & (b == c) in Java/Python? (Java: == binds tighter; Python: comparison chains). Always parenthesise.', 'Negative numbers and right shift (>> vs >>> in Java).'],
    cards: [
      { front: 'Which operation clears the lowest set bit?', back: 'n & (n - 1).' },
      { front: 'Single Number in O(1) space?', back: 'XOR all numbers; pairs cancel to 0.' },
      { front: 'Counting bits DP?', back: 'bits[i] = bits[i >> 1] + (i & 1).' },
    ],
  },
};
