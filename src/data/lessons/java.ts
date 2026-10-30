import type { LanguagePack } from './types';

export const JAVA: LanguagePack = {
  name: 'Java',
  foundations: {
    'lang-basics': {
      intro: `Java is verbose but predictable: static types catch many mistakes before you run, and the Collections Framework gives you every data structure you need. This lesson covers the syntax and OOP you need for interview code. Type each snippet into the scratchpad and run it.`,
      sections: [
        {
          title: 'Program structure',
          body: `Every program is a class; execution starts at \`public static void main(String[] args)\`. In this app's problems you write a \`Solution\` class (like LeetCode) and the judge calls your method. In the scratchpad, write a \`public class Main\`.`,
          code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] nums = {4, 1, 3};
        System.out.println(sum(nums));
    }

    static int sum(int[] a) {
        int s = 0;
        for (int x : a) s += x;
        return s;
    }
}`,
        },
        {
          title: 'Primitive types and overflow',
          body: `\`int\` is 32-bit (about ±2.1 × 10^9) and **silently overflows**. Use \`long\` for sums of many ints, products, or anything that can exceed 2^31. Integer division truncates toward zero; \`%\` keeps the sign of the dividend. \`Integer.MAX_VALUE\` / \`MIN_VALUE\` are common sentinels.`,
          code: `int big = Integer.MAX_VALUE;
System.out.println(big + 1);          // -2147483648 (overflow!)
long ok = (long) big + 1;             // cast BEFORE adding
System.out.println(-7 / 2 + " " + -7 % 2);  // -3 -1
int mid = lo + (hi - lo) / 2;         // overflow-safe midpoint`,
        },
        {
          title: 'OOP basics you will actually use',
          body: `Classes hold fields and methods; constructors initialise fields. Use \`private\` fields and small helper methods. Static nested classes are handy for nodes (\`static class Node\`). Interfaces like \`Comparable<T>\` let your objects define their natural order.`,
          code: `class Point implements Comparable<Point> {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    int distSq() { return x * x + y * y; }

    @Override
    public int compareTo(Point o) { return Integer.compare(distSq(), o.distSq()); }
}`,
        },
        {
          title: 'Strings and StringBuilder',
          body: `\`String\` is immutable; \`+\` in a loop creates a new string each time. Use \`StringBuilder\` and call \`toString()\` once. Compare strings with \`.equals()\`, never \`==\`. \`s.charAt(i)\`, \`s.toCharArray()\`, \`s.substring(a, b)\` (end exclusive).`,
          code: `StringBuilder sb = new StringBuilder();
for (char c : "hello".toCharArray()) sb.append(Character.toUpperCase(c));
String out = sb.reverse().toString();     // "OLLEH"
boolean same = out.equals("OLLEH");        // true
int digit = '7' - '0';                     // 7`,
        },
        {
          title: 'Fast input with BufferedReader',
          body: `\`Scanner\` is convenient but slow for large inputs (10^5+ numbers). In online assessments, read with \`BufferedReader\` + \`StringTokenizer\` and write with \`StringBuilder\` / \`PrintWriter\`.`,
          code: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            int x = Integer.parseInt(st.nextToken());
            out.append(x * 2).append('\\n');
        }
        System.out.print(out);
    }
}`,
        },
      ],
      cards: [
        { front: 'Java: what does Integer.MAX_VALUE + 1 evaluate to?', back: 'Integer.MIN_VALUE (-2147483648): silent overflow. Use long.' },
        { front: 'Overflow-safe binary search midpoint in Java?', back: 'int mid = lo + (hi - lo) / 2;' },
        { front: 'Java: how should you compare two Strings?', back: 'a.equals(b). == compares references.' },
        { front: 'Java: fast way to read large input?', back: 'BufferedReader + StringTokenizer (Scanner is slow).' },
        { front: 'Java: how do you build a string in a loop efficiently?', back: 'StringBuilder.append(...) then toString() once.' },
      ],
    },
    'lang-collections': {
      intro: `The Collections Framework is your toolbox. Program to interfaces (\`List\`, \`Map\`, \`Deque\`) and pick the implementation for the costs you need. Collections hold objects, so primitives are boxed into wrapper classes (\`Integer\`, \`Long\`, \`Character\`).`,
      sections: [
        {
          title: 'Arrays and the Arrays utility class',
          body: `Fixed size, fast, primitive-friendly. \`Arrays.sort\` (dual-pivot quicksort for primitives), \`Arrays.fill\`, \`Arrays.toString\` for debugging, \`Arrays.asList\` (fixed-size view!). Sorting \`int[]\` with a comparator is not possible. Use \`Integer[]\` or sort \`int[][]\` rows.`,
          code: `int[] a = {3, 1, 2};
Arrays.sort(a);
int[][] intervals = {{1, 3}, {0, 2}};
Arrays.sort(intervals, (x, y) -> Integer.compare(x[0], y[0]));
int[] dp = new int[10];
Arrays.fill(dp, Integer.MAX_VALUE);
System.out.println(Arrays.toString(a));`,
        },
        {
          title: 'ArrayList, HashMap, HashSet',
          body: `\`ArrayList\`: dynamic array, O(1) amortized \`add\`, O(1) \`get\`, O(n) \`remove(0)\` and \`contains\`. \`HashMap\`/\`HashSet\`: O(1) average. Useful map methods: \`getOrDefault\`, \`merge\`, \`computeIfAbsent\`, \`putIfAbsent\`.`,
          code: `List<Integer> list = new ArrayList<>();
list.add(5);
Map<Character, Integer> count = new HashMap<>();
for (char c : "banana".toCharArray()) count.merge(c, 1, Integer::sum);
Map<String, List<String>> groups = new HashMap<>();
groups.computeIfAbsent("key", k -> new ArrayList<>()).add("word");
Set<Integer> seen = new HashSet<>();
if (!seen.add(3)) System.out.println("duplicate");`,
        },
        {
          title: 'TreeMap and TreeSet, sorted maps',
          body: `Red-black trees: O(log n) operations, keys kept in order. Navigation methods are interview gold: \`floorKey\`, \`ceilingKey\`, \`firstKey\`, \`lastKey\`, \`headMap\`, \`tailMap\`, \`pollFirst\`.`,
          code: `TreeMap<Integer, String> tm = new TreeMap<>();
tm.put(10, "a"); tm.put(20, "b");
Integer le = tm.floorKey(15);     // 10
Integer ge = tm.ceilingKey(15);   // 20 (null if none)`,
        },
        {
          title: 'ArrayDeque, stack and queue',
          body: `Use \`ArrayDeque\` for both stacks and queues (\`Stack\` and \`LinkedList\` are legacy/slower). Queue: \`offer\` / \`poll\` / \`peek\`. Stack: \`push\` / \`pop\` / \`peek\`. It does not allow \`null\` elements.`,
          code: `Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); stack.push(2);
int top = stack.pop();            // 2

Deque<int[]> queue = new ArrayDeque<>();
queue.offer(new int[]{0, 0});
int[] cell = queue.poll();`,
        },
        {
          title: 'PriorityQueue, Comparator and Comparable',
          body: `\`PriorityQueue\` is a **min-heap** by natural order. Pass a \`Comparator\` for anything else: \`Collections.reverseOrder()\` for a max-heap, or a lambda. Use \`Integer.compare(a, b)\` instead of \`a - b\` to avoid overflow.`,
          code: `PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<int[]> byDist = new PriorityQueue<>((p, q) -> Integer.compare(p[0], q[0]));
PriorityQueue<int[]> twoKeys = new PriorityQueue<>(
    Comparator.<int[]>comparingInt(p -> p[0]).thenComparingInt(p -> p[1]));
minHeap.offer(5); minHeap.offer(1);
System.out.println(minHeap.poll());   // 1`,
        },
        {
          title: 'Generics and wrapper classes',
          body: `Generic types work only with objects: \`List<Integer>\`, not \`List<int>\`. Autoboxing converts automatically, but **\`==\` on two \`Integer\` objects compares references** (works for -128..127 because of caching, then breaks). Use \`.equals()\` or unbox with \`.intValue()\`.`,
          code: `Integer a = 1000, b = 1000;
System.out.println(a == b);          // false!
System.out.println(a.equals(b));     // true
List<int[]> pairs = new ArrayList<>();   // arrays are objects, fine`,
        },
      ],
      cards: [
        { front: 'Which Java class gives a min-heap?', back: 'PriorityQueue (natural order).' },
        { front: 'How do you make a max-heap in Java?', back: 'new PriorityQueue<>(Collections.reverseOrder()) or a comparator (a, b) -> Integer.compare(b, a).' },
        { front: 'Which Java class should you use for a stack or queue?', back: 'ArrayDeque (push/pop for stack, offer/poll for queue).' },
        { front: 'Java: why is (a, b) -> a - b a risky comparator?', back: 'a - b can overflow for large magnitudes. Use Integer.compare(a, b).' },
        { front: 'TreeMap method for "largest key ≤ x"?', back: 'floorKey(x) (ceilingKey for smallest ≥ x).' },
        { front: 'Java: Integer a = 1000, b = 1000; a == b?', back: 'false, compares references. Use equals().' },
        { front: 'HashMap one-liner to increment a count?', back: 'map.merge(key, 1, Integer::sum) or map.put(k, map.getOrDefault(k, 0) + 1).' },
      ],
    },
  },

  lessons: {
    complexity: {
      notes: [
        'Hidden O(n) operations in Java: `ArrayList.remove(0)`, `list.contains`, `String.substring` (copies), `s1 + s2` in a loop, `Arrays.asList(...).contains`.',
        'Java runs roughly 10^8 simple operations per second once the JIT warms up, O(n^2) with n = 10^4 is usually fine, n = 10^5 is not.',
        '`Arrays.sort(int[])` is quicksort-based: O(n log n) average, adversarial O(n^2) inputs exist. `Arrays.sort(Object[])`/`Collections.sort` use Timsort (stable, O(n log n)).',
      ],
    },
    arrays: {
      templateTitle: "Kadane's algorithm",
      template: `class Solution {
    public int maxSubArray(int[] nums) {
        int best = nums[0], cur = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);   // extend or restart
            best = Math.max(best, cur);
        }
        return best;
    }
}`,
      notes: ['Use `long` for running sums that may exceed ~2·10^9.', '`int[] copy = nums.clone();` or `Arrays.copyOf(nums, n)` for copies.'],
    },
    'prefix-sum': {
      templateTitle: 'Prefix sum + HashMap',
      template: `class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);                       // empty prefix
        int sum = 0, count = 0;
        for (int x : nums) {
            sum += x;
            count += seen.getOrDefault(sum - k, 0);
            seen.merge(sum, 1, Integer::sum);
        }
        return count;
    }
}`,
      notes: ['Prefix arrays of size n + 1 (`long[] pre = new long[n + 1]`) avoid the i = 0 special case.'],
    },
    strings: {
      templateTitle: 'Counting chars and StringBuilder',
      template: `class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) if (c != 0) return false;
        return true;
    }

    public String reverseWords(String s) {
        String[] words = s.trim().split("\\\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - 1; i >= 0; i--) {
            sb.append(words[i]);
            if (i > 0) sb.append(' ');
        }
        return sb.toString();
    }
}`,
      notes: [
        '`split("\\\\s+")` after `trim()` handles multiple spaces; `split(" ")` leaves empty strings.',
        '`Character.isLetterOrDigit`, `Character.toLowerCase` work on chars.',
        '`String.valueOf(charArray)` / `new String(chars)` turns a sorted char array back into a key.',
      ],
    },
    hashing: {
      templateTitle: 'Complement lookup and grouping',
      template: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> indexOf = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            Integer j = indexOf.get(target - nums[i]);
            if (j != null) return new int[]{j, i};
            indexOf.put(nums[i], i);
        }
        return new int[0];
    }

    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            char[] c = s.toCharArray();
            Arrays.sort(c);
            groups.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}`,
      notes: [
        'Arrays do not override equals/hashCode, `int[]` keys compare by identity. Use `String`, `List<Integer>`, or encode as a long.',
        '`Set.add` returns false if already present, a one-step duplicate check.',
      ],
      cards: [{ front: 'Java: can int[] be used as a HashMap key?', back: 'Technically yes, but it hashes by identity, so equal contents are different keys. Use a String / List / encoded long.' }],
    },
    'two-pointers': {
      templateTitle: 'Opposite-end pointers',
      template: `class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int lo = 0, hi = numbers.length - 1;
        while (lo < hi) {
            int sum = numbers[lo] + numbers[hi];
            if (sum == target) return new int[]{lo + 1, hi + 1};
            if (sum < target) lo++;
            else hi--;
        }
        return new int[0];
    }

    public void moveZeroes(int[] nums) {
        int write = 0;
        for (int x : nums) if (x != 0) nums[write++] = x;
        while (write < nums.length) nums[write++] = 0;
    }
}`,
      notes: ['`Arrays.asList(a, b, c)` is a quick way to build a triplet `List<Integer>` for 3Sum results.'],
    },
    'sliding-window': {
      templateTitle: 'Variable-size window',
      template: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] last = new int[128];
        Arrays.fill(last, -1);
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (last[c] >= left) left = last[c] + 1;   // shrink past the repeat
            last[c] = right;
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}`,
      notes: ['For ASCII strings an `int[128]` is faster and simpler than a `HashMap<Character, Integer>`.'],
    },
    recursion: {
      templateTitle: 'Recursion and memoization',
      template: `class Solution {
    public double myPow(double x, int n) {
        long e = n;                    // -2^31 cannot be negated as int
        if (e < 0) { x = 1 / x; e = -e; }
        return pow(x, e);
    }

    private double pow(double x, long e) {
        if (e == 0) return 1.0;
        double half = pow(x, e / 2);
        return (e % 2 == 0) ? half * half : half * half * x;
    }

    private final Map<Integer, Integer> memo = new HashMap<>();

    public int ways(int n) {
        if (n <= 1) return 1;
        Integer cached = memo.get(n);
        if (cached != null) return cached;
        int r = ways(n - 1) + ways(n - 2);
        memo.put(n, r);
        return r;
    }
}`,
      notes: [
        'Negating `Integer.MIN_VALUE` overflows back to itself, widen to `long` first.',
        'A `StackOverflowError` usually means a missing base case; the default stack handles roughly 10^4 frames of a simple method.',
        'For memo tables over small ranges, an `int[]`/`Integer[]` array beats a HashMap.',
      ],
      cards: [{ front: 'Java: why use long when negating n in pow(x, n)?', back: '-Integer.MIN_VALUE overflows back to Integer.MIN_VALUE.' }],
    },
    sorting: {
      templateTitle: 'Merge sort and comparators',
      template: `class Solution {
    public int[] sortArray(int[] nums) {
        mergeSort(nums, new int[nums.length], 0, nums.length - 1);
        return nums;
    }

    private void mergeSort(int[] a, int[] tmp, int lo, int hi) {
        if (lo >= hi) return;
        int mid = lo + (hi - lo) / 2;
        mergeSort(a, tmp, lo, mid);
        mergeSort(a, tmp, mid + 1, hi);
        int i = lo, j = mid + 1, k = lo;
        while (i <= mid && j <= hi) tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
        while (i <= mid) tmp[k++] = a[i++];
        while (j <= hi) tmp[k++] = a[j++];
        System.arraycopy(tmp, lo, a, lo, hi - lo + 1);
    }
}

// Comparators
// Arrays.sort(intervals, (x, y) -> Integer.compare(x[0], y[0]));
// list.sort(Comparator.comparingInt((int[] p) -> -p[1]).thenComparing(p -> p[0]));
// Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));   // largest number`,
      notes: [
        'You cannot pass a comparator to `Arrays.sort(int[])`. Box to `Integer[]` or sort an `int[][]`.',
        'Never write `(a, b) -> a - b` for arbitrary ints; use `Integer.compare`.',
      ],
    },
    'binary-search': {
      templateTitle: 'Lower-bound template and search on answer',
      template: `class Solution {
    int lowerBound(int[] nums, int target) {
        int lo = 0, hi = nums.length;          // answer in [lo, hi]
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] >= target) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long hours = 0;                      // can exceed int
            for (int p : piles) hours += (p + mid - 1) / mid;
            if (hours <= h) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}`,
      notes: ['`Arrays.binarySearch` returns `-(insertionPoint) - 1` when not found and any index among duplicates, usually write your own.', 'Accumulate feasibility counts in `long`.'],
    },
    'linked-list': {
      templateTitle: 'Reverse, dummy head, fast/slow',
      template: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, cur = head;
        while (cur != null) {
            ListNode next = cur.next;
            cur.next = prev;
            prev = cur;
            cur = next;
        }
        return prev;
    }

    public ListNode middleNode(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }

    public ListNode mergeTwoLists(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(0), tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = (a != null) ? a : b;
        return dummy.next;
    }
}`,
      notes: ['`LinkedHashMap` with `accessOrder = true` and `removeEldestEntry` is a built-in LRU, know the manual doubly-linked-list version for interviews.'],
    },
    stack: {
      templateTitle: 'ArrayDeque as a stack',
      template: `class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '[') stack.push(']');
            else if (c == '{') stack.push('}');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
      notes: ['`Stack<E>` extends `Vector` (synchronized, legacy). Prefer `Deque<E> stack = new ArrayDeque<>()`.', 'Java `/` already truncates toward zero, which is what RPN wants.'],
    },
    'monotonic-stack': {
      templateTitle: 'Next greater element with an index stack',
      template: `class Solution {
    public int[] dailyTemperatures(int[] temps) {
        int n = temps.length;
        int[] ans = new int[n];
        int[] stack = new int[n];      // array-backed stack of indices
        int top = -1;
        for (int i = 0; i < n; i++) {
            while (top >= 0 && temps[stack[top]] < temps[i]) {
                int j = stack[top--];
                ans[j] = i - j;
            }
            stack[++top] = i;
        }
        return ans;
    }
}`,
      notes: ['An `int[]` with a top pointer avoids boxing and is noticeably faster than `ArrayDeque<Integer>`.'],
    },
    queue: {
      templateTitle: 'Monotonic deque',
      template: `class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        Deque<Integer> dq = new ArrayDeque<>();     // indices, values decreasing
        int[] out = new int[nums.length - k + 1];
        for (int i = 0; i < nums.length; i++) {
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
            dq.offerLast(i);
            if (dq.peekFirst() <= i - k) dq.pollFirst();
            if (i >= k - 1) out[i - k + 1] = nums[dq.peekFirst()];
        }
        return out;
    }
}`,
      notes: ['`offer/poll/peek` return null/false on failure; `add/remove/element` throw. Pick one style and stay consistent.'],
    },
    intervals: {
      templateTitle: 'Merge intervals',
      template: `class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : intervals) {
            if (!merged.isEmpty() && iv[0] <= merged.get(merged.size() - 1)[1]) {
                int[] last = merged.get(merged.size() - 1);
                last[1] = Math.max(last[1], iv[1]);
            } else {
                merged.add(iv);
            }
        }
        return merged.toArray(new int[0][]);
    }
}`,
      notes: ['`list.toArray(new int[0][])` converts a `List<int[]>` back to `int[][]`.'],
    },
    trees: {
      templateTitle: 'DFS returning a value + BFS by levels',
      template: `class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }

    private int best = 0;                         // global answer as a field

    public int diameterOfBinaryTree(TreeNode root) {
        height(root);
        return best;
    }

    private int height(TreeNode node) {
        if (node == null) return 0;
        int l = height(node.left), r = height(node.right);
        best = Math.max(best, l + r);
        return 1 + Math.max(l, r);
    }

    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        if (root == null) return out;
        Deque<TreeNode> q = new ArrayDeque<>();
        q.offer(root);
        while (!q.isEmpty()) {
            List<Integer> level = new ArrayList<>();
            for (int size = q.size(); size > 0; size--) {
                TreeNode node = q.poll();
                level.add(node.val);
                if (node.left != null) q.offer(node.left);
                if (node.right != null) q.offer(node.right);
            }
            out.add(level);
        }
        return out;
    }
}`,
      notes: ['Lambdas cannot assign local variables. Keep a global answer as a field or in a one-element array `int[] best = {0}`.', 'Read `q.size()` once before the level loop; it changes as you add children.'],
    },
    bst: {
      templateTitle: 'Validate with long/nullable bounds',
      template: `class Solution {
    public boolean isValidBST(TreeNode root) {
        return ok(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    private boolean ok(TreeNode node, long low, long high) {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;
        return ok(node.left, low, node.val) && ok(node.right, node.val, high);
    }

    public int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (node != null || !stack.isEmpty()) {
            while (node != null) { stack.push(node); node = node.left; }
            node = stack.pop();
            if (--k == 0) return node.val;
            node = node.right;
        }
        return -1;
    }
}`,
      notes: ['Using `Integer.MIN_VALUE`/`MAX_VALUE` as bounds fails when a node holds exactly that value. Use `long` or `Integer` nulls.'],
    },
    heaps: {
      templateTitle: 'Top-k with PriorityQueue',
      template: `class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();    // min-heap of size k
        for (int x : nums) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();
        }
        return heap.peek();
    }

    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int s : stones) heap.offer(s);
        while (heap.size() > 1) {
            int y = heap.poll(), x = heap.poll();
            if (y != x) heap.offer(y - x);
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }

    public ListNode mergeKLists(ListNode[] lists) {
        PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));
        for (ListNode n : lists) if (n != null) pq.offer(n);
        ListNode dummy = new ListNode(0), tail = dummy;
        while (!pq.isEmpty()) {
            ListNode n = pq.poll();
            tail.next = n; tail = n;
            if (n.next != null) pq.offer(n.next);
        }
        return dummy.next;
    }
}`,
      notes: [
        '`PriorityQueue` iteration order is NOT sorted, only `poll()` returns elements in order.',
        '`remove(Object)` is O(n); use lazy deletion for "remove arbitrary" requirements.',
      ],
    },
    graphs: {
      templateTitle: 'Adjacency list and grid BFS',
      template: `class Solution {
    List<List<Integer>> build(int n, int[][] edges) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] e : edges) { g.get(e[0]).add(e[1]); g.get(e[1]).add(e[0]); }
        return g;
    }

    static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    int[][] bfsGrid(int[][] grid, int sr, int sc) {
        int rows = grid.length, cols = grid[0].length;
        int[][] dist = new int[rows][cols];
        for (int[] row : dist) Arrays.fill(row, -1);
        Deque<int[]> q = new ArrayDeque<>();
        dist[sr][sc] = 0;
        q.offer(new int[]{sr, sc});
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            for (int[] d : DIRS) {
                int r = cur[0] + d[0], c = cur[1] + d[1];
                if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] != 0 || dist[r][c] != -1) continue;
                dist[r][c] = dist[cur[0]][cur[1]] + 1;    // mark when pushing
                q.offer(new int[]{r, c});
            }
        }
        return dist;
    }
}`,
      notes: ['`List<Integer>[] g = new ArrayList[n];` works but generates an unchecked warning, `List<List<Integer>>` is cleaner.', 'Encode a cell as `r * cols + c` to store it in an `int` set/queue.'],
    },
    'topo-sort': {
      templateTitle: "Kahn's algorithm",
      template: `class Solution {
    public int[] findOrder(int n, int[][] prerequisites) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        int[] indeg = new int[n];
        for (int[] p : prerequisites) {      // p[1] -> p[0]
            g.get(p[1]).add(p[0]);
            indeg[p[0]]++;
        }
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
        int[] order = new int[n];
        int idx = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            order[idx++] = u;
            for (int v : g.get(u)) if (--indeg[v] == 0) q.offer(v);
        }
        return idx == n ? order : new int[0];
    }
}`,
      notes: [],
    },
    'shortest-path': {
      templateTitle: 'Dijkstra with PriorityQueue<int[]>',
      template: `class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
        List<List<int[]>> g = new ArrayList<>();
        for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
        for (int[] t : times) g.get(t[0]).add(new int[]{t[1], t[2]});
        int[] dist = new int[n + 1];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[k] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.offer(new int[]{0, k});
        while (!pq.isEmpty()) {
            int[] top = pq.poll();
            int d = top[0], u = top[1];
            if (d > dist[u]) continue;           // stale
            for (int[] e : g.get(u)) {
                int nd = d + e[1];
                if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.offer(new int[]{nd, e[0]}); }
            }
        }
        int ans = 0;
        for (int i = 1; i <= n; i++) {
            if (dist[i] == Integer.MAX_VALUE) return -1;
            ans = Math.max(ans, dist[i]);
        }
        return ans;
    }
}`,
      notes: ['Adding to `Integer.MAX_VALUE` overflows, check reachability before adding, or use `long` distances.'],
    },
    'union-find': {
      templateTitle: 'Union-Find',
      template: `class DSU {
    private final int[] parent, size;

    DSU(int n) {
        parent = new int[n];
        size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];      // path halving
            x = parent[x];
        }
        return x;
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }
}`,
      notes: ['Keep DSU as a small top-level or static nested class, interviewers like seeing the abstraction.'],
    },
    greedy: {
      templateTitle: 'Farthest reach / earliest end',
      template: `class Solution {
    public boolean canJump(int[] nums) {
        int farthest = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > farthest) return false;
            farthest = Math.max(farthest, i + nums[i]);
        }
        return true;
    }

    public int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
        int kept = 0;
        long end = Long.MIN_VALUE;
        for (int[] iv : intervals) {
            if (iv[0] >= end) { kept++; end = iv[1]; }
        }
        return intervals.length - kept;
    }
}`,
      notes: [],
    },
    'dp-1d': {
      templateTitle: 'Bottom-up 1D DP',
      template: `class Solution {
    public int rob(int[] nums) {
        int prev2 = 0, prev1 = 0;
        for (int x : nums) {
            int cur = Math.max(prev1, prev2 + x);
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }

    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);           // "infinity" that cannot overflow
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
      notes: ['Using `Integer.MAX_VALUE` as infinity and then adding 1 overflows. Use `amount + 1` or `Integer.MAX_VALUE / 2`.', 'Memo with `Integer[] memo` (null = not computed) instead of a sentinel value.'],
      cards: [{ front: 'Java DP: safe "infinity" for coin change?', back: 'amount + 1 (or Integer.MAX_VALUE / 2) so that +1 cannot overflow.' }],
    },
    'dp-2d': {
      templateTitle: 'Two-string DP table',
      template: `class Solution {
    public int longestCommonSubsequence(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;
                else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return dp[m][n];
    }
}`,
      notes: ['`new int[m + 1][n + 1]` is zero-filled, convenient base cases.'],
    },
    'dp-knapsack': {
      templateTitle: '0/1 knapsack and LIS',
      template: `class Solution {
    public boolean canPartition(int[] nums) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % 2 != 0) return false;
        int target = total / 2;
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;
        for (int x : nums)
            for (int s = target; s >= x; s--)      // backwards: each item once
                dp[s] = dp[s] || dp[s - x];
        return dp[target];
    }

    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];
        int len = 0;
        for (int x : nums) {
            int lo = 0, hi = len;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < x) lo = mid + 1; else hi = mid;
            }
            tails[lo] = x;
            if (lo == len) len++;
        }
        return len;
    }
}`,
      notes: ['`java.util.BitSet` can speed up subset-sum with shifts, but the boolean array is what interviewers expect.'],
    },
    backtracking: {
      templateTitle: 'Choose / explore / un-choose',
      template: `class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> out = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), out);
        return out;
    }

    private void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> out) {
        out.add(new ArrayList<>(path));                 // copy!
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);
            backtrack(nums, i + 1, path, out);
            path.remove(path.size() - 1);               // un-choose
        }
    }
}`,
      notes: [
        '`path.remove(path.size() - 1)` removes by index; `path.remove(Integer.valueOf(x))` removes by value. Mixing these up with `List<Integer>` is a classic bug.',
        'Use `StringBuilder.setLength(len)` / `deleteCharAt` to undo string choices.',
      ],
      cards: [{ front: 'Java: list.remove(1) on a List<Integer> removes what?', back: 'The element at index 1 (remove(int)), not the value 1. Use remove(Integer.valueOf(1)) for the value.' }],
    },
    tries: {
      templateTitle: 'Trie with an array of 26 children',
      template: `class Trie {
    private final Trie[] next = new Trie[26];
    private boolean end;

    public Trie() {}

    public void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.next[i] == null) node.next[i] = new Trie();
            node = node.next[i];
        }
        node.end = true;
    }

    public boolean search(String word) {
        Trie node = walk(word);
        return node != null && node.end;
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;
    }

    private Trie walk(String s) {
        Trie node = this;
        for (char c : s.toCharArray()) {
            node = node.next[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }
}`,
      notes: ['Array children are fastest for lowercase letters; use `HashMap<Character, Node>` for larger alphabets.'],
    },
    bits: {
      templateTitle: 'Bit tricks',
      template: `class Solution {
    public int singleNumber(int[] nums) {
        int x = 0;
        for (int n : nums) x ^= n;
        return x;
    }

    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) {
            n &= n - 1;            // drop lowest set bit
            count++;
        }
        return count;              // or Integer.bitCount(n)
    }

    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;
            a ^= b;
            b = carry;
        }
        return a;
    }
}`,
      notes: ['`>>` is arithmetic (keeps the sign), `>>>` is logical (fills with 0). For unsigned treatment of negative ints use `>>>`.', '`Integer.bitCount`, `Integer.toBinaryString`, `Long.numberOfTrailingZeros` are handy.'],
      cards: [{ front: 'Java: difference between >> and >>>?', back: '>> is arithmetic (sign-extending); >>> is logical (fills with zeros).' }],
    },
  },

  gotchas: [
    {
      title: 'Integer overflow',
      body: '`int` silently wraps around at 2^31 - 1. Sums, products and "infinity + 1" overflow without any error.',
      bad: `int sum = 0;
