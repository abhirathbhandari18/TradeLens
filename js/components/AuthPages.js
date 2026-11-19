/**
 * TradeLens — Login & Signup Pages
 */

window.AuthPages = (() => {
  const h = React.createElement;

  function BrandPane() {
    const preview = [
      { symbol: "RELIANCE", name: "Reliance Industries Ltd.", price: "₹1,284.50", pct: "+1.45%", up: true },
      { symbol: "TCS", name: "Tata Consultancy Services", price: "₹4,142.80", pct: "+0.88%", up: true },
      { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", price: "₹1,742.30", pct: "-0.66%", up: false },
    ];

    return h(
      "div",
      { className: "auth-brand-pane" },
      h(
        "div",
        { className: "brand-mark" },
        h(
          "div",
          { className: "brand-icon" },
          h(
            "svg",
            { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2 },
            h("polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }),
            h("polyline", { points: "16 7 22 7 22 13" })
          )
        ),
        h("span", null, "TradeLens")
      ),
      h(
        "div",
        { className: "auth-hero" },
        h("h1", null, "Clear NSE & BSE charts, without the noise."),
        h(
          "p",
          null,
          "Track Indian equities with your own market data API key, manage your watchlist, holdings, and orders, and monitor your portfolio in one workspace."
        ),
        h(
          "div",
          { className: "auth-preview-card" },
          preview.map((item) =>
            h(
              "div",
              { key: item.symbol, className: "auth-preview-row" },
              h(
                "div",
                null,
                h("div", { style: { fontWeight: 600 } }, item.symbol),
                h("div", { className: "text-muted", style: { fontSize: "12px" } }, item.name)
              ),
              h(
                "div",
                { style: { textAlign: "right" } },
                h("div", { className: "mono", style: { fontWeight: 600 } }, item.price),
                h(
                  "span",
                  { className: `pill-badge ${item.up ? "pill-gain" : "pill-loss"}` },
                  item.pct
                )
              )
            )
          )
        )
      ),
      h(
        "div",
        { className: "text-muted", style: { fontSize: "12.5px" } },
        "TradeLens India · Ready for Java & MySQL Integration"
      )
    );
  }

  function LoginPage({ onSuccess, onSwitchToSignup }) {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");

    function handleSubmit(e) {
      e.preventDefault();
      setError("");
      if (!email.trim() || !password) {
        setError("Please enter both email and password.");
        return;
      }
      try {
        const user = window.TradeLensAPI.login(email, password);
        onSuccess(user);
      } catch (err) {
        setError(err.message);
      }
    }

    function handleDemoLogin() {
      try {
        const user = window.TradeLensAPI.login("demo@tradelens.in", "demo1234");
        onSuccess(user);
      } catch {
        const user = window.TradeLensAPI.signup({
          name: "Abhirath Bhandari",
          email: "demo@tradelens.in",
          password: "demo1234",
          tradingStyle: "Swing Trader",
          panCard: "ABCDE1234F",
        });
        onSuccess(user);
      }
    }

    return h(
      "div",
      { className: "auth-shell" },
      h(BrandPane),
      h(
        "div",
        { className: "auth-form-pane" },
        h(
          "div",
          { className: "auth-card" },
          h("h2", null, "Sign in to TradeLens"),
          h("p", { className: "auth-sub" }, "Enter your credentials to open your trading workspace."),
          error && h("div", { className: "auth-error", style: { marginBottom: 14 } }, error),
          h(
            "form",
            { className: "auth-form", onSubmit: handleSubmit },
            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label", htmlFor: "login-email" }, "Email address"),
              h("input", {
                id: "login-email",
                className: "input",
                type: "email",
                placeholder: "you@example.com",
                value: email,
                onChange: (e) => setEmail(e.target.value),
              })
            ),
            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label", htmlFor: "login-password" }, "Password"),
              h("input", {
                id: "login-password",
                className: "input",
                type: "password",
                placeholder: "••••••••",
                value: password,
                onChange: (e) => setPassword(e.target.value),
              })
            ),
            h("button", { type: "submit", className: "btn btn-primary", style: { width: "100%" } }, "Sign In"),
            h(
              "button",
              {
                type: "button",
                className: "btn btn-secondary",
                style: { width: "100%" },
                onClick: handleDemoLogin,
              },
              "Continue with Demo Account"
            )
          ),
          h(
            "div",
            { className: "auth-footer" },
            "Don't have an account? ",
            h("button", { type: "button", onClick: onSwitchToSignup }, "Create one")
          )
        )
      )
    );
  }

  function SignupPage({ onSuccess, onSwitchToLogin }) {
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [panCard, setPanCard] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [tradingStyle, setTradingStyle] = React.useState("Swing Trader");
    const [error, setError] = React.useState("");

    function handleSubmit(e) {
      e.preventDefault();
      setError("");
      if (!name.trim() || !email.trim() || password.length < 6) {
        setError("Enter your name, valid email, and a password of at least 6 characters.");
        return;
      }
      try {
        const user = window.TradeLensAPI.signup({
          name,
          email,
          password,
          tradingStyle,
          panCard,
        });
        onSuccess(user);
      } catch (err) {
        setError(err.message);
      }
    }

    return h(
      "div",
      { className: "auth-shell" },
      h(BrandPane),
      h(
        "div",
        { className: "auth-form-pane" },
        h(
          "div",
          { className: "auth-card" },
          h("h2", null, "Create your account"),
          h("p", { className: "auth-sub" }, "Set up your TradeLens India workspace in seconds."),
          error && h("div", { className: "auth-error", style: { marginBottom: 14 } }, error),
          h(
            "form",
            { className: "auth-form", onSubmit: handleSubmit },
            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label", htmlFor: "signup-name" }, "Full name"),
              h("input", {
                id: "signup-name",
                className: "input",
                type: "text",
                placeholder: "Abhirath Bhandari",
                value: name,
                onChange: (e) => setName(e.target.value),
              })
            ),
            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label", htmlFor: "signup-email" }, "Email address"),
              h("input", {
                id: "signup-email",
                className: "input",
                type: "email",
                placeholder: "you@example.com",
                value: email,
                onChange: (e) => setEmail(e.target.value),
              })
            ),
            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label", htmlFor: "signup-pan" }, "PAN Card (Optional)"),
              h("input", {
                id: "signup-pan",
                className: "input mono",
                type: "text",
                maxLength: 10,
                placeholder: "ABCDE1234F",
                value: panCard,
                onChange: (e) => setPanCard(e.target.value.toUpperCase()),
              })
            ),
            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label", htmlFor: "signup-password" }, "Password"),
              h("input", {
                id: "signup-password",
                className: "input",
                type: "password",
                placeholder: "Minimum 6 characters",
                value: password,
                onChange: (e) => setPassword(e.target.value),
              })
            ),
            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label", htmlFor: "signup-style" }, "Trading focus"),
              h(
                "select",
                {
                  id: "signup-style",
                  className: "select",
                  value: tradingStyle,
                  onChange: (e) => setTradingStyle(e.target.value),
                },
                h("option", { value: "Intraday" }, "Intraday"),
                h("option", { value: "Swing Trader" }, "Swing Trader"),
                h("option", { value: "Long-Term Investor" }, "Long-Term Investor"),
                h("option", { value: "F&O Trader" }, "F&O Trader")
              )
            ),
            h("button", { type: "submit", className: "btn btn-primary", style: { width: "100%" } }, "Create Account")
          ),
          h(
            "div",
            { className: "auth-footer" },
            "Already have an account? ",
            h("button", { type: "button", onClick: onSwitchToLogin }, "Sign in")
          )
        )
      )
    );
  }

  return { LoginPage, SignupPage };
})();
