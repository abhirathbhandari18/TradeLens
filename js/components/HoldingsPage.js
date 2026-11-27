/**
 * TradeLens — Holdings Page
 * Shows current equity holdings, average buy price, LTP, invested value, and P&L.
 */

window.HoldingsPage = function HoldingsPage({
  holdings,
  settings,
  onOpenChart,
  onShowToast,
}) {
  const h = React.createElement;
  const [, setTick] = React.useState(0);

  // Auto-refresh live LTP & P&L every 1.8 seconds
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

  async function handleRefreshShare(e, symbol) {
    e.stopPropagation();
    const fresh = await window.TradeLensAPI.fetchLiveQuote(symbol);
    setTick((t) => t + 1);
    if (onShowToast) {
      onShowToast(`${symbol}: ${window.TradeLensData.formatCurrency(fresh.price, settings.currency)}`);
    }
  }

  const enriched = holdings.map((item) => {
    const stock = window.TradeLensData.STOCKS.find((s) => s.symbol === item.symbol) || {
      symbol: item.symbol,
      name: item.symbol + " Ltd.",
      price: item.avgPrice,
      sector: "Equity",
    };
    const invested = item.qty * item.avgPrice;
    const current = item.qty * stock.price;
    const pnl = current - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

    return {
      ...item,
      name: stock.name,
      sector: stock.sector,
      ltp: stock.price,
      invested,
      current,
      pnl,
      pnlPct,
    };
  });

  const totalInvested = enriched.reduce((sum, r) => sum + r.invested, 0);
  const totalCurrent = enriched.reduce((sum, r) => sum + r.current, 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const isTotalUp = totalPnl >= 0;

  return h(
    "div",
    null,
    h(
      "div",
      { className: "page-header" },
      h(
        "div",
        null,
        h("h1", { className: "page-title" }, "Holdings"),
        h(
          "p",
          { className: "page-subtitle" },
          "Long-term and positional Indian equity holdings in your Demat account."
        )
      )
    ),

    // Summary Strip
    h(
      "div",
      { className: "ticker-strip" },
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Total Invested"),
          h("div", { className: "stock-price-big", style: { fontSize: "20px" } }, window.TradeLensData.formatCurrency(totalInvested, settings.currency))
        )
      ),
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Current Value"),
          h("div", { className: "stock-price-big", style: { fontSize: "20px" } }, window.TradeLensData.formatCurrency(totalCurrent, settings.currency))
        )
      ),
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Overall P&L"),
          h(
            "div",
            {
              className: `stock-price-big ${isTotalUp ? "text-gain" : "text-loss"}`,
              style: { fontSize: "20px" },
            },
            `${isTotalUp ? "+" : ""}${window.TradeLensData.formatCurrency(totalPnl, settings.currency)}`
          )
        )
      ),
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Net Return"),
          h(
            "div",
            {
              className: `stock-price-big ${isTotalUp ? "text-gain" : "text-loss"}`,
              style: { fontSize: "20px" },
            },
            `${isTotalUp ? "+" : ""}${totalPnlPct.toFixed(2)}%`
          )
        )
      )
    ),

    // Holdings Table
    h(
      "div",
      { className: "card" },
      h(
        "div",
        { className: "card-header" },
        h("h2", { className: "card-title" }, "Equity Holdings"),
        h("span", { className: "text-muted", style: { fontSize: "12.5px" } }, `${enriched.length} positions`)
      ),
      enriched.length === 0
        ? h(
            "div",
            { className: "card-body text-muted", style: { textAlign: "center", padding: "36px 18px" } },
            "No holdings yet. Buy an NSE stock from the Dashboard to see it here."
          )
        : h(
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
                  h("th", null, "Instrument"),
                  h("th", null, "Qty"),
                  h("th", null, "Avg. Cost"),
                  h("th", null, "LTP"),
                  h("th", null, "Invested"),
                  h("th", null, "Current Val"),
                  h("th", null, "P&L"),
                  h("th", { style: { textAlign: "right" } }, "Action")
                )
              ),
              h(
                "tbody",
                null,
                enriched.map((row) => {
                  const up = row.pnl >= 0;
                  return h(
                    "tr",
                    {
                      key: row.symbol,
                      style: { cursor: "pointer" },
                      onClick: () => onOpenChart(row.symbol),
                    },
                    h(
                      "td",
                      null,
                      h("div", { style: { fontWeight: 600 } }, row.symbol),
                      h("div", { className: "text-muted", style: { fontSize: "12px" } }, row.name)
                    ),
                    h("td", { className: "mono" }, row.qty),
                    h("td", { className: "mono" }, window.TradeLensData.formatCurrency(row.avgPrice, settings.currency)),
                    h("td", { className: "mono", style: { fontWeight: 600 } }, window.TradeLensData.formatCurrency(row.ltp, settings.currency)),
                    h("td", { className: "mono" }, window.TradeLensData.formatCurrency(row.invested, settings.currency)),
                    h("td", { className: "mono", style: { fontWeight: 600 } }, window.TradeLensData.formatCurrency(row.current, settings.currency)),
                    h(
                      "td",
                      null,
                      h(
                        "div",
                        { className: `mono ${up ? "text-gain" : "text-loss"}`, style: { fontWeight: 600 } },
                        `${up ? "+" : ""}${window.TradeLensData.formatCurrency(row.pnl, settings.currency)}`
                      ),
                      h(
                        "span",
                        { className: `pill-badge ${up ? "pill-gain" : "pill-loss"}` },
                        `${up ? "+" : ""}${row.pnlPct.toFixed(2)}%`
                      )
                    ),
                    h(
                      "td",
                      { style: { textAlign: "right", whiteSpace: "nowrap" } },
                      h(
                        "button",
                        {
                          type: "button",
                          className: "btn btn-secondary btn-sm",
                          style: { marginRight: 6 },
                          onClick: (e) => handleRefreshShare(e, row.symbol),
                        },
                        "↻ Live"
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          className: "btn btn-secondary btn-sm",
                          onClick: () => onOpenChart(row.symbol),
                        },
                        "Trade / Chart"
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

