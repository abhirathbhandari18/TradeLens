package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.WatchlistDAO;
import com.tradelens.model.WatchlistItem;
import com.tradelens.util.JsonUtil;
import com.tradelens.util.SessionManager;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TradeLens - Watchlist HTTP REST Handler (Arnav's Module 4)
 *
 * Endpoint: /api/watchlist
 * Supported Methods:
 * - GET: Retrieves the authenticated user's watchlist
 * - POST: Adds a stock to the user's watchlist
 * - DELETE: Removes a stock from the user's watchlist
 *
 * Security:
 * - Resolves userId strictly through verified session token (SessionManager).
 * - Never trusts client-supplied userIds.
 */
public class WatchlistHandler implements HttpHandler {
    private final WatchlistDAO watchlistDAO;

    public WatchlistHandler() {
        this.watchlistDAO = new WatchlistDAO();
    }

    public WatchlistHandler(WatchlistDAO watchlistDAO) {
        this.watchlistDAO = watchlistDAO;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Set standard CORS headers
        setCORSHeaders(exchange);

        String method = exchange.getRequestMethod().toUpperCase();
        if ("OPTIONS".equals(method)) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        // 1. Authenticate Request
        Integer userId = SessionManager.extractAuthenticatedUserId(exchange);
        if (userId == null) {
            sendError(exchange, 401, "UNAUTHORIZED", "Valid authentication token required. Pass Authorization: Bearer <token>");
            return;
        }

        try {
            switch (method) {
                case "GET" -> handleGetWatchlist(exchange, userId);
                case "POST" -> handleAddWatchlistItem(exchange, userId);
                case "DELETE" -> handleRemoveWatchlistItem(exchange, userId);
                default -> sendError(exchange, 405, "METHOD_NOT_ALLOWED", "Method " + method + " not allowed on /api/watchlist");
            }
        } catch (IllegalArgumentException e) {
            sendError(exchange, 400, "BAD_REQUEST", e.getMessage());
        } catch (SQLException e) {
            System.err.println("[WatchlistHandler] Database error: " + e.getMessage());
            sendError(exchange, 500, "DATABASE_ERROR", "Database error occurred while processing watchlist request.");
        } catch (Exception e) {
            System.err.println("[WatchlistHandler] Unexpected error: " + e.getMessage());
            sendError(exchange, 500, "INTERNAL_ERROR", "Internal Server Error: " + e.getMessage());
        }
    }

    /**
     * GET /api/watchlist: Returns user's saved stocks.
     */
    private void handleGetWatchlist(HttpExchange exchange, int userId) throws IOException, SQLException {
        List<WatchlistItem> items = watchlistDAO.getWatchlist(userId);
        sendJsonResponse(exchange, 200, items);
    }

    /**
     * POST /api/watchlist: Adds an equity to the watchlist.
     * Request Body: { "symbol": "INFY" }
     */
    private void handleAddWatchlistItem(HttpExchange exchange, int userId) throws IOException, SQLException {
        String body = readRequestBody(exchange);
        Map<String, String> json = JsonUtil.parseSimpleJson(body);
        String symbol = json.get("symbol");

        if (symbol == null || symbol.trim().isEmpty()) {
            sendError(exchange, 400, "MISSING_FIELD", "Request body must include 'symbol' (e.g. {\"symbol\":\"TCS\"})");
            return;
        }

        boolean added = watchlistDAO.addWatchlistItem(userId, symbol);
        if (!added) {
            sendError(exchange, 409, "DUPLICATE_ENTRY", "Stock '" + symbol.toUpperCase() + "' is already in your watchlist.");
            return;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Stock " + symbol.toUpperCase() + " successfully added to watchlist.");
        sendJsonResponse(exchange, 201, response);
    }

    /**
     * DELETE /api/watchlist: Removes an equity from the watchlist.
     * Supported formats: Body { "symbol": "INFY" } or URL param ?symbol=INFY
     */
    private void handleRemoveWatchlistItem(HttpExchange exchange, int userId) throws IOException, SQLException {
        String symbol = null;

        // Check query param first
        String query = exchange.getRequestURI().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                if (param.startsWith("symbol=")) {
                    symbol = param.substring(7);
                    break;
                }
            }
        }

        // Check body if not in query
        if (symbol == null || symbol.trim().isEmpty()) {
            String body = readRequestBody(exchange);
            if (!body.isEmpty()) {
                Map<String, String> json = JsonUtil.parseSimpleJson(body);
                symbol = json.get("symbol");
            }
        }

        if (symbol == null || symbol.trim().isEmpty()) {
            sendError(exchange, 400, "MISSING_FIELD", "Stock symbol is required to remove from watchlist.");
            return;
        }

        boolean removed = watchlistDAO.removeWatchlistItem(userId, symbol);
        if (!removed) {
            sendError(exchange, 404, "NOT_FOUND", "Stock '" + symbol.toUpperCase() + "' was not found in your watchlist.");
            return;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Stock " + symbol.toUpperCase() + " removed from watchlist.");
        sendJsonResponse(exchange, 200, response);
    }

    private void setCORSHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token");
    }

    private String readRequestBody(HttpExchange exchange) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString().trim();
        }
    }

    private void sendJsonResponse(HttpExchange exchange, int statusCode, Object data) throws IOException {
        byte[] bytes = JsonUtil.toJson(data).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void sendError(HttpExchange exchange, int statusCode, String errorCode, String message) throws IOException {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("success", false);
        error.put("errorCode", errorCode);
        error.put("error", message);
        sendJsonResponse(exchange, statusCode, error);
    }
}
