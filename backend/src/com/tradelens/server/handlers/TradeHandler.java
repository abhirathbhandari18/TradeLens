package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.TradeExecutionService;
import com.tradelens.dao.UserDAO;
import com.tradelens.engine.MarketDataStore;
import com.tradelens.engine.OrderMatcherThread;
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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Handles authenticated MARKET trades and pending LIMIT order submissions.
 */
public class TradeHandler implements HttpHandler {
    private static final int MAX_REQUEST_SIZE = 64 * 1024;
    private static final DateTimeFormatter ORDER_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Pattern JSON_NUMBER = Pattern.compile(
            "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?");

    private final MarketDataStore marketDataStore;
    private final OrderMatcherThread orderMatcher;
    private final TradeOperations tradeOperations;

    public TradeHandler(MarketDataStore marketDataStore, OrderMatcherThread orderMatcher) {
        this(marketDataStore, orderMatcher, new DatabaseTradeOperations());
    }

    TradeHandler(MarketDataStore marketDataStore, OrderMatcherThread orderMatcher,
                 TradeOperations tradeOperations) {
        if (marketDataStore == null || orderMatcher == null || tradeOperations == null) {
            throw new IllegalArgumentException("Market store, matcher, and trade operations are required.");
        }
        this.marketDataStore = marketDataStore;
        this.orderMatcher = orderMatcher;
        this.tradeOperations = tradeOperations;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendError(exchange, 405, "METHOD_NOT_ALLOWED", "Only POST is supported for trades.");
            return;
        }

        Integer userId = SessionManager.extractAuthenticatedUserId(exchange);
        if (userId == null) {
            sendError(exchange, 401, "UNAUTHORIZED", "Valid authentication token required.");
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String orderType;
        if (path.endsWith("/buy")) {
            orderType = "BUY";
        } else if (path.endsWith("/sell")) {
            orderType = "SELL";
        } else {
            sendError(exchange, 404, "NOT_FOUND", "Endpoint not found: " + path);
            return;
        }

        try {
            processTrade(exchange, userId, orderType);
        } catch (RequestException e) {
            sendError(exchange, 400, e.errorCode, e.getMessage());
        } catch (SQLException e) {
            String message = e.getMessage() == null ? "Trade could not be completed." : e.getMessage();
            if ("Insufficient wallet balance for BUY".equals(message)) {
                sendError(exchange, 400, "INSUFFICIENT_FUNDS", message);
            } else if ("Insufficient shares for SELL".equals(message)) {
                sendError(exchange, 400, "INSUFFICIENT_HOLDINGS", message);
            } else {
                System.err.println("[TradeHandler] Database error: " + message);
                sendError(exchange, 500, "DB_ERROR", "Trade could not be completed.");
            }
        }
    }

