/* In-browser fallback engines.
 * Python: Pyodide in a Web Worker. Java: CheerpJ (JVM in WebAssembly/JS) inside a hidden iframe.
 * Both are created lazily on first use and torn down on timeout (that is how an infinite loop is stopped).
 */
import type { CourseId } from '../../types';
import { OUTPUT_LIMIT, type ExecRequest, type ExecResult } from './types';

type StatusFn = (lang: CourseId, state: 'idle' | 'loading' | 'ready' | 'error', message?: string) => void;
let onStatus: StatusFn = () => {};
export const setBrowserStatusListener = (fn: StatusFn) => { onStatus = fn; };

const base = import.meta.env.BASE_URL;

// ---------------------------------------------------------------- Python
let pyWorker: Worker | null = null;
let pyState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
let seq = 0;
const pending = new Map<number, (r: Record<string, unknown>) => void>();

function getPyWorker(): Worker {
  if (pyWorker) return pyWorker;
  pyWorker = new Worker(`${base}pyodide-worker.js`);
  pyWorker.onmessage = (e) => {
    const d = e.data;
    if (d.type === 'status') { pyState = d.state; onStatus('python', d.state, d.message); }
    else if (pending.has(d.id)) { pending.get(d.id)!(d); pending.delete(d.id); }
  };
  pyWorker.onerror = (e) => onStatus('python', 'error', e.message);
  return pyWorker;
}

function killPyWorker() {
  pyWorker?.terminate();
  pyWorker = null;
  pyState = 'idle';
  onStatus('python', 'idle');
}

export function preloadPython() {
  const id = ++seq;
  getPyWorker().postMessage({ id, preload: true });
}

async function runPython(req: ExecRequest): Promise<ExecResult> {
  const w = getPyWorker();
  const id = ++seq;
  const started = performance.now();
  return new Promise<ExecResult>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // The first run includes downloading the runtime; only start the clock once it is ready.
    const startTimer = () => {
      timer = setTimeout(() => {
        pending.delete(id);
        killPyWorker();
        resolve({ engine: 'browser', status: 'timeout', stdout: '', stderr: '', exitCode: null, wallMs: req.timeoutMs });
      }, req.timeoutMs + 300);
    };
    const statusWatch = (e: MessageEvent) => { if (e.data?.type === 'status' && e.data.state === 'ready') startTimer(); };
    if (pyState === 'ready') startTimer();
    else w.addEventListener('message', statusWatch);
    pending.set(id, (d) => {
      clearTimeout(timer);
      w.removeEventListener('message', statusWatch);
      resolve({
        engine: 'browser',
        status: (d.status as ExecResult['status']) ?? 'ok',
        stdout: String(d.stdout ?? '').slice(0, OUTPUT_LIMIT),
        stderr: String(d.stderr ?? ''),
        exitCode: (d.exitCode as number) ?? null,
        wallMs: (d.wallMs as number) ?? Math.round(performance.now() - started),
        message: d.message as string | undefined,
      });
    });
    w.postMessage({ id, source: req.source, stdin: req.stdin });
  });
}


// ---------------------------------------------------------------- Java
let frame: HTMLIFrameElement | null = null;
let frameReady: Promise<void> | null = null;
let javaState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
const javaPending = new Map<number, (d: Record<string, unknown>) => void>();
const javaStarted = new Map<number, () => void>();

window.addEventListener('message', (e) => {
  if (!frame || e.source !== frame.contentWindow) return;
  const d = e.data || {};
  if (d.type === 'status' && d.state !== 'frame-ready') {
    javaState = d.state;
    onStatus('java', d.state, d.message);
  } else if (d.type === 'started' && javaStarted.has(d.id)) {
    javaStarted.get(d.id)!();
  } else if (d.type === 'result' && javaPending.has(d.id)) {
    javaPending.get(d.id)!(d);
    javaPending.delete(d.id);
  }
});

