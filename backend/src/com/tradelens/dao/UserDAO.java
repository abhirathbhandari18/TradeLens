package com.tradelens.dao;

import com.tradelens.model.User;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * JDBC Data Access Object for the users table (Auth, KYC, Bank/Demat, Wallet).
 */
public class UserDAO {

    private User mapUser(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getInt("id"));
        u.setTradeId(rs.getString("trade_id"));
        u.setName(rs.getString("name"));
        u.setEmail(rs.getString("email"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setPanCard(rs.getString("pan_card"));
        u.setPhone(rs.getString("phone"));
        Date dob = rs.getDate("dob");
        if (dob != null) {
            u.setDob(dob.toLocalDate());
        }
        u.setKycStatus(rs.getString("kyc_status"));
        u.setTradingStyle(rs.getString("trading_style"));
        u.setBankName(rs.getString("bank_name"));
        u.setAccountNumber(rs.getString("account_number"));
        u.setIfscCode(rs.getString("ifsc_code"));
        u.setAccountType(rs.getString("account_type"));
        u.setDematId(rs.getString("demat_id"));
        u.setCashBalance(rs.getDouble("wallet_balance"));
        return u;
    }

    public User createUser(User u) throws SQLException {
        String sql = "INSERT INTO users " +
                "(trade_id, name, email, password_hash, pan_card, phone, dob, " +
                "kyc_status, trading_style, bank_name, account_number, " +
                "ifsc_code, account_type, demat_id, wallet_balance) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, u.getTradeId());
            ps.setString(2, u.getName());
            ps.setString(3, u.getEmail());
            ps.setString(4, u.getPasswordHash());
            ps.setString(5, u.getPanCard());
            ps.setString(6, u.getPhone());
            if (u.getDob() != null) {
                ps.setDate(7, Date.valueOf(u.getDob()));
            } else {
                ps.setNull(7, java.sql.Types.DATE);
            }
            ps.setString(8, u.getKycStatus());
            ps.setString(9, u.getTradingStyle());
            ps.setString(10, u.getBankName());
            ps.setString(11, u.getAccountNumber());
            ps.setString(12, u.getIfscCode());
            ps.setString(13, u.getAccountType());
            ps.setString(14, u.getDematId());
            ps.setDouble(15, u.getCashBalance());

            int rows = ps.executeUpdate();
            if (rows > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) {
                        u.setId(keys.getInt(1));
                    }
                }
            }
            return u;
        }
    }

    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT * FROM users WHERE email = ?";
        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapUser(rs) : null;
            }
        }
    }

    public User findById(int userId) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapUser(rs) : null;
            }
        }
    }

    public boolean updateProfileAndBank(User u) throws SQLException {
        String sql = "UPDATE users SET name = ?, email = ?, pan_card = ?, phone = ?, dob = ?, " +
                "trading_style = ?, bank_name = ?, account_number = ?, ifsc_code = ?, " +
                "account_type = ?, demat_id = ? WHERE id = ?";

        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, u.getName());
            ps.setString(2, u.getEmail());
            ps.setString(3, u.getPanCard());
            ps.setString(4, u.getPhone());
            if (u.getDob() != null) {
                ps.setDate(5, Date.valueOf(u.getDob()));
            } else {
                ps.setNull(5, java.sql.Types.DATE);
            }
            ps.setString(6, u.getTradingStyle());
            ps.setString(7, u.getBankName());
            ps.setString(8, u.getAccountNumber());
            ps.setString(9, u.getIfscCode());
            ps.setString(10, u.getAccountType());
            ps.setString(11, u.getDematId());
            ps.setInt(12, u.getId());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean updateCashBalance(int userId, double newBalance) throws SQLException {
        String sql = "UPDATE users SET wallet_balance = ? WHERE id = ?";
        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, newBalance);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        }
    }
}
