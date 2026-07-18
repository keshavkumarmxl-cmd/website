(function (global) {
    "use strict";

    function injectStyles() {
        if (document.getElementById("kwvLicenseStyles")) return;
        var style = document.createElement("style");
        style.id = "kwvLicenseStyles";
        style.textContent = [
            "body.kwv-license-locked .main-wrapper{filter:blur(1.5px) brightness(.48);pointer-events:none;user-select:none;}",
            ".kwv-license-overlay{position:fixed;inset:0;z-index:999999;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 14%,rgba(var(--kwv-accent-rgb,255,0,0),.12),transparent 34%),rgba(0,0,0,.86);padding:20px;box-sizing:border-box;color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;}",
            "body.kwv-license-locked .kwv-license-overlay{display:flex;}",
            ".kwv-license-card{width:min(358px,100%);position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.11);border-radius:8px;background:linear-gradient(180deg,#141414 0%,#090909 100%);padding:0;box-shadow:0 22px 60px rgba(0,0,0,.58),0 0 0 1px rgba(0,0,0,.65);}",
            ".kwv-license-card:before{content:'';position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,transparent,var(--kwv-accent,#ff0000),transparent);opacity:.95;}",
            ".kwv-license-head{padding:20px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);background:radial-gradient(circle at 12% 0,rgba(var(--kwv-accent-rgb,255,0,0),.18),transparent 38%);}",
            ".kwv-license-brand{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}",
            ".kwv-license-mark{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--kwv-accent,#ff0000),#7b0000);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:13px;box-shadow:0 0 18px rgba(var(--kwv-accent-rgb,255,0,0),.22);}",
            ".kwv-license-badge{height:22px;display:inline-flex;align-items:center;border:1px solid rgba(var(--kwv-accent-rgb,255,0,0),.34);border-radius:999px;background:rgba(var(--kwv-accent-rgb,255,0,0),.09);color:#ffb3b3;padding:0 9px;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.6px;}",
            ".kwv-license-title{margin:0 0 6px;font-size:19px;font-weight:900;letter-spacing:0;text-transform:uppercase;line-height:1;}",
            ".kwv-license-title span{color:var(--kwv-accent,#ff0000);}",
            ".kwv-license-subtitle{margin:0;color:#9b9b9b;font-size:10.5px;line-height:1.5;}",
            ".kwv-license-body{padding:16px 18px 18px;}",
            ".kwv-license-field{display:flex;flex-direction:column;gap:7px;margin-bottom:13px;}",
            ".kwv-license-field label{display:flex;justify-content:space-between;gap:8px;font-size:8.5px;font-weight:900;text-transform:uppercase;color:#bcbcbc;letter-spacing:.65px;}",
            ".kwv-license-field label span{color:#666;font-size:8px;letter-spacing:.35px;text-transform:none;}",
            ".kwv-license-field input{height:36px;border:1px solid #303030;border-radius:7px;background:#050505;color:#fff;padding:0 11px;outline:none;font-size:12px;font-weight:800;box-shadow:inset 0 1px 0 rgba(255,255,255,.035);}",
            ".kwv-license-field input:focus{border-color:rgba(var(--kwv-accent-rgb,255,0,0),.75);box-shadow:0 0 0 1px rgba(var(--kwv-accent-rgb,255,0,0),.18),0 0 18px rgba(var(--kwv-accent-rgb,255,0,0),.09);}",
            ".kwv-license-actions{display:grid;grid-template-columns:1fr 92px;gap:9px;align-items:center;margin-top:5px;}",
            ".kwv-license-button{height:36px;border:0;border-radius:7px;background:linear-gradient(180deg,#ff1717 0%,#e00000 100%);color:#fff;font-weight:900;text-transform:uppercase;font-size:10px;padding:0 13px;cursor:pointer;box-shadow:0 9px 20px rgba(var(--kwv-accent-rgb,255,0,0),.22);}",
            ".kwv-license-button:hover{filter:brightness(1.08);}",
            ".kwv-license-button:active{transform:translateY(1px);}",
            ".kwv-license-button:disabled{opacity:.62;cursor:default;filter:none;}",
            ".kwv-license-button.secondary{background:#181818;border:1px solid #303030;color:#e4e4e4;box-shadow:none;}",
            ".kwv-license-status{min-height:0;margin-top:14px;border:1px solid #2a2a2a;border-radius:7px;background:#0a0a0a;color:#9a9a9a;font-size:9.5px;font-weight:800;line-height:1.45;padding:9px 10px;}",
            ".kwv-license-status.error{border-color:rgba(255,79,79,.32);background:rgba(255,0,0,.055);color:#ff9a9a;}",
            ".kwv-license-status.ok{border-color:rgba(85,220,132,.32);background:rgba(44,190,103,.07);color:#8ee4aa;}",
            ".kwv-license-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;color:#626262;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.45px;}",
            ".kwv-license-dot{width:5px;height:5px;border-radius:50%;background:var(--kwv-accent,#ff0000);box-shadow:0 0 8px rgba(var(--kwv-accent-rgb,255,0,0),.5);}"
        ].join("");
        document.head.appendChild(style);
    }

    function createOverlay() {
        var overlay = document.getElementById("kwvLicenseOverlay");
        if (overlay) return overlay;
        overlay = document.createElement("div");
        overlay.id = "kwvLicenseOverlay";
        overlay.className = "kwv-license-overlay";
        overlay.innerHTML = [
            '<form class="kwv-license-card" id="kwvLicenseForm">',
            '<div class="kwv-license-head">',
            '<div class="kwv-license-brand"><div class="kwv-license-mark">KV</div><div class="kwv-license-badge">Device Locked</div></div>',
            '<h1 class="kwv-license-title">Activate <span>Keshav Velo</span></h1>',
            '<p class="kwv-license-subtitle">Sign in with your registered email and activation key to unlock this workstation.</p>',
            '</div>',
            '<div class="kwv-license-body">',
            '<div class="kwv-license-field"><label for="kwvLicenseEmail">Registered email <span>Purchase ID</span></label><input id="kwvLicenseEmail" type="email" autocomplete="email" required></div>',
            '<div class="kwv-license-field"><label for="kwvLicenseKey">License key <span>Private</span></label><input id="kwvLicenseKey" type="password" autocomplete="off" required></div>',
            '<div class="kwv-license-actions"><button class="kwv-license-button" id="kwvActivateButton" type="submit">Activate</button><button class="kwv-license-button secondary" id="kwvVerifyButton" type="button">Verify</button></div>',
            '<div class="kwv-license-status" id="kwvLicenseStatus">Waiting for activation.</div>',
            '<div class="kwv-license-foot"><span>Secure license check</span><span class="kwv-license-dot"></span></div>',
            '</div>',
            '</form>'
        ].join("");
        document.body.appendChild(overlay);
        return overlay;
    }

    function setStatus(message, mode) {
        var status = document.getElementById("kwvLicenseStatus");
        if (!status) return;
        status.className = "kwv-license-status" + (mode ? " " + mode : "");
        status.textContent = message || "";
    }

    function setBusy(isBusy) {
        var button = document.getElementById("kwvActivateButton");
        var verify = document.getElementById("kwvVerifyButton");
        if (button) {
            button.disabled = !!isBusy;
            button.textContent = isBusy ? "Checking..." : "Activate";
        }
        if (verify) verify.disabled = !!isBusy;
    }

    function bindEvents(manager) {
        var form = document.getElementById("kwvLicenseForm");
        var verify = document.getElementById("kwvVerifyButton");
        if (form) {
            form.addEventListener("submit", function (evt) {
                evt.preventDefault();
                setBusy(true);
                setStatus("Contacting license server...", "");
                manager.activate(
                    document.getElementById("kwvLicenseEmail").value,
                    document.getElementById("kwvLicenseKey").value
                ).then(function () {
                    document.getElementById("kwvLicenseKey").value = "";
                    setStatus("Activated. Loading tools...", "ok");
                }).catch(function (err) {
                    setStatus(err && err.message ? err.message : "Activation failed.", "error");
                }).then(function () {
                    setBusy(false);
                });
            });
        }
        if (verify) {
            verify.addEventListener("click", function () {
                setBusy(true);
                setStatus("Verifying current activation...", "");
                manager.verify().then(function () {
                    setStatus("License verified.", "ok");
                }).catch(function (err) {
                    setStatus(err && err.message ? err.message : "Verification failed.", "error");
                }).then(function () {
                    setBusy(false);
                });
            });
        }
    }

    function init() {
        var manager = global.KWVLicenseManager;
        if (!manager) return;
        if (global.__KWV_WEBSITE_PREVIEW__ || /^https?:/i.test(global.location.protocol)) {
            manager.options.enabled = false;
            manager.init();
            return;
        }
        if (manager.options && manager.options.enabled === false) {
            manager.init();
            return;
        }
        injectStyles();
        createOverlay();
        bindEvents(manager);
        global.addEventListener("kwv-license-state", function (evt) {
            var state = evt.detail || {};
            if (state.active) setStatus(state.message || "License active.", "ok");
            else setStatus(state.message || "Activation required.", state.message ? "error" : "");
        });
        manager.init();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})(window);
