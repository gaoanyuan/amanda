package org.gaoay.amanda.robot;

import java.io.*;

/**
 * Created by v_gaoanyuan on 2015/2/9.
 * 我亲爱的Amanda拥有的初级交互方式，暂定为控制台
 *                   =======================  Amanda Console  ========================
 *                   module name
 *                   module name
 *                   module name
 *                   module name
 *                   ==================================================================
 *                   <<
 *
 */
public class Commander {
    private final String title = "Amanda Console";

    public void init() throws IOException {
        PrintStream console = System.out;
        console.println("=======================  " + title + "  ==========================" );
        InputStream keyboard = System.in;
        BufferedReader reader = new BufferedReader(new InputStreamReader(keyboard));
        String line = reader.readLine();
        console.println(line);
    }
    public static void main(String[] args) throws IOException {
        Commander commander = new Commander();
        commander.init();
    }
}
