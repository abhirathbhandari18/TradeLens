package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.HoldingsDAO;
import com.tradelens.dao.OrderDAO;
import com.tradelens.dao.StockDAO;
import com.tradelens.dao.UserDAO;
import com.tradelens.model.Holding;
import com.tradelens.model.Order;
import com.tradelens.model.Stock;
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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * TradeLens - Trade Execution HTTP Handler (Teammate Module)
 * Endpoints: /api/trade/buy, /api/trade/sell
 */
public class TradeHandler implements HttpHandler {
    private final StockDAO stockDAO;
    private final HoldingsDAO holdingsDAO;
    private final OrderDAO orderDAO;
    private final UserDAO userDAO;

    public TradeHandler() {
        this.stockDAO = new StockDAO();
        this.holdingsDAO = new HoldingsDAO();
        this.orderDAO = new OrderDAO();
        this.userDAO = new UserDAO();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
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
            if (path.endsWith("/buy")) {
                handleBuy(exchange, userId);
            } else if (path.endsWith("/sell")) {
                handleSell(exchange, userId);
            } else {
                sendError(exchange, 404, "NOT_FOUND", "Endpoint not found: " + path);
            }
        } catch (SQLException e) {
            sendError(exchange, 500, "DB_ERROR", e.getMessage());
        }
    }

    private void handleBuy(HttpExchange exchange, int userId) throws IOException, SQLException {
        String body = readBody(exchange);
        Map<String, String> json = JsonUtil.parseSimpleJson(body);

        String symbol = json.get("symbol");
        String qtyStr = json.get("quantity");
        String orderMode = json.getOrDefault("orderMode", "MARKET");

        if (symbol == null || qtyStr == null) {
            sendError(exchange, 400, "MISSING_FIELDS", "Must provide 'symbol' and 'quantity'.");
            return;
        }

        int quantity;
        try {
            quantity = Integer.parseInt(qtyStr.trim());
            if (quantity <= 0) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            sendError(exchange, 400, "INVALID_QUANTITY", "Quantity must be a positive integer.");
            return;
        }

        Stock stock = stockDAO.getStockBySymbol(symbol);
        if (stock == null) {
            sendError(exchange, 404, "STOCK_NOT_FOUND", "Stock '" + symbol + "' not found.");
            return;
        }

        BigDecimal price = stock.getCurrentPrice();
        BigDecimal totalCost = price.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);

        User user = userDAO.findById(userId);
        if (user.getWalletBalance().compareTo(totalCost) < 0) {
            sendError(exchange, 400, "INSUFFICIENT_FUNDS",
                    "Insufficient wallet balance. Required: ?" + totalCost + ", Available: ?" + user.getWalletBalance());
            return;
        }

        // Deduct wallet
        BigDecimal newWallet = user.getWalletBalance().subtract(totalCost);
        userDAO.updateWalletBalance(userId, newWallet);

        // Update holdings
        holdingsDAO.addShares(userId, stock.getSymbol(), quantity, price);

        // Record order
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Order order = new Order(orderId, userId, stock.getSymbol(), "BUY", orderMode, quantity, price, "COMPLETED",
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        orderDAO.createOrder(order);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Successfully bought " + quantity + " shares of " + stock.getSymbol());
        resp.put("order", order);
        resp.put("remainingWallet", newWallet);
        sendJson(exchange, 201, resp);
    }

    private void handleSell(HttpExchange exchange, int userId) throws IOException, SQLException {
        String body = readBody(exchange);
        Map<String, String> json = JsonUtil.parseSimpleJson(body);

        String symbol = json.get("symbol");
        String qtyStr = json.get("quantity");
        String orderMode = json.getOrDefault("orderMode", "MARKET");

        if (symbol == null || qtyStr == null) {
            sendError(exchange, 400, "MISSING_FIELDS", "Must provide 'symbol' and 'quantity'.");
            return;
        }

        int quantity;
        try {
            quantity = Integer.parseInt(qtyStr.trim());
            if (quantity <= 0) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            sendError(exchange, 400, "INVALID_QUANTITY", "Quantity must be a positive integer.");
            return;
        }

        Holding holding = holdingsDAO.getHolding(userId, symbol);
        int owned = (holding != null) ? holding.getQuantity() : 0;
        if (holding == null || owned < quantity) {
            sendError(exchange, 400, "INSUFFICIENT_HOLDINGS",
                    "Cannot sell " + quantity + " shares. You only own " + owned + " shares of " + symbol.toUpperCase());
            return;
        }

        Stock stock = stockDAO.getStockBySymbol(symbol);
        BigDecimal price = (stock != null) ? stock.getCurrentPrice() : holding.getAvgBuyPrice();
        BigDecimal proceeds = price.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);

        // Reduce holdings
        holdingsDAO.reduceShares(userId, symbol, quantity);

        // Credit wallet
        User user = userDAO.findById(userId);
        BigDecimal newWallet = user.getWalletBalance().add(proceeds);
        userDAO.updateWalletBalance(userId, newWallet);

        // Record order
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Order order = new Order(orderId, userId, symbol.toUpperCase(), "SELL", orderMode, quantity, price, "COMPLETED",
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        orderDAO.createOrder(order);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Successfully sold " + quantity + " shares of " + symbol.toUpperCase());
        resp.put("order", order);
        resp.put("remainingWallet", newWallet);
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
