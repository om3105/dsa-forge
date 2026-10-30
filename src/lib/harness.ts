/* Judge harness.
 *
 * The user only writes the solution. Before running we wrap it with a driver
 * (generated from the problem's language-neutral signature) that:
 *   - reads all test cases from stdin (first line = count, then one JSON value per parameter),
 *   - converts JSON into the language's native types (int[], ListNode, TreeNode, ...),
 *   - calls the user's function/class, times it, catches exceptions,
 *   - prints one marker line per test with the JSON-serialized result.
 * Running every test in a single process means Java compiles once per submit.
 * User code keeps its original line numbers so errors point at the right line.
 */
import type { CompareMode, CourseId, FunctionSig, Param, Problem, ValueType } from '../types';
import expectedJson from '../data/expected.json';

export const MARKER = '@@DSAFORGE@@';
const EXPECTED = expectedJson as Record<string, unknown[]>;

export const expectedFor = (p: Problem): unknown[] => EXPECTED[p.id] ?? [];

export const snake = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();

function usesType(p: Problem, t: 'ListNode' | 'TreeNode'): boolean {
  const sig = p.signature!;
  const types: ValueType[] = sig.kind === 'function'
    ? [...sig.params.map((x) => x.type), sig.returns]
    : [...sig.ctor.map((x) => x.type), ...sig.methods.flatMap((m) => [...m.params.map((x) => x.type), m.returns])];
  return types.some((x) => x.startsWith(t));
}

// ------------------------------------------------------------------ Python

const PY_TYPE: Record<ValueType, string> = {
  int: 'int', long: 'int', double: 'float', bool: 'bool', string: 'str',
  'int[]': 'list[int]', 'string[]': 'list[str]', 'int[][]': 'list[list[int]]', 'char[][]': 'list[list[str]]',
  'list<int>': 'list[int]', 'list<string>': 'list[str]', 'list<list<int>>': 'list[list[int]]', 'list<list<string>>': 'list[list[str]]',
  ListNode: 'ListNode | None', 'ListNode[]': 'list[ListNode | None]', TreeNode: 'TreeNode | None', void: 'None',
};

const PY_DEFAULT_RETURN: Partial<Record<ValueType, string>> = {
  int: '0', long: '0', double: '0.0', bool: 'False', string: '""', void: '',
};

function pyParams(ps: Param[]) {
  return ps.map((p) => `${snake(p.name)}: ${PY_TYPE[p.type]}`).join(', ');
}

const PY_NODE_DEFS: Record<'ListNode' | 'TreeNode', string> = {
  ListNode: `# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next`,
  TreeNode: `# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right`,
};

export function pythonStarter(p: Problem): string {
  const sig = p.signature!;
  const notes: string[] = [];
  if (usesType(p, 'ListNode')) notes.push('# Provided by the judge:\n' + PY_NODE_DEFS.ListNode);
  if (usesType(p, 'TreeNode')) notes.push('# Provided by the judge:\n' + PY_NODE_DEFS.TreeNode);
  const head = notes.length ? notes.join('\n\n') + '\n\n\n' : '';
  if (sig.kind === 'function') {
    const body = sig.returns === 'void' ? '    pass  # modify the input in place' : '    pass';
    return `${head}def ${snake(sig.name)}(${pyParams(sig.params)}) -> ${PY_TYPE[sig.returns]}:\n${body}\n`;
  }
  const methods = sig.methods.map((m) => {
    const ps = m.params.length ? ', ' + pyParams(m.params) : '';
    return `    def ${snake(m.name)}(self${ps}) -> ${PY_TYPE[m.returns]}:\n        pass`;
  });
  const ctorPs = sig.ctor.length ? ', ' + pyParams(sig.ctor) : '';
  return `${head}class ${sig.className}:\n    def __init__(self${ctorPs}) -> None:\n        pass\n\n${methods.join('\n\n')}\n`;
}

