package com.tradelens.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * TradeLens - Order Data Model (Arnav's Module 1.3)
 *
 * Encapsulates an execution order placed by an investor in the market.
 * Supports BUY/SELL types and MARKET/LIMIT modes.
 */
public class Order {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private String orderId;     // Unique Order Identifier (e.g. "ORD-1001" or UUID)
    private int userId;         // Investor ID who placed the order
    private String symbol;      // Stock symbol being traded
    private String type;        // "BUY" or "SELL"
    private String orderMode;   // "MARKET" or "LIMIT"
    private int quantity;       // Share quantity
    private BigDecimal price;   // Execution / limit price per share
    private String status;      // "COMPLETED", "PENDING", "CANCELLED"
    private String timestamp;   // Timestamp string for database and JSON serialization

    public Order() {
        this.orderMode = "MARKET";
        this.status = "COMPLETED";
        this.price = BigDecimal.ZERO;
        this.timestamp = LocalDateTime.now().format(FORMATTER);
    }

    public Order(String orderId, int userId, String symbol, String type, String orderMode,
                 int quantity, BigDecimal price, String status, String timestamp) {
        this.orderId = orderId;
        this.userId = userId;
        setSymbol(symbol);
        this.type = (type != null) ? type.toUpperCase() : "BUY";
        this.orderMode = (orderMode != null) ? orderMode.toUpperCase() : "MARKET";
        this.quantity = quantity;
        this.price = price != null ? price.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        this.status = (status != null) ? status.toUpperCase() : "COMPLETED";
        this.timestamp = (timestamp != null) ? timestamp : LocalDateTime.now().format(FORMATTER);
    }

    /**
     * Calculates the gross monetary value of this order.
     * Formula: price * quantity
     */
    public BigDecimal getTotalValue() {
        if (price == null || quantity <= 0) return BigDecimal.ZERO;
        return price.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
    }

    // --- Getters & Setters ---

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = (type != null) ? type.toUpperCase() : "BUY";
    }

    public String getOrderMode() {
        return orderMode;
    }

    public void setOrderMode(String orderMode) {
        this.orderMode = (orderMode != null) ? orderMode.toUpperCase() : "MARKET";
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = (price != null) ? price.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = (status != null) ? status.toUpperCase() : "COMPLETED";
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return String.format("Order[%s: %s %d %s @ ?%s (%s)]",
                orderId, type, quantity, symbol, price, status);
    }
}
