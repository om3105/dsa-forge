import type { LanguagePack } from './types';

export const PYTHON: LanguagePack = {
  name: 'Python',
  foundations: {
    'lang-basics': {
      intro: `Python lets you write algorithms almost as pseudocode, which is why it is great for interviews. This lesson covers the syntax you need every day and the habits that keep solutions fast. Write every snippet yourself in the scratchpad, reading is not enough.`,
      sections: [
        {
          title: 'Variables, types and arithmetic',
          body: `Python ints have **arbitrary precision** (no overflow). \`/\` always returns a float; \`//\` is floor division and \`%\` follows the sign of the divisor. \`divmod(a, b)\` returns both. Use \`float('inf')\` / \`-float('inf')\` (or \`math.inf\`) as sentinels.`,
          code: `x = 7
print(x / 2, x // 2, x % 2)   # 3.5 3 1
print(-7 // 2, -7 % 2)        # -4 1   (floors toward -infinity!)
print(int(-7 / 2))            # -3     (truncate toward zero)
big = 2 ** 100                # fine, no overflow
best = float('inf')`,
        },
        {
          title: 'Control flow and loops',
          body: `Loop over values directly; use \`enumerate\` when you need the index and \`zip\` to walk two sequences together. \`range(start, stop, step)\` excludes \`stop\`. \`for ... else\` runs the else only if the loop did not \`break\`.`,
          code: `nums = [4, 1, 3]
for i, x in enumerate(nums):
    print(i, x)
for a, b in zip(nums, nums[1:]):   # adjacent pairs
    print(a, b)
for i in range(len(nums) - 1, -1, -1):  # backwards
    print(nums[i])
while nums:
    nums.pop()`,
        },
        {
          title: 'Functions, recursion and closures',
          body: `Functions are first-class. Nested functions can read outer variables; to **assign** to an outer variable use \`nonlocal\`. You will need this for "global best" in tree DFS. Default recursion limit is 1000; \`sys.setrecursionlimit\` raises it (deep recursion may still crash, prefer iteration for very deep inputs). \`functools.cache\` memoizes a function in one line.`,
          code: `from functools import cache

def diameter(root):
    best = 0
    def height(node):
        nonlocal best
        if not node:
            return 0
        l, r = height(node.left), height(node.right)
        best = max(best, l + r)
        return 1 + max(l, r)
    height(root)
    return best

@cache
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)`,
        },
        {
          title: 'Fast input and output',
          body: `\`input()\` is slow for large inputs. In online assessments that read from stdin, read everything at once with \`sys.stdin\` and print once with \`'\\n'.join\`.`,
          code: `import sys

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    out = [str(x * 2) for x in nums]
    sys.stdout.write('\\n'.join(out) + '\\n')

main()`,
        },
        {
          title: 'Type hints and style',
          body: `Interviewers like readable code. Use type hints (\`def f(nums: list[int]) -> int\`), descriptive names, and small helper functions. Python 3.10+ allows \`int | None\`.`,
        },
      ],
      cards: [
        { front: 'Python: what is -7 // 2 and why?', back: '-4. // floors toward negative infinity. Use int(a / b) to truncate toward zero.' },
        { front: 'Python: how do you assign to an outer function variable from a nested function?', back: 'Declare it with nonlocal (or global for module level).' },
        { front: 'Python default recursion limit?', back: '1000 frames; change with sys.setrecursionlimit(n).' },
        { front: 'Fast way to read all input in Python?', back: 'sys.stdin.buffer.read().split() (or sys.stdin.readline in a loop).' },
        { front: 'One-line memoization decorator in Python?', back: '@functools.cache (or @lru_cache(maxsize=None)).' },
      ],
    },
    'lang-collections': {
      intro: `Every solution is built from a handful of containers. Know the cost of each operation, interviewers will ask, and a hidden O(n) inside a loop is the most common reason a correct solution times out.`,
      sections: [
        {
          title: 'list, dynamic array',
          body: `Append/pop at the **end** are O(1). Insert/pop at the **front** and \`x in list\` are O(n). Slicing copies (O(k)). Sort in place with \`.sort(key=...)\`, or get a new list with \`sorted()\`. Create 2D grids with a comprehension, never \`[[0] * n] * m\`.`,
          code: `a = [3, 1, 2]
a.append(5); a.pop()          # O(1)
a.sort(key=lambda x: -x)      # descending
grid = [[0] * 4 for _ in range(3)]   # 3 independent rows
squares = [x * x for x in a if x % 2]
rev = a[::-1]`,
        },
        {
          title: 'dict and set, hash tables',
          body: `Average O(1) get/set/delete/membership. Keys must be **hashable**: use tuples, not lists. \`dict.get(k, default)\` avoids KeyErrors. Dicts keep insertion order (3.7+).`,
          code: `seen = {}
for i, x in enumerate([2, 7, 11]):
    if 9 - x in seen:
        print(seen[9 - x], i)
    seen[x] = i

visited = set()
visited.add((0, 0))           # tuple key for a grid cell
print((0, 0) in visited)`,
        },
        {
          title: 'tuple and strings',
          body: `Tuples are immutable and hashable, good dict keys and heap entries. Strings are immutable: build with a list and \`''.join(parts)\`. Useful: \`s.split()\`, \`s.isalnum()\`, \`s.lower()\`, \`ord(c) - ord('a')\`.`,
          code: `parts = []
for w in reversed("the sky is blue".split()):
    parts.append(w)
print(' '.join(parts))
counts = [0] * 26
for c in "banana":
    counts[ord(c) - ord('a')] += 1`,
        },
        {
          title: 'collections: deque, Counter, defaultdict',
          body: `\`deque\` gives O(1) append/pop at both ends. Use it for every queue and BFS (\`list.pop(0)\` is O(n)). \`Counter\` counts things and supports \`most_common(k)\`. \`defaultdict(list)\` creates missing keys automatically.`,
          code: `from collections import deque, Counter, defaultdict

q = deque([0])
q.append(1); q.popleft()

cnt = Counter("mississippi")
print(cnt['s'], cnt.most_common(2))

graph = defaultdict(list)
for u, v in [(0, 1), (1, 2)]:
    graph[u].append(v)
    graph[v].append(u)`,
        },
        {
          title: 'heapq, min-heap on a list',
          body: `\`heapq\` turns a list into a **min-heap**. There is no max-heap: push negated values. Push tuples to order by priority; add a tie-breaker so incomparable objects are never compared.`,
          code: `import heapq

h = []
heapq.heappush(h, 5); heapq.heappush(h, 1)
print(heapq.heappop(h))        # 1

nums = [3, 1, 4, 1, 5]
heapq.heapify(nums)            # O(n)
max_heap = [-x for x in [3, 1, 4]]
heapq.heapify(max_heap)
print(-max_heap[0])            # 4

print(heapq.nlargest(2, [3, 1, 4, 1, 5]))`,
        },
        {
          title: 'bisect, binary search on sorted lists',
          body: `\`bisect_left(a, x)\` returns the first index i with \`a[i] >= x\` (lower bound); \`bisect_right\` the first index with \`a[i] > x\`. \`insort\` inserts keeping order (O(n) because of the shift).`,
          code: `from bisect import bisect_left, bisect_right
a = [1, 2, 2, 2, 5]
print(bisect_left(a, 2), bisect_right(a, 2))   # 1 4  → count of 2s = 3`,
        },
      ],
      cards: [
        { front: 'Python: cost of list.pop(0)? What should you use instead?', back: 'O(n). Use collections.deque and popleft(), O(1).' },
        { front: 'How do you make a max-heap with heapq?', back: 'Push negated values (-x) and negate again when popping.' },
        { front: 'Why is [[0] * n] * m wrong for a grid?', back: 'All m rows are the same list object. Use [[0] * n for _ in range(m)].' },
        { front: 'Which Python structure counts frequencies and gives the k most common?', back: 'collections.Counter with most_common(k).' },
        { front: 'bisect_left(a, x) returns?', back: 'The first index i where a[i] >= x (lower bound).' },
        { front: 'Can a list be a dict key or set element?', back: 'No, lists are unhashable. Use a tuple.' },
      ],
    },
  },

  lessons: {
    complexity: {
      notes: [
        'Hidden O(n) operations in Python: `x in list`, `list.index`, `list.insert(0, x)`, `list.pop(0)`, slicing `a[i:j]`, `s1 + s2`, `sorted()` (n log n).',
        'O(1) average: `dict`/`set` lookups, `list.append`, `list.pop()`, `deque.popleft()`.',
        'Python executes roughly 10^7 simple operations per second, slower than Java. An O(n^2) with n = 10^4 (10^8 steps) will time out in Python.',
      ],
      cards: [{ front: 'Python: roughly how many simple operations per second?', back: 'About 10^7, plan for O(n log n) when n ≥ 10^5.' }],
    },
    arrays: {
      templateTitle: "Kadane's algorithm",
      template: `def max_sub_array(nums: list[int]) -> int:
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)      # extend or restart
        best = max(best, cur)
    return best`,
      notes: [
        'Use `enumerate` instead of `range(len(...))` when you need both index and value.',
        'Swap in one line: `a[i], a[j] = a[j], a[i]`.',
        '`nums[1:]` copies the list; in very hot loops prefer an index loop.',
      ],
    },
    'prefix-sum': {
      templateTitle: 'Prefix sum + hash map (count subarrays with sum k)',
      template: `from collections import defaultdict

def subarray_sum(nums: list[int], k: int) -> int:
    seen = defaultdict(int)
    seen[0] = 1                 # empty prefix
    total = count = 0
    for x in nums:
        total += x
        count += seen[total - k]
        seen[total] += 1
    return count`,
      notes: ['`itertools.accumulate(nums, initial=0)` builds a prefix array in one line.', '`defaultdict(int)` avoids `get(..., 0)` noise.'],
    },
    strings: {
      templateTitle: 'Character counting and building output',
      template: `from collections import Counter

def is_anagram(s: str, t: str) -> bool:
    return Counter(s) == Counter(t)

def reverse_words(s: str) -> str:
    return ' '.join(reversed(s.split()))

def counts26(s: str) -> list[int]:
    c = [0] * 26
    for ch in s:
        c[ord(ch) - ord('a')] += 1
    return c`,
      notes: [
        'Strings are immutable: collect characters in a list and `"".join(parts)`.',
        '`s.split()` with no argument splits on any whitespace and drops empties.',
        '`str.isalnum()`, `str.isdigit()`, `str.lower()` are your friends.',
        'Tuple of counts `tuple(counts26(w))` is a hashable anagram key.',
      ],
    },
    hashing: {
      templateTitle: 'Complement lookup and grouping',
      template: `from collections import defaultdict

def two_sum(nums: list[int], target: int) -> list[int]:
    index_of = {}
    for i, x in enumerate(nums):
        if target - x in index_of:
            return [index_of[target - x], i]
        index_of[x] = i
    return []

def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups = defaultdict(list)
    for s in strs:
        groups[''.join(sorted(s))].append(s)
    return list(groups.values())`,
      notes: ['Keys must be hashable: tuples yes, lists no.', '`set(nums)` deduplicates in O(n).', '`Counter` subtraction drops non-positive counts: `Counter(a) - Counter(b)`.'],
    },
    'two-pointers': {
      templateTitle: 'Opposite-end pointers',
      template: `def two_sum_sorted(nums: list[int], target: int) -> list[int]:
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        s = nums[lo] + nums[hi]
        if s == target:
            return [lo, hi]
        if s < target:
            lo += 1
        else:
            hi -= 1
    return []

def remove_in_place(nums: list[int], val: int) -> int:
    write = 0
    for x in nums:
        if x != val:
            nums[write] = x
            write += 1
    return write`,
      notes: ['`nums.sort()` sorts in place and returns None. Do not write `nums = nums.sort()`.'],
    },
    'sliding-window': {
      templateTitle: 'Variable-size window',
      template: `def longest_unique(s: str) -> int:
    last = {}                  # char -> last index
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1          # shrink past the repeat
        last[ch] = right
        best = max(best, right - left + 1)
    return best

def window_template(nums: list[int]) -> int:
    left = 0
    state = 0
    best = 0
    for right, x in enumerate(nums):
        state += x                       # add right element
        while state_is_invalid(state):   # shrink
            state -= nums[left]
            left += 1
        best = max(best, right - left + 1)
    return best`,
      notes: ['A `Counter` works as the window state; delete keys whose count hits 0 if you need `len(counter)` as "distinct count".'],
    },
    recursion: {
      templateTitle: 'Recursion with memoization',
      template: `import sys
from functools import cache

sys.setrecursionlimit(10_000)

def my_pow(x: float, n: int) -> float:
    if n < 0:
        return 1 / my_pow(x, -n)
    if n == 0:
        return 1.0
    half = my_pow(x, n // 2)
    return half * half * (x if n % 2 else 1)

@cache
def ways(n: int) -> int:
    if n <= 1:
        return 1
    return ways(n - 1) + ways(n - 2)`,
      notes: [
        'Default recursion limit is 1000. Deep recursion (e.g. a 10^5-node linked list) needs an iterative solution.',
        '`@cache` arguments must be hashable, convert lists to tuples.',
      ],
      cards: [{ front: 'Python: two ways to memoize a recursive function?', back: '@functools.cache decorator, or an explicit dict memo passed/closed over.' }],
    },
    sorting: {
      templateTitle: 'Merge sort and custom keys',
      template: `from functools import cmp_to_key

def merge_sort(a: list[int]) -> list[int]:
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:]); out.extend(right[j:])
    return out

intervals = [[1, 3], [0, 2]]
intervals.sort(key=lambda iv: iv[0])          # by start
people = [("bo", 30), ("al", 30)]
people.sort(key=lambda p: (-p[1], p[0]))      # age desc, name asc

def largest_number(nums: list[int]) -> str:
    strs = sorted(map(str, nums), key=cmp_to_key(lambda a, b: -1 if a + b > b + a else 1))
    return ''.join(strs).lstrip('0') or '0'`,
      notes: ['Python\'s sort (Timsort) is stable, sort by secondary key first, then primary, or use a tuple key.', 'Prefer `key=` over comparators; use `functools.cmp_to_key` only when a pairwise rule is natural.'],
    },
    'binary-search': {
      templateTitle: 'Lower-bound template and search on answer',
      template: `def lower_bound(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums)            # answer in [lo, hi]
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] >= target:
            hi = mid
        else:
            lo = mid + 1
    return lo

def min_eating_speed(piles: list[int], h: int) -> int:
    def feasible(k: int) -> bool:
        return sum((p + k - 1) // k for p in piles) <= h
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`,
      notes: ['`bisect.bisect_left` / `bisect_right` implement lower/upper bound on sorted lists.', 'Ceil division without floats: `(a + b - 1) // b` or `-(-a // b)`.'],
    },
    'linked-list': {
      templateTitle: 'Reverse, dummy head, fast/slow',
      template: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head: ListNode | None) -> ListNode | None:
    prev, cur = None, head
    while cur:
        cur.next, prev, cur = prev, cur, cur.next
    return prev

def middle(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow

def merge(a: ListNode | None, b: ListNode | None) -> ListNode | None:
    dummy = tail = ListNode()
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next`,
      notes: [
        'Tuple assignment evaluates the right side first, which makes one-line pointer rewiring possible, but write it in three lines if you are unsure of the order.',
        '`collections.OrderedDict` has `move_to_end` and `popitem(last=False)`, an LRU cache in a few lines (know the manual version too).',
      ],
    },
    stack: {
      templateTitle: 'List as a stack',
      template: `def is_valid(s: str) -> bool:
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack`,
      notes: ['A plain list is the stack: `append`, `pop`, `stack[-1]` to peek.', 'For RPN division use `int(a / b)` (truncates toward zero), not `a // b`.'],
    },
    'monotonic-stack': {
      templateTitle: 'Next greater element (indices on a decreasing stack)',
      template: `def daily_temperatures(temps: list[int]) -> list[int]:
    ans = [0] * len(temps)
    stack = []                    # indices, temps decreasing
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            ans[j] = i - j
        stack.append(i)
    return ans`,
      notes: ['Circular version: `for i in range(2 * n): x = nums[i % n]` and only push when `i < n`.'],
    },
    queue: {
      templateTitle: 'Monotonic deque (sliding window max)',
      template: `from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq = deque()                  # indices, values decreasing
    out = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out`,
      notes: ['Always `collections.deque` for queues. `queue.Queue` is for threads and much slower.'],
    },
    intervals: {
      templateTitle: 'Merge intervals',
      template: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda iv: iv[0])
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
      notes: ['Unpack pairs directly in the loop: `for start, end in intervals`.', 'Min rooms: sort, then keep a heap of end times with `heapq`.'],
    },
    trees: {
      templateTitle: 'DFS returning a value + BFS by levels',
      template: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def max_depth(root: TreeNode | None) -> int:
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))

