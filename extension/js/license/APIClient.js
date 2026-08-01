(function (global) {
    "use strict";

    var crypto = null;
    var nodeUrl = null;
    var nodeHttp = null;
    var nodeHttps = null;
    var NodeBuffer = null;
    try {
        if (typeof require === "function") {
            crypto = require("crypto");
            nodeUrl = require("url");
            nodeHttp = require("http");
            nodeHttps = require("https");
            NodeBuffer = require("buffer").Buffer;
        }
    } catch (err) {}

    var DEFAULT_CONFIG = {
        baseUrl: "https://api.your-domain.com/v1",
        appId: "com.apple.liquidglass.panel",
        apiVersion: "2026-07-licensing",
        publicKeyPem: ""
    };
    var FALLBACK_BASE_URL = "https://api.keshavwithvelo.in/api";

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

    function isNetworkFetchError(error) {
        var message = String((error && error.message) || error || "").toLowerCase();
        return (
            !error ||
            error.name === "TypeError" ||
            message.indexOf("failed to fetch") >= 0 ||
            message.indexOf("network") >= 0 ||
            message.indexOf("load failed") >= 0 ||
            message.indexOf("eacces") >= 0 ||
            message.indexOf("econn") >= 0 ||
            message.indexOf("access") >= 0 ||
            message.indexOf("cors") >= 0
        );
    }

    function parsePayloadFromText(status, contentType, text) {
        if (!status) {
            var network = new Error("License API network request returned HTTP 0.");
            network.status = 0;
            network.code = "NETWORK_ERROR";
            throw network;
        }

        var payload = {};
        try {
            payload = text ? JSON.parse(text) : {};
        } catch (parseErr) {
            var invalid = new Error(
                contentType && contentType.indexOf("text/html") >= 0
                    ? "License API returned an HTML page. Check the API URL in js/license/license-config.js."
                    : "License API returned invalid JSON."
            );
            invalid.status = status;
            invalid.code = "INVALID_API_RESPONSE";
            invalid.responsePreview = String(text || "").slice(0, 160);
            throw invalid;
        }
        if (status < 200 || status >= 300) {
            var err = new Error(payload.message || payload.reason || ("HTTP " + status));
            err.status = status;
            err.code = payload.code || (status === 409 ? "DEVICE_ALREADY_BOUND" : "HTTP_ERROR");
            err.payload = payload;
            throw err;
        }
        return payload;
    }

    function parseJsonResponse(response) {
        return response.text().then(function (text) {
            var contentType = response.headers && response.headers.get ? response.headers.get("content-type") : "";
            return parsePayloadFromText(response.status, contentType, text);
        });
    }

    function nodeRequest(url, method, headers, json) {
        return new Promise(function (resolve, reject) {
            if (!nodeUrl || !nodeHttps || !NodeBuffer) return reject(new Error("Node HTTPS fallback is unavailable."));
            var parsed = nodeUrl.parse(url);
            var transport = parsed.protocol === "http:" ? nodeHttp : nodeHttps;
            var options = {
                protocol: parsed.protocol,
                hostname: parsed.hostname,
                port: parsed.port,
                path: parsed.path,
                method: method,
                headers: Object.assign({}, headers, {
                    "Content-Length": NodeBuffer.byteLength(json || "", "utf8"),
                    "User-Agent": "KeshavWithVelo-CEP-License/1.0"
                }),
                timeout: 20000
            };
            var req = transport.request(options, function (res) {
                var chunks = [];
                res.on("data", function (chunk) { chunks.push(chunk); });
                res.on("end", function () {
                    var text = NodeBuffer.concat(chunks).toString("utf8");
                    try {
                        resolve(parsePayloadFromText(res.statusCode || 0, String(res.headers["content-type"] || ""), text));
                    } catch (err) {
                        reject(err);
                    }
                });
            });
            req.on("timeout", function () {
                req.destroy(new Error("License API request timed out."));
            });
            req.on("error", reject);
            if (json) req.write(json);
            req.end();
        });
    }

    function xhrRequest(url, method, headers, json) {
        return new Promise(function (resolve, reject) {
            if (typeof XMLHttpRequest !== "function") {
                return reject(new Error("XMLHttpRequest fallback is unavailable."));
            }

            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.timeout = 20000;
            Object.keys(headers || {}).forEach(function (key) {
                try {
                    xhr.setRequestHeader(key, headers[key]);
                } catch (err) {}
            });
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) return;
                try {
                    resolve(parsePayloadFromText(xhr.status || 0, xhr.getResponseHeader("content-type") || "", xhr.responseText || ""));
                } catch (err) {
                    reject(err);
                }
            };
            xhr.onerror = function () {
                reject(new Error("License API network request failed."));
            };
            xhr.ontimeout = function () {
                reject(new Error("License API request timed out."));
            };
            try {
                xhr.send(json || null);
            } catch (err) {
                reject(err);
            }
        });
    }

    function requestWithFallbacks(url, method, headers, json) {
        function tryXhrThenNode(error) {
            if (!isNetworkFetchError(error)) throw error;
            return xhrRequest(url, method, headers, json).catch(function (xhrError) {
                if (!isNetworkFetchError(xhrError)) throw xhrError;
                return nodeRequest(url, method, headers, json);
            });
        }

        if (typeof fetch !== "function") {
            return xhrRequest(url, method, headers, json).catch(function (xhrError) {
                if (!isNetworkFetchError(xhrError)) throw xhrError;
                return nodeRequest(url, method, headers, json);
            });
        }

        try {
            return fetch(url, {
                method: method,
                headers: headers,
                body: json || undefined,
                cache: "no-store"
            }).then(parseJsonResponse).catch(tryXhrThenNode);
        } catch (syncFetchError) {
            return tryXhrThenNode(syncFetchError);
        }
    }

    function APIClient(config) {
        this.config = Object.assign({}, DEFAULT_CONFIG, config || {});
        this.config.baseUrl = normalizeBaseUrl(this.config.baseUrl);
    }

    APIClient.prototype.requestOnce = function (baseUrl, method, path, body, auth) {
        var url = normalizeBaseUrl(baseUrl) + path;
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

        return requestWithFallbacks(url, method, headers, json);
    };

    APIClient.prototype.request = function (method, path, body, auth) {
        var self = this;
        return this.requestOnce(this.config.baseUrl, method, path, body, auth).catch(function (error) {
            var configured = normalizeBaseUrl(self.config.baseUrl);
            if (configured === FALLBACK_BASE_URL) throw error;
            if (error && (error.code === "INVALID_API_RESPONSE" || error.status === 404 || error.status === 502 || error.status === 503)) {
                return self.requestOnce(FALLBACK_BASE_URL, method, path, body, auth);
            }
            throw error;
        });
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
