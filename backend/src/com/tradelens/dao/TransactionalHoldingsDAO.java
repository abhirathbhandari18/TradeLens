package com.tradelens.dao;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Locale;

/**
 * Connection-scoped holdings operations for caller-managed transactions.
 */
public final class TransactionalHoldingsDAO {

    public void addShares(Connection connection, int userId, String symbol, int addQuantity,
                          BigDecimal buyPrice) throws SQLException {
        requireTransaction(connection);
        validateUserId(userId);
        validateQuantity(addQuantity, "addQuantity");
        String normalizedSymbol = normalizeSymbol(symbol);
        BigDecimal normalizedPrice = normalizePrice(buyPrice, "buyPrice");

        int existingQuantity;
        BigDecimal existingAverage;
        String selectSql = "SELECT quantity, avg_buy_price FROM holdings " +
                "WHERE user_id = ? AND symbol = ? FOR UPDATE";
        try (PreparedStatement statement = connection.prepareStatement(selectSql)) {
            statement.setInt(1, userId);
            statement.setString(2, normalizedSymbol);
            try (ResultSet results = statement.executeQuery()) {
                if (!results.next()) {
                    insertHolding(connection, userId, normalizedSymbol, addQuantity, normalizedPrice);
                    return;
                }
                existingQuantity = results.getInt("quantity");
                existingAverage = results.getBigDecimal("avg_buy_price");
            }
        }

        if (existingQuantity < 0 || existingAverage == null || existingAverage.signum() < 0) {
            throw new SQLException("Existing holding contains invalid quantity or average price");
        }

        long combinedQuantity = (long) existingQuantity + addQuantity;
        if (combinedQuantity > Integer.MAX_VALUE) {
            throw new SQLException("Combined holding quantity exceeds the supported range");
        }

        BigDecimal existingCost = existingAverage.multiply(BigDecimal.valueOf(existingQuantity));
        BigDecimal addedCost = normalizedPrice.multiply(BigDecimal.valueOf(addQuantity));
        BigDecimal weightedAverage = existingCost.add(addedCost)
                .divide(BigDecimal.valueOf(combinedQuantity), 2, RoundingMode.HALF_UP);

        String updateSql = "UPDATE holdings SET quantity = ?, avg_buy_price = ? " +
                "WHERE user_id = ? AND symbol = ?";
        try (PreparedStatement statement = connection.prepareStatement(updateSql)) {
            statement.setInt(1, (int) combinedQuantity);
            statement.setBigDecimal(2, weightedAverage);
            statement.setInt(3, userId);
            statement.setString(4, normalizedSymbol);
            if (statement.executeUpdate() != 1) {
                throw new SQLException("Holding changed or disappeared while adding shares");
            }
        }
    }

    /**
     * Reduces shares under a row lock. Returns false when no holding exists
     * or the requested quantity exceeds the available shares.
     */
    public boolean reduceShares(Connection connection, int userId, String symbol,
                                int sellQuantity) throws SQLException {
        requireTransaction(connection);
        validateUserId(userId);
        validateQuantity(sellQuantity, "sellQuantity");
        String normalizedSymbol = normalizeSymbol(symbol);

        int availableQuantity;
        String selectSql = "SELECT quantity FROM holdings WHERE user_id = ? AND symbol = ? FOR UPDATE";
        try (PreparedStatement statement = connection.prepareStatement(selectSql)) {
            statement.setInt(1, userId);
            statement.setString(2, normalizedSymbol);
            try (ResultSet results = statement.executeQuery()) {
                if (!results.next()) {
                    return false;
                }
                availableQuantity = results.getInt("quantity");
            }
        }

        if (availableQuantity < sellQuantity) {
            return false;
        }

        int remainingQuantity = availableQuantity - sellQuantity;
        String changeSql = remainingQuantity == 0
                ? "DELETE FROM holdings WHERE user_id = ? AND symbol = ? AND quantity = ?"
                : "UPDATE holdings SET quantity = ? WHERE user_id = ? AND symbol = ? AND quantity = ?";
        try (PreparedStatement statement = connection.prepareStatement(changeSql)) {
            if (remainingQuantity == 0) {
                statement.setInt(1, userId);
                statement.setString(2, normalizedSymbol);
                statement.setInt(3, availableQuantity);
            } else {
                statement.setInt(1, remainingQuantity);
                statement.setInt(2, userId);
                statement.setString(3, normalizedSymbol);
                statement.setInt(4, availableQuantity);
            }
            return statement.executeUpdate() == 1;
        }
    }

    private static void insertHolding(Connection connection, int userId, String symbol,
                                      int quantity, BigDecimal averagePrice) throws SQLException {
        String insertSql = "INSERT INTO holdings (user_id, symbol, quantity, avg_buy_price) " +
                "VALUES (?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(insertSql)) {
            statement.setInt(1, userId);
            statement.setString(2, symbol);
            statement.setInt(3, quantity);
            statement.setBigDecimal(4, averagePrice);
            if (statement.executeUpdate() != 1) {
                throw new SQLException("Could not insert holding");
            }
        }
    }

    private static void requireTransaction(Connection connection) throws SQLException {
        if (connection == null) {
            throw new IllegalArgumentException("connection must not be null");
        }
        if (connection.getAutoCommit()) {
            throw new SQLException("Caller must disable auto-commit before transactional holdings operations");
        }
    }

    private static void validateUserId(int userId) {
        if (userId <= 0) {
            throw new IllegalArgumentException("userId must be positive");
        }
    }

    private static void validateQuantity(int quantity, String name) {
        if (quantity <= 0) {
            throw new IllegalArgumentException(name + " must be positive");
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

    private static BigDecimal normalizePrice(BigDecimal price, String name) {
        if (price == null || price.signum() <= 0) {
            throw new IllegalArgumentException(name + " must be positive");
        }
        BigDecimal normalized = price.setScale(2, RoundingMode.HALF_UP);
        if (normalized.signum() <= 0) {
            throw new IllegalArgumentException(name + " must remain positive after rounding");
        }
        return normalized;
    }
}
