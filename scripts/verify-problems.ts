// Verifies the judge drivers end-to-end with local python3 / javac.
//   1. every built-in problem: Python driver + reference solution adapter must reproduce expected.json
//   2. scripts/java-samples/<problem-id>.java: Java driver must compile with --release 8 and pass
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { BUILTIN_PROBLEMS, PROBLEM_BY_ID } from '../src/data/problems';
import { BUILD_TASKS } from '../src/data/flow/build';
import { buildStdin, compareOutput, expectedFor, javaProgram, parseRun, pythonProgram, pythonStarter, javaStarter, snake } from '../src/lib/harness';
import type { Problem } from '../src/types';

const scripts = resolve('scripts');
let failures = 0;

function check(p: Problem, stdout: string, label: string) {
  const exp = expectedFor(p);
  const { cases } = parseRun(stdout, p.tests!.length);
  if (cases.length !== p.tests!.length) {
    console.log(`FAIL ${label} ${p.id}: got ${cases.length}/${p.tests!.length} results\n${stdout.slice(0, 2000)}`);
    failures++;
    return;
  }
  cases.forEach((c, i) => {
    if (!c.ok || !compareOutput(p.compare ?? 'exact', c.output, exp[i])) {
      console.log(`FAIL ${label} ${p.id} #${i}: ${c.error ?? JSON.stringify(c.output)} != ${JSON.stringify(exp[i])}`);
      failures++;
    }
  });
}

function adapter(p: Problem): string {
  const sig = p.signature!;
  if (sig.kind === 'design') return `import sys\nsys.path.insert(0, ${JSON.stringify(scripts)})\nfrom reference import ${sig.className}\n`;
  return `import sys, json
sys.path.insert(0, ${JSON.stringify(scripts)})
import reference as _r
_SIGX = json.loads(${JSON.stringify(JSON.stringify(sig))})
def _tj(t, v):
    if t == 'ListNode':
        out = []
        while v: out.append(v.val); v = v.next
        return out
    if t == 'ListNode[]': return [_tj('ListNode', x) for x in v]
    if t == 'TreeNode':
        out, q = [], [v]
        for n in q:
            if n is None: out.append(None); continue
            out.append(n.val); q.append(n.left); q.append(n.right)
        while out and out[-1] is None: out.pop()
        return out
    return v
def _fj(t, v):
    if t == 'ListNode':
        d = ListNode(); c = d
        for x in v: c.next = ListNode(x); c = c.next
        return d.next
    if t == 'TreeNode':
        if not v: return None
        root = TreeNode(v[0]); q = [root]; i = 1
        for n in q:
            if i < len(v) and v[i] is not None: n.left = TreeNode(v[i]); q.append(n.left)
            i += 1
            if i < len(v) and v[i] is not None: n.right = TreeNode(v[i]); q.append(n.right)
            i += 1
            if i >= len(v): break
        return root
    return v
def ${snake(sig.name)}(*args):
    conv = [_tj(p['type'], a) for p, a in zip(_SIGX['params'], args)]
    res = _r.R[${JSON.stringify(p.id)}](*conv)
    if _SIGX['returns'] == 'void':
        args[_SIGX.get('mutates', 0)][:] = res
        return None
    return _fj(_SIGX['returns'], res)
`;
}

const dir = mkdtempSync(join(tmpdir(), 'dsaforge-verify-'));

// starters must at least compile / parse
for (const p of BUILTIN_PROBLEMS) {
  const py = pythonStarter(p);
  const r = spawnSync('python3', ['-c', `import ast,sys; ast.parse(sys.stdin.read())`], { input: py, encoding: 'utf8' });
  if (r.status !== 0) { console.log(`FAIL python starter ${p.id}: ${r.stderr}`); failures++; }
}

// 1. python driver over every problem
for (const p of BUILTIN_PROBLEMS) {
  const prog = pythonProgram(p, adapter(p));
  const file = join(dir, `${p.id}.py`);
  writeFileSync(file, prog);
  const r = spawnSync('python3', [file], { input: buildStdin(p.tests!.map((t) => t.input)), encoding: 'utf8', timeout: 20000 });
  if (r.stderr) console.log(`stderr ${p.id}: ${r.stderr}`);
  check(p, r.stdout, 'python');
}
console.log(`python: checked ${BUILTIN_PROBLEMS.length} problems`);

