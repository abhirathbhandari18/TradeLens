package com.tradelens.engine;

import com.tradelens.dao.DBConnectionManager;
import com.tradelens.dao.TradeExecutionService;
import com.tradelens.dao.TransactionalOrderDAO;
import com.tradelens.model.Order;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Matches pending LIMIT orders against the latest in-memory market prices.
 */
public class OrderMatcherThread extends Thread {
    private static final AtomicBoolean MATCHER_ACTIVE = new AtomicBoolean();
    private static final DateTimeFormatter ORDER_TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    static final Comparator<Order> BUY_ORDER_PRIORITY =
            Comparator.comparing(Order::getPrice)
                    .thenComparing(Order::getTimestamp)
                    .thenComparing(Order::getOrderId);

    static final Comparator<Order> SELL_ORDER_PRIORITY = (left, right) -> {
        int pricePriority = right.getPrice().compareTo(left.getPrice());
        if (pricePriority != 0) {
            return pricePriority;
        }
        int timePriority = left.getTimestamp().compareTo(right.getTimestamp());
        return timePriority != 0
                ? timePriority
                : left.getOrderId().compareTo(right.getOrderId());
    };

    private final MarketDataStore marketDataStore;
    private final PendingOrderLoader pendingOrderLoader;
    private final PendingOrderExecutor pendingOrderExecutor;
    private final AtomicLong newOrderSignalVersion = new AtomicLong();
    private final Set<String> invalidOrdersReported = ConcurrentHashMap.newKeySet();
    private volatile boolean running = true;

    public OrderMatcherThread(MarketDataStore marketDataStore) {
        this(
                marketDataStore,
                new DatabasePendingOrderLoader(marketDataStore, new TransactionalOrderDAO()),
                new TradeExecutionService()
        );
    }

    private OrderMatcherThread(MarketDataStore marketDataStore,
                               PendingOrderLoader pendingOrderLoader,
                               TradeExecutionService tradeExecutionService) {
        this(marketDataStore, pendingOrderLoader, tradeExecutionService::executePendingLimitOrder);
    }

    OrderMatcherThread(MarketDataStore marketDataStore,
                       PendingOrderLoader pendingOrderLoader,
                       PendingOrderExecutor pendingOrderExecutor) {
        super("TradeLens-OrderMatcher");
        if (marketDataStore == null) {
            throw new IllegalArgumentException("MarketDataStore cannot be null.");
        }
        if (pendingOrderLoader == null || pendingOrderExecutor == null) {
            throw new IllegalArgumentException("Order loader and executor cannot be null.");
        }
        this.marketDataStore = marketDataStore;
        this.pendingOrderLoader = pendingOrderLoader;
        this.pendingOrderExecutor = pendingOrderExecutor;
        setDaemon(true);
    }

    /**
     * Signals that new pending orders may be available. Producers should call
     * this after persisting an order; market price changes also trigger scans.
     */
    public void signalNewOrders() {
        newOrderSignalVersion.incrementAndGet();
        if (isAlive()) {
            interrupt();
        }
    }

    public void stopMatcher() {
        running = false;
        interrupt();
    }

    @Override
    public void run() {
        if (!MATCHER_ACTIVE.compareAndSet(false, true)) {
            System.err.println("[OrderMatcherThread] Another matcher is already running.");
            return;
        }

        try {
            while (running) {
                long observedPriceVersion = marketDataStore.getPriceVersion();
                long observedOrderSignal = newOrderSignalVersion.get();
                try {
                    processPendingOrders(pendingOrderLoader.loadPendingOrders());
                } catch (SQLException | RuntimeException e) {
                    System.err.println("[OrderMatcherThread] Pending-order scan failed: " + e.getMessage());
                }

                if (!running) {
                    break;
                }
                Thread.interrupted();
                if (!running) {
                    break;
                }
                if (newOrderSignalVersion.get() != observedOrderSignal
                        || marketDataStore.getPriceVersion() != observedPriceVersion) {
                    continue;
                }

                try {
                    marketDataStore.awaitPriceChange(observedPriceVersion);
                } catch (InterruptedException e) {
                    if (!running) {
                        break;
                    }
                }
            }
        } finally {
            MATCHER_ACTIVE.set(false);
        }
    }

    private void processPendingOrders(List<Order> pendingOrders) {
        if (pendingOrders == null) {
            throw new IllegalStateException("Pending-order loader returned null.");
        }

        Map<String, OrderQueues> queuesBySymbol = new TreeMap<>();
        Set<String> seenOrderIds = new HashSet<>();
        for (Order order : pendingOrders) {
            if (order == null) {
                reportInvalidOrder(null, "record is null");
                continue;
            }

            String status = normalize(order.getStatus());
            if (!"PENDING".equals(status)) {
                continue;
            }
            if (!isValidPendingLimitOrder(order)) {
                reportInvalidOrder(order, "record has invalid LIMIT order fields");
                continue;
            }

            String symbol = normalizeSymbol(order.getSymbol());
            if (!marketDataStore.containsStock(symbol)) {
                reportInvalidOrder(order, "symbol is not in the market store");
                continue;
            }
            if (!seenOrderIds.add(order.getOrderId())) {
                reportInvalidOrder(order, "duplicate order ID in scan");
                continue;
            }

            OrderQueues queues = queuesBySymbol.computeIfAbsent(symbol, ignored -> new OrderQueues());
            if ("BUY".equals(normalize(order.getType()))) {
                queues.buyOrders.add(order);
            } else {
                queues.sellOrders.add(order);
            }
        }

        for (OrderQueues queues : queuesBySymbol.values()) {
            if (!running) {
                return;
            }
            processQueue(queues.buyOrders);
            processQueue(queues.sellOrders);
        }
    }

