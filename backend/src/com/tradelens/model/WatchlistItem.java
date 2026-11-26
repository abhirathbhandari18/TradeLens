package com.tradelens.model;

import java.math.BigDecimal;

/**
 * TradeLens - WatchlistItem Data Model (Arnav's Module 1.4)
 *
 * Represents an entry in a user's monitored stock watchlist.
 * Prevents tracking duplicate stocks per user and supports market pricing data.
 */
public class WatchlistItem {
    private int id;             // Auto-incremented primary key in MySQL
    private int userId;         // Investor ID who owns this watchlist item
    private String symbol;      // Ticker symbol being monitored

    // Supplementary presentation attributes (enriched for frontend display)
    private String companyName;
    private String sector;
    private BigDecimal currentPrice;
    private BigDecimal priceChange;
    private BigDecimal changePercentage;

    public WatchlistItem() {
    }

    public WatchlistItem(int id, int userId, String symbol) {
        this.id = id;
        this.userId = userId;
        setSymbol(symbol);
    }

    public WatchlistItem(int id, int userId, String symbol, String companyName, String sector,
                        BigDecimal currentPrice, BigDecimal priceChange, BigDecimal changePercentage) {
        this.id = id;
        this.userId = userId;
        setSymbol(symbol);
        this.companyName = companyName;
        this.sector = sector;
        this.currentPrice = currentPrice;
        this.priceChange = priceChange;
        this.changePercentage = changePercentage;
    }

    // --- Getters & Setters ---

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = (symbol != null) ? symbol.trim().toUpperCase() : "";
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getSector() {
        return sector;
    }

    public void setSector(String sector) {
        this.sector = sector;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
    }

    public BigDecimal getPriceChange() {
        return priceChange;
    }

    public void setPriceChange(BigDecimal priceChange) {
        this.priceChange = priceChange;
    }

    public BigDecimal getChangePercentage() {
        return changePercentage;
    }

    public void setChangePercentage(BigDecimal changePercentage) {
        this.changePercentage = changePercentage;
    }

    @Override
    public String toString() {
        return String.format("WatchlistItem{id=%d, userId=%d, symbol='%s'}", id, userId, symbol);
    }
}
