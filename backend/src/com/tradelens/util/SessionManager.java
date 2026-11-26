package com.tradelens.util;

import com.sun.net.httpserver.HttpExchange;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * TradeLens - Authentication Session Manager
 *
 * Tracks active user sessions and validates authentication tokens.
 * Enforces that userId is never trusted from client request bodies.
 */
public class SessionManager {
    // Maps Token String -> User ID (int)
    private static final Map<String, Integer> ACTIVE_SESSIONS = new ConcurrentHashMap<>();

    // Static initializer with default demo token for easy testing
    static {
        ACTIVE_SESSIONS.put("demo-token-12345", 1); // User 1 = 'investor'
    }

    private SessionManager() {
    }

    /**
     * Creates a new session token for the given user ID.
     */
    public static String createSession(int userId) {
        String token = "TL-" + UUID.randomUUID().toString();
        ACTIVE_SESSIONS.put(token, userId);
        return token;
    }

    /**
     * Invalidates a session token.
     */
    public static void invalidateSession(String token) {
        if (token != null) {
            ACTIVE_SESSIONS.remove(token.trim());
        }
    }

    /**
     * Resolves the authenticated user ID from a token.
     * Returns null if token is missing or invalid.
     */
    public static Integer getUserIdFromToken(String token) {
        if (token == null) return null;
        return ACTIVE_SESSIONS.get(token.trim());
    }

    /**
     * Extracts authenticated user ID from HttpExchange headers or query parameters.
     * Checks:
     * 1. Authorization: Bearer <token>
     * 2. X-Auth-Token: <token>
     * 3. URL query param: ?token=<token>
     */
    public static Integer extractAuthenticatedUserId(HttpExchange exchange) {
        // 1. Check Authorization header
        String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            Integer uid = getUserIdFromToken(token);
            if (uid != null) return uid;
        }

        // 2. Check X-Auth-Token header
        String customHeader = exchange.getRequestHeaders().getFirst("X-Auth-Token");
        if (customHeader != null && !customHeader.trim().isEmpty()) {
            Integer uid = getUserIdFromToken(customHeader.trim());
            if (uid != null) return uid;
        }

        // 3. Check query parameter
        String query = exchange.getRequestURI().getQuery();
        if (query != null) {
            for (String param : query.split("&")) {
                if (param.startsWith("token=")) {
                    String token = param.substring(6).trim();
                    Integer uid = getUserIdFromToken(token);
                    if (uid != null) return uid;
                }
            }
        }

        // Default fallback for demo user during local testing if no header passed
        return null;
    }
}