for (int x : nums) sum += x;          // may overflow
int mid = (lo + hi) / 2;               // overflow when lo + hi > 2^31 - 1`,
      good: `long sum = 0;
for (int x : nums) sum += x;
int mid = lo + (hi - lo) / 2;
long product = (long) a * b;           // cast BEFORE multiplying`,
    },
    {
      title: '== vs .equals()',
      body: '`==` compares references for objects. Strings and boxed numbers that "look equal" may be different objects.',
      bad: `if (s == "abc") ...
Integer a = 1000, b = 1000;
a == b;   // false`,
      good: `if (s.equals("abc")) ...
a.equals(b);   // true
Objects.equals(x, y);  // null-safe`,
    },
    {
      title: 'Integer caching (-128..127)',
      body: 'Small boxed Integers are cached, so `==` happens to work in small tests and fails for bigger values. Comparing `map.get(a) == map.get(b)` is a famous bug.',
      bad: `if (countA.get(c) == countB.get(c)) ...`,
      good: `if (countA.get(c).equals(countB.get(c))) ...
if (countA.get(c).intValue() == countB.get(c)) ...`,
    },
    {
      title: 'Comparator subtraction overflow',
      body: '`(a, b) -> a - b` overflows when values have large magnitudes of opposite sign, giving a wrong order.',
      bad: `Arrays.sort(arr, (a, b) -> a[0] - b[0]);`,
      good: `Arrays.sort(arr, (a, b) -> Integer.compare(a[0], b[0]));
Arrays.sort(arr, Comparator.comparingInt(a -> a[0]));`,
    },
    {
      title: 'Arrays.asList returns a fixed-size list',
      body: 'You can set elements but not add or remove. That throws UnsupportedOperationException. Also, `Arrays.asList(int[])` gives a `List<int[]>` with one element.',
      bad: `List<Integer> l = Arrays.asList(1, 2);
l.add(3);                // throws`,
      good: `List<Integer> l = new ArrayList<>(Arrays.asList(1, 2));
l.add(3);`,
    },
    {
      title: 'List<Integer>.remove(int) vs remove(Object)',
      body: '`remove(1)` removes the element at index 1. To remove the value 1, box it.',
      good: `list.remove(list.size() - 1);       // by index (backtracking undo)
list.remove(Integer.valueOf(1));     // by value`,
    },
    {
      title: 'Using Stack and LinkedList for stacks/queues',
      body: '`Stack` is synchronized legacy code; `LinkedList` allocates a node per element. `ArrayDeque` is faster for both roles.',
      good: `Deque<Integer> stack = new ArrayDeque<>();
Deque<Integer> queue = new ArrayDeque<>();`,
    },
    {
      title: 'ConcurrentModificationException',
      body: 'Modifying a collection while iterating it with for-each throws. Use an Iterator\'s remove, removeIf, or collect changes first.',
      bad: `for (Integer x : list) if (x == 0) list.remove(x);`,
      good: `list.removeIf(x -> x == 0);`,
    },
    {
      title: 'char arithmetic surprises',
      body: '`char + int` is an int, and `"" + c1 + c2` vs `c1 + c2` behave differently.',
      bad: `char c = 'a';
System.out.println(c + 1);      // 98`,
      good: `System.out.println((char) (c + 1));   // b
int idx = c - 'a';`,
    },
    {
      title: 'Negating Integer.MIN_VALUE',
      body: '`-Integer.MIN_VALUE == Integer.MIN_VALUE` and `Math.abs(Integer.MIN_VALUE)` is negative.',
      good: `long n = x;      // widen first
if (n < 0) n = -n;`,
    },
    {
      title: 'Scanner is slow',
      body: 'For 10^5+ input tokens, `Scanner` can time out on its own. Use BufferedReader + StringTokenizer and build output with StringBuilder.',
    },
    {
      title: 'Generics and arrays of generics',
      body: '`new List<Integer>[n]` is illegal; `new ArrayList[n]` compiles with an unchecked warning. Prefer `List<List<Integer>>`.',
      good: `List<List<Integer>> g = new ArrayList<>();
for (int i = 0; i < n; i++) g.add(new ArrayList<>());`,
    },
  ],
};
