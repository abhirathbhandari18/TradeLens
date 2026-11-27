/**
 * TradeLens — Settings Page
 * Configure chart and display preferences.
 */

window.SettingsPage = function SettingsPage({ settings, onSaveSettings, onShowToast }) {
  const h = React.createElement;
  const [form, setForm] = React.useState(settings);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e) {
    e.preventDefault();
    onSaveSettings(form);
    onShowToast("Settings saved");
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
        h("h1", { className: "page-title" }, "Settings"),
        h(
          "p",
          { className: "page-subtitle" },
          "Manage your chart and display preferences."
        )
      )
    ),

    h(
      "form",
      { onSubmit: handleSave, style: { maxWidth: 620 } },
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-header" },
          h("h2", { className: "card-title" }, "Chart & Display Preferences")
        ),
        h(
          "div",
          { className: "card-body form-stack" },
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "Display Currency"),
            h(
              "select",
              {
                className: "select",
                value: form.currency,
                onChange: (e) => updateField("currency", e.target.value),
              },
              h("option", { value: "INR" }, "INR (₹)"),
              h("option", { value: "USD" }, "USD ($)")
            )
          ),
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "Default Chart Timeframe"),
            h(
              "select",
              {
                className: "select",
                value: form.defaultTimeframe,
                onChange: (e) => updateField("defaultTimeframe", e.target.value),
              },
              h("option", { value: "1D" }, "1 Day (1D)"),
              h("option", { value: "1W" }, "1 Week (1W)"),
              h("option", { value: "1M" }, "1 Month (1M)"),
              h("option", { value: "3M" }, "3 Months (3M)"),
              h("option", { value: "6M" }, "6 Months (6M)"),
              h("option", { value: "1Y" }, "1 Year (1Y)"),
              h("option", { value: "5Y" }, "5 Years (5Y)")
            )
          ),
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "Default Chart Style"),
            h(
              "select",
              {
                className: "select",
                value: form.defaultChartType,
                onChange: (e) => updateField("defaultChartType", e.target.value),
              },
              h("option", { value: "area" }, "Area Line"),
              h("option", { value: "candle" }, "Candlestick")
            )
          ),
          h(
            "div",
            { className: "toggle-row" },
            h(
              "div",
              null,
              h("div", { style: { fontWeight: 500 } }, "Watchlist Target Alerts"),
              h(
                "div",
                { className: "text-muted", style: { fontSize: "12px" } },
                "Highlight when a stock nears your target price"
              )
            ),
            h(
              "label",
              { className: "toggle-switch" },
              h("input", {
                type: "checkbox",
                checked: !!form.priceAlerts,
                onChange: (e) => updateField("priceAlerts", e.target.checked),
              }),
              h("span", { className: "toggle-slider" })
            )
          ),
          h(
            "div",
            null,
            h("button", { type: "submit", className: "btn btn-primary" }, "Save Preferences")
          )
        )
      )
    )
  );
};
