
-- TradeLens Database Schema
-- Create the five required tables

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trade_id VARCHAR(30) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pan_card VARCHAR(10) UNIQUE,
    phone VARCHAR(15),
    dob DATE,
    kyc_status VARCHAR(20) DEFAULT 'PENDING',
    trading_style VARCHAR(30),
    bank_name VARCHAR(100),
    account_number VARCHAR(30),
    ifsc_code VARCHAR(11),
    account_type VARCHAR(30),
    demat_id VARCHAR(30),
    cash_balance DECIMAL(15,2) DEFAULT 100000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    company_name VARCHAR(150) NOT NULL,
    exchange VARCHAR(10) DEFAULT 'NSE',
    current_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    stock_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    average_price DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (stock_id) REFERENCES stocks(id),
    UNIQUE (user_id, stock_id)
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    stock_id INT NOT NULL,
    order_type VARCHAR(10) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

CREATE TABLE IF NOT EXISTS watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    stock_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (stock_id) REFERENCES stocks(id),
    UNIQUE (user_id, stock_id)
);


-- =========================================
-- SEED DATA: 20 NSE STOCKS
-- Simulated starting prices for TradeLens
-- =========================================

INSERT IGNORE INTO stocks
(symbol, company_name, exchange, current_price)
VALUES
('RELIANCE', 'Reliance Industries Ltd', 'NSE', 1450.00),
('TCS', 'Tata Consultancy Services Ltd', 'NSE', 3200.00),
('HDFCBANK', 'HDFC Bank Ltd', 'NSE', 1700.00),
('INFY', 'Infosys Ltd', 'NSE', 1500.00),
('ICICIBANK', 'ICICI Bank Ltd', 'NSE', 1250.00),
('TATAMOTORS', 'Tata Motors Ltd', 'NSE', 750.00),
('SBIN', 'State Bank of India', 'NSE', 800.00),
('BHARTIARTL', 'Bharti Airtel Ltd', 'NSE', 1600.00),
('ITC', 'ITC Ltd', 'NSE', 450.00),
('LT', 'Larsen & Toubro Ltd', 'NSE', 3500.00),
('HINDUNILVR', 'Hindustan Unilever Ltd', 'NSE', 2400.00),
('BAJFINANCE', 'Bajaj Finance Ltd', 'NSE', 7000.00),
('WIPRO', 'Wipro Ltd', 'NSE', 300.00),
('AXISBANK', 'Axis Bank Ltd', 'NSE', 1100.00),
('MARUTI', 'Maruti Suzuki India Ltd', 'NSE', 12000.00),
('SUNPHARMA', 'Sun Pharmaceutical Industries Ltd', 'NSE', 1700.00),
('TITAN', 'Titan Company Ltd', 'NSE', 3400.00),
('NTPC', 'NTPC Ltd', 'NSE', 350.00),
('ONGC', 'Oil and Natural Gas Corporation Ltd', 'NSE', 250.00),
('POWERGRID', 'Power Grid Corporation of India Ltd', 'NSE', 300.00);


-- =========================================
-- DEMO USER FOR ACCOUNT API TESTING
-- Dummy details only; not a real account
-- =========================================

INSERT IGNORE INTO users
(id, trade_id, name, email, password_hash, pan_card, phone,
 dob, kyc_status, trading_style, bank_name, account_number,
 ifsc_code, account_type, demat_id, cash_balance)
VALUES
(1, 'TL-DEMO-001', 'Demo User', 'demo@tradelens.test',
 'DEMO_ONLY_NOT_A_REAL_PASSWORD_HASH',
 'DEMO00000D', '9999999999',
 '2000-01-01', 'VERIFIED', 'LONG_TERM',
 'Demo Bank', 'DEMO12345678',
 'DEMO0000001', 'SAVINGS', 'DEMO-DEMAT-001', 100000.00);
