// Writes src/data/expected.json:
//   - built-in problems: Python reference solutions in scripts/reference.py
//   - Build-stage tasks: the task's own Python reference implementation, run through the real judge driver
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PROBLEMS } from '../src/data/problems';
import { BUILD_TASKS } from '../src/data/flow/build';
import { buildStdin, parseRun, pythonProgram } from '../src/lib/harness';

const dir = mkdtempSync(join(tmpdir(), 'dsaforge-'));
const dump = join(dir, 'problems.json');
writeFileSync(dump, JSON.stringify(PROBLEMS));
process.stdout.write(execFileSync('python3', ['scripts/reference.py', dump, 'src/data/expected.json'], { encoding: 'utf8' }));

const expected = JSON.parse(readFileSync('src/data/expected.json', 'utf8'));
for (const t of BUILD_TASKS) {
  const file = join(dir, `${t.id}.py`);
  writeFileSync(file, pythonProgram(t, t.ref.python));
  const r = spawnSync('python3', [file], { input: buildStdin(t.tests!.map((x) => x.input)), encoding: 'utf8' });
  const { cases } = parseRun(r.stdout, t.tests!.length);
  if (cases.length !== t.tests!.length || cases.some((c) => !c.ok)) {
    console.error(`build task ${t.id} reference failed:\n${r.stdout}\n${r.stderr}\n${cases.find((c) => !c.ok)?.error ?? ''}`);
    process.exit(1);
  }
  expected[t.id] = cases.map((c) => c.output);
}
writeFileSync('src/data/expected.json', JSON.stringify(expected));
const builtin = PROBLEMS.filter((p) => p.builtin).length;
console.log(`problems: ${PROBLEMS.length} total, ${builtin} built-in with tests; ${BUILD_TASKS.length} build tasks`);
