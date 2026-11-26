package com.tradelens.dao;

import com.tradelens.model.Order;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Objects;

/**
 * Executes market BUY and SELL trades atomically against the Arnav schema.
 * The supplied execution price must come from trusted server-side market data.
 */
public final class TradeExecutionService {
    private static final DateTimeFormatter ORDER_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final TransactionalHoldingsDAO holdingsDAO;
    private final TransactionalOrderDAO orderDAO;

    public TradeExecutionService() {
        this(new TransactionalHoldingsDAO(), new TransactionalOrderDAO());
    }

    public TradeExecutionService(TransactionalHoldingsDAO holdingsDAO,
                                 TransactionalOrderDAO orderDAO) {
        this.holdingsDAO = Objects.requireNonNull(holdingsDAO, "holdingsDAO");
        this.orderDAO = Objects.requireNonNull(orderDAO, "orderDAO");
    }

    /**
     * Persists a new pending LIMIT order without executing or reserving funds.
     */
    public Order submitPendingLimitOrder(Order order) throws SQLException {
        if (order == null
                || !"LIMIT".equalsIgnoreCase(order.getOrderMode())
                || !"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException("Only a pending LIMIT order can be submitted");
        }

        try (Connection connection = DBConnectionManager.getConnection()) {
            connection.setAutoCommit(false);
            try {
                orderDAO.insertOrder(connection, order);
                connection.commit();
                return order;
            } catch (SQLException | RuntimeException | Error failure) {
                rollback(connection, failure);
                throw failure;
            }
        }
    }

    /**
     * Fills an existing pending LIMIT order and records its actual execution
     * price. Wallet, holdings, and order completion share one transaction.
     */
    public Order executePendingLimitOrder(Order pendingOrder,
                                          BigDecimal serverExecutionPrice) throws SQLException {
        if (pendingOrder == null) {
            throw new IllegalArgumentException("pendingOrder must not be null");
        }

        String orderId = validateOrderId(pendingOrder.getOrderId());
        int userId = pendingOrder.getUserId();
        if (userId <= 0) {
            throw new IllegalArgumentException("order userId must be positive");
        }
        String symbol = normalizeSymbol(pendingOrder.getSymbol());
        int quantity = pendingOrder.getQuantity();
        if (quantity <= 0) {
            throw new IllegalArgumentException("order quantity must be positive");
        }

        String type = pendingOrder.getType() == null
                ? "" : pendingOrder.getType().trim().toUpperCase(Locale.ROOT);
        String mode = pendingOrder.getOrderMode() == null
                ? "" : pendingOrder.getOrderMode().trim().toUpperCase(Locale.ROOT);
        String status = pendingOrder.getStatus() == null
                ? "" : pendingOrder.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!"BUY".equals(type) && !"SELL".equals(type)) {
            throw new IllegalArgumentException("Pending order type must be BUY or SELL");
        }
        if (!"LIMIT".equals(mode) || !"PENDING".equals(status)) {
            throw new IllegalArgumentException("Order must be a pending LIMIT order");
        }

        BigDecimal limitPrice = normalizePrice(pendingOrder.getPrice());
        BigDecimal executionPrice = normalizePrice(serverExecutionPrice);
        boolean limitSatisfied = "BUY".equals(type)
                ? executionPrice.compareTo(limitPrice) <= 0
                : executionPrice.compareTo(limitPrice) >= 0;
        if (!limitSatisfied) {
            throw new IllegalArgumentException("Current market price does not satisfy the order limit");
        }

