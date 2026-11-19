/**
 * TradeLens — Portfolio Page
 * Portfolio valuation, available margin, sector allocation, and quick funds deposit.
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
      sector: "Equity",
    };
    const invested = item.qty * item.avgPrice;
    const current = item.qty * stock.price;
    const pnl = current - invested;
    return { ...item, name: stock.name, sector: stock.sector, current, invested, pnl };
  });

  const equityValue = enriched.reduce((sum, r) => sum + r.current, 0);
  const totalInvested = enriched.reduce((sum, r) => sum + r.invested, 0);
  const totalPnl = equityValue - totalInvested;
  const totalPortfolio = equityValue + cashBalance;
  const isUp = totalPnl >= 0;

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
          "Combined view of your NSE equity valuation, available margin, and sector exposure."
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
          h("div", { className: "text-muted", style: { fontSize: "12px", marginTop: 4 } }, "Equity + Available Cash")
        )
      ),
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Equity Holdings Value"),
          h("div", { className: "stock-price-big", style: { fontSize: "20px" } }, window.TradeLensData.formatCurrency(equityValue, settings.currency)),
          h("div", { className: "text-muted", style: { fontSize: "12px", marginTop: 4 } }, `${enriched.length} active stocks`)
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
          h("div", { className: "text-muted", style: { fontSize: "12px", marginTop: 4 } }, "Ready for NSE/BSE orders")
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
          h("div", { className: "text-muted", style: { fontSize: "12px", marginTop: 4 } }, `Invested ${window.TradeLensData.formatCurrency(totalInvested, settings.currency)}`)
        )
      )
    ),

    // Two-column layout: Sector Allocation + Add Funds / Holdings Snapshot
    h(
      "div",
      { className: "settings-grid" },
      // Sector Allocation Card
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-header" },
          h("h2", { className: "card-title" }, "Sector Allocation"),
          h("span", { className: "text-muted", style: { fontSize: "12px" } }, "By current value")
        ),
        h(
          "div",
          { className: "card-body form-stack" },
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
                        backgroundColor: "#1d4ed8",
                        borderRadius: 999,
                      },
                    })
                  )
                )
              )
        )
      ),

      // Funds & Top Positions Card
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 20 } },
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
        ),

        h(
          "div",
          { className: "card" },
          h(
            "div",
            { className: "card-header" },
            h("h2", { className: "card-title" }, "Top Positions")
          ),
          h(
            "div",
            null,
            enriched.slice(0, 4).map((pos) => {
              const up = pos.pnl >= 0;
              return h(
                "div",
                {
                  key: pos.symbol,
                  className: "stock-list-row",
                  onClick: () => onOpenChart(pos.symbol),
                },
                h(
                  "div",
                  null,
                  h("div", { style: { fontWeight: 600 } }, pos.symbol),
                  h("div", { className: "text-muted", style: { fontSize: "12px" } }, `${pos.qty} shares`)
                ),
                h(
                  "div",
                  { style: { textAlign: "right" } },
                  h("div", { className: "mono", style: { fontWeight: 600 } }, window.TradeLensData.formatCurrency(pos.current, settings.currency)),
                  h(
                    "div",
                    { className: `mono ${up ? "text-gain" : "text-loss"}`, style: { fontSize: "12px" } },
                    `${up ? "+" : ""}${window.TradeLensData.formatCurrency(pos.pnl, settings.currency)}`
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

