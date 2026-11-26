package server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import exceptions.TradingExceptions.InsufficientFundsException;
import exceptions.TradingExceptions.InsufficientHoldingsException;
import exceptions.TradingExceptions.UnauthorizedException;
import util.JsonUtil;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Shared base handler for all TradeLens REST endpoints.
 * Handles CORS headers, OPTIONS preflight, body reading, auth token extraction, and JSON responses.
 */
public abstract class BaseHandler implements HttpHandler {

    @Override
    public final void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        try {
            handleRequest(exchange);
        } catch (UnauthorizedException e) {
            sendJson(exchange, 401, JsonUtil.error(e.getMessage()));
        } catch (InsufficientFundsException | InsufficientHoldingsException | IllegalArgumentException e) {
            sendJson(exchange, 400, JsonUtil.error(e.getMessage()));
        } catch (Exception e) {
            sendJson(exchange, 500, JsonUtil.error("Server error: " + e.getMessage()));
        }
    }

    protected abstract void handleRequest(HttpExchange exchange) throws Exception;

    protected String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    protected String getAuthToken(HttpExchange exchange) {
        String header = exchange.getRequestHeaders().getFirst("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        return null;
    }

    protected void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
