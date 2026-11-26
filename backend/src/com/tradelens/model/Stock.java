package com.tradelens.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * TradeLens - Stock Data Model (Arnav's Module 1.1)
 *
 * Encapsulates equity information for stocks traded on the exchange.
 * Demonstrates:
 * 1. OOP Encapsulation (private fields, controlled getters and setters).
 * 2. High-precision monetary arithmetic using BigDecimal (avoids floating-point errors).
 * 3. Derived calculation methods for priceChange and changePercentage.
 */
public class Stock {
    private String symbol;          // Unique stock ticker (e.g., "RELIANCE", "TCS")
    private String companyName;     // Full official corporate name
    private String sector;          // Business sector (e.g., "Technology", "Energy")
    private BigDecimal currentPrice;    // Latest traded market price
    private BigDecimal previousClose;   // Previous market session close price
    private BigDecimal dayHigh;         // Highest traded price today
    private BigDecimal dayLow;          // Lowest traded price today

    /**
     * Default no-arg constructor (useful for JSON deserialization and reflection).
     */
    public Stock() {
        this.currentPrice = BigDecimal.ZERO;
        this.previousClose = BigDecimal.ZERO;
        this.dayHigh = BigDecimal.ZERO;
        this.dayLow = BigDecimal.ZERO;
    }

    /**
     * Minimal constructor matching required fields.
     */
    public Stock(String symbol, String companyName, String sector, BigDecimal currentPrice, BigDecimal previousClose) {
        this(symbol, companyName, sector, currentPrice, previousClose, currentPrice, previousClose);
    }

    /**
     * Full parameterized constructor initializing all stock fields.
     */
    public Stock(String symbol, String companyName, String sector, BigDecimal currentPrice,
                 BigDecimal previousClose, BigDecimal dayHigh, BigDecimal dayLow) {
        setSymbol(symbol);
        this.companyName = companyName;
        this.sector = sector;
        this.currentPrice = currentPrice != null ? currentPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        this.previousClose = previousClose != null ? previousClose.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        this.dayHigh = dayHigh != null ? dayHigh.setScale(2, RoundingMode.HALF_UP) : this.currentPrice;
        this.dayLow = dayLow != null ? dayLow.setScale(2, RoundingMode.HALF_UP) : this.currentPrice;
    }

    /**
     * Calculates absolute price movement from previous session close.
     * Formula: currentPrice - previousClose
     */
    public BigDecimal getPriceChange() {
        if (currentPrice == null || previousClose == null) return BigDecimal.ZERO;
        return currentPrice.subtract(previousClose).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates percentage return/movement from previous close.
     * Formula: ((currentPrice - previousClose) / previousClose) * 100
     */
    public BigDecimal getChangePercentage() {
        if (previousClose == null || previousClose.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return getPriceChange()
                .divide(previousClose, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    // --- Getters & Setters ---

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        // Enforce non-null, trimmed, uppercase ticker for consistent database queries
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
        this.currentPrice = (currentPrice != null) ? currentPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    public BigDecimal getPreviousClose() {
        return previousClose;
    }

    public void setPreviousClose(BigDecimal previousClose) {
        this.previousClose = (previousClose != null) ? previousClose.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    public BigDecimal getDayHigh() {
        return dayHigh;
    }

    public void setDayHigh(BigDecimal dayHigh) {
        this.dayHigh = (dayHigh != null) ? dayHigh.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    public BigDecimal getDayLow() {
        return dayLow;
    }

    public void setDayLow(BigDecimal dayLow) {
        this.dayLow = (dayLow != null) ? dayLow.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Stock stock = (Stock) o;
        return Objects.equals(symbol, stock.symbol);
    }

    @Override
    public int hashCode() {
        return Objects.hash(symbol);
    }

    @Override
    public String toString() {
        return String.format("Stock{%s: %s | ?%s (%s%%)}", symbol, companyName, currentPrice, getChangePercentage());
    }
}
