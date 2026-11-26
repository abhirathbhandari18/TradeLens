package com.tradelens.dao;

import com.tradelens.model.WatchlistItem;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * TradeLens - Watchlist Data Access Object (Arnav's Module 3)
 *
 * Responsibilities:
 * 1. Retrieve watchlist items for a specific authenticated user.
 * 2. Add an equity to the user's watchlist with duplicate prevention.
 * 3. Remove an equity from the user's watchlist safely.
 * 4. Validate stock existence before tracking.
 * 5. Manage JDBC PreparedStatement and try-with-resources resource lifecycles.
 */
public class WatchlistDAO {

    /**
     * Retrieves all stocks currently on the user's watchlist, enriched with live market prices.
     *
     * @param userId The ID of the authenticated user
     * @return List of WatchlistItem objects
     * @throws SQLException on database error
     */
    public List<WatchlistItem> getWatchlist(int userId) throws SQLException {
        List<WatchlistItem> items = new ArrayList<>();
        String sql = "SELECT w.id, w.user_id, w.symbol, s.company_name, s.sector, s.current_price, s.previous_close " +
                     "FROM watchlist w " +
                     "INNER JOIN stocks s ON w.symbol = s.symbol " +
                     "WHERE w.user_id = ? " +
                     "ORDER BY w.created_at DESC;";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int id = rs.getInt("id");
                    String symbol = rs.getString("symbol");
                    String companyName = rs.getString("company_name");
                    String sector = rs.getString("sector");
                    BigDecimal currentPrice = rs.getBigDecimal("current_price");
                    BigDecimal previousClose = rs.getBigDecimal("previous_close");

                    BigDecimal change = BigDecimal.ZERO;
                    BigDecimal changePct = BigDecimal.ZERO;
                    if (currentPrice != null && previousClose != null && previousClose.compareTo(BigDecimal.ZERO) != 0) {
                        change = currentPrice.subtract(previousClose).setScale(2, RoundingMode.HALF_UP);
                        changePct = change.divide(previousClose, 4, RoundingMode.HALF_UP)
                                          .multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
                    }

                    WatchlistItem item = new WatchlistItem(id, userId, symbol, companyName, sector, currentPrice, change, changePct);
                    items.add(item);
                }
            }
        } catch (SQLException e) {
            System.err.println("[WatchlistDAO.getWatchlist] Error fetching watchlist for user " + userId + ": " + e.getMessage());
            throw e;
        }

        return items;
    }

    /**
     * Adds a stock to the user's watchlist.
     * Checks for stock existence and duplicate watchlist entries.
     *
     * @param userId The ID of the user
     * @param symbol The stock ticker symbol
     * @return true if successfully inserted, false if already present
     * @throws SQLException on database error or if stock does not exist
     */
    public synchronized boolean addWatchlistItem(int userId, String symbol) throws SQLException {
        if (symbol == null || symbol.trim().isEmpty()) {
            throw new IllegalArgumentException("Stock symbol cannot be empty");
        }
        String cleanSymbol = symbol.trim().toUpperCase();

        // 1. Validate that the stock exists in the market catalog
        StockDAO stockDAO = new StockDAO();
        if (!stockDAO.exists(cleanSymbol)) {
            throw new IllegalArgumentException("Stock with symbol '" + cleanSymbol + "' does not exist in the market.");
        }

        // 2. Prevent duplicate entries
        if (isAlreadyInWatchlist(userId, cleanSymbol)) {
            return false; // Already present
        }

        // 3. Insert record using PreparedStatement
        String insertSql = "INSERT INTO watchlist (user_id, symbol, created_at) VALUES (?, ?, NOW());";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(insertSql)) {

            ps.setInt(1, userId);
            ps.setString(2, cleanSymbol);

            int rowsAffected = ps.executeUpdate();
            return rowsAffected > 0;
        } catch (SQLException e) {
            System.err.println("[WatchlistDAO.addWatchlistItem] Insert error: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Removes a stock from the user's watchlist.
     *
     * @param userId The ID of the user
     * @param symbol The stock ticker symbol
     * @return true if a record was removed, false if not found
     * @throws SQLException on database error
     */
    public synchronized boolean removeWatchlistItem(int userId, String symbol) throws SQLException {
        if (symbol == null || symbol.trim().isEmpty()) return false;
        String cleanSymbol = symbol.trim().toUpperCase();

        String deleteSql = "DELETE FROM watchlist WHERE user_id = ? AND symbol = ?;";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(deleteSql)) {

            ps.setInt(1, userId);
            ps.setString(2, cleanSymbol);

            int rowsAffected = ps.executeUpdate();
            return rowsAffected > 0;
        } catch (SQLException e) {
            System.err.println("[WatchlistDAO.removeWatchlistItem] Delete error: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Checks if a symbol is already present in the user's watchlist.
     */
    public boolean isAlreadyInWatchlist(int userId, String symbol) throws SQLException {
        String checkSql = "SELECT 1 FROM watchlist WHERE user_id = ? AND symbol = ? LIMIT 1;";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(checkSql)) {

            ps.setInt(1, userId);
            ps.setString(2, symbol.trim().toUpperCase());

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }
}
