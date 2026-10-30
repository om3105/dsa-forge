/* Stage 3 (Build): implement the structure or algorithm from scratch.
   Each task is a judge-ready Problem (skeleton generated from the signature) plus clean reference
   implementations shown after you pass. Expected outputs are produced by running the Python reference
   through the judge (npm run gen:expected); the Java reference is checked against them (npm run verify:problems). */
import type { CompareMode, DesignMethod, Param, Problem, Signature, ValueType } from '../../types';

const params = (spec: string): Param[] => (spec.trim() ? spec.split(',').map((s) => { const [name, type] = s.split(':').map((x) => x.trim()); return { name, type: type as ValueType }; }) : []);
const fn = (name: string, p: string, returns: ValueType): Signature => ({ kind: 'function', name, params: params(p), returns });
const m = (name: string, p: string, returns: ValueType): DesignMethod => ({ name, params: params(p), returns });
const cls = (className: string, ctor: string, methods: DesignMethod[]): Signature => ({ kind: 'design', className, ctor: params(ctor), methods });

export interface BuildTask extends Problem {
  goal: string;
  ref: { python: string; java: string };
}

interface Spec {
  topic: string; title: string; goal: string; statement: string; sig: Signature;
  tests: unknown[][]; samples?: number; compare?: CompareMode; py: string; java: string;
}
const T = (s: Spec): BuildTask => ({
  id: `build-${s.topic}`, title: s.title, topic: s.topic, pattern: 'design', difficulty: 'Easy', summary: s.goal, goal: s.goal,
  statement: s.statement.trim(), signature: s.sig, builtin: true, compare: s.compare ?? 'exact',
  tests: s.tests.map((input, i) => ({ input, sample: i < (s.samples ?? 2) })),
  ref: { python: s.py.trim() + '\n', java: s.java.trim() + '\n' },
});
// design-test helper: ops list + args list
const D = (ops: string[], args: unknown[][]): unknown[] => [ops, args];

