import React, { useState } from 'react';
import { BookOpen, Code2, Database, ShieldCheck, CheckCircle2, HelpCircle, ChevronRight, Layers, Terminal } from 'lucide-react';

const vivaModules = [
  {
    id: 'stock-model',
    title: '1. model/Stock.java',
    category: 'Data Model',
    purpose: 'Represents a publicly traded stock on the National Stock Exchange (NSE).',
    whyNeeded: 'TradeLens requires a strongly typed domain object to hold stock symbols, company names, sectors, and price metrics cleanly without floating-point inaccuracies.',
    javaConcepts: 'OOP Encapsulation (private fields, getters/setters), BigDecimal for exact currency rounding (RoundingMode.HALF_UP), Derived calculations (getPriceChange, getChangePercentage).',
    sqlConcepts: 'Maps directly to the MySQL `stocks` table (`symbol` VARCHAR(20) PRIMARY KEY, `current_price` DECIMAL(12, 2)).',
    evaluatorQA: [
      {
        q: 'Why did you use BigDecimal instead of double or float for stock prices?',
        a: 'Floating-point types (float and double) represent numbers in binary IEEE 754 format and suffer from rounding inaccuracies (e.g. 0.1 + 0.2 = 0.30000000000000004). In financial applications, BigDecimal guarantees exact decimal precision and controlled rounding (HALF_UP).'
      },
      {
        q: 'How does your model ensure data integrity for stock symbols?',
        a: 'The setSymbol() method trims whitespace and converts the ticker to uppercase, guaranteeing consistent lookups in the database.'
      }
    ]
  },
  {
    id: 'holding-model',
    title: '2. model/Holding.java',
    category: 'Data Model',
    purpose: 'Represents an investor\'s active shareholdings and cost basis for a specific stock.',
    whyNeeded: 'Calculates portfolio valuations, total invested capital, unrealized capital gains/losses, and percentage returns.',
    javaConcepts: 'Encapsulation, Constructor overloading, Dynamic calculation methods for Total Invested (quantity * avgBuyPrice), Current Value (quantity * currentPrice), and Unrealized P/L.',
    sqlConcepts: 'Maps to the MySQL `holdings` table with a UNIQUE composite constraint on `(user_id, symbol)`.',
    evaluatorQA: [
      {
        q: 'How do you calculate Weighted-Average Purchase Price when buying more shares?',
        a: 'New Average Price = ((Old Quantity * Old Average Price) + (New Purchase Quantity * New Buy Price)) / (Old Quantity + New Quantity). This ensures past purchase lots are accurately weighted.'
      },
      {
        q: 'What happens to average purchase price when you sell some shares?',
        a: 'The average purchase price per share remains unchanged. Selling reduces the share count, while the cost basis per remaining share stays identical.'
      }
    ]
  },
  {
    id: 'order-model',
    title: '3. model/Order.java',
    category: 'Data Model',
    purpose: 'Encapsulates a buy or sell trade order execution record.',
    whyNeeded: 'Maintains an immutable historical audit log of trades with status, execution timestamp, and order mode.',
    javaConcepts: 'Encapsulation, DateTimeFormatter for readable ISO timestamps, Order status enums/strings ("COMPLETED", "PENDING", "CANCELLED").',
    sqlConcepts: 'Maps to the MySQL `orders` table with foreign keys referencing `users(id)` and `stocks(symbol)`.',
    evaluatorQA: [
      {
        q: 'What is the difference between a MARKET order and a LIMIT order?',
        a: 'A MARKET order executes immediately at the prevailing market price. A LIMIT order specifies a maximum buy or minimum sell price threshold.'
      }
    ]
  },
  {
    id: 'watchlist-model',
    title: '4. model/WatchlistItem.java',
    category: 'Data Model',
    purpose: 'Represents a tracked equity in an investor\'s personal radar.',
    whyNeeded: 'Allows investors to monitor stocks they do not yet own without requiring capital allocation.',
    javaConcepts: 'Encapsulation, composition with live market data fields for rich UI presentation.',
    sqlConcepts: 'Maps to MySQL `watchlist` table with UNIQUE(user_id, symbol) constraint preventing duplicate tracking.',
    evaluatorQA: [
      {
        q: 'Why is WatchlistItem separate from Holding?',
        a: 'Watchlist represents intention to monitor (0 shares owned, no capital invested). Holding represents actual financial equity ownership with cost basis and risk.'
      }
    ]
  },
  {
    id: 'stock-dao',
    title: '5. dao/StockDAO.java',
    category: 'Data Access Layer',
    purpose: 'Executes SQL queries against MySQL to fetch all stocks and map ResultSet rows to Stock objects.',
    whyNeeded: 'Decouples database operations from business logic and HTTP handlers (DAO Design Pattern).',
    javaConcepts: 'JDBC API (Connection, PreparedStatement, ResultSet), try-with-resources (AutoCloseable), Collections Framework (ArrayList<Stock>).',
    sqlConcepts: 'Executes `SELECT symbol, company_name, sector, current_price, previous_close, day_high, day_low FROM stocks ORDER BY symbol ASC;`.',
    evaluatorQA: [
      {
        q: 'Why do you use PreparedStatement instead of Statement?',
        a: '1. Security: PreparedStatement precompiles SQL and binds parameters separately, completely preventing SQL Injection attacks. 2. Performance: Precompiled statements are cached and executed faster.'
      },
      {
        q: 'What is try-with-resources and why is it used in StockDAO?',
        a: 'It is a Java feature introduced in Java 7 where resources implementing java.lang.AutoCloseable (like Connection, PreparedStatement, ResultSet) are automatically closed when the try block exits, preventing connection leaks even if an exception is thrown.'
      }
    ]
  },
  {
    id: 'watchlist-dao',
    title: '6. dao/WatchlistDAO.java',
    category: 'Data Access Layer',
    purpose: 'Manages CRUD operations on the `watchlist` table with duplicate prevention and stock validation.',
    whyNeeded: 'Ensures users can only read, add, or remove stocks from their own watchlist.',
    javaConcepts: 'JDBC Parameterized Queries, synchronized write safety, custom validation logic.',
    sqlConcepts: 'SQL INNER JOIN between `watchlist` and `stocks` to enrich watchlist records with live prices; INSERT and DELETE queries.',
    evaluatorQA: [
      {
        q: 'How does your WatchlistDAO prevent duplicate stock entries for the same user?',
        a: 'We use a two-tier protection: 1. Application-level check via isAlreadyInWatchlist() before inserting. 2. Database-level UNIQUE constraint on (user_id, symbol) in MySQL.'
      },
      {
        q: 'How does the SQL INNER JOIN work in getWatchlist()?',
        a: 'It combines rows from `watchlist` with corresponding rows from `stocks` where watchlist.symbol = stocks.symbol, returning the company name and current market price in a single query.'
      }
    ]
  },
  {
    id: 'watchlist-handler',
    title: '7. server/handlers/WatchlistHandler.java',
    category: 'REST API Handler',
    purpose: 'Handles HTTP GET, POST, and DELETE requests on the `/api/watchlist` endpoint.',
    whyNeeded: 'Exposes watchlist operations to the frontend over RESTful HTTP while enforcing session token authentication.',
    javaConcepts: 'com.sun.net.httpserver.HttpHandler, Switch expressions, Stream I/O reading request body, CORS headers negotiation.',
    sqlConcepts: 'Calls WatchlistDAO methods after resolving authenticated userId.',
    evaluatorQA: [
      {
        q: 'How do you prevent User A from accessing User B\'s watchlist?',
        a: 'We never accept userId from the request body or URL query. Instead, we extract the authenticated userId exclusively from the verified session token via SessionManager.extractAuthenticatedUserId(exchange).'
      },
      {
        q: 'What HTTP status codes do you return?',
        a: '200 OK for successful retrieval/deletion, 201 Created for adding, 400 Bad Request for missing fields, 401 Unauthorized for missing tokens, 409 Conflict for duplicate entries, and 405 Method Not Allowed.'
      }
    ]
  },
  {
    id: 'orders-handler',
    title: '8. server/handlers/OrdersHandler.java',
    category: 'REST API Handler',
    purpose: 'Handles HTTP GET on `/api/orders` and `/api/holdings`.',
    whyNeeded: 'Provides the frontend dashboard with active portfolio holdings and chronological order history.',
    javaConcepts: 'REST endpoint path dispatching, JSON serialization, separation of concerns.',
    sqlConcepts: 'Calls OrderDAO and HoldingsDAO to fetch user-specific records.',
    evaluatorQA: [
      {
        q: 'How are orders sorted in the order history endpoint?',
        a: 'They are sorted newest first via `ORDER BY created_at DESC` in SQL so the user immediately sees their most recent trades at the top.'
      }
    ]
  }
];

