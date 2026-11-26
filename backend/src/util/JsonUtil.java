package util;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lightweight pure-Java JSON serializer & parser (no external libraries required).
 */
public class JsonUtil {

    /**
     * Parses a flat JSON object string (e.g. {"symbol":"TCS","qty":5}) into a Map<String, String>.
     */
    public static Map<String, String> parseObject(String json) {
        Map<String, String> result = new LinkedHashMap<>();
        if (json == null) {
            return result;
        }
        String trimmed = json.trim();
        if (trimmed.isEmpty() || !trimmed.startsWith("{") || !trimmed.endsWith("}")) {
            return result;
        }
        String body = trimmed.substring(1, trimmed.length() - 1).trim();
        if (body.isEmpty()) {
            return result;
        }

        int i = 0;
        int len = body.length();
        while (i < len) {
            // Skip whitespace and commas
            while (i < len && (Character.isWhitespace(body.charAt(i)) || body.charAt(i) == ',')) {
                i++;
            }
            if (i >= len) break;

            // Read key (must start with quote)
            if (body.charAt(i) != '"') break;
            int keyEnd = findClosingQuote(body, i + 1);
            if (keyEnd == -1) break;
            String key = unescape(body.substring(i + 1, keyEnd));
            i = keyEnd + 1;

            // Skip whitespace and ':'
            while (i < len && (Character.isWhitespace(body.charAt(i)) || body.charAt(i) == ':')) {
                i++;
            }
            if (i >= len) break;

            // Read value (quoted string or primitive)
            String value;
            if (body.charAt(i) == '"') {
                int valEnd = findClosingQuote(body, i + 1);
                if (valEnd == -1) break;
                value = unescape(body.substring(i + 1, valEnd));
                i = valEnd + 1;
            } else {
                int valStart = i;
                while (i < len && body.charAt(i) != ',') {
                    i++;
                }
                value = body.substring(valStart, i).trim();
                if ("null".equals(value)) {
                    value = "";
                }
            }
            result.put(key, value);
        }
        return result;
    }

    /**
     * Converts a Map into a JSON object string. Supports String, Number, Boolean, Map, and List values.
     */
    public static String toJson(Map<String, ?> map) {
        if (map == null) return "null";
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, ?> entry : map.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(escape(entry.getKey())).append("\":");
            sb.append(valueToJson(entry.getValue()));
        }
        sb.append("}");
        return sb.toString();
    }

    /**
     * Converts a List of Maps or primitives into a JSON array string.
     */
    public static String toJsonList(List<?> list) {
        if (list == null) return "[]";
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Object item : list) {
            if (!first) sb.append(",");
            first = false;
            sb.append(valueToJson(item));
        }
        sb.append("]");
        return sb.toString();
    }

    /** Returns a standard JSON error payload: {"error":"..."} */
    public static String error(String message) {
        Map<String, Object> err = new LinkedHashMap<>();
        err.put("error", message != null ? message : "Unknown error");
        return toJson(err);
    }

    @SuppressWarnings("unchecked")
    private static String valueToJson(Object val) {
        if (val == null) return "null";
        if (val instanceof Number || val instanceof Boolean) {
            return val.toString();
        }
        if (val instanceof Map) {
            return toJson((Map<String, ?>) val);
        }
        if (val instanceof List) {
            return toJsonList((List<?>) val);
        }
        return "\"" + escape(val.toString()) + "\"";
    }

    public static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static String unescape(String s) {
        return s.replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t");
    }

    private static int findClosingQuote(String s, int start) {
        for (int i = start; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\') {
                i++; // skip escaped character
            } else if (c == '"') {
                return i;
            }
        }
        return -1;
    }
}
