package com.tradelens.dao;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * TradeLens - Database Connection Manager
 *
 * Provides thread-safe, centralized JDBC Connection acquisition.
 * Follows the Singleton pattern and ensures the MySQL Connector/J driver is loaded.
 * Securely loads credentials from environment variables or local db.properties (Git-ignored).
 */
public class DBConnectionManager {
    private static final String DEFAULT_URL = "jdbc:mysql://localhost:3306/tradelens_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String DEFAULT_USER = "root";
    private static final String DEFAULT_PASSWORD = "";

    private static String url = DEFAULT_URL;
    private static String user = DEFAULT_USER;
    private static String password = DEFAULT_PASSWORD;

    static {
        try {
            // Load MySQL Connector Driver
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("[DBConnectionManager] MySQL Driver not found on classpath: " + e.getMessage());
        }

        // 1. Load from local db.properties if present (keeps passwords out of Git)
        File propFile = new File("db.properties");
        if (!propFile.exists()) {
            propFile = new File("backend/db.properties");
        }
        if (propFile.exists()) {
            try (FileInputStream fis = new FileInputStream(propFile)) {
                Properties props = new Properties();
                props.load(fis);
                if (props.getProperty("db.url") != null) url = props.getProperty("db.url").trim();
                if (props.getProperty("db.user") != null) user = props.getProperty("db.user").trim();
                if (props.getProperty("db.password") != null) password = props.getProperty("db.password").trim();
            } catch (IOException e) {
                System.err.println("[DBConnectionManager] Note: Could not read db.properties: " + e.getMessage());
            }
        }

        // 2. Allow environment variable overrides (highest precedence)
        if (System.getenv("DB_URL") != null) url = System.getenv("DB_URL");
        if (System.getenv("DB_USER") != null) user = System.getenv("DB_USER");
        if (System.getenv("DB_PASSWORD") != null) password = System.getenv("DB_PASSWORD");
    }

    private DBConnectionManager() {
        // Private constructor prevents instantiation
    }

    /**
     * Obtains a fresh JDBC Connection to MySQL tradelens_db.
     * Always use with try-with-resources:
     * try (Connection con = DBConnectionManager.getConnection()) { ... }
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(url, user, password);
    }

    /**
     * Health check to test database reachability.
     */
    public static boolean testConnection() {
        try (Connection con = getConnection()) {
            return con != null && !con.isClosed();
        } catch (SQLException e) {
            System.err.println("[DBConnectionManager] Connection test failed: " + e.getMessage());
            return false;
        }
    }
}
