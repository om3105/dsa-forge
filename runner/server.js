// DSA Forge runner.
//
// A small HTTP server that runs Python and Java submissions. It speaks the same two endpoints as
// Piston (GET /api/v2/runtimes, POST /api/v2/execute) so the web app's Piston client works
// unchanged. I wrote this because Piston needs a privileged Docker container and Render does not
// allow that.
//
// Isolation is weaker than Piston's: code runs as an unprivileged user with time, memory, process
// and output limits, but it does have network access. That is why /execute only accepts requests
// carrying a valid Firebase ID token from the DSA Forge project, and why each user is rate limited.

import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm, chown } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const PORT = Number(process.env.PORT || 10000);
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'dsa-forge-2026';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean);
// Optional: comma separated emails. Empty means any signed-in user of the app may run code.
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

const MAX_OUTPUT = 1024 * 1024;       // same cap the local Piston setup uses
const MAX_RUN_MS = 15000;
const JAVA_STARTUP_MS = 4000;         // JVM start on the free instance's tiny CPU (code is precompiled)
const COMPILE_TIMEOUT_MS = 20000;
const RUNS_PER_MINUTE = 30;

const SANDBOX_UID = Number(execFileSync('id', ['-u', 'sandbox']).toString().trim());
const SANDBOX_GID = Number(execFileSync('id', ['-g', 'sandbox']).toString().trim());

const PY_VERSION = execFileSync('python3', ['-c', 'import platform; print(platform.python_version())']).toString().trim();
// `java -version` writes to stderr
const JAVA_VERSION = execFileSync('sh', ['-c', 'java -version 2>&1']).toString().match(/version "([^"]+)"/)?.[1] ?? '17';

const RUNTIMES = [
  { language: 'python', version: PY_VERSION, aliases: ['py', 'python3'] },
  { language: 'java', version: JAVA_VERSION, aliases: [] },
];

// ---------------------------------------------------------------- auth

const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

async function verifyUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    if (ALLOWED_EMAILS.length && !ALLOWED_EMAILS.includes(String(payload.email || '').toLowerCase())) return null;
    return String(payload.sub);
  } catch {
    return null;
  }
}

const recentRuns = new Map(); // uid -> timestamps in the last minute
function rateLimited(uid) {
  const now = Date.now();
  const list = (recentRuns.get(uid) || []).filter((t) => now - t < 60000);
  list.push(now);
  recentRuns.set(uid, list);
  return list.length > RUNS_PER_MINUTE;
}

// ---------------------------------------------------------------- java compiler

// A long-running javac (CompileServer.java), started as the sandbox user and warmed up once, so each
// Java submission only pays for starting the JVM that runs it. Requests are already serialized by
// the run queue below, so one pending request at a time is enough.
let compiler = null;
function startCompiler() {
  const proc = spawn('java', ['-Xmx128m', '-XX:+UseSerialGC', '-XX:TieredStopAtLevel=1', '-cp', '/app', 'CompileServer'], {
    uid: SANDBOX_UID, gid: SANDBOX_GID, stdio: ['pipe', 'pipe', 'inherit'],
  });
  const c = { proc, buffer: '', pending: null };
  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', (chunk) => {
    c.buffer += chunk;
    let nl;
    while ((nl = c.buffer.indexOf('\n')) >= 0) {
      const line = c.buffer.slice(0, nl);
      c.buffer = c.buffer.slice(nl + 1);
      const p = c.pending;
      c.pending = null;
      p?.resolve(line);
    }
  });
  proc.on('exit', () => {
    c.pending?.reject(new Error('compiler exited'));
    if (compiler === c) compiler = null;
  });
  compiler = c;
  return c;
}

