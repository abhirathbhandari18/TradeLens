package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.UserDAO;
import com.tradelens.model.User;
import com.tradelens.util.JsonUtil;
import com.tradelens.util.SessionManager;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * AccountHandler — GET /api/account and PUT /api/account.
 * Uses SessionManager for auth, UserDAO for MySQL persistence, and JsonUtil for JSON.
 */
public class AccountHandler implements HttpHandler {

    private final UserDAO userDAO = new UserDAO();

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

        try {
            if ("GET".equals(method)) {
                User user = userDAO.findById(userId);
                if (user == null) {
                    sendError(exchange, 404, "User not found.");
                    return;
                }
                sendJson(exchange, 200, user);
            } else if ("PUT".equals(method)) {
                User user = userDAO.findById(userId);
                if (user == null) {
                    sendError(exchange, 404, "User not found.");
                    return;
                }
                Map<String, String> body = JsonUtil.parseSimpleJson(readBody(exchange));

                if (body.containsKey("name") && !body.get("name").isEmpty()) {
                    user.setName(body.get("name"));
                }
                if (body.containsKey("email") && !body.get("email").isEmpty()) {
                    user.setEmail(body.get("email"));
                }
                if (body.containsKey("panCard")) {
                    user.setPanCard(body.get("panCard").toUpperCase());
                }
                if (body.containsKey("phone")) {
                    user.setPhone(body.get("phone"));
                }
                if (body.containsKey("dob") && !body.get("dob").isEmpty()) {
                    user.setDob(LocalDate.parse(body.get("dob")));
                }
                if (body.containsKey("tradingStyle")) {
                    user.setTradingStyle(body.get("tradingStyle"));
                }
                if (body.containsKey("bankName")) {
                    user.setBankName(body.get("bankName"));
                }
                if (body.containsKey("accountNumber")) {
                    user.setAccountNumber(body.get("accountNumber"));
                }
                if (body.containsKey("ifscCode")) {
                    user.setIfscCode(body.get("ifscCode").toUpperCase());
                }
                if (body.containsKey("accountType")) {
                    user.setAccountType(body.get("accountType"));
                }
                if (body.containsKey("dematId")) {
                    user.setDematId(body.get("dematId"));
                }

                userDAO.updateProfileAndBank(user);
                Map<String, Object> res = new LinkedHashMap<>();
                res.put("message", "Account updated");
                res.put("user", userDAO.findById(userId));
                sendJson(exchange, 200, res);
            } else {
                sendError(exchange, 405, "Method not allowed: " + method);
            }
        } catch (SQLException e) {
            sendError(exchange, 500, "Database error: " + e.getMessage());
        } catch (Exception e) {
            sendError(exchange, 400, "Invalid account payload: " + e.getMessage());
        }
    }

    private String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
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
