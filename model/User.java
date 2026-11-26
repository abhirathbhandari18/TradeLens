
package model;

import java.time.LocalDate;

public class User {

    // User profile fields
    private int id;
    private String tradeId;
    private String name;
    private String email;
    private String passwordHash;
    private String panCard;
    private String phone;
    private LocalDate dob;

    // KYC and trading fields
    private String kycStatus;
    private String tradingStyle;

    // Bank details
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String accountType;
    private String dematId;

    // Wallet balance
    private double cashBalance;

    // Default constructor
    public User() {
    }

    // Parameterized constructor
    public User(int id, String tradeId, String name, String email,
                String passwordHash, String panCard, String phone, LocalDate dob,
                String kycStatus, String tradingStyle,
                String bankName, String accountNumber,
                String ifscCode, String accountType,
                String dematId, double cashBalance) {

        this.id = id;
        this.tradeId = tradeId;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.panCard = panCard;
        this.phone = phone;
        this.dob = dob;
        this.kycStatus = kycStatus;
        this.tradingStyle = tradingStyle;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.ifscCode = ifscCode;
        this.accountType = accountType;
        this.dematId = dematId;
        this.cashBalance = cashBalance;
    }

    // Getters and Setters

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTradeId() {
        return tradeId;
    }

    public void setTradeId(String tradeId) {
        this.tradeId = tradeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPanCard() {
        return panCard;
    }

    public void setPanCard(String panCard) {
        this.panCard = panCard;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getKycStatus() {
        return kycStatus;
    }

    public void setKycStatus(String kycStatus) {
        this.kycStatus = kycStatus;
    }

    public String getTradingStyle() {
        return tradingStyle;
    }

    public void setTradingStyle(String tradingStyle) {
        this.tradingStyle = tradingStyle;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getIfscCode() {
        return ifscCode;
    }

    public void setIfscCode(String ifscCode) {
        this.ifscCode = ifscCode;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getDematId() {
        return dematId;
    }

    public void setDematId(String dematId) {
        this.dematId = dematId;
    }

    public double getCashBalance() {
        return cashBalance;
    }

    public void setCashBalance(double cashBalance) {
        this.cashBalance = cashBalance;
    }

public String getPasswordHash() {
    return passwordHash;
}

public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
}
}