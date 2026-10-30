# Runner

The code execution server used by the hosted app. It exposes the two Piston endpoints the frontend
already uses:

- `GET /api/v2/runtimes` lists Python and Java
- `POST /api/v2/execute` runs one submission (needs `Authorization: Bearer <Firebase ID token>`)

Why not just Piston? Piston sandboxes with isolate/cgroups and needs a privileged container, which
Render doesn't allow. This server is simpler: each run gets a temp directory, runs as the
unprivileged `sandbox` user under `prlimit` (memory, process count, file size), is killed at the
time limit, and its output is capped at 1 MB. Runs are queued one at a time because the free
instance has 512 MB of RAM.

Java uses the single-file source launcher (`java Main.java`), which compiles in memory and runs in
one JVM. On a small CPU that is about twice as fast as calling `javac` and then `java`.

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `10000` | listen port |
| `FIREBASE_PROJECT_ID` | `dsa-forge-2026` | tokens must be issued for this project |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | comma separated origins allowed by CORS |
| `ALLOWED_EMAILS` | empty | if set, only these accounts may run code |

## Run locally

```bash
docker build -t dsa-runner .
docker run -p 10000:10000 -e ALLOWED_ORIGINS=http://localhost:5173 dsa-runner
```
