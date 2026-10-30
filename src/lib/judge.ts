import type { CourseId, Problem, Settings } from '../types';
import { execute, type ExecResult } from './exec';
import { buildProgram, buildStdin, compareOutput, errorLines, parseRun, type CaseResult } from './harness';

export type Verdict =
  | 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compile Error' | 'Time Limit Exceeded'
  | 'Output Limit Exceeded' | 'Memory Limit Exceeded' | 'Engine Error' | 'Finished';

export interface JudgeOutcome {
  kind: 'run' | 'submit';
  verdict: Verdict;
  exec: ExecResult;
  cases: CaseResult[];
  total: number;
  passed: number;
  /** error text to show (compile log, traceback, engine message) */
  errorText?: string;
  /** stdout not attributed to any test case */
  trailing: string;
  markers: { line: number; message: string }[];
  maxMicros: number;
}

export async function judge(
  settings: Settings, course: CourseId, p: Problem, code: string,
  inputs: unknown[][], expected: (unknown | undefined)[], kind: 'run' | 'submit',
): Promise<JudgeOutcome> {
  const exec = await execute(settings, {
    language: course,
    source: buildProgram(course, p, code),
    stdin: buildStdin(inputs),
    timeoutMs: settings.timeoutMs,
    memoryMb: settings.memoryMb,
    mainClass: 'Main',
  });
  const base = { kind, exec, total: inputs.length, trailing: '', markers: [] as JudgeOutcome['markers'], maxMicros: 0 };

  if (exec.status === 'engine-error') {
    return { ...base, verdict: 'Engine Error', cases: [], passed: 0, errorText: exec.message ?? 'The execution engine failed.' };
  }
  if (exec.status === 'compile-error') {
    const text = exec.compileOutput ?? '';
    return { ...base, verdict: 'Compile Error', cases: [], passed: 0, errorText: text, markers: errorLines(course, text) };
  }

  const { cases, trailing } = parseRun(exec.stdout, inputs.length);
  let passed = 0;
  for (const cr of cases) {
    const exp = expected[cr.index];
    cr.expected = exp;
    if (cr.ok && exp !== undefined) {
      cr.passed = compareOutput(p.compare ?? 'exact', cr.output, exp);
      if (cr.passed) passed++;
    } else if (!cr.ok) cr.passed = false;
  }
  const maxMicros = Math.max(0, ...cases.map((x) => x.micros ?? 0));
  const firstErr = cases.find((x) => !x.ok);
  const stderr = exec.stderr.trim();
  const out = { ...base, cases, passed, trailing, maxMicros };

  if (exec.status === 'timeout') return { ...out, verdict: 'Time Limit Exceeded', errorText: `Stopped after ${settings.timeoutMs / 1000}s. Likely an infinite loop or an algorithm that is too slow for the input size.` };
  if (exec.status === 'output-limit') return { ...out, verdict: 'Output Limit Exceeded', errorText: 'Your program printed too much output. Remove debug prints inside loops.' };
  if (exec.status === 'memory-limit') return { ...out, verdict: 'Memory Limit Exceeded', errorText: stderr || 'Memory limit exceeded.' };

  // the driver itself failed before running any test (Python SyntaxError / NameError at import time, etc.)
  if (cases.length === 0) {
    const text = stderr || exec.message || 'Program exited without producing results.';
    const isSyntax = /SyntaxError|IndentationError|TabError/.test(text);
    return { ...out, verdict: isSyntax ? 'Compile Error' : 'Runtime Error', errorText: text, markers: errorLines(course, text) };
  }
  if (firstErr) {
    return { ...out, verdict: 'Runtime Error', errorText: firstErr.error, markers: errorLines(course, firstErr.error ?? '') };
  }
  if (cases.length < inputs.length) {
    return { ...out, verdict: 'Runtime Error', errorText: stderr || 'The program stopped before finishing all test cases.' };
  }
  const known = cases.filter((x) => x.expected !== undefined).length;
  if (known === 0) return { ...out, verdict: 'Finished' };
  return { ...out, verdict: passed === known ? (known === inputs.length ? 'Accepted' : 'Finished') : 'Wrong Answer' };
}
