(function (global) {
    "use strict";

    global.KWV_LICENSE_CONFIG = {
        enabled: false,
        extensionVersion: "1.0.0",
        verificationIntervalMs: 6 * 60 * 60 * 1000,
        offlineGraceMs: 72 * 60 * 60 * 1000,
        api: {
            baseUrl: "https://keshavwithvelo-license.onrender.com/v1",
            appId: "com.apple.liquidglass.panel",
            apiVersion: "2026-07-licensing",
            publicKeyPem: ""
        }
    };
})(window);
