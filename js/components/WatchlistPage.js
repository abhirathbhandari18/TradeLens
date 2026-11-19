/**
 * TradeLens — Watchlist Page
 * Displays watched NSE/BSE stocks with 7D sparklines, target prices, and notes.
 * Clicking any row opens that share's chart on the Dashboard.
 */

window.WatchlistPage = function WatchlistPage({
  watchlist,
  onUpdateWatchlist,
  onOpenChart,
  settings,
  onShowToast,
}) {
  const h = React.createElement;

  function handleRemove(e, sym) {
    e.stopPropagation();
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
          "Click any share to view its live chart, or add stocks from Markets & Dashboard."
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
            "Your watchlist is empty. Star any stock from the Dashboard or Markets page."
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
                    {
                      key: item.symbol,
                      style: { cursor: "pointer" },
                      onClick: () => onOpenChart(stock.symbol),
                    },
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
                          className: "btn btn-danger btn-sm",
                          onClick: (e) => handleRemove(e, stock.symbol),
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
