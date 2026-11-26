package server.handlers;

import com.sun.net.httpserver.HttpExchange;
import exceptions.TradingExceptions.InsufficientFundsException;
import exceptions.TradingExceptions.InsufficientHoldingsException;
import server.TradeLensServer;
import server.handlers.AuthHandler.UserSession;
import util.JsonUtil;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

/**
 * Handles:
 * - POST /api/buy
 * - POST /api/sell
 * - POST /api/portfolio/deposit
 * - GET  /api/portfolio
 *
 * Integration Note:
 * Wire Person 2's HoldingsDAO, OrderDAO, and OrderMatcherThread where marked TODO.
 */
public class TradeHandler extends BaseHandler {

    private static final double DEFAULT_CASH = 145000.0;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("hh:mm a");

    /** In-memory stores per userId (backed by MySQL DAOs once Person 2 merges). */
    private static final Map<String, Double> CASH_BY_USER = new HashMap<>();
    private static final Map<String, List<Map<String, Object>>> HOLDINGS_BY_USER = new HashMap<>();
    private static final Map<String, List<Map<String, Object>>> ORDERS_BY_USER = new HashMap<>();

    /** Pending LIMIT orders waiting to match when market price hits target. */
    public static final PriorityQueue<Map<String, Object>> LIMIT_ORDER_QUEUE =
            new PriorityQueue<>(Comparator.comparingDouble(o -> ((Number) o.get("price")).doubleValue()));

    static {
        initUserWallet("USR-100001");
    }

    public static void initUserWallet(String userId) {
        synchronized (CASH_BY_USER) {
            if (!CASH_BY_USER.containsKey(userId)) {
                CASH_BY_USER.put(userId, DEFAULT_CASH);

                List<Map<String, Object>> initialHoldings = new ArrayList<>();
                initialHoldings.add(holdingRow("RELIANCE", 15, 1210.00));
                initialHoldings.add(holdingRow("TCS", 5, 3980.00));
                initialHoldings.add(holdingRow("HDFCBANK", 12, 1690.00));
                initialHoldings.add(holdingRow("ITC", 40, 452.50));
                HOLDINGS_BY_USER.put(userId, initialHoldings);

                List<Map<String, Object>> initialOrders = new ArrayList<>();
                initialOrders.add(orderRow("ORD-90412", "Today, 10:14 AM", "RELIANCE", "BUY", "MARKET", 5, 1280.40, "EXECUTED"));
                initialOrders.add(orderRow("ORD-90388", "Yesterday, 02:45 PM", "ITC", "BUY", "LIMIT", 20, 472.00, "EXECUTED"));
                initialOrders.add(orderRow("ORD-90311", "17 Nov, 11:20 AM", "TATAMOTORS", "SELL", "MARKET", 10, 802.50, "EXECUTED"));
                ORDERS_BY_USER.put(userId, initialOrders);
            }
        }
    }

    @Override
    protected void handleRequest(HttpExchange exchange) throws Exception {
        UserSession session = AuthHandler.requireSession(getAuthToken(exchange));
        initUserWallet(session.userId);

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if (path.endsWith("/buy") && "POST".equalsIgnoreCase(method)) {
            handleBuy(exchange, session.userId);
        } else if (path.endsWith("/sell") && "POST".equalsIgnoreCase(method)) {
            handleSell(exchange, session.userId);
        } else if (path.endsWith("/deposit") && "POST".equalsIgnoreCase(method)) {
            handleDeposit(exchange, session.userId);
        } else if (path.endsWith("/portfolio") && "GET".equalsIgnoreCase(method)) {
            handleGetPortfolio(exchange, session.userId);
        } else {
            sendJson(exchange, 404, JsonUtil.error("Unknown trade endpoint: " + path));
        }
    }

