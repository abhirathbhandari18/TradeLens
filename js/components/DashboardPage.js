/**
 * TradeLens — Dashboard Page
 * Displays market overview, interactive stock graph, key fundamentals, and ticker switcher.
 */

window.DashboardPage = function DashboardPage({
  selectedSymbol,
  onSelectSymbol,
  wishlist,
  onToggleWishlist,
  settings,
  onShowToast,
}) {
  const h = React.createElement;
  const [quote, setQuote] = React.useState(null);
  const [loadingQuote, setLoadingQuote] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState(settings.defaultTimeframe || "1M");
  const [chartType, setChartType] = React.useState(settings.defaultChartType || "area");
  const [customTicker, setCustomTicker] = React.useState("");

  const loadQuote = React.useCallback(
    async (sym) => {
      setLoadingQuote(true);
      const data = await window.TradeLensAPI.fetchLiveQuote(sym);
      setQuote(data);
      setLoadingQuote(false);
    },
    []
  );

  React.useEffect(() => {
    loadQuote(selectedSymbol);
  }, [selectedSymbol, settings.apiKey, settings.provider, loadQuote]);

  const activeStock =
    quote ||
    window.TradeLensData.STOCKS.find((s) => s.symbol === selectedSymbol) ||
    window.TradeLensData.STOCKS[0];

  const isPositive = activeStock.change >= 0;
  const isWishlisted = wishlist.some((w) => w.symbol === activeStock.symbol);

  const series = React.useMemo(
    () => window.TradeLensData.generateSeries(activeStock.symbol, activeStock.price, timeframe),
    [activeStock.symbol, activeStock.price, timeframe]
  );

  const topFour = window.TradeLensData.STOCKS.slice(0, 4);

  function handleCustomTickerSubmit(e) {
    e.preventDefault();
    const sym = customTicker.trim().toUpperCase();
    if (!sym) return;
    onSelectSymbol(sym);
    setCustomTicker("");
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
        h("h1", { className: "page-title" }, "Market Dashboard"),
        h(
          "p",
          { className: "page-subtitle" },
          activeStock.isLive
            ? `Live quote via ${settings.provider} API`
            : "Showing preview market data · Add an API key in Settings for live quotes"
        )
      ),
      h(
        "form",
        { onSubmit: handleCustomTickerSubmit, style: { display: "flex", gap: 8 } },
        h("input", {
          className: "input",
          style: { width: 170 },
          placeholder: "Load ticker (e.g. AMD)",
          value: customTicker,
          onChange: (e) => setCustomTicker(e.target.value),
        }),
        h("button", { type: "submit", className: "btn btn-secondary" }, "Load")
      )
    ),

    // Top 4 Market Strip
    h(
      "div",
      { className: "ticker-strip" },
      topFour.map((item) => {
        const up = item.change >= 0;
        const active = item.symbol === activeStock.symbol;
        return h(
          "button",
          {
            key: item.symbol,
            type: "button",
            className: `ticker-mini-card ${active ? "active" : ""}`,
            onClick: () => onSelectSymbol(item.symbol),
          },
          h(
            "div",
            { className: "ticker-mini-top" },
            h("span", { className: "ticker-mini-symbol" }, item.symbol),
            h(
              "span",
              { className: `pill-badge ${up ? "pill-gain" : "pill-loss"}` },
              `${up ? "+" : ""}${item.changePercent.toFixed(2)}%`
            )
          ),
          h(
            "div",
            { className: "ticker-mini-price" },
            window.TradeLensData.formatCurrency(item.price, settings.currency)
          ),
          h("div", { className: "text-muted", style: { fontSize: "12px", marginTop: 2 } }, item.name)
        );
      })
    ),

    // Main Grid: Chart + Right Market List
    h(
      "div",
      { className: "dashboard-grid" },
      // Left: Main Stock Chart & Stats
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h(
            "div",
            { className: "stock-header-bar" },
            h(
              "div",
              { className: "stock-title-group" },
              h(
                "div",
                { className: "stock-symbol-row" },
                h("span", { className: "stock-symbol" }, activeStock.symbol),
                h("span", { className: "stock-exchange" }, activeStock.exchange),
                h("span", { className: "text-muted", style: { fontSize: "13px" } }, activeStock.name)
              ),
              h(
                "div",
                { className: "stock-price-row" },
                h(
                  "span",
                  { className: "stock-price-big" },
                  window.TradeLensData.formatCurrency(activeStock.price, settings.currency)
                ),
                h(
                  "span",
                  { className: `pill-badge ${isPositive ? "pill-gain" : "pill-loss"}` },
                  `${isPositive ? "+" : ""}${activeStock.change.toFixed(2)} (${isPositive ? "+" : ""}${activeStock.changePercent.toFixed(2)}%)`
                )
              )
            ),
            h(
              "div",
              { style: { display: "flex", gap: 8 } },
              h(
                "button",
                {
                  type: "button",
                  className: "btn btn-secondary btn-sm",
                  disabled: loadingQuote,
                  onClick: async () => {
                    await loadQuote(activeStock.symbol);
                    onShowToast(`Refreshed ${activeStock.symbol}`);
                  },
                },
                loadingQuote ? "Refreshing..." : "Refresh"
              ),
              h(
                "button",
                {
                  type: "button",
                  className: isWishlisted ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm",
                  onClick: () => onToggleWishlist(activeStock.symbol),
                },
                isWishlisted ? "★ In Wishlist" : "☆ Add to Wishlist"
              )
            )
          ),

          h(window.StockChart, {
            series,
            timeframe,
            onTimeframeChange: setTimeframe,
            chartType,
            onChartTypeChange: setChartType,
            currency: settings.currency,
            isPositive,
          }),

          h(
            "div",
            { className: "stats-grid" },
            h(
              "div",
              { className: "stat-box" },
              h("div", { className: "stat-label" }, "Open"),
              h("div", { className: "stat-value" }, window.TradeLensData.formatCurrency(activeStock.open, settings.currency))
            ),
            h(
              "div",
              { className: "stat-box" },
              h("div", { className: "stat-label" }, "Day High"),
              h("div", { className: "stat-value" }, window.TradeLensData.formatCurrency(activeStock.high, settings.currency))
            ),
            h(
              "div",
              { className: "stat-box" },
              h("div", { className: "stat-label" }, "Day Low"),
              h("div", { className: "stat-value" }, window.TradeLensData.formatCurrency(activeStock.low, settings.currency))
            ),
            h(
              "div",
              { className: "stat-box" },
              h("div", { className: "stat-label" }, "Volume"),
              h("div", { className: "stat-value" }, activeStock.volume)
            ),
            h(
              "div",
              { className: "stat-box" },
              h("div", { className: "stat-label" }, "Market Cap"),
              h("div", { className: "stat-value" }, activeStock.marketCap)
            ),
            h(
              "div",
              { className: "stat-box" },
              h("div", { className: "stat-label" }, "P/E Ratio"),
              h("div", { className: "stat-value" }, activeStock.peRatio)
            ),
            h(
              "div",
              { className: "stat-box" },
              h("div", { className: "stat-label" }, "Sector"),
              h("div", { className: "stat-value", style: { fontFamily: "var(--font-sans)", fontSize: "13px" } }, activeStock.sector)
            ),
            h(
              "div",
              { className: "stat-box" },
              h("div", { className: "stat-label" }, "Feed"),
              h("div", { className: "stat-value", style: { fontFamily: "var(--font-sans)", fontSize: "13px" } }, activeStock.isLive ? "Live API" : "Demo")
            )
          )
        )
      ),

      // Right: Market Watch List
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-header" },
          h("h2", { className: "card-title" }, "Market Watch"),
          h("span", { className: "text-muted", style: { fontSize: "12px" } }, `${window.TradeLensData.STOCKS.length} symbols`)
        ),
        h(
          "div",
          null,
          window.TradeLensData.STOCKS.map((stock) => {
            const up = stock.change >= 0;
            const isSelected = stock.symbol === activeStock.symbol;
            return h(
              "div",
              {
                key: stock.symbol,
                className: `stock-list-row ${isSelected ? "active" : ""}`,
                onClick: () => onSelectSymbol(stock.symbol),
              },
              h(
                "div",
                null,
                h("div", { style: { fontWeight: 600 } }, stock.symbol),
                h("div", { className: "text-muted", style: { fontSize: "12px" } }, stock.name)
              ),
              h(
                "div",
                { style: { textAlign: "right" } },
                h(
                  "div",
                  { className: "mono", style: { fontWeight: 600, fontSize: "13.5px" } },
                  window.TradeLensData.formatCurrency(stock.price, settings.currency)
                ),
                h(
                  "div",
                  { className: `mono ${up ? "text-gain" : "text-loss"}`, style: { fontSize: "12px" } },
                  `${up ? "+" : ""}${stock.changePercent.toFixed(2)}%`
                )
              )
            );
          })
        )
      )
    )
  );
};

