import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useCourse } from '../App';
import CodeEditor from '../components/CodeEditor';
import { EngineStatus } from '../components/EngineStatus';
import { Kbd, MOD, Split } from '../components/ui';
import { execute, preload, type ExecResult } from '../lib/exec';
import type { CourseId } from '../types';

const DEFAULTS: Record<CourseId, string> = {
  python: `import sys
from collections import deque, Counter, defaultdict
import heapq

def main():
    data = sys.stdin.read().split()
    nums = list(map(int, data))
    print("sum:", sum(nums))
    print("top 2:", heapq.nlargest(2, nums))

main()
`,
  java: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        List<Integer> nums = new ArrayList<>();
        while (st.hasMoreTokens()) nums.add(Integer.parseInt(st.nextToken()));
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        maxHeap.addAll(nums);
        System.out.println("sum: " + nums.stream().mapToInt(Integer::intValue).sum());
        System.out.println("max: " + maxHeap.peek());
    }
}
`,
};

const key = (c: CourseId) => `scratch:${c}`;

export default function Scratchpad() {
  const { course, settings } = useCourse();
  const loc = useLocation() as { state?: { code?: string } };
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('3 1 4 1 5');
  const [res, setRes] = useState<ExecResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [runs, setRuns] = useState(0);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(key(course)); } catch { /* ignore */ }
    setCode(loc.state?.code ?? saved ?? DEFAULTS[course]);
    setRes(null);
    preload(course);
  }, [course, loc.state]);

  const change = (v: string) => { setCode(v); try { localStorage.setItem(key(course), v); } catch { /* ignore */ } };

  const run = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setRuns((n) => n + 1);
    try {
      const mainClass = course === 'java' ? (/public\s+(?:final\s+)?class\s+(\w+)/.exec(code)?.[1] ?? 'Main') : undefined;
      setRes(await execute(settings, { language: course, source: code, stdin, timeoutMs: settings.timeoutMs, memoryMb: settings.memoryMb, mainClass }));
    } finally {
      setBusy(false);
    }
  }, [busy, code, course, settings, stdin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void run(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run]);

  const statusText: Record<ExecResult['status'], string> = {
    ok: 'Finished', 'compile-error': 'Compile error', 'runtime-error': 'Runtime error', timeout: 'Time Limit Exceeded',
    'output-limit': 'Output limit exceeded', 'memory-limit': 'Memory limit exceeded', 'engine-error': 'Engine error',
  };

  return (
    <div className="ws">
      <div className="ws-bar">
        <span style={{ fontWeight: 600 }}>Scratchpad</span>
        <span className="faint small hide-sm">{course === 'java' ? 'Write a public class with main(). In-browser Java compiles as Java 8.' : 'Any Python 3 program; input() and sys.stdin read the box below.'}</span>
        <div className="grow" />
        <EngineStatus course={course} />
        <button className="btn sm ghost" onClick={() => change(DEFAULTS[course])}>Reset</button>
        <button className="btn sm primary" onClick={() => void run()} disabled={busy}><Play size={13} /> {busy ? 'Running…' : 'Run'} <span className="hide-sm"><Kbd>{MOD}</Kbd><Kbd>↵</Kbd></span></button>
      </div>
      <div className="ws-body">
        <Split id="scratch-h" initial={62} min={25} tabs={['Code', 'Input and output']} showSecond={runs}>
          <CodeEditor course={course} value={code} onChange={change} onRun={() => void run()} />
          <Split id="scratch-v" dir="v" initial={30} min={15}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="panel-head">stdin</div>
              <textarea className="mono" style={{ flex: 1, border: 0, borderRadius: 0, resize: 'none' }} value={stdin} onChange={(e) => setStdin(e.target.value)} spellCheck={false} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="panel-head">
                <span>output</span>
                {res && <span className="mono">{statusText[res.status]}, {res.engine}, {res.wallMs} ms</span>}
              </div>
              <div className="pane-scroll console">
                {busy && <span className="faint">Running…</span>}
                {!busy && res && (
                  <>
                    {res.compileOutput && <div className="err">{res.compileOutput}</div>}
                    {res.message && <div className="err">{res.message}</div>}
                    {res.stdout && <div>{res.stdout}</div>}
                    {res.stderr && <div className="err">{res.stderr}</div>}
                    {res.status === 'timeout' && <div className="err">Stopped after {settings.timeoutMs / 1000}s.</div>}
                    {!res.stdout && !res.stderr && !res.compileOutput && !res.message && res.status === 'ok' && <span className="faint">(no output)</span>}
                  </>
                )}
              </div>
            </div>
          </Split>
        </Split>
      </div>
    </div>
  );
}