// 2. java starter compile check + samples
const javaDir = join(dir, 'java');
let javaCount = 0;
for (const p of BUILTIN_PROBLEMS) {
  const d = join(javaDir, 'starter-' + p.id);
  execFileSync('mkdir', ['-p', d]);
  writeFileSync(join(d, 'Main.java'), javaProgram(p, javaStarter(p)));
  const c = spawnSync('javac', ['--release', '8', '-nowarn', '-d', d, join(d, 'Main.java')], { encoding: 'utf8' });
  if (c.status !== 0) { console.log(`FAIL java starter compile ${p.id}:\n${c.stderr.slice(0, 3000)}`); failures++; }
}
console.log(`java: compiled starters + driver for ${BUILTIN_PROBLEMS.length} problems (--release 8)`);

for (const f of readdirSync(join(scripts, 'java-samples'))) {
  const id = f.replace(/\.java$/, '');
  const p = PROBLEM_BY_ID[id];
  if (!p) { console.log(`unknown sample ${f}`); failures++; continue; }
  const d = join(javaDir, id);
  execFileSync('mkdir', ['-p', d]);
  const src = javaProgram(p, readFileSync(join(scripts, 'java-samples', f), 'utf8'));
  writeFileSync(join(d, 'Main.java'), src);
  const c = spawnSync('javac', ['--release', '8', '-nowarn', '-d', d, join(d, 'Main.java')], { encoding: 'utf8' });
  if (c.status !== 0) { console.log(`FAIL javac ${id}:\n${c.stderr}`); failures++; continue; }
  const stdin = buildStdin(p.tests!.map((t) => t.input));
  const r = spawnSync('java', ['-cp', d, 'Main'], { input: stdin, encoding: 'utf8' });
  if (r.stderr) console.log(`stderr ${id}: ${r.stderr}`);
  check(p, r.stdout, 'java');
  // also the single-file source launcher (how some Piston java packages run code)
  const r2 = spawnSync('java', [join(d, 'Main.java')], { input: stdin, encoding: 'utf8' });
  check(p, r2.stdout, 'java-source-launcher');
  javaCount++;
}
console.log(`java: ran ${javaCount} sample solutions`);

// 3. Build-stage tasks: starters compile/parse, and both reference implementations pass their own hidden tests
for (const t of BUILD_TASKS) {
  const stdin = buildStdin(t.tests!.map((x) => x.input));
  const pyStarter = spawnSync('python3', ['-c', 'import ast,sys; ast.parse(sys.stdin.read())'], { input: pythonStarter(t), encoding: 'utf8' });
  if (pyStarter.status !== 0) { console.log(`FAIL build python starter ${t.id}: ${pyStarter.stderr}`); failures++; }
  const pyFile = join(dir, `${t.id}.py`);
  writeFileSync(pyFile, pythonProgram(t, t.ref.python));
  check(t, spawnSync('python3', [pyFile], { input: stdin, encoding: 'utf8' }).stdout, 'build-python');
  for (const [label, code] of [['starter', javaStarter(t)], ['reference', t.ref.java]] as const) {
    const d = join(javaDir, `${t.id}-${label}`);
    execFileSync('mkdir', ['-p', d]);
    writeFileSync(join(d, 'Main.java'), javaProgram(t, code));
    const c = spawnSync('javac', ['--release', '8', '-nowarn', '-d', d, join(d, 'Main.java')], { encoding: 'utf8' });
    if (c.status !== 0) { console.log(`FAIL build javac ${t.id} ${label}:\n${c.stderr.slice(0, 2000)}`); failures++; continue; }
    if (label === 'reference') check(t, spawnSync('java', ['-cp', d, 'Main'], { input: stdin, encoding: 'utf8' }).stdout, 'build-java');
  }
}
console.log(`build: checked ${BUILD_TASKS.length} tasks (python + java references, starters)`);
console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