def level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        out.append(level)
    return out`,
      notes: ['Use `nonlocal best` inside a nested helper for global answers.', 'Skewed trees with 10^4+ nodes may exceed the recursion limit, mention the iterative alternative.'],
    },
    bst: {
      templateTitle: 'Validate with bounds; in-order iteratively',
      template: `def is_valid_bst(root) -> bool:
    def ok(node, low, high):
        if not node:
            return True
        if not (low < node.val < high):
            return False
        return ok(node.left, low, node.val) and ok(node.right, node.val, high)
    return ok(root, float('-inf'), float('inf'))

def kth_smallest(root, k: int) -> int:
    stack, node = [], root
    while stack or node:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right`,
      notes: ['Chained comparisons `low < x < high` are idiomatic Python.', 'Infinite floats work as bounds because Python compares ints and floats.'],
    },
    heaps: {
      templateTitle: 'Top-k with a size-k min-heap; max-heap via negation',
      template: `import heapq

def find_kth_largest(nums: list[int], k: int) -> int:
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]

def last_stone_weight(stones: list[int]) -> int:
    heap = [-s for s in stones]           # max-heap
    heapq.heapify(heap)
    while len(heap) > 1:
        y, x = -heapq.heappop(heap), -heapq.heappop(heap)
        if y != x:
            heapq.heappush(heap, -(y - x))
    return -heap[0] if heap else 0