const PY_DRIVER = String.raw`
import sys, json, time, traceback

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
    def __repr__(self):
        return 'ListNode(' + json.dumps(_ser_list(self)) + ')'

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
    def __repr__(self):
        return 'TreeNode(' + json.dumps(_ser_tree(self)) + ')'

def _build_list(a):
    dummy = ListNode()
    cur = dummy
    for v in a:
        cur.next = ListNode(v)
        cur = cur.next
    return dummy.next

def _ser_list(n):
    out = []
    while n is not None and len(out) < 100000:
        out.append(n.val)
        n = n.next
    return out

def _build_tree(a):
    if not a or a[0] is None:
        return None
    root = TreeNode(a[0])
    q = [root]
    qi, i = 0, 1
    while qi < len(q) and i < len(a):
        n = q[qi]; qi += 1
        if i < len(a) and a[i] is not None:
            n.left = TreeNode(a[i]); q.append(n.left)
        i += 1
        if i < len(a) and a[i] is not None:
            n.right = TreeNode(a[i]); q.append(n.right)
        i += 1
    return root

def _ser_tree(root):
    out, q, qi = [], [root], 0
    while qi < len(q):
        n = q[qi]; qi += 1
        if n is None:
            out.append(None)
            continue
        out.append(n.val)
        q.append(n.left); q.append(n.right)
    while out and out[-1] is None:
        out.pop()
    return out

def _conv_in(t, v):
    if t == 'ListNode': return _build_list(v)
    if t == 'ListNode[]': return [_build_list(x) for x in v]
    if t == 'TreeNode': return _build_tree(v)
    if t == 'double': return float(v)
    return v

def _norm(v):
    if isinstance(v, ListNode): return _ser_list(v)
    if isinstance(v, TreeNode): return _ser_tree(v)
    if isinstance(v, (list, tuple, set, frozenset)) or type(v).__name__ == 'deque':
        return [_norm(x) for x in v]
    if isinstance(v, dict): return {str(k): _norm(x) for k, x in v.items()}
    if v is None or isinstance(v, (bool, int, float, str)): return v
    return repr(v)

def _user_tb(e):
    frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == 'solution.py']
    lines = ['Traceback (most recent call last):']
    for f in frames:
        lines.append('  File "solution.py", line %d, in %s' % (f.lineno, f.name))
        if f.line: lines.append('    ' + f.line)
    lines.extend(x.rstrip('\n') for x in traceback.format_exception_only(type(e), e))
    return '\n'.join(lines)

def _emit(obj):
    sys.stdout.write('${MARKER}' + json.dumps(obj) + '\n')
    sys.stdout.flush()

_ns = {'__name__': '__solution__', 'ListNode': ListNode, 'TreeNode': TreeNode}
try:
    from typing import List, Optional, Dict, Set, Tuple
    _ns.update(List=List, Optional=Optional, Dict=Dict, Set=Set, Tuple=Tuple)
except Exception:
    pass

def _main():
    try:
        exec(compile(_USER_SRC, 'solution.py', 'exec'), _ns)
    except SyntaxError as e:
        sys.stderr.write('  File "solution.py", line %s\n' % e.lineno)
        if e.text: sys.stderr.write('    ' + e.text.rstrip() + '\n')
        sys.stderr.write('%s: %s\n' % (type(e).__name__, e.msg))
        sys.exit(1)
    except BaseException as e:
        sys.stderr.write(_user_tb(e) + '\n')
        sys.exit(1)
    data = sys.stdin.read().split('\n')
    pos = 0
    def nxt():
        nonlocal pos
        while pos < len(data) and data[pos].strip() == '':
            pos += 1
        line = data[pos]; pos += 1
        return json.loads(line)
    total = nxt()
    for i in range(total):
        try:
            if _SIG['kind'] == 'function':
                args = [_conv_in(p['type'], nxt()) for p in _SIG['params']]
                fn = _ns.get(_FN)
                if fn is None and 'Solution' in _ns:
                    fn = getattr(_ns['Solution'](), _SIG['name'], None) or getattr(_ns['Solution'](), _FN, None)
                if fn is None:
                    raise NameError("function '%s' is not defined" % _FN)
                t0 = time.perf_counter()
                res = fn(*args)
                us = int((time.perf_counter() - t0) * 1e6)
                if _SIG['returns'] == 'void':
                    res = args[_SIG.get('mutates', 0)]
                if res is None and _SIG['returns'] in ('ListNode', 'TreeNode'):
                    res = []
                _emit({'i': i, 'ok': True, 'out': _norm(res), 'us': us})
            else:
                ops, argv = nxt(), nxt()
                cls = _ns.get(ops[0])
                if cls is None:
                    raise NameError("class '%s' is not defined" % ops[0])
                t0 = time.perf_counter()
                obj = cls(*argv[0])
                out = [None]
                for op, a in zip(ops[1:], argv[1:]):
                    m = getattr(obj, _SNAKE.get(op, op), None) or getattr(obj, op)
                    out.append(m(*a))
                us = int((time.perf_counter() - t0) * 1e6)
                _emit({'i': i, 'ok': True, 'out': _norm(out), 'us': us})
        except RecursionError as e:
            _emit({'i': i, 'ok': False, 'err': _user_tb(e) + '\n(RecursionError: Python\'s default recursion limit is 1000. Consider sys.setrecursionlimit or an iterative approach.)'})
        except Exception as e:
            _emit({'i': i, 'ok': False, 'err': _user_tb(e)})

_main()
`;

