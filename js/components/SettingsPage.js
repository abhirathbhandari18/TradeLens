/**
 * TradeLens — Settings Page
 * Configure live market data API keys and chart/display preferences.
 */

window.SettingsPage = function SettingsPage({ settings, onSaveSettings, onShowToast }) {
  const h = React.createElement;
  const [form, setForm] = React.useState(settings);
  const [showKey, setShowKey] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e) {
    e.preventDefault();
    onSaveSettings(form);
    onShowToast("Settings saved");
  }

  async function handleTestConnection() {
    onSaveSettings(form);
    setTesting(true);
    setTestResult(null);
    const res = await window.TradeLensAPI.fetchLiveQuote("RELIANCE");
    setTesting(false);
    if (res.isLive) {
      setTestResult({
        ok: true,
        text: `Connected! Live RELIANCE quote: ₹${res.price.toFixed(2)}`,
      });
    } else {
      setTestResult({
        ok: false,
        text: "Could not fetch live quote. Check your API key or provider selection.",
      });
    }
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
          "Manage your live market data API key and chart preferences."
        )
      )
    ),

    h(
      "form",
      { onSubmit: handleSave },
      h(
        "div",
        { className: "settings-grid" },
        // Card 1: Live Data API Key
        h(
          "div",
          { className: "card" },
          h(
            "div",
            { className: "card-header" },
            h("h2", { className: "card-title" }, "Live Market Data API"),
            h(
              "span",
              { className: `pill-badge ${form.apiKey ? "pill-gain" : "pill-neutral"}` },
              form.apiKey ? "Key Configured" : "Demo Mode"
            )
          ),
          h(
            "div",
            { className: "card-body form-stack" },
            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label" }, "Data Provider"),
              h(
                "select",
                {
                  className: "select",
                  value: form.provider,
                  onChange: (e) => updateField("provider", e.target.value),
                },
                h("option", { value: "finnhub" }, "Finnhub (finnhub.io)"),
                h("option", { value: "alphavantage" }, "Alpha Vantage (alphavantage.co)"),
                h("option", { value: "twelvedata" }, "Twelve Data (twelvedata.com)")
              )
            ),
            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label" }, "API Key"),
              h(
                "div",
                { style: { display: "flex", gap: 8 } },
                h("input", {
                  className: "input mono",
                  type: showKey ? "text" : "password",
                  placeholder: "Paste your API key here",
                  value: form.apiKey,
                  onChange: (e) => updateField("apiKey", e.target.value),
                }),
                h(
                  "button",
                  {
                    type: "button",
                    className: "btn btn-secondary",
                    onClick: () => setShowKey((s) => !s),
                  },
                  showKey ? "Hide" : "Show"
                )
              ),
              h(
                "span",
                { className: "field-hint" },
                "Stored locally in your browser. Leave blank to use built-in preview data."
              )
            ),
            testResult &&
              h(
                "div",
                {
                  style: {
                    padding: "9px 12px",
                    borderRadius: 6,
                    fontSize: "13px",
                    backgroundColor: testResult.ok ? "#dcfce7" : "#fee2e2",
                    color: testResult.ok ? "#15803d" : "#dc2626",
                  },
                },
                testResult.text
              ),
            h(
              "div",
              { style: { display: "flex", gap: 10 } },
              h(
                "button",
                {
                  type: "button",
                  className: "btn btn-secondary",
                  disabled: testing || !form.apiKey.trim(),
                  onClick: handleTestConnection,
                },
                testing ? "Testing..." : "Test API Key"
              ),
              h("button", { type: "submit", className: "btn btn-primary" }, "Save API Settings")
            )
          )
        ),

        // Card 2: Chart & Display Preferences
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
                h("div", { className: "text-muted", style: { fontSize: "12px" } }, "Highlight when a stock nears your target price")
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
    )
  );
};

