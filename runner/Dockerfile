# Runner image: Node for the HTTP server, Python 3.11 and JDK 17 for user code.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 openjdk-17-jdk-headless util-linux \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --shell /usr/sbin/nologin sandbox

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./

ENV PORT=10000
EXPOSE 10000
CMD ["node", "server.js"]
