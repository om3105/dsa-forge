/* Stage 1 (Understand) content: real-world analogy, formal definition and a 3-question concept check.
   MCQ format: [question, options, index of the correct option, explanation shown after answering]. */
import type { CourseId } from '../../types';

export type Mcq = [string, string[], number, string];
export interface UnderstandContent { analogy: string; definition: string; mcq: Mcq[] }

export const UNDERSTAND: Record<string, UnderstandContent> = {
  complexity: {
    analogy: 'Asking "how long will it take?" for a road trip: the exact minutes depend on traffic (constants), but doubling the distance roughly doubles the time. Big-O is the "doubling the distance" part.',
    definition: 'f(n) = O(g(n)) means there are constants c and n₀ such that f(n) ≤ c·g(n) for all n ≥ n₀. We keep the fastest-growing term and drop constants. Time counts basic steps; space counts extra memory, including the call stack.',
    mcq: [
      ['Two separate loops over the same array of size n run one after the other. Complexity?', ['O(n²)', 'O(2n) which is O(n)', 'O(log n)', 'O(n log n)'], 1, 'Sequential loops add: n + n = 2n, and constants are dropped → O(n). Nested loops would multiply.'],
      ['n ≤ 10^5 in a problem. Which complexity should you aim for?', ['O(2^n)', 'O(n³)', 'O(n²)', 'O(n log n) or better'], 3, '10^5 squared is 10^10 operations, far beyond the ~10^8 per second budget. O(n log n) is about 1.7·10^6.'],
      ['A recursive function calls itself on n - 1 until n = 0, doing O(1) work per call. Space complexity?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'Each pending call keeps a stack frame, and n of them are alive at the deepest point → O(n) stack space.'],
    ],
  },
  arrays: {
    analogy: 'A row of numbered lockers: you can walk straight to locker 37 (index access), but squeezing a new locker into the middle means shifting every locker after it.',
    definition: 'An array is a contiguous block of memory holding elements of one type; element i lives at base + i × size, so access by index is O(1). A dynamic array (Python list, Java ArrayList) doubles its capacity when full, making append amortized O(1).',
    mcq: [
      ['Why is reading arr[i] O(1)?', ['The array is sorted', 'The address is computed directly from i', 'It uses a hash table', 'It caches recent reads'], 1, 'Elements are contiguous, so the address is base + i × elementSize. One arithmetic step, no search.'],
      ['Cost of inserting at the front of an array of n elements?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'Every existing element must shift one position to the right.'],
      ["Kadane's algorithm: at each element the best subarray ending here…", ['always includes the first element', 'either extends the previous best-ending-here or starts fresh', 'is the whole array so far', 'must have positive length 2'], 1, 'cur = max(x, cur + x): extend if the previous run helps, otherwise restart at x.'],
    ],
  },
  'prefix-sum': {
    analogy: "A car's odometer: to know the distance between two towns you do not re-drive the road, you subtract the two odometer readings.",
    definition: 'prefix[0] = 0 and prefix[i+1] = prefix[i] + a[i]. Then sum(a[l..r]) = prefix[r+1] − prefix[l]. Building takes O(n); every range query is O(1). Combined with a hash map of earlier prefix values it counts subarrays with a given sum.',
    mcq: [
      ['With prefix[0] = 0, the sum of a[2..5] equals…', ['prefix[5] − prefix[2]', 'prefix[6] − prefix[2]', 'prefix[6] − prefix[1]', 'prefix[5] + prefix[2]'], 1, 'prefix[6] covers a[0..5] and prefix[2] covers a[0..1]; subtracting leaves a[2..5].'],
      ['Counting subarrays that sum to k (negatives allowed). What do you look up at each step?', ['k in the map', 'running sum − k', 'running sum + k', 'the current element'], 1, 'A subarray ending here sums to k exactly when an earlier prefix equals runningSum − k.'],
      ['Why seed the map with {0: 1}?', ['To avoid division by zero', 'So subarrays starting at index 0 are counted', 'Because sums are never 0', 'It is not necessary'], 1, 'If the whole prefix sums to k, you need "an earlier prefix of 0". The empty prefix.'],
    ],
  },
  strings: {
    analogy: 'A printed sentence: you can read any letter instantly, but to "change" one word you reprint the whole sentence, strings are immutable.',
    definition: 'A string is an immutable sequence of characters. Indexing is O(1); slicing/substring copies O(k); concatenation builds a new string. Builders (list + join, StringBuilder) collect pieces in amortized O(1) each and produce the result once.',
    mcq: [
      ['Building a length-n string with s += c in a loop can cost…', ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'], 2, 'Each += may copy the whole string so far: 1 + 2 + … + n = O(n²). Use join / StringBuilder.'],
      ['Fastest way to check two lowercase strings are anagrams?', ['Compare them directly', 'Compare 26-letter count arrays', 'Check every permutation', 'Compare lengths only'], 1, 'Counting is O(n); anagrams have identical counts. Sorting (O(n log n)) also works but is slower.'],
      ['In Java, "abc" == new String("abc") is…', ['true', 'false', 'a compile error', 'random'], 1, '== compares references; the new String is a different object. Use equals(). (In Python == compares values.)'],
    ],
  },
  hashing: {
    analogy: 'A coat check: you hand over your coat and get ticket 42; later you show 42 and they go straight to hook 42 instead of searching every hook.',
    definition: 'A hash table maps keys to values by computing hash(key) mod capacity to pick a bucket. Insert, lookup and delete are O(1) on average and O(n) in the worst case (many collisions). Keys must be hashable and must not change while stored.',
    mcq: [
      ['Average time for a hash map lookup?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 0, 'The hash points to a bucket directly; with a good hash and resizing, buckets stay tiny on average.'],
      ['Two Sum in O(n): for each x you check…', ['whether x is in the map', 'whether target − x is in the map', 'whether target + x is in the map', 'every other element'], 1, 'You need the complement target − x that you have already seen.'],
      ['Which is a valid Python dict key for a grid cell?', ['[r, c]', '(r, c)', '{r, c}', 'a list of lists'], 1, 'Tuples are immutable and hashable; lists and sets are not. (In Java, use a String, a record/List, or r * cols + c.)'],
    ],
  },
  'two-pointers': {
    analogy: 'Two people searching a sorted bookshelf from opposite ends: if the combined page count is too small, the left person steps right; too large, the right person steps left.',
    definition: 'Two indices traverse the data so that each step discards a set of candidates that provably cannot be the answer. Opposite-end pointers work on sorted input; same-direction (read/write) pointers filter in place. Typically O(n) time, O(1) space.',
    mcq: [
      ['Sorted array, pair sum is greater than target. Which pointer moves?', ['left pointer right', 'right pointer left', 'both', 'neither, restart'], 1, 'Only decreasing the larger element can reduce the sum; the right element cannot pair with anything to the right of left.'],
      ['Container With Most Water: which line do you move?', ['the taller one', 'the shorter one', 'the one with the smaller index', 'alternate'], 1, 'Area is limited by the shorter line; moving the taller one can only shrink width without raising the limit.'],
      ['Typical complexity of 3Sum with sorting and two pointers?', ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'], 2, 'Fix one element (n choices) and run an O(n) two-pointer scan for each.'],
    ],
  },
  'sliding-window': {
    analogy: 'A train window: as the train moves, one new tree enters on the right and one old tree leaves on the left. You never re-look at the whole forest.',
    definition: 'A window [left, right] over a contiguous range is updated incrementally: add the element entering, remove the element leaving. Fixed windows move both ends together; variable windows expand right and shrink left while invalid. Each element enters and leaves once → O(n).',
    mcq: [
      ['Variable window, the window becomes invalid. What do you do?', ['Restart from right + 1', 'Shrink from the left until valid', 'Expand right further', 'Sort the window'], 1, 'Move left forward, removing elements, until the condition holds again.'],
      ['Why does a sum-based window fail with negative numbers?', ['Sums overflow', 'Validity is no longer monotonic when extending', 'Windows cannot hold negatives', 'It does not fail'], 1, 'Adding a negative number can make the sum smaller, so "shrink while too big" no longer finds every answer. Use prefix sums.'],
      ['Overall time of a sliding window scan?', ['O(n²)', 'O(n log n)', 'O(n)', 'O(k·n)'], 2, 'left and right each move at most n times.'],
    ],
  },
  recursion: {
    analogy: 'Russian nesting dolls: to count the dolls you open one, then ask "how many are inside this smaller doll?", until you reach the solid one (the base case).',
    definition: 'A recursive function solves an input by calling itself on strictly smaller inputs and combining the results. It needs a base case that is answered directly. Time ≈ number of calls × work per call; space = maximum depth of the call stack.',
    mcq: [
      ['What happens without a reachable base case?', ['It returns 0', 'Infinite recursion → stack overflow / RecursionError', 'The compiler adds one', 'It runs in O(1)'], 1, 'Every call makes another call; the stack grows until the runtime stops it.'],
      ['Naive recursive fib(n) runs in roughly…', ['O(n)', 'O(n²)', 'O(2^n)', 'O(log n)'], 2, 'Each call branches twice and the same subproblems repeat. The call tree is exponential. Memoization makes it O(n).'],
      ['Fast power x^n via x^(n/2) makes how many recursive levels?', ['n', 'n/2', 'about log₂ n', '2^n'], 2, 'n halves each level.'],
    ],
  },
  sorting: {
    analogy: 'Sorting a deck of cards by splitting it among friends, each sorting a small pile, then merging piles by repeatedly taking the smaller top card. That is merge sort.',
    definition: 'Sorting arranges elements by a comparison order. Comparison sorts need Ω(n log n) in the worst case. Merge sort: split, sort halves, merge (O(n log n), O(n) space, stable). Quicksort: partition around a pivot, recurse (O(n log n) average, O(n²) worst, in place).',
    mcq: [
      ['Merge sort time complexity?', ['O(n)', 'O(n log n) always', 'O(n²) worst case', 'O(log n)'], 1, 'log n levels of splitting, O(n) merge work per level, in every case.'],
      ['What does "stable" sort mean?', ['It never crashes', 'Equal elements keep their original relative order', 'It uses O(1) memory', 'It is always O(n)'], 1, 'Stability matters when sorting by one key after another.'],
      ['Quicksort worst case happens when…', ['the array is random', 'pivots split very unevenly every time', 'all elements are distinct', 'n is odd'], 1, 'With a bad pivot each partition removes one element → n levels → O(n²). Random pivots avoid it in practice.'],
    ],
  },
  'binary-search': {
    analogy: 'Finding a word in a paper dictionary: open the middle, decide whether the word is before or after, and throw away the other half.',
    definition: 'Binary search finds a boundary in a monotonic sequence (false…false true…true) by repeatedly checking the middle and discarding the half that cannot contain the answer: O(log n) time, O(1) space. It also works on an answer range when feasibility is monotonic.',
    mcq: [
      ['What property must the search space have?', ['Distinct values', 'Monotonic: the condition flips at most once', 'Even length', 'Only positive values'], 1, 'Each check must tell you which half is impossible; that needs a single true/false boundary.'],
      ['Lower bound returns…', ['the last index with a[i] ≤ x', 'the first index with a[i] ≥ x', 'the index of x or -1', 'the middle index'], 1, 'It is the insertion point that keeps the array sorted.'],
      ['"Minimum capacity to ship within D days" suggests…', ['DFS', 'binary search on the capacity', 'a stack', 'sorting only'], 1, 'If capacity C works, every larger capacity works, a monotonic answer space.'],
    ],
  },
  'linked-list': {
    analogy: 'A treasure hunt: each clue tells you where the next clue is. You cannot jump to clue 10 directly, but inserting a new clue only means rewriting one note.',
    definition: 'A linked list is a chain of nodes, each storing a value and a reference to the next node (and the previous one in a doubly linked list). Access by position is O(n); inserting or deleting next to a node you hold is O(1).',
    mcq: [
      ['Cost to reach the k-th node of a singly linked list?', ['O(1)', 'O(log k)', 'O(k)', 'O(k²)'], 2, 'You must follow k next pointers from the head.'],
      ['Why use a dummy head node?', ['It speeds up traversal', 'It removes special cases when the real head changes', 'It stores the length', 'It prevents cycles'], 1, 'Insertions/deletions at the front look like any other position.'],
      ['Fast pointer moves 2, slow moves 1. When fast reaches the end, slow is at…', ['the head', 'the middle', 'the last node', 'a random node'], 1, 'Slow has travelled half as far.'],
    ],
  },
  stack: {
    analogy: 'A stack of plates: you add to the top and take from the top. The last plate placed is the first one used.',
    definition: 'A stack is a last-in, first-out (LIFO) collection with push (add to top), pop (remove top) and peek, all O(1). It models "the most recent unfinished thing": matching brackets, nested structures, undo, and the recursion call stack.',
    mcq: [
      ['Order of removal for push 1, push 2, push 3, then pop ×3?', ['1, 2, 3', '3, 2, 1', '2, 3, 1', '1, 3, 2'], 1, 'Last in, first out.'],
      ['Checking "([)]" with a stack: what fails?', ['The first (', 'At ) the top is [, not (', 'The final ]', 'Nothing, it is valid'], 1, 'A closer must match the most recent unmatched opener.'],
      ['Min Stack keeps getMin O(1) by…', ['sorting on every push', 'storing the minimum-so-far with each element', 'scanning the stack', 'using a queue'], 1, 'Each entry remembers the min at the time it was pushed, so popping restores the previous min.'],
    ],
  },
  'monotonic-stack': {
    analogy: 'People in a queue looking forward to see who is taller: whenever a tall person arrives, everyone shorter in front of them "finds" their answer and leaves the waiting list.',
    definition: 'A monotonic stack keeps elements (usually indices) in increasing or decreasing order. When a new element would break the order, the popped elements have found their next greater/smaller element. Each index is pushed and popped once → O(n).',
    mcq: [
      ['For "next greater element", the stack holds values that are…', ['increasing from bottom to top', 'decreasing from bottom to top', 'unsorted', 'all equal'], 1, 'Elements still waiting for something greater; a greater arrival pops the smaller ones.'],
      ['Why store indices instead of values?', ['Indices are smaller', 'You often need distances or positions', 'Values cannot be compared', 'It is required by the language'], 1, 'Daily Temperatures needs i − j; histograms need widths.'],
      ['Total time, despite the inner while loop?', ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], 2, 'Each index is popped at most once over the whole scan.'],
    ],
  },
  queue: {
    analogy: 'A ticket counter line: people are served in the order they arrived (first in, first out). A deque is a line where you can also join or leave at the back.',
    definition: 'A queue is FIFO with enqueue at the back and dequeue at the front, both O(1). A deque supports O(1) operations at both ends. A monotonic deque keeps indices with decreasing values to answer sliding-window maximum in O(n).',
    mcq: [
      ['Why not use a Python list with pop(0) as a queue?', ['It is not allowed', 'pop(0) shifts every element: O(n)', 'Lists cannot hold numbers', 'It reverses the order'], 1, 'Use collections.deque (Java: ArrayDeque) for O(1) at both ends.'],
      ['Sliding window max deque: what sits at the front?', ['the newest index', 'the index of the window maximum', 'the smallest value', 'the window start'], 1, 'Values decrease from front to back, so the front is the max.'],
      ['When is the front popped?', ['When a larger value arrives', 'When its index leaves the window', 'Every step', 'Never'], 1, 'Larger arrivals pop from the back; expiry pops from the front.'],
    ],
  },
  intervals: {
    analogy: 'Planning meeting rooms: once meetings are sorted by start time, you only need to compare each meeting with the one you are currently extending.',
    definition: 'Interval problems work on [start, end] pairs. Sorting by start makes overlaps adjacent (merge in one pass); sorting by end supports the greedy "keep the earliest finisher". Counting simultaneous intervals uses a sweep of +1/−1 events or a heap of end times. Usually O(n log n).',
    mcq: [
      ['To merge overlapping intervals, first sort by…', ['end', 'start', 'length', 'nothing'], 1, 'Sorted by start, any overlap is with the last merged interval.'],
      ['[1, 3] and [2, 6] merge into…', ['[1, 3]', '[2, 3]', '[1, 6]', 'they do not overlap'], 2, '2 ≤ 3 so they overlap; the end becomes max(3, 6).'],
      ['Max number of non-overlapping intervals: greedy rule?', ['Pick the longest', 'Pick the one that ends earliest', 'Pick the one that starts earliest', 'Pick randomly'], 1, 'Finishing earliest leaves the most room for the rest.'],
    ],
  },
  trees: {
    analogy: 'A family tree or a company org chart: everyone has one parent (except the root), and questions about a team can be answered by asking each sub-team lead.',
    definition: 'A binary tree is a set of nodes where each node has a value and at most two children (left, right). Depth-first traversals: pre-order (node, left, right), in-order (left, node, right), post-order (left, right, node). Breadth-first visits level by level with a queue. Traversals are O(n).',
    mcq: [
      ['Post-order visits…', ['node, left, right', 'left, node, right', 'left, right, node', 'level by level'], 2, 'Children first, then the node, useful when the node needs its children\'s results.'],
      ['Which structure drives level-order traversal?', ['stack', 'queue', 'heap', 'hash map'], 1, 'BFS processes nodes in arrival order, level by level.'],
      ['Space of recursive DFS on a tree of height h?', ['O(1)', 'O(h)', 'O(n²)', 'O(2^h)'], 1, 'At most h frames are on the stack at once (O(n) for a skewed tree).'],
    ],
  },
  bst: {
    analogy: 'A "higher or lower" guessing game laid out as a tree: at each node you know the answer is either to the left (smaller) or to the right (larger).',
    definition: 'A binary search tree stores keys so every key in a node\'s left subtree is smaller and every key in the right subtree is larger. Search, insert and delete cost O(h): O(log n) if balanced, O(n) if skewed. An in-order traversal lists keys in sorted order.',
    mcq: [
      ['In-order traversal of a BST produces…', ['reverse order', 'sorted order', 'level order', 'random order'], 1, 'left (smaller), node, right (larger) at every level.'],
      ['Validating a BST by checking only each node against its children…', ['is enough', 'can miss violations deeper in a subtree', 'is O(n²)', 'requires a heap'], 1, 'A node deep in the left subtree must also be smaller than the root, pass (low, high) bounds down.'],
      ['Worst-case search in an unbalanced BST?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 2, 'Inserting sorted keys makes a linked-list-shaped tree.'],
    ],
  },
  heaps: {
    analogy: 'A hospital emergency room: patients are not served in arrival order but by urgency. The most urgent is always at the front, even as new patients arrive.',
    definition: 'A binary heap is a complete binary tree stored in an array (children of i at 2i+1 and 2i+2) where every parent is ≤ its children (min-heap). Peek is O(1); push and pop are O(log n) by sifting up or down; heapify builds one in O(n).',
    mcq: [
      ['In a min-heap array, the children of index i are at…', ['i+1 and i+2', '2i+1 and 2i+2', 'i/2', '2i and 2i−1'], 1, 'Level-by-level layout of a complete tree (0-indexed).'],
      ['To keep the k largest of a stream, use…', ['a max-heap of all items', 'a min-heap of size k', 'a sorted array', 'a stack'], 1, 'The root is the smallest of the k largest; anything bigger replaces it. O(n log k).'],
      ['Cost of push or pop?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 1, 'One sift along a root-to-leaf path of a complete tree.'],
    ],
  },
  graphs: {
    analogy: 'A city map: intersections are nodes, roads are edges. BFS is ripples from a dropped stone (nearest first); DFS is exploring one street as far as it goes before backtracking.',
    definition: 'A graph G = (V, E) has vertices and edges (directed or undirected, weighted or not), usually stored as an adjacency list. BFS uses a queue and finds shortest paths in unweighted graphs; DFS uses recursion/stack for reachability and components. Both are O(V + E) with a visited set.',
    mcq: [
      ['Shortest path by number of edges in an unweighted graph?', ['DFS', 'BFS', 'Dijkstra required', 'Sorting'], 1, 'BFS reaches nodes in increasing distance order.'],
      ['In BFS, when should you mark a node visited?', ['when popping it', 'when pushing it', 'never', 'after the whole BFS'], 1, 'Otherwise the same node can be queued many times.'],
      ['Counting islands in a grid is counting…', ['edges', 'connected components', 'cycles', 'leaves'], 1, 'Each DFS/BFS started from unvisited land floods exactly one island.'],
    ],
  },
  'topo-sort': {
    analogy: 'Getting dressed: socks before shoes, shirt before jacket. A valid order respects every "must come before" rule, impossible if two rules contradict each other in a loop.',
    definition: 'A topological order of a directed acyclic graph lists vertices so every edge u → v has u before v. Kahn\'s algorithm repeatedly removes vertices with in-degree 0; if some vertices are never removed, the graph has a cycle. O(V + E).',
    mcq: [
      ['A topological order exists if and only if the graph…', ['is connected', 'has no directed cycle', 'is a tree', 'has no edges'], 1, 'A cycle means every vertex in it waits for another.'],
      ["Kahn's algorithm starts with vertices that have…", ['the most edges', 'in-degree 0', 'out-degree 0', 'the smallest label'], 1, 'They depend on nothing.'],
      ['Kahn finished but output fewer than V vertices. This means…', ['a bug', 'there is a cycle', 'the graph is disconnected', 'the order is still valid'], 1, 'The remaining vertices never reached in-degree 0.'],
    ],
  },
  'shortest-path': {
    analogy: 'GPS navigation: always extend the closest place you have not finalised yet; once the closest is finalised, no other route can beat it (if road lengths are never negative).',
    definition: "Dijkstra's algorithm computes shortest distances from a source in a graph with non-negative edge weights using a min-heap keyed by tentative distance. Popping a vertex finalises it; stale heap entries are skipped. O((V + E) log V).",
    mcq: [
      ['Dijkstra requires edge weights to be…', ['integers', 'non-negative', 'distinct', 'less than V'], 1, 'A negative edge could make a finalised distance improvable later.'],
      ['The main data structure is…', ['a stack', 'a FIFO queue', 'a min-heap / priority queue', 'a trie'], 2, 'You always need the closest unfinished vertex.'],
      ['Popped (d, u) with d > dist[u]. You should…', ['update dist[u] to d', 'skip it. It is stale', 'stop the algorithm', 'push it again'], 1, 'A shorter path to u was already processed.'],
    ],
  },
  'union-find': {
    analogy: 'Friend circles at a school: each circle picks one representative. To check if two students are in the same circle, compare their representatives; merging circles makes one representative report to the other.',
    definition: 'A disjoint-set union keeps a parent array where each set is a tree whose root is its representative. find(x) follows parents to the root (with path compression); union(a, b) links the roots (by size or rank). Both are nearly O(1) amortized, O(α(n)).',
    mcq: [
      ['find(x) returns…', ['x itself', 'the root representative of x\'s set', 'the size of the set', 'x\'s parent only'], 1, 'Two elements are connected iff their roots are equal.'],
      ['union(a, b) when find(a) == find(b) tells you…', ['nothing', 'adding edge (a, b) would create a cycle', 'the graph is disconnected', 'a is the root'], 1, 'They were already connected. The classic redundant-edge check.'],
      ['Which optimisation flattens the trees during find?', ['union by size', 'path compression', 'sorting', 'memoization'], 1, 'Each visited node is pointed (closer) to the root.'],
    ],
  },
  greedy: {
    analogy: 'Paying with the fewest coins in a normal currency: always hand over the largest coin that fits. It works for some coin systems and fails for others, greedy needs a reason to be trusted.',
    definition: 'A greedy algorithm builds a solution by making the locally best choice at each step and never revisiting it. It is correct only when an exchange argument shows some optimal solution contains the greedy choice. Usually sort + one pass: O(n log n).',
    mcq: [
      ['Coins [1, 3, 4], amount 6. Largest-coin-first gives…', ['2 coins (3+3)', '3 coins (4+1+1)', '1 coin', 'no answer'], 1, 'Greedy picks 4 then 1 then 1; the optimum is 3+3. So greedy is wrong here and DP is needed.'],
      ['Jump Game: what single value do you track?', ['number of jumps', 'farthest reachable index', 'minimum element', 'last zero'], 1, 'If i exceeds the farthest reach, you are stuck.'],
      ['How do you gain confidence a greedy rule is correct?', ['It passes the sample', 'An exchange argument / trying to break it with small cases', 'It is short', 'It uses sorting'], 1, 'Prove the choice is safe, or find a counterexample.'],
    ],
  },
  'dp-1d': {
    analogy: 'Climbing stairs while writing on each step how many ways reach it: the number for step n is just the sum of the numbers written on the two steps below.',
    definition: 'Dynamic programming solves problems with overlapping subproblems and optimal substructure by storing each subproblem answer once. Define a state (dp[i] means …), a transition from smaller states, base cases, and an order. Top-down = recursion + memo; bottom-up = table.',
    mcq: [
      ['DP helps when a recursive solution has…', ['no base case', 'overlapping subproblems', 'only one call', 'random input'], 1, 'The same subproblem is solved many times; storing it once removes the waste.'],
      ['House Robber transition?', ['dp[i] = dp[i-1] + nums[i]', 'dp[i] = max(dp[i-1], dp[i-2] + nums[i])', 'dp[i] = nums[i]', 'dp[i] = min(dp[i-1], nums[i])'], 1, 'Either skip house i or rob it and add the best up to i − 2.'],
      ['Coin Change: unreachable amounts are initialised to…', ['0', '-1', 'infinity (or amount + 1)', 'the coin value'], 2, 'So that min(...) ignores them and you can detect "impossible" at the end.'],
    ],
  },
  'dp-2d': {
    analogy: 'Comparing two drafts of an essay line by line in a table: each cell answers "how similar are the first i lines of draft A and the first j lines of draft B?" using its neighbours above and to the left.',
    definition: 'Two-dimensional DP uses a state dp[i][j] over two indices, usually positions in a grid or prefix lengths of two strings. Each cell depends on a few neighbours (up, left, diagonal). Time O(m·n); space O(m·n), often reducible to O(n) by keeping one row.',
    mcq: [
      ['LCS when a[i-1] == b[j-1]?', ['dp[i][j] = 0', 'dp[i][j] = dp[i-1][j-1] + 1', 'dp[i][j] = dp[i-1][j]', 'dp[i][j] = max(i, j)'], 1, 'The matching character extends the LCS of both shorter prefixes.'],
      ['Edit distance base case dp[i][0] = ?', ['0', '1', 'i', 'j'], 2, 'Turning i characters into an empty string takes i deletions.'],
      ['Unique paths (right/down moves): dp[r][c] = ?', ['dp[r-1][c] + dp[r][c-1]', 'dp[r-1][c-1]', 'r + c', 'max(dp[r-1][c], dp[r][c-1])'], 0, 'You arrive from above or from the left.'],
    ],
  },
  'dp-knapsack': {
    analogy: 'Packing a backpack for a trip with a weight limit: for each item you decide "take it or leave it", and you want the most value you can carry.',
    definition: '0/1 knapsack: dp[c] = best value with capacity c; for each item iterate c from high to low so the item is used at most once. Unbounded knapsack iterates c upward. Many problems reduce to subset sum (boolean dp). LIS: dp[i] = 1 + max dp[j] over j < i with a[j] < a[i].',
    mcq: [
      ['0/1 knapsack with a 1-D array: loop capacity…', ['upward', 'downward', 'either way', 'only even values'], 1, 'Going downward reads values from before this item was considered, so it is not reused.'],
      ['Partition Equal Subset Sum reduces to…', ['sorting', 'subset sum to total / 2', 'two pointers', 'BFS'], 1, 'Two equal halves means one subset reaches half the total.'],
      ['Counting coin combinations (not orderings): loop order?', ['amounts outer, coins inner', 'coins outer, amounts inner', 'does not matter', 'recursion only'], 1, 'Coins outer ensures each combination is counted once in a fixed coin order.'],
    ],
  },
  backtracking: {
    analogy: 'Solving a maze by hand: walk forward, and when you hit a dead end, step back to the last junction and try the next path.',
    definition: 'Backtracking explores a decision tree depth-first: make a choice, recurse, undo the choice, try the next. It enumerates all valid solutions (subsets 2^n, permutations n!) and gains speed by pruning branches that cannot succeed.',
    mcq: [
      ['Three steps at every level?', ['sort, search, return', 'choose, explore, un-choose', 'push, pop, peek', 'split, merge, sort'], 1, 'The undo step restores the state for the next choice.'],
      ['Why append a copy of the path to the results?', ['Copies are faster', 'The same list keeps changing as you backtrack', 'Lists cannot be appended', 'To sort it'], 1, 'Without a copy every stored result ends up as the final (often empty) path.'],
      ['Number of subsets of n distinct items?', ['n', 'n²', '2^n', 'n!'], 2, 'Each item is in or out.'],
    ],
  },
  tries: {
    analogy: "A phone's contact search: typing \"Jo\" walks down a path J → o and every contact below that point starts with \"Jo\".",
    definition: 'A trie (prefix tree) stores strings character by character: each node has children keyed by character and a flag (or count) marking where a word ends. Insert and lookup of a length-L word cost O(L), independent of how many words are stored.',
    mcq: [
      ['Searching a word of length L in a trie costs…', ['O(1)', 'O(L)', 'O(number of words)', 'O(L log n)'], 1, 'One step per character.'],
      ['After inserting "apple", search("app") is false because…', ['"app" is too short', 'the node for "p" is not marked as end-of-word', 'tries cannot store prefixes', 'it is true'], 1, 'The path exists, but no word ends there. startsWith("app") would be true.'],
      ['Tries are the natural choice for…', ['sorting numbers', 'prefix queries and autocomplete', 'shortest paths', 'matrix multiplication'], 1, 'All words sharing a prefix share a path.'],
    ],
  },
  bits: {
    analogy: 'A row of light switches: each switch is on (1) or off (0), and bitwise operators flip, test or combine whole rows of switches at once.',
    definition: 'Integers are stored in binary. AND (&), OR (|), XOR (^), NOT (~) and shifts (<<, >>) operate on all bits in O(1). Key identities: x ^ x = 0, x ^ 0 = x, n & (n − 1) clears the lowest set bit, 1 << k is a mask for bit k.',
    mcq: [
      ['5 ^ 5 ^ 7 = ?', ['0', '5', '7', '17'], 2, 'x ^ x = 0, and 0 ^ 7 = 7. XOR cancels pairs.'],
      ['n & (n − 1) does what?', ['doubles n', 'clears the lowest set bit', 'sets all bits', 'reverses bits'], 1, 'Subtracting 1 flips the lowest 1 and the zeros below it; AND keeps the rest.'],
      ['How do you test whether bit k of n is set?', ['n + k', '(n >> k) & 1', 'n % k', 'n ^ k'], 1, 'Shift bit k to position 0 and mask it.'],
    ],
  },
};

/** Foundation topics are language-specific. */
export const LANG_UNDERSTAND: Record<'lang-basics' | 'lang-collections', Record<CourseId, UnderstandContent>> = {
  'lang-basics': {
    python: {
      analogy: 'Learning the kitchen before cooking: where the knives are (syntax), how the stove behaves (integer division, recursion limit), and how to get ingredients in fast (sys.stdin).',
      definition: 'Python is dynamically typed: names bind to objects, ints have arbitrary precision, indentation defines blocks. Functions are first-class; nested functions read outer variables and need `nonlocal` to rebind them.',
      mcq: [
        ['What is -7 // 2 in Python?', ['-3', '-4', '-3.5', 'an error'], 1, '// floors toward negative infinity. Use int(-7 / 2) to truncate toward zero (-3).'],
        ['A nested helper must update an outer variable best. You write…', ['global best', 'nonlocal best', 'nothing, assignment works', 'self.best'], 1, 'Without nonlocal, best = … creates a new local variable.'],
        ['Fast way to read 10^5 numbers from stdin?', ['input() in a loop', 'sys.stdin.buffer.read().split()', 'open("stdin")', 'print()'], 1, 'Reading everything at once avoids the per-call overhead of input().'],
      ],
    },
    java: {
      analogy: 'Learning the kitchen before cooking: where the knives are (syntax and classes), which pans overheat (int overflow), and how to get ingredients in fast (BufferedReader).',
      definition: 'Java is statically typed and object-oriented: code lives in classes, execution starts at public static void main. Primitives (int, long, double, char, boolean) are fixed size; int is 32-bit and overflows silently.',
      mcq: [
        ['Integer.MAX_VALUE + 1 evaluates to…', ['an exception', 'Integer.MIN_VALUE', '2147483648', 'Integer.MAX_VALUE'], 1, 'int arithmetic wraps around silently. Use long when values can exceed ~2.1·10^9.'],
        ['Overflow-safe midpoint?', ['(lo + hi) / 2', 'lo + (hi - lo) / 2', '(lo * hi) / 2', 'hi / 2'], 1, 'lo + hi can exceed the int range; the difference cannot.'],
        ['Fast input for 10^5 numbers?', ['Scanner.nextInt()', 'BufferedReader + StringTokenizer', 'System.console()', 'JOptionPane'], 1, 'Scanner parses with regexes and is much slower.'],
      ],
    },
  },
  'lang-collections': {
    python: {
      analogy: 'A toolbox: a list is a row of drawers, a dict is a labelled filing cabinet, a set is a guest list, a deque is a two-ended line, heapq is a priority tray.',
      definition: 'list: dynamic array (O(1) append, O(n) insert at front). dict/set: hash tables (O(1) average lookup). tuple: immutable, hashable. collections.deque: O(1) at both ends. heapq: min-heap functions over a list. bisect: binary search on sorted lists.',
      mcq: [
        ['Cost of list.pop(0) on a list of n items?', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2, 'Every remaining item shifts left. deque.popleft() is O(1).'],
        ['How do you get a max-heap with heapq?', ['heapq.maxheap()', 'push negated values', 'reverse the list', 'it is the default'], 1, 'heapq is min-only; store -x and negate when popping.'],
        ['Which can be a dict key?', ['[1, 2]', '(1, 2)', '{1, 2}', '{1: 2}'], 1, 'Only immutable, hashable values such as tuples.'],
      ],
    },
    java: {
      analogy: 'A toolbox: ArrayList is a row of drawers, HashMap is a labelled filing cabinet, HashSet is a guest list, ArrayDeque is a two-ended line, PriorityQueue is a priority tray, TreeMap is a sorted index.',
      definition: 'Collections hold objects, so primitives are boxed (Integer, Long). ArrayList: dynamic array. HashMap/HashSet: hash tables. TreeMap/TreeSet: red-black trees, O(log n), sorted. ArrayDeque: stack and queue. PriorityQueue: binary min-heap; pass a Comparator for other orders.',
      mcq: [
        ['Which class gives a min-heap?', ['TreeSet', 'PriorityQueue', 'ArrayDeque', 'Stack'], 1, 'PriorityQueue orders by natural order (smallest first) unless given a Comparator.'],
        ['Integer a = 1000, b = 1000; a == b is…', ['true', 'false', 'a compile error', 'an exception'], 1, '== compares references for objects; only -128..127 are cached. Use equals().'],
        ['Best class for both stack and queue?', ['Stack', 'LinkedList', 'ArrayDeque', 'Vector'], 2, 'ArrayDeque is faster than the legacy Stack and the node-based LinkedList.'],
      ],
    },
  },
};

export function understandFor(course: CourseId, topic: string): UnderstandContent | undefined {
  if (topic === 'lang-basics' || topic === 'lang-collections') return LANG_UNDERSTAND[topic][course];
  return UNDERSTAND[topic];
}
