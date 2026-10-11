<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Keshav With Velo Admin</title>
  <style>
    :root {
      --bg: #050507;
      --panel: rgba(14, 15, 20, 0.86);
      --line: rgba(255,255,255,0.12);
      --line-red: rgba(255,35,35,0.42);
      --text: #f8f8f8;
      --muted: #a7acb8;
      --soft: #d5d8df;
      --red: #ff171f;
      --red-dark: #8f0007;
      --green: #19d27c;
      --cyan: #20c7ff;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }

    body {
      margin: 0;
      min-height: 100vh;
      padding: clamp(14px, 2.4vw, 28px);
      background:
        radial-gradient(circle at 14% 8%, rgba(255,23,31,0.22), transparent 30rem),
        radial-gradient(circle at 86% 20%, rgba(32,199,255,0.09), transparent 28rem),
        linear-gradient(180deg, #09090b, #020203 64%, #000);
      color: var(--text);
      font-family: Inter, Arial, sans-serif;
    }

    button, input, select { font: inherit; }

    button,
    a {
      min-height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid rgba(255,23,31,0.58);
      border-radius: 12px;
      padding: 0 16px;
      background: linear-gradient(135deg, var(--red), var(--red-dark));
      color: #fff;
      font-weight: 900;
      text-decoration: none;
      cursor: pointer;
      box-shadow: 0 14px 34px rgba(255,23,31,0.16);
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }

    button:hover,
    a:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.28); }

    button.secondary,
    a.secondary {
      border-color: rgba(255,255,255,0.14);
      background: rgba(17,19,25,0.84);
      color: var(--soft);
      box-shadow: none;
    }

    button.danger {
      border-color: rgba(255,107,107,0.48);
      background: rgba(68,18,22,0.72);
      color: #ffbcbc;
      box-shadow: none;
    }

    .admin-page {
      width: min(100%, 1240px);
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }

    .admin-hero,
    .login-card,
    .admin-sidebar,
    .admin-card {
      border: 1px solid var(--line);
      border-radius: 22px;
      background:
        linear-gradient(135deg, rgba(255,23,31,0.11), transparent 42%),
        linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.028));
      box-shadow: 0 28px 90px rgba(0,0,0,0.38);
      backdrop-filter: blur(16px);
    }

    .admin-hero {
      position: sticky;
      top: 14px;
      z-index: 20;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      padding: 16px;
      border-color: rgba(255,23,31,0.26);
      background: rgba(5,5,7,0.86);
    }

    .brand-mini {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .brand-mini img {
      width: 54px;
      height: 54px;
      flex: 0 0 auto;
      border-radius: 16px;
      object-fit: cover;
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: 0 0 0 4px rgba(255,23,31,0.08);
    }

    .eyebrow {
      margin: 0 0 5px;
      color: var(--red);
      font-size: 12px;
      font-weight: 950;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    h1, h2, h3, p { margin-top: 0; }
    h1 { margin-bottom: 4px; font-size: clamp(24px, 3vw, 42px); line-height: 1; }
    h2 { margin-bottom: 8px; font-size: clamp(21px, 2vw, 30px); line-height: 1.05; }
    h3 { margin-bottom: 7px; font-size: 15px; }

    p {
      color: var(--muted);
      line-height: 1.55;
    }

    .hero-copy p,
    .section-head p,
    .side-card p { margin-bottom: 0; }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }

    .login-card {
      width: min(100%, 520px);
      margin: 22px auto 0;
      padding: clamp(22px, 4vw, 34px);
    }

    .login-card .grid { grid-template-columns: 1fr; }

    .admin-shell {
      display: grid;
      grid-template-columns: 285px minmax(0, 1fr);
      gap: 18px;
      align-items: start;
    }

    .admin-sidebar {
      position: sticky;
      top: 106px;
      display: grid;
      gap: 12px;
      padding: 14px;
    }

    .side-card {
      padding: 14px;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 16px;
      background: rgba(0,0,0,0.20);
    }

    .side-nav {
      display: grid;
      gap: 8px;
    }

    .side-nav button {
      justify-content: flex-start;
      min-height: 46px;
      border-color: rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.045);
      box-shadow: none;
      color: var(--soft);
    }

    .side-nav button.is-active,
    .side-nav button:hover {
      border-color: rgba(255,23,31,0.62);
      background: rgba(255,23,31,0.13);
      color: #fff;
    }

    .workspace {
      display: grid;
      gap: 18px;
      min-width: 0;
    }

    .overview-grid,
    .hint-grid,
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .overview-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }

    .metric,
    .hint,
    .item {
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 16px;
      background: rgba(0,0,0,0.23);
      padding: 14px;
    }

    .metric span,
    .hint span {
      display: block;
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 950;
      letter-spacing: .12em;
      text-transform: uppercase;
    }

    .metric strong { display: block; font-size: 22px; line-height: 1; }
    .hint p, .item p { margin-bottom: 0; }

    .admin-card {
      scroll-margin-top: 112px;
      padding: clamp(18px, 3vw, 26px);
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.10);
    }

    .section-number {
      min-width: 42px;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line-red);
      border-radius: 14px;
      color: var(--red);
      font-weight: 950;
      background: rgba(255,23,31,0.08);
    }

    label {
      display: grid;
      gap: 8px;
      margin-bottom: 13px;
      color: var(--soft);
      font-size: 12px;
      font-weight: 950;
      letter-spacing: .04em;
      text-transform: uppercase;
    }

    input,
    select {
      width: 100%;
      min-height: 48px;
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 13px;
      padding: 0 14px;
      background: rgba(5,6,9,0.92);
      color: #fff;
      outline: none;
    }

    input:focus,
    select:focus {
      border-color: rgba(255,23,31,0.78);
      box-shadow: 0 0 0 4px rgba(255,23,31,0.12);
    }

    input[type="checkbox"] {
      width: 18px;
      min-height: 18px;
      accent-color: var(--red);
    }

    .checkbox-label {
      display: flex;
      grid-template-columns: none;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }

    .status {
      min-height: 24px;
      margin: 12px 0 0;
      color: var(--muted);
      font-weight: 800;
    }

    .status.success { color: #25d77b; }
    .status.error { color: #ff6b6b; }

    .preview {
      aspect-ratio: 16 / 9;
      overflow: hidden;
      margin-top: 14px;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 18px;
      background: #050505;
    }

    .preview iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }

    .item { margin-top: 12px; }
    .item strong { display: block; margin-bottom: 8px; }
    .hidden { display: none !important; }

    @media (max-width: 980px) {
      .admin-shell { grid-template-columns: 1fr; }
      .admin-sidebar { position: static; }
      .overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 680px) {
      body { padding: 10px; }
      .admin-hero { position: static; align-items: flex-start; flex-direction: column; }
      .brand-mini img { width: 46px; height: 46px; border-radius: 13px; }
      .grid, .hint-grid, .overview-grid { grid-template-columns: 1fr; }
      .section-head { flex-direction: column; }
      button, a { width: 100%; }
      .row { width: 100%; }
    }
  </style>
</head>
<body>
  <main class="admin-page">
    <section class="admin-hero">
      <div class="brand-mini">
        <img src="assets/profile.png" alt="Keshav With Velo">
        <div class="hero-copy">
          <p class="eyebrow">Keshav With Velo Control Room</p>
          <h1>Admin Panel</h1>
          <p>Website ka content, timer, price aur coupon settings ek jagah se manage karo.</p>
        </div>
      </div>
      <div class="row">
        <a class="secondary" href="index.html">Open Website</a>
        <button class="secondary hidden" id="logoutBtn" type="button">Logout</button>
      </div>
    </section>

    <section class="login-card" id="loginPanel">
      <p class="eyebrow">Secure Access</p>
      <h2>Login to admin</h2>
      <p>Local testing ke liye dev login button use kar sakte ho. Live changes save karne se website settings update hongi.</p>
      <div class="grid">
        <label>Email
          <input id="email" type="email" placeholder="admin@email.com" autocomplete="username">
        </label>
        <label>Password
          <input id="password" type="password" placeholder="Password" autocomplete="current-password">
        </label>
      </div>
      <div class="row">
        <button id="loginBtn" type="button">Login</button>
        <button class="secondary" id="devLoginBtn" type="button">Open locally without password</button>
      </div>
      <p class="status" id="loginStatus"></p>
    </section>

    <div class="admin-shell hidden" id="dashboardShell">
      <aside class="admin-sidebar">
        <div class="side-card">
          <p class="eyebrow">Quick Menu</p>
          <h3>Kaunsi setting chahiye?</h3>
          <p>Left se section choose karo, right side me uska form open rahega.</p>
        </div>
        <nav class="side-nav" aria-label="Admin sections">
          <button class="is-active" type="button" data-admin-jump="tutorialPanel">Tutorial video</button>
          <button type="button" data-admin-jump="offerPanel">Top offer ticker</button>
          <button type="button" data-admin-jump="promoPanel">Promo timer</button>
          <button type="button" data-admin-jump="pricingPanel">Website pricing</button>
          <button type="button" data-admin-jump="couponPanel">Coupon controls</button>
        </nav>
        <div class="side-card">
          <h3>Save rule</h3>
          <p>Har card ka apna save button hai. Jo setting change karo, usi card ka save dabao.</p>
        </div>
      </aside>

      <div class="workspace">
        <section class="admin-card" id="overviewPanel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Dashboard Overview</p>
              <h2>Important controls</h2>
              <p>Ye shortcut cards batate hain kaunsi setting kis kaam ke liye hai.</p>
            </div>
            <span class="section-number">00</span>
          </div>
          <div class="overview-grid">
            <div class="metric"><span>Video</span><strong>Tutorial</strong></div>
            <div class="metric"><span>Sale</span><strong>Timer</strong></div>
            <div class="metric"><span>Checkout</span><strong>Price</strong></div>
            <div class="metric"><span>Discount</span><strong>Coupon</strong></div>
          </div>
        </section>

        <section class="admin-card hidden" id="tutorialPanel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Step 01</p>
              <h2>Tutorial video</h2>
              <p>Website par tutorial section me jo YouTube video dikhta hai, uska link yahan se change hota hai.</p>
            </div>
            <span class="section-number">01</span>
          </div>
          <label>YouTube link
            <input id="youtubeUrl" type="url" placeholder="https://www.youtube.com/watch?v=...">
          </label>
          <div class="row">
            <button id="saveBtn" type="button">Save tutorial</button>
            <button class="danger" id="clearBtn" type="button">Clear video</button>
          </div>
          <p class="status" id="saveStatus"></p>
          <div class="preview hidden" id="videoPreview">
            <iframe id="previewFrame" allowfullscreen title="Tutorial preview"></iframe>
          </div>
        </section>

        <section class="admin-card hidden" id="offerPanel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Step 02</p>
              <h2>Top offer ticker</h2>
              <p>Website ke top scrolling message ko on/off aur edit karo.</p>
            </div>
            <span class="section-number">02</span>
          </div>
          <label>Offer text
            <input id="offerText" type="text" placeholder="WINDOWS & MAC SUPPORTED • AE 2023+ REQUIRED">
          </label>
          <label class="checkbox-label"><input id="offerActive" type="checkbox"> Show offer ticker on website</label>
          <div class="row">
            <button id="saveOfferBtn" type="button">Save offer</button>
            <button class="danger" id="clearOfferBtn" type="button">Clear offer</button>
          </div>
          <p class="status" id="offerStatus"></p>
        </section>

        <section class="admin-card hidden" id="promoPanel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Step 03</p>
              <h2>Promo timer</h2>
              <p>Website hero me jo countdown timer hai uska active state aur end time yahan se control hota hai.</p>
            </div>
            <span class="section-number">03</span>
          </div>
          <div class="hint-grid">
            <div class="hint"><span>Tip</span><p>40 hour sale start karni ho to quick button use karo.</p></div>
            <div class="hint"><span>Display</span><p>Timer active hoga to website par red promo countdown dikhega.</p></div>
          </div>
          <label class="checkbox-label"><input id="promoActive" type="checkbox"> Promo timer active</label>
          <div class="grid">
            <label>Promo ends at
              <input id="promoEndsAt" type="datetime-local">
            </label>
            <label>Badge text
              <input id="promoBadge" type="text" placeholder="40H PROMO ACTIVE">
            </label>
          </div>
          <div class="row">
            <button class="secondary" id="promo40Btn" type="button">Set 40 hours from now</button>
            <button id="savePromoBtn" type="button">Save promo timer</button>
          </div>
          <p class="status" id="promoStatus"></p>
        </section>

        <section class="admin-card hidden" id="pricingPanel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Step 04</p>
              <h2>Website pricing</h2>
              <p>India aur International checkout prices yahan se edit karo.</p>
            </div>
            <span class="section-number">04</span>
          </div>
          <div id="planList"></div>
          <p class="status" id="pricingStatus"></p>
        </section>

        <section class="admin-card hidden" id="couponPanel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Step 05</p>
              <h2>Coupon controls</h2>
              <p>Checkout form me coupon field enable/disable karo aur coupon code create karo.</p>
            </div>
            <span class="section-number">05</span>
          </div>
          <label class="checkbox-label"><input id="checkoutCouponsEnabled" type="checkbox"> Show coupon code field at checkout</label>
          <div class="row">
            <button class="secondary" id="loadCouponSettingBtn" type="button">Load coupon setting</button>
            <button id="saveCouponSettingBtn" type="button">Save coupon field setting</button>
          </div>
          <div class="grid">
            <label>Coupon code
              <input id="couponCode" type="text" placeholder="SAVE20">
            </label>
            <label>Discount type
              <select id="couponType">
                <option value="percent">Percent</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label>Discount value
              <input id="couponValue" type="number" min="0" step="0.01" placeholder="20">
            </label>
            <label>Currency
              <select id="couponCurrency">
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="ALL">All</option>
              </select>
            </label>
            <label>Max uses
              <input id="couponMax" type="number" min="0" step="1" placeholder="0 = unlimited">
            </label>
            <label>Expiry date
              <input id="couponExpiry" type="date">
            </label>
          </div>
          <div class="row">
            <button id="saveCouponBtn" type="button">Create coupon</button>
          </div>
          <p class="status" id="couponStatus"></p>
          <div id="couponList"></div>
        </section>
      </div>
    </div>
  </main>

  <script>
    const isLocalAdminOpen = window.location.protocol === "file:" || ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
    const API_BASE_URL = window.LICENSING_API_BASE_URL || (isLocalAdminOpen ? "http://localhost:4000" : "https://api.keshavwithvelo.in");
    const tokenKey = "velo_admin_token";
    const loginPanel = document.getElementById("loginPanel");
    const tutorialPanel = document.getElementById("tutorialPanel");
    const offerPanel = document.getElementById("offerPanel");
    const promoPanel = document.getElementById("promoPanel");
    const pricingPanel = document.getElementById("pricingPanel");
    const couponPanel = document.getElementById("couponPanel");
    const logoutBtn = document.getElementById("logoutBtn");
    const dashboardShell = document.getElementById("dashboardShell");
    const devLoginBtn = document.getElementById("devLoginBtn");
    const loginStatus = document.getElementById("loginStatus");
    const saveStatus = document.getElementById("saveStatus");
    const offerStatus = document.getElementById("offerStatus");
    const youtubeUrl = document.getElementById("youtubeUrl");
    const offerText = document.getElementById("offerText");
    const offerActive = document.getElementById("offerActive");
    const promoActive = document.getElementById("promoActive");
    const promoEndsAt = document.getElementById("promoEndsAt");
    const promoBadge = document.getElementById("promoBadge");
    const checkoutCouponsEnabled = document.getElementById("checkoutCouponsEnabled");
    const videoPreview = document.getElementById("videoPreview");
    const previewFrame = document.getElementById("previewFrame");

    function token() {
      return localStorage.getItem(tokenKey);
    }

    async function finishLogin(data, message = "Logged in.") {
      localStorage.setItem(tokenKey, data.token);
      setStatus(loginStatus, message, "success");
      showAdmin();
      await loadTutorial();
      await loadOffer();
      await loadPromo();
      await loadCouponSetting();
      await loadPricingTools();
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
      promoPanel.classList.remove("hidden");
      pricingPanel.classList.remove("hidden");
      couponPanel.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
      dashboardShell.classList.remove("hidden");
    }

    function showLogin() {
      loginPanel.classList.remove("hidden");
      tutorialPanel.classList.add("hidden");
      offerPanel.classList.add("hidden");
      promoPanel.classList.add("hidden");
      pricingPanel.classList.add("hidden");
      couponPanel.classList.add("hidden");
      logoutBtn.classList.add("hidden");
      dashboardShell.classList.add("hidden");
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

    function toDateTimeLocal(value) {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return offsetDate.toISOString().slice(0, 16);
    }

    function fromDateTimeLocal(value) {
      if (!value) return "";
      return new Date(value).toISOString();
    }

    function setPromoFor40Hours() {
      const date = new Date(Date.now() + 40 * 60 * 60 * 1000);
      promoEndsAt.value = toDateTimeLocal(date.toISOString());
      promoActive.value = "true";
      promoBadge.value = "40H Promo Active";
    }

    async function loadPromo() {
      try {
        const data = await api("/api/admin/settings/promo-timer");
        promoActive.value = data.isActive === false ? "false" : "true";
        promoEndsAt.value = toDateTimeLocal(data.endsAt);
        promoBadge.value = data.badge || "40H Promo Active";
        setStatus(document.getElementById("promoStatus"), data.endsAt ? "Promo timer loaded." : "No end time saved yet.");
      } catch (error) {
        setStatus(document.getElementById("promoStatus"), error.error || "Could not load promo timer.", "error");
      }
    }

    async function loadCouponSetting() {
      try {
        const data = await api("/api/admin/settings/checkout-coupons");
        checkoutCouponsEnabled.checked = data.isEnabled !== false;
        setStatus(document.getElementById("couponStatus"), checkoutCouponsEnabled.checked ? "Coupon field is enabled on checkout." : "Coupon field is disabled on checkout.", "success");
      } catch (error) {
        setStatus(document.getElementById("couponStatus"), error.error || "Could not load coupon field setting.", "error");
      }
    }

    function money(amount, currency = "INR") {
      return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2
      }).format(Number(amount || 0) / 100);
    }

    function majorAmount(amount) {
      return (Number(amount || 0) / 100).toFixed(2).replace(/\.00$/, "");
    }

    function minorAmount(value) {
      return Math.round(Number(value || 0) * 100);
    }

    function discountLabel(coupon) {
      if (coupon.discountType === "percent") return `${coupon.discountValue}%`;
      return money(coupon.discountValue, coupon.currency || "INR");
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
              <label>Price (${plan.currency === "INR" ? "rupees" : "dollars"}) <input data-field="amount" type="number" min="1" step="0.01" value="${majorAmount(plan.amount)}"></label>
              <label>Currency <input data-field="currency" maxlength="3" value="${plan.currency}"></label>
              <label>Description <input data-field="description" value="${plan.description}"></label>
            </div>
            <label class="checkbox-label"><input data-field="isActive" type="checkbox" ${plan.isActive ? "checked" : ""}> Active</label>
            <button type="button" data-save-plan="${plan.key}">Save Plan</button>
          </div>
        `).join("");

        couponList.innerHTML = coupons.map((coupon) => `
          <div class="item">
            <strong>${coupon.code} ${coupon.isActive ? "" : "(inactive)"}</strong>
            <p>${coupon.discountType} ${discountLabel(coupon)} - used ${coupon.redeemedCount}${coupon.maxRedemptions ? `/${coupon.maxRedemptions}` : ""}</p>
            <div class="row">
              <button class="secondary" type="button" data-toggle-coupon="${coupon.code}">${coupon.isActive ? "Disable" : "Enable"}</button>
              <button class="danger" type="button" data-delete-coupon="${coupon.code}">Delete</button>
            </div>
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

        await finishLogin(data);
      } catch (error) {
        setStatus(loginStatus, error.error || "Login failed.", "error");
      }
    });

        devLoginBtn.classList.toggle("hidden", !isLocalAdminOpen);
    devLoginBtn.addEventListener("click", async () => {
      try {
        setStatus(loginStatus, "Opening local admin without password...");
        const data = await api("/api/admin/dev-login", { method: "POST" });
        await finishLogin(data, "Local admin opened without password.");
      } catch (error) {
        setStatus(loginStatus, error.error || "Start local backend first: cd backend && npm run dev", "error");
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

    document.getElementById("promo40Btn").addEventListener("click", setPromoFor40Hours);

    document.getElementById("savePromoBtn").addEventListener("click", async () => {
      try {
        setStatus(document.getElementById("promoStatus"), "Saving promo timer...");
        await api("/api/admin/settings/promo-timer", {
          method: "POST",
          body: JSON.stringify({
            isActive: promoActive.value === "true",
            endsAt: fromDateTimeLocal(promoEndsAt.value),
            badge: promoBadge.value.trim() || "40H Promo Active"
          })
        });
        setStatus(document.getElementById("promoStatus"), "Promo timer saved.", "success");
      } catch (error) {
        setStatus(document.getElementById("promoStatus"), error.error || "Could not save promo timer.", "error");
      }
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
            amount: minorAmount(value("amount").value),
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

    document.getElementById("loadCouponSettingBtn").addEventListener("click", loadCouponSetting);

    document.getElementById("saveCouponSettingBtn").addEventListener("click", async () => {
      try {
        setStatus(document.getElementById("couponStatus"), "Saving coupon field setting...");
        const data = await api("/api/admin/settings/checkout-coupons", {
          method: "POST",
          body: JSON.stringify({ isEnabled: checkoutCouponsEnabled.checked })
        });
        checkoutCouponsEnabled.checked = data.isEnabled !== false;
        setStatus(document.getElementById("couponStatus"), checkoutCouponsEnabled.checked ? "Coupon field enabled on checkout." : "Coupon field disabled on checkout.", "success");
      } catch (error) {
        setStatus(document.getElementById("couponStatus"), error.error || "Could not save coupon field setting.", "error");
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
            discountValue: document.getElementById("couponType").value === "fixed"
              ? minorAmount(document.getElementById("couponValue").value)
              : Number(document.getElementById("couponValue").value),
            currency: document.getElementById("couponType").value === "fixed"
              ? document.getElementById("couponCurrency").value.trim()
              : "",
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
      const button = event.target.closest("[data-toggle-coupon], [data-delete-coupon]");
      if (!button) return;
      try {
        if (button.dataset.deleteCoupon) {
          if (!window.confirm(`Delete coupon ${button.dataset.deleteCoupon}? Users will not be able to use it after deletion.`)) return;
          await api(`/api/admin/pricing/coupons/${encodeURIComponent(button.dataset.deleteCoupon)}`, { method: "DELETE" });
          setStatus(document.getElementById("couponStatus"), "Coupon deleted.", "success");
        } else {
          await api(`/api/admin/pricing/coupons/${encodeURIComponent(button.dataset.toggleCoupon)}/toggle`, { method: "POST" });
          setStatus(document.getElementById("couponStatus"), "Coupon updated.", "success");
        }
        await loadPricingTools();
      } catch (error) {
        setStatus(document.getElementById("couponStatus"), error.error || "Could not update coupon.", "error");
      }
    });

    document.querySelectorAll("[data-admin-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.adminJump);
        if (!target) return;
        document.querySelectorAll("[data-admin-jump]").forEach((item) => item.classList.toggle("is-active", item === button));
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(tokenKey);
      showLogin();
      setStatus(loginStatus, isLocalAdminOpen ? "Logged out. You can open locally without password." : "Logged out.");
    });

    youtubeUrl.addEventListener("input", () => updatePreview(youtubeUrl.value));

    if (token()) {
      showAdmin();
      loadTutorial();
      loadOffer();
      loadPromo();
      loadCouponSetting();
      loadPricingTools();
    } else {
      warmApi();
      if (isLocalAdminOpen) setStatus(loginStatus, "Local mode: start backend, then click Open locally without password.");
    }
  </script>
</body>
</html>
