# Runner image: Node for the HTTP server, Python 3.11 and JDK 17 for user code.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 openjdk-17-jdk-headless util-linux \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --shell /usr/sbin/nologin sandbox

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js CompileServer.java ./
COPY warmup ./warmup

# The warm compiler (see CompileServer.java), plus a class-data archive that makes the JVM which
# runs each submission start faster. The archive is built with the same flags server.js uses.
RUN javac -d /app CompileServer.java \
 && mkdir /tmp/cds && cd /tmp/cds \
 && printf 'import java.util.*;\nclass Main { public static void main(String[] a) { Scanner s = new Scanner(System.in); List<Integer> l = new ArrayList<>(Arrays.asList(3, 1, 2)); Collections.sort(l); Map<String, Integer> m = new HashMap<>(); m.put("a", 1); StringBuilder sb = new StringBuilder(); sb.append(l).append(m); System.out.println(sb); } }\n' > Main.java \
 && javac Main.java \
 && java -XX:ArchiveClassesAtExit=/app/run.jsa -Xmx192m -Xss64m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -cp . Main < /dev/null \
 && chmod 644 /app/run.jsa && rm -rf /tmp/cds

ENV PORT=10000
EXPOSE 10000
CMD ["node", "server.js"]
