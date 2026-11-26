package com.tradelens.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.tradelens.dao.DBConnectionManager;
import com.tradelens.server.handlers.*;
import com.tradelens.simulator.MarketSimulatorThread;
import com.tradelens.util.JsonUtil;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * TradeLens - Lightweight HTTP Server Application
 */
public class HttpServerApp {
    private final int port;
    private HttpServer server;
    private MarketSimulatorThread marketSimulator;

    public HttpServerApp(int port) {
        this.port = port;
    }

    public void start() throws IOException {
        // 1. Verify Database Connectivity
        boolean dbOk = DBConnectionManager.testConnection();
        if (!dbOk) {
            System.err.println("[WARNING] Could not connect to MySQL tradelens_db. Check credentials in DBConnectionManager!");
        } else {
            System.out.println("[DBConnectionManager] MySQL tradelens_db connection verified successfully!");
        }

        // 2. Start Simulated Price Thread
        marketSimulator = new MarketSimulatorThread();
        marketSimulator.start();

        // 3. Create HTTP Server
        server = HttpServer.create(new InetSocketAddress(port), 0);

        // 4. Register REST Endpoints
        // Arnav's Handlers:
        server.createContext("/api/watchlist", new WatchlistHandler());
        server.createContext("/api/orders", new OrdersHandler());
        server.createContext("/api/holdings", new OrdersHandler());

        // Java Concepts Educational Lab Handlers:
        JavaLabHandler labHandler = new JavaLabHandler();
        server.createContext("/api/lab", labHandler);
        server.createContext("/api/export", labHandler);

        // Teammates' Handlers:
        server.createContext("/api/stocks", new StockHandler());
        server.createContext("/api/auth", new AuthHandler());
        server.createContext("/api/trade", new TradeHandler());
        server.createContext("/api/account", new AccountHandler());

        // Health Check
        server.createContext("/api/health", exchange -> {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "UP");
            resp.put("database", dbOk ? "CONNECTED" : "DISCONNECTED");
            resp.put("application", "TradeLens Portfolio Management");
            resp.put("version", "1.0 - MySQL & JDBC");
            byte[] bytes = JsonUtil.toJson(resp).getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });

        server.setExecutor(Executors.newCachedThreadPool());
        server.start();

        printBanner();
    }

    public void stop() {
        if (marketSimulator != null) marketSimulator.stopSimulation();
        if (server != null) server.stop(0);
        System.out.println("[TradeLens Server] Stopped.");
    }

    private void printBanner() {
        System.out.println("==================================================================");
        System.out.println("  _____             _      _                    ");
        System.out.println(" |_   _|           | |    | |                   ");
        System.out.println("   | |_ __ __ _  __| | ___| |     ___ _ __  ___ ");
        System.out.println("   | | '__/ _` |/ _` |/ _ \\ |    / _ \\ '_ \\/ __|");
        System.out.println("   | | | | (_| | (_| |  __/ |___|  __/ | | \\__ \\");
        System.out.println("   \\_/_|  \\__,_|\\__,_|\\___\\_____/\\___|_| |_|___/");
        System.out.println("       TradeLens - Smart Stock Portfolio Management");
        System.out.println("==================================================================");
        System.out.println(" REST API Server running at: http://localhost:" + port + "/api/");
        System.out.println(" Arnav's Handlers Active:");
        System.out.println("   - Watchlist: http://localhost:" + port + "/api/watchlist");
        System.out.println("   - Orders   : http://localhost:" + port + "/api/orders");
        System.out.println("   - Holdings : http://localhost:" + port + "/api/holdings");
        System.out.println(" Market & Trading Handlers Active:");
        System.out.println("   - Stocks   : http://localhost:" + port + "/api/stocks");
        System.out.println("   - Auth     : http://localhost:" + port + "/api/auth/login");
        System.out.println("   - Trade    : http://localhost:" + port + "/api/trade/buy");
        System.out.println("   - Account  : http://localhost:" + port + "/api/account");
        System.out.println("==================================================================");
    }
}