    private void handleBuy(HttpExchange exchange, String userId) throws Exception {
        Map<String, String> body = JsonUtil.parseObject(readBody(exchange));
        String symbol = body.getOrDefault("symbol", "").trim().toUpperCase();
        String orderType = body.getOrDefault("orderType", "MARKET").trim().toUpperCase();
        int qty = parsePositiveInt(body.get("qty"), "Invalid order quantity.");
        double price = parsePositiveDouble(body.get("price"), TradeLensServer.getStockPrice(symbol));

        if (symbol.isEmpty()) {
            throw new IllegalArgumentException("Stock symbol is required.");
        }

        double totalCost = qty * price;
        Map<String, Object> order;

        synchronized (CASH_BY_USER) {
            double cash = CASH_BY_USER.getOrDefault(userId, DEFAULT_CASH);
            if (cash < totalCost) {
                throw new InsufficientFundsException(
                        String.format("Insufficient funds. Need ₹%.2f, available ₹%.2f.", totalCost, cash)
                );
            }

            String orderId = "ORD-" + (10000 + (int) (Math.random() * 89999));
            String nowTime = LocalTime.now().format(TIME_FMT);

            if ("LIMIT".equals(orderType)) {
                // Queue LIMIT order for Person 2's OrderMatcherThread
                order = orderRow(orderId, nowTime, symbol, "BUY", "LIMIT", qty, price, "PENDING");
                synchronized (LIMIT_ORDER_QUEUE) {
                    order.put("userId", userId);
                    LIMIT_ORDER_QUEUE.add(order);
                    LIMIT_ORDER_QUEUE.notifyAll();
                }
                ORDERS_BY_USER.get(userId).add(0, order);
            } else {
                // MARKET order: execute immediately
                // TODO (Person 2 - HoldingsDAO / OrderDAO): Run atomic JDBC transaction
                CASH_BY_USER.put(userId, round2(cash - totalCost));
                List<Map<String, Object>> holdings = HOLDINGS_BY_USER.get(userId);
                upsertHoldingBuy(holdings, symbol, qty, price);

                order = orderRow(orderId, nowTime, symbol, "BUY", "MARKET", qty, price, "EXECUTED");
                ORDERS_BY_USER.get(userId).add(0, order);
            }
        }

        sendPortfolioResponse(exchange, userId, order);
    }

    private void handleSell(HttpExchange exchange, String userId) throws Exception {
        Map<String, String> body = JsonUtil.parseObject(readBody(exchange));
        String symbol = body.getOrDefault("symbol", "").trim().toUpperCase();
        String orderType = body.getOrDefault("orderType", "MARKET").trim().toUpperCase();
        int qty = parsePositiveInt(body.get("qty"), "Invalid order quantity.");
        double price = parsePositiveDouble(body.get("price"), TradeLensServer.getStockPrice(symbol));

        if (symbol.isEmpty()) {
            throw new IllegalArgumentException("Stock symbol is required.");
        }

        double proceeds = qty * price;
        Map<String, Object> order;

        synchronized (CASH_BY_USER) {
            List<Map<String, Object>> holdings = HOLDINGS_BY_USER.get(userId);
            Map<String, Object> existing = findHolding(holdings, symbol);
            int ownedQty = existing != null ? ((Number) existing.get("qty")).intValue() : 0;

            if (ownedQty < qty) {
                throw new InsufficientHoldingsException(
                        "You only own " + ownedQty + " shares of " + symbol + "."
                );
            }

            String orderId = "ORD-" + (10000 + (int) (Math.random() * 89999));
            String nowTime = LocalTime.now().format(TIME_FMT);

            if ("LIMIT".equals(orderType)) {
                order = orderRow(orderId, nowTime, symbol, "SELL", "LIMIT", qty, price, "PENDING");
                synchronized (LIMIT_ORDER_QUEUE) {
                    order.put("userId", userId);
                    LIMIT_ORDER_QUEUE.add(order);
                    LIMIT_ORDER_QUEUE.notifyAll();
                }
                ORDERS_BY_USER.get(userId).add(0, order);
            } else {
                // TODO (Person 2 - HoldingsDAO / OrderDAO): Run atomic JDBC transaction
                int remaining = ownedQty - qty;
                if (remaining == 0) {
                    holdings.remove(existing);
                } else {
                    existing.put("qty", remaining);
                }
                double cash = CASH_BY_USER.getOrDefault(userId, DEFAULT_CASH);
                CASH_BY_USER.put(userId, round2(cash + proceeds));

                order = orderRow(orderId, nowTime, symbol, "SELL", "MARKET", qty, price, "EXECUTED");
                ORDERS_BY_USER.get(userId).add(0, order);
            }
        }

        sendPortfolioResponse(exchange, userId, order);
    }

