/**
 * TradeLens — Orders Page
 * Displays executed/pending NSE & BSE buy/sell orders.
 */

window.OrdersPage = function OrdersPage({ orders, settings, onOpenChart }) {
  const h = React.createElement;
  const [filter, setFilter] = React.useState("ALL");

  const filtered =
    filter === "ALL" ? orders : orders.filter((o) => o.side === filter);

  return h(
    "div",
    null,
    h(
      "div",
      { className: "page-header" },
      h(
        "div",
        null,
        h("h1", { className: "page-title" }, "Orders"),
        h(
          "p",
          { className: "page-subtitle" },
          "Order book and executed trade history across NSE equities."
        )
      ),
      h(
        "div",
        { className: "segmented" },
        ["ALL", "BUY", "SELL"].map((tab) =>
          h(
            "button",
            {
              key: tab,
              type: "button",
              className: filter === tab ? "active" : "",
              onClick: () => setFilter(tab),
            },
            tab
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
        h("h2", { className: "card-title" }, "Order History"),
        h("span", { className: "text-muted", style: { fontSize: "12.5px" } }, `${filtered.length} orders`)
      ),
      filtered.length === 0
        ? h(
            "div",
            { className: "card-body text-muted", style: { textAlign: "center", padding: "36px 18px" } },
            "No orders found for this filter. Place a BUY or SELL order from the Dashboard."
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
                  h("th", null, "Order ID"),
                  h("th", null, "Time"),
                  h("th", null, "Symbol"),
                  h("th", null, "Side"),
                  h("th", null, "Type"),
                  h("th", null, "Qty"),
                  h("th", null, "Price"),
                  h("th", null, "Total Value"),
                  h("th", null, "Status")
                )
              ),
              h(
                "tbody",
                null,
                filtered.map((ord) => {
                  const isBuy = ord.side === "BUY";
                  return h(
                    "tr",
                    { key: ord.orderId },
                    h("td", { className: "mono text-muted", style: { fontSize: "12.5px" } }, ord.orderId),
                    h("td", { className: "text-muted", style: { fontSize: "12.5px" } }, ord.time),
                    h(
                      "td",
                      null,
                      h(
                        "button",
                        {
                          type: "button",
                          className: "btn btn-ghost btn-sm",
                          style: { padding: "2px 6px", fontWeight: 600 },
                          onClick: () => onOpenChart(ord.symbol),
                        },
                        ord.symbol
                      )
                    ),
                    h(
                      "td",
                      null,
                      h(
                        "span",
                        { className: `pill-badge ${isBuy ? "pill-gain" : "pill-loss"}` },
                        ord.side
                      )
                    ),
                    h("td", { className: "mono", style: { fontSize: "12.5px" } }, ord.orderType),
                    h("td", { className: "mono" }, ord.qty),
                    h("td", { className: "mono" }, window.TradeLensData.formatCurrency(ord.price, settings.currency)),
                    h("td", { className: "mono", style: { fontWeight: 600 } }, window.TradeLensData.formatCurrency(ord.qty * ord.price, settings.currency)),
                    h(
                      "td",
                      null,
                      h("span", { className: "pill-badge pill-gain" }, ord.status)
                    )
                  );
                })
              )
            )
          )
    )
  );
};

