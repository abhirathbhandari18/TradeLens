package com.tradelens.engine;

import com.tradelens.model.Stock;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;

public class MarketDataStore {

    // Protects both the stock map and its version; waiters use this same monitor.
    private final Object lock = new Object();
    private final Map<String, Stock> stocks = new HashMap<>();
    private long priceVersion;

    public void addStock(Stock stock) {
        if (stock == null) {
            throw new IllegalArgumentException("Stock cannot be null.");
        }

        String symbol = normalizeSymbol(stock.getSymbol());
        Stock stockCopy = copyStock(stock, symbol);
        synchronized (lock) {
            stocks.put(symbol, stockCopy);
            notifyPriceChange();
        }
    }

    public void loadStocks(Collection<Stock> initialStocks) {
        if (initialStocks == null) {
            throw new IllegalArgumentException("Stock collection cannot be null.");
        }

        Map<String, Stock> loadedStocks = new HashMap<>();
        for (Stock stock : initialStocks) {
            if (stock == null) {
                throw new IllegalArgumentException("Stock collection cannot contain null.");
            }
            String symbol = normalizeSymbol(stock.getSymbol());
            loadedStocks.put(symbol, copyStock(stock, symbol));
        }

        synchronized (lock) {
            stocks.clear();
            stocks.putAll(loadedStocks);
            notifyPriceChange();
        }
    }

    public Stock getStock(String symbol) {
        String normalizedSymbol = normalizeSymbol(symbol);
        synchronized (lock) {
            Stock stock = stocks.get(normalizedSymbol);
            if (stock == null) {
                throw new NoSuchElementException("No stock found for symbol: " + normalizedSymbol);
            }
            return copyStock(stock, normalizedSymbol);
        }
    }

    public Map<String, Stock> getAllStocks() {
        synchronized (lock) {
            Map<String, Stock> snapshot = new HashMap<>();
            for (Map.Entry<String, Stock> entry : stocks.entrySet()) {
                snapshot.put(entry.getKey(), copyStock(entry.getValue(), entry.getKey()));
            }
            return Collections.unmodifiableMap(snapshot);
        }
    }

    public void updatePrice(String symbol, BigDecimal newPrice) {
        String normalizedSymbol = normalizeSymbol(symbol);
        if (newPrice == null || newPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than zero.");
        }

        BigDecimal roundedPrice = newPrice.setScale(2, RoundingMode.HALF_UP);
        if (roundedPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must remain greater than zero after rounding.");
        }

        synchronized (lock) {
            Stock stock = stocks.get(normalizedSymbol);
            if (stock == null) {
                throw new NoSuchElementException("No stock found for symbol: " + normalizedSymbol);
            }

            stock.setCurrentPrice(roundedPrice);
            if (stock.getDayHigh() == null || roundedPrice.compareTo(stock.getDayHigh()) > 0) {
                stock.setDayHigh(roundedPrice);
            }
            if (stock.getDayLow() == null || roundedPrice.compareTo(stock.getDayLow()) < 0) {
                stock.setDayLow(roundedPrice);
            }
            notifyPriceChange();
        }
    }

    public boolean containsStock(String symbol) {
        String normalizedSymbol = normalizeSymbol(symbol);
        synchronized (lock) {
            return stocks.containsKey(normalizedSymbol);
        }
    }

    public long getPriceVersion() {
        synchronized (lock) {
            return priceVersion;
        }
    }

    /**
     * Waits for a version change. Capture the version before checking prices so
     * an update between that check and this call cannot be missed.
     */
    public long awaitPriceChange(long observedVersion) throws InterruptedException {
        synchronized (lock) {
            // Recheck the condition after every wake-up, including spurious ones.
            while (priceVersion == observedVersion) {
                lock.wait();
            }
            return priceVersion;
        }
    }

    private void notifyPriceChange() {
        // Called while holding lock so the version change and notification are atomic to waiters.
        priceVersion++;
        lock.notifyAll();
    }

    private Stock copyStock(Stock stock, String symbol) {
        return new Stock(
                symbol,
                stock.getCompanyName(),
                stock.getSector(),
                stock.getCurrentPrice(),
                stock.getPreviousClose(),
                stock.getDayHigh(),
                stock.getDayLow());
    }

    private String normalizeSymbol(String symbol) {
        if (symbol == null) {
            throw new IllegalArgumentException("Stock symbol cannot be null or empty.");
        }
        String normalizedSymbol = symbol.trim().toUpperCase(Locale.ROOT);
        if (normalizedSymbol.isEmpty()) {
            throw new IllegalArgumentException("Stock symbol cannot be null or empty.");
        }
        return normalizedSymbol;
    }
}
