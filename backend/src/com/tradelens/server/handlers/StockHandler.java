package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.dao.StockDAO;
import com.tradelens.model.Stock;
import com.tradelens.util.JsonUtil;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.*;

/**
 * TradeLens - Stock Market HTTP Handler
 * Endpoint: /api/stocks
 */
public class StockHandler implements HttpHandler {
    private final StockDAO stockDAO;

    public StockHandler() {
        this.stockDAO = new StockDAO();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        String path = exchange.getRequestURI().getPath();
        Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());

        try {
            if (path.endsWith("/detail") || params.containsKey("symbol")) {
                String symbol = params.get("symbol");
                Stock stock = stockDAO.getStockBySymbol(symbol);
                if (stock == null) {
                    sendError(exchange, 404, "NOT_FOUND", "Stock '" + symbol + "' not found.");
                } else {
                    sendJson(exchange, 200, stock);
                }
            } else {
                List<Stock> stocks = stockDAO.getAllStocks();
                String keyword = params.get("keyword");
                String sector = params.get("sector");

                if (keyword != null && !keyword.trim().isEmpty()) {
                    String q = keyword.trim().toLowerCase();
                    stocks.removeIf(s -> !s.getSymbol().toLowerCase().contains(q) &&
                                         !s.getCompanyName().toLowerCase().contains(q));
                }
                if (sector != null && !sector.trim().isEmpty() && !sector.equalsIgnoreCase("ALL")) {
                    stocks.removeIf(s -> !s.getSector().equalsIgnoreCase(sector.trim()));
                }

                sendJson(exchange, 200, stocks);
            }
        } catch (SQLException e) {
            sendError(exchange, 500, "DB_ERROR", e.getMessage());
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

    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null) return map;
        for (String pair : query.split("&")) {
            int idx = pair.indexOf('=');
            if (idx > 0) map.put(pair.substring(0, idx), pair.substring(idx + 1));
        }
        return map;
    }
}
