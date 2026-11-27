/**
 * TradeLens — Markets (All Shares) Page
 * Full-width directory of all NSE shares with sector filters, sorting, and one-click chart navigation.
 */

window.MarketsPage = function MarketsPage({
  watchlist,
  onToggleWatchlist,
  onOpenChart,
  settings,
  onShowToast,
}) {
  const h = React.createElement;
  const [filterText, setFilterText] = React.useState("");
  const [selectedSector, setSelectedSector] = React.useState("All");
  const [sortBy, setSortBy] = React.useState("default");
  const [, setTick] = React.useState(0);

  // Auto-refresh all NSE shares every 1.8 seconds
  React.useEffect(() => {
    let active = true;
    const refreshAll = async () => {
      try {
        await window.TradeLensAPI.fetchAllStocks();
        if (active) setTick((t) => t + 1);
      } catch {
        // Keep current prices if fetch fails
      }
    };
    refreshAll();
    const pollId = window.setInterval(refreshAll, 1800);
    return () => {
      active = false;
      window.clearInterval(pollId);
    };
  }, []);

  async function handleRefreshAllClick() {
    await window.TradeLensAPI.fetchAllStocks();
    setTick((t) => t + 1);
    if (onShowToast) {
      onShowToast("Refreshed all NSE share prices");
    }
  }

  async function handleRefreshShare(e, symbol) {
    e.stopPropagation();
    const fresh = await window.TradeLensAPI.fetchLiveQuote(symbol);
    setTick((t) => t + 1);
    if (onShowToast) {
      onShowToast(`${symbol}: ${window.TradeLensData.formatCurrency(fresh.price, settings.currency)}`);
    }
  }

  const allStocks = window.TradeLensData.STOCKS;
  const sectors = ["All", ...Array.from(new Set(allStocks.map((s) => s.sector)))];

  let visibleStocks = allStocks.filter((s) => {
    const matchesSector = selectedSector === "All" || s.sector === selectedSector;
    const q = filterText.trim().toLowerCase();
    const matchesQuery =
      !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    return matchesSector && matchesQuery;
  });

  if (sortBy === "gainers") {
    visibleStocks = [...visibleStocks].sort((a, b) => b.changePercent - a.changePercent);
  } else if (sortBy === "losers") {
    visibleStocks = [...visibleStocks].sort((a, b) => a.changePercent - b.changePercent);
  } else if (sortBy === "price") {
    visibleStocks = [...visibleStocks].sort((a, b) => b.price - a.price);
  }

  function MiniSparkline({ symbol, price, isUp }) {
    const pts = window.TradeLensData.generateSeries(symbol, price, "1W").slice(-16);
    const vals = pts.map((p) => p.close);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const d = pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * 78;
        const y = 22 - ((p.close - min) / range) * 18;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

    return h(
      "svg",
      { width: 82, height: 26, viewBox: "0 0 82 26" },
      h("path", {
        d,
        fill: "none",
        stroke: isUp ? "#15803d" : "#dc2626",
        strokeWidth: 1.75,
        strokeLinecap: "round",
      })
    );
  }

  return h(
    "div",
    null,
    h(
      "div",
      { className: "page-header" },
      h(
        "div",
        null,
        h("h1", { className: "page-title" }, "All NSE Shares"),
        h(
          "p",
          { className: "page-subtitle" },
          `Browse all ${allStocks.length} listed shares. Click any row to open its chart and trade.`
        )
      ),
      h(
        "div",
        { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } },
        h("input", {
          className: "input",
          style: { width: 220 },
          placeholder: "Filter by name or symbol...",
          value: filterText,
          onChange: (e) => setFilterText(e.target.value),
        }),
        h(
          "select",
          {
            className: "select",
            style: { width: 165 },
            value: sortBy,
            onChange: (e) => setSortBy(e.target.value),
          },
          h("option", { value: "default" }, "Sort: Default"),
          h("option", { value: "gainers" }, "Top Gainers"),
          h("option", { value: "losers" }, "Top Losers"),
          h("option", { value: "price" }, "Highest Price")
        ),
        h(
          "button",
          {
            type: "button",
            className: "btn btn-secondary",
            onClick: handleRefreshAllClick,
          },
          "↻ Refresh All"
        )
      )
    ),

    // Sector Filter Pills
    h(
      "div",
      { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 } },
      sectors.map((sec) =>
        h(
          "button",
          {
            key: sec,
            type: "button",
            className: `btn btn-sm ${selectedSector === sec ? "btn-primary" : "btn-secondary"}`,
            onClick: () => setSelectedSector(sec),
          },
          sec
        )
      )
    ),

    // All Shares Table
    h(
      "div",
      { className: "card" },
      h(
        "div",
        { className: "card-header" },
        h("h2", { className: "card-title" }, "NSE Equity Screener"),
        h("span", { className: "text-muted", style: { fontSize: "12.5px" } }, `Showing ${visibleStocks.length} of ${allStocks.length} shares`)
      ),
      h(
        "div",
        { className: "table-wrap" },
        h(
          "table",
          { className: "data-table" },
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              h("th", null, "Share"),
              h("th", null, "Sector"),
              h("th", null, "7D Trend"),
              h("th", null, "LTP"),
              h("th", null, "Day Change"),
              h("th", null, "Day High / Low"),
              h("th", null, "Volume"),
              h("th", null, "Mkt Cap"),
              h("th", null, "P/E"),
              h("th", { style: { textAlign: "right" } }, "Watchlist")
            )
          ),
          h(
            "tbody",
            null,
            visibleStocks.map((stock) => {
              const up = stock.change >= 0;
              const isWatched = watchlist.some((w) => w.symbol === stock.symbol);
              return h(
                "tr",
                {
                  key: stock.symbol,
                  style: { cursor: "pointer" },
                  onClick: () => onOpenChart(stock.symbol),
                },
                h(
                  "td",
                  null,
                  h("div", { style: { fontWeight: 600 } }, stock.symbol),
                  h("div", { className: "text-muted", style: { fontSize: "12px" } }, stock.name)
                ),
                h("td", { className: "text-muted", style: { fontSize: "12.5px" } }, stock.sector),
                h("td", null, h(MiniSparkline, { symbol: stock.symbol, price: stock.price, isUp: up })),
                h(
                  "td",
                  { className: "mono", style: { fontWeight: 600 } },
                  window.TradeLensData.formatCurrency(stock.price, settings.currency)
                ),
                h(
                  "td",
                  null,
                  h(
                    "span",
                    { className: `pill-badge ${up ? "pill-gain" : "pill-loss"}` },
                    `${up ? "+" : ""}${stock.changePercent.toFixed(2)}%`
                  )
                ),
                h(
                  "td",
                  { className: "mono text-muted", style: { fontSize: "12px" } },
                  `${window.TradeLensData.formatCurrency(stock.high, settings.currency)} / ${window.TradeLensData.formatCurrency(stock.low, settings.currency)}`
                ),
                h("td", { className: "mono" }, stock.volume),
                h("td", { className: "mono" }, stock.marketCap),
                h("td", { className: "mono" }, stock.peRatio),
                h(
                  "td",
                  { style: { textAlign: "right", whiteSpace: "nowrap" } },
                  h(
                    "button",
                    {
                      type: "button",
                      className: "btn btn-secondary btn-sm",
                      style: { marginRight: 6 },
                      onClick: (e) => handleRefreshShare(e, stock.symbol),
                    },
                    "↻ Live"
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      className: isWatched ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm",
                      onClick: (e) => {
                        e.stopPropagation();
                        onToggleWatchlist(stock.symbol);
                      },
                    },
                    isWatched ? "★ Watching" : "☆ Watch"
                  )
                )
              );
            })
          )
        )
      )
    )
  );
};

