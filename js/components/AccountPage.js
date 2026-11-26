
/**
 * TradeLens — Account & Profile Page
 * Personal KYC details, Bank & Demat details,
 * and Java/MySQL integration.
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

  // Profile & KYC state
  const [name, setName] = React.useState(user.name || "");
  const [email, setEmail] = React.useState(user.email || "");
  const [phone, setPhone] = React.useState(user.phone || "");
  const [panCard, setPanCard] = React.useState(user.panCard || "");
  const [dob, setDob] = React.useState(user.dob || "");
  const [tradingStyle, setTradingStyle] = React.useState(
    user.tradingStyle || "Swing Trader"
  );

  // Bank & Demat state
  const [bankName, setBankName] = React.useState(user.bankName || "");
  const [accountNumber, setAccountNumber] = React.useState(
    user.accountNumber || ""
  );
  const [ifscCode, setIfscCode] = React.useState(user.ifscCode || "");
  const [accountType, setAccountType] = React.useState(
    user.accountType || "Savings"
  );
  const [dematId, setDematId] = React.useState(user.dematId || "");

  // Backend URL state
  const [backendUrl, setBackendUrl] = React.useState(
    settings.backendUrl || "http://localhost:8080/api"
  );

  const [loading, setLoading] = React.useState(true);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingBank, setSavingBank] = React.useState(false);

  // Load account data from Java/MySQL when page opens
  React.useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const account = await window.TradeLensAPI.getAccount();

        if (!active) return;

        setName(account.name || "");
        setEmail(account.email || "");
        setPhone(account.phone || "");
        setPanCard(account.panCard || "");
        setDob(account.dob || "");
        setTradingStyle(account.tradingStyle || "Swing Trader");

        setBankName(account.bankName || "");
        setAccountNumber(account.accountNumber || "");
        setIfscCode(account.ifscCode || "");
        setAccountType(account.accountType || "Savings");
        setDematId(account.dematId || "");

        onUpdateUser({ ...user, ...account });
      } catch (error) {
        console.error("Unable to load account:", error);
        onShowToast("Could not load account from Java backend. Check that the server and database are running.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, []);

  // Save profile and KYC details
  async function handleProfileSave(e) {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      onShowToast("Name and email cannot be empty.");
      return;
    }

    setSavingProfile(true);

    try {
      const updated = await window.TradeLensAPI.updateAccount({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        panCard: panCard.trim().toUpperCase(),
        dob: dob || null,
        tradingStyle,
      });

      onUpdateUser({ ...user, ...updated });
      onShowToast("Profile & KYC details updated successfully.");
    } catch (error) {
      console.error("Profile update failed:", error);
      onShowToast(error.message || "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  // Save bank and demat details
  async function handleBankSave(e) {
    e.preventDefault();

    if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      onShowToast("Please fill in bank name, account number, and IFSC code.");
      return;
    }

    setSavingBank(true);

    try {
      const updated = await window.TradeLensAPI.updateAccount({
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountType,
        dematId: dematId.trim(),
      });

      onUpdateUser({ ...user, ...updated });
      onShowToast("Bank & Demat details saved successfully.");
    } catch (error) {
      console.error("Bank update failed:", error);
      onShowToast(error.message || "Unable to save bank details.");
    } finally {
      setSavingBank(false);
    }
  }

  function handleBackendSave(e) {
    e.preventDefault();

    onSaveSettings({
      ...settings,
      backendUrl: backendUrl.trim(),
    });

    onShowToast("Java backend URL saved.");
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
        h("h1", { className: "page-title" }, "Account & Profile"),
        h(
          "p",
          { className: "page-subtitle" },
          "Manage your personal KYC, bank account, demat, and Java/MySQL settings."
        )
      ),
      h(
        "button",
        { type: "button", className: "btn btn-danger", onClick: onLogout },
        "Sign Out"
      )
    ),

    loading
      ? h("div", { className: "card card-body" }, "Loading account from Java backend...")
      : null,

    // Quick Identity Strip
    h(
      "div",
      { className: "ticker-strip" },

      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "User ID"),
          h("div", { className: "stat-value" }, user.id || "USR-0001")
        )
      ),

      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "Trade ID"),
          h("div", { className: "stat-value" }, user.tradeId || "TL-849201")
        )
      ),

      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "PAN Card"),
          h("div", { className: "stat-value" }, user.panCard || "Not added")
        )
      ),

      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-body" },
          h("div", { className: "stat-label" }, "KYC Status"),
          h(
            "span",
            { className: "pill-badge pill-gain", style: { marginTop: 2 } },
            user.kycStatus || "Pending"
          )
        )
      )
    ),

    h(
      "div",
      { className: "settings-grid" },

      // Personal & KYC Profile
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-header" },
          h("h2", { className: "card-title" }, "Personal & KYC Profile"),
          h(
            "span",
            { className: "text-muted", style: { fontSize: "12px" } },
            `Joined ${user.joinedAt || "2026"}`
          )
        ),

        h(
          "form",
          { className: "card-body form-stack", onSubmit: handleProfileSave },

          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },

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
              h("label", { className: "field-label" }, "PAN Card Number"),
              h("input", {
                className: "input mono",
                maxLength: 10,
                value: panCard,
                onChange: (e) => setPanCard(e.target.value.toUpperCase()),
              })
            )
          ),

          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },

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
              h("label", { className: "field-label" }, "Phone Number"),
              h("input", {
                className: "input mono",
                value: phone,
                onChange: (e) => setPhone(e.target.value),
              })
            )
          ),

          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },

            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label" }, "Date of Birth"),
              h("input", {
                className: "input mono",
                type: "date",
                value: dob,
                onChange: (e) => setDob(e.target.value),
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
                h("option", { value: "Intraday" }, "Intraday"),
                h("option", { value: "Swing Trader" }, "Swing Trader"),
                h("option", { value: "Long-Term Investor" }, "Long-Term Investor"),
                h("option", { value: "F&O Trader" }, "F&O Trader")
              )
            )
          ),

          h(
            "div",
            null,
            h(
              "button",
              {
                type: "submit",
                className: "btn btn-primary",
                disabled: savingProfile || loading,
              },
              savingProfile ? "Saving..." : "Save Profile"
            )
          )
        )
      ),

      // Bank & Demat Details
      h(
        "div",
        { className: "card" },
        h(
          "div",
          { className: "card-header" },
          h("h2", { className: "card-title" }, "Bank & Demat Details"),
          h("span", { className: "pill-badge pill-gain" }, "Primary Bank")
        ),

        h(
          "form",
          { className: "card-body form-stack", onSubmit: handleBankSave },

          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },

            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label" }, "Bank Name"),
              h("input", {
                className: "input",
                placeholder: "e.g. HDFC Bank",
                value: bankName,
                onChange: (e) => setBankName(e.target.value),
              })
            ),

            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label" }, "Account Type"),
              h(
                "select",
                {
                  className: "select",
                  value: accountType,
                  onChange: (e) => setAccountType(e.target.value),
                },
                h("option", { value: "Savings" }, "Savings"),
                h("option", { value: "Current" }, "Current")
              )
            )
          ),

          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },

            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label" }, "Account Number"),
              h("input", {
                className: "input mono",
                value: accountNumber,
                onChange: (e) => setAccountNumber(e.target.value),
              })
            ),

            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label" }, "IFSC Code"),
              h("input", {
                className: "input mono",
                maxLength: 11,
                value: ifscCode,
                onChange: (e) => setIfscCode(e.target.value.toUpperCase()),
              })
            )
          ),

          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },

            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label" }, "Trade ID / Client Code"),
              h("input", {
                className: "input mono",
                value: user.tradeId || "TL-849201",
                disabled: true,
              })
            ),

            h(
              "div",
              { className: "field" },
              h("label", { className: "field-label" }, "Demat / BO ID"),
              h("input", {
                className: "input mono",
                value: dematId,
                onChange: (e) => setDematId(e.target.value),
              })
            )
          ),

          h(
            "div",
            null,
            h(
              "button",
              {
                type: "submit",
                className: "btn btn-primary",
                disabled: savingBank || loading,
              },
              savingBank ? "Saving..." : "Save Bank Details"
            )
          )
        )
      )
    ),

    // Java & MySQL Integration
    h(
      "div",
      { className: "card", style: { marginTop: 20 } },

      h(
        "div",
        { className: "card-header" },
        h("h2", { className: "card-title" }, "Java & MySQL Integration"),
        h("span", { className: "pill-badge pill-neutral" }, "Java API Configured")
      ),

      h(
        "form",
        {
          className: "card-body",
          onSubmit: handleBackendSave,
          style: {
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          },
        },

        h(
          "div",
          { className: "field", style: { flex: 1, minWidth: 260 } },
          h("label", { className: "field-label" }, "Java REST API Base URL"),
          h("input", {
            className: "input mono",
            value: backendUrl,
            onChange: (e) => setBackendUrl(e.target.value),
          }),
          h(
            "span",
            { className: "field-hint" },
            "Account data is loaded and saved through the Java REST API."
          )
        ),

        h(
          "button",
          { type: "submit", className: "btn btn-secondary" },
          "Save Endpoint URL"
        )
      )
    )
  );
};
