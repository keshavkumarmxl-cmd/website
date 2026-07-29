(function (global) {
    "use strict";

    var crypto = null;
    var childProcess = null;
    var os = null;
    var fs = null;
    var path = null;
    var FINGERPRINT_MODE_KEY = "keshavwithvelo.device.fingerprint.v2";
    var DEVICE_ID_KEY = "keshavwithvelo.device.id.v2";
    var modeFilePath = "";
    var deviceIdFilePath = "";

    try {
        if (typeof require === "function") {
            crypto = require("crypto");
            childProcess = require("child_process");
            os = require("os");
            fs = require("fs");
            path = require("path");
        }
    } catch (err) {}

    function sha256(value) {
        value = String(value || "");
        if (crypto) return crypto.createHash("sha256").update(value, "utf8").digest("hex");
        return String(Math.abs(value.split("").reduce(function (hash, ch) {
            return ((hash << 5) - hash) + ch.charCodeAt(0) | 0;
        }, 0)));
    }

    function run(command) {
        if (!childProcess) return "";
        try {
            return String(childProcess.execSync(command, {
                encoding: "utf8",
                timeout: 2500,
                windowsHide: true
            }) || "").trim();
        } catch (err) {
            return "";
        }
    }

    function compact(value) {
        return String(value || "")
            .replace(/\r/g, "\n")
            .split("\n")
            .map(function (line) { return line.trim(); })
            .filter(Boolean)
            .join("|")
            .toLowerCase();
    }

    function windowsSignals() {
        return [
            run("wmic csproduct get uuid"),
            run("wmic bios get serialnumber"),
            run("wmic baseboard get serialnumber"),
            run("wmic diskdrive get serialnumber"),
            run("reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid")
        ];
    }

    function macSignals() {
        return [
            run("ioreg -rd1 -c IOPlatformExpertDevice | awk '/IOPlatformUUID/ { print $3; }'"),
            run("system_profiler SPHardwareDataType | awk -F': ' '/Serial Number/ { print $2; }'"),
            run("ioreg -rd1 -c IOPlatformExpertDevice | awk '/IOPlatformSerialNumber/ { print $3; }'")
        ];
    }

    function linuxSignals() {
        return [
            run("cat /etc/machine-id"),
            run("cat /sys/class/dmi/id/product_uuid"),
            run("cat /sys/class/dmi/id/board_serial")
        ];
    }

    function fallbackSignals(includeVolatileSignals) {
        var nav = global.navigator || {};
        var screenObj = global.screen || {};
        var parts = [
            nav.userAgent,
            nav.platform,
            nav.hardwareConcurrency,
            nav.deviceMemory,
            screenObj.width + "x" + screenObj.height
        ];
        if (os) {
            parts.push(os.hostname(), os.platform(), os.arch(), os.release());
            if (includeVolatileSignals) try {
                parts.push(JSON.stringify(os.networkInterfaces()));
            } catch (err) {}
        }
        return parts;
    }

    function collectSignals(includeVolatileSignals) {
        var platform = os ? os.platform() : String((global.navigator && global.navigator.platform) || "").toLowerCase();
        var signals = [];
        if (/^win/.test(platform)) signals = windowsSignals();
        else if (/darwin|mac/.test(platform)) signals = macSignals();
        else signals = linuxSignals();

        signals = signals.concat(fallbackSignals(includeVolatileSignals)).map(compact).filter(Boolean);
        // A device must not change simply because OS/network enumeration order does.
        return signals.length ? signals.sort() : fallbackSignals(includeVolatileSignals).map(compact).filter(Boolean).sort();
    }

    function getModeFilePath() {
        if (modeFilePath || !fs || !path || !os) return modeFilePath;
        try {
            var base = process.platform === "win32"
                ? (process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"))
                : path.join(os.homedir(), ".config");
            modeFilePath = path.join(base, "KESHAVWITHVELO", "fingerprint-mode-v2");
        } catch (err) {}
        return modeFilePath;
    }

    function getDeviceIdFilePath() {
        if (deviceIdFilePath || !fs || !path || !os) return deviceIdFilePath;
        try {
            var base = process.platform === "win32"
                ? (process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"))
                : path.join(os.homedir(), ".config");
            deviceIdFilePath = path.join(base, "KESHAVWITHVELO", "device-id-v2");
        } catch (err) {}
        return deviceIdFilePath;
    }

    function readPersistedDeviceId() {
        try {
            var localValue = localStorage.getItem(DEVICE_ID_KEY);
            if (localValue) return localValue;
        } catch (err) {}
        try {
            var filePath = getDeviceIdFilePath();
            if (filePath && fs && fs.existsSync(filePath)) return String(fs.readFileSync(filePath, "utf8") || "").trim();
        } catch (fileErr) {}
        return "";
    }

    function writePersistedDeviceId(deviceId) {
        if (!deviceId) return;
        try { localStorage.setItem(DEVICE_ID_KEY, deviceId); } catch (err) {}
        try {
            var filePath = getDeviceIdFilePath();
            if (filePath && fs && path) {
                var dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(filePath, deviceId, "utf8");
            }
        } catch (fileErr) {}
    }

    function useStableFingerprint() {
        try {
            if (localStorage.getItem(FINGERPRINT_MODE_KEY) === "stable") return true;
        } catch (err) {}
        try {
            var filePath = getModeFilePath();
            return !!(filePath && fs && fs.existsSync(filePath));
        } catch (fileErr) { return false; }
    }

    function enableStableFingerprint() {
        try { localStorage.setItem(FINGERPRINT_MODE_KEY, "stable"); } catch (err) {}
        try {
            var filePath = getModeFilePath();
            if (filePath && fs && path) {
                var dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(filePath, "stable", "utf8");
            }
        } catch (fileErr) {}
    }

    function getDeviceFingerprint() {
        // Always use the stable v2 device id. Older v1 fingerprints used
        // volatile machine/network signals and could change after AE restart,
        // which caused "already activated on another device" for the same user.
        enableStableFingerprint();
        var stable = true;
        var signals = collectSignals(!stable);
        var stableMaterial = signals.join("::kwv::");
        var deviceId = stable ? readPersistedDeviceId() : "";
        if (!deviceId) {
            deviceId = sha256("keshavwithvelo:device:" + (stable ? "v2" : "v1") + ":" + stableMaterial);
            if (stable) writePersistedDeviceId(deviceId);
        }
        return {
            deviceId: deviceId,
            fingerprintVersion: stable ? "kwv-device-v2" : "kwv-device-v1",
            signalsHash: sha256(stableMaterial),
            platform: os ? os.platform() : "cep",
            host: "after-effects"
        };
    }

    global.KWVDeviceFingerprint = {
        getDeviceFingerprint: getDeviceFingerprint,
        enableStableFingerprint: enableStableFingerprint,
        sha256: sha256
    };
})(window);
