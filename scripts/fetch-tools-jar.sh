#!/usr/bin/env bash
# Downloads a JDK 8 (Eclipse Temurin, GPLv2+CE) and copies its lib/tools.jar into public/.
# CheerpJ (the in-browser JVM) runs Java 8, and tools.jar contains javac for it.
# Only needed for the offline/browser Java engine. ~100 MB download, ~18 MB kept.
set -euo pipefail
cd "$(dirname "$0")/.."
DEST=public/tools.jar
if [ -f "$DEST" ]; then echo "$DEST already exists"; exit 0; fi
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
URL="https://api.adoptium.net/v3/binary/latest/8/ga/linux/x64/jdk/hotspot/normal/eclipse"
echo "Downloading JDK 8 from $URL"
curl -fL --progress-bar -o "$TMP/jdk.tar.gz" "$URL"
JAR=$(tar -tzf "$TMP/jdk.tar.gz" | grep -E '/lib/tools\.jar$' | head -1)
tar -xzf "$TMP/jdk.tar.gz" -C "$TMP" "$JAR"
cp "$TMP/$JAR" "$DEST"
echo "Saved $DEST ($(du -h "$DEST" | cut -f1))"
