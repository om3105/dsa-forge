import { auth } from '../firebase';
import type { ExecRequest, ExecResult } from './types';

interface PistonStage {
  stdout: string; stderr: string; output: string;
  code: number | null; signal: string | null;
  message?: string | null; status?: string | null;
  wall_time?: number; cpu_time?: number; memory?: number;
}
interface PistonResponse { language: string; version: string; run: PistonStage; compile?: PistonStage; message?: string }

const trimUrl = (u: string) => u.replace(/\/+$/, '');

export async function pistonRuntimes(url: string, timeoutMs = 2500): Promise<string[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${trimUrl(url)}/api/v2/runtimes`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = (await res.json()) as { language: string; version: string; aliases: string[] }[];
    return list.map((r) => `${r.language}-${r.version}`);
  } finally {
    clearTimeout(t);
  }
}

export async function pistonExecute(url: string, req: ExecRequest, version: string): Promise<ExecResult> {
  const started = performance.now();
  const isJava = req.language === 'java';
  const body = {
    language: isJava ? 'java' : 'python',
    version: version || '*',
    files: [{ name: isJava ? `${req.mainClass ?? 'Main'}.java` : 'main.py', content: req.source }],
    stdin: req.stdin,
    compile_timeout: 20000,
    run_timeout: req.timeoutMs,
    // The JVM reserves a lot of virtual memory up front; an address-space cap breaks it.
    // So the memory cap is applied to Python only; Java relies on the timeout + -Xmx defaults.
    run_memory_limit: isJava ? -1 : req.memoryMb * 1024 * 1024,
  };
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), req.timeoutMs + 40000);
  let data: PistonResponse;
  try {
    const res = await fetch(`${trimUrl(url)}/api/v2/execute`, {
      method: 'POST',
      // Plain Piston ignores this header; the cloud runner requires it (see runner/server.js).
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  } finally {
    clearTimeout(t);
  }
  const wallMs = Math.round(performance.now() - started);
  const base = { engine: 'server' as const, wallMs };

  if (data.compile && data.compile.code !== 0) {
    const out = (data.compile.stderr || data.compile.output || data.compile.message || '').trim();
    if (data.compile.status === 'TO' || (data.compile.signal === 'SIGKILL' && !out)) {
      return { ...base, status: 'engine-error', stdout: '', stderr: '', exitCode: null, message: 'Compilation timed out on the server.' };
    }
    return { ...base, status: 'compile-error', stdout: '', stderr: '', compileOutput: out, exitCode: data.compile.code };
  }
  const run = data.run;
  const runMs = run.wall_time ?? wallMs;
  const killed = run.signal === 'SIGKILL';
  let status: ExecResult['status'] = 'ok';
  if (run.status === 'TO' || (killed && runMs >= req.timeoutMs * 0.95) || (killed && run.status == null && !run.stderr)) status = 'timeout';
  else if (run.status === 'OL' || run.status === 'EL') status = 'output-limit';
  else if (killed && /memory/i.test(run.message ?? '')) status = 'memory-limit';
  else if (run.code !== 0) status = /MemoryError|OutOfMemoryError/.test(run.stderr) ? 'memory-limit' : 'runtime-error';
  return {
    ...base,
    wallMs: Math.round(runMs),
    status,
    stdout: run.stdout ?? '',
    stderr: run.stderr ?? '',
    exitCode: run.code,
    message: run.message ?? undefined,
  };
}
