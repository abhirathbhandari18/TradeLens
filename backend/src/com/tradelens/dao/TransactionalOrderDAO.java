package com.tradelens.dao;

import com.tradelens.model.Order;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Connection-scoped order operations for caller-managed transactions.
 */
public final class TransactionalOrderDAO {

    public void insertOrder(Connection connection, Order order) throws SQLException {
        requireTransaction(connection);
        validateOrder(order);

        String sql = "INSERT INTO orders " +
                "(order_id, user_id, symbol, type, order_mode, quantity, price, status, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, order.getOrderId().trim());
            statement.setInt(2, order.getUserId());
            statement.setString(3, normalizeSymbol(order.getSymbol()));
            statement.setString(4, order.getType().trim().toUpperCase(Locale.ROOT));
            statement.setString(5, order.getOrderMode().trim().toUpperCase(Locale.ROOT));
            statement.setInt(6, order.getQuantity());
            statement.setBigDecimal(7, normalizePrice(order.getPrice()));
            statement.setString(8, order.getStatus().trim().toUpperCase(Locale.ROOT));
            if (statement.executeUpdate() != 1) {
                throw new SQLException("Could not insert order");
            }
        }
    }

    /**
     * Fetches one symbol's pending LIMIT orders in creation order and locks
     * them until the caller completes its transaction.
     */
    public List<Order> getPendingLimitOrders(Connection connection, String symbol) throws SQLException {
        requireTransaction(connection);
        String normalizedSymbol = normalizeSymbol(symbol);
        List<Order> orders = new ArrayList<>();
        String sql = "SELECT order_id, user_id, symbol, type, order_mode, quantity, price, status, created_at " +
                "FROM orders WHERE symbol = ? AND order_mode = 'LIMIT' AND status = 'PENDING' " +
                "ORDER BY created_at ASC, order_id ASC FOR UPDATE";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, normalizedSymbol);
            try (ResultSet results = statement.executeQuery()) {
                while (results.next()) {
                    orders.add(new Order(
                            results.getString("order_id"),
                            results.getInt("user_id"),
                            results.getString("symbol"),
                            results.getString("type"),
                            results.getString("order_mode"),
                            results.getInt("quantity"),
                            results.getBigDecimal("price"),
                            results.getString("status"),
                            results.getString("created_at")
                    ));
                }
            }
        }
        return orders;
    }

    /**
     * Transitions a pending order to a terminal status. The conditional update
     * prevents a matcher from completing or cancelling an order twice.
     */
    public void updateOrderStatus(Connection connection, String orderId, String status) throws SQLException {
        requireTransaction(connection);
        if (orderId == null || orderId.trim().isEmpty() || orderId.trim().length() > 36) {
            throw new IllegalArgumentException("orderId must contain 1 to 36 characters");
        }
        if (status == null) {
            throw new IllegalArgumentException("status must not be null");
        }
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!"COMPLETED".equals(normalizedStatus) && !"CANCELLED".equals(normalizedStatus)) {
            throw new IllegalArgumentException("status must be COMPLETED or CANCELLED");
        }

        String sql = "UPDATE orders SET status = ? WHERE order_id = ? AND status = 'PENDING'";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, normalizedStatus);
            statement.setString(2, orderId.trim());
            if (statement.executeUpdate() != 1) {
                throw new SQLException("Order is missing or is no longer pending: " + orderId);
            }
        }
    }

    public void completePendingLimitOrder(Connection connection, String orderId,
                                          BigDecimal executionPrice) throws SQLException {
        requireTransaction(connection);
        if (orderId == null || orderId.trim().isEmpty() || orderId.trim().length() > 36) {
            throw new IllegalArgumentException("orderId must contain 1 to 36 characters");
        }
        BigDecimal normalizedPrice = normalizePrice(executionPrice);

        String sql = "UPDATE orders SET price = ?, status = 'COMPLETED' " +
                "WHERE order_id = ? AND order_mode = 'LIMIT' AND status = 'PENDING'";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setBigDecimal(1, normalizedPrice);
            statement.setString(2, orderId.trim());
            if (statement.executeUpdate() != 1) {
                throw new SQLException("Limit order is missing or is no longer pending: " + orderId);
            }
        }
    }

    private static void validateOrder(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("order must not be null");
        }
        if (order.getOrderId() == null || order.getOrderId().trim().isEmpty()
                || order.getOrderId().trim().length() > 36) {
            throw new IllegalArgumentException("orderId must contain 1 to 36 characters");
        }
        if (order.getUserId() <= 0) {
            throw new IllegalArgumentException("order userId must be positive");
        }
        normalizeSymbol(order.getSymbol());
        if (order.getQuantity() <= 0) {
            throw new IllegalArgumentException("order quantity must be positive");
        }
        normalizePrice(order.getPrice());

        String type = order.getType() == null ? "" : order.getType().trim().toUpperCase(Locale.ROOT);
        if (!"BUY".equals(type) && !"SELL".equals(type)) {
            throw new IllegalArgumentException("order type must be BUY or SELL");
        }
        String mode = order.getOrderMode() == null ? "" : order.getOrderMode().trim().toUpperCase(Locale.ROOT);
        if (!"MARKET".equals(mode) && !"LIMIT".equals(mode)) {
            throw new IllegalArgumentException("order mode must be MARKET or LIMIT");
        }
        String status = order.getStatus() == null ? "" : order.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!"PENDING".equals(status) && !"COMPLETED".equals(status) && !"CANCELLED".equals(status)) {
            throw new IllegalArgumentException("order status is not supported");
        }
    }

    private static void requireTransaction(Connection connection) throws SQLException {
        if (connection == null) {
            throw new IllegalArgumentException("connection must not be null");
        }
        if (connection.getAutoCommit()) {
            throw new SQLException("Caller must disable auto-commit before transactional order operations");
        }
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
            throw new IllegalArgumentException("order price must be positive");
        }
        BigDecimal normalized = price.setScale(2, RoundingMode.HALF_UP);
        if (normalized.signum() <= 0) {
            throw new IllegalArgumentException("order price must remain positive after rounding");
        }
        return normalized;
    }
}