    private void processTrade(HttpExchange exchange, int userId, String orderType)
            throws IOException, SQLException, RequestException {
        Map<String, String> json = parseRequestBody(readBody(exchange));
        String symbol = normalizeSymbol(json.get("symbol"));
        String quantityValue = json.get("quantity");
        if (quantityValue == null) {
            throw new RequestException("MISSING_FIELDS", "Must provide 'symbol' and 'quantity'.");
        }

        int quantity;
        try {
            quantity = Integer.parseInt(quantityValue.trim());
        } catch (NumberFormatException e) {
            throw new RequestException("INVALID_QUANTITY", "Quantity must be a positive integer.");
        }
        if (quantity <= 0) {
            throw new RequestException("INVALID_QUANTITY", "Quantity must be a positive integer.");
        }

        String suppliedType = json.get("type");
        if (suppliedType != null && !orderType.equalsIgnoreCase(suppliedType.trim())) {
            throw new RequestException("INVALID_ORDER_TYPE", "Order type must match the requested endpoint.");
        }

        String orderMode = json.containsKey("orderMode")
                ? json.get("orderMode").trim().toUpperCase(Locale.ROOT) : "MARKET";
        if (!"MARKET".equals(orderMode) && !"LIMIT".equals(orderMode)) {
            throw new RequestException("INVALID_ORDER_MODE", "Order mode must be MARKET or LIMIT.");
        }

        if (!marketDataStore.containsStock(symbol)) {
            sendError(exchange, 404, "STOCK_NOT_FOUND", "Stock '" + symbol + "' not found.");
            return;
        }

        String orderId = "ORD-" + UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT);
        BigDecimal price;
        Order order;
        if ("MARKET".equals(orderMode)) {
            Stock stock = marketDataStore.getStock(symbol);
            price = stock.getCurrentPrice();
            if (price == null || price.signum() <= 0) {
                throw new RequestException("INVALID_MARKET_PRICE", "Current market price is unavailable.");
            }
            order = tradeOperations.executeMarket(
                    orderId, userId, symbol, orderType, quantity, price);
        } else {
            price = parseLimitPrice(json.get("price"));
            order = new Order(orderId, userId, symbol, orderType, "LIMIT", quantity, price, "PENDING",
                    LocalDateTime.now().format(ORDER_TIME_FORMAT));
            order = tradeOperations.submitPendingLimit(order);
            try {
                orderMatcher.signalNewOrders();
            } catch (RuntimeException e) {
                System.err.println("[TradeHandler] Pending order was saved but matcher notification failed: "
                        + e.getMessage());
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "LIMIT".equals(orderMode)
                ? "Successfully placed " + orderType + " LIMIT order for " + quantity + " shares of " + symbol
                : "Successfully " + ("BUY".equals(orderType) ? "bought " : "sold ")
                        + quantity + " shares of " + symbol);
        response.put("order", order);

        if ("MARKET".equals(orderMode)) {
            try {
                BigDecimal walletBalance = tradeOperations.getWalletBalance(userId);
                if (walletBalance != null) {
                    response.put("remainingWallet", walletBalance);
                }
            } catch (SQLException e) {
                System.err.println("[TradeHandler] Trade succeeded but wallet balance could not be refreshed: "
                        + e.getMessage());
            }
        }

        sendJson(exchange, "BUY".equals(orderType) ? 201 : 200, response);
    }

