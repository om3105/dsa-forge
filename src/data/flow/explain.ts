/* Beginner-first explanations shown in the Understand, Visualize and Pattern stages.
   Plain language, small numbers, one idea at a time. Language-neutral unless noted (Python / Java names given side by side). */

export interface Explain {
  /** the whole topic in one plain sentence */
  oneLiner: string;
  /** why you should care: what problems it makes easy */
  whyCare: string;
  /** jargon defined in everyday words */
  terms: [string, string][];
  /** a tiny example traced by hand, one step per line */
  example: { title: string; steps: string[]; takeaway: string };
  /** mistakes in understanding (not code bugs) that beginners usually make */
  confusions: string[];
  /** what to look at in the Stage 2 animation */
  watch: string;
  /** the template explained line by line, in words */
  templateSteps: string[];
  /** problem phrase → why it points to this pattern */
  recognize: [string, string][];
}

export const EXPLAIN: Record<string, Explain> = {
  'lang-basics': {
    oneLiner: 'Before learning algorithms you need to write, run and fix small programs without thinking about the syntax.',
    whyCare: 'In an interview the clock is running. If you have to stop and remember how a loop or a function works, you lose the time you need for the actual problem.',
    terms: [
      ['Variable', 'A name for a value, like a labelled box. total = 0 puts 0 in the box called total.'],
      ['Loop', 'Code that repeats. "for each number in the list, do this".'],
      ['Function / method', 'A named piece of code that takes inputs (parameters) and gives back an output (return value).'],
      ['Integer division', 'Division that throws away the decimal part. 7 divided by 2 becomes 3.'],
      ['stdin', '"Standard input": where a program reads its input from, usually text typed or piped in.'],
    ],
    example: {
      title: 'Trace a loop that adds up [4, 1, 3]',
      steps: [
        'Start: total = 0.',
        'First number is 4 → total = 0 + 4 = 4.',
        'Next number is 1 → total = 4 + 1 = 5.',
        'Next number is 3 → total = 5 + 3 = 8.',
        'No numbers left → the loop ends and we return 8.',
      ],
      takeaway: 'When your output looks wrong, trace it like this, one line per step.',
    },
    confusions: [
      'Printing a value is not the same as returning it. The judge reads what your function returns.',
      'Integer division behaves differently with negative numbers in Python (rounds down: -7 // 2 = -4) and Java (rounds toward zero: -7 / 2 = -3).',
      'In Java an int can silently overflow past about 2.1 billion. In Python integers never overflow.',
    ],
    watch: '',
    templateSteps: [],
    recognize: [],
  },
  'lang-collections': {
    oneLiner: 'Every solution is built from a handful of containers: lists, maps, sets, queues and heaps. Know what each is good at and what each costs.',
    whyCare: 'Many problems get easy once you pick the right container. "Have I seen this before?" is slow to check in a list and instant in a set.',
    terms: [
      ['List / array (Python list, Java ArrayList)', 'Items in order, reachable by position. Fast to add at the end, slow to insert at the front.'],
      ['Map / dictionary (dict, HashMap)', 'Pairs of key → value. Look up a value by its key in about one step.'],
      ['Set (set, HashSet)', 'A bag of unique items. Answers "is x in here?" in about one step.'],
      ['Queue / deque (deque, ArrayDeque)', 'A line: add at the back, take from the front. A deque lets you use both ends.'],
      ['Heap (heapq, PriorityQueue)', 'Always hands you the smallest item first, even as items keep arriving.'],
    ],
    example: {
      title: 'Is there a duplicate in [5, 3, 8, 3]?',
      steps: [
        'Make an empty set: seen = {}.',
        '5: not in seen → add it. seen = {5}.',
        '3: not in seen → add it. seen = {5, 3}.',
        '8: not in seen → add it. seen = {5, 3, 8}.',
        '3: already in seen → duplicate found. Answer: yes.',
      ],
      takeaway: 'Checking a set takes one step no matter how big it is. Checking a list would mean scanning it every time.',
    },
    confusions: [
      'A heap is not fully sorted. It only guarantees the smallest item is on top.',
      'Removing from the front of a Python list (pop(0)) or a Java ArrayList (remove(0)) shifts every other item, which is slow. Use a deque.',
      'Map keys must not change. In Python use tuples, not lists, as keys; in Java, do not use arrays as keys.',
    ],
    watch: '',
    templateSteps: [],
    recognize: [],
  },
  complexity: {
    oneLiner: 'Big-O describes how much slower your code gets as the input grows, so you can tell if it will finish in time before you write it.',
    whyCare: 'Most "wrong" interview solutions are actually correct but too slow. Big-O tells you which approach is fast enough just from the input size.',
    terms: [
      ['n', 'The size of the input, e.g. how many numbers are in the array.'],
      ['O(1)', 'Constant: the same amount of work no matter how big n is.'],
      ['O(n)', 'Linear: double the input, roughly double the time. One pass over the data.'],
      ['O(n²)', 'Quadratic: double the input, four times the time. Usually a loop inside a loop.'],
      ['O(log n)', 'Logarithmic: each step cuts the problem in half. Even a billion items need only about 30 steps.'],
    ],
    example: {
      title: 'Is O(n²) fast enough when n = 100,000?',
      steps: [
        'A judge does roughly 10⁸ (100 million) simple steps per second.',
        'O(n²) means about n × n = 100,000 × 100,000 = 10¹⁰ steps.',
        '10¹⁰ is 100 times more than 10⁸ → about 100 seconds. Too slow.',
        'O(n log n) means about 100,000 × 17 ≈ 1.7 million steps → a few milliseconds. Fine.',
      ],
      takeaway: 'Read the input limits first. n ≤ 10⁵ almost always means you need O(n log n) or O(n).',
    },
    confusions: [
      'Big-O ignores constants: 3n and n are both O(n). It is about growth, not exact time.',
      'Two loops one after the other are O(n + n) = O(n). Only a loop inside a loop multiplies.',
      'Space counts the extra memory you create, including the stack used by recursion.',
    ],
    watch: '',
    templateSteps: [],
    recognize: [],
  },
  arrays: {
    oneLiner: 'An array is a row of numbered boxes. Most array problems are solved in one left-to-right pass while remembering a little information.',
    whyCare: 'Arrays are the input of most interview problems. Learning to answer questions in a single pass turns slow O(n²) ideas into O(n).',
    terms: [
      ['Index', 'The position of an item, starting at 0. In [7, 2, 9], index 2 holds 9.'],
      ['Subarray', 'A slice of consecutive items, like [2, 9] from [7, 2, 9]. No gaps allowed.'],
      ['In place', 'Changing the given array directly instead of creating a new one.'],
      ['Running value', 'Something you update as you walk the array: the sum so far, the smallest so far, the best so far.'],
    ],
    example: {
      title: 'Best subarray sum in [-2, 3, -1, 4] (Kadane\'s idea)',
      steps: [
        'Rule: at each number, either continue the current run or start a new run here, whichever is bigger.',
        '-2: start a run → current = -2, best = -2.',
        '3: continuing gives -2 + 3 = 1, starting fresh gives 3 → start fresh. current = 3, best = 3.',
        '-1: continuing gives 3 - 1 = 2, starting fresh gives -1 → continue. current = 2, best = 3.',
        '4: continuing gives 2 + 4 = 6, starting fresh gives 4 → continue. current = 6, best = 6.',
        'Answer: 6, from the subarray [3, -1, 4].',
      ],
      takeaway: 'A bad prefix (negative running sum) can only hurt what comes after it, so you drop it and restart.',
    },
    confusions: [
      'A subarray must be contiguous. A subsequence can skip items. That is a different (often DP) problem.',
      'Starting "best" at 0 breaks when every number is negative. Start with the first element.',
    ],
    watch: 'Watch the highlighted run grow, and notice the exact moment it resets: that is when the running sum would have made things worse.',
    templateSteps: [
      'Set current and best to the first element.',
      'For every later element x: current becomes the larger of x alone or current + x.',
      'After each step, best becomes the larger of best and current.',
      'Return best. One pass, two variables.',
    ],
    recognize: [
      ['"maximum sum of a contiguous subarray"', 'Contiguous + best sum is exactly Kadane\'s extend-or-restart choice.'],
      ['"buy once and sell later for max profit"', 'Keep the cheapest price so far; each day ask "what if I sell today?"'],
      ['"do it in place with O(1) extra space"', 'You need index tricks on the given array rather than a new structure.'],
    ],
  },
  'prefix-sum': {
    oneLiner: 'Write down the running total once; then the sum of any slice is just one subtraction.',
    whyCare: 'Questions about sums of slices ("how many subarrays add up to k?") go from checking every slice to a single pass.',
    terms: [
      ['Prefix sum', 'The total of everything from the start up to a position. For [3, 1, 4] the prefix sums are 0, 3, 4, 8.'],
      ['Range sum', 'The total of a slice from position l to position r.'],
      ['Complement lookup', 'Asking "have I already seen the value I would need to make this work?"'],
    ],
    example: {
      title: 'Sum of positions 1..2 in [3, 1, 4, 2]',
      steps: [
        'Prefix sums (with a 0 in front): [0, 3, 4, 8, 10].',
        'prefix[3] = 8 is the total of positions 0..2 (3 + 1 + 4).',
        'prefix[1] = 3 is the total of position 0 only.',
        'Subtract: 8 − 3 = 5, which is 1 + 4. That is the slice 1..2.',
      ],
      takeaway: 'Like an odometer: distance between two towns = later reading − earlier reading.',
    },
    confusions: [
      'The leading 0 matters: it represents "nothing taken yet" and makes slices starting at index 0 work.',
      'Sliding windows only work for sums when all numbers are positive. With negatives, use prefix sums.',
      'When counting subarrays, look up the map before adding the current prefix to it.',
    ],
    watch: 'Watch the running sum and the "seen" map. Each time the sum minus k is already in the map, that many subarrays end at the current position.',
    templateSteps: [
      'Make a map from prefix-sum → how many times it has appeared, starting with {0: 1}.',
      'Walk the array, adding each number to a running sum.',
      'Ask the map how many times (running sum − k) has appeared: that many subarrays ending here sum to k. Add that to the answer.',
      'Record the current running sum in the map.',
    ],
    recognize: [
      ['"number of subarrays with sum equal to k"', 'A subarray sum is a difference of two prefix sums, so count matching earlier prefixes.'],
      ['"many queries: sum from index l to r"', 'Precompute prefix sums once, answer each query with one subtraction.'],
      ['"longest subarray with equal 0s and 1s"', 'Turn 0 into −1; equal counts means the slice sums to 0, i.e. two equal prefix sums.'],
    ],
  },
  strings: {
    oneLiner: 'A string is a sequence of characters you can read but not change; most string problems are counting, two pointers or windows in disguise.',
    whyCare: 'Text problems (palindromes, anagrams, parsing) are very common in online assessments and are mostly about choosing the right counting trick.',
    terms: [
      ['Immutable', 'Cannot be changed after creation. "Changing" a string actually builds a new one.'],
      ['Character count', 'How many times each letter appears, often stored in an array of 26 numbers.'],
      ['Builder', 'A tool that collects pieces and joins them once at the end (Python list + join, Java StringBuilder).'],
    ],
    example: {
      title: 'Are "listen" and "silent" anagrams?',
      steps: [
        'Count letters of "listen": e1 i1 l1 n1 s1 t1.',
        'Go through "silent" and subtract each letter: s, i, l, e, n, t.',
        'Every count is back to 0.',
        'So both words use exactly the same letters → anagrams.',
      ],
      takeaway: 'Same letters with the same counts = anagram. Counting is O(n); comparing all rearrangements would be impossible.',
    },
    confusions: [
      'Adding to a string inside a loop can secretly be O(n²) because each addition copies the string. Use a builder.',
      'In Java, compare strings with equals(), not ==.',
      'A palindrome check should usually ignore case and non-letters only if the problem says so, read the statement.',
    ],
    watch: 'Watch the counts go up for the first word and back down for the second. Any count that does not return to 0 would mean "not an anagram".',
    templateSteps: [
      'Make an array of 26 zeros (one slot per lowercase letter).',
      'For each character in the first string, add 1 to its slot (slot = character − \'a\').',
      'For each character in the second string, subtract 1.',
      'If every slot is 0, the strings have the same letters.',
    ],
    recognize: [
      ['"anagram", "permutation of the letters"', 'Same multiset of characters → compare character counts.'],
      ['"reads the same forwards and backwards"', 'Palindrome → two pointers from both ends.'],
      ['"longest substring with/without …"', 'Substring + condition → sliding window over the string.'],
    ],
  },
  hashing: {
    oneLiner: 'A hash map remembers things for you so you can answer "have I seen this?" or "how many times?" instantly instead of searching again.',
    whyCare: 'It is the most common way to turn a slow "check every pair" solution into a fast one-pass solution.',
    terms: [
      ['Key / value', 'A map stores pairs: the key is what you look up by, the value is what you get back.'],
      ['Hash', 'A number computed from the key that tells the map which slot to use, so it does not have to search.'],
      ['Collision', 'Two keys landing in the same slot. Maps handle it internally; it only matters if it happens a lot.'],
      ['Complement', 'The other half you need: for target 9 and current 2, the complement is 7.'],
    ],
    example: {
      title: 'Two Sum: find two numbers in [2, 7, 11, 15] that add to 9',
      steps: [
        'Empty map: seen = {} (value → index).',
        '2 (index 0): need 9 − 2 = 7. Not in seen. Store 2 → 0.',
        '7 (index 1): need 9 − 7 = 2. 2 is in seen at index 0!',
        'Answer: indices [0, 1]. Done in one pass.',
      ],
      takeaway: 'Instead of comparing every pair (O(n²)), ask the map about the one number you need (O(1) each).',
    },
    confusions: [
      'Check the map before inserting the current number, otherwise a number can pair with itself.',
      'A map has no order you can rely on. If you need sorted keys, sort them or use a sorted map.',
      'Choosing the key is the creative part: sorted letters for anagrams, (row, col) for grid cells, a running sum for subarrays.',
    ],
    watch: 'At each number, predict whether its complement is already stored. The first "yes" is the answer.',
    templateSteps: [
      'Create an empty map.',
      'For each element x at index i: compute what you are looking for (e.g. target − x).',
      'If that is already a key in the map, you have your answer.',
      'Otherwise store x (with its index or count) and move on.',
    ],
    recognize: [
      ['"return indices of two numbers that add up to target"', 'Pair finding → store what you have seen, look up the complement.'],
      ['"group strings that are anagrams"', 'Group by a canonical key → map from key to list.'],
      ['"first unique", "contains duplicate", "most frequent"', 'Counting or membership → map or set.'],
    ],
  },
  'two-pointers': {
    oneLiner: 'Use two positions that move through the array so that each move rules out many possibilities at once.',
    whyCare: 'On sorted data it replaces "try every pair" (O(n²)) with one pass (O(n)) and no extra memory.',
    terms: [
      ['Pointer', 'Just an index you move around, like left = 0 and right = n − 1.'],
      ['Sorted', 'Arranged from small to large. This is what makes the pointer moves safe.'],
      ['Read / write pointers', 'Two indices moving the same direction: one reads every item, the other marks where the next kept item goes.'],
    ],
    example: {
      title: 'Find two numbers in sorted [1, 3, 4, 6, 9] that add to 10',
      steps: [
        'left at 1, right at 9 → 1 + 9 = 10. Found it!',
        'Try target 13 instead: 1 + 9 = 10 is too small.',
        'The only way to get bigger is to move left forward (to 3): 3 + 9 = 12, still too small.',
        'Move left again (to 4): 4 + 9 = 13. Found.',
      ],
      takeaway: 'Too small → move the left pointer up. Too big → move the right pointer down. Every move throws away a number that can never be part of the answer.',
    },
    confusions: [
      'Opposite-end pointers need sorted input. Two Sum on an unsorted array with original indices needs a hash map instead.',
      'Every loop iteration must move at least one pointer, or you get an infinite loop.',
      'For "3Sum" you fix one number with a loop, then run two pointers on the rest.',
    ],
    watch: 'Before each move, predict which pointer moves. Ask: is the sum too small or too big?',
    templateSteps: [
      'Put lo at the start and hi at the end.',
      'While lo < hi: compute the sum of the two values.',
      'Equal to the target → return. Too small → lo += 1. Too big → hi −= 1.',
      'If the pointers meet, there is no pair.',
    ],
    recognize: [
      ['"the array is sorted" + "pair/triplet with a target sum"', 'Sorted order tells you which pointer to move.'],
      ['"in place", "remove duplicates", "move zeroes"', 'Read/write pointers filter the array without extra space.'],
      ['"container", "trap water", "palindrome"', 'Compare the two ends and move the weaker side inward.'],
    ],
  },
  'sliding-window': {
    oneLiner: 'Keep a "window" over a stretch of consecutive items; slide it by adding one item on the right and removing one on the left.',
    whyCare: 'Questions like "longest substring without repeats" become one pass instead of checking every possible substring.',
    terms: [
      ['Window', 'The current stretch between two indices, left and right.'],
      ['Valid window', 'A window that satisfies the rule (e.g. "no repeated letters").'],
      ['Expand / shrink', 'Move right forward to add an item; move left forward to drop an item.'],
    ],
    example: {
      title: 'Longest stretch of "abcab" with no repeated letter',
      steps: [
        'Add a → window "a" (length 1).',
        'Add b → "ab" (2). Add c → "abc" (3). Best = 3.',
        'Add a → "abca" has two a\'s. Shrink from the left until fixed: drop a → "bca" (3).',
        'Add b → "bcab" has two b\'s. Drop b → "cab" (3).',
        'Answer: 3.',
      ],
      takeaway: 'Each letter enters the window once and leaves at most once, so the whole thing is O(n).',
    },
    confusions: [
      'Windows are for contiguous stretches only. If you can skip items, it is not a window problem.',
      'With negative numbers, "shrink while the sum is too big" stops working. Use prefix sums.',
      'Decide where to record the answer: for "longest", after shrinking; for "shortest", while the window is still valid.',
    ],
    watch: 'Watch the left edge. Predict whether the new character forces it to move.',
    templateSteps: [
      'Set left = 0 and an empty state (a count map, a sum, a set).',
      'For each right from 0 to n − 1: add the item at right to the state.',
      'While the window breaks the rule: remove the item at left from the state and move left forward.',
      'Now the window is valid: update the answer with its length (right − left + 1).',
    ],
    recognize: [
      ['"longest/shortest substring or subarray such that …"', 'Contiguous + a condition you can update item by item.'],
      ['"at most k distinct", "at most k replacements"', 'The rule tells you when to shrink.'],
      ['"every window of size k"', 'Fixed-size window: add one, remove one.'],
    ],
  },
  recursion: {
    oneLiner: 'A function that solves a problem by asking itself to solve a smaller version of the same problem.',
    whyCare: 'Trees, nested structures, "generate all …" problems and dynamic programming all start from a recursive idea.',
    terms: [
      ['Base case', 'The smallest input you answer directly, without another call. It stops the recursion.'],
      ['Recursive case', 'The part that calls itself on a smaller input.'],
      ['Call stack', 'The list of calls that are waiting for an answer. Too deep → stack overflow.'],
      ['Memoization', 'Saving the answer to each input so you never compute it twice.'],
    ],
    example: {
      title: 'Compute 2⁴ recursively',
      steps: [
        'power(2, 4) = 2 × power(2, 3), "trust" that power(2, 3) works.',
        'power(2, 3) = 2 × power(2, 2).',
        'power(2, 2) = 2 × power(2, 1).',
        'power(2, 1) = 2 × power(2, 0).',
        'power(2, 0) = 1, base case, no more calls.',
        'Answers flow back up: 2, 4, 8, 16.',
      ],
      takeaway: 'You only need to get two things right: the base case and the step that shrinks the input. Then trust the call.',
    },
    confusions: [
      'Every call waits on the stack until the smaller calls return.',
      'If the same smaller input is computed many times (like Fibonacci), plain recursion is exponential. Memoize.',
      'Python stops at about 1000 nested calls by default; very deep inputs need an iterative version.',
    ],
    watch: 'Watch how fib(2) and fib(1) get computed again and again. That repeated work is what memoization removes.',
    templateSteps: [
      'Write the base case first: if the input is tiny, return the answer directly.',
      'Make a smaller input (n − 1, half of n, the left subtree).',
      'Call the function on it and trust the result.',
      'Combine the result(s) into the answer for the current input.',
    ],
    recognize: [
      ['"defined in terms of itself" (trees, nested lists)', 'The structure is recursive, so the solution is too.'],
      ['"generate all combinations/permutations"', 'Each choice leads to a smaller version of the same problem.'],
      ['"compute x^n fast"', 'Split in half each time: O(log n) levels.'],
    ],
  },
  sorting: {
    oneLiner: 'Putting items in order often makes the real problem easy: duplicates sit together, overlaps line up, and two pointers start working.',
    whyCare: 'Many medium problems are "sort first, then one simple pass". Knowing merge sort also teaches divide and conquer.',
    terms: [
      ['Comparator', 'A rule that says which of two items comes first (e.g. by start time, then by end time).'],
      ['Stable sort', 'Equal items keep their original order.'],
      ['Divide and conquer', 'Split the problem in halves, solve each, combine the results.'],
      ['Partition', 'Rearrange items so everything smaller than a pivot is on its left and larger on its right.'],
    ],
    example: {
      title: 'Merge two sorted halves [2, 5] and [1, 6]',
      steps: [
        'Compare the fronts: 2 vs 1 → take 1. Output [1].',
        'Compare 2 vs 6 → take 2. Output [1, 2].',
        'Compare 5 vs 6 → take 5. Output [1, 2, 5].',
        'Left half is empty → copy the rest: 6. Output [1, 2, 5, 6].',
      ],
      takeaway: 'Merging two sorted lists takes one pass. Merge sort repeats this on halves: log n levels × n work = O(n log n).',
    },
    confusions: [
      'In interviews you usually call the library sort; you implement merge sort only when asked.',
      'If the problem needs original positions, save (value, index) pairs before sorting.',
      'In Java, writing a comparator as a − b can overflow; use Integer.compare(a, b).',
    ],
    watch: 'At each step predict which front element is smaller. That is the only decision merge ever makes.',
    templateSteps: [
      'If the list has 0 or 1 items, it is already sorted.',
      'Split it into a left half and a right half and sort each (recursively).',
      'Merge: repeatedly take the smaller front item from the two halves.',
      'Copy whatever is left over in either half.',
    ],
    recognize: [
      ['"merge overlapping intervals"', 'Sorted by start, overlaps become neighbours.'],
      ['"arrange to form the largest number"', 'Needs a custom comparator.'],
      ['"sort without the built-in function"', 'Implement merge sort or quicksort.'],
    ],
  },
  'binary-search': {
    oneLiner: 'Find something in a sorted range by checking the middle and throwing away the half that cannot contain it.',
    whyCare: 'It finds an item among a billion in about 30 steps, and it also answers "what is the smallest value that works?" questions.',
    terms: [
      ['lo / hi', 'The ends of the range that still might contain the answer.'],
      ['mid', 'The middle position you check: (lo + hi) / 2.'],
      ['Monotonic', 'Only changes in one direction: once a condition becomes true, it stays true (false, false, true, true).'],
      ['Lower bound', 'The first position where the value is ≥ the target.'],
    ],
    example: {
      title: 'Find 23 in [2, 5, 8, 12, 16, 23, 38]',
      steps: [
        'Range is positions 0..6. Middle is position 3 → 12. 23 is bigger → keep the right half (4..6).',
        'Middle of 4..6 is position 5 → 23. Found it in 2 checks.',
        'A plain left-to-right scan would have needed 6 checks.',
      ],
      takeaway: 'Every check cuts the remaining range in half. That halving is why it is O(log n).',
    },
    confusions: [
      'Off-by-one errors come from mixing conventions. Pick one template (e.g. lo = 0, hi = n, loop while lo < hi) and always use it.',
      '"Binary search on the answer": if speed k works then any faster speed works too, so you can binary search over k itself.',
      'In Java compute mid as lo + (hi − lo) / 2 to avoid overflow.',
    ],
    watch: 'At each step, predict which half survives. Notice how fast the highlighted range shrinks.',
    templateSteps: [
      'Set lo = 0 and hi = n (the answer is somewhere in lo..hi).',
      'While lo < hi: look at mid = (lo + hi) / 2.',
      'If mid already satisfies the condition, the answer is mid or to its left → hi = mid.',
      'Otherwise the answer is to the right → lo = mid + 1.',
      'When lo == hi, that is the first position that satisfies the condition.',
    ],
    recognize: [
      ['"sorted array" + "O(log n)"', 'Classic binary search.'],
      ['"minimum speed/capacity/days such that it is possible"', 'Feasibility only flips once → binary search on the answer.'],
      ['"rotated sorted array"', 'One half around mid is always sorted; use it to decide.'],
    ],
  },
  'linked-list': {
    oneLiner: 'A chain of nodes where each node points to the next one; you solve problems by carefully re-pointing those arrows.',
    whyCare: 'Linked lists test whether you can manipulate pointers without losing track, a classic interview skill.',
    terms: [
      ['Node', 'A small object holding a value and a reference (arrow) to the next node.'],
      ['Head', 'The first node. If you lose it, you lose the list.'],
      ['Dummy node', 'A fake node placed before the head so the first real node is not a special case.'],
      ['Fast / slow pointers', 'Two references moving at different speeds (2 steps vs 1 step).'],
    ],
    example: {
      title: 'Reverse 1 → 2 → 3',
      steps: [
        'prev = nothing, cur = 1.',
        'Save next = 2. Point 1 back to prev (nothing). Move prev = 1, cur = 2.',
        'Save next = 3. Point 2 back to 1. Move prev = 2, cur = 3.',
        'Save next = nothing. Point 3 back to 2. Move prev = 3, cur = nothing.',
        'cur is empty → stop. The new head is prev = 3: 3 → 2 → 1.',
      ],
      takeaway: 'Always save the next node before changing an arrow, or the rest of the list is lost.',
    },
    confusions: [
      'You cannot jump to the 5th node directly; you must walk there one node at a time.',
      'Draw boxes and arrows on paper. Pointer bugs are almost impossible to see in your head.',
      'When fast reaches the end, slow is in the middle. That is how you find the middle in one pass.',
    ],
    watch: 'Watch one arrow flip per step, and notice that prev always holds the already-reversed part.',
    templateSteps: [
      'prev = null, cur = head.',
      'While cur exists: remember next = cur.next.',
      'Point cur.next back to prev.',
      'Step forward: prev = cur, cur = next.',
      'Return prev, which is now the head of the reversed list.',
    ],
    recognize: [
      ['"reverse the list", "reorder the list"', 'Pointer rewiring with prev/cur/next.'],
      ['"find the middle", "detect a cycle", "n-th node from the end"', 'Fast and slow pointers.'],
      ['"merge two sorted lists"', 'A dummy head plus taking the smaller front each time.'],
    ],
  },
  stack: {
    oneLiner: 'A stack is a pile: you only add to the top and take from the top, so the most recent item always comes out first.',
    whyCare: 'Whenever the latest unfinished thing must be resolved first, matching brackets, undo, nested expressions, a stack is the answer.',
    terms: [
      ['Push / pop', 'Put an item on top / take the top item off.'],
      ['Peek / top', 'Look at the top item without removing it.'],
      ['LIFO', '"Last in, first out": the newest item leaves first.'],
    ],
    example: {
      title: 'Is "([])" balanced?',
      steps: [
        '"(" is an opener → push. Stack: (',
        '"[" is an opener → push. Stack: ( [',
        '"]" is a closer → the top is "[" which matches → pop. Stack: (',
        '")" is a closer → the top is "(" which matches → pop. Stack: empty.',
        'End of string with an empty stack → balanced.',
      ],
      takeaway: 'A closing bracket must match the most recent unmatched opener, which is exactly the top of the stack.',
    },
    confusions: [
      'Check that the stack is not empty before popping (")" on its own is invalid).',
      'At the end the stack must be empty, otherwise some opener was never closed.',
      'In Java use ArrayDeque, not the old Stack class.',
    ],
    watch: 'For each character, predict: push, pop-and-match, or mismatch.',
    templateSteps: [
      'Make an empty stack.',
      'For each character: if it is an opener, push it.',
      'If it is a closer: if the stack is empty or the top does not match, the answer is "invalid"; otherwise pop.',
      'At the end, it is valid only if the stack is empty.',
    ],
    recognize: [
      ['"valid parentheses", "balanced brackets"', 'Match the latest opener → stack.'],
      ['"evaluate an expression in postfix / RPN"', 'Numbers wait on a stack for their operator.'],
      ['"decode 3[a2[c]]"', 'Nested levels → push state when entering, pop when leaving.'],
    ],
  },
  'monotonic-stack': {
    oneLiner: 'A stack kept in sorted order so that, as each new item arrives, it immediately answers "who is the next bigger (or smaller) item?" for the items it beats.',
    whyCare: '"Next greater element", "days until warmer" and histogram problems become O(n) instead of O(n²).',
    terms: [
      ['Monotonic', 'Always going one way: values on the stack only decrease (or only increase) from bottom to top.'],
      ['Next greater element', 'For each item, the first item to its right that is bigger.'],
      ['Waiting list', 'The stack holds positions that have not found their answer yet.'],
    ],
    example: {
      title: 'Days until warmer for temperatures [70, 72, 68, 75]',
      steps: [
        'Day 0 (70): nothing waiting → push day 0. Stack: [0].',
        'Day 1 (72): 72 > 70 → day 0 found its answer: 1 day. Pop 0, push 1. Stack: [1].',
        'Day 2 (68): 68 is not warmer than 72 → push 2. Stack: [1, 2].',
        'Day 3 (75): warmer than 68 → day 2 waited 1 day. Warmer than 72 → day 1 waited 2 days. Push 3.',
        'Day 3 never finds a warmer day → answer 0. Result: [1, 2, 1, 0].',
      ],
      takeaway: 'Each day goes on the stack once and comes off once, so it is O(n) even though there is a loop inside the loop.',
    },
    confusions: [
      'Store indices, not values. You need positions to compute distances.',
      'Items left on the stack at the end never found an answer (usually −1 or 0).',
      'Use "<" vs "<=" carefully when equal values matter.',
    ],
    watch: 'When a new temperature arrives, predict how many waiting days it releases.',
    templateSteps: [
      'Make an empty stack of indices and an answer array.',
      'For each index i: while the stack is not empty and the value at the top is smaller than the value at i, pop it, its answer is i.',
      'Push i onto the stack.',
      'Whatever remains on the stack has no next greater element.',
    ],
    recognize: [
      ['"next greater / next smaller element"', 'The textbook monotonic stack.'],
      ['"how many days until a warmer temperature"', 'Next greater element, measured as a distance.'],
      ['"largest rectangle in a histogram"', 'Each bar needs its nearest smaller bar on both sides.'],
    ],
  },
  queue: {
    oneLiner: 'A queue serves items in the order they arrived; a deque is a queue you can use from both ends.',
    whyCare: 'Queues power BFS and "recent events" counters; a deque solves "maximum of every window" in O(n).',
    terms: [
      ['Enqueue / dequeue', 'Add at the back / remove from the front.'],
      ['FIFO', '"First in, first out", like a real line.'],
      ['Deque', 'Double-ended queue: add or remove at both front and back.'],
      ['Monotonic deque', 'A deque whose values stay in decreasing order, so the front is always the maximum.'],
    ],
    example: {
      title: 'Maximum of every window of size 3 in [1, 3, −1, −3, 5]',
      steps: [
        'Add 1. Add 3 → 3 beats 1, so 1 can never be a maximum again: remove it. Deque: [3].',
        'Add −1 → smaller, keep it. Deque: [3, −1]. First window is full: max = 3.',
        'Add −3 → keep it. Deque: [3, −1, −3]. Max = 3.',
        'Add 5 → beats everything, remove them all. Deque: [5]. Max = 5.',
        'Maximums: [3, 3, 5].',
      ],
      takeaway: 'A smaller older item behind a bigger newer item is useless forever, so throw it away. The front is always the current max.',
    },
    confusions: [
      'Removing from the front of a list is slow; always use a real deque.',
      'Store indices in the deque so you can tell when the front has slid out of the window.',
    ],
    watch: 'When a new number arrives, predict how many items get removed from the back.',
    templateSteps: [
      'Make an empty deque of indices.',
      'For each index i: remove indices from the back while their values are ≤ the new value.',
      'Add i at the back.',
      'If the front index has left the window (≤ i − k), remove it from the front.',
      'Once the first window is complete, the value at the front is the window maximum.',
    ],
    recognize: [
      ['"maximum/minimum of every window of size k"', 'Monotonic deque.'],
      ['"process in the order they arrive", "level by level"', 'Plain queue (BFS).'],
      ['"number of requests in the last 3000 ms"', 'Queue of timestamps; drop old ones from the front.'],
    ],
  },
  intervals: {
    oneLiner: 'Sort the intervals by start time; then overlapping ones sit next to each other and one pass can merge or count them.',
    whyCare: 'Meetings, bookings and ranges are a favourite interview theme, and nearly all of them start with "sort".',
    terms: [
      ['Interval', 'A pair [start, end], like a meeting from 9 to 11.'],
      ['Overlap', 'Two intervals share time: the next one starts before the previous one ends.'],
      ['Sweep', 'Walking through events in time order, counting how many are active.'],
    ],
    example: {
      title: 'Merge [1, 3], [2, 6], [8, 10]',
      steps: [
        'They are already sorted by start.',
        'Start with [1, 3].',
        '[2, 6] starts at 2, which is ≤ 3 → overlap. Extend the end to max(3, 6) = 6 → [1, 6].',
        '[8, 10] starts at 8 > 6 → no overlap. Start a new interval.',
        'Result: [1, 6], [8, 10].',
      ],
      takeaway: 'After sorting, you only ever compare with the last merged interval.',
    },
    confusions: [
      'Check whether touching intervals like [1, 2] and [2, 3] count as overlapping. It depends on the problem.',
      'For "keep as many non-overlapping as possible", sort by end time, not start time.',
    ],
    watch: 'For each interval, predict whether it merges into the last one or starts a new one.',
    templateSteps: [
      'Sort intervals by start.',
      'Put the first interval in the result.',
      'For each next interval: if its start ≤ the end of the last result, extend that end to the larger end.',
      'Otherwise append it as a new interval.',
    ],
    recognize: [
      ['"merge overlapping intervals"', 'Sort by start, extend or append.'],
      ['"minimum number of meeting rooms"', 'Count how many intervals are active at once (heap or sweep).'],
      ['"remove the fewest intervals to avoid overlap"', 'Sort by end, greedily keep the earliest finisher.'],
    ],
  },
  trees: {
    oneLiner: 'A binary tree is a family tree where every node has at most two children; you solve it by asking each child for its answer and combining them.',
    whyCare: 'Tree questions appear in almost every interview loop, and they all use the same small set of recursive shapes.',
    terms: [
      ['Root', 'The top node. Leaf: a node with no children.'],
      ['Depth / height', 'How many levels down a node is / how many levels a tree has.'],
      ['DFS', 'Depth-first: go all the way down one branch before trying another (uses recursion).'],
      ['BFS', 'Breadth-first: visit level by level (uses a queue).'],
      ['Pre / in / post-order', 'When you handle the node: before its children, between them, or after them.'],
    ],
    example: {
      title: 'Height of a tree: root 3 with children 9 and 20; 20 has children 15 and 7',
      steps: [
        'Leaf 9 has no children → height 1.',
        'Leaves 15 and 7 → height 1 each.',
        'Node 20: 1 + max(1, 1) = 2.',
        'Root 3: 1 + max(height of 9 = 1, height of 20 = 2) = 3.',
      ],
      takeaway: 'Ask one question at every node: "what do I need from my left and right children?". Then return it.',
    },
    confusions: [
      'An empty child (null) is the base case: usually return 0, true or nothing.',
      'Some answers (like the diameter) are not what you return; keep them in a separate variable and update it at every node.',
      'Level-by-level questions (right side view, zigzag) are easier with BFS than DFS.',
    ],
    watch: 'Notice that a node only gets its number after both children have reported theirs. That is post-order.',
    templateSteps: [
      'If the node is empty, return the base value (e.g. 0).',
      'Ask the left child for its answer (recursive call).',
      'Ask the right child for its answer.',
      'Combine them with the node\'s own value and return.',
    ],
    recognize: [
      ['"maximum depth", "is it balanced", "diameter"', 'Height-style DFS that returns a number.'],
      ['"level order", "right side view", "average of each level"', 'BFS with a queue, one level at a time.'],
      ['"path from root to leaf with sum …"', 'DFS carrying the remaining sum down.'],
    ],
  },
  bst: {
    oneLiner: 'A binary search tree keeps smaller values on the left and larger on the right, so finding a value is like playing "higher or lower".',
    whyCare: 'It gives sorted order for free (in-order traversal) and fast search, insert and delete.',
    terms: [
      ['BST property', 'Every value in the left subtree is smaller than the node; every value in the right subtree is larger.'],
      ['In-order traversal', 'Left, node, right, visits a BST in sorted order.'],
      ['Balanced', 'Left and right sides have similar heights, so operations stay O(log n).'],
    ],
    example: {
      title: 'Find 7 in a BST with root 8',
      steps: [
        'At 8: 7 < 8 → go left to 3.',
        'At 3: 7 > 3 → go right to 6.',
        'At 6: 7 > 6 → go right to 7.',
        'Found 7 in 4 steps, without looking at the other half of the tree.',
      ],
      takeaway: 'Each comparison discards an entire subtree. The same idea as binary search.',
    },
    confusions: [
      'Checking only "left child < node < right child" is not enough; a value deep in the left subtree must also be smaller than every ancestor it sits under.',
      'If values are inserted in sorted order the tree becomes a straight line and operations become O(n).',
    ],
    watch: 'At every node, predict left or right before the step is shown.',
    templateSteps: [
      'Start at the root.',
      'If the node is empty, the value is not there.',
      'If the value equals the node, found it.',
      'If it is smaller go left, if larger go right, and repeat.',
    ],
    recognize: [
      ['"the input is a BST"', 'Use the left-smaller/right-larger property instead of searching everything.'],
      ['"k-th smallest element"', 'In-order traversal is sorted; stop at the k-th node.'],
      ['"validate a BST"', 'Pass down a (low, high) allowed range.'],
    ],
  },
  heaps: {
    oneLiner: 'A heap always hands you the smallest (or largest) item instantly, even while new items keep arriving.',
    whyCare: '"Top k", "k-th largest", "merge k sorted lists" and scheduling problems all need "the best item right now" repeatedly.',
    terms: [
      ['Min-heap / max-heap', 'Smallest on top / largest on top.'],
      ['Push / pop', 'Add an item (O(log n)) / remove the top item (O(log n)).'],
      ['Sift up / down', 'Swapping an item with its parent or child until the order is restored.'],
      ['Top-k trick', 'Keep only k items in a min-heap; the top is the k-th largest.'],
    ],
    example: {
      title: '2nd largest of [3, 1, 5, 4] with a size-2 min-heap',
      steps: [
        'Push 3 → heap {3}.',
        'Push 1 → heap {1, 3}.',
        'Push 5 → heap {1, 3, 5}: too big, remove the smallest (1) → {3, 5}.',
        'Push 4 → {3, 4, 5}: remove 3 → {4, 5}.',
        'The top (smallest of the two kept) is 4 = the 2nd largest.',
      ],
      takeaway: 'You never sort everything: each push/pop is O(log k), so the total is O(n log k).',
    },
    confusions: [
      'A heap is only partly sorted; looping over it does not give sorted order.',
      'Python heapq is min-only: push negative numbers to get a max-heap.',
      'To keep the k largest you use a MIN-heap (so you can throw away the smallest).',
    ],
    watch: 'When the new value is pushed, predict whether it swaps with its parent.',
    templateSteps: [
      'Make an empty min-heap.',
      'For each number: push it.',
      'If the heap now has more than k items, pop the smallest.',
      'At the end the heap holds the k largest and its top is the k-th largest.',
    ],
    recognize: [
      ['"k-th largest", "top k frequent", "k closest"', 'Size-k heap.'],
      ['"merge k sorted lists"', 'Heap of the current front of each list.'],
      ['"median of a stream"', 'Two heaps: lower half and upper half.'],
    ],
  },
  graphs: {
    oneLiner: 'A graph is dots connected by lines; BFS explores it in rings outward, DFS explores one path as deep as it goes.',
    whyCare: 'Grids, maps, networks, dependencies and puzzles are all graphs. Islands and shortest-steps problems are interview staples.',
    terms: [
      ['Node / edge', 'A dot / a line connecting two dots.'],
      ['Adjacency list', 'For each node, the list of its neighbours.'],
      ['Visited set', 'The nodes you have already reached, so you never process one twice.'],
      ['Connected component', 'A group of nodes that can all reach each other.'],
    ],
    example: {
      title: 'Shortest number of steps from A in: A–B, A–C, B–D, C–D',
      steps: [
        'Queue: [A]. A is at distance 0.',
        'Take A. Its neighbours B and C get distance 1. Queue: [B, C].',
        'Take B. Neighbour D gets distance 2. Queue: [C, D].',
        'Take C. D is already visited, skip it.',
        'Take D. Done: B = 1, C = 1, D = 2.',
      ],
      takeaway: 'BFS reaches every node by the fewest edges possible, because it finishes distance 1 before starting distance 2.',
    },
    confusions: [
      'Mark a node visited when you add it to the queue, not when you take it out. Otherwise it can be added many times.',
      'A grid is a graph: each cell\'s neighbours are up, down, left and right.',
      'BFS gives shortest paths only when every edge costs the same. Weighted edges need Dijkstra.',
    ],
    watch: 'Predict which node leaves the queue next. Notice that all distance-1 nodes are processed before any distance-2 node.',
    templateSteps: [
      'Put the start node in a queue and mark it visited.',
      'While the queue is not empty: take the front node.',
      'For each neighbour that is not visited: mark it visited, record its distance, add it to the queue.',
      'For "count islands", start a new search from every unvisited land cell and count the starts.',
    ],
    recognize: [
      ['"number of islands", "connected groups"', 'Count how many separate searches you start.'],
      ['"minimum number of steps/moves" (all moves cost the same)', 'BFS.'],
      ['"spreads to neighbours each minute"', 'Multi-source BFS starting from every source at once.'],
    ],
  },
  'topo-sort': {
    oneLiner: 'Put tasks in an order that respects every "A must happen before B" rule, and detect when that is impossible.',
    whyCare: 'Course schedules, build systems and dependency problems are all topological sorting.',
    terms: [
      ['Directed edge', 'A one-way arrow A → B meaning "A before B".'],
      ['In-degree', 'How many arrows point into a node, how many things it is still waiting for.'],
      ['Cycle', 'A loop of rules like A before B, B before C, C before A. No valid order exists.'],
    ],
    example: {
      title: 'Order courses with rules A → C, B → C, C → D',
      steps: [
        'In-degrees: A 0, B 0, C 2, D 1.',
        'Ready (in-degree 0): A and B. Take A → C now waits for 1.',
        'Take B → C now waits for 0, so C is ready.',
        'Take C → D is ready. Take D.',
        'Order: A, B, C, D. All 4 courses placed → no cycle.',
      ],
      takeaway: 'Repeatedly take something that is not waiting for anything. If you get stuck before placing everything, there is a cycle.',
    },
    confusions: [
      'Read the edge direction carefully: [a, b] in "course a needs b" means b → a.',
      'Nodes with no edges at all still need to appear in the order.',
    ],
    watch: 'Predict which ready node is output next, and watch the in-degree numbers fall.',
    templateSteps: [
      'Count the in-degree of every node and build the adjacency list.',
      'Put every node with in-degree 0 into a queue.',
      'Take a node, add it to the order, and lower the in-degree of each node it points to.',
      'Any node whose in-degree drops to 0 joins the queue.',
      'If the order has fewer nodes than the graph, there is a cycle.',
    ],
    recognize: [
      ['"prerequisites", "must be done before"', 'Dependencies → topological sort.'],
      ['"is it possible to finish all courses?"', 'Same algorithm; just check for a cycle.'],
      ['"find an order of letters from a sorted alien dictionary"', 'Build ordering edges, then topological sort.'],
    ],
  },
  'shortest-path': {
    oneLiner: 'Dijkstra finds the cheapest route when roads have different lengths by always extending the closest place you have not finished yet.',
    whyCare: '"Minimum cost", "minimum time" and "network delay" questions with weighted edges all use it.',
    terms: [
      ['Weight', 'The cost of using an edge (distance, time, price).'],
      ['Tentative distance', 'The best distance found so far; it can still improve.'],
      ['Finalised', 'A node whose distance can no longer improve.'],
      ['Priority queue', 'A heap that always gives you the node with the smallest tentative distance.'],
    ],
    example: {
      title: 'From S: S→A costs 4, S→B costs 1, B→A costs 2',
      steps: [
        'S = 0. Neighbours: A = 4, B = 1.',
        'The closest unfinished node is B (1). Finalise it. Through B, A costs 1 + 2 = 3 < 4 → update A = 3.',
        'Next closest is A (3). Finalise it.',
        'Shortest distances: S 0, B 1, A 3. The direct road to A was not the cheapest.',
      ],
      takeaway: 'Because roads are never negative, the closest unfinished node can never be reached more cheaply later, so it is safe to finalise.',
    },
    confusions: [
      'Dijkstra does not work with negative edge weights.',
      'The heap may contain old, larger entries for a node; skip them when popped.',
      'If all edges cost the same, plain BFS is simpler and faster.',
    ],
    watch: 'Predict which node is finalised next: always the one with the smallest number among the unfinished ones.',
    templateSteps: [
      'Set the source distance to 0 and push (0, source) into a min-heap.',
      'Pop the smallest (distance, node). If it is older than the best known distance, skip it.',
      'For each edge (node → next, weight): if distance + weight beats next\'s best, update it and push it.',
      'Repeat until the heap is empty.',
    ],
    recognize: [
      ['"minimum time/cost from a source" with weights', 'Dijkstra.'],
      ['"signal travels through a weighted network"', 'Shortest distance to every node; answer is the largest.'],
      ['"path with minimum effort/maximum altitude"', 'Dijkstra with a different cost rule.'],
    ],
  },
  'union-find': {
    oneLiner: 'Union-Find keeps track of groups: it can merge two groups and tell you whether two items are in the same group, almost instantly.',
    whyCare: 'Connectivity questions where edges arrive one by one ("does this edge create a cycle?", "how many groups?").',
    terms: [
      ['Parent', 'Each item points to another item in its group; following parents leads to the group\'s leader.'],
      ['Root / leader', 'The item that represents its whole group (it is its own parent).'],
      ['Find', 'Follow parents to the root.'],
      ['Union', 'Make one root point to the other, merging the groups.'],
    ],
    example: {
      title: 'Items 0–3: union(0, 1), union(2, 3), union(1, 3), then union(0, 2)?',
      steps: [
        'union(0, 1): roots 0 and 1 differ → 1 now points to 0. Groups: {0, 1}, {2}, {3}.',
        'union(2, 3): 3 points to 2. Groups: {0, 1}, {2, 3}.',
        'union(1, 3): root of 1 is 0, root of 3 is 2 → 2 points to 0. One group {0, 1, 2, 3}.',
        'union(0, 2): both roots are 0 → already connected. This edge would close a cycle.',
      ],
      takeaway: 'Same root = same group. That one check answers both "connected?" and "would this edge make a cycle?".',
    },
    confusions: [
      'Always compare roots (find(a) == find(b)), not direct parents.',
      'Path compression and union by size are what make it fast; without them trees can get long.',
    ],
    watch: 'Before each union, predict whether the two items are already in the same group.',
    templateSteps: [
      'Start with parent[i] = i for every item (everyone is their own group).',
      'find(x): follow parent until you reach an item that is its own parent (shortening the path as you go).',
      'union(a, b): find both roots; if equal, they are already connected.',
      'Otherwise attach the smaller group\'s root under the larger group\'s root.',
    ],
    recognize: [
      ['"number of connected components / provinces"', 'Count roots after all unions.'],
      ['"which edge makes the tree a cycle"', 'The first union where both roots are equal.'],
      ['"merge accounts that share an email"', 'Union items that belong together, then group by root.'],
    ],
  },
  greedy: {
    oneLiner: 'Make the best-looking choice at every step and never go back. This works only when you can explain why that choice is always safe.',
    whyCare: 'Greedy solutions are short and fast, and many scheduling and jumping problems are greedy at heart.',
    terms: [
      ['Greedy choice', 'The locally best option right now (earliest finish, largest coin, farthest jump).'],
      ['Counterexample', 'A small input where the greedy rule gives the wrong answer.'],
      ['Exchange argument', 'Showing that swapping any optimal choice for the greedy one never makes things worse.'],
    ],
    example: {
      title: 'Can you reach the end of [2, 3, 1, 1, 4]? (each number = max jump)',
      steps: [
        'Track the farthest index you can reach. Start: 0.',
        'Index 0 (jump 2): farthest = max(0, 0 + 2) = 2.',
        'Index 1 (jump 3): farthest = max(2, 1 + 3) = 4.',
        '4 is the last index → reachable. Answer: yes.',
      ],
      takeaway: 'You never need to try every path; you only need to know how far you could possibly get.',
    },
    confusions: [
      'Greedy is not always right: with coins [1, 3, 4] and amount 6, "largest coin first" gives 4 + 1 + 1 (3 coins) but 3 + 3 (2 coins) is better. That needs DP.',
      'Always test your greedy rule on a couple of tiny tricky inputs before coding it.',
    ],
    watch: 'Predict the new "farthest reach" at every index, and spot the index you can never stand on.',
    templateSteps: [
      'Decide the greedy rule and say in one sentence why it is safe.',
      'Usually sort the input by the key the rule needs (end time, size).',
      'Walk through once, applying the rule and keeping a small amount of state.',
    ],
    recognize: [
      ['"can you reach the end", "minimum jumps"', 'Track the farthest reach.'],
      ['"maximum number of non-overlapping activities"', 'Earliest finish time first.'],
      ['"assign items to satisfy the most people"', 'Sort both sides and match greedily.'],
    ],
  },
  'dp-1d': {
    oneLiner: 'Dynamic programming = solve each small subproblem once, write the answer down, and build bigger answers from smaller ones.',
    whyCare: '"Number of ways", "minimum cost" and "can you make …" questions where trying everything would be exponential.',
    terms: [
      ['State', 'What one cell of the table means, in one sentence. e.g. dp[i] = best money from the first i houses.'],
      ['Transition', 'The formula for a cell using smaller cells.'],
      ['Base case', 'The cells you know without calculation (dp[0]).'],
      ['Overlapping subproblems', 'The same smaller question comes up again and again. The reason DP helps.'],
    ],
    example: {
      title: 'Ways to climb 4 stairs taking 1 or 2 steps',
      steps: [
        'State: ways[n] = number of ways to reach step n.',
        'You reach step n from n − 1 or n − 2, so ways[n] = ways[n − 1] + ways[n − 2].',
        'Base: ways[0] = 1 (stand still), ways[1] = 1.',
        'ways[2] = 1 + 1 = 2, ways[3] = 2 + 1 = 3, ways[4] = 3 + 2 = 5.',
        'Answer: 5.',
      ],
      takeaway: 'Write the state in words first. If you cannot say what dp[i] means, you cannot find the transition.',
    },
    confusions: [
      'DP is not a special trick; it is recursion where you remember answers.',
      'Start from the brute-force recursion, then add memoization, then turn it into a loop if needed.',
      'Pick the right starting value: 0 for counts of nothing, infinity for "minimum", negative infinity for "maximum".',
    ],
    watch: 'Predict each dp cell from the two before it. Notice the table only ever looks back.',
    templateSteps: [
      'Define the state in one sentence.',
      'Write the transition: how dp[i] uses earlier cells.',
      'Fill in the base cases.',
      'Loop i from small to large, filling each cell.',
      'Return the cell that answers the question (often dp[n]).',
    ],
    recognize: [
      ['"number of ways to …"', 'Count ways by adding up ways of smaller cases.'],
      ['"minimum cost / fewest coins to reach …"', 'Take the minimum over the choices for the last step.'],
      ['"you cannot pick two adjacent items"', 'Each item: take it (skip the previous) or skip it.'],
    ],
  },
  'dp-2d': {
    oneLiner: 'When one number is not enough to describe a subproblem, two positions in a grid, or prefixes of two strings. The DP table becomes 2-D.',
    whyCare: 'Grid paths, longest common subsequence and edit distance are classic interview DPs.',
    terms: [
      ['dp[i][j]', 'The answer for the first i characters of one string and the first j of the other (or for grid cell row i, column j).'],
      ['Neighbours', 'The cells a cell depends on: up, left and the up-left diagonal.'],
      ['Subsequence', 'Characters in order, but gaps are allowed ("ace" in "abcde").'],
    ],
    example: {
      title: 'Grid paths moving only right or down in a 3 × 3 grid',
      steps: [
        'Top row and left column: only one way to reach each cell → all 1.',
        'Cell (1, 1) = from above (1) + from the left (1) = 2.',
        'Cell (1, 2) = 1 + 2 = 3. Cell (2, 1) = 2 + 1 = 3.',
        'Cell (2, 2) = 3 + 3 = 6 → 6 paths to the bottom-right.',
      ],
      takeaway: 'Each cell only needs the cell above and the cell to the left. Fill row by row.',
    },
    confusions: [
      'With strings, dp[i][j] usually talks about the first i and j characters, so the characters are a[i − 1] and b[j − 1]. That shift is where most bugs are.',
      'An extra row and column for "empty prefix" removes most special cases.',
    ],
    watch: 'For each cell, predict whether it comes from the diagonal (+1 because the characters match) or from the larger of up and left.',
    templateSteps: [
      'Make a table with (m + 1) rows and (n + 1) columns, filled with base values.',
      'Loop over rows i and columns j.',
      'If the current characters match, take the diagonal + 1.',
      'Otherwise take the best of the cell above and the cell to the left.',
      'The bottom-right cell is the answer.',
    ],
    recognize: [
      ['"number of paths in a grid moving right/down"', 'Sum of top and left.'],
      ['"longest common subsequence of two strings"', 'Match → diagonal + 1, else max(up, left).'],
      ['"minimum edits to turn one word into another"', 'Edit distance: 1 + min of three neighbours.'],
    ],
  },
  'dp-knapsack': {
    oneLiner: 'For each item you decide "take it or leave it" under a limit; the table remembers the best you can do for every possible limit.',
    whyCare: 'Subset sums, partitions, target sums and "pick items under a budget" all reduce to this one idea.',
    terms: [
      ['Capacity', 'The limit (weight allowed, target sum).'],
      ['0/1 knapsack', 'Each item can be used at most once.'],
      ['Unbounded knapsack', 'Items can be reused (like coins).'],
      ['Reachable sum', 'A total you can make from some subset of the items.'],
    ],
    example: {
      title: 'Can some of [3, 1, 4] add up to 5?',
      steps: [
        'Start: only sum 0 is reachable.',
        'Item 3: from 0 you can reach 3. Reachable: {0, 3}.',
        'Item 1: from 0 → 1, from 3 → 4. Reachable: {0, 1, 3, 4}.',
        'Item 4: from 1 → 5! Reachable now includes 5.',
        'Answer: yes (1 + 4).',
      ],
      takeaway: 'Each item either adds to existing sums or not. Going through sums from high to low makes sure each item is used only once.',
    },
    confusions: [
      'Loop direction matters with a 1-D table: downward for 0/1 (each item once), upward for unbounded (reuse allowed).',
      'Many problems hide the knapsack: "split into two equal halves" means "can I reach total / 2?".',
    ],
    watch: 'For each item and sum, predict whether the sum becomes reachable: it does if it already was, or if sum − item was.',
    templateSteps: [
      'Make a table of size capacity + 1; dp[0] = true (or 0).',
      'For each item:',
      '  loop the capacity from high down to the item\'s size,',
      '  and set dp[c] = dp[c] OR dp[c − item] (or the max with value added).',
      'dp[capacity] is the answer.',
    ],
    recognize: [
      ['"partition into two subsets with equal sum"', 'Subset sum to total / 2.'],
      ['"assign + or − to reach a target"', 'Count subsets with a derived sum.'],
      ['"choose items with weights and values under a limit"', 'Classic 0/1 knapsack.'],
    ],
  },
  backtracking: {
    oneLiner: 'Try a choice, explore everything that follows from it, then undo the choice and try the next one, like walking a maze and stepping back at dead ends.',
    whyCare: '"Generate all subsets / permutations / combinations" and puzzles like N-Queens and word search.',
    terms: [
      ['Decision tree', 'A tree of choices: each level is one decision, each leaf is a complete answer.'],
      ['Path', 'The choices made so far.'],
      ['Undo', 'Removing the last choice so the next option starts from a clean state.'],
      ['Pruning', 'Stopping a branch early because it can never succeed.'],
    ],
    example: {
      title: 'All subsets of [1, 2]',
      steps: [
        'Start with an empty path [] → record it.',
        'Choose 1 → path [1] → record it.',
        '  Choose 2 → path [1, 2] → record it. Undo 2.',
        'Undo 1. Choose 2 → path [2] → record it. Undo 2.',
        'Subsets: [], [1], [1, 2], [2].',
      ],
      takeaway: 'Choose → explore → undo. The undo step is what lets one list be reused for every branch.',
    },
    confusions: [
      'Save a copy of the path when recording it. The same list keeps changing afterwards.',
      'For subsets/combinations, pass a start index so you only choose later items (avoids duplicates like [2, 1]).',
      'The number of answers is huge (2ⁿ subsets), so the goal is clean code and pruning, not polynomial time.',
    ],
    watch: 'Predict which subset is recorded next. The search always goes deeper before it goes sideways.',
    templateSteps: [
      'Write go(start, path).',
      'Record a copy of path if it is a complete answer (for subsets: every path).',
      'For each option i from start onward: add it to path,',
      '  call go(i + 1, path),',
      '  then remove it from path (undo).',
    ],
    recognize: [
      ['"return all possible …"', 'You must list every answer → backtracking.'],
      ['"combinations that sum to target"', 'Choose, recurse with the remaining target, undo.'],
      ['"place queens", "find the word in the grid"', 'Try a cell, recurse, unmark it.'],
    ],
  },
  tries: {
    oneLiner: 'A trie stores words letter by letter in a tree, so all words starting with the same letters share the same path.',
    whyCare: 'Autocomplete, prefix searches and searching many words at once (Word Search II).',
    terms: [
      ['Node', 'One letter position; it has children for each possible next letter.'],
      ['End-of-word flag', 'A marker on a node saying "a whole word ends here".'],
      ['Prefix', 'The beginning part of a word ("ca" for "cat").'],
    ],
    example: {
      title: 'Insert "car", "cat", then search "ca"',
      steps: [
        'Insert "car": create nodes c → a → r and mark r as a word end.',
        'Insert "cat": c and a already exist, reuse them. Create t under a, mark it.',
        'search("ca"): the path c → a exists, but a is not marked → not a word.',
        'startsWith("ca"): the path exists → yes.',
      ],
      takeaway: 'Lookups take one step per letter, no matter how many words are stored.',
    },
    confusions: [
      'A path existing is not the same as a word existing, check the end-of-word flag.',
      'For only lowercase letters, an array of 26 children is simpler and faster than a map.',
    ],
    watch: 'For each letter, predict whether a new node is created or an existing one is reused.',
    templateSteps: [
      'Start at the root node.',
      'For each letter: if there is no child for it, create one; move to that child.',
      'After the last letter, mark the node as the end of a word.',
      'Searching walks the same way; it fails if a child is missing.',
    ],
    recognize: [
      ['"starts with", "prefix", "autocomplete"', 'Prefix queries → trie.'],
      ['"search many words in a grid"', 'One trie for all words instead of searching each separately.'],
      ['"\'.\' can match any letter"', 'Trie + try every child at a dot.'],
    ],
  },
  bits: {
    oneLiner: 'Numbers are stored as rows of 0s and 1s; bit operators flip and test all of those switches at once.',
    whyCare: 'A few tricks (XOR cancels pairs, n & (n − 1) removes a bit) turn some problems into one-liners with O(1) memory.',
    terms: [
      ['Bit', 'A single 0 or 1. 6 in binary is 110.'],
      ['AND (&)', '1 only where both inputs have 1.'],
      ['OR (|)', '1 where either input has 1.'],
      ['XOR (^)', '1 where the inputs differ. x ^ x = 0 and x ^ 0 = x.'],
      ['Shift (<<, >>)', 'Move bits left (×2) or right (÷2).'],
    ],
    example: {
      title: 'Find the number that appears once in [4, 1, 2, 1, 2]',
      steps: [
        'XOR everything: 4 ^ 1 ^ 2 ^ 1 ^ 2.',
        'Order does not matter, so regroup: 4 ^ (1 ^ 1) ^ (2 ^ 2).',
        '1 ^ 1 = 0 and 2 ^ 2 = 0.',
        '4 ^ 0 ^ 0 = 4. The lonely number is 4.',
      ],
      takeaway: 'Pairs cancel themselves out under XOR, so whatever is left appeared an odd number of times.',
    },
    confusions: [
      'Always use parentheses with bit operators; their precedence is lower than you expect.',
      'Python integers never overflow, so 32-bit tricks may need a mask (& 0xFFFFFFFF). In Java use >>> for an unsigned right shift.',
    ],
    watch: 'Predict the running XOR after each number, and watch the pairs cancel.',
    templateSteps: [
      'Start with acc = 0.',
      'For each number, do acc = acc ^ number.',
      'Return acc, everything that appeared twice cancelled to 0.',
    ],
    recognize: [
      ['"every element appears twice except one"', 'XOR everything.'],
      ['"count the 1 bits"', 'Repeat n & (n − 1) or use bit counting.'],
      ['"without using + or −"', 'XOR is addition without carry; AND then shift gives the carry.'],
    ],
  },
};

/** A reusable Big-O cheat sheet: what each complexity means for input size n. */
export const BIG_O_SHEET: [string, string, string][] = [
  ['O(1)', 'Same work for any input size', 'Reading arr[i], a map lookup'],
  ['O(log n)', 'Halves the problem each step (~30 steps for a billion)', 'Binary search'],
  ['O(n)', 'Looks at each item once', 'One loop over the array'],
  ['O(n log n)', 'A bit more than linear', 'Sorting'],
  ['O(n²)', 'Every pair of items', 'A loop inside a loop'],
  ['O(2ⁿ)', 'Doubles with each extra item', 'Trying every subset'],
];
