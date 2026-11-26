package com.tradelens.simulator;

import com.tradelens.dao.DBConnectionManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * TradeLens - Market Simulator Background Thread (Teammate Module)
 *
 * Demonstrates Core Java Multithreading:
 * - Extends Thread
 * - run(), sleep(), interrupt() lifecycle
 * - Periodically updates simulated market stock prices in MySQL
 */
public class MarketSimulatorThread extends Thread {
    private volatile boolean running = true;
    private final Random random = new Random();

    public MarketSimulatorThread() {
        super("MarketSimulator-Worker");
        setDaemon(true); // Daemon thread terminates when main application terminates
    }

    @Override
    public void run() {
        System.out.println("[MarketSimulatorThread] Started simulated price feed generator.");
        while (running) {
            try {
                Thread.sleep(8000); // Ticks every 8 seconds
                simulateMarketTick();
            } catch (InterruptedException e) {
                System.out.println("[MarketSimulatorThread] Simulator thread interrupted. Shutting down.");
                break;
            } catch (Exception e) {
                System.err.println("[MarketSimulatorThread] Error in simulation tick: " + e.getMessage());
            }
        }
    }

    private void simulateMarketTick() {
        String selectSql = "SELECT symbol, current_price, day_high, day_low FROM stocks ORDER BY RAND() LIMIT 5;";
        String updateSql = "UPDATE stocks SET current_price = ?, day_high = ?, day_low = ? WHERE symbol = ?;";

        try (Connection con = DBConnectionManager.getConnection();
             PreparedStatement psSelect = con.prepareStatement(selectSql);
             PreparedStatement psUpdate = con.prepareStatement(updateSql);
             ResultSet rs = psSelect.executeQuery()) {

            while (rs.next()) {
                String symbol = rs.getString("symbol");
                BigDecimal current = rs.getBigDecimal("current_price");
                BigDecimal high = rs.getBigDecimal("day_high");
                BigDecimal low = rs.getBigDecimal("day_low");

                // Random fluctuation between -1.2% and +1.5%
                double pctDelta = (random.nextDouble() * 2.7) - 1.2;
                BigDecimal multiplier = BigDecimal.valueOf(1.0 + (pctDelta / 100.0));
                BigDecimal newPrice = current.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);

                if (newPrice.compareTo(high) > 0) high = newPrice;
                if (newPrice.compareTo(low) < 0) low = newPrice;

                psUpdate.setBigDecimal(1, newPrice);
                psUpdate.setBigDecimal(2, high);
                psUpdate.setBigDecimal(3, low);
                psUpdate.setString(4, symbol);
                psUpdate.addBatch();
            }
            psUpdate.executeBatch();
        } catch (Exception e) {
            // Silently continue in simulation
        }
    }

    public void stopSimulation() {
        this.running = false;
        this.interrupt();
    }
}
