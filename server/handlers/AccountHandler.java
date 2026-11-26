
package server.handlers;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import dao.UserDAO;
import model.User;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonSerializer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

public class AccountHandler implements HttpHandler {

    private static final int DEMO_USER_ID = 1;

    private final UserDAO userDAO = new UserDAO();

    // Gson configuration for LocalDate
    private final Gson gson = new GsonBuilder()
            .registerTypeAdapter(
                    LocalDate.class,
                    (JsonSerializer<LocalDate>) (date, type, context) ->
                            date == null ? null :
                                    context.serialize(date.toString())
            )
            .registerTypeAdapter(
                    LocalDate.class,
                    (JsonDeserializer<LocalDate>) (json, type, context) ->
        json == null || json.isJsonNull()
                || json.getAsString().trim().isEmpty()
                ? null
                : LocalDate.parse(json.getAsString())
            )
            .create();

    @Override
    public void handle(HttpExchange exchange) throws IOException {

        // Allow browser frontend requests
        addCorsHeaders(exchange);

        String method = exchange.getRequestMethod();

        try {
            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                exchange.close();
                return;
            }

            if ("GET".equalsIgnoreCase(method)) {
                handleGet(exchange);

            } else if ("PUT".equalsIgnoreCase(method)) {
                handlePut(exchange);

            } else {
                sendJson(exchange, 405,
                        errorResponse("Method not allowed"));
            }

        } catch (SQLException e) {
            e.printStackTrace();

            sendJson(exchange, 500,
                    errorResponse("Database error"));

        } catch (Exception e) {
            e.printStackTrace();

            sendJson(exchange, 500,
                    errorResponse("Internal server error"));
        }
    }

    // GET: Retrieve demo account details
    private void handleGet(HttpExchange exchange)
            throws IOException, SQLException {

        User user = userDAO.findById(DEMO_USER_ID);

        if (user == null) {
            sendJson(exchange, 404,
                    errorResponse("Demo user not found"));
            return;
        }

        sendJson(exchange, 200, gson.toJson(toResponse(user)));
    }

    // PUT: Update demo account details
    private void handlePut(HttpExchange exchange)
            throws IOException, SQLException {

        String requestBody = readRequestBody(exchange);

        if (requestBody == null || requestBody.trim().isEmpty()) {
            sendJson(exchange, 400,
                    errorResponse("Request body cannot be empty"));
            return;
        }

        User incomingUser;

        try {
            incomingUser = gson.fromJson(requestBody, User.class);

        } catch (Exception e) {
            sendJson(exchange, 400,
                    errorResponse("Invalid JSON or date format. Use YYYY-MM-DD for DOB."));
            return;
        }

        if (incomingUser == null) {
            sendJson(exchange, 400,
                    errorResponse("Invalid request data"));
            return;
        }

        // Fetch existing record so partial profile/bank updates
        // do not erase fields that were not sent by the frontend.
        User existingUser = userDAO.findById(DEMO_USER_ID);

        if (existingUser == null) {
            sendJson(exchange, 404,
                    errorResponse("Demo user not found"));
            return;
        }

        // Merge only fields supplied by the frontend
        if (incomingUser.getName() != null)
            existingUser.setName(incomingUser.getName());

        if (incomingUser.getEmail() != null)
            existingUser.setEmail(incomingUser.getEmail());

        if (incomingUser.getPhone() != null)
            existingUser.setPhone(incomingUser.getPhone());

        if (incomingUser.getPanCard() != null)
            existingUser.setPanCard(incomingUser.getPanCard());

        if (incomingUser.getDob() != null)
            existingUser.setDob(incomingUser.getDob());

        if (incomingUser.getTradingStyle() != null)
            existingUser.setTradingStyle(incomingUser.getTradingStyle());

        if (incomingUser.getKycStatus() != null)
            existingUser.setKycStatus(incomingUser.getKycStatus());

        if (incomingUser.getBankName() != null)
            existingUser.setBankName(incomingUser.getBankName());

        if (incomingUser.getAccountNumber() != null)
            existingUser.setAccountNumber(incomingUser.getAccountNumber());

        if (incomingUser.getIfscCode() != null)
            existingUser.setIfscCode(incomingUser.getIfscCode());

        if (incomingUser.getAccountType() != null)
            existingUser.setAccountType(incomingUser.getAccountType());

        if (incomingUser.getDematId() != null)
            existingUser.setDematId(incomingUser.getDematId());

        // Never accept an ID supplied by the browser
        existingUser.setId(DEMO_USER_ID);

        // Basic validation
        if (isBlank(existingUser.getName())
                || isBlank(existingUser.getEmail())) {

            sendJson(exchange, 400,
                    errorResponse("Name and email are required"));
            return;
        }

        boolean updated = userDAO.updateProfileAndBank(existingUser);

        if (!updated) {
            sendJson(exchange, 404,
                    errorResponse("Demo user not found"));
            return;
        }

        // Fetch updated database record
        User savedUser = userDAO.findById(DEMO_USER_ID);

        sendJson(exchange, 200,
                gson.toJson(toResponse(savedUser)));
    }

    // Prepare safe account response
    private Map<String, Object> toResponse(User user) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("id", user.getId());
        response.put("tradeId", user.getTradeId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("panCard", user.getPanCard());
        response.put("dob", user.getDob());
        response.put("kycStatus", user.getKycStatus());
        response.put("tradingStyle", user.getTradingStyle());
        response.put("bankName", user.getBankName());

        // Demo data only. Do not expose real bank account details.
        response.put("accountNumber", user.getAccountNumber());

        response.put("ifscCode", user.getIfscCode());
        response.put("accountType", user.getAccountType());
        response.put("dematId", user.getDematId());
        response.put("cashBalance", user.getCashBalance());

        return response;
    }

    // Read incoming request body
    private String readRequestBody(HttpExchange exchange)
            throws IOException {

        try (InputStream input = exchange.getRequestBody()) {
            return new String(
                    input.readAllBytes(),
                    StandardCharsets.UTF_8
            );
        }
    }

    // Add CORS headers for local frontend development
    private void addCorsHeaders(HttpExchange exchange) {

        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Origin", "*"
        );

        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Methods", "GET, PUT, OPTIONS"
        );

        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Headers", "Content-Type"
        );
    }

    // Send JSON response
    private void sendJson(
            HttpExchange exchange,
            int statusCode,
            String response
    ) throws IOException {

        byte[] responseBytes =
                response.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
                "Content-Type",
                "application/json; charset=UTF-8"
        );

        exchange.sendResponseHeaders(
                statusCode,
                responseBytes.length
        );

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(responseBytes);
        }
    }

    // Create error JSON
    private String errorResponse(String message) {

        Map<String, String> error = new LinkedHashMap<>();
        error.put("error", message);

        return gson.toJson(error);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