export function pythonProgram(p: Problem, userCode: string): string {
  const sig = p.signature!;
  const fnName = sig.kind === 'function' ? snake(sig.name) : '';
  const snakeMap = sig.kind === 'design' ? Object.fromEntries(sig.methods.map((m) => [m.name, snake(m.name)])) : {};
  // JSON string literals are valid Python string literals, so data is embedded via json.loads.
  const lit = (v: unknown) => JSON.stringify(JSON.stringify(v));
  return [
    'import json as _json',
    `_USER_SRC = ${JSON.stringify(userCode)}`,
    `_SIG = _json.loads(${lit(sig)})`,
    `_FN = ${JSON.stringify(fnName)}`,
    `_SNAKE = _json.loads(${lit(snakeMap)})`,
    PY_DRIVER.replace('${MARKER}', MARKER),
  ].join('\n');
}

// ------------------------------------------------------------------ Java

const JAVA_TYPE: Record<ValueType, string> = {
  int: 'int', long: 'long', double: 'double', bool: 'boolean', string: 'String',
  'int[]': 'int[]', 'string[]': 'String[]', 'int[][]': 'int[][]', 'char[][]': 'char[][]',
  'list<int>': 'List<Integer>', 'list<string>': 'List<String>', 'list<list<int>>': 'List<List<Integer>>', 'list<list<string>>': 'List<List<String>>',
  ListNode: 'ListNode', 'ListNode[]': 'ListNode[]', TreeNode: 'TreeNode', void: 'void',
};

const JAVA_CONV: Record<ValueType, (x: string) => string> = {
  int: (x) => `((Number)${x}).intValue()`,
  long: (x) => `((Number)${x}).longValue()`,
  double: (x) => `((Number)${x}).doubleValue()`,
  bool: (x) => `((Boolean)${x}).booleanValue()`,
  string: (x) => `(String)${x}`,
  'int[]': (x) => `J.intArr(${x})`,
  'string[]': (x) => `J.strArr(${x})`,
  'int[][]': (x) => `J.int2D(${x})`,
  'char[][]': (x) => `J.char2D(${x})`,
  'list<int>': (x) => `J.intList(${x})`,
  'list<string>': (x) => `J.strList(${x})`,
  'list<list<int>>': (x) => `J.intListList(${x})`,
  'list<list<string>>': (x) => `J.strListList(${x})`,
  ListNode: (x) => `J.toLL(${x})`,
  'ListNode[]': (x) => `J.toLLArr(${x})`,
  TreeNode: (x) => `J.toTree(${x})`,
  void: () => 'null',
};

const JAVA_DEFAULT: Partial<Record<ValueType, string>> = {
  int: '0', long: '0L', double: '0.0', bool: 'false', string: '""', void: '',
};

const JAVA_NODE_COMMENTS: Record<'ListNode' | 'TreeNode', string> = {
  ListNode: `/**\n * Provided by the judge:\n * class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */`,
  TreeNode: `/**\n * Provided by the judge:\n * class TreeNode {\n *     int val;\n *     TreeNode left, right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) { ... }\n * }\n */`,
};

function javaParams(ps: Param[]) {
  return ps.map((p) => `${JAVA_TYPE[p.type]} ${p.name}`).join(', ');
}

