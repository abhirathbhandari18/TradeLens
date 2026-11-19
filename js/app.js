/**
 * TradeLens — Root Application Shell & Router
 */

(() => {
  const h = React.createElement;

  function App() {
    const [user, setUser] = React.useState(() => window.TradeLensAPI.getSession());
    const [authView, setAuthView] = React.useState("login"); // "login" | "signup"
    const [activePage, setActivePage] = React.useState("dashboard"); // "dashboard" | "wishlist" | "settings" | "account"
    const [selectedSymbol, setSelectedSymbol] = React.useState("AAPL");
    const [wishlist, setWishlist] = React.useState(() => window.TradeLensAPI.getWishlist());
    const [settings, setSettings] = React.useState(() => window.TradeLensAPI.getSettings());
    const [searchQuery, setSearchQuery] = React.useState("");
    const [toast, setToast] = React.useState("");

    function showToast(msg) {
      setToast(msg);
      window.clearTimeout(window.__tlToastTimer);
      window.__tlToastTimer = window.setTimeout(() => setToast(""), 2800);
    }

    function handleAuthSuccess(loggedInUser) {
      setUser(loggedInUser);
      setWishlist(window.TradeLensAPI.getWishlist());
      setActivePage("dashboard");
      showToast(`Welcome back, ${loggedInUser.name}`);
    }

    function handleLogout() {
      window.TradeLensAPI.logout();
      setUser(null);
      setAuthView("login");
    }

    function handleToggleWishlist(symbol) {
      const exists = wishlist.some((w) => w.symbol === symbol);
      const next = exists
        ? wishlist.filter((w) => w.symbol !== symbol)
        : [...wishlist, { symbol, targetPrice: "—", note: "Added from Dashboard" }];
      setWishlist(window.TradeLensAPI.saveWishlist(next));
      showToast(exists ? `Removed ${symbol} from wishlist` : `Added ${symbol} to wishlist`);
    }

    function handleUpdateWishlist(nextList) {
      setWishlist(window.TradeLensAPI.saveWishlist(nextList));
    }

    function handleSaveSettings(nextSettings) {
      setSettings(window.TradeLensAPI.saveSettings(nextSettings));
    }

    function handleOpenChart(symbol) {
      setSelectedSymbol(symbol);
      setActivePage("dashboard");
    }

    // Unauthenticated view -> Login or Signup
    if (!user) {
      return authView === "signup"
        ? h(window.AuthPages.SignupPage, {
            onSuccess: handleAuthSuccess,
            onSwitchToLogin: () => setAuthView("login"),
          })
        : h(window.AuthPages.LoginPage, {
            onSuccess: handleAuthSuccess,
            onSwitchToSignup: () => setAuthView("signup"),
          });
    }

    const searchMatches = searchQuery.trim()
      ? window.TradeLensData.STOCKS.filter(
          (s) =>
            s.symbol.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
      : [];

    const initials = (user.name || "TL")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const navItems = [
      { id: "dashboard", label: "Dashboard" },
      { id: "wishlist", label: "Wishlist", count: wishlist.length },
      { id: "settings", label: "Settings" },
      { id: "account", label: "Account" },
    ];

    return h(
      "div",
      { className: "app-shell" },
      // Top Navigation Bar
      h(
        "header",
        { className: "topbar" },
        h(
          "div",
          { className: "topbar-left" },
          h(
            "div",
            {
              className: "brand-mark",
              style: { cursor: "pointer" },
              onClick: () => setActivePage("dashboard"),
            },
            h(
              "div",
              { className: "brand-icon" },
              h(
                "svg",
                {
                  width: 16,
                  height: 16,
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: 2.2,
                },
                h("polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }),
                h("polyline", { points: "16 7 22 7 22 13" })
              )
            ),
            h("span", null, "TradeLens")
          ),
          h(
            "div",
            { className: "topbar-search" },
            h(
              "svg",
              {
                className: "topbar-search-icon",
                width: 15,
                height: 15,
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: 2,
              },
              h("circle", { cx: 11, cy: 11, r: 8 }),
              h("line", { x1: 21, y1: 21, x2: 16.65, y2: 16.65 })
            ),
            h("input", {
              className: "input",
              placeholder: "Search stocks (AAPL, NVDA...)",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
            }),
            searchMatches.length > 0 &&
              h(
                "div",
                { className: "search-dropdown" },
                searchMatches.slice(0, 5).map((s) =>
                  h(
                    "button",
                    {
                      key: s.symbol,
                      type: "button",
                      className: "search-dropdown-item",
                      onClick: () => {
                        handleOpenChart(s.symbol);
                        setSearchQuery("");
                      },
                    },
                    h(
                      "span",
                      null,
                      h("strong", null, s.symbol),
                      " ",
                      h("span", { className: "text-muted", style: { fontSize: "12px" } }, s.name)
                    ),
                    h(
                      "span",
                      { className: "mono", style: { fontSize: "12.5px" } },
                      window.TradeLensData.formatCurrency(s.price, settings.currency)
                    )
                  )
                )
              )
          )
        ),
        h(
          "div",
          { className: "topbar-right" },
          h(
            "div",
            { className: "data-source-tag" },
            h("span", { className: `status-dot ${settings.apiKey ? "live" : ""}` }),
            h("span", null, settings.apiKey ? `API: ${settings.provider}` : "Demo Feed")
          ),
          h(
            "button",
            {
              type: "button",
              className: "avatar-btn",
              onClick: () => setActivePage("account"),
            },
            h("span", { className: "avatar-circle" }, initials),
            h("span", { style: { fontSize: "13px", fontWeight: 500 } }, user.name)
          )
        )
      ),

      // Main Body: Sidebar + Active Page
      h(
        "div",
        { className: "app-body" },
        h(
          "aside",
          { className: "sidebar" },
          h(
            "nav",
            { className: "nav-list", "aria-label": "Main Navigation" },
            navItems.map((item) =>
              h(
                "button",
                {
                  key: item.id,
                  type: "button",
                  className: `nav-item ${activePage === item.id ? "active" : ""}`,
                  onClick: () => setActivePage(item.id),
                },
                h("span", { className: "nav-item-left" }, item.label),
                item.count !== undefined && h("span", { className: "nav-count" }, item.count)
              )
            )
          ),
          h(
            "div",
            { className: "sidebar-note" },
            h("div", { style: { fontWeight: 600, color: "#0f172a", marginBottom: 4 } }, "Java + MySQL Ready"),
            h(
              "div",
              null,
              "Frontend UI running with localStorage. Connect your Java REST API in js/api.js."
            )
          )
        ),

        h(
          "main",
          { className: "main-content" },
          activePage === "dashboard" &&
            h(window.DashboardPage, {
              selectedSymbol,
              onSelectSymbol: setSelectedSymbol,
              wishlist,
              onToggleWishlist: handleToggleWishlist,
              settings,
              onShowToast: showToast,
            }),
          activePage === "wishlist" &&
            h(window.WishlistPage, {
              wishlist,
              onUpdateWishlist: handleUpdateWishlist,
              onOpenChart: handleOpenChart,
              settings,
              onShowToast: showToast,
            }),
          activePage === "settings" &&
            h(window.SettingsPage, {
              settings,
              onSaveSettings: handleSaveSettings,
              onShowToast: showToast,
            }),
          activePage === "account" &&
            h(window.AccountPage, {
              user,
              onUpdateUser: setUser,
              settings,
              onSaveSettings: handleSaveSettings,
              onLogout: handleLogout,
              onShowToast: showToast,
            })
        )
      ),

      toast && h("div", { className: "toast" }, toast)
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(h(App));
})();

