package com.tradelens.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * TradeLens - User Account Model
 *
 * Represents an authenticated investor with wallet credentials.
 */
public class User {
    private int id;
    private String username;
    private String email;
    private String passwordHash;
    private BigDecimal walletBalance;

    public User() {
        this.walletBalance = new BigDecimal("500000.00");
    }

    public User(int id, String username, String email, String passwordHash, BigDecimal walletBalance) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.walletBalance = walletBalance != null ? walletBalance.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public BigDecimal getWalletBalance() {
        return walletBalance;
    }

    public void setWalletBalance(BigDecimal walletBalance) {
        this.walletBalance = (walletBalance != null) ? walletBalance.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    @Override
    public String toString() {
        return String.format("User{id=%d, username='%s', email='%s', wallet=?%s}",
                id, username, email, walletBalance);
    }
}
