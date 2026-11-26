package com.tradelens.server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.tradelens.engine.MarketDataStore;
import com.tradelens.model.Stock;
import com.tradelens.util.JsonUtil;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Serves stock data from the shared in-memory market store.
 */
public class StockHandler implements HttpHandler {
    private final MarketDataStore marketDataStore;

    public StockHandler(MarketDataStore marketDataStore) {
        this.marketDataStore = Objects.requireNonNull(marketDataStore, "marketDataStore");
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        setCorsHeaders(exchange);
        String method = exchange.getRequestMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        if (!"GET".equalsIgnoreCase(method)) {
            sendError(exchange, 405, "METHOD_NOT_ALLOWED", "Only GET is supported for stocks.");
            return;
        }

        String path = exchange.getRequestURI().getPath();
        if (!"/api/stocks".equals(path) && !"/api/stocks/detail".equals(path)) {
            sendError(exchange, 404, "NOT_FOUND", "Endpoint " + path + " not found.");
            return;
        }

        Map<String, String> params;
        try {
            params = parseQueryParams(exchange.getRequestURI().getRawQuery());
        } catch (IllegalArgumentException e) {
            sendError(exchange, 400, "BAD_REQUEST", "Malformed query parameters.");
            return;
        }

        boolean detailRequest = "/api/stocks/detail".equals(path) || params.containsKey("symbol");
        if (detailRequest) {
            String symbol = params.get("symbol");
            if (symbol == null || symbol.trim().isEmpty() || symbol.trim().length() > 20) {
                sendError(exchange, 400, "BAD_REQUEST", "A valid stock symbol is required.");
                return;
            }
            if (!marketDataStore.containsStock(symbol)) {
                sendError(exchange, 404, "NOT_FOUND", "Stock '" + symbol.trim() + "' not found.");
                return;
            }
            sendJson(exchange, 200, marketDataStore.getStock(symbol));
            return;
        }

        List<Stock> stocks = new ArrayList<>(marketDataStore.getAllStocks().values());
        stocks.sort(Comparator.comparing(Stock::getSymbol));

        String keyword = params.get("keyword");
        if (keyword != null && !keyword.trim().isEmpty()) {
            String normalizedKeyword = keyword.trim().toLowerCase(Locale.ROOT);
            stocks.removeIf(stock ->
                    !stock.getSymbol().toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                            && (stock.getCompanyName() == null
                            || !stock.getCompanyName().toLowerCase(Locale.ROOT).contains(normalizedKeyword)));
        }

        String sector = params.get("sector");
        if (sector != null && !sector.trim().isEmpty() && !"ALL".equalsIgnoreCase(sector.trim())) {
            stocks.removeIf(stock -> stock.getSector() == null
                    || !stock.getSector().equalsIgnoreCase(sector.trim()));
        }

        sendJson(exchange, 200, stocks);
    }

    private static Map<String, String> parseQueryParams(String query) {
        Map<String, String> params = new LinkedHashMap<>();
        if (query == null || query.isEmpty()) {
            return params;
        }

        for (String pair : query.split("&", -1)) {
            int separator = pair.indexOf('=');
            if (pair.isEmpty() || separator <= 0) {
                throw new IllegalArgumentException("Malformed query parameter");
            }
            String key = decode(pair.substring(0, separator));
            String value = decode(pair.substring(separator + 1));
            if (key.trim().isEmpty() || params.containsKey(key)) {
                throw new IllegalArgumentException("Invalid or duplicate query parameter");
            }
            params.put(key, value);
        }
        return params;
    }

    private static String decode(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException("UTF-8 is not available", e);
        }
    }

    private static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static void sendJson(HttpExchange exchange, int statusCode, Object data) throws IOException {
        byte[] bytes = JsonUtil.toJson(data).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private static void sendError(HttpExchange exchange, int statusCode,
                                  String errorCode, String message) throws IOException {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("success", false);
        error.put("errorCode", errorCode);
        error.put("error", message);
        sendJson(exchange, statusCode, error);
    }
}
