package com.tradelens.util;

import com.tradelens.model.*;

import java.math.BigDecimal;
import java.util.*;

/**
 * Lightweight Zero-Dependency JSON Serializer and Parser.
 */
public final class JsonUtil {

    private JsonUtil() {
    }

    public static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return escapeString((String) obj);
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof Map) return mapToJson((Map<?, ?>) obj);
        if (obj instanceof Collection) return collectionToJson((Collection<?>) obj);
        if (obj instanceof Stock) return stockToJson((Stock) obj);
        if (obj instanceof Holding) return holdingToJson((Holding) obj);
        if (obj instanceof Order) return orderToJson((Order) obj);
        if (obj instanceof WatchlistItem) return watchlistItemToJson((WatchlistItem) obj);
        if (obj instanceof User) return userToJson((User) obj);
        return "\"" + obj.toString() + "\"";
    }

    private static String escapeString(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < ' ') sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
                }
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    private static String mapToJson(Map<?, ?> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (!first) sb.append(",");
            sb.append(escapeString(String.valueOf(entry.getKey()))).append(":");
            sb.append(toJson(entry.getValue()));
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }

    private static String collectionToJson(Collection<?> col) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Object item : col) {
            if (!first) sb.append(",");
            sb.append(toJson(item));
            first = false;
        }
        sb.append("]");
        return sb.toString();
    }

    private static String stockToJson(Stock s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("symbol", s.getSymbol());
        m.put("companyName", s.getCompanyName());
        m.put("sector", s.getSector());
        m.put("currentPrice", s.getCurrentPrice());
        m.put("previousClose", s.getPreviousClose());
        m.put("dayHigh", s.getDayHigh());
        m.put("dayLow", s.getDayLow());
        m.put("priceChange", s.getPriceChange());
        m.put("changePercentage", s.getChangePercentage());
        return mapToJson(m);
    }

    private static String holdingToJson(Holding h) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", h.getUserId());
        m.put("symbol", h.getSymbol());
        m.put("quantity", h.getQuantity());
        m.put("avgBuyPrice", h.getAvgBuyPrice());
        m.put("companyName", h.getCompanyName());
        m.put("currentPrice", h.getCurrentPrice());
        m.put("totalInvested", h.getTotalInvested());
        m.put("currentValue", h.getCurrentValue());
        m.put("unrealizedProfitLoss", h.getUnrealizedProfitLoss());
        m.put("returnPercentage", h.getReturnPercentage());
        return mapToJson(m);
    }

    private static String orderToJson(Order o) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("orderId", o.getOrderId());
        m.put("userId", o.getUserId());
        m.put("symbol", o.getSymbol());
        m.put("type", o.getType());
        m.put("orderMode", o.getOrderMode());
        m.put("quantity", o.getQuantity());
        m.put("price", o.getPrice());
        m.put("totalValue", o.getTotalValue());
        m.put("status", o.getStatus());
        m.put("timestamp", o.getTimestamp());
        return mapToJson(m);
    }

    private static String watchlistItemToJson(WatchlistItem w) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", w.getId());
        m.put("userId", w.getUserId());
        m.put("symbol", w.getSymbol());
        m.put("companyName", w.getCompanyName());
        m.put("sector", w.getSector());
        m.put("currentPrice", w.getCurrentPrice());
        m.put("priceChange", w.getPriceChange());
        m.put("changePercentage", w.getChangePercentage());
        return mapToJson(m);
    }

    private static String userToJson(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("email", u.getEmail());
        m.put("walletBalance", u.getWalletBalance());
        return mapToJson(m);
    }

    public static Map<String, String> parseSimpleJson(String json) {
        Map<String, String> result = new HashMap<>();
        if (json == null) return result;
        String trimmed = json.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        if (trimmed.isEmpty()) return result;

        List<String> pairs = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (c == '"') inQuotes = !inQuotes;
            if (c == ',' && !inQuotes) {
                pairs.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        if (current.length() > 0) pairs.add(current.toString().trim());

        for (String pair : pairs) {
            int colonIdx = pair.indexOf(':');
            if (colonIdx > 0) {
                String key = cleanToken(pair.substring(0, colonIdx));
                String val = cleanToken(pair.substring(colonIdx + 1));
                result.put(key, val);
            }
        }
        return result;
    }

    private static String cleanToken(String token) {
        String t = token.trim();
        if (t.startsWith("\"") && t.endsWith("\"") && t.length() >= 2) {
            return t.substring(1, t.length() - 1).replace("\\\"", "\"");
        }
        return t;
    }
}
