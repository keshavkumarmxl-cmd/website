const output = document.getElementById("output");
const tokenKey = "velo_admin_token";

const metricType = document.getElementById("metricType");
const metricRows = document.getElementById("metricRows");
const metricLicense = document.getElementById("metricLicense");
const metricAction = document.getElementById("metricAction");
const resultTitle = document.getElementById("resultTitle");
const resultSubtitle = document.getElementById("resultSubtitle");
const sessionBadge = document.getElementById("sessionBadge");
const sidebarAdminEmail = document.getElementById("sidebarAdminEmail");
const sidebarSessionBadge = document.getElementById("sidebarSessionBadge");
const licenseIdInput = document.getElementById("licenseId");

function token() {
  return localStorage.getItem(tokenKey);
}

function adminEmail() {
  return localStorage.getItem("velo_admin_email") || "";
}

function setAuthState() {
  const isLoggedIn = Boolean(token());
  document.body.classList.toggle("is-authenticated", isLoggedIn);
  sessionBadge.textContent = isLoggedIn ? "Logged in" : "Logged out";
  sessionBadge.className = "badge " + (isLoggedIn ? "success" : "");
  if (sidebarSessionBadge) sidebarSessionBadge.textContent = isLoggedIn ? "Logged in" : "Logged out";
  if (sidebarAdminEmail) sidebarAdminEmail.textContent = adminEmail() || "-";
}

function setMetric(type, rows, action) {
  metricType.textContent = type || "Idle";
  metricRows.textContent = Number.isFinite(rows) ? String(rows) : "0";
  if (action) metricAction.textContent = action;
  setAuthState();
}

function setSelectedLicense(id) {
  const value = id ? String(id) : "-";
  metricLicense.textContent = value;
  if (id) licenseIdInput.value = id;
}

function activateTool(toolName, shouldStore = true) {
  const selected = toolName || "license";
  document.querySelectorAll("[data-tool-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.toolPanel === selected);
  });
  document.querySelectorAll("[data-tool-target]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.toolTarget === selected);
  });
  if (shouldStore) localStorage.setItem("velo_admin_active_tool", selected);
  const firstPanel = document.querySelector(`[data-tool-panel="${selected}"]`);
  if (shouldStore && firstPanel) firstPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusBadge(status) {
  const value = String(status || "unknown").toLowerCase();
  return `<span class="badge ${escapeHtml(value)}">${escapeHtml(value)}</span>`;
}

function setResultHeading(title, subtitle) {
  resultTitle.textContent = title || "Output";
  resultSubtitle.textContent = subtitle || "";
}

function showNotice(message, mode = "") {
  output.innerHTML = `<div class="notice ${escapeHtml(mode)}">${escapeHtml(message)}</div>`;
}

function showRaw(data, title = "Output") {
  setResultHeading(title, "Raw response");
  output.innerHTML = `<pre>${escapeHtml(typeof data === "string" ? data : JSON.stringify(data, null, 2))}</pre>`;
}

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function copyText(value) {
  if (!value) return;
  navigator.clipboard?.writeText(String(value)).then(() => {
    setMetric(metricType.textContent, Number(metricRows.textContent || 0), "Copied");
  }).catch(() => {});
}

function table(headers, rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>
  `;
}

function renderLicenses(rows) {
  setResultHeading("Licenses", `${rows.length} matching license${rows.length === 1 ? "" : "s"}`);
  setMetric("Licenses", rows.length, "Loaded");
  if (!rows.length) return showNotice("No licenses found for this search.");

  output.innerHTML = table(
    ["ID", "Customer", "Hint", "Status", "Type", "Devices", "Created", "Actions"],
    rows.map((row) => `
      <tr>
        <td><code>${escapeHtml(row.id)}</code></td>
        <td>
          <strong>${escapeHtml(row.name || "-")}</strong><br>
          <small>${escapeHtml(row.email || "-")}</small>
        </td>
        <td><code>${escapeHtml(row.license_hint || row.licenseHint || "----")}</code></td>
        <td>${statusBadge(row.status)}</td>
        <td>${escapeHtml(row.license_type || row.licenseType || "-")}</td>
        <td>${escapeHtml(valueOrDash(row.device_count ?? row.allowed_device_count ?? row.device_id))}</td>
        <td>${escapeHtml(formatDate(row.created_at || row.createdAt))}</td>
        <td>
          <div class="inline-actions">
            <button class="secondary" data-select-license="${escapeHtml(row.id)}">Select</button>
            <button class="secondary" data-copy="${escapeHtml(row.email || "")}">Copy Email</button>
            <button class="danger" data-delete-license="${escapeHtml(row.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `)
  );
}

