package com.tradelens.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * TradeLens - Holding Data Model (Arnav's Module 1.2)
 *
 * Represents an investor's ownership position in a specific stock.
 * Tracks share volume and weighted-average purchase price basis.
 */
public class Holding {
    private int userId;
    private String symbol;
    private int quantity;
    private BigDecimal avgBuyPrice;

    // Supplementary presentation fields (populated by service/handler layer for frontend)
    private String companyName;
    private BigDecimal currentPrice;

    public Holding() {
        this.avgBuyPrice = BigDecimal.ZERO;
        this.currentPrice = BigDecimal.ZERO;
    }

    public Holding(int userId, String symbol, int quantity, BigDecimal avgBuyPrice) {
        this.userId = userId;
        setSymbol(symbol);
        this.quantity = Math.max(0, quantity);
        this.avgBuyPrice = avgBuyPrice != null ? avgBuyPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        this.currentPrice = this.avgBuyPrice;
    }

    public Holding(int userId, String symbol, int quantity, BigDecimal avgBuyPrice, String companyName, BigDecimal currentPrice) {
        this.userId = userId;
        setSymbol(symbol);
        this.quantity = Math.max(0, quantity);
        this.avgBuyPrice = avgBuyPrice != null ? avgBuyPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        this.companyName = companyName;
        this.currentPrice = currentPrice != null ? currentPrice.setScale(2, RoundingMode.HALF_UP) : this.avgBuyPrice;
    }

    /**
     * Total Capital Invested in this position:
     * Formula: quantity * avgBuyPrice
     */
    public BigDecimal getTotalInvested() {
        if (avgBuyPrice == null || quantity <= 0) return BigDecimal.ZERO;
        return avgBuyPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Current Market Value of this position:
     * Formula: quantity * currentPrice
     */
    public BigDecimal getCurrentValue() {
        BigDecimal price = (currentPrice != null) ? currentPrice : avgBuyPrice;
        if (price == null || quantity <= 0) return BigDecimal.ZERO;
        return price.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Unrealized Profit / Loss for this position:
     * Formula: currentValue - totalInvested
     */
    public BigDecimal getUnrealizedProfitLoss() {
        return getCurrentValue().subtract(getTotalInvested()).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Percentage Return on this position:
     * Formula: ((currentValue - totalInvested) / totalInvested) * 100
     */
    public BigDecimal getReturnPercentage() {
        BigDecimal invested = getTotalInvested();
        if (invested.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return getUnrealizedProfitLoss()
                .divide(invested, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    // --- Getters & Setters ---

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

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = Math.max(0, quantity);
    }

    public BigDecimal getAvgBuyPrice() {
        return avgBuyPrice;
    }

    public void setAvgBuyPrice(BigDecimal avgBuyPrice) {
        this.avgBuyPrice = (avgBuyPrice != null) ? avgBuyPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = (currentPrice != null) ? currentPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    @Override
    public String toString() {
        return String.format("Holding{user=%d, %s: %d shares @ ?%s | Invested: ?%s}",
                userId, symbol, quantity, avgBuyPrice, getTotalInvested());
    }
}
