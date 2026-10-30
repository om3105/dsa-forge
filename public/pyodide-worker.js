/* Classic worker that runs Python with Pyodide (WebAssembly CPython).
   Loaded lazily on first run; the instance stays warm for later runs.
   The page terminates this worker on timeout, which is the only reliable way
   to stop an infinite loop. */
const PYODIDE_VERSION = '0.27.2';
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const OUTPUT_LIMIT = 1000000;

let pyodideReady = null;

function load() {
  if (!pyodideReady) {
    postMessage({ type: 'status', state: 'loading' });
    importScripts(INDEX_URL + 'pyodide.js');
    pyodideReady = loadPyodide({ indexURL: INDEX_URL }).then((py) => {
      postMessage({ type: 'status', state: 'ready', version: py.version });
      return py;
    }, (err) => {
      pyodideReady = null;
      postMessage({ type: 'status', state: 'error', message: String(err) });
      throw err;
    });
  }
  return pyodideReady;
}

class OutputLimit extends Error {}

// Drop Pyodide's own frames (/lib/python3xx.zip/_pyodide/...) so tracebacks only show the user's code.
function cleanTraceback(msg) {
  const out = [];
  let skipping = false;
  for (const line of msg.split('\n')) {
    if (/^\s*File "\/lib\/python/.test(line)) { skipping = true; continue; }
    if (/^\s*File "/.test(line)) skipping = false;
    if (skipping && (/^\s{4,}/.test(line) || /^\s*\^+\s*$/.test(line))) continue;
    if (/^\s*\^+\s*$/.test(line) && out.length && /^Traceback/.test(out[out.length - 1])) continue;
    skipping = false;
    out.push(line);
  }
  return out.join('\n').replace(/^Traceback \(most recent call last\):\n(?=\s*File "main\.py", line \d+\n[^\n]*\n[^\n]*\n?\w*(Syntax|Indentation|Tab)Error)/, '');
}

self.onmessage = async (e) => {
  const { id, source, stdin, preload } = e.data;
  let py;
  try {
    py = await load();
  } catch (err) {
    postMessage({ id, type: 'result', status: 'engine-error', stdout: '', stderr: '', exitCode: null, message: 'Could not load Pyodide: ' + err });
    return;
  }
  if (preload) { postMessage({ id, type: 'preloaded' }); return; }

  let out = [], err = [], size = 0, limited = false;
  const push = (arr) => (line) => {
    size += line.length + 1;
    if (size > OUTPUT_LIMIT) { limited = true; throw new OutputLimit('output limit'); }
    arr.push(line);
  };
  py.setStdout({ batched: push(out) });
  py.setStderr({ batched: push(err) });
  let fed = false;
  py.setStdin({ stdin: () => { if (fed) return undefined; fed = true; return stdin || ''; } });

  const t0 = performance.now();
  let exitCode = 0, status = 'ok';
  const globals = py.globals.get('dict')();
  try {
    py.runPython(source, { globals, filename: 'main.py' });
  } catch (ex) {
    const msg = String(ex && ex.message || ex);
    const m = /SystemExit: (\d+)/.exec(msg);
    if (limited) status = 'output-limit';
    else if (/SystemExit/.test(msg)) { exitCode = m ? Number(m[1]) : 0; if (exitCode !== 0) status = 'runtime-error'; }
    else if (/MemoryError/.test(msg)) { status = 'memory-limit'; err.push(msg); exitCode = 1; }
    else { status = 'runtime-error'; err.push(cleanTraceback(msg)); exitCode = 1; }
  } finally {
    try { globals.destroy(); } catch (_) { /* ignore */ }
  }
  // flush partial lines
  try { py.runPython('import sys; sys.stdout.flush(); sys.stderr.flush()'); } catch (_) { /* ignore */ }
  postMessage({
    id, type: 'result', status, exitCode,
    stdout: out.join('\n'), stderr: err.join('\n'),
    wallMs: Math.round(performance.now() - t0),
  });
};
