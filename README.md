# TradeLens — Frontend UI

A clean, bright-mode stock tracking and watchlist frontend built with **HTML, CSS, JavaScript, and basic React (via UMD)** — with no build step and no backend.

## Included Views
- **Login & Signup** (`js/components/AuthPages.js`) — Account creation, sign-in, and one-click demo access.
- **Dashboard** (`js/components/DashboardPage.js` + `js/components/StockChart.js`) — Market strip, interactive SVG stock graph (Line/Area & Candlestick modes, `1D` / `1W` / `1M` / `3M` / `1Y` timeframes, hover OHLCV crosshair), key fundamentals, and ticker switcher.
- **Wishlist** (`js/components/WishlistPage.js`) — Saved stocks with 7-day sparklines, target prices, notes, and quick jump to chart.
- **Settings** (`js/components/SettingsPage.js`) — Live stock data API key configuration (Finnhub, Alpha Vantage, Twelve Data), currency (`USD` / `INR`), and default chart preferences.
- **Account** (`js/components/AccountPage.js`) — Profile details, Java REST API base URL setting, and sign out.

## Running the Frontend
Open `index.html` directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 5500
```
Then visit `http://localhost:5500`.

You can also copy this entire folder into a Java Spring Boot (`src/main/resources/static/`) or Java Servlet (`src/main/webapp/`) project.

## Connecting Your Java + MySQL Backend Later
All auth, wishlist, and settings calls are isolated in `js/api.js` (currently backed by `localStorage`).
Recommended MySQL tables for your Java backend:

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  trading_style VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlist (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  symbol VARCHAR(16) NOT NULL,
  target_price VARCHAR(20),
  note VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_settings (
  user_id BIGINT PRIMARY KEY,
  provider VARCHAR(32) DEFAULT 'finnhub',
  api_key VARCHAR(255),
  currency VARCHAR(8) DEFAULT 'USD',
  default_timeframe VARCHAR(8) DEFAULT '1M',
  default_chart_type VARCHAR(16) DEFAULT 'area',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

