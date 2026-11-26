-- TradeLens Database Schema
-- MySQL 8.0+ Compatible

CREATE DATABASE IF NOT EXISTS tradelens_db;
USE tradelens_db;

-- 1. STOCKS TABLE (Managed by StockDAO)
DROP TABLE IF EXISTS watchlist;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS holdings;
DROP TABLE IF EXISTS stocks;
DROP TABLE IF EXISTS users;

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

-- 2. USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    wallet_balance DECIMAL(15, 2) NOT NULL DEFAULT 500000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. HOLDINGS TABLE (Managed by OrdersHandler & HoldingsDAO)
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

-- 4. ORDERS TABLE (Managed by OrdersHandler & OrderDAO)
CREATE TABLE orders (
    order_id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    type VARCHAR(10) NOT NULL, -- 'BUY' or 'SELL'
    order_mode VARCHAR(10) NOT NULL DEFAULT 'MARKET', -- 'MARKET' or 'LIMIT'
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED', 'PENDING', 'CANCELLED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_stock FOREIGN KEY (symbol) REFERENCES stocks(symbol) ON DELETE CASCADE
);

-- 5. WATCHLIST TABLE (Managed by WatchlistDAO & WatchlistHandler)
CREATE TABLE watchlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_watchlist_stock FOREIGN KEY (symbol) REFERENCES stocks(symbol) ON DELETE CASCADE,
    CONSTRAINT uq_watchlist_user_symbol UNIQUE (user_id, symbol)
);

-- SEED 20 PROMINENT NSE STOCKS
INSERT INTO stocks (symbol, company_name, sector, current_price, previous_close, day_high, day_low) VALUES
('RELIANCE', 'Reliance Industries Ltd.', 'Energy', 2980.50, 2945.00, 3010.00, 2940.00),
('TCS', 'Tata Consultancy Services Ltd.', 'Technology', 3890.00, 3920.00, 3935.00, 3875.00),
('HDFCBANK', 'HDFC Bank Ltd.', 'Banking & Finance', 1685.20, 1660.00, 1695.00, 1658.00),
('INFY', 'Infosys Ltd.', 'Technology', 1560.75, 1540.00, 1572.00, 1535.00),
('ICICIBANK', 'ICICI Bank Ltd.', 'Banking & Finance', 1120.40, 1105.50, 1130.00, 1102.00),
('TATAMOTORS', 'Tata Motors Ltd.', 'Automobile', 965.80, 930.00, 975.00, 928.00),
('BHARTIARTL', 'Bharti Airtel Ltd.', 'Telecommunications', 1340.10, 1325.00, 1352.00, 1320.00),
('ITC', 'ITC Ltd.', 'Consumer Goods', 435.60, 438.00, 439.50, 434.00),
('LT', 'Larsen & Toubro Ltd.', 'Construction & Engineering', 3540.00, 3490.00, 3565.00, 3480.00),
('SBIN', 'State Bank of India', 'Banking & Finance', 815.30, 802.00, 822.00, 800.00),
('SUNPHARMA', 'Sun Pharmaceutical Industries', 'Healthcare', 1620.00, 1635.00, 1640.00, 1612.00),
('MARUTI', 'Maruti Suzuki India Ltd.', 'Automobile', 12450.00, 12300.00, 12550.00, 12280.00),
('TITAN', 'Titan Company Ltd.', 'Consumer Discretionary', 3410.00, 3380.00, 3435.00, 3370.00),
('BAJFINANCE', 'Bajaj Finance Ltd.', 'Banking & Finance', 6980.00, 7050.00, 7080.00, 6950.00),
('HCLTECH', 'HCL Technologies Ltd.', 'Technology', 1610.50, 1590.00, 1625.00, 1585.00),
('KOTAKBANK', 'Kotak Mahindra Bank Ltd.', 'Banking & Finance', 1780.00, 1765.00, 1795.00, 1760.00),
('WIPRO', 'Wipro Ltd.', 'Technology', 485.25, 490.00, 492.00, 482.00),
('ASIANPAINT', 'Asian Paints Ltd.', 'Consumer Goods', 2890.00, 2870.00, 2915.00, 2860.00),
('AXISBANK', 'Axis Bank Ltd.', 'Banking & Finance', 1175.50, 1160.00, 1185.00, 1155.00),
('NTPC', 'NTPC Ltd.', 'Energy', 360.20, 355.00, 364.00, 354.00);

-- SEED DEMO USER (password: 'password123', SHA-256 hash or simple hash)
INSERT INTO users (id, username, email, password_hash, wallet_balance) VALUES
(1, 'investor', 'investor@tradelens.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 450000.00);

-- SEED DEMO HOLDINGS FOR USER 1
INSERT INTO holdings (user_id, symbol, quantity, avg_buy_price) VALUES
(1, 'RELIANCE', 15, 2850.00),
(1, 'TCS', 10, 3720.00),
(1, 'HDFCBANK', 25, 1610.00),
(1, 'TATAMOTORS', 40, 880.00);

-- SEED DEMO COMPLETED ORDERS FOR USER 1
INSERT INTO orders (order_id, user_id, symbol, type, order_mode, quantity, price, status, created_at) VALUES
('ORD-1001', 1, 'RELIANCE', 'BUY', 'MARKET', 15, 2850.00, 'COMPLETED', NOW() - INTERVAL 12 DAY),
('ORD-1002', 1, 'TCS', 'BUY', 'MARKET', 10, 3720.00, 'COMPLETED', NOW() - INTERVAL 8 DAY),
('ORD-1003', 1, 'HDFCBANK', 'BUY', 'MARKET', 25, 1610.00, 'COMPLETED', NOW() - INTERVAL 5 DAY),
('ORD-1004', 1, 'TATAMOTORS', 'BUY', 'MARKET', 40, 880.00, 'COMPLETED', NOW() - INTERVAL 2 DAY);

-- SEED DEMO WATCHLIST FOR USER 1
INSERT INTO watchlist (user_id, symbol) VALUES
(1, 'INFY'),
(1, 'ICICIBANK'),
(1, 'LT'),
(1, 'TITAN');
