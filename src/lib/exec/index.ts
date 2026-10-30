/* Picks an engine for each run: the self-hosted Piston server when reachable,
   otherwise the in-browser WebAssembly engines. */
import { useSyncExternalStore } from 'react';
import type { CourseId, Settings } from '../../types';
import { pistonExecute, pistonRuntimes } from './piston';
import { preloadJava, preloadPython, runInBrowser, setBrowserStatusListener } from './browser';
import type { EngineState, ExecRequest, ExecResult } from './types';

export type { ExecRequest, ExecResult } from './types';

let state: EngineState = { server: 'unknown', serverRuntimes: [], browser: { python: 'idle', java: 'idle' } };
const listeners = new Set<() => void>();
const set = (patch: Partial<EngineState>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };

setBrowserStatusListener((lang, s, message) => {
  set({ browser: { ...state.browser, [lang]: s }, browserMessage: s === 'error' ? message : state.browserMessage });
});

export const useEngineState = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);

let lastCheck = 0;
let lastUrl = '';
export async function checkServer(url: string, force = false): Promise<boolean> {
  if (!url) { set({ server: 'offline', serverRuntimes: [] }); return false; }
  if (!force && url === lastUrl && Date.now() - lastCheck < 30000 && state.server !== 'unknown') return state.server === 'online';
  lastUrl = url;
  lastCheck = Date.now();
  set({ server: 'checking' });
  try {
    const rts = await pistonRuntimes(url);
    set({ server: 'online', serverRuntimes: rts });
    return true;
  } catch {
    set({ server: 'offline', serverRuntimes: [] });
    return false;
  }
}

export function serverHas(lang: CourseId): boolean {
  return state.serverRuntimes.some((r) => r.startsWith(lang === 'java' ? 'java-' : 'python-'));
}

export function activeEngine(settings: Settings, lang: CourseId): 'server' | 'browser' {
  if (settings.engine === 'browser') return 'browser';
  if (settings.engine === 'server') return 'server';
  return state.server === 'online' && serverHas(lang) ? 'server' : 'browser';
}

export async function execute(settings: Settings, req: ExecRequest): Promise<ExecResult> {
  if (settings.engine !== 'browser') {
    const online = await checkServer(settings.pistonUrl);
    if (online && serverHas(req.language)) {
      try {
        const version = req.language === 'java' ? settings.javaVersion : settings.pythonVersion;
        const r = await pistonExecute(settings.pistonUrl, req, version);
        set({ lastUsed: 'server' });
        return r;
      } catch (e) {
        if (settings.engine === 'server') {
          return { engine: 'server', status: 'engine-error', stdout: '', stderr: '', exitCode: null, wallMs: 0, message: `Code server request failed: ${(e as Error).message}` };
        }
        set({ server: 'offline' });
      }
    } else if (settings.engine === 'server') {
      return { engine: 'server', status: 'engine-error', stdout: '', stderr: '', exitCode: null, wallMs: 0,
        message: `The code server at ${settings.pistonUrl} is not reachable or has no ${req.language} runtime. If it was asleep, try again in a minute, or switch the engine to Auto/Browser in Settings.` };
    }
  }
  const r = await runInBrowser(req);
  set({ lastUsed: 'browser' });
  return r;
}

export function preload(lang: CourseId) {
  if (lang === 'python') preloadPython();
  else void preloadJava();
}
