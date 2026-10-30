"""Reference solutions used to generate expected outputs for built-in problems.

Usage: python3 scripts/reference.py <problems.json> <out expected.json>
Inputs/outputs are in the JSON wire format (lists for linked lists, level-order
lists for trees), exactly what the judge compares against.
"""
import heapq
import json
import sys
from collections import Counter, defaultdict, deque, OrderedDict
from functools import lru_cache
from itertools import combinations


# ---------- tree helpers (level order <-> nested) ----------
class T:
    def __init__(self, v):
        self.val, self.left, self.right = v, None, None


def build(a):
    if not a or a[0] is None:
        return None
    root = T(a[0])
    q, i = deque([root]), 1
    while q and i < len(a):
        n = q.popleft()
        if i < len(a) and a[i] is not None:
            n.left = T(a[i]); q.append(n.left)
        i += 1
        if i < len(a) and a[i] is not None:
            n.right = T(a[i]); q.append(n.right)
        i += 1
    return root


def ser(root):
    out, q = [], deque([root])
    while q:
        n = q.popleft()
        if n is None:
            out.append(None); continue
        out.append(n.val); q.append(n.left); q.append(n.right)
    while out and out[-1] is None:
        out.pop()
    return out


def inorder(r):
    return inorder(r.left) + [r.val] + inorder(r.right) if r else []


def height(r):
    return 1 + max(height(r.left), height(r.right)) if r else 0


R = {}


def ref(pid):
    def deco(f):
        R[pid] = f
        return f
    return deco


@ref('running-sum-of-1d-array')
def _(nums):
    out, s = [], 0
    for x in nums:
        s += x; out.append(s)
    return out


@ref('best-time-to-buy-and-sell-stock')
def _(p):
    best, lo = 0, float('inf')
    for x in p:
        lo = min(lo, x); best = max(best, x - lo)
    return best


@ref('maximum-subarray')
def _(a):
    best = cur = a[0]
    for x in a[1:]:
        cur = max(x, cur + x); best = max(best, cur)
    return best


@ref('product-of-array-except-self')
def _(a):
    n = len(a); out = [1] * n; p = 1
    for i in range(n):
        out[i] = p; p *= a[i]
    p = 1
    for i in range(n - 1, -1, -1):
        out[i] *= p; p *= a[i]
    return out


@ref('move-zeroes')
def _(a):
    nz = [x for x in a if x != 0]
    return nz + [0] * (len(a) - len(nz))


@ref('find-pivot-index')
def _(a):
    total, left = sum(a), 0
    for i, x in enumerate(a):
        if left == total - left - x:
            return i
        left += x
    return -1


@ref('subarray-sum-equals-k')
def _(a, k):
    cnt, s, seen = 0, 0, Counter({0: 1})
    for x in a:
        s += x; cnt += seen[s - k]; seen[s] += 1
    return cnt


@ref('valid-palindrome')
def _(s):
    t = [c.lower() for c in s if c.isalnum()]
    return t == t[::-1]


@ref('valid-anagram')
def _(s, t):
    return Counter(s) == Counter(t)


@ref('longest-common-prefix')
def _(strs):
    p = strs[0]
    for s in strs[1:]:
        while not s.startswith(p):
            p = p[:-1]
    return p


@ref('reverse-words-in-a-string')
def _(s):
    return ' '.join(reversed(s.split()))


@ref('two-sum')
def _(a, t):
    seen = {}
    for i, x in enumerate(a):
        if t - x in seen:
            return [seen[t - x], i]
        seen[x] = i


@ref('contains-duplicate')
def _(a):
    return len(set(a)) != len(a)


@ref('group-anagrams')
def _(strs):
    g = defaultdict(list)
    for s in strs:
        g[''.join(sorted(s))].append(s)
    return list(g.values())


@ref('longest-consecutive-sequence')
def _(a):
    s, best = set(a), 0
    for x in s:
        if x - 1 not in s:
            y = x
            while y + 1 in s:
                y += 1
            best = max(best, y - x + 1)
    return best