export const BUILD_TASKS: BuildTask[] = [
  T({ topic: 'lang-basics', title: 'Second largest value', goal: 'Loops, conditions and sentinels without sorting.',
    statement: 'Return the largest value that is **strictly smaller** than the maximum of `nums`, or `-1` if no such value exists. Do it in one pass without sorting.',
    sig: fn('secondLargest', 'nums:int[]', 'int'),
    tests: [[[3, 1, 4, 1, 5]], [[7, 7, 7]], [[5]], [[-1, -2]], [[2, 9, 9, 4]], [[10, 20]], [[-5, -5, -9, -1]]],
    py: `
def second_largest(nums: list[int]) -> int:
    first = second = None
    for x in nums:
        if first is None or x > first:
            first, second = x, first
        elif x != first and (second is None or x > second):
            second = x
    return -1 if second is None else second`,
    java: `
class Solution {
    public int secondLargest(int[] nums) {
        Integer first = null, second = null;
        for (int x : nums) {
            if (first == null || x > first) { second = first; first = x; }
            else if (x != first && (second == null || x > second)) second = x;
        }
        return second == null ? -1 : second;
    }
}` }),
  T({ topic: 'lang-collections', title: 'Top k words', goal: 'Count with a map, then sort with a custom key.',
    statement: '`text` is lowercase words separated by single spaces. Return the `k` most frequent words, most frequent first; break ties alphabetically.',
    sig: fn('topWords', 'text:string, k:int', 'list<string>'),
    tests: [['the cat and the hat and the bat', 2], ['a b c', 2], ['x x y y z', 3], ['solo', 1], ['b a b a c', 1], ['dog cat dog bird cat dog', 3]],
    py: `
from collections import Counter

def top_words(text: str, k: int) -> list[str]:
    counts = Counter(text.split())
    return sorted(counts, key=lambda w: (-counts[w], w))[:k]`,
    java: `
import java.util.*;

class Solution {
    public List<String> topWords(String text, int k) {
        Map<String, Integer> counts = new HashMap<>();
        for (String w : text.split(" ")) counts.merge(w, 1, Integer::sum);
        List<String> words = new ArrayList<>(counts.keySet());
        words.sort((a, b) -> counts.get(a).equals(counts.get(b)) ? a.compareTo(b) : counts.get(b) - counts.get(a));
        return words.subList(0, Math.min(k, words.size()));
    }
}` }),
  T({ topic: 'complexity', title: 'Max pair product in O(n)', goal: 'Replace an O(n²) pair scan with one pass.',
    statement: 'Return the maximum product of two elements at different indices. Values can be negative and up to 10^5 in magnitude, so the product needs 64 bits. The O(n²) double loop is easy, write the O(n) version that tracks the two largest and two smallest values.',
    sig: fn('maxPairProduct', 'nums:int[]', 'long'),
    tests: [[[1, 5, 3, 4]], [[-10, -3, 5, 2]], [[0, -1]], [[-5, -4, -3]], [[100000, 100000, -1]], [[3, 7]], [[-100000, 1, 99999]]],
    py: `
def max_pair_product(nums: list[int]) -> int:
    hi1 = hi2 = float('-inf')
    lo1 = lo2 = float('inf')
    for x in nums:
        if x > hi1: hi1, hi2 = x, hi1
        elif x > hi2: hi2 = x
        if x < lo1: lo1, lo2 = x, lo1
        elif x < lo2: lo2 = x
    return int(max(hi1 * hi2, lo1 * lo2))`,
    java: `
class Solution {
    public long maxPairProduct(int[] nums) {
        long hi1 = Long.MIN_VALUE, hi2 = Long.MIN_VALUE, lo1 = Long.MAX_VALUE, lo2 = Long.MAX_VALUE;
        for (int x : nums) {
            if (x > hi1) { hi2 = hi1; hi1 = x; } else if (x > hi2) hi2 = x;
            if (x < lo1) { lo2 = lo1; lo1 = x; } else if (x < lo2) lo2 = x;
        }
        return Math.max(hi1 * hi2, lo1 * lo2);
    }
}` }),
  T({ topic: 'arrays', title: 'Dynamic array', goal: 'Build a growable array on top of a fixed-size buffer.',
    statement: `Implement \`DynamicArray\` **without** using the language's growable list for storage: keep a fixed-size buffer and double it when full.
- \`push(val)\` appends; \`pop()\` removes and returns the last value
- \`get(i)\` / \`set(i, val)\` read and write index \`i\` (always valid in the tests)
- \`size()\` returns the number of elements`,
    sig: cls('DynamicArray', '', [m('push', 'val:int', 'void'), m('get', 'i:int', 'int'), m('set', 'i:int, val:int', 'void'), m('pop', '', 'int'), m('size', '', 'int')]),
    tests: [
      D(['DynamicArray', 'push', 'push', 'push', 'get', 'size', 'pop', 'size'], [[], [1], [2], [3], [1], [], [], []]),
      D(['DynamicArray', 'push', 'set', 'get', 'push', 'push', 'push', 'push', 'get', 'size'], [[], [5], [0, 9], [0], [1], [2], [3], [4], [4], []]),
      D(['DynamicArray', 'size', 'push', 'pop', 'size', 'push', 'get'], [[], [], [7], [], [], [8], [0]]),
      D(['DynamicArray', ...Array(20).fill('push'), 'get', 'get', 'size', 'pop', 'pop', 'size'], [[], ...Array.from({ length: 20 }, (_, i) => [i * i]), [19], [7], [], [], [], []]),
    ], samples: 1,
    py: `
class DynamicArray:
    def __init__(self) -> None:
        self._cap = 2
        self._buf = [0] * self._cap
        self._n = 0

    def push(self, val: int) -> None:
        if self._n == self._cap:
            self._cap *= 2
            new = [0] * self._cap
            for i in range(self._n):
                new[i] = self._buf[i]
            self._buf = new
        self._buf[self._n] = val
        self._n += 1

    def get(self, i: int) -> int:
        return self._buf[i]

    def set(self, i: int, val: int) -> None:
        self._buf[i] = val

    def pop(self) -> int:
        self._n -= 1
        return self._buf[self._n]

    def size(self) -> int:
        return self._n`,
    java: `
class DynamicArray {
    private int[] buf = new int[2];
    private int n = 0;

    public DynamicArray() {}

    public void push(int val) {
        if (n == buf.length) {
            int[] bigger = new int[buf.length * 2];
            System.arraycopy(buf, 0, bigger, 0, n);
            buf = bigger;
        }
        buf[n++] = val;
    }

    public int get(int i) { return buf[i]; }

    public void set(int i, int val) { buf[i] = val; }

    public int pop() { return buf[--n]; }

    public int size() { return n; }
}` }),
  T({ topic: 'prefix-sum', title: 'Range sum queries', goal: 'Precompute once, answer every query in O(1).',
    statement: 'Implement `PrefixSums(nums)` with `rangeSum(left, right)` returning the sum of `nums[left..right]` inclusive. Build a prefix array in the constructor so each query is O(1).',
    sig: cls('PrefixSums', 'nums:int[]', [m('rangeSum', 'left:int, right:int', 'int')]),
    tests: [
      D(['PrefixSums', 'rangeSum', 'rangeSum', 'rangeSum'], [[[-2, 0, 3, -5, 2, -1]], [0, 2], [2, 5], [0, 5]]),
      D(['PrefixSums', 'rangeSum', 'rangeSum'], [[[5]], [0, 0], [0, 0]]),
      D(['PrefixSums', 'rangeSum', 'rangeSum', 'rangeSum', 'rangeSum'], [[[1, 2, 3, 4, 5, 6, 7, 8]], [3, 3], [0, 7], [1, 6], [7, 7]]),
    ], samples: 1,
    py: `
class PrefixSums:
    def __init__(self, nums: list[int]) -> None:
        self.pre = [0]
        for x in nums:
            self.pre.append(self.pre[-1] + x)

    def range_sum(self, left: int, right: int) -> int:
        return self.pre[right + 1] - self.pre[left]`,
    java: `
class PrefixSums {
    private final int[] pre;

    public PrefixSums(int[] nums) {
        pre = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) pre[i + 1] = pre[i] + nums[i];
    }

    public int rangeSum(int left, int right) {
        return pre[right + 1] - pre[left];
    }
}` }),
  T({ topic: 'strings', title: 'Run-length encoding', goal: 'Build output efficiently instead of repeated concatenation.',
    statement: 'Compress `s` by replacing each run of the same character with the character followed by the run length; runs of length 1 keep just the character. `"aaabcc"` → `"a3bc2"`. Use a builder (list + join / StringBuilder).',
    sig: fn('compress', 's:string', 'string'),
    tests: [['aaabcc'], ['abc'], [''], ['zzzzzzzzzzzz'], ['aabbaa'], ['a']],
    py: `
def compress(s: str) -> str:
    out, i = [], 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]:
            j += 1
        out.append(s[i])
        if j - i > 1:
            out.append(str(j - i))
        i = j
    return ''.join(out)`,
    java: `
class Solution {
    public String compress(String s) {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        while (i < s.length()) {
            int j = i;
            while (j < s.length() && s.charAt(j) == s.charAt(i)) j++;
            sb.append(s.charAt(i));
            if (j - i > 1) sb.append(j - i);
            i = j;
        }
        return sb.toString();
    }
}` }),
  T({ topic: 'hashing', title: 'Hash map from scratch', goal: 'Buckets, hashing and collision handling.',
    statement: `Implement \`MyHashMap\` for integer keys **without** the built-in map/dict: use an array of buckets (e.g. 1000 buckets of lists) and chaining.
- \`put(key, value)\` inserts or overwrites
- \`get(key)\` returns the value or \`-1\`
- \`remove(key)\` deletes the key if present`,
    sig: cls('MyHashMap', '', [m('put', 'key:int, value:int', 'void'), m('get', 'key:int', 'int'), m('remove', 'key:int', 'void')]),
    tests: [
      D(['MyHashMap', 'put', 'put', 'get', 'get', 'put', 'get', 'remove', 'get'], [[], [1, 1], [2, 2], [1], [3], [2, 1], [2], [2], [2]]),
      D(['MyHashMap', 'put', 'put', 'put', 'get', 'get', 'get', 'remove', 'get', 'get'], [[], [1, 10], [1001, 20], [2001, 30], [1], [1001], [2001], [1001], [1001], [2001]]),
      D(['MyHashMap', 'remove', 'get', 'put', 'put', 'get'], [[], [5], [5], [0, 0], [0, 7], [0]]),
    ], samples: 1,
    py: `
class MyHashMap:
    SIZE = 1000

    def __init__(self) -> None:
        self.buckets = [[] for _ in range(self.SIZE)]

    def _bucket(self, key: int) -> list:
        return self.buckets[key % self.SIZE]

    def put(self, key: int, value: int) -> None:
        b = self._bucket(key)
        for pair in b:
            if pair[0] == key:
                pair[1] = value
                return
        b.append([key, value])

    def get(self, key: int) -> int:
        for k, v in self._bucket(key):
            if k == key:
                return v
        return -1

    def remove(self, key: int) -> None:
        b = self._bucket(key)
        for i, (k, _) in enumerate(b):
            if k == key:
                b.pop(i)
                return`,
    java: `
import java.util.*;

class MyHashMap {
    private static final int SIZE = 1000;
    private final List<int[]>[] buckets;

    @SuppressWarnings("unchecked")
    public MyHashMap() {
        buckets = new List[SIZE];
        for (int i = 0; i < SIZE; i++) buckets[i] = new ArrayList<>();
    }

    private List<int[]> bucket(int key) { return buckets[Math.floorMod(key, SIZE)]; }

    public void put(int key, int value) {
        for (int[] pair : bucket(key)) if (pair[0] == key) { pair[1] = value; return; }
        bucket(key).add(new int[]{key, value});
    }

    public int get(int key) {
        for (int[] pair : bucket(key)) if (pair[0] == key) return pair[1];
        return -1;
    }

    public void remove(int key) {
        bucket(key).removeIf(pair -> pair[0] == key);
    }
}` }),
  T({ topic: 'two-pointers', title: 'Merge two sorted arrays', goal: 'Two read pointers, one output.',
    statement: 'Given two sorted arrays, return one sorted array containing all elements of both, in O(n + m). Do not concatenate and sort.',
    sig: fn('mergeSorted', 'a:int[], b:int[]', 'int[]'),
    tests: [[[1, 3, 5], [2, 4, 6]], [[], [1, 2]], [[1, 1, 2], [1, 3]], [[], []], [[-5, 0, 9], [-6, 10]], [[4], [1, 2, 3]]],
    py: `
def merge_sorted(a: list[int], b: list[int]) -> list[int]:
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out`,
    java: `
class Solution {
    public int[] mergeSorted(int[] a, int[] b) {
        int[] out = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        while (i < a.length && j < b.length) out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
        while (i < a.length) out[k++] = a[i++];
        while (j < b.length) out[k++] = b[j++];
        return out;
    }
}` }),
  T({ topic: 'sliding-window', title: 'Distinct values per window', goal: 'Maintain window state incrementally.',
    statement: 'For every window of size `k` (left to right) return the number of distinct values in it. Update a count map as the window slides instead of recounting.',
    sig: fn('distinctInWindows', 'nums:int[], k:int', 'int[]'),
    tests: [[[1, 2, 1, 3, 4, 2, 3], 4], [[1, 1, 1], 2], [[5], 1], [[1, 2, 3, 4], 4], [[2, 2, 3, 3, 2], 3]],
    py: `
from collections import defaultdict

def distinct_in_windows(nums: list[int], k: int) -> list[int]:
    count = defaultdict(int)
    out = []
    for i, x in enumerate(nums):
        count[x] += 1
        if i >= k:
            old = nums[i - k]
            count[old] -= 1
            if count[old] == 0:
                del count[old]
        if i >= k - 1:
            out.append(len(count))
    return out`,
    java: `
import java.util.*;

class Solution {
    public int[] distinctInWindows(int[] nums, int k) {
        Map<Integer, Integer> count = new HashMap<>();
        int[] out = new int[nums.length - k + 1];
        for (int i = 0; i < nums.length; i++) {
            count.merge(nums[i], 1, Integer::sum);
            if (i >= k) {
                int old = nums[i - k];
                if (count.merge(old, -1, Integer::sum) == 0) count.remove(old);
            }
            if (i >= k - 1) out[i - k + 1] = count.size();
        }
        return out;
    }
}` }),
  T({ topic: 'recursion', title: 'Towers of Hanoi', goal: 'Trust the recursive call on a smaller problem.',
    statement: 'Move `n` disks from peg 1 to peg 3 (peg 2 is spare); a larger disk may never sit on a smaller one. Return the list of moves `[from, to]` in order. Classic solution: move n−1 disks out of the way, move the largest, move the n−1 disks back on top.',
    sig: fn('hanoi', 'n:int', 'int[][]'),
    tests: [[1], [2], [3], [0], [4]],
    py: `
def hanoi(n: int) -> list[list[int]]:
    moves = []
    def move(k: int, src: int, dst: int, spare: int) -> None:
        if k == 0:
            return
        move(k - 1, src, spare, dst)
        moves.append([src, dst])
        move(k - 1, spare, dst, src)
    move(n, 1, 3, 2)
    return moves`,
    java: `
import java.util.*;

class Solution {
    public int[][] hanoi(int n) {
        List<int[]> moves = new ArrayList<>();
        move(n, 1, 3, 2, moves);
        return moves.toArray(new int[0][]);
    }

    private void move(int k, int src, int dst, int spare, List<int[]> moves) {
        if (k == 0) return;
        move(k - 1, src, spare, dst, moves);
        moves.add(new int[]{src, dst});
        move(k - 1, spare, dst, src, moves);
    }
}` }),
  T({ topic: 'sorting', title: 'Quicksort', goal: 'Partition around a pivot and recurse.',
    statement: 'Sort `nums` ascending with **quicksort** (no built-in sort): pick a pivot, partition into smaller / larger parts, recurse. Return the sorted array.',
    sig: fn('quickSort', 'nums:int[]', 'int[]'),
    tests: [[[5, 2, 3, 1]], [[]], [[1]], [[3, 3, 3]], [[9, -2, 7, 0, -2, 5, 1]], [[1, 2, 3, 4, 5, 6]], [[6, 5, 4, 3, 2, 1]]],
    py: `
import random

def quick_sort(nums: list[int]) -> list[int]:
    def sort(lo: int, hi: int) -> None:
        if lo >= hi:
            return
        p = random.randint(lo, hi)
        nums[p], nums[hi] = nums[hi], nums[p]
        pivot, store = nums[hi], lo
        for i in range(lo, hi):
            if nums[i] < pivot:
                nums[i], nums[store] = nums[store], nums[i]
                store += 1
        nums[store], nums[hi] = nums[hi], nums[store]
        sort(lo, store - 1)
        sort(store + 1, hi)
    sort(0, len(nums) - 1)
    return nums`,
    java: `
import java.util.*;

class Solution {
    private final Random rnd = new Random();

    public int[] quickSort(int[] nums) {
        sort(nums, 0, nums.length - 1);
        return nums;
    }

    private void sort(int[] a, int lo, int hi) {
        if (lo >= hi) return;
        swap(a, lo + rnd.nextInt(hi - lo + 1), hi);
        int pivot = a[hi], store = lo;
        for (int i = lo; i < hi; i++) if (a[i] < pivot) swap(a, i, store++);
        swap(a, store, hi);
        sort(a, lo, store - 1);
        sort(a, store + 1, hi);
    }

    private void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
}` }),
  T({ topic: 'binary-search', title: 'Lower bound', goal: 'The one binary search template.',
    statement: 'Return the first index `i` with `nums[i] >= target` in the sorted array `nums`, or `len(nums)` if every element is smaller. Do not use library binary search.',
    sig: fn('lowerBound', 'nums:int[], target:int', 'int'),
    tests: [[[1, 3, 5, 7], 5], [[1, 3, 5, 7], 4], [[1, 3, 5, 7], 9], [[], 1], [[2, 2, 2], 2], [[1, 3, 5, 7], -1], [[1, 2, 2, 2, 3], 2]],
    py: `
def lower_bound(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] >= target:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    java: `
class Solution {
    public int lowerBound(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] >= target) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}` }),
  T({ topic: 'linked-list', title: 'Singly linked list', goal: 'Nodes, head/tail pointers and edge cases.',
    statement: `Implement \`MyLinkedList\` with your own node class.
- \`addFirst(val)\`, \`addLast(val)\`
- \`removeFirst()\` returns the removed value or \`-1\` if empty
- \`get(index)\` returns the value or \`-1\` if out of range
- \`size()\``,
    sig: cls('MyLinkedList', '', [m('addFirst', 'val:int', 'void'), m('addLast', 'val:int', 'void'), m('removeFirst', '', 'int'), m('get', 'index:int', 'int'), m('size', '', 'int')]),
    tests: [
      D(['MyLinkedList', 'addLast', 'addLast', 'addFirst', 'get', 'get', 'size', 'removeFirst', 'get'], [[], [1], [2], [0], [0], [2], [], [], [0]]),
      D(['MyLinkedList', 'removeFirst', 'get', 'size', 'addLast', 'removeFirst', 'removeFirst', 'addLast', 'get'], [[], [], [0], [], [5], [], [], [6], [0]]),
      D(['MyLinkedList', 'addFirst', 'addFirst', 'addLast', 'get', 'get', 'get', 'get', 'size'], [[], [2], [1], [3], [0], [1], [2], [3], []]),
    ], samples: 1,
    py: `
class _Node:
    __slots__ = ('val', 'next')
    def __init__(self, val: int, nxt=None):
        self.val, self.next = val, nxt

class MyLinkedList:
    def __init__(self) -> None:
        self.head = self.tail = None
        self.n = 0

    def add_first(self, val: int) -> None:
        self.head = _Node(val, self.head)
        if self.tail is None:
            self.tail = self.head
        self.n += 1

    def add_last(self, val: int) -> None:
        node = _Node(val)
        if self.tail is None:
            self.head = self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.n += 1

    def remove_first(self) -> int:
        if self.head is None:
            return -1
        val = self.head.val
        self.head = self.head.next
        if self.head is None:
            self.tail = None
        self.n -= 1
        return val

    def get(self, index: int) -> int:
        if index < 0 or index >= self.n:
            return -1
        cur = self.head
        for _ in range(index):
            cur = cur.next
        return cur.val

    def size(self) -> int:
        return self.n`,
    java: `
class MyLinkedList {
    private static class Node {
        int val; Node next;
        Node(int val, Node next) { this.val = val; this.next = next; }
    }
    private Node head, tail;
    private int n;

    public MyLinkedList() {}

    public void addFirst(int val) {
        head = new Node(val, head);
        if (tail == null) tail = head;
        n++;
    }

    public void addLast(int val) {
        Node node = new Node(val, null);
        if (tail == null) head = tail = node;
        else { tail.next = node; tail = node; }
        n++;
    }

    public int removeFirst() {
        if (head == null) return -1;
        int val = head.val;
        head = head.next;
        if (head == null) tail = null;
        n--;
        return val;
    }

    public int get(int index) {
        if (index < 0 || index >= n) return -1;
        Node cur = head;
        for (int i = 0; i < index; i++) cur = cur.next;
        return cur.val;
    }

    public int size() { return n; }
}` }),
  T({ topic: 'stack', title: 'Stack from scratch', goal: 'LIFO on top of an array.',
    statement: `Implement \`MyStack\` using an array (or your own list of nodes), **not** the built-in stack/deque.
- \`push(x)\`; \`pop()\` and \`peek()\` return \`-1\` when empty
- \`isEmpty()\`, \`size()\``,
    sig: cls('MyStack', '', [m('push', 'x:int', 'void'), m('pop', '', 'int'), m('peek', '', 'int'), m('isEmpty', '', 'bool'), m('size', '', 'int')]),
    tests: [
      D(['MyStack', 'push', 'push', 'peek', 'pop', 'pop', 'isEmpty', 'pop'], [[], [1], [2], [], [], [], [], []]),
      D(['MyStack', 'isEmpty', 'peek', 'push', 'size', 'isEmpty'], [[], [], [], [4], [], []]),
      D(['MyStack', ...Array(10).fill('push'), 'size', 'pop', 'pop', 'peek', 'size'], [[], ...Array.from({ length: 10 }, (_, i) => [i]), [], [], [], [], []]),
    ], samples: 1,
    py: `
class MyStack:
    def __init__(self) -> None:
        self._data = [0] * 4
        self._top = 0

    def push(self, x: int) -> None:
        if self._top == len(self._data):
            self._data = self._data + [0] * len(self._data)
        self._data[self._top] = x
        self._top += 1

    def pop(self) -> int:
        if self._top == 0:
            return -1
        self._top -= 1
        return self._data[self._top]

    def peek(self) -> int:
        return -1 if self._top == 0 else self._data[self._top - 1]

    def is_empty(self) -> bool:
        return self._top == 0

    def size(self) -> int:
        return self._top`,
    java: `
class MyStack {
    private int[] data = new int[4];
    private int top = 0;

    public MyStack() {}

    public void push(int x) {
        if (top == data.length) data = java.util.Arrays.copyOf(data, data.length * 2);
        data[top++] = x;
    }

    public int pop() { return top == 0 ? -1 : data[--top]; }

    public int peek() { return top == 0 ? -1 : data[top - 1]; }

    public boolean isEmpty() { return top == 0; }

    public int size() { return top; }
}` }),
  T({ topic: 'monotonic-stack', title: 'Next greater element', goal: 'Pop smaller elements as the answer arrives.',
    statement: 'For each element return the first element to its right that is strictly greater, or `-1`. Use a stack of indices with decreasing values: O(n).',
    sig: fn('nextGreater', 'nums:int[]', 'int[]'),
    tests: [[[2, 1, 2, 4, 3]], [[1, 2, 3]], [[3, 2, 1]], [[5]], [[1, 1, 1]], [[4, 5, 2, 25, 7, 8]]],
    py: `
def next_greater(nums: list[int]) -> list[int]:
    ans = [-1] * len(nums)
    stack = []
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            ans[stack.pop()] = x
        stack.append(i)
    return ans`,
    java: `
import java.util.*;

class Solution {
    public int[] nextGreater(int[] nums) {
        int[] ans = new int[nums.length];
        Arrays.fill(ans, -1);
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < nums.length; i++) {
            while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) ans[stack.pop()] = nums[i];
            stack.push(i);
        }
        return ans;
    }
}` }),
  T({ topic: 'queue', title: 'Circular queue', goal: 'A fixed-size ring buffer with head and count.',
    statement: `Implement \`CircularQueue(capacity)\` with an array ring buffer.
- \`enqueue(x)\` returns \`false\` when full
- \`dequeue()\` and \`front()\` return \`-1\` when empty
- \`size()\``,
    sig: cls('CircularQueue', 'capacity:int', [m('enqueue', 'x:int', 'bool'), m('dequeue', '', 'int'), m('front', '', 'int'), m('size', '', 'int')]),
    tests: [
      D(['CircularQueue', 'enqueue', 'enqueue', 'enqueue', 'enqueue', 'dequeue', 'enqueue', 'front', 'size'], [[3], [1], [2], [3], [4], [], [4], [], []]),
      D(['CircularQueue', 'dequeue', 'front', 'enqueue', 'dequeue', 'dequeue', 'size'], [[1], [], [], [9], [], [], []]),
      D(['CircularQueue', 'enqueue', 'enqueue', 'dequeue', 'enqueue', 'dequeue', 'enqueue', 'dequeue', 'dequeue', 'front'], [[2], [1], [2], [], [3], [], [4], [], [], []]),
    ], samples: 1,
    py: `
class CircularQueue:
    def __init__(self, capacity: int) -> None:
        self.buf = [0] * capacity
        self.head = 0
        self.count = 0

    def enqueue(self, x: int) -> bool:
        if self.count == len(self.buf):
            return False
        self.buf[(self.head + self.count) % len(self.buf)] = x
        self.count += 1
        return True

    def dequeue(self) -> int:
        if self.count == 0:
            return -1
        x = self.buf[self.head]
        self.head = (self.head + 1) % len(self.buf)
        self.count -= 1
        return x

    def front(self) -> int:
        return -1 if self.count == 0 else self.buf[self.head]

    def size(self) -> int:
        return self.count`,
    java: `
class CircularQueue {
    private final int[] buf;
    private int head = 0, count = 0;

    public CircularQueue(int capacity) { buf = new int[capacity]; }

    public boolean enqueue(int x) {
        if (count == buf.length) return false;
        buf[(head + count) % buf.length] = x;
        count++;
        return true;
    }

    public int dequeue() {
        if (count == 0) return -1;
        int x = buf[head];
        head = (head + 1) % buf.length;
        count--;
        return x;
    }

    public int front() { return count == 0 ? -1 : buf[head]; }

    public int size() { return count; }
}` }),
  T({ topic: 'intervals', title: 'Interval intersections', goal: 'Walk two sorted interval lists with two pointers.',
    statement: 'Both lists are sorted and internally non-overlapping (closed intervals). Return their intersection list: every `[lo, hi]` covered by both. Advance whichever interval ends first.',
    sig: fn('intervalIntersections', 'a:int[][], b:int[][]', 'int[][]'),
    tests: [[[[0, 2], [5, 10], [13, 23], [24, 25]], [[1, 5], [8, 12], [15, 24], [25, 26]]], [[[1, 3], [5, 9]], []], [[[1, 7]], [[3, 10]]], [[[1, 2]], [[3, 4]]], [[[1, 5]], [[5, 6]]]],
    py: `
def interval_intersections(a: list[list[int]], b: list[list[int]]) -> list[list[int]]:
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        lo = max(a[i][0], b[j][0])
        hi = min(a[i][1], b[j][1])
        if lo <= hi:
            out.append([lo, hi])
        if a[i][1] < b[j][1]:
            i += 1
        else:
            j += 1
    return out`,
    java: `
import java.util.*;

class Solution {
    public int[][] intervalIntersections(int[][] a, int[][] b) {
        List<int[]> out = new ArrayList<>();
        int i = 0, j = 0;
        while (i < a.length && j < b.length) {
            int lo = Math.max(a[i][0], b[j][0]), hi = Math.min(a[i][1], b[j][1]);
            if (lo <= hi) out.add(new int[]{lo, hi});
            if (a[i][1] < b[j][1]) i++; else j++;
        }
        return out.toArray(new int[0][]);
    }
}` }),
  T({ topic: 'trees', title: 'All three DFS traversals', goal: 'Pre-, in- and post-order by recursion.',
    statement: 'Return `[preorder, inorder, postorder]` value lists for the binary tree.',
    sig: fn('traversals', 'root:TreeNode', 'list<list<int>>'),
    tests: [[[1, 2, 3, 4, 5]], [[]], [[1]], [[1, null, 2, 3]], [[4, 2, 6, 1, 3, 5, 7]]],
    py: `
def traversals(root: TreeNode | None) -> list[list[int]]:
    pre, ino, post = [], [], []
    def dfs(node):
        if not node:
            return
        pre.append(node.val)
        dfs(node.left)
        ino.append(node.val)
        dfs(node.right)
        post.append(node.val)
    dfs(root)
    return [pre, ino, post]`,
    java: `
import java.util.*;

class Solution {
    private final List<Integer> pre = new ArrayList<>(), in = new ArrayList<>(), post = new ArrayList<>();

    public List<List<Integer>> traversals(TreeNode root) {
        dfs(root);
        return Arrays.asList(pre, in, post);
    }

    private void dfs(TreeNode node) {
        if (node == null) return;
        pre.add(node.val);
        dfs(node.left);
        in.add(node.val);
        dfs(node.right);
        post.add(node.val);
    }
}` }),
  T({ topic: 'bst', title: 'Binary search tree', goal: 'Insert and search by comparing and going left or right.',
    statement: `Implement \`BST\` with your own node class.
- \`insert(val)\` (ignore duplicates)
- \`contains(val)\`
- \`inorder()\` returns all values in sorted order`,
    sig: cls('BST', '', [m('insert', 'val:int', 'void'), m('contains', 'val:int', 'bool'), m('inorder', '', 'list<int>')]),
    tests: [
      D(['BST', 'insert', 'insert', 'insert', 'contains', 'contains', 'inorder'], [[], [5], [3], [8], [3], [4], []]),
      D(['BST', 'inorder', 'contains', 'insert', 'insert', 'inorder'], [[], [], [1], [2], [2], []]),
      D(['BST', 'insert', 'insert', 'insert', 'insert', 'insert', 'insert', 'contains', 'contains', 'inorder'], [[], [50], [30], [70], [20], [40], [60], [60], [65], []]),
    ], samples: 1,
    py: `
class _Node:
    def __init__(self, val: int):
        self.val, self.left, self.right = val, None, None

class BST:
    def __init__(self) -> None:
        self.root = None

    def insert(self, val: int) -> None:
        if self.root is None:
            self.root = _Node(val)
            return
        cur = self.root
        while True:
            if val == cur.val:
                return
            side = 'left' if val < cur.val else 'right'
            nxt = getattr(cur, side)
            if nxt is None:
                setattr(cur, side, _Node(val))
                return
            cur = nxt

    def contains(self, val: int) -> bool:
        cur = self.root
        while cur:
            if val == cur.val:
                return True
            cur = cur.left if val < cur.val else cur.right
        return False

    def inorder(self) -> list[int]:
        out = []
        def go(node):
            if node:
                go(node.left); out.append(node.val); go(node.right)
        go(self.root)
        return out`,
    java: `
import java.util.*;

class BST {
    private static class Node {
        int val; Node left, right;
        Node(int val) { this.val = val; }
    }
    private Node root;

    public BST() {}

    public void insert(int val) { root = insert(root, val); }

    private Node insert(Node node, int val) {
        if (node == null) return new Node(val);
        if (val < node.val) node.left = insert(node.left, val);
        else if (val > node.val) node.right = insert(node.right, val);
        return node;
    }

    public boolean contains(int val) {
        Node cur = root;
        while (cur != null) {
            if (val == cur.val) return true;
            cur = val < cur.val ? cur.left : cur.right;
        }
        return false;
    }

    public List<Integer> inorder() {
        List<Integer> out = new ArrayList<>();
        walk(root, out);
        return out;
    }

    private void walk(Node node, List<Integer> out) {
        if (node == null) return;
        walk(node.left, out);
        out.add(node.val);
        walk(node.right, out);
    }
}` }),
  T({ topic: 'heaps', title: 'Binary min-heap', goal: 'Sift up on push, sift down on pop.',
    statement: `Implement \`MinHeap\` on an array **without** heapq / PriorityQueue. Children of \`i\` are \`2i+1\` and \`2i+2\`.
- \`push(x)\`; \`pop()\` and \`peek()\` return \`-1\` when empty
- \`size()\``,
    sig: cls('MinHeap', '', [m('push', 'x:int', 'void'), m('pop', '', 'int'), m('peek', '', 'int'), m('size', '', 'int')]),
    tests: [
      D(['MinHeap', 'push', 'push', 'push', 'peek', 'pop', 'pop', 'pop', 'pop'], [[], [5], [1], [3], [], [], [], [], []]),
      D(['MinHeap', 'peek', 'push', 'size', 'pop', 'size'], [[], [], [7], [], [], []]),
      D(['MinHeap', 'push', 'push', 'push', 'push', 'push', 'push', 'push', 'pop', 'pop', 'pop', 'push', 'pop', 'size'], [[], [9], [4], [7], [1], [8], [2], [6], [], [], [], [0], [], []]),
    ], samples: 1,
    py: `
class MinHeap:
    def __init__(self) -> None:
        self.a = []

    def push(self, x: int) -> None:
        a = self.a
        a.append(x)
        i = len(a) - 1
        while i > 0 and a[(i - 1) // 2] > a[i]:
            p = (i - 1) // 2
            a[i], a[p] = a[p], a[i]
            i = p

    def pop(self) -> int:
        a = self.a
        if not a:
            return -1
        top = a[0]
        last = a.pop()
        if a:
            a[0] = last
            i = 0
            while True:
                l, r, smallest = 2 * i + 1, 2 * i + 2, i
                if l < len(a) and a[l] < a[smallest]: smallest = l
                if r < len(a) and a[r] < a[smallest]: smallest = r
                if smallest == i:
                    break
                a[i], a[smallest] = a[smallest], a[i]
                i = smallest
        return top

    def peek(self) -> int:
        return self.a[0] if self.a else -1

    def size(self) -> int:
        return len(self.a)`,
    java: `
class MinHeap {
    private int[] a = new int[8];
    private int n = 0;

    public MinHeap() {}

    public void push(int x) {
        if (n == a.length) a = java.util.Arrays.copyOf(a, n * 2);
        a[n] = x;
        int i = n++;
        while (i > 0 && a[(i - 1) / 2] > a[i]) { swap(i, (i - 1) / 2); i = (i - 1) / 2; }
    }

    public int pop() {
        if (n == 0) return -1;
        int top = a[0];
        a[0] = a[--n];
        int i = 0;
        while (true) {
            int l = 2 * i + 1, r = 2 * i + 2, s = i;
            if (l < n && a[l] < a[s]) s = l;
            if (r < n && a[r] < a[s]) s = r;
            if (s == i) break;
            swap(i, s);
            i = s;
        }
        return top;
    }

    public int peek() { return n == 0 ? -1 : a[0]; }

    public int size() { return n; }

    private void swap(int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
}` }),
  T({ topic: 'graphs', title: 'BFS order', goal: 'Adjacency list + queue + visited set.',
    statement: 'Undirected graph with nodes `0..n-1` and `edges[i] = [u, v]`. Return the BFS visiting order from `start`, exploring neighbours in **ascending** order. Unreachable nodes are not listed.',
    sig: fn('bfsOrder', 'n:int, edges:int[][], start:int', 'list<int>'),
    tests: [[5, [[0, 1], [0, 2], [1, 3], [2, 4]], 0], [4, [[0, 1], [2, 3]], 2], [1, [], 0], [6, [[0, 5], [0, 1], [1, 5], [5, 4], [1, 2], [2, 3]], 0], [3, [[0, 1], [1, 2], [2, 0]], 1]],
    py: `
from collections import deque

def bfs_order(n: int, edges: list[list[int]], start: int) -> list[int]:
    graph = [[] for _ in range(n)]
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)
    for nbrs in graph:
        nbrs.sort()
    seen = {start}
    order, q = [], deque([start])
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            if v not in seen:
                seen.add(v)
                q.append(v)
    return order`,
    java: `
import java.util.*;

class Solution {
    public List<Integer> bfsOrder(int n, int[][] edges, int start) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] e : edges) { g.get(e[0]).add(e[1]); g.get(e[1]).add(e[0]); }
        for (List<Integer> nbrs : g) Collections.sort(nbrs);
        boolean[] seen = new boolean[n];
        List<Integer> order = new ArrayList<>();
        Deque<Integer> q = new ArrayDeque<>();
        q.offer(start);
        seen[start] = true;
        while (!q.isEmpty()) {
            int u = q.poll();
            order.add(u);
            for (int v : g.get(u)) if (!seen[v]) { seen[v] = true; q.offer(v); }
        }
        return order;
    }
}` }),
  T({ topic: 'topo-sort', title: "Kahn's algorithm", goal: 'In-degrees and a ready set.',
    statement: 'Directed graph `0..n-1`, `edges[i] = [u, v]` means u must come before v. Return a topological order, always taking the **smallest** ready node next (so the answer is unique). Return `[]` if there is a cycle.',
    sig: fn('topoOrder', 'n:int, edges:int[][]', 'list<int>'),
    tests: [[4, [[1, 0], [2, 0], [3, 1], [3, 2]]], [3, [[0, 1], [1, 2], [2, 0]]], [3, []], [5, [[0, 3], [1, 3], [3, 4], [2, 4]]], [2, [[1, 0]]]],
    py: `
import heapq

def topo_order(n: int, edges: list[list[int]]) -> list[int]:
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indeg[v] += 1
    ready = [i for i in range(n) if indeg[i] == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        u = heapq.heappop(ready)
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(ready, v)
    return order if len(order) == n else []`,
    java: `
import java.util.*;

class Solution {
    public List<Integer> topoOrder(int n, int[][] edges) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        int[] indeg = new int[n];
        for (int[] e : edges) { g.get(e[0]).add(e[1]); indeg[e[1]]++; }
        PriorityQueue<Integer> ready = new PriorityQueue<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) ready.offer(i);
        List<Integer> order = new ArrayList<>();
        while (!ready.isEmpty()) {
            int u = ready.poll();
            order.add(u);
            for (int v : g.get(u)) if (--indeg[v] == 0) ready.offer(v);
        }
        return order.size() == n ? order : new ArrayList<>();
    }
}` }),
  T({ topic: 'shortest-path', title: "Dijkstra's algorithm", goal: 'Min-heap of (distance, node) with stale-entry skipping.',
    statement: 'Directed graph `0..n-1` with `edges[i] = [u, v, w]` (w ≥ 0). Return the shortest distance from `src` to every node, `-1` where unreachable.',
    sig: fn('dijkstra', 'n:int, edges:int[][], src:int', 'int[]'),
    tests: [[4, [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1]], 0], [3, [[0, 1, 5]], 0], [1, [], 0], [3, [[1, 2, 1]], 0], [5, [[0, 1, 10], [0, 2, 3], [2, 1, 4], [1, 3, 2], [2, 3, 8], [3, 4, 7]], 0]],
    py: `
import heapq

def dijkstra(n: int, edges: list[list[int]], src: int) -> list[int]:
    graph = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w))
    dist = [-1] * n
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if dist[u] != -1:
            continue          # already finalised
        dist[u] = d
        for v, w in graph[u]:
            if dist[v] == -1:
                heapq.heappush(heap, (d + w, v))
    return dist`,
    java: `
import java.util.*;

class Solution {
    public int[] dijkstra(int n, int[][] edges, int src) {
        List<List<int[]>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] e : edges) g.get(e[0]).add(new int[]{e[1], e[2]});
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.offer(new int[]{0, src});
        while (!pq.isEmpty()) {
            int[] top = pq.poll();
            int d = top[0], u = top[1];
            if (dist[u] != -1) continue;
            dist[u] = d;
            for (int[] e : g.get(u)) if (dist[e[0]] == -1) pq.offer(new int[]{d + e[1], e[0]});
        }
        return dist;
    }
}` }),
  T({ topic: 'union-find', title: 'Union-Find', goal: 'Path compression and union by size.',
    statement: `Implement \`UnionFind(n)\` for elements \`0..n-1\`.
- \`union(a, b)\` merges the sets; returns \`false\` if already connected
- \`connected(a, b)\`
- \`count()\` returns the number of sets`,
    sig: cls('UnionFind', 'n:int', [m('union', 'a:int, b:int', 'bool'), m('connected', 'a:int, b:int', 'bool'), m('count', '', 'int')]),
    tests: [
      D(['UnionFind', 'union', 'union', 'connected', 'connected', 'count', 'union'], [[5], [0, 1], [1, 2], [0, 2], [0, 3], [], [2, 0]]),
      D(['UnionFind', 'count', 'connected', 'union', 'count'], [[1], [], [0, 0], [0, 0], []]),
      D(['UnionFind', 'union', 'union', 'union', 'union', 'connected', 'connected', 'count'], [[6], [0, 1], [2, 3], [4, 5], [1, 3], [0, 2], [0, 5], []]),
    ], samples: 1,
    py: `
class UnionFind:
    def __init__(self, n: int) -> None:
        self.parent = list(range(n))
        self.size = [1] * n
        self.sets = n

    def _find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> bool:
        ra, rb = self._find(a), self._find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        self.sets -= 1
        return True

    def connected(self, a: int, b: int) -> bool:
        return self._find(a) == self._find(b)

    def count(self) -> int:
        return self.sets`,
    java: `
class UnionFind {
    private final int[] parent, size;
    private int sets;

    public UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        sets = n;
    }

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
        sets--;
        return true;
    }

    public boolean connected(int a, int b) { return find(a) == find(b); }

    public int count() { return sets; }
}` }),
  T({ topic: 'greedy', title: 'Making change greedily', goal: 'A greedy rule that is provably safe for this coin system.',
    statement: 'Coins are 25, 10, 5 and 1. Return how many of each coin `[c25, c10, c5, c1]` make `amount` with the fewest coins. (Largest-first is optimal for this coin system, but not for every system.)',
    sig: fn('makeChange', 'amount:int', 'int[]'),
    tests: [[41], [0], [99], [5], [30], [4]],
    py: `
def make_change(amount: int) -> list[int]:
    out = []
    for coin in (25, 10, 5, 1):
        out.append(amount // coin)
        amount %= coin
    return out`,
    java: `
class Solution {
    public int[] makeChange(int amount) {
        int[] coins = {25, 10, 5, 1}, out = new int[4];
        for (int i = 0; i < 4; i++) { out[i] = amount / coins[i]; amount %= coins[i]; }
        return out;
    }
}` }),
  T({ topic: 'dp-1d', title: 'Ways to climb with given steps', goal: 'State, transition, base case, order.',
    statement: 'You can climb any step size listed in `steps` (positive, distinct). Return the number of ordered ways to reach exactly step `n` (n ≤ 30). `dp[0] = 1`.',
    sig: fn('countWays', 'n:int, steps:int[]', 'int'),
    tests: [[4, [1, 2]], [0, [1, 2]], [5, [1, 3, 5]], [7, [2]], [30, [1, 2, 3]], [10, [3, 4]]],
    py: `
def count_ways(n: int, steps: list[int]) -> int:
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        for s in steps:
            if s <= i:
                dp[i] += dp[i - s]
    return dp[n]`,
    java: `
class Solution {
    public int countWays(int n, int[] steps) {
        int[] dp = new int[n + 1];
        dp[0] = 1;
        for (int i = 1; i <= n; i++)
            for (int s : steps)
                if (s <= i) dp[i] += dp[i - s];
        return dp[n];
    }
}` }),
  T({ topic: 'dp-2d', title: 'Longest common substring', goal: 'A two-index table over prefixes.',
    statement: 'Return the length of the longest **contiguous** substring that appears in both `a` and `b`. `dp[i][j]` = length of the common suffix of `a[:i]` and `b[:j]`.',
    sig: fn('longestCommonSubstring', 'a:string, b:string', 'int'),
    tests: [['abcdxyz', 'xyzabcd'], ['abc', 'def'], ['', 'abc'], ['zxabcdezy', 'yzabcdezx'], ['aaaa', 'aa']],
    py: `
def longest_common_substring(a: str, b: str) -> int:
    best = 0
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                best = max(best, dp[i][j])
    return best`,
    java: `
class Solution {
    public int longestCommonSubstring(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        int best = 0;
        for (int i = 1; i <= a.length(); i++)
            for (int j = 1; j <= b.length(); j++)
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                    best = Math.max(best, dp[i][j]);
                }
        return best;
    }
}` }),
  T({ topic: 'dp-knapsack', title: '0/1 knapsack', goal: 'Take or skip each item; iterate capacity downward.',
    statement: 'Item `i` has `weights[i]` and `values[i]`. Each item can be taken at most once. Return the maximum total value with total weight ≤ `capacity`.',
    sig: fn('knapsack', 'weights:int[], values:int[], capacity:int', 'int'),
    tests: [[[1, 3, 4, 5], [1, 4, 5, 7], 7], [[5], [10], 4], [[], [], 10], [[2, 2, 2], [3, 3, 3], 6], [[10, 20, 30], [60, 100, 120], 50]],
    py: `
def knapsack(weights: list[int], values: list[int], capacity: int) -> int:
    dp = [0] * (capacity + 1)
    for w, v in zip(weights, values):
        for c in range(capacity, w - 1, -1):
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[capacity]`,
    java: `
class Solution {
    public int knapsack(int[] weights, int[] values, int capacity) {
        int[] dp = new int[capacity + 1];
        for (int i = 0; i < weights.length; i++)
            for (int c = capacity; c >= weights[i]; c--)
                dp[c] = Math.max(dp[c], dp[c - weights[i]] + values[i]);
        return dp[capacity];
    }
}` }),
  T({ topic: 'backtracking', title: 'Combinations', goal: 'Choose, explore, un-choose with a start index.',
    statement: 'Return all combinations of `k` numbers chosen from `1..n` (any order).',
    sig: fn('combine', 'n:int, k:int', 'list<list<int>>'), compare: 'nested-unordered',
    tests: [[4, 2], [1, 1], [3, 3], [5, 3], [3, 0]],
    py: `
def combine(n: int, k: int) -> list[list[int]]:
    out, path = [], []
    def go(start: int) -> None:
        if len(path) == k:
            out.append(path[:])
            return
        for x in range(start, n + 1):
            path.append(x)
            go(x + 1)
            path.pop()
    go(1)
    return out`,
    java: `
import java.util.*;

class Solution {
    public List<List<Integer>> combine(int n, int k) {
        List<List<Integer>> out = new ArrayList<>();
        go(1, n, k, new ArrayList<>(), out);
        return out;
    }

    private void go(int start, int n, int k, List<Integer> path, List<List<Integer>> out) {
        if (path.size() == k) { out.add(new ArrayList<>(path)); return; }
        for (int x = start; x <= n; x++) {
            path.add(x);
            go(x + 1, n, k, path, out);
            path.remove(path.size() - 1);
        }
    }
}` }),
  T({ topic: 'tries', title: 'Prefix counter trie', goal: 'Nodes with children and counters.',
    statement: `Implement \`PrefixCounter\` as a trie (lowercase words).
- \`insert(word)\` (the same word may be inserted more than once)
- \`countWord(word)\`: how many times exactly this word was inserted
- \`countPrefix(prefix)\`: how many inserted words start with \`prefix\``,
    sig: cls('PrefixCounter', '', [m('insert', 'word:string', 'void'), m('countWord', 'word:string', 'int'), m('countPrefix', 'prefix:string', 'int')]),
    tests: [
      D(['PrefixCounter', 'insert', 'insert', 'insert', 'countWord', 'countPrefix', 'countPrefix'], [[], ['apple'], ['app'], ['apple'], ['apple'], ['app'], ['b']]),
      D(['PrefixCounter', 'countWord', 'countPrefix', 'insert', 'countPrefix', 'countWord'], [[], ['a'], ['a'], ['a'], [''], ['a']]),
      D(['PrefixCounter', 'insert', 'insert', 'insert', 'countPrefix', 'countPrefix', 'countWord', 'countWord'], [[], ['car'], ['cart'], ['care'], ['car'], ['cart'], ['car'], ['ca']]),
    ], samples: 1,
    py: `
class _Node:
    __slots__ = ('kids', 'prefix', 'end')
    def __init__(self):
        self.kids = {}
        self.prefix = 0
        self.end = 0

class PrefixCounter:
    def __init__(self) -> None:
        self.root = _Node()

    def insert(self, word: str) -> None:
        node = self.root
        node.prefix += 1
        for ch in word:
            node = node.kids.setdefault(ch, _Node())
            node.prefix += 1
        node.end += 1

    def _walk(self, s: str):
        node = self.root
        for ch in s:
            node = node.kids.get(ch)
            if node is None:
                return None
        return node

    def count_word(self, word: str) -> int:
        node = self._walk(word)
        return node.end if node else 0

    def count_prefix(self, prefix: str) -> int:
        node = self._walk(prefix)
        return node.prefix if node else 0`,
    java: `
class PrefixCounter {
    private final PrefixCounter[] kids = new PrefixCounter[26];
    private int prefix, end;

    public PrefixCounter() {}

    public void insert(String word) {
        PrefixCounter node = this;
        node.prefix++;
        for (char c : word.toCharArray()) {
            if (node.kids[c - 'a'] == null) node.kids[c - 'a'] = new PrefixCounter();
            node = node.kids[c - 'a'];
            node.prefix++;
        }
        node.end++;
    }

    private PrefixCounter walk(String s) {
        PrefixCounter node = this;
        for (char c : s.toCharArray()) {
            node = node.kids[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }

    public int countWord(String word) { PrefixCounter n = walk(word); return n == null ? 0 : n.end; }

    public int countPrefix(String prefix) { PrefixCounter n = walk(prefix); return n == null ? 0 : n.prefix; }
}` }),
  T({ topic: 'bits', title: 'Subsets by bitmask', goal: 'Masks, shifts and testing bits.',
    statement: 'Return all subsets of `nums` by iterating masks `0..2^n - 1`: bit `i` of the mask decides whether `nums[i]` is included (any order).',
    sig: fn('subsetsByMask', 'nums:int[]', 'list<list<int>>'), compare: 'nested-unordered',
    tests: [[[1, 2, 3]], [[]], [[7]], [[4, 5]], [[1, 2, 3, 4]]],
    py: `
def subsets_by_mask(nums: list[int]) -> list[list[int]]:
    n = len(nums)
    out = []
    for mask in range(1 << n):
        out.append([nums[i] for i in range(n) if (mask >> i) & 1])
    return out`,
    java: `
import java.util.*;

class Solution {
    public List<List<Integer>> subsetsByMask(int[] nums) {
        int n = nums.length;
        List<List<Integer>> out = new ArrayList<>();
        for (int mask = 0; mask < (1 << n); mask++) {
            List<Integer> sub = new ArrayList<>();
            for (int i = 0; i < n; i++) if (((mask >> i) & 1) == 1) sub.add(nums[i]);
            out.add(sub);
        }
        return out;
    }
}` }),
];

export const BUILD_BY_TOPIC: Record<string, BuildTask> = Object.fromEntries(BUILD_TASKS.map((t) => [t.topic, t]));
export const BUILD_BY_ID: Record<string, BuildTask> = Object.fromEntries(BUILD_TASKS.map((t) => [t.id, t]));
