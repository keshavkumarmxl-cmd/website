(function (global) {
    "use strict";

    global.KWV_LICENSE_CONFIG = {
        extensionVersion: "1.0.0",
        verificationIntervalMs: 6 * 60 * 60 * 1000,
        offlineGraceMs: 72 * 60 * 60 * 1000,
        api: {
            baseUrl: "https://api.your-domain.com/v1",
            appId: "com.apple.liquidglass.panel",
            apiVersion: "2026-07-licensing",
            publicKeyPem: [
                "-----BEGIN PUBLIC KEY-----",
                "REPLACE_WITH_SERVER_OFFLINE_TOKEN_PUBLIC_KEY",
                "-----END PUBLIC KEY-----"
            ].join("\n")
        }
    };
})(window);
