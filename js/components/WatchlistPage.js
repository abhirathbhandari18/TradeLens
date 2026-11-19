/**
 * TradeLens — Watchlist Page
 * Manage watched NSE/BSE stocks, target prices, notes, and jump to their chart.
 */

window.WatchlistPage = function WatchlistPage({
  watchlist,
  onUpdateWatchlist,
  onOpenChart,
  settings,
  onShowToast,
}) {
  const h = React.createElement;
  const [symbolInput, setSymbolInput] = React.useState("");
  const [targetInput, setTargetInput] = React.useState("");
  const [noteInput, setNoteInput] = React.useState("");

  function handleAdd(e) {
    e.preventDefault();
    const sym = symbolInput.trim().toUpperCase();
    if (!sym) return;
    if (watchlist.some((item) => item.symbol === sym)) {
      onShowToast(`${sym} is already in your watchlist.`);
      return;
    }
    const next = [
      ...watchlist,
      {
        symbol: sym,
        targetPrice: targetInput.trim() || "—",
        note: noteInput.trim() || "Watching price action",
      },
    ];
    onUpdateWatchlist(next);
    setSymbolInput("");
    setTargetInput("");
    setNoteInput("");
    onShowToast(`Added ${sym} to watchlist`);
  }

  function handleRemove(sym) {
    const next = watchlist.filter((item) => item.symbol !== sym);
    onUpdateWatchlist(next);
    onShowToast(`Removed ${sym} from watchlist`);
  }

  function MiniSparkline({ symbol, price, isUp }) {
    const pts = window.TradeLensData.generateSeries(symbol, price, "1W").slice(-16);
    const vals = pts.map((p) => p.close);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const d = pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * 84;
        const y = 24 - ((p.close - min) / range) * 20;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

    return h(
      "svg",
      { width: 88, height: 28, viewBox: "0 0 88 28" },
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
        h("h1", { className: "page-title" }, "Watchlist"),
        h(
          "p",
          { className: "page-subtitle" },
          "Track Indian equities you are monitoring and set target entry prices."
        )
      )
    ),

    // Add to Watchlist Bar
    h(
      "div",
      { className: "card", style: { marginBottom: 20 } },
      h(
        "div",
        { className: "card-body" },
        h(
          "form",
          {
            onSubmit: handleAdd,
            style: {
              display: "grid",
              gridTemplateColumns: "150px 150px 1fr auto",
              gap: 12,
              alignItems: "end",
            },
          },
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "NSE Symbol"),
            h("input", {
              className: "input",
              placeholder: "e.g. RELIANCE",
              value: symbolInput,
              onChange: (e) => setSymbolInput(e.target.value),
            })
          ),
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "Target Price (₹)"),
            h("input", {
              className: "input",
              placeholder: "e.g. 1350.00",
              value: targetInput,
              onChange: (e) => setTargetInput(e.target.value),
            })
          ),
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "Note"),
            h("input", {
              className: "input",
              placeholder: "Optional thesis or alert note",
              value: noteInput,
              onChange: (e) => setNoteInput(e.target.value),
            })
          ),
          h("button", { type: "submit", className: "btn btn-primary" }, "+ Add Stock")
        )
      )
    ),

    // Watchlist Table
    h(
      "div",
      { className: "card" },
      h(
        "div",
        { className: "card-header" },
        h("h2", { className: "card-title" }, "Watched Stocks"),
        h("span", { className: "text-muted", style: { fontSize: "12.5px" } }, `${watchlist.length} stocks`)
      ),
      watchlist.length === 0
        ? h(
            "div",
            { className: "card-body text-muted", style: { textAlign: "center", padding: "36px 18px" } },
            "Your watchlist is empty. Add an NSE symbol above or star one from the Dashboard."
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
                  h("th", null, "Symbol"),
                  h("th", null, "7D Trend"),
                  h("th", null, "Last Price"),
                  h("th", null, "Change"),
                  h("th", null, "Target"),
                  h("th", null, "Notes"),
                  h("th", { style: { textAlign: "right" } }, "Actions")
                )
              ),
              h(
                "tbody",
                null,
                watchlist.map((item) => {
                  const stock = window.TradeLensData.STOCKS.find((s) => s.symbol === item.symbol) || {
                    symbol: item.symbol,
                    name: item.symbol + " Ltd.",
                    price: 1000.0,
                    change: 8.5,
                    changePercent: 0.86,
                  };
                  const up = stock.change >= 0;

                  return h(
                    "tr",
                    { key: item.symbol },
                    h(
                      "td",
                      null,
                      h("div", { style: { fontWeight: 600 } }, stock.symbol),
                      h("div", { className: "text-muted", style: { fontSize: "12px" } }, stock.name)
                    ),
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
                    h("td", { className: "mono" }, item.targetPrice !== "—" ? `₹${item.targetPrice}` : "—"),
                    h("td", { className: "text-muted", style: { maxWidth: 240 } }, item.note || "—"),
                    h(
                      "td",
                      { style: { textAlign: "right", whiteSpace: "nowrap" } },
                      h(
                        "button",
                        {
                          type: "button",
                          className: "btn btn-secondary btn-sm",
                          style: { marginRight: 8 },
                          onClick: () => onOpenChart(stock.symbol),
                        },
                        "View Chart"
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          className: "btn btn-danger btn-sm",
                          onClick: () => handleRemove(stock.symbol),
                        },
                        "Remove"
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

