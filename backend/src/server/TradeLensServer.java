package server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import server.handlers.AuthHandler;
import server.handlers.BaseHandler;
import server.handlers.TradeHandler;
import util.JsonUtil;

import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.Executors;

/**
 * TradeLens Core Java HTTP Server (Port 8080).
 * Bridges the React frontend with Java business logic, multithreading, and MySQL DAOs.
 */
public class TradeLensServer {

    public static final int PORT = 8080;

    /** Shared live NSE stock map (populated by Person 2's MarketSimulatorThread once merged). */
    private static final Map<String, Map<String, Object>> LIVE_STOCKS = new LinkedHashMap<>();
    private static final Random RANDOM = new Random();

    static {
        seedInitialStocks();
    }

    public static void main(String[] args) throws Exception {
        // Start lightweight tick simulator so /api/stocks streams live prices immediately
        startDefaultMarketTicker();

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // Abhirath's Core Routes
        server.createContext("/api/auth", new AuthHandler());
        server.createContext("/api/buy", new TradeHandler());
        server.createContext("/api/sell", new TradeHandler());
        server.createContext("/api/portfolio", new TradeHandler());

        // Built-in /api/stocks route (swap with Person 2's StockHandler once merged)
        server.createContext("/api/stocks", new StockFeedHandler());

        // TODO: Register teammates' handlers as they merge:
        // server.createContext("/api/account", new AccountHandler());       // Person 3
        // server.createContext("/api/watchlist", new WatchlistHandler());   // Person 4
        // server.createContext("/api/orders", new OrdersHandler());         // Person 4
        // server.createContext("/api/holdings", new OrdersHandler());       // Person 4

        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
        System.out.println("TradeLens Java Server running on http://localhost:" + PORT);
    }

    public static double getStockPrice(String symbol) {
        synchronized (LIVE_STOCKS) {
            Map<String, Object> s = LIVE_STOCKS.get(symbol);
            if (s != null) {
                return ((Number) s.get("price")).doubleValue();
            }
            return 1000.0;
        }
    }

