package com.tradelens.dao;

import com.tradelens.model.Holding;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * HoldingsDAO — Reads user equity holdings joined with live stock prices.
 * Transactional writes are delegated to TransactionalHoldingsDAO (setAutoCommit(false)).
 */
public class HoldingsDAO {

    public List<Holding> getHoldingsByUser(int userId) throws SQLException {
        List<Holding> list = new ArrayList<>();
        String sql = "SELECT h.user_id, h.symbol, h.quantity, h.avg_buy_price, " +
                "s.company_name, s.current_price " +
                "FROM holdings h JOIN stocks s ON h.symbol = s.symbol " +
                "WHERE h.user_id = ? AND h.quantity > 0 ORDER BY h.symbol ASC";

        try (Connection conn = DBConnectionManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    BigDecimal avg = rs.getBigDecimal("avg_buy_price");
                    BigDecimal ltp = rs.getBigDecimal("current_price");
                    list.add(new Holding(
                            rs.getInt("user_id"),
                            rs.getString("symbol"),
                            rs.getString("company_name"),
                            rs.getInt("quantity"),
                            avg,
                            ltp
                    ));
                }
            }
        }
        return list;
    }
}
