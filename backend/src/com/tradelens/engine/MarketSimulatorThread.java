package com.tradelens.engine;

import com.tradelens.dao.DBConnectionManager;
import com.tradelens.dao.StockDAO;
import com.tradelens.model.Stock;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.SQLException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Producer daemon thread:
 * 1. Fetches live NSE quotes from TapeTide API (when token is configured & accessible),
 *    with automatic tick simulation fallback when market is closed or rate-limited.
 * 2. Updates MarketDataStore (which calls notifyAll() for OrderMatcherThread).
 * 3. Persists live stock prices into Aiven MySQL every 10 ticks (~15 seconds).
 */
public class MarketSimulatorThread extends Thread {

    private static final long UPDATE_INTERVAL_MILLIS = 1500L;
    private static final int DB_SYNC_EVERY_TICKS = 10;
    private static final BigDecimal MINIMUM_PRICE = new BigDecimal("0.01");
    private static final Pattern PRICE_PATTERN =
            Pattern.compile("\"(?:price|current_price|currentPrice|ltp|last_price|close)\"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)");

    private final MarketDataStore marketDataStore;
    private final StockDAO stockDAO = new StockDAO();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();

    private final String apiProvider;
    private final String apiBaseUrl;
    private final String apiToken;
    private volatile boolean running = true;
    private volatile boolean liveApiEnabled;
    private int tickCount = 0;

    public MarketSimulatorThread(MarketDataStore marketDataStore) {
        super("TradeLens-MarketSimulator");
        if (marketDataStore == null) {
            throw new IllegalArgumentException("MarketDataStore cannot be null.");
        }
        this.marketDataStore = marketDataStore;
        this.apiProvider = DBConnectionManager.getProperty("api.provider", "tapetide");
        this.apiBaseUrl = DBConnectionManager.getProperty("api.baseUrl", "https://api.tapetide.com/v1");
        this.apiToken = DBConnectionManager.getProperty("api.token", "");
        this.liveApiEnabled = !this.apiToken.isEmpty() && "tapetide".equalsIgnoreCase(this.apiProvider);
        setDaemon(true);
    }

    @Override
    public void run() {
        while (running) {
            try {
                tickCount++;
                // Poll TapeTide live API every 10 ticks (~15s) to respect rate limits; simulate smooth ticks in between
                if (liveApiEnabled && (tickCount == 1 || tickCount % DB_SYNC_EVERY_TICKS == 0)) {
                    fetchLiveTapeTidePrices();
                } else {
                    simulateTick();
                }

                // Persist live stock prices to Aiven MySQL every 10 ticks (~15s)
                if (tickCount % DB_SYNC_EVERY_TICKS == 0) {
                    persistPricesToDatabase();
                }
            } catch (RuntimeException e) {
                reportError("Market simulation tick failed", e);
            }

            try {
                Thread.sleep(UPDATE_INTERVAL_MILLIS);
            } catch (InterruptedException e) {
                running = false;
                Thread.currentThread().interrupt();
            }
        }
    }

    public void stopSimulation() {
        running = false;
        interrupt();
    }

    private void fetchLiveTapeTidePrices() {
        Map<String, Stock> stocks = marketDataStore.getAllStocks();
        int updatedCount = 0;

        for (String symbol : stocks.keySet()) {
            if (!running || Thread.currentThread().isInterrupted()) return;
            try {
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(apiBaseUrl + "/stocks/" + symbol + "/quote"))
                        .timeout(Duration.ofSeconds(4))
                        .header("Authorization", "Bearer " + apiToken)
                        .header("Accept", "application/json")
                        .GET()
                        .build();

                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 200) {
                    BigDecimal livePrice = extractPrice(resp.body());
                    if (livePrice != null && livePrice.compareTo(MINIMUM_PRICE) >= 0) {
                        marketDataStore.updatePrice(symbol, livePrice);
                        updatedCount++;
                    }
                } else if (resp.statusCode() == 401 || resp.statusCode() == 403) {
                    System.err.println("[TradeLens-MarketSimulator] TapeTide returned HTTP " + resp.statusCode()
                            + " — falling back to simulated market ticks.");
                    liveApiEnabled = false;
                    simulateTick();
                    return;
                }
            } catch (Exception e) {
                // Network error or timeout for one symbol; continue smoothly
            }
        }

        if (updatedCount == 0) {
            simulateTick();
        }
    }

    private BigDecimal extractPrice(String json) {
        if (json == null) return null;
        Matcher m = PRICE_PATTERN.matcher(json);
        if (m.find()) {
            return new BigDecimal(m.group(1)).setScale(2, RoundingMode.HALF_UP);
        }
        return null;
    }

    private void persistPricesToDatabase() {
        try {
            stockDAO.updateStockPricesBatch(marketDataStore.getAllStocks().values());
        } catch (SQLException e) {
            System.err.println("[TradeLens-MarketSimulator] Could not sync prices to Aiven MySQL: " + e.getMessage());
        }
    }

    private void simulateTick() {
        Map<String, Stock> stocks = marketDataStore.getAllStocks();
        for (Map.Entry<String, Stock> entry : stocks.entrySet()) {
            if (!running || Thread.currentThread().isInterrupted()) {
                return;
            }

            String symbol = entry.getKey();
            try {
                BigDecimal currentPrice = entry.getValue().getCurrentPrice();
                if (currentPrice == null || currentPrice.compareTo(BigDecimal.ZERO) <= 0) {
                    currentPrice = MINIMUM_PRICE;
                }

                int basisPoints = ThreadLocalRandom.current().nextInt(-50, 51);
                BigDecimal changeRate = BigDecimal.valueOf(basisPoints, 4);
                BigDecimal newPrice = currentPrice
                        .multiply(BigDecimal.ONE.add(changeRate))
                        .setScale(2, RoundingMode.HALF_UP);

                if (newPrice.compareTo(MINIMUM_PRICE) < 0) {
                    newPrice = MINIMUM_PRICE;
                }
                marketDataStore.updatePrice(symbol, newPrice);
            } catch (RuntimeException e) {
                reportError("Failed to update price for " + symbol, e);
            }
        }
    }

    private void reportError(String message, RuntimeException error) {
        System.err.println("[TradeLens-MarketSimulator] " + message + ": " + error.getMessage());
        error.printStackTrace(System.err);
    }
}
