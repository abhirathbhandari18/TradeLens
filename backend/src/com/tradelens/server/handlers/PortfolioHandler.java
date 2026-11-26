package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.HoldingsDAO;
import com.tradelens.dao.OrderDAO;
import com.tradelens.dao.UserDAO;
import com.tradelens.model.Holding;
import com.tradelens.model.Order;
import com.tradelens.model.User;
import com.tradelens.util.JsonUtil;
import com.tradelens.util.SessionManager;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * PortfolioHandler — Handles GET /api/portfolio and POST /api/portfolio/deposit.
 */
public class PortfolioHandler implements HttpHandler {

    private final UserDAO userDAO = new UserDAO();
    private final HoldingsDAO holdingsDAO = new HoldingsDAO();
    private final OrderDAO orderDAO = new OrderDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        setCorsHeaders(exchange);
        String method = exchange.getRequestMethod().toUpperCase();

        if ("OPTIONS".equals(method)) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        Integer userId = SessionManager.extractAuthenticatedUserId(exchange);
        if (userId == null) {
            sendError(exchange, 401, "Valid authentication token required.");
            return;
        }

        String path = exchange.getRequestURI().getPath();
        try {
            if ("GET".equals(method) && path.endsWith("/portfolio")) {
                User user = userDAO.findById(userId);
                if (user == null) {
                    sendError(exchange, 404, "User not found.");
                    return;
                }
                List<Holding> holdings = holdingsDAO.getHoldingsByUser(userId);
                List<Order> orders = orderDAO.getOrdersByUser(userId);

                Map<String, Object> res = new LinkedHashMap<>();
                res.put("cash", user.getCashBalance());
                res.put("holdings", holdings);
                res.put("orders", orders);
                sendJson(exchange, 200, res);
            } else if ("POST".equals(method) && path.endsWith("/deposit")) {
                Map<String, String> body = JsonUtil.parseSimpleJson(readBody(exchange));
                double amount = Double.parseDouble(body.getOrDefault("amount", "0"));
                if (amount <= 0) {
                    sendError(exchange, 400, "Deposit amount must be positive.");
                    return;
                }
                User user = userDAO.findById(userId);
                if (user == null) {
                    sendError(exchange, 404, "User not found.");
                    return;
                }
                double nextBalance = Math.round((user.getCashBalance() + amount) * 100.0) / 100.0;
                userDAO.updateCashBalance(userId, nextBalance);

                Map<String, Object> res = new LinkedHashMap<>();
                res.put("cash", nextBalance);
                sendJson(exchange, 200, res);
            } else {
                sendError(exchange, 404, "Endpoint not found: " + path);
            }
        } catch (NumberFormatException e) {
            sendError(exchange, 400, "Invalid deposit amount.");
        } catch (SQLException e) {
            sendError(exchange, 500, "Database error: " + e.getMessage());
        }
    }

    private String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token");
    }

    private void sendJson(HttpExchange exchange, int status, Object payload) throws IOException {
        byte[] bytes = JsonUtil.toJson(payload).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void sendError(HttpExchange exchange, int status, String message) throws IOException {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("error", message);
        sendJson(exchange, status, err);
    }
}