export default function VivaGuidePage() {
  const [selectedModule, setSelectedModule] = useState(vivaModules[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#1F293D]">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Arnav's Java & JDBC Viva Preparation Guide</h1>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
            Member 4 Syllabus Defense
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Master every file, architecture decision, JDBC concept, and evaluator question for your college presentation.
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Selector Sidebar */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 pb-1">
            Arnav's Assigned Modules
          </div>
          {vivaModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setSelectedModule(mod)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                selectedModule.id === mod.id
                  ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-[#161F30] border-[#1F293D] text-slate-400 hover:text-white hover:border-[#2E3D59]'
              }`}
            >
              <div>
                <div className="text-xs font-bold">{mod.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{mod.category}</div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-slate-500" />
            </button>
          ))}
        </div>

        {/* Detailed Module View */}
        <div className="lg:col-span-2 bg-[#161F30] border border-[#1F293D] rounded-2xl p-6 glow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#1F293D]">
            <div>
              <span className="text-xs font-mono uppercase text-emerald-400 font-bold">{selectedModule.category}</span>
              <h2 className="text-xl font-extrabold text-white mt-0.5">{selectedModule.title}</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#111827] border border-[#1F293D] text-slate-300">
              Arnav's Implementation
            </span>
          </div>

          {/* Section: Purpose & Why Needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1F293D] space-y-1">
              <span className="font-bold text-blue-400 block uppercase tracking-wider text-[10px]">1. Purpose</span>
              <p className="text-slate-300 leading-relaxed">{selectedModule.purpose}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1F293D] space-y-1">
              <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[10px]">2. Why Needed</span>
              <p className="text-slate-300 leading-relaxed">{selectedModule.whyNeeded}</p>
            </div>
          </div>

          {/* Section: Concepts Used */}
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1F293D] space-y-1">
              <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[10px]">3. Java & OOP Concepts</span>
              <p className="text-slate-300 leading-relaxed font-mono">{selectedModule.javaConcepts}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1F293D] space-y-1">
              <span className="font-bold text-amber-400 block uppercase tracking-wider text-[10px]">4. SQL & Database Concepts</span>
              <p className="text-slate-300 leading-relaxed font-mono">{selectedModule.sqlConcepts}</p>
            </div>
          </div>

          {/* Section: Evaluator Questions & Answers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Questions an Evaluator Might Ask You (With Ideal Answers)</span>
            </div>

            <div className="space-y-3">
              {selectedModule.evaluatorQA.map((qa, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#111827] border border-[#1F293D] space-y-2 text-xs">
                  <div className="font-bold text-white flex items-start gap-2">
                    <span className="text-blue-400 font-mono">Q{idx + 1}:</span>
                    <span>{qa.q}</span>
                  </div>
                  <div className="text-slate-300 pl-6 leading-relaxed border-l-2 border-emerald-500/40">
                    <span className="text-emerald-400 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">Your Answer:</span>
                    <span>{qa.a}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
