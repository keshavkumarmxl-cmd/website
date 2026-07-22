<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Keshav With Velo Admin</title>
  <style>
    :root {
      --bg: #050505;
      --panel: #101116;
      --line: rgba(255,255,255,0.12);
      --text: #f7f7f7;
      --muted: #a6abb7;
      --red: #ff1515;
      --cyan: #1fc7ff;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 18px;
      background:
        radial-gradient(circle at 18% 10%, rgba(255,21,21,0.18), transparent 28rem),
        radial-gradient(circle at 80% 72%, rgba(31,199,255,0.12), transparent 26rem),
        linear-gradient(180deg, #080808, #020202);
      color: var(--text);
      font-family: Inter, Arial, sans-serif;
    }

    main {
      width: min(100%, 760px);
      display: grid;
      gap: 14px;
    }

    section {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: clamp(18px, 4vw, 28px);
      background:
        radial-gradient(circle at 18% 0%, rgba(255,21,21,0.16), transparent 14rem),
        linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025));
      box-shadow: 0 26px 90px rgba(0,0,0,0.34);
    }

    h1,
    h2,
    p {
      margin-top: 0;
    }

    h1 {
      margin-bottom: 8px;
      font-size: clamp(34px, 7vw, 64px);
      line-height: 0.95;
      text-transform: uppercase;
    }

    h2 {
      margin-bottom: 14px;
      font-size: 22px;
      text-transform: uppercase;
    }

    p {
      color: var(--muted);
      line-height: 1.55;
    }

    label {
      display: grid;
      gap: 7px;
      margin-bottom: 12px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
    }

    input,
    select {
      width: 100%;
      min-height: 46px;
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 8px;
      padding: 0 13px;
      background: #08090d;
      color: #fff;
      font: inherit;
      outline: none;
    }

    input:focus,
    select:focus {
      border-color: rgba(31,199,255,0.72);
      box-shadow: 0 0 0 3px rgba(31,199,255,0.12);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .item {
      margin-top: 12px;
      padding: 12px;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 8px;
      background: rgba(0,0,0,0.22);
    }

    .item strong {
      display: block;
      margin-bottom: 8px;
    }

    button,
    a {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,21,21,0.68);
      border-radius: 8px;
      padding: 0 16px;
      background: linear-gradient(135deg, var(--red), #870000);
      color: #fff;
      font: inherit;
      font-weight: 900;
      text-decoration: none;
      cursor: pointer;
    }

    button.secondary,
    a.secondary {
      border-color: rgba(255,255,255,0.14);
      background: #111319;
      color: var(--muted);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .hidden {
      display: none;
    }

    .status {
      min-height: 24px;
      margin: 12px 0 0;
      color: var(--muted);
      font-weight: 700;
    }

    .status.success {
      color: #25d77b;
    }

    .status.error {
      color: #ff6b6b;
    }

    .preview {
      aspect-ratio: 16 / 9;
      overflow: hidden;
      margin-top: 14px;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 8px;
      background: #050505;
    }

    .preview iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }
  </style>
</head>
<body>
  <main>
    <section>
      <h1>Admin Panel</h1>
      <p>Upload or update the YouTube tutorial link shown on the main website.</p>
      <div class="row">
        <a class="secondary" href="index.html">Open Website</a>
        <button class="secondary hidden" id="logoutBtn" type="button">Logout</button>
      </div>
    </section>

    <section id="loginPanel">
      <h2>Login</h2>
      <label>Email
        <input id="email" type="email" autocomplete="username" placeholder="Admin email">
      </label>
      <label>Password
        <input id="password" type="password" autocomplete="current-password" placeholder="Admin password">
      </label>
      <button id="loginBtn" type="button">Login</button>
      <p class="status" id="loginStatus">Preparing secure login...</p>
    </section>

    <section class="hidden" id="tutorialPanel">
      <h2>Tutorial Video</h2>
      <label>YouTube Link
        <input id="youtubeUrl" type="url" placeholder="https://www.youtube.com/watch?v=...">
      </label>
      <div class="row">
        <button id="saveBtn" type="button">Save Tutorial Link</button>
        <button class="secondary" id="clearBtn" type="button">Clear Link</button>
      </div>
      <p class="status" id="saveStatus"></p>
      <div class="preview hidden" id="videoPreview">
        <iframe id="previewFrame" title="Tutorial preview" allowfullscreen></iframe>
      </div>
    </section>

    <section class="hidden" id="offerPanel">
      <h2>Header Offer Ticker</h2>
      <label>Offer text
        <input id="offerText" type="text" maxlength="220" placeholder="Use LAUNCH50 for 50% off today">
      </label>
      <label><input id="offerActive" type="checkbox" checked> Active</label>
      <div class="row">
        <button id="saveOfferBtn" type="button">Save Offer</button>
        <button class="secondary" id="clearOfferBtn" type="button">Clear Offer</button>
      </div>
      <p class="status" id="offerStatus"></p>
    </section>

    <section class="hidden" id="pricingPanel">
      <h2>Pricing</h2>
      <div id="planList"></div>
      <p class="status" id="pricingStatus"></p>
    </section>

    <section class="hidden" id="couponPanel">
      <h2>Coupons</h2>
      <div class="grid">
        <label>Code
          <input id="couponCode" type="text" placeholder="LAUNCH50">
        </label>
        <label>Discount type
          <select id="couponType">
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>
        <label>Discount value
          <input id="couponValue" type="number" min="1" placeholder="50 or 5000 paise">
        </label>
        <label>Currency for fixed discount
          <input id="couponCurrency" type="text" maxlength="3" placeholder="INR / USD">
        </label>
        <label>Max redemptions
          <input id="couponMax" type="number" min="1" placeholder="Optional">
        </label>
        <label>Expires at
          <input id="couponExpiry" type="datetime-local">
        </label>
      </div>
      <div class="row">
        <button id="saveCouponBtn" type="button">Save Coupon</button>
      </div>
      <p class="status" id="couponStatus"></p>
      <div id="couponList"></div>
    </section>
  </main>

  <script>
    const API_BASE_URL = window.LICENSING_API_BASE_URL || "https://keshavwithvelo-license-api.onrender.com";
    const tokenKey = "velo_admin_token";
    const loginPanel = document.getElementById("loginPanel");
    const tutorialPanel = document.getElementById("tutorialPanel");
    const offerPanel = document.getElementById("offerPanel");
    const pricingPanel = document.getElementById("pricingPanel");
    const couponPanel = document.getElementById("couponPanel");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginStatus = document.getElementById("loginStatus");
    const saveStatus = document.getElementById("saveStatus");
    const offerStatus = document.getElementById("offerStatus");
    const youtubeUrl = document.getElementById("youtubeUrl");
    const offerText = document.getElementById("offerText");
    const offerActive = document.getElementById("offerActive");
    const videoPreview = document.getElementById("videoPreview");
    const previewFrame = document.getElementById("previewFrame");

    function token() {
      return localStorage.getItem(tokenKey);
    }

    function setStatus(element, message, mode = "") {
      element.textContent = message;
      element.className = `status${mode ? ` ${mode}` : ""}`;
    }

    function getYoutubeId(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";
      if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

      try {
        const url = new URL(raw);
        if (url.searchParams.has("v")) return url.searchParams.get("v");

        const parts = url.pathname.split("/").filter(Boolean);
        const embedIndex = parts.indexOf("embed");
        const shortsIndex = parts.indexOf("shorts");

        if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
        if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
        if (url.hostname.includes("youtu.be") && parts[0]) return parts[0];
      } catch (error) {
        return "";
      }

      return "";
    }

    function updatePreview(value) {
      const videoId = getYoutubeId(value);
      if (!videoId) {
        videoPreview.classList.add("hidden");
        previewFrame.removeAttribute("src");
        return;
      }

      previewFrame.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
      videoPreview.classList.remove("hidden");
    }

    async function api(path, options = {}) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || 90000);

      let response;
      try {
        response = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
            ...(options.headers || {})
          }
        });
      } catch (error) {
        if (error.name === "AbortError") throw { error: "Backend is taking too long to respond. Try again in a few seconds." };
        throw { error: "Cannot connect to backend. Please try again." };
      } finally {
        window.clearTimeout(timeout);
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) throw data;
      return data;
    }

    async function warmApi() {
      try {
        setStatus(loginStatus, "Waking secure backend. First load can take up to one minute...");
        await api("/api/health", { timeoutMs: 90000 });
        setStatus(loginStatus, "Ready to login.", "success");
      } catch (error) {
        setStatus(loginStatus, error.error || "Backend is still waking up. Login may take longer.", "error");
      }
    }

    function showAdmin() {
      loginPanel.classList.add("hidden");
      tutorialPanel.classList.remove("hidden");
      offerPanel.classList.remove("hidden");
      pricingPanel.classList.remove("hidden");
      couponPanel.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
    }

    function showLogin() {
      loginPanel.classList.remove("hidden");
      tutorialPanel.classList.add("hidden");
      offerPanel.classList.add("hidden");
      pricingPanel.classList.add("hidden");
      couponPanel.classList.add("hidden");
      logoutBtn.classList.add("hidden");
    }

    async function loadTutorial() {
      try {
        const data = await api("/api/admin/settings/tutorial");
        youtubeUrl.value = data.youtubeUrl || "";
        updatePreview(youtubeUrl.value);
        setStatus(saveStatus, data.youtubeUrl ? "Current tutorial link loaded." : "No tutorial link is saved yet.");
      } catch (error) {
        localStorage.removeItem(tokenKey);
        showLogin();
        setStatus(loginStatus, "Please login again.", "error");
      }
    }

    async function loadOffer() {
      try {
        const data = await api("/api/admin/settings/offer-banner");
        offerText.value = data.text || "";
        offerActive.checked = data.isActive !== false;
        setStatus(offerStatus, data.text ? "Current offer loaded." : "No offer text is saved yet.");
      } catch (error) {
        setStatus(offerStatus, error.error || "Could not load offer.", "error");
      }
    }

    function money(amount, currency) {
      return `${currency} ${(Number(amount || 0) / 100).toFixed(2)}`;
    }

    async function loadPricingTools() {
      const pricingStatus = document.getElementById("pricingStatus");
      const planList = document.getElementById("planList");
      const couponList = document.getElementById("couponList");

      try {
        const [plans, coupons] = await Promise.all([
          api("/api/admin/pricing/plans"),
          api("/api/admin/pricing/coupons")
        ]);

        planList.innerHTML = plans.map((plan) => `
          <div class="item" data-plan="${plan.key}">
            <strong>${plan.key}</strong>
            <div class="grid">
              <label>Title <input data-field="title" value="${plan.title}"></label>
              <label>Amount in paise/cents <input data-field="amount" type="number" min="100" value="${plan.amount}"></label>
              <label>Currency <input data-field="currency" maxlength="3" value="${plan.currency}"></label>
              <label>Description <input data-field="description" value="${plan.description}"></label>
            </div>
            <label><input data-field="isActive" type="checkbox" ${plan.isActive ? "checked" : ""}> Active</label>
            <button type="button" data-save-plan="${plan.key}">Save Plan</button>
          </div>
        `).join("");

        couponList.innerHTML = coupons.map((coupon) => `
          <div class="item">
            <strong>${coupon.code} ${coupon.isActive ? "" : "(inactive)"}</strong>
            <p>${coupon.discountType} ${coupon.discountValue}${coupon.currency ? ` ${coupon.currency}` : ""} - used ${coupon.redeemedCount}${coupon.maxRedemptions ? `/${coupon.maxRedemptions}` : ""}</p>
            <button class="secondary" type="button" data-toggle-coupon="${coupon.code}">${coupon.isActive ? "Disable" : "Enable"}</button>
          </div>
        `).join("");

        setStatus(pricingStatus, "Pricing loaded.", "success");
      } catch (error) {
        setStatus(pricingStatus, error.error || "Could not load pricing tools.", "error");
      }
    }

    document.getElementById("loginBtn").addEventListener("click", async () => {
      try {
        setStatus(loginStatus, "Logging in. If the server was asleep, this can take up to one minute...");
        const data = await api("/api/admin/login", {
          method: "POST",
          body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
          })
        });

        localStorage.setItem(tokenKey, data.token);
        setStatus(loginStatus, "Logged in.", "success");
        showAdmin();
        await loadTutorial();
        await loadOffer();
        await loadPricingTools();
      } catch (error) {
        setStatus(loginStatus, error.error || "Login failed.", "error");
      }
    });

    document.getElementById("saveBtn").addEventListener("click", async () => {
      try {
        setStatus(saveStatus, "Saving...");
        const data = await api("/api/admin/settings/tutorial", {
          method: "POST",
          body: JSON.stringify({ youtubeUrl: youtubeUrl.value.trim() })
        });

        youtubeUrl.value = data.youtubeUrl || "";
        updatePreview(youtubeUrl.value);
        setStatus(saveStatus, "Tutorial link saved. The website will show this video now.", "success");
      } catch (error) {
        setStatus(saveStatus, error.error || error.message || "Could not save tutorial link.", "error");
      }
    });

    document.getElementById("clearBtn").addEventListener("click", () => {
      youtubeUrl.value = "";
      updatePreview("");
    });

    document.getElementById("saveOfferBtn").addEventListener("click", async () => {
      try {
        setStatus(offerStatus, "Saving offer...");
        const data = await api("/api/admin/settings/offer-banner", {
          method: "POST",
          body: JSON.stringify({
            text: offerText.value.trim(),
            isActive: offerActive.checked
          })
        });
        offerText.value = data.text || "";
        offerActive.checked = data.isActive !== false;
        setStatus(offerStatus, "Offer ticker saved.", "success");
      } catch (error) {
        setStatus(offerStatus, error.error || "Could not save offer.", "error");
      }
    });

    document.getElementById("clearOfferBtn").addEventListener("click", () => {
      offerText.value = "";
    });

    document.getElementById("planList").addEventListener("click", async (event) => {
      const button = event.target.closest("[data-save-plan]");
      if (!button) return;

      const box = button.closest("[data-plan]");
      const key = box.dataset.plan;
      const value = (field) => box.querySelector(`[data-field="${field}"]`);

      try {
        setStatus(document.getElementById("pricingStatus"), "Saving plan...");
        await api(`/api/admin/pricing/plans/${encodeURIComponent(key)}`, {
          method: "PUT",
          body: JSON.stringify({
            title: value("title").value.trim(),
            amount: Number(value("amount").value),
            currency: value("currency").value.trim(),
            licenseType: "standard",
            description: value("description").value.trim(),
            isActive: value("isActive").checked
          })
        });
        setStatus(document.getElementById("pricingStatus"), "Plan saved.", "success");
        await loadPricingTools();
      } catch (error) {
        setStatus(document.getElementById("pricingStatus"), error.error || "Could not save plan.", "error");
      }
    });

    document.getElementById("saveCouponBtn").addEventListener("click", async () => {
      try {
        setStatus(document.getElementById("couponStatus"), "Saving coupon...");
        await api("/api/admin/pricing/coupons", {
          method: "POST",
          body: JSON.stringify({
            code: document.getElementById("couponCode").value.trim(),
            discountType: document.getElementById("couponType").value,
            discountValue: Number(document.getElementById("couponValue").value),
            currency: document.getElementById("couponCurrency").value.trim(),
            maxRedemptions: document.getElementById("couponMax").value ? Number(document.getElementById("couponMax").value) : null,
            expiresAt: document.getElementById("couponExpiry").value || null,
            isActive: true
          })
        });
        setStatus(document.getElementById("couponStatus"), "Coupon saved.", "success");
        await loadPricingTools();
      } catch (error) {
        setStatus(document.getElementById("couponStatus"), error.error || "Could not save coupon.", "error");
      }
    });

    document.getElementById("couponList").addEventListener("click", async (event) => {
      const button = event.target.closest("[data-toggle-coupon]");
      if (!button) return;
      try {
        await api(`/api/admin/pricing/coupons/${encodeURIComponent(button.dataset.toggleCoupon)}/toggle`, { method: "POST" });
        await loadPricingTools();
      } catch (error) {
        setStatus(document.getElementById("couponStatus"), error.error || "Could not update coupon.", "error");
      }
    });

    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(tokenKey);
      showLogin();
      setStatus(loginStatus, "Logged out.");
    });

    youtubeUrl.addEventListener("input", () => updatePreview(youtubeUrl.value));

    if (token()) {
      showAdmin();
      loadTutorial();
      loadOffer();
      loadPricingTools();
    } else {
      warmApi();
    }
  </script>
</body>
</html>

