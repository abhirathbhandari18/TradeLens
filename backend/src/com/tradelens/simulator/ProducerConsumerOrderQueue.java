package com.tradelens.simulator;

import com.tradelens.model.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * TradeLens - Multithreading Producer-Consumer Coordination Lab
 *
 * Demonstrates:
 * 1. Inter-thread communication using wait() and notifyAll().
 * 2. Shared synchronized bounded buffer.
 * 3. Thread lifecycle: NEW -> RUNNABLE -> TIMED_WAITING / WAITING -> TERMINATED.
 * 4. Preventing race conditions via mutual exclusion locks (synchronized).
 */
public class ProducerConsumerOrderQueue {
    private final int capacity;
    private final Queue<Order> buffer = new LinkedList<>();
    private final List<String> eventTraceLogs = Collections.synchronizedList(new ArrayList<>());

    public ProducerConsumerOrderQueue(int capacity) {
        this.capacity = capacity;
    }

    /**
     * Producer method: Inserts an order into the buffer.
     * If the buffer is full, the thread calls wait() and relinquishes the monitor lock.
     */
    public synchronized void produce(Order order, String producerThreadName) throws InterruptedException {
        while (buffer.size() >= capacity) {
            String log = String.format("[%s] BUFFER FULL (%d/%d). Producer thread calling wait()...",
                    producerThreadName, buffer.size(), capacity);
            eventTraceLogs.add(log);
            wait(); // Releases lock and suspends thread until notified
        }

        buffer.offer(order);
        String log = String.format("[%s] PRODUCED order %s for %s (%d shares). Buffer count: %d/%d. Calling notifyAll()...",
                producerThreadName, order.getOrderId(), order.getSymbol(), order.getQuantity(), buffer.size(), capacity);
        eventTraceLogs.add(log);

        notifyAll(); // Wakes up all waiting consumer threads
    }

    /**
     * Consumer method: Retrieves and processes an order from the buffer.
     * If the buffer is empty, the thread calls wait() and relinquishes the monitor lock.
     */
    public synchronized Order consume(String consumerThreadName) throws InterruptedException {
        while (buffer.isEmpty()) {
            String log = String.format("[%s] BUFFER EMPTY (0/%d). Consumer thread calling wait()...",
                    consumerThreadName, capacity);
            eventTraceLogs.add(log);
            wait(); // Releases lock and suspends thread until notified
        }

        Order order = buffer.poll();
        String log = String.format("[%s] CONSUMED & SETTLED order %s for %s (%d shares). Buffer count: %d/%d. Calling notifyAll()...",
                consumerThreadName, order.getOrderId(), order.getSymbol(), order.getQuantity(), buffer.size(), capacity);
        eventTraceLogs.add(log);

        notifyAll(); // Wakes up any waiting producer threads
        return order;
    }

    public List<String> getEventTraceLogs() {
        return new ArrayList<>(eventTraceLogs);
    }

    /**
     * Runs a self-contained 2-second simulation demonstrating Producer and Consumer threads
     * operating simultaneously, then joins both threads.
     */
    public static Map<String, Object> runEducationalSimulation() {
        ProducerConsumerOrderQueue queue = new ProducerConsumerOrderQueue(3); // Small capacity 3 to trigger wait() quickly
        List<Order> processedOrders = new ArrayList<>();

        String[] demoSymbols = {"RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS", "MARUTI"};

        // Thread 1: Investor Order Generator (Producer)
        Thread producerThread = new Thread(() -> {
            try {
                for (int i = 1; i <= 6; i++) {
                    String symbol = demoSymbols[(i - 1) % demoSymbols.length];
                    Order order = new Order("LAB-ORD-" + i, 1, symbol, "BUY", "MARKET",
                            i * 5, new BigDecimal("1500.00"), "PENDING",
                            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

                    queue.produce(order, Thread.currentThread().getName());
                    Thread.sleep(150); // Simulate network latency between incoming orders
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "TraderThread-Producer");

        // Thread 2: Exchange Execution Engine (Consumer)
        Thread consumerThread = new Thread(() -> {
            try {
                for (int i = 1; i <= 6; i++) {
                    Thread.sleep(300); // Consumer processes slightly slower to force buffer full condition
                    Order order = queue.consume(Thread.currentThread().getName());
                    order.setStatus("COMPLETED");
                    processedOrders.add(order);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "ExchangeEngine-Consumer");

        long startTime = System.currentTimeMillis();

        // Start both threads (NEW -> RUNNABLE)
        producerThread.start();
        consumerThread.start();

        // Demonstrate join() to wait for completion
        try {
            producerThread.join(4000);
            consumerThread.join(4000);
        } catch (InterruptedException ignored) {
        }

        long duration = System.currentTimeMillis() - startTime;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "SUCCESS");
        result.put("demonstration", "Core Java Producer-Consumer Multithreading with wait() and notifyAll()");
        result.put("producerThread", producerThread.getName() + " [State: " + producerThread.getState() + "]");
        result.put("consumerThread", consumerThread.getName() + " [State: " + consumerThread.getState() + "]");
        result.put("bufferCapacity", 3);
        result.put("totalOrdersProcessed", processedOrders.size());
        result.put("executionDurationMs", duration);
        result.put("traceLogs", queue.getEventTraceLogs());
        return result;
    }
}
