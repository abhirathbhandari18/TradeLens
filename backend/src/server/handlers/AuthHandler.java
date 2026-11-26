package server.handlers;

import com.sun.net.httpserver.HttpExchange;
import exceptions.TradingExceptions.UnauthorizedException;
import util.JsonUtil;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Handles POST /api/auth/signup, POST /api/auth/login, and POST /api/auth/logout.
 * Maintains active session tokens in a synchronized HashMap<String, UserSession>.
 *
 * Integration Note:
 * Wire UserDAO (Person 3) inside handleSignup() and handleLogin() once dao/UserDAO.java is merged.
 */
public class AuthHandler extends BaseHandler {

    /** Active user sessions mapped by Bearer token. */
    private static final Map<String, UserSession> SESSIONS = new HashMap<>();

    /** Temporary in-memory user store until Person 3's UserDAO (MySQL) is connected. */
    private static final Map<String, Map<String, Object>> USERS_BY_EMAIL = new HashMap<>();

    static {
        // Seed demo account so React's "Continue with Demo Account" works immediately
        Map<String, Object> demo = new LinkedHashMap<>();
        demo.put("id", "USR-100001");
        demo.put("tradeId", "TL-849201");
        demo.put("name", "Abhirath Bhandari");
        demo.put("email", "demo@tradelens.in");
        demo.put("password", "demo1234");
        demo.put("panCard", "ABCDE1234F");
        demo.put("phone", "+91 98765 43210");
        demo.put("dob", "2000-01-15");
        demo.put("kycStatus", "Verified");
        demo.put("tradingStyle", "Swing Trader");
        demo.put("joinedAt", "2026-11-19");
        demo.put("bankName", "HDFC Bank");
        demo.put("accountNumber", "50100482910482");
        demo.put("ifscCode", "HDFC0001245");
        demo.put("accountType", "Savings");
        demo.put("dematId", "1208160048291042");
        USERS_BY_EMAIL.put("demo@tradelens.in", demo);
    }

    public static class UserSession {
        public final String token;
        public final String userId;
        public final String email;
        public final String name;

        public UserSession(String token, String userId, String email, String name) {
            this.token = token;
            this.userId = userId;
            this.email = email;
            this.name = name;
        }
    }

    /** Looks up an authenticated session by token or throws UnauthorizedException. */
    public static UserSession requireSession(String token) throws UnauthorizedException {
        if (token == null || token.isEmpty()) {
            throw new UnauthorizedException("Missing authorization token. Please log in.");
        }
        synchronized (SESSIONS) {
            UserSession session = SESSIONS.get(token);
            if (session == null) {
                throw new UnauthorizedException("Session expired or invalid. Please log in again.");
            }
            return session;
        }
    }

    public static Map<String, Object> getUserByEmail(String email) {
        synchronized (USERS_BY_EMAIL) {
            return USERS_BY_EMAIL.get(email.toLowerCase());
        }
    }

    @Override
    protected void handleRequest(HttpExchange exchange) throws Exception {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if (!"POST".equalsIgnoreCase(method)) {
            sendJson(exchange, 405, JsonUtil.error("Method not allowed"));
            return;
        }

        if (path.endsWith("/signup")) {
            handleSignup(exchange);
        } else if (path.endsWith("/login")) {
            handleLogin(exchange);
        } else if (path.endsWith("/logout")) {
            handleLogout(exchange);
        } else {
            sendJson(exchange, 404, JsonUtil.error("Unknown auth endpoint: " + path));
        }
    }

    private void handleSignup(HttpExchange exchange) throws Exception {
        Map<String, String> body = JsonUtil.parseObject(readBody(exchange));
        String name = body.getOrDefault("name", "").trim();
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        String password = body.getOrDefault("password", "");
        String tradingStyle = body.getOrDefault("tradingStyle", "Swing Trader");
        String panCard = body.getOrDefault("panCard", "ABCDE1234F").trim().toUpperCase();

        if (name.isEmpty() || email.isEmpty() || password.length() < 6) {
            throw new IllegalArgumentException("Enter name, valid email, and a password of at least 6 characters.");
        }

        Map<String, Object> user;
        synchronized (USERS_BY_EMAIL) {
            // TODO (Person 3 - UserDAO): Replace with UserDAO.findByEmail(email) & UserDAO.createUser(...)
            if (USERS_BY_EMAIL.containsKey(email)) {
                throw new IllegalArgumentException("An account with this email already exists.");
            }

            long suffix = Math.abs(System.currentTimeMillis() % 900000L) + 100000L;
            user = new LinkedHashMap<>();
            user.put("id", "USR-" + suffix);
            user.put("tradeId", "TL-" + suffix);
            user.put("name", name);
            user.put("email", email);
            user.put("password", password);
            user.put("panCard", panCard.isEmpty() ? "ABCDE1234F" : panCard);
            user.put("phone", "+91 98765 43210");
            user.put("dob", "2000-01-15");
            user.put("kycStatus", "Verified");
            user.put("tradingStyle", tradingStyle);
            user.put("joinedAt", LocalDate.now().toString());
            user.put("bankName", "HDFC Bank");
            user.put("accountNumber", "50100482910482");
            user.put("ifscCode", "HDFC0001245");
            user.put("accountType", "Savings");
            user.put("dematId", "1208160048291042");
            USERS_BY_EMAIL.put(email, user);
        }

        // Seed initial portfolio cash & holdings for the new user
        TradeHandler.initUserWallet((String) user.get("id"));

        String token = createSession(user);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", token);
        response.put("user", sanitizeUser(user));
        sendJson(exchange, 201, JsonUtil.toJson(response));
    }

    private void handleLogin(HttpExchange exchange) throws Exception {
        Map<String, String> body = JsonUtil.parseObject(readBody(exchange));
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        String password = body.getOrDefault("password", "");

        if (email.isEmpty() || password.isEmpty()) {
            throw new IllegalArgumentException("Please enter both email and password.");
        }

        Map<String, Object> user;
        synchronized (USERS_BY_EMAIL) {
            // TODO (Person 3 - UserDAO): Replace with UserDAO.findByEmail(email)
            user = USERS_BY_EMAIL.get(email);
        }

        if (user == null || !password.equals(user.get("password"))) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        TradeHandler.initUserWallet((String) user.get("id"));

        String token = createSession(user);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", token);
        response.put("user", sanitizeUser(user));
        sendJson(exchange, 200, JsonUtil.toJson(response));
    }

    private void handleLogout(HttpExchange exchange) throws Exception {
        String token = getAuthToken(exchange);
        if (token != null) {
            synchronized (SESSIONS) {
                SESSIONS.remove(token);
            }
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Logged out");
        sendJson(exchange, 200, JsonUtil.toJson(response));
    }

    private String createSession(Map<String, Object> user) {
        String token = UUID.randomUUID().toString();
        UserSession session = new UserSession(
                token,
                (String) user.get("id"),
                (String) user.get("email"),
                (String) user.get("name")
        );
        synchronized (SESSIONS) {
            SESSIONS.put(token, session);
        }
        return token;
    }

    private Map<String, Object> sanitizeUser(Map<String, Object> user) {
        Map<String, Object> safe = new LinkedHashMap<>(user);
        safe.remove("password");
        return safe;
    }
}
