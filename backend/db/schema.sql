-- TradeLens Unified Database Schema (MySQL 8.0+)
-- Combines Divyansh's User/KYC/Bank schema with Arnav & Bhumika's Trading/Market schema

CREATE DATABASE IF NOT EXISTS tradelens_db;
USE tradelens_db;

DROP TABLE IF EXISTS watchlist;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS holdings;
DROP TABLE IF EXISTS stocks;
DROP TABLE IF EXISTS users;

-- 1. STOCKS TABLE (20 NSE Stocks)
CREATE TABLE stocks (
    symbol VARCHAR(20) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    previous_close DECIMAL(12, 2) NOT NULL,
    day_high DECIMAL(12, 2) NOT NULL,
    day_low DECIMAL(12, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. USERS TABLE (Auth + KYC + Bank/Demat + Wallet Balance)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trade_id VARCHAR(30) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pan_card VARCHAR(10),
    phone VARCHAR(20),
    dob DATE,
    kyc_status VARCHAR(20) DEFAULT 'Verified',
    trading_style VARCHAR(40) DEFAULT 'Swing Trader',
    bank_name VARCHAR(100) DEFAULT 'HDFC Bank',
    account_number VARCHAR(30) DEFAULT '50100482910482',
    ifsc_code VARCHAR(15) DEFAULT 'HDFC0001245',
    account_type VARCHAR(30) DEFAULT 'Savings',
    demat_id VARCHAR(30) DEFAULT '1208160048291042',
    wallet_balance DECIMAL(15, 2) NOT NULL DEFAULT 145000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. HOLDINGS TABLE
CREATE TABLE holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    avg_buy_price DECIMAL(12, 2) NOT NULL CHECK (avg_buy_price >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_holdings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_holdings_stock FOREIGN KEY (symbol) REFERENCES stocks(symbol) ON DELETE CASCADE,
    CONSTRAINT uq_user_stock UNIQUE (user_id, symbol)
);

-- 4. ORDERS TABLE
CREATE TABLE orders (
    order_id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    type VARCHAR(10) NOT NULL,
    order_mode VARCHAR(10) NOT NULL DEFAULT 'MARKET',
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_stock FOREIGN KEY (symbol) REFERENCES stocks(symbol) ON DELETE CASCADE
);

-- 5. WATCHLIST TABLE
CREATE TABLE watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_watchlist_stock FOREIGN KEY (symbol) REFERENCES stocks(symbol) ON DELETE CASCADE,
    CONSTRAINT uq_watchlist_user_symbol UNIQUE (user_id, symbol)
);

-- SEED 20 NSE STOCKS
INSERT INTO stocks (symbol, company_name, sector, current_price, previous_close, day_high, day_low) VALUES
('RELIANCE', 'Reliance Industries Ltd.', 'Energy & Telecom', 1284.50, 1269.00, 1291.20, 1265.40),
('TCS', 'Tata Consultancy Services Ltd.', 'IT Services', 4142.80, 4110.00, 4158.90, 4102.15),
('HDFCBANK', 'HDFC Bank Ltd.', 'Banking', 1742.30, 1755.00, 1760.40, 1736.80),
('INFY', 'Infosys Ltd.', 'IT Services', 1865.75, 1844.00, 1872.00, 1839.50),
('ICICIBANK', 'ICICI Bank Ltd.', 'Banking', 1298.40, 1285.00, 1304.00, 1281.20),
('SBIN', 'State Bank of India', 'Banking', 814.60, 821.50, 824.00, 810.40),
('BHARTIARTL', 'Bharti Airtel Ltd.', 'Telecom', 1592.15, 1571.00, 1598.50, 1568.00),
('ITC', 'ITC Ltd.', 'FMCG', 478.25, 475.50, 480.10, 474.20),
('TATAMOTORS', 'Tata Motors Ltd.', 'Automotive', 786.90, 801.00, 804.50, 783.10),
('LT', 'Larsen & Toubro Ltd.', 'Infrastructure', 3588.40, 3550.00, 3599.00, 3542.50),
('AXISBANK', 'Axis Bank Ltd.', 'Banking', 1154.20, 1146.00, 1161.40, 1141.50),
('KOTAKBANK', 'Kotak Mahindra Bank Ltd.', 'Banking', 1768.90, 1778.00, 1784.00, 1762.10),
('WIPRO', 'Wipro Ltd.', 'IT Services', 564.35, 557.20, 567.80, 555.90),
('HINDUNILVR', 'Hindustan Unilever Ltd.', 'FMCG', 2418.60, 2435.00, 2441.00, 2411.25),
('SUNPHARMA', 'Sun Pharmaceutical Ind.', 'Pharma', 1812.45, 1789.00, 1819.90, 1785.40),
('MARUTI', 'Maruti Suzuki India Ltd.', 'Automotive', 11240.00, 11125.00, 11295.00, 11090.00),
('BAJFINANCE', 'Bajaj Finance Ltd.', 'Financials', 6785.50, 6842.00, 6860.00, 6755.00),
('TATASTEEL', 'Tata Steel Ltd.', 'Metals', 144.85, 142.80, 145.60, 142.10),
('ASIANPAINT', 'Asian Paints Ltd.', 'Consumer', 2496.15, 2518.00, 2524.50, 2489.00),
('ADANIENT', 'Adani Enterprises Ltd.', 'Conglomerate', 2842.70, 2801.00, 2864.00, 2792.50);

-- SEED DEMO USER (password: 'demo1234')
INSERT INTO users (id, trade_id, name, email, password_hash, pan_card, phone, dob, kyc_status, trading_style, bank_name, account_number, ifsc_code, account_type, demat_id, wallet_balance) VALUES
(1, 'TL-849201', 'Abhirath Bhandari', 'demo@tradelens.in', 'demo1234', 'ABCDE1234F', '+91 98765 43210', '2000-01-15', 'Verified', 'Swing Trader', 'HDFC Bank', '50100482910482', 'HDFC0001245', 'Savings', '1208160048291042', 145000.00);

INSERT INTO holdings (user_id, symbol, quantity, avg_buy_price) VALUES
(1, 'RELIANCE', 15, 1210.00),
(1, 'TCS', 5, 3980.00),
(1, 'HDFCBANK', 12, 1690.00),
(1, 'ITC', 40, 452.50);

INSERT INTO orders (order_id, user_id, symbol, type, order_mode, quantity, price, status, created_at) VALUES
('ORD-90412', 1, 'RELIANCE', 'BUY', 'MARKET', 5, 1280.40, 'COMPLETED', NOW() - INTERVAL 1 DAY),
('ORD-90388', 1, 'ITC', 'BUY', 'LIMIT', 20, 472.00, 'COMPLETED', NOW() - INTERVAL 2 DAY),
('ORD-90311', 1, 'TATAMOTORS', 'SELL', 'MARKET', 10, 802.50, 'COMPLETED', NOW() - INTERVAL 3 DAY);

INSERT INTO watchlist (user_id, symbol) VALUES
(1, 'RELIANCE'),
(1, 'TCS'),
(1, 'INFY');
