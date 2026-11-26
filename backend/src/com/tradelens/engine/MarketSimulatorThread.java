package com.tradelens.engine;

import com.tradelens.model.Stock;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

public class MarketSimulatorThread extends Thread {

    private static final long UPDATE_INTERVAL_MILLIS = 1500L;
    private static final BigDecimal MINIMUM_PRICE = new BigDecimal("0.01");

    private final MarketDataStore marketDataStore;
    private volatile boolean running = true;

    public MarketSimulatorThread(MarketDataStore marketDataStore) {
        super("TradeLens-MarketSimulator");
        if (marketDataStore == null) {
            throw new IllegalArgumentException("MarketDataStore cannot be null.");
        }
        this.marketDataStore = marketDataStore;
        setDaemon(true);
    }

    @Override
    public void run() {
        while (running) {
            try {
                simulateTick();
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
