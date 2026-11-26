package db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnectionManager {

    private DBConnectionManager() {
    }

    public static Connection getConnection() throws SQLException {
        String host = getRequiredEnvironmentVariable("DB_HOST").trim();
        String portValue = getRequiredEnvironmentVariable("DB_PORT");
        String database = getRequiredEnvironmentVariable("DB_NAME").trim();
        String user = getRequiredEnvironmentVariable("DB_USER");
        String password = getRequiredEnvironmentVariable("DB_PASSWORD");

        if (!host.matches("[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
                + "(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*")) {
            throw new SQLException("Environment variable DB_HOST must be a valid hostname.");
        }
        if (!database.matches("[A-Za-z0-9_$-]{1,64}")) {
            throw new SQLException(
                    "Environment variable DB_NAME must be a valid database name of at most 64 characters.");
        }

        int port;
        try {
            port = Integer.parseInt(portValue.trim());
        } catch (NumberFormatException e) {
            throw new SQLException("Environment variable DB_PORT must be a valid port number.", e);
        }
        if (port < 1 || port > 65535) {
            throw new SQLException("Environment variable DB_PORT must be between 1 and 65535.");
        }

        String url = "jdbc:mysql://" + host + ":" + port + "/" + database
                + "?sslMode=VERIFY_IDENTITY&connectTimeout=10000";
        return DriverManager.getConnection(url, user, password);
    }

    private static String getRequiredEnvironmentVariable(String name) throws SQLException {
        String value = System.getenv(name);
        if (value == null || value.trim().isEmpty()) {
            throw new SQLException("Missing required environment variable: " + name);
        }
        return value;
    }
}