        Order order = new Order(
                orderId,
                userId,
                symbol,
                type,
                mode,
                quantity,
                limitPrice,
                status,
                pendingOrder.getTimestamp()
        );
        return executeOrder(order, executionPrice, true);
    }

    /**
     * Executes a market BUY. Reuse the same server-generated orderId on a
     * retry; the orders primary key makes an already-executed request fail
     * and roll back rather than applying the trade a second time.
     */
    public Order executeMarketBuy(String orderId, int userId, String symbol, int quantity,
                                  BigDecimal serverExecutionPrice) throws SQLException {
        return executeMarketTrade(orderId, userId, symbol, quantity, serverExecutionPrice, true);
    }

    /**
     * Executes a market SELL. Reuse the same server-generated orderId on a
     * retry; the orders primary key makes an already-executed request fail
     * and roll back rather than applying the trade a second time.
     */
    public Order executeMarketSell(String orderId, int userId, String symbol, int quantity,
                                   BigDecimal serverExecutionPrice) throws SQLException {
        return executeMarketTrade(orderId, userId, symbol, quantity, serverExecutionPrice, false);
    }

    private Order executeMarketTrade(String orderId, int userId, String symbol, int quantity,
                                     BigDecimal serverExecutionPrice, boolean buy) throws SQLException {
        String normalizedOrderId = validateOrderId(orderId);
        String normalizedSymbol = normalizeSymbol(symbol);
        if (userId <= 0) {
            throw new IllegalArgumentException("userId must be positive");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        BigDecimal executionPrice = normalizePrice(serverExecutionPrice);
        String type = buy ? "BUY" : "SELL";
        Order order = new Order(
                normalizedOrderId,
                userId,
                normalizedSymbol,
                type,
                "MARKET",
                quantity,
                executionPrice,
                "COMPLETED",
                LocalDateTime.now().format(ORDER_TIME_FORMAT)
        );

        return executeOrder(order, executionPrice, false);
    }

    private Order executeOrder(Order order, BigDecimal executionPrice,
                               boolean pendingLimitOrder) throws SQLException {
        int userId = order.getUserId();
        String symbol = normalizeSymbol(order.getSymbol());
        int quantity = order.getQuantity();
        BigDecimal totalValue = executionPrice.multiply(BigDecimal.valueOf(quantity))
                .setScale(2, RoundingMode.HALF_UP);
        boolean buy = "BUY".equalsIgnoreCase(order.getType());

        try (Connection connection = DBConnectionManager.getConnection()) {
            connection.setAutoCommit(false);
            try {
                requireStockExists(connection, symbol);
                BigDecimal balance = lockWalletBalance(connection, userId);
                if (buy) {
                    executeBuy(connection, userId, symbol, quantity, executionPrice,
                            totalValue, balance);
                } else {
                    executeSell(connection, userId, symbol, quantity, totalValue, balance);
                }
                if (pendingLimitOrder) {
                    orderDAO.completePendingLimitOrder(connection, order.getOrderId(), executionPrice);
                } else {
                    orderDAO.insertOrder(connection, order);
                }
                connection.commit();
                if (pendingLimitOrder) {
                    order.setPrice(executionPrice);
                    order.setStatus("COMPLETED");
                }
                return order;
            } catch (SQLException | RuntimeException | Error failure) {
                rollback(connection, failure);
                throw failure;
            }
        }
    }

    private void executeBuy(Connection connection, int userId, String symbol, int quantity,
                            BigDecimal executionPrice, BigDecimal totalValue,
                            BigDecimal balance) throws SQLException {
        if (balance.compareTo(totalValue) < 0) {
            throw new SQLException("Insufficient wallet balance for BUY");
        }
        BigDecimal newBalance = balance.subtract(totalValue).setScale(2, RoundingMode.HALF_UP);
        updateWalletBalance(connection, userId, totalValue, newBalance, true);
        holdingsDAO.addShares(connection, userId, symbol, quantity, executionPrice);
    }

    private void executeSell(Connection connection, int userId, String symbol, int quantity,
                             BigDecimal totalValue, BigDecimal balance) throws SQLException {
        if (!holdingsDAO.reduceShares(connection, userId, symbol, quantity)) {
            throw new SQLException("Insufficient shares for SELL");
        }
        BigDecimal newBalance = balance.add(totalValue).setScale(2, RoundingMode.HALF_UP);
        updateWalletBalance(connection, userId, totalValue, newBalance, false);
    }

    private static BigDecimal lockWalletBalance(Connection connection, int userId) throws SQLException {
        String sql = "SELECT wallet_balance FROM users WHERE id = ? FOR UPDATE";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, userId);
            try (ResultSet results = statement.executeQuery()) {
                if (!results.next()) {
                    throw new SQLException("User not found: " + userId);
                }
                BigDecimal balance = results.getBigDecimal("wallet_balance");
                if (balance == null || balance.signum() < 0) {
                    throw new SQLException("User wallet balance is invalid");
                }
                return balance.setScale(2, RoundingMode.HALF_UP);
            }
        }
    }

    private static void requireStockExists(Connection connection, String symbol) throws SQLException {
        String sql = "SELECT 1 FROM stocks WHERE symbol = ? FOR SHARE";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, symbol);
            try (ResultSet results = statement.executeQuery()) {
                if (!results.next()) {
                    throw new SQLException("Stock not found: " + symbol);
                }
            }
        }
    }

    private static void updateWalletBalance(Connection connection, int userId, BigDecimal amount,
                                            BigDecimal newBalance, boolean debit) throws SQLException {
        String sql = debit
                ? "UPDATE users SET wallet_balance = ? WHERE id = ? AND wallet_balance >= ?"
                : "UPDATE users SET wallet_balance = ? WHERE id = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setBigDecimal(1, newBalance);
            statement.setInt(2, userId);
            if (debit) {
                statement.setBigDecimal(3, amount);
            }
            if (statement.executeUpdate() != 1) {
                throw new SQLException(debit
                        ? "Wallet balance changed or is insufficient"
                        : "Could not credit wallet balance");
            }
        }
    }

    private static void rollback(Connection connection, Throwable failure) {
        try {
            connection.rollback();
        } catch (SQLException | RuntimeException rollbackFailure) {
            failure.addSuppressed(rollbackFailure);
            try {
                connection.abort(Runnable::run);
            } catch (SQLException | RuntimeException abortFailure) {
                failure.addSuppressed(abortFailure);
            }
        }
    }

    private static String validateOrderId(String orderId) {
        if (orderId == null || orderId.trim().isEmpty() || orderId.trim().length() > 36) {
            throw new IllegalArgumentException("orderId must contain 1 to 36 characters");
        }
        return orderId.trim();
    }

    private static String normalizeSymbol(String symbol) {
        if (symbol == null || symbol.trim().isEmpty()) {
            throw new IllegalArgumentException("symbol must not be blank");
        }
        String normalized = symbol.trim().toUpperCase(Locale.ROOT);
        if (normalized.length() > 20) {
            throw new IllegalArgumentException("symbol exceeds the schema limit of 20 characters");
        }
        return normalized;
    }

    private static BigDecimal normalizePrice(BigDecimal price) {
        if (price == null || price.signum() <= 0) {
            throw new IllegalArgumentException("serverExecutionPrice must be positive");
        }
        BigDecimal normalized = price.setScale(2, RoundingMode.HALF_UP);
        if (normalized.signum() <= 0) {
            throw new IllegalArgumentException("serverExecutionPrice must remain positive after rounding");
        }
        return normalized;
    }
}
