/**
 * TradeLens — Interactive Stock Chart Component (SVG)
 * Supports Area Line & Candlestick modes with hover OHLCV crosshair.
 */

window.StockChart = function StockChart({
  series,
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  currency,
  isPositive,
}) {
  const h = React.createElement;
  const [hoverIdx, setHoverIdx] = React.useState(null);

  const width = 760;
  const height = 290;
  const padLeft = 12;
  const padRight = 76;
  const padTop = 16;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const safeSeries = series && series.length > 0 ? series : [];

  // Determine whether the graph went up or down over the selected period
  const firstClose = safeSeries.length > 0 ? safeSeries[0].close : 0;
  const lastClose = safeSeries.length > 0 ? safeSeries[safeSeries.length - 1].close : 0;
  const periodChange = lastClose - firstClose;
  const periodChangePct = firstClose > 0 ? (periodChange / firstClose) * 100 : 0;
  const periodIsUp = safeSeries.length > 0 ? periodChange >= 0 : !!isPositive;

  let minVal = Infinity;
  let maxVal = -Infinity;
  safeSeries.forEach((pt) => {
    if (pt.low < minVal) minVal = pt.low;
    if (pt.high > maxVal) maxVal = pt.high;
  });
  if (!isFinite(minVal) || !isFinite(maxVal) || minVal === maxVal) {
    minVal = 0;
    maxVal = 100;
  }
  const padding = (maxVal - minVal) * 0.1;
  minVal -= padding;
  maxVal += padding;

  const xFor = (i) =>
    safeSeries.length <= 1
      ? padLeft + plotW / 2
      : padLeft + (i / (safeSeries.length - 1)) * plotW;

  const yFor = (val) =>
    padTop + ((maxVal - val) / (maxVal - minVal)) * plotH;

  const strokeColor = isPositive ? "#15803d" : "#dc2626";
  const areaFill = isPositive ? "rgba(21, 128, 61, 0.10)" : "rgba(220, 38, 38, 0.10)";

  const linePath = safeSeries
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(pt.close).toFixed(1)}`)
    .join(" ");

  const areaPath =
    safeSeries.length > 0
      ? `${linePath} L ${xFor(safeSeries.length - 1).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : "";

  const activePoint =
    hoverIdx !== null && safeSeries[hoverIdx]
      ? safeSeries[hoverIdx]
      : safeSeries[safeSeries.length - 1];

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const val = maxVal - t * (maxVal - minVal);
    return { val, y: padTop + t * plotH };
  });

  const xTickIndices =
    safeSeries.length > 4
      ? [
          0,
          Math.floor((safeSeries.length - 1) * 0.25),
          Math.floor((safeSeries.length - 1) * 0.5),
          Math.floor((safeSeries.length - 1) * 0.75),
          safeSeries.length - 1,
        ]
      : safeSeries.map((_, i) => i);

  function handleMouseMove(e) {
    if (!safeSeries.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const clamped = Math.max(padLeft, Math.min(padLeft + plotW, relX));
    const idx = Math.round(((clamped - padLeft) / plotW) * (safeSeries.length - 1));
    setHoverIdx(Math.max(0, Math.min(safeSeries.length - 1, idx)));
  }

  const timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];

  return h(
    "div",
    null,
    h(
      "div",
      { className: "chart-controls" },
      h(
        "div",
        { className: "segmented", role: "group", "aria-label": "Timeframe" },
        timeframes.map((tf) =>
          h(
            "button",
            {
              key: tf,
              type: "button",
              className: timeframe === tf ? "active" : "",
              onClick: () => onTimeframeChange(tf),
            },
            tf
          )
        )
      ),
      h(
        "div",
        { className: "segmented", role: "group", "aria-label": "Chart Type" },
        h(
          "button",
          {
            type: "button",
            className: chartType === "area" ? "active" : "",
            onClick: () => onChartTypeChange("area"),
          },
          "Line"
        ),
        h(
          "button",
          {
            type: "button",
            className: chartType === "candle" ? "active" : "",
            onClick: () => onChartTypeChange("candle"),
          },
          "Candles"
        )
      )
    ),
    h(
      "div",
      { className: "chart-wrapper" },
      h(
        "svg",
        {
          viewBox: `0 0 ${width} ${height}`,
          style: { width: "100%", height: "auto", display: "block", cursor: "crosshair" },
          onMouseMove: handleMouseMove,
          onMouseLeave: () => setHoverIdx(null),
        },
        // Horizontal gridlines & right Y-axis labels
        yTicks.map((tick, idx) =>
          h(
            "g",
            { key: idx },
            h("line", {
              x1: padLeft,
              y1: tick.y,
              x2: padLeft + plotW,
              y2: tick.y,
              stroke: "#f1f5f9",
              strokeWidth: 1,
            }),
            h(
              "text",
              {
                x: padLeft + plotW + 8,
                y: tick.y + 4,
                fontSize: "11",
                fill: "#64748b",
                fontFamily: "JetBrains Mono, monospace",
              },
              window.TradeLensData.formatCurrency(tick.val, currency).replace(".00", "")
            )
          )
        ),

        // Area / Line or Candlestick rendering
        chartType === "area"
          ? h(
              "g",
              null,
              h("path", { d: areaPath, fill: areaFill }),
              h("path", {
                d: linePath,
                fill: "none",
                stroke: strokeColor,
                strokeWidth: 2,
                strokeLinejoin: "round",
                strokeLinecap: "round",
              })
            )
          : h(
              "g",
              null,
              safeSeries.map((pt, i) => {
                const cx = xFor(i);
                const isUp = pt.close >= pt.open;
                const color = isUp ? "#15803d" : "#dc2626";
                const topY = yFor(Math.max(pt.open, pt.close));
                const botY = yFor(Math.min(pt.open, pt.close));
                const bodyH = Math.max(2, botY - topY);
                const candleW = Math.max(4, Math.min(11, plotW / safeSeries.length - 3));
                return h(
                  "g",
                  { key: i },
                  h("line", {
                    x1: cx,
                    y1: yFor(pt.high),
                    x2: cx,
                    y2: yFor(pt.low),
                    stroke: color,
                    strokeWidth: 1.3,
                  }),
                  h("rect", {
                    x: cx - candleW / 2,
                    y: topY,
                    width: candleW,
                    height: bodyH,
                    fill: color,
                    rx: 1,
                  })
                );
              })
            ),

        // X-axis labels
        xTickIndices.map((idx) => {
          const pt = safeSeries[idx];
          if (!pt) return null;
          return h(
            "text",
            {
              key: idx,
              x: xFor(idx),
              y: height - 8,
              textAnchor: "middle",
              fontSize: "11",
              fill: "#64748b",
              fontFamily: "JetBrains Mono, monospace",
            },
            pt.label
          );
        }),

        // Hover crosshair & floating price pill on the graph
        hoverIdx !== null &&
          safeSeries[hoverIdx] &&
          (() => {
            const pt = safeSeries[hoverIdx];
            const cx = xFor(hoverIdx);
            const cy = yFor(pt.close);
            const priceText = window.TradeLensData.formatCurrency(pt.close, currency);
            const fullText = `${priceText} · ${pt.label}`;
            const boxW = Math.max(120, fullText.length * 7.6 + 26);
            const boxH = 28;
            const boxX = Math.max(padLeft, Math.min(padLeft + plotW - boxW, cx - boxW / 2));
            const boxY = cy - boxH - 10 < padTop ? cy + 10 : cy - boxH - 10;

            return h(
              "g",
              null,
              h("line", {
                x1: cx,
                y1: padTop,
                x2: cx,
                y2: padTop + plotH,
                stroke: "#94a3b8",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }),
              h("circle", {
                cx,
                cy,
                r: 4.5,
                fill: strokeColor,
                stroke: "#ffffff",
                strokeWidth: 2,
              }),
              h("rect", {
                x: boxX,
                y: boxY,
                width: boxW,
                height: boxH,
                rx: 6,
                fill: "#0f172a",
              }),
              h(
                "text",
                {
                  x: boxX + boxW / 2,
                  y: boxY + 18,
                  textAnchor: "middle",
                  fontSize: "11.5",
                  fontWeight: "600",
                  fill: "#ffffff",
                  fontFamily: "JetBrains Mono, monospace",
                },
                fullText
              )
            );
          })()
      )
    )
  );
};

