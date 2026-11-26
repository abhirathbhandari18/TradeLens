package com.tradelens;

import com.tradelens.server.HttpServerApp;

/**
 * TradeLens - Server Entry Point
 */
public class Main {
    private static final int DEFAULT_PORT = 8080;

    public static void main(String[] args) {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException e) {
                System.out.println("Invalid port. Using default: " + DEFAULT_PORT);
            }
        }

        try {
            HttpServerApp app = new HttpServerApp(port);
            app.start();
            Runtime.getRuntime().addShutdownHook(new Thread(app::stop));
        } catch (Exception e) {
            System.err.println("Fatal: Could not launch TradeLens Server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