@ref('two-sum-ii-input-array-is-sorted')
def _(a, t):
    i, j = 0, len(a) - 1
    while i < j:
        s = a[i] + a[j]
        if s == t:
            return [i + 1, j + 1]
        if s < t:
            i += 1
        else:
            j -= 1


@ref('squares-of-a-sorted-array')
def _(a):
    return sorted(x * x for x in a)


@ref('3sum')
def _(a):
    res = set()
    for c in combinations(sorted(a), 3):
        if sum(c) == 0:
            res.add(c)
    return [list(c) for c in res]


@ref('container-with-most-water')
def _(h):
    return max((j - i) * min(h[i], h[j]) for i in range(len(h)) for j in range(i + 1, len(h)))


@ref('trapping-rain-water')
def _(h):
    total = 0
    for i in range(len(h)):
        total += max(0, min(max(h[:i + 1]), max(h[i:])) - h[i])
    return total


@ref('maximum-sum-subarray-of-size-k')
def _(a, k):
    return max(sum(a[i:i + k]) for i in range(len(a) - k + 1))


@ref('longest-substring-without-repeating-characters')
def _(s):
    best = 0
    for i in range(len(s)):
        seen = set()
        for j in range(i, len(s)):
            if s[j] in seen:
                break
            seen.add(s[j]); best = max(best, j - i + 1)
    return best


@ref('minimum-size-subarray-sum')
def _(t, a):
    best = 0
    for i in range(len(a)):
        s = 0
        for j in range(i, len(a)):
            s += a[j]
            if s >= t:
                if best == 0 or j - i + 1 < best:
                    best = j - i + 1
                break
    return best


@ref('longest-repeating-character-replacement')
def _(s, k):
    best = 0
    for i in range(len(s)):
        c = Counter()
        for j in range(i, len(s)):
            c[s[j]] += 1
            if (j - i + 1) - max(c.values()) <= k:
                best = max(best, j - i + 1)
    return best


@ref('permutation-in-string')
def _(s1, s2):
    n = len(s1); c = Counter(s1)
    return any(Counter(s2[i:i + n]) == c for i in range(len(s2) - n + 1))


@ref('minimum-window-substring')
def _(s, t):
    need, best = Counter(t), ''
    for i in range(len(s)):
        for j in range(i + 1, len(s) + 1):
            if not need - Counter(s[i:j]):
                if not best or j - i < len(best):
                    best = s[i:j]
                break
    return best


