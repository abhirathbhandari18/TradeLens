/**
 * TradeLens — Portfolio Page
 * Detailed portfolio valuation, Day's P&L, Asset Mix, Sector Allocation,
 * Top/Bottom performers, and clickable positions breakdown.
 */

window.PortfolioPage = function PortfolioPage({
  holdings,
  cashBalance,
  onAddFunds,
  onOpenHoldings,
  onOpenChart,
  settings,
  onShowToast,
}) {
  const h = React.createElement;
  const [fundInput, setFundInput] = React.useState("");

  const enriched = holdings.map((item) => {
    const stock = window.TradeLensData.STOCKS.find((s) => s.symbol === item.symbol) || {
      symbol: item.symbol,
      name: item.symbol + " Ltd.",
      price: item.avgPrice,
      change: 0,
      changePercent: 0,
      sector: "Equity",
    };
    const invested = item.qty * item.avgPrice;
    const current = item.qty * stock.price;
    const pnl = current - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    const dayPnl = item.qty * (stock.change || 0);
    return {
      ...item,
      name: stock.name,
      sector: stock.sector,
      ltp: stock.price,
      dayChangePct: stock.changePercent || 0,
      current,
      invested,
      pnl,
      pnlPct,
      dayPnl,
    };
  });

  const equityValue = enriched.reduce((sum, r) => sum + r.current, 0);
  const totalInvested = enriched.reduce((sum, r) => sum + r.invested, 0);
  const totalPnl = equityValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const daysPnl = enriched.reduce((sum, r) => sum + r.dayPnl, 0);
  const totalPortfolio = equityValue + cashBalance;

  const equityPct = totalPortfolio > 0 ? (equityValue / totalPortfolio) * 100 : 0;
  const cashPct = totalPortfolio > 0 ? (cashBalance / totalPortfolio) * 100 : 0;

  const isUp = totalPnl >= 0;
  const isDayUp = daysPnl >= 0;

  // Sort for best & worst performers
  const sortedByReturn = [...enriched].sort((a, b) => b.pnlPct - a.pnlPct);
  const bestStock = sortedByReturn[0] || null;
  const worstStock = sortedByReturn[sortedByReturn.length - 1] || null;

  // Sector allocation
  const sectorMap = {};
  enriched.forEach((item) => {
    sectorMap[item.sector] = (sectorMap[item.sector] || 0) + item.current;
  });
  const sectors = Object.entries(sectorMap)
    .map(([sector, value]) => ({
      sector,
      value,
      pct: equityValue > 0 ? (value / equityValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  function handleDeposit(e) {
    e.preventDefault();
    const amt = Number(fundInput);
    if (!amt || amt <= 0) {
      onShowToast("Enter a valid amount in INR.");
      return;
    }
    onAddFunds(amt);
    setFundInput("");
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
        h("h1", { className: "page-title" }, "Portfolio"),
        h(
          "p",
          { className: "page-subtitle" },
          "Valuation, asset mix, day's P&L, sector exposure, and position weights."
        )
      ),
      h(
        "button",
        { type: "button", className: "btn btn-secondary", onClick: onOpenHoldings },
        "View Detailed Holdings"
      )
    ),

    // Top 4 Portfolio KPIs
    h(
      "div",
      { className: "ticker-strip" },
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Total Portfolio Value"),
          h("div", { className: "stock-price-big", style: { fontSize: "20px" } }, window.TradeLensData.formatCurrency(totalPortfolio, settings.currency)),
          h("div", { className: "text-muted", style: { fontSize: "12px", marginTop: 4 } }, `Equity ${equityPct.toFixed(0)}% · Cash ${cashPct.toFixed(0)}%`)
        )
      ),
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Day's P&L"),
          h(
            "div",
            {
              className: `stock-price-big ${isDayUp ? "text-gain" : "text-loss"}`,
              style: { fontSize: "20px" },
            },
            `${isDayUp ? "+" : ""}${window.TradeLensData.formatCurrency(daysPnl, settings.currency)}`
          ),
          h("div", { className: "text-muted", style: { fontSize: "12px", marginTop: 4 } }, "Intraday change on holdings")
        )
      ),
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Unrealized P&L"),
          h(
            "div",
            {
              className: `stock-price-big ${isUp ? "text-gain" : "text-loss"}`,
              style: { fontSize: "20px" },
            },
            `${isUp ? "+" : ""}${window.TradeLensData.formatCurrency(totalPnl, settings.currency)}`
          ),
          h(
            "div",
            { className: `mono ${isUp ? "text-gain" : "text-loss"}`, style: { fontSize: "12px", marginTop: 4 } },
            `${isUp ? "+" : ""}${totalPnlPct.toFixed(2)}% overall return`
          )
        )
      ),
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Available Margin"),
          h("div", { className: "stock-price-big", style: { fontSize: "20px" } }, window.TradeLensData.formatCurrency(cashBalance, settings.currency)),
          h("div", { className: "text-muted", style: { fontSize: "12px", marginTop: 4 } }, `Invested ${window.TradeLensData.formatCurrency(totalInvested, settings.currency)}`)
        )
      )
    ),

    // Two-column layout: Sector Allocation + Asset Mix / Performers / Funds
    h(
      "div",
      { className: "settings-grid", style: { marginBottom: 20 } },
      // Left: Sector Allocation & Asset Mix
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-header" },
          h("h2", { className: "card-title" }, "Asset Mix & Sector Allocation"),
          h("span", { className: "text-muted", style: { fontSize: "12px" } }, "By current value")
        ),
        h(
          "div",
          { className: "card-body form-stack" },
          // Asset Mix Bar
          h(
            "div",
            { style: { paddingBottom: 12, borderBottom: "1px solid var(--border-light)" } },
            h(
              "div",
              { style: { display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: 6 } },
              h("span", { style: { fontWeight: 600 } }, `NSE Equities (${equityPct.toFixed(1)}%)`),
              h("span", { className: "text-muted" }, `Cash Margin (${cashPct.toFixed(1)}%)`)
            ),
            h(
              "div",
              { style: { display: "flex", height: 10, borderRadius: 999, overflow: "hidden", backgroundColor: "#e2e8f0" } },
              h("div", { style: { width: `${equityPct}%`, backgroundColor: "#1d4ed8" } }),
              h("div", { style: { width: `${cashPct}%`, backgroundColor: "#94a3b8" } })
            )
          ),
          // Sectors
          sectors.length === 0
            ? h("div", { className: "text-muted" }, "No active holdings to display.")
            : sectors.map((sec) =>
                h(
                  "div",
                  { key: sec.sector },
                  h(
                    "div",
                    { style: { display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "13px" } },
                    h("span", { style: { fontWeight: 500 } }, sec.sector),
                    h(
                      "span",
                      { className: "mono text-muted" },
                      `${sec.pct.toFixed(1)}% · ${window.TradeLensData.formatCurrency(sec.value, settings.currency)}`
                    )
                  ),
                  h(
                    "div",
                    {
                      style: {
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "#f1f5f9",
                        overflow: "hidden",
                      },
                    },
                    h("div", {
                      style: {
                        width: `${Math.min(100, sec.pct).toFixed(1)}%`,
                        height: "100%",
                        backgroundColor: "#0f172a",
                        borderRadius: 999,
                      },
                    })
                  )
                )
              )
        )
      ),

      // Right: Top/Bottom Performers & Deposit Funds
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 20 } },
        h(
          "div",
          { className: "card" },
          h(
            "div",
            { className: "card-header" },
            h("h2", { className: "card-title" }, "Performance Highlights")
          ),
          h(
            "div",
            { className: "card-body form-stack" },
            bestStock
              ? h(
                  "div",
                  {
                    className: "stock-list-row",
                    style: { padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: 8 },
                    onClick: () => onOpenChart(bestStock.symbol),
                  },
                  h(
                    "div",
                    null,
                    h("div", { className: "stat-label" }, "Top Performer"),
                    h("div", { style: { fontWeight: 600 } }, `${bestStock.symbol} · ${bestStock.name}`)
                  ),
                  h(
                    "div",
                    { style: { textAlign: "right" } },
                    h("span", { className: `pill-badge ${bestStock.pnl >= 0 ? "pill-gain" : "pill-loss"}` }, `${bestStock.pnlPct >= 0 ? "+" : ""}${bestStock.pnlPct.toFixed(2)}%`),
                    h("div", { className: "mono text-muted", style: { fontSize: "12px", marginTop: 3 } }, window.TradeLensData.formatCurrency(bestStock.pnl, settings.currency))
                  )
                )
              : h("div", { className: "text-muted" }, "No positions yet."),
            worstStock &&
              worstStock.symbol !== bestStock?.symbol &&
              h(
                "div",
                {
                  className: "stock-list-row",
                  style: { padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: 8 },
                  onClick: () => onOpenChart(worstStock.symbol),
                },
                h(
                  "div",
                  null,
                  h("div", { className: "stat-label" }, "Lagging Position"),
                  h("div", { style: { fontWeight: 600 } }, `${worstStock.symbol} · ${worstStock.name}`)
                ),
                h(
                  "div",
                  { style: { textAlign: "right" } },
                  h("span", { className: `pill-badge ${worstStock.pnl >= 0 ? "pill-gain" : "pill-loss"}` }, `${worstStock.pnlPct >= 0 ? "+" : ""}${worstStock.pnlPct.toFixed(2)}%`),
                  h("div", { className: "mono text-muted", style: { fontSize: "12px", marginTop: 3 } }, window.TradeLensData.formatCurrency(worstStock.pnl, settings.currency))
                )
              )
          )
        ),

        h(
          "div",
          { className: "card" },
          h(
            "div",
            { className: "card-header" },
            h("h2", { className: "card-title" }, "Add Virtual Funds")
          ),
          h(
            "form",
            {
              className: "card-body",
              onSubmit: handleDeposit,
              style: { display: "flex", gap: 10, alignItems: "center" },
            },
            h("input", {
              className: "input mono",
              type: "number",
              min: 100,
              step: "100",
              placeholder: "Amount in ₹ (e.g. 50000)",
              value: fundInput,
              onChange: (e) => setFundInput(e.target.value),
            }),
            h("button", { type: "submit", className: "btn btn-primary" }, "+ Deposit")
          )
        )
      )
    ),

    // Full Portfolio Positions Breakdown Table (every row clickable)
    h(
      "div",
      { className: "card" },
      h(
        "div",
        { className: "card-header" },
        h("h2", { className: "card-title" }, "Portfolio Breakdown"),
        h("span", { className: "text-muted", style: { fontSize: "12.5px" } }, "Click any share to view its chart")
      ),
      enriched.length === 0
        ? h(
            "div",
            { className: "card-body text-muted", style: { textAlign: "center", padding: "32px 18px" } },
            "No holdings in your portfolio yet."
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
                  h("th", null, "Share"),
                  h("th", null, "Sector"),
                  h("th", null, "Weight"),
                  h("th", null, "Qty"),
                  h("th", null, "Avg / LTP"),
                  h("th", null, "Current Val"),
                  h("th", null, "Day's P&L"),
                  h("th", null, "Total P&L")
                )
              ),
              h(
                "tbody",
                null,
                enriched.map((pos) => {
                  const weight = equityValue > 0 ? (pos.current / equityValue) * 100 : 0;
                  const posUp = pos.pnl >= 0;
                  const dayUp = pos.dayPnl >= 0;
                  return h(
                    "tr",
                    {
                      key: pos.symbol,
                      style: { cursor: "pointer" },
                      onClick: () => onOpenChart(pos.symbol),
                    },
                    h(
                      "td",
                      null,
                      h("div", { style: { fontWeight: 600 } }, pos.symbol),
                      h("div", { className: "text-muted", style: { fontSize: "12px" } }, pos.name)
                    ),
                    h("td", { className: "text-muted" }, pos.sector),
                    h("td", { className: "mono" }, `${weight.toFixed(1)}%`),
                    h("td", { className: "mono" }, pos.qty),
                    h(
                      "td",
                      { className: "mono", style: { fontSize: "12.5px" } },
                      h("div", null, window.TradeLensData.formatCurrency(pos.avgPrice, settings.currency)),
                      h("div", { className: "text-muted" }, window.TradeLensData.formatCurrency(pos.ltp, settings.currency))
                    ),
                    h("td", { className: "mono", style: { fontWeight: 600 } }, window.TradeLensData.formatCurrency(pos.current, settings.currency)),
                    h(
                      "td",
                      { className: `mono ${dayUp ? "text-gain" : "text-loss"}` },
                      `${dayUp ? "+" : ""}${window.TradeLensData.formatCurrency(pos.dayPnl, settings.currency)}`
                    ),
                    h(
                      "td",
                      null,
                      h(
                        "div",
                        { className: `mono ${posUp ? "text-gain" : "text-loss"}`, style: { fontWeight: 600 } },
                        `${posUp ? "+" : ""}${window.TradeLensData.formatCurrency(pos.pnl, settings.currency)}`
                      ),
                      h(
                        "span",
                        { className: `pill-badge ${posUp ? "pill-gain" : "pill-loss"}` },
                        `${posUp ? "+" : ""}${pos.pnlPct.toFixed(2)}%`
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
