const output = document.getElementById("output");
const tokenKey = "velo_admin_token";

function token() {
  return localStorage.getItem(tokenKey);
}

function show(data) {
  output.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw data;
  return data;
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const data = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      })
    });
    localStorage.setItem(tokenKey, data.token);
    show("Logged in.");
  } catch (error) {
    show(error);
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  show("Logged out.");
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      const action = button.dataset.action;
      const q = encodeURIComponent(document.getElementById("licenseSearch").value);
      const path = action === "licenses" ? `/api/admin/licenses?q=${q}` : `/api/admin/${action === "attempts" ? "activation-attempts" : action}`;
      show(await api(path));
    } catch (error) {
      show(error);
    }
  });
});

document.querySelectorAll("[data-license-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      const id = document.getElementById("licenseId").value;
      show(await api(`/api/admin/licenses/${id}/${button.dataset.licenseAction}`, { method: "POST" }));
    } catch (error) {
      show(error);
    }
  });
});

document.getElementById("manualBtn").addEventListener("click", async () => {
  try {
    show(await api("/api/admin/manual-license", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("manualName").value,
        email: document.getElementById("manualEmail").value,
        licenseType: document.getElementById("manualType").value,
        expiryDays: Number(document.getElementById("manualDays").value || 365)
      })
    }));
  } catch (error) {
    show(error);
  }
});

document.getElementById("versionBtn").addEventListener("click", async () => {
  try {
    show(await api("/api/admin/versions", {
      method: "POST",
      body: JSON.stringify({
        version: document.getElementById("version").value,
        downloadPath: document.getElementById("downloadPath").value,
        notes: document.getElementById("notes").value,
        isActive: document.getElementById("isActive").value === "true"
      })
    }));
  } catch (error) {
    show(error);
  }
});
