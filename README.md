# TradeLens

A full-stack **Indian Stock Market (NSE) Portfolio & Trading Application** built with a **Core Java (`com.sun.net.httpserver.HttpServer`) + JDBC + Multithreading** backend, **MySQL (Aiven Cloud)** database, and a **React** frontend.

---

## Key Features

- **Authentication & KYC Profile:** Signup, login, Bearer-token sessions, PAN Card, phone, DOB, trading focus, and Bank/Demat account management.
- **Live Market Dashboard:** Interactive SVG stock charts (**Line** & **Candles** modes) across `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, and `5Y` timeframes with hover price tooltips, period-matched green/red coloring, and live moving ticks.
- **All Shares Screener:** Full directory of 20 NSE equities with sector filters, sorting (Top Gainers, Top Losers, Highest Price), 7D sparklines, and instant `↻ Live` price refresh.
- **Order Execution (Market & Limit):**
  - `MARKET` orders execute atomically in MySQL (`setAutoCommit(false)` → `commit()` / `rollback()`).
  - `LIMIT` orders queue in a `PriorityQueue<Order>` and are matched automatically by a Producer-Consumer background engine (`wait()` / `notifyAll()`).
- **Portfolio, Holdings & Orders:** Real-time Portfolio valuation, Day's P&L, Unrealized P&L, Asset Mix, Sector Allocation, virtual funds deposit, and full Order Book history.
- **Watchlist:** Star/unstar NSE shares with live prices and 7D trend sparklines.

---

## Architecture & Project Structure

```text
TradeLens/
├── index.html                          # React 18 frontend entry point
├── css/styles.css                      # Bright light-mode UI stylesheet
├── js/
│   ├── data.js                         # 20 NSE stocks seed & chart series generator
│   ├── api.js                          # Java REST client (with offline demo fallback)
│   ├── app.js                          # Root app shell & navigation
│   └── components/
│       ├── AuthPages.js                # Login & Signup
│       ├── DashboardPage.js            # Live chart, order ticket & NSE market watch
│       ├── MarketsPage.js              # All 20 NSE shares screener
│       ├── WatchlistPage.js            # Watched stocks table
│       ├── PortfolioPage.js            # Valuation, Day's P&L, Asset Mix & Sectors
│       ├── HoldingsPage.js             # Equity holdings & P&L
│       ├── OrdersPage.js               # Order history (ALL / BUY / SELL)
│       ├── SettingsPage.js             # Currency, timeframe & chart style settings
│       ├── AccountPage.js              # KYC profile & Bank/Demat details
│       └── StockChart.js               # Interactive SVG Line & Candlestick chart
└── backend/
    ├── compile.bat                     # Windows batch compile script
    ├── db.properties.example           # Template for Aiven MySQL & API credentials
    ├── db/schema.sql                   # MySQL schema (5 tables) + 20 NSE stocks seed
    ├── lib/mysql-connector-j.jar       # MySQL JDBC Driver
    └── src/com/tradelens/
        ├── exceptions/                 # TradingExceptions (InsufficientFunds, etc.)
        ├── model/                      # User, Stock, Holding, Order, WatchlistItem
        ├── dao/                        # DBConnectionManager, UserDAO, StockDAO,
        │                               # HoldingsDAO, OrderDAO, WatchlistDAO,
        │                               # TransactionalHoldingsDAO, TransactionalOrderDAO,
        │                               # TradeExecutionService
        ├── engine/                     # MarketDataStore, MarketSimulatorThread (Producer),
        │                               # OrderMatcherThread (Consumer)
        ├── util/                       # JsonUtil (zero-dependency JSON), SessionManager
        └── server/
            ├── TradeLensServer.java    # Main entry point (port 8080)
            ├── HttpServerApp.java      # HttpServer routes + static frontend server
            └── handlers/               # AuthHandler, TradeHandler, PortfolioHandler,
                                        # StockHandler, AccountHandler, WatchlistHandler,
                                        # OrdersHandler
```

---

## MySQL Database Schema

Defined in `backend/db/schema.sql`:
1. **`users`** — Auth credentials, `trade_id`, KYC (`pan_card`, `phone`, `dob`, `kyc_status`), Bank/Demat details, and `wallet_balance`.
2. **`stocks`** — 20 NSE equities (`RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `ICICIBANK`, `SBIN`, `BHARTIARTL`, `ITC`, `TATAMOTORS`, `LT`, `AXISBANK`, `KOTAKBANK`, `WIPRO`, `HINDUNILVR`, `SUNPHARMA`, `MARUTI`, `BAJFINANCE`, `TATASTEEL`, `ASIANPAINT`, `ADANIENT`).
3. **`holdings`** — Active share quantities and average buy prices per user.
4. **`orders`** — `BUY`/`SELL` (`MARKET`/`LIMIT`) order ledger.
5. **`watchlist`** — Saved stocks per user.

---

## REST API Endpoints (`http://localhost:8080/api`)

| Endpoint | Methods | Description |
| :--- | :--- | :--- |
| `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout` | `POST` | Register, authenticate, and manage Bearer tokens |
| `/api/stocks`, `/api/stocks?symbol=RELIANCE` | `GET` | Live NSE stock prices from `MarketDataStore` |
| `/api/buy`, `/api/sell`, `/api/trade/buy`, `/api/trade/sell` | `POST` | Execute `MARKET` trades or queue `LIMIT` orders |
| `/api/portfolio`, `/api/portfolio/deposit` | `GET`, `POST` | Fetch cash, holdings, orders & deposit virtual funds |
| `/api/holdings`, `/api/orders` | `GET` | Fetch current holdings and order history |
| `/api/watchlist` | `GET`, `POST`, `DELETE` | View, add, or remove watched NSE stocks |
| `/api/account` | `GET`, `PUT` | View or update KYC and Bank/Demat details |
| `/api/health` | `GET` | Server and database health check |

---

## Setup & Running Locally

### 1. Configure Credentials
Copy `backend/db.properties.example` to `backend/db.properties` *(Git-ignored)* and fill in your MySQL (Aiven or local) and market API details:
```properties
db.url=jdbc:mysql://<HOST>:<PORT>/<DB>?sslMode=REQUIRED&serverTimezone=UTC
db.user=avnadmin
db.password=<YOUR_PASSWORD>

api.provider=tapetide
api.baseUrl=https://api.tapetide.com/v1
api.token=<YOUR_API_TOKEN>
```

### 2. Initialize MySQL Tables
```bash
mysql -h <HOST> -P <PORT> -u avnadmin -p --ssl-mode=REQUIRED defaultdb < backend/db/schema.sql
```

### 3. Compile & Start the Java Server
From the `backend/` directory (requires **JDK 17+**):
```bash
mkdir -p bin
javac -cp "lib/*" -d bin src/com/tradelens/exceptions/*.java src/com/tradelens/model/*.java src/com/tradelens/dao/*.java src/com/tradelens/engine/*.java src/com/tradelens/util/*.java src/com/tradelens/server/handlers/*.java src/com/tradelens/server/*.java
java -cp "bin:lib/*" com.tradelens.server.TradeLensServer
```

### 4. Open TradeLens
Open **`http://localhost:8080`** in your browser.
- **Demo Account:** `demo@tradelens.in` / `demo1234` (or click **Continue with Demo Account**).
