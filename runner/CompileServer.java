import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;

/**
 * Long-running javac for the runner. Starting a JVM and loading javac takes ~7 s on Render's free
 * CPU, so instead this process stays up and compiles one directory per request. It never runs the
 * submitted code; server.js runs the compiled classes in a fresh JVM as the sandbox user.
 *
 * Protocol (one line each way): request = absolute directory path,
 * reply = "OK" or "ERR " + base64(javac output).
 */
public class CompileServer {
    public static void main(String[] args) throws IOException {
        JavaCompiler javac = ToolProvider.getSystemJavaCompiler();
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        PrintStream out = new PrintStream(new FileOutputStream(FileDescriptor.out), true, "UTF-8");
        String dir;
        while ((dir = in.readLine()) != null) {
            dir = dir.trim();
            if (dir.isEmpty()) continue;
            List<String> argv = new ArrayList<>(Arrays.asList("-proc:none", "-nowarn", "-encoding", "UTF-8", "-d", dir, "-cp", dir));
            try (DirectoryStream<Path> files = Files.newDirectoryStream(Paths.get(dir), "*.java")) {
                for (Path f : files) argv.add(f.toString());
            }
            ByteArrayOutputStream diag = new ByteArrayOutputStream();
            int code = javac.run(null, diag, diag, argv.toArray(new String[0]));
            if (code == 0) out.println("OK");
            else out.println("ERR " + Base64.getEncoder().encodeToString(diag.toByteArray()));
        }
    }
}
