import type { CourseId } from '../../types';

export interface ExecRequest {
  language: CourseId;
  source: string;
  stdin: string;
  timeoutMs: number;
  memoryMb: number;
  /** Java: the class holding main(). Defaults to Main. */
  mainClass?: string;
}

export type ExecStatus = 'ok' | 'compile-error' | 'runtime-error' | 'timeout' | 'output-limit' | 'memory-limit' | 'engine-error';

export interface ExecResult {
  engine: 'server' | 'browser';
  status: ExecStatus;
  stdout: string;
  stderr: string;
  compileOutput?: string;
  exitCode: number | null;
  wallMs: number;
  message?: string;
}

export type EngineKind = 'server' | 'browser';

export interface EngineState {
  server: 'unknown' | 'checking' | 'online' | 'offline';
  serverRuntimes: string[];
  browser: Record<CourseId, 'idle' | 'loading' | 'ready' | 'error'>;
  browserMessage?: string;
  lastUsed?: EngineKind;
}

export const OUTPUT_LIMIT = 1_000_000;