function getFrame(): Promise<void> {
  if (frame && frameReady) return frameReady;
  frame = document.createElement('iframe');
  frame.src = `${base}cheerpj-runner.html`;
  frame.title = 'Java runtime';
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;opacity:0;pointer-events:none;';
  const f = frame;
  frameReady = new Promise<void>((resolve) => {
    const h = (e: MessageEvent) => {
      if (e.source === f.contentWindow && e.data?.type === 'status' && e.data.state === 'frame-ready') {
        window.removeEventListener('message', h);
        resolve();
      }
    };
    window.addEventListener('message', h);
  });
  document.body.appendChild(frame);
  return frameReady;
}

function killFrame() {
  frame?.remove();
  frame = null;
  frameReady = null;
  javaState = 'idle';
  onStatus('java', 'idle');
}

export async function preloadJava() {
  await getFrame();
  frame?.contentWindow?.postMessage({ type: 'preload' }, '*');
}

function splitJavaOutput(text: string): { compileOutput?: string; stdout: string; stderr: string; finished: boolean } {
  const norm = text.replace(/\r/g, '');
  if (norm.includes('@@COMPILE_ERROR@@')) {
    const body = norm.split('@@COMPILE_ERROR@@')[1].split('@@END@@')[0];
    return { compileOutput: body.replace(/\/str\//g, '').trim(), stdout: '', stderr: '', finished: true };
  }
  const afterRun = norm.includes('@@RUN@@') ? norm.split('@@RUN@@\n').slice(1).join('@@RUN@@\n') : norm;
  const finished = afterRun.includes('@@END@@');
  const body = afterRun.split('@@END@@')[0];
  const [stdout, stderr = ''] = body.split('@@EXCEPTION@@');
  return { stdout: stdout.replace(/\n$/, ''), stderr: stderr.trim() ? 'Exception in thread "main" ' + stderr.trim() : '', finished };
}

async function runJava(req: ExecRequest): Promise<ExecResult> {
  await getFrame();
  const id = ++seq;
  const mainClass = req.mainClass ?? 'Main';
  return new Promise<ExecResult>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fail = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        javaPending.delete(id);
        javaStarted.delete(id);
        killFrame();
        resolve({ engine: 'browser', status: 'timeout', stdout: '', stderr: '', exitCode: null, wallMs: req.timeoutMs });
      }, ms);
    };
    // Compilation happens in-browser and is slow on a cold JVM, so it gets its own generous budget.
    // The time limit applies from the moment main() starts.
    const waitReady = () => {
      if (!javaPending.has(id)) return;
      if (javaState === 'ready') fail(120000);
      else setTimeout(waitReady, 200);
    };
    waitReady();
    javaStarted.set(id, () => fail(req.timeoutMs + 300));
    javaPending.set(id, (d) => {
      clearTimeout(timer);
      javaStarted.delete(id);
      if (d.status === 'engine-error') {
        resolve({ engine: 'browser', status: 'engine-error', stdout: '', stderr: '', exitCode: null, wallMs: 0, message: String(d.message) });
        return;
      }
      const parts = splitJavaOutput(String(d.text ?? ''));
      if (!parts.finished) killFrame(); // System.exit or a crashed JVM: start fresh next time
      const wallMs = Number(d.wallMs ?? 0);
      if (parts.compileOutput !== undefined) {
        resolve({ engine: 'browser', status: 'compile-error', stdout: '', stderr: '', compileOutput: parts.compileOutput, exitCode: 1, wallMs });
        return;
      }
      resolve({
        engine: 'browser',
        status: parts.stderr ? 'runtime-error' : 'ok',
        stdout: parts.stdout.slice(0, OUTPUT_LIMIT),
        stderr: parts.stderr,
        exitCode: parts.stderr ? 1 : 0,
        wallMs,
      });
    });
    frame!.contentWindow!.postMessage({ type: 'run', id, source: req.source, stdin: req.stdin, mainClass }, '*');
  });
}

export function runInBrowser(req: ExecRequest): Promise<ExecResult> {
  return req.language === 'python' ? runPython(req) : runJava(req);
}
