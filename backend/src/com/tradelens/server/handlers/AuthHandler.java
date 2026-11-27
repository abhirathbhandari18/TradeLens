package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.UserDAO;
import com.tradelens.exceptions.TradingExceptions.UnauthorizedException;
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
 * Handles signup, login, and logout using UserDAO and SessionManager.
 */
public class AuthHandler implements HttpHandler {

    private final UserDAO userDAO = new UserDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        setCorsHeaders(exchange);
        String method = exchange.getRequestMethod();

        if ("OPTIONS".equalsIgnoreCase(method)) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        if (!"POST".equalsIgnoreCase(method)) {
            sendError(exchange, 405, "Only POST is supported on auth endpoints.");
            return;
        }

        String path = exchange.getRequestURI().getPath();
        try {
            if (path.endsWith("/signup")) {
                handleSignup(exchange);
            } else if (path.endsWith("/login")) {
                handleLogin(exchange);
            } else if (path.endsWith("/logout")) {
                handleLogout(exchange);
            } else {
                sendError(exchange, 404, "Auth endpoint not found: " + path);
            }
        } catch (UnauthorizedException e) {
            sendError(exchange, 401, e.getMessage());
        } catch (IllegalArgumentException e) {
            sendError(exchange, 400, e.getMessage());
        } catch (SQLException e) {
            sendError(exchange, 500, "Database error: " + e.getMessage());
        }
    }

    private void handleSignup(HttpExchange exchange) throws IOException, SQLException {
        Map<String, String> body = JsonUtil.parseSimpleJson(readBody(exchange));
        String name = body.getOrDefault("name", "").trim();
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        String password = body.getOrDefault("password", "");
        String tradingStyle = body.getOrDefault("tradingStyle", "Swing Trader").trim();
        String panCard = body.getOrDefault("panCard", "").trim().toUpperCase();

        if (name.isEmpty() || email.isEmpty() || password.length() < 6) {
            throw new IllegalArgumentException("Enter name, valid email, and a password of at least 6 characters.");
        }
        if (userDAO.findByEmail(email) != null) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        long suffix = Math.abs(System.currentTimeMillis() % 900000L) + 100000L;
        User newUser = new User();
        newUser.setTradeId("TL-" + suffix);
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setPasswordHash(password);
        newUser.setPanCard(panCard.isEmpty() ? null : panCard);
        newUser.setPhone("+91 98765 43210");
        newUser.setDob(LocalDate.of(2000, 1, 15));
        newUser.setKycStatus("Verified");
        newUser.setTradingStyle(tradingStyle);
        newUser.setBankName("HDFC Bank");
        newUser.setAccountNumber("50100482910482");
        newUser.setIfscCode("HDFC0001245");
        newUser.setAccountType("Savings");
        newUser.setDematId("1208160048291042");
        newUser.setCashBalance(145000.00);

        User created = userDAO.createUser(newUser);
        String token = SessionManager.createSession(created.getId());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("token", token);
        res.put("user", created);
        sendJson(exchange, 201, res);
    }

    private void handleLogin(HttpExchange exchange) throws IOException, SQLException, UnauthorizedException {
        Map<String, String> body = JsonUtil.parseSimpleJson(readBody(exchange));
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        String password = body.getOrDefault("password", "");

        if (email.isEmpty() || password.isEmpty()) {
            throw new IllegalArgumentException("Please enter both email and password.");
        }

        User user = userDAO.findByEmail(email);
        if (user == null || !password.equals(user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        String token = SessionManager.createSession(user.getId());
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("token", token);
        res.put("user", user);
        sendJson(exchange, 200, res);
    }

    private void handleLogout(HttpExchange exchange) throws IOException {
        String auth = exchange.getRequestHeaders().getFirst("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            SessionManager.invalidateSession(auth.substring(7).trim());
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("message", "Logged out");
        sendJson(exchange, 200, res);
    }

    private String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
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