export function javaStarter(p: Problem): string {
  const sig = p.signature!;
  const notes: string[] = [];
  if (usesType(p, 'ListNode')) notes.push(JAVA_NODE_COMMENTS.ListNode);
  if (usesType(p, 'TreeNode')) notes.push(JAVA_NODE_COMMENTS.TreeNode);
  const head = 'import java.util.*;\n\n' + (notes.length ? notes.join('\n') + '\n' : '');
  const ret = (t: ValueType) => (t === 'void' ? '' : `\n        return ${JAVA_DEFAULT[t] ?? 'null'};`);
  if (sig.kind === 'function') {
    const comment = sig.returns === 'void' ? '\n        // modify the input in place' : '';
    return `${head}class Solution {\n    public ${JAVA_TYPE[sig.returns]} ${sig.name}(${javaParams(sig.params)}) {${comment}${ret(sig.returns)}\n    }\n}\n`;
  }
  const methods = sig.methods.map((m) => `    public ${JAVA_TYPE[m.returns]} ${m.name}(${javaParams(m.params)}) {${ret(m.returns)}\n    }`);
  return `${head}class ${sig.className} {\n\n    public ${sig.className}(${javaParams(sig.ctor)}) {\n    }\n\n${methods.join('\n\n')}\n}\n`;
}

