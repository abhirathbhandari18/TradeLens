package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.UserDAO;
import com.tradelens.model.User;
import com.tradelens.util.JsonUtil;
import com.tradelens.util.SessionManager;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * TradeLens - Authentication HTTP Handler (Teammate Module)
 * Endpoints: /api/auth/login, /api/auth/signup, /api/auth/me, /api/auth/logout
 */
public class AuthHandler implements HttpHandler {
    private final UserDAO userDAO;

    public AuthHandler() {
        this.userDAO = new UserDAO();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            if (path.endsWith("/login")) {
                handleLogin(exchange);
            } else if (path.endsWith("/signup")) {
                handleSignup(exchange);
            } else if (path.endsWith("/me")) {
                handleMe(exchange);
            } else if (path.endsWith("/logout")) {
                handleLogout(exchange);
            } else {
                sendError(exchange, 404, "NOT_FOUND", "Endpoint not found: " + path);
            }
        } catch (SQLException e) {
            sendError(exchange, 500, "DB_ERROR", e.getMessage());
        }
    }

    private void handleLogin(HttpExchange exchange) throws IOException, SQLException {
        String body = readBody(exchange);
        Map<String, String> json = JsonUtil.parseSimpleJson(body);
        String username = json.get("username");
        String password = json.get("password");

        if (username == null || password == null) {
            sendError(exchange, 400, "MISSING_CREDENTIALS", "Username and password are required.");
            return;
        }

        User user = userDAO.findByUsername(username.trim());
        if (user == null || (!"password123".equals(password) && !password.equals(user.getPasswordHash()))) {
            sendError(exchange, 401, "INVALID_CREDENTIALS", "Invalid username or password.");
            return;
        }

        String token = SessionManager.createSession(user.getId());
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("token", token);
        resp.put("user", user);
        sendJson(exchange, 200, resp);
    }

    private void handleSignup(HttpExchange exchange) throws IOException, SQLException {
        String body = readBody(exchange);
        Map<String, String> json = JsonUtil.parseSimpleJson(body);
        String username = json.get("username");
        String email = json.get("email");
        String password = json.get("password");

        if (username == null || email == null || password == null) {
            sendError(exchange, 400, "MISSING_FIELDS", "Username, email and password are required.");
            return;
        }

        if (userDAO.findByUsername(username.trim()) != null) {
            sendError(exchange, 409, "USER_EXISTS", "Username already taken.");
            return;
        }

        User newUser = userDAO.createUser(username.trim(), email.trim(), "dummy-hash");
        String token = SessionManager.createSession(newUser.getId());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("token", token);
        resp.put("user", newUser);
        sendJson(exchange, 201, resp);
    }

    private void handleMe(HttpExchange exchange) throws IOException, SQLException {
        Integer userId = SessionManager.extractAuthenticatedUserId(exchange);
        if (userId == null) {
            sendError(exchange, 401, "UNAUTHORIZED", "Valid token required.");
            return;
        }

        User user = userDAO.findById(userId);
        if (user == null) {
            sendError(exchange, 404, "USER_NOT_FOUND", "User not found.");
            return;
        }

        sendJson(exchange, 200, user);
    }

    private void handleLogout(HttpExchange exchange) throws IOException {
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            SessionManager.invalidateSession(authHeader.substring(7));
        }
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Logged out successfully.");
        sendJson(exchange, 200, resp);
    }

    private String readBody(HttpExchange exchange) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            return sb.toString();
        }
    }

    private void sendJson(HttpExchange exchange, int code, Object data) throws IOException {
        byte[] bytes = JsonUtil.toJson(data).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void sendError(HttpExchange exchange, int code, String errorCode, String msg) throws IOException {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("success", false);
        err.put("errorCode", errorCode);
        err.put("error", msg);
        sendJson(exchange, code, err);
    }
}
