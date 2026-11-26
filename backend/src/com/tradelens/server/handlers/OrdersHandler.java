package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.HoldingsDAO;
import com.tradelens.dao.OrderDAO;
import com.tradelens.model.Holding;
import com.tradelens.model.Order;
import com.tradelens.util.JsonUtil;
import com.tradelens.util.SessionManager;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TradeLens - Orders & Holdings HTTP REST Handler (Arnav's Module 5)
 *
 * Endpoints Managed:
 * - GET /api/orders: Retrieves complete order history for authenticated user (newest first)
 * - GET /api/holdings: Retrieves current equity holdings with real-time portfolio valuation
 */
public class OrdersHandler implements HttpHandler {
    private final OrderDAO orderDAO;
    private final HoldingsDAO holdingsDAO;

    public OrdersHandler() {
        this.orderDAO = new OrderDAO();
        this.holdingsDAO = new HoldingsDAO();
    }

    public OrdersHandler(OrderDAO orderDAO, HoldingsDAO holdingsDAO) {
        this.orderDAO = orderDAO;
        this.holdingsDAO = holdingsDAO;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
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

        String path = exchange.getRequestURI().getPath();

        try {
            if ("GET".equals(method)) {
                if (path.endsWith("/orders")) {
                    handleGetOrders(exchange, userId);
                } else if (path.endsWith("/holdings")) {
                    handleGetHoldings(exchange, userId);
                } else {
                    sendError(exchange, 404, "NOT_FOUND", "Endpoint " + path + " not found.");
                }
            } else {
                sendError(exchange, 405, "METHOD_NOT_ALLOWED", "Method " + method + " not supported on " + path);
            }
        } catch (SQLException e) {
            System.err.println("[OrdersHandler] Database error: " + e.getMessage());
            sendError(exchange, 500, "DATABASE_ERROR", "Database error occurred while fetching records.");
        } catch (Exception e) {
            System.err.println("[OrdersHandler] Server error: " + e.getMessage());
            sendError(exchange, 500, "INTERNAL_ERROR", "Server error: " + e.getMessage());
        }
    }

    /**
     * GET /api/orders: Retrieves complete order history.
     */
    private void handleGetOrders(HttpExchange exchange, int userId) throws IOException, SQLException {
        List<Order> orders = orderDAO.getOrdersByUser(userId);
        sendJsonResponse(exchange, 200, orders);
    }

    /**
     * GET /api/holdings: Retrieves active holdings with financial metrics.
     */
    private void handleGetHoldings(HttpExchange exchange, int userId) throws IOException, SQLException {
        List<Holding> holdings = holdingsDAO.getHoldingsByUser(userId);
        sendJsonResponse(exchange, 200, holdings);
    }

    private void setCORSHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token");
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