/* Java 8 compatible (the in-browser engine compiles with javac 8). No // comments: it is joined onto one line. */
function javaJsonHelpers(hasList: boolean, hasTree: boolean): string {
  return `
static class J {
  static String src; static int p;
  static Object parse(String s) { src = s; p = 0; Object v = val(); return v; }
  static void ws() { while (p < src.length() && Character.isWhitespace(src.charAt(p))) p++; }
  static Object val() {
    ws(); char c = src.charAt(p);
    if (c == '[') { p++; java.util.ArrayList<Object> a = new java.util.ArrayList<Object>(); ws();
      if (src.charAt(p) == ']') { p++; return a; }
      while (true) { a.add(val()); ws(); char d = src.charAt(p++); if (d == ']') return a; } }
    if (c == '"') { p++; StringBuilder b = new StringBuilder();
      while (true) { char d = src.charAt(p++); if (d == '"') break;
        if (d == '\\\\') { char e = src.charAt(p++);
          if (e == 'n') b.append('\\n'); else if (e == 't') b.append('\\t'); else if (e == 'r') b.append('\\r'); else if (e == 'b') b.append('\\b'); else if (e == 'f') b.append('\\f');
          else if (e == 'u') { b.append((char) Integer.parseInt(src.substring(p, p + 4), 16)); p += 4; } else b.append(e); }
        else b.append(d); }
      return b.toString(); }
    if (src.startsWith("null", p)) { p += 4; return null; }
    if (src.startsWith("true", p)) { p += 4; return Boolean.TRUE; }
    if (src.startsWith("false", p)) { p += 5; return Boolean.FALSE; }
    int st = p; while (p < src.length() && "+-0123456789.eE".indexOf(src.charAt(p)) >= 0) p++;
    String num = src.substring(st, p);
    if (num.indexOf('.') >= 0 || num.indexOf('e') >= 0 || num.indexOf('E') >= 0) return Double.valueOf(num);
    return Long.valueOf(num);
  }
  @SuppressWarnings("unchecked") static java.util.List<Object> L(Object o) { return (java.util.List<Object>) o; }
  static int[] intArr(Object o) { java.util.List<Object> l = L(o); int[] r = new int[l.size()]; for (int i = 0; i < r.length; i++) r[i] = ((Number) l.get(i)).intValue(); return r; }
  static String[] strArr(Object o) { java.util.List<Object> l = L(o); String[] r = new String[l.size()]; for (int i = 0; i < r.length; i++) r[i] = (String) l.get(i); return r; }
  static int[][] int2D(Object o) { java.util.List<Object> l = L(o); int[][] r = new int[l.size()][]; for (int i = 0; i < r.length; i++) r[i] = intArr(l.get(i)); return r; }
  static char[][] char2D(Object o) { java.util.List<Object> l = L(o); char[][] r = new char[l.size()][]; for (int i = 0; i < r.length; i++) { java.util.List<Object> row = L(l.get(i)); r[i] = new char[row.size()]; for (int j = 0; j < row.size(); j++) r[i][j] = ((String) row.get(j)).charAt(0); } return r; }
  static java.util.List<Integer> intList(Object o) { java.util.List<Integer> r = new java.util.ArrayList<Integer>(); for (Object x : L(o)) r.add(((Number) x).intValue()); return r; }
  static java.util.List<String> strList(Object o) { java.util.List<String> r = new java.util.ArrayList<String>(); for (Object x : L(o)) r.add((String) x); return r; }
  static java.util.List<java.util.List<Integer>> intListList(Object o) { java.util.List<java.util.List<Integer>> r = new java.util.ArrayList<java.util.List<Integer>>(); for (Object x : L(o)) r.add(intList(x)); return r; }
  static java.util.List<java.util.List<String>> strListList(Object o) { java.util.List<java.util.List<String>> r = new java.util.ArrayList<java.util.List<String>>(); for (Object x : L(o)) r.add(strList(x)); return r; }
  ${hasList ? `static ListNode toLL(Object o) { ListNode d = new ListNode(0), c = d; for (Object x : L(o)) { c.next = new ListNode(((Number) x).intValue()); c = c.next; } return d.next; }
  static ListNode[] toLLArr(Object o) { java.util.List<Object> l = L(o); ListNode[] r = new ListNode[l.size()]; for (int i = 0; i < r.length; i++) r[i] = toLL(l.get(i)); return r; }` : ''}
  ${hasTree ? `static TreeNode toTree(Object o) { java.util.List<Object> a = L(o); if (a.isEmpty() || a.get(0) == null) return null;
    TreeNode root = new TreeNode(((Number) a.get(0)).intValue()); java.util.ArrayDeque<TreeNode> q = new java.util.ArrayDeque<TreeNode>(); q.add(root); int i = 1;
    while (!q.isEmpty() && i < a.size()) { TreeNode n = q.poll();
      if (i < a.size() && a.get(i) != null) { n.left = new TreeNode(((Number) a.get(i)).intValue()); q.add(n.left); } i++;
      if (i < a.size() && a.get(i) != null) { n.right = new TreeNode(((Number) a.get(i)).intValue()); q.add(n.right); } i++; }
    return root; }` : ''}
  static Object arg(Class<?> t, Object o) {
    if (t == int.class || t == Integer.class) return ((Number) o).intValue();
    if (t == long.class || t == Long.class) return ((Number) o).longValue();
    if (t == double.class || t == Double.class) return ((Number) o).doubleValue();
    if (t == boolean.class || t == Boolean.class) return o;
    if (t == char.class || t == Character.class) return ((String) o).charAt(0);
    if (t == int[].class) return intArr(o);
    if (t == String[].class) return strArr(o);
    if (t == int[][].class) return int2D(o);
    return o;
  }
  static void str(String s, StringBuilder b) { b.append('"');
    for (int i = 0; i < s.length(); i++) { char c = s.charAt(i);
      if (c == '"') b.append("\\\\\\""); else if (c == '\\\\') b.append("\\\\\\\\"); else if (c == '\\n') b.append("\\\\n"); else if (c == '\\r') b.append("\\\\r"); else if (c == '\\t') b.append("\\\\t");
      else if (c < 32) b.append(String.format("\\\\u%04x", (int) c)); else b.append(c); }
    b.append('"'); }
  static void ser(Object o, StringBuilder b) {
    if (o == null) { b.append("null"); return; }
    if (o instanceof String) { str((String) o, b); return; }
    if (o instanceof Character) { str(String.valueOf(o), b); return; }
    if (o instanceof Boolean || o instanceof Integer || o instanceof Long || o instanceof Short || o instanceof Byte) { b.append(o); return; }
    if (o instanceof Double || o instanceof Float) { double d = ((Number) o).doubleValue(); if (Double.isNaN(d) || Double.isInfinite(d)) str(String.valueOf(d), b); else b.append(d); return; }
    if (o instanceof int[]) { int[] a = (int[]) o; b.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } b.append(']'); return; }
    if (o instanceof long[]) { long[] a = (long[]) o; b.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } b.append(']'); return; }
    if (o instanceof double[]) { double[] a = (double[]) o; b.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); ser(a[i], b); } b.append(']'); return; }
    if (o instanceof boolean[]) { boolean[] a = (boolean[]) o; b.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } b.append(']'); return; }
    if (o instanceof char[]) { char[] a = (char[]) o; b.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); str(String.valueOf(a[i]), b); } b.append(']'); return; }
    if (o instanceof Object[]) { Object[] a = (Object[]) o; b.append('['); for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); ser(a[i], b); } b.append(']'); return; }
    if (o instanceof Iterable) { b.append('['); boolean f = true; for (Object x : (Iterable<?>) o) { if (!f) b.append(','); f = false; ser(x, b); } b.append(']'); return; }
    ${hasList ? `if (o instanceof ListNode) { b.append('['); ListNode n = (ListNode) o; int k = 0; while (n != null && k < 100000) { if (k > 0) b.append(','); b.append(n.val); n = n.next; k++; } b.append(']'); return; }` : ''}
    ${hasTree ? `if (o instanceof TreeNode) { java.util.ArrayList<String> out = new java.util.ArrayList<String>(); java.util.ArrayList<TreeNode> q = new java.util.ArrayList<TreeNode>(); q.add((TreeNode) o);
      for (int i = 0; i < q.size(); i++) { TreeNode n = q.get(i); if (n == null) { out.add("null"); continue; } out.add(String.valueOf(n.val)); q.add(n.left); q.add(n.right); }
      while (!out.isEmpty() && out.get(out.size() - 1).equals("null")) out.remove(out.size() - 1);
      b.append('['); for (int i = 0; i < out.size(); i++) { if (i > 0) b.append(','); b.append(out.get(i)); } b.append(']'); return; }` : ''}
    str(String.valueOf(o), b);
  }
  static String err(Throwable t) {
    StringBuilder b = new StringBuilder(t.toString());
    for (StackTraceElement e : t.getStackTrace()) {
      String c = e.getClassName();
      if (c.equals("Main") || c.startsWith("Main$") || c.startsWith("java.") || c.startsWith("jdk.") || c.startsWith("sun.")) continue;
      b.append("\\n    at ").append(c).append('.').append(e.getMethodName()).append(" (line ").append(e.getLineNumber()).append(')');
    }
    if (t instanceof StackOverflowError) b.append("\\n(StackOverflowError: recursion too deep or missing base case)");
    return b.toString();
  }
  static void emit(int i, boolean ok, Object out, String err, long ns) {
    StringBuilder b = new StringBuilder("${MARKER}{\\"i\\":").append(i).append(",\\"ok\\":").append(ok);
    if (ok) { b.append(",\\"out\\":"); ser(out, b); b.append(",\\"us\\":").append(ns / 1000); }
    else { b.append(",\\"err\\":"); str(err, b); }
    b.append('}'); System.out.println(b); System.out.flush();
  }
}`;
}

