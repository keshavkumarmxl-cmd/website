(function (global) {
    "use strict";

    var crypto = null;
    var childProcess = null;
    var os = null;

    try {
        if (typeof require === "function") {
            crypto = require("crypto");
            childProcess = require("child_process");
            os = require("os");
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

    function fallbackSignals() {
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
            try {
                parts.push(JSON.stringify(os.networkInterfaces()));
            } catch (err) {}
        }
        return parts;
    }

    function collectSignals() {
        var platform = os ? os.platform() : String((global.navigator && global.navigator.platform) || "").toLowerCase();
        var signals = [];
        if (/^win/.test(platform)) signals = windowsSignals();
        else if (/darwin|mac/.test(platform)) signals = macSignals();
        else signals = linuxSignals();

        signals = signals.concat(fallbackSignals()).map(compact).filter(Boolean);
        return signals.length ? signals : fallbackSignals().map(compact).filter(Boolean);
    }

    function getDeviceFingerprint() {
        var signals = collectSignals();
        var stableMaterial = signals.join("::kwv::");
        return {
            deviceId: sha256("keshavwithvelo:device:v1:" + stableMaterial),
            fingerprintVersion: "kwv-device-v1",
            signalsHash: sha256(stableMaterial),
            platform: os ? os.platform() : "cep",
            host: "after-effects"
        };
    }

    global.KWVDeviceFingerprint = {
        getDeviceFingerprint: getDeviceFingerprint,
        sha256: sha256
    };
})(window);
