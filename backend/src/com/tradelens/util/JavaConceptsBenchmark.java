package com.tradelens.util;

import com.tradelens.dao.StockDAO;
import com.tradelens.model.Stock;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * TradeLens - Stream API & Collections Lab Benchmark
 *
 * Demonstrates:
 * 1. Stream pipelines: filter, map, sorted, distinct, limit, skip, reduce, collect.
 * 2. DoubleSummaryStatistics: min, max, average, count calculation on streams.
 * 3. Method References (e.g. Stock::getSymbol, Stock::getCurrentPrice).
 * 4. Collections Framework theoretical and empirical analysis.
 */
public final class JavaConceptsBenchmark {

    private JavaConceptsBenchmark() {
    }

    /**
     * Executes advanced Stream API operations over the stock market catalog.
     */
    public static Map<String, Object> runStreamApiLab() throws SQLException {
        StockDAO dao = new StockDAO();
        List<Stock> allStocks = dao.getAllStocks();

        Map<String, Object> results = new LinkedHashMap<>();

        // 1. filter() - Find all profitable gainers today
        List<String> gainers = allStocks.stream()
                .filter(s -> s.getPriceChange().compareTo(BigDecimal.ZERO) > 0)
                .map(s -> s.getSymbol() + " (+" + s.getChangePercentage() + "%)")
                .collect(Collectors.toList());

        // 2. map() and distinct() - Extract unique market sectors
        List<String> distinctSectors = allStocks.stream()
                .map(Stock::getSector) // Method reference
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        // 3. sorted() and limit(3) - Top 3 highest priced stocks
        List<Map<String, Object>> top3HighestPriced = allStocks.stream()
                .sorted((s1, s2) -> s2.getCurrentPrice().compareTo(s1.getCurrentPrice())) // Descending
                .limit(3)
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("symbol", s.getSymbol());
                    m.put("price", s.getCurrentPrice());
                    return m;
                })
                .collect(Collectors.toList());

        // 4. skip(3) and limit(3) - Pagination demonstration
        List<String> paginatedBatch = allStocks.stream()
                .skip(3)
                .limit(3)
                .map(Stock::getSymbol)
                .collect(Collectors.toList());

        // 5. reduce() - Total market valuation of all stock shares
        BigDecimal totalCatalogPrice = allStocks.stream()
                .map(Stock::getCurrentPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // 6. summaryStatistics() - DoubleSummaryStatistics
        DoubleSummaryStatistics stats = allStocks.stream()
                .mapToDouble(s -> s.getCurrentPrice().doubleValue())
                .summaryStatistics();

        // 7. Collectors.groupingBy() - Count stocks grouped by sector
        Map<String, Long> sectorCounts = allStocks.stream()
                .collect(Collectors.groupingBy(Stock::getSector, Collectors.counting()));

        results.put("totalStocksProcessed", allStocks.size());
        results.put("gainersCount", gainers.size());
        results.put("gainersList", gainers);
        results.put("distinctSectorsCount", distinctSectors.size());
        results.put("distinctSectors", distinctSectors);
        results.put("top3HighestPriced", top3HighestPriced);
        results.put("paginationSample_skip3_limit3", paginatedBatch);
        results.put("totalCombinedSharePrice", totalCatalogPrice);
        results.put("streamSummaryStatistics", Map.of(
                "minPrice", stats.getMin(),
                "maxPrice", stats.getMax(),
                "averagePrice", Math.round(stats.getAverage() * 100.0) / 100.0,
                "count", stats.getCount()
        ));
        results.put("sectorDistribution", sectorCounts);

        return results;
    }

    /**
     * Generates a comparative data matrix for the Java Collections Framework.
     */
    public static List<Map<String, Object>> getCollectionsMatrix() {
        List<Map<String, Object>> list = new ArrayList<>();

        list.add(Map.of(
                "interface", "List",
                "collection", "ArrayList",
                "internalStructure", "Resizable dynamic array (Object[])",
                "timeComplexity", "Get: O(1), Add: O(1) amortized, Insert/Remove: O(n)",
                "ordering", "Indexed insertion order",
                "duplicatesAllowed", true,
                "tradeLensUsage", "Ledger of historical orders and stock catalog"
        ));

        list.add(Map.of(
                "interface", "List / Queue",
                "collection", "LinkedList",
                "internalStructure", "Doubly linked list (Node with prev & next pointers)",
                "timeComplexity", "Get: O(n), Add/Remove head/tail: O(1)",
                "ordering", "Sequential order",
                "duplicatesAllowed", true,
                "tradeLensUsage", "FIFO order execution buffer in ProducerConsumerOrderQueue"
        ));

        list.add(Map.of(
                "interface", "Map",
                "collection", "HashMap",
                "internalStructure", "Hash table (Array of Node buckets, treeified to Red-Black tree when bucket > 8)",
                "timeComplexity", "Get/Put: O(1) average, O(n) worst case",
                "ordering", "Unordered / non-deterministic",
                "duplicatesAllowed", false,
                "tradeLensUsage", "Instant O(1) session token and holding lookups"
        ));

        list.add(Map.of(
                "interface", "SortedMap / NavigableMap",
                "collection", "TreeMap",
                "internalStructure", "Self-balancing Red-Black binary search tree",
                "timeComplexity", "Get/Put/Remove: O(log n) guaranteed",
                "ordering", "Sorted naturally by key (Comparable) or Comparator",
                "duplicatesAllowed", false,
                "tradeLensUsage", "Historical date-indexed order timeline"
        ));

        list.add(Map.of(
                "interface", "Set",
                "collection", "HashSet",
                "internalStructure", "Backed by a HashMap instance",
                "timeComplexity", "Add/Contains/Remove: O(1) average",
                "ordering", "No ordering guarantee",
                "duplicatesAllowed", false,
                "tradeLensUsage", "Fast O(1) membership check for unique symbols"
        ));

        list.add(Map.of(
                "interface", "Queue",
                "collection", "PriorityQueue",
                "internalStructure", "Min-binary heap array",
                "timeComplexity", "Offer/Poll: O(log n), Peek: O(1)",
                "ordering", "Natural priority order (highest/lowest priority element always at root)",
                "duplicatesAllowed", true,
                "tradeLensUsage", "Urgency-based price alert triggers"
        ));

        return list;
    }
}
