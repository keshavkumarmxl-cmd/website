(function (global) {
    "use strict";

    var CONFIG = {
        endpoint: "https://api.keshavwithvelo.in/api/check-update",
        fallbackEndpoint: "https://keshavwithvelo.in/api/check-update",
        currentVersion: "1.0.0",
        autoCheckDelayMs: 8000,
        autoInstall: true
    };

    var node = getNodeModules();
    var checking = false;
    var installing = false;

    function getNodeModules() {
        try {
            if (typeof require !== "function") return null;
            return {
                fs: require("fs"),
                path: require("path"),
                os: require("os"),
                https: require("https"),
                http: require("http"),
                AdmZip: require("adm-zip")
            };
        } catch (err) {
            console.error("[KWV AutoUpdater] Node dependency missing:", err);
            return null;
        }
    }

    function getExtensionRoot() {
        if (!node) throw new Error("CEP Node.js is not available.");
        return node.path.resolve(__dirname, "..");
    }

    function assertExtensionWritable() {
        if (!node) throw new Error("CEP Node.js is not available.");
        var extensionRoot = getExtensionRoot();
        var probePath = node.path.join(extensionRoot, ".kwv-update-write-test-" + Date.now());
        try {
            node.fs.writeFileSync(probePath, "kwv", "utf8");
            node.fs.unlinkSync(probePath);
            return true;
        } catch (err) {
            try {
                if (node.fs.existsSync(probePath)) node.fs.unlinkSync(probePath);
            } catch (cleanupErr) {}
            throw new Error("Update available. Open After Effects as administrator, then click Check Update again.");
        }
    }

    function getCurrentVersion() {
        try {
            if (typeof require === "function") {
                return String(require("../package.json").version || CONFIG.currentVersion);
            }
        } catch (err) {}
        return CONFIG.currentVersion;
    }

    CONFIG.currentVersion = getCurrentVersion();

    function getLicenseState() {
        if (global.KWVLicenseManager && global.KWVLicenseManager.state) {
            return global.KWVLicenseManager.state;
        }
        if (global.KWVLocalSecureStorage && global.KWVLocalSecureStorage.read) {
            return global.KWVLocalSecureStorage.read() || {};
        }
        return {};
    }

    function getLicenseKey() {
        var state = getLicenseState();
        return String(state.licenseKey || "").trim();
    }

    function isNetworkFetchError(err) {
        var message = String((err && (err.message || err.name)) || err || "").toLowerCase();
        return message.indexOf("fetch") >= 0 ||
            message.indexOf("network") >= 0 ||
            message.indexOf("failed to fetch") >= 0 ||
            message.indexOf("load failed") >= 0 ||
            message.indexOf("could not connect") >= 0;
    }

    function parseUpdateResponse(response, text) {
        var data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch (err) {
            throw new Error("Update API returned invalid JSON.");
        }
        if (!response.ok) {
            throw new Error(data.message || data.error || "Update check failed with HTTP " + response.status + ".");
        }
        return data;
    }

    function requestUpdateInfoWithFetch(endpoint, payload) {
        return fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }).then(function (response) {
            return response.text().then(function (text) {
                return parseUpdateResponse(response, text);
            });
        });
    }

    function requestUpdateInfoWithNode(endpoint, payload) {
        if (!node || (!node.https && !node.http)) return Promise.reject(new Error("CEP Node.js network fallback is not available."));

        return new Promise(function (resolve, reject) {
            var target;
            try {
                target = new URL(endpoint);
            } catch (err) {
                reject(new Error("Invalid update API URL."));
                return;
            }

            var body = JSON.stringify(payload);
            var transport = target.protocol === "http:" ? node.http : node.https;
            var request = transport.request({
                protocol: target.protocol,
                hostname: target.hostname,
                port: target.port || (target.protocol === "http:" ? 80 : 443),
                path: target.pathname + target.search,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(body),
                    "Origin": "null"
                }
            }, function (response) {
                var chunks = [];
                response.on("data", function (chunk) { chunks.push(chunk); });
                response.on("end", function () {
                    try {
                        var text = Buffer.concat(chunks).toString("utf8");
                        resolve(parseUpdateResponse({
                            ok: response.statusCode >= 200 && response.statusCode < 300,
                            status: response.statusCode
                        }, text));
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            request.on("error", reject);
            request.setTimeout(30000, function () {
                request.destroy(new Error("Update check timed out."));
            });
            request.write(body);
            request.end();
        });
    }

    function requestUpdateInfo(currentVersion, licenseKey) {
        var payload = {
            currentVersion: currentVersion,
            licenseKey: licenseKey
        };

        function requestEndpoint(endpoint) {
            if (typeof fetch !== "function") {
                return requestUpdateInfoWithNode(endpoint, payload);
            }

            try {
                return requestUpdateInfoWithFetch(endpoint, payload).catch(function (err) {
                    if (isNetworkFetchError(err)) return requestUpdateInfoWithNode(endpoint, payload);
                    throw err;
                });
            } catch (err) {
                if (isNetworkFetchError(err)) return requestUpdateInfoWithNode(endpoint, payload);
                return Promise.reject(err);
            }
        }

        return requestEndpoint(CONFIG.endpoint).catch(function (err) {
            if (CONFIG.fallbackEndpoint && CONFIG.fallbackEndpoint !== CONFIG.endpoint) {
                console.warn("[KWV AutoUpdater] Primary update endpoint failed, trying fallback:", err);
                return requestEndpoint(CONFIG.fallbackEndpoint);
            }
            throw err;
        });
    }

    function downloadFile(url, destinationPath, redirectCount) {
        redirectCount = redirectCount || 0;
        if (redirectCount > 5) return Promise.reject(new Error("Too many update download redirects."));

        return new Promise(function (resolve, reject) {
            var file = node.fs.createWriteStream(destinationPath);

            function cleanup(error) {
                file.close(function () {
                    try {
                        if (node.fs.existsSync(destinationPath)) node.fs.unlinkSync(destinationPath);
                    } catch (err) {}
                    reject(error);
                });
            }

            var req = node.https.get(url, function (response) {
                var statusCode = response.statusCode || 0;
                var redirectUrl = response.headers.location;

                if (statusCode >= 300 && statusCode < 400 && redirectUrl) {
                    response.resume();
                    file.close(function () {
                        try { node.fs.unlinkSync(destinationPath); } catch (err) {}
                        downloadFile(redirectUrl, destinationPath, redirectCount + 1).then(resolve).catch(reject);
                    });
                    return;
                }

                if (statusCode !== 200) {
                    response.resume();
                    cleanup(new Error("Update download failed with HTTP " + statusCode + "."));
                    return;
                }

                response.pipe(file);
                file.on("finish", function () {
                    file.close(resolve);
                });
            });

            req.on("error", cleanup);
            req.setTimeout(120000, function () {
                req.destroy(new Error("Update download timed out."));
            });
        });
    }

    function ensureDir(dirPath) {
        if (!node.fs.existsSync(dirPath)) {
            node.fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    function removePath(targetPath) {
        try {
            if (targetPath && node.fs.existsSync(targetPath)) {
                node.fs.rmSync(targetPath, { recursive: true, force: true });
            }
        } catch (err) {
            console.warn("[KWV AutoUpdater] Cleanup failed:", targetPath, err);
        }
    }

    function normalizeZipName(entryName) {
        return String(entryName || "").replace(/\\/g, "/").replace(/^\/+/, "");
    }

    function validateZip(zip) {
        zip.getEntries().forEach(function (entry) {
            var name = normalizeZipName(entry.entryName);
            if (!name || name.indexOf("../") >= 0 || name === ".." || /^[a-zA-Z]:\//.test(name)) {
                throw new Error("Unsafe path found inside update ZIP: " + entry.entryName);
            }
        });
    }

    function extractZip(zipPath, stagingDir) {
        removePath(stagingDir);
        ensureDir(stagingDir);

        var zip = new node.AdmZip(zipPath);
        validateZip(zip);
        zip.extractAllTo(stagingDir, true);
    }

    function findUpdateRoot(stagingDir) {
        var entries = node.fs.readdirSync(stagingDir, { withFileTypes: true }).filter(function (entry) {
            return entry.name !== "__MACOSX" && entry.name.charAt(0) !== ".";
        });

        if (entries.length === 1 && entries[0].isDirectory()) {
            return node.path.join(stagingDir, entries[0].name);
        }

        return stagingDir;
    }

    function shouldSkip(relativePath) {
        var normalized = String(relativePath || "").replace(/\\/g, "/");
        return normalized === "CSXS" || normalized.indexOf("CSXS/") === 0;
    }

    function copyRecursive(sourceDir, targetRoot, baseDir) {
        node.fs.readdirSync(sourceDir, { withFileTypes: true }).forEach(function (entry) {
            var sourcePath = node.path.join(sourceDir, entry.name);
            var relativePath = node.path.relative(baseDir, sourcePath);
            var targetPath = node.path.join(targetRoot, relativePath);

            if (shouldSkip(relativePath)) return;
            if (entry.name === "__MACOSX" || entry.name === ".DS_Store") return;

            if (entry.isDirectory()) {
                ensureDir(targetPath);
                copyRecursive(sourcePath, targetRoot, baseDir);
                return;
            }

            if (entry.isFile()) {
                ensureDir(node.path.dirname(targetPath));
                node.fs.copyFileSync(sourcePath, targetPath);
            }
        });
    }

    function installUpdate(downloadUrl) {
        if (!node) return Promise.reject(new Error("CEP Node.js or adm-zip is not available."));
        if (installing) return Promise.resolve({ installed: false, message: "Update install already running." });

        installing = true;

        var updateId = "kwv-update-" + Date.now();
        var zipPath = node.path.join(node.os.tmpdir(), updateId + ".zip");
        var stagingDir = node.path.join(node.os.tmpdir(), updateId);
        var extensionRoot = getExtensionRoot();

        console.log("[KWV AutoUpdater] Downloading:", downloadUrl);
        console.log("[KWV AutoUpdater] ZIP:", zipPath);
        console.log("[KWV AutoUpdater] Extension root:", extensionRoot);

        return downloadFile(downloadUrl, zipPath)
            .then(function () {
                extractZip(zipPath, stagingDir);
                var updateRoot = findUpdateRoot(stagingDir);
                copyRecursive(updateRoot, extensionRoot, updateRoot);
                return { installed: true };
            })
            .then(function (result) {
                removePath(stagingDir);
                removePath(zipPath);
                setTimeout(function () {
                    global.location.reload(true);
                }, 300);
                return result;
            })
            .catch(function (err) {
                removePath(stagingDir);
                removePath(zipPath);
                throw err;
            })
            .finally(function () {
                installing = false;
            });
    }

    function checkForUpdate(options) {
        options = options || {};
        if (checking) return Promise.resolve({ updateAvailable: false, message: "Update check already running." });

        checking = true;
        var currentVersion = options.currentVersion || CONFIG.currentVersion;
        var licenseKey = options.licenseKey || getLicenseKey();

        if (!licenseKey) {
            checking = false;
            return Promise.resolve({ updateAvailable: false, message: "License key not found." });
        }

        return requestUpdateInfo(currentVersion, licenseKey)
            .then(function (data) {
                if (!data || !data.updateAvailable) return data || { updateAvailable: false };
                if (!data.downloadUrl) throw new Error("Update is available, but downloadUrl is missing.");
                data.message = "Update available.";
                if (options.autoInstall === false) return data;
                assertExtensionWritable();
                return installUpdate(data.downloadUrl).then(function () {
                    data.installed = true;
                    return data;
                });
            })
            .catch(function (err) {
                console.error("[KWV AutoUpdater]", err);
                return { updateAvailable: false, error: err.message || String(err) };
            })
            .finally(function () {
                checking = false;
            });
    }

    function scheduleAutoCheck() {
        setTimeout(function () {
            var state = getLicenseState();
            if (state && state.active) {
                checkForUpdate({ autoInstall: CONFIG.autoInstall }).then(function (result) {
                    console.log("[KWV AutoUpdater] Check result:", result);
                });
            }
        }, CONFIG.autoCheckDelayMs);
    }

    function bindUpdateButton() {
        var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-kwv-update-button]"));
        var deactivateButtons = Array.prototype.slice.call(document.querySelectorAll("[data-kwv-deactivate-license]"));
        var versionLabel = document.getElementById("kwvExtensionVersion");
        var statusLabel = document.getElementById("kwvUpdateStatus");
        if (versionLabel) versionLabel.textContent = "300X";

        function setStatus(message, mode) {
            if (!statusLabel) return;
            statusLabel.textContent = message;
            statusLabel.className = "kwv-update-status" + (mode ? " " + mode : "");
        }

        deactivateButtons.forEach(function (button) {
            if (button.getAttribute("data-kwv-deactivate-bound") === "1") return;
            button.setAttribute("data-kwv-deactivate-bound", "1");
            button.addEventListener("click", function () {
                if (!global.KWVLicenseManager || !global.KWVLicenseManager.clearActivation) {
                    setStatus("License manager not ready.", "error");
                    return;
                }
                global.KWVLicenseManager.clearActivation();
                setStatus("Local license deactivated. Activate again to test.", "ok");
                button.textContent = "Deactivated";
                setTimeout(function () {
                    button.textContent = "Deactivate License";
                }, 1600);
            });
        });

        if (!buttons.length) return;

        buttons.forEach(function (button) {
            if (button.getAttribute("data-kwv-update-bound") === "1") return;
            button.setAttribute("data-kwv-update-bound", "1");

            button.addEventListener("click", function () {
                var originalTexts = {};
                buttons.forEach(function (item) {
                    originalTexts[item.id || item.textContent] = item.textContent;
                });
                buttons.forEach(function (item) {
                    item.disabled = true;
                    item.textContent = "Checking...";
                });
                setStatus("Checking update...", "");

                checkForUpdate({ autoInstall: true }).then(function (result) {
                    if (result && result.updateAvailable) {
                        setStatus("Update available. Open After Effects as administrator.", "");
                    }

                    if (result && result.installed) {
                        buttons.forEach(function (item) { item.textContent = "Installing..."; });
                        setStatus("Update installed. Reloading...", "ok");
                        return;
                    }

                    if (result && result.error) {
                        buttons.forEach(function (item) { item.textContent = result.error.indexOf("administrator") >= 0 ? "Need Admin" : "Update Failed"; });
                        setStatus(result.error, "error");
                        setTimeout(function () {
                            buttons.forEach(function (item) {
                                item.textContent = originalTexts[item.id || item.textContent] || "Check Update";
                                item.disabled = false;
                            });
                        }, result.error.indexOf("administrator") >= 0 ? 4200 : 1800);
                        return;
                    }

                    buttons.forEach(function (item) { item.textContent = "No Update"; });
                    setStatus("No update available", "ok");
                    setTimeout(function () {
                        buttons.forEach(function (item) {
                            item.textContent = originalTexts[item.id || item.textContent] || "Check Update";
                            item.disabled = false;
                        });
                    }, 1800);
                }).catch(function (err) {
                    buttons.forEach(function (item) { item.textContent = "Update Failed"; });
                    setStatus(err && err.message ? err.message : String(err), "error");
                    setTimeout(function () {
                        buttons.forEach(function (item) {
                            item.textContent = originalTexts[item.id || item.textContent] || "Check Update";
                            item.disabled = false;
                        });
                    }, 1800);
                });
            });
        });
    }

    global.KWVAutoUpdater = {
        checkForUpdate: checkForUpdate,
        installUpdate: installUpdate,
        getExtensionRoot: getExtensionRoot,
        assertExtensionWritable: assertExtensionWritable
    };

    global.addEventListener("kwv-license-state", function (evt) {
        if (evt && evt.detail && evt.detail.active) scheduleAutoCheck();
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            bindUpdateButton();
            scheduleAutoCheck();
        });
    } else {
        bindUpdateButton();
        scheduleAutoCheck();
    }
})(window);
