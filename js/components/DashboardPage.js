/**
 * TradeLens — Dashboard Page
 * Displays NSE/BSE market overview, interactive stock graph, quick order ticket, and ticker switcher.
 */

window.DashboardPage = function DashboardPage({
  selectedSymbol,
  onSelectSymbol,
  watchlist,
  onToggleWatchlist,
  cashBalance,
  onPlaceOrder,
  onOpenMarkets,
  settings,
  onShowToast,
}) {
  const h = React.createElement;
  const [quote, setQuote] = React.useState(null);
  const [loadingQuote, setLoadingQuote] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState(settings.defaultTimeframe || "1M");
  const [chartType, setChartType] = React.useState(settings.defaultChartType || "area");
  const [customTicker, setCustomTicker] = React.useState("");

  // Quick Order Ticket state
  const [orderSide, setOrderSide] = React.useState("BUY");
  const [orderType, setOrderType] = React.useState("MARKET");
  const [orderQty, setOrderQty] = React.useState("1");
  const [limitPrice, setLimitPrice] = React.useState("");

  const loadQuote = React.useCallback(async (sym) => {
    setLoadingQuote(true);
    const data = await window.TradeLensAPI.fetchLiveQuote(sym);
    setQuote(data);
    setLoadingQuote(false);
  }, []);

  React.useEffect(() => {
    loadQuote(selectedSymbol);
  }, [selectedSymbol, settings.apiKey, settings.provider, loadQuote]);

  const activeStock =
    quote ||
    window.TradeLensData.STOCKS.find((s) => s.symbol === selectedSymbol) ||
    window.TradeLensData.STOCKS[0];

  const isWatchlisted = watchlist.some((w) => w.symbol === activeStock.symbol);

  const series = React.useMemo(
    () => window.TradeLensData.generateSeries(activeStock.symbol, activeStock.price, timeframe),
    [activeStock.symbol, activeStock.price, timeframe]
  );

  // Compute change & direction for the selected duration so the rate badge and graph color always match
  const periodChange =
    series.length > 1
      ? series[series.length - 1].close - series[0].close
      : activeStock.change;
  const periodChangePct =
    series.length > 1 && series[0].close > 0
      ? (periodChange / series[0].close) * 100
      : activeStock.changePercent;
  const isPositive = periodChange >= 0;

  const topFour = window.TradeLensData.STOCKS.slice(0, 4);

  function handleCustomTickerSubmit(e) {
    e.preventDefault();
    const sym = customTicker.trim().toUpperCase();
    if (!sym) return;
    onSelectSymbol(sym);
    setCustomTicker("");
  }

  function handleOrderSubmit(e) {
    e.preventDefault();
    const execPrice =
      orderType === "LIMIT" && Number(limitPrice) > 0 ? Number(limitPrice) : activeStock.price;
    onPlaceOrder({
      symbol: activeStock.symbol,
      side: orderSide,
      orderType,
      qty: orderQty,
      price: execPrice,
    });
  }

  const estTotal = (parseInt(orderQty, 10) || 0) * (orderType === "LIMIT" && Number(limitPrice) > 0 ? Number(limitPrice) : activeStock.price);

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
            ? `Live NSE quote via ${settings.provider} API`
            : "Showing NSE preview data · Add an API key in Settings for live quotes"
        )
      ),
      h(
        "form",
        { onSubmit: handleCustomTickerSubmit, style: { display: "flex", gap: 8 } },
        h("input", {
          className: "input",
          style: { width: 190 },
          placeholder: "Load NSE ticker (e.g. WIPRO)",
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

    // Main Grid: Chart + Right Sidebar (Order Ticket & Market Watch)
    h(
      "div",
      { className: "dashboard-grid" },
      // Left: Main Stock Chart & Fundamentals
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
                  `${isPositive ? "+" : ""}${periodChange.toFixed(2)} (${isPositive ? "+" : ""}${periodChangePct.toFixed(2)}%) · ${timeframe}`
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
                  className: isWatchlisted ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm",
                  onClick: () => onToggleWatchlist(activeStock.symbol),
                },
                isWatchlisted ? "★ In Watchlist" : "☆ Add to Watchlist"
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
              h("div", { className: "stat-value", style: { fontFamily: "var(--font-sans)", fontSize: "13px" } }, activeStock.isLive ? "Live API" : "NSE Demo")
            )
          )
        )
      ),

      // Right Column: Quick Order Ticket + Market Watch
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 16 } },
        // Quick Order Ticket
        h(
          "div",
          { className: "card" },
          h(
            "div",
            { className: "card-header" },
            h("h2", { className: "card-title" }, `Trade ${activeStock.symbol}`),
            h("span", { className: "mono text-muted", style: { fontSize: "12px" } }, `Margin ${window.TradeLensData.formatCurrency(cashBalance, settings.currency)}`)
          ),
          h(
            "form",
            { className: "card-body form-stack", onSubmit: handleOrderSubmit },
            h(
              "div",
              { className: "segmented", style: { width: "100%" } },
              h(
                "button",
                {
                  type: "button",
                  className: orderSide === "BUY" ? "active" : "",
                  style: { flex: 1, color: orderSide === "BUY" ? "#15803d" : undefined },
                  onClick: () => setOrderSide("BUY"),
                },
                "BUY"
              ),
              h(
                "button",
                {
                  type: "button",
                  className: orderSide === "SELL" ? "active" : "",
                  style: { flex: 1, color: orderSide === "SELL" ? "#dc2626" : undefined },
                  onClick: () => setOrderSide("SELL"),
                },
                "SELL"
              )
            ),
            h(
              "div",
              { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
              h(
                "div",
                { className: "field" },
                h("label", { className: "field-label" }, "Qty"),
                h("input", {
                  className: "input mono",
                  type: "number",
                  min: 1,
                  value: orderQty,
                  onChange: (e) => setOrderQty(e.target.value),
                })
              ),
              h(
                "div",
                { className: "field" },
                h("label", { className: "field-label" }, "Order Type"),
                h(
                  "select",
                  {
                    className: "select",
                    value: orderType,
                    onChange: (e) => setOrderType(e.target.value),
                  },
                  h("option", { value: "MARKET" }, "Market"),
                  h("option", { value: "LIMIT" }, "Limit")
                )
              )
            ),
            orderType === "LIMIT" &&
              h(
                "div",
                { className: "field" },
                h("label", { className: "field-label" }, "Limit Price"),
                h("input", {
                  className: "input mono",
                  type: "number",
                  step: "0.05",
                  placeholder: String(activeStock.price),
                  value: limitPrice,
                  onChange: (e) => setLimitPrice(e.target.value),
                })
              ),
            h(
              "div",
              { style: { display: "flex", justifyContent: "space-between", fontSize: "12.5px" } },
              h("span", { className: "text-muted" }, "Est. Order Value"),
              h("span", { className: "mono", style: { fontWeight: 600 } }, window.TradeLensData.formatCurrency(estTotal, settings.currency))
            ),
            h(
              "button",
              {
                type: "submit",
                className: "btn",
                style: {
                  width: "100%",
                  backgroundColor: orderSide === "BUY" ? "#15803d" : "#dc2626",
                  color: "#ffffff",
                },
              },
              `${orderSide} ${activeStock.symbol}`
            )
          )
        ),

        // NSE Market Watch List
        h(
          "div",
          { className: "card" },
          h(
            "div",
            { className: "card-header" },
            h("h2", { className: "card-title" }, "NSE Market Watch"),
            h(
              "button",
              {
                type: "button",
                className: "btn btn-ghost btn-sm",
                onClick: onOpenMarkets,
              },
              "View All →"
            )
          ),
          h(
            "div",
            { style: { maxHeight: 340, overflowY: "auto" } },
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
    )
  );
};
