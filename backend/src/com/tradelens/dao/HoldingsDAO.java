package com.tradelens.dao;

import com.tradelens.model.Holding;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * TradeLens - Holdings Data Access Object (Teammate Module)
 *
 * Manages portfolio share holdings in MySQL.
 */
public class HoldingsDAO {

    public List<Holding> getHoldingsByUser(int userId) throws SQLException {
        List<Holding> list = new ArrayList<>();
        String sql = "SELECT h.user_id, h.symbol, h.quantity, h.avg_buy_price, s.company_name, s.current_price " +
                     "FROM holdings h " +
                     "LEFT JOIN stocks s ON h.symbol = s.symbol " +
                     "WHERE h.user_id = ? AND h.quantity > 0 " +
                     "ORDER BY h.symbol ASC;";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Holding h = new Holding(
                            rs.getInt("user_id"),
                            rs.getString("symbol"),
                            rs.getInt("quantity"),
                            rs.getBigDecimal("avg_buy_price"),
                            rs.getString("company_name"),
                            rs.getBigDecimal("current_price")
                    );
                    list.add(h);
                }
            }
        }
        return list;
    }

    public Holding getHolding(int userId, String symbol) throws SQLException {
        String sql = "SELECT h.user_id, h.symbol, h.quantity, h.avg_buy_price, s.company_name, s.current_price " +
                     "FROM holdings h " +
                     "LEFT JOIN stocks s ON h.symbol = s.symbol " +
                     "WHERE h.user_id = ? AND h.symbol = ? LIMIT 1;";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, symbol.trim().toUpperCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Holding(
                            rs.getInt("user_id"),
                            rs.getString("symbol"),
                            rs.getInt("quantity"),
                            rs.getBigDecimal("avg_buy_price"),
                            rs.getString("company_name"),
                            rs.getBigDecimal("current_price")
                    );
                }
            }
        }
        return null;
    }

    public synchronized void addShares(int userId, String symbol, int addQuantity, BigDecimal buyPrice) throws SQLException {
        Holding existing = getHolding(userId, symbol);
        if (existing == null) {
            String insertSql = "INSERT INTO holdings (user_id, symbol, quantity, avg_buy_price) VALUES (?, ?, ?, ?);";
            try (Connection con = DBConnectionManager.getConnection();
                 PreparedStatement ps = con.prepareStatement(insertSql)) {
                ps.setInt(1, userId);
                ps.setString(2, symbol.trim().toUpperCase());
                ps.setInt(3, addQuantity);
                ps.setBigDecimal(4, buyPrice);
                ps.executeUpdate();
            }
        } else {
            // Weighted Average Purchase Price: ((oldQty * oldAvg) + (newQty * buyPrice)) / (oldQty + newQty)
            BigDecimal oldCost = existing.getAvgBuyPrice().multiply(BigDecimal.valueOf(existing.getQuantity()));
            BigDecimal newCost = buyPrice.multiply(BigDecimal.valueOf(addQuantity));
            int totalQty = existing.getQuantity() + addQuantity;
            BigDecimal newAvg = oldCost.add(newCost).divide(BigDecimal.valueOf(totalQty), 2, RoundingMode.HALF_UP);

            String updateSql = "UPDATE holdings SET quantity = ?, avg_buy_price = ? WHERE user_id = ? AND symbol = ?;";
            try (Connection con = DBConnectionManager.getConnection();
                 PreparedStatement ps = con.prepareStatement(updateSql)) {
                ps.setInt(1, totalQty);
                ps.setBigDecimal(2, newAvg);
                ps.setInt(3, userId);
                ps.setString(4, symbol.trim().toUpperCase());
                ps.executeUpdate();
            }
        }
    }

    public synchronized boolean reduceShares(int userId, String symbol, int sellQuantity) throws SQLException {
        Holding existing = getHolding(userId, symbol);
        if (existing == null || existing.getQuantity() < sellQuantity) {
            return false;
        }

        int remainingQty = existing.getQuantity() - sellQuantity;
        if (remainingQty == 0) {
            String deleteSql = "DELETE FROM holdings WHERE user_id = ? AND symbol = ?;";
            try (Connection con = DBConnectionManager.getConnection();
                 PreparedStatement ps = con.prepareStatement(deleteSql)) {
                ps.setInt(1, userId);
                ps.setString(2, symbol.trim().toUpperCase());
                return ps.executeUpdate() > 0;
            }
        } else {
            String updateSql = "UPDATE holdings SET quantity = ? WHERE user_id = ? AND symbol = ?;";
            try (Connection con = DBConnectionManager.getConnection();
                 PreparedStatement ps = con.prepareStatement(updateSql)) {
                ps.setInt(1, remainingQty);
                ps.setInt(2, userId);
                ps.setString(3, symbol.trim().toUpperCase());
                return ps.executeUpdate() > 0;
            }
        }
    }
}
