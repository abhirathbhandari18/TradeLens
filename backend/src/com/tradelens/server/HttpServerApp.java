package com.tradelens.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.tradelens.dao.StockDAO;
import com.tradelens.engine.MarketDataStore;
import com.tradelens.engine.MarketSimulatorThread;
import com.tradelens.engine.OrderMatcherThread;
import com.tradelens.model.Stock;
import com.tradelens.server.handlers.*;
import com.tradelens.util.JsonUtil;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * TradeLens - Lightweight HTTP Server Application
 */
public class HttpServerApp {
    private final int port;
    private HttpServer server;
    private ExecutorService serverExecutor;
    private MarketDataStore marketDataStore;
    private MarketSimulatorThread marketSimulator;
    private OrderMatcherThread orderMatcher;

    public HttpServerApp(int port) {
        this.port = port;
    }

    public synchronized void start() throws IOException {
        if (server != null) {
            throw new IOException("TradeLens server is already running.");
        }

        marketDataStore = loadMarketData();

        HttpServer newServer = HttpServer.create(new InetSocketAddress(port), 0);
        newServer.createContext("/api/watchlist", new WatchlistHandler());
        newServer.createContext("/api/orders", new OrdersHandler());
        newServer.createContext("/api/holdings", new OrdersHandler());
        newServer.createContext("/api/stocks", new StockHandler(marketDataStore));
        newServer.createContext("/api/auth", new AuthHandler());
        orderMatcher = new OrderMatcherThread(marketDataStore);
        TradeHandler tradeHandler = new TradeHandler(marketDataStore, orderMatcher);
        newServer.createContext("/api/trade", tradeHandler);
        newServer.createContext("/api/buy", tradeHandler);
        newServer.createContext("/api/sell", tradeHandler);
        newServer.createContext("/api/portfolio", new PortfolioHandler());
        newServer.createContext("/api/account", new AccountHandler());

        newServer.createContext("/api/health", this::handleHealthCheck);

        serverExecutor = Executors.newCachedThreadPool();
        newServer.setExecutor(serverExecutor);
        marketSimulator = new MarketSimulatorThread(marketDataStore);
        server = newServer;

        try {
            marketSimulator.start();
            orderMatcher.start();
            server.start();
        } catch (RuntimeException e) {
            try {
                newServer.stop(0);
            } catch (RuntimeException stopFailure) {
                e.addSuppressed(stopFailure);
            }
            stopWorkers();
            if (serverExecutor != null) {
                serverExecutor.shutdownNow();
            }
            server = null;
            marketDataStore = null;
            marketSimulator = null;
            orderMatcher = null;
            serverExecutor = null;
            throw e;
        }

        System.out.println("[HttpServerApp] Loaded " + marketDataStore.getAllStocks().size()
                + " stocks into the shared market store.");
        printBanner();
    }

    private MarketDataStore loadMarketData() throws IOException {
        List<Stock> initialStocks;
        try {
            initialStocks = new StockDAO().getAllStocks();
        } catch (SQLException e) {
            throw new IOException("Unable to load initial stocks from MySQL; server startup aborted.", e);
        }

        if (initialStocks == null || initialStocks.isEmpty()) {
            throw new IOException("No stocks were loaded from MySQL; server startup aborted.");
        }

        MarketDataStore store = new MarketDataStore();
        try {
            store.loadStocks(initialStocks);
        } catch (RuntimeException e) {
            throw new IOException("Unable to initialize the in-memory market data store.", e);
        }
        return store;
    }

    private void handleHealthCheck(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("database", "CONNECTED");
        response.put("application", "TradeLens Portfolio Management");
        response.put("version", "1.0 - MySQL & JDBC");
        byte[] bytes = JsonUtil.toJson(response).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    public synchronized void stop() {
        if (server != null) {
            server.stop(0);
            server = null;
        }
        stopWorkers();
        if (serverExecutor != null) {
            serverExecutor.shutdownNow();
            serverExecutor = null;
        }
        marketDataStore = null;
        System.out.println("[TradeLens Server] Stopped.");
    }

    private void stopWorkers() {
        if (orderMatcher != null) {
            orderMatcher.stopMatcher();
            joinWorker(orderMatcher, "order matcher");
            orderMatcher = null;
        }
        if (marketSimulator != null) {
            marketSimulator.stopSimulation();
            joinWorker(marketSimulator, "market simulator");
            marketSimulator = null;
        }
    }

    private static void joinWorker(Thread worker, String workerName) {
        try {
            worker.join(2000L);
            if (worker.isAlive()) {
                System.err.println("[HttpServerApp] Timed out waiting for " + workerName + " shutdown.");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("[HttpServerApp] Interrupted while waiting for " + workerName + " shutdown.");
        }
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
        System.out.println("   - Watchlist: http://localhost:" + port + "/api/watchlist");
        System.out.println("   - Orders   : http://localhost:" + port + "/api/orders");
        System.out.println("   - Holdings : http://localhost:" + port + "/api/holdings");
        System.out.println("   - Stocks   : http://localhost:" + port + "/api/stocks");
        System.out.println("   - Auth     : http://localhost:" + port + "/api/auth/login");
        System.out.println("   - Trade    : http://localhost:" + port + "/api/trade/buy");
        System.out.println("   - Account  : http://localhost:" + port + "/api/account");
        System.out.println("==================================================================");
    }
}
