package com.tradelens.server;

/**
 * TradeLensServer — Main entry point for the unified TradeLens Core Java backend.
 * Starts HttpServerApp on http://localhost:8080 with MarketSimulatorThread,
 * OrderMatcherThread, and all /api/* REST handlers.
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
