
package dao;

import model.User;
import db.DBConnectionManager;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Date;

public class UserDAO {

    // Convert database result into User object
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
        u.setCashBalance(rs.getDouble("cash_balance"));

        return u;
    }

    // 1. Create a new user
    public boolean createUser(User u) throws SQLException {

        String sql = "INSERT INTO users " +
                "(trade_id, name, email, password_hash, pan_card, phone, dob, " +
                "kyc_status, trading_style, bank_name, account_number, " +
                "ifsc_code, account_type, demat_id, cash_balance) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

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

            return ps.executeUpdate() > 0;
        }
    }

    // 2. Find user by email
    public User findByEmail(String email) throws SQLException {

        String sql = "SELECT * FROM users WHERE email = ?";

        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        }

        return null;
    }

    // 3. Find user by ID
    public User findById(int userId) throws SQLException {

        String sql = "SELECT * FROM users WHERE id = ?";

        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapUser(rs);
                }
            }
        }

        return null;
    }

    // 4. Update profile and bank details
    public boolean updateProfileAndBank(User u) throws SQLException {

        String sql = "UPDATE users SET " +
                "name = ?, email = ?, phone = ?, pan_card = ?, dob = ?, " +
                "trading_style = ?, kyc_status = ?, bank_name = ?, " +
                "account_number = ?, ifsc_code = ?, account_type = ?, " +
                "demat_id = ? WHERE id = ?";

        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, u.getName());
            ps.setString(2, u.getEmail());
            ps.setString(3, u.getPhone());
            ps.setString(4, u.getPanCard());

            if (u.getDob() != null) {
                ps.setDate(5, Date.valueOf(u.getDob()));
            } else {
                ps.setNull(5, java.sql.Types.DATE);
            }

            ps.setString(6, u.getTradingStyle());
            ps.setString(7, u.getKycStatus());
            ps.setString(8, u.getBankName());
            ps.setString(9, u.getAccountNumber());
            ps.setString(10, u.getIfscCode());
            ps.setString(11, u.getAccountType());
            ps.setString(12, u.getDematId());
            ps.setInt(13, u.getId());

            return ps.executeUpdate() > 0;
        }
    }

    // 5. Update wallet balance
    public boolean updateCashBalance(int userId, double newBalance)
            throws SQLException {

        if (newBalance < 0) {
            throw new IllegalArgumentException(
                    "Cash balance cannot be negative");
        }

        String sql = "UPDATE users SET cash_balance = ? WHERE id = ?";

        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setDouble(1, newBalance);
            ps.setInt(2, userId);

            return ps.executeUpdate() > 0;
        }
    }
}