function compileJava(dir) {
  const c = compiler ?? startCompiler();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      // A stuck compile: restart the compiler so the next request gets a fresh one.
      c.pending = null;
      c.proc.kill('SIGKILL');
      resolve({ ok: false, timedOut: true, output: '' });
    }, COMPILE_TIMEOUT_MS);
    c.pending = {
      resolve: (line) => {
        clearTimeout(timer);
        if (line === 'OK') return resolve({ ok: true, output: '' });
        const text = Buffer.from(line.replace(/^ERR /, ''), 'base64').toString('utf8');
        // javac prints absolute paths; show them the way a local compile would ("Main.java:3: error")
        resolve({ ok: false, output: text.split(dir + '/').join('').trim() });
      },
      reject: () => { clearTimeout(timer); resolve({ ok: false, timedOut: true, output: '' }); },
    };
    c.proc.stdin.write(dir + '\n');
  });
}

// ---------------------------------------------------------------- running code

// One run at a time: the free instance has 512 MB and two JVMs at once would not fit.
let queue = Promise.resolve();
const enqueue = (job) => {
  const p = queue.then(job, job);
  queue = p.catch(() => {});
  return p;
};

function runProcess(cmd, args, { cwd, stdin, timeoutMs, memoryBytes }) {
  return new Promise((resolve) => {
    const limits = ['--nproc=64', '--fsize=10485760'];
    if (memoryBytes > 0) limits.push(`--as=${memoryBytes}`);
    const started = Date.now();
    const child = spawn('prlimit', [...limits, '--', cmd, ...args], {
      cwd, uid: SANDBOX_UID, gid: SANDBOX_GID, detached: true,
      env: { PATH: process.env.PATH, HOME: cwd, LANG: 'C.UTF-8', PYTHONDONTWRITEBYTECODE: '1' },
    });
    let stdout = '', stderr = '', size = 0, status = null;
    const kill = (why) => {
      if (status) return;
      status = why;
      try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
    };
    const timer = setTimeout(() => kill('TO'), timeoutMs);
    const collect = (which) => (chunk) => {
      size += chunk.length;
      if (size > MAX_OUTPUT) return kill('OL');
      if (which === 'out') stdout += chunk; else stderr += chunk;
    };
    child.stdout.on('data', collect('out'));
    child.stderr.on('data', collect('err'));
    child.stdin.on('error', () => {}); // program may exit before reading all input
    child.stdin.end(stdin || '');
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        stdout, stderr, output: stdout + stderr,
        code: status ? null : code,
        signal: status ? 'SIGKILL' : signal,
        status,
        message: status === 'TO' ? 'Time limit exceeded' : status === 'OL' ? 'Output limit exceeded' : null,
        wall_time: Date.now() - started,
      });
    });
  });
}

