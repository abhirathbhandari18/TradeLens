# TradeLens — Smart Stock Portfolio Management System

[![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Status](https://img.shields.io/badge/QA_Tests-25%2F25_Passed-success)](file:///backend/test_api.ps1)

> **"See Your Investments Clearly."**  
> An enterprise-grade, full-stack stock portfolio tracking web application built with a high-performance **Core Java** backend, **MySQL 8.0** persistence via **JDBC**, and a modern **React.js** fintech dashboard.

Developed for college project evaluation by **Arnav Malhotra (Member 4)**.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Arnav's Assigned Scope (Member 4)](#arnavs-assigned-scope-member-4)
3. [System Architecture](#system-architecture)
4. [Prerequisites](#prerequisites)
5. [Quick Start & Execution](#quick-start--execution)
6. [Database Setup & Schema](#database-setup--schema)
7. [REST API Documentation](#rest-api-documentation)
8. [Automated QA Test Suite (25 Tests)](#automated-qa-test-suite-25-tests)
9. [Core Java Syllabus Implementation Reference](#core-java-syllabus-implementation-reference)
10. [Viva Voce & Evaluation Preparation](#viva-voce--evaluation-preparation)

---

## 1. Project Overview

TradeLens helps retail investors track their equities across sectors, calculate **weighted-average cost basis**, monitor real-time unrealized capital gains/losses, manage personalized watchlists, and maintain audit-compliant order logs.

### Key Capabilities
- **Real-Time Market Prices**: 20 prominent National Stock Exchange (NSE) equities with an active background multithreaded simulation thread (`MarketSimulatorThread`).
- **Weighted-Average Cost Basis**: Accurate portfolio cost basis accounting when buying and selling shares.
- **Watchlist with Duplicate Shield**: Enforces relational uniqueness and prevents duplicate tracking at both application and database levels (`UNIQUE(user_id, symbol)`).
- **Secure REST Architecture**: PreparedStatement parameterized queries preventing SQL Injection, session token verification, and cross-user data isolation.
- **Interactive Java Syllabus Lab**: Live browser-driven execution for Multithreading (`wait()`/`notifyAll()`), Stream API benchmarks, and Collections Framework matrices.
- **File Handling & CSV Export**: Direct export of transaction ledgers to downloadable `.csv` files using `FileWriter` and `BufferedWriter`.

---

## 2. Arnav's Assigned Scope (Member 4)

| Category | File Path | Responsibilities |
| :--- | :--- | :--- |
| **Data Models** | `backend/src/com/tradelens/model/Stock.java` | Encapsulates stock ticker, name, sector, `currentPrice`, `previousClose`, `dayHigh`, `dayLow`, `BigDecimal` financial math. |
| | `backend/src/com/tradelens/model/Holding.java` | Encapsulates an investor's owned shares (`userId`, `symbol`, `quantity`, `avgBuyPrice`) and unrealized P/L formulas. |
| | `backend/src/com/tradelens/model/Order.java` | Encapsulates executed trades (`orderId`, `userId`, `symbol`, `type`, `orderMode`, `quantity`, `price`, `status`, `timestamp`). |
| | `backend/src/com/tradelens/model/WatchlistItem.java` | Encapsulates watchlist tracking records (`id`, `userId`, `symbol`) enriched with live market pricing. |
| **Data Access Layer (DAO)** | `backend/src/com/tradelens/dao/StockDAO.java` | Executes `SELECT * FROM stocks;`, converts SQL ResultSet rows to `Stock` objects, loads 20 NSE stocks. |
| | `backend/src/com/tradelens/dao/WatchlistDAO.java` | `getWatchlist(userId)`, `addWatchlistItem(userId, symbol)`, `removeWatchlistItem(userId, symbol)`, duplicate validation. |
| **REST API Handlers** | `backend/src/com/tradelens/server/handlers/WatchlistHandler.java` | Endpoints for `/api/watchlist` (`GET`, `POST`, `DELETE`) with session token verification. |
| | `backend/src/com/tradelens/server/handlers/OrdersHandler.java` | Endpoints for `/api/orders` (order history, newest first) and `/api/holdings` (active portfolio holdings with market value). |
| **QA / Testing** | `backend/test_api.ps1` | Comprehensive test suite covering 25 test cases (positive & negative edge cases) with 100% pass rate. |

---

## 3. System Architecture

```
[ React.js Frontend Dashboard (:5173) ]
       │ HTTP (JSON over REST)
       ▼
[ Java HTTP Server (:8080) ]
       │
  ┌────┴─────────────────────────────────────────────┐
  ▼                                                  ▼
[Arnav's REST Handlers]                     [Teammates' REST Handlers]
• WatchlistHandler (/api/watchlist)         • AuthHandler (/api/auth)
• OrdersHandler (/api/orders, /api/holdings)• TradeHandler (/api/trade)
• JavaLabHandler (/api/lab, /api/export)    • AccountHandler (/api/account)
                                            • StockHandler (/api/stocks)
  │                                                  │
  ▼                                                  ▼
[Arnav's DAOs]                              [Teammates' DAOs]
• StockDAO                                  • UserDAO
• WatchlistDAO                              • HoldingsDAO
                                            • OrderDAO
  │                                                  │
  └────────────────────────┬─────────────────────────┘
                           ▼
               [ DBConnectionManager ]
                           │ JDBC
                           ▼
        [ MySQL 8.0 Database (tradelens_db) ]
```

---

## 4. Prerequisites

1. **Java Development Kit (JDK):** Version 17, 21, or 25.
2. **MySQL Community Server:** Version 8.0 or newer (Running on `localhost:3306`).
3. **Node.js & npm:** Node.js v18+ (tested with v24.14.1).
4. **PowerShell:** Standard Windows PowerShell 5.1+ or PowerShell 7.

---

## 5. Quick Start & Execution

### Option A: One-Click Master Launcher (Recommended)
Simply double-click:
```cmd
start_tradelens.bat
```
This automatically boots:
1. Java REST Backend on `http://localhost:8080/api/`
2. React Frontend Dashboard on `http://localhost:5173/`

### Option B: Manual Command-Line Startup

**Terminal 1 — Backend:**
```powershell
cd backend
.\run.bat
```

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm run dev
```

**Terminal 3 — Run Automated QA Test Suite:**
```powershell
powershell -ExecutionPolicy Bypass -File backend\test_api.ps1
```

---

## 6. Database Setup & Schema

If not already initialized, load `schema.sql` into MySQL:
```powershell
Get-Content backend\db\schema.sql -Raw | mysql -u root -p
```
*(Enter your MySQL password when prompted)*

### Configuration & Credentials
- **Database Configuration:** Configure credentials securely via `backend/db.properties` (see `backend/db.properties.example`) or via environment variable `DB_PASSWORD`.
- **Demo User:** `investor` | **Password:** `password123` | **Wallet Balance:** ₹5,00,000.00
- **Demo Auth Token:** `demo-token-12345` (Pre-seeded for testing)
- **Equities Seeded:** 20 prominent NSE blue-chip stocks (Reliance, TCS, HDFC Bank, Infosys, ICICI Bank, Tata Motors, Bharti Airtel, ITC, L&T, SBI, Sun Pharma, Maruti Suzuki, Titan, Bajaj Finance, HCL Tech, Kotak Bank, Wipro, Asian Paints, Axis Bank, NTPC).

---

## 7. REST API Documentation

All endpoints expect and return `application/json; charset=UTF-8`. Protected endpoints require an `Authorization: Bearer <token>` header.

### Arnav's Assigned Endpoints
| Method | Endpoint | Auth | Description | Status Codes |
|---|---|:---:|---|---|
| `GET` | `/api/watchlist` | Yes | Retrieves authenticated user's tracked equities. | `200`, `401` |
| `POST` | `/api/watchlist` | Yes | Adds a stock to watchlist (`{"symbol":"INFY"}`). Rejects duplicates. | `201`, `400`, `409` |
| `DELETE` | `/api/watchlist` | Yes | Removes a stock from watchlist (`?symbol=INFY` or body). | `200`, `400`, `404` |
| `GET` | `/api/orders` | Yes | Retrieves user's complete executed order history, sorted newest first. | `200`, `401` |
| `GET` | `/api/holdings` | Yes | Retrieves user's active holdings with live market valuations and P/L. | `200`, `401` |

### Market, Trading & Account Endpoints
| Method | Endpoint | Auth | Description | Status Codes |
|---|---|:---:|---|---|
| `GET` | `/api/health` | No | System health check and database connectivity status. | `200` |
| `GET` | `/api/stocks` | No | All 20 NSE stocks. Supports `?keyword=` and `?sector=` filters. | `200` |
| `GET` | `/api/stocks/detail` | No | Single stock details (`?symbol=TCS`). | `200`, `404` |
| `POST` | `/api/auth/login` | No | Authenticates user; returns bearer token. | `200`, `401` |
| `POST` | `/api/auth/signup` | No | Registers a new investor account. | `201`, `400`, `409` |
| `GET` | `/api/auth/me` | Yes | Profile details of the logged-in user. | `200`, `401` |
| `POST` | `/api/trade/buy` | Yes | Executes a stock purchase (`{"symbol":"TCS","quantity":5}`). | `201`, `400` |
| `POST` | `/api/trade/sell` | Yes | Executes a stock sale (`{"symbol":"TCS","quantity":2}`). | `200`, `400` |
| `GET` | `/api/account` | Yes | Account overview, wallet balance, and net portfolio performance. | `200`, `401` |
| `POST` | `/api/account/deposit` | Yes | Deposits funds into investor wallet (`{"amount":50000}`). | `200`, `400` |

### Java Syllabus Lab Endpoints
| Method | Endpoint | Auth | Description | Status Codes |
|---|---|:---:|---|---|
| `GET` | `/api/lab/threads` | No | Runs live Producer-Consumer simulation with `wait()` and `notifyAll()`. | `200` |
| `GET` | `/api/lab/streams` | No | Runs Stream API pipelines (`filter`, `map`, `sorted`, `summaryStatistics`). | `200` |
| `GET` | `/api/lab/collections` | No | Returns Collections Framework theoretical complexity comparison matrix. | `200` |
| `GET` | `/api/export/csv` | Optional | Streams executed orders directly to browser as downloadable CSV file. | `200` |

---

## 8. Automated QA Test Suite (25 Tests)

To re-run the complete QA suite:
```powershell
powershell -ExecutionPolicy Bypass -File backend\test_api.ps1
```

### Verified Results:
```
[PASS] Health Check | Status: 200
[PASS] Auth: Signup New User | Status: 201
[PASS] Auth: Login Valid | Status: 200
[PASS] Auth: Login Invalid Credentials | Status: 401 (Expected Error Caught)
[PASS] Stocks: Get All Stocks | Status: 200
[PASS] Stocks: Search Keyword | Status: 200
[PASS] Stocks: Get Detail Valid | Status: 200
[PASS] Stocks: Detail Invalid Symbol | Status: 404 (Expected Error Caught)
[PASS] Watchlist: GET Authorized | Status: 200
[PASS] Watchlist: GET Unauthorized (No Token) | Status: 401 (Expected Error Caught)
[PASS] Watchlist: POST Add Valid (SUNPHARMA) | Status: 201
[PASS] Watchlist: POST Duplicate Stock (409) | Status: 409 (Expected Error Caught)
[PASS] Watchlist: POST Nonexistent Stock (400) | Status: 400 (Expected Error Caught)
[PASS] Watchlist: DELETE Remove Stock | Status: 200
[PASS] Holdings: GET Authorized | Status: 200
[PASS] Orders: GET History Authorized | Status: 200
[PASS] Trade: BUY Shares Valid | Status: 201
[PASS] Trade: BUY Zero Quantity (400) | Status: 400 (Expected Error Caught)
[PASS] Trade: BUY Negative Quantity (400) | Status: 400 (Expected Error Caught)
[PASS] Trade: SELL Shares Valid | Status: 200
[PASS] Trade: SELL Excessive Shares (400) | Status: 400 (Expected Error Caught)
[PASS] Account: GET Overview | Status: 200
[PASS] Account: POST Deposit Funds | Status: 200
[PASS] Account: Deposit Negative Amount (400) | Status: 400 (Expected Error Caught)
[PASS] Invalid Method on /api/orders (405) | Status: 405 (Expected Error Caught)
==========================================================
QA SUITE FINISHED: 25 TEST CASES EVALUATED | 100% PASS RATE
==========================================================
```

---

## 9. Core Java Syllabus Implementation Reference

| Syllabus Requirement | TradeLens Implementation File | Technical Implementation Details |
| :--- | :--- | :--- |
| **OOP Encapsulation** | `model/Stock.java`, `Holding.java`, `Order.java` | All fields `private`; strict getters/setters with invariant validation. |
| **Financial Math Precision** | `model/Stock.java`, `Holding.java` | Exclusively uses `BigDecimal` with `RoundingMode.HALF_UP` to prevent IEEE 754 floating-point errors. |
| **Weighted Average Math** | `model/Holding.java`, `dao/HoldingsDAO.java` | $\text{New Avg} = \frac{(\text{Old Qty} \times \text{Old Avg}) + (\text{New Qty} \times \text{New Price})}{\text{Old Qty} + \text{New Qty}}$. Selling keeps avg price unchanged. |
| **JDBC API & PreparedStatement** | `dao/StockDAO.java`, `dao/WatchlistDAO.java` | Precompiled parameterized queries preventing SQL injection; `try-with-resources` resource closure. |
| **Relational SQL JOINs** | `dao/WatchlistDAO.java` | `INNER JOIN stocks ON watchlist.symbol = stocks.symbol` fetches live prices in a single round-trip. |
| **Multithreading (Daemon & Lifecycle)** | `simulator/MarketSimulatorThread.java` | `extends Thread`, `setDaemon(true)`, `Thread.sleep(8000)`, updates 5 random stocks in MySQL periodically. |
| **Multithreading (`wait()` / `notifyAll()`)** | `simulator/ProducerConsumerOrderQueue.java` | Shared bounded buffer (capacity 3); producer calls `wait()` when full; consumer calls `wait()` when empty. |
| **Generics & Bounded Types** | `dao/GenericDAO.java`, `model/Identifiable.java` | Bounded type parameters `<T extends Identifiable<ID>, ID>` enforcing compile-time type safety. |
| **Character Stream File I/O** | `util/CSVFileHandler.java` | `FileWriter`, `BufferedWriter`, `FileReader`, and `BufferedReader` to generate and parse CSV files. |
| **Stream API Pipelines** | `util/JavaConceptsBenchmark.java` | `filter()`, `map()`, `sorted()`, `distinct()`, `limit()`, `skip()`, `reduce()`, `DoubleSummaryStatistics`, `groupingBy()`. |
| **Collections Framework** | Multiple files across project | `ArrayList` (order ledgers), `LinkedList` (FIFO buffer), `HashMap` (sessions), `TreeMap` (sorted dates), `HashSet` (unique checks). |

---

## 10. Viva Voce & Evaluation Preparation

Detailed study notes and examiner Q&As are available in:
- **Project Report**: [`PROJECT_REPORT.md`](file:///c:/Users/Arnav/OneDrive/Desktop/Tradelens.first/PROJECT_REPORT.md)
- **High-Yield Viva Cheatsheet**: [`VIVA_CHEATSHEET.md`](file:///c:/Users/Arnav/OneDrive/Desktop/Tradelens.first/VIVA_CHEATSHEET.md)
- **Interactive Web Guide**: Accessible in the frontend at `http://localhost:5173/app/viva`.

---

TradeLens © 2026 • Bachelor of Engineering (Computer Science & Engineering)
