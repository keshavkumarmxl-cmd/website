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

    input {
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

    input:focus {
      border-color: rgba(31,199,255,0.72);
      box-shadow: 0 0 0 3px rgba(31,199,255,0.12);
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
  </main>

  <script>
    const API_BASE_URL = window.LICENSING_API_BASE_URL || "https://keshavwithvelo-license-api.onrender.com";
    const tokenKey = "velo_admin_token";
    const loginPanel = document.getElementById("loginPanel");
    const tutorialPanel = document.getElementById("tutorialPanel");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginStatus = document.getElementById("loginStatus");
    const saveStatus = document.getElementById("saveStatus");
    const youtubeUrl = document.getElementById("youtubeUrl");
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
      logoutBtn.classList.remove("hidden");
    }

    function showLogin() {
      loginPanel.classList.remove("hidden");
      tutorialPanel.classList.add("hidden");
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

    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(tokenKey);
      showLogin();
      setStatus(loginStatus, "Logged out.");
    });

    youtubeUrl.addEventListener("input", () => updatePreview(youtubeUrl.value));

    if (token()) {
      showAdmin();
      loadTutorial();
    } else {
      warmApi();
    }
  </script>
</body>
</html>