    private void processQueue(PriorityQueue<Order> orders) {
        while (running && !orders.isEmpty()) {
            Order order = orders.poll();
            try {
                BigDecimal currentPrice = marketDataStore.getStock(order.getSymbol()).getCurrentPrice();
                if (!isPriceEligible(order, currentPrice)) {
                    continue;
                }

                BigDecimal latestPrice = marketDataStore.getStock(order.getSymbol()).getCurrentPrice();
                if (!isPriceEligible(order, latestPrice)) {
                    continue;
                }

                pendingOrderExecutor.execute(order, latestPrice);
            } catch (SQLException | RuntimeException e) {
                System.err.println("[OrderMatcherThread] Could not execute order "
                        + order.getOrderId() + ": " + e.getMessage());
            }
        }
    }

    static boolean isPriceEligible(Order order, BigDecimal currentPrice) {
        if (order == null || currentPrice == null || currentPrice.signum() <= 0
                || order.getPrice() == null || order.getPrice().signum() <= 0) {
            return false;
        }
        String type = normalize(order.getType());
        if ("BUY".equals(type)) {
            return currentPrice.compareTo(order.getPrice()) <= 0;
        }
        if ("SELL".equals(type)) {
            return currentPrice.compareTo(order.getPrice()) >= 0;
        }
        return false;
    }

    private static boolean isValidPendingLimitOrder(Order order) {
        if (order.getOrderId() == null || order.getOrderId().trim().isEmpty()
                || order.getOrderId().trim().length() > 36
                || order.getUserId() <= 0
                || order.getSymbol() == null || order.getSymbol().trim().isEmpty()
                || order.getSymbol().trim().length() > 20
                || order.getQuantity() <= 0
                || order.getPrice() == null || order.getPrice().signum() <= 0
                || !"LIMIT".equals(normalize(order.getOrderMode()))) {
            return false;
        }

        String type = normalize(order.getType());
        if (!"BUY".equals(type) && !"SELL".equals(type)) {
            return false;
        }
        try {
            LocalDateTime.parse(order.getTimestamp(), ORDER_TIMESTAMP_FORMAT);
            return true;
        } catch (DateTimeParseException | NullPointerException e) {
            return false;
        }
    }

    private void reportInvalidOrder(Order order, String reason) {
        String orderId = order == null || order.getOrderId() == null
                ? "<unknown>" : order.getOrderId();
        if (invalidOrdersReported.add(orderId)) {
            System.err.println("[OrderMatcherThread] Skipping invalid order "
                    + orderId + ": " + reason);
        }
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private static String normalizeSymbol(String symbol) {
        return symbol.trim().toUpperCase(Locale.ROOT);
    }

    private static void rollback(Connection connection, Throwable failure) {
        try {
            connection.rollback();
        } catch (SQLException | RuntimeException rollbackFailure) {
            failure.addSuppressed(rollbackFailure);
        }
    }

    @FunctionalInterface
    interface PendingOrderLoader {
        List<Order> loadPendingOrders() throws SQLException;
    }

    @FunctionalInterface
    interface PendingOrderExecutor {
        void execute(Order order, BigDecimal currentPrice) throws SQLException;
    }

    private static final class OrderQueues {
        private final PriorityQueue<Order> buyOrders = new PriorityQueue<>(BUY_ORDER_PRIORITY);
        private final PriorityQueue<Order> sellOrders = new PriorityQueue<>(SELL_ORDER_PRIORITY);
    }

    private static final class DatabasePendingOrderLoader implements PendingOrderLoader {
        private final MarketDataStore marketDataStore;
        private final TransactionalOrderDAO orderDAO;

        private DatabasePendingOrderLoader(MarketDataStore marketDataStore,
                                           TransactionalOrderDAO orderDAO) {
            if (marketDataStore == null || orderDAO == null) {
                throw new IllegalArgumentException("MarketDataStore and TransactionalOrderDAO are required.");
            }
            this.marketDataStore = marketDataStore;
            this.orderDAO = orderDAO;
        }

        @Override
        public List<Order> loadPendingOrders() throws SQLException {
            List<String> symbols = new ArrayList<>(marketDataStore.getAllStocks().keySet());
            Collections.sort(symbols);
            List<Order> orders = new ArrayList<>();

            try (Connection connection = DBConnectionManager.getConnection()) {
                connection.setAutoCommit(false);
                try {
                    for (String symbol : symbols) {
                        orders.addAll(orderDAO.getPendingLimitOrders(connection, symbol));
                    }
                    connection.commit();
                    return orders;
                } catch (SQLException | RuntimeException | Error failure) {
                    rollback(connection, failure);
                    throw failure;
                }
            }
        }
    }
}