    private static String readBody(HttpExchange exchange) throws IOException, RequestException {
        StringBuilder body = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
            char[] buffer = new char[2048];
            int count;
            while ((count = reader.read(buffer)) != -1) {
                body.append(buffer, 0, count);
                if (body.length() > MAX_REQUEST_SIZE) {
                    throw new RequestException("BAD_REQUEST", "Request body is too large.");
                }
            }
        }
        return body.toString();
    }

    private static Map<String, String> parseRequestBody(String body) throws RequestException {
        validateJsonObject(body);
        try {
            return JsonUtil.parseSimpleJson(body);
        } catch (RuntimeException e) {
            throw new RequestException("BAD_REQUEST", "Request body must be a valid JSON object.");
        }
    }

    private static void validateJsonObject(String body) throws RequestException {
        if (body == null || body.trim().isEmpty() || body.length() > MAX_REQUEST_SIZE) {
            throw new RequestException("BAD_REQUEST", "Request body must be a valid JSON object.");
        }

        JsonCursor cursor = new JsonCursor(body);
        cursor.skipWhitespace();
        cursor.expect('{');
        cursor.skipWhitespace();
        Set<String> keys = new HashSet<>();
        if (cursor.consume('}')) {
            cursor.finish();
            return;
        }

        while (true) {
            String key = cursor.readString();
            if (!keys.add(key)) {
                throw new RequestException("BAD_REQUEST", "Duplicate JSON properties are not allowed.");
            }
            cursor.skipWhitespace();
            cursor.expect(':');
            cursor.skipWhitespace();
            cursor.readScalar();
            cursor.skipWhitespace();
            if (cursor.consume('}')) {
                cursor.finish();
                return;
            }
            cursor.expect(',');
            cursor.skipWhitespace();
        }
    }

    private static String normalizeSymbol(String symbol) throws RequestException {
        if (symbol == null || symbol.trim().isEmpty() || symbol.trim().length() > 20) {
            throw new RequestException("INVALID_SYMBOL", "A valid stock symbol is required.");
        }
        return symbol.trim().toUpperCase(Locale.ROOT);
    }

    private static BigDecimal parseLimitPrice(String value) throws RequestException {
        if (value == null || value.trim().isEmpty()) {
            throw new RequestException("MISSING_LIMIT_PRICE", "A positive 'price' is required for LIMIT orders.");
        }
        try {
            BigDecimal price = new BigDecimal(value.trim());
            if (price.signum() <= 0) {
                throw new RequestException("INVALID_PRICE", "Limit price must be positive.");
            }
            BigDecimal normalized = price.setScale(2, RoundingMode.UNNECESSARY);
            if (normalized.precision() > 12) {
                throw new RequestException("INVALID_PRICE", "Limit price exceeds the supported database range.");
            }
            return normalized;
        } catch (NumberFormatException | ArithmeticException e) {
            throw new RequestException("INVALID_PRICE", "Limit price must be a positive amount with at most 2 decimals.");
        }
    }

    private static void sendJson(HttpExchange exchange, int statusCode, Object data) throws IOException {
        byte[] bytes = JsonUtil.toJson(data).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private static void sendError(HttpExchange exchange, int statusCode,
                                  String errorCode, String message) throws IOException {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("success", false);
        error.put("errorCode", errorCode);
        error.put("error", message);
        sendJson(exchange, statusCode, error);
    }

    interface TradeOperations {
        Order executeMarket(String orderId, int userId, String symbol, String type,
                            int quantity, BigDecimal serverPrice) throws SQLException;

        Order submitPendingLimit(Order order) throws SQLException;

        BigDecimal getWalletBalance(int userId) throws SQLException;
    }

    private static final class DatabaseTradeOperations implements TradeOperations {
        private final TradeExecutionService executionService = new TradeExecutionService();
        private final UserDAO userDAO = new UserDAO();

        @Override
        public Order executeMarket(String orderId, int userId, String symbol, String type,
                                   int quantity, BigDecimal serverPrice) throws SQLException {
            return "BUY".equals(type)
                    ? executionService.executeMarketBuy(orderId, userId, symbol, quantity, serverPrice)
                    : executionService.executeMarketSell(orderId, userId, symbol, quantity, serverPrice);
        }

        @Override
        public Order submitPendingLimit(Order order) throws SQLException {
            return executionService.submitPendingLimitOrder(order);
        }

        @Override
        public BigDecimal getWalletBalance(int userId) throws SQLException {
            User user = userDAO.findById(userId);
            if (user == null) {
                throw new SQLException("User not found after trade execution: " + userId);
            }
            return user.getWalletBalance();
        }
    }

    private static final class RequestException extends Exception {
        private final String errorCode;

        private RequestException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }
    }

    private static final class JsonCursor {
        private final String text;
        private int index;

        private JsonCursor(String text) {
            this.text = text;
        }

        private String readString() throws RequestException {
            expect('"');
            StringBuilder value = new StringBuilder();
            while (index < text.length()) {
                char character = text.charAt(index++);
                if (character == '"') {
                    return value.toString();
                }
                if (character == '\\' || character < 0x20) {
                    throw malformedJson();
                }
                value.append(character);
            }
            throw malformedJson();
        }

        private void readScalar() throws RequestException {
            if (index >= text.length()) {
                throw malformedJson();
            }
            if (text.charAt(index) == '"') {
                readString();
                return;
            }

            int start = index;
            while (index < text.length()) {
                char character = text.charAt(index);
                if (character == ',' || character == '}' || isWhitespace(character)) {
                    break;
                }
                if (character == '{' || character == '[' || character == ']' || character == '"') {
                    throw malformedJson();
                }
                index++;
            }
            String token = text.substring(start, index);
            if (!JSON_NUMBER.matcher(token).matches()
                    && !"true".equals(token) && !"false".equals(token) && !"null".equals(token)) {
                throw malformedJson();
            }
        }

        private void expect(char expected) throws RequestException {
            if (index >= text.length() || text.charAt(index) != expected) {
                throw malformedJson();
            }
            index++;
        }

        private boolean consume(char expected) {
            if (index < text.length() && text.charAt(index) == expected) {
                index++;
                return true;
            }
            return false;
        }

        private void skipWhitespace() {
            while (index < text.length() && isWhitespace(text.charAt(index))) {
                index++;
            }
        }

        private void finish() throws RequestException {
            skipWhitespace();
            if (index != text.length()) {
                throw malformedJson();
            }
        }

        private static boolean isWhitespace(char character) {
            return character == ' ' || character == '\t' || character == '\r' || character == '\n';
        }

        private static RequestException malformedJson() {
            return new RequestException("BAD_REQUEST", "Request body must be a valid JSON object.");
        }
    }
}
