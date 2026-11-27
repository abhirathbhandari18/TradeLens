package com.tradelens.server;

/**
 * Main entry point for the TradeLens Java backend on port 8080.
 */
public class TradeLensServer {
    public static final int DEFAULT_PORT = 8080;

    public static void main(String[] args) {
        try {
            HttpServerApp app = new HttpServerApp(DEFAULT_PORT);
            app.start();

            Runtime.getRuntime().addShutdownHook(new Thread(app::stop, "TradeLens-Shutdown"));
        } catch (Exception e) {
            System.err.println("[TradeLensServer] Failed to start: " + e.getMessage());
            e.printStackTrace(System.err);
            System.exit(1);
        }
    }
}
