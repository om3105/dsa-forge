# DSA Forge

A DSA (data structures and algorithms) learning app with two separate courses, **DSA with Python** and **DSA with Java**. I built it to prepare for placement interviews: a 60-day roadmap, lessons that start from zero, an in-browser code editor with a real judge, LeetCode problems that unlock only after you have learned what they need, and spaced repetition so topics don't fade.

**Live app:** https://dsa-forge-nu.vercel.app

## Why I built it

Most DSA prep I tried was either a list of 200 LeetCode links or a video course. Neither told me *when* I was ready for a problem, and I kept forgetting topics a week after finishing them. DSA Forge forces an order: understand the idea, see it run step by step, build it yourself, learn the pattern, practise with help, then solve the real problems and keep reviewing them.

## Features

- **Two independent courses.** Python and Java each have their own lessons, templates, problem tracker, flashcards, notes and progress. Switching course switches everything.
- **60-day roadmap** in four phases. If you miss a day, the rest of the plan moves back instead of piling up.
- **7-stage topic flow.** Understand (MCQ), Visualize (step-through with a predict mode), Build from scratch (hidden tests), Pattern (spot-the-pattern quiz), Guided practice (plan before coding, hint ladder), Solve (mapped LeetCode problems) and Recall (spaced repetition). Each stage unlocks the next.
- **Code editor and judge.** Monaco editor, sample and hidden tests, LeetCode-style results (wrong answer, runtime error, TLE, compile error with the line underlined).
- **LeetCode Map.** 230 LeetCode questions, each with a prerequisite path (lesson, template, warm-up problems, recall check). The link stays locked until the path is done. No problem statements are copied; only titles, my own one-line summaries, hints and links.
- **Spaced repetition** at 1, 3, 7, 15 and 30 days. Revision is always shown first on the home screen.
- **Interview mode** with a timer and a short self-review.
- **Accounts.** Email/password or Google sign-in; progress syncs through Firestore and works offline.
- **Works on phones.** Bottom tab bar, and the editor pages turn into Problem / Code tabs.

## Tech stack

| Part | What I used |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router, Monaco editor |
| Auth and data | Firebase Authentication, Cloud Firestore (offline cache on) |
| Code execution | Cloud runner on Render (Node + Python + JDK in Docker), with Pyodide and CheerpJ as in-browser fallbacks |
| Hosting | Vercel (web app), Render (runner) |

## How code execution works

You only write the solution (a function in Python, a `Solution` class in Java). Before running, the app appends a generated driver that reads each test case from stdin as JSON, converts it to real types (`list[int]`, `int[][]`, `ListNode`, `TreeNode`…), calls your code, times it and prints one marker line per test. All tests run in one process. Your code keeps its line numbers, so errors point at your own lines.

There are three engines, picked automatically (Settings → Code execution lets you force one):

1. **Cloud runner** (`runner/`), deployed on Render. It runs real CPython 3.11 and JDK 17. It only accepts requests that carry a valid Firebase ID token from this app, rate-limits each user, and runs code as an unprivileged user with time, memory, process and output limits. On Render's free plan it sleeps when idle, so the first run after a break can take up to a minute; during that time runs fall back to the browser.
2. **In the browser:** Python through Pyodide (CPython compiled to WebAssembly) and Java through CheerpJ (a Java 8 JVM in WebAssembly). Slower to start and Java 8 syntax only, but needs no server at all.
3. **Piston** (`piston/`), for local development: a Docker setup with stronger sandboxing. I couldn't host it on Render because it needs a privileged container, which is why the runner exists.

The runner speaks the same API as Piston, so the frontend has one client for both.

## Project structure

```
src/
  data/         roadmap, 231 problems, lessons, LeetCode map, topic-flow content
  lib/          judge + driver generator, execution engines, SRS, stats, Firebase auth
  store/        app state and storage (Firestore for accounts, IndexedDB before sign-in)
  pages/        one file per screen
  components/   editor, visualizer, shared UI
runner/         cloud code runner (deployed on Render)
piston/         local Piston setup (Docker)
scripts/        problem verification, expected-output generation, CheerpJ loader
public/         Pyodide worker, CheerpJ runner page, service worker
```

## Running it locally

```bash
npm install
cp .env.example .env        # fill in the Firebase web config
npm run dev                 # http://localhost:5173
```

Optional extras:

```bash
npm run fetch:tools-jar     # javac for in-browser Java (downloads a JDK 8 once, keeps 18 MB)

cd runner && docker build -t dsa-runner . \
  && docker run -p 10000:10000 -e ALLOWED_ORIGINS=http://localhost:5173 dsa-runner
                            # then set the server URL in Settings to http://localhost:10000
```

Or use Piston locally: see [`piston/README.md`](piston/README.md).

## Deployment

- **Web app (Vercel):** `vercel.json` fetches `tools.jar` and runs the Vite build. The `VITE_FIREBASE_*` variables and `VITE_RUNNER_URL` are set in the Vercel project. Routing is hash-based, so no rewrites are needed.
- **Runner (Render):** a Docker web service from `runner/` (see `render.yaml`). `ALLOWED_ORIGINS` must list the Vercel URL. Setting `ALLOWED_EMAILS` restricts runs to specific accounts.
- **Firebase:** the deployed domain has to be in Authentication → Settings → Authorized domains, and `firestore.rules` is deployed with `npx firebase-tools deploy --only firestore:rules`.

## Testing the problem set

Expected outputs are never typed by hand. `scripts/reference.py` holds reference solutions, `npm run gen:expected` regenerates `src/data/expected.json`, and

```bash
npm run verify:problems     # runs every built-in problem through the Python and Java drivers
npm run verify:map          # checks every LeetCode map entry points at real lessons and problems
npm run typecheck
```

(needs a local `python3` and JDK).

## Data and privacy

Each user's data lives in Firestore under `users/{uid}`, and `firestore.rules` only lets a signed-in user read and write their own tree. The Firebase web config in `.env` identifies the project; it isn't a secret. **Settings → Export JSON backup** downloads everything.

## Known limitations

- The free Render instance sleeps after about 15 minutes idle and has very little CPU, so Java runs there take a few seconds.
- The runner's isolation is weaker than Piston's (code can reach the network), which is why it requires sign-in.
- In-browser Java is Java 8 syntax only, and its first run takes about a minute to warm up.