function renderUsers(rows) {
  setResultHeading("Customers", `${rows.length} customer${rows.length === 1 ? "" : "s"}`);
  setMetric("Customers", rows.length, "Loaded");
  if (!rows.length) return showNotice("No customers found.");

  output.innerHTML = table(
    ["ID", "Customer", "Licenses", "Created"],
    rows.map((row) => `
      <tr>
        <td><code>${escapeHtml(row.id)}</code></td>
        <td>
          <strong>${escapeHtml(row.name || "-")}</strong><br>
          <small>${escapeHtml(row.email || "-")}</small>
        </td>
        <td>${escapeHtml(row.license_count ?? "-")}</td>
        <td>${escapeHtml(formatDate(row.created_at || row.createdAt))}</td>
      </tr>
    `)
  );
}

function renderAttempts(rows) {
  setResultHeading("Failed Attempts", `${rows.length} recent attempt${rows.length === 1 ? "" : "s"}`);
  setMetric("Attempts", rows.length, "Loaded");
  if (!rows.length) return showNotice("No failed attempts found.");

  output.innerHTML = table(
    ["When", "Email", "Hint", "Result", "Reason", "IP"],
    rows.map((row) => `
      <tr>
        <td>${escapeHtml(formatDate(row.created_at || row.createdAt))}</td>
        <td>${escapeHtml(row.email || "-")}</td>
        <td><code>${escapeHtml(row.license_hint || row.licenseHint || "----")}</code></td>
        <td>${statusBadge(row.result)}</td>
        <td>${escapeHtml(row.reason || "-")}</td>
        <td>${escapeHtml(row.ip_address || row.ipAddress || "-")}</td>
      </tr>
    `)
  );
}

function renderVersions(rows) {
  setResultHeading("Versions", `${rows.length} version${rows.length === 1 ? "" : "s"}`);
  setMetric("Versions", rows.length, "Loaded");
  if (!rows.length) return showNotice("No versions found.");

  output.innerHTML = table(
    ["Version", "Active", "Download", "Notes", "Created"],
    rows.map((row) => `
      <tr>
        <td><code>${escapeHtml(row.version)}</code></td>
        <td>${statusBadge(row.is_active || row.isActive ? "active" : "inactive")}</td>
        <td>${escapeHtml(row.download_path || row.downloadPath || "-")}</td>
        <td>${escapeHtml(row.notes || "-")}</td>
        <td>${escapeHtml(formatDate(row.created_at || row.createdAt))}</td>
      </tr>
    `)
  );
}

function show(data, type = "Output") {
  if (typeof data === "string") {
    setMetric(type, 0, data);
    return showNotice(data, data.toLowerCase().includes("error") ? "error" : "ok");
  }

  if (Array.isArray(data)) {
    if (type === "Licenses") return renderLicenses(data);
    if (type === "Customers") return renderUsers(data);
    if (type === "Failed Attempts") return renderAttempts(data);
    if (type === "Versions") return renderVersions(data);
  }

  setMetric(type, Array.isArray(data) ? data.length : 1, "Loaded");
  showRaw(data, type);
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

async function withBusy(button, action) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Working...";
  try {
    return await action();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

document.getElementById("loginBtn").addEventListener("click", async (event) => {
  await withBusy(event.currentTarget, async () => {
    try {
      const data = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("email").value,
          password: document.getElementById("password").value
        })
      });
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem("velo_admin_email", document.getElementById("email").value.trim());
      setAuthState();
      activateTool(localStorage.getItem("velo_admin_active_tool") || "license", false);
      setMetric("Session", 1, "Logged in");
      show("Logged in.", "Session");
    } catch (error) {
      show(error, "Login Error");
    }
  });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem("velo_admin_email");
  setAuthState();
  setMetric("Session", 0, "Logged out");
  show("Logged out.", "Session");
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    await withBusy(button, async () => {
      try {
        const action = button.dataset.action;
        const q = encodeURIComponent(document.getElementById("licenseSearch").value);
        const path = action === "licenses" ? `/api/admin/licenses?q=${q}` : `/api/admin/${action === "attempts" ? "activation-attempts" : action}`;
        const title = action === "licenses" ? "Licenses" : action === "users" ? "Customers" : action === "attempts" ? "Failed Attempts" : "Versions";
        show(await api(path), title);
      } catch (error) {
        show(error, "Request Error");
      }
    });
  });
});

document.querySelectorAll("[data-license-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    await withBusy(button, async () => {
      try {
        const id = licenseIdInput.value;
        if (!id) return show("Enter a license ID first.", "Action Error");
        const action = button.dataset.licenseAction;
        if (action === "delete" && !confirm(`Delete license ID ${id}? This removes the license and its device binding.`)) return;
        const path = action === "delete" ? `/api/admin/licenses/${id}` : `/api/admin/licenses/${id}/${action}`;
        show(await api(path, { method: action === "delete" ? "DELETE" : "POST" }), "License Action");
        setSelectedLicense(id);
      } catch (error) {
        show(error, "Action Error");
      }
    });
  });
});

document.getElementById("manualBtn").addEventListener("click", async (event) => {
  await withBusy(event.currentTarget, async () => {
    try {
      const data = await api("/api/admin/manual-license", {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("manualName").value,
          email: document.getElementById("manualEmail").value,
          licenseType: document.getElementById("manualType").value,
          expiryDays: Number(document.getElementById("manualDays").value || 365)
        })
      });
      show(data, "Manual License");
    } catch (error) {
      show(error, "Manual License Error");
    }
  });
});

