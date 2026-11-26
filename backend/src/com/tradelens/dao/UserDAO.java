package com.tradelens.dao;

import com.tradelens.model.User;

import java.math.BigDecimal;
import java.sql.*;

/**
 * TradeLens - User Data Access Object (Teammate Module)
 */
public class UserDAO {

    public User findByUsername(String username) throws SQLException {
        String sql = "SELECT id, username, email, password_hash, wallet_balance FROM users WHERE username = ? LIMIT 1;";
        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        }
        return null;
    }

    public User findById(int id) throws SQLException {
        String sql = "SELECT id, username, email, password_hash, wallet_balance FROM users WHERE id = ? LIMIT 1;";
        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        }
        return null;
    }

    public User createUser(String username, String email, String passwordHash) throws SQLException {
        String sql = "INSERT INTO users (username, email, password_hash, wallet_balance) VALUES (?, ?, ?, 500000.00);";
        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, username);
            ps.setString(2, email);
            ps.setString(3, passwordHash);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    int generatedId = rs.getInt(1);
                    return new User(generatedId, username, email, passwordHash, new BigDecimal("500000.00"));
                }
            }
        }
        return null;
    }

    public boolean updateWalletBalance(int userId, BigDecimal newBalance) throws SQLException {
        String sql = "UPDATE users SET wallet_balance = ? WHERE id = ?;";
        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setBigDecimal(1, newBalance);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    private User mapUser(ResultSet rs) throws SQLException {
        return new User(
                rs.getInt("id"),
                rs.getString("username"),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getBigDecimal("wallet_balance")
        );
    }
}