async function execute(body) {
  const language = body.language === 'java' ? 'java' : body.language === 'python' ? 'python' : null;
  if (!language) return [400, { message: `Unsupported language: ${body.language}` }];
  const file = Array.isArray(body.files) ? body.files[0] : null;
  if (!file || typeof file.content !== 'string') return [400, { message: 'files[0].content is required' }];
  if (file.content.length > 200000) return [400, { message: 'Source is too large' }];

  const runTimeout = Math.min(Number(body.run_timeout) || 5000, MAX_RUN_MS);
  const dir = await mkdtemp(join(tmpdir(), 'run-'));
  try {
    await chown(dir, SANDBOX_UID, SANDBOX_GID);
    if (language === 'python') {
      await writeFile(join(dir, 'main.py'), file.content);
      const memory = Number(body.run_memory_limit) > 0 ? Number(body.run_memory_limit) : 256 * 1024 * 1024;
      const run = await runProcess('python3', ['-u', 'main.py'], { cwd: dir, stdin: body.stdin, timeoutMs: runTimeout, memoryBytes: memory });
      return [200, { language, version: PY_VERSION, run }];
    }

    // Java: compile with the warm compiler, then run the classes in a fresh sandboxed JVM.
    // The file name must match the public class, so keep what the client sent (Main.java by default).
    const name = /^[A-Za-z_][A-Za-z0-9_]*\.java$/.test(file.name || '') ? file.name : 'Main.java';
    await writeFile(join(dir, name), file.content);
    await chown(join(dir, name), SANDBOX_UID, SANDBOX_GID);
    const t0 = Date.now();
    const compiled = await compileJava(dir);
    const compileMs = Date.now() - t0;
    if (!compiled.ok) {
      const compile = compiled.timedOut
        ? { stdout: '', stderr: '', output: '', code: null, signal: 'SIGKILL', status: 'TO', message: 'Compile time limit exceeded' }
        : { stdout: '', stderr: compiled.output, output: compiled.output, code: 1, signal: null, status: null, message: null };
      return [200, { language, version: JAVA_VERSION, compile, run: { stdout: '', stderr: '', output: '', code: null, signal: null } }];
    }
    const mainClass = name.replace(/\.java$/, '');
    const run = await runProcess('java', ['-Xmx192m', '-Xss64m', '-XX:+UseSerialGC', '-XX:TieredStopAtLevel=1', '-XX:SharedArchiveFile=/app/run.jsa', '-Xshare:auto', '-cp', '.', mainClass], {
      cwd: dir, stdin: body.stdin, timeoutMs: runTimeout + JAVA_STARTUP_MS, memoryBytes: -1,
    });
    console.log(`java: compile ${compileMs} ms, run ${run.wall_time} ms`);
    // A JVM that dies before the judge prints anything is a server problem, not the user's; log it.
    if (run.code !== 0 && !run.stdout.includes('@@DSAFORGE@@')) console.log(`java run failed (code ${run.code}, signal ${run.signal}): ${(run.stderr || run.stdout).slice(0, 400)}`);
    return [200, { language, version: JAVA_VERSION, compile: { stdout: '', stderr: '', output: '', code: 0, signal: null }, run }];
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- http

function send(res, origin, status, data) {
  const headers = { 'Content-Type': 'application/json', Vary: 'Origin' };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Max-Age'] = '86400';
  }
  res.writeHead(status, headers);
  res.end(data === undefined ? '' : JSON.stringify(data));
}

function readBody(req, limit = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > limit) { reject(new Error('Body too large')); req.destroy(); } });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

createServer(async (req, res) => {
  const origin = req.headers.origin;
  const path = (req.url || '/').split('?')[0];
  try {
    if (req.method === 'OPTIONS') return send(res, origin, 204);
    if (req.method === 'GET' && path === '/') return send(res, origin, 200, { ok: true });
    if (req.method === 'GET' && path === '/api/v2/runtimes') return send(res, origin, 200, RUNTIMES);
    if (req.method === 'POST' && path === '/api/v2/execute') {
      const uid = await verifyUser(req);
      if (!uid) return send(res, origin, 401, { message: 'Sign in to DSA Forge to run code on the server.' });
      if (rateLimited(uid)) return send(res, origin, 429, { message: 'Too many runs in the last minute. Try again shortly.' });
      const body = JSON.parse(await readBody(req));
      const [status, data] = await enqueue(() => execute(body));
      return send(res, origin, status, data);
    }
    send(res, origin, 404, { message: 'Not found' });
  } catch (e) {
    send(res, origin, 500, { message: e instanceof Error ? e.message : 'Server error' });
  }
}).listen(PORT, () => {
  console.log(`runner listening on ${PORT} (python ${PY_VERSION}, java ${JAVA_VERSION})`);
  warmUp();
});

// Compile real judge files (generated by the web app's harness, in warmup/) several times at startup
// so javac is JIT-compiled before the first user run. On the free CPU it takes ~8 compiles to settle.
async function warmUp() {
  const samples = await Promise.all(['Function.java', 'Design.java'].map((f) => readFile(new URL(`./warmup/${f}`, import.meta.url), 'utf8')));
  for (let i = 0; i < 10; i++) {
    const dir = await mkdtemp(join(tmpdir(), 'warm-'));
    try {
      await chown(dir, SANDBOX_UID, SANDBOX_GID);
      await writeFile(join(dir, 'Main.java'), samples[i % samples.length]);
      await enqueue(() => compileJava(dir));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
  console.log('java compiler warmed up');
}
