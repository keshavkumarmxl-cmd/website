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
    var LEGACY_KEYS = [
        "keshavwithvelo.licenseKey",
        "keshavwithvelo.activationKey",
        "licenseKey",
        "activationKey"
    ];
    var storageFilePath = "";

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
        var fp = global.KWVDeviceFingerprint && global.KWVDeviceFingerprint.getDeviceFingerprint
            ? global.KWVDeviceFingerprint.getDeviceFingerprint()
            : { deviceId: "fallback-device" };
        var material = "kwv-local-license-key:" + fp.deviceId;
        return crypto
            ? crypto.createHash("sha256").update(material, "utf8").digest()
            : material;
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

    function getStorageFilePath() {
        if (storageFilePath) return storageFilePath;
        if (!fs || !path) return "";
        var base = "";
        try {
            if (global.CSInterface && global.SystemPath) {
                base = new global.CSInterface().getSystemPath(global.SystemPath.USER_DATA);
            }
        } catch (err) {}
        if (!base && os) {
            try {
                base = process.platform === "win32"
                    ? (process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"))
                    : path.join(os.homedir(), ".config");
            } catch (err2) {}
        }
        if (!base) return "";
        storageFilePath = path.join(base, "KESHAVWITHVELO", "license.secure.json");
        return storageFilePath;
    }

    function readFileRaw() {
        var filePath = getStorageFilePath();
        if (!filePath || !fs) return "";
        try {
            if (!fs.existsSync(filePath)) return "";
            return String(fs.readFileSync(filePath, "utf8") || "");
        } catch (err) {
            return "";
        }
    }

    function writeFileRaw(raw) {
        var filePath = getStorageFilePath();
        if (!filePath || !fs || !path) return false;
        try {
            var dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, String(raw || ""), "utf8");
            return true;
        } catch (err) {
            return false;
        }
    }

    function deleteFileRaw() {
        var filePath = getStorageFilePath();
        if (!filePath || !fs) return;
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {}
    }

    function decryptRaw(raw) {
        if (!raw) return null;
        return decryptJson(JSON.parse(raw));
    }

    function read() {
        var raw = "";
        try {
            removePlaintextLegacyKeys();
            raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var localPayload = decryptRaw(raw);
                if (localPayload) {
                    writeFileRaw(raw);
                    return localPayload;
                }
            }
        } catch (err) {
            raw = "";
        }
        try {
            raw = readFileRaw();
            if (!raw) return null;
            var filePayload = decryptRaw(raw);
            if (filePayload) {
                try { localStorage.setItem(STORAGE_KEY, raw); } catch (localErr) {}
                return filePayload;
            }
        } catch (fileErr) {
            return null;
        }
        return null;
    }

    function write(payload) {
        removePlaintextLegacyKeys();
        var safePayload = Object.assign({}, payload || {});
        delete safePayload.activationKey;
        var raw = JSON.stringify(encryptJson(safePayload));
        var saved = false;
        try {
            localStorage.setItem(STORAGE_KEY, raw);
            saved = true;
        } catch (err) {}
        saved = writeFileRaw(raw) || saved;
        if (!saved) throw new Error("Could not save license activation locally.");
    }

    function clear() {
        removePlaintextLegacyKeys();
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
        deleteFileRaw();
    }

    global.KWVLocalSecureStorage = {
        read: read,
        write: write,
        clear: clear
    };
})(window);
