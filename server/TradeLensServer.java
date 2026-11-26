
package server;

import com.sun.net.httpserver.HttpServer;
import server.handlers.AccountHandler;

import java.io.IOException;
import java.net.InetSocketAddress;

public class TradeLensServer {

    private static final int PORT = 8080;

    public static void main(String[] args) {

        try {
            // Create HTTP server
            HttpServer server = HttpServer.create(
                    new InetSocketAddress(PORT), 0
            );

            // Register account API
            server.createContext(
                    "/api/account",
                    new AccountHandler()
            );

            // Start server
            server.setExecutor(null);
            server.start();

            System.out.println(
                    "TradeLens backend started successfully!"
            );

            System.out.println(
                    "Server running at http://localhost:" + PORT
            );

            System.out.println(
                    "Account API: http://localhost:" + PORT
                            + "/api/account"
            );

        } catch (IOException e) {
            System.err.println("Unable to start TradeLens server.");
            e.printStackTrace();
        }
    }
}