    private void handleDeposit(HttpExchange exchange, String userId) throws Exception {
        Map<String, String> body = JsonUtil.parseObject(readBody(exchange));
        double amount = parsePositiveDouble(body.get("amount"), -1);
        if (amount <= 0) {
            throw new IllegalArgumentException("Enter a valid deposit amount.");
        }

        double nextCash;
        synchronized (CASH_BY_USER) {
            nextCash = round2(CASH_BY_USER.getOrDefault(userId, DEFAULT_CASH) + amount);
            CASH_BY_USER.put(userId, nextCash);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("cash", nextCash);
        sendJson(exchange, 200, JsonUtil.toJson(response));
    }

    private void handleGetPortfolio(HttpExchange exchange, String userId) throws Exception {
        sendPortfolioResponse(exchange, userId, null);
    }

    private void sendPortfolioResponse(HttpExchange exchange, String userId, Map<String, Object> order) throws Exception {
        Map<String, Object> response = new LinkedHashMap<>();
        synchronized (CASH_BY_USER) {
            response.put("cash", CASH_BY_USER.getOrDefault(userId, DEFAULT_CASH));
            response.put("holdings", HOLDINGS_BY_USER.getOrDefault(userId, new ArrayList<>()));
            response.put("orders", ORDERS_BY_USER.getOrDefault(userId, new ArrayList<>()));
        }
        if (order != null) {
            response.put("order", order);
        }
        sendJson(exchange, 200, JsonUtil.toJson(response));
    }

    private static Map<String, Object> findHolding(List<Map<String, Object>> holdings, String symbol) {
        for (Map<String, Object> h : holdings) {
            if (symbol.equals(h.get("symbol"))) {
                return h;
            }
        }
        return null;
    }

    private static void upsertHoldingBuy(List<Map<String, Object>> holdings, String symbol, int qty, double price) {
        Map<String, Object> existing = findHolding(holdings, symbol);
        if (existing == null) {
            holdings.add(holdingRow(symbol, qty, round2(price)));
        } else {
            int prevQty = ((Number) existing.get("qty")).intValue();
            double prevAvg = ((Number) existing.get("avgPrice")).doubleValue();
            int newQty = prevQty + qty;
            double newAvg = ((prevQty * prevAvg) + (qty * price)) / newQty;
            existing.put("qty", newQty);
            existing.put("avgPrice", round2(newAvg));
        }
    }

    private static Map<String, Object> holdingRow(String symbol, int qty, double avgPrice) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("symbol", symbol);
        m.put("qty", qty);
        m.put("avgPrice", avgPrice);
        return m;
    }

    private static Map<String, Object> orderRow(
            String orderId, String time, String symbol, String side, String orderType, int qty, double price, String status
    ) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("orderId", orderId);
        m.put("time", time);
        m.put("symbol", symbol);
        m.put("side", side);
        m.put("orderType", orderType);
        m.put("qty", qty);
        m.put("price", round2(price));
        m.put("status", status);
        return m;
    }

    private static int parsePositiveInt(String val, String errMsg) {
        try {
            int parsed = Integer.parseInt(val != null ? val.trim() : "");
            if (parsed <= 0) throw new IllegalArgumentException(errMsg);
            return parsed;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(errMsg);
        }
    }

    private static double parsePositiveDouble(String val, double fallback) {
        if (val == null || val.trim().isEmpty()) {
            if (fallback > 0) return fallback;
            throw new IllegalArgumentException("Invalid price or amount.");
        }
        try {
            double parsed = Double.parseDouble(val.trim());
            if (parsed <= 0) throw new IllegalArgumentException("Value must be positive.");
            return parsed;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid numeric value: " + val);
        }
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
