package com.tradelens.dao;

import com.tradelens.model.Stock;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

/**
 * TradeLens - Stock Data Access Object (Arnav's Module 2)
 *
 * Responsibilities:
 * 1. Retrieve all stocks from MySQL (`SELECT * FROM stocks;`).
 * 2. Convert database result rows into Stock model objects.
 * 3. Load the 20 NSE stocks seeded in the database.
 * 4. Return stocks inside an appropriate Java Collection (List<Stock>).
 * 5. Handle SQL errors and manage JDBC resources safely using try-with-resources.
 * 6. Integrate with DBConnectionManager without creating redundant connections.
 */
public class StockDAO {

    /**
     * Executes 'SELECT * FROM stocks;' and maps all rows into Stock objects.
     *
     * @return List of Stock objects sorted alphabetically by symbol
     * @throws SQLException if a database access error occurs
     */
    public List<Stock> getAllStocks() throws SQLException {
        List<Stock> stockList = new ArrayList<>();
        String sql = "SELECT symbol, company_name, sector, current_price, previous_close, day_high, day_low " +
                     "FROM stocks ORDER BY symbol ASC;";

        // try-with-resources guarantees automatic closure of Connection, PreparedStatement, and ResultSet
        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Stock stock = mapResultSetToStock(rs);
                stockList.add(stock);
            }
        } catch (SQLException e) {
            System.err.println("[StockDAO.getAllStocks] SQL Exception occurred: " + e.getMessage());
            throw e;
        }

        return stockList;
    }

    /**
     * Retrieves a single stock by its ticker symbol.
     *
     * @param symbol Stock ticker (e.g., "RELIANCE")
     * @return Stock object if found, or null if nonexistent
     * @throws SQLException on database error
     */
    public Stock getStockBySymbol(String symbol) throws SQLException {
        if (symbol == null || symbol.trim().isEmpty()) {
            return null;
        }

        String sql = "SELECT symbol, company_name, sector, current_price, previous_close, day_high, day_low " +
                     "FROM stocks WHERE symbol = ? LIMIT 1;";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, symbol.trim().toUpperCase());

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToStock(rs);
                }
            }
        } catch (SQLException e) {
            System.err.println("[StockDAO.getStockBySymbol] SQL Exception for symbol " + symbol + ": " + e.getMessage());
            throw e;
        }

        return null;
    }

    /**
     * Verifies whether a stock symbol exists in the database.
     */
    public boolean exists(String symbol) throws SQLException {
        if (symbol == null || symbol.trim().isEmpty()) return false;
        String sql = "SELECT 1 FROM stocks WHERE symbol = ? LIMIT 1;";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, symbol.trim().toUpperCase());
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    /**
     * Helper method to convert a ResultSet cursor row into a clean Stock model instance.
     */
    private Stock mapResultSetToStock(ResultSet rs) throws SQLException {
        return new Stock(
                rs.getString("symbol"),
                rs.getString("company_name"),
                rs.getString("sector"),
                rs.getBigDecimal("current_price"),
                rs.getBigDecimal("previous_close"),
                rs.getBigDecimal("day_high"),
                rs.getBigDecimal("day_low")
        );
    }
}
