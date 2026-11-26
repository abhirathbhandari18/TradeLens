package com.tradelens.dao;

import com.tradelens.model.Order;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * TradeLens - Order Data Access Object (Teammate Module)
 *
 * Manages order history persistence in MySQL.
 */
public class OrderDAO {

    public boolean createOrder(Order order) throws SQLException {
        String sql = "INSERT INTO orders (order_id, user_id, symbol, type, order_mode, quantity, price, status, created_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW());";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, order.getOrderId());
            ps.setInt(2, order.getUserId());
            ps.setString(3, order.getSymbol());
            ps.setString(4, order.getType());
            ps.setString(5, order.getOrderMode());
            ps.setInt(6, order.getQuantity());
            ps.setBigDecimal(7, order.getPrice());
            ps.setString(8, order.getStatus());
            return ps.executeUpdate() > 0;
        }
    }

    public List<Order> getOrdersByUser(int userId) throws SQLException {
        List<Order> list = new ArrayList<>();
        String sql = "SELECT order_id, user_id, symbol, type, order_mode, quantity, price, status, created_at " +
                     "FROM orders WHERE user_id = ? ORDER BY created_at DESC;";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Order order = new Order(
                            rs.getString("order_id"),
                            rs.getInt("user_id"),
                            rs.getString("symbol"),
                            rs.getString("type"),
                            rs.getString("order_mode"),
                            rs.getInt("quantity"),
                            rs.getBigDecimal("price"),
                            rs.getString("status"),
                            rs.getString("created_at")
                    );
                    list.add(order);
                }
            }
        }
        return list;
    }
}
