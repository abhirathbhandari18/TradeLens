package com.tradelens.dao;

import com.tradelens.model.Order;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * OrderDAO — Reads user order history (newest first).
 * Transactional writes are delegated to TransactionalOrderDAO (setAutoCommit(false)).
 */
public class OrderDAO {

    public List<Order> getOrdersByUser(int userId) throws SQLException {
        List<Order> orders = new ArrayList<>();
        String sql = "SELECT order_id, user_id, symbol, type, order_mode, quantity, price, status, created_at " +
                "FROM orders WHERE user_id = ? ORDER BY created_at DESC";

        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    orders.add(new Order(
                            rs.getString("order_id"),
                            rs.getInt("user_id"),
                            rs.getString("symbol"),
                            rs.getString("type"),
                            rs.getString("order_mode"),
                            rs.getInt("quantity"),
                            rs.getBigDecimal("price"),
                            rs.getString("status"),
                            rs.getString("created_at")
                    ));
                }
            }
        }
        return orders;
    }
}