function javaMain(p: Problem): string {
  const sig = p.signature!;
  let body: string;
  if (sig.kind === 'function') {
    const f = sig as FunctionSig;
    const decls = f.params.map((pr, k) => `${JAVA_TYPE[pr.type]} a${k} = ${JAVA_CONV[pr.type](`J.parse(next(lines))`)};`).join(' ');
    const args = f.params.map((_, k) => `a${k}`).join(', ');
    const call = f.returns === 'void'
      ? `new Solution().${f.name}(${args}); Object r = a${f.mutates ?? 0};`
      : `Object r = new Solution().${f.name}(${args});${f.returns === 'ListNode' || f.returns === 'TreeNode' ? ' if (r == null) r = new java.util.ArrayList<Object>();' : ''}`;
    body = `${decls} long t0 = System.nanoTime(); ${call} long t1 = System.nanoTime(); J.emit(i, true, r, null, t1 - t0);`;
  } else {
    body = `java.util.List<Object> ops = J.L(J.parse(next(lines))); java.util.List<Object> av = J.L(J.parse(next(lines)));
      long t0 = System.nanoTime(); Class<?> c = Class.forName((String) ops.get(0));
      java.lang.reflect.Constructor<?> ct = null; for (java.lang.reflect.Constructor<?> x : c.getDeclaredConstructors()) if (x.getParameterTypes().length == J.L(av.get(0)).size()) ct = x;
      if (ct == null) throw new NoSuchMethodException("constructor for " + ops.get(0));
      ct.setAccessible(true); Object obj = ct.newInstance(conv(ct.getParameterTypes(), J.L(av.get(0))));
      java.util.ArrayList<Object> out = new java.util.ArrayList<Object>(); out.add(null);
      for (int k = 1; k < ops.size(); k++) { String name = (String) ops.get(k); java.util.List<Object> a = J.L(av.get(k)); java.lang.reflect.Method m = null;
        for (java.lang.reflect.Method x : c.getDeclaredMethods()) if (x.getName().equals(name) && x.getParameterTypes().length == a.size()) m = x;
        if (m == null) throw new NoSuchMethodException(name);
        m.setAccessible(true); Object r = m.invoke(obj, conv(m.getParameterTypes(), a)); out.add(m.getReturnType() == void.class ? null : r); }
      long t1 = System.nanoTime(); J.emit(i, true, out, null, t1 - t0);`;
  }
  return `
public class Main {
  static int pos = 0;
  static String next(java.util.List<String> l) { while (l.get(pos).trim().isEmpty()) pos++; return l.get(pos++); }
  static Object[] conv(Class<?>[] t, java.util.List<Object> a) { Object[] r = new Object[t.length]; for (int k = 0; k < t.length; k++) r[k] = J.arg(t[k], a.get(k)); return r; }
  public static void main(String[] argv) throws Exception {
    java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
    java.util.ArrayList<String> lines = new java.util.ArrayList<String>(); String ln; while ((ln = br.readLine()) != null) lines.add(ln);
    int n = Integer.parseInt(next(lines).trim());
    for (int i = 0; i < n; i++) {
      try { ${body} }
      ${sig.kind === 'design' ? 'catch (java.lang.reflect.InvocationTargetException e) { J.emit(i, false, null, J.err(e.getCause()), 0); }' : ''}
      catch (Throwable e) { J.emit(i, false, null, J.err(e), 0); }
    }
  }
  ${javaJsonHelpers(usesType(p, 'ListNode'), usesType(p, 'TreeNode'))}
}`;
}

