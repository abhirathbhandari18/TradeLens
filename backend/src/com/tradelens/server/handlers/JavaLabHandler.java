package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.OrderDAO;
import com.tradelens.model.Order;
import com.tradelens.simulator.ProducerConsumerOrderQueue;
import com.tradelens.util.CSVFileHandler;
import com.tradelens.util.JavaConceptsBenchmark;
import com.tradelens.util.JsonUtil;
import com.tradelens.util.SessionManager;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TradeLens - Java Concepts & Educational Lab REST Handler
 *
 * Endpoints:
 * - GET /api/lab/threads: Runs Producer-Consumer multithreading demonstration with wait()/notifyAll()
 * - GET /api/lab/streams: Executes Stream API pipelines (filter, map, sorted, distinct, reduce, summaryStatistics)
 * - GET /api/lab/collections: Returns theoretical and empirical Collections Framework analysis
 * - GET /api/export/csv: Exports user orders into a downloadable CSV file using FileWriter/BufferedWriter
 */
public class JavaLabHandler implements HttpHandler {
    private final OrderDAO orderDAO;

    public JavaLabHandler() {
        this.orderDAO = new OrderDAO();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            if (path.endsWith("/threads")) {
                handleThreadsLab(exchange);
            } else if (path.endsWith("/streams")) {
                handleStreamsLab(exchange);
            } else if (path.endsWith("/collections")) {
                handleCollectionsLab(exchange);
            } else if (path.endsWith("/csv")) {
                handleCsvExport(exchange);
            } else {
                sendError(exchange, 404, "NOT_FOUND", "Lab endpoint not found: " + path);
            }
        } catch (Exception e) {
            System.err.println("[JavaLabHandler] Error: " + e.getMessage());
            sendError(exchange, 500, "LAB_ERROR", e.getMessage());
        }
    }

    private void handleThreadsLab(HttpExchange exchange) throws IOException {
        Map<String, Object> simulationResult = ProducerConsumerOrderQueue.runEducationalSimulation();
        sendJson(exchange, 200, simulationResult);
    }

    private void handleStreamsLab(HttpExchange exchange) throws IOException, SQLException {
        Map<String, Object> streamResults = JavaConceptsBenchmark.runStreamApiLab();
        sendJson(exchange, 200, streamResults);
    }

    private void handleCollectionsLab(HttpExchange exchange) throws IOException {
        List<Map<String, Object>> matrix = JavaConceptsBenchmark.getCollectionsMatrix();
        sendJson(exchange, 200, matrix);
    }

    private void handleCsvExport(HttpExchange exchange) throws IOException, SQLException {
        Integer userId = SessionManager.extractAuthenticatedUserId(exchange);
        if (userId == null) userId = 1; // Default to demo user if testing directly from browser link

        List<Order> orders = orderDAO.getOrdersByUser(userId);
        File exportFile = new File("orders_export.csv");
        String csvContent = CSVFileHandler.exportOrdersToCSV(orders, exportFile);

        byte[] bytes = csvContent.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/csv; charset=UTF-8");
        exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"tradelens_orders.csv\"");
        exchange.sendResponseHeaders(200, bytes.length);

        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void sendJson(HttpExchange exchange, int code, Object data) throws IOException {
        byte[] bytes = JsonUtil.toJson(data).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void sendError(HttpExchange exchange, int code, String errorCode, String msg) throws IOException {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("success", false);
        err.put("errorCode", errorCode);
        err.put("error", msg);
        sendJson(exchange, code, err);
    }
}
