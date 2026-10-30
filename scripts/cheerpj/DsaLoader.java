/*
 * Runs inside CheerpJ (Java 8 JVM in the browser).
 * args: <outDir> <mainClass> <sourceFile> <stdinFile>
 * Compiles the source with the in-process javac, then loads the classes through a
 * fresh URLClassLoader so every run sees the newest code without restarting the JVM.
 * Rebuild with: npm run build:loader (compiles with --release 8 and packs public/cheerpj/dsaloader.jar)
 */
import java.io.File;
import java.io.FileInputStream;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;

public class DsaLoader {
    public static void main(String[] args) throws Exception {
        String outDir = args[0], mainClass = args[1], source = args[2], stdin = args[3];
        PrintStream out = System.out;
        new File(outDir).mkdirs();
        StringWriter log = new StringWriter();
        // reflective so this file builds with --release 8 (javac lives in tools.jar)
        Method compile = Class.forName("com.sun.tools.javac.Main").getMethod("compile", String[].class, PrintWriter.class);
        int rc = (Integer) compile.invoke(null,
                new String[] {"-d", outDir, "-encoding", "UTF-8", "-nowarn", "-g", source},
                new PrintWriter(log));
        if (rc != 0) {
            out.println("@@COMPILE_ERROR@@");
            out.print(log.toString());
            out.println("@@END@@");
            out.flush();
            return;
        }
        out.println("@@RUN@@");
        out.flush();
        System.setIn(new FileInputStream(stdin));
        URLClassLoader cl = new URLClassLoader(new URL[] {new File(outDir).toURI().toURL()}, DsaLoader.class.getClassLoader());
        try {
            Class<?> c = cl.loadClass(mainClass);
            Method m = c.getMethod("main", String[].class);
            m.invoke(null, (Object) new String[0]);
            System.out.flush();
            out.println();
            out.println("@@END@@");
        } catch (InvocationTargetException e) {
            System.out.flush();
            out.println();
            out.println("@@EXCEPTION@@");
            e.getCause().printStackTrace(out);
            out.println("@@END@@");
        } catch (Throwable t) {
            out.println();
            out.println("@@EXCEPTION@@");
            t.printStackTrace(out);
            out.println("@@END@@");
        }
        out.flush();
    }
}