    /** Handles GET /api/stocks and GET /api/stocks?symbol=RELIANCE */
    private static class StockFeedHandler extends BaseHandler {
        @Override
        protected void handleRequest(HttpExchange exchange) throws Exception {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, JsonUtil.error("Method not allowed"));
                return;
            }
            String query = exchange.getRequestURI().getQuery();
            if (query != null && query.startsWith("symbol=")) {
                String symbol = query.substring(7).trim().toUpperCase();
                synchronized (LIVE_STOCKS) {
                    Map<String, Object> stock = LIVE_STOCKS.get(symbol);
                    if (stock == null) {
                        sendJson(exchange, 404, JsonUtil.error("Stock not found: " + symbol));
                        return;
                    }
                    sendJson(exchange, 200, JsonUtil.toJson(stock));
                }
            } else {
                List<Map<String, Object>> list;
                synchronized (LIVE_STOCKS) {
                    list = new ArrayList<>(LIVE_STOCKS.values());
                }
                sendJson(exchange, 200, JsonUtil.toJsonList(list));
            }
        }
    }

    private static void startDefaultMarketTicker() {
        Thread ticker = new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(1500);
                    synchronized (LIVE_STOCKS) {
                        for (Map<String, Object> s : LIVE_STOCKS.values()) {
                            double price = ((Number) s.get("price")).doubleValue();
                            double open = ((Number) s.get("open")).doubleValue();
                            double deltaPct = (RANDOM.nextDouble() - 0.495) * 0.004;
                            double nextPrice = Math.max(10.0, Math.round(price * (1.0 + deltaPct) * 100.0) / 100.0);
                            double change = Math.round((nextPrice - open) * 100.0) / 100.0;
                            double changePct = open > 0 ? Math.round((change / open) * 10000.0) / 100.0 : 0.0;
                            double high = Math.max(((Number) s.get("high")).doubleValue(), nextPrice);
                            double low = Math.min(((Number) s.get("low")).doubleValue(), nextPrice);

                            s.put("price", nextPrice);
                            s.put("change", change);
                            s.put("changePercent", changePct);
                            s.put("high", high);
                            s.put("low", low);
                        }
                    }
                } catch (InterruptedException ignored) {
                    break;
                }
            }
        }, "MarketTicker-Daemon");
        ticker.setDaemon(true);
        ticker.start();
    }

    private static void seedInitialStocks() {
        addStock("RELIANCE", "Reliance Industries Ltd.", "Energy & Telecom", 1284.50, 1269.00, "8.42M", "₹17.38L Cr", "25.4");
        addStock("TCS", "Tata Consultancy Services Ltd.", "IT Services", 4142.80, 4110.00, "2.18M", "₹14.98L Cr", "31.2");
        addStock("HDFCBANK", "HDFC Bank Ltd.", "Banking", 1742.30, 1755.00, "11.65M", "₹13.28L Cr", "19.8");
        addStock("INFY", "Infosys Ltd.", "IT Services", 1865.75, 1844.00, "5.94M", "₹7.74L Cr", "28.1");
        addStock("ICICIBANK", "ICICI Bank Ltd.", "Banking", 1298.40, 1285.00, "9.31M", "₹9.15L Cr", "18.9");
        addStock("SBIN", "State Bank of India", "Banking", 814.60, 821.50, "14.20M", "₹7.27L Cr", "10.6");
        addStock("BHARTIARTL", "Bharti Airtel Ltd.", "Telecom", 1592.15, 1571.00, "4.75M", "₹9.06L Cr", "52.4");
        addStock("ITC", "ITC Ltd.", "FMCG", 478.25, 475.50, "12.80M", "₹5.98L Cr", "28.7");
        addStock("TATAMOTORS", "Tata Motors Ltd.", "Automotive", 786.90, 801.00, "16.40M", "₹2.89L Cr", "9.4");
        addStock("LT", "Larsen & Toubro Ltd.", "Infrastructure", 3588.40, 3550.00, "1.95M", "₹4.93L Cr", "36.2");
        addStock("AXISBANK", "Axis Bank Ltd.", "Banking", 1154.20, 1146.00, "7.85M", "₹3.57L Cr", "13.4");
        addStock("KOTAKBANK", "Kotak Mahindra Bank Ltd.", "Banking", 1768.90, 1778.00, "4.12M", "₹3.51L Cr", "18.2");
        addStock("WIPRO", "Wipro Ltd.", "IT Services", 564.35, 557.20, "6.40M", "₹2.95L Cr", "24.8");
        addStock("HINDUNILVR", "Hindustan Unilever Ltd.", "FMCG", 2418.60, 2435.00, "1.64M", "₹5.68L Cr", "55.1");
        addStock("SUNPHARMA", "Sun Pharmaceutical Ind.", "Pharma", 1812.45, 1789.00, "2.31M", "₹4.35L Cr", "39.4");
        addStock("MARUTI", "Maruti Suzuki India Ltd.", "Automotive", 11240.00, 11125.00, "4.82L", "₹3.53L Cr", "25.9");
        addStock("BAJFINANCE", "Bajaj Finance Ltd.", "Financials", 6785.50, 6842.00, "1.12M", "₹4.20L Cr", "27.6");
        addStock("TATASTEEL", "Tata Steel Ltd.", "Metals", 144.85, 142.80, "28.40M", "₹1.81L Cr", "38.2");
        addStock("ASIANPAINT", "Asian Paints Ltd.", "Consumer", 2496.15, 2518.00, "1.38M", "₹2.39L Cr", "49.5");
        addStock("ADANIENT", "Adani Enterprises Ltd.", "Conglomerate", 2842.70, 2801.00, "3.15M", "₹3.28L Cr", "64.2");
    }

    private static void addStock(
            String symbol, String name, String sector, double price, double open, String volume, String marketCap, String pe
    ) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("symbol", symbol);
        s.put("name", name);
        s.put("exchange", "NSE");
        s.put("sector", sector);
        s.put("price", price);
        s.put("open", open);
        s.put("high", Math.max(price, open));
        s.put("low", Math.min(price, open));
        s.put("change", Math.round((price - open) * 100.0) / 100.0);
        s.put("changePercent", Math.round(((price - open) / open) * 10000.0) / 100.0);
        s.put("volume", volume);
        s.put("marketCap", marketCap);
        s.put("peRatio", pe);
        s.put("isLive", true);
        LIVE_STOCKS.put(symbol, s);
    }
}