const JAVA_NODE_CLASSES: Record<'ListNode' | 'TreeNode', string> = {
  ListNode: `class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } public String toString() { StringBuilder b = new StringBuilder(); Main.J.ser(this, b); return "ListNode" + b; } }`,
  TreeNode: `class TreeNode { int val; TreeNode left; TreeNode right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; } public String toString() { StringBuilder b = new StringBuilder(); Main.J.ser(this, b); return "TreeNode" + b; } }`,
};

const oneLine = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean).join(' ');

/** Inserts `prefix` at the start of the first line that is not package/import/comment/blank, preserving line numbers. */
export function injectBeforeFirstType(userCode: string, injected: string): string {
  const lines = userCode.split('\n');
  let inBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (inBlock) { if (t.includes('*/')) inBlock = false; continue; }
    if (t === '' || t.startsWith('//') || t.startsWith('import ') || t.startsWith('package ')) continue;
    if (t.startsWith('/*')) { if (!t.includes('*/')) inBlock = true; continue; }
    const indent = lines[i].length - lines[i].trimStart().length;
    lines[i] = lines[i].slice(0, indent) + injected + ' ' + lines[i].slice(indent);
    return lines.join('\n');
  }
  return userCode + '\n' + injected;
}

export function javaProgram(p: Problem, userCode: string): string {
  const extras: string[] = [];
  if (usesType(p, 'ListNode')) extras.push(JAVA_NODE_CLASSES.ListNode);
  if (usesType(p, 'TreeNode')) extras.push(JAVA_NODE_CLASSES.TreeNode);
  const program = injectBeforeFirstType(userCode, oneLine(javaMain(p)));
  return program + '\n' + extras.join('\n') + '\n';
}

// ------------------------------------------------------------------ shared

export function starterCode(course: CourseId, p: Problem): string {
  return course === 'python' ? pythonStarter(p) : javaStarter(p);
}

export function buildProgram(course: CourseId, p: Problem, userCode: string): string {
  return course === 'python' ? pythonProgram(p, userCode) : javaProgram(p, userCode);
}

