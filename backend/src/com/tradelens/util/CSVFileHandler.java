package com.tradelens.util;

import com.tradelens.model.Order;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * TradeLens - File I/O & CSV Handler Module
 *
 * Demonstrates:
 * 1. Character Streams: FileReader and FileWriter.
 * 2. Buffered I/O: BufferedReader and BufferedWriter for efficient disk I/O.
 * 3. Exception-safe resource management via try-with-resources.
 * 4. Parsing and formatting comma-separated values (CSV).
 */
public final class CSVFileHandler {

    private CSVFileHandler() {
    }

    /**
     * Exports a list of Order objects into a formatted CSV string and physical file.
     *
     * @param orders List of orders to export
     * @param destinationFile Optional destination file on disk (or null for memory string)
     * @return Formatted CSV text content
     * @throws IOException on I/O error
     */
    public static String exportOrdersToCSV(List<Order> orders, File destinationFile) throws IOException {
        StringWriter sw = new StringWriter();
        BufferedWriter memWriter = new BufferedWriter(sw);

        // Header
        memWriter.write("Order ID,User ID,Stock Symbol,Transaction Type,Order Mode,Quantity,Price,Total Value,Status,Timestamp");
        memWriter.newLine();

        for (Order o : orders) {
            memWriter.write(String.format("%s,%d,%s,%s,%s,%d,%.2f,%.2f,%s,%s",
                    escapeCsv(o.getOrderId()),
                    o.getUserId(),
                    escapeCsv(o.getSymbol()),
                    escapeCsv(o.getType()),
                    escapeCsv(o.getOrderMode()),
                    o.getQuantity(),
                    o.getPrice().doubleValue(),
                    o.getTotalValue().doubleValue(),
                    escapeCsv(o.getStatus()),
                    escapeCsv(o.getTimestamp())
            ));
            memWriter.newLine();
        }
        memWriter.flush();
        String csvContent = sw.toString();

        // If file specified, write to disk demonstrating FileWriter and BufferedWriter
        if (destinationFile != null) {
            try (BufferedWriter fileWriter = new BufferedWriter(new FileWriter(destinationFile))) {
                fileWriter.write(csvContent);
            }
        }

        return csvContent;
    }

    /**
     * Reads a CSV file using FileReader and BufferedReader, parsing it line-by-line.
     * Demonstrates Character Stream reading in Core Java.
     */
    public static List<String[]> readCSVFile(File csvFile) throws IOException {
        List<String[]> rows = new ArrayList<>();
        if (!csvFile.exists()) {
            throw new FileNotFoundException("File not found: " + csvFile.getAbsolutePath());
        }

        try (BufferedReader br = new BufferedReader(new FileReader(csvFile))) {
            String line;
            boolean isHeader = true;
            while ((line = br.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip header row
                }
                if (!line.trim().isEmpty()) {
                    rows.add(line.split(","));
                }
            }
        }
        return rows;
    }

    private static String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
