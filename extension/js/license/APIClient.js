(function (global) {
    "use strict";

    var crypto = null;
    try {
        if (typeof require === "function") crypto = require("crypto");
    } catch (err) {}

    var DEFAULT_CONFIG = {
        baseUrl: "https://api.your-domain.com/v1",
        appId: "com.apple.liquidglass.panel",
        apiVersion: "2026-07-licensing",
        publicKeyPem: ""
    };

    function randomHex(bytes) {
        if (crypto) return crypto.randomBytes(bytes).toString("hex");
        var out = "";
        var chars = "abcdef0123456789";
        for (var i = 0; i < bytes * 2; i++) out += chars[Math.floor(Math.random() * chars.length)];
        return out;
    }

    function hmac(secret, value) {
        if (!crypto || !secret) return "";
        return crypto.createHmac("sha256", String(secret)).update(String(value), "utf8").digest("hex");
    }

    function sha256(value) {
        if (global.KWVDeviceFingerprint && global.KWVDeviceFingerprint.sha256) {
            return global.KWVDeviceFingerprint.sha256(value);
        }
        return crypto ? crypto.createHash("sha256").update(String(value), "utf8").digest("hex") : String(value || "");
    }

    function normalizeBaseUrl(url) {
        return String(url || DEFAULT_CONFIG.baseUrl).replace(/\/+$/, "");
    }

    function parseJsonResponse(response) {
        return response.text().then(function (text) {
            var payload = {};
            try {
                payload = text ? JSON.parse(text) : {};
            } catch (parseErr) {
                var contentType = response.headers && response.headers.get ? response.headers.get("content-type") : "";
                var err = new Error(
                    contentType && contentType.indexOf("text/html") >= 0
                        ? "License API returned an HTML page. Check the API URL in js/license/license-config.js."
                        : "License API returned invalid JSON."
                );
                err.status = response.status;
                err.code = "INVALID_API_RESPONSE";
                err.responsePreview = String(text || "").slice(0, 160);
                throw err;
            }
            if (!response.ok) {
                var err = new Error(payload.message || payload.reason || ("HTTP " + response.status));
                err.status = response.status;
                err.code = payload.code || (response.status === 409 ? "DEVICE_ALREADY_BOUND" : "HTTP_ERROR");
                err.payload = payload;
                throw err;
            }
            return payload;
        });
    }

    function APIClient(config) {
        this.config = Object.assign({}, DEFAULT_CONFIG, config || {});
        this.config.baseUrl = normalizeBaseUrl(this.config.baseUrl);
    }

    APIClient.prototype.request = function (method, path, body, auth) {
        var url = this.config.baseUrl + path;
        if (/api\.your-domain\.com/i.test(url)) {
            return Promise.reject(new Error("License API is not configured. Set your real HTTPS backend URL in js/license/license-config.js."));
        }
        if (!/^https:\/\//i.test(url)) {
            return Promise.reject(new Error("License API must use HTTPS."));
        }

        var timestamp = new Date().toISOString();
        var nonce = randomHex(16);
        var json = body ? JSON.stringify(body) : "";
        var signingSecret = auth && auth.requestSigningSecret;
        var canonical = [method.toUpperCase(), path, timestamp, nonce, sha256(json)].join("\n");
        var headers = {
            "Content-Type": "application/json",
            "X-KWV-App-Id": this.config.appId,
            "X-KWV-API-Version": this.config.apiVersion,
            "X-KWV-Timestamp": timestamp,
            "X-KWV-Nonce": nonce
        };

        if (auth && auth.sessionToken) headers.Authorization = "Bearer " + auth.sessionToken;
        if (signingSecret) headers["X-KWV-Signature"] = "sha256=" + hmac(signingSecret, canonical);

        return fetch(url, {
            method: method,
            headers: headers,
            body: json || undefined,
            cache: "no-store"
        }).then(parseJsonResponse);
    };

    APIClient.prototype.activate = function (payload) {
        return this.request("POST", "/activate", {
            email: payload.email,
            licenseKey: payload.licenseKey,
            deviceFingerprint: payload.deviceId
        }, null).then(function (response) {
            return {
                active: response && response.status === "success",
                licenseStatus: "active",
                subscriptionStatus: "active",
                activationDate: new Date().toISOString(),
                lastVerificationAt: new Date().toISOString(),
                offlineUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
                message: response && response.message
            };
        });
    };

    APIClient.prototype.verify = function (payload, auth) {
        return this.request("POST", "/verify-license", {
            licenseKey: payload.licenseKey,
            deviceFingerprint: payload.deviceId
        }, auth).then(function (response) {
            return {
                active: response && response.status === "valid",
                licenseStatus: response && response.status === "valid" ? "active" : response.status,
                subscriptionStatus: "active",
                expiresAt: response && response.expiryDate,
                lastVerificationAt: new Date().toISOString(),
                offlineUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
            };
        });
    };

    APIClient.prototype.deactivateLocal = function (payload, auth) {
        return this.request("POST", "/licenses/deactivate-local", payload, auth);
    };

    APIClient.prototype.verifyOfflineToken = function (token) {
        if (!token || !crypto || !this.config.publicKeyPem) return { valid: false, reason: "missing-public-key" };
        var parts = String(token).split(".");
        if (parts.length !== 3) return { valid: false, reason: "bad-token" };
        var data = parts[0] + "." + parts[1];
        var signature = Buffer.from(parts[2].replace(/-/g, "+").replace(/_/g, "/"), "base64");
        var verifier = crypto.createVerify("RSA-SHA256");
        verifier.update(data);
        verifier.end();
        if (!verifier.verify(this.config.publicKeyPem, signature)) return { valid: false, reason: "bad-signature" };
        var payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
        if (payload.exp && Date.now() >= payload.exp * 1000) return { valid: false, reason: "expired" };
        return { valid: true, payload: payload };
    };

    global.KWVLicenseAPIClient = APIClient;
})(window);
