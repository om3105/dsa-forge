#!/usr/bin/env bash
# Installs the language runtimes into the running Piston container (one-time; they persist in ./data).
set -euo pipefail
URL="${PISTON_URL:-http://localhost:2000}"
PY_VERSION="${PY_VERSION:-3.12.0}"
JAVA_VERSION="${JAVA_VERSION:-15.0.2}"   # newest Java in the official Piston package repo

echo "Waiting for Piston at $URL ..."
for i in $(seq 1 30); do
  curl -fsS "$URL/api/v2/runtimes" >/dev/null 2>&1 && break
  sleep 2
done

install() {
  echo "Installing $1 $2 (this downloads the runtime, can take a few minutes)..."
  curl -fsS -X POST "$URL/api/v2/packages" -H 'Content-Type: application/json' \
    -d "{\"language\":\"$1\",\"version\":\"$2\"}" && echo
}
install python "$PY_VERSION"
install java "$JAVA_VERSION"

echo "Installed runtimes:"
curl -fsS "$URL/api/v2/runtimes"; echo

echo "Smoke test:"
curl -fsS -X POST "$URL/api/v2/execute" -H 'Content-Type: application/json' \
  -d '{"language":"python","version":"*","files":[{"name":"main.py","content":"print(sum(range(10)))"}]}'; echo
curl -fsS -X POST "$URL/api/v2/execute" -H 'Content-Type: application/json' \
  -d '{"language":"java","version":"*","files":[{"name":"Main.java","content":"public class Main { public static void main(String[] a) { System.out.println(\"java ok\"); } }"}]}'; echo