# tuples order by first element, then the tie-breaker (an int counter)
# heapq.heappush(heap, (node.val, idx, node))`,
      notes: [
        '`heapq` only provides a min-heap. Max-heap: negate numbers.',
        'Never push objects that cannot be compared, add a unique counter as the second tuple field.',
        '`heapq.heappushpop(h, x)` is faster than push then pop.',
      ],
      cards: [{ front: 'Python heap of ListNodes: why include an index in the tuple?', back: 'If two values tie, Python would compare ListNode objects and raise TypeError; the unique index breaks ties.' }],
    },
    graphs: {
      templateTitle: 'Adjacency list, BFS on a grid, DFS counting',
      template: `from collections import defaultdict, deque

def build(n: int, edges: list[list[int]]):
    g = defaultdict(list)
    for u, v in edges:
        g[u].append(v)
        g[v].append(u)
    return g

DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))

def bfs_grid(grid: list[list[int]], sr: int, sc: int) -> list[list[int]]:
    rows, cols = len(grid), len(grid[0])
    dist = [[-1] * cols for _ in range(rows)]
    dist[sr][sc] = 0
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        for dr, dc in DIRS:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1      # mark when pushing
                q.append((nr, nc))
    return dist`,
      notes: ['Recursive DFS on a 300x300 grid can hit the recursion limit, iterative DFS with a list as stack is safer.', 'Store visited cells as tuples in a set, or mutate the grid if allowed.'],
    },
    'topo-sort': {
      templateTitle: "Kahn's algorithm",
      template: `from collections import deque

def topo_order(n: int, prereqs: list[list[int]]) -> list[int]:
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for course, pre in prereqs:       # pre -> course
        graph[pre].append(course)
        indeg[course] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []   # [] means cycle`,
      notes: ['`graphlib.TopologicalSorter` exists in the standard library (3.9+), fine to mention, but implement Kahn in interviews.'],
    },
    'shortest-path': {
      templateTitle: 'Dijkstra with heapq',
      template: `import heapq
from collections import defaultdict

def dijkstra(n: int, edges: list[list[int]], src: int) -> dict[int, int]:
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((v, w))
    dist = {src: 0}
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float('inf')):
            continue                      # stale entry
        for v, w in graph[u]:
            nd = d + w
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist`,
      notes: ['Tuples `(distance, node)` order by distance automatically.'],
    },
    'union-find': {
      templateTitle: 'Union-Find class',
      template: `class DSU:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.size = [1] * n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> bool:
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True`,
      notes: ['Iterative find avoids recursion-limit issues on long chains.'],
    },
    greedy: {
      templateTitle: 'Farthest reach',
      template: `def can_jump(nums: list[int]) -> bool:
    farthest = 0
    for i, step in enumerate(nums):
        if i > farthest:
            return False
        farthest = max(farthest, i + step)
    return True

def erase_overlap_intervals(intervals: list[list[int]]) -> int:
    intervals.sort(key=lambda iv: iv[1])
    end, kept = float('-inf'), 0
    for s, e in intervals:
        if s >= end:
            kept += 1
            end = e
    return len(intervals) - kept`,
      notes: [],
    },
    'dp-1d': {
      templateTitle: 'Top-down then bottom-up',
      template: `from functools import cache

def rob(nums: list[int]) -> int:
    @cache
    def best(i: int) -> int:            # max money from houses i..n-1
        if i >= len(nums):
            return 0
        return max(best(i + 1), nums[i] + best(i + 2))
    return best(0)

def rob_iter(nums: list[int]) -> int:
    prev2 = prev1 = 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1

def coin_change(coins: list[int], amount: int) -> int:
    INF = float('inf')
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return dp[amount] if dp[amount] != INF else -1`,
      notes: ['`@cache` on a nested function is cleared when the outer call returns, good for LeetCode-style multiple calls.', 'Memo recursion depth = n; for n > ~5000 go bottom-up.'],
    },
    'dp-2d': {
      templateTitle: 'Two-string DP table',
      template: `def lcs(a: str, b: str) -> int:
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]

def unique_paths(m: int, n: int) -> int:
    row = [1] * n
    for _ in range(1, m):
        for c in range(1, n):
            row[c] += row[c - 1]
    return row[-1]`,
      notes: ['Build 2D tables with a comprehension, `[[0] * (n + 1)] * (m + 1)` aliases rows.'],
    },
    'dp-knapsack': {
      templateTitle: '0/1 knapsack on reachable sums; LIS with bisect',
      template: `from bisect import bisect_left

def can_partition(nums: list[int]) -> bool:
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    dp = [True] + [False] * target
    for x in nums:
        for s in range(target, x - 1, -1):   # backwards: each item once
            dp[s] = dp[s] or dp[s - x]
    return dp[target]

def length_of_lis(nums: list[int]) -> int:
    tails = []                 # tails[k] = smallest tail of an increasing subsequence of length k+1
    for x in nums:
        i = bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)`,
      notes: ['Bitset trick: `reach = 1; for x in nums: reach |= reach << x`, Python big ints make subset-sum one line.'],
    },
    backtracking: {
      templateTitle: 'Choose / explore / un-choose',
      template: `def subsets(nums: list[int]) -> list[list[int]]:
    out, path = [], []
    def go(start: int) -> None:
        out.append(path[:])               # copy!
        for i in range(start, len(nums)):
            path.append(nums[i])
            go(i + 1)
            path.pop()
    go(0)
    return out

def permute(nums: list[int]) -> list[list[int]]:
    out, path, used = [], [], [False] * len(nums)
    def go() -> None:
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i, x in enumerate(nums):
            if not used[i]:
                used[i] = True; path.append(x)
                go()
                used[i] = False; path.pop()
    go()
    return out`,
      notes: ['`path[:]` or `list(path)` copies; appending `path` itself stores a reference that changes later.', '`itertools.combinations/permutations` exist, fine for quick checks, but interviewers want the backtracking.'],
    },
    tries: {
      templateTitle: 'Trie with dict children',
      template: `class TrieNode:
    __slots__ = ('children', 'end')
    def __init__(self):
        self.children: dict[str, 'TrieNode'] = {}
        self.end = False

class Trie:
    def __init__(self) -> None:
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.end = True

    def _walk(self, s: str) -> TrieNode | None:
        node = self.root
        for ch in s:
            node = node.children.get(ch)
            if node is None:
                return None
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.end

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None`,
      notes: ['`dict.setdefault` creates the child only if missing.', 'In this app, design-problem methods use snake_case (`starts_with`); the judge also accepts the camelCase name.'],
    },
    bits: {
      templateTitle: 'Bit tricks',
      template: `def single_number(nums: list[int]) -> int:
    x = 0
    for n in nums:
        x ^= n
    return x

def hamming_weight(n: int) -> int:
    count = 0
    while n:
        n &= n - 1          # drop lowest set bit
        count += 1
    return count            # or: n.bit_count() (3.10+), bin(n).count('1')

def get_sum(a: int, b: int) -> int:
    mask = 0xFFFFFFFF       # Python ints are unbounded: emulate 32-bit
    while b & mask:
        a, b = a ^ b, (a & b) << 1
    return (a & mask) if b > 0 else a`,
      notes: ['Python ints never overflow, so tricks that rely on 32-bit wraparound need an explicit mask.', '`~x == -x - 1` for Python ints.'],
      cards: [{ front: 'Python: why do 32-bit bit tricks need a mask?', back: 'Python ints are arbitrary precision; there is no wraparound, so negative numbers have infinitely many leading 1s.' }],
    },
  },

  gotchas: [
    {
      title: 'Mutable default arguments',
      body: 'Default values are evaluated once, when the function is defined. A list default is shared between calls.',
      bad: `def add(x, acc=[]):
    acc.append(x)
    return acc

add(1); add(2)   # [1, 2] , surprise`,
      good: `def add(x, acc=None):
    if acc is None:
        acc = []
    acc.append(x)
    return acc`,
    },
    {
      title: '[[0] * n] * m creates aliased rows',
      body: 'Multiplying a list of lists copies references, so every row is the same object.',
      bad: `grid = [[0] * 3] * 2
grid[0][0] = 1      # [[1,0,0],[1,0,0]]`,
      good: `grid = [[0] * 3 for _ in range(2)]`,
    },
    {
      title: 'Floor division with negatives',
      body: '`//` floors toward negative infinity. Many problems (RPN, "truncate toward zero") need truncation.',
      bad: `-7 // 2     # -4`,
      good: `int(-7 / 2)  # -3   (fine for 32-bit range)`,
    },
    {
      title: 'list.pop(0) and x in list are O(n)',
      body: 'They look cheap but scan or shift the whole list. Inside a loop they turn O(n) solutions into O(n^2).',
      bad: `queue = [start]
while queue:
    node = queue.pop(0)`,
      good: `from collections import deque
queue = deque([start])
while queue:
    node = queue.popleft()`,
    },
    {
      title: 'heapq is a min-heap only',
      body: 'For a max-heap push negated numbers. For objects, push (priority, tiebreak, obj) tuples.',
      bad: `heapq.heappush(h, (node.val, node))   # TypeError on ties`,
      good: `heapq.heappush(h, (node.val, i, node))  # i is unique`,
    },
    {
      title: 'Recursion limit (1000)',
      body: 'Deep DFS on a long linked list, skewed tree or big grid raises RecursionError. Raise the limit or switch to an explicit stack.',
      good: `import sys
sys.setrecursionlimit(10**6)   # may still crash on huge depth; iterative is safest`,
    },
    {
      title: 'Modifying a list while iterating it',
      body: 'Removing items during a for loop skips elements. Build a new list or iterate over a copy.',
      bad: `for x in nums:
    if x == 0:
        nums.remove(x)`,
      good: `nums = [x for x in nums if x != 0]`,
    },
    {
      title: 'is vs ==',
      body: '`is` checks identity, `==` checks value. Small ints and some strings are cached, so `is` "works" in tests and fails later. Use `is` only for None.',
      bad: `if a is 1000: ...`,
      good: `if a == 1000: ...
if node is None: ...`,
    },
    {
      title: 'Late binding in closures',
      body: 'Lambdas in a loop capture the variable, not its value at that time.',
      bad: `fs = [lambda: i for i in range(3)]
[f() for f in fs]   # [2, 2, 2]`,
      good: `fs = [lambda i=i: i for i in range(3)]`,
    },
    {
      title: 'Shallow copies',
      body: '`a[:]`, `list(a)` and `a.copy()` copy only the outer list. Nested lists still share inner lists.',
      good: `import copy
deep = copy.deepcopy(grid)
rows = [row[:] for row in grid]   # faster for 2D`,
    },
    {
      title: 'Strings are immutable',
      body: 'Repeated `s += ch` in a loop may copy the string each time. Collect parts and join once.',
      good: `parts = []
for ch in s:
    parts.append(ch.upper())
result = ''.join(parts)`,
    },
    {
      title: 'Sorting returns None',
      body: '`list.sort()` sorts in place and returns None. `sorted()` returns a new list.',
      bad: `nums = nums.sort()   # nums is now None`,
      good: `nums.sort()
# or
ordered = sorted(nums)`,
    },
  ],
};
