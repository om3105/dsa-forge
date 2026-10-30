# Self-hosted Piston for DSA Forge

[Piston](https://github.com/engineer-man/piston) is an open-source code execution engine that runs in Docker. Running your own copy means no API keys, no rate limits and no daily quotas. (The public Piston API stopped being freely available in Feb 2026, so self-hosting is the only option.)

```
browser app ──HTTP──▶ nginx (adds CORS, port 2000) ──▶ piston container ──▶ isolated Python / Java process
```

Piston does not send CORS headers, so a small nginx container sits in front of it and adds them. That is the only port published on your machine.

## Requirements

- Docker with Docker Compose v2
- Linux host with **cgroup v2** (Docker Desktop on macOS/Windows and any recent Ubuntu/Debian VM qualify)
- The Piston container runs `privileged: true` because it sandboxes each run with cgroups/namespaces

## Start it on your laptop

```bash
cd piston
docker compose up -d          # pulls ghcr.io/engineer-man/piston and nginx
./install-runtimes.sh         # one-time: installs Python 3.12.0 and Java into ./data/packages
```

The script waits for the API, installs the runtimes through `POST /api/v2/packages`, lists them and runs a smoke test in each language. Packages persist in `./data/packages`, so you only do this once.

Then in the app open **Settings → Code execution**, keep the URL `http://localhost:2000`, click **Save & test**. The sidebar engine indicator turns to **Server**.

Stop / start later:

```bash
docker compose stop
docker compose start
```

## Java version

The official Piston package repository currently ships **Java 15.0.2** as its newest JDK, so that is what `install-runtimes.sh` installs. Everything in DSA Forge works with it: the judge's generated code only uses Java 8 features, and your own solutions can use anything up to Java 15 (`var`, switch expressions, text blocks). Java 16+ features such as records and pattern matching for `instanceof` are not available on it. If you need JDK 17+, you would have to build a custom Piston package (see `packages/` in the Piston repo); that is not automated here.

To see what is available: `curl http://localhost:2000/api/v2/packages`.

## Limits

`docker-compose.yml` raises Piston's defaults so the app's requests are accepted:

| Setting | Value | Why |
|---|---|---|
| `PISTON_RUN_TIMEOUT` | 15000 ms | upper bound; the app asks for your Settings value (default 5 s) |
| `PISTON_COMPILE_TIMEOUT` | 30000 ms | javac on a cold container can take several seconds |
| `PISTON_OUTPUT_MAX_SIZE` | 1 MB | the default (1024 chars) would truncate judge output |

Time Limit Exceeded is reported when the run is killed at the timeout. The memory cap from Settings is sent as `run_memory_limit` for Python only; the JVM reserves a lot of address space at start-up and an address-space cap breaks it.

## Running on a free cloud VM

Any small Linux VM works (e.g. Oracle Cloud free tier, a GCP e2-micro). Install Docker, copy this folder, run the same two commands.

**Do not expose port 2000 to the whole internet** — anyone could run code on your VM. Options, from simplest:

1. Keep it bound to `127.0.0.1` (the default here) and use an SSH tunnel from your laptop:
   `ssh -N -L 2000:localhost:2000 you@your-vm` — then the app still uses `http://localhost:2000`.
2. Use a private network such as Tailscale and bind to the VM's Tailscale IP (`"100.x.y.z:2000:2000"` in `docker-compose.yml`).

If the app itself is served over HTTPS from a public host, browsers block calls to a plain-HTTP server; options 1 and 2 avoid that because the target is `localhost` / a private address.

## Troubleshooting

- `curl http://localhost:2000/api/v2/runtimes` should list `python` and `java`.
- `docker compose logs piston` shows sandbox errors. "cgroup" errors usually mean the host is still on cgroup v1.
- If the app says "Server offline", the engine automatically falls back to the in-browser engines (unless Settings → Engine is "Server only").