document.getElementById("loadTutorialBtn").addEventListener("click", async (event) => {
  await withBusy(event.currentTarget, async () => {
    try {
      const data = await api("/api/admin/settings/tutorial");
      document.getElementById("tutorialUrl").value = data.youtubeUrl || "";
      show(data.youtubeUrl ? data : "No tutorial link is saved yet.", "Tutorial");
    } catch (error) {
      show(error, "Tutorial Error");
    }
  });
});

document.getElementById("saveTutorialBtn").addEventListener("click", async (event) => {
  await withBusy(event.currentTarget, async () => {
    try {
      show(await api("/api/admin/settings/tutorial", {
        method: "POST",
        body: JSON.stringify({
          youtubeUrl: document.getElementById("tutorialUrl").value.trim()
        })
      }), "Tutorial");
    } catch (error) {
      show(error, "Tutorial Error");
    }
  });
});

document.getElementById("clearTutorialBtn").addEventListener("click", () => {
  document.getElementById("tutorialUrl").value = "";
});

document.getElementById("loadMaintenanceBtn").addEventListener("click", async (event) => {
  await withBusy(event.currentTarget, async () => {
    try {
      const data = await api("/api/admin/settings/maintenance");
      document.getElementById("maintenanceActive").value = data.isActive ? "true" : "false";
      document.getElementById("maintenanceMessage").value = data.message || "";
      show(data, "Maintenance");
    } catch (error) {
      show(error, "Maintenance Error");
    }
  });
});

document.getElementById("saveMaintenanceBtn").addEventListener("click", async (event) => {
  await withBusy(event.currentTarget, async () => {
    try {
      show(await api("/api/admin/settings/maintenance", {
        method: "POST",
        body: JSON.stringify({
          isActive: document.getElementById("maintenanceActive").value === "true",
          message: document.getElementById("maintenanceMessage").value.trim()
        })
      }), "Maintenance");
    } catch (error) {
      show(error, "Maintenance Error");
    }
  });
});

document.getElementById("versionBtn").addEventListener("click", async (event) => {
  await withBusy(event.currentTarget, async () => {
    try {
      show(await api("/api/admin/versions", {
        method: "POST",
        body: JSON.stringify({
          version: document.getElementById("version").value,
          downloadPath: document.getElementById("downloadPath").value,
          notes: document.getElementById("notes").value,
          isActive: document.getElementById("isActive").value === "true"
        })
      }), "Version");
    } catch (error) {
      show(error, "Version Error");
    }
  });
});

document.getElementById("uploadZipBtn").addEventListener("click", async (event) => {
  await withBusy(event.currentTarget, async () => {
    try {
      const file = document.getElementById("uploadZip").files[0];
      const version = document.getElementById("uploadVersion").value.trim();
      const notes = document.getElementById("uploadNotes").value.trim();
      const isActive = document.getElementById("uploadIsActive").value === "true";
      if (!version) return show("Enter a version before uploading.", "Upload Error");
      if (!file) return show("Choose a ZIP file first.", "Upload Error");
      if (!/\.zip$/i.test(file.name)) return show("Choose a .zip file.", "Upload Error");

      const params = new URLSearchParams({ version, notes, isActive: String(isActive) });
      const res = await fetch(`/api/admin/versions/upload?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/zip",
          ...(token() ? { Authorization: `Bearer ${token()}` } : {})
        },
        body: await file.arrayBuffer()
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw data;
      show(data, "ZIP Upload");
    } catch (error) {
      show(error, "Upload Error");
    }
  });
});

document.getElementById("clearOutputBtn").addEventListener("click", () => {
  setResultHeading("Output", "Cleared");
  setMetric("Idle", 0, "Ready");
  showNotice("Output cleared.");
});

document.querySelectorAll("[data-tool-target]").forEach((button) => {
  button.addEventListener("click", () => {
    activateTool(button.dataset.toolTarget);
  });
});

output.addEventListener("click", (event) => {
  const selectButton = event.target.closest("[data-select-license]");
  if (selectButton) {
    setSelectedLicense(selectButton.dataset.selectLicense);
    return;
  }
  const copyButton = event.target.closest("[data-copy]");
  if (copyButton) copyText(copyButton.dataset.copy);
  const deleteButton = event.target.closest("[data-delete-license]");
  if (deleteButton) {
    const id = deleteButton.dataset.deleteLicense;
    if (!confirm(`Delete license ID ${id}? This removes the license and its device binding.`)) return;
    api(`/api/admin/licenses/${id}`, { method: "DELETE" })
      .then((data) => {
        show(data, "License Action");
        setSelectedLicense(id);
      })
      .catch((error) => show(error, "Action Error"));
  }
});

setAuthState();
activateTool(localStorage.getItem("velo_admin_active_tool") || "license", false);
setMetric("Idle", 0, "Ready");