/** test inputs -> stdin text */
export function buildStdin(inputs: unknown[][]): string {
  const lines = [String(inputs.length)];
  for (const inp of inputs) {
    for (const v of inp) lines.push(JSON.stringify(v));
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

/** Formats a test case input for the editable "custom input" box: one JSON value per line, blank line between cases. */
export const formatInputs = (inputs: unknown[][]) => inputs.map((inp) => inp.map((v) => JSON.stringify(v)).join('\n')).join('\n\n');

export function parseCustomInput(p: Problem, text: string): { cases: unknown[][]; error?: string } {
  const per = p.signature!.kind === 'function' ? (p.signature as FunctionSig).params.length : 2;
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  if (per === 0) return { cases: [[]] };
  if (lines.length === 0 || lines.length % per !== 0) {
    return { cases: [], error: `Expected ${per} line(s) per test case (one JSON value per parameter), got ${lines.length}.` };
  }
  const cases: unknown[][] = [];
  try {
    for (let i = 0; i < lines.length; i += per) cases.push(lines.slice(i, i + per).map((l) => JSON.parse(l)));
  } catch (e) {
    return { cases: [], error: 'Invalid JSON in custom input: ' + (e as Error).message };
  }
  return { cases };
}

export interface CaseResult {
  index: number;
  ok: boolean; // ran without exception
  output?: unknown;
  error?: string;
  micros?: number;
  stdout: string; // user prints during this case
  expected?: unknown;
  passed?: boolean;
}

/** Splits raw stdout into per-case results using marker lines. */
export function parseRun(stdout: string, count: number): { cases: CaseResult[]; trailing: string } {
  const cases: CaseResult[] = [];
  let buf: string[] = [];
  for (const line of stdout.split('\n')) {
    const at = line.indexOf(MARKER);
    if (at >= 0) {
      if (at > 0) buf.push(line.slice(0, at));
      try {
        const r = JSON.parse(line.slice(at + MARKER.length));
        cases.push({ index: r.i, ok: r.ok, output: r.out, error: r.err, micros: r.us, stdout: buf.join('\n') });
      } catch {
        buf.push(line);
        continue;
      }
      buf = [];
    } else buf.push(line);
  }
  void count;
  return { cases, trailing: buf.join('\n').replace(/\n+$/, '') };
}

const isNum = (x: unknown): x is number => typeof x === 'number';

function deepEq(a: unknown, b: unknown, float: boolean): boolean {
  if (isNum(a) && isNum(b)) return float ? Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(b)) : a === b;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEq(x, b[i], float));
  return a === b;
}

const key = (x: unknown) => JSON.stringify(x);
const sortArr = (a: unknown[]) => [...a].sort((x, y) => (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0));

export function compareOutput(mode: CompareMode, actual: unknown, expected: unknown): boolean {
  if (mode === 'float') return deepEq(actual, expected, true);
  if (mode === 'exact') return deepEq(actual, expected, false);
  if (!Array.isArray(actual) || !Array.isArray(expected)) return deepEq(actual, expected, false);
  if (mode === 'unordered') return deepEq(sortArr(actual), sortArr(expected), false);
  const norm = (a: unknown[]) => sortArr(a.map((x) => (Array.isArray(x) ? sortArr(x) : x)));
  return deepEq(norm(actual), norm(expected), false);
}

/** Line numbers referenced by compile errors / tracebacks, for editor markers. */
export function errorLines(course: CourseId, text: string): { line: number; message: string }[] {
  const out: { line: number; message: string }[] = [];
  if (course === 'python') {
    const re = /File "solution\.py", line (\d+)/g;
    let m: RegExpExecArray | null;
    let last = 0;
    while ((m = re.exec(text))) last = Number(m[1]);
    if (last) out.push({ line: last, message: text.trim().split('\n').pop() ?? 'error' });
  } else {
    const re = /(?:Main|[A-Za-z_]\w*)\.java:(\d+): error: (.*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) out.push({ line: Number(m[1]), message: m[2] });
    const rt = /\(line (\d+)\)/.exec(text);
    if (!out.length && rt) out.push({ line: Number(rt[1]), message: text.split('\n')[0] });
  }
  return out;
}
