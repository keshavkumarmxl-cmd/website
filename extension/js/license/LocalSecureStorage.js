(function (global) {
    "use strict";

    var crypto = null;
    var fs = null;
    var path = null;
    var os = null;
    try {
        if (typeof require === "function") {
            crypto = require("crypto");
            fs = require("fs");
            path = require("path");
            os = require("os");
        }
    } catch (err) {}

    var STORAGE_KEY = "keshavwithvelo.license.secure.v1";
    var stateFilePath = "";
    var LEGACY_KEYS = [
        "keshavwithvelo.licenseKey",
        "keshavwithvelo.activationKey",
        "licenseKey",
        "activationKey"
    ];

    function bufferToBase64(buffer) {
        if (typeof Buffer !== "undefined") return Buffer.from(buffer).toString("base64");
        return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
    }

    function base64ToBuffer(value) {
        if (typeof Buffer !== "undefined") return Buffer.from(value, "base64");
        var binary = atob(value);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function getDeviceKey() {
        // Do not derive the local encryption key from the live hardware
        // fingerprint. CEP/AE can report slightly different machine signals
        // after restart, OS update, network change, or on macOS sandboxed
        // hosts. If the key changes, the saved license state becomes
        // unreadable and users are asked to activate again.
        //
        // Device binding is still enforced by the backend; this key only keeps
        // the local activation cache readable on the same installation.
        var material = "kwv-local-license-state:v2:keshav-with-velo";
        return crypto
            ? crypto.createHash("sha256").update(material, "utf8").digest()
            : material;
    }

    function getStateFilePath() {
        if (stateFilePath || !fs || !path || !os) return stateFilePath;
        try {
            var base = process.platform === "win32"
                ? (process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"))
                : path.join(os.homedir(), ".config");
            stateFilePath = path.join(base, "KESHAVWITHVELO", "license-state-v1.json");
        } catch (err) {}
        return stateFilePath;
    }

    function readRawEnvelope() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return raw;
        } catch (err) {}
        try {
            var filePath = getStateFilePath();
            if (filePath && fs && fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf8");
        } catch (fileErr) {}
        return "";
    }

    function writeRawEnvelope(raw) {
        try { localStorage.setItem(STORAGE_KEY, raw); } catch (err) {}
        try {
            var filePath = getStateFilePath();
            if (filePath && fs && path) {
                var dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(filePath, raw, "utf8");
            }
        } catch (fileErr) {}
    }

    function encryptJson(payload) {
        if (!crypto) {
            return {
                mode: "base64-fallback",
                value: bufferToBase64(unescape(encodeURIComponent(JSON.stringify(payload))))
            };
        }
        var iv = crypto.randomBytes(12);
        var cipher = crypto.createCipheriv("aes-256-gcm", getDeviceKey(), iv);
        var ciphertext = Buffer.concat([
            cipher.update(JSON.stringify(payload), "utf8"),
            cipher.final()
        ]);
        return {
            mode: "aes-256-gcm",
            iv: iv.toString("base64"),
            tag: cipher.getAuthTag().toString("base64"),
            value: ciphertext.toString("base64")
        };
    }

    function decryptJson(envelope) {
        if (!envelope) return null;
        if (envelope.mode === "base64-fallback") {
            return JSON.parse(decodeURIComponent(escape(atob(envelope.value))));
        }
        if (!crypto || envelope.mode !== "aes-256-gcm") return null;
        var decipher = crypto.createDecipheriv("aes-256-gcm", getDeviceKey(), base64ToBuffer(envelope.iv));
        decipher.setAuthTag(base64ToBuffer(envelope.tag));
        var clear = Buffer.concat([
            decipher.update(base64ToBuffer(envelope.value)),
            decipher.final()
        ]).toString("utf8");
        return JSON.parse(clear);
    }

    function removePlaintextLegacyKeys() {
        LEGACY_KEYS.forEach(function (key) {
            try { localStorage.removeItem(key); } catch (err) {}
        });
    }

    function read() {
        try {
            removePlaintextLegacyKeys();
            var raw = readRawEnvelope();
            return raw ? decryptJson(JSON.parse(raw)) : null;
        } catch (err) {
            return null;
        }
    }

    function write(payload) {
        removePlaintextLegacyKeys();
        var safePayload = Object.assign({}, payload || {});
        delete safePayload.activationKey;
        writeRawEnvelope(JSON.stringify(encryptJson(safePayload)));
    }

    function clear() {
        removePlaintextLegacyKeys();
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
        try {
            var filePath = getStateFilePath();
            if (filePath && fs && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (fileErr) {}
    }

    global.KWVLocalSecureStorage = {
        read: read,
        write: write,
        clear: clear
    };
})(window);