@ref('fibonacci-number')
def _(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


@ref('powx-n')
def _(x, n):
    return x ** n


@ref('sort-an-array')
def _(a):
    return sorted(a)


@ref('sort-colors')
def _(a):
    return sorted(a)


@ref('merge-intervals')
def _(iv):
    out = []
    for s, e in sorted(iv):
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out


@ref('binary-search')
def _(a, t):
    return a.index(t) if t in a else -1


@ref('search-insert-position')
def _(a, t):
    import bisect
    return bisect.bisect_left(a, t)


@ref('find-first-and-last-position-of-element-in-sorted-array')
def _(a, t):
    if t not in a:
        return [-1, -1]
    return [a.index(t), len(a) - 1 - a[::-1].index(t)]


@ref('search-in-rotated-sorted-array')
def _(a, t):
    return a.index(t) if t in a else -1


@ref('find-minimum-in-rotated-sorted-array')
def _(a):
    return min(a)


@ref('koko-eating-bananas')
def _(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        m = (lo + hi) // 2
        if sum((p + m - 1) // m for p in piles) <= h:
            hi = m
        else:
            lo = m + 1
    return lo


@ref('reverse-linked-list')
def _(a):
    return a[::-1]


@ref('merge-two-sorted-lists')
def _(a, b):
    return sorted(a + b)


@ref('middle-of-the-linked-list')
def _(a):
    return a[len(a) // 2:]


@ref('remove-nth-node-from-end-of-list')
def _(a, n):
    return a[:len(a) - n] + a[len(a) - n + 1:]


@ref('add-two-numbers')
def _(a, b):
    x = int(''.join(map(str, a[::-1])))
    y = int(''.join(map(str, b[::-1])))
    return [int(c) for c in str(x + y)[::-1]]


@ref('merge-k-sorted-lists')
def _(lists):
    return sorted(x for l in lists for x in l)


@ref('valid-parentheses')
def _(s):
    st, pairs = [], {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in pairs:
            if not st or st.pop() != pairs[c]:
                return False
        else:
            st.append(c)
    return not st


@ref('evaluate-reverse-polish-notation')
def _(tokens):
    st = []
    for t in tokens:
        if t in '+-*/' and len(t) == 1:
            b, a = st.pop(), st.pop()
            st.append(a + b if t == '+' else a - b if t == '-' else a * b if t == '*' else int(a / b))
        else:
            st.append(int(t))
    return st[0]


@ref('daily-temperatures')
def _(t):
    out = [0] * len(t)
    for i in range(len(t)):
        for j in range(i + 1, len(t)):
            if t[j] > t[i]:
                out[i] = j - i; break
    return out


@ref('next-greater-element-ii')
def _(a):
    n = len(a); out = [-1] * n
    for i in range(n):
        for d in range(1, n):
            if a[(i + d) % n] > a[i]:
                out[i] = a[(i + d) % n]; break
    return out


@ref('largest-rectangle-in-histogram')
def _(h):
    return max(min(h[i:j + 1]) * (j - i + 1) for i in range(len(h)) for j in range(i, len(h)))


@ref('sliding-window-maximum')
def _(a, k):
    return [max(a[i:i + k]) for i in range(len(a) - k + 1)]


@ref('non-overlapping-intervals')
def _(iv):
    iv = sorted(iv, key=lambda x: x[1]); end, keep = float('-inf'), 0
    for s, e in iv:
        if s >= end:
            keep += 1; end = e
    return len(iv) - keep


@ref('meeting-rooms-ii')
def _(iv):
    ev = sorted([(s, 1) for s, _ in iv] + [(e, -1) for _, e in iv], key=lambda x: (x[0], x[1]))
    cur = best = 0
    for _, d in ev:
        cur += d; best = max(best, cur)
    return best


@ref('jump-game')
def _(a):
    reach = 0
    for i, x in enumerate(a):
        if i > reach:
            return False
        reach = max(reach, i + x)
    return True


@ref('jump-game-ii')
def _(a):
    n = len(a); dist = [0] + [10 ** 9] * (n - 1)
    for i in range(n):
        for j in range(i + 1, min(n, i + a[i] + 1)):
            dist[j] = min(dist[j], dist[i] + 1)
    return dist[-1]


@ref('gas-station')
def _(gas, cost):
    n = len(gas)
    for s in range(n):
        tank, ok = 0, True
        for k in range(n):
            i = (s + k) % n; tank += gas[i] - cost[i]
            if tank < 0:
                ok = False; break
        if ok:
            return s
    return -1


@ref('maximum-depth-of-binary-tree')
def _(a):
    return height(build(a))


@ref('invert-binary-tree')
def _(a):
    def inv(n):
        if n:
            n.left, n.right = inv(n.right), inv(n.left)
        return n
    return ser(inv(build(a)))


@ref('diameter-of-binary-tree')
def _(a):
    best = 0
    def h(n):
        nonlocal best
        if not n:
            return 0
        l, r = h(n.left), h(n.right); best = max(best, l + r); return 1 + max(l, r)
    h(build(a)); return best


@ref('binary-tree-level-order-traversal')
def _(a):
    root = build(a); out = []
    q = deque([root] if root else [])
    while q:
        lvl = []
        for _ in range(len(q)):
            n = q.popleft(); lvl.append(n.val)
            if n.left: q.append(n.left)
            if n.right: q.append(n.right)
        out.append(lvl)
    return out


@ref('binary-tree-right-side-view')
def _(a):
    return [lvl[-1] for lvl in R['binary-tree-level-order-traversal'](a)]


@ref('same-tree')
def _(p, q):
    return ser(build(p)) == ser(build(q))


@ref('validate-binary-search-tree')
def _(a):
    v = inorder(build(a))
    return all(v[i] < v[i + 1] for i in range(len(v) - 1))


@ref('kth-smallest-element-in-a-bst')
def _(a, k):
    return inorder(build(a))[k - 1]


@ref('lowest-common-ancestor-of-a-binary-search-tree')
def _(a, p, q):
    n = build(a)
    while True:
        if p < n.val and q < n.val:
            n = n.left
        elif p > n.val and q > n.val:
            n = n.right
        else:
            return n.val


@ref('kth-largest-element-in-an-array')
def _(a, k):
    return sorted(a)[-k]


@ref('last-stone-weight')
def _(st):
    h = [-x for x in st]; heapq.heapify(h)
    while len(h) > 1:
        y, x = -heapq.heappop(h), -heapq.heappop(h)
        if y != x:
            heapq.heappush(h, -(y - x))
    return -h[0] if h else 0


@ref('top-k-frequent-elements')
def _(a, k):
    return [x for x, _ in Counter(a).most_common(k)]


@ref('k-closest-points-to-origin')
def _(pts, k):
    return sorted(pts, key=lambda p: p[0] ** 2 + p[1] ** 2)[:k]


@ref('flood-fill')
def _(img, sr, sc, color):
    img = [r[:] for r in img]; old = img[sr][sc]
    if old == color:
        return img
    st = [(sr, sc)]
    while st:
        r, c = st.pop()
        if 0 <= r < len(img) and 0 <= c < len(img[0]) and img[r][c] == old:
            img[r][c] = color; st += [(r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)]
    return img


@ref('number-of-islands')
def _(g):
    g = [r[:] for r in g]; cnt = 0
    for i in range(len(g)):
        for j in range(len(g[0])):
            if g[i][j] == '1':
                cnt += 1; st = [(i, j)]
                while st:
                    r, c = st.pop()
                    if 0 <= r < len(g) and 0 <= c < len(g[0]) and g[r][c] == '1':
                        g[r][c] = '0'; st += [(r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)]
    return cnt


@ref('rotting-oranges')
def _(g):
    g = [r[:] for r in g]; m, n = len(g), len(g[0])
    q = deque((i, j, 0) for i in range(m) for j in range(n) if g[i][j] == 2); t = 0
    while q:
        r, c, d = q.popleft(); t = max(t, d)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n and g[nr][nc] == 1:
                g[nr][nc] = 2; q.append((nr, nc, d + 1))
    return -1 if any(1 in r for r in g) else t


@ref('shortest-path-in-binary-matrix')
def _(g):
    n = len(g)
    if g[0][0] or g[n - 1][n - 1]:
        return -1
    q, seen = deque([(0, 0, 1)]), {(0, 0)}
    while q:
        r, c, d = q.popleft()
        if (r, c) == (n - 1, n - 1):
            return d
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and not g[nr][nc] and (nr, nc) not in seen:
                    seen.add((nr, nc)); q.append((nr, nc, d + 1))
    return -1


@ref('course-schedule')
def _(n, pre):
    indeg, adj = [0] * n, defaultdict(list)
    for a, b in pre:
        adj[b].append(a); indeg[a] += 1
    q = deque(i for i in range(n) if indeg[i] == 0); seen = 0
    while q:
        u = q.popleft(); seen += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return seen == n


@ref('network-delay-time')
def _(times, n, k):
    adj = defaultdict(list)
    for u, v, w in times:
        adj[u].append((v, w))
    dist, pq = {}, [(0, k)]
    while pq:
        d, u = heapq.heappop(pq)
        if u in dist:
            continue
        dist[u] = d
        for v, w in adj[u]:
            if v not in dist:
                heapq.heappush(pq, (d + w, v))
    return max(dist.values()) if len(dist) == n else -1


@ref('number-of-provinces')
def _(m):
    n = len(m); seen, cnt = set(), 0
    for i in range(n):
        if i not in seen:
            cnt += 1; st = [i]
            while st:
                u = st.pop()
                if u in seen:
                    continue
                seen.add(u); st += [v for v in range(n) if m[u][v] and v not in seen]
    return cnt


@ref('redundant-connection')
def _(edges):
    parent = list(range(len(edges) + 1))
    def find(x):
        while parent[x] != x:
            x = parent[x]
        return x
    for u, v in edges:
        a, b = find(u), find(v)
        if a == b:
            return [u, v]
        parent[a] = b


@ref('climbing-stairs')
def _(n):
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a


@ref('house-robber')
def _(a):
    p, q = 0, 0
    for x in a:
        p, q = q, max(q, p + x)
    return q


@ref('coin-change')
def _(coins, amt):
    dp = [0] + [float('inf')] * amt
    for a in range(1, amt + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amt] if dp[amt] != float('inf') else -1


@ref('decode-ways')
def _(s):
    @lru_cache(None)
    def f(i):
        if i == len(s):
            return 1
        if s[i] == '0':
            return 0
        r = f(i + 1)
        if i + 1 < len(s) and 10 <= int(s[i:i + 2]) <= 26:
            r += f(i + 2)
        return r
    return f(0)


@ref('word-break')
def _(s, words):
    ws = set(words)
    @lru_cache(None)
    def f(i):
        return i == len(s) or any(s[i:j] in ws and f(j) for j in range(i + 1, len(s) + 1))
    return f(0)


@ref('unique-paths')
def _(m, n):
    from math import comb
    return comb(m + n - 2, m - 1)


@ref('minimum-path-sum')
def _(g):
    m, n = len(g), len(g[0]); dp = [[0] * n for _ in range(m)]
    for i in range(m):
        for j in range(n):
            if i == 0 and j == 0:
                dp[i][j] = g[0][0]
            else:
                dp[i][j] = g[i][j] + min(dp[i - 1][j] if i else float('inf'), dp[i][j - 1] if j else float('inf'))
    return dp[-1][-1]


@ref('longest-common-subsequence')
def _(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a)):
        for j in range(len(b)):
            dp[i + 1][j + 1] = dp[i][j] + 1 if a[i] == b[j] else max(dp[i][j + 1], dp[i + 1][j])
    return dp[-1][-1]


@ref('edit-distance')
def _(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        for j in range(len(b) + 1):
            if i == 0 or j == 0:
                dp[i][j] = i + j
            elif a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[-1][-1]


@ref('longest-increasing-subsequence')
def _(a):
    dp = [1] * len(a)
    for i in range(len(a)):
        for j in range(i):
            if a[j] < a[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)


@ref('partition-equal-subset-sum')
def _(a):
    s = sum(a)
    if s % 2:
        return False
    reach = {0}
    for x in a:
        reach |= {r + x for r in reach}
    return s // 2 in reach


@ref('target-sum')
def _(a, t):
    ways = Counter({0: 1})
    for x in a:
        nw = Counter()
        for s, c in ways.items():
            nw[s + x] += c; nw[s - x] += c
        ways = nw
    return ways[t]


@ref('subsets')
def _(a):
    return [list(c) for r in range(len(a) + 1) for c in combinations(a, r)]


@ref('permutations')
def _(a):
    from itertools import permutations
    return [list(p) for p in permutations(a)]


@ref('combination-sum')
def _(cands, t):
    out = []
    def go(i, rem, cur):
        if rem == 0:
            out.append(cur[:]); return
        for j in range(i, len(cands)):
            if cands[j] <= rem:
                cur.append(cands[j]); go(j, rem - cands[j], cur); cur.pop()
    go(0, t, []); return out


@ref('generate-parentheses')
def _(n):
    out = []
    def go(s, o, c):
        if len(s) == 2 * n:
            out.append(s); return
        if o < n: go(s + '(', o + 1, c)
        if c < o: go(s + ')', o, c + 1)
    go('', 0, 0); return out


@ref('word-search')
def _(b, w):
    m, n = len(b), len(b[0])
    def dfs(r, c, i, used):
        if i == len(w):
            return True
        if not (0 <= r < m and 0 <= c < n) or (r, c) in used or b[r][c] != w[i]:
            return False
        used.add((r, c))
        ok = any(dfs(r + dr, c + dc, i + 1, used) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        used.discard((r, c)); return ok
    return any(dfs(i, j, 0, set()) for i in range(m) for j in range(n))


@ref('n-queens-ii')
def _(n):
    def go(r, cols, d1, d2):
        if r == n:
            return 1
        return sum(go(r + 1, cols | {c}, d1 | {r - c}, d2 | {r + c})
                   for c in range(n) if c not in cols and r - c not in d1 and r + c not in d2)
    return go(0, frozenset(), frozenset(), frozenset())


@ref('single-number')
def _(a):
    return [x for x, c in Counter(a).items() if c == 1][0]


@ref('number-of-1-bits')
def _(n):
    return bin(n).count('1')


@ref('counting-bits')
def _(n):
    return [bin(i).count('1') for i in range(n + 1)]


@ref('missing-number')
def _(a):
    return (set(range(len(a) + 1)) - set(a)).pop()


# ---------- design problems ----------
class MinStack:
    def __init__(self): self.s = []
    def push(self, v): self.s.append(v)
    def pop(self): self.s.pop()
    def top(self): return self.s[-1]
    def getMin(self): return min(self.s)


class RecentCounter:
    def __init__(self): self.q = deque()
    def ping(self, t):
        self.q.append(t)
        while self.q[0] < t - 3000:
            self.q.popleft()
        return len(self.q)


class MedianFinder:
    def __init__(self): self.a = []
    def addNum(self, x): self.a.append(x); self.a.sort()
    def findMedian(self):
        n = len(self.a)
        return float(self.a[n // 2]) if n % 2 else (self.a[n // 2 - 1] + self.a[n // 2]) / 2


class Trie:
    def __init__(self): self.w = set()
    def insert(self, w): self.w.add(w)
    def search(self, w): return w in self.w
    def startsWith(self, p): return any(x.startswith(p) for x in self.w)


class WordDictionary:
    def __init__(self): self.w = set()
    def addWord(self, w): self.w.add(w)
    def search(self, p):
        return any(len(x) == len(p) and all(a == b or b == '.' for a, b in zip(x, p)) for x in self.w)


class LRUCache:
    def __init__(self, cap): self.cap, self.d = cap, OrderedDict()
    def get(self, k):
        if k not in self.d:
            return -1
        self.d.move_to_end(k); return self.d[k]
    def put(self, k, v):
        self.d[k] = v; self.d.move_to_end(k)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)


DESIGN = {c.__name__: c for c in (MinStack, RecentCounter, MedianFinder, Trie, WordDictionary, LRUCache)}


def run_design(ops, args):
    obj = DESIGN[ops[0]](*args[0]); out = [None]
    for op, a in zip(ops[1:], args[1:]):
        out.append(getattr(obj, op)(*a))
    return out


def main():
    problems = json.load(open(sys.argv[1]))
    out, missing = {}, []
    for p in problems:
        if not p.get('builtin'):
            continue
        sig = p['signature']
        res = []
        for t in p['tests']:
            inp = json.loads(json.dumps(t['input']))
            if sig['kind'] == 'design':
                res.append(run_design(*inp))
            elif p['id'] in R:
                res.append(R[p['id']](*inp))
            else:
                missing.append(p['id']); break
        out[p['id']] = res
    if missing:
        print('missing reference for:', missing); sys.exit(1)
    json.dump(out, open(sys.argv[2], 'w'), separators=(',', ':'))
    print(f'wrote expected outputs for {len(out)} problems')


if __name__ == '__main__':
    main()
