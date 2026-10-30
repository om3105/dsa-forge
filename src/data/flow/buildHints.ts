// Help ladder for the Build stage, one entry per topic. Each step gives away a bit more:
//   1. what to keep track of, 2. the plan in plain steps, 3. an outline in pseudocode.
// After the third step the reference implementation can be opened (it counts as help).
export const BUILD_HINTS: Record<string, [string, string, string]> = {
  'lang-basics': [
    'You only need two variables while you loop: the biggest value seen so far (first) and the biggest value that is smaller than it (second). Start both as "nothing yet" (None in Python, null or Integer.MIN_VALUE in Java).',
    'For each number x: if x is bigger than first, the old first becomes second and x becomes first. Otherwise, if x is different from first and bigger than second, x becomes second. Equal values (like 7, 7, 7) must not count as a second value. At the end, if second is still "nothing", return -1.',
    'first = none, second = none\nfor x in nums:\n    if first is none or x > first:\n        second = first\n        first = x\n    else if x != first and (second is none or x > second):\n        second = x\nreturn -1 if second is none else second',
  ],
  'lang-collections': [
    'Count how often each word appears with a dictionary / HashMap (word to count). Then sort the distinct words by two keys.',
    'Split the text on spaces and count. Sort the words by count from high to low, and when counts are equal, alphabetically. Return the first k.',
    'counts = empty map\nfor w in text.split(" "): counts[w] += 1\nwords = keys of counts\nsort words by (-counts[w], w)\nreturn first k of words',
  ],
  complexity: [
    'The biggest product is either the two largest numbers multiplied, or the two smallest (two big negatives make a big positive). So track max1, max2, min1, min2 in one loop.',
    'Loop once. Update the two largest values (like the second-largest problem) and the two smallest values the same way. Answer = max(max1 * max2, min1 * min2). Use 64-bit numbers (long in Java) for the product.',
    'max1 = max2 = -infinity, min1 = min2 = +infinity\nfor x in nums:\n    if x > max1: max2 = max1; max1 = x\n    else if x > max2: max2 = x\n    if x < min1: min2 = min1; min1 = x\n    else if x < min2: min2 = x\nreturn max(max1*max2, min1*min2)',
  ],
  arrays: [
    'Keep a fixed-size array (the buffer), a size counter for how many slots are used, and the capacity. Only the first size slots are real values.',
    'push: if size == capacity, make a new array twice as big and copy everything over; then write at index size and add 1 to size. pop: subtract 1 from size and return that slot. get/set: check 0 <= i < size before touching the buffer.',
    'init: buf = array of 2, size = 0\npush(v): if size == len(buf): grow()\n         buf[size] = v; size += 1\npop(): size -= 1; return buf[size]\nget(i): return buf[i]   (after checking i < size)\ngrow(): new = array of 2*len(buf); copy buf[0..size-1]; buf = new',
  ],
  'prefix-sum': [
    'Store pre where pre[i] is the sum of the first i numbers, so pre has one more slot than nums and pre[0] = 0.',
    'In the constructor fill pre with a running total. The sum from left to right is pre[right + 1] - pre[left]: everything up to right, minus everything before left.',
    'pre = [0] * (n + 1)\nfor i in 0..n-1: pre[i+1] = pre[i] + nums[i]\nrangeSum(l, r): return pre[r+1] - pre[l]',
  ],
  strings: [
    'Walk through the string and keep the current character and how many times in a row you have seen it. Build the answer piece by piece in a list (Python) or StringBuilder (Java).',
    'When the next character is different (or the string ends), write the character, and write the count only if it is more than 1. Then start counting the new character from 1.',
    'out = builder, i = 0\nwhile i < len(s):\n    j = i\n    while j < len(s) and s[j] == s[i]: j += 1\n    out.add(s[i])\n    if j - i > 1: out.add(str(j - i))\n    i = j\nreturn out joined',
  ],
  hashing: [
    'Make an array of buckets (say 1000). A key goes into bucket key % 1000. Each bucket is a small list of [key, value] pairs, because different keys can land in the same bucket.',
    'put: find the bucket; if the key is already in its list, overwrite the value, otherwise add a new pair. get: search that one bucket, return the value or -1. remove: delete the pair from that bucket if it is there.',
    'buckets = 1000 empty lists\nidx(key) = key % 1000\nput(k, v): for pair in buckets[idx(k)]: if pair.key == k: pair.value = v; return\n           buckets[idx(k)].append([k, v])\nget(k): for pair in buckets[idx(k)]: if pair.key == k: return pair.value\n        return -1',
  ],
  'two-pointers': [
    'Use one index for each array, i for a and j for b, both starting at 0. The smaller of a[i] and b[j] is always the next value in the answer.',
    'While both arrays still have values, take the smaller front value and move that index forward. When one array runs out, copy whatever is left of the other one.',
    'i = j = 0, out = []\nwhile i < len(a) and j < len(b):\n    if a[i] <= b[j]: out.add(a[i]); i += 1\n    else: out.add(b[j]); j += 1\nadd the rest of a from i\nadd the rest of b from j\nreturn out',
  ],
  'sliding-window': [
    'Keep a count map of the values inside the current window. The number of distinct values is just the number of keys in the map.',
    'Add the first k values. Record the number of keys. Then slide one step at a time: add the new value on the right, subtract the value that left on the left side, and delete its key if its count drops to 0. Record the number of keys again.',
    'count = empty map, out = []\nfor i in 0..n-1:\n    count[nums[i]] += 1\n    if i >= k:\n        old = nums[i-k]; count[old] -= 1\n        if count[old] == 0: delete count[old]\n    if i >= k - 1: out.add(size of count)\nreturn out',
  ],
  recursion: [
    'Write a helper move(n, from, to, spare) that adds moves to a shared list. Trust the helper to work for n - 1 disks, which is the whole trick of recursion.',
    'To move n disks: first move n - 1 disks from "from" to "spare", then move the biggest disk from "from" to "to", then move the n - 1 disks from "spare" onto "to". When n is 0 there is nothing to do.',
    'moves = []\nmove(n, frm, to, spare):\n    if n == 0: return\n    move(n-1, frm, spare, to)\n    moves.add([frm, to])\n    move(n-1, spare, to, frm)\nmove(n, 1, 3, 2)\nreturn moves',
  ],
  sorting: [
    'Pick a pivot (for example the middle value). Split the numbers into three groups: smaller than the pivot, equal to it, and bigger than it.',
    'Sort the smaller group and the bigger group with the same function (recursion), then join: smaller + equal + bigger. A list with 0 or 1 values is already sorted, so return it as it is.',
    'quicksort(a):\n    if len(a) <= 1: return a\n    p = a[len(a) // 2]\n    less = values < p, equal = values == p, more = values > p\n    return quicksort(less) + equal + quicksort(more)',
  ],
  'binary-search': [
    'Search a range lo..hi where the answer must lie. Start with lo = 0 and hi = len(nums) (one past the end, because the answer can be "after everything").',
    'Look at the middle. If nums[mid] < target, the answer is to the right, so lo = mid + 1. Otherwise mid could be the answer, so hi = mid (keep it). Stop when lo == hi; that is the answer.',
    'lo = 0, hi = len(nums)\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    if nums[mid] < target: lo = mid + 1\n    else: hi = mid\nreturn lo',
  ],
  'linked-list': [
    'Make a Node class with val and next. The list keeps head, tail and size. With a tail reference, addLast does not have to walk the whole list.',
    'addFirst: the new node points at the old head and becomes the head (and also the tail if the list was empty). addLast: link it after the tail and move the tail. removeFirst: return -1 if empty, otherwise move head to head.next (and clear tail if the list became empty). get(i): check 0 <= i < size, then walk i steps from the head.',
    'class Node: val, next\nhead = tail = null, size = 0\naddFirst(v): n = Node(v); n.next = head; head = n; if tail is null: tail = n; size += 1\naddLast(v): n = Node(v); if tail is null: head = tail = n else: tail.next = n; tail = n; size += 1\nremoveFirst(): if head is null: return -1\n               v = head.val; head = head.next; if head is null: tail = null; size -= 1; return v\nget(i): if i < 0 or i >= size: return -1; walk i steps from head; return val',
  ],
  stack: [
    'An array plus a count of how many items are in it. The top of the stack is the last used slot.',
    'push adds at the end. pop and peek look at the last item, and return -1 when the count is 0. pop also removes that item. isEmpty checks whether the count is 0.',
    'items = [], n = 0\npush(x): items[n] = x (grow if needed); n += 1\npop(): if n == 0: return -1; n -= 1; return items[n]\npeek(): return -1 if n == 0 else items[n-1]\nisEmpty(): return n == 0',
  ],
  'monotonic-stack': [
    'Keep a stack of indices whose "next greater" has not been found yet. Their values are in decreasing order from bottom to top.',
    'Go left to right. While the current value is bigger than the value at the index on top of the stack, the current value is that index\'s answer: pop it and record it. Then push the current index. Anything left on the stack at the end gets -1.',
    'ans = [-1] * n, st = []\nfor i in 0..n-1:\n    while st not empty and nums[i] > nums[top of st]:\n        ans[pop st] = nums[i]\n    push i onto st\nreturn ans',
  ],
  queue: [
    'Use a fixed array of size capacity, an index head for the front, and a count of items. The back is at (head + count) % capacity, which wraps around.',
    'enqueue: if count == capacity return false; otherwise write at the back and add 1 to count. dequeue: if count == 0 return -1; read at head, move head forward with % capacity, subtract 1 from count.',
    'buf = array(capacity), head = 0, count = 0\nenqueue(x): if count == capacity: return false\n            buf[(head + count) % capacity] = x; count += 1; return true\ndequeue(): if count == 0: return -1\n           x = buf[head]; head = (head + 1) % capacity; count -= 1; return x',
  ],
  intervals: [
    'One pointer into each list. Two intervals overlap on [max(starts), min(ends)] if that range is not empty.',
    'Compare a[i] and b[j]. If lo = max of the starts is <= hi = min of the ends, add [lo, hi]. Then move forward whichever interval ends first, because it cannot overlap anything else.',
    'i = j = 0, out = []\nwhile i < len(a) and j < len(b):\n    lo = max(a[i].start, b[j].start); hi = min(a[i].end, b[j].end)\n    if lo <= hi: out.add([lo, hi])\n    if a[i].end < b[j].end: i += 1 else: j += 1\nreturn out',
  ],
  trees: [
    'Write one recursive function that visits a node and its two children. The only difference between the three orders is when you record the node\'s value.',
    'Preorder records the value before visiting the children, inorder between left and right, postorder after both. If the node is null, return straight away.',
    'pre = [], ino = [], post = []\nvisit(node):\n    if node is null: return\n    pre.add(node.val)\n    visit(node.left)\n    ino.add(node.val)\n    visit(node.right)\n    post.add(node.val)\nvisit(root); return [pre, ino, post]',
  ],
  bst: [
    'Node class with val, left, right. Smaller values always go left and bigger values go right, so every operation walks down one path from the root.',
    'insert: walk down comparing values until you find an empty spot, and attach the new node there (do nothing for a duplicate). contains: walk down the same way. inorder: left subtree, then the node, then the right subtree, which gives sorted order.',
    'insert(v): if root is null: root = Node(v); return\n           cur = root; loop: if v < cur.val: go left (attach if empty)\n                             elif v > cur.val: go right (attach if empty)\n                             else: return\ncontains(v): walk down the same way, true if found\ninorder(): visit(left), add val, visit(right)',
  ],
  heaps: [
    'Store the heap in an array. The smallest value is always at index 0. For index i, the parent is (i - 1) // 2 and the children are 2i + 1 and 2i + 2.',
    'push: add at the end, then swap upward while it is smaller than its parent. pop: save index 0, move the last value to index 0, then swap it downward with its smaller child while a child is smaller.',
    'push(x): a.add(x); i = last\n         while i > 0 and a[i] < a[parent(i)]: swap; i = parent(i)\npop(): if empty: return -1\n       top = a[0]; a[0] = last value; remove last\n       sift down from 0: swap with the smaller child while it is smaller\n       return top',
  ],
  graphs: [
    'Build an adjacency list (list of neighbours for each node) and sort each list so neighbours are explored in ascending order. BFS uses a queue and a visited set.',
    'Put start in the queue and mark it visited. Repeatedly take the front node, add it to the answer, and for each neighbour not yet visited, mark it and add it to the queue. Mark when adding, not when taking, so nothing is added twice.',
    'adj = n empty lists; for [u, v] in edges: adj[u].add(v); adj[v].add(u)\nsort every adj list\nseen = {start}, q = [start], order = []\nwhile q not empty:\n    u = q.pop_front(); order.add(u)\n    for v in adj[u]: if v not in seen: seen.add(v); q.add(v)\nreturn order',
  ],
  'union-find': [
    'parent[i] starts as i (everyone is their own group). find(x) follows parent links up to the root, which names the group. Keep a counter of how many groups there are.',
    'union(a, b): find both roots; if they are the same, return false; otherwise point one root at the other, subtract 1 from the counter, and return true. connected(a, b) is find(a) == find(b). Path compression in find keeps it fast.',
    'parent = [0..n-1], groups = n\nfind(x): while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]\n         return x\nunion(a, b): ra = find(a); rb = find(b)\n             if ra == rb: return false\n             parent[ra] = rb; groups -= 1; return true',
  ],
  greedy: [
    'Go through the coins from largest to smallest and use as many of each as fit.',
    'For each coin, count = amount // coin, then amount = amount % coin (what is left). Record the count. Integer division and remainder do all the work.',
    'out = []\nfor coin in [25, 10, 5, 1]:\n    out.add(amount // coin)\n    amount = amount % coin\nreturn out',
  ],
  'dp-1d': [
    'dp[i] = number of ways to reach step i. There is exactly one way to be at step 0 (do nothing), so dp[0] = 1.',
    'To reach step i, your last move was one of the allowed step sizes s, so you came from step i - s. Add up dp[i - s] for every s that does not go below 0.',
    'dp = [0] * (n + 1); dp[0] = 1\nfor i in 1..n:\n    for s in steps:\n        if i - s >= 0: dp[i] += dp[i - s]\nreturn dp[n]',
  ],
  'dp-2d': [
    'Make a table dp of size (len(a) + 1) x (len(b) + 1) filled with 0. dp[i][j] is how long the matching run is that ends at a[i-1] and b[j-1].',
    'If a[i-1] == b[j-1], the run continues: dp[i][j] = dp[i-1][j-1] + 1. If not, the run breaks: dp[i][j] = 0. The answer is the largest value anywhere in the table.',
    'dp = (m+1) x (n+1) zeros, best = 0\nfor i in 1..m:\n    for j in 1..n:\n        if a[i-1] == b[j-1]:\n            dp[i][j] = dp[i-1][j-1] + 1\n            best = max(best, dp[i][j])\nreturn best',
  ],
  'dp-knapsack': [
    'dp[w] = the best value you can get with total weight at most w. Start with all zeros.',
    'Take items one at a time. For each item, go through w from capacity down to the item\'s weight and set dp[w] = max(dp[w], dp[w - weight] + value). Going downward makes sure each item is used at most once.',
    'dp = [0] * (capacity + 1)\nfor i in items:\n    for w from capacity down to weights[i]:\n        dp[w] = max(dp[w], dp[w - weights[i]] + values[i])\nreturn dp[capacity]',
  ],
  backtracking: [
    'Build one combination in a list (path). At each step choose the next number, go deeper, then remove it again (undo) so you can try the next choice.',
    'Use a helper with a start number. If path has k numbers, save a copy. Otherwise try every number from start to n: add it, call the helper with start = number + 1, then remove it.',
    'out = [], path = []\nbt(start):\n    if len(path) == k: out.add(copy of path); return\n    for x in start..n:\n        path.add(x)\n        bt(x + 1)\n        path.remove_last()\nbt(1); return out',
  ],
  tries: [
    'Each node has up to 26 children (one per letter) and two counters: how many words pass through it (pass) and how many words end exactly here (end).',
    'insert: walk the letters from the root, creating missing children, and add 1 to pass on every node you visit; add 1 to end on the last node. countWord walks the word and returns end; countPrefix walks the prefix and returns pass. If a letter is missing, return 0.',
    'class Node: children[26], pass = 0, end = 0\ninsert(w): cur = root; for ch in w: cur = child(ch) (create if missing); cur.pass += 1\n          cur.end += 1\ncountWord(w): walk w; return 0 if missing else cur.end\ncountPrefix(p): walk p; return 0 if missing else cur.pass',
  ],
  bits: [
    'With n numbers there are 2^n subsets. Every number from 0 to 2^n - 1 written in binary is one subset: bit i says whether nums[i] is in it.',
    'Loop mask from 0 to (1 << n) - 1. For each mask, go through i from 0 to n - 1 and include nums[i] when (mask >> i) & 1 is 1.',
    'out = []\nfor mask in 0 .. (1 << n) - 1:\n    sub = []\n    for i in 0..n-1:\n        if (mask >> i) & 1: sub.add(nums[i])\n    out.add(sub)\nreturn out',
  ],
  'topo-sort': [
    'Count each node\'s in-degree: how many edges point into it. A node with in-degree 0 has nothing that must come before it, so it is ready.',
    'Put every ready node in a min-heap (so the smallest is taken first). Take the smallest, add it to the order, and lower the in-degree of each node it points to; any that reach 0 become ready. If the order ends up shorter than n, there was a cycle, so return [].',
    'indeg = [0] * n; adj = n empty lists\nfor [u, v] in edges: adj[u].add(v); indeg[v] += 1\nready = min-heap of nodes with indeg 0; order = []\nwhile ready not empty:\n    u = pop smallest; order.add(u)\n    for v in adj[u]: indeg[v] -= 1; if indeg[v] == 0: push v\nreturn order if len(order) == n else []',
  ],
  'shortest-path': [
    'dist[i] = best distance found so far to node i (start at infinity, dist[src] = 0). A min-heap of (distance, node) always gives you the closest node not yet finished.',
    'Pop the closest (d, u). If d is bigger than dist[u], it is an old entry, so skip it. Otherwise, for each edge u to v with weight w, if d + w < dist[v], update dist[v] and push (dist[v], v). At the end, turn infinity into -1.',
    'dist = [inf] * n; dist[src] = 0\nheap = [(0, src)]\nwhile heap not empty:\n    d, u = pop smallest\n    if d > dist[u]: continue\n    for (v, w) in adj[u]:\n        if d + w < dist[v]: dist[v] = d + w; push (dist[v], v)\nreturn [-1 if x == inf else x for x in dist]',
  ],
};
