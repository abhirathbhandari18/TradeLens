package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.HoldingsDAO;
import com.tradelens.dao.UserDAO;
import com.tradelens.model.Holding;
import com.tradelens.model.User;
import com.tradelens.util.JsonUtil;
import com.tradelens.util.SessionManager;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TradeLens - Account & Portfolio Overview Handler (Teammate Module)
 * Endpoints: /api/account, /api/account/deposit
 */
public class AccountHandler implements HttpHandler {
    private final UserDAO userDAO;
    private final HoldingsDAO holdingsDAO;

    public AccountHandler() {
        this.userDAO = new UserDAO();
        this.holdingsDAO = new HoldingsDAO();
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

        Integer userId = SessionManager.extractAuthenticatedUserId(exchange);
        if (userId == null) {
            sendError(exchange, 401, "UNAUTHORIZED", "Valid authentication token required.");
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod()) && path.endsWith("/deposit")) {
                handleDeposit(exchange, userId);
            } else {
                handleGetAccount(exchange, userId);
            }
        } catch (SQLException e) {
            sendError(exchange, 500, "DB_ERROR", e.getMessage());
        }
    }

    private void handleGetAccount(HttpExchange exchange, int userId) throws IOException, SQLException {
        User user = userDAO.findById(userId);
        if (user == null) {
            sendError(exchange, 404, "USER_NOT_FOUND", "User not found.");
            return;
        }

        List<Holding> holdings = holdingsDAO.getHoldingsByUser(userId);

        BigDecimal totalInvested = BigDecimal.ZERO;
        BigDecimal currentPortfolioValue = BigDecimal.ZERO;

        for (Holding h : holdings) {
            totalInvested = totalInvested.add(h.getTotalInvested());
            currentPortfolioValue = currentPortfolioValue.add(h.getCurrentValue());
        }

        BigDecimal netProfitLoss = currentPortfolioValue.subtract(totalInvested).setScale(2, RoundingMode.HALF_UP);
        BigDecimal returnPercentage = BigDecimal.ZERO;
        if (totalInvested.compareTo(BigDecimal.ZERO) > 0) {
            returnPercentage = netProfitLoss.divide(totalInvested, 4, RoundingMode.HALF_UP)
                                           .multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("user", user);
        resp.put("walletBalance", user.getWalletBalance());
        resp.put("totalInvested", totalInvested);
        resp.put("currentPortfolioValue", currentPortfolioValue);
        resp.put("netProfitLoss", netProfitLoss);
        resp.put("returnPercentage", returnPercentage);
        resp.put("holdingCount", holdings.size());
        resp.put("holdings", holdings);

        sendJson(exchange, 200, resp);
    }

    private void handleDeposit(HttpExchange exchange, int userId) throws IOException, SQLException {
        String body = readBody(exchange);
        Map<String, String> json = JsonUtil.parseSimpleJson(body);
        String amountStr = json.get("amount");

        if (amountStr == null) {
            sendError(exchange, 400, "MISSING_AMOUNT", "Deposit amount is required.");
            return;
        }

        BigDecimal depositAmount;
        try {
            depositAmount = new BigDecimal(amountStr.trim()).setScale(2, RoundingMode.HALF_UP);
            if (depositAmount.compareTo(BigDecimal.ZERO) <= 0) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            sendError(exchange, 400, "INVALID_AMOUNT", "Amount must be a positive number.");
            return;
        }

        User user = userDAO.findById(userId);
        BigDecimal newBalance = user.getWalletBalance().add(depositAmount);
        userDAO.updateWalletBalance(userId, newBalance);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Deposited ?" + depositAmount + " into your TradeLens wallet.");
        resp.put("newWalletBalance", newBalance);
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
