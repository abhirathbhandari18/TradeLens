package com.tradelens.model;

import java.time.LocalDate;

/**
 * TradeLens User POJO (Profile, KYC, Bank/Demat, and Wallet Balance).
 */
public class User {
    private int id;
    private String tradeId;
    private String name;
    private String email;
    private String passwordHash;
    private String panCard;
    private String phone;
    private LocalDate dob;
    private String kycStatus;
    private String tradingStyle;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String accountType;
    private String dematId;
    private double cashBalance;

    public User() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTradeId() { return tradeId; }
    public void setTradeId(String tradeId) { this.tradeId = tradeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getPanCard() { return panCard; }
    public void setPanCard(String panCard) { this.panCard = panCard; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getKycStatus() { return kycStatus; }
    public void setKycStatus(String kycStatus) { this.kycStatus = kycStatus; }

    public String getTradingStyle() { return tradingStyle; }
    public void setTradingStyle(String tradingStyle) { this.tradingStyle = tradingStyle; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getDematId() { return dematId; }
    public void setDematId(String dematId) { this.dematId = dematId; }

    public double getCashBalance() { return cashBalance; }
    public void setCashBalance(double cashBalance) { this.cashBalance = cashBalance; }

    public double getWalletBalance() { return cashBalance; }
    public void setWalletBalance(double walletBalance) { this.cashBalance = walletBalance; }
}
