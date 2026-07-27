(function (global) {
    "use strict";

    var DEFAULTS = {
        enabled: true,
        extensionVersion: "1.0.0",
        verificationIntervalMs: 6 * 60 * 60 * 1000,
        offlineGraceMs: 72 * 60 * 60 * 1000,
        api: {}
    };

    function nowIso() {
        return new Date().toISOString();
    }

    function hashLicenseKey(licenseKey) {
        return global.KWVDeviceFingerprint.sha256("kwv-license-key:" + String(licenseKey || "").trim());
    }

    function publicState(state) {
        return {
            active: !!(state && state.active),
            email: state && state.email,
            deviceId: state && state.deviceId,
            licenseStatus: state && state.licenseStatus,
            subscriptionStatus: state && state.subscriptionStatus,
            expiresAt: state && state.expiresAt,
            lastVerificationAt: state && state.lastVerificationAt,
            offlineUntil: state && state.offlineUntil,
            message: state && state.message
        };
    }

    function LicenseManager(options) {
        this.options = Object.assign({}, DEFAULTS, options || {});
        this.api = new global.KWVLicenseAPIClient(this.options.api || {});
        this.storage = global.KWVLocalSecureStorage;
        this.state = Object.assign({ active: false, message: "Activation required." }, this.storage.read() || {});
        if (this.options.enabled === false) {
            this.state = {
                active: true,
                licenseStatus: "disabled",
                subscriptionStatus: "disabled",
                message: "License check disabled."
            };
        }
        this.timer = null;
    }

    LicenseManager.prototype.emit = function () {
        var detail = publicState(this.state);
        global.dispatchEvent(new CustomEvent("kwv-license-state", { detail: detail }));
        document.body.classList.toggle("kwv-license-active", !!detail.active);
        document.body.classList.toggle("kwv-license-locked", !detail.active);
    };

    LicenseManager.prototype.save = function () {
        this.storage.write(this.state);
        this.emit();
    };

    LicenseManager.prototype.getDevice = function () {
        return global.KWVDeviceFingerprint.getDeviceFingerprint();
    };

    LicenseManager.prototype.init = function () {
        var self = this;
        if (this.options.enabled === false) {
            this.emit();
            return Promise.resolve(publicState(this.state));
        }
        this.emit();
        return this.verify({ silent: true }).catch(function () {
            self.emit();
        }).then(function () {
            self.startBackgroundVerification();
            return publicState(self.state);
        });
    };

    LicenseManager.prototype.activate = function (email, licenseKey) {
        var self = this;
        if (this.options.enabled === false) {
            this.emit();
            return Promise.resolve(publicState(this.state));
        }
        email = String(email || "").trim().toLowerCase();
        licenseKey = String(licenseKey || "").trim();
        if (!email || !licenseKey) return Promise.reject(new Error("Enter your registered email and license key."));

        var device = this.getDevice();
        var payload = {
            email: email,
            licenseKey: licenseKey,
            licenseKeyHash: hashLicenseKey(licenseKey),
            deviceId: device.deviceId,
            fingerprintVersion: device.fingerprintVersion,
            signalsHash: device.signalsHash,
            extensionVersion: this.options.extensionVersion,
            host: device.host,
            platform: device.platform
        };

        return this.api.activate(payload).then(function (response) {
            if (!response || !response.active) throw new Error("Activation failed.");
            self.state = {
                active: true,
                email: email,
                licenseKey: licenseKey,
                licenseKeyHash: payload.licenseKeyHash,
                deviceId: device.deviceId,
                sessionToken: response.sessionToken,
                requestSigningSecret: response.requestSigningSecret,
                offlineToken: response.offlineToken,
                activationDate: response.activationDate || nowIso(),
                lastVerificationAt: response.lastVerificationAt || nowIso(),
                offlineUntil: response.offlineUntil,
                licenseStatus: response.licenseStatus || "active",
                subscriptionStatus: response.subscriptionStatus || "active",
                expiresAt: response.expiresAt || null,
                extensionVersion: self.options.extensionVersion,
                message: "License activated."
            };
            self.save();
            return publicState(self.state);
        }).catch(function (err) {
            if (err && err.code === "DEVICE_ALREADY_BOUND") {
                err.message = "This license is already activated on another device.";
            }
            throw err;
        });
    };

    LicenseManager.prototype.verify = function (options) {
        var self = this;
        if (this.options.enabled === false) {
            this.emit();
            return Promise.resolve(publicState(this.state));
        }
        options = options || {};
        var current = this.storage.read();
        if (current) this.state = Object.assign(this.state, current);

        if (!this.state.licenseKey || !this.state.deviceId) {
            this.state.active = false;
            this.state.message = "Activation required.";
            if (!options.silent) this.save(); else this.emit();
            return Promise.reject(new Error(this.state.message));
        }

        var device = this.getDevice();
        if (device.deviceId !== this.state.deviceId) {
            this.storage.clear();
            this.state = { active: false, message: "This license is already activated on another device." };
            this.emit();
            return Promise.reject(new Error(this.state.message));
        }

        var payload = {
            email: this.state.email,
            licenseKey: this.state.licenseKey,
            licenseKeyHash: this.state.licenseKeyHash,
            deviceId: device.deviceId,
            fingerprintVersion: device.fingerprintVersion,
            extensionVersion: this.options.extensionVersion,
            lastVerificationAt: this.state.lastVerificationAt
        };

        return this.api.verify(payload, this.state).then(function (response) {
            if (!response || !response.active) throw new Error(response && response.message || "License verification failed.");
            self.state.active = true;
            self.state.sessionToken = response.sessionToken || self.state.sessionToken;
            self.state.requestSigningSecret = response.requestSigningSecret || self.state.requestSigningSecret;
            self.state.offlineToken = response.offlineToken || self.state.offlineToken;
            self.state.lastVerificationAt = response.lastVerificationAt || nowIso();
            self.state.offlineUntil = response.offlineUntil || self.state.offlineUntil;
            self.state.licenseStatus = response.licenseStatus || "active";
            self.state.subscriptionStatus = response.subscriptionStatus || "active";
            self.state.expiresAt = response.expiresAt || null;
            self.state.message = "License verified.";
            self.save();
            return publicState(self.state);
        }).catch(function (err) {
            if (self.canUseOfflineGrace()) {
                self.state.active = true;
                self.state.message = "Offline grace mode active.";
                self.emit();
                return publicState(self.state);
            }
            self.state.active = false;
            self.state.message = err && err.message ? err.message : "License verification failed.";
            self.save();
            throw err;
        });
    };

    LicenseManager.prototype.canUseOfflineGrace = function () {
        var offlineUntil = this.state.offlineUntil ? Date.parse(this.state.offlineUntil) : 0;
        var lastVerification = this.state.lastVerificationAt ? Date.parse(this.state.lastVerificationAt) : 0;
        var graceUntil = lastVerification ? lastVerification + this.options.offlineGraceMs : 0;
        var tokenResult = this.api.verifyOfflineToken(this.state.offlineToken);
        var tokenAllows = tokenResult.valid && tokenResult.payload && tokenResult.payload.deviceId === this.state.deviceId;
        return Date.now() < Math.max(offlineUntil || 0, graceUntil || 0) && (tokenAllows || !this.state.offlineToken);
    };

    LicenseManager.prototype.startBackgroundVerification = function () {
        var self = this;
        if (this.options.enabled === false) return;
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(function () {
            self.verify({ silent: true }).catch(function () {});
        }, this.options.verificationIntervalMs);
    };

    LicenseManager.prototype.clearActivation = function () {
        if (this.options.enabled === false) {
            this.emit();
            return;
        }
        this.storage.clear();
        this.state = { active: false, message: "Activation required." };
        this.emit();
    };

    LicenseManager.prototype.requireActive = function () {
        if (this.state && this.state.active) return true;
        this.emit();
        return false;
    };

    global.KWVLicenseManager = new LicenseManager(global.KWV_LICENSE_CONFIG || {});
})(window);
