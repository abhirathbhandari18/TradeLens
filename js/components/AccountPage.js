/**
 * TradeLens — Account Page
 * User profile management, Java + MySQL backend endpoint configuration, and sign out.
 */

window.AccountPage = function AccountPage({
  user,
  onUpdateUser,
  settings,
  onSaveSettings,
  onLogout,
  onShowToast,
}) {
  const h = React.createElement;
  const [name, setName] = React.useState(user.name || "");
  const [email, setEmail] = React.useState(user.email || "");
  const [tradingStyle, setTradingStyle] = React.useState(user.tradingStyle || "Swing Trader");
  const [backendUrl, setBackendUrl] = React.useState(settings.backendUrl || "http://localhost:8080/api");

  function handleProfileSave(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      onShowToast("Name and email cannot be empty.");
      return;
    }
    const updated = window.TradeLensAPI.updateAccount({
      name: name.trim(),
      email: email.trim(),
      tradingStyle,
    });
    onUpdateUser(updated);
    onShowToast("Profile updated");
  }

  function handleBackendSave(e) {
    e.preventDefault();
    onSaveSettings({ ...settings, backendUrl: backendUrl.trim() });
    onShowToast("Java backend URL saved");
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
        h("h1", { className: "page-title" }, "Account"),
        h(
          "p",
          { className: "page-subtitle" },
          "Manage your TradeLens profile and Java/MySQL integration settings."
        )
      ),
      h(
        "button",
        { type: "button", className: "btn btn-danger", onClick: onLogout },
        "Sign Out"
      )
    ),

    h(
      "div",
      { className: "settings-grid" },
      // Profile Card
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-header" },
          h("h2", { className: "card-title" }, "Profile Details"),
          h("span", { className: "text-muted", style: { fontSize: "12px" } }, `Member since ${user.joinedAt || "2026"}`)
        ),
        h(
          "form",
          { className: "card-body form-stack", onSubmit: handleProfileSave },
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "Full Name"),
            h("input", {
              className: "input",
              value: name,
              onChange: (e) => setName(e.target.value),
            })
          ),
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "Email Address"),
            h("input", {
              className: "input",
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
            })
          ),
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "Trading Focus"),
            h(
              "select",
              {
                className: "select",
                value: tradingStyle,
                onChange: (e) => setTradingStyle(e.target.value),
              },
              h("option", { value: "Day Trader" }, "Day Trader"),
              h("option", { value: "Swing Trader" }, "Swing Trader"),
              h("option", { value: "Long-Term Investor" }, "Long-Term Investor")
            )
          ),
          h(
            "div",
            null,
            h("button", { type: "submit", className: "btn btn-primary" }, "Save Profile")
          )
        )
      ),

      // Java + MySQL Integration Card
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-header" },
          h("h2", { className: "card-title" }, "Java & MySQL Integration"),
          h("span", { className: "pill-badge pill-neutral" }, "Frontend Only")
        ),
        h(
          "form",
          { className: "card-body form-stack", onSubmit: handleBackendSave },
          h(
            "p",
            { className: "text-muted", style: { margin: 0, fontSize: "13px" } },
            "No backend is running right now. Account & wishlist data are stored in browser localStorage. When your Java + MySQL server is ready, configure its base URL below and wire it in js/api.js."
          ),
          h(
            "div",
            { className: "field" },
            h("label", { className: "field-label" }, "Java REST API Base URL"),
            h("input", {
              className: "input mono",
              value: backendUrl,
              onChange: (e) => setBackendUrl(e.target.value),
            }),
            h(
              "span",
              { className: "field-hint" },
              "Expected tables in MySQL: users, wishlist, user_settings"
            )
          ),
          h(
            "div",
            null,
            h("button", { type: "submit", className: "btn btn-secondary" }, "Save Endpoint URL")
          )
        )
      )
    )
  );
};

