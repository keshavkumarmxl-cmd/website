(function (global) {
    "use strict";

    global.KWV_LICENSE_CONFIG = {
        enabled: !global.__KWV_WEBSITE_PREVIEW__,
        extensionVersion: "1.0.0",
        verificationIntervalMs: 6 * 60 * 60 * 1000,
        offlineGraceMs: 72 * 60 * 60 * 1000,
        api: {
            baseUrl: "https://keshavwithvelo-license-api.onrender.com/api",
            appId: "com.apple.liquidglass.panel",
            apiVersion: "2026-07-licensing",
            publicKeyPem: ""
        }
    };
})(window);
