/* Monaco (the VS Code editor), bundled locally — no CDN — with only the pieces we need:
   core editor + standard contributions, Python and Java grammars, and the base editor worker. */
import { useEffect, useRef } from 'react';
import Editor, { loader, type OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/features/register.all';
import 'monaco-editor/languages/definitions/python/register';
import 'monaco-editor/languages/definitions/java/register';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import type { CourseId } from '../types';
import { useEffectiveTheme } from '../lib/theme';

(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });

let setupDone = false;
function setup() {
  if (setupDone) return;
  setupDone = true;
  monaco.editor.defineTheme('forge-light', {
    base: 'vs', inherit: true,
    rules: [
      { token: 'comment', foreground: '8B867C', fontStyle: 'italic' },
      { token: 'keyword', foreground: '1F5357' },
      { token: 'string', foreground: '8A5A2B' },
      { token: 'number', foreground: '7A4F9A' },
      { token: 'type', foreground: '3C6C95' },
    ],
    colors: {
      'editor.background': '#FCFBF8', 'editor.lineHighlightBackground': '#F3F0E9', 'editorLineNumber.foreground': '#B9B3A6',
      'editorLineNumber.activeForeground': '#57534C', 'editor.selectionBackground': '#D9E6E5', 'editorIndentGuide.background1': '#ECE8DF',
      'editorGutter.background': '#FCFBF8', 'editorWidget.background': '#F7F5F0', 'editorWidget.border': '#CBC4B4',
    },
  });
  monaco.editor.defineTheme('forge-dark', {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'comment', foreground: '737069', fontStyle: 'italic' },
      { token: 'keyword', foreground: '9CCBCC' },
      { token: 'string', foreground: 'D3A57A' },
      { token: 'number', foreground: 'C3A0E0' },
      { token: 'type', foreground: '8DB8E0' },
    ],
    colors: {
      'editor.background': '#1B1E24', 'editor.lineHighlightBackground': '#22262D', 'editorLineNumber.foreground': '#4A4F59',
      'editorLineNumber.activeForeground': '#A8A49B', 'editor.selectionBackground': '#2E4446', 'editorGutter.background': '#1B1E24',
      'editorWidget.background': '#16181D', 'editorWidget.border': '#3A3F49',
    },
  });

  const snippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
  const K = monaco.languages.CompletionItemKind;
  const py: [string, string, string][] = [
    ['heappush', 'heapq.heappush(${1:heap}, ${2:item})', 'push onto a min-heap'],
    ['heappop', 'heapq.heappop(${1:heap})', 'pop the smallest item'],
    ['heapify', 'heapq.heapify(${1:items})', 'O(n) in-place heapify'],
    ['deque', 'deque(${1})', 'collections.deque, O(1) at both ends'],
    ['popleft', 'popleft()', 'deque: O(1) pop from the left'],
    ['defaultdict', 'defaultdict(${1:list})', 'dict with default factory'],
    ['Counter', 'Counter(${1:iterable})', 'frequency map'],
    ['bisect_left', 'bisect_left(${1:a}, ${2:x})', 'first index with a[i] >= x'],
    ['bisect_right', 'bisect_right(${1:a}, ${2:x})', 'first index with a[i] > x'],
    ['enumerate', 'enumerate(${1:iterable})', 'index, value pairs'],
    ['inf', "float('inf')", 'positive infinity'],
    ['setrecursionlimit', 'sys.setrecursionlimit(${1:10**6})', 'raise the recursion limit'],
    ['cache', '@cache', 'functools.cache memoization'],
    ['fori', 'for ${1:i} in range(${2:n}):\n\t$0', 'for loop over range'],
    ['def', 'def ${1:name}(${2:args}):\n\t$0', 'function'],
    ['bfs', 'q = deque([${1:start}])\nseen = {${1:start}}\nwhile q:\n\tnode = q.popleft()\n\tfor nxt in ${2:graph}[node]:\n\t\tif nxt not in seen:\n\t\t\tseen.add(nxt)\n\t\t\tq.append(nxt)', 'BFS skeleton'],
  ];
  const java: [string, string, string][] = [
    ['HashMap', 'Map<${1:Integer}, ${2:Integer}> ${3:map} = new HashMap<>();', 'hash map'],
    ['HashSet', 'Set<${1:Integer}> ${2:set} = new HashSet<>();', 'hash set'],
    ['ArrayList', 'List<${1:Integer}> ${2:list} = new ArrayList<>();', 'dynamic array'],
    ['ArrayDeque', 'Deque<${1:Integer}> ${2:dq} = new ArrayDeque<>();', 'stack / queue'],
    ['PriorityQueue', 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>(${3});', 'min-heap'],
    ['maxHeap', 'PriorityQueue<Integer> ${1:pq} = new PriorityQueue<>(Collections.reverseOrder());', 'max-heap'],
    ['TreeMap', 'TreeMap<${1:Integer}, ${2:Integer}> ${3:tm} = new TreeMap<>();', 'sorted map'],
    ['StringBuilder', 'StringBuilder ${1:sb} = new StringBuilder();', 'mutable string'],
    ['getOrDefault', 'getOrDefault(${1:key}, ${2:0})', 'Map.getOrDefault'],
    ['merge', 'merge(${1:key}, 1, Integer::sum)', 'increment a count'],
    ['computeIfAbsent', 'computeIfAbsent(${1:key}, k -> new ArrayList<>())', 'map of lists'],
    ['sortBy', 'Arrays.sort(${1:arr}, (a, b) -> Integer.compare(a[${2:0}], b[${2:0}]));', 'sort int[][] by a column'],
    ['fill', 'Arrays.fill(${1:arr}, ${2:value});', 'Arrays.fill'],
    ['MAX', 'Integer.MAX_VALUE', 'int max'],
    ['MIN', 'Integer.MIN_VALUE', 'int min'],
    ['sout', 'System.out.println(${1});', 'print line'],
    ['fori', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', 'indexed for loop'],
    ['psvm', 'public static void main(String[] args) {\n\t$0\n}', 'main method'],
    ['bfs', 'Deque<Integer> q = new ArrayDeque<>();\nq.offer(${1:start});\nboolean[] seen = new boolean[${2:n}];\nseen[${1:start}] = true;\nwhile (!q.isEmpty()) {\n\tint u = q.poll();\n\tfor (int v : ${3:graph}.get(u)) {\n\t\tif (!seen[v]) { seen[v] = true; q.offer(v); }\n\t}\n}', 'BFS skeleton'],
  ];
  const provider = (items: [string, string, string][]) => ({
    provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => {
      const word = model.getWordUntilPosition(position);
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
      return {
        suggestions: items.map(([label, insertText, detail]) => ({
          label, insertText, detail, range, insertTextRules: snippet, kind: insertText.includes('\n') ? K.Snippet : K.Function,
        })),
      };
    },
  });
  monaco.languages.registerCompletionItemProvider('python', provider(py));
  monaco.languages.registerCompletionItemProvider('java', provider(java));
}

export interface EditorHandle {
  setMarkers: (markers: { line: number; message: string }[]) => void;
  focus: () => void;
}

interface Props {
  course: CourseId;
  value: string;
  onChange: (v: string) => void;
  onRun?: () => void;
  onSubmit?: () => void;
  onReady?: (h: EditorHandle) => void;
  readOnly?: boolean;
  height?: string | number;
  minimal?: boolean;
}

export default function CodeEditor({ course, value, onChange, onRun, onSubmit, onReady, readOnly, height = '100%', minimal }: Props) {
  const theme = useEffectiveTheme();
  const runRef = useRef(onRun);
  const submitRef = useRef(onSubmit);
  runRef.current = onRun;
  submitRef.current = onSubmit;
  const edRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  setup();

  const onMount: OnMount = (ed) => {
    edRef.current = ed as unknown as monaco.editor.IStandaloneCodeEditor;
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.());
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => submitRef.current?.());
    onReady?.({
      setMarkers: (markers) => {
        const model = ed.getModel();
        if (!model) return;
        monaco.editor.setModelMarkers(model as unknown as monaco.editor.ITextModel, 'judge', markers
          .filter((m) => m.line >= 1 && m.line <= model.getLineCount())
          .map((m) => ({
            startLineNumber: m.line, endLineNumber: m.line, startColumn: 1, endColumn: model.getLineMaxColumn(m.line),
            message: m.message, severity: monaco.MarkerSeverity.Error,
          })));
      },
      focus: () => ed.focus(),
    });
  };

  useEffect(() => () => { edRef.current = null; }, []);

  return (
    <Editor
      height={height}
      language={course}
      value={value}
      theme={theme === 'dark' ? 'forge-dark' : 'forge-light'}
      onChange={(v) => onChange(v ?? '')}
      onMount={onMount}
      loading={<div className="empty">Loading editor…</div>}
      options={{
        readOnly,
        fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace",
        fontSize: 13.5,
        lineHeight: 21,
        fontLigatures: false,
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'line',
        bracketPairColorization: { enabled: true },
        matchBrackets: 'always',
        autoClosingBrackets: 'always',
        autoIndent: 'full',
        guides: { indentation: true },
        padding: { top: 12, bottom: 12 },
        lineNumbers: minimal ? 'off' : 'on',
        glyphMargin: false,
        folding: !minimal,
        stickyScroll: { enabled: false },
        automaticLayout: true,
        quickSuggestions: { other: true, comments: false, strings: false },
        wordBasedSuggestions: 'currentDocument',
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        overviewRulerLanes: 0,
      }}
    />
  );
}
