(function () {
    const csInterface = new CSInterface();
    const run = (s) => csInterface.evalScript(s);
    let beatProgressTimer = null;
    let beatAnalysisProcess = null;
    let cocoInitialized = false;
    const graphDefaults = { x1: 0.25, y1: 0.10, x2: 0.25, y2: 1.00 };
    const graphSpeedDefaults = { x1: 0.14, y1: 0, x2: 0.46, y2: 0 };
    const graphBounds = { size: 280, pad: 18 };
    const graphPresetStorageKey = "keshavwithvelo.graphPresetSlots.v2";
    const graphPresetStorageFileName = "graph-preset-slots.json";
    const aiHubStorageFileName = "ai-hub-providers.json";
    const aiEnhancerFolderStorageKey = "keshavwithvelo.aiEnhancer.outputFolder.v1";
    const videoDownloaderFolderStorageKey = "keshavwithvelo.videoDownloader.outputFolder.v1";
    const bgRemoverFolderStorageKey = "keshavwithvelo.bgRemover.outputFolder.v1";
    const videoDownloaderPrefsFileName = "video-downloader-prefs.json";
    const stickyNotesStorageKey = "keshavwithvelo.stickyNotes.v1";
    const stickyNotesDeletedStorageKey = "keshavwithvelo.stickyNotes.deleted.v1";
    const stickyNotesStorageFileName = "sticky-notes.txt";
    const stickyNotesTabsStorageKey = "keshavwithvelo.stickyNotes.tabs.v1";
    const stickyNotesTabsStorageFileName = "sticky-notes-tabs.json";
    const stickyNotesMaxStorageChars = 500000;
    const stickyNotesMaxImportChars = 120000;
    const graphPresets = loadGraphPresetSlots();
    const graphState = {
        x1: graphSpeedDefaults.x1,
        y1: graphSpeedDefaults.y1,
        x2: graphSpeedDefaults.x2,
        y2: graphSpeedDefaults.y2,
        open: false,
        activeHandle: "",
        pointerId: null,
        pendingPoint: null,
        framePending: false,
        modeWheelAt: 0,
        modeWheelDelta: 0,
        modeSwitchTimer: null,
        direction: 1,
        activePresetId: "",
        selectedPresetId: "",
        selectedPresetIds: { value: "", speed: "" },
        modeCurves: {
            value: { x1: graphDefaults.x1, y1: graphDefaults.y1, x2: graphDefaults.x2, y2: graphDefaults.y2 },
            speed: { x1: graphSpeedDefaults.x1, y1: graphSpeedDefaults.y1, x2: graphSpeedDefaults.x2, y2: graphSpeedDefaults.y2 }
        },
        saveMode: false,
        mode: "speed"
    };
    const aiEnhancerDeviceStorageKey = "keshavwithvelo.aiEnhancer.deviceMode.v1";
    const cocoPaletteMeta = [
        { id: "monochromatic", title: "Monochromatic", description: "Uses variations of a single hue, creating a clean and consistent look." },
        { id: "analogous", title: "Analogous", description: "Selects colors next to each other on the color wheel for a natural, calming, harmonious feel." },
        { id: "complementary", title: "Complementary", description: "Pairs opposite colors for high contrast and a bold, energetic palette." },
        { id: "splitComplementary", title: "Split-Complementary", description: "Uses a base color plus the two colors adjacent to its complement for contrast with less tension." },
        { id: "triadic", title: "Triadic", description: "Uses three evenly spaced colors for a vibrant and balanced palette." },
        { id: "tetradic", title: "Tetradic", description: "Uses two complementary pairs for rich, varied, and bold color systems." }
    ];
    const cocoState = { h: 0, s: 100, v: 100, palettes: {}, gradients: [], activeFormula: "analogous", activeIndex: 2, mode: "gradient", gradientFilter: "all", activeGradientKey: "" };
    const cocoBoardState = { mode: "gradient", search: "", activeKey: "", activeCodes: null, imageColors: [], customItems: [], solidItems: [], paletteItems: [], gradientItems: [], brandItems: [], previewItem: null, keyCounter: 0 };
    const COCO_LIBRARY_LIMIT = 81;
    const liquidGlassShapeLabels = {
        circle: "Circle",
        rectangle: "Rectangle",
        square: "Square",
        triangle: "Triangle",
        oval: "Oval",
        pentagon: "Pentagon",
        hexagon: "Hexagon",
        star: "Star",
        diamond: "Diamond",
        cylinder: "Cylinder"
    };
    const trimPackActions = [
        { id: "trimIn", top: "Trim", bottom: "In", tone: "amber", title: "Trim In" },
        { id: "trimOut", top: "Trim", bottom: "Out", tone: "amber", title: "Trim Out" },
        { id: "trimInOut", top: "Trim", bottom: "I/O", tone: "amber", title: "Trim In Out" },
        { id: "midIn", top: "Mid", bottom: "In", tone: "green", title: "Mid Trim In" },
        { id: "midOut", top: "Mid", bottom: "Out", tone: "green", title: "Mid Trim Out" },
        { id: "equalIn", top: "Eq", bottom: "In", tone: "green", title: "Equal Trim In" },
        { id: "equalOut", top: "Eq", bottom: "Out", tone: "blue", title: "Equal Trim Out" },
        { id: "reversePath", top: "Path", bottom: "Rev", tone: "blue", title: "Reverse Path Direction" },
        { id: "convertLine", top: "Line", bottom: "Fix", tone: "pink", title: "Convert Selected Line" },
        { id: "addHLine", top: "Add", bottom: "H", tone: "pink", title: "Add Horizontal Line" },
        { id: "addVLine", top: "Add", bottom: "V", tone: "pink", title: "Add Vertical Line" },
        { id: "traceIn", top: "Trace", bottom: "In", tone: "coral", title: "Trace Trim In" },
        { id: "traceOut", top: "Trace", bottom: "Out", tone: "coral", title: "Trace Trim Out" },
        { id: "traceInOut", top: "Trace", bottom: "I/O", tone: "coral", title: "Trace Trim In Out" },
        { id: "traceMidIn", top: "Trace", bottom: "MIn", tone: "mint", title: "Trace Mid In" },
        { id: "traceMidOut", top: "Trace", bottom: "MOut", tone: "mint", title: "Trace Mid Out" }
    ];
    const overlayState = {
        items: [],
        activeVideoCard: null,
        thumbnailCache: {},
        thumbnailQueue: [],
        thumbnailActive: 0,
        thumbnailObserver: null,
        focusItem: null,
        focusClickTimer: null,
        isScrolling: false,
        scrollTimer: null,
        virtualRangeKey: "",
        virtualRenderRaf: 0,
        resizeBound: false,
        loaded: false,
        sessionId: 0
    };
    const pngTapState = {
        path: "",
        time: 0,
        timer: null,
        importedAt: 0
    };
    const pngLibraryState = {
        groups: [],
        activeFolderKey: ""
    };
    const appleActionSettings = {
        carouselMode: "2d",
        carouselCount: 0,
        extrusionDepth: 20,
        numberFormat: "plain",
        numberPrefix: "",
        numberSuffix: ""
    };
    function getOverlayPreviewSeekTime(duration) {
        if (!duration || !isFinite(duration)) return 0;
        return Math.min(Math.max(duration * 0.08, 0.08), Math.max(duration - 0.02, 0.01));
    }
    const aiHubStorageKey = "keshavwithvelo.aiHubProviders.v1";
    const aiBrowserSessionStorageKey = "keshavwithvelo.aiBrowserSession.v2";
    const defaultYouTubeSearchQuery = "Keshav With Velo";
    const aiHubProviders = [
        { id: "google", label: "Google", model: "Google Search", baseUrl: "", note: "Google search tools are available without chat setup." }
    ];
    const aiHubRequestTimeoutMs = 45000;
    const aiHubModelChoices = [
        { id: "Google Search", label: "Google Search" }
    ];
    const carouselProStyles = [
        { id: "01", key: "cy", name: "Cylinder", preset: "ring3d" },
        { id: "03", key: "fn", name: "Fan", preset: "billboardArc" },
        { id: "04", key: "rn", name: "Ring", preset: "ringOrbit" },
        { id: "05", key: "ps", name: "Polaroid", preset: "posterBurst" },
        { id: "06", key: "hx", name: "Helix", preset: "vortexSpin" },
        { id: "07", key: "sl", name: "Slide", preset: "focusSlider" },
        { id: "08", key: "rd", name: "Radial", preset: "photoOrbit" },
        { id: "09", key: "wb", name: "Wave Wall", preset: "sphereWall" },
        { id: "10", key: "sn", name: "Snap Stack", preset: "cascadeDeck" },
        { id: "AP", key: "ap", name: "Along Path", custom: "alongPath" }
    ];
    let captionFontInstallStarted = false;

    function shortenKwvTooltipText(text) {
        const clean = String(text || "").replace(/\s+/g, " ").trim();
        if (!clean) return "";
        const lower = clean.toLowerCase();
        if (/character/.test(lower)) return "Character";
        if (/\bword\b/.test(lower)) return "Word";
        if (/left.*playhead|left shift/.test(lower)) return "Left Shift";
        if (/right.*playhead|right shift/.test(lower)) return "Right Shift";
        if (/backward|stack back/.test(lower)) return "Stack Back";
        if (/forward|stack forward/.test(lower)) return "Stack Forward";
        const parts = clean.split(" ").filter(Boolean);
        return parts.slice(0, 2).join(" ");
    }

    function clampKwvTooltips(root) {
        const scope = root && root.querySelectorAll ? root : document;
        const nodes = [];
        if (scope.nodeType === 1) nodes.push(scope);
        try {
            scope.querySelectorAll("[title], [data-kwv-tooltip]").forEach(function(node) { nodes.push(node); });
        } catch (err) {}
        nodes.forEach(function(node) {
            if (!node || !node.getAttribute) return;
            const title = node.getAttribute("title");
            if (title) {
                const shortTitle = shortenKwvTooltipText(title);
                if (shortTitle && shortTitle !== title) node.setAttribute("title", shortTitle);
            }
            const tooltip = node.getAttribute("data-kwv-tooltip");
            if (tooltip) {
                const shortTooltip = shortenKwvTooltipText(tooltip);
                if (shortTooltip && shortTooltip !== tooltip) node.setAttribute("data-kwv-tooltip", shortTooltip);
            }
        });
    }

    function initKwvTooltipClamp() {
        clampKwvTooltips(document);
        try {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === "attributes") clampKwvTooltips(mutation.target);
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach(function(node) { clampKwvTooltips(node); });
                    }
                });
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["title", "data-kwv-tooltip"]
            });
        } catch (err) {}
    }

    function initGlobalFileDropGuard() {
        if (window.__kwvGlobalFileDropGuardBound) return;
        window.__kwvGlobalFileDropGuardBound = true;
        const allowedDropSelector = [
            "#bgRemoverDrop",
            "#enhancerDropzone",
            "#audioCleanerDropzone",
            "#mp3ConverterDropzone",
            "#videoConverterDropzone",
            "#customPresetDropzone",
            "#compProjectDrop",
            "#compProjectGrid",
            "#compSaverProjectsPane",
            "input[type='file']"
        ].join(",");

        function hasDroppedFiles(event) {
            try {
                const transfer = event && event.dataTransfer;
                if (!transfer) return false;
                if (transfer.files && transfer.files.length) return true;
                const types = transfer.types || [];
                for (let i = 0; i < types.length; i++) {
                    if (String(types[i]).toLowerCase() === "files") return true;
                }
            } catch (dropErr) {}
            return false;
        }

        function isAllowedDropTarget(event) {
            try {
                const target = event && event.target;
                return !!(target && target.closest && target.closest(allowedDropSelector));
            } catch (targetErr) {
                return false;
            }
        }

        function guardDrag(event) {
            if (!hasDroppedFiles(event)) return;
            if (event.preventDefault) event.preventDefault();
            try { event.dataTransfer.dropEffect = isAllowedDropTarget(event) ? "copy" : "none"; } catch (dropEffectErr) {}
        }

        function guardDrop(event) {
            if (!hasDroppedFiles(event)) return;
            if (event.preventDefault) event.preventDefault();
            if (!isAllowedDropTarget(event) && event.stopPropagation) event.stopPropagation();
        }

        ["dragenter", "dragover"].forEach(function(name) {
            window.addEventListener(name, guardDrag, true);
            document.addEventListener(name, guardDrag, true);
        });
        window.addEventListener("drop", guardDrop, true);
        document.addEventListener("drop", guardDrop, true);
    }

    function installBundledCaptionFonts() {
        if (captionFontInstallStarted) return;
        captionFontInstallStarted = true;
        // Keep bundled font files inside the extension, but never auto-install or
        // register fonts on the user's OS. Touching Windows font registry at startup
        // can disturb host/system font state on some machines.
    }
    const aiHubState = loadAiHubState();
    const aiHubRuntime = {
        messages: [],
        settingsOpen: false,
        pending: false,
        activeMode: "chat",
        searchAiMode: false,
        searchEngine: "youtube",
        searchHistory: [],
        searchIndex: -1,
        currentSearchUrl: "",
        currentExternalUrl: "",
        searchTabs: [],
        activeSearchTabId: "",
        searchTabCounter: 0,
        guestLoadTimer: null,
        guestServerPort: 0,
        guestLocalOrigin: "",
        guestServerReady: false,
        guestServerStarting: false,
        guestServerFailed: false
    };
    const aiBgRemovalRuntime = {
        module: null,
        moduleError: "",
        running: false
    };
    const videoDownloaderRuntime = {
        busy: false,
        request: null,
        fileStream: null,
        hlsProcess: null,
        ytProcess: null,
        tempPath: "",
        runDir: "",
        outputPath: "",
        trimProcess: null,
        jobId: 0,
        cancelRequested: false,
        lastProgress: 0,
        trimDuration: 60,
        previewTimer: null,
        previewResolveProc: null,
        previewUrl: "",
        qualityTimer: null,
        qualityProcess: null,
        qualityUrl: ""
    };
    const bgRemoverPanelState = {
        processing: false,
        outputPath: "",
        outputFolder: "",
        progressTimer: null,
        startedAt: 0
    };
    const aiGuestPreferredPorts = [17345, 17346, 17347, 17348];

    function persistAiBrowserSession() {
        try {
            const tabs = aiHubRuntime.searchTabs.map(function(tab) {
                return {
                    id: tab.id, title: tab.title, url: tab.currentUrl || tab.url || "",
                    currentUrl: tab.currentUrl || tab.url || "", externalUrl: tab.externalUrl || "",
                    input: tab.input || "", engine: tab.engine || "youtube",
                    history: (tab.history || []).slice(-80), historyIndex: tab.historyIndex,
                    zoom: tab.zoom || 1, zoomed: !!tab.zoomed
                };
            });
            localStorage.setItem(aiBrowserSessionStorageKey, JSON.stringify({
                tabs: tabs, activeTabId: aiHubRuntime.activeSearchTabId, counter: aiHubRuntime.searchTabCounter
            }));
        } catch (err) {}
    }

    function restoreAiBrowserSession() {
        try {
            const saved = JSON.parse(localStorage.getItem(aiBrowserSessionStorageKey) || "null");
            if (!saved || !Array.isArray(saved.tabs) || !saved.tabs.length) return;
            aiHubRuntime.searchTabs = saved.tabs.slice(0, 12).map(function(savedTab, index) {
                const id = String(savedTab.id || ("tab-" + (index + 1)));
                const tab = makeAiSearchTab(id);
                Object.keys(savedTab).forEach(function(key) { if (key !== "frameId") tab[key] = savedTab[key]; });
                tab.history = Array.isArray(savedTab.history) ? savedTab.history.slice(-80) : [];
                tab.historyIndex = Math.max(-1, Math.min(parseInt(savedTab.historyIndex, 10) || 0, tab.history.length - 1));
                tab.loading = false;
                return tab;
            });
            aiHubRuntime.searchTabCounter = Math.max(parseInt(saved.counter, 10) || 0, aiHubRuntime.searchTabs.length);
            aiHubRuntime.activeSearchTabId = getAiSearchTabById(String(saved.activeTabId || "")) ? String(saved.activeTabId) : aiHubRuntime.searchTabs[0].id;
        } catch (err) {}
    }

    // 1. TABS SYSTEM
    const tabs = document.querySelectorAll(".tab-btn");
    const panes = document.querySelectorAll(".tab-pane");
    function closeAutoCaptionLanguageMenu() {
        const languageCustom = document.getElementById("autoCaptionLanguageCustom");
        if (!languageCustom) return;
        languageCustom.classList.remove("open");
        const trigger = languageCustom.querySelector(".kwv-custom-select-trigger");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
    }
    function syncMainTabIndicator() {
        const tabsHeader = document.querySelector(".tabs-header");
        const activeTab = tabsHeader ? tabsHeader.querySelector(".tab-btn.active") : null;
        if (!tabsHeader || !activeTab) return;
        const headerRect = tabsHeader.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        tabsHeader.style.setProperty("--kwv-tab-indicator-left", Math.round(tabRect.left - headerRect.left) + "px");
        tabsHeader.style.setProperty("--kwv-tab-indicator-width", Math.round(tabRect.width) + "px");
        tabsHeader.style.setProperty("--kwv-tab-indicator-opacity", "1");
    }
    function layoutTrimPackDock() {
        const dock = document.getElementById("trimpackDock");
        const tabsHeader = document.querySelector(".tabs-header");
        const mainWrapper = document.querySelector(".main-wrapper");
        const panel = dock ? dock.querySelector(".trimpack-panel") : null;
        const toggle = dock ? dock.querySelector(".trimpack-toggle") : null;
        if (!dock || !mainWrapper || !panel) return;
        const availableHeight = Math.max(250, mainWrapper.clientHeight);
        dock.style.top = "0px";
        panel.style.height = availableHeight + "px";
        if (toggle && tabsHeader) {
            const toggleTop = tabsHeader.offsetTop + tabsHeader.offsetHeight + 6;
            toggle.style.setProperty("--trimpack-toggle-top", toggleTop + "px");
        }
    }
    tabs.forEach(tab => {
        tab.addEventListener("click", function() {
            closeAutoCaptionLanguageMenu();
            const target = this.getAttribute("data-tab");
            tabs.forEach(t => t.classList.remove("active"));
            panes.forEach(p => p.classList.remove("active"));
            this.classList.add("active");
            const tp = document.getElementById(target);
            if(tp) tp.classList.add("active");
            if (target === "tab-overlays") {
                let overlaysEnabled = true;
                try {
                    overlaysEnabled = localStorage.getItem("keshavwithvelo.overlayPanel.enabled.v1") !== "0";
                } catch (overlayToggleErr) {}
                if (overlaysEnabled) refreshPngLibrary();
            }
            if (target === "tab-text") {
                const beatShell = document.getElementById("appleBeatShell");
                if (beatShell && !beatShell.classList.contains("collapsed")) refreshBeatAudioLayers();
            }
            if (target === "tab-carousel") initCarouselTab();
            if (target === "tab-color") initCocoPaletteStudio();
            syncMainTabIndicator();
            layoutTrimPackDock();
        });
    });
    window.addEventListener("resize", function() {
        syncMainTabIndicator();
        layoutTrimPackDock();
    });
    initKwvTooltipClamp();
    initGlobalFileDropGuard();
    setTimeout(syncMainTabIndicator, 0);

    function bind(id, script) {
        const el = document.getElementById(id);
        if (el) el.onclick = () => run(script);
    }

    function initCarouselTab() {
        initCarouselProPanel();
    }

    function initAiEnhancerPanel() {
        if (window.__kwvAiEnhancerPanelBound) return;
        window.__kwvAiEnhancerPanelBound = true;
        let selectedVideoPath = "";
        let enhancerProgressTimer = null;
        let enhancerLastProgress = 0;
        let currentEnhancerManager = null;
        let enhancerBusy = false;
        const dropzone = document.getElementById("enhancerDropzone");
        const fileInput = document.getElementById("enhancerVideoFile");
        const fileName = document.getElementById("enhancerFileName");
        const status = document.getElementById("enhancerStatus");
        const settingsBtn = document.getElementById("btnEnhancerSettings");
        const settingsPanel = document.getElementById("enhancerSettingsPanel");
        const clearBtn = document.getElementById("btnEnhancerClear");
        const exportBtn = document.getElementById("btnEnhancerExport");
        const browseFolderBtn = document.getElementById("btnEnhancerBrowseFolder");
        const outputDirInput = document.getElementById("enhancerOutputDir");
        const deviceBtn = document.getElementById("btnEnhancerDevice");
        const deviceModeLabel = document.getElementById("enhancerDeviceMode");
        const deviceModelLabel = document.getElementById("enhancerDeviceModel");
        let savedEnhancerDeviceMode = "";
        try { savedEnhancerDeviceMode = localStorage.getItem(aiEnhancerDeviceStorageKey) || ""; } catch (error) {}
        let enhancerDeviceMode = savedEnhancerDeviceMode === "cpu" ? "cpu" : "gpu";
        const enhancerDeviceInfo = {
            cpuName: "",
            gpuName: ""
        };

        function setEnhancerStatus(message, isError) {
            if (status) {
                status.textContent = message || "";
                status.style.color = isError ? "#ff6b6b" : "#8c8c8c";
            }
            setAiHubStatus(message || "", !!isError);
        }

        function setEnhancerProgress(percent, label, forceReset) {
            let safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
            if (!forceReset && safePercent < 100) {
                safePercent = Math.max(enhancerLastProgress || 0, safePercent);
            }
            enhancerLastProgress = safePercent;
            const fill = document.getElementById("enhancerProgressFill");
            const value = document.getElementById("enhancerProgressValue");
            const labelEl = document.getElementById("enhancerProgressLabel");
            if (fill) fill.style.width = safePercent + "%";
            if (value) value.textContent = Math.round(safePercent) + "%";
            if (labelEl && label) labelEl.textContent = label;
        }

        function formatEnhancerProgressDetail(progress) {
            const detail = progress && progress.detail && typeof progress.detail === "object" ? progress.detail : {};
            if (progress && progress.framesDone != null && progress.framesTotal) return "Frame " + progress.framesDone + " / " + progress.framesTotal;
            if (detail.framesDone != null && detail.framesTotal) return "Frame " + detail.framesDone + " / " + detail.framesTotal;
            return "";
        }

        function setEnhancerBusy(isBusy) {
            enhancerBusy = !!isBusy;
            if (exportBtn) {
                exportBtn.disabled = false;
                exportBtn.innerHTML = enhancerBusy ? "Cancel" : "<span class=\"ai-enhancer-play-icon\" aria-hidden=\"true\"></span><span>Export</span>";
            }
        }

        function cleanEnhancerDeviceName(name) {
            return String(name || "")
                .replace(/\s+/g, " ")
                .replace(/^name\s*$/i, "")
                .replace(/^chipset model:\s*/i, "")
                .replace(/^model name:\s*/i, "")
                .trim();
        }

        function pickEnhancerGpuName(text) {
            const lines = String(text || "").split(/\r?\n/).map(cleanEnhancerDeviceName).filter(Boolean);
            const filtered = lines.filter(function(name) {
                return !/microsoft basic|remote display|parsec|virtual display|usb/i.test(name);
            });
            const preferred = filtered.find(function(name) {
                return /nvidia|geforce|rtx|gtx|quadro|radeon|amd|intel|iris|uhd|apple/i.test(name);
            });
            return preferred || filtered[0] || lines[0] || "";
        }

        function updateEnhancerDeviceButton() {
            const isCpu = enhancerDeviceMode === "cpu";
            const modeText = isCpu ? "CPU Safe" : "Auto GPU";
            const modelText = isCpu
                ? (enhancerDeviceInfo.cpuName || "CPU fallback")
                : (enhancerDeviceInfo.gpuName || "Detecting GPU...");
            if (deviceModeLabel) deviceModeLabel.textContent = modeText;
            if (deviceModelLabel) deviceModelLabel.textContent = modelText;
            if (deviceBtn) {
                deviceBtn.classList.toggle("cpu", isCpu);
                deviceBtn.title = "Click to switch: " + (isCpu ? "Auto GPU" : "CPU Safe");
            }
        }

        function setEnhancerDeviceMode(mode, shouldSave) {
            enhancerDeviceMode = mode === "cpu" ? "cpu" : "gpu";
            if (shouldSave) {
                try { localStorage.setItem(aiEnhancerDeviceStorageKey, enhancerDeviceMode); } catch (error) {}
            }
            updateEnhancerDeviceButton();
        }

        function readEnhancerCpuName() {
            try {
                if (typeof require !== "function") return "";
                const os = require("os");
                const cpus = os.cpus ? os.cpus() : [];
                return cpus && cpus[0] && cpus[0].model ? cleanEnhancerDeviceName(cpus[0].model) : "";
            } catch (error) {
                return "";
            }
        }

        function detectEnhancerGpuName() {
            if (typeof require !== "function") {
                updateEnhancerDeviceButton();
                return;
            }
            let childProcess = null;
            try { childProcess = require("child_process"); } catch (error) {}
            if (!childProcess || !childProcess.execFile) {
                updateEnhancerDeviceButton();
                return;
            }
            const platform = (typeof process !== "undefined" && process.platform) ? process.platform : "";
            const finish = function(name) {
                const gpuName = cleanEnhancerDeviceName(name);
                if (gpuName) enhancerDeviceInfo.gpuName = gpuName;
                if (!enhancerDeviceInfo.gpuName && !savedEnhancerDeviceMode) enhancerDeviceMode = "cpu";
                updateEnhancerDeviceButton();
            };
            if (platform === "win32") {
                const psCommand = "Get-CimInstance Win32_VideoController | Where-Object {$_.Name} | ForEach-Object {$_.Name}";
                childProcess.execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psCommand], { windowsHide: true, timeout: 5000 }, function(error, stdout) {
                    const gpuName = !error ? pickEnhancerGpuName(stdout) : "";
                    if (gpuName) {
                        finish(gpuName);
                        return;
                    }
                    childProcess.execFile("wmic.exe", ["path", "win32_VideoController", "get", "name"], { windowsHide: true, timeout: 5000 }, function(wmicError, wmicStdout) {
                        finish(!wmicError ? pickEnhancerGpuName(wmicStdout) : "");
                    });
                });
                return;
            }
            if (platform === "darwin") {
                childProcess.execFile("system_profiler", ["SPDisplaysDataType", "-detailLevel", "mini"], { timeout: 7000 }, function(error, stdout) {
                    let gpuName = "";
                    if (!error) {
                        const match = String(stdout || "").match(/Chipset Model:\s*(.+)/i);
                        gpuName = match ? match[1] : pickEnhancerGpuName(stdout);
                    }
                    finish(gpuName);
                });
                return;
            }
            finish("");
        }

        function clearEnhancerProgressTimer() {
            if (enhancerProgressTimer) {
                window.clearInterval(enhancerProgressTimer);
                enhancerProgressTimer = null;
            }
        }

        function setEnhancerFile(file) {
            if (!file) return;
            selectedVideoPath = file.path || file.localPath || file.fullPath || file.nativePath || "";
            if (fileName) fileName.textContent = file.name || getEnhancerFileLabel(selectedVideoPath) || "Media selected";
            if (selectedVideoPath) setEnhancerStatus("Media ready.", false);
            else setEnhancerStatus("File selected. If export does not start, select the same photo/video layer or project item in AE and click Export.", false);
        }

        function selectEnhancerFile() {
            if (!fileInput) return;
            try { fileInput.value = ""; } catch (error) {}
            try {
                fileInput.click();
            } catch (error) {
                console.warn("[Keshav Velo] Enhancer file input click failed:", error);
            }
        }

        function getEnhancerFileLabel(filePath) {
            const normalized = String(filePath || "").replace(/\\/g, "/");
            return normalized.split("/").pop() || normalized || "Media selected";
        }

        function setEnhancerSourcePath(filePath, label) {
            selectedVideoPath = String(filePath || "");
            if (fileName) fileName.textContent = label || getEnhancerFileLabel(selectedVideoPath);
            setEnhancerStatus("Media ready.", false);
        }

        function parseEnhancerSourceResult(res) {
            const text = String(res || "");
            if (text.indexOf("success::") !== 0) {
                return { error: text.replace(/^error::/, "") || "Drop a photo/video or select a photo/video clip in AE first." };
            }
            const parts = text.split("::");
            const pathValue = parts[1] ? decodeURIComponent(parts[1]) : "";
            const labelValue = parts[2] ? decodeURIComponent(parts[2]) : getEnhancerFileLabel(pathValue);
            if (!pathValue) return { error: "Selected clip source path was not found." };
            return { path: pathValue, label: labelValue };
        }

        function isEnhancerImagePath(filePath) {
            return /\.(png|jpe?g|webp)$/i.test(String(filePath || ""));
        }

        function getSelectedAeClipForEnhancer(callback) {
            if (!csInterface || !csInterface.evalScript) {
                callback({ error: "AE bridge is not ready." });
                return;
            }
            csInterface.evalScript("toolkit.getSelectedEnhancerSource()", function(res) {
                callback(parseEnhancerSourceResult(res));
            });
        }

        function getDefaultEnhancerOutputFolder() {
            try {
                const path = require("path");
                const os = require("os");
                return path.join(os.homedir(), "Downloads", "Keshav Velo Enhancer");
            } catch (error) {
                try {
                    const docs = csInterface.getSystemPath(SystemPath.MY_DOCUMENTS) || "";
                    return docs ? docs.replace(/\\/g, "/") + "/Keshav Velo Enhancer" : "";
                } catch (fallbackError) {
                    return "";
                }
            }
        }

        function normalizeDroppedFilePath(rawPath) {
            let text = String(rawPath || "").trim();
            if (!text) return "";
            text = text.split(/\r?\n/).filter(Boolean)[0] || text;
            if (/^file:/i.test(text)) {
                try {
                    let decoded = decodeURIComponent(text.replace(/^file:\/+/i, ""));
                    if (/^[a-zA-Z]:/.test(decoded)) return decoded.replace(/\//g, "\\");
                    if (/^\/[a-zA-Z]:/.test(decoded)) return decoded.slice(1).replace(/\//g, "\\");
                    return decoded;
                } catch (error) {}
            }
            if (/^[a-zA-Z]:[\\/]/.test(text) || /^\\\\/.test(text)) return text;
            return "";
        }

        function getDroppedEnhancerPath(evt) {
            const transfer = (evt && evt.dataTransfer) || {};
            const files = transfer.files || [];
            const file = files && files[0] ? files[0] : null;
            if (file) {
                const filePath = file.path || file.localPath || file.fullPath || file.nativePath || "";
                if (filePath) return { path: filePath, label: file.name || getEnhancerFileLabel(filePath), file };
            }
            if (transfer.items && transfer.items.length) {
                for (let i = 0; i < transfer.items.length; i++) {
                    try {
                        const itemFile = transfer.items[i].getAsFile ? transfer.items[i].getAsFile() : null;
                        const itemPath = itemFile && (itemFile.path || itemFile.localPath || itemFile.fullPath || itemFile.nativePath || "");
                        if (itemPath) return { path: itemPath, label: itemFile.name || getEnhancerFileLabel(itemPath), file: itemFile };
                    } catch (error) {}
                }
            }
            if (transfer.getData) {
                const formats = ["text/uri-list", "text/plain", "URL", "DownloadURL"];
                for (let f = 0; f < formats.length; f++) {
                    try {
                        const value = transfer.getData(formats[f]);
                        const normalized = normalizeDroppedFilePath(value);
                        if (normalized) return { path: normalized, label: getEnhancerFileLabel(normalized), file };
                    } catch (error) {}
                }
            }
            return { path: "", label: file && file.name ? file.name : "", file };
        }

        function getEnhancerOutputFolder() {
            const manual = outputDirInput ? String(outputDirInput.value || "").trim() : "";
            if (manual) return manual;
            let saved = "";
            try { saved = localStorage.getItem(aiEnhancerFolderStorageKey) || ""; } catch (error) {}
            return saved || getDefaultEnhancerOutputFolder();
        }

        function saveEnhancerOutputFolder(folderPath) {
            const safePath = String(folderPath || "").trim();
            if (!safePath) return;
            if (outputDirInput) outputDirInput.value = safePath;
            try { localStorage.setItem(aiEnhancerFolderStorageKey, safePath); } catch (error) {}
        }

        function ensureEnhancerOutputFolder(folderPath) {
            try {
                const fs = require("fs");
                if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                return fs.existsSync(folderPath);
            } catch (error) {
                return false;
            }
        }

        function getAvailableEnhancerOutputPath(targetPath) {
            const fs = require("fs");
            const path = require("path");
            if (!fs.existsSync(targetPath)) return targetPath;
            const parsed = path.parse(targetPath);
            for (let i = 1; i < 1000; i++) {
                const next = path.join(parsed.dir, parsed.name + " (" + i + ")" + parsed.ext);
                if (!fs.existsSync(next)) return next;
            }
            return path.join(parsed.dir, parsed.name + " " + Date.now() + parsed.ext);
        }

        function chooseEnhancerOutputFolder() {
            const platform = (typeof process !== "undefined" && process.platform) ? process.platform : "";
            if (platform === "win32") {
                selectVideoConverterFolderNative("Choose Enhancer Export Folder", function(folder) {
                    if (!folder) return;
                    if (!ensureEnhancerOutputFolder(folder)) {
                        setEnhancerStatus("Selected export folder cannot be used.", true);
                        return;
                    }
                    saveEnhancerOutputFolder(folder);
                    setEnhancerStatus("Export folder saved.", false);
                });
                return;
            }
            if (window.cep && window.cep.fs && window.cep.fs.showOpenDialog) {
                try {
                    const result = window.cep.fs.showOpenDialog(false, true, "Choose Enhancer Export Folder", getEnhancerOutputFolder() || "", []);
                    const folder = result && result.data && result.data[0] ? String(result.data[0]) : "";
                    if (folder) {
                        if (!ensureEnhancerOutputFolder(folder)) {
                            setEnhancerStatus("Selected export folder cannot be used.", true);
                            return;
                        }
                        saveEnhancerOutputFolder(folder);
                        setEnhancerStatus("Export folder saved.", false);
                        return;
                    }
                } catch (dialogError) {}
            }
            selectVideoConverterFolderNative("Choose Enhancer Export Folder", function(folder) {
                if (!folder) return;
                if (!ensureEnhancerOutputFolder(folder)) {
                    setEnhancerStatus("Selected export folder cannot be used.", true);
                    return;
                }
                saveEnhancerOutputFolder(folder);
                setEnhancerStatus("Export folder saved.", false);
            });
        }

        function getEnhancerSettings() {
            const useCpuSafe = enhancerDeviceMode === "cpu";
            return {
                format: "mp4",
                size: "original",
                fps: "original",
                encoder: useCpuSafe ? "cpu" : "balanced",
                audio: "copy",
                strength: 52,
                detail: 66,
                upscale: true,
                denoise: true,
                sharpen: true,
                stabilize: false,
                smoothFps: false,
                colorBoost: false,
                preset: "clean",
                qualityMode: "balanced",
                forceAiEnhance: !useCpuSafe,
                forceRealESRGANVideo: !useCpuSafe,
                useRealESRGAN: !useCpuSafe,
                processingDevice: useCpuSafe ? "cpu" : "gpu",
                deviceName: useCpuSafe ? enhancerDeviceInfo.cpuName : enhancerDeviceInfo.gpuName,
                tileSize: 0,
                threads: "4:6:4",
                tta: false
            };
        }

        function getEnhancerManagerModule() {
            if (typeof require !== "function") return null;
            try {
                const path = require("path");
                const extPath = csInterface.getSystemPath(SystemPath.EXTENSION) || "";
                return require(path.join(extPath, "enhancer", "enhancement-manager.js"));
            } catch (error) {
                console.warn("[Keshav Velo] EnhancementManager load failed:", error);
                return null;
            }
        }

        function importEnhancerOutput(outputPath, done) {
            if (!csInterface || !csInterface.evalScript) {
                if (done) done("error::AE bridge is not ready.");
                return;
            }
            setEnhancerProgress(98, "Importing", false);
            csInterface.evalScript("toolkit.importEnhancedMediaAsset('" + escapeScriptString(outputPath) + "')", function(res) {
                if (done) done(res || "");
            });
        }

        function runEnhancerExport(sourcePath) {
            const managerModule = getEnhancerManagerModule();
            if (!managerModule || !managerModule.EnhancementManager) {
                setEnhancerStatus("Enhancer backend is missing. Reload panel and try again.", true);
                return;
            }
            const fs = require("fs");
            const path = require("path");
            if (!sourcePath || !fs.existsSync(sourcePath)) {
                setEnhancerStatus("Selected media file was not found.", true);
                return;
            }
            const outputFolder = getEnhancerOutputFolder();
            if (!outputFolder || !ensureEnhancerOutputFolder(outputFolder)) {
                setEnhancerStatus("Export folder cannot be used. Choose another folder.", true);
                return;
            }
            saveEnhancerOutputFolder(outputFolder);
            const settings = getEnhancerSettings();
            const format = settings.format || "mp4";
            const parsed = path.parse(sourcePath);
            const sizeSuffix = settings.size && settings.size !== "original" ? "-" + settings.size : "";
            const baseName = sanitizeVideoDownloaderFileName(parsed.name + "-enhanced" + sizeSuffix);
            const extension = isEnhancerImagePath(sourcePath) ? "png" : (format === "mov" ? "mov" : "mp4");
            const outputPath = getAvailableEnhancerOutputPath(path.join(outputFolder, baseName + "." + extension));
            const extPath = csInterface.getSystemPath(SystemPath.EXTENSION) || "";
            const manager = new managerModule.EnhancementManager({
                extensionRoot: extPath,
                ffmpegPath: getFfmpegExecutable(),
                ffprobePath: getFfprobeExecutable(),
                onProgress: function(progress) {
                    const percent = typeof progress.percent === "number" ? progress.percent : enhancerLastProgress;
                    setEnhancerProgress(percent, progress.stage || "Enhancing", progress.stage === "Preparing");
                    const detail = formatEnhancerProgressDetail(progress);
                    if (detail) setEnhancerStatus((progress.stage || "Enhancing") + " — " + detail, false);
                    else setEnhancerStatus(progress.stage || "Enhancing", false);
                },
                onLog: function(entry) {
                    if (entry && entry.event === "job.error") console.warn("[Keshav Velo] Enhancer job error:", entry);
                }
            });
            currentEnhancerManager = manager;
            setEnhancerBusy(true);
            clearEnhancerProgressTimer();
            enhancerLastProgress = 0;
            setEnhancerProgress(0, "Preparing", true);
            setEnhancerStatus("Preparing enhancer job...", false);
            let enhancerPromise = null;
            try {
                enhancerPromise = manager.process({
                    input: sourcePath,
                    output: outputPath,
                    settings
                });
            } catch (error) {
                currentEnhancerManager = null;
                setEnhancerBusy(false);
                setEnhancerProgress(0, "Failed", true);
                setEnhancerStatus("Export failed: " + (error && error.message ? error.message : "Unknown enhancer error."), true);
                console.warn("[Keshav Velo] Enhancer export failed before job start:", error);
                return;
            }
            Promise.resolve(enhancerPromise).then(function(result) {
                currentEnhancerManager = null;
                setEnhancerBusy(false);
                importEnhancerOutput(result.output, function(importResult) {
                    setEnhancerProgress(100, "Complete", true);
                    if (importResult && importResult.indexOf("error::") === 0) {
                        setEnhancerStatus("Export complete — import skipped: " + importResult.substring(7), false);
                        return;
                    }
                    setEnhancerStatus("Export complete — imported into After Effects.", false);
                });
            }).catch(function(error) {
                currentEnhancerManager = null;
                setEnhancerBusy(false);
                const hint = getFfmpegExecutable() === "ffmpeg" ? " Install FFmpeg or add bundled FFmpeg." : "";
                setEnhancerProgress(0, "Failed", true);
                setEnhancerStatus("Export failed: " + (error && error.message ? error.message : "Unknown error.") + hint, true);
                console.warn("[Keshav Velo] Enhancer export failed:", error);
            });
        }

        try {
            const savedFolder = localStorage.getItem(aiEnhancerFolderStorageKey) || "";
            if (savedFolder && outputDirInput) outputDirInput.value = savedFolder;
        } catch (error) {}

        enhancerDeviceInfo.cpuName = readEnhancerCpuName();
        updateEnhancerDeviceButton();
        detectEnhancerGpuName();
        if (deviceBtn) {
            deviceBtn.onclick = function(evt) {
                if (evt && evt.preventDefault) evt.preventDefault();
                setEnhancerDeviceMode(enhancerDeviceMode === "cpu" ? "gpu" : "cpu", true);
                setEnhancerStatus((enhancerDeviceMode === "cpu" ? "CPU Safe" : "Auto GPU") + " selected.", false);
                return false;
            };
        }

        document.querySelectorAll(".ai-enhancer-slider").forEach(function(slider) {
            const output = slider.parentNode ? slider.parentNode.querySelector("output") : null;
            const sync = function() {
                if (output) output.textContent = String(slider.value || "0");
                const min = Number(slider.min || 0);
                const max = Number(slider.max || 100);
                const value = Number(slider.value || 0);
                const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
                slider.style.setProperty("--kwv-range-fill", Math.max(0, Math.min(100, fill)) + "%");
            };
            slider.addEventListener("input", sync);
            slider.addEventListener("change", sync);
            sync();
        });

        if (fileInput) {
            fileInput.addEventListener("click", function(evt) {
                evt.stopPropagation();
            });
            fileInput.onchange = function() {
                const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
                if (file) {
                    const filePath = file.path || file.localPath || file.fullPath || file.nativePath || "";
                    if (filePath) setEnhancerSourcePath(filePath, file.name || getEnhancerFileLabel(filePath));
                    else setEnhancerFile(file);
                }
                try { fileInput.value = ""; } catch (error) {}
            };
        }
        if (dropzone) {
            dropzone.onclick = function(evt) {
                if (evt && evt.target === fileInput) return true;
                selectEnhancerFile();
                return false;
            };
            dropzone.onkeydown = function(evt) {
                if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    selectEnhancerFile();
                    return false;
                }
            };
            ["dragenter", "dragover"].forEach(function(name) {
                dropzone.addEventListener(name, function(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    dropzone.classList.add("dragging");
                });
            });
            ["dragleave", "drop"].forEach(function(name) {
                dropzone.addEventListener(name, function(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    dropzone.classList.remove("dragging");
                });
            });
            dropzone.addEventListener("drop", function(evt) {
                const dropped = getDroppedEnhancerPath(evt);
                if (dropped.path) {
                    setEnhancerSourcePath(dropped.path, dropped.label);
                    return;
                }
                if (dropped.file) setEnhancerFile(dropped.file);
                getSelectedAeClipForEnhancer(function(result) {
                    if (!selectedVideoPath && result && result.path) {
                        setEnhancerSourcePath(result.path, result.label);
                    } else if (!selectedVideoPath) {
                        setEnhancerStatus("Drag path was blocked by CEP. Click the box once and choose the photo/video file.", true);
                    }
                });
            });
        }
        if (settingsBtn && settingsPanel) {
            settingsBtn.onclick = function() {
                const open = !settingsPanel.classList.contains("active");
                settingsPanel.classList.toggle("active", open);
                settingsPanel.setAttribute("aria-hidden", open ? "false" : "true");
                settingsBtn.classList.toggle("active", open);
                settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
            };
        }
        if (clearBtn) {
            clearBtn.onclick = function() {
                selectedVideoPath = "";
                clearEnhancerProgressTimer();
                enhancerLastProgress = 0;
                if (fileInput) fileInput.value = "";
                if (fileName) fileName.textContent = "or click to choose a file";
                setEnhancerProgress(0, "Ready", true);
                setEnhancerStatus("Ready.", false);
            };
        }
        if (browseFolderBtn) {
            browseFolderBtn.onclick = chooseEnhancerOutputFolder;
        }
        if (exportBtn) {
            exportBtn.onclick = function() {
                if (enhancerBusy) {
                    if (currentEnhancerManager && currentEnhancerManager.cancel) currentEnhancerManager.cancel();
                    currentEnhancerManager = null;
                    setEnhancerBusy(false);
                    setEnhancerProgress(0, "Cancelled", true);
                    setEnhancerStatus("Enhancer cancelled.", false);
                    return;
                }
                if (selectedVideoPath) {
                    runEnhancerExport(selectedVideoPath);
                    return;
                }
                setEnhancerStatus("Reading selected AE clip...", false);
                getSelectedAeClipForEnhancer(function(result) {
                    if (!result || result.error) {
                        setEnhancerStatus(result && result.error ? result.error : "Drop a photo/video or select a photo/video layer/project footage first.", true);
                        return;
                    }
                    setEnhancerSourcePath(result.path, result.label);
                    runEnhancerExport(result.path);
                });
            };
        }
    }

    function setCarouselProStatus(message, isError) {
        const status = document.getElementById("kwvCarouselProStatus");
        if (!status) return;
        status.textContent = message || "";
        status.style.color = isError ? "#ff8a8a" : "#8b93a3";
    }

    function carouselProPreviewHtml(key) {
        const coords = {
            cy: [[-12.31, 0, 0, .56, .67], [12.31, 0, 0, .56, .67], [-31.18, 0, 0, .66, .75], [31.18, 0, 0, .66, .75], [-35.45, 0, 0, .81, .86], [35.45, 0, 0, .81, .86], [-23.14, 0, 0, .95, .96], [23.14, 0, 0, .95, .96], [0, 0, 0, 1, 1]],
            fn: [[-36, 8.8, -45.84, .72, .64], [-27, 6.6, -34.38, .79, .73], [-18, 4.4, -22.92, .86, .82], [-9, 2.2, -11.46, .93, .91], [0, 0, 0, 1, 1], [9, 2.2, 11.46, .93, .91], [18, 4.4, 22.92, .86, .82], [27, 6.6, 34.38, .79, .73], [36, 8.8, 45.84, .72, .64]],
            rn: [[0, 13.6, 0, .45, .57], [-12.63, 12.56, 0, .47, .59], [12.63, 12.56, 0, .47, .59], [-23.33, 9.62, 0, .53, .63], [23.33, 9.62, 0, .53, .63], [-30.49, 5.2, 0, .62, .7], [30.49, 5.2, 0, .62, .7], [-33, 0, 0, .73, .79], [33, 0, 0, .73, .79], [30.49, -5.2, 0, .83, .87], [-30.49, -5.2, 0, .83, .87], [-23.33, -9.62, 0, .92, .94], [23.33, -9.62, 0, .92, .94], [-12.63, -12.56, 0, .98, .98], [12.63, -12.56, 0, .98, .98], [0, -13.6, 0, 1, 1]],
            ps: [[19, 0, 5.73, 1, .64], [19.15, 9.96, -17.19, 1, .82], [5.12, 18.01, 25.78, 1, .96], [-10.25, 11.01, -8.59, 1, .69], [-22.79, 5.14, 15.76, 1, .8], [-27.02, -6.1, -24.35, 1, .93], [-11, -11.81, 11.46, 1, .73], [3.17, -11.14, -4.3, 1, .62], [20.87, -10.86, 21.49, 1, .89], [0, 0, 0, 1.16, 1]],
            hx: [[7, 8, 0, .56, .69, .61, 5, 3], [-12, 3, 0, .57, .70, .62, 4, 5], [23, 13, 0, .65, .75, .70, -3, 3], [-26, -2, 0, .69, .78, .74, -1, 5], [28, 18, 0, .80, .86, .85, -6, 1], [-27, -7, 0, .85, .89, .90, 2, 4], [22, -22, 0, .91, .94, .96, -5, -1], [19, 23, 0, .94, .96, .99, -5, -2], [-14, -12, 0, .97, .98, 1.02, 4, 2], [6, -17, 0, 1, 1, 1.05, 2, -3], [0, 28, 0, 1, 1, 1.05, 5, -2]],
            sl: [[51, 0, 0, .61, .34], [34, 0, 0, .74, .56], [17, 0, 0, .87, .78], [0, 0, 0, 1, 1], [-17, 0, 0, .87, .78], [-34, 0, 0, .74, .56], [-51, 0, 0, .61, .34]],
            rd: [[36, 0, 90, 1, 1], [29.12, 14.11, 126, 1, .9], [11.12, 22.83, 162, 1, .65], [-11.12, 22.83, 198, 1, .65], [-29.12, 14.11, 234, 1, .9], [-36, 0, 270, 1, 1], [-29.12, -14.11, 306, 1, .9], [-11.12, -22.83, 342, 1, .65], [11.12, -22.83, 378, 1, .65], [29.12, -14.11, 414, 1, .9]],
            wb: [[-44, .47, -20.63, .7, .82], [-33, -5.4, -15.47, .78, .87], [-22, -8, -10.31, .85, .91], [-11, -5.74, -5.16, .93, .96], [0, 0, 0, 1, 1], [11, 5.74, 5.16, .93, .96], [22, 8, 10.31, .85, .91], [33, 5.4, 15.47, .78, .87], [44, -.47, 20.63, .7, .82]],
            sn: [[21, -14.4, 12.03, .64, .34], [17.5, -12, 10.03, .7, .45], [14, -9.6, 8.02, .76, .56], [10.5, -7.2, 6.02, .82, .67], [7, -4.8, 4.01, .88, .78], [3.5, -2.4, 2.01, .94, .89], [0, 0, 0, 1, 1]],
            ap: [[-33, -18, 2, .72, .62], [-20, -13, 14, .82, .74], [-6, -2, 34, .94, .9], [9, 12, 47, 1.04, 1], [28, 21, 10, .88, .8]]
        };
        return (coords[key] || coords.sl).map(function(c) {
            return "<i style=\"--x:" + c[0] + "px;--y:" + c[1] + "px;--r:" + c[2] + "deg;--s:" + c[3] + ";--o:" + c[4] + ";--s2:" + (c[5] || 1) + ";--mx:" + (c[6] || 0) + "px;--my:" + (c[7] || 0) + "px;\"></i>";
        }).join("");
    }

    function getCarouselProNativeSettings(style) {
        const key = String(style && (style.custom || style.preset) || "");
        const settings = {
            distance: 420,
            depth: 620,
            rotation: 0,
            wave: 0,
            scale: 35,
            tilt: 0,
            speed: 0,
            direction: 1,
            floating: 0
        };
        if (/ring3d/i.test(key)) { settings.distance = 700; settings.depth = 400; settings.rotation = 0; settings.scale = 35; settings.speed = 0; }
        if (/billboardArc/i.test(key)) { settings.distance = 370; settings.depth = 300; settings.rotation = 0; settings.scale = 18; settings.speed = 0; }
        if (/ringOrbit/i.test(key)) { settings.distance = 370; settings.depth = 300; settings.rotation = 0; settings.scale = 16; settings.speed = 0; }
        if (/posterBurst/i.test(key)) { settings.distance = 370; settings.depth = 300; settings.rotation = 0; settings.scale = 18; settings.speed = 0; }
        if (/cardTunnel/i.test(key)) { settings.distance = 300; settings.depth = 900; settings.rotation = -18; settings.scale = 38; }
        if (/orbitCarousel/i.test(key)) { settings.distance = 360; settings.depth = 580; settings.scale = 36; }
        if (/vortexSpin/i.test(key)) { settings.distance = 370; settings.depth = 760; settings.rotation = 0; settings.scale = 16; settings.speed = 55; }
        if (/focusSlider/i.test(key)) { settings.distance = 370; settings.depth = 300; settings.rotation = 0; settings.scale = 16; settings.speed = 0; }
        if (/photoOrbit/i.test(key)) { settings.distance = 370; settings.depth = 300; settings.rotation = 0; settings.scale = 16; settings.speed = 0; }
        if (/sphereWall/i.test(key)) { settings.distance = 370; settings.depth = 300; settings.rotation = 0; settings.scale = 16; settings.speed = 0; }
        if (/cascadeDeck/i.test(key)) { settings.distance = 370; settings.depth = 300; settings.rotation = 0; settings.scale = 16; settings.speed = 0; }
        if (/alongPath/i.test(key)) {
            settings.distance = 602;
            settings.depth = 412;
            settings.rotation = 170;
            settings.wave = 146;
            settings.speed = 55;
            settings.scale = 16;
            settings.tilt = -24;
            settings.direction = 1;
            settings.floating = 0;
        }
        return settings;
    }

    function buildCarouselProStyle(style) {
        if (!style) return;
        document.querySelectorAll("[data-cp-style]").forEach(function(button) {
            button.classList.toggle("is-active", button.getAttribute("data-cp-style") === style.id);
        });
        setCarouselProStatus("building " + style.name + "...", false);
        const preset = style.custom || style.preset || "orbitCarousel";
        const settingsJson = JSON.stringify(getCarouselProNativeSettings(style));
        csInterface.evalScript("toolkit.applyCarouselPreset('" + escapeScriptString(preset) + "', '" + escapeScriptString(settingsJson) + "')", function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setCarouselProStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : (style.name + " failed"), true);
                return;
            }
            setCarouselProStatus(style.name + " ready", false);
        });
    }

    function initCarouselProPanel() {
        const grid = document.getElementById("kwvCarouselProGrid");
        if (!grid || grid.__kwvCpBound) return;
        grid.__kwvCpBound = true;
        grid.innerHTML = carouselProStyles.map(function(style) {
            return "<button class=\"carouselpro-card\" type=\"button\" data-cp-style=\"" + style.id + "\" data-cp-key=\"" + style.key + "\">" +
                carouselProPreviewHtml(style.key) + "<span>" + style.name + "</span></button>";
        }).join("");
        grid.addEventListener("click", function(evt) {
            const button = evt.target && evt.target.closest ? evt.target.closest("[data-cp-style]") : null;
            if (!button) return;
            evt.preventDefault();
            const id = button.getAttribute("data-cp-style");
            const style = carouselProStyles.filter(function(item) { return item.id === id; })[0];
            buildCarouselProStyle(style);
        });
        setCarouselProStatus("ready", false);
    }

    function setAppleStatus(message, isError) {
        const status = document.getElementById("appleStatus");
        if (!status) return;
        status.textContent = message;
        status.style.color = isError ? "#ff6b6b" : "#8f8f8f";
    }

    function setAutoCaptionStatus(message, isError) {
        const status = document.getElementById("autoCaptionStatus");
        if (!status) return;
        status.textContent = message;
        status.style.color = isError ? "#ff6b6b" : "#7f7f7f";
    }

    let srtModeAnimating = false;
    let activeSrtMode = "manual";
    let autoCaptionDraft = [];
    let autoCaptionEditing = false;
    let autoCaptionAddRun = null;

    function setSrtApiModalOpen(isOpen) {
        const overlay = document.getElementById("srtApiModal");
        if (!overlay) return;
        overlay.classList.toggle("active", !!isOpen);
        overlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
        if (isOpen) {
            const input = document.getElementById("srtApiKeyInput");
            if (input) {
                input.focus();
                input.select();
            }
        }
    }

    function setSrtApiModalStatus(message, isError) {
        const status = document.getElementById("srtApiModalStatus");
        if (!status) return;
        status.textContent = message;
        status.style.color = isError ? "#ff6b6b" : "#7f7f7f";
    }

    function openSrtApiModal() {
        const input = document.getElementById("srtApiKeyInput");
        if (input) input.value = "";
        setSrtApiModalStatus("You can replace the saved key or paste a new key.", false);
        csInterface.evalScript("toolkit.getAutoCaptionApiKey()", function(res) {
            if (input && res && res.indexOf("error::") !== 0) {
                input.value = res;
                setSrtApiModalStatus(res ? "Existing key loaded. Replace it if you want to update it." : "Paste a new key, then save it.", false);
            }
            setSrtApiModalOpen(true);
        });
    }

    function closeSrtApiModal() {
        setSrtApiModalOpen(false);
    }

    function setSrtMode(mode, shouldAnimate) {
        const safeMode = mode === "auto" ? "auto" : "manual";
        document.querySelectorAll("[data-srt-mode]").forEach((button) => {
            button.classList.toggle("active", button.getAttribute("data-srt-mode") === safeMode);
        });
        if (safeMode === activeSrtMode && shouldAnimate !== false) return;

        const stack = document.querySelector(".srt-stack");
        const manualPane = document.getElementById("srtModePaneManual");
        const autoPane = document.getElementById("srtModePaneAuto");
        const nextPane = safeMode === "auto" ? autoPane : manualPane;
        const currentPane = safeMode === "auto" ? manualPane : autoPane;
        if (!stack || !manualPane || !autoPane || !nextPane || !currentPane) {
            if (manualPane) manualPane.classList.toggle("active", safeMode === "manual");
            if (autoPane) autoPane.classList.toggle("active", safeMode === "auto");
            activeSrtMode = safeMode;
            return;
        }
        if (shouldAnimate === false || srtModeAnimating || !currentPane.classList.contains("active")) {
            manualPane.classList.toggle("active", safeMode === "manual");
            autoPane.classList.toggle("active", safeMode === "auto");
            activeSrtMode = safeMode;
            return;
        }

        srtModeAnimating = true;
        const currentHeight = currentPane.offsetHeight;
        stack.style.height = currentHeight + "px";
        stack.classList.add("is-animating");
        nextPane.classList.add("measure");
        const targetHeight = nextPane.offsetHeight;
        nextPane.classList.remove("measure");

        void stack.offsetHeight;
        currentPane.classList.remove("active");
        nextPane.classList.add("animating-in");
        nextPane.classList.add("active");
        stack.style.height = targetHeight + "px";

        window.setTimeout(() => {
            nextPane.classList.remove("animating-in");
            stack.classList.remove("is-animating");
            stack.style.height = "";
            activeSrtMode = safeMode;
            srtModeAnimating = false;
        }, 240);
    }

    function loadAutoCaptionPrefs() {
        csInterface.evalScript("toolkit.getAutoCaptionPrefs()", function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setAutoCaptionStatus("Set the API key, select a clip, then generate captions.", false);
                return;
            }
            try {
                const data = JSON.parse(res);
                setAutoCaptionStatus(data && data.apiConfigured ? "API key saved. Ready to generate." : "Set the API key, then generate captions.", false);
            } catch (err) {
                setAutoCaptionStatus("Auto caption settings could not be loaded.", true);
            }
        });
    }

    function initAutoCaptionNewControls() {
        const languageSelect = document.getElementById("autoCaptionLanguage");
        if (languageSelect && !languageSelect.value) languageSelect.value = "hinglish";
        const languageCustom = document.getElementById("autoCaptionLanguageCustom");
        if (languageSelect && languageCustom && !languageCustom.__kwvBound) {
            languageCustom.__kwvBound = true;
            const trigger = languageCustom.querySelector(".kwv-custom-select-trigger");
            const valueLabel = languageCustom.querySelector(".kwv-custom-select-value");
            const menu = languageCustom.querySelector(".kwv-custom-select-menu");
            const syncLanguageLabel = () => {
                const selected = languageSelect.options[languageSelect.selectedIndex];
                if (valueLabel) valueLabel.textContent = selected ? selected.textContent : "Hinglish";
                if (menu) {
                    menu.querySelectorAll("[data-value]").forEach((item) => {
                        item.classList.toggle("active", item.getAttribute("data-value") === languageSelect.value);
                    });
                }
            };
            const closeLanguageMenu = () => {
                languageCustom.classList.remove("open");
                if (trigger) trigger.setAttribute("aria-expanded", "false");
            };
            if (menu) {
                menu.innerHTML = "";
                Array.prototype.forEach.call(languageSelect.options, (option) => {
                    const item = document.createElement("button");
                    item.type = "button";
                    item.className = "kwv-custom-select-option";
                    item.setAttribute("role", "option");
                    item.setAttribute("data-value", option.value);
                    item.textContent = option.textContent;
                    item.onclick = () => {
                        languageSelect.value = option.value;
                        languageSelect.dispatchEvent(new Event("change", { bubbles: true }));
                        syncLanguageLabel();
                        closeLanguageMenu();
                    };
                    menu.appendChild(item);
                });
            }
            if (trigger) {
                trigger.onclick = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const open = languageCustom.classList.toggle("open");
                    trigger.setAttribute("aria-expanded", open ? "true" : "false");
                    syncLanguageLabel();
                };
            }
            languageSelect.onchange = syncLanguageLabel;
            document.addEventListener("click", (event) => {
                if (!languageCustom.contains(event.target)) closeLanguageMenu();
            });
            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape") closeLanguageMenu();
            });
            syncLanguageLabel();
        }
        const modeInput = document.getElementById("autoCaptionMode");
        const wordsWrap = document.getElementById("autoWordsPerCaptionWrap");
        document.querySelectorAll("[data-auto-mode]").forEach((button) => {
            button.onclick = () => {
                const mode = button.getAttribute("data-auto-mode") || "phrase";
                document.querySelectorAll("[data-auto-mode]").forEach((item) => item.classList.toggle("active", item === button));
                if (modeInput) modeInput.value = mode;
                if (wordsWrap) wordsWrap.classList.toggle("visible", mode === "phrase");
            };
        });
        const wordsSlider = document.getElementById("autoWordsPerCaption");
        const wordsValue = document.getElementById("autoWordsPerCaptionValue");
        if (wordsSlider && wordsValue) {
            const syncWordsValue = () => {
                const min = parseFloat(wordsSlider.min || "0");
                const max = parseFloat(wordsSlider.max || "100");
                const value = parseFloat(wordsSlider.value || "4");
                const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
                wordsValue.textContent = String(wordsSlider.value || "4");
                wordsSlider.style.background = "linear-gradient(90deg, var(--kwv-accent, #ff0000) 0%, var(--kwv-accent, #ff0000) " + pct + "%, #1f1f1f " + pct + "%, #1f1f1f 100%)";
            };
            wordsSlider.oninput = syncWordsValue;
            syncWordsValue();
        }
        document.querySelectorAll("[data-auto-color]").forEach((button) => {
            button.onclick = () => {
                document.querySelectorAll("[data-auto-color]").forEach((item) => item.classList.toggle("active", item === button));
                const input = document.getElementById("autoTextColor");
                if (input) input.value = button.getAttribute("data-auto-color") || "#FFFFFF";
            };
        });
        if (window.KWVCaptionStyleEngine && window.KWVCaptionStyleEngine.init) {
            window.KWVCaptionStyleEngine.init();
        }
        if (wordsWrap && modeInput) wordsWrap.classList.toggle("visible", modeInput.value === "phrase");
    }

    function getAutoCaptionOptions() {
        const read = (id, fallback) => {
            const el = document.getElementById(id);
            return el ? String(el.value || fallback || "") : String(fallback || "");
        };
        const wordsPerCaption = Math.max(1, parseInt(read("autoWordsPerCaption", "4"), 10) || 4);
        return {
            maxChars: Math.max(8, wordsPerCaption * 12),
            wordsPerCaption: wordsPerCaption,
            language: read("autoCaptionLanguage", "hinglish") || "hinglish",
            mode: read("autoCaptionMode", "phrase"),
            scope: "selected",
            fontSize: parseInt(read("autoFontSize", "60").replace(/[^\d-]/g, ""), 10) || 60,
            position: read("autoPosition", "bottom"),
            textColor: read("autoTextColor", "#FFFFFF"),
            animation: read("autoCaptionAnimation", "pop")
        };
    }

    function getAutoCaptionStyleConfig() {
        if (window.KWVCaptionStyleEngine && window.KWVCaptionStyleEngine.collect) {
            return window.KWVCaptionStyleEngine.collect();
        }
        return { mode: "normal" };
    }

    function writeAutoCaptionPayloadFile(payload) {
        try {
            if (typeof require !== "function") return "";
            const fs = require("fs");
            const os = require("os");
            const path = require("path");
            const dir = path.join(os.tmpdir(), "keshav-with-velo");
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const filePath = path.join(dir, "auto-caption-style-" + Date.now() + "-" + Math.floor(Math.random() * 100000) + ".json");
            fs.writeFileSync(filePath, JSON.stringify(payload), "utf8");
            return filePath;
        } catch (err) {
            console.warn("[Keshav Velo] Auto caption temp payload failed:", err);
            return "";
        }
    }

    function getAutoCaptionTempDir() {
        if (typeof require !== "function") return "";
        const fs = require("fs");
        const os = require("os");
        const path = require("path");
        const dir = path.join(os.tmpdir(), "keshav-with-velo");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    function createAutoCaptionCancelPath() {
        try {
            if (typeof require !== "function") return "";
            const path = require("path");
            const dir = getAutoCaptionTempDir();
            if (!dir) return "";
            return path.join(dir, "auto-caption-cancel-" + Date.now() + "-" + Math.floor(Math.random() * 100000) + ".flag");
        } catch (err) {
            return "";
        }
    }

    function cleanupAutoCaptionFile(filePath) {
        try {
            if (!filePath || typeof require !== "function") return;
            const fs = require("fs");
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {}
    }

    function requestAutoCaptionAddCancel() {
        if (!autoCaptionAddRun || !autoCaptionAddRun.active || autoCaptionAddRun.cancelled) return;
        autoCaptionAddRun.cancelled = true;
        try {
            if (autoCaptionAddRun.cancelPath && typeof require === "function") {
                const fs = require("fs");
                fs.writeFileSync(autoCaptionAddRun.cancelPath, "cancel", "utf8");
            }
        } catch (err) {}
        setAutoCaptionStatus("Cancelling auto caption add...", false);
    }

    function setAutoCaptionAddButtonBusy(isBusy) {
        const btn = document.getElementById("btnAutoAddToComp");
        if (!btn) return;
        btn.textContent = isBusy ? "Cancel" : "Add to Comp";
        btn.classList.toggle("accent", !!isBusy);
    }

    function finishAutoCaptionAddCancel(tempPath, cancelPath) {
        const runId = autoCaptionAddRun && autoCaptionAddRun.runId ? autoCaptionAddRun.runId : "";
        if (autoCaptionAddRun) autoCaptionAddRun.active = false;
        setAutoCaptionAddButtonBusy(false);
        cleanupAutoCaptionFile(cancelPath);
        cleanupAutoCaptionFile(tempPath);
        if (runId) {
            csInterface.evalScript("toolkit.deleteAutoCaptionRun('" + escapeScriptString(runId) + "')", function() {
                setAutoCaptionStatus("Auto caption add cancelled.", false);
            });
            return;
        }
        setAutoCaptionStatus("Auto caption add cancelled.", false);
    }

    function runAutoCaptionAddBatch(tempPath, cancelPath, index, total, createdTotal) {
        if (!autoCaptionAddRun || !autoCaptionAddRun.active) return;
        if (autoCaptionAddRun.cancelled) {
            finishAutoCaptionAddCancel(tempPath, cancelPath);
            return;
        }
        const batchSize = 1;
        const safePath = escapeScriptString(tempPath.replace(/\\/g, "/"));
        csInterface.evalScript("toolkit.createAutoCaptionLayersFromFileBatch('" + safePath + "', " + index + ", " + batchSize + ")", function(res) {
            if (!autoCaptionAddRun || !autoCaptionAddRun.active) return;
            if (!res || res.indexOf("error::") === 0) {
                autoCaptionAddRun.active = false;
                setAutoCaptionAddButtonBusy(false);
                cleanupAutoCaptionFile(cancelPath);
                cleanupAutoCaptionFile(tempPath);
                setAutoCaptionStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Add to Comp failed.", true);
                return;
            }
            if (res.indexOf("cancelled::") === 0) {
                autoCaptionAddRun.active = false;
                setAutoCaptionAddButtonBusy(false);
                cleanupAutoCaptionFile(cancelPath);
                cleanupAutoCaptionFile(tempPath);
                setAutoCaptionStatus(res.substring(11), false);
                return;
            }
            let payload = null;
            try {
                payload = JSON.parse(res.indexOf("success::") === 0 ? res.substring(9) : res);
            } catch (err) {
                autoCaptionAddRun.active = false;
                setAutoCaptionAddButtonBusy(false);
                cleanupAutoCaptionFile(cancelPath);
                cleanupAutoCaptionFile(tempPath);
                setAutoCaptionStatus("Add to Comp response parse failed.", true);
                return;
            }
            const nextIndex = payload && typeof payload.nextIndex === "number" ? payload.nextIndex : index + batchSize;
            const nextCreated = createdTotal + (payload && payload.created ? payload.created : 0);
            if (payload && payload.done) {
                autoCaptionAddRun.active = false;
                setAutoCaptionAddButtonBusy(false);
                cleanupAutoCaptionFile(cancelPath);
                cleanupAutoCaptionFile(tempPath);
                setAutoCaptionStatus("Added " + nextCreated + " caption layer(s) to comp.", false);
                return;
            }
            setAutoCaptionStatus("Adding captions to comp... " + nextIndex + "/" + total + "  Press Esc to cancel.", false);
            window.setTimeout(function() {
                runAutoCaptionAddBatch(tempPath, cancelPath, nextIndex, total, nextCreated);
            }, 10);
        });
    }

    function addAutoCaptionsToCompWithStyle(options) {
        syncAutoCaptionEdits();
        if (activeSrtMode === "manual") {
            const manualAnim = document.getElementById("srt-anim");
            if (manualAnim && manualAnim.value) options.animation = manualAnim.value;
        }
        const style = getAutoCaptionStyleConfig();
        let captions = autoCaptionDraft;
        if (style && style.applyTo === "current") captions = autoCaptionDraft.length ? [autoCaptionDraft[0]] : [];
        if (style && style.applyTo === "selected") {
            const selected = [];
            document.querySelectorAll("#autoTranscriptList .kwv-auto-transcript-row.selected").forEach((row) => {
                const index = parseInt(row.getAttribute("data-index") || "-1", 10);
                if (index >= 0 && autoCaptionDraft[index]) selected.push(autoCaptionDraft[index]);
            });
            captions = selected.length ? selected : autoCaptionDraft;
        }
        const cancelPath = createAutoCaptionCancelPath();
        const runId = "run-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
        autoCaptionAddRun = { active: true, cancelled: false, cancelPath: cancelPath, runId: runId };
        setAutoCaptionAddButtonBusy(true);
        const payload = { options: options, captions: captions, style: style, cancelPath: cancelPath, runId: runId };
        const tempPath = writeAutoCaptionPayloadFile(payload);
        setAutoCaptionStatus("Adding captions to comp... Press Esc to cancel.", false);
        if (tempPath) {
            runAutoCaptionAddBatch(tempPath, cancelPath, 0, captions.length, 0);
            return;
        }
        csInterface.evalScript(`toolkit.createAutoCaptionLayersFromJson('${escapeScriptString(JSON.stringify(payload))}')`, function(res) {
            if (autoCaptionAddRun) autoCaptionAddRun.active = false;
            setAutoCaptionAddButtonBusy(false);
            cleanupAutoCaptionFile(cancelPath);
            if (!res || res.indexOf("error::") === 0) {
                setAutoCaptionStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Add to Comp failed.", true);
                return;
            }
            if (res.indexOf("cancelled::") === 0) {
                setAutoCaptionStatus(res.substring(11), false);
                return;
            }
            setAutoCaptionStatus(res.indexOf("success::") === 0 ? res.substring(9) : res, false);
        });
    }

    function formatAutoCaptionTime(seconds) {
        const safe = Math.max(0, Number(seconds) || 0);
        const m = Math.floor(safe / 60);
        const s = Math.floor(safe % 60);
        return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function formatSrtTime(seconds) {
        const safe = Math.max(0, Number(seconds) || 0);
        const h = Math.floor(safe / 3600);
        const m = Math.floor((safe % 3600) / 60);
        const s = Math.floor(safe % 60);
        const ms = Math.round((safe - Math.floor(safe)) * 1000);
        const pad = (value, size) => {
            let out = String(value);
            while (out.length < size) out = "0" + out;
            return out;
        };
        return pad(h, 2) + ":" + pad(m, 2) + ":" + pad(s, 2) + "," + pad(ms, 3);
    }

    function parseSrtTimestamp(value) {
        const text = String(value || "").trim();
        const match = text.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
        if (!match) return NaN;
        const hours = parseInt(match[1], 10) || 0;
        const minutes = parseInt(match[2], 10) || 0;
        const seconds = parseInt(match[3], 10) || 0;
        const millis = parseInt((match[4] || "0").padEnd(3, "0").slice(0, 3), 10) || 0;
        return (hours * 3600) + (minutes * 60) + seconds + (millis / 1000);
    }

    function parseImportedSrtContent(content) {
        const normalized = String(content || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
        if (!normalized) return [];
        const blocks = normalized.split(/\n\s*\n+/);
        const captions = [];
        blocks.forEach((block) => {
            const lines = block.split("\n").map((line) => line.trim()).filter((line) => line !== "");
            if (!lines.length) return;
            let timeIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].indexOf("-->") !== -1) {
                    timeIndex = i;
                    break;
                }
            }
            if (timeIndex === -1) return;
            const timing = lines[timeIndex].split("-->");
            if (timing.length < 2) return;
            const inPoint = parseSrtTimestamp(timing[0]);
            const outPoint = parseSrtTimestamp(timing[1]);
            if (!isFinite(inPoint) || !isFinite(outPoint) || outPoint <= inPoint) return;
            const text = lines.slice(timeIndex + 1).join(" ").replace(/\s+/g, " ").trim();
            if (!text) return;
            captions.push({ inPoint: inPoint, outPoint: outPoint, text: text });
        });
        return captions;
    }

    function readTextFileFromPath(path) {
        const normalizedPath = String(path || "");
        if (!normalizedPath) return "";
        try {
            if (typeof require === "function") {
                const fs = require("fs");
                return fs.readFileSync(normalizedPath, "utf8");
            }
        } catch (err) {}
        try {
            if (window.cep && window.cep.fs && typeof window.cep.fs.readFile === "function") {
                const result = window.cep.fs.readFile(normalizedPath);
                if (result && result.err === 0) return String(result.data || "");
            }
        } catch (err2) {}
        return "";
    }

    function importSrtIntoTranscript(path) {
        if (!path) return;
        const content = readTextFileFromPath(path);
        if (!content) {
            setAutoCaptionStatus("SRT file could not be read.", true);
            return;
        }
        const captions = parseImportedSrtContent(content);
        if (!captions.length) {
            setAutoCaptionStatus("SRT file parse failed or no captions found.", true);
            return;
        }
        autoCaptionDraft = captions;
        autoCaptionEditing = false;
        renderAutoCaptionDraft();
        setSrtMode("manual", false);
        setAutoCaptionStatus(captions.length + " captions loaded in transcript. Edit or Add to Comp.", false);
    }

    function syncAutoCaptionEdits() {
        const rows = document.querySelectorAll("#autoTranscriptList .kwv-auto-transcript-row");
        rows.forEach((row, index) => {
            if (!autoCaptionDraft[index]) return;
            const text = row.querySelector(".kwv-auto-transcript-text");
            if (text) autoCaptionDraft[index].text = text.textContent.trim();
        });
    }

    function renderAutoCaptionDraft() {
        const list = document.getElementById("autoTranscriptList");
        const addBtn = document.getElementById("btnAutoAddToComp");
        const editBtn = document.getElementById("btnAutoEditTranscript");
        const srtBtn = document.getElementById("btnAutoDownloadSrt");
        const count = document.getElementById("autoCaptionCount");
        if (!list) return;
        list.classList.toggle("editing", autoCaptionEditing);
        list.innerHTML = "";
        if (!autoCaptionDraft.length) {
            list.innerHTML = '<div class="kwv-auto-transcript-empty">Import or generate captions to preview transcript here.</div>';
        } else {
            autoCaptionDraft.forEach((cap, index) => {
                const row = document.createElement("div");
                row.className = "kwv-auto-transcript-row";
                row.dataset.index = String(index);
                row.onclick = (event) => {
                    if (autoCaptionEditing) return;
                    event.preventDefault();
                    row.classList.toggle("selected");
                    if (window.KWVCaptionStyleEngine && window.KWVCaptionStyleEngine.updatePreview) {
                        window.__kwvCaptionPreviewText = autoCaptionDraft[index] ? autoCaptionDraft[index].text || "" : "";
                        window.KWVCaptionStyleEngine.updatePreview(window.__kwvCaptionPreviewText);
                    }
                };
                const time = document.createElement("span");
                time.className = "kwv-auto-transcript-time";
                time.textContent = formatAutoCaptionTime(cap.inPoint);
                const text = document.createElement("span");
                text.className = "kwv-auto-transcript-text";
                text.textContent = cap.text || "";
                if (autoCaptionEditing) text.contentEditable = "true";
                row.appendChild(time);
                row.appendChild(text);
                list.appendChild(row);
            });
        }
        if (addBtn) addBtn.disabled = autoCaptionDraft.length === 0;
        if (editBtn) {
            editBtn.disabled = autoCaptionDraft.length === 0;
            editBtn.textContent = autoCaptionEditing ? "Done" : "Edit";
        }
        if (srtBtn) srtBtn.disabled = autoCaptionDraft.length === 0;
        if (count) count.textContent = autoCaptionDraft.length + " captions";
        if (autoCaptionDraft.length && window.KWVCaptionStyleEngine && window.KWVCaptionStyleEngine.updatePreview) {
            window.__kwvCaptionPreviewText = autoCaptionDraft[0].text || "";
            window.KWVCaptionStyleEngine.updatePreview(window.__kwvCaptionPreviewText);
        }
    }

    function buildAutoCaptionSrt() {
        syncAutoCaptionEdits();
        return autoCaptionDraft.map((cap, index) => {
            return (index + 1) + "\n" + formatSrtTime(cap.inPoint) + " --> " + formatSrtTime(cap.outPoint) + "\n" + (cap.text || "") + "\n";
        }).join("\n");
    }

    function downloadAutoCaptionSrt() {
        if (!autoCaptionDraft.length) return;
        const content = buildAutoCaptionSrt();
        setAutoCaptionStatus("Saving SRT...", false);
        csInterface.evalScript(`toolkit.saveAutoCaptionSrt('${escapeScriptString(content)}')`, function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setAutoCaptionStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "SRT save failed.", true);
                return;
            }
            setAutoCaptionStatus(res.indexOf("success::") === 0 ? res.substring(9) : res, false);
        });
    }

    function initSrtModeSwitch() {
        const manualBtn = document.getElementById("btnSrtModeManual");
        const autoBtn = document.getElementById("btnSrtModeAuto");
        if (manualBtn) manualBtn.onclick = () => setSrtMode("manual", true);
        if (autoBtn) autoBtn.onclick = () => {
            setSrtMode("auto", true);
            loadAutoCaptionPrefs();
        };
    }

    function initSrtApiModal() {
        const overlay = document.getElementById("srtApiModal");
        const closeBtn = document.getElementById("btnSrtApiModalClose");
        const cancelBtn = document.getElementById("btnSrtApiModalCancel");
        const saveBtn = document.getElementById("btnSrtApiModalSave");
        const input = document.getElementById("srtApiKeyInput");
        if (closeBtn) closeBtn.onclick = closeSrtApiModal;
        if (cancelBtn) cancelBtn.onclick = closeSrtApiModal;
        if (overlay) {
            overlay.onclick = (evt) => {
                if (evt.target === overlay) closeSrtApiModal();
            };
        }
        if (input) {
            input.onkeydown = (evt) => {
                if (evt.key === "Escape") {
                    closeSrtApiModal();
                    return;
                }
                if (evt.key === "Enter" && saveBtn) saveBtn.click();
            };
        }
        if (saveBtn) {
            saveBtn.onclick = () => {
                const nextKey = input ? input.value : "";
                setSrtApiModalStatus("Saving API key...", false);
                csInterface.evalScript(`toolkit.saveAutoCaptionApiKey('${escapeScriptString(nextKey)}')`, function(res) {
                    if (!res || res.indexOf("error::") === 0) {
                        setSrtApiModalStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "API key was not saved.", true);
                        return;
                    }
                    setSrtApiModalStatus("API key saved. Auto caption ready.", false);
                    loadAutoCaptionPrefs();
                    window.setTimeout(closeSrtApiModal, 180);
                });
            };
        }
    }

    function buildAiHubDefaultState() {
        const provider = aiHubProviders[0];
        const providers = {};
        providers[provider.id] = {
            apiKey: "",
            model: provider.model || "",
            baseUrl: provider.baseUrl || ""
        };
        return {
            activeProviderId: provider.id,
            providers: providers
        };
    }

    function getAiHubProviderMeta(providerId) {
        return aiHubProviders[0];
    }

    function loadAiHubState() {
        const fallback = buildAiHubDefaultState();
        try {
            let raw = readAiHubStorageFileData();
            let fromLegacy = false;
            if (!raw) {
                raw = window.localStorage ? window.localStorage.getItem(aiHubStorageKey) : "";
                fromLegacy = !!raw;
            }
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") return fallback;
            const merged = buildAiHubDefaultState();
            merged.activeProviderId = parsed.activeProviderId && merged.providers[parsed.activeProviderId] ? parsed.activeProviderId : fallback.activeProviderId;
            if (parsed.providers && typeof parsed.providers === "object") {
                Object.keys(merged.providers).forEach((providerId) => {
                    const source = parsed.providers[providerId];
                    if (!source || typeof source !== "object") return;
                    merged.providers[providerId] = {
                        apiKey: String(source.apiKey || ""),
                        model: String(source.model || merged.providers[providerId].model || ""),
                        baseUrl: String(source.baseUrl || merged.providers[providerId].baseUrl || "")
                    };
                });
            }
            if (fromLegacy) persistAiHubStateToFile(merged);
            return merged;
        } catch (err) {
            return fallback;
        }
    }

    function persistAiHubState() {
        let saved = false;
        try {
            if (window.localStorage) window.localStorage.setItem(aiHubStorageKey, JSON.stringify(aiHubState));
            saved = true;
        } catch (err) {
        }
        saved = persistAiHubStateToFile(aiHubState) || saved;
        return saved;
    }

    function aiHubTrim(value) {
        return String(value == null ? "" : value).replace(/^\s+|\s+$/g, "");
    }

    function setAiHubStatus(message, isError) {
        const status = document.getElementById("aiHubStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("error", !!isError);
    }

    function requestKwvThemeRepaint() {
        if (typeof window.kwvForceThemeRepaint !== "function") return;
        window.kwvForceThemeRepaint();
        window.setTimeout(window.kwvForceThemeRepaint, 60);
        window.setTimeout(window.kwvForceThemeRepaint, 220);
    }

    function setAiHubModalOpen(isOpen) {
        const overlay = document.getElementById("aiHubModal");
        const button = document.getElementById("btnAiHub");
        if (!overlay) return;
        overlay.classList.toggle("active", !!isOpen);
        overlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
        document.body.classList.toggle("kwv-ai-hub-open", !!isOpen);
        if (button) button.classList.toggle("active", !!isOpen);
        if (isOpen) {
            if (typeof setStickyNotesOpen === "function") setStickyNotesOpen(false);
            const input = document.getElementById("aiHubPromptInput");
            if (input) input.focus();
            requestKwvThemeRepaint();
        }
    }

    function setAiHubSettingsOpen(isOpen) {
        aiHubRuntime.settingsOpen = !!isOpen;
        const panel = document.getElementById("aiHubSettingsPanel");
        if (!panel) return;
        panel.classList.toggle("active", !!isOpen);
        panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
        if (isOpen) {
            const input = document.getElementById("btnAiHubSave");
            if (input) input.focus();
        } else {
            const prompt = document.getElementById("aiHubPromptInput");
            if (prompt) prompt.focus();
        }
    }

    function setAiHubMode(mode) {
        aiHubRuntime.activeMode = "search";
        if (aiHubRuntime.settingsOpen) {
            setAiHubSettingsOpen(false);
        }
        const chatBtn = document.getElementById("btnAiHubChatTab");
        const searchBtn = document.getElementById("btnAiHubSearchTab");
        const chatView = document.getElementById("aiHubChatView");
        const searchView = document.getElementById("aiHubSearchView");
        const modal = document.getElementById("aiHubModal");
        if (modal) modal.classList.toggle("search-mode", aiHubRuntime.activeMode === "search");
        if (chatBtn) {
            chatBtn.classList.toggle("active", aiHubRuntime.activeMode === "chat");
            chatBtn.setAttribute("aria-selected", aiHubRuntime.activeMode === "chat" ? "true" : "false");
        }
        if (searchBtn) {
            searchBtn.classList.toggle("active", aiHubRuntime.activeMode === "search");
            searchBtn.setAttribute("aria-selected", aiHubRuntime.activeMode === "search" ? "true" : "false");
        }
        if (chatView) chatView.classList.toggle("active", aiHubRuntime.activeMode === "chat");
        if (searchView) searchView.classList.toggle("active", aiHubRuntime.activeMode === "search");
        const input = document.getElementById("aiSearchInput");
        if (input) window.setTimeout(() => input.focus(), 40);
        requestKwvThemeRepaint();
    }

    function setAiToolSection(section) {
        closeAutoCaptionLanguageMenu();
        const safeSection = section === "enhancer" ? "enhancer" : (section === "downloader" ? "downloader" : "google");
        const isDownloader = safeSection === "downloader";
        const isEnhancer = safeSection === "enhancer";
        const searchShell = document.getElementById("aiHubSearchView");
        const enhancerPanel = document.getElementById("aiEnhancerPanel");
        const downloaderPanel = document.getElementById("aiVideoDownloaderPanel");
        document.querySelectorAll("[data-ai-tool-section]").forEach((button) => {
            const active = (button.getAttribute("data-ai-tool-section") || "google") === safeSection;
            button.classList.toggle("active", active);
            button.setAttribute("aria-selected", active ? "true" : "false");
        });
        if (searchShell) {
            searchShell.classList.toggle("ai-enhancer-mode", isEnhancer);
            searchShell.classList.toggle("video-downloader-mode", isDownloader);
        }
        if (enhancerPanel) {
            enhancerPanel.classList.toggle("active", isEnhancer);
            enhancerPanel.setAttribute("aria-hidden", isEnhancer ? "false" : "true");
        }
        if (isEnhancer) {
            initAiEnhancerPanel();
        }
        if (downloaderPanel) {
            downloaderPanel.classList.toggle("active", isDownloader);
            downloaderPanel.setAttribute("aria-hidden", isDownloader ? "false" : "true");
        }
        const title = document.getElementById("aiHubModalTitle");
        if (title) title.textContent = isEnhancer ? "Keshav With Velo Enhancer" : (isDownloader ? "Keshav With Velo Downloader" : "Keshav With Velo Google");
        if (isEnhancer) {
            setAiHubStatus("Enhancer tools ready.", false);
        } else if (isDownloader) {
            updateVideoDownloaderPath();
            updateVideoDownloaderPreview();
            queueVideoDownloaderQualityUpdate();
            paintVideoDownloaderTrim();
            setVideoDownloaderStatus("Ready.", false);
            const input = document.getElementById("videoDownloaderUrl");
            if (input) window.setTimeout(() => input.focus(), 40);
        } else {
            setAiHubStatus("Google tools ready.", false);
            const input = document.getElementById("aiSearchInput");
            if (input) window.setTimeout(() => input.focus(), 40);
            if (!getActiveSearchTab()) openAiSearchHome(false);
        }
        requestKwvThemeRepaint();
    }

    function setVideoDownloaderStatus(message, isError) {
        if (videoDownloaderRuntime.cancelRequested && !/^(Cancelled\.|Ready\.)$/i.test(String(message || ""))) return;
        const status = document.getElementById("videoDownloaderStatus");
        if (status) {
            status.textContent = message || "";
            status.style.color = isError ? "#ff6b6b" : "#8c8c8c";
        }
        setAiHubStatus(message || "", !!isError);
    }

    function setVideoDownloaderImportVisible(isVisible) {
        const btn = document.getElementById("btnVideoDownloaderImport");
        if (!btn) return;
        btn.classList.toggle("ready", !!isVisible);
        btn.disabled = !isVisible;
    }

    function setVideoDownloaderDownloadedPath(filePath) {
        videoDownloaderRuntime.outputPath = String(filePath || "");
        setVideoDownloaderImportVisible(!!videoDownloaderRuntime.outputPath && !videoDownloaderRuntime.busy);
        if (videoDownloaderRuntime.outputPath) showVideoDownloaderDownloadedPreview(videoDownloaderRuntime.outputPath);
    }

    function isVideoDownloaderVideoFile(filePath) {
        return /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(String(filePath || "").split(/[?#]/)[0]);
    }

    function makeVideoDownloaderFileUrl(filePath) {
        const value = String(filePath || "");
        if (!value) return "";
        try {
            if (typeof require === "function") return require("url").pathToFileURL(value).href;
        } catch (err) {}
        return "file:///" + encodeURI(value.replace(/\\/g, "/")).replace(/#/g, "%23");
    }

    function showVideoDownloaderDownloadedPreview(filePath) {
        const shell = document.getElementById("videoDownloaderPreview");
        const thumb = document.getElementById("videoDownloaderThumb");
        const video = document.getElementById("videoDownloaderVideo");
        if (!shell) return;
        try {
            if (videoDownloaderRuntime.previewResolveProc) videoDownloaderRuntime.previewResolveProc.kill();
        } catch (err) {}
        videoDownloaderRuntime.previewResolveProc = null;
        if (thumb) thumb.removeAttribute("src");
        if (!isVideoDownloaderVideoFile(filePath)) {
            shell.classList.remove("has-video", "has-thumb");
            if (video) {
                try { video.pause(); } catch (err) {}
                video.removeAttribute("src");
                try { video.load(); } catch (err) {}
            }
            return;
        }
        setVideoDownloaderVideoPreview(makeVideoDownloaderFileUrl(filePath));
    }

    function setVideoDownloaderCookiePromptVisible(isVisible) {
        const card = document.querySelector("#aiVideoDownloaderPanel .video-downloader-card");
        const row = document.getElementById("videoDownloaderCookieRow");
        if (card) card.classList.toggle("needs-cookies", !!isVisible);
        if (row) row.setAttribute("aria-hidden", isVisible ? "false" : "true");
    }

    function formatVideoDownloaderTime(seconds) {
        let value = Math.max(0, Number(seconds) || 0);
        const hours = Math.floor(value / 3600);
        value -= hours * 3600;
        const minutes = Math.floor(value / 60);
        const wholeSeconds = Math.floor(value - minutes * 60);
        function pad(num) {
            return String(num).padStart(2, "0");
        }
        return pad(hours) + ":" + pad(minutes) + ":" + pad(wholeSeconds);
    }

    function parseVideoDownloaderTime(value) {
        const raw = String(value || "").trim();
        if (!raw) return null;
        if (/^\d+(?:\.\d+)?$/.test(raw)) return Math.max(0, parseFloat(raw));
        const parts = raw.split(":").map(function(part) { return String(part || "").trim(); });
        if (parts.length < 2 || parts.length > 3) return null;
        let total = 0;
        for (let i = 0; i < parts.length; i++) {
            if (!/^\d+(?:\.\d+)?$/.test(parts[i])) return null;
            total = total * 60 + parseFloat(parts[i]);
        }
        return Math.max(0, total);
    }

    function getVideoDownloaderTrimDuration() {
        const duration = Number(videoDownloaderRuntime.trimDuration) || 60;
        return Math.max(1, duration);
    }

    function getVideoDownloaderTrimRange() {
        const startEl = document.getElementById("videoDownloaderRangeStart");
        const endEl = document.getElementById("videoDownloaderRangeEnd");
        const startRaw = startEl ? String(startEl.value || "").trim() : "";
        const endRaw = endEl ? String(endEl.value || "").trim() : "";
        const start = parseVideoDownloaderTime(startRaw);
        const end = parseVideoDownloaderTime(endRaw);
        return {
            active: !!(startRaw || endRaw),
            start: start == null ? 0 : start,
            end: end == null ? 0 : end,
            hasStart: start != null,
            hasEnd: end != null
        };
    }

    function hasVideoDownloaderTrimRange() {
        const range = getVideoDownloaderTrimRange();
        return !!(range.active && (range.hasStart || range.hasEnd));
    }

    function paintVideoDownloaderTrim() {
        const startEl = document.getElementById("videoDownloaderRangeStart");
        const endEl = document.getElementById("videoDownloaderRangeEnd");
        const startSlider = document.getElementById("videoDownloaderTrimStart");
        const endSlider = document.getElementById("videoDownloaderTrimEnd");
        const fill = document.getElementById("videoDownloaderTrimFill");
        const startLabel = document.getElementById("videoDownloaderTrimStartLabel");
        const endLabel = document.getElementById("videoDownloaderTrimEndLabel");
        const durationLabel = document.getElementById("videoDownloaderTrimDurationLabel");
        const parsedStart = parseVideoDownloaderTime(startEl ? startEl.value : "");
        const parsedEnd = parseVideoDownloaderTime(endEl ? endEl.value : "");
        const max = Math.max(getVideoDownloaderTrimDuration(), parsedStart || 0, parsedEnd || 0, 1);
        let start = parsedStart || 0;
        let end = parsedEnd || max;
        start = Math.max(0, Math.min(max, start));
        end = Math.max(start, Math.min(max, end));
        if (startSlider) {
            startSlider.max = String(max);
            startSlider.value = String(start);
        }
        if (endSlider) {
            endSlider.max = String(max);
            endSlider.value = String(end);
        }
        if (fill) {
            fill.style.left = ((start / max) * 100) + "%";
            fill.style.right = (100 - ((end / max) * 100)) + "%";
        }
        if (startLabel) startLabel.textContent = formatVideoDownloaderTime(start);
        if (endLabel) endLabel.textContent = formatVideoDownloaderTime(end);
        if (durationLabel) durationLabel.textContent = formatVideoDownloaderTime(Math.max(0, end - start));
    }

    function setVideoDownloaderTrimDuration(duration) {
        const value = Number(duration);
        videoDownloaderRuntime.trimDuration = isFinite(value) && value > 0 ? value : 60;
        paintVideoDownloaderTrim();
    }

    function syncVideoDownloaderTrimFromSlider(which) {
        const startEl = document.getElementById("videoDownloaderRangeStart");
        const endEl = document.getElementById("videoDownloaderRangeEnd");
        const startSlider = document.getElementById("videoDownloaderTrimStart");
        const endSlider = document.getElementById("videoDownloaderTrimEnd");
        const video = document.getElementById("videoDownloaderVideo");
        const max = getVideoDownloaderTrimDuration();
        let start = startSlider ? Math.max(0, Math.min(max, Number(startSlider.value) || 0)) : 0;
        let end = endSlider ? Math.max(0, Math.min(max, Number(endSlider.value) || max)) : max;
        if (which === "start" && start > end) end = start;
        if (which === "end" && end < start) start = end;
        if (startEl) startEl.value = formatVideoDownloaderTime(start);
        if (endEl) endEl.value = formatVideoDownloaderTime(end);
        if (startSlider) startSlider.value = String(start);
        if (endSlider) endSlider.value = String(end);
        paintVideoDownloaderTrim();
        if (video && video.src && isFinite(video.duration || 0)) {
            try { video.currentTime = which === "end" ? end : start; } catch (err) {}
        }
    }

    function resetVideoDownloaderPreview() {
        const shell = document.getElementById("videoDownloaderPreview");
        const video = document.getElementById("videoDownloaderVideo");
        const thumb = document.getElementById("videoDownloaderThumb");
        try {
            if (videoDownloaderRuntime.previewResolveProc) videoDownloaderRuntime.previewResolveProc.kill();
        } catch (err) {}
        videoDownloaderRuntime.previewResolveProc = null;
        videoDownloaderRuntime.previewUrl = "";
        if (shell) {
            shell.classList.remove("has-video", "has-thumb");
        }
        if (video) {
            try { video.pause(); } catch (err) {}
            video.removeAttribute("src");
            try { video.load(); } catch (err) {}
        }
        if (thumb) thumb.removeAttribute("src");
        setVideoDownloaderTrimDuration(60);
    }

    function setVideoDownloaderVideoPreview(previewUrl) {
        const shell = document.getElementById("videoDownloaderPreview");
        const video = document.getElementById("videoDownloaderVideo");
        if (!shell || !video || !previewUrl) return;
        videoDownloaderRuntime.previewUrl = previewUrl;
        video.src = previewUrl;
        video.onloadedmetadata = function() {
            setVideoDownloaderTrimDuration(video.duration || videoDownloaderRuntime.trimDuration || 60);
        };
        video.ontimeupdate = function() {
            const range = getVideoDownloaderTrimRange();
            if (!range.active || !range.hasEnd || !isFinite(video.currentTime)) return;
            if (video.currentTime >= range.end) {
                try {
                    video.pause();
                    video.currentTime = range.start || 0;
                } catch (err) {}
            }
        };
        shell.classList.add("has-video");
        shell.classList.remove("has-thumb");
    }

    function setVideoDownloaderThumbnailPreview(videoId) {
        const shell = document.getElementById("videoDownloaderPreview");
        const thumb = document.getElementById("videoDownloaderThumb");
        const video = document.getElementById("videoDownloaderVideo");
        if (!shell || !thumb || !videoId) return;
        if (video) {
            try { video.pause(); } catch (err) {}
            video.removeAttribute("src");
            try { video.load(); } catch (err) {}
        }
        thumb.src = "https://i.ytimg.com/vi/" + encodeURIComponent(videoId) + "/hqdefault.jpg";
        shell.classList.add("has-thumb");
        shell.classList.remove("has-video");
    }

    function resolveVideoDownloaderPreviewWithYtDlp(targetUrl) {
        if (!targetUrl || typeof require !== "function") return;
        try {
            if (videoDownloaderRuntime.previewResolveProc) videoDownloaderRuntime.previewResolveProc.kill();
        } catch (err) {}
        videoDownloaderRuntime.previewResolveProc = null;
        ensureVideoDownloaderYtDlpBinary().then(function(binaryPath) {
            if (!binaryPath || typeof require !== "function") return;
            const input = document.getElementById("videoDownloaderUrl");
            if (!input || aiHubTrim(input.value) !== targetUrl) return;
            const childProcess = require("child_process");
            const args = ["-g", "--no-playlist", "--no-warnings", "-f", "best[ext=mp4]/best"];
            Array.prototype.push.apply(args, getVideoDownloaderCookieArgs());
            args.push(targetUrl);
            const proc = childProcess.spawn(binaryPath, args, { windowsHide: true });
            videoDownloaderRuntime.previewResolveProc = proc;
            let out = "";
            proc.stdout.on("data", function(chunk) {
                out += String(chunk || "");
            });
            proc.on("error", function() {
                if (videoDownloaderRuntime.previewResolveProc === proc) videoDownloaderRuntime.previewResolveProc = null;
            });
            proc.on("close", function() {
                if (videoDownloaderRuntime.previewResolveProc === proc) videoDownloaderRuntime.previewResolveProc = null;
                const currentInput = document.getElementById("videoDownloaderUrl");
                if (!currentInput || aiHubTrim(currentInput.value) !== targetUrl) return;
                const directUrl = String(out || "").split(/\r?\n/).map(function(line) {
                    return line.trim();
                }).filter(function(line) {
                    return /^https?:\/\//i.test(line);
                })[0] || "";
                if (directUrl) setVideoDownloaderVideoPreview(directUrl);
            });
        }).catch(function() {});
    }

    function updateVideoDownloaderPreview() {
        const input = document.getElementById("videoDownloaderUrl");
        const rawUrl = input ? aiHubTrim(input.value) : "";
        const shell = document.getElementById("videoDownloaderPreview");
        const video = document.getElementById("videoDownloaderVideo");
        if (!rawUrl || !shell) {
            resetVideoDownloaderPreview();
            return;
        }
        const videoId = extractYouTubeId(rawUrl);
        if (videoId) {
            setVideoDownloaderThumbnailPreview(videoId);
            setVideoDownloaderTrimDuration(60);
            resolveVideoDownloaderPreviewWithYtDlp(rawUrl);
            return;
        }
        if (/^https?:\/\/.+\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(rawUrl) && video) {
            const thumb = document.getElementById("videoDownloaderThumb");
            if (thumb) thumb.removeAttribute("src");
            setVideoDownloaderVideoPreview(rawUrl);
            return;
        }
        resetVideoDownloaderPreview();
    }

    function queueVideoDownloaderPreviewUpdate() {
        if (videoDownloaderRuntime.previewTimer) window.clearTimeout(videoDownloaderRuntime.previewTimer);
        videoDownloaderRuntime.previewTimer = window.setTimeout(function() {
            videoDownloaderRuntime.previewTimer = null;
            updateVideoDownloaderPreview();
        }, 180);
    }

    function getVideoDownloaderSelectedCookieBrowser() {
        const select = document.getElementById("videoDownloaderCookies");
        const browser = select ? String(select.value || "none") : "none";
        return browser && browser !== "none" ? browser : "";
    }

    function setVideoDownloaderProgress(percent, label) {
        if (videoDownloaderRuntime.cancelRequested && String(label || "") !== "Ready") return;
        let value = Math.max(0, Math.min(100, Number(percent) || 0));
        if (videoDownloaderRuntime.busy && value < 100) {
            value = Math.max(videoDownloaderRuntime.lastProgress || 0, value);
        }
        videoDownloaderRuntime.lastProgress = value;
        const fill = document.getElementById("videoDownloaderProgressFill");
        const valueEl = document.getElementById("videoDownloaderProgressValue");
        const labelEl = document.getElementById("videoDownloaderProgressLabel");
        if (fill) fill.style.width = value + "%";
        if (valueEl) valueEl.textContent = Math.round(value) + "%";
        if (labelEl && label) labelEl.textContent = label;
    }

    function setVideoDownloaderBusy(isBusy) {
        videoDownloaderRuntime.busy = !!isBusy;
        if (isBusy) videoDownloaderRuntime.lastProgress = 0;
        ["videoDownloaderUrl", "videoDownloaderFormat", "videoDownloaderRangeStart", "videoDownloaderRangeEnd", "videoDownloaderTrimStart", "videoDownloaderTrimEnd", "btnVideoDownloaderStart", "btnVideoDownloaderChooseFolder", "btnVideoDownloaderImport"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.disabled = !!isBusy;
        });
        const startBtn = document.getElementById("btnVideoDownloaderStart");
        if (startBtn) startBtn.textContent = isBusy ? "Downloading" : "Download";
        if (!isBusy && videoDownloaderRuntime.outputPath) setVideoDownloaderImportVisible(true);
    }

    function getVideoDownloaderDownloadsDir() {
        if (typeof require !== "function") return "";
        try {
            const os = require("os");
            const path = require("path");
            const home = os.homedir ? os.homedir() : "";
            return home ? path.join(home, "Downloads") : "";
        } catch (err) {
            return "";
        }
    }

    function getVideoDownloaderOutputDir() {
        let saved = "";
        try { saved = window.localStorage ? (window.localStorage.getItem(videoDownloaderFolderStorageKey) || "") : ""; } catch (err) {}
        if (saved) return saved;
        return getVideoDownloaderDownloadsDir();
    }

    function ensureVideoDownloaderOutputDir(folderPath) {
        if (!folderPath || typeof require !== "function") return false;
        try {
            const fs = require("fs");
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
            return fs.existsSync(folderPath);
        } catch (err) {
            return false;
        }
    }

    function saveVideoDownloaderOutputDir(folderPath) {
        const safePath = String(folderPath || "").trim();
        if (!safePath) return false;
        try { if (window.localStorage) window.localStorage.setItem(videoDownloaderFolderStorageKey, safePath); } catch (err) {}
        updateVideoDownloaderPath();
        return true;
    }

    function chooseVideoDownloaderOutputFolder() {
        openAppleFolderDialog("Choose Downloader Output Folder", getVideoDownloaderOutputDir(), function(folder) {
            if (!folder) return;
            if (!ensureVideoDownloaderOutputDir(folder)) {
                setVideoDownloaderStatus("Selected download folder cannot be used.", true);
                return;
            }
            saveVideoDownloaderOutputDir(folder);
            setVideoDownloaderStatus("Download folder saved.", false);
        });
    }

    function updateVideoDownloaderPath(pathValue) {
        const pathEl = document.getElementById("videoDownloaderPath");
        if (!pathEl) return;
        const folder = getVideoDownloaderOutputDir();
        pathEl.textContent = pathValue ? "Saved to selected folder" : (folder || "Downloads");
        pathEl.title = pathValue || folder || "Downloads";
    }

    function sanitizeVideoDownloaderFileName(name) {
        const cleaned = String(name || "")
            .replace(/[\\/:*?"<>|]+/g, "-")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 120);
        return cleaned || ("kwv-video-" + Date.now());
    }

    function getVideoDownloaderFileName(targetUrl, contentType) {
        let fileName = "";
        try {
            const parsed = new URL(targetUrl);
            const last = decodeURIComponent((parsed.pathname || "").split("/").pop() || "");
            fileName = last.split("?")[0].split("#")[0];
        } catch (err) {}
        if (!/\.[a-z0-9]{2,5}$/i.test(fileName)) {
            const type = String(contentType || "").toLowerCase();
            let ext = ".mp4";
            if (type.indexOf("webm") >= 0) ext = ".webm";
            else if (type.indexOf("quicktime") >= 0) ext = ".mov";
            else if (type.indexOf("mpegurl") >= 0 || type.indexOf("m3u8") >= 0) ext = ".m3u8";
            else if (type.indexOf("audio/mpeg") >= 0) ext = ".mp3";
            else if (type.indexOf("wav") >= 0) ext = ".wav";
            fileName = "kwv-download-" + Date.now() + ext;
        }
        return sanitizeVideoDownloaderFileName(fileName);
    }

    function isVideoDownloaderMediaResponse(contentType, targetUrl) {
        const type = String(contentType || "").toLowerCase();
        if (/^(video|audio)\//.test(type)) return true;
        if (type.indexOf("octet-stream") >= 0) return true;
        return /\.(mp4|mov|webm|mkv|avi|m4v|mp3|wav|m4a|aac|flac|ogg)(?:[?#]|$)/i.test(String(targetUrl || ""));
    }

    function isVideoDownloaderHlsResponse(contentType, targetUrl) {
        const type = String(contentType || "").toLowerCase();
        const url = String(targetUrl || "").toLowerCase();
        return type.indexOf("mpegurl") >= 0 || type.indexOf("m3u8") >= 0 || /\.m3u8(?:[?#]|$)/i.test(url);
    }

    function decodeVideoDownloaderHtmlValue(value) {
        return String(value || "")
            .replace(/\\\//g, "/")
            .replace(/\\u0026/gi, "&")
            .replace(/\\u002f/gi, "/")
            .replace(/&amp;/gi, "&")
            .replace(/&#38;/g, "&")
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/g, "'");
    }

    function makeVideoDownloaderAbsoluteUrl(rawUrl, baseUrl) {
        const value = decodeVideoDownloaderHtmlValue(rawUrl).trim();
        if (!value || /^(data|blob|javascript):/i.test(value)) return "";
        try {
            return new URL(value, baseUrl).toString();
        } catch (err) {
            return "";
        }
    }

    function looksLikeVideoDownloaderCandidate(value) {
        const text = String(value || "").toLowerCase();
        return /\.(mp4|mov|webm|mkv|avi|m4v|mp3|wav|m4a|aac|flac|ogg|m3u8)(?:[?#]|$)/i.test(text) ||
            text.indexOf("mime=video") >= 0 ||
            text.indexOf("content-type=video") >= 0 ||
            text.indexOf("/video/") >= 0;
    }

    function extractVideoDownloaderCandidates(html, pageUrl) {
        const source = String(html || "");
        const seen = {};
        const candidates = [];

        function add(rawUrl) {
            const absolute = makeVideoDownloaderAbsoluteUrl(rawUrl, pageUrl);
            if (!absolute || seen[absolute] || !looksLikeVideoDownloaderCandidate(absolute)) return;
            seen[absolute] = true;
            candidates.push(absolute);
        }

        let match = null;
        const absoluteMediaRe = /https?:\\?\/\\?\/[^"'<>\s]+/gi;
        while ((match = absoluteMediaRe.exec(source)) && candidates.length < 40) {
            add(match[0]);
        }

        const attrRe = /\b(?:src|href|content)\s*=\s*["']([^"']+)["']/gi;
        while ((match = attrRe.exec(source)) && candidates.length < 40) {
            add(match[1]);
        }

        const jsonUrlRe = /"(?:contentUrl|embedUrl|playbackUrl|videoUrl|url)"\s*:\s*"([^"]+)"/gi;
        while ((match = jsonUrlRe.exec(source)) && candidates.length < 40) {
            add(match[1]);
        }

        candidates.sort(function(a, b) {
            const aHls = /\.m3u8(?:[?#]|$)/i.test(a) ? 1 : 0;
            const bHls = /\.m3u8(?:[?#]|$)/i.test(b) ? 1 : 0;
            return bHls - aHls;
        });
        return candidates;
    }

    function fetchVideoDownloaderPage(pageUrl, redirectCount) {
        return new Promise(function(resolve, reject) {
            if (typeof require !== "function") {
                reject(new Error("CEP Node is not available."));
                return;
            }
            let parsed = null;
            try { parsed = new URL(pageUrl); } catch (urlErr) {}
            if (!parsed || !/^https?:$/i.test(parsed.protocol)) {
                reject(new Error("Paste a valid http or https video URL."));
                return;
            }

            const http = require("http");
            const https = require("https");
            const client = parsed.protocol === "http:" ? http : https;
            const req = client.get(pageUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 KeshavWithVelo/1.1.6",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,video/*,*/*;q=0.8"
                }
            }, function(res) {
                const statusCode = res.statusCode || 0;
                const redirectUrl = res.headers && res.headers.location ? res.headers.location : "";
                if (statusCode >= 300 && statusCode < 400 && redirectUrl) {
                    res.resume();
                    if ((redirectCount || 0) >= 5) {
                        reject(new Error("Too many redirects."));
                        return;
                    }
                    let nextUrl = redirectUrl;
                    try { nextUrl = new URL(redirectUrl, pageUrl).toString(); } catch (redirectErr) {}
                    fetchVideoDownloaderPage(nextUrl, (redirectCount || 0) + 1).then(resolve).catch(reject);
                    return;
                }
                if (statusCode < 200 || statusCode >= 300) {
                    res.resume();
                    reject(new Error("Page scan failed. HTTP " + statusCode + "."));
                    return;
                }

                const contentType = res.headers && res.headers["content-type"] ? res.headers["content-type"] : "";
                if (isVideoDownloaderMediaResponse(contentType, pageUrl) || isVideoDownloaderHlsResponse(contentType, pageUrl)) {
                    res.resume();
                    resolve({ directUrl: pageUrl, finalUrl: pageUrl, contentType: contentType });
                    return;
                }

                let html = "";
                const maxBytes = 1024 * 1024 * 2;
                res.setEncoding("utf8");
                res.on("data", function(chunk) {
                    html += chunk || "";
                    if (html.length > maxBytes) {
                        try { req.destroy(new Error("Page is too large to scan.")); } catch (destroyErr) {}
                    }
                });
                res.on("end", function() {
                    resolve({ html: html, finalUrl: pageUrl, contentType: contentType });
                });
                res.on("error", reject);
            });
            req.setTimeout(30000, function() {
                try { req.destroy(new Error("Page scan timed out.")); } catch (timeoutErr) {}
            });
            req.on("error", reject);
        });
    }

    function resolveVideoDownloaderPageMedia(pageUrl) {
        setVideoDownloaderProgress(8, "Scanning");
        setVideoDownloaderStatus("Scanning page for video source...", false);
        return fetchVideoDownloaderPage(pageUrl, 0).then(function(page) {
            if (page && page.directUrl) return page.directUrl;
            const candidates = extractVideoDownloaderCandidates(page && page.html ? page.html : "", page && page.finalUrl ? page.finalUrl : pageUrl);
            if (!candidates.length) {
                throw new Error("No direct downloadable video was found on this page.");
            }
            return candidates[0];
        });
    }

    function getVideoDownloaderHlsFileName(targetUrl) {
        const baseName = getVideoDownloaderFileName(targetUrl, "video/mp4").replace(/\.[a-z0-9]{2,5}$/i, "");
        return sanitizeVideoDownloaderFileName(baseName) + ".mp4";
    }

    function downloadVideoHlsToDownloads(targetUrl) {
        return new Promise(function(resolve, reject) {
            if (typeof require !== "function") {
                reject(new Error("CEP Node is not available."));
                return;
            }
            const fs = require("fs");
            const path = require("path");
            const childProcess = require("child_process");
            const downloadsDir = getVideoDownloaderOutputDir();
            if (!downloadsDir) {
                reject(new Error("Downloads folder was not found."));
                return;
            }
            if (!ensureVideoDownloaderOutputDir(downloadsDir)) {
                reject(new Error("Download folder could not be used."));
                return;
            }

            const fileName = getVideoDownloaderHlsFileName(targetUrl);
            const outputPath = path.join(downloadsDir, fileName);
            const tempPath = outputPath + ".download.mp4";
            const ffmpegPath = getFfmpegExecutable();
            const args = [
                "-y",
                "-hide_banner",
                "-loglevel", "error",
                "-protocol_whitelist", "file,http,https,tcp,tls,crypto",
                "-i", targetUrl,
                "-c", "copy",
                tempPath
            ];

            videoDownloaderRuntime.tempPath = tempPath;
            updateVideoDownloaderPath(outputPath);
            setVideoDownloaderProgress(18, "Processing");
            const proc = childProcess.execFile(ffmpegPath, args, { windowsHide: true, maxBuffer: 1024 * 1024 * 8 }, function(error, stdout, stderr) {
                if (videoDownloaderRuntime.hlsProcess === proc) videoDownloaderRuntime.hlsProcess = null;
                videoDownloaderRuntime.tempPath = "";
                if (error) {
                    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (unlinkErr) {}
                    const hint = ffmpegPath === "ffmpeg" ? " FFmpeg is required for stream links." : "";
                    reject(new Error("Stream download failed." + hint));
                    return;
                }
                try {
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    fs.renameSync(tempPath, outputPath);
                    resolve({ path: outputPath, name: fileName });
                } catch (renameErr) {
                    reject(renameErr);
                }
            });
            videoDownloaderRuntime.hlsProcess = proc;
        });
    }

    function isVideoDownloaderExtractorUrl(targetUrl) {
        try {
            const host = new URL(targetUrl).hostname.toLowerCase();
            return /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)tiktok\.com$|(^|\.)instagram\.com$|(^|\.)facebook\.com$|(^|\.)fb\.watch$|(^|\.)pinterest\.[a-z.]+$|(^|\.)pin\.it$|(^|\.)twitter\.com$|(^|\.)x\.com$|(^|\.)vimeo\.com$|(^|\.)dailymotion\.com$|(^|\.)reddit\.com$|(^|\.)twitch\.tv$|(^|\.)soundcloud\.com$/i.test(host);
        } catch (err) {
            return false;
        }
    }

    function getVideoDownloaderCacheDir() {
        if (typeof require !== "function") return "";
        try {
            const path = require("path");
            const os = require("os");
            const base = process.env.LOCALAPPDATA || (os.homedir ? path.join(os.homedir(), "AppData", "Local") : os.tmpdir());
            return path.join(base, "KeshavWithVelo", "video-downloader");
        } catch (err) {
            return "";
        }
    }

    function getBundledYtDlpPath() {
        try {
            if (typeof require !== "function") return "";
            const path = require("path");
            const extPath = (csInterface.getSystemPath(SystemPath.EXTENSION) || "").replace(/\\/g, "/");
            return path.join(extPath, "bin", "yt-dlp", process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
        } catch (err) {
            return "";
        }
    }

    function getCachedYtDlpPath() {
        if (typeof require !== "function") return "";
        try {
            const path = require("path");
            const dir = getVideoDownloaderCacheDir();
            return dir ? path.join(dir, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp") : "";
        } catch (err) {
            return "";
        }
    }

    function downloadFileWithRedirects(fileUrl, outputPath, redirectCount) {
        return new Promise(function(resolve, reject) {
            try {
                const fs = require("fs");
                const http = require("http");
                const https = require("https");
                const parsed = new URL(fileUrl);
                const client = parsed.protocol === "http:" ? http : https;
                const req = client.get(fileUrl, {
                    headers: { "User-Agent": "KeshavWithVelo/1.1.6" }
                }, function(res) {
                    const statusCode = res.statusCode || 0;
                    const redirectUrl = res.headers && res.headers.location ? res.headers.location : "";
                    if (statusCode >= 300 && statusCode < 400 && redirectUrl) {
                        res.resume();
                        if ((redirectCount || 0) >= 6) {
                            reject(new Error("Downloader engine redirect failed."));
                            return;
                        }
                        let nextUrl = redirectUrl;
                        try { nextUrl = new URL(redirectUrl, fileUrl).toString(); } catch (redirectErr) {}
                        downloadFileWithRedirects(nextUrl, outputPath, (redirectCount || 0) + 1).then(resolve).catch(reject);
                        return;
                    }
                    if (statusCode < 200 || statusCode >= 300) {
                        res.resume();
                        reject(new Error("Downloader engine download failed. HTTP " + statusCode + "."));
                        return;
                    }
                    const total = parseInt(res.headers && res.headers["content-length"] ? res.headers["content-length"] : "0", 10) || 0;
                    let received = 0;
                    const file = fs.createWriteStream(outputPath);
                    res.on("data", function(chunk) {
                        received += chunk ? chunk.length : 0;
                        if (total > 0) setVideoDownloaderProgress(Math.min(38, 10 + (received / total) * 28), "Installing");
                    });
                    res.pipe(file);
                    file.on("finish", function() {
                        file.close(resolve);
                    });
                    file.on("error", reject);
                    res.on("error", reject);
                });
                req.setTimeout(60000, function() {
                    try { req.destroy(new Error("Downloader engine download timed out.")); } catch (timeoutErr) {}
                });
                req.on("error", reject);
            } catch (err) {
                reject(err);
            }
        });
    }

    function ensureVideoDownloaderYtDlpBinary() {
        return new Promise(function(resolve, reject) {
            if (typeof require !== "function") {
                reject(new Error("CEP Node is not available."));
                return;
            }
            const fs = require("fs");
            const path = require("path");
            const bundled = getBundledYtDlpPath();
            if (bundled && fs.existsSync(bundled)) {
                resolve(bundled);
                return;
            }
            if (process.platform !== "win32") {
                resolve("yt-dlp");
                return;
            }
            const cached = getCachedYtDlpPath();
            if (cached && fs.existsSync(cached)) {
                resolve(cached);
                return;
            }
            const cacheDir = getVideoDownloaderCacheDir();
            if (!cacheDir) {
                reject(new Error("Downloader engine cache folder was not found."));
                return;
            }
            try {
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            } catch (dirErr) {
                reject(new Error("Downloader engine cache folder could not be created."));
                return;
            }
            const tempPath = cached + ".download";
            try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (unlinkErr) {}
            setVideoDownloaderStatus("Installing downloader engine...", false);
            setVideoDownloaderProgress(10, "Installing");
            downloadFileWithRedirects("https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe", tempPath, 0).then(function() {
                try {
                    if (fs.existsSync(cached)) fs.unlinkSync(cached);
                    fs.renameSync(tempPath, cached);
                    resolve(cached);
                } catch (renameErr) {
                    reject(new Error("Downloader engine install failed."));
                }
            }).catch(function(err) {
                try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (cleanupErr) {}
                reject(err);
            });
        });
    }

    function getVideoDownloaderFormatArgs() {
        const formatEl = document.getElementById("videoDownloaderFormat");
        const value = formatEl ? String(formatEl.value || "video_best") : "video_best";
        if (value === "music_mp3" || value === "audio_best") {
            return { args: ["-f", "bestaudio/best", "--extract-audio", "--audio-format", "mp3", "--audio-quality", "0"], audio: true };
        }
        const qualityMatch = value.match(/^video_(\d+)$/i);
        const heightLimit = qualityMatch ? parseInt(qualityMatch[1], 10) : 0;
        const format = heightLimit > 0
            ? "bv*[height<=" + heightLimit + "][ext=mp4][vcodec^=avc1]+ba[ext=m4a]/bv*[height<=" + heightLimit + "][vcodec^=avc1]+ba/best[height<=" + heightLimit + "][ext=mp4]/best[height<=" + heightLimit + "]"
            : "bv*[ext=mp4][vcodec^=avc1]+ba[ext=m4a]/bv*[vcodec^=avc1]+ba/best[ext=mp4]/best";
        return { args: ["-f", format, "--merge-output-format", "mp4", "--recode-video", "mp4"], audio: false };
    }

    function isVideoDownloaderMusicMode() {
        return !!getVideoDownloaderFormatArgs().audio;
    }

    function resetVideoDownloaderQualityOptions(label) {
        const select = document.getElementById("videoDownloaderFormat");
        if (!select) return;
        const current = select.value || "video_best";
        select.innerHTML = "";
        select.appendChild(new Option(label || "Best Quality MP4", "video_best"));
        select.appendChild(new Option("Music MP3", "music_mp3"));
        select.value = current === "music_mp3" ? "music_mp3" : "video_best";
    }

    function setVideoDownloaderQualityOptions(heights) {
        const select = document.getElementById("videoDownloaderFormat");
        if (!select) return;
        const previous = select.value || "video_best";
        const uniqueHeights = Array.from(new Set((heights || []).filter(function(height) {
            return height && height >= 100;
        }))).sort(function(a, b) { return b - a; });
        select.innerHTML = "";
        select.appendChild(new Option("Best AE MP4", "video_best"));
        uniqueHeights.forEach(function(height) {
            const label = height >= 2160 ? (height + "p 4K MP4") : (height + "p MP4");
            select.appendChild(new Option(label, "video_" + height));
        });
        select.appendChild(new Option("Music MP3", "music_mp3"));
        if (previous && select.querySelector('option[value="' + previous + '"]')) select.value = previous;
        else if (uniqueHeights.length) select.value = "video_" + uniqueHeights[0];
        else select.value = previous === "music_mp3" ? "music_mp3" : "video_best";
    }

    function extractVideoDownloaderHeights(info) {
        const formats = info && Array.isArray(info.formats) ? info.formats : [];
        const heights = [];
        formats.forEach(function(format) {
            const height = parseInt(format && format.height, 10) || 0;
            const vcodec = String(format && format.vcodec || "");
            if (height > 0 && vcodec && vcodec !== "none") heights.push(height);
        });
        return heights;
    }

    function updateVideoDownloaderQualityOptions() {
        const input = document.getElementById("videoDownloaderUrl");
        const targetUrl = input ? aiHubTrim(input.value) : "";
        if (!targetUrl || !/^https?:\/\//i.test(targetUrl) || typeof require !== "function") {
            resetVideoDownloaderQualityOptions("Best Quality MP4");
            return;
        }
        try {
            if (videoDownloaderRuntime.qualityProcess) killVideoDownloaderProcess(videoDownloaderRuntime.qualityProcess);
        } catch (err) {}
        videoDownloaderRuntime.qualityProcess = null;
        videoDownloaderRuntime.qualityUrl = targetUrl;
        resetVideoDownloaderQualityOptions("Detecting qualities...");
        ensureVideoDownloaderYtDlpBinary().then(function(binaryPath) {
            const currentInput = document.getElementById("videoDownloaderUrl");
            if (!currentInput || aiHubTrim(currentInput.value) !== targetUrl || videoDownloaderRuntime.cancelRequested) return;
            const childProcess = require("child_process");
            const args = ["-J", "--no-playlist", "--no-warnings"];
            Array.prototype.push.apply(args, getVideoDownloaderCookieArgs());
            args.push(targetUrl);
            const proc = childProcess.spawn(binaryPath, args, { windowsHide: true });
            videoDownloaderRuntime.qualityProcess = proc;
            let out = "";
            proc.stdout.on("data", function(chunk) {
                out += String(chunk || "");
                if (out.length > 4000000) out = out.slice(-4000000);
            });
            proc.on("error", function() {
                if (videoDownloaderRuntime.qualityProcess === proc) videoDownloaderRuntime.qualityProcess = null;
                resetVideoDownloaderQualityOptions("Best Quality MP4");
            });
            proc.on("close", function() {
                if (videoDownloaderRuntime.qualityProcess === proc) videoDownloaderRuntime.qualityProcess = null;
                const latestInput = document.getElementById("videoDownloaderUrl");
                if (!latestInput || aiHubTrim(latestInput.value) !== targetUrl) return;
                try {
                    setVideoDownloaderQualityOptions(extractVideoDownloaderHeights(JSON.parse(out)));
                } catch (err) {
                    resetVideoDownloaderQualityOptions("Best Quality MP4");
                }
            });
        }).catch(function() {
            resetVideoDownloaderQualityOptions("Best Quality MP4");
        });
    }

    function queueVideoDownloaderQualityUpdate() {
        if (videoDownloaderRuntime.qualityTimer) window.clearTimeout(videoDownloaderRuntime.qualityTimer);
        videoDownloaderRuntime.qualityTimer = window.setTimeout(function() {
            videoDownloaderRuntime.qualityTimer = null;
            updateVideoDownloaderQualityOptions();
        }, 520);
    }

    function getVideoDownloaderCookieArgs() {
        const browser = getVideoDownloaderSelectedCookieBrowser();
        return browser ? ["--cookies-from-browser", browser] : [];
    }

    function getVideoDownloaderSectionArgs() {
        const range = getVideoDownloaderTrimRange();
        if (!range.active) return [];
        const start = range.hasStart ? formatVideoDownloaderTime(range.start) : "";
        const end = range.hasEnd ? formatVideoDownloaderTime(range.end) : "";
        if (!start && !end) return [];
        return ["--download-sections", "*" + start + "-" + end];
    }

    function getVideoDownloaderFfmpegArgs() {
        try {
            const path = require("path");
            const ffmpegPath = getFfmpegExecutable();
            if (!ffmpegPath || ffmpegPath === "ffmpeg") return [];
            return ["--ffmpeg-location", path.dirname(ffmpegPath)];
        } catch (err) {
            return [];
        }
    }

    function createVideoDownloaderRunDir() {
        const fs = require("fs");
        const path = require("path");
        const os = require("os");
        const dir = path.join(os.tmpdir(), "KeshavVeloDownloader", "run-" + Date.now() + "-" + Math.floor(Math.random() * 100000));
        fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    function findVideoDownloaderOutputFile(dir) {
        const fs = require("fs");
        const path = require("path");
        const mediaExt = /\.(mp4|mov|webm|mkv|avi|m4v|mp3|m4a|aac|wav|flac|ogg)$/i;
        const items = [];
        function scan(folder) {
            let entries = [];
            try { entries = fs.readdirSync(folder); } catch (err) { return; }
            entries.forEach(function(entry) {
                const fullPath = path.join(folder, entry);
                let stat = null;
                try { stat = fs.statSync(fullPath); } catch (err) {}
                if (!stat) return;
                if (stat.isDirectory()) {
                    scan(fullPath);
                    return;
                }
                if (stat.isFile() && mediaExt.test(entry) && !/\.part$/i.test(entry)) {
                    items.push({ path: fullPath, size: stat.size || 0, mtime: stat.mtime ? stat.mtime.getTime() : 0 });
                }
            });
        }
        scan(dir);
        items.sort(function(a, b) {
            if (b.size !== a.size) return b.size - a.size;
            return b.mtime - a.mtime;
        });
        return items.length ? items[0].path : "";
    }

    function getAvailableVideoDownloaderPath(targetPath) {
        const fs = require("fs");
        const path = require("path");
        if (!fs.existsSync(targetPath)) return targetPath;
        const parsed = path.parse(targetPath);
        for (let i = 1; i < 1000; i++) {
            const next = path.join(parsed.dir, parsed.name + " (" + i + ")" + parsed.ext);
            if (!fs.existsSync(next)) return next;
        }
        return path.join(parsed.dir, parsed.name + " " + Date.now() + parsed.ext);
    }

    function removeVideoDownloaderFolder(folderPath) {
        try {
            if (!folderPath || typeof require !== "function") return;
            const fs = require("fs");
            if (fs.rmSync) fs.rmSync(folderPath, { recursive: true, force: true });
            else if (fs.rmdirSync) fs.rmdirSync(folderPath, { recursive: true });
        } catch (err) {}
    }

    function moveVideoDownloaderResultToDownloads(filePath, runDir) {
        const fs = require("fs");
        const path = require("path");
        const downloadsDir = getVideoDownloaderOutputDir();
        if (!filePath || !downloadsDir) throw new Error("Downloaded file was not found.");
        if (!ensureVideoDownloaderOutputDir(downloadsDir)) throw new Error("Download folder could not be used.");
        const targetPath = getAvailableVideoDownloaderPath(path.join(downloadsDir, sanitizeVideoDownloaderFileName(path.basename(filePath))));
        try {
            fs.renameSync(filePath, targetPath);
        } catch (renameErr) {
            fs.copyFileSync(filePath, targetPath);
            fs.unlinkSync(filePath);
        }
        removeVideoDownloaderFolder(runDir);
        return { path: targetPath, name: path.basename(targetPath) };
    }

    function buildVideoDownloaderYtDlpArgs(targetUrl, runDir) {
        const path = require("path");
        const format = getVideoDownloaderFormatArgs();
        const forceEl = document.getElementById("videoDownloaderForce");
        const args = ["--newline", "--no-playlist", "--no-warnings", "--windows-filenames"];
        Array.prototype.push.apply(args, getVideoDownloaderFfmpegArgs());
        Array.prototype.push.apply(args, format.args);
        Array.prototype.push.apply(args, getVideoDownloaderCookieArgs());
        if (forceEl && forceEl.checked) args.push("--format-sort-force");
        args.push("-o", path.join(runDir, "%(title).120B [%(id)s].%(ext)s"));
        args.push(targetUrl);
        return args;
    }

    function parseVideoDownloaderYtDlpProgress(text) {
        const match = String(text || "").match(/(\d+(?:\.\d+)?)%/);
        if (!match) return null;
        const value = parseFloat(match[1]);
        return isFinite(value) ? Math.max(1, Math.min(98, value)) : null;
    }

    function downloadVideoWithYtDlp(targetUrl, jobId) {
        return new Promise(function(resolve, reject) {
            if (typeof require !== "function") {
                reject(new Error("CEP Node is not available."));
                return;
            }
            let runDir = "";
            try {
                const childProcess = require("child_process");
                runDir = createVideoDownloaderRunDir();
                videoDownloaderRuntime.runDir = runDir;
                ensureVideoDownloaderYtDlpBinary().then(function(binaryPath) {
                    if (videoDownloaderRuntime.cancelRequested || (jobId && videoDownloaderRuntime.jobId !== jobId)) {
                        if (videoDownloaderRuntime.runDir === runDir) videoDownloaderRuntime.runDir = "";
                        removeVideoDownloaderFolder(runDir);
                        reject(new Error("Download cancelled."));
                        return;
                    }
                    const args = buildVideoDownloaderYtDlpArgs(targetUrl, runDir);
                    setVideoDownloaderStatus("Downloader engine started...", false);
                    setVideoDownloaderProgress(42, "Preparing");
                    const proc = childProcess.spawn(binaryPath, args, { windowsHide: true });
                    videoDownloaderRuntime.ytProcess = proc;
                    let lastLog = "";
                    proc.stdout.on("data", function(chunk) {
                        if (videoDownloaderRuntime.cancelRequested || (jobId && videoDownloaderRuntime.jobId !== jobId)) return;
                        const text = String(chunk || "");
                        lastLog = (lastLog + "\n" + text).slice(-5000);
                        const progress = parseVideoDownloaderYtDlpProgress(text);
                        if (progress != null) setVideoDownloaderProgress(progress, "Downloading");
                        if (/Merging formats/i.test(text)) setVideoDownloaderProgress(96, "Merging");
                        if (/Extracting audio/i.test(text)) setVideoDownloaderProgress(96, "Audio");
                    });
                    proc.stderr.on("data", function(chunk) {
                        if (videoDownloaderRuntime.cancelRequested || (jobId && videoDownloaderRuntime.jobId !== jobId)) return;
                        const text = String(chunk || "");
                        lastLog = (lastLog + "\n" + text).slice(-5000);
                        const progress = parseVideoDownloaderYtDlpProgress(text);
                        if (progress != null) setVideoDownloaderProgress(progress, "Downloading");
                    });
                    proc.on("error", function(err) {
                        if (videoDownloaderRuntime.ytProcess === proc) videoDownloaderRuntime.ytProcess = null;
                        if (videoDownloaderRuntime.runDir === runDir) videoDownloaderRuntime.runDir = "";
                        removeVideoDownloaderFolder(runDir);
                        if (videoDownloaderRuntime.cancelRequested || (jobId && videoDownloaderRuntime.jobId !== jobId)) {
                            reject(new Error("Download cancelled."));
                            return;
                        }
                        reject(err);
                    });
                    proc.on("close", function(code) {
                        if (videoDownloaderRuntime.ytProcess === proc) videoDownloaderRuntime.ytProcess = null;
                        if (videoDownloaderRuntime.cancelRequested || (jobId && videoDownloaderRuntime.jobId !== jobId)) {
                            if (videoDownloaderRuntime.runDir === runDir) videoDownloaderRuntime.runDir = "";
                            removeVideoDownloaderFolder(runDir);
                            reject(new Error("Download cancelled."));
                            return;
                        }
                        if (code !== 0) {
                            if (videoDownloaderRuntime.runDir === runDir) videoDownloaderRuntime.runDir = "";
                            removeVideoDownloaderFolder(runDir);
                            const compact = String(lastLog || "").split(/\r?\n/).filter(Boolean).slice(-2).join(" ");
                            reject(new Error(compact || ("Downloader engine failed. Code " + code + ".")));
                            return;
                        }
                        try {
                            const outputFile = findVideoDownloaderOutputFile(runDir);
                            const result = moveVideoDownloaderResultToDownloads(outputFile, runDir);
                            if (videoDownloaderRuntime.runDir === runDir) videoDownloaderRuntime.runDir = "";
                            resolve(result);
                        } catch (moveErr) {
                            if (videoDownloaderRuntime.runDir === runDir) videoDownloaderRuntime.runDir = "";
                            removeVideoDownloaderFolder(runDir);
                            reject(moveErr);
                        }
                    });
                }).catch(function(err) {
                    if (videoDownloaderRuntime.runDir === runDir) videoDownloaderRuntime.runDir = "";
                    removeVideoDownloaderFolder(runDir);
                    reject(err);
                });
            } catch (err) {
                if (videoDownloaderRuntime.runDir === runDir) videoDownloaderRuntime.runDir = "";
                removeVideoDownloaderFolder(runDir);
                reject(err);
            }
        });
    }

    function killVideoDownloaderProcess(proc) {
        if (!proc) return;
        try {
            if (proc.pid && typeof require === "function") {
                require("child_process").execFile("taskkill.exe", ["/PID", String(proc.pid), "/T", "/F"], { windowsHide: true }, function() {});
                return;
            }
        } catch (taskkillErr) {}
        try { proc.kill(); } catch (killErr) {}
    }

    function cleanupVideoDownloaderTemp() {
        try {
            if (videoDownloaderRuntime.previewResolveProc) videoDownloaderRuntime.previewResolveProc.kill();
        } catch (previewErr) {}
        videoDownloaderRuntime.previewResolveProc = null;
        try {
            if (videoDownloaderRuntime.qualityProcess) killVideoDownloaderProcess(videoDownloaderRuntime.qualityProcess);
        } catch (qualityErr) {}
        videoDownloaderRuntime.qualityProcess = null;
        try {
            if (videoDownloaderRuntime.fileStream) videoDownloaderRuntime.fileStream.destroy();
        } catch (streamErr) {}
        videoDownloaderRuntime.fileStream = null;
        try {
            if (videoDownloaderRuntime.hlsProcess) killVideoDownloaderProcess(videoDownloaderRuntime.hlsProcess);
        } catch (procErr) {}
        videoDownloaderRuntime.hlsProcess = null;
        try {
            if (videoDownloaderRuntime.ytProcess) killVideoDownloaderProcess(videoDownloaderRuntime.ytProcess);
        } catch (ytErr) {}
        videoDownloaderRuntime.ytProcess = null;
        try {
            if (videoDownloaderRuntime.trimProcess) killVideoDownloaderProcess(videoDownloaderRuntime.trimProcess);
        } catch (trimErr) {}
        videoDownloaderRuntime.trimProcess = null;
        removeVideoDownloaderFolder(videoDownloaderRuntime.runDir);
        videoDownloaderRuntime.runDir = "";
        try {
            if (videoDownloaderRuntime.tempPath && typeof require === "function") {
                const fs = require("fs");
                if (fs.existsSync(videoDownloaderRuntime.tempPath)) fs.unlinkSync(videoDownloaderRuntime.tempPath);
            }
        } catch (unlinkErr) {}
        videoDownloaderRuntime.tempPath = "";
    }

    function downloadVideoUrlToDownloads(targetUrl, redirectCount) {
        return new Promise(function(resolve, reject) {
            if (typeof require !== "function") {
                reject(new Error("CEP Node is not available."));
                return;
            }
            let parsed = null;
            try { parsed = new URL(targetUrl); } catch (urlErr) {}
            if (!parsed || !/^https?:$/i.test(parsed.protocol)) {
                reject(new Error("Paste a valid http or https video URL."));
                return;
            }

            const fs = require("fs");
            const path = require("path");
            const http = require("http");
            const https = require("https");
            const downloadsDir = getVideoDownloaderOutputDir();
            if (!downloadsDir) {
                reject(new Error("Downloads folder was not found."));
                return;
            }
            if (!ensureVideoDownloaderOutputDir(downloadsDir)) {
                reject(new Error("Download folder could not be used."));
                return;
            }
            if (isVideoDownloaderHlsResponse("", targetUrl)) {
                downloadVideoHlsToDownloads(targetUrl).then(resolve).catch(reject);
                return;
            }

            const client = parsed.protocol === "http:" ? http : https;
            const req = client.get(targetUrl, {
                headers: {
                    "User-Agent": "KeshavWithVelo/1.1.6",
                    "Accept": "video/*,audio/*,application/octet-stream,*/*;q=0.8"
                }
            }, function(res) {
                const statusCode = res.statusCode || 0;
                const redirectUrl = res.headers && res.headers.location ? res.headers.location : "";
                if (statusCode >= 300 && statusCode < 400 && redirectUrl) {
                    res.resume();
                    if ((redirectCount || 0) >= 5) {
                        reject(new Error("Too many redirects."));
                        return;
                    }
                    let nextUrl = redirectUrl;
                    try { nextUrl = new URL(redirectUrl, targetUrl).toString(); } catch (redirectErr) {}
                    downloadVideoUrlToDownloads(nextUrl, (redirectCount || 0) + 1).then(resolve).catch(reject);
                    return;
                }
                if (statusCode < 200 || statusCode >= 300) {
                    res.resume();
                    reject(new Error("Download failed. HTTP " + statusCode + "."));
                    return;
                }

                const contentType = res.headers && res.headers["content-type"] ? res.headers["content-type"] : "";
                if (isVideoDownloaderHlsResponse(contentType, targetUrl)) {
                    res.resume();
                    downloadVideoHlsToDownloads(targetUrl).then(resolve).catch(reject);
                    return;
                }
                if (!isVideoDownloaderMediaResponse(contentType, targetUrl)) {
                    res.resume();
                    reject(new Error("This link is not a direct video/audio file."));
                    return;
                }

                const total = parseInt(res.headers && res.headers["content-length"] ? res.headers["content-length"] : "0", 10) || 0;
                const fileName = getVideoDownloaderFileName(targetUrl, contentType);
                const outputPath = path.join(downloadsDir, fileName);
                const tempPath = outputPath + ".download";
                let received = 0;
                videoDownloaderRuntime.tempPath = tempPath;
                videoDownloaderRuntime.outputPath = outputPath;
                updateVideoDownloaderPath(outputPath);

                const file = fs.createWriteStream(tempPath);
                videoDownloaderRuntime.fileStream = file;
                res.on("data", function(chunk) {
                    received += chunk ? chunk.length : 0;
                    if (total > 0) setVideoDownloaderProgress(Math.min(96, (received / total) * 100), "Downloading");
                });
                res.pipe(file);
                file.on("finish", function() {
                    file.close(function() {
                        videoDownloaderRuntime.fileStream = null;
                        try {
                            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                            fs.renameSync(tempPath, outputPath);
                            videoDownloaderRuntime.tempPath = "";
                            resolve({ path: outputPath, name: fileName });
                        } catch (renameErr) {
                            reject(renameErr);
                        }
                    });
                });
                file.on("error", reject);
                res.on("error", reject);
            });
            videoDownloaderRuntime.request = req;
            req.setTimeout(45000, function() {
                try { req.destroy(new Error("Download timed out.")); } catch (timeoutErr) {}
            });
            req.on("error", reject);
        });
    }

    function startVideoDownloader() {
        if (videoDownloaderRuntime.busy) return;
        const jobId = videoDownloaderRuntime.jobId + 1;
        videoDownloaderRuntime.jobId = jobId;
        videoDownloaderRuntime.cancelRequested = false;
        const input = document.getElementById("videoDownloaderUrl");
        const url = input ? aiHubTrim(input.value) : "";
        if (!url) {
            setVideoDownloaderStatus("Paste a video page or direct media URL first.", true);
            return;
        }
        setVideoDownloaderCookiePromptVisible(false);
        updateVideoDownloaderPreview();
        setVideoDownloaderDownloadedPath("");
        setVideoDownloaderBusy(true);
        setVideoDownloaderProgress(4, "Starting");
        setVideoDownloaderStatus("Saving to Downloads...", false);
        const musicMode = isVideoDownloaderMusicMode();
        let usedExtractor = isVideoDownloaderExtractorUrl(url) || musicMode;
        const downloadJob = usedExtractor
            ? downloadVideoWithYtDlp(url, jobId)
            : downloadVideoUrlToDownloads(url, 0).catch(function(err) {
            if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) throw err;
            const message = err && err.message ? err.message : "";
            if (message.indexOf("direct video/audio") < 0) throw err;
            usedExtractor = true;
            return downloadVideoWithYtDlp(url, jobId).catch(function(extractorErr) {
                if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) throw extractorErr;
                return resolveVideoDownloaderPageMedia(url).then(function(resolvedUrl) {
                    if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) throw extractorErr;
                    setVideoDownloaderProgress(14, "Found source");
                    return downloadVideoUrlToDownloads(resolvedUrl, 0);
                }).catch(function() {
                    throw extractorErr;
                });
            });
        });
        downloadJob.then(function(result) {
            if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) return;
            setVideoDownloaderDownloadedPath(result && result.path ? result.path : "");
            setVideoDownloaderBusy(false);
            setVideoDownloaderProgress(100, "Complete");
            updateVideoDownloaderPath(result.path);
            setVideoDownloaderStatus("Download complete", false);
        }).catch(function(err) {
            if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) return;
            console.warn("[Keshav Velo] Video downloader failed:", err);
            cleanupVideoDownloaderTemp();
            setVideoDownloaderBusy(false);
            setVideoDownloaderProgress(0, "Ready");
            updateVideoDownloaderPath();
            if (usedExtractor && !getVideoDownloaderSelectedCookieBrowser()) setVideoDownloaderCookiePromptVisible(true);
            setVideoDownloaderStatus("Download failed", true);
        });
    }

    function createVideoDownloaderTrimmedFile(sourcePath, range, options) {
        return new Promise(function(resolve, reject) {
            options = options || {};
            if (typeof require !== "function") {
                reject(new Error("CEP Node is not available."));
                return;
            }
            if (!range || !range.active || (!range.hasStart && !range.hasEnd)) {
                resolve(sourcePath);
                return;
            }
            if (!isVideoDownloaderVideoFile(sourcePath)) {
                resolve(sourcePath);
                return;
            }
            if (range.hasStart && range.hasEnd && range.end <= range.start) {
                reject(new Error("Trim end time start se bada hona chahiye."));
                return;
            }
            try {
                const fs = require("fs");
                const path = require("path");
                const childProcess = require("child_process");
                if (!fs.existsSync(sourcePath)) {
                    reject(new Error("Downloaded file was not found."));
                    return;
                }
                const parsed = path.parse(sourcePath);
                const outputPath = getAvailableVideoDownloaderPath(path.join(parsed.dir, parsed.name + " trimmed.mp4"));
                const trimStart = range.hasStart ? Math.max(0, range.start) : 0;
                const trimLength = range.hasEnd ? (range.hasStart ? Math.max(0.05, range.end - range.start) : Math.max(0.05, range.end)) : 0;
                const args = ["-hide_banner", "-loglevel", "error", "-y"];
                if (!options.encode && trimStart > 0) args.push("-ss", String(trimStart));
                args.push("-i", sourcePath);
                if (options.encode) {
                    if (trimStart > 0) args.push("-ss", String(trimStart));
                    if (trimLength > 0) args.push("-t", String(trimLength));
                    args.push("-map", "0:v:0?", "-map", "0:a?", "-sn", "-dn", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", outputPath);
                } else {
                    if (trimLength > 0) args.push("-t", String(trimLength));
                    args.push("-map", "0:v:0?", "-map", "0:a?", "-sn", "-dn", "-c", "copy", "-avoid_negative_ts", "make_zero", "-movflags", "+faststart", outputPath);
                }

                setVideoDownloaderStatus(options.encode ? "Making exact trim..." : "Fast trimming selected part...", false);
                setVideoDownloaderProgress(options.encode ? 72 : 88, options.encode ? "Exact trim" : "Fast trim");
                const proc = childProcess.spawn(getFfmpegExecutable(), args, { windowsHide: true });
                videoDownloaderRuntime.trimProcess = proc;
                let log = "";
                proc.stderr.on("data", function(chunk) {
                    log = (log + "\n" + String(chunk || "")).slice(-2500);
                });
                proc.on("error", function(err) {
                    if (videoDownloaderRuntime.trimProcess === proc) videoDownloaderRuntime.trimProcess = null;
                    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (cleanupErr) {}
                    reject(err);
                });
                proc.on("close", function(code) {
                    if (videoDownloaderRuntime.trimProcess === proc) videoDownloaderRuntime.trimProcess = null;
                    if (code !== 0) {
                        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (cleanupErr) {}
                        reject(new Error(String(log || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "Trim failed."));
                        return;
                    }
                    resolve(outputPath);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    function getVideoDownloaderImportErrorMessage(reason, filePath) {
        const cleanReason = String(reason || "Import failed.").trim();
        if (!isVideoDownloaderVideoFile(filePath)) return cleanReason;
        if (!/compression|codec|format|unsupported|not supported|damaged|import/i.test(cleanReason)) return cleanReason;
        return cleanReason + " Use Apple - Video Format Converter to make it AE-ready.";
    }

    function importVideoDownloaderPathToTimeline(importPath, originalPath, range, needsTrim, jobId, allowEncodeFallback) {
        if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) return;
        if (importPath && importPath !== originalPath) {
            setVideoDownloaderDownloadedPath(importPath);
            updateVideoDownloaderPath(importPath);
        }
        setVideoDownloaderProgress(96, "Importing");
        setVideoDownloaderStatus("Importing to timeline...", false);
        csInterface.evalScript("toolkit.importDownloadedMediaAsset('" + escapeScriptString(importPath || originalPath) + "')", function(res) {
            if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) return;
            if ((!res || res.indexOf("error::") === 0) && allowEncodeFallback && needsTrim) {
                setVideoDownloaderStatus("Fast trim failed in AE. Making AE-ready trim...", false);
                createVideoDownloaderTrimmedFile(originalPath, range, { encode: true }).then(function(encodedPath) {
                    importVideoDownloaderPathToTimeline(encodedPath, originalPath, range, needsTrim, jobId, false);
                }).catch(function(err) {
                    if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) return;
                    setVideoDownloaderBusy(false);
                    setVideoDownloaderProgress(100, "Complete");
                    setVideoDownloaderStatus(err && err.message ? err.message : "Trim/import failed.", true);
                });
                return;
            }
            setVideoDownloaderBusy(false);
            setVideoDownloaderProgress(100, "Complete");
            if (!res || res.indexOf("error::") === 0) {
                const reason = res && res.indexOf("error::") === 0 ? res.substring(7) : "Import failed.";
                setVideoDownloaderStatus(getVideoDownloaderImportErrorMessage(reason, importPath || originalPath), true);
                return;
            }
            setVideoDownloaderStatus(res.indexOf("success::") === 0 ? res.substring(9) : "Imported to timeline.", false);
        });
    }

    function importVideoDownloaderOutput() {
        const outputPath = String(videoDownloaderRuntime.outputPath || "");
        if (!outputPath) {
            setVideoDownloaderStatus("Pehle video download complete hone do.", true);
            return;
        }
        if (!csInterface || !csInterface.evalScript) {
            setVideoDownloaderStatus("After Effects import bridge unavailable.", true);
            return;
        }
        const range = getVideoDownloaderTrimRange();
        if (range.active && range.hasStart && range.hasEnd && range.end <= range.start) {
            setVideoDownloaderStatus("Trim end time start se bada hona chahiye.", true);
            return;
        }
        const duration = getVideoDownloaderTrimDuration();
        const needsTrim = isVideoDownloaderVideoFile(outputPath) && range.active && ((range.hasStart && range.start > 0.05) || (range.hasEnd && range.end < duration - 0.25));
        const jobId = videoDownloaderRuntime.jobId + 1;
        videoDownloaderRuntime.jobId = jobId;
        videoDownloaderRuntime.cancelRequested = false;
        setVideoDownloaderBusy(true);
        setVideoDownloaderProgress(needsTrim ? 68 : 94, needsTrim ? "Exact trim" : "Importing");
        setVideoDownloaderStatus(needsTrim ? "Making exact selected part..." : "Importing to timeline...", false);
        createVideoDownloaderTrimmedFile(outputPath, needsTrim ? range : null, { encode: needsTrim }).then(function(importPath) {
            if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) return;
            importVideoDownloaderPathToTimeline(importPath, outputPath, range, needsTrim, jobId, false);
        }).catch(function(err) {
            if (videoDownloaderRuntime.cancelRequested || videoDownloaderRuntime.jobId !== jobId) return;
            setVideoDownloaderBusy(false);
            setVideoDownloaderProgress(100, "Complete");
            setVideoDownloaderStatus(err && err.message ? err.message : "Trim/import failed.", true);
        });
    }

    function clearVideoDownloader() {
        const hadActiveTask = !!(videoDownloaderRuntime.busy || videoDownloaderRuntime.request || videoDownloaderRuntime.fileStream || videoDownloaderRuntime.hlsProcess || videoDownloaderRuntime.ytProcess || videoDownloaderRuntime.trimProcess);
        videoDownloaderRuntime.cancelRequested = true;
        videoDownloaderRuntime.jobId++;
        if (videoDownloaderRuntime.request) {
            try { videoDownloaderRuntime.request.destroy(new Error("Download cancelled.")); } catch (err) {}
        }
        if (videoDownloaderRuntime.hlsProcess) {
            try { killVideoDownloaderProcess(videoDownloaderRuntime.hlsProcess); } catch (err) {}
        }
        if (videoDownloaderRuntime.ytProcess) {
            try { killVideoDownloaderProcess(videoDownloaderRuntime.ytProcess); } catch (err) {}
        }
        if (videoDownloaderRuntime.trimProcess) {
            try { killVideoDownloaderProcess(videoDownloaderRuntime.trimProcess); } catch (err) {}
        }
        cleanupVideoDownloaderTemp();
        videoDownloaderRuntime.request = null;
        setVideoDownloaderDownloadedPath("");
        const input = document.getElementById("videoDownloaderUrl");
        if (input) input.value = "";
        const startEl = document.getElementById("videoDownloaderRangeStart");
        const endEl = document.getElementById("videoDownloaderRangeEnd");
        if (startEl) startEl.value = "";
        if (endEl) endEl.value = "";
        resetVideoDownloaderPreview();
        resetVideoDownloaderQualityOptions("Best Quality MP4");
        setVideoDownloaderBusy(false);
        setVideoDownloaderProgress(0, "Ready");
        updateVideoDownloaderPath();
        setVideoDownloaderCookiePromptVisible(false);
        setVideoDownloaderStatus(hadActiveTask ? "Cancelled." : "Ready.", false);
    }

    function setAiHubPending(isPending) {
        aiHubRuntime.pending = !!isPending;
        const prompt = document.getElementById("aiHubPromptInput");
        const sendBtn = document.getElementById("btnAiHubSend");
        const clearBtn = document.getElementById("btnAiHubClear");
        if (prompt) prompt.disabled = !!isPending;
        if (sendBtn) {
            sendBtn.disabled = !!isPending;
            sendBtn.textContent = isPending ? "Thinking" : "Send";
        }
        if (clearBtn) clearBtn.disabled = !!isPending;
    }

    function updateAiHubHeader() {
        const provider = aiHubProviders[0];
        const config = aiHubState.providers[provider.id] || {};
        const providerText = provider.label;
        const modelText = aiHubTrim(config.model || provider.model || "No model");
        const providerEls = [document.getElementById("aiHubActiveProvider"), document.getElementById("aiHubSettingsActiveProvider")];
        for (let i = 0; i < providerEls.length; i++) {
            if (providerEls[i]) providerEls[i].textContent = providerText;
        }
        const note = document.getElementById("aiHubProviderNote");
        if (note) note.textContent = provider.note;
    }

    function fillAiHubFields() {
        const provider = aiHubProviders[0];
        const config = aiHubState.providers[provider.id] || { apiKey: "", model: provider.model || "", baseUrl: provider.baseUrl || "" };
        const apiKeyInput = document.getElementById("aiHubApiKeyInput");
        const modelInput = document.getElementById("aiHubModelInput");
        if (apiKeyInput) {
            apiKeyInput.value = config.apiKey || "";
            apiKeyInput.placeholder = provider.label + " API key";
        }
        if (modelInput) {
            modelInput.value = config.model || "";
            modelInput.placeholder = provider.model || "model-name";
        }
        aiHubRuntime.modelDraft = aiHubTrim(config.model || provider.model || "");
        updateAiHubHeader();
    }

    function renderAiHubProviderButtons() {
        const grid = document.getElementById("aiHubProviderGrid");
        if (!grid) return;
        grid.innerHTML = "";
        aiHubModelChoices.forEach((choice) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "ai-hub-provider-btn" + (choice.id === aiHubRuntime.modelDraft ? " active" : "");
            button.textContent = choice.label;
            button.onclick = () => {
                aiHubRuntime.modelDraft = choice.id;
                const modelInput = document.getElementById("aiHubModelInput");
                if (modelInput) modelInput.value = choice.id;
                renderAiHubProviderButtons();
                setAiHubStatus(choice.id + " selected. Save it, then start the chat.", false);
            };
            grid.appendChild(button);
        });
    }

    function ensureAiHubGreeting() {
        if (aiHubRuntime.messages.length) return;
        aiHubRuntime.messages.push({
            role: "assistant",
            content: "HELLO MR/MRS",
            meta: "welcome"
        });
    }

    function scrollAiHubMessagesToBottom() {
        const list = document.getElementById("aiHubMessages");
        if (!list) return;
        window.setTimeout(() => {
            list.scrollTop = list.scrollHeight;
        }, 16);
    }

    function renderAiHubMessages() {
        const list = document.getElementById("aiHubMessages");
        if (!list) return;
        ensureAiHubGreeting();
        list.innerHTML = "";
        if (!aiHubRuntime.messages.length) {
            const empty = document.createElement("div");
            empty.className = "ai-hub-empty";
            empty.innerHTML = '<p class="ai-hub-empty-title">AI Console Ready</p><p class="ai-hub-empty-copy">Ask for scripts, hooks, motion concepts, captions, or premium client-facing copy.</p>';
            list.appendChild(empty);
            return;
        }
        aiHubRuntime.messages.forEach((message) => {
            const shell = document.createElement("div");
            shell.className = "ai-hub-msg " + (message.role === "user" ? "user" : "assistant");
            const role = document.createElement("div");
            role.className = "ai-hub-msg-role";
            const roleLabel = document.createElement("span");
            roleLabel.textContent = message.role === "user" ? "You" : "Google";
            role.appendChild(roleLabel);
            if (message.role === "assistant" && aiHubTrim(message.content)) {
                const tools = document.createElement("span");
                tools.className = "ai-hub-msg-tools";
                const copyBtn = document.createElement("button");
                copyBtn.type = "button";
                copyBtn.className = "ai-hub-copy-btn";
                copyBtn.textContent = "Copy";
                copyBtn.onclick = () => copyAiHubMessage(message.content, copyBtn);
                tools.appendChild(copyBtn);
                role.appendChild(tools);
            }
            const bubble = document.createElement("div");
            bubble.className = "ai-hub-msg-bubble";
            bubble.textContent = message.content;
            shell.appendChild(role);
            shell.appendChild(bubble);
            list.appendChild(shell);
        });
        scrollAiHubMessagesToBottom();
    }

    function addAiHubMessage(role, content) {
        aiHubRuntime.messages.push({ role: role === "user" ? "user" : "assistant", content: String(content || "") });
        renderAiHubMessages();
    }

    function copyAiHubMessage(text, button) {
        const content = String(text || "");
        if (!content) return;
        const markDone = () => {
            if (!button) return;
            const previous = button.textContent;
            button.textContent = "Copied";
            button.classList.add("done");
            window.setTimeout(() => {
                button.textContent = previous === "Copied" ? "Copy" : previous;
                button.classList.remove("done");
            }, 1200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(content).then(() => {
                setAiHubStatus("Reply copied.", false);
                markDone();
            }).catch(() => {
                fallbackCopyAiHubMessage(content, button);
            });
            return;
        }
        fallbackCopyAiHubMessage(content, button);
    }

    function fallbackCopyAiHubMessage(text, button) {
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "readonly");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
            setAiHubStatus("Reply copied.", false);
            if (button) {
                button.textContent = "Copied";
                button.classList.add("done");
                window.setTimeout(() => {
                    button.textContent = "Copy";
                    button.classList.remove("done");
                }, 1200);
            }
        } catch (err) {
            setAiHubStatus("Copy failed.", true);
        }
        document.body.removeChild(temp);
    }

    function clearAiHubConversation() {
        aiHubRuntime.messages = [];
        ensureAiHubGreeting();
        renderAiHubMessages();
        setAiHubStatus("Conversation cleared. Fresh start ready.", false);
    }

    function getAiHubProviderConfig(providerId) {
        const provider = aiHubProviders[0];
        const config = aiHubState.providers[provider.id] || {};
        return {
            id: provider.id,
            label: provider.label,
            model: aiHubTrim(config.model || provider.model || ""),
            baseUrl: provider.baseUrl || "",
            apiKey: aiHubTrim(config.apiKey || "")
        };
    }

    function aiHubNormalizeBaseUrl(baseUrl) {
        return aiHubTrim(baseUrl).replace(/\/+$/g, "");
    }

    function aiHubNodeJsonRequest(url, headers, body) {
        return new Promise(function(resolve, reject) {
            try {
                if (typeof require !== "function") {
                    reject(new Error("CEP Node request is not available."));
                    return;
                }
                const https = require("https");
                const http = require("http");
                const target = new URL(url);
                const payload = JSON.stringify(body || {});
                const requestHeaders = Object.assign({}, headers || {}, {
                    "Content-Length": Buffer.byteLength(payload)
                });
                const client = target.protocol === "http:" ? http : https;
                const req = client.request({
                    protocol: target.protocol,
                    hostname: target.hostname,
                    port: target.port || (target.protocol === "http:" ? 80 : 443),
                    path: target.pathname + target.search,
                    method: "POST",
                    headers: requestHeaders,
                    timeout: aiHubRequestTimeoutMs
                }, function(res) {
                    let text = "";
                    res.setEncoding("utf8");
                    res.on("data", function(chunk) {
                        text += chunk;
                        if (text.length > 4000000) {
                            try { req.destroy(new Error("Search response was too large.")); } catch (destroyErr) {}
                        }
                    });
                    res.on("end", function() {
                        let data = null;
                        try { data = text ? JSON.parse(text) : null; } catch (parseErr) {}
                        if (res.statusCode < 200 || res.statusCode >= 300) {
                            const message = data && data.error ? (data.error.message || data.error) : (text || ("Request failed (" + res.statusCode + ")"));
                            reject(new Error(message));
                            return;
                        }
                        resolve(data || {});
                    });
                });
                req.on("timeout", function() {
                    try { req.destroy(new Error("Search request timed out. Try again.")); } catch (timeoutErr) {}
                });
                req.on("error", function(err) {
                    reject(err && err.message ? err : new Error("Search request failed."));
                });
                req.write(payload);
                req.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    function aiHubJsonRequest(url, headers, body) {
        if (typeof require === "function") {
            return aiHubNodeJsonRequest(url, headers, body);
        }
        if (window.fetch) {
            const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
            const timeoutId = window.setTimeout(function() {
                if (controller) {
                    try { controller.abort(); } catch (abortErr) {}
                }
            }, aiHubRequestTimeoutMs);
            const fetchPromise = window.fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
                signal: controller ? controller.signal : undefined
            }).then(function(response) {
                return response.text().then(function(text) {
                    let data = null;
                    try { data = text ? JSON.parse(text) : null; } catch (parseErr) {}
                    if (!response.ok) {
                        const message = data && data.error ? (data.error.message || data.error) : (text || ("Request failed (" + response.status + ")"));
                        throw new Error(message);
                    }
                    return data || {};
                });
            }).catch(function(err) {
                if (err && err.name === "AbortError") throw new Error("Search request timed out. Try again.");
                throw err;
            });
            let raceTimeoutId = null;
            const timeoutPromise = new Promise(function(resolve, reject) {
                raceTimeoutId = window.setTimeout(function() {
                    reject(new Error("Search request timed out. Try again."));
                }, aiHubRequestTimeoutMs + 250);
            });
            return Promise.race([fetchPromise, timeoutPromise]).then(function(data) {
                window.clearTimeout(timeoutId);
                if (raceTimeoutId) window.clearTimeout(raceTimeoutId);
                return data;
            }, function(err) {
                window.clearTimeout(timeoutId);
                if (raceTimeoutId) window.clearTimeout(raceTimeoutId);
                throw err;
            });
        }
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.timeout = aiHubRequestTimeoutMs;
            Object.keys(headers).forEach(function(key) {
                xhr.setRequestHeader(key, headers[key]);
            });
            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;
                let data = null;
                try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch (parseErr) {}
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data || {});
                    return;
                }
                const message = data && data.error ? (data.error.message || data.error) : (xhr.responseText || ("Request failed (" + xhr.status + ")"));
                reject(new Error(message));
            };
            xhr.onerror = function() {
                reject(new Error("Network request failed."));
            };
            xhr.ontimeout = function() {
                reject(new Error("Search request timed out. Try again."));
            };
            xhr.send(JSON.stringify(body));
        });
    }

    function aiHubRequestNvidia(config, messages) {
        const baseUrl = aiHubNormalizeBaseUrl(config.baseUrl);
        const endpoint = /\/chat\/completions$/i.test(baseUrl) ? baseUrl : (baseUrl + "/chat/completions");
        return aiHubJsonRequest(endpoint, {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + config.apiKey
        }, {
            model: config.model,
            messages: messages.map(function(message) {
                return {
                    role: message.role === "assistant" ? "assistant" : "user",
                    content: message.content
                };
            })
        }).then(function(data) {
            if (data && data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                if (typeof content === "string") return content;
                if (content && content.length) {
                    return content.map(function(part) {
                        return typeof part === "string" ? part : (part.text || "");
                    }).join("");
                }
            }
            throw new Error("Search did not return a readable response.");
        });
    }

    function requestAiHubReply(config, messages) {
        if (!config.apiKey) return Promise.reject(new Error(config.label + " API key is missing."));
        if (!config.model) return Promise.reject(new Error(config.label + " model is missing."));
        if (!config.baseUrl) return Promise.reject(new Error("Chat is disabled. Use Google Search."));
        return aiHubRequestNvidia(config, messages).catch(function(err) {
            const raw = err && err.message ? err.message : "Search request failed.";
            if (/not found|not supported|model/i.test(raw)) {
                throw new Error("Chat model is disabled. Use Google Search.");
            }
            throw err;
        });
    }

    function sendAiHubPrompt() {
        if (aiHubRuntime.pending) return;
        const input = document.getElementById("aiHubPromptInput");
        const prompt = aiHubTrim(input ? input.value : "");
        if (!prompt) {
            setAiHubStatus("Write a prompt, then press Send.", true);
            return;
        }
        const config = getAiHubProviderConfig();
        if (!config.apiKey) {
            setAiHubStatus(config.label + " key is missing. Open Settings and save it.", true);
            setAiHubSettingsOpen(true);
            return;
        }
        addAiHubMessage("user", prompt);
        if (input) input.value = "";
        setAiHubPending(true);
        setAiHubStatus(config.label + " is thinking...", false);
        requestAiHubReply(config, aiHubRuntime.messages.filter(function(message) {
            return message.meta !== "welcome";
        })).then(function(reply) {
            addAiHubMessage("assistant", reply || "No reply received.");
            setAiHubStatus(config.label + " reply ready.", false);
            setAiHubPending(false);
        }).catch(function(err) {
            setAiHubStatus(err && err.message ? err.message : "AI request failed.", true);
            setAiHubPending(false);
        });
    }

    function openAiHubModal() {
        startAiGuestServer();
        setAiHubSettingsOpen(false);
        setAiSearchAiMode(false);
        setAiSearchEngine("youtube");
        ensureAiSearchTabs();
        setAiHubMode("search");
        setAiToolSection("google");
        const activeTab = getActiveSearchTab();
        if (!activeTab || !(activeTab.currentUrl || activeTab.url)) openAiSearchHome(true);
        else loadAiSearchTab(activeTab);
        setAiHubStatus("YouTube search ready.", false);
        setAiHubModalOpen(true);
    }

    function closeAiHubModal() {
        setAiHubSettingsOpen(false);
        resetAiGuestSession();
        setAiHubModalOpen(false);
    }

    function hideAiHubModalKeepSession() {
        setAiHubSettingsOpen(false);
        saveActiveSearchTab();
        setAiHubModalOpen(false);
    }

    function openExternalUrl(url) {
        try {
            if (window.cep && window.cep.util && window.cep.util.openURLInDefaultBrowser) {
                window.cep.util.openURLInDefaultBrowser(url);
            } else {
                window.open(url, "_blank");
            }
        } catch (openErr) {
            window.open(url, "_blank");
        }
    }

    function openAiHubCompanion() {
        setAiHubMode("search");
        setAiSearchEngine("youtube");
        openAiSearchHome(true);
        setAiHubStatus("YouTube search ready.", false);
    }

    function normalizeAiSearchUrl(value) {
        const query = aiHubTrim(value);
        if (!query) return "";
        if (/^https?:\/\//i.test(query)) return query;
        if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(query)) return "https://" + query;
        return "https://www.google.com/search?igu=1&q=" + encodeURIComponent(query);
    }

    function copyAiTextToClipboard(text, successMessage) {
        const value = String(text || "");
        const done = () => setAiHubStatus(successMessage || "Copied.", false);
        const fail = () => setAiHubStatus("Copy failed.", true);
        const fallback = () => {
            const area = document.createElement("textarea");
            area.value = value;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.left = "-9999px";
            document.body.appendChild(area);
            area.select();
            try {
                document.execCommand("copy");
                done();
            } catch (err) {
                fail();
            }
            if (area.parentNode) area.parentNode.removeChild(area);
        };
        if (!value) return fail();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value).then(done).catch(fallback);
        } else {
            fallback();
        }
    }

    function dataUrlToBlob(dataUrl) {
        const match = /^data:([^;,]+);base64,(.+)$/i.exec(String(dataUrl || ""));
        if (!match) throw new Error("Image data was invalid.");
        const binary = atob(match[2]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: match[1] || "image/png" });
    }

    function copyImageFileToWindowsClipboard(filePath) {
        return new Promise(function(resolve, reject) {
            try {
                if (typeof require !== "function") throw new Error("Node clipboard fallback is not available.");
                const childProcess = require("child_process");
                const safePath = String(filePath || "").replace(/\\/g, "\\\\").replace(/'/g, "''");
                const script = [
                    "Add-Type -AssemblyName System.Windows.Forms",
                    "Add-Type -AssemblyName System.Drawing",
                    "$img=[System.Drawing.Image]::FromFile('" + safePath + "')",
                    "try { [System.Windows.Forms.Clipboard]::SetImage($img) } finally { $img.Dispose() }"
                ].join("; ");
                const child = childProcess.spawn("powershell.exe", [
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-Command", script
                ], { windowsHide: true });
                let errorText = "";
                child.stderr.on("data", function(chunk) { errorText += String(chunk || ""); });
                child.on("error", reject);
                child.on("close", function(code) {
                    if (code === 0) resolve();
                    else reject(new Error(errorText || "Windows clipboard copy failed."));
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    function copyImageDataUrlToClipboard(dataUrl, mimeType) {
        return new Promise(function(resolve, reject) {
            const type = String(mimeType || "image/png").toLowerCase();
            const useBrowserClipboard = function() {
                try {
                    if (!navigator.clipboard || !navigator.clipboard.write || typeof ClipboardItem === "undefined") throw new Error("Browser image clipboard is not available.");
                    const blob = dataUrlToBlob(dataUrl);
                    const pngType = blob.type || type || "image/png";
                    return navigator.clipboard.write([new ClipboardItem({ [pngType]: blob })]);
                } catch (err) {
                    return Promise.reject(err);
                }
            };
            useBrowserClipboard().then(resolve).catch(function() {
                const saved = writeClipboardImageFile(dataUrl, type);
                if (!saved.ok) {
                    reject(new Error(saved.error || "Image save failed."));
                    return;
                }
                copyImageFileToWindowsClipboard(saved.path).then(resolve).catch(reject);
            });
        });
    }

    function copyAiFrameImageToClipboard(url) {
        const safeUrl = String(url || "").trim();
        if (!safeUrl) {
            setAiHubStatus("Image nahi mili. Image ke center par right-click karo.", true);
            return;
        }
        hideAiFrameImportMenu();
        setAiHubStatus("Copying image...", false);
        fetchAiFrameImageAsDataUrl(safeUrl).then(function(payload) {
            return copyImageDataUrlToClipboard(payload.dataUrl, payload.mimeType || "image/png");
        }).then(function() {
            setAiHubStatus("Image copied.", false);
        }).catch(function(err) {
            setAiHubStatus(err && err.message ? err.message : "Image copy failed.", true);
        });
    }

    function importAiImageDataUrl(dataUrl, mimeType) {
        const saved = writeClipboardImageFile(String(dataUrl || ""), mimeType || "image/png");
        if (!saved.ok) {
            setAiHubStatus(saved.error || "Image save failed.", true);
            return;
        }
        setAiHubStatus("Importing image...", false);
        csInterface.evalScript(
            "toolkit.importPastedImage('" + escapeScriptString(saved.path) + "')",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setAiHubStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Image import failed.", true);
                    return;
                }
                setAiHubStatus(res.indexOf("success::") === 0 ? res.substring(9) : "Image imported.", false);
            }
        );
    }

    function getAiBgRemovalPublicPath() {
        return buildLocalGuestUrl("/bg-remover/") || "";
    }

    function waitAiGuestServerReady() {
        if (aiHubRuntime.guestServerFailed && !aiHubRuntime.guestServerReady) {
            aiHubRuntime.guestServerFailed = false;
        }
        startAiGuestServer();
        return new Promise(function(resolve, reject) {
            const startedAt = Date.now();
            function check() {
                if (aiHubRuntime.guestServerReady && getAiBgRemovalPublicPath()) {
                    resolve(getAiBgRemovalPublicPath());
                    return;
                }
                if (aiHubRuntime.guestServerFailed) {
                    reject(new Error("Local background remover server failed to start."));
                    return;
                }
                if (Date.now() - startedAt > 6000) {
                    reject(new Error("Local background remover server timed out."));
                    return;
                }
                window.setTimeout(check, 80);
            }
            check();
        });
    }

    function verifyAiBgRemovalAssets(publicPath) {
        return window.fetch(publicPath + "resources.json", { cache: "no-store" }).then(function(response) {
            if (!response.ok) throw new Error("Offline BG model metadata missing: " + response.status);
            return response.json();
        }).then(function(resources) {
            if (!resources || !resources["/models/isnet_fp16"]) {
                throw new Error("Offline BG model files are incomplete.");
            }
            return publicPath;
        });
    }

    function loadAiBgRemovalModule() {
        if (aiBgRemovalRuntime.module) return Promise.resolve(aiBgRemovalRuntime.module);
        if (aiBgRemovalRuntime.moduleError) return Promise.reject(new Error(aiBgRemovalRuntime.moduleError));
        return new Promise(function(resolve, reject) {
            const finish = function() {
                const module = window.KWVBackgroundRemoval;
                const removeBackground = module && module.removeBackground;
                if (typeof removeBackground !== "function") {
                    aiBgRemovalRuntime.moduleError = "Background remover did not load.";
                    reject(new Error(aiBgRemovalRuntime.moduleError));
                    return;
                }
                aiBgRemovalRuntime.module = {
                    removeBackground: removeBackground,
                    preload: module.preload || null
                };
                resolve(aiBgRemovalRuntime.module);
            };
            if (window.KWVBackgroundRemoval) {
                finish();
                return;
            }
            const script = document.createElement("script");
            script.src = "js/bg-remover.bundle.js?v=20260712-offline-bg";
            script.onload = finish;
            script.onerror = function() {
                aiBgRemovalRuntime.moduleError = "Background remover bundle failed to load.";
                reject(new Error(aiBgRemovalRuntime.moduleError));
            };
            document.head.appendChild(script);
        });
    }

    function blobToDataUrlAsync(blob) {
        return new Promise(function(resolve, reject) {
            const reader = new FileReader();
            reader.onload = function() { resolve(String(reader.result || "")); };
            reader.onerror = function() { reject(new Error("Image read failed.")); };
            reader.readAsDataURL(blob);
        });
    }

    function removeAiImageBackgroundDataUrl(dataUrl, mimeType) {
        return waitAiGuestServerReady().then(verifyAiBgRemovalAssets).then(function(publicPath) {
            return loadAiBgRemovalModule().then(function(module) {
                return { module: module, publicPath: publicPath };
            });
        }).then(function(payload) {
            const module = payload.module;
            const publicPath = payload.publicPath;
            return window.fetch(String(dataUrl || "")).then(function(response) {
                if (!response.ok) throw new Error("Image decode failed.");
                return response.blob();
            }).then(function(inputBlob) {
                const config = {
                    publicPath: publicPath,
                    model: "isnet_fp16",
                    device: "cpu",
                    proxyToWorker: false,
                    output: { format: "image/png", quality: 1 },
                    progress: function(key, current, total) {
                        if (/compute/i.test(key || "")) {
                            setAiHubStatus("Removing background offline... " + Math.round((current / Math.max(total || 1, 1)) * 100) + "%", false);
                        }
                    }
                };
                return module.removeBackground(inputBlob, config);
            }).then(function(outputBlob) {
                return blobToDataUrlAsync(outputBlob);
            });
        });
    }

    function getExtensionRootPathForNode() {
        try {
            if (typeof require === "function") {
                const path = require("path");
                if (typeof __dirname !== "undefined" && /[\\\/]js$/i.test(String(__dirname))) {
                    return path.resolve(__dirname, "..");
                }
            }
        } catch (err) {}
        try {
            const raw = decodeURIComponent(String(window.location && window.location.pathname ? window.location.pathname : ""));
            const normalized = raw.replace(/^\/([A-Za-z]:\/)/, "$1");
            if (normalized && typeof require === "function") return require("path").dirname(normalized);
        } catch (err) {}
        return "";
    }

    function getNodeExecutableForCep() {
        try {
            if (typeof process !== "undefined" && /node(\.exe)?$/i.test(String(process.execPath || ""))) return process.execPath;
        } catch (err) {}
        if (typeof require !== "function") return "node";
        try {
            const fs = require("fs");
            const childProcess = require("child_process");
            const platform = (typeof process !== "undefined" && process.platform) ? process.platform : "";
            const candidates = platform === "win32" ? [
                "C:\\Program Files\\nodejs\\node.exe",
                "C:\\Program Files (x86)\\nodejs\\node.exe"
            ] : [
                "/opt/homebrew/bin/node",
                "/usr/local/bin/node",
                "/usr/bin/node",
                "/bin/node"
            ];
            for (let i = 0; i < candidates.length; i++) {
                if (fs.existsSync(candidates[i])) return candidates[i];
            }
            try {
                const found = platform === "win32"
                    ? childProcess.execFileSync("where", ["node"], { encoding: "utf8", windowsHide: true })
                    : childProcess.execFileSync("/bin/zsh", ["-lc", "command -v node"], { encoding: "utf8" });
                const first = String(found || "").split(/\r?\n/).filter(Boolean)[0] || "";
                if (first && fs.existsSync(first)) return first;
            } catch (lookupErr) {}
        } catch (outerErr) {}
        return "node";
    }

    function importAiImageFilePath(filePath, label) {
        setAiHubStatus(label || "Importing image...", false);
        csInterface.evalScript(
            "toolkit.importPastedImage('" + escapeScriptString(filePath) + "')",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setAiHubStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Image import failed.", true);
                    return;
                }
                setAiHubStatus(res.indexOf("success::") === 0 ? res.substring(9) : "Image imported.", false);
            }
        );
    }

    function normalizeBgRemoverPath(filePath) {
        return String(filePath || "").replace(/\\/g, "/");
    }

    function sanitizeBgRemoverFileName(name) {
        const cleaned = String(name || "")
            .replace(/\.[a-z0-9]{2,5}$/i, "")
            .replace(/[\\/:*?"<>|]+/g, "-")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 90);
        return cleaned || "image";
    }

    function getDefaultBgRemoverOutputFolder() {
        try {
            const os = require("os");
            const path = require("path");
            const home = os.homedir ? os.homedir() : "";
            return home ? path.join(home, "Downloads", "Keshav Velo BG Remover") : "";
        } catch (err) {
            try {
                const docs = csInterface.getSystemPath(SystemPath.MY_DOCUMENTS) || "";
                return docs ? docs.replace(/\\/g, "/") + "/Keshav Velo BG Remover" : "";
            } catch (fallbackErr) {
                return "";
            }
        }
    }

    function getBgRemoverOutputFolder() {
        if (bgRemoverPanelState.outputFolder) return bgRemoverPanelState.outputFolder;
        let saved = "";
        try { saved = window.localStorage ? (window.localStorage.getItem(bgRemoverFolderStorageKey) || "") : ""; } catch (err) {}
        bgRemoverPanelState.outputFolder = saved || getDefaultBgRemoverOutputFolder();
        return bgRemoverPanelState.outputFolder;
    }

    function ensureBgRemoverOutputFolder(folderPath) {
        if (!folderPath || typeof require !== "function") return false;
        try {
            const fs = require("fs");
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
            return fs.existsSync(folderPath);
        } catch (err) {
            return false;
        }
    }

    function updateBgRemoverFolderLabel(outputPath) {
        const pathEl = document.getElementById("bgRemoverFolderPath");
        if (!pathEl) return;
        const folder = getBgRemoverOutputFolder();
        const display = normalizeBgRemoverPath(folder || "Choose save folder");
        pathEl.textContent = display;
        pathEl.title = outputPath ? normalizeBgRemoverPath(outputPath) : display;
    }

    function saveBgRemoverOutputFolder(folderPath) {
        const safePath = String(folderPath || "").trim();
        if (!safePath) return false;
        bgRemoverPanelState.outputFolder = safePath;
        try { if (window.localStorage) window.localStorage.setItem(bgRemoverFolderStorageKey, safePath); } catch (err) {}
        updateBgRemoverFolderLabel();
        return true;
    }

    function chooseBgRemoverOutputFolder() {
        if (bgRemoverPanelState.processing || aiBgRemovalRuntime.running) {
            setBgRemoverPanelStatus("Wait for BG Remover to finish.", true);
            return;
        }
        const finish = function(folder) {
            if (!folder) return;
            if (!ensureBgRemoverOutputFolder(folder)) {
                setBgRemoverPanelStatus("Selected save folder cannot be used.", true);
                return;
            }
            saveBgRemoverOutputFolder(folder);
            setBgRemoverPanelStatus("Save folder set.", false);
        };
        const platform = (typeof process !== "undefined" && process.platform) ? process.platform : "";
        if (platform === "win32") {
            selectVideoConverterFolderNative("Choose BG Remover Save Folder", finish);
            return;
        }
        if (window.cep && window.cep.fs && window.cep.fs.showOpenDialog) {
            try {
                const result = window.cep.fs.showOpenDialog(false, true, "Choose BG Remover Save Folder", getBgRemoverOutputFolder() || "", []);
                const folder = result && result.data && result.data[0] ? String(result.data[0]) : "";
                if (folder) {
                    finish(folder);
                    return;
                }
            } catch (dialogErr) {}
        }
        selectVideoConverterFolderNative("Choose BG Remover Save Folder", finish);
    }

    function setBgRemoverFolderPickerDisabled(isDisabled) {
        const btn = document.getElementById("btnBgRemoverChooseFolder");
        if (btn) btn.disabled = !!isDisabled;
    }

    function getAvailableBgRemoverOutputPath(targetPath) {
        const fs = require("fs");
        const path = require("path");
        if (!fs.existsSync(targetPath)) return targetPath;
        const parsed = path.parse(targetPath);
        for (let i = 1; i < 1000; i++) {
            const next = path.join(parsed.dir, parsed.name + " (" + i + ")" + parsed.ext);
            if (!fs.existsSync(next)) return next;
        }
        return path.join(parsed.dir, parsed.name + " " + Date.now() + parsed.ext);
    }

    function getBgRemoverOutputPath(originalName) {
        if (typeof require !== "function") throw new Error("CEP Node is not enabled.");
        const path = require("path");
        const folder = getBgRemoverOutputFolder() || ensureClipboardFolder();
        if (!ensureBgRemoverOutputFolder(folder)) throw new Error("BG Remover save folder cannot be used.");
        const baseName = sanitizeBgRemoverFileName(originalName || "image");
        const targetPath = path.join(folder, baseName + "_bg_removed_" + Date.now() + ".png");
        return normalizeBgRemoverPath(getAvailableBgRemoverOutputPath(targetPath));
    }

    function removeAiImageBackgroundWithNode(dataUrl, mimeType, originalName) {
        return new Promise(function(resolve, reject) {
            try {
                if (typeof require !== "function") throw new Error("CEP Node is not enabled.");
                const childProcess = require("child_process");
                const fs = require("fs");
                const path = require("path");
                const input = writeClipboardImageFile(String(dataUrl || ""), mimeType || "image/png");
                if (!input.ok) throw new Error(input.error || "Could not save image for Remove BG.");
                const outputPath = getBgRemoverOutputPath(originalName || "image");
                const extensionRoot = getExtensionRootPathForNode();
                const scriptPath = path.join(extensionRoot, "js", "remove-bg-node.js");
                const args = [scriptPath, input.path.replace(/\//g, path.sep), outputPath.replace(/\//g, path.sep)];
                const nodeExe = getNodeExecutableForCep();
                const child = childProcess.spawn(nodeExe, args, {
                    cwd: extensionRoot || undefined,
                    windowsHide: true
                });
                let stderr = "";
                child.stderr.on("data", function(chunk) {
                    stderr += chunk.toString();
                });
                child.on("error", function(err) {
                    reject(new Error((err && err.message ? err.message : "Node Remove BG failed.") + " Install/enable Node.js if needed."));
                });
                child.on("close", function(code) {
                    if (code !== 0) {
                        reject(new Error(stderr.trim() || ("Remove BG helper exited with code " + code + ".")));
                        return;
                    }
                    resolve(outputPath);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    function importAiImageDataUrlWithRemovedBg(dataUrl, mimeType) {
        if (aiBgRemovalRuntime.running) {
            setAiHubStatus("Background remover is already running.", true);
            return;
        }
        aiBgRemovalRuntime.running = true;
        setAiHubStatus("Removing background offline...", false);
        removeAiImageBackgroundWithNode(dataUrl, mimeType || "image/png", "image").then(function(cleanFilePath) {
            aiBgRemovalRuntime.running = false;
            importAiImageFilePath(cleanFilePath, "Background removed. Importing PNG...");
        }).catch(function(err) {
            aiBgRemovalRuntime.running = false;
            setAiHubStatus(err && err.message ? err.message : "Background removal failed.", true);
        });
    }

    function localFilePathToUrl(filePath) {
        const normalized = String(filePath || "").replace(/\\/g, "/");
        if (!normalized) return "";
        return encodeURI("file:///" + normalized.replace(/^\/+/, ""));
    }

    function setBgRemoverPanelStatus(message, isError) {
        const status = document.getElementById("bgRemoverStatus");
        if (!status) return;
        status.textContent = message || "";
        status.classList.toggle("error", !!isError);
    }

    function setBgRemoverProgress(value, label) {
        const progress = document.getElementById("bgRemoverProgress");
        const fill = document.getElementById("bgRemoverProgressFill");
        const progressValue = document.getElementById("bgRemoverProgressValue");
        const progressLabel = document.getElementById("bgRemoverProgressLabel");
        const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
        if (progress) {
            progress.setAttribute("aria-valuenow", String(pct));
            progress.classList.toggle("processing", !!bgRemoverPanelState.processing && pct > 0 && pct < 100);
        }
        if (fill) fill.style.transform = "scaleX(" + (pct / 100).toFixed(4) + ")";
        if (progressValue) progressValue.textContent = pct + "%";
        if (progressLabel) progressLabel.textContent = label || (pct >= 100 ? "Done" : "Ready");
    }

    function stopBgRemoverProgressTimer() {
        if (bgRemoverPanelState.progressTimer) {
            window.cancelAnimationFrame(bgRemoverPanelState.progressTimer);
            bgRemoverPanelState.progressTimer = null;
        }
    }

    function startBgRemoverProgressTimer() {
        stopBgRemoverProgressTimer();
        bgRemoverPanelState.startedAt = Date.now();
        const tick = function() {
            if (!bgRemoverPanelState.processing) {
                stopBgRemoverProgressTimer();
                return;
            }
            const elapsed = Math.max(0, Date.now() - bgRemoverPanelState.startedAt);
            const target = 92;
            const eased = 18 + ((target - 18) * (1 - Math.exp(-elapsed / 2600)));
            setBgRemoverProgress(eased, elapsed < 900 ? "Reading" : "Removing");
            bgRemoverPanelState.progressTimer = window.requestAnimationFrame(tick);
        };
        bgRemoverPanelState.progressTimer = window.requestAnimationFrame(tick);
    }

    function resetBgRemoverPanel() {
        stopBgRemoverProgressTimer();
        bgRemoverPanelState.processing = false;
        bgRemoverPanelState.outputPath = "";
        const preview = document.getElementById("bgRemoverPreview");
        const image = document.getElementById("bgRemoverPreviewImage");
        const importBtn = document.getElementById("btnBgRemoverImport");
        const fileInput = document.getElementById("bgRemoverFileInput");
        if (preview) preview.classList.remove("ready");
        if (image) image.removeAttribute("src");
        if (importBtn) importBtn.disabled = true;
        if (fileInput) fileInput.value = "";
        setBgRemoverFolderPickerDisabled(false);
        updateBgRemoverFolderLabel();
        setBgRemoverProgress(0, "Ready");
        setBgRemoverPanelStatus("Ready.", false);
    }

    function showBgRemoverOutput(filePath) {
        bgRemoverPanelState.outputPath = filePath || "";
        const preview = document.getElementById("bgRemoverPreview");
        const image = document.getElementById("bgRemoverPreviewImage");
        const importBtn = document.getElementById("btnBgRemoverImport");
        if (image) image.src = localFilePathToUrl(filePath) + "?v=" + Date.now();
        if (preview) preview.classList.add("ready");
        if (importBtn) importBtn.disabled = !filePath;
        updateBgRemoverFolderLabel(filePath);
    }

    function readBgRemoverFile(file) {
        return new Promise(function(resolve, reject) {
            if (!file || !/^image\//i.test(String(file.type || ""))) {
                reject(new Error("Select an image file."));
                return;
            }
            const reader = new FileReader();
            reader.onload = function() {
                resolve({ dataUrl: String(reader.result || ""), mimeType: file.type || "image/png", name: file.name || "image" });
            };
            reader.onerror = function() {
                reject(new Error("Could not read image."));
            };
            reader.readAsDataURL(file);
        });
    }

    function processBgRemoverDataUrl(dataUrl, mimeType, name) {
        if (bgRemoverPanelState.processing || aiBgRemovalRuntime.running) {
            setBgRemoverPanelStatus("Background remover is already running.", true);
            return;
        }
        bgRemoverPanelState.processing = true;
        aiBgRemovalRuntime.running = true;
        bgRemoverPanelState.outputPath = "";
        const importBtn = document.getElementById("btnBgRemoverImport");
        const preview = document.getElementById("bgRemoverPreview");
        const image = document.getElementById("bgRemoverPreviewImage");
        if (importBtn) importBtn.disabled = true;
        setBgRemoverFolderPickerDisabled(true);
        if (preview) preview.classList.remove("ready");
        if (image) image.removeAttribute("src");
        setBgRemoverPanelStatus(name || "Processing image...", false);
        setBgRemoverProgress(18, "Reading");
        startBgRemoverProgressTimer();
        removeAiImageBackgroundWithNode(dataUrl, mimeType || "image/png", name || "image").then(function(outputPath) {
            bgRemoverPanelState.processing = false;
            aiBgRemovalRuntime.running = false;
            setBgRemoverFolderPickerDisabled(false);
            stopBgRemoverProgressTimer();
            setBgRemoverProgress(100, "Done");
            showBgRemoverOutput(outputPath);
            setBgRemoverPanelStatus("Removed image ready.", false);
        }).catch(function(err) {
            bgRemoverPanelState.processing = false;
            aiBgRemovalRuntime.running = false;
            setBgRemoverFolderPickerDisabled(false);
            stopBgRemoverProgressTimer();
            setBgRemoverProgress(0, "Ready");
            setBgRemoverPanelStatus(err && err.message ? err.message : "BG remove failed.", true);
        });
    }

    function processBgRemoverFile(file) {
        if (bgRemoverPanelState.processing || aiBgRemovalRuntime.running) {
            setBgRemoverPanelStatus("Background remover is already running.", true);
            return;
        }
        bgRemoverPanelState.processing = true;
        aiBgRemovalRuntime.running = true;
        bgRemoverPanelState.outputPath = "";
        const importBtn = document.getElementById("btnBgRemoverImport");
        const preview = document.getElementById("bgRemoverPreview");
        const image = document.getElementById("bgRemoverPreviewImage");
        if (importBtn) importBtn.disabled = true;
        setBgRemoverFolderPickerDisabled(true);
        if (preview) preview.classList.remove("ready");
        if (image) image.removeAttribute("src");
        setBgRemoverPanelStatus(file && file.name ? file.name : "Processing image...", false);
        setBgRemoverProgress(8, "Reading");
        startBgRemoverProgressTimer();
        readBgRemoverFile(file).then(function(payload) {
            setBgRemoverProgress(24, "Removing");
            return removeAiImageBackgroundWithNode(payload.dataUrl, payload.mimeType, payload.name || (file && file.name) || "image");
        }).then(function(outputPath) {
            bgRemoverPanelState.processing = false;
            aiBgRemovalRuntime.running = false;
            setBgRemoverFolderPickerDisabled(false);
            stopBgRemoverProgressTimer();
            setBgRemoverProgress(100, "Done");
            showBgRemoverOutput(outputPath);
            setBgRemoverPanelStatus("Removed image ready.", false);
        }).catch(function(err) {
            bgRemoverPanelState.processing = false;
            aiBgRemovalRuntime.running = false;
            setBgRemoverFolderPickerDisabled(false);
            stopBgRemoverProgressTimer();
            setBgRemoverProgress(0, "Ready");
            setBgRemoverPanelStatus(err && err.message ? err.message : "BG remove failed.", true);
        });
    }

    function initBgRemoverPanel() {
        const drop = document.getElementById("bgRemoverDrop");
        const fileInput = document.getElementById("bgRemoverFileInput");
        const importBtn = document.getElementById("btnBgRemoverImport");
        const clearBtn = document.getElementById("btnBgRemoverClear");
        const folderBtn = document.getElementById("btnBgRemoverChooseFolder");
        if (!drop || drop.__kwvBgRemoverBound) return;
        drop.__kwvBgRemoverBound = true;
        const openPicker = function() {
            if (fileInput) fileInput.click();
        };
        drop.addEventListener("click", openPicker);
        drop.addEventListener("keydown", function(event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPicker();
            }
        });
        drop.addEventListener("dragover", function(event) {
            event.preventDefault();
            drop.classList.add("dragging");
        });
        drop.addEventListener("dragleave", function() {
            drop.classList.remove("dragging");
        });
        drop.addEventListener("drop", function(event) {
            event.preventDefault();
            drop.classList.remove("dragging");
            const file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
            if (file) processBgRemoverFile(file);
        });
        if (fileInput) {
            fileInput.onchange = function() {
                const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
                if (file) processBgRemoverFile(file);
            };
        }
        if (clearBtn) clearBtn.onclick = resetBgRemoverPanel;
        if (folderBtn) folderBtn.onclick = chooseBgRemoverOutputFolder;
        if (importBtn) {
            importBtn.onclick = function() {
                if (!bgRemoverPanelState.outputPath) {
                    setBgRemoverPanelStatus("No removed image ready.", true);
                    return;
                }
                importAiImageFilePath(bgRemoverPanelState.outputPath, "Importing removed image...");
            };
        }
        resetBgRemoverPanel();
    }

    function hideAiFrameImportMenu() {
        const menu = document.getElementById("aiFrameImportMenu");
        if (menu) menu.classList.remove("active");
    }

    function getAiFrameImportQuery() {
        const input = document.getElementById("aiSearchInput");
        const tab = getActiveSearchTab();
        let value = aiHubTrim(input && input.value ? input.value : (tab && tab.input ? tab.input : ""));
        try {
            const url = tab ? (tab.externalUrl || tab.currentUrl || tab.url || "") : "";
            if (url && /google\./i.test(url)) {
                const parsed = new URL(url);
                value = parsed.searchParams.get("q") || parsed.searchParams.get("igu") || value;
            }
        } catch (err) {}
        value = String(value || "").replace(/^https?:\/\/\S+/i, "").trim();
        return value || "png";
    }

    function openAiFrameImportSearch() {
        const query = getAiFrameImportQuery();
        hideAiFrameImportMenu();
        setAiSearchEngine("images", { silent: true });
        navigateAiSearch(query, true);
        setAiHubStatus("Opening image import mode. Drag a card to the Import popup or right-click Import Image.", false);
    }

    function normalizeAiFrameImageUrl(url, baseUrl) {
        const raw = String(url || "").trim();
        if (!raw) return "";
        if (/^blob:/i.test(raw)) return raw;
        if (/^data:image\//i.test(raw)) return raw;
        try {
            const parsed = new URL(raw, baseUrl || window.location.href);
            const imageParam = parsed.searchParams.get("imgurl") || parsed.searchParams.get("img_url") || parsed.searchParams.get("mediaurl") || parsed.searchParams.get("url");
            if (imageParam && /^https?:\/\//i.test(imageParam)) return imageParam;
            return parsed.toString();
        } catch (err) {
            return raw;
        }
    }

    function getAiFrameAnchorOriginalImageUrl(node, baseUrl) {
        let current = node;
        let depth = 0;
        while (current && depth < 8) {
            if (current.getAttribute) {
                const href = current.getAttribute("href") || "";
                if (href) {
                    const normalized = normalizeAiFrameImageUrl(href, baseUrl);
                    if (normalized && /^https?:\/\//i.test(normalized)) return normalized;
                }
            }
            current = current.parentElement;
            depth += 1;
        }
        return "";
    }

    function rememberAiFrameImportTarget(frame, imageUrl, event) {
        if (imageUrl) aiHubRuntime.pendingImportImageUrl = imageUrl;
        if (frame && event && typeof event.clientX === "number" && typeof event.clientY === "number") {
            aiHubRuntime.pendingImportPoint = {
                tabId: frame.getAttribute("data-tab-id") || "",
                x: event.clientX,
                y: event.clientY
            };
        }
        const menu = document.getElementById("aiFrameImportMenu");
        if (menu && imageUrl) menu.setAttribute("data-image-url", imageUrl);
    }

    function readAiFrameImageCandidate(node, baseUrl) {
        if (!node) return "";
        const tag = String(node.tagName || "").toLowerCase();
        if (tag === "img" || tag === "image") {
            const fromAnchor = getAiFrameAnchorOriginalImageUrl(node, baseUrl);
            if (fromAnchor) return fromAnchor;
            const attrs = ["data-iurl", "data-original", "data-lazy-src", "data-src"];
            for (let i = 0; i < attrs.length; i++) {
                const value = node.getAttribute && node.getAttribute(attrs[i]);
                const normalized = normalizeAiFrameImageUrl(value, baseUrl);
                if (normalized && (/^data:image\//i.test(normalized) || /^https?:\/\//i.test(normalized) || /^blob:/i.test(normalized))) return normalized;
            }
            const direct = node.currentSrc || node.src || node.getAttribute("src");
            const srcset = node.getAttribute && (node.getAttribute("srcset") || node.getAttribute("data-srcset"));
            if (direct) return normalizeAiFrameImageUrl(direct, baseUrl);
            if (srcset) {
                const parts = String(srcset).split(",").map(function(part) { return part.trim().split(/\s+/)[0]; }).filter(Boolean);
                const last = parts.length ? parts[parts.length - 1] : "";
                if (last) return normalizeAiFrameImageUrl(last, baseUrl);
            }
        }
        if (node.getAttribute) {
            const attrs = ["data-iurl", "data-ou", "data-original", "data-lazy-src", "data-src", "data-thumbnail-url", "href"];
            for (let i = 0; i < attrs.length; i++) {
                const value = node.getAttribute(attrs[i]);
                const normalized = normalizeAiFrameImageUrl(value, baseUrl);
                if (normalized && (/^data:image\//i.test(normalized) || /^https?:\/\//i.test(normalized) || /^blob:/i.test(normalized))) return normalized;
            }
        }
        try {
            const view = node.ownerDocument && node.ownerDocument.defaultView;
            const background = view ? view.getComputedStyle(node).backgroundImage : "";
            const match = /url\((['"]?)(.*?)\1\)/i.exec(background || "");
            if (match && match[2]) return normalizeAiFrameImageUrl(match[2], baseUrl);
        } catch (err) {}
        return "";
    }

    function findAiFrameImageUrlFromEvent(event, frame) {
        const doc = frame && (frame.contentDocument || (frame.contentWindow && frame.contentWindow.document));
        const baseUrl = doc && doc.location ? doc.location.href : "";
        let node = event && event.target ? event.target : null;
        let depth = 0;
        while (node && depth < 7) {
            const candidate = readAiFrameImageCandidate(node, baseUrl);
            if (candidate) return candidate;
            node = node.parentElement;
            depth += 1;
        }
        return "";
    }

    function findAiFrameImageUrlFromLastPoint() {
        const point = aiHubRuntime.pendingImportPoint || null;
        const frame = getActiveAiSearchFrame();
        if (!point || !frame) return "";
        try {
            const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
            if (!doc || typeof doc.elementFromPoint !== "function") return "";
            const node = doc.elementFromPoint(point.x, point.y);
            if (!node) return "";
            return findAiFrameImageUrlFromEvent({ target: node, clientX: point.x, clientY: point.y }, frame);
        } catch (err) {
            return "";
        }
    }

    function getAiFramePendingImageUrl() {
        const menu = document.getElementById("aiFrameImportMenu");
        return (menu ? menu.getAttribute("data-image-url") || "" : "") ||
            aiHubRuntime.pendingImportImageUrl ||
            findAiFrameImageUrlFromLastPoint();
    }

    function isAiFrameImageImportContext(frame) {
        const tab = frame ? getAiSearchTabById(frame.getAttribute("data-tab-id") || "") : getActiveSearchTab();
        const url = String(tab && (tab.currentUrl || tab.url || tab.externalUrl) || "");
        const engine = String(tab && tab.engine || aiHubRuntime.searchEngine || "");
        return engine === "images" || /\/img-search(?:[?#]|$)|\/img-results(?:[?#]|$)/i.test(url);
    }

    function fetchAiFrameImageAsDataUrl(url) {
        return new Promise(function(resolve, reject) {
            if (!url) {
                reject(new Error("Image URL was not found."));
                return;
            }
            if (/^data:image\//i.test(url)) {
                const mimeType = (/^data:([^;,]+)/i.exec(url) || [null, "image/png"])[1] || "image/png";
                resolve({ dataUrl: url, mimeType: mimeType });
                return;
            }
            const proxyUrl = buildLocalGuestUrl("/img-proxy?url=" + encodeURIComponent(url));
            if (!proxyUrl) {
                reject(new Error("Image proxy is not ready."));
                return;
            }
            window.fetch(proxyUrl).then(function(response) {
                if (!response.ok) throw new Error("Image fetch failed.");
                return response.blob();
            }).then(function(blob) {
                const reader = new FileReader();
                reader.onload = function() {
                    resolve({ dataUrl: String(reader.result || ""), mimeType: blob.type || "image/png" });
                };
                reader.onerror = function() {
                    reject(new Error("Image read failed."));
                };
                reader.readAsDataURL(blob);
            }).catch(reject);
        });
    }

    function importAiFrameImageUrl(url, removeBg) {
        const safeUrl = String(url || "").trim();
        if (!safeUrl) {
            openAiFrameImportSearch();
            return;
        }
        hideAiFrameImportMenu();
        removeBg = removeBg !== false;
        setAiHubStatus(removeBg ? "Preparing image for offline background removal..." : "Importing dragged image...", false);
        fetchAiFrameImageAsDataUrl(safeUrl).then(function(payload) {
            if (removeBg) importAiImageDataUrlWithRemovedBg(payload.dataUrl, payload.mimeType);
            else importAiImageDataUrl(payload.dataUrl, payload.mimeType);
        }).catch(function(err) {
            setAiHubStatus(err && err.message ? err.message : "Image import failed. Use BG Remover for image processing.", true);
        });
    }

    function ensureAiFrameImportMenu() {
        let menu = document.getElementById("aiFrameImportMenu");
        if (menu) return menu;
        menu = document.createElement("div");
        menu.id = "aiFrameImportMenu";
        menu.className = "ai-frame-import-menu";
        menu.innerHTML = [
            '<button type="button" data-ai-image-action="copy">Copy Image</button>'
        ].join("");
        const copyButton = menu.querySelector('[data-ai-image-action="copy"]');
        if (copyButton) copyButton.onclick = function() {
            const url = getAiFramePendingImageUrl();
            copyAiFrameImageToClipboard(url);
        };
        document.body.appendChild(menu);
        document.addEventListener("click", hideAiFrameImportMenu, true);
        document.addEventListener("keydown", function(event) {
            if (event.key === "Escape") hideAiFrameImportMenu();
        }, true);
        return menu;
    }

    function initAiFrameImportContextMenu() {
        if (window.__kwvAiFrameImportCepMenu) return;
        window.__kwvAiFrameImportCepMenu = true;
        try {
            csInterface.setContextMenuByJSON(JSON.stringify({ menu: [] }), function() {});
        } catch (err) {}
    }

    function showAiFrameImportMenu(event) {
        const frame = getActiveAiSearchFrame();
        let imageUrl = event && event.imageUrl ? String(event.imageUrl || "") : "";
        if (!imageUrl && frame && event && typeof event.clientX === "number" && typeof event.clientY === "number") {
            try {
                const rect = frame.getBoundingClientRect();
                const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
                if (doc && typeof doc.elementFromPoint === "function") {
                    const tab = getAiSearchTabById(frame.getAttribute("data-tab-id") || "");
                    const zoom = clampAiSearchZoom(tab && tab.zoom ? tab.zoom : 1);
                    const node = doc.elementFromPoint((event.clientX - rect.left) / zoom, (event.clientY - rect.top) / zoom);
                    imageUrl = findAiFrameImageUrlFromEvent({
                        target: node,
                        clientX: (event.clientX - rect.left) / zoom,
                        clientY: (event.clientY - rect.top) / zoom
                    }, frame);
                }
            } catch (err) {}
        }
        if (!imageUrl) imageUrl = getAiFramePendingImageUrl();
        if (!imageUrl) {
            hideAiFrameImportMenu();
            setAiHubStatus("Image URL nahi mila. Image ke center par right-click karke try karo.", true);
            return;
        }
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const menu = ensureAiFrameImportMenu();
        const x = event && typeof event.clientX === "number" ? event.clientX : 160;
        const y = event && typeof event.clientY === "number" ? event.clientY : 180;
        menu.setAttribute("data-image-url", imageUrl);
        aiHubRuntime.pendingImportImageUrl = imageUrl;
        menu.style.left = Math.min(x, window.innerWidth - 218) + "px";
        menu.style.top = Math.min(y, window.innerHeight - 80) + "px";
        menu.classList.add("active");
    }

    function installAiFrameContextMenu(frame) {
        if (!frame) return;
        try {
            const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
            if (!doc || doc.__kwvImportContextMenuBound) return;
            doc.__kwvImportContextMenuBound = true;
            const handler = function(event) {
                const rect = frame.getBoundingClientRect();
                const tab = getAiSearchTabById(frame.getAttribute("data-tab-id") || "");
                const zoom = clampAiSearchZoom(tab && tab.zoom ? tab.zoom : 1);
                const imageUrl = findAiFrameImageUrlFromEvent(event, frame);
                if (!imageUrl) return true;
                event.preventDefault();
                event.stopPropagation();
                event.returnValue = false;
                rememberAiFrameImportTarget(frame, imageUrl, event);
                try {
                    if (frame.contentWindow && frame.contentWindow.parent) {
                        frame.contentWindow.parent.postMessage({
                            kwvAiCopyImageContext: {
                                imageUrl: imageUrl,
                                x: rect.left + (event.clientX * zoom),
                                y: rect.top + (event.clientY * zoom)
                            }
                        }, "*");
                    }
                } catch (postErr) {}
                showAiFrameImportMenu({
                    clientX: rect.left + (event.clientX * zoom),
                    clientY: rect.top + (event.clientY * zoom),
                    imageUrl: imageUrl,
                    preventDefault: function() {},
                    stopPropagation: function() {}
                });
                return false;
            };
            const clickHandler = function(event) {
                if (!event || event.button !== 0) return true;
                const imageUrl = findAiFrameImageUrlFromEvent(event, frame);
                if (!imageUrl) return true;
                event.preventDefault();
                event.stopPropagation();
                event.returnValue = false;
                rememberAiFrameImportTarget(frame, imageUrl, event);
                try {
                    if (frame.contentWindow && frame.contentWindow.parent) {
                        frame.contentWindow.parent.postMessage({
                            kwvAiCopyImageUrl: imageUrl
                        }, "*");
                    }
                } catch (postErr) {}
                return false;
            };
            doc.oncontextmenu = handler;
            if (doc.body) doc.body.oncontextmenu = handler;
            if (doc.documentElement) doc.documentElement.oncontextmenu = handler;
            doc.addEventListener("contextmenu", handler, true);
            doc.addEventListener("click", clickHandler, true);
            doc.addEventListener("mousedown", function(event) {
                if (event && event.button === 2) handler(event);
            }, true);
            if (frame.contentWindow) {
                frame.contentWindow.oncontextmenu = handler;
                frame.contentWindow.addEventListener("contextmenu", handler, true);
                frame.contentWindow.addEventListener("click", clickHandler, true);
                frame.contentWindow.addEventListener("mousedown", function(event) {
                    if (event && event.button === 2) handler(event);
                }, true);
            }
        } catch (err) {
            // Some hosts restore strict cross-origin isolation. The frame-level
            // handler remains available for pages CEP permits us to inspect.
        }
    }

    function injectAiBrowserScrollbarTheme(frame) {
        if (!frame) return;
        try {
            const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
            if (!doc || doc.getElementById("kwvAiBrowserScrollbarTheme")) return;
            const style = doc.createElement("style");
            style.id = "kwvAiBrowserScrollbarTheme";
            style.textContent = [
                "html,body{color-scheme:dark;overflow-x:hidden!important;scrollbar-width:thin!important;scrollbar-color:#101010 #050505!important;}",
                "::-webkit-scrollbar{width:7px!important;height:7px!important;background:#050505!important;}",
                "::-webkit-scrollbar-track{background:#050505!important;border-left:1px solid #0d0d0d!important;}",
                "::-webkit-scrollbar-corner{background:#050505!important;}",
                "::-webkit-scrollbar-thumb{background:#101010!important;border:1px solid #050505!important;border-radius:999px!important;}",
                "::-webkit-scrollbar-thumb:hover{background:#1f1f1f!important;}"
            ].join("");
            const head = doc.head || doc.documentElement;
            if (head) head.appendChild(style);
        } catch (err) {}
    }

    function initPanelContextMenuGuard() {
        if (window.__kwvPanelContextMenuGuard) return;
        window.__kwvPanelContextMenuGuard = true;
        document.addEventListener("contextmenu", function(evt) {
            if (evt.defaultPrevented) return;
            evt.preventDefault();
        }, false);
    }

    function getAiSearchUrlHost(url) {
        try {
            const anchor = document.createElement("a");
            anchor.href = url;
            return String(anchor.hostname || "").replace(/^www\./i, "").toLowerCase();
        } catch (error) {
            return "";
        }
    }

    function isPinterestHost(host) {
        return /(^|\.)pinterest\.com$/i.test(host || "");
    }

    function isPinterestUrl(url) {
        return isPinterestHost(getAiSearchUrlHost(url || ""));
    }

    function openLoginBrowserUrl(url, name) {
        if (!url) return;
        const localBrowserUrl = buildLocalGuestUrl("/top-browser?site=" + encodeURIComponent(name || "Site") + "&url=" + encodeURIComponent(url)) || url;
        const windowName = "kwv_login_browser_" + String(name || "site").replace(/[^a-z0-9_]+/gi, "_").toLowerCase();
        try {
            const popup = window.open(localBrowserUrl, windowName, "width=1120,height=760,menubar=no,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes");
            if (popup && popup.focus) popup.focus();
            if (popup) {
                setAiHubStatus(String(name || "Site") + " extension browser window is open. Log in there.", false);
                return;
            }
        } catch (popupErr) {}
        openExternalUrl(url);
        setAiHubStatus(String(name || "Site") + " popup was blocked, so the default browser was opened.", false);
    }

    function extractYouTubeId(input) {
        try {
            const raw = String(input || "").trim();
            if (!raw) return null;
            const normalized = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
            const u = new URL(normalized);
            const host = u.hostname.replace(/^www\./i, "").toLowerCase();
            if ((host === "127.0.0.1" || host === "localhost") && u.pathname === "/yt-player") {
                return u.searchParams.get("v");
            }
            if (host === "youtu.be") {
                return u.pathname.split("/").filter(Boolean)[0] || null;
            }
            if (host.indexOf("youtube.com") !== -1 || host === "youtube-nocookie.com") {
                if (u.pathname === "/watch") return u.searchParams.get("v");
                if (u.pathname.indexOf("/shorts/") === 0) return u.pathname.split("/").filter(Boolean)[1] || null;
                if (u.pathname.indexOf("/embed/") === 0) return u.pathname.split("/").filter(Boolean)[1] || null;
                if (u.pathname.indexOf("/live/") === 0) return u.pathname.split("/").filter(Boolean)[1] || null;
            }
            return null;
        } catch (err) {
            console.warn("[Keshav Velo Search] extractYouTubeId failed:", err);
            return null;
        }
    }

    function isYouTubeUrl(input) {
        try {
            const raw = String(input || "").trim();
            if (!raw) return false;
            const normalized = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
            const u = new URL(normalized);
            return /(^|\.)youtube\.com$/i.test(u.hostname) || /(^|\.)youtube-nocookie\.com$/i.test(u.hostname) || /(^|\.)youtu\.be$/i.test(u.hostname);
        } catch (err) {
            return false;
        }
    }

    function getYouTubeVideoId(url) {
        return extractYouTubeId(url) || "";
    }

    function escapeGuestHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getGuestAccentTheme() {
        const fallback = {
            accent: "#ff0000",
            rgb: "255,0,0",
            soft: "rgba(255,0,0,0.24)",
            strong: "rgba(255,0,0,0.48)"
        };
        try {
            const styles = window.getComputedStyle(document.body || document.documentElement);
            const accent = (styles.getPropertyValue("--kwv-accent") || fallback.accent).trim() || fallback.accent;
            const rgb = (styles.getPropertyValue("--kwv-accent-rgb") || fallback.rgb).trim() || fallback.rgb;
            const soft = (styles.getPropertyValue("--kwv-accent-soft") || fallback.soft).trim() || fallback.soft;
            const strong = (styles.getPropertyValue("--kwv-accent-strong") || fallback.strong).trim() || fallback.strong;
            return { accent, rgb, soft, strong };
        } catch (err) {
            return fallback;
        }
    }

    function buildGuestYouTubePage(embedUrl, originalUrl) {
        const safeUrl = escapeGuestHtml(embedUrl);
        const safeOriginalUrl = escapeGuestHtml(originalUrl || "");
        return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"referrer\" content=\"strict-origin-when-cross-origin\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Keshav Velo YouTube Guest Player</title><style>html,body{margin:0;width:100%;height:100%;background:#000;overflow:hidden;font-family:Arial,sans-serif}iframe{width:100%;height:100%;border:0;background:#000}.fallback{color:white;height:100%;display:none;align-items:center;justify-content:center;\\66 lex-direction:column;text-align:center;padding:20px;box-sizing:border-box;background:#111}.fallback a{margin-top:16px;padding:10px 18px;border:1px solid #ff1b1b;background:#111;color:#fff;border-radius:8px;cursor:pointer;font-weight:bold;text-decoration:none}</style></head><body><iframe id=\"ytFrame\" src=\"" + safeUrl + "\" referrerpolicy=\"strict-origin-when-cross-origin\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen></iframe><div class=\"fallback\" id=\"fallback\"><h3>YouTube blocked panel playback.</h3><p>This video cannot be played inside the panel.</p><a href=\"" + safeOriginalUrl + "\" target=\"_blank\" rel=\"noopener\">Open on YouTube</a></div><script>function showFallback(){var f=document.getElementById(\"fallback\");var y=document.getElementById(\"ytFrame\");if(y)y.style.display=\"none\";if(f)f.style.display=\"f\"+\"lex\";}function onYouTubeIframeAPIReady(){try{new YT.Player(\"ytFrame\",{events:{onError:function(event){console.log(\"YT player error:\",event.data);showFallback();}}});}catch(err){console.log(\"YT API init failed:\",err);}}window.addEventListener(\"message\",function(event){console.log(\"YT player message:\",event.data);});setTimeout(function(){console.log(\"If YouTube shows Error 153, use external fallback.\");},3000);</script><script src=\"https://www.youtube.com/iframe_api\"></script></body></html>";
    }

    function decodeGuestHtmlEntity(text) {
        return String(text || "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, "\"")
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");
    }

    function extractBalancedJson(text, marker) {
        const markerIndex = text.indexOf(marker);
        if (markerIndex < 0) return "";
        const start = text.indexOf("{", markerIndex);
        if (start < 0) return "";
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        for (let i = start; i < text.length; i++) {
            const ch = text.charAt(i);
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (ch === "\\") {
                escapeNext = true;
                continue;
            }
            if (ch === "\"") {
                inString = !inString;
                continue;
            }
            if (inString) continue;
            if (ch === "{") depth++;
            if (ch === "}") {
                depth--;
                if (depth === 0) return text.slice(start, i + 1);
            }
        }
        return "";
    }

    function collectYouTubeRenderers(node, out, seen) {
        if (!node || out.length >= 24) return;
        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) collectYouTubeRenderers(node[i], out, seen);
            return;
        }
        if (typeof node !== "object") return;
        if (node.videoRenderer && node.videoRenderer.videoId) {
            const item = node.videoRenderer;
            const id = String(item.videoId || "");
            if (!seen[id]) {
                seen[id] = true;
                const titleNode = item.title || {};
                const thumbList = item.thumbnail && item.thumbnail.thumbnails ? item.thumbnail.thumbnails : [];
                const thumb = thumbList.length ? thumbList[thumbList.length - 1].url : "";
                const meta = item.lengthText && item.lengthText.simpleText ? item.lengthText.simpleText : "";
                const views = item.shortViewCountText && item.shortViewCountText.simpleText ? item.shortViewCountText.simpleText : "";
                const channel = item.ownerText && item.ownerText.runs && item.ownerText.runs[0] ? item.ownerText.runs[0].text : "";
                out.push({
                    id: id,
                    title: titleNode.simpleText || (titleNode.runs && titleNode.runs[0] ? titleNode.runs[0].text : "YouTube Video"),
                    thumb: thumb,
                    meta: [channel, views, meta].filter(Boolean).join(" - ")
                });
            }
        }
        Object.keys(node).forEach(function(key) {
            collectYouTubeRenderers(node[key], out, seen);
        });
    }

    function parseYouTubeSearchResults(html) {
        const results = [];
        const seen = {};
        try {
            const jsonText = extractBalancedJson(html, "ytInitialData");
            if (jsonText) {
                collectYouTubeRenderers(JSON.parse(jsonText), results, seen);
            }
        } catch (err) {
            console.log("[Keshav Velo Search] ytInitialData parse failed:", err);
        }
        if (!results.length) {
            const regex = /"videoId":"([a-zA-Z0-9_-]{6,})"[\s\S]{0,1600}?"title":\{"runs":\[\{"text":"([^"]+)"/g;
            let match;
            while ((match = regex.exec(html)) && results.length < 18) {
                if (seen[match[1]]) continue;
                seen[match[1]] = true;
                results.push({
                    id: match[1],
                    title: decodeGuestHtmlEntity(match[2].replace(/\\"/g, "\"")),
                    thumb: "https://i.ytimg.com/vi/" + match[1] + "/hqdefault.jpg",
                    meta: "YouTube"
                });
            }
        }
        return results;
    }

    function normalizeGuestImageUrl(url) {
        let value = decodeGuestHtmlEntity(String(url || "").replace(/\\u003d/g, "=").replace(/\\u0026/g, "&"));
        value = value.replace(/\\\//g, "/").replace(/\\\\/g, "\\").trim();
        if (!/^https?:\/\//i.test(value)) return "";
        if (/google\.(com|co\.)\/imgres/i.test(value)) return "";
        if (/gstatic\.com\/images\?q=/i.test(value)) return "";
        return value;
    }

    function pushGuestImageResult(out, seen, url, title, source, thumb) {
        const imageUrl = normalizeGuestImageUrl(url);
        if (!imageUrl || seen[imageUrl]) return;
        seen[imageUrl] = true;
        out.push({
            url: imageUrl,
            thumb: normalizeGuestImageUrl(thumb) || imageUrl,
            title: decodeGuestHtmlEntity(title || "Google Image"),
            source: decodeGuestHtmlEntity(source || "Google Images")
        });
    }

    function parseGoogleImageResults(html) {
        const results = [];
        const seen = {};
        const text = String(html || "");
        let match;
        const metadataRegex = /\["(https?:\\\/\\\/[^"]+?)",(\d+),(\d+)\]/g;
        while ((match = metadataRegex.exec(text)) && results.length < 60) {
            pushGuestImageResult(results, seen, match[1], "Google Image", "Google Images");
        }
        const escapedRegex = /"(https?:\\\/\\\/[^"]+\.(?:png|jpe?g|webp|gif)[^"]*)"/gi;
        while ((match = escapedRegex.exec(text)) && results.length < 60) {
            pushGuestImageResult(results, seen, match[1], "Google Image", "Google Images");
        }
        const plainRegex = /(https?:\/\/[^"'<>\\\s]+\.(?:png|jpe?g|webp|gif)(?:\?[^"'<>\\\s]*)?)/gi;
        while ((match = plainRegex.exec(text)) && results.length < 60) {
            pushGuestImageResult(results, seen, match[1], "Google Image", "Google Images");
        }
        return results.filter(function(item) {
            return !/\/logos\/|googlelogo|branding\/product/i.test(item.url || "");
        }).slice(0, 48);
    }

    function parseBingImageResults(html) {
        const results = [];
        const seen = {};
        const text = String(html || "");
        let match;
        const attrRegex = /class="iusc"[^>]+?\sm="([^"]+)"/g;
        while ((match = attrRegex.exec(text)) && results.length < 90) {
            try {
                const raw = decodeGuestHtmlEntity(match[1] || "");
                const meta = JSON.parse(raw);
                pushGuestImageResult(results, seen, meta.murl, meta.t || meta.desc || "Image", meta.purl || "Image Search", meta.turl);
            } catch (attrErr) {}
        }
        const encodedRegex = /murl&quot;:&quot;([^&]+)&quot;[\s\S]{0,900}?t&quot;:&quot;([^&]*)&quot;/g;
        while ((match = encodedRegex.exec(text)) && results.length < 90) {
            pushGuestImageResult(results, seen, match[1], match[2] || "Image", "Image Search");
        }
        const jsonRegex = /"murl":"([^"]+)"[\s\S]{0,900}?"t":"([^"]*)"/g;
        while ((match = jsonRegex.exec(text)) && results.length < 90) {
            pushGuestImageResult(results, seen, match[1], match[2] || "Image", "Image Search");
        }
        return results.filter(function(item) {
            return !/\/logos\/|googlelogo|branding\/product|bing\.com\/th/i.test(item.url || "") && isAllowedGuestImageResult(item);
        }).slice(0, 80);
    }

    function parseDuckDuckGoImageResults(jsonText) {
        const results = [];
        const seen = {};
        let data;
        try {
            data = JSON.parse(String(jsonText || "{}"));
        } catch (parseErr) {
            return results;
        }
        (data.results || []).forEach(function(item) {
            pushGuestImageResult(
                results,
                seen,
                item.image,
                item.title || item.url || "Image",
                item.url || item.source || "Image Search",
                item.thumbnail
            );
        });
        return results.slice(0, 100);
    }

    function parseYandexImageResults(html) {
        const results = [];
        const seen = {};
        const match = /id="ImagesApp-[^"]+"[^>]+data-state="([^"]+)"/.exec(String(html || ""));
        if (!match) return results;
        let data;
        try {
            data = JSON.parse(decodeGuestHtmlEntity(match[1] || ""));
        } catch (parseErr) {
            return results;
        }
        const items = data && data.initialState && data.initialState.serpList && data.initialState.serpList.items;
        const entities = items && items.entities ? items.entities : {};
        const keys = items && items.keys && items.keys.length ? items.keys : Object.keys(entities);
        keys.forEach(function(key) {
            const item = entities[key] || {};
            const viewerData = item.viewerData || {};
            const preview = viewerData.preview || item.preview || [];
            const originalUrl = item.origUrl || (preview[0] && preview[0].url) || item.img_href || "";
            const thumbUrl = String(item.image || item.thumb || "").replace(/^\/\//, "https://");
            const title = item.snippet && item.snippet.title || item.alt || "Yandex Image";
            const source = item.snippet && (item.snippet.url || item.snippet.domain) || "Yandex Images";
            pushGuestImageResult(results, seen, originalUrl, title, source, thumbUrl || originalUrl);
        });
        return results.slice(0, 80);
    }

    function isLikelyWatermarkedImageSource(value) {
        const text = String(value || "").toLowerCase();
        return /pngtree|freepik|shutterstock|istockphoto|gettyimages|alamy|dreamstime|123rf|depositphotos|adobestock|stock\.adobe|vecteezy|vectorstock|lovepik|rawpixel|envato|canstockphoto|bigstockphoto|colourbox|pond5|pixta|motionarray|elements\.envato|watermark|watermarked/i.test(text);
    }

    function isAllowedGuestImageResult(item) {
        if (!item) return false;
        const text = [item.url, item.thumb, item.source, item.title].join(" ");
        return !isLikelyWatermarkedImageSource(text);
    }

    function getGuestImageQueryTokens(query) {
        const stop = {
            png: true,
            transparent: true,
            background: true,
            bg: true,
            image: true,
            images: true,
            photo: true,
            photos: true,
            picture: true,
            pic: true,
            hd: true,
            free: true,
            download: true,
            no: true,
            with: true,
            without: true,
            green: true,
            screen: true
        };
        return String(query || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .split(/\s+/)
            .filter(function(token) {
                return token.length > 1 && !stop[token];
            })
            .slice(0, 5);
    }

    function filterGuestFallbackImageResults(items, query) {
        const tokens = getGuestImageQueryTokens(query);
        if (!tokens.length) return items || [];
        return (items || []).filter(function(item) {
            const text = [item && item.title, item && item.url, item && item.thumb, item && item.source].join(" ").toLowerCase();
            return tokens.some(function(token) {
                return text.indexOf(token) !== -1;
            });
        });
    }

    function buildQueryImageFallbackResults(query, page) {
        const cleanQuery = String(query || "image").trim() || "image";
        const variants = [
            "",
            "photo",
            "object",
            "png",
            "transparent",
            "hd",
            "wallpaper",
            "isolated",
            "clipart",
            "background",
            "close up",
            "front view",
            "side view",
            "real",
            "stock",
            "design",
            "icon",
            "3d"
        ];
        const start = Math.max(0, parseInt(page, 10) || 0) * variants.length;
        const items = [];
        variants.forEach(function(variant, index) {
            const label = variant ? cleanQuery + " " + variant : cleanQuery;
            const url = "https://tse.mm.bing.net/th?q=" + encodeURIComponent(label) + "&w=640&h=640&c=7&rs=1&p=" + encodeURIComponent(start + index);
            items.push({
                url: url,
                thumb: url,
                title: label + " image",
                source: "Image Search"
            });
        });
        return items;
    }

    function getGuestImageDedupeKey(item) {
        const raw = String(item && (item.url || item.thumb) || "").toLowerCase();
        if (!raw) return "";
        try {
            const parsed = new URL(raw);
            if (/tse\.mm\.bing\.net$/i.test(parsed.hostname)) {
                return parsed.hostname + parsed.pathname + "?q=" + (parsed.searchParams.get("q") || "");
            }
            return parsed.hostname + parsed.pathname;
        } catch (urlErr) {
            return raw.split("?")[0];
        }
    }

    function mergeGuestImageResults(target, seen, items, limit) {
        (items || []).forEach(function(item) {
            if (!item || target.length >= limit) return;
            const key = getGuestImageDedupeKey(item);
            const thumbKey = getGuestImageDedupeKey({ url: item.thumb || "" });
            if ((key && seen[key]) || (thumbKey && seen[thumbKey])) return;
            if (key) seen[key] = true;
            if (thumbKey) seen[thumbKey] = true;
            target.push(item);
        });
    }

    function scoreGuestImageResult(item, query) {
        const title = String(item && item.title || "");
        const url = String(item && item.url || "");
        const thumb = String(item && item.thumb || "");
        const source = String(item && item.source || "");
        const text = (title + " " + url + " " + source).toLowerCase();
        const queryText = String(query || "").toLowerCase();
        const tokens = getGuestImageQueryTokens(query);
        const wantsPng = /(^|\s)(png|transparent|logo|icon|clipart|cutout|sticker|no background|green screen)(\s|$)/i.test(queryText);
        let score = 0;
        if (!isAllowedGuestImageResult(item)) return -999;
        tokens.forEach(function(token) {
            score += text.indexOf(token) >= 0 ? 22 : -16;
        });
        if (wantsPng) {
            if (/\.png(?:[?#]|$)/i.test(url)) score += 45;
            if (/\bpng\b/i.test(title) || /\bpng\b/i.test(url)) score += 32;
            if (/transparent|clear background|no background|isolated|cutout|clipart|logo|icon/i.test(text)) score += 26;
            if (/pngimg|pngwing|pngall|stickpng|cleanpng|pngplay|pngfre|freepngimg|toppng|citypng|pngegg|favpng|hiclipart|clipart-library|logodownload|logos-world|openclipart|wikimedia|svgrepo/i.test(text)) score += 40;
            if (/menu|recipe|secret|store|shop|wallpaper|photography|news|blog|price|offer|coupon|location/i.test(text)) score -= 42;
            if (/\.(?:jpg|jpeg)(?:[?#]|$)/i.test(url) && !/transparent|clipart|logo|icon/i.test(text)) score -= 22;
        } else {
            if (/wallpaper|photography|photo|image/i.test(text)) score += 8;
        }
        if (/data:image|base64|favicon|sprite|blank|placeholder/i.test(url + " " + thumb)) score -= 100;
        if (!thumb) score -= 12;
        return score;
    }

    function rankGuestImageResults(items, query) {
        return (items || [])
            .filter(isAllowedGuestImageResult)
            .map(function(item, index) {
                return { item: item, index: index, score: scoreGuestImageResult(item, query) };
            })
            .filter(function(entry) {
                return entry.score > -55;
            })
            .sort(function(a, b) {
                if (b.score !== a.score) return b.score - a.score;
                return a.index - b.index;
            })
            .map(function(entry) {
                return entry.item;
            });
    }

    function buildGuestImageSearchPlan(query, page) {
        const baseQuery = String(query || "png").trim() || "png";
        const pngIntent = /(^|\s)(png|transparent|logo|icon|clipart|cutout|sticker|no background|green screen)(\s|$)/i.test(baseQuery);
        if (page < 2) {
            return { query: baseQuery, offset: page * 100 };
        }
        const variants = pngIntent ? [
            baseQuery + " transparent background",
            baseQuery + " png transparent",
            baseQuery + " clipart png",
            baseQuery + " no background",
            baseQuery + " site:pngimg.com",
            baseQuery + " site:pngwing.com",
            baseQuery + " site:pngall.com",
            baseQuery + " site:stickpng.com",
            baseQuery + " site:cleanpng.com",
            baseQuery + " site:toppng.com",
            baseQuery + " site:openclipart.org",
            baseQuery + " site:commons.wikimedia.org",
            baseQuery + " site:svgrepo.com"
        ] : [
            baseQuery,
            baseQuery + " images",
            baseQuery + " photo",
            baseQuery + " hd",
            baseQuery + " wallpaper",
            baseQuery + " isolated",
            baseQuery + " transparent"
        ];
        const variantIndex = (page - 2) % variants.length;
        const cycle = Math.floor((page - 2) / variants.length);
        return { query: variants[variantIndex], offset: cycle * 100 };
    }

    function buildGuestImageSearchShell(query, localOrigin) {
        const safeQuery = escapeGuestHtml(query || "");
        const externalUrl = "https://www.google.com/search?udm=2&q=" + encodeURIComponent(query || "png");
        return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"referrer\" content=\"strict-origin-when-cross-origin\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Google Image Search</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;background:#050505;color:#fff;font-family:Arial,Helvetica,sans-serif;overflow-x:hidden;user-select:none;scrollbar-width:thin;scrollbar-color:#101010 #050505}::-webkit-scrollbar{width:7px;height:7px}::-webkit-scrollbar-track{background:#050505;border-left:1px solid #111}::-webkit-scrollbar-thumb{background:#101010;border:1px solid #050505;border-radius:999px}::-webkit-scrollbar-thumb:hover{background:#1f1f1f}body{padding:10px}.img-head{position:sticky;top:0;z-index:5;display:\\66 lex;gap:8px;align-items:center;padding:8px 0 10px;background:#050505}.img-search{\\66 lex:1;display:\\66 lex;gap:7px}.img-search input{\\66 lex:1;min-width:0;height:30px;border:1px solid #262626;border-radius:999px;background:#0c0c0c;color:#fff;padding:0 11px;font-size:11px;outline:none;user-select:text}.img-search input:focus{border-color:#ff1b1b}.img-search button{height:30px;border:1px solid #ff1b1b;border-radius:999px;background:#160808;color:#fff;padding:0 12px;font-size:8px;font-weight:900;letter-spacing:.7px;text-transform:uppercase;cursor:pointer;text-decoration:none;display:inline-\\66 lex;align-items:center}.img-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.img-card{min-width:0;border:1px solid #1f1f1f;border-radius:8px;background:#0d0d0d;overflow:hidden;cursor:pointer;color:#fff}.img-card:hover{border-color:#ff1b1b;background:#140909}.img-preview{aspect-ratio:1/1;display:\\66 lex;align-items:center;justify-content:center;background:#101010}.img-preview img{width:100%;height:100%;object-fit:contain;display:block;-webkit-user-drag:none}.img-title{display:block;padding:6px;color:#a8a8a8;font-size:7px;font-weight:800;letter-spacing:.25px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.img-empty,.img-loading{grid-column:1/-1;min-height:230px;display:\\66 lex;align-items:center;justify-content:center;\\66 lex-direction:column;text-align:center;color:#aaa;padding:25px}.img-empty h3{margin:0 0 8px;color:#fff;font-size:14px}.img-empty p{max-width:310px;margin:0 0 14px;font-size:10px;line-height:1.5}.dots{display:\\66 lex;gap:10px;margin-bottom:14px}.dots span{width:18px;height:18px;border-radius:50%;background:#2a2a2a;animation:pulse 1s infinite alternate}.dots span:nth-child(2){animation-delay:.15s}.dots span:nth-child(3){animation-delay:.3s}@keyframes pulse{to{background:#ff1b1b;transform:translateY(-4px)}}.img-menu{position:fixed;z-index:20;min-width:148px;padding:5px;border:1px solid #2a2a2a;border-radius:8px;background:#101010;box-shadow:0 18px 40px rgba(0,0,0,.44);display:none}.img-menu.active{display:block}.img-menu button{width:100%;height:29px;border:0;border-radius:6px;background:transparent;color:#fff;text-align:left;padding:0 9px;font-size:8px;font-weight:900;letter-spacing:.4px;text-transform:uppercase;cursor:pointer}.img-menu button:hover{background:#ff0000;color:#fff}.kwv-gloss-tooltip{position:fixed;z-index:60;max-width:190px;padding:6px 8px;border:1px solid rgba(255,255,255,.18);border-radius:6px;background:#121212;color:#fff;font-size:9px;font-weight:800;line-height:1.25;box-shadow:0 12px 28px rgba(0,0,0,.42);opacity:0;pointer-events:none;transform:translateY(3px);transition:opacity .12s ease,transform .12s ease}.kwv-gloss-tooltip.active{opacity:1;transform:translateY(0)}.img-warning{margin:0 0 8px;padding:8px;border:1px solid #2a1a1a;border-radius:8px;background:#120909;color:#ffb2b2;font-size:9px;line-height:1.45}.img-import-overlay{position:fixed;left:50%;bottom:14px;z-index:30;width:min(250px,calc(100% - 24px));padding:9px;border:1px solid rgba(255,0,0,.45);border-radius:10px;background:linear-gradient(180deg,#151515,#070707);box-shadow:0 18px 44px rgba(0,0,0,.58),0 0 18px rgba(255,0,0,.16);opacity:0;pointer-events:none;transform:translate(-50%,10px);transition:opacity .16s ease,transform .16s ease}.img-import-overlay.active{opacity:1;transform:translate(-50%,0)}.img-import-top{display:\\66 lex;justify-content:space-between;gap:8px;margin-bottom:7px;color:#fff;font-size:8px;font-weight:900;letter-spacing:.45px;text-transform:uppercase}.img-import-stage{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.img-import-track{height:5px;overflow:hidden;border-radius:999px;background:#050505;border:1px solid #202020}.img-import-fill{width:0%;height:100%;border-radius:999px;background:linear-gradient(90deg,#ff0000,#ff7676,#ff0000);box-shadow:0 0 10px rgba(255,0,0,.35);transition:width .28s ease}.img-import-overlay.active .img-import-fill::after{content:\"\";display:block;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:imgProgressSweep .9s linear infinite}@keyframes imgProgressSweep{from{transform:translateX(-120%)}to{transform:translateX(260%)}}@media(max-width:300px){.img-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}</style></head><body><div class=\"img-head\"><form class=\"img-search\" onsubmit=\"doSearch(event)\"><input id=\"q\" value=\"" + safeQuery + "\" placeholder=\"Enter an element or object name\" autocomplete=\"off\"><button>Search</button></form></div><div id=\"status\"></div><div class=\"img-grid\" id=\"grid\"><div class=\"img-loading\"><div class=\"dots\"><span></span><span></span><span></span></div><div>Loading Google image results...</div></div></div><div class=\"img-menu\" id=\"imgMenu\"><button type=\"button\" id=\"importImageBtn\">Import Image</button></div><div class=\"img-import-overlay\" id=\"imgImportOverlay\"><div class=\"img-import-top\"><span class=\"img-import-stage\" id=\"imgImportStage\">Importing</span><span id=\"imgImportPct\">0%</span></div><div class=\"img-import-track\"><div class=\"img-import-fill\" id=\"imgImportFill\"></div></div></div><script>var query=\"" + safeQuery.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\";var activeUrl='';var currentPage=0;var loadingMore=false;var finished=false;var seenUrls={};var importTimer=null;function esc(s){return String(s||'').replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});}function doSearch(e){e.preventDefault();var q=document.getElementById('q').value||'png';location.href='/img-search?q='+encodeURIComponent(q);}function ensureTooltip(){var t=document.getElementById('kwvGlossTooltip');if(!t){t=document.createElement('div');t.id='kwvGlossTooltip';t.className='kwv-gloss-tooltip';document.body.appendChild(t);}return t;}function moveTooltip(evt){var t=ensureTooltip();var margin=8;var x=(evt&&typeof evt.clientX==='number'?evt.clientX:0)+14;var y=(evt&&typeof evt.clientY==='number'?evt.clientY:0)+14;var rect=t.getBoundingClientRect();var maxX=Math.max(margin,window.innerWidth-(rect.width||160)-margin);var maxY=Math.max(margin,window.innerHeight-(rect.height||28)-margin);if(x>maxX)x=(evt.clientX||0)-(rect.width||160)-14;if(y>maxY)y=(evt.clientY||0)-(rect.height||28)-14;t.style.left=Math.round(Math.min(Math.max(margin,x),maxX))+'px';t.style.top=Math.round(Math.min(Math.max(margin,y),maxY))+'px';}function bindTooltip(el,text){if(!el||!text)return;el.setAttribute('data-kwv-tooltip',text);el.removeAttribute('title');el.addEventListener('mouseenter',function(evt){var t=ensureTooltip();t.textContent=el.getAttribute('data-kwv-tooltip')||'';t.classList.add('active');moveTooltip(evt);});el.addEventListener('mousemove',moveTooltip);el.addEventListener('mouseleave',function(){ensureTooltip().classList.remove('active');});}function hideMenu(){document.getElementById('imgMenu').classList.remove('active');}function showMenu(evt,url){evt.preventDefault();evt.stopPropagation();ensureTooltip().classList.remove('active');activeUrl=url;var menu=document.getElementById('imgMenu');menu.style.left=Math.min(evt.clientX,window.innerWidth-158)+'px';menu.style.top=Math.min(evt.clientY,window.innerHeight-104)+'px';menu.classList.add('active');}function postStatus(msg,isError){try{parent.postMessage({kwvAiStatus:msg,kwvAiStatusError:!!isError},'*');}catch(err){}}function postParent(payload){try{parent.postMessage(payload,'*');}catch(err){}}function setImportProgress(pct,label){var overlay=document.getElementById('imgImportOverlay');var fill=document.getElementById('imgImportFill');var num=document.getElementById('imgImportPct');var stage=document.getElementById('imgImportStage');pct=Math.max(0,Math.min(100,Math.round(pct||0)));if(overlay)overlay.classList.add('active');if(fill)fill.style.width=pct+'%';if(num)num.textContent=pct+'%';if(stage&&label)stage.textContent=label;}function finishImportProgress(label,isError){window.clearInterval(importTimer);setImportProgress(isError?100:100,label||'Done');window.setTimeout(function(){var overlay=document.getElementById('imgImportOverlay');if(overlay)overlay.classList.remove('active');},isError?1400:950);}function blobToPng(blob){return new Promise(function(resolve,reject){var img=new Image();var objectUrl=URL.createObjectURL(blob);img.onload=function(){try{var canvas=document.createElement('canvas');canvas.width=img.naturalWidth||img.width;canvas.height=img.naturalHeight||img.height;var ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);canvas.toBlob(function(png){URL.revokeObjectURL(objectUrl);if(png)resolve(png);else reject(new Error('PNG conversion failed.'));},'image/png');}catch(err){URL.revokeObjectURL(objectUrl);reject(err);}};img.onerror=function(){URL.revokeObjectURL(objectUrl);reject(new Error('Image decode failed.'));};img.src=objectUrl;});}function importImage(url){if(!url)return;hideMenu();window.clearInterval(importTimer);var soft=8;setImportProgress(soft,'Fetching image');importTimer=window.setInterval(function(){soft=Math.min(92,soft+Math.max(1,(96-soft)*.08));setImportProgress(soft,soft<42?'Fetching image':soft<68?'Converting PNG':soft<86?'Preparing import':'Importing to AE');},320);postStatus('Importing image...',false);fetch('/img-proxy?url='+encodeURIComponent(url)).then(function(r){if(!r.ok)throw new Error('Image fetch failed.');setImportProgress(42,'Fetched');return r.blob();}).then(function(blob){setImportProgress(58,'Converting PNG');return blobToPng(blob);}).then(function(png){setImportProgress(76,'Reading file');return new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(reader.result);};reader.onerror=function(){reject(new Error('Image read failed.'));};reader.readAsDataURL(png);});}).then(function(dataUrl){setImportProgress(94,'Sending to AE');parent.postMessage({kwvAiImportImageData:dataUrl,kwvAiImportImageType:'image/png'},'*');postStatus('Image sent to AE for import.',false);finishImportProgress('Sent to AE',false);}).catch(function(err){postStatus(err&&err.message?err.message:'Image import failed.',true);finishImportProgress('Import failed',true);});}function empty(msg){document.getElementById('grid').innerHTML='<div class=\"img-empty\"><h3>Images did not load.</h3><p>'+esc(msg||'Google is slow or blocked. Change the query.')+'</p></div>';}function render(items){var grid=document.getElementById('grid');if(!items||!items.length){if(currentPage===0)empty('No image URLs were found. Try another search.');else finished=true;return;}if(currentPage===0)grid.innerHTML='';var html='';items.forEach(function(item){var url=item.url||'';if(!url||seenUrls[url])return;seenUrls[url]=true;var thumb=item.thumb||item.url;html+='<div class=\"img-card\" data-url=\"'+esc(url)+'\" data-kwv-tooltip=\"Right click to import\"><div class=\"img-preview\"><img loading=\"lazy\" decoding=\"async\" src=\"'+esc(thumb)+'\" alt=\"'+esc(item.title||'Image')+'\"></div><span class=\"img-title\">'+esc(item.title||item.source||'Image')+'</span></div>';});if(html)grid.insertAdjacentHTML('beforeend',html);Array.prototype.forEach.call(document.querySelectorAll('.img-card:not([data-bound])'),function(card){card.setAttribute('data-bound','1');var url=card.getAttribute('data-url')||'';bindTooltip(card,'Right click to import');card.addEventListener('contextmenu',function(evt){showMenu(evt,url);});card.addEventListener('dblclick',function(){importImage(url);});});}function loadPage(page){if(loadingMore||finished)return;loadingMore=true;if(page>0)postStatus('Loading more images...',false);fetch('/img-results?q='+encodeURIComponent(query)+'&page='+encodeURIComponent(page)).then(function(r){return r.json();}).then(function(data){if(data.warning&&page===0){document.getElementById('status').innerHTML='<div class=\"img-warning\">'+esc(data.warning)+'</div>';}currentPage=page;render(data.items||[]);loadingMore=false;if(page<2){window.setTimeout(function(){loadPage(page+1);},220);}}).catch(function(err){loadingMore=false;if(page===0)empty(err&&err.message?err.message:'Image search failed.');else finished=true;});}window.addEventListener('scroll',function(){if(finished||loadingMore)return;if((window.innerHeight+window.scrollY)>(document.body.scrollHeight-520)){loadPage(currentPage+1);}});document.getElementById('importImageBtn').onclick=function(){if(activeUrl)importImage(activeUrl);};document.addEventListener('contextmenu',function(evt){if(!evt.target.closest('.img-card')){evt.preventDefault();hideMenu();}},true);document.addEventListener('click',hideMenu,true);loadPage(0);console.log('[Keshav Velo Search] Local Google image shell',\"" + escapeGuestHtml(localOrigin || "") + "\");</script></body></html>";
    }

    function buildGuestYouTubeSearchPage(query, items, localOrigin, warning) {
        const safeQuery = escapeGuestHtml(query || defaultYouTubeSearchQuery);
        const theme = getGuestAccentTheme();
        const accent = escapeGuestHtml(theme.accent);
        const rgb = escapeGuestHtml(theme.rgb);
        const soft = escapeGuestHtml(theme.soft);
        const strong = escapeGuestHtml(theme.strong);
        const externalUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query || defaultYouTubeSearchQuery);
        const cards = (items || []).map(function(item) {
            const title = escapeGuestHtml(item.title || "YouTube Video");
            const meta = escapeGuestHtml(item.meta || "YouTube");
            const thumb = escapeGuestHtml(item.thumb || ("https://i.ytimg.com/vi/" + item.id + "/hqdefault.jpg"));
            const playerUrl = "/yt-player?v=" + encodeURIComponent(item.id);
            return "<a class=\"yt-card\" href=\"" + playerUrl + "\"><span class=\"yt-thumb\"><img src=\"" + thumb + "\" alt=\"\"></span><span class=\"yt-info\"><strong>" + title + "</strong><small>" + meta + "</small></span></a>";
        }).join("");
        const empty = "<div class=\"yt-empty\"><h3>Search results did not load.</h3><p>YouTube blocked or slowed the search page. You can open it externally.</p><button onclick=\"openExternal()\">Open YouTube</button></div>";
        const warn = warning ? "<div class=\"yt-warning\">" + escapeGuestHtml(warning) + "</div>" : "";
        return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"referrer\" content=\"strict-origin-when-cross-origin\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Keshav Velo YouTube Search</title><style>:root{--kwv-accent:" + accent + ";--kwv-accent-rgb:" + rgb + ";--kwv-accent-soft:" + soft + ";--kwv-accent-strong:" + strong + "}*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;background:#050505;color:#fff;font-family:Arial,sans-serif;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#101010 #050505}::-webkit-scrollbar{width:7px;height:7px}::-webkit-scrollbar-track{background:#050505;border-left:1px solid #111}::-webkit-scrollbar-thumb{background:#101010;border:1px solid #050505;border-radius:999px}::-webkit-scrollbar-thumb:hover{background:#1f1f1f}body{padding:10px}.yt-head{position:sticky;top:0;z-index:2;display:\\66 lex;gap:8px;align-items:center;padding:8px 0 10px;background:#050505}.yt-search{\\66 lex:1;display:\\66 lex;gap:7px}.yt-search input{\\66 lex:1;min-width:0;height:30px;border:1px solid #262626;border-radius:999px;background:#0c0c0c;color:#fff;padding:0 11px;font-size:11px;outline:none}.yt-search button,.yt-empty button{height:30px;border:1px solid var(--kwv-accent);border-radius:999px;background:rgba(var(--kwv-accent-rgb),.10);color:#fff;padding:0 12px;font-size:8px;font-weight:900;letter-spacing:.7px;text-transform:uppercase;cursor:pointer;box-shadow:0 0 12px var(--kwv-accent-soft)}.yt-open{color:#aaa;text-decoration:none;border:1px solid #262626;border-radius:999px;padding:8px 10px;font-size:8px;font-weight:900}.yt-grid{display:grid;grid-template-columns:1fr;gap:8px}.yt-card{display:grid;grid-template-columns:112px minmax(0,1fr);gap:9px;min-height:72px;padding:7px;border:1px solid #1f1f1f;border-radius:9px;background:linear-gradient(180deg,#101010 0%,#080808 100%);color:#fff;text-decoration:none}.yt-card:hover{border-color:var(--kwv-accent);background:rgba(var(--kwv-accent-rgb),.10);box-shadow:0 0 13px var(--kwv-accent-soft)}.yt-thumb{position:relative;display:block;overflow:hidden;border-radius:6px;background:#111;aspect-ratio:16/9}.yt-thumb img{width:100%;height:100%;object-fit:cover;display:block}.yt-info{display:\\66 lex;\\66 lex-direction:column;justify-content:center;gap:7px;min-width:0}.yt-info strong{font-size:10px;line-height:1.35;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.yt-info small{font-size:8px;line-height:1.35;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.yt-empty{min-height:220px;display:\\66 lex;align-items:center;justify-content:center;\\66 lex-direction:column;text-align:center;color:#aaa;padding:25px}.yt-empty h3{margin:0 0 8px;color:#fff;font-size:14px}.yt-empty p{max-width:320px;margin:0 0 14px;font-size:10px;line-height:1.5}.yt-warning{margin:0 0 8px;padding:8px;border:1px solid rgba(var(--kwv-accent-rgb),.32);border-radius:8px;background:rgba(var(--kwv-accent-rgb),.08);color:#ffb2b2;font-size:9px;line-height:1.45}</style></head><body><div class=\"yt-head\"><form class=\"yt-search\" onsubmit=\"doSearch(event)\"><input id=\"q\" value=\"" + safeQuery + "\" autocomplete=\"off\"><button>Search</button></form></div>" + warn + "<div class=\"yt-grid\">" + (cards || empty) + "</div><script>var localOrigin=\"" + escapeGuestHtml(localOrigin || "") + "\";function openExternal(){location.href=\"" + escapeGuestHtml(externalUrl) + "\";}function doSearch(e){e.preventDefault();var q=document.getElementById('q').value||'" + escapeGuestHtml(defaultYouTubeSearchQuery) + "';location.href='/yt-search?q='+encodeURIComponent(q);}console.log('[Keshav Velo Search] Local YouTube search page',localOrigin);</script></body></html>";
    }

    function buildGuestYouTubeSearchShell(query, localOrigin) {
        const safeQuery = escapeGuestHtml(query || defaultYouTubeSearchQuery);
        const theme = getGuestAccentTheme();
        const accent = escapeGuestHtml(theme.accent);
        const rgb = escapeGuestHtml(theme.rgb);
        const soft = escapeGuestHtml(theme.soft);
        const strong = escapeGuestHtml(theme.strong);
        const externalUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query || defaultYouTubeSearchQuery);
        return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"referrer\" content=\"strict-origin-when-cross-origin\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Keshav Velo YouTube Search</title><style>:root{--kwv-accent:" + accent + ";--kwv-accent-rgb:" + rgb + ";--kwv-accent-soft:" + soft + ";--kwv-accent-strong:" + strong + "}*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;background:#050505;color:#fff;font-family:Arial,sans-serif;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#101010 #050505}::-webkit-scrollbar{width:7px;height:7px}::-webkit-scrollbar-track{background:#050505;border-left:1px solid #111}::-webkit-scrollbar-thumb{background:#101010;border:1px solid #050505;border-radius:999px}::-webkit-scrollbar-thumb:hover{background:#1f1f1f}body{padding:10px}.yt-head{position:sticky;top:0;z-index:2;display:\\66 lex;gap:8px;align-items:center;padding:8px 0 10px;background:#050505}.yt-search{\\66 lex:1;display:\\66 lex;gap:7px}.yt-search input{\\66 lex:1;min-width:0;height:30px;border:1px solid #262626;border-radius:999px;background:#0c0c0c;color:#fff;padding:0 11px;font-size:11px;outline:none}.yt-search button,.yt-empty a{height:30px;border:1px solid var(--kwv-accent);border-radius:999px;background:rgba(var(--kwv-accent-rgb),.10);color:#fff;padding:0 12px;font-size:8px;font-weight:900;letter-spacing:.7px;text-transform:uppercase;cursor:pointer;text-decoration:none;display:inline-\\66 lex;align-items:center;box-shadow:0 0 12px var(--kwv-accent-soft)}.yt-open{color:#aaa;text-decoration:none;border:1px solid #262626;border-radius:999px;padding:8px 10px;font-size:8px;font-weight:900}.yt-grid{display:grid;grid-template-columns:1fr;gap:8px}.yt-card{display:grid;grid-template-columns:112px minmax(0,1fr);gap:9px;min-height:72px;padding:7px;border:1px solid #1f1f1f;border-radius:9px;background:linear-gradient(180deg,#101010 0%,#080808 100%);color:#fff;text-decoration:none}.yt-card:hover{border-color:var(--kwv-accent);background:rgba(var(--kwv-accent-rgb),.10);box-shadow:0 0 13px var(--kwv-accent-soft)}.yt-thumb{display:block;overflow:hidden;border-radius:6px;background:#111;aspect-ratio:16/9}.yt-thumb img{width:100%;height:100%;object-fit:cover;display:block}.yt-info{display:\\66 lex;\\66 lex-direction:column;justify-content:center;gap:7px;min-width:0}.yt-info strong{font-size:10px;line-height:1.35;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.yt-info small{font-size:8px;line-height:1.35;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.yt-empty,.yt-loading{min-height:220px;display:\\66 lex;align-items:center;justify-content:center;\\66 lex-direction:column;text-align:center;color:#aaa;padding:25px}.yt-empty h3{margin:0 0 8px;color:#fff;font-size:14px}.yt-empty p{max-width:320px;margin:0 0 14px;font-size:10px;line-height:1.5}.dots{display:\\66 lex;gap:10px;margin-bottom:14px}.dots span{width:18px;height:18px;border-radius:50%;background:#2a2a2a;animation:pulse 1s infinite alternate}.dots span:nth-child(2){animation-delay:.15s}.dots span:nth-child(3){animation-delay:.3s}@keyframes pulse{to{background:var(--kwv-accent);transform:translateY(-4px)}}.yt-warning{margin:0 0 8px;padding:8px;border:1px solid rgba(var(--kwv-accent-rgb),.32);border-radius:8px;background:rgba(var(--kwv-accent-rgb),.08);color:#ffb2b2;font-size:9px;line-height:1.45}</style></head><body><div class=\"yt-head\"><form class=\"yt-search\" onsubmit=\"doSearch(event)\"><input id=\"q\" value=\"" + safeQuery + "\" autocomplete=\"off\"><button>Search</button></form></div><div id=\"status\"></div><div class=\"yt-grid\" id=\"grid\"><div class=\"yt-loading\"><div class=\"dots\"><span></span><span></span><span></span></div><div>Loading clean YouTube results...</div></div></div><script>var query=\"" + safeQuery.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\";var externalUrl=\"" + escapeGuestHtml(externalUrl) + "\";function esc(s){return String(s||'').replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});}function doSearch(e){e.preventDefault();var q=document.getElementById('q').value||'" + escapeGuestHtml(defaultYouTubeSearchQuery) + "';location.href='/yt-search?q='+encodeURIComponent(q);}function empty(msg){document.getElementById('grid').innerHTML='<div class=\"yt-empty\"><h3>Search results did not load.</h3><p>'+esc(msg||'YouTube is slow or blocked. You can open it externally.')+'</p><a target=\"_blank\" rel=\"noopener\" href=\"'+esc(externalUrl)+'\">Open YouTube</a></div>';}function render(items){if(!items||!items.length){empty('No results were found. Try opening externally.');return;}document.getElementById('grid').innerHTML=items.map(function(item){var thumb=item.thumb||('https://i.ytimg.com/vi/'+item.id+'/hqdefault.jpg');return '<a class=\"yt-card\" href=\"/yt-player?v='+encodeURIComponent(item.id)+'\"><span class=\"yt-thumb\"><img src=\"'+esc(thumb)+'\" alt=\"\"></span><span class=\"yt-info\"><strong>'+esc(item.title||'YouTube Video')+'</strong><small>'+esc(item.meta||'YouTube')+'</small></span></a>';}).join('');}fetch('/yt-results?q='+encodeURIComponent(query)).then(function(r){return r.json();}).then(function(data){if(data.warning){document.getElementById('status').innerHTML='<div class=\"yt-warning\">'+esc(data.warning)+'</div>';}render(data.items||[]);}).catch(function(err){empty(err&&err.message?err.message:'Search failed.');});console.log('[Keshav Velo Search] Local YouTube search shell',\"" + escapeGuestHtml(localOrigin || "") + "\");</script></body></html>";
    }

    function buildGuestHomePage(localOrigin) {
        const theme = getGuestAccentTheme();
        const accent = escapeGuestHtml(theme.accent);
        const rgb = escapeGuestHtml(theme.rgb);
        const soft = escapeGuestHtml(theme.soft);
        const strong = escapeGuestHtml(theme.strong);
        return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="referrer" content="strict-origin-when-cross-origin"><title>Keshav With Velo</title><style>:root{--kwv-accent:${accent};--kwv-accent-rgb:${rgb};--kwv-accent-soft:${soft};--kwv-accent-strong:${strong}}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif}body{background:radial-gradient(circle at 84% 10%,rgba(var(--kwv-accent-rgb),.15),rgba(0,0,0,0) 34%),linear-gradient(180deg,#050505 0%,#000 56%);scrollbar-width:thin;scrollbar-color:#101010 #050505}::-webkit-scrollbar{width:7px;height:7px}::-webkit-scrollbar-track{background:#050505;border-left:1px solid #111}::-webkit-scrollbar-thumb{background:#111;border-radius:999px;border:1px solid #000}::-webkit-scrollbar-thumb:hover{background:#1f1f1f}.wrap{height:100%;display:\\66 lex;\\66 lex-direction:column;align-items:center;justify-content:center;gap:13px;padding:14px}.brand{text-align:center}.brand h1{margin:0;color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:900;font-style:normal;letter-spacing:.2px;text-transform:uppercase}.brand .red{color:var(--kwv-accent);text-shadow:0 0 12px var(--kwv-accent-strong)}.search{display:\\66 lex;align-items:center;gap:7px;width:100%;max-width:330px;padding:7px;border:1px solid rgba(var(--kwv-accent-rgb),.18);border-radius:999px;background:#060606;box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 0 18px rgba(var(--kwv-accent-rgb),.06)}.search:focus-within{border-color:rgba(var(--kwv-accent-rgb),.46);box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 0 0 1px rgba(var(--kwv-accent-rgb),.12),0 0 18px rgba(var(--kwv-accent-rgb),.10)}.search input{\\66 lex:1;min-width:0;height:25px;border:0;background:transparent;color:#f5f5f5;outline:0;font-size:9px;font-weight:700}.search input::placeholder{color:#606060}.search button{width:29px;height:29px;border:0;border-radius:50%;background:var(--kwv-accent);color:#fff;padding:0;display:inline-\\66 lex;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:900;line-height:1;cursor:pointer;box-shadow:0 0 12px var(--kwv-accent-soft)}.search button:hover{background:var(--kwv-accent);color:#fff;filter:brightness(1.08)}.grid{display:none!important}.tile{min-width:0;min-height:74px;padding:8px 6px;border:0;border-radius:0;background:transparent;text-decoration:none;color:#fff;text-align:center;box-shadow:none}.tile:hover{background:transparent;color:var(--kwv-accent)}.mark{height:39px;display:\\66 lex;align-items:center;justify-content:center;margin-bottom:6px}.logo-img{display:block;max-width:38px;max-height:34px;object-fit:contain}.logo-google{max-width:34px;max-height:34px}.logo-youtube{max-width:43px;max-height:31px}.tile span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:inherit;font-size:7px;font-weight:900;letter-spacing:.8px;text-transform:uppercase}.tile .yt-copy{white-space:normal;overflow:visible;text-overflow:clip;color:#d8d8d8;font-size:8.5px;font-weight:800;letter-spacing:.15px;text-transform:none;line-height:1.45}</style></head><body><main class="wrap"><div class="brand"><h1>KESHAV <span class="red">WITH VELO</span></h1></div><form class="search" onsubmit="goSearch(event)"><input id="homeQ" name="q" placeholder="Search" autofocus autocomplete="off"><button title="Search">&#8594;</button></form><div class="grid" aria-hidden="true"></div></main><script>function goSearch(e,v){if(e)e.preventDefault();var input=document.getElementById('homeQ');var q=String(v||input&&input.value||'').trim();if(!q)return;try{parent.postMessage({kwvAiSearchNavigate:q},'*');}catch(err){location.href='/yt-search?q='+encodeURIComponent(q);}}console.log('[Keshav Velo Search] Home',"${escapeGuestHtml(localOrigin || "")}");</script></body></html>`;
    }

    function buildBlockedSitePage(site, targetUrl) {
        const label = escapeGuestHtml(site || "This site");
        const safeUrl = escapeGuestHtml(targetUrl || "");
        return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><meta name=\"referrer\" content=\"strict-origin-when-cross-origin\"><title>" + label + "</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#050505;color:#fff;font-family:Arial,sans-serif;overflow:hidden}.wrap{height:100%;display:\\66 lex;align-items:center;justify-content:center;padding:22px;text-align:center;background:radial-gradient(circle at 50% 22%,rgba(255,27,27,.13),rgba(0,0,0,0) 35%),#050505}.card{width:100%;max-width:360px;border:1px solid #1f1f1f;border-radius:14px;background:linear-gradient(180deg,#111,#070707);padding:24px 18px;box-shadow:0 24px 50px rgba(0,0,0,.35)}.badge{display:inline-\\66 lex;align-items:center;height:24px;padding:0 10px;border:1px solid rgba(255,27,27,.35);border-radius:999px;color:#ffb7b7;background:#160808;font-size:8px;font-weight:900;letter-spacing:.8px;text-transform:uppercase}h1{margin:15px 0 8px;font-size:18px;line-height:1.25}p{margin:0 auto 18px;max-width:280px;color:#9c9c9c;font-size:10px;line-height:1.6}.actions{display:\\66 lex;justify-content:center;gap:8px;\\66 lex-wrap:wrap}a{height:34px;display:inline-\\66 lex;align-items:center;border:1px solid #ff1b1b;border-radius:999px;background:#170909;color:#fff;padding:0 14px;text-decoration:none;font-size:8px;font-weight:900;letter-spacing:.8px;text-transform:uppercase}.muted{border-color:#2a2a2a;background:#0b0b0b;color:#aaa}</style></head><body><div class=\"wrap\"><div class=\"card\"><span class=\"badge\">External Required</span><h1>" + label + " blocks panel preview</h1><p>This is normal for login/social sites. The app is not saving cookies, history, passwords, or account data.</p><div class=\"actions\"><a href=\"" + safeUrl + "\" target=\"_blank\" rel=\"noopener\">Open Externally</a><a class=\"muted\" href=\"/home\">New Tab</a></div></div></div></body></html>";
    }

    function buildLoginBrowserPage(site, targetUrl) {
        const label = escapeGuestHtml(site || "Login Browser");
        const safeUrl = escapeGuestHtml(targetUrl || "");
        const jsUrl = safeUrl.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
        const jsSite = label.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
        return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><meta name=\"referrer\" content=\"strict-origin-when-cross-origin\"><title>" + label + "</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#030303;color:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden}.wrap{height:100%;display:\\66 lex;align-items:center;justify-content:center;padding:18px;text-align:center;background:radial-gradient(circle at 72% 14%,rgba(255,0,0,.16),rgba(0,0,0,0) 34%),linear-gradient(180deg,#080101 0%,#000 62%)}.card{width:100%;max-width:350px;border:1px solid #232323;border-radius:10px;background:linear-gradient(180deg,#101010 0%,#070707 100%);padding:22px 16px;box-shadow:0 24px 54px rgba(0,0,0,.44)}.badge{display:inline-\\66 lex;align-items:center;height:22px;padding:0 10px;border:1px solid rgba(255,0,0,.42);border-radius:999px;background:#170707;color:#ff2a2a;font-size:7px;font-weight:900;letter-spacing:.8px;text-transform:uppercase}h1{margin:14px 0 8px;color:#fff;font-size:18px;font-weight:900;line-height:1.2;text-transform:uppercase}p{margin:0 auto 15px;max-width:292px;color:#9a9a9a;font-size:10px;line-height:1.55}.url{margin:0 auto 15px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#666;font-size:8px}.actions{display:\\66 lex;justify-content:center;gap:8px;\\66 lex-wrap:wrap}button,a{height:34px;display:inline-\\66 lex;align-items:center;justify-content:center;border:1px solid #ff0000;border-radius:999px;background:#190707;color:#fff;padding:0 15px;text-decoration:none;font-size:8px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;cursor:pointer}.muted{border-color:#2a2a2a;background:#0b0b0b;color:#aaa}.hint{margin-top:14px;color:#676767;font-size:8px;line-height:1.5}</style></head><body><div class=\"wrap\"><div class=\"card\"><span class=\"badge\">Extension Browser</span><h1>" + label + "</h1><p>This site blanks the panel iframe. Click Open Browser to open login in a CEP top-level popup.</p><div class=\"url\">" + safeUrl + "</div><div class=\"actions\"><button id=\"openBtn\" type=\"button\">Open Browser</button><a class=\"muted\" href=\"/home\">New Tab</a></div><div class=\"hint\">Chrome command-line was removed. The popup opens from the extension context.</div></div></div><script>var target=\"" + jsUrl + "\";var site=\"" + jsSite + "\";document.getElementById('openBtn').onclick=function(){try{parent.postMessage({kwvAiLoginBrowser:target,kwvAiLoginSite:site},'*');}catch(err){}}</script></body></html>";
    }

    function buildTopBrowserLauncherPage(site, targetUrl) {
        const label = escapeGuestHtml(site || "Browser");
        const safeTarget = escapeGuestHtml(targetUrl || "");
        return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>" + label + "</title><style>html,body{margin:0;width:100%;height:100%;background:#050505;color:#aaa;font:12px Arial,sans-serif;display:\\66 lex;align-items:center;justify-content:center;text-align:center}</style></head><body><div>Opening " + label + "...</div><script>var target=\"" + safeTarget.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\";setTimeout(function(){try{window.location.replace(target);}catch(e){window.location.href=target;}},80);</script></body></html>";
    }

    function buildGuestRedirectPage(targetUrl) {
        const safeTarget = escapeGuestHtml(targetUrl || "");
        return "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Opening...</title><style>html,body{margin:0;width:100%;height:100%;background:#050505;color:#777;font:11px Arial,sans-serif;display:\\66 lex;align-items:center;justify-content:center}</style></head><body>Opening in panel...</body><script>var target=\"" + safeTarget.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\";try{parent.postMessage({kwvAiSearchNavigate:target},\"*\");}catch(e){}</script></html>";
    }

    function buildPinterestGuestInjectionScript() {
        return `(function(){
            if (window.__kwvPinterestGuestMode) {
                if (window.__kwvPinterestGuestMode.clean) window.__kwvPinterestGuestMode.clean();
                return;
            }
            var STYLE_ID = "kwv-pinterest-guest-style";
            var KEYWORDS = /(fullpagesignup|signupmodal|loginmodal|loginwall|signupwall|authwall|unauth|register|signin|sign in|log in|login|signup|sign up)/i;
            var OVERLAY_WORDS = /(overlay|backdrop|modal|dialog|veil|mask|dimmer|scrim)/i;
            function addStyle(){
                if (document.getElementById(STYLE_ID)) return;
                var style = document.createElement("style");
                style.id = STYLE_ID;
                style.textContent = [
                    "html,body{overflow:auto!important;position:static!important;}",
                    "[data-test-id='fullPageSignupModal'],[data-test-id*='SignupModal' i],[data-test-id*='signupModal' i],[data-test-id*='loginModal' i],[data-test-id*='signup' i][role='dialog'],[data-test-id*='login' i][role='dialog']{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;}",
                    "[aria-label*='Log in' i][role='dialog'],[aria-label*='Sign up' i][role='dialog'],[class*='FullPageSignup' i],[class*='Unauth' i][class*='Modal' i]{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;}"
                ].join("\\n");
                (document.head || document.documentElement).appendChild(style);
            }
            function textOfAttrs(el){
                if (!el || !el.attributes) return "";
                var out = "";
                for (var i = 0; i < el.attributes.length; i++) {
                    var attr = el.attributes[i];
                    out += " " + attr.name + " " + attr.value;
                }
                return out;
            }
            function coversPage(el, style){
                var rect;
                try { rect = el.getBoundingClientRect(); } catch (err) { return false; }
                var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
                if (!vw || !vh) return false;
                var wide = rect.width >= vw * 0.55;
                var tall = rect.height >= vh * 0.45;
                var fixed = style.position === "fixed" || style.position === "sticky";
                return fixed && wide && tall;
            }
            function isDarkOverlay(el, style){
                if (!coversPage(el, style)) return false;
                var meta = textOfAttrs(el);
                var bg = style.backgroundColor || "";
                var opacity = parseFloat(style.opacity || "1");
                var z = parseInt(style.zIndex || "0", 10);
                var dark = /rgba?\\(\\s*(0|1?\\d|2\\d|3\\d|4\\d|5\\d)\\s*,\\s*(0|1?\\d|2\\d|3\\d|4\\d|5\\d)\\s*,\\s*(0|1?\\d|2\\d|3\\d|4\\d|5\\d)/i.test(bg);
                return (OVERLAY_WORDS.test(meta) || dark) && opacity >= 0.2 && (isNaN(z) || z >= 10);
            }
            function isLoginGate(el, style){
                var meta = textOfAttrs(el);
                if (!KEYWORDS.test(meta)) return false;
                if ((el.getAttribute("role") || "").toLowerCase() === "dialog") return true;
                if (/fullpagesignupmodal/i.test(meta)) return true;
                return coversPage(el, style);
            }
            function hideNode(el){
                if (!el || el === document.documentElement || el === document.body) return;
                el.setAttribute("data-kwv-pinterest-hidden", "1");
                el.style.setProperty("display", "none", "important");
                el.style.setProperty("visibility", "hidden", "important");
                el.style.setProperty("opacity", "0", "important");
                el.style.setProperty("pointer-events", "none", "important");
            }
            function unlockScroll(){
                [document.documentElement, document.body].forEach(function(el){
                    if (!el) return;
                    el.style.setProperty("overflow", "auto", "important");
                    el.style.setProperty("overflow-y", "auto", "important");
                    if (el.style.position === "fixed") el.style.setProperty("position", "static", "important");
                });
            }
            function clean(){
                addStyle();
                unlockScroll();
                var nodes = document.querySelectorAll("body *");
                for (var i = 0; i < nodes.length; i++) {
                    var el = nodes[i];
                    if (el.getAttribute("data-kwv-pinterest-hidden") === "1") continue;
                    var style;
                    try { style = window.getComputedStyle(el); } catch (err) { continue; }
                    if (isLoginGate(el, style) || isDarkOverlay(el, style)) hideNode(el);
                }
            }
            var queued = false;
            function scheduleClean(){
                if (queued) return;
                queued = true;
                window.requestAnimationFrame(function(){
                    queued = false;
                    clean();
                });
            }
            var observer = new MutationObserver(scheduleClean);
            function start(){
                addStyle();
                clean();
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ["style", "class", "data-test-id", "aria-label", "role"]
                });
                if (document.body) {
                    new MutationObserver(unlockScroll).observe(document.body, { attributes: true, attributeFilter: ["style"] });
                }
                window.addEventListener("scroll", scheduleClean, { passive: true });
            }
            window.__kwvPinterestGuestMode = { clean: clean };
            if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
            else start();
            console.log("[Keshav Velo Search] Pinterest guest-mode injection active");
        })();`;
    }

    function injectPinterestGuestMode(frame, url) {
        if (!frame || !isPinterestUrl(url || "")) return false;
        try {
            const win = frame.contentWindow;
            if (!win) return false;
            win.eval(buildPinterestGuestInjectionScript());
            return true;
        } catch (evalErr) {
            try {
                const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
                if (!doc || !doc.documentElement) return false;
                const script = doc.createElement("script");
                script.text = buildPinterestGuestInjectionScript();
                (doc.head || doc.documentElement).appendChild(script);
                if (script.parentNode) script.parentNode.removeChild(script);
                return true;
            } catch (scriptErr) {
                console.warn("[Keshav Velo Search] Pinterest guest injection failed:", scriptErr);
                return false;
            }
        }
    }

    function startAiGuestServer() {
        if (aiHubRuntime.guestServerReady || aiHubRuntime.guestServerStarting || aiHubRuntime.guestServerPort || aiHubRuntime.guestServerFailed) return;
        try {
            if (typeof require !== "function") {
                aiHubRuntime.guestServerFailed = true;
                return;
            }
            const http = require("http");
            const https = require("https");
            const fs = require("fs");
            const path = require("path");
            function getExtensionRootPath() {
                if (typeof __dirname !== "undefined" && /[\\\/]js$/i.test(String(__dirname))) {
                    return path.resolve(__dirname, "..");
                }
                try {
                    const fromLocation = decodeURIComponent(String(window.location && window.location.pathname ? window.location.pathname : ""));
                    const normalized = fromLocation.replace(/^\/([A-Za-z]:\/)/, "$1");
                    if (normalized) return path.dirname(normalized);
                } catch (rootErr) {}
                return path.resolve(".");
            }
            const extensionRoot = getExtensionRootPath();
            const bgRemovalAssetRoot = path.join(extensionRoot, "bg-remover");
            function getStaticMimeType(filePath) {
                const ext = String(path.extname(filePath || "") || "").toLowerCase();
                if (ext === ".json") return "application/json; charset=utf-8";
                if (ext === ".wasm") return "application/wasm";
                if (ext === ".mjs") return "text/javascript; charset=utf-8";
                if (ext === ".js") return "text/javascript; charset=utf-8";
                return "application/octet-stream";
            }
            function sendBgRemovalAsset(parsedUrl, res) {
                const rel = decodeURIComponent(String(parsedUrl.pathname || "").replace(/^\/bg-remover\/?/, ""));
                const safeRel = rel.replace(/^[\\/]+/, "");
                const targetPath = path.resolve(bgRemovalAssetRoot, safeRel || "resources.json");
                if (targetPath !== bgRemovalAssetRoot && targetPath.indexOf(bgRemovalAssetRoot + path.sep) !== 0) {
                    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
                    res.end("Forbidden");
                    return;
                }
                fs.readFile(targetPath, function(err, data) {
                    if (err) {
                        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
                        res.end("Background remover asset not found.");
                        return;
                    }
                    res.writeHead(200, {
                        "Content-Type": getStaticMimeType(targetPath),
                        "Cache-Control": "public, max-age=31536000, immutable",
                        "Access-Control-Allow-Origin": "*",
                        "Cross-Origin-Resource-Policy": "cross-origin",
                        "X-Content-Type-Options": "nosniff"
                    });
                    res.end(data);
                });
            }
            function fetchYouTubeSearchResults(query, done) {
                const searchUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query || defaultYouTubeSearchQuery);
                console.log("[Keshav Velo Search] Fetching YouTube search:", searchUrl);
                const request = https.get(searchUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
                        "Accept-Language": "en-US,en;q=0.9"
                    },
                    timeout: 9000
                }, function(response) {
                    let html = "";
                    response.on("data", function(chunk) {
                        html += chunk.toString();
                        if (html.length > 5000000) {
                            try { request.destroy(); } catch (destroyErr) {}
                        }
                    });
                    response.on("end", function() {
                        try {
                            done(null, parseYouTubeSearchResults(html));
                        } catch (parseErr) {
                            done(parseErr, []);
                        }
                    });
                });
                request.on("timeout", function() {
                    try { request.destroy(new Error("YouTube search timed out.")); } catch (timeoutErr) {}
                });
                request.on("error", function(err) {
                    done(err, []);
                });
            }
            function fetchGoogleImageResults(query, page, done) {
                page = Math.max(0, parseInt(page, 10) || 0);
                const plan = buildGuestImageSearchPlan(query, page);
                const pageQuery = plan.query;
                const yandexUrl = "https://yandex.com/images/search?text=" + encodeURIComponent(pageQuery);
                const searchUrl = "https://www.google.com/search?udm=2&safe=off&hl=en&q=" + encodeURIComponent(pageQuery);
                const fallbackFirst = 1 + (page * 35);
                const fallbackUrl = "https://www.bing.com/images/search?mkt=en-US&cc=US&setlang=en-US&safeSearch=off&form=HDRSC2&first=" + fallbackFirst + "&q=" + encodeURIComponent(pageQuery);
                function fetchHtml(url, parser, redirects, callback) {
                    console.log("[Keshav Velo Search] Fetching image search:", url);
                    const request = https.get(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
                            "Accept-Language": "en-US,en;q=0.9",
                            "Referer": "https://www.google.com/"
                    },
                    timeout: 9000
                }, function(response) {
                        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects < 4) {
                            const nextUrl = new URL(response.headers.location, url).toString();
                            response.resume();
                            fetchHtml(nextUrl, parser, redirects + 1, callback);
                            return;
                        }
                    let html = "";
                    response.on("data", function(chunk) {
                        html += chunk.toString();
                        if (html.length > 6000000) {
                            try { request.destroy(); } catch (destroyErr) {}
                        }
                    });
                    response.on("end", function() {
                        try {
                                callback(null, parser(html));
                        } catch (parseErr) {
                                callback(parseErr, []);
                        }
                    });
                });
                request.on("timeout", function() {
                        try { request.destroy(new Error("Image search timed out.")); } catch (timeoutErr) {}
                });
                request.on("error", function(err) {
                        callback(err, []);
                });
                }
                function fetchDuckDuckGoImages(callback) {
                    const homeUrl = "https://duckduckgo.com/?q=" + encodeURIComponent(pageQuery) + "&iar=images&iax=images&ia=images";
                    console.log("[Keshav Velo Search] Fetching image search:", homeUrl);
                    const homeRequest = https.get(homeUrl, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
                            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                            "Accept-Language": "en-US,en;q=0.9",
                            "DNT": "1",
                            "Sec-Fetch-Site": "none",
                            "Sec-Fetch-Mode": "navigate",
                            "Sec-Fetch-Dest": "document"
                        },
                        timeout: 9000
                    }, function(homeResponse) {
                        let homeHtml = "";
                        homeResponse.on("data", function(chunk) {
                            homeHtml += chunk.toString();
                            if (homeHtml.length > 1200000) {
                                try { homeRequest.destroy(); } catch (destroyErr) {}
                            }
                        });
                        homeResponse.on("end", function() {
                            const tokenMatch = /vqd=['"]([^'"]+)/.exec(homeHtml);
                            if (!tokenMatch) {
                                callback(new Error("Image token was not found."), []);
                                return;
                            }
                            let apiUrl = "https://duckduckgo.com/i.js?l=us-en&o=json&q=" + encodeURIComponent(pageQuery) + "&vqd=" + encodeURIComponent(tokenMatch[1]);
                            if (page > 0) apiUrl += "&s=" + encodeURIComponent(plan.offset || page * 100);
                            console.log("[Keshav Velo Search] Fetching image search:", apiUrl);
                            const apiRequest = https.get(apiUrl, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
                                    "Accept": "application/json, text/javascript, */*; q=0.01",
                                    "Accept-Language": "en-US,en;q=0.9",
                                    "Referer": homeUrl,
                                    "X-Requested-With": "XMLHttpRequest",
                                    "DNT": "1",
                                    "Sec-Fetch-Site": "same-origin",
                                    "Sec-Fetch-Mode": "cors",
                                    "Sec-Fetch-Dest": "empty"
                                },
                                timeout: 9000
                            }, function(apiResponse) {
                                let json = "";
                                apiResponse.on("data", function(chunk) {
                                    json += chunk.toString();
                                    if (json.length > 6000000) {
                                        try { apiRequest.destroy(); } catch (destroyErr) {}
                                    }
                                });
                                apiResponse.on("end", function() {
                                    try {
                                        callback(null, rankGuestImageResults(parseDuckDuckGoImageResults(json), query).slice(0, 80));
                                    } catch (parseErr) {
                                        callback(parseErr, []);
                                    }
                                });
                            });
                            apiRequest.on("timeout", function() {
                                try { apiRequest.destroy(new Error("Image search timed out.")); } catch (timeoutErr) {}
                            });
                            apiRequest.on("error", function(err) {
                                callback(err, []);
                            });
                        });
                    });
                    homeRequest.on("timeout", function() {
                        try { homeRequest.destroy(new Error("Image search timed out.")); } catch (timeoutErr) {}
                    });
                    homeRequest.on("error", function(err) {
                        callback(err, []);
                    });
                }
                const combinedItems = [];
                const combinedSeen = {};
                function addImageBatch(items) {
                    mergeGuestImageResults(combinedItems, combinedSeen, items || [], 80);
                }
                fetchDuckDuckGoImages(function(duckErr, duckItems) {
                    addImageBatch(rankGuestImageResults(filterGuestFallbackImageResults(duckItems || [], query), query));
                    fetchHtml(yandexUrl, parseYandexImageResults, 0, function(yandexErr, yandexItems) {
                        addImageBatch(rankGuestImageResults(yandexItems || [], query));
                        fetchHtml(searchUrl, parseGoogleImageResults, 0, function(googleErr, googleItems) {
                            if (page === 0) addImageBatch(rankGuestImageResults(filterGuestFallbackImageResults(googleItems || [], query), query));
                            fetchHtml(fallbackUrl, parseBingImageResults, 0, function(fallbackErr, fallbackItems) {
                                addImageBatch(rankGuestImageResults(filterGuestFallbackImageResults(fallbackItems || [], query), query));
                                if (combinedItems.length < 12) {
                                    addImageBatch(buildQueryImageFallbackResults(query, page));
                                }
                                const warning = combinedItems.length ? null : (duckErr || yandexErr || googleErr || fallbackErr);
                                done(warning, combinedItems.slice(0, 80));
                            });
                        });
                    });
                });
            }
            function fetchRemoteImage(url, done) {
                let target;
                try {
                    target = new URL(String(url || ""));
                } catch (urlErr) {
                    done(new Error("Invalid image URL."));
                    return;
                }
                if (target.protocol !== "https:" && target.protocol !== "http:") {
                    done(new Error("Unsupported image URL."));
                    return;
                }
                const client = target.protocol === "http:" ? http : https;
                const request = client.get(target.toString(), {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
                        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                        "Referer": target.origin + "/"
                    },
                    timeout: 12000
                }, function(response) {
                    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                        response.resume();
                        fetchRemoteImage(new URL(response.headers.location, target.toString()).toString(), done);
                        return;
                    }
                    if (response.statusCode < 200 || response.statusCode >= 300) {
                        response.resume();
                        done(new Error("Image server returned " + response.statusCode + "."));
                        return;
                    }
                    const chunks = [];
                    let total = 0;
                    response.on("data", function(chunk) {
                        total += chunk.length;
                        if (total > 20 * 1024 * 1024) {
                            try { request.destroy(new Error("Image too large.")); } catch (destroyErr) {}
                            return;
                        }
                        chunks.push(chunk);
                    });
                    response.on("end", function() {
                        done(null, Buffer.concat(chunks), response.headers["content-type"] || "image/png");
                    });
                });
                request.on("timeout", function() {
                    try { request.destroy(new Error("Image fetch timed out.")); } catch (timeoutErr) {}
                });
                request.on("error", function(err) {
                    done(err);
                });
            }
            function normalizeRemoteImageForImport(buffer, contentType, done) {
                try {
                    const inputType = String(contentType || "").split(";")[0].trim().toLowerCase();
                    if (inputType === "image/png") {
                        done(null, buffer, "image/png");
                        return;
                    }
                    let sharp = null;
                    try { sharp = require("sharp"); } catch (sharpErr) {}
                    if (!sharp) {
                        done(null, buffer, /^image\//i.test(contentType || "") ? contentType : "image/png");
                        return;
                    }
                    sharp(buffer, { animated: false, limitInputPixels: 80000000 })
                        .png({ compressionLevel: 9 })
                        .toBuffer(function(err, output) {
                            if (err || !output) {
                                done(null, buffer, /^image\//i.test(contentType || "") ? contentType : "image/png");
                                return;
                            }
                            done(null, output, "image/png");
                        });
                } catch (err) {
                    done(null, buffer, /^image\//i.test(contentType || "") ? contentType : "image/png");
                }
            }
            aiHubRuntime.guestServerStarting = true;
            const server = http.createServer(function(req, res) {
                try {
                    const localOrigin = aiHubRuntime.guestLocalOrigin || ("http://127.0.0.1:" + aiHubRuntime.guestServerPort);
                    const parsedUrl = new URL(req.url || "/", localOrigin);
                    const htmlHeaders = {
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                        "Pragma": "no-cache",
                        "Referrer-Policy": "strict-origin-when-cross-origin",
                        "X-Content-Type-Options": "nosniff"
                    };
                    if (parsedUrl.pathname.indexOf("/bg-remover/") === 0 || parsedUrl.pathname === "/bg-remover") {
                        sendBgRemovalAsset(parsedUrl, res);
                        return;
                    }
                    if (parsedUrl.pathname === "/yt-player") {
                        const videoId = parsedUrl.searchParams.get("v") || "";
                        res.writeHead(200, htmlHeaders);
                        if (!/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) {
                            res.end("<!doctype html><body style=\"background:#000;color:#fff;font:13px Arial\">Invalid YouTube video.</body>");
                            return;
                        }
                        const originalUrl = "https://www.youtube.com/watch?v=" + encodeURIComponent(videoId);
                        const embedUrl = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) + "?autoplay=0&rel=0&playsinline=1&enablejsapi=1&origin=" + encodeURIComponent(localOrigin);
                        console.log("[Keshav Velo Search] Local origin:", localOrigin);
                        console.log("[Keshav Velo Search] YouTube embed URL:", embedUrl);
                        res.end(buildGuestYouTubePage(embedUrl, originalUrl));
                        return;
                    }
                    if (parsedUrl.pathname === "/yt-search") {
                        const query = parsedUrl.searchParams.get("q") || defaultYouTubeSearchQuery;
                        res.writeHead(200, htmlHeaders);
                        res.end(buildGuestYouTubeSearchShell(query, localOrigin));
                        return;
                    }
                    if (parsedUrl.pathname === "/yt-results") {
                        const query = parsedUrl.searchParams.get("q") || defaultYouTubeSearchQuery;
                        fetchYouTubeSearchResults(query, function(err, items) {
                            try {
                                res.writeHead(200, {
                                    "Content-Type": "application/json; charset=utf-8",
                                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                                    "Pragma": "no-cache",
                                    "Referrer-Policy": "strict-origin-when-cross-origin",
                                    "X-Content-Type-Options": "nosniff"
                                });
                                res.end(JSON.stringify({
                                    items: items || [],
                                    warning: err ? "YouTube search was slow or blocked: " + err.message : ""
                                }));
                            } catch (sendErr) {
                                try {
                                    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
                                    res.end("Guest search error");
                                } catch (ignoredSendErr) {}
                            }
                        });
                        return;
                    }
                    if (parsedUrl.pathname === "/img-search") {
                        const query = parsedUrl.searchParams.get("q") || "png";
                        res.writeHead(200, htmlHeaders);
                        res.end(buildGuestImageSearchShell(query, localOrigin));
                        return;
                    }
                    if (parsedUrl.pathname === "/img-results") {
                        const query = parsedUrl.searchParams.get("q") || "png";
                        const page = parsedUrl.searchParams.get("page") || "0";
                        fetchGoogleImageResults(query, page, function(err, items) {
                            try {
                                res.writeHead(200, {
                                    "Content-Type": "application/json; charset=utf-8",
                                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                                    "Pragma": "no-cache",
                                    "Referrer-Policy": "strict-origin-when-cross-origin",
                                    "X-Content-Type-Options": "nosniff"
                                });
                                res.end(JSON.stringify({
                                    items: items || [],
                                    warning: err ? "Google Images was slow or blocked: " + err.message : ""
                                }));
                            } catch (sendErr) {
                                try {
                                    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
                                    res.end("Image search error");
                                } catch (ignoredSendErr) {}
                            }
                        });
                        return;
                    }
                    if (parsedUrl.pathname === "/img-proxy") {
                        const targetUrl = parsedUrl.searchParams.get("url") || "";
                        if (isLikelyWatermarkedImageSource(targetUrl)) {
                            res.writeHead(403, {
                                "Content-Type": "text/plain; charset=utf-8",
                                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                                "X-Content-Type-Options": "nosniff"
                            });
                            res.end("This image source is likely watermarked. Pick a clean/free source instead.");
                            return;
                        }
                        fetchRemoteImage(targetUrl, function(err, buffer, contentType) {
                            if (err || !buffer) {
                                res.writeHead(502, {
                                    "Content-Type": "text/plain; charset=utf-8",
                                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                                    "X-Content-Type-Options": "nosniff"
                                });
                                res.end(err ? err.message : "Image fetch failed.");
                                return;
                            }
                            normalizeRemoteImageForImport(buffer, contentType, function(normalizeErr, outputBuffer, outputType) {
                                if (normalizeErr || !outputBuffer) {
                                    res.writeHead(502, {
                                        "Content-Type": "text/plain; charset=utf-8",
                                        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                                        "X-Content-Type-Options": "nosniff"
                                    });
                                    res.end(normalizeErr ? normalizeErr.message : "Image conversion failed.");
                                    return;
                                }
                                res.writeHead(200, {
                                    "Content-Type": /^image\//i.test(outputType || "") ? outputType : "image/png",
                                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                                    "Pragma": "no-cache",
                                    "Access-Control-Allow-Origin": "*",
                                    "X-Content-Type-Options": "nosniff"
                                });
                                res.end(outputBuffer);
                            });
                        });
                        return;
                    }
                    if (parsedUrl.pathname === "/home") {
                        res.writeHead(200, htmlHeaders);
                        res.end(buildGuestHomePage(localOrigin));
                        return;
                    }
                    if (parsedUrl.pathname === "/blocked") {
                        const site = parsedUrl.searchParams.get("site") || "This site";
                        const targetUrl = parsedUrl.searchParams.get("url") || "";
                        res.writeHead(200, htmlHeaders);
                        res.end(buildBlockedSitePage(site, targetUrl));
                        return;
                    }
                    if (parsedUrl.pathname === "/login-browser") {
                        const site = parsedUrl.searchParams.get("site") || "Login Browser";
                        const targetUrl = parsedUrl.searchParams.get("url") || "";
                        res.writeHead(200, htmlHeaders);
                        res.end(buildLoginBrowserPage(site, targetUrl));
                        return;
                    }
                    if (parsedUrl.pathname === "/top-browser") {
                        const site = parsedUrl.searchParams.get("site") || "Browser";
                        const targetUrl = parsedUrl.searchParams.get("url") || "";
                        res.writeHead(200, htmlHeaders);
                        res.end(buildTopBrowserLauncherPage(site, targetUrl));
                        return;
                    }
                    if (parsedUrl.pathname === "/go") {
                        const query = parsedUrl.searchParams.get("q") || "";
                        let target = normalizeAiSearchUrl(query || "google");
                        if (!/^https?:\/\//i.test(target)) target = "https://www.google.com/search?q=" + encodeURIComponent(query || "google");
                        const loginSite = getLoginBrowserSite(target);
                        if (loginSite) {
                            res.writeHead(200, htmlHeaders);
                            res.end(buildLoginBrowserPage(loginSite, target));
                            return;
                        }
                        res.writeHead(200, htmlHeaders);
                        res.end(buildGuestRedirectPage(target));
                        return;
                    }
                    res.writeHead(200, htmlHeaders);
                    res.end("<!doctype html><body style=\"background:#000;color:#fff;font:13px Arial\">Guest player ready.</body>");
                } catch (error) {
                    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
                    res.end("Guest player error");
                }
            });
            let portIndex = 0;
            function listenOnNextPort() {
                if (portIndex >= aiGuestPreferredPorts.length) {
                    aiHubRuntime.guestServerReady = false;
                    aiHubRuntime.guestServerStarting = false;
                    aiHubRuntime.guestServerPort = 0;
                    aiHubRuntime.guestLocalOrigin = "";
                    aiHubRuntime.guestServerFailed = true;
                    return;
                }
                const port = aiGuestPreferredPorts[portIndex++];
                try {
                    server.listen(port, "127.0.0.1", function() {
                        const address = server.address();
                        aiHubRuntime.guestServerPort = address && address.port ? address.port : port;
                        aiHubRuntime.guestLocalOrigin = "http://127.0.0.1:" + aiHubRuntime.guestServerPort;
                        aiHubRuntime.guestServerReady = true;
                        aiHubRuntime.guestServerStarting = false;
                        console.log("[Keshav Velo Search] Local guest server started:", aiHubRuntime.guestLocalOrigin);
                        console.log("[Keshav Velo Search] Selected port:", aiHubRuntime.guestServerPort);
                    });
                } catch (listenErr) {
                    listenOnNextPort();
                }
            }
            server.on("error", function() {
                try { server.close(); } catch (closeErr) {}
                if (!aiHubRuntime.guestServerReady && portIndex < aiGuestPreferredPorts.length) {
                    window.setTimeout(listenOnNextPort, 20);
                    return;
                }
                aiHubRuntime.guestServerReady = false;
                aiHubRuntime.guestServerStarting = false;
                aiHubRuntime.guestServerPort = 0;
                aiHubRuntime.guestLocalOrigin = "";
                aiHubRuntime.guestServerFailed = true;
            });
            aiHubRuntime.guestServer = server;
            listenOnNextPort();
        } catch (error) {
            aiHubRuntime.guestServerReady = false;
            aiHubRuntime.guestServerStarting = false;
            aiHubRuntime.guestServerPort = 0;
            aiHubRuntime.guestLocalOrigin = "";
            aiHubRuntime.guestServerFailed = true;
        }
    }

    function buildLocalYouTubePlayerUrl(videoId) {
        const localOrigin = aiHubRuntime.guestLocalOrigin || (aiHubRuntime.guestServerPort ? "http://127.0.0.1:" + aiHubRuntime.guestServerPort : "");
        if (!localOrigin || !videoId) return "";
        return localOrigin + "/yt-player?v=" + encodeURIComponent(videoId);
    }

    function buildLocalYouTubeSearchUrl(query) {
        const localOrigin = aiHubRuntime.guestLocalOrigin || (aiHubRuntime.guestServerPort ? "http://127.0.0.1:" + aiHubRuntime.guestServerPort : "");
        if (!localOrigin) return "";
        return localOrigin + "/yt-search?q=" + encodeURIComponent(query || defaultYouTubeSearchQuery);
    }

    function buildLocalImageSearchUrl(query) {
        const localOrigin = aiHubRuntime.guestLocalOrigin || (aiHubRuntime.guestServerPort ? "http://127.0.0.1:" + aiHubRuntime.guestServerPort : "");
        if (!localOrigin) return "";
        return localOrigin + "/img-search?q=" + encodeURIComponent(query || "png");
    }

    function buildLocalGuestUrl(path) {
        const localOrigin = aiHubRuntime.guestLocalOrigin || (aiHubRuntime.guestServerPort ? "http://127.0.0.1:" + aiHubRuntime.guestServerPort : "");
        if (!localOrigin) return "";
        return localOrigin + path;
    }

    function buildBlockedSiteUrl(site, url) {
        return buildLocalGuestUrl("/blocked?site=" + encodeURIComponent(site || "This site") + "&url=" + encodeURIComponent(url || ""));
    }

    function makeAiSearchTab(id) {
        return {
            id: id,
            title: "New Tab",
            url: "",
            currentUrl: "",
            externalUrl: "",
            input: "",
            engine: "youtube",
            history: [],
            historyIndex: -1,
            frameId: "aiSearchFrame-" + id.replace(/[^a-z0-9_-]/gi, "-"),
            loading: false,
            zoom: 1,
            zoomed: false
        };
    }

    function setAiBrowserTabTitle(title) {
        const safeTitle = title || "New Tab";
        const tabTitle = document.getElementById("aiBrowserTabTitle");
        if (tabTitle) tabTitle.textContent = safeTitle;
        const activeTab = getActiveSearchTab();
        if (activeTab) activeTab.title = safeTitle;
        renderAiSearchTabs();
    }

    function getActiveSearchTab() {
        for (let i = 0; i < aiHubRuntime.searchTabs.length; i++) {
            if (aiHubRuntime.searchTabs[i].id === aiHubRuntime.activeSearchTabId) return aiHubRuntime.searchTabs[i];
        }
        return null;
    }

    function getAiSearchTabById(tabId) {
        for (let i = 0; i < aiHubRuntime.searchTabs.length; i++) {
            if (aiHubRuntime.searchTabs[i].id === tabId) return aiHubRuntime.searchTabs[i];
        }
        return null;
    }

    function ensureAiSearchTabs() {
        if (aiHubRuntime.searchTabs.length) return;
        aiHubRuntime.searchTabCounter++;
        aiHubRuntime.activeSearchTabId = "tab-" + aiHubRuntime.searchTabCounter;
        aiHubRuntime.searchTabs.push(makeAiSearchTab(aiHubRuntime.activeSearchTabId));
    }

    function syncAiSearchGlobalsFromTab(tab) {
        if (!tab) return;
        aiHubRuntime.currentSearchUrl = tab.currentUrl || tab.url || "";
        aiHubRuntime.currentExternalUrl = tab.externalUrl || "";
        aiHubRuntime.searchHistory = tab.history || [];
        aiHubRuntime.searchIndex = typeof tab.historyIndex === "number" ? tab.historyIndex : -1;
        aiHubRuntime.searchEngine = tab.engine || "youtube";
    }

    function saveActiveSearchTab() {
        const tab = getActiveSearchTab();
        if (!tab) return;
        const input = document.getElementById("aiSearchInput");
        tab.input = input ? input.value || "" : "";
        tab.engine = aiHubRuntime.searchEngine || tab.engine || "youtube";
        const titleEl = document.getElementById("aiBrowserTabTitle");
        tab.title = titleEl && titleEl.textContent ? titleEl.textContent : (tab.title || "New Tab");
        tab.url = tab.currentUrl || tab.url || "";
        syncAiSearchGlobalsFromTab(tab);
    }

    function getAiSearchStage() {
        return document.querySelector(".ai-search-stage");
    }

    function syncAiExternalScrollbarCover() {
        const stage = getAiSearchStage();
        if (!stage) return;
        const frame = getActiveAiSearchFrame();
        stage.classList.toggle("external-scroll-cover", !!(frame && frame.classList.contains("active") && frame.classList.contains("external-scroll-hide")));
    }

    function bindAiSearchFrameEvents(frame) {
        if (!frame || frame.__kwvAiSearchBound) return;
        frame.__kwvAiSearchBound = true;
        frame.removeAttribute("oncontextmenu");
        frame.onload = function() {
            handleAiSearchFrameLoad(frame);
        };
        frame.onerror = function() {
            const tab = getAiSearchTabById(frame.getAttribute("data-tab-id") || "");
            if (tab) tab.loading = false;
            if (tab && tab.id === aiHubRuntime.activeSearchTabId) {
                clearAiGuestLoadTimer();
                setAiGuestFallback("The website did not load. Try opening it externally.", true);
                updateAiSearchNavState();
            }
        };
    }

    function ensureAiSearchFrame(tab) {
        if (!tab) return null;
        let frame = tab.frameId ? document.getElementById(tab.frameId) : null;
        if (frame) {
            bindAiSearchFrameEvents(frame);
            return frame;
        }
        const stage = getAiSearchStage();
        if (!stage) return null;
        const firstFrame = document.getElementById("aiSearchFrame");
        if (firstFrame && !firstFrame.getAttribute("data-tab-id")) {
            frame = firstFrame;
        } else {
            frame = document.createElement("iframe");
            frame.className = "ai-browser-frame";
            frame.removeAttribute("oncontextmenu");
            frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
            frame.setAttribute("allow", "accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share");
            frame.setAttribute("allowfullscreen", "");
            const fallback = document.getElementById("aiSearchFallback");
            stage.insertBefore(frame, fallback || null);
        }
        frame.id = tab.frameId;
        frame.setAttribute("data-tab-id", tab.id);
        bindAiSearchFrameEvents(frame);
        return frame;
    }

    function getActiveAiSearchFrame() {
        return ensureAiSearchFrame(getActiveSearchTab());
    }

    function isLocalAiSearchUrl(url) {
        return /^http:\/\/127\.0\.0\.1:/i.test(String(url || ""));
    }

    function clampAiSearchZoom(value) {
        const n = parseFloat(value);
        if (!isFinite(n)) return 1;
        return Math.max(0.3, Math.min(1.25, n));
    }

    function updateAiSearchZoomUi() {
        const tab = getActiveSearchTab();
        const zoom = clampAiSearchZoom(tab && tab.zoom ? tab.zoom : 1);
        const label = document.getElementById("aiSearchZoomValue");
        const outBtn = document.getElementById("btnAiSearchZoomOut");
        const inBtn = document.getElementById("btnAiSearchZoomIn");
        const fitWidthBtn = document.getElementById("btnAiSearchFitWidth");
        const fitHeightBtn = document.getElementById("btnAiSearchFitHeight");
        if (label) label.textContent = Math.round(zoom * 100) + "%";
        if (outBtn) outBtn.disabled = zoom <= 0.3;
        if (inBtn) inBtn.disabled = zoom >= 1.25;
        if (fitWidthBtn) fitWidthBtn.classList.toggle("active", zoom >= 0.95);
        if (fitHeightBtn) fitHeightBtn.classList.toggle("active", zoom < 0.95);
    }

    function applyAiSearchFrameZoom(frame, tab) {
        if (!frame || !tab) return;
        const zoom = clampAiSearchZoom(tab.zoom || 1);
        const externalFrame = !isLocalAiSearchUrl(tab.currentUrl || tab.url || "");
        frame.style.transformOrigin = "0 0";
        frame.style.transform = zoom === 1 ? "" : "scale(" + zoom + ")";
        frame.style.width = zoom === 1 ? (externalFrame ? "calc(100% + 12px)" : "calc(100% - 9px)") : (externalFrame ? "calc(" + (100 / zoom).toFixed(4) + "% + 12px)" : (100 / zoom).toFixed(4) + "%");
        frame.style.height = (100 / zoom).toFixed(4) + "%";
        frame.classList.toggle("zoomed", zoom !== 1);
        updateAiSearchZoomUi();
    }

    function syncAiSearchFrameVisibility() {
        const activeTab = getActiveSearchTab();
        const bgRemoverActive = aiHubRuntime.searchEngine === "bgremover";
        const frames = document.querySelectorAll(".ai-browser-frame");
        for (let i = 0; i < frames.length; i++) {
            const isActive = !!(!bgRemoverActive && activeTab && frames[i].getAttribute("data-tab-id") === activeTab.id && (activeTab.currentUrl || activeTab.url));
            frames[i].classList.toggle("active", isActive);
            frames[i].classList.toggle("external-scroll-hide", !!(isActive && !isLocalAiSearchUrl(activeTab.currentUrl || activeTab.url || "")));
            if (isActive) applyAiSearchFrameZoom(frames[i], activeTab);
        }
        setBgRemoverPanelVisible(bgRemoverActive);
        updateAiSearchNavState();
        updateAiSearchZoomUi();
        syncAiExternalScrollbarCover();
    }

    function setBgRemoverPanelVisible(visible) {
        const panel = document.getElementById("bgRemoverPanel");
        if (panel) panel.classList.toggle("active", !!visible);
        if (visible) updateBgRemoverFolderLabel();
    }

    function updateAiSearchNavState() {
        const tab = getActiveSearchTab();
        const backBtn = document.getElementById("btnAiSearchBack");
        const forwardBtn = document.getElementById("btnAiSearchForward");
        const reloadBtn = document.getElementById("btnAiSearchReload");
        const nativeHistoryMaybe = !!(tab && (tab.currentUrl || tab.url) && !/^http:\/\/127\.0\.0\.1:/i.test(tab.currentUrl || tab.url || ""));
        const canBack = !!((tab && tab.history && tab.historyIndex > 0) || nativeHistoryMaybe);
        const canForward = !!((tab && tab.history && tab.historyIndex >= 0 && tab.historyIndex < tab.history.length - 1) || nativeHistoryMaybe);
        const canReload = !!(tab && (tab.currentUrl || tab.url));
        if (backBtn) backBtn.disabled = !canBack;
        if (forwardBtn) forwardBtn.disabled = !canForward;
        if (reloadBtn) reloadBtn.disabled = !canReload;
    }

    function pushAiSearchTabHistory(tab, label, url, externalUrl) {
        if (!tab || !url) return;
        tab.history = (tab.history || []).slice(0, (typeof tab.historyIndex === "number" ? tab.historyIndex : -1) + 1);
        tab.history.push({ label: label || url, url: url, externalUrl: externalUrl || url });
        tab.historyIndex = tab.history.length - 1;
        persistAiBrowserSession();
    }

    function setAiSearchTabLocation(tab, options) {
        if (!tab || !options || !options.url) return;
        const url = options.url;
        tab.currentUrl = url;
        tab.url = url;
        tab.externalUrl = Object.prototype.hasOwnProperty.call(options, "externalUrl") ? (options.externalUrl || "") : url;
        tab.input = options.input || "";
        tab.title = options.title || tab.title || "New Tab";
        tab.engine = options.engine || tab.engine || "youtube";
        tab.zoom = clampAiSearchZoom(Object.prototype.hasOwnProperty.call(options, "zoom") ? options.zoom : (tab.zoom || 1));
        tab.zoomed = !!options.zoomed;
        tab.loading = true;
        if (options.addHistory !== false) {
            pushAiSearchTabHistory(tab, options.historyLabel || options.input || options.title || url, url, tab.externalUrl);
        }
        if (tab.id === aiHubRuntime.activeSearchTabId) {
            syncAiSearchGlobalsFromTab(tab);
            setAiSearchEngine(tab.engine || "youtube", { silent: true });
            setAiSearchInputs(tab.input || "");
            setAiBrowserTabTitle(tab.title || "New Tab");
            showAiSearchHome(false);
            const frame = ensureAiSearchFrame(tab);
            if (frame) {
                if (options.watch) startAiGuestLoadWatch(url);
                else clearAiGuestLoadTimer();
                setAiGuestFallback("", false);
                frame.classList.toggle("external-scroll-hide", !isLocalAiSearchUrl(url));
                applyAiSearchFrameZoom(frame, tab);
                frame.src = getAiSearchFrameUrl(url);
                syncAiSearchFrameVisibility();
            }
        }
        renderAiSearchTabs();
        updateAiSearchNavState();
    }

    function renderAiSearchTabs() {
        const strip = document.querySelector(".ai-browser-tabs");
        const plus = document.getElementById("btnAiSearchNewTabPlus");
        if (!strip || !plus) return;
        const existing = strip.querySelectorAll(".ai-browser-tab");
        for (let i = 0; i < existing.length; i++) existing[i].parentNode.removeChild(existing[i]);
        ensureAiSearchTabs();
        aiHubRuntime.searchTabs.forEach((tab) => {
            const btn = document.createElement("button");
            btn.className = "ai-browser-tab" + (tab.id === aiHubRuntime.activeSearchTabId ? " active" : "");
            btn.type = "button";
            btn.title = tab.title || "New Tab";
            btn.innerHTML = '<span class="ai-browser-tab-title"></span><span class="ai-browser-tab-close" title="Close Tab">x</span>';
            const title = btn.querySelector(".ai-browser-tab-title");
            if (title) title.textContent = tab.title || "New Tab";
            const close = btn.querySelector(".ai-browser-tab-close");
            if (close) {
                close.onclick = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    closeAiSearchTab(tab.id);
                };
            }
            btn.onclick = () => activateAiSearchTab(tab.id);
            strip.insertBefore(btn, plus);
        });
        syncAiSearchFrameVisibility();
    }

    function loadAiSearchTab(tab) {
        if (!tab) return;
        tab.zoomed = clampAiSearchZoom(tab.zoom || 1) !== 1;
        const frame = ensureAiSearchFrame(tab);
        if (frame && (tab.currentUrl || tab.url) && !frame.getAttribute("src")) {
            applyAiSearchFrameZoom(frame, tab);
            frame.src = getAiSearchFrameUrl(tab.currentUrl || tab.url);
        }
        syncAiSearchGlobalsFromTab(tab);
        setAiSearchInputs(tab.input || "");
        const titleEl = document.getElementById("aiBrowserTabTitle");
        if (titleEl) titleEl.textContent = tab.title || "New Tab";
        setAiSearchEngine(tab.engine || "youtube", { silent: true });
        renderAiSearchTabs();
        if (tab.currentUrl || tab.url) showAiSearchHome(false);
        else showAiSearchHome(true);
        updateAiSearchNavState();
    }

    function activateAiSearchTab(tabId) {
        if (tabId === aiHubRuntime.activeSearchTabId) return;
        saveActiveSearchTab();
        const tab = getAiSearchTabById(tabId);
        if (!tab) return;
        aiHubRuntime.activeSearchTabId = tab.id;
        loadAiSearchTab(tab);
    }

    function closeAiSearchTab(tabId) {
        ensureAiSearchTabs();
        const tabIndex = aiHubRuntime.searchTabs.findIndex((item) => item.id === tabId);
        if (tabIndex < 0) return;
        const wasActive = tabId === aiHubRuntime.activeSearchTabId;
        if (wasActive) saveActiveSearchTab();
        if (aiHubRuntime.searchTabs.length === 1) {
            const oldFrame = ensureAiSearchFrame(aiHubRuntime.searchTabs[0]);
            if (oldFrame && oldFrame.parentNode) oldFrame.parentNode.removeChild(oldFrame);
            aiHubRuntime.searchTabs[0] = makeAiSearchTab(tabId);
            aiHubRuntime.activeSearchTabId = tabId;
            aiHubRuntime.searchHistory = [];
            aiHubRuntime.searchIndex = -1;
            renderAiSearchTabs();
            openAiSearchHome(false);
            return;
        }
        const closingTab = aiHubRuntime.searchTabs[tabIndex];
        const closingFrame = closingTab && closingTab.frameId ? document.getElementById(closingTab.frameId) : null;
        if (closingFrame && closingFrame.parentNode) closingFrame.parentNode.removeChild(closingFrame);
        aiHubRuntime.searchTabs.splice(tabIndex, 1);
        if (!wasActive) {
            renderAiSearchTabs();
            return;
        }
        const nextTab = aiHubRuntime.searchTabs[Math.min(tabIndex, aiHubRuntime.searchTabs.length - 1)];
        aiHubRuntime.activeSearchTabId = nextTab.id;
        loadAiSearchTab(nextTab);
    }

    function createAiSearchTab() {
        saveActiveSearchTab();
        aiHubRuntime.searchTabCounter++;
        const id = "tab-" + aiHubRuntime.searchTabCounter;
        aiHubRuntime.searchTabs.push(makeAiSearchTab(id));
        aiHubRuntime.activeSearchTabId = id;
        renderAiSearchTabs();
        openAiSearchHome(false);
    }

    function getAiSearchFrameUrl(url) {
        return url;
    }

    function getYouTubeSearchEmbedUrl(query) {
        // YouTube Data API keys are optional for search/listing only; they do not fix
        // Error 153 playback. Playback uses the local wrapper plus official nocookie embed.
        return buildLocalYouTubeSearchUrl(query);
    }

    function setAiSearchEngine(engine, options) {
        options = options || {};
        aiHubRuntime.searchEngine = engine === "images" ? "images" : (engine === "bgremover" ? "bgremover" : "youtube");
        const tab = getActiveSearchTab();
        if (tab) tab.engine = aiHubRuntime.searchEngine;
        document.querySelectorAll("[data-ai-search-engine]").forEach((button) => {
            button.classList.toggle("active", (button.getAttribute("data-ai-search-engine") || "youtube") === aiHubRuntime.searchEngine);
        });
        const input = document.getElementById("aiSearchInput");
        const homeInput = document.getElementById("aiSearchHomeInput");
        const placeholder = "Search";
        if (input) {
            input.placeholder = placeholder;
            if (aiHubRuntime.searchEngine !== "bgremover") input.focus();
        }
        if (homeInput) {
            homeInput.placeholder = placeholder;
            if (aiHubRuntime.searchEngine !== "bgremover") homeInput.focus();
        }
        setBgRemoverPanelVisible(aiHubRuntime.searchEngine === "bgremover");
        if (!options.silent) {
            setAiHubStatus(aiHubRuntime.searchEngine === "images" ? "Google image search ready. Right-click image to copy URL." : (aiHubRuntime.searchEngine === "bgremover" ? "BG Remover ready. Drop image or click to select." : "YouTube search mode ready. Type query, then click video to play."), false);
        }
    }

    function shouldOpenAiSearchExternally(url) {
        const host = getAiSearchUrlHost(url);
        if (!host) return false;
        if (host === "accounts.google.com") return true;
        if (/(^|\.)google\.[a-z.]+$/i.test(host || "") && /\/signin|\/ServiceLogin|\/AccountChooser|\/InteractiveLogin/i.test(url || "")) return true;
        if (/\/accounts|\/login|\/signin/i.test(url)) return true;
        if ((host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") && !getYouTubeVideoId(url)) return false;
        return false;
    }

    function getLoginBrowserSite(url) {
        const host = getAiSearchUrlHost(url);
        if (/(^|\.)instagram\.com$/i.test(host || "")) return "Instagram";
        return "";
    }

    function setAiSearchInputs(value) {
        const input = document.getElementById("aiSearchInput");
        const homeInput = document.getElementById("aiSearchHomeInput");
        if (input) input.value = value || "";
        if (homeInput) homeInput.value = value || "";
    }

    function setAiSearchAiMode(enabled) {
        aiHubRuntime.searchAiMode = !!enabled;
        const btn = document.getElementById("btnAiSearchMode");
        if (btn) btn.classList.toggle("active", aiHubRuntime.searchAiMode);
    }

    function showAiSearchHome(show) {
        const home = document.getElementById("aiSearchHome");
        const fallback = document.getElementById("aiSearchFallback");
        const bgRemoverActive = aiHubRuntime.searchEngine === "bgremover";
        if (home) home.classList.toggle("hidden", bgRemoverActive || !show);
        syncAiSearchFrameVisibility();
        if (show || bgRemoverActive) {
            document.querySelectorAll(".ai-browser-frame").forEach((frame) => {
                frame.classList.remove("active");
                frame.classList.remove("external-scroll-hide");
            });
        }
        syncAiExternalScrollbarCover();
        if (fallback) fallback.classList.remove("active");
        updateAiSearchZoomUi();
    }

    function setAiSearchFrameZoom(enabled) {
        const tab = getActiveSearchTab();
        if (tab) {
            tab.zoomed = !!enabled;
            tab.zoom = enabled ? 0.3 : 1;
        }
        const frame = getActiveAiSearchFrame();
        if (frame && tab) applyAiSearchFrameZoom(frame, tab);
    }

    function setAiSearchZoom(value) {
        const tab = getActiveSearchTab();
        if (!tab) return;
        tab.zoom = clampAiSearchZoom(value);
        const frame = getActiveAiSearchFrame();
        if (frame) applyAiSearchFrameZoom(frame, tab);
    }

    function fitAiSearchWidth() {
        setAiSearchZoom(1);
        setAiHubStatus("Fit to width.", false);
    }

    function fitAiSearchHeight() {
        setAiSearchZoom(0.55);
        setAiHubStatus("Fit to height.", false);
    }

    function stepAiSearchZoom(delta) {
        const tab = getActiveSearchTab();
        const current = clampAiSearchZoom(tab && tab.zoom ? tab.zoom : 1);
        setAiSearchZoom(current + delta);
    }

    function clearAiGuestLoadTimer() {
        if (aiHubRuntime.guestLoadTimer) {
            window.clearTimeout(aiHubRuntime.guestLoadTimer);
            aiHubRuntime.guestLoadTimer = null;
        }
    }

    function setAiGuestFallback(message, isActive) {
        const fallback = document.getElementById("aiSearchFallback");
        if (!fallback) return;
        const text = fallback.querySelector("span");
        if (text && message) text.textContent = message;
        fallback.classList.toggle("active", !!isActive);
    }

    function startAiGuestLoadWatch(url) {
        clearAiGuestLoadTimer();
        setAiGuestFallback("", false);
        const host = getAiSearchUrlHost(url || "");
        const isSocialSite = isPinterestHost(host) || /(^|\.)instagram\.com$/i.test(host || "");
        aiHubRuntime.guestLoadTimer = window.setTimeout(() => {
            setAiGuestFallback(isSocialSite ? "This site may be blank or blocked in the panel. Use Open for login or the full page." : "The website may be slow or blocked. You can use external open in Guest Mode.", true);
        }, isSocialSite ? 3500 : 9000);
    }

    function resetAiGuestSession() {
        clearAiGuestLoadTimer();
        aiHubRuntime.searchTabs.forEach((tab) => {
            const frame = tab.frameId ? document.getElementById(tab.frameId) : null;
            if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
        });
        aiHubRuntime.searchTabs = [];
        aiHubRuntime.activeSearchTabId = "";
        aiHubRuntime.searchHistory = [];
        aiHubRuntime.searchIndex = -1;
        aiHubRuntime.currentSearchUrl = "";
        aiHubRuntime.currentExternalUrl = "";
        aiHubRuntime.searchEngine = "youtube";
        ensureAiSearchTabs();
        setAiSearchFrameZoom(false);
        setAiSearchInputs("");
        showAiSearchHome(true);
        setAiGuestFallback("", false);
        document.querySelectorAll("[data-ai-search-engine]").forEach((button) => {
            button.classList.toggle("active", (button.getAttribute("data-ai-search-engine") || "youtube") === "youtube");
        });
        setBgRemoverPanelVisible(false);
    }

    function openBgRemoverPanel() {
        ensureAiSearchTabs();
        setAiSearchEngine("bgremover");
        const tab = getActiveSearchTab();
        if (tab) {
            tab.title = "BG Remover";
            tab.engine = "bgremover";
        }
        setAiBrowserTabTitle("BG Remover");
        setAiSearchInputs("");
        showAiSearchHome(false);
        setAiGuestFallback("", false);
        setBgRemoverPanelVisible(true);
        updateAiSearchNavState();
        setAiHubStatus("BG Remover ready. Drop image or click to select.", false);
    }

    function openAiSearchHome(addHistory) {
        ensureAiSearchTabs();
        const tab = getActiveSearchTab();
        if (!aiHubRuntime.guestServerReady && !aiHubRuntime.guestServerFailed) {
            startAiGuestServer();
            setAiHubStatus("Starting YouTube search...", false);
            window.setTimeout(() => openAiSearchHome(addHistory), 300);
            return;
        }
        setAiSearchEngine("youtube", { silent: true });
        const searchUrl = buildLocalYouTubeSearchUrl(defaultYouTubeSearchQuery);
        const externalUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(defaultYouTubeSearchQuery);
        if (!searchUrl) {
            setAiHubStatus("YouTube search did not start.", true);
            return;
        }
        setAiSearchTabLocation(tab, {
            url: searchUrl,
            externalUrl: externalUrl,
            input: defaultYouTubeSearchQuery,
            title: "YouTube",
            engine: "youtube",
            zoomed: false,
            watch: true,
            addHistory: addHistory !== false,
            historyLabel: defaultYouTubeSearchQuery
        });
        setAiHubStatus("Loading YouTube results.", false);
    }

    function getBlockedSocialMeta(url) {
        // Normal browser mode: let CEF load social sites directly so users can log in
        // and let Chromium persist cookies in the extension-local profile folder.
        return null;
    }

    function navigateAiSearch(rawValue, addHistory) {
        ensureAiSearchTabs();
        const activeTab = getActiveSearchTab();
        const value = aiHubTrim(rawValue);
        if (!value) return;
        const videoId = extractYouTubeId(value);
        if (videoId && !aiHubRuntime.guestServerReady && !aiHubRuntime.guestServerFailed) {
            startAiGuestServer();
            setAiHubStatus("Starting guest YouTube player...", false);
            window.setTimeout(() => navigateAiSearch(value, addHistory), 300);
            return;
        }
        if (videoId) {
            const wrapperUrl = buildLocalYouTubePlayerUrl(videoId);
            const externalUrl = "https://www.youtube.com/watch?v=" + encodeURIComponent(videoId);
            if (!wrapperUrl) {
                setAiHubStatus("YouTube guest player did not start. Try opening externally.", true);
                openExternalUrl(externalUrl);
                return;
            }
            console.log("[Keshav Velo Search] YouTube video detected:", videoId);
            console.log("[Keshav Velo Search] Local origin:", aiHubRuntime.guestLocalOrigin);
            console.log("[Keshav Velo Search] Loading local wrapper:", wrapperUrl);
            console.log("[Keshav Velo Search] External fallback URL:", externalUrl);
            setAiSearchTabLocation(activeTab, {
                url: wrapperUrl,
                externalUrl: externalUrl,
                input: value,
                title: "YouTube",
                engine: "youtube",
                zoomed: false,
                addHistory: addHistory !== false,
                historyLabel: value
            });
            setAiHubStatus("Loading YouTube video in the Guest Mode wrapper.", false);
            return;
        }
        if (aiHubRuntime.searchEngine === "youtube" && !/^https?:\/\//i.test(value)) {
            if (!aiHubRuntime.guestServerReady && !aiHubRuntime.guestServerFailed) {
                startAiGuestServer();
                setAiHubStatus("Starting guest YouTube search...", false);
                window.setTimeout(() => navigateAiSearch(value, addHistory), 300);
                return;
            }
            const searchUrl = buildLocalYouTubeSearchUrl(value);
            const externalUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(value || defaultYouTubeSearchQuery);
            if (!searchUrl) {
                setAiHubStatus("YouTube guest search did not start. Try opening externally.", true);
                openExternalUrl(externalUrl);
                return;
            }
            console.log("[Keshav Velo Search] Local YouTube search URL:", searchUrl);
            console.log("[Keshav Velo Search] External fallback URL:", externalUrl);
            setAiSearchTabLocation(activeTab, {
                url: searchUrl,
                externalUrl: externalUrl,
                input: value,
                title: "YouTube",
                engine: "youtube",
                zoomed: false,
                watch: true,
                addHistory: addHistory !== false,
                historyLabel: value
            });
            setAiHubStatus("Loading custom YouTube Guest Search.", false);
            return;
        }
        if (aiHubRuntime.searchEngine === "images" && !/^https?:\/\//i.test(value)) {
            if (!aiHubRuntime.guestServerReady && !aiHubRuntime.guestServerFailed) {
                startAiGuestServer();
                setAiHubStatus("Starting Google image search...", false);
                window.setTimeout(() => navigateAiSearch(value, addHistory), 300);
                return;
            }
            const imageSearchUrl = buildLocalImageSearchUrl(value);
            const externalUrl = "https://www.google.com/search?udm=2&q=" + encodeURIComponent(value || "png");
            if (!imageSearchUrl) {
                setAiHubStatus("Image search did not start. Try opening externally.", true);
                openExternalUrl(externalUrl);
                return;
            }
            setAiSearchTabLocation(activeTab, {
                url: imageSearchUrl,
                externalUrl: externalUrl,
                input: value,
                title: "Images",
                engine: "images",
                zoomed: false,
                watch: true,
                addHistory: addHistory !== false,
                historyLabel: value
            });
            setAiHubStatus("Loading Google image results. Right-click an image and choose Import Image.", false);
            return;
        }
        if (aiHubRuntime.searchAiMode) setAiSearchAiMode(false);
        let url = normalizeAiSearchUrl(value);
        if (!url) return;
        if (/^https?:\/\/(www\.)?pinterest\.com\/?$/i.test(url)) {
            url = "https://www.pinterest.com/ideas/";
        }
        const loginBrowserSite = getLoginBrowserSite(url);
        if (loginBrowserSite) {
            if (!aiHubRuntime.guestServerReady && !aiHubRuntime.guestServerFailed) {
                startAiGuestServer();
                setAiHubStatus(loginBrowserSite + " login browser is starting...", false);
                window.setTimeout(() => navigateAiSearch(rawValue, addHistory), 300);
                return;
            }
            const loginUrl = buildLocalGuestUrl("/login-browser?site=" + encodeURIComponent(loginBrowserSite) + "&url=" + encodeURIComponent(url));
            setAiSearchTabLocation(activeTab, {
                url: loginUrl || url,
                externalUrl: url,
                input: url,
                title: loginBrowserSite,
                engine: "google",
                zoomed: false,
                addHistory: addHistory !== false,
                historyLabel: loginBrowserSite
            });
            openLoginBrowserUrl(url, loginBrowserSite);
            setAiHubStatus(loginBrowserSite + " login browser is opening. The panel iframe will not be blank.", false);
            return;
        }
        const blockedSocial = getBlockedSocialMeta(url);
        if (blockedSocial) {
            if (!aiHubRuntime.guestServerReady && !aiHubRuntime.guestServerFailed) {
                startAiGuestServer();
                setAiHubStatus(blockedSocial.site + " fallback is starting...", false);
                window.setTimeout(() => navigateAiSearch(rawValue, addHistory), 300);
                return;
            }
            const blockedUrl = buildBlockedSiteUrl(blockedSocial.site, blockedSocial.url);
            setAiSearchTabLocation(activeTab, {
                url: blockedUrl || url,
                externalUrl: blockedSocial.url,
                input: blockedSocial.url,
                title: blockedSocial.site,
                engine: "google",
                zoomed: false,
                addHistory: addHistory !== false,
                historyLabel: blockedSocial.site
            });
            setAiHubStatus(blockedSocial.site + " panel preview is blocked. Use external open.", false);
            return;
        }
        if (shouldOpenAiSearchExternally(url)) {
            setAiSearchTabLocation(activeTab, {
                url: url,
                externalUrl: url,
                input: value,
                title: getAiSearchUrlHost(url) || "External",
                engine: "google",
                zoomed: false,
                addHistory: addHistory !== false,
                historyLabel: value
            });
            setAiHubStatus("Login and account pages will open in the browser. Google/YouTube login is blocked in the panel.", false);
            openExternalUrl(url);
            return;
        }
        const frameUrl = getAiSearchFrameUrl(url);
        setAiSearchTabLocation(activeTab, {
            url: frameUrl,
            externalUrl: url,
            input: value,
            title: getAiSearchUrlHost(url) || "Search",
            engine: "google",
            zoomed: false,
            watch: true,
            addHistory: addHistory !== false,
            historyLabel: value
        });
        setAiHubStatus("Search loaded in panel. If a site blocks preview, use the external open button.", false);
    }

    function moveAiSearchHistory(delta) {
        const tab = getActiveSearchTab();
        const frame = getActiveAiSearchFrame();
        if (!tab) return;
        // Cross-origin pages hide their current URL from the panel. Move Chromium's
        // real iframe history first so Back does not jump to the saved start page.
        if (frame && !isLocalAiSearchUrl(tab.currentUrl || tab.url || "")) {
            try {
                if (frame.contentWindow && frame.contentWindow.history) {
                    frame.contentWindow.history.go(delta);
                    setAiHubStatus(delta < 0 ? "Back." : "Forward.", false);
                    window.setTimeout(updateAiSearchNavState, 80);
                    return;
                }
            } catch (historyErr) {}
        }
        const nextIndex = (typeof tab.historyIndex === "number" ? tab.historyIndex : -1) + delta;
        if (!tab.history || nextIndex < 0 || nextIndex >= tab.history.length) {
            if (frame && (tab.currentUrl || tab.url) && !/^http:\/\/127\.0\.0\.1:/i.test(tab.currentUrl || tab.url || "")) {
                try {
                    if (frame.contentWindow && frame.contentWindow.history) {
                        frame.contentWindow.history.go(delta);
                        setAiHubStatus(delta < 0 ? "Back." : "Forward.", false);
                        return;
                    }
                } catch (historyErr) {}
            }
            updateAiSearchNavState();
            return;
        }
        const item = tab.history[nextIndex];
        tab.historyIndex = nextIndex;
        tab.currentUrl = item.url;
        tab.url = item.url;
        tab.externalUrl = item.externalUrl || item.url;
        tab.input = item.label || item.url;
        tab.zoomed = clampAiSearchZoom(tab.zoom || 1) !== 1;
        syncAiSearchGlobalsFromTab(tab);
        setAiSearchInputs(tab.input || "");
        showAiSearchHome(false);
        if (frame) {
            applyAiSearchFrameZoom(frame, tab);
            frame.src = getAiSearchFrameUrl(item.url);
        }
        updateAiSearchNavState();
        persistAiBrowserSession();
        setAiHubStatus(delta < 0 ? "Back." : "Forward.", false);
    }

    function reloadAiSearch() {
        const tab = getActiveSearchTab();
        const frame = getActiveAiSearchFrame();
        const url = tab ? (tab.currentUrl || tab.url || "") : "";
        if (!frame || !url) return;
        applyAiSearchFrameZoom(frame, tab);
        // Reload the document currently displayed by Chromium. Assigning src here
        // loses in-site navigation and returns to the first Google result page.
        try {
            if (frame.contentWindow && frame.contentWindow.location) {
                frame.contentWindow.location.reload();
                setAiHubStatus("Reloaded.", false);
                return;
            }
        } catch (reloadErr) {}
        frame.src = getAiSearchFrameUrl(url);
        setAiHubStatus("Reloaded.", false);
    }

    function openAiSearchExternal() {
        const input = document.getElementById("aiSearchInput");
        const tab = getActiveSearchTab();
        const url = (tab && (tab.externalUrl || tab.currentUrl || tab.url)) || aiHubRuntime.currentExternalUrl || aiHubRuntime.currentSearchUrl || normalizeAiSearchUrl(input && input.value ? input.value : "");
        console.log("[Keshav Velo Search] External fallback URL:", url);
        if (url) {
            const loginSite = getLoginBrowserSite(url);
            if (loginSite) {
                openLoginBrowserUrl(url, loginSite);
            } else {
                openExternalUrl(url);
            }
        }
    }

    function handleAiSearchFrameLoad(frame) {
        const tab = getAiSearchTabById(frame && frame.getAttribute ? (frame.getAttribute("data-tab-id") || "") : "");
        if (!tab) return;
        tab.loading = false;
        persistAiBrowserSession();
        initAiFrameImportContextMenu();
        injectAiBrowserScrollbarTheme(frame);
        installAiFrameContextMenu(frame);
        window.setTimeout(function() { injectAiBrowserScrollbarTheme(frame); }, 250);
        window.setTimeout(function() { injectAiBrowserScrollbarTheme(frame); }, 800);
        window.setTimeout(function() { injectAiBrowserScrollbarTheme(frame); }, 1800);
        window.setTimeout(function() { installAiFrameContextMenu(frame); }, 250);
        window.setTimeout(function() { installAiFrameContextMenu(frame); }, 800);
        window.setTimeout(function() { installAiFrameContextMenu(frame); }, 1800);
        window.setTimeout(function() { installAiFrameContextMenu(frame); }, 3200);
        tab.zoomed = clampAiSearchZoom(tab.zoom || 1) !== 1;
        if (frame) applyAiSearchFrameZoom(frame, tab);
        const isActive = tab.id === aiHubRuntime.activeSearchTabId;
        const loadedExternalUrl = tab.externalUrl || tab.currentUrl || tab.url || "";
        const loadedHost = getAiSearchUrlHost(loadedExternalUrl);
        const isPinterestLoad = isPinterestHost(loadedHost);
        const isSocialLoad = isPinterestLoad || /(^|\.)instagram\.com$/i.test(loadedHost || "");
        if (isPinterestLoad) {
            window.setTimeout(() => injectPinterestGuestMode(frame, loadedExternalUrl), 0);
            window.setTimeout(() => injectPinterestGuestMode(frame, loadedExternalUrl), 800);
        }
        if (isActive) clearAiGuestLoadTimer();
        if (isActive && /\/login-browser(?:\?|$)/i.test(tab.currentUrl || tab.url || "")) {
            setAiGuestFallback("", false);
        } else if (isActive && isPinterestLoad) {
            setAiGuestFallback("", false);
        } else if (isActive && isSocialLoad) {
            const expectedUrl = loadedExternalUrl;
            window.setTimeout(() => {
                const active = getActiveSearchTab();
                if (active && active.id === tab.id && ((active.externalUrl || active.currentUrl || active.url || "") === expectedUrl)) {
                    setAiGuestFallback("If the page is blank, the site blocked panel preview. Use the Open button to continue in the same browser session.", true);
                }
            }, 2500);
        } else if (isActive) {
            setAiGuestFallback("", false);
        }
        try {
            const frameUrl = frame.contentWindow && frame.contentWindow.location ? String(frame.contentWindow.location.href || "") : "";
            if (frameUrl.indexOf("/home") !== -1) {
                tab.title = "New Tab";
                tab.input = "";
                if (isActive) {
                    setAiBrowserTabTitle("New Tab");
                    setAiSearchInputs("");
                } else {
                    renderAiSearchTabs();
                }
                return;
            }
            if (frameUrl.indexOf("/blocked") !== -1) {
                try {
                    const blockedUrl = new URL(frameUrl);
                    const target = blockedUrl.searchParams.get("url") || tab.externalUrl || "";
                    const site = blockedUrl.searchParams.get("site") || getAiSearchUrlHost(target) || "External";
                    tab.externalUrl = target;
                    tab.title = site;
                    if (isActive) setAiBrowserTabTitle(site);
                    else renderAiSearchTabs();
                } catch (blockedErr) {
                    const host = tab.externalUrl ? getAiSearchUrlHost(tab.externalUrl) : "";
                    tab.title = host || "External";
                    if (isActive) setAiBrowserTabTitle(tab.title);
                    else renderAiSearchTabs();
                }
                return;
            }
            const videoId = extractYouTubeId(frameUrl);
            if (videoId && frameUrl.indexOf("/yt-player") !== -1) {
                const externalUrl = "https://www.youtube.com/watch?v=" + encodeURIComponent(videoId);
                const previousUrl = tab.currentUrl || tab.url || "";
                if (previousUrl && previousUrl !== frameUrl) {
                    pushAiSearchTabHistory(tab, externalUrl, frameUrl, externalUrl);
                }
                tab.currentUrl = frameUrl;
                tab.url = frameUrl;
                tab.externalUrl = externalUrl;
                tab.input = externalUrl;
                tab.title = "YouTube";
                if (isActive) {
                    syncAiSearchGlobalsFromTab(tab);
                    setAiSearchInputs(externalUrl);
                    setAiBrowserTabTitle("YouTube");
                    setAiHubStatus("YouTube video loaded in the Guest Mode player.", false);
                } else {
                    renderAiSearchTabs();
                }
                return;
            }
            if (videoId && frameUrl !== (tab.currentUrl || tab.url)) {
                console.log("[Keshav Velo Search] YouTube video detected from iframe load:", videoId);
                if (isActive) navigateAiSearch(frameUrl, true);
            }
            if (/^http:\/\/127\.0\.0\.1:/i.test(frameUrl || "") && frameUrl !== (tab.currentUrl || tab.url || "")) {
                tab.currentUrl = frameUrl;
                tab.url = frameUrl;
                tab.externalUrl = tab.externalUrl || frameUrl;
                tab.input = frameUrl;
                if (frameUrl.indexOf("/yt-search") !== -1) tab.title = "YouTube";
                if (frameUrl.indexOf("/img-search") !== -1) tab.title = "Images";
                pushAiSearchTabHistory(tab, tab.title || frameUrl, frameUrl, tab.externalUrl);
                if (isActive) {
                    syncAiSearchGlobalsFromTab(tab);
                    setAiSearchInputs(tab.input || "");
                    setAiBrowserTabTitle(tab.title || "Search");
                } else {
                    renderAiSearchTabs();
                }
            }
        } catch (frameErr) {
            // Cross-origin pages normally hide their internal URL from the CEP parent.
        }
        if (isActive) updateAiSearchNavState();
    }

    function saveAiHubProvider() {
        const provider = aiHubProviders[0];
        const apiKeyInput = document.getElementById("aiHubApiKeyInput");
        const modelInput = document.getElementById("aiHubModelInput");
        aiHubState.providers[provider.id] = {
            apiKey: aiHubTrim(apiKeyInput && apiKeyInput.value ? apiKeyInput.value : ""),
            model: aiHubTrim(modelInput && modelInput.value ? modelInput.value : provider.model || ""),
            baseUrl: provider.baseUrl || ""
        };
        aiHubState.activeProviderId = provider.id;
        updateAiHubHeader();
        if (!persistAiHubState()) {
            setAiHubStatus("Save failed because local storage is unavailable.", true);
            return;
        }
        renderAiHubProviderButtons();
        setAiHubSettingsOpen(false);
        setAiHubStatus("Google search settings ready.", false);
    }

    function initAiHubModal() {
        restoreAiBrowserSession();
        initAiFrameImportContextMenu();
        const launchBtn = document.getElementById("btnAiHub");
        const overlay = document.getElementById("aiHubModal");
        const modalBackBtn = document.getElementById("btnAiHubBack");
        const closeBtn = document.getElementById("btnAiHubClose");
        const cancelBtn = document.getElementById("btnAiHubCancel");
        const saveBtn = document.getElementById("btnAiHubSave");
        const sendBtn = document.getElementById("btnAiHubSend");
        const clearBtn = document.getElementById("btnAiHubClear");
        const attachBtn = document.getElementById("btnAiHubAttach");
        const settingsBtn = document.getElementById("btnAiHubToggleSettings");
        const backBtn = document.getElementById("btnAiHubSettingsBack");
        const chatTab = document.getElementById("btnAiHubChatTab");
        const searchTab = document.getElementById("btnAiHubSearchTab");
        const searchForm = document.getElementById("aiSearchForm");
        const searchHomeForm = document.getElementById("aiSearchHomeForm");
        const searchInput = document.getElementById("aiSearchInput");
        const searchHomeInput = document.getElementById("aiSearchHomeInput");
        const searchModeBtn = document.getElementById("btnAiSearchMode");
        const searchBackBtn = document.getElementById("btnAiSearchBack");
        const searchForwardBtn = document.getElementById("btnAiSearchForward");
        const searchReloadBtn = document.getElementById("btnAiSearchReload");
        const searchFitWidthBtn = document.getElementById("btnAiSearchFitWidth");
        const searchFitHeightBtn = document.getElementById("btnAiSearchFitHeight");
        const searchZoomOutBtn = document.getElementById("btnAiSearchZoomOut");
        const searchZoomInBtn = document.getElementById("btnAiSearchZoomIn");
        const searchFallbackOpenBtn = document.getElementById("btnAiSearchFallbackOpen");
        const searchFrame = document.getElementById("aiSearchFrame");
        const searchNewTabBtn = document.getElementById("btnAiSearchNewTab");
        const searchNewTabPlusBtn = document.getElementById("btnAiSearchNewTabPlus");
        const googleSectionTab = document.getElementById("btnAiGoogleSectionTab");
        const enhancerTab = document.getElementById("btnAiEnhancerTab");
        const videoDownloaderTab = document.getElementById("btnAiVideoDownloaderTab");
        const videoDownloaderStartBtn = document.getElementById("btnVideoDownloaderStart");
        const videoDownloaderClearBtn = document.getElementById("btnVideoDownloaderClear");
        const videoDownloaderImportBtn = document.getElementById("btnVideoDownloaderImport");
        const videoDownloaderChooseFolderBtn = document.getElementById("btnVideoDownloaderChooseFolder");
        const videoDownloaderInput = document.getElementById("videoDownloaderUrl");
        const videoDownloaderCookies = document.getElementById("videoDownloaderCookies");
        const videoDownloaderRangeStart = document.getElementById("videoDownloaderRangeStart");
        const videoDownloaderRangeEnd = document.getElementById("videoDownloaderRangeEnd");
        const videoDownloaderTrimStart = document.getElementById("videoDownloaderTrimStart");
        const videoDownloaderTrimEnd = document.getElementById("videoDownloaderTrimEnd");
        const promptInput = document.getElementById("aiHubPromptInput");
        const apiKeyInput = document.getElementById("aiHubApiKeyInput");
        const modelInput = document.getElementById("aiHubModelInput");
        initAiEnhancerPanel();
        initBgRemoverPanel();
        if (!window.__kwvAiSearchMessageBound) {
            window.__kwvAiSearchMessageBound = true;
            window.addEventListener("message", function(event) {
                const data = event && event.data ? event.data : null;
                if (!data) return;
                if (data.kwvAiLoginBrowser) {
                    openLoginBrowserUrl(String(data.kwvAiLoginBrowser || ""), String(data.kwvAiLoginSite || "site"));
                    return;
                }
                if (data.kwvAiSearchNavigate) {
                    navigateAiSearch(String(data.kwvAiSearchNavigate || ""), true);
                    return;
                }
                if (data.kwvAiImportImageData) {
                    importAiImageDataUrl(String(data.kwvAiImportImageData || ""), String(data.kwvAiImportImageType || "image/png"));
                    return;
                }
                if (data.kwvAiImportImageRemoveBgData) {
                    importAiImageDataUrlWithRemovedBg(String(data.kwvAiImportImageRemoveBgData || ""), String(data.kwvAiImportImageType || "image/png"));
                    return;
                }
                if (data.kwvAiCopyImageContext) {
                    const payload = data.kwvAiCopyImageContext || {};
                    showAiFrameImportMenu({
                        imageUrl: String(payload.imageUrl || ""),
                        clientX: Number(payload.x) || 160,
                        clientY: Number(payload.y) || 180,
                        preventDefault: function() {},
                        stopPropagation: function() {}
                    });
                    return;
                }
                if (data.kwvAiCopyImageUrl) {
                    const imageUrl = String(data.kwvAiCopyImageUrl || "");
                    if (imageUrl) {
                        copyAiTextToClipboard(imageUrl, "Image URL copied: " + imageUrl);
                    } else {
                        setAiHubStatus("Image URL nahi mila.", true);
                    }
                    return;
                }
                if (data.kwvAiCopyText) {
                    copyAiTextToClipboard(String(data.kwvAiCopyText || ""), String(data.kwvAiCopyLabel || "Copied."));
                    return;
                }
                if (data.kwvAiStatus) {
                    setAiHubStatus(String(data.kwvAiStatus || ""), !!data.kwvAiStatusError);
                }
            });
        }
        if (launchBtn) launchBtn.onclick = openAiHubModal;
        if (modalBackBtn) modalBackBtn.onclick = hideAiHubModalKeepSession;
        if (closeBtn) closeBtn.onclick = closeAiHubModal;
        if (cancelBtn) cancelBtn.onclick = () => setAiHubSettingsOpen(false);
        if (saveBtn) saveBtn.onclick = saveAiHubProvider;
        if (sendBtn) sendBtn.onclick = function() {};
        if (clearBtn) clearBtn.onclick = function() {};
        if (attachBtn) attachBtn.onclick = function() {};
        if (chatTab) chatTab.onclick = () => setAiHubMode("search");
        if (searchTab) searchTab.onclick = () => {
            setAiHubMode("search");
            const activeTab = getActiveSearchTab();
            if (!activeTab || !(activeTab.currentUrl || activeTab.url)) openAiSearchHome(true);
        };
        if (searchModeBtn) searchModeBtn.onclick = () => setAiSearchAiMode(false);
        if (searchBackBtn) searchBackBtn.onclick = () => moveAiSearchHistory(-1);
        if (searchForwardBtn) searchForwardBtn.onclick = () => moveAiSearchHistory(1);
        if (searchReloadBtn) searchReloadBtn.onclick = reloadAiSearch;
        if (searchFitWidthBtn) searchFitWidthBtn.onclick = fitAiSearchWidth;
        if (searchFitHeightBtn) searchFitHeightBtn.onclick = fitAiSearchHeight;
        if (searchZoomOutBtn) searchZoomOutBtn.onclick = () => stepAiSearchZoom(-0.05);
        if (searchZoomInBtn) searchZoomInBtn.onclick = () => stepAiSearchZoom(0.05);
        if (searchFallbackOpenBtn) searchFallbackOpenBtn.onclick = openAiSearchExternal;
        if (searchNewTabBtn) searchNewTabBtn.onclick = () => activateAiSearchTab(aiHubRuntime.activeSearchTabId);
        if (searchNewTabPlusBtn) searchNewTabPlusBtn.onclick = createAiSearchTab;
        if (searchFrame) bindAiSearchFrameEvents(searchFrame);
        if (googleSectionTab) {
            googleSectionTab.onclick = () => {
                setAiToolSection("google");
                openAiSearchHome(true);
            };
        }
        if (enhancerTab) {
            enhancerTab.onclick = (evt) => {
                if (evt && evt.preventDefault) evt.preventDefault();
                setAiHubMode("search");
                setAiToolSection("enhancer");
            };
        }
        if (videoDownloaderTab) videoDownloaderTab.onclick = () => setAiToolSection("downloader");
        if (videoDownloaderStartBtn) videoDownloaderStartBtn.onclick = startVideoDownloader;
        if (videoDownloaderClearBtn) videoDownloaderClearBtn.onclick = clearVideoDownloader;
        if (videoDownloaderImportBtn) videoDownloaderImportBtn.onclick = importVideoDownloaderOutput;
        if (videoDownloaderChooseFolderBtn) videoDownloaderChooseFolderBtn.onclick = chooseVideoDownloaderOutputFolder;
        updateVideoDownloaderPath();
        setVideoDownloaderImportVisible(false);
        if (videoDownloaderCookies) {
            const savedPrefs = readVideoDownloaderPrefs();
            const savedCookies = savedPrefs && typeof savedPrefs.cookies === "string" ? savedPrefs.cookies : "";
            if (savedCookies && videoDownloaderCookies.querySelector('option[value="' + savedCookies + '"]')) videoDownloaderCookies.value = savedCookies;
            videoDownloaderCookies.onchange = () => {
                try {
                    persistVideoDownloaderPrefs({ cookies: videoDownloaderCookies.value || "none" });
                } catch (err) {}
            };
        }
        if (videoDownloaderInput) {
            videoDownloaderInput.oninput = () => {
                queueVideoDownloaderPreviewUpdate();
                queueVideoDownloaderQualityUpdate();
            };
            videoDownloaderInput.onchange = () => {
                updateVideoDownloaderPreview();
                updateVideoDownloaderQualityOptions();
            };
            videoDownloaderInput.onkeydown = (evt) => {
                if (evt.key !== "Enter") return;
                evt.preventDefault();
                startVideoDownloader();
            };
        }
        if (videoDownloaderRangeStart) {
            videoDownloaderRangeStart.oninput = paintVideoDownloaderTrim;
            videoDownloaderRangeStart.onchange = paintVideoDownloaderTrim;
        }
        if (videoDownloaderRangeEnd) {
            videoDownloaderRangeEnd.oninput = paintVideoDownloaderTrim;
            videoDownloaderRangeEnd.onchange = paintVideoDownloaderTrim;
        }
        if (videoDownloaderTrimStart) videoDownloaderTrimStart.oninput = () => syncVideoDownloaderTrimFromSlider("start");
        if (videoDownloaderTrimEnd) videoDownloaderTrimEnd.oninput = () => syncVideoDownloaderTrimFromSlider("end");
        paintVideoDownloaderTrim();
        if (searchForm) {
            searchForm.onsubmit = (evt) => {
                evt.preventDefault();
                navigateAiSearch(searchInput ? searchInput.value : "", true);
            };
        }
        if (searchHomeForm) {
            searchHomeForm.onsubmit = (evt) => {
                evt.preventDefault();
                navigateAiSearch(searchHomeInput ? searchHomeInput.value : "", true);
            };
        }
        document.querySelectorAll("[data-ai-search-url]").forEach((button) => {
            button.onclick = () => {
                setAiToolSection("google");
                setAiSearchEngine("youtube");
                navigateAiSearch(button.getAttribute("data-ai-search-url") || "", true);
            };
        });
        document.querySelectorAll("[data-ai-search-engine]").forEach((button) => {
            button.onclick = () => {
                setAiToolSection("google");
                const engine = button.getAttribute("data-ai-search-engine") || "youtube";
                setAiSearchEngine(engine);
                if (engine === "youtube") navigateAiSearch(defaultYouTubeSearchQuery, true);
                if (engine === "images") navigateAiSearch("png", true);
                if (engine === "bgremover") openBgRemoverPanel();
            };
        });
        if (settingsBtn) settingsBtn.onclick = () => {
            setAiHubSettingsOpen(false);
            setAiHubMode("search");
        };
        if (backBtn) backBtn.onclick = () => setAiHubSettingsOpen(false);
        if (overlay) {
            overlay.onclick = (evt) => {
                if (evt.target === overlay) closeAiHubModal();
            };
        }
        if (promptInput) {
            promptInput.onkeydown = (evt) => {
                if (evt.key === "Escape") {
                    closeAiHubModal();
                    return;
                }
                if (evt.key === "Enter" && !evt.shiftKey) {
                    evt.preventDefault();
                    setAiHubMode("search");
                    navigateAiSearch(promptInput.value || defaultYouTubeSearchQuery, true);
                }
            };
        }
        if (modelInput) {
            modelInput.oninput = () => {
                aiHubRuntime.modelDraft = aiHubTrim(modelInput.value);
                renderAiHubProviderButtons();
            };
        }
        [apiKeyInput, modelInput].forEach((input) => {
            if (!input) return;
            input.onkeydown = (evt) => {
                if (evt.key === "Escape") {
                    setAiHubSettingsOpen(false);
                    return;
                }
                if (evt.key === "Enter" && saveBtn) saveBtn.click();
            };
        });
        startAiGuestServer();
        ensureAiSearchTabs();
        if (getActiveSearchTab() && (getActiveSearchTab().currentUrl || getActiveSearchTab().url)) loadAiSearchTab(getActiveSearchTab());
        else renderAiSearchTabs();
        syncAiSearchGlobalsFromTab(getActiveSearchTab());
        updateAiSearchNavState();
        setAiHubMode("search");
        setAiToolSection("google");
        setAiSearchAiMode(false);
        setAiSearchEngine("youtube");
        setAiHubPending(false);
    }

    window.keshavAiHub = {
        getActiveProvider: function() {
            return getAiHubProviderConfig("google");
        },
        getProviderConfig: function(providerId) {
            return getAiHubProviderConfig("google");
        },
        send: function(prompt) {
            setAiHubMode("search");
            setAiToolSection("google");
            navigateAiSearch(String(prompt || defaultYouTubeSearchQuery), true);
        }
    };

    function setLiquidGlassButtonsDisabled(disabled) {
        document.querySelectorAll("[data-liquid-shape]").forEach((button) => {
            button.disabled = !!disabled;
        });
        const aepBtn = document.getElementById("btnAppleLiquidAep");
        if (aepBtn) aepBtn.disabled = !!disabled;
    }

    function parseAppleSizeValue(value, fallback) {
        const clean = String(value == null ? "" : value).replace(/[^\d-]/g, "");
        if (clean === "" || clean === "-" || isNaN(parseInt(clean, 10))) return fallback;
        return clamp(parseInt(clean, 10), 20, 2000);
    }

    function syncAppleSizeInput(inputEl, liveEl, nextValue, fallback) {
        if (!inputEl) return;
        const value = parseAppleSizeValue(nextValue, fallback);
        inputEl.value = String(value);
        if (liveEl) {
            const widthValue = parseAppleSizeValue(document.getElementById("appleWidthNumber") && document.getElementById("appleWidthNumber").value, 500);
            const heightValue = parseAppleSizeValue(document.getElementById("appleHeightNumber") && document.getElementById("appleHeightNumber").value, 400);
            liveEl.textContent = "W " + widthValue + " / H " + heightValue;
        }
    }

    function getAppleSizeValues() {
        const widthInput = document.getElementById("appleWidthNumber");
        const heightInput = document.getElementById("appleHeightNumber");
        return {
            width: parseAppleSizeValue(widthInput ? widthInput.value : 500, 500),
            height: parseAppleSizeValue(heightInput ? heightInput.value : 400, 400)
        };
    }

    function bindAppleSizeDrag(inputEl, liveEl, fallback) {
        if (!inputEl || inputEl.__appleSizeDragBound) return;
        inputEl.__appleSizeDragBound = true;

        let dragging = false;
        let startX = 0;
        let startValue = fallback;
        let moved = false;

        function stopDrag() {
            if (!dragging) return;
            dragging = false;
            inputEl.classList.remove("is-dragging");
            if (moved) inputEl.blur();
        }

        inputEl.addEventListener("mousedown", function(evt) {
            if (evt.button !== 0) return;
            dragging = true;
            moved = false;
            startX = evt.clientX;
            startValue = parseAppleSizeValue(inputEl.value, fallback);
            inputEl.classList.add("is-dragging");
        });

        document.addEventListener("mousemove", function(evt) {
            if (!dragging) return;
            const delta = evt.clientX - startX;
            if (Math.abs(delta) < 2) return;
            moved = true;
            const multiplier = evt.shiftKey ? 10 : (evt.altKey ? 1 : 5);
            syncAppleSizeInput(inputEl, liveEl, startValue + Math.round(delta * multiplier), fallback);
            evt.preventDefault();
        });

        document.addEventListener("mouseup", function() {
            stopDrag();
        });
        window.addEventListener("blur", stopDrag);

        inputEl.addEventListener("wheel", function(evt) {
            const step = evt.shiftKey ? 50 : (evt.altKey ? 1 : 10);
            const direction = evt.deltaY > 0 ? -1 : 1;
            syncAppleSizeInput(inputEl, liveEl, parseAppleSizeValue(inputEl.value, fallback) + (direction * step), fallback);
            evt.preventDefault();
        }, { passive: false });
    }

    function buildLiquidGlass(kind) {
        const safeKind = String(kind || "").toLowerCase();
        const label = liquidGlassShapeLabels[safeKind] || "Shape";
        const customSize = getAppleSizeValues();
        setLiquidGlassButtonsDisabled(true);
        document.querySelectorAll("[data-liquid-shape]").forEach((button) => {
            button.classList.toggle("is-active", button.getAttribute("data-liquid-shape") === safeKind);
        });
        setAppleStatus("Applying " + label + " liquid glass effect... " + customSize.width + "x" + customSize.height, false);
        csInterface.evalScript(
            "toolkit.createLiquidGlass('" + escapeScriptString(safeKind) + "', " + customSize.width + ", " + customSize.height + ")",
            function(res) {
                setLiquidGlassButtonsDisabled(false);
                if (!res || res.indexOf("error::") === 0) {
                    setAppleStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Liquid glass could not be created.", true);
                    return;
                }
                setAppleStatus(label + " liquid glass effect is ready.", false);
            }
        );
    }

    function buildLiquidGlassFromAep() {
        let extPath = "";
        try {
            extPath = (csInterface.getSystemPath(SystemPath.EXTENSION) || "").replace(/\\/g, "/");
        } catch (pathError) {}
        if (!extPath) {
            setAppleStatus("Extension folder path could not be found.", true);
            return;
        }
        setLiquidGlassButtonsDisabled(true);
        setAppleStatus("Importing Liquid Glass AEP fallback...", false);
        csInterface.evalScript(
            "toolkit.importLiquidGlassAepFallback('" + escapeScriptString(extPath) + "')",
            function(res) {
                setLiquidGlassButtonsDisabled(false);
                if (!res || res.indexOf("error::") === 0) {
                    setAppleStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Liquid Glass AEP could not be imported.", true);
                    return;
                }
                setAppleStatus("Liquid Glass AEP added. Works on Mac and Windows.", false);
            }
        );
    }

    function runAppleActionTool(label, script) {
        setAppleStatus("Running " + label + "...", false);
        csInterface.evalScript(script, function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setAppleStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : label + " did not run.", true);
                return;
            }
            setAppleStatus(res.indexOf("success::") === 0 ? res.substring(9) : (label + " complete."), false);
        });
    }

    function runCarouselOrbitLayout() {
        const payload = appleActionSettings.carouselMode + "|0";
        setCarouselStatus("Applying Orbit Layout...", false);
        csInterface.evalScript("toolkit.createCarousel('" + escapeScriptString(payload) + "')", function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setCarouselStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Orbit Layout did not run.", true);
                return;
            }
            setCarouselStatus(res.indexOf("success::") === 0 ? res.substring(9) : "Orbit Layout ready.", false);
        });
    }

    const carouselPresetSections = [
        {
            title: "Ring & Depth",
            items: [
                ["ring3d", "3D Ring", "orbit"],
                ["depthFocus", "Depth Focus", "flow"]
            ]
        },
        {
            title: "Carousel Flow",
            items: [
                ["curvedCover", "Curved Cover", "flow"],
                ["verticalTotem", "Vertical Totem", "flow"],
                ["cardTunnel", "Card Tunnel", "3d"]
            ]
        },
        {
            title: "Wall & Scatter",
            items: [
                ["mosaicWall", "Mosaic Wall", "grid"],
                ["isoCascade", "Iso Cascade", "stack"]
            ]
        }
    ];
    const carouselSettings = {
        distance: 420,
        depth: 620,
        rotation: 0,
        scale: 35,
        tilt: 0,
        speed: 0,
        direction: 1,
        floating: 1
    };
    let carouselAeUpdateTimer = null;

    function getCarouselApplyFamily(presetKey, uiFamily) {
        const key = String(presetKey || "");
        if (uiFamily === "3d") return "3d";
        if (/ring3d|cardGlobe|orbitGlobe|isoOrbit|orbitShowcase|orbitBloom|orbitCarousel|vortexSpin/i.test(key)) return "orbit";
        if (/mosaicWall|sphereWall|totemWall|tripleScene|gridZoom|spreadRows|spreadColumns|flipGrid|popGrid|positionDance/i.test(key)) return "grid";
        if (/depthFocus|curvedCover|verticalTotem|cardTotem|filmStrip|coverFlow|carouselFlow|focusSlider/i.test(key)) return "flow";
        return "stack";
    }

    function setCarouselStatus(message, isError) {
        const status = document.getElementById("carouselStatus");
        if (!status) return;
        status.textContent = message || "";
        status.style.color = isError ? "#ff6b6b" : "#8f8f8f";
    }

    function makeCarouselPreviewPoint(presetKey, family, idx, count) {
        const key = String(presetKey || "");
        const mid = (count - 1) / 2;
        const distanceFactor = Math.max(0.08, Math.min(1.85, carouselSettings.distance / 420));
        const depthFactor = Math.max(0.6, Math.min(1.7, carouselSettings.depth / 620));
        const scaleFactor = Math.max(0.55, Math.min(1.65, carouselSettings.scale / 35));
        const direction = carouselSettings.direction < 0 ? -1 : 1;
        const tiltOffset = Math.max(-18, Math.min(18, carouselSettings.tilt * 0.25));
        let x = 0, y = 0, mx = 0, my = 0, rot = 0, rot2 = 0, scale = 0.9, scale2 = 1;
        const angle = ((idx / count) * Math.PI * 2 * direction) + (carouselSettings.rotation * Math.PI / 180);
        if (family === "orbit") {
            const bloom = /bloom|vortex/i.test(key);
            const radius = bloom ? 12 + ((idx + 1) / count) * 30 : 34;
            const oval = /ring3d/i.test(key) ? 0.42 : (/iso|photo/i.test(key) ? 0.34 : (/globe/i.test(key) ? 0.72 : 0.54));
            x = Math.cos(angle) * radius * distanceFactor;
            y = (Math.sin(angle) * radius * oval * distanceFactor) + tiltOffset;
            mx = Math.cos(angle + 1.1) * 7 * depthFactor;
            my = Math.sin(angle + 1.1) * 4 * depthFactor;
            rot = -angle * 57.2958 + tiltOffset;
            rot2 = rot - 35;
            scale = 0.72 + ((Math.sin(angle) + 1) * 0.13);
            scale2 = scale + 0.12;
        } else if (family === "grid") {
            let cols = Math.ceil(Math.sqrt(count));
            if (/rows/i.test(key)) cols = count;
            if (/columns/i.test(key)) cols = Math.max(1, Math.ceil(count / 3));
            if (/tripleScene/i.test(key)) cols = 3;
            if (/mosaicWall/i.test(key)) cols = 3;
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            const rows = Math.ceil(count / cols);
            x = (col - (cols - 1) / 2) * 37 * distanceFactor;
            y = ((row - (rows - 1) / 2) * 26 * distanceFactor) + tiltOffset;
            if (/sphereWall|totemWall/i.test(key)) {
                y = ((row - (rows - 1) / 2) * 30 * distanceFactor) + tiltOffset;
                rot = (col - (cols - 1) / 2) * -6;
                scale = 0.82 + row * 0.08;
            }
            if (/mosaicWall/i.test(key)) {
                x = (col - 1) * 31 * distanceFactor;
                y = (row - 0.5) * 24 * distanceFactor + tiltOffset;
                rot = (col - 1) * -4;
                scale = idx === 2 ? 1.08 : 0.9;
            }
            if (/gridZoom|popGrid/i.test(key)) scale = idx === 2 ? 1.12 : 0.86;
            if (/dance/i.test(key)) { mx = Math.sin(idx * 1.7) * 10; my = Math.cos(idx * 1.3) * 8; }
            scale2 = scale + 0.08;
        } else if (family === "flow") {
            if (/depthFocus/i.test(key)) {
                x = (idx - mid) * 26 * distanceFactor;
                y = Math.sin(idx) * 3 + tiltOffset;
                mx = idx < mid ? 9 : -9;
                rot = (idx - mid) * -6;
                rot2 = rot;
                scale = 1 - Math.min(Math.abs(idx - mid) * 0.16, 0.42);
                scale2 = scale + 0.04;
            } else if (/curvedCover/i.test(key)) {
                x = (idx - mid) * 26 * distanceFactor;
                y = Math.sin(idx * 0.9) * 5 + tiltOffset;
                mx = idx < mid ? 8 : -8;
                rot = (idx - mid) * -12;
                rot2 = rot * 0.5;
                scale = 1 - Math.min(Math.abs(idx - mid) * 0.11, 0.32);
                scale2 = scale + 0.07;
            } else if (/totem|verticalTotem/i.test(key)) {
                x = 0;
                y = (idx - mid) * 14;
                scale = 0.66 + idx * 0.1;
                scale2 = scale + 0.1;
            } else {
                x = (idx - mid) * 31 * distanceFactor;
                y = /focusSlider/i.test(key) ? 0 : Math.sin(idx * 0.8) * 5;
                mx = idx < mid ? 7 : (idx > mid ? -7 : 0);
                my = idx === Math.floor(mid) ? 5 : -2;
                rot = (idx - mid) * -8;
                rot2 = rot * 0.45;
                scale = 1 - Math.min(Math.abs(idx - mid) * 0.12, 0.34);
                scale2 = scale + 0.09;
            }
        } else {
            if (/tunnel/i.test(key)) {
                x = (idx - mid) * 19 * distanceFactor;
                y = (idx - mid) * 12 * distanceFactor + tiltOffset;
                scale = 0.55 + idx * 0.13;
            } else if (/isoCascade/i.test(key)) {
                x = (idx - mid) * 18 * distanceFactor;
                y = (idx - mid) * -10 * distanceFactor + tiltOffset;
                mx = 5;
                my = -5;
                rot = (idx - mid) * -7;
                rot2 = rot + 9;
                scale = 0.62 + idx * 0.11;
            } else if (/cascade|trail/i.test(key)) {
                x = (idx - mid) * 22 * distanceFactor;
                y = (idx - mid) * 15 * distanceFactor + idx * 3 + tiltOffset;
                mx = Math.sin(idx * 0.73) * 4;
                my = -3 + Math.cos(idx * 0.73) * 2;
                rot = (idx - mid) * 5;
                rot2 = rot + 4;
                scale = 0.68 + idx * 0.08;
            } else if (/cluster/i.test(key)) {
                const burst = angle + 0.5;
                x = Math.cos(burst) * (24 + idx * 7) * distanceFactor;
                y = Math.sin(burst) * (17 + idx * 5) * distanceFactor + tiltOffset;
                mx = -Math.cos(burst) * 12;
                my = -Math.sin(burst) * 9;
                rot = idx * 9 - 18;
                rot2 = -rot;
                scale = 0.74 + (idx % 3) * 0.1;
            } else {
                x = (idx - mid) * 19 * distanceFactor;
                y = (idx - mid) * -12 * distanceFactor + tiltOffset;
                mx = 4;
                my = -5;
                rot = (idx - mid) * 5;
                rot2 = rot + 7;
                scale = 0.68 + idx * 0.1;
            }
            scale2 = scale + 0.1;
        }
        return { x: x, y: y, mx: mx, my: my, r: rot, r2: rot2, s: scale * scaleFactor, s2: scale2 * scaleFactor };
    }

    function makeCarouselPreviewHtml(presetKey, family) {
        const applyFamily = getCarouselApplyFamily(presetKey, family);
        const count = 5;
        let html = "";
        for (let i = 0; i < count; i++) {
            const p = makeCarouselPreviewPoint(presetKey, applyFamily === "3d" ? familyFor3dPreview(presetKey) : applyFamily, i, count);
            html += "<span class=\"carousel-mini\" style=\"--x:" + Math.round(p.x) + "px;--y:" + Math.round(p.y) + "px;--mx:" + Math.round(p.mx) + "px;--my:" + Math.round(p.my) + "px;--r:" + Math.round(p.r) + "deg;--r2:" + Math.round(p.r2) + "deg;--s:" + p.s.toFixed(2) + ";--s2:" + p.s2.toFixed(2) + ";\"></span>";
        }
        return html;
    }

    function familyFor3dPreview(presetKey) {
        const key = String(presetKey || "");
        if (/globe/i.test(key)) return "orbit";
        if (/sphere|totem/i.test(key)) return "grid";
        return "stack";
    }

    function renderCarouselPresets() {
        const grid = document.getElementById("carouselPresetGrid");
        if (!grid) return;
        grid.__kwvCarouselRendered = true;
        let html = "<button class=\"carousel-preset-card\" type=\"button\" data-carousel-preset=\"orbitLayout\" data-carousel-orbit-layout=\"true\" data-carousel-family=\"orbit\" data-preview=\"orbit\"><div class=\"carousel-preview\">" + makeCarouselPreviewHtml("orbitCarousel", "orbit") + "</div><span class=\"carousel-label\">Orbit Layout</span></button>";
        carouselPresetSections.forEach(function(section) {
            html += "<div class=\"carousel-section-title\" data-carousel-section-title>" + section.title + "</div>";
            section.items.forEach(function(item) {
                const applyFamily = getCarouselApplyFamily(item[0], item[2]);
                const previewFamily = applyFamily === "3d" ? familyFor3dPreview(item[0]) : applyFamily;
                html += "<button class=\"carousel-preset-card\" type=\"button\" data-carousel-preset=\"" + item[0] + "\" data-carousel-label=\"" + item[1] + "\" data-carousel-family=\"" + item[2] + "\" data-preview=\"" + previewFamily + "\"><div class=\"carousel-preview\">" + makeCarouselPreviewHtml(item[0], item[2]) + "</div><span class=\"carousel-label\">" + item[1] + "</span></button>";
            });
        });
        grid.innerHTML = html;
    }

    function getCarouselSettingsPayload() {
        return {
            distance: carouselSettings.distance,
            depth: carouselSettings.depth,
            rotation: carouselSettings.rotation,
            scale: carouselSettings.scale,
            tilt: carouselSettings.tilt,
            speed: carouselSettings.speed,
            direction: carouselSettings.direction,
            floating: carouselSettings.floating
        };
    }

    function syncCarouselSettingInputs() {
        document.querySelectorAll("[data-carousel-setting]").forEach(function(input) {
            const key = input.getAttribute("data-carousel-setting");
            if (!Object.prototype.hasOwnProperty.call(carouselSettings, key)) return;
            const value = input.type === "checkbox" ? (input.checked ? 1 : 0) : parseFloat(input.value);
            if (isFinite(value)) carouselSettings[key] = value;
            const live = document.querySelector("[data-carousel-value=\"" + key + "\"]");
            if (live) live.textContent = key === "floating" ? (carouselSettings[key] > 0 ? "On" : "Off") : String(carouselSettings[key]);
        });
    }

    function refreshCarouselPreviewMath() {
        const activeFilter = document.querySelector("[data-carousel-filter].active");
        const filter = activeFilter ? activeFilter.getAttribute("data-carousel-filter") : "all";
        renderCarouselPresets();
        filterCarouselPresets(filter);
    }

    function scheduleCarouselAeSettingsUpdate() {
        window.clearTimeout(carouselAeUpdateTimer);
        carouselAeUpdateTimer = window.setTimeout(function() {
            const settingsJson = JSON.stringify(getCarouselSettingsPayload());
            csInterface.evalScript("toolkit.updateCarouselControl('" + escapeScriptString(settingsJson) + "')", function(res) {
                if (res && res.indexOf("success::") === 0) setCarouselStatus(res.substring(9), false);
            });
        }, 90);
    }

    function filterCarouselPresets(filter) {
        const safeFilter = String(filter || "all");
        document.querySelectorAll("[data-carousel-filter]").forEach(function(button) {
            button.classList.toggle("active", button.getAttribute("data-carousel-filter") === safeFilter);
        });
        const cards = Array.prototype.slice.call(document.querySelectorAll("[data-carousel-preset]"));
        cards.forEach(function(card) {
            const family = card.getAttribute("data-carousel-family") || "";
            card.classList.toggle("is-filter-hidden", safeFilter !== "all" && family !== safeFilter);
        });
        document.querySelectorAll("[data-carousel-section-title]").forEach(function(title) {
            let node = title.nextElementSibling;
            let visible = false;
            while (node && !node.hasAttribute("data-carousel-section-title")) {
                if (node.matches && node.matches("[data-carousel-preset]") && !node.classList.contains("is-filter-hidden")) {
                    visible = true;
                    break;
                }
                node = node.nextElementSibling;
            }
            title.classList.toggle("is-hidden", !visible);
        });
    }

    function runCarouselPreset(presetKey, label) {
        if (!presetKey) return;
        document.querySelectorAll("[data-carousel-preset]").forEach(function(button) {
            button.classList.toggle("is-active", button.getAttribute("data-carousel-preset") === presetKey);
        });
        setCarouselStatus("Applying " + (label || "Carousel") + "...", false);
        const settingsJson = JSON.stringify(getCarouselSettingsPayload());
        csInterface.evalScript("toolkit.applyCarouselPreset('" + escapeScriptString(presetKey) + "', '" + escapeScriptString(settingsJson) + "')", function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setCarouselStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Carousel preset did not run.", true);
                return;
            }
            setCarouselStatus(res.indexOf("success::") === 0 ? res.substring(9) : ((label || "Carousel") + " ready."), false);
        });
    }

    function initCarouselStudio() {
        renderCarouselPresets();
        const grid = document.getElementById("carouselPresetGrid");
        if (!grid || grid.__kwvCarouselBound) return;
        grid.__kwvCarouselBound = true;
        grid.addEventListener("click", function(evt) {
            const orbitLayout = evt.target && evt.target.closest ? evt.target.closest("[data-carousel-orbit-layout]") : null;
            if (orbitLayout) {
                evt.preventDefault();
                document.querySelectorAll("[data-carousel-preset]").forEach(function(button) {
                    button.classList.remove("is-active");
                });
                orbitLayout.classList.add("is-active");
                runCarouselOrbitLayout();
                return;
            }
            const button = evt.target && evt.target.closest ? evt.target.closest("[data-carousel-preset]") : null;
            if (!button) return;
            evt.preventDefault();
            runCarouselPreset(button.getAttribute("data-carousel-preset"), button.getAttribute("data-carousel-label"));
        });
        const filters = document.getElementById("carouselFilterRow");
        if (filters && !filters.__kwvCarouselBound) {
            filters.__kwvCarouselBound = true;
            filters.addEventListener("click", function(evt) {
                const button = evt.target && evt.target.closest ? evt.target.closest("[data-carousel-filter]") : null;
                if (!button) return;
                evt.preventDefault();
                filterCarouselPresets(button.getAttribute("data-carousel-filter"));
            });
        }
        const controls = document.getElementById("carouselControlPanel");
        if (controls && !controls.__kwvCarouselBound) {
            controls.__kwvCarouselBound = true;
            const handleCarouselControlInput = function(evt) {
                const input = evt.target && evt.target.matches ? evt.target : null;
                if (!input || !input.matches("[data-carousel-setting]")) return;
                syncCarouselSettingInputs();
                refreshCarouselPreviewMath();
                scheduleCarouselAeSettingsUpdate();
            };
            controls.addEventListener("input", handleCarouselControlInput);
            controls.addEventListener("change", handleCarouselControlInput);
            syncCarouselSettingInputs();
        }
        filterCarouselPresets("all");
    }

    function runAppleExtrusion() {
        runAppleActionTool("3D Extruder", "toolkit.createExtrusion('" + escapeScriptString(String(appleActionSettings.extrusionDepth)) + "')");
    }

    function runAppleNumberCounter() {
        const payload = [
            appleActionSettings.numberFormat,
            appleActionSettings.numberPrefix,
            appleActionSettings.numberSuffix
        ].join("|");
        runAppleActionTool("Value Counter", "toolkit.createNumberCounter('" + escapeScriptString(payload) + "')");
    }

    function getBundledFfmpegPath() {
        const extPath = (csInterface.getSystemPath(SystemPath.EXTENSION) || "").replace(/\\/g, "/");
        const executable = (typeof process !== "undefined" && process.platform === "win32") ? "ffmpeg.exe" : "ffmpeg";
        return extPath + "/bin/ffmpeg/" + executable;
    }

    function getBundledFfprobePath() {
        const extPath = (csInterface.getSystemPath(SystemPath.EXTENSION) || "").replace(/\\/g, "/");
        const executable = (typeof process !== "undefined" && process.platform === "win32") ? "ffprobe.exe" : "ffprobe";
        return extPath + "/bin/ffmpeg/" + executable;
    }

    function fileExistsCep(filePath) {
        try {
            if (!(window.cep && window.cep.fs)) return false;
            const stat = window.cep.fs.stat(filePath);
            return !!stat && stat.err === 0;
        } catch (error) {
            return false;
        }
    }

    function getFfmpegExecutable() {
        const bundled = getBundledFfmpegPath();
        return fileExistsCep(bundled) ? bundled : "ffmpeg";
    }

    function getFfprobeExecutable() {
        const bundled = getBundledFfprobePath();
        return fileExistsCep(bundled) ? bundled : "ffprobe";
    }

    function normalizeSilenceNoise(value) {
        const raw = String(value || "").trim();
        if (!raw) return "-35dB";
        if (/^-?\d+(\.\d+)?dB$/i.test(raw)) return raw;
        const numeric = parseFloat(raw);
        return isFinite(numeric) ? numeric + "dB" : "-35dB";
    }

    function normalizeSilenceDuration(value) {
        const numeric = parseFloat(String(value || "").trim());
        if (!isFinite(numeric)) return 0.4;
        return Math.max(0.05, Math.min(20, numeric));
    }

    function parseSilenceDetectLog(logText, sourceMeta, noise, duration) {
        const safeMeta = sourceMeta || {};
        const lines = String(logText || "").split(/\r?\n/);
        const silences = [];
        let openStart = null;
        lines.forEach((line) => {
            const startMatch = line.match(/silence_start:\s*([0-9.]+)/i);
            if (startMatch) openStart = parseFloat(startMatch[1]);
            const endMatch = line.match(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/i);
            if (endMatch) {
                const end = parseFloat(endMatch[1]);
                const detectedDuration = parseFloat(endMatch[2]);
                const start = openStart != null ? openStart : (end - detectedDuration);
                silences.push({
                    start: Number(start.toFixed(3)),
                    end: Number(end.toFixed(3)),
                    duration: Number((end - start).toFixed(3))
                });
                openStart = null;
            }
        });
        return {
            sourcePath: safeMeta.path || "",
            layer: {
                name: safeMeta.layerName || "",
                index: safeMeta.layerIndex || 0,
                inPoint: safeMeta.inPoint || 0,
                outPoint: safeMeta.outPoint || 0,
                startTime: safeMeta.startTime || 0
            },
            ffmpeg: getFfmpegExecutable(),
            filter: {
                noise: noise,
                duration: duration
            },
            count: silences.length,
            silences: silences
        };
    }

    function setSilenceDetectBusy(isBusy) {
        const btn = document.getElementById("btnAppleSilenceDetect");
        if (!btn) return;
        btn.disabled = !!isBusy;
        btn.classList.toggle("disabled", !!isBusy);
    }

    let silenceProcessingTimer = null;
    let silenceProcessingStartedAt = 0;

    function setSilenceProcessingStatus(label, isActive) {
        const shell = document.getElementById("silenceProcessingStatus");
        const labelEl = document.getElementById("silenceProcessingLabel");
        const timeEl = document.getElementById("silenceProcessingTime");
        if (!shell || !labelEl || !timeEl) return;
        if (label) labelEl.textContent = label;
        shell.classList.toggle("active", !!isActive);
        if (!isActive) return;
        const elapsed = Math.max(0, (Date.now() - silenceProcessingStartedAt) / 1000);
        timeEl.textContent = elapsed.toFixed(1) + "s";
    }

    function startSilenceProcessingTimer(label) {
        stopSilenceProcessingTimer(false);
        silenceProcessingStartedAt = Date.now();
        setSilenceProcessingStatus(label || "Processing", true);
        silenceProcessingTimer = setInterval(function() {
            setSilenceProcessingStatus(null, true);
        }, 100);
    }

    function stopSilenceProcessingTimer(hide) {
        if (silenceProcessingTimer) {
            clearInterval(silenceProcessingTimer);
            silenceProcessingTimer = null;
        }
        if (hide) setSilenceProcessingStatus(null, false);
    }

    function runFfmpegSilenceDetect(sourceMeta, noise, duration) {
        const sourcePath = sourceMeta && sourceMeta.path ? String(sourceMeta.path) : "";
        if (typeof require !== "function") {
            setAppleStatus("Node.js CEP is not enabled. Reload the extension.", true);
            setSilenceDetectBusy(false);
            stopSilenceProcessingTimer(true);
            return;
        }
        let childProcess;
        try {
            childProcess = require("child_process");
        } catch (requireError) {
            setAppleStatus("Node child_process is unavailable. Check CEP Node.", true);
            setSilenceDetectBusy(false);
            stopSilenceProcessingTimer(true);
            return;
        }
        const ffmpegPath = getFfmpegExecutable();
        const args = [
            "-hide_banner",
            "-nostats",
            "-i", sourcePath,
            "-af", "silencedetect=noise=" + noise + ":d=" + duration,
            "-f", "null",
            "-"
        ];
        childProcess.execFile(ffmpegPath, args, { windowsHide: true, maxBuffer: 1024 * 1024 * 8 }, function(error, stdout, stderr) {
            setSilenceDetectBusy(false);
            const log = String(stderr || "") + "\n" + String(stdout || "");
            if (error && !/silence_(start|end)/i.test(log)) {
                const hint = ffmpegPath === "ffmpeg" ? " Add `bin/ffmpeg/ffmpeg.exe` or install FFmpeg in PATH." : "";
                setAppleStatus("FFmpeg run failed." + hint, true);
                stopSilenceProcessingTimer(true);
                return;
            }
            const jsonData = parseSilenceDetectLog(log, sourceMeta, noise, duration);
            if (!jsonData.count) {
                setAppleStatus("Silence Detect ready: 0 segment found. Auto cut skipped.", false);
                stopSilenceProcessingTimer(false);
                return;
            }
            setSilenceProcessingStatus("Cutting timeline", true);
            setAppleStatus("Silence found. Auto cutting selected layer...", false);
            csInterface.evalScript("toolkit.autoCutSelectedLayerSilence('" + escapeScriptString(JSON.stringify(jsonData)) + "')", function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setAppleStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Auto cut failed.", true);
                    stopSilenceProcessingTimer(true);
                    return;
                }
                stopSilenceProcessingTimer(false);
                setAppleStatus(res.indexOf("success::") === 0 ? res.substring(9) : ("Silence Detect ready: " + jsonData.count + " segment(s) found."), false);
            });
        });
    }

    function detectAppleSilence() {
        const noiseInput = document.getElementById("silenceNoiseInput");
        const durationInput = document.getElementById("silenceDurationInput");
        const noise = normalizeSilenceNoise(noiseInput ? noiseInput.value : "-35dB");
        const duration = normalizeSilenceDuration(durationInput ? durationInput.value : "0.4");
        if (noiseInput) noiseInput.value = noise;
        if (durationInput) durationInput.value = String(duration);
        setSilenceDetectBusy(true);
        startSilenceProcessingTimer("Reading source");
        setAppleStatus("Reading the selected layer source path...", false);
        csInterface.evalScript("toolkit.getSelectedMediaSourcePath()", function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setSilenceDetectBusy(false);
                stopSilenceProcessingTimer(true);
                setAppleStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Selected media source path was not found.", true);
                return;
            }
            let data = null;
            try {
                data = JSON.parse(res.indexOf("success::") === 0 ? res.substring(9) : res);
            } catch (parseError) {}
            const sourcePath = data && data.path ? String(data.path) : "";
            if (!sourcePath) {
                setSilenceDetectBusy(false);
                stopSilenceProcessingTimer(true);
                setAppleStatus("Selected audio/video layer file path was not found.", true);
                return;
            }
            setSilenceProcessingStatus("Detecting silence", true);
            setAppleStatus("FFmpeg silencedetect running offline...", false);
            runFfmpegSilenceDetect(data, noise, duration);
        });
    }

    const audioCleanerState = {
        sourcePath: "",
        sourceName: "",
        outputPath: "",
        outputName: "",
        outputFolder: "",
        musicPath: "",
        musicName: "",
        vocalPath: "",
        vocalName: "",
        busy: false,
        pickerOpen: false,
        progressTimer: null,
        lastProgress: 0
    };
    const silenceDetectState = {
        outputFolder: ""
    };
    const silenceDetectFolderStorageKey = "keshavwithvelo.silenceDetect.outputFolder.v1";
    const audioCleanerFolderStorageKey = "keshavwithvelo.audioCleaner.outputFolder.v1";
    const audioPreviewState = {
        audio: null,
        button: null,
        key: "",
        context: null,
        source: null,
        analyser: null,
        canvas: null,
        frame: null
    };

    function audioCleanerBasename(filePath) {
        return String(filePath || "").replace(/\\/g, "/").split("/").pop() || "";
    }

    function audioCleanerSafeName(name) {
        return String(name || "audio").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "").substring(0, 42) || "audio";
    }

    function getDefaultAppleOutputFolder(subfolder) {
        try {
            const path = require("path");
            const os = require("os");
            return path.join(os.homedir(), "Downloads", subfolder);
        } catch (error) {
            try {
                const docs = csInterface.getSystemPath(SystemPath.MY_DOCUMENTS) || "";
                return docs ? docs.replace(/\\/g, "/") + "/" + subfolder : "";
            } catch (fallbackError) {
                return "";
            }
        }
    }

    function getAppleToolOutputFolder(state, storageKey, defaultSubfolder) {
        if (state.outputFolder) return state.outputFolder;
        let saved = "";
        try {
            saved = localStorage.getItem(storageKey) || "";
        } catch (error) {}
        state.outputFolder = saved || getDefaultAppleOutputFolder(defaultSubfolder);
        return state.outputFolder;
    }

    function updateAppleToolFolderLabel(state, storageKey, defaultSubfolder, labelId) {
        const folder = getAppleToolOutputFolder(state, storageKey, defaultSubfolder);
        const display = normalizeVideoConverterPath(folder || "Choose output folder");
        const label = document.getElementById(labelId);
        if (label) {
            label.textContent = display;
            label.title = display;
        }
        const buttonId = {
            silenceFolderPath: "btnSilenceChooseFolder",
            audioCleanerFolderPath: "btnAudioCleanerChooseFolder",
            mp3ConverterFolderPath: "btnMp3ConverterChooseFolder"
        }[labelId];
        const button = buttonId ? document.getElementById(buttonId) : null;
        if (button) button.title = "Folder: " + display;
    }

    function saveAppleToolOutputFolder(state, storageKey, defaultSubfolder, labelId, folderPath) {
        const safePath = String(folderPath || "").trim();
        if (!safePath) return false;
        state.outputFolder = safePath;
        try {
            localStorage.setItem(storageKey, safePath);
        } catch (error) {}
        updateAppleToolFolderLabel(state, storageKey, defaultSubfolder, labelId);
        return true;
    }

    function openAppleFolderDialog(title, currentFolder, callback) {
        const platform = (typeof process !== "undefined" && process.platform) ? process.platform : "";
        if (platform === "win32") {
            selectVideoConverterFolderNative(title, callback);
            return;
        }
        if (window.cep && window.cep.fs && window.cep.fs.showOpenDialog) {
            try {
                const result = window.cep.fs.showOpenDialog(false, true, title || "Choose Folder", currentFolder || "", []);
                const folder = result && result.data && result.data[0] ? normalizeVideoConverterPath(String(result.data[0])) : "";
                if (folder) {
                    callback(folder);
                    return;
                }
            } catch (dialogError) {}
        }
        selectVideoConverterFolderNative(title, callback);
    }

    function chooseAppleToolOutputFolder(state, storageKey, defaultSubfolder, labelId, title, savedMessage) {
        openAppleFolderDialog(title, getAppleToolOutputFolder(state, storageKey, defaultSubfolder), function(folder) {
            if (!folder) return;
            if (!ensureVideoConverterFolder(folder)) {
                setAppleStatus("Selected output folder cannot be used.", true);
                return;
            }
            saveAppleToolOutputFolder(state, storageKey, defaultSubfolder, labelId, folder);
            setAppleStatus(savedMessage, false);
        });
    }

    function getAudioCleanerOutputFolder() {
        return getAppleToolOutputFolder(audioCleanerState, audioCleanerFolderStorageKey, "Keshav Velo Audio Cleaner");
    }

    function updateAudioCleanerFolderLabel() {
        updateAppleToolFolderLabel(audioCleanerState, audioCleanerFolderStorageKey, "Keshav Velo Audio Cleaner", "audioCleanerFolderPath");
    }

    function chooseAudioCleanerOutputFolder() {
        chooseAppleToolOutputFolder(audioCleanerState, audioCleanerFolderStorageKey, "Keshav Velo Audio Cleaner", "audioCleanerFolderPath", "Choose Audio Cleaner Output Folder", "Audio Cleaner folder saved.");
    }

    function updateSilenceFolderLabel() {
        updateAppleToolFolderLabel(silenceDetectState, silenceDetectFolderStorageKey, "Keshav Velo Silence Detect", "silenceFolderPath");
    }

    function chooseSilenceOutputFolder() {
        chooseAppleToolOutputFolder(silenceDetectState, silenceDetectFolderStorageKey, "Keshav Velo Silence Detect", "silenceFolderPath", "Choose Silence Detect Folder", "Silence Detect folder saved.");
    }

    function setAudioCleanerProgress(percent, label) {
        let safePercent = Math.max(0, Math.min(100, Math.round(percent || 0)));
        if (audioCleanerState.busy && safePercent < 100) {
            safePercent = Math.max(audioCleanerState.lastProgress || 0, safePercent);
        }
        audioCleanerState.lastProgress = safePercent;
        const bar = document.getElementById("audioCleanerProgressBar");
        const value = document.getElementById("audioCleanerProgressValue");
        const labelEl = document.getElementById("audioCleanerProgressLabel");
        if (bar) bar.style.width = safePercent + "%";
        if (value) value.textContent = safePercent + "%";
        if (labelEl && label) labelEl.textContent = label;
    }

    function setAudioCleanerBusy(isBusy) {
        audioCleanerState.busy = !!isBusy;
        if (isBusy) audioCleanerState.lastProgress = 0;
        ["btnAudioNoiseRemove", "btnAudioVocalRemove", "btnAudioCleanerSelect", "btnAudioCleanerChooseFolder", "btnAudioCleanerImportMusic", "btnAudioCleanerDeleteMusic", "btnAudioCleanerImportVocal", "btnAudioCleanerDeleteVocal", "btnAudioCleanerPlayMusic", "btnAudioCleanerPlayVocal"].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.disabled = !!isBusy;
            el.classList.toggle("disabled", !!isBusy);
        });
    }

    function clearAudioCleanerTimer() {
        if (audioCleanerState.progressTimer) {
            window.clearInterval(audioCleanerState.progressTimer);
            audioCleanerState.progressTimer = null;
        }
    }

    function filePathToAudioUrl(filePath) {
        const normalized = String(filePath || "").replace(/\\/g, "/");
        if (!normalized) return "";
        if (/^file:\/\//i.test(normalized)) return normalized;
        return "file:///" + normalized.split("/").map((part, index) => {
            if (index === 0 && /^[a-zA-Z]:$/.test(part)) return part;
            return encodeURIComponent(part);
        }).join("/");
    }

    function resetAudioPreviewButton(button) {
        if (!button) return;
        button.textContent = "PLAY";
        button.classList.remove("playing");
    }

    function getAudioWaveColor(canvas) {
        const accent = getComputedStyle(document.body).getPropertyValue("--kwv-accent").trim() || "#ff0000";
        const wave = canvas && canvas.parentElement;
        if (wave && wave.classList.contains("vocal")) return "rgba(235,235,235,0.82)";
        return accent;
    }

    function prepareWaveCanvas(canvas) {
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor((rect.width || 120) * ratio));
        const height = Math.max(1, Math.floor((rect.height || 20) * ratio));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.clearRect(0, 0, width, height);
        return { ctx, width, height, ratio };
    }

    function drawSmoothWavePath(ctx, points, width, centerY, scaleY) {
        if (!points.length) return;
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const x = (i / (points.length - 1)) * width;
            const y = centerY + points[i] * scaleY;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                const prevX = ((i - 1) / (points.length - 1)) * width;
                const prevY = centerY + points[i - 1] * scaleY;
                ctx.quadraticCurveTo(prevX + ((x - prevX) / 2), prevY, x, y);
            }
        }
    }

    function drawIdleAudioWave(canvas) {
        const prepared = prepareWaveCanvas(canvas);
        if (!prepared) return;
        const { ctx, width, height, ratio } = prepared;
        const color = getAudioWaveColor(canvas);
        const centerY = height / 2;
        const points = [];
        const count = 34;
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const envelope = Math.sin(Math.PI * t);
            const wave = Math.sin(t * Math.PI * 7.2) * 0.46 + Math.sin(t * Math.PI * 15.5) * 0.18;
            points.push(wave * envelope);
        }

        ctx.strokeStyle = "rgba(255,255,255,0.075)";
        ctx.lineWidth = Math.max(1, ratio);
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        ctx.strokeStyle = color;
        ctx.globalAlpha = canvas.parentElement && canvas.parentElement.classList.contains("vocal") ? 0.48 : 0.72;
        ctx.lineWidth = Math.max(1.6, ratio * 1.45);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = color;
        ctx.shadowBlur = 4 * ratio;
        drawSmoothWavePath(ctx, points, width, centerY, height * 0.30);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    function drawOutputIdleWaveByButton(button) {
        const row = button && button.closest ? button.closest(".audio-cleaner-output-row") : null;
        const canvas = row ? row.querySelector(".audio-cleaner-wave-canvas") : null;
        drawIdleAudioWave(canvas);
    }

    function drawAudioPreviewWave() {
        const analyser = audioPreviewState.analyser;
        const canvas = audioPreviewState.canvas;
        if (!analyser || !canvas) return;
        const prepared = prepareWaveCanvas(canvas);
        if (!prepared) return;
        const { ctx, width, height, ratio } = prepared;
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        const centerY = height / 2;
        const points = [];
        const samples = 42;
        for (let i = 0; i < samples; i++) {
            const idx = Math.floor((i / (samples - 1)) * (data.length - 1));
            points.push((data[idx] - 128) / 128);
        }

        ctx.lineWidth = Math.max(1, ratio);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        const color = getAudioWaveColor(canvas);
        ctx.fillStyle = color;
        ctx.globalAlpha = canvas.parentElement && canvas.parentElement.classList.contains("vocal") ? 0.22 : 0.28;
        drawSmoothWavePath(ctx, points, width, centerY, height * 0.40);
        for (let i = points.length - 1; i >= 0; i--) {
            const x = (i / (points.length - 1)) * width;
            const y = centerY - points[i] * (height * 0.40);
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.lineWidth = Math.max(1.8, ratio * 1.55);
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5 * ratio;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        drawSmoothWavePath(ctx, points, width, centerY, height * 0.40);
        ctx.stroke();
        ctx.shadowBlur = 0;
        audioPreviewState.frame = window.requestAnimationFrame(drawAudioPreviewWave);
    }

    function startAudioPreviewWave(audio, button) {
        const row = button && button.closest ? button.closest(".audio-cleaner-output-row") : null;
        const canvas = row ? row.querySelector(".audio-cleaner-wave-canvas") : null;
        const wave = canvas ? canvas.parentElement : null;
        if (!canvas || !window.AudioContext && !window.webkitAudioContext) return;
        try {
            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContextCtor();
            const source = context.createMediaElementSource(audio);
            const analyser = context.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.72;
            source.connect(analyser);
            analyser.connect(context.destination);
            audioPreviewState.context = context;
            audioPreviewState.source = source;
            audioPreviewState.analyser = analyser;
            audioPreviewState.canvas = canvas;
            if (wave) wave.classList.add("playing");
            drawAudioPreviewWave();
        } catch (error) {}
    }

    function stopAudioPreviewWave() {
        if (audioPreviewState.frame) {
            window.cancelAnimationFrame(audioPreviewState.frame);
            audioPreviewState.frame = null;
        }
        if (audioPreviewState.canvas && audioPreviewState.canvas.parentElement) {
            audioPreviewState.canvas.parentElement.classList.remove("playing");
            drawIdleAudioWave(audioPreviewState.canvas);
        }
        try { if (audioPreviewState.source) audioPreviewState.source.disconnect(); } catch (error) {}
        try { if (audioPreviewState.analyser) audioPreviewState.analyser.disconnect(); } catch (error) {}
        try { if (audioPreviewState.context) audioPreviewState.context.close(); } catch (error) {}
        audioPreviewState.context = null;
        audioPreviewState.source = null;
        audioPreviewState.analyser = null;
        audioPreviewState.canvas = null;
    }

    function stopAudioPreview() {
        stopAudioPreviewWave();
        if (audioPreviewState.audio) {
            try {
                audioPreviewState.audio.pause();
                audioPreviewState.audio.src = "";
            } catch (error) {}
        }
        resetAudioPreviewButton(audioPreviewState.button);
        audioPreviewState.audio = null;
        audioPreviewState.button = null;
        audioPreviewState.key = "";
    }

    function playAudioPreview(key, filePath, button) {
        if (!filePath) {
            setAppleStatus("Preview file is not ready.", true);
            return;
        }
        if (audioPreviewState.key === key) {
            stopAudioPreview();
            return;
        }
        stopAudioPreview();
        const audio = new Audio(filePathToAudioUrl(filePath));
        audioPreviewState.audio = audio;
        audioPreviewState.button = button || null;
        audioPreviewState.key = key;
        if (button) {
            button.textContent = "STOP";
            button.classList.add("playing");
        }
        audio.onended = stopAudioPreview;
        audio.onerror = function() {
            stopAudioPreview();
            setAppleStatus("Audio preview play nahi hua. File ko import karke check karo.", true);
        };
        const playResult = audio.play();
        startAudioPreviewWave(audio, button);
        if (playResult && playResult.catch) {
            playResult.catch(function() {
                stopAudioPreview();
                setAppleStatus("Audio preview blocked. Dobara PLAY dabao.", true);
            });
        }
    }

    function startAudioCleanerSmoothProgress(label) {
        clearAudioCleanerTimer();
        let percent = 4;
        setAudioCleanerProgress(percent, label);
        audioCleanerState.progressTimer = window.setInterval(() => {
            if (!audioCleanerState.busy) return;
            percent = Math.min(93, percent + Math.max(1, Math.round((94 - percent) * 0.08)));
            setAudioCleanerProgress(percent, label);
        }, 450);
    }

    function setAudioCleanerSource(filePath) {
        const safePath = String(filePath || "");
        const name = audioCleanerBasename(safePath);
        if (!safePath || !/^(?:[a-zA-Z]:[\\/]|[\\/])/.test(safePath)) {
            setAppleStatus("Audio file path was not found. Try Select File.", true);
            return;
        }
        audioCleanerState.sourcePath = safePath;
        audioCleanerState.sourceName = name || "Selected audio";
        clearAudioCleanerOutputs();
        const title = document.getElementById("audioCleanerDropTitle");
        const hint = document.getElementById("audioCleanerDropHint");
        if (title) title.textContent = audioCleanerState.sourceName;
        if (hint) hint.textContent = "Ready for Noise Remover or Vocal Remover";
        setAudioCleanerProgress(0, "Ready");
        setAppleStatus("Audio selected: " + audioCleanerState.sourceName, false);
    }

    function clearAudioCleanerOutputs() {
        stopAudioPreview();
        audioCleanerState.outputPath = "";
        audioCleanerState.outputName = "";
        audioCleanerState.musicPath = "";
        audioCleanerState.musicName = "";
        audioCleanerState.vocalPath = "";
        audioCleanerState.vocalName = "";
        const stack = document.getElementById("audioCleanerOutput");
        const musicRow = document.getElementById("audioCleanerMusicOutput");
        const vocalRow = document.getElementById("audioCleanerVocalOutput");
        if (stack) stack.classList.remove("active");
        if (musicRow) musicRow.classList.remove("active");
        if (vocalRow) vocalRow.classList.remove("active");
    }

    function showAudioCleanerOutput(kind, filePath) {
        const isVocal = kind === "vocal";
        const stack = document.getElementById("audioCleanerOutput");
        const row = document.getElementById(isVocal ? "audioCleanerVocalOutput" : "audioCleanerMusicOutput");
        const playBtn = document.getElementById(isVocal ? "btnAudioCleanerPlayVocal" : "btnAudioCleanerPlayMusic");
        const name = audioCleanerBasename(filePath);
        if (isVocal) {
            audioCleanerState.vocalPath = filePath;
            audioCleanerState.vocalName = name;
        } else {
            audioCleanerState.musicPath = filePath;
            audioCleanerState.musicName = name;
            audioCleanerState.outputPath = filePath;
            audioCleanerState.outputName = name;
        }
        if (stack) stack.classList.add("active");
        if (row) row.classList.add("active");
        if (playBtn) {
            playBtn.title = "Play preview: " + name;
            playBtn.setAttribute("aria-label", "Play preview: " + name);
            resetAudioPreviewButton(playBtn);
            window.requestAnimationFrame(function() { drawOutputIdleWaveByButton(playBtn); });
        }
    }

    function getAudioCleanerOutputPath(mode) {
        const fs = require("fs");
        const path = require("path");
        const dir = getAudioCleanerOutputFolder();
        if (!dir) return "";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const suffix = mode === "vocal" ? "vocal_removed" : "noise_clean";
        return path.join(dir, audioCleanerSafeName(audioCleanerState.sourceName) + "_" + suffix + "_" + Date.now() + ".wav");
    }

    function parseFfmpegDuration(line) {
        const match = String(line || "").match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
        if (!match) return 0;
        return (parseInt(match[1], 10) * 3600) + (parseInt(match[2], 10) * 60) + parseFloat(match[3]);
    }

    function parseFfmpegTime(line) {
        const match = String(line || "").match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/i);
        if (!match) return 0;
        return (parseInt(match[1], 10) * 3600) + (parseInt(match[2], 10) * 60) + parseFloat(match[3]);
    }

    function probeAudioCleanerStereo(ffmpegPath, childProcess, callback) {
        childProcess.execFile(ffmpegPath, ["-hide_banner", "-i", audioCleanerState.sourcePath], { windowsHide: true, maxBuffer: 1024 * 1024 * 2 }, function(error, stdout, stderr) {
            const log = String(stderr || "") + "\n" + String(stdout || "");
            const audioLineMatch = log.match(/Audio:\s*[^\r\n]+/i);
            const audioLine = audioLineMatch ? audioLineMatch[0] : log;
            const isMono = /\bmono\b|1 channels?/i.test(audioLine);
            const isStereoLike = /\bstereo\b|2 channels?|2\.1|4\.0|5\.1|7\.1|quad/i.test(audioLine);
            callback({
                ok: isStereoLike && !isMono,
                audioLine: audioLine
            });
        });
    }

    function getAudioCleanerDemucsCandidates() {
        const candidates = [];
        const extPath = (csInterface.getSystemPath(SystemPath.EXTENSION) || "").replace(/\\/g, "/");
        try {
            const envPython = window.process && window.process.env && window.process.env.KWV_DEMUCS_PYTHON;
            if (envPython) candidates.push({ command: envPython, args: ["-m", "demucs"], label: "KWV_DEMUCS_PYTHON" });
        } catch (error) {}
        candidates.push({ command: extPath + "/bin/audio/.venv/Scripts/python.exe", args: ["-m", "demucs"], label: "Bundled Windows Python Demucs" });
        candidates.push({ command: extPath + "/bin/audio/.venv/bin/python", args: ["-m", "demucs"], label: "Bundled Mac Python Demucs" });
        candidates.push({ command: "demucs", args: [], label: "demucs" });
        candidates.push({ command: "py", args: ["-3.11", "-m", "demucs"], label: "Python 3.11 Demucs" });
        candidates.push({ command: "py", args: ["-3.10", "-m", "demucs"], label: "Python 3.10 Demucs" });
        candidates.push({ command: "python3", args: ["-m", "demucs"], label: "Python 3 Demucs" });
        candidates.push({ command: "python", args: ["-m", "demucs"], label: "Python Demucs" });
        candidates.push({ command: "/opt/homebrew/bin/python3", args: ["-m", "demucs"], label: "Homebrew Python Demucs" });
        candidates.push({ command: "/usr/local/bin/python3", args: ["-m", "demucs"], label: "Local Python Demucs" });
        return candidates;
    }

    function findAudioCleanerDemucsRunner(childProcess, callback) {
        const candidates = getAudioCleanerDemucsCandidates();
        let index = 0;
        function next() {
            if (index >= candidates.length) {
                callback(null);
                return;
            }
            const candidate = candidates[index++];
            childProcess.execFile(candidate.command, candidate.args.concat(["--help"]), { windowsHide: true, maxBuffer: 1024 * 1024 * 2 }, function(error, stdout, stderr) {
                const text = String(stdout || "") + String(stderr || "");
                if (!error && /demucs|separate|usage/i.test(text)) {
                    callback(candidate);
                    return;
                }
                next();
            });
        }
        next();
    }

    function findAudioCleanerStemFile(fs, path, rootDir, stemName) {
        const pattern = stemName === "vocals" ? /^vocals\.(wav|mp3|flac)$/i : /^no_vocals\.(wav|mp3|flac)$/i;
        const stack = [rootDir];
        while (stack.length) {
            const current = stack.pop();
            let entries = [];
            try {
                entries = fs.readdirSync(current);
            } catch (error) {
                continue;
            }
            for (let i = 0; i < entries.length; i++) {
                const fullPath = path.join(current, entries[i]);
                let stat = null;
                try {
                    stat = fs.statSync(fullPath);
                } catch (error) {}
                if (!stat) continue;
                if (stat.isDirectory()) {
                    stack.push(fullPath);
                } else if (pattern.test(entries[i])) {
                    return fullPath;
                }
            }
        }
        return "";
    }

    function getPortableVocalModelPath(fs) {
        const extPath = (csInterface.getSystemPath(SystemPath.EXTENSION) || "").replace(/\\/g, "/");
        const candidates = [];
        try {
            const envModel = window.process && window.process.env && window.process.env.KWV_VOCAL_MODEL;
            if (envModel) candidates.push(String(envModel).replace(/\\/g, "/"));
        } catch (error) {}
        candidates.push(extPath + "/bin/audio/models/vocalseperate_fp32.onnx");
        candidates.push(extPath + "/bin/audio/models/vocal_separation.onnx");
        candidates.push("C:/Program Files/HitPaw Video Converter/vocalmodel/vocalseperate_fp32.onnx");
        candidates.push("C:/Program Files (x86)/HitPaw Video Converter/vocalmodel/vocalseperate_fp32.onnx");
        try {
            const allowReference = window.process && window.process.env && window.process.env.KWV_ALLOW_HITPAW_REFERENCE === "1";
            if (allowReference) candidates.push("C:/Program Files/HitPaw Video Converter/vocalmodel/vocalseperate_fp32.onnx");
        } catch (error) {}
        for (let i = 0; i < candidates.length; i++) {
            if (fs.existsSync(candidates[i])) return candidates[i];
        }
        return "";
    }

    function getOnnxVocalRunnerPath() {
        const extPath = (csInterface.getSystemPath(SystemPath.EXTENSION) || "").replace(/\\/g, "/");
        return extPath + "/bin/audio/onnx_vocal_runner.py";
    }

    function runPortableOnnxVocalModel(childProcess, fs, path, preparedWav, outRoot, onFallback) {
        const modelPath = getPortableVocalModelPath(fs);
        const runnerPath = getOnnxVocalRunnerPath();
        if (!fs.existsSync(modelPath) || !fs.existsSync(runnerPath)) {
            onFallback("Local ONNX vocal model not found.");
            return;
        }
        setAudioCleanerProgress(12, "Local ONNX");
        setAppleStatus("Running local ONNX vocal separation...", false);
        const proc = childProcess.spawn("py", [
            "-3.11",
            runnerPath,
            "--model", modelPath,
            "--input", preparedWav,
            "--out", outRoot
        ], { windowsHide: true });
        let log = "";
        let settled = false;
        const watchdog = window.setTimeout(function() {
            if (settled) return;
            settled = true;
            try { proc.kill(); } catch (killError) {}
            onFallback("Local ONNX runner timed out.");
        }, 8 * 60 * 1000);
        proc.stdout.on("data", (chunk) => {
            const text = String(chunk || "");
            log += text;
            const progressMatch = text.match(/PROGRESS\s+(\d+)/);
            if (progressMatch) {
                setAudioCleanerProgress(Math.min(99, parseInt(progressMatch[1], 10) || 0), "Local ONNX running");
            }
        });
        proc.stderr.on("data", (chunk) => {
            log += String(chunk || "");
        });
        proc.on("error", (error) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(watchdog);
            onFallback(error && error.message ? error.message : "Local ONNX runner could not start.");
        });
        proc.on("close", (code) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(watchdog);
            if (code !== 0) {
                onFallback(String(log || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "Local ONNX runner failed.");
                return;
            }
            const noVocals = findAudioCleanerStemFile(fs, path, outRoot, "no_vocals");
            const vocals = findAudioCleanerStemFile(fs, path, outRoot, "vocals");
            if (!noVocals || !vocals) {
                onFallback("Local ONNX runner produced no stems.");
                return;
            }
            clearAudioCleanerTimer();
            setAudioCleanerBusy(false);
            clearAudioCleanerOutputs();
            showAudioCleanerOutput("music", noVocals);
            showAudioCleanerOutput("vocal", vocals);
            setAudioCleanerProgress(100, "Local ONNX ready");
            setAppleStatus("Local ONNX AI ready: Music and Vocal stems created.", false);
        });
    }

    function runAudioCleanerDemucs(childProcess, fs) {
        let path;
        try {
            path = require("path");
        } catch (error) {
            setAppleStatus("Node path module is unavailable.", true);
            return;
        }
        setAudioCleanerBusy(true);
        setAudioCleanerProgress(2, "Finding Demucs");
        setAppleStatus("Preparing AI vocal remover...", false);
        findAudioCleanerDemucsRunner(childProcess, function(runner) {
            const outputFolder = getAudioCleanerOutputFolder();
            const outRoot = outputFolder ? path.join(outputFolder, "demucs_" + Date.now()) : "";
            try {
                if (!outRoot) throw new Error("Missing output folder");
                if (!fs.existsSync(outRoot)) fs.mkdirSync(outRoot, { recursive: true });
            } catch (error) {
                setAudioCleanerBusy(false);
                setAudioCleanerProgress(0, "Failed");
                setAppleStatus("Could not create Demucs output folder.", true);
                return;
            }

            const preparedWav = path.join(outRoot, audioCleanerSafeName(audioCleanerState.sourceName) + "_demucs_input.wav");
            setAudioCleanerProgress(8, "Preparing WAV");
            setAppleStatus("Preparing audio for Demucs AI...", false);
            childProcess.execFile(getFfmpegExecutable(), [
                "-hide_banner",
                "-y",
                "-i", audioCleanerState.sourcePath,
                "-vn",
                "-ar", "44100",
                "-ac", "2",
                "-c:a", "pcm_s16le",
                preparedWav
            ], { windowsHide: true, maxBuffer: 1024 * 1024 * 8 }, function(convertError, stdout, stderr) {
                if (convertError || !fs.existsSync(preparedWav)) {
                    setAudioCleanerBusy(false);
                    setAudioCleanerProgress(0, "Failed");
                    setAppleStatus("Could not prepare WAV for Demucs. Try a different audio/video file.", true);
                    return;
                }

                runPortableOnnxVocalModel(childProcess, fs, path, preparedWav, outRoot, function(fallbackReason) {
                    if (!runner) {
                        clearAudioCleanerTimer();
                        setAudioCleanerBusy(false);
                        setAudioCleanerProgress(0, "Install Demucs");
                        setAppleStatus("Free AI setup needed: run bin/audio/setup_audio_ai.bat on Windows or setup_audio_ai.command on Mac.", true);
                        return;
                    }
                    startAudioCleanerSmoothProgress("Demucs AI running");
                    setAppleStatus("Local ONNX fallback: " + String(fallbackReason || "unavailable").substring(0, 70) + ". Running Demucs...", false);
                    const args = runner.args.concat([
                        "--device", "cpu",
                        "--jobs", "1",
                        "--segment", "7",
                        "--two-stems", "vocals",
                        "-n", "htdemucs",
                        "--out", outRoot,
                        preparedWav
                    ]);
                    const proc = childProcess.spawn(runner.command, args, { windowsHide: true });
                    let log = "";
                    let settled = false;
                    const watchdog = window.setTimeout(function() {
                        if (settled) return;
                        settled = true;
                        try { proc.kill(); } catch (killError) {}
                        clearAudioCleanerTimer();
                        setAudioCleanerBusy(false);
                        setAudioCleanerProgress(0, "Timed out");
                        setAppleStatus("Demucs AI paused too long. File may be heavy or Demucs got stuck. Try shorter audio or run again.", true);
                    }, 12 * 60 * 1000);
                    proc.stdout.on("data", (chunk) => {
                        log += String(chunk || "");
                    });
                    proc.stderr.on("data", (chunk) => {
                        const text = String(chunk || "");
                        log += text;
                        const percentMatch = text.match(/(\d{1,3})%\|/);
                        if (percentMatch) {
                            setAudioCleanerProgress(Math.min(97, parseInt(percentMatch[1], 10) || 0), "Demucs AI running");
                        }
                    });
                    proc.on("error", (error) => {
                        if (settled) return;
                        settled = true;
                        window.clearTimeout(watchdog);
                        clearAudioCleanerTimer();
                        setAudioCleanerBusy(false);
                        setAudioCleanerProgress(0, "Failed");
                        setAppleStatus("Demucs failed to start: " + (error && error.message ? error.message : "Unknown error."), true);
                    });
                    proc.on("close", (code) => {
                        if (settled) return;
                        settled = true;
                        window.clearTimeout(watchdog);
                        clearAudioCleanerTimer();
                        setAudioCleanerBusy(false);
                        if (code !== 0) {
                            const detail = String(log || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "Check Python/Demucs install and try again.";
                            setAudioCleanerProgress(0, "Failed");
                            setAppleStatus("Demucs AI failed: " + detail.substring(0, 120), true);
                            return;
                        }
                        const noVocals = findAudioCleanerStemFile(fs, path, outRoot, "no_vocals");
                        const vocals = findAudioCleanerStemFile(fs, path, outRoot, "vocals");
                        if (!noVocals || !vocals) {
                            setAudioCleanerProgress(0, "No output");
                            setAppleStatus("Demucs finished but Music/Vocal stems were not found.", true);
                            return;
                        }
                        clearAudioCleanerOutputs();
                        showAudioCleanerOutput("music", noVocals);
                        showAudioCleanerOutput("vocal", vocals);
                        setAudioCleanerProgress(100, "AI export ready");
                        setAppleStatus("Demucs AI ready: Music and Vocal stems created.", false);
                    });
                });
            });
        });
    }

    function buildAudioCleanerArgs(mode, outputPath) {
        const sourcePath = audioCleanerState.sourcePath;
        const filter = mode === "vocal"
            ? "stereotools=mode=lr>ms:mlev=0.015625:slev=1.55,stereotools=mode=ms>lr,highpass=f=70,lowpass=f=16500,compand=attacks=0.02:decays=0.25:points=-80/-80|-35/-28|-12/-10|0/-1:soft-knee=6,dynaudnorm=f=150:g=7"
            : "highpass=f=80,lowpass=f=16000,afftdn=nf=-25,dynaudnorm=f=150:g=9";
        return [
            "-hide_banner",
            "-y",
            "-i", sourcePath,
            "-vn",
            "-af", filter,
            "-ar", "48000",
            "-ac", "2",
            "-c:a", "pcm_s16le",
            outputPath
        ];
    }

    function runAudioCleaner(mode) {
        if (audioCleanerState.busy) return;
        if (!audioCleanerState.sourcePath) {
            setAppleStatus("Drop or select an audio file first.", true);
            return;
        }
        if (typeof require !== "function") {
            setAppleStatus("Node.js CEP is not enabled. Reload the extension.", true);
            return;
        }
        let childProcess, fs;
        try {
            childProcess = require("child_process");
            fs = require("fs");
        } catch (error) {
            setAppleStatus("Node modules are unavailable in CEP.", true);
            return;
        }
        const label = mode === "vocal" ? "Vocal remover" : "Noise remover";
        const ffmpegPath = getFfmpegExecutable();

        if (mode === "vocal") {
            runAudioCleanerDemucs(childProcess, fs);
            return;
        }

        function startProcessing() {
            const outputPath = getAudioCleanerOutputPath(mode);
            if (!outputPath) {
                setAppleStatus("Could not create Audio Cleaner output path.", true);
                return;
            }
            let duration = 0;
            setAudioCleanerBusy(true);
            startAudioCleanerSmoothProgress(label + " running");
            setAppleStatus(label + " exporting audio...", false);
            const proc = childProcess.spawn(ffmpegPath, buildAudioCleanerArgs(mode, outputPath), { windowsHide: true });
            let log = "";
            proc.stderr.on("data", (chunk) => {
                const text = String(chunk || "");
                log += text;
                const detectedDuration = parseFfmpegDuration(text);
                if (detectedDuration) duration = detectedDuration;
                const currentTime = parseFfmpegTime(text);
                if (duration && currentTime) {
                    setAudioCleanerProgress(Math.min(96, (currentTime / duration) * 100), label + " running");
                }
            });
            proc.on("error", (error) => {
                clearAudioCleanerTimer();
                setAudioCleanerBusy(false);
                setAudioCleanerProgress(0, "Failed");
                setAppleStatus("FFmpeg failed: " + (error && error.message ? error.message : "Could not start."), true);
            });
            proc.on("close", (code) => {
                clearAudioCleanerTimer();
                setAudioCleanerBusy(false);
                if (code !== 0 || !fs.existsSync(outputPath)) {
                    setAudioCleanerProgress(0, "Failed");
                    setAppleStatus(label + " failed. Check the audio file or FFmpeg.", true);
                    return;
                }
            clearAudioCleanerOutputs();
            showAudioCleanerOutput("music", outputPath);
            setAudioCleanerProgress(100, "Export ready");
            setAppleStatus("Audio exported: " + audioCleanerState.musicName + ". Import to comp when ready.", false);
        });
        }

        startProcessing();
    }

    function getAudioCleanerOutputByKind(kind) {
        if (kind === "vocal") {
            return { path: audioCleanerState.vocalPath, name: audioCleanerState.vocalName || "Vocal" };
        }
        return { path: audioCleanerState.musicPath || audioCleanerState.outputPath, name: audioCleanerState.musicName || audioCleanerState.outputName || "Music" };
    }

    function importAudioCleanerOutput(kind) {
        const output = getAudioCleanerOutputByKind(kind);
        if (!output.path) {
            setAppleStatus("No cleaned audio export is ready.", true);
            return;
        }
        setAppleStatus("Importing " + output.name + " to comp...", false);
        csInterface.evalScript("toolkit.importAudioCleanerAsset('" + escapeScriptString(output.path) + "')", function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setAppleStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Audio import failed.", true);
                return;
            }
            setAppleStatus(res.indexOf("success::") === 0 ? res.substring(9) : output.name + " imported.", false);
        });
    }

    function deleteAudioCleanerOutput(kind) {
        stopAudioPreview();
        const output = getAudioCleanerOutputByKind(kind);
        if (!output.path) return;
        try {
            const fs = require("fs");
            if (fs.existsSync(output.path)) fs.unlinkSync(output.path);
        } catch (error) {
            setAppleStatus("Could not delete export: " + (error && error.message ? error.message : "Unknown error."), true);
            return;
        }
        const row = document.getElementById(kind === "vocal" ? "audioCleanerVocalOutput" : "audioCleanerMusicOutput");
        if (kind === "vocal") {
            audioCleanerState.vocalPath = "";
            audioCleanerState.vocalName = "";
        } else {
            audioCleanerState.musicPath = "";
            audioCleanerState.musicName = "";
            audioCleanerState.outputPath = "";
            audioCleanerState.outputName = "";
        }
        if (row) row.classList.remove("active");
        const stack = document.getElementById("audioCleanerOutput");
        if (stack && !audioCleanerState.musicPath && !audioCleanerState.vocalPath) {
            stack.classList.remove("active");
            setAudioCleanerProgress(0, "Ready");
        }
        setAppleStatus(output.name + " export deleted.", false);
    }

    function selectAudioCleanerFile(fileInput) {
        if (!fileInput) return;
        fileInput.value = "";
        fileInput.click();
    }

    function initAudioCleanerPanel() {
        const shell = document.getElementById("appleAudioCleanerShell");
        const toggle = document.getElementById("appleAudioCleanerToggle");
        const dropzone = document.getElementById("audioCleanerDropzone");
        const fileInput = document.getElementById("audioCleanerFileInput");
        const selectBtn = document.getElementById("btnAudioCleanerSelect");
        const noiseBtn = document.getElementById("btnAudioNoiseRemove");
        const vocalBtn = document.getElementById("btnAudioVocalRemove");
        const folderBtn = document.getElementById("btnAudioCleanerChooseFolder");
        const importMusicBtn = document.getElementById("btnAudioCleanerImportMusic");
        const deleteMusicBtn = document.getElementById("btnAudioCleanerDeleteMusic");
        const importVocalBtn = document.getElementById("btnAudioCleanerImportVocal");
        const deleteVocalBtn = document.getElementById("btnAudioCleanerDeleteVocal");
        const playMusicBtn = document.getElementById("btnAudioCleanerPlayMusic");
        const playVocalBtn = document.getElementById("btnAudioCleanerPlayVocal");

        function setPanelOpen(isOpen) {
            if (!shell) return;
            shell.classList.toggle("collapsed", !isOpen);
            if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }

        if (shell && toggle && !toggle.__audioCleanerToggleBound) {
            toggle.__audioCleanerToggleBound = true;
            toggle.onclick = () => setPanelOpen(shell.classList.contains("collapsed"));
            toggle.onkeydown = (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setPanelOpen(shell.classList.contains("collapsed"));
            };
            setPanelOpen(false);
        }
        if (selectBtn && fileInput) selectBtn.onclick = (event) => {
            event.stopPropagation();
            selectAudioCleanerFile(fileInput);
        };
        if (dropzone && fileInput) {
            dropzone.onclick = () => {
                selectAudioCleanerFile(fileInput);
            };
            dropzone.onkeydown = (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                selectAudioCleanerFile(fileInput);
            };
            ["dragenter", "dragover"].forEach((name) => {
                dropzone.addEventListener(name, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.add("is-dragging");
                });
            });
            ["dragleave", "drop"].forEach((name) => {
                dropzone.addEventListener(name, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.remove("is-dragging");
                });
            });
            dropzone.addEventListener("drop", (event) => {
                const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
                setAudioCleanerSource(file && (file.path || file.name));
            });
            fileInput.onchange = () => {
                const file = fileInput.files && fileInput.files[0];
                setAudioCleanerSource(file && (file.path || file.name));
                fileInput.value = "";
            };
        }
        if (noiseBtn) noiseBtn.onclick = () => runAudioCleaner("noise");
        if (vocalBtn) vocalBtn.onclick = () => runAudioCleaner("vocal");
        if (folderBtn) folderBtn.onclick = (event) => {
            event.stopPropagation();
            chooseAudioCleanerOutputFolder();
        };
        if (importMusicBtn) importMusicBtn.onclick = () => importAudioCleanerOutput("music");
        if (deleteMusicBtn) deleteMusicBtn.onclick = () => deleteAudioCleanerOutput("music");
        if (importVocalBtn) importVocalBtn.onclick = () => importAudioCleanerOutput("vocal");
        if (deleteVocalBtn) deleteVocalBtn.onclick = () => deleteAudioCleanerOutput("vocal");
        if (playMusicBtn) playMusicBtn.onclick = () => playAudioPreview("music", audioCleanerState.musicPath || audioCleanerState.outputPath, playMusicBtn);
        if (playVocalBtn) playVocalBtn.onclick = () => playAudioPreview("vocal", audioCleanerState.vocalPath, playVocalBtn);
        updateAudioCleanerFolderLabel();
    }

    const mp3ConverterState = {
        sourcePath: "",
        sourceName: "",
        outputPath: "",
        outputName: "",
        outputFolder: "",
        busy: false,
        pickerOpen: false,
        progressTimer: null,
        lastProgress: 0
    };
    const mp3ConverterFolderStorageKey = "keshavwithvelo.mp3Converter.outputFolder.v1";

    function getMp3ConverterOutputFolder() {
        return getAppleToolOutputFolder(mp3ConverterState, mp3ConverterFolderStorageKey, "Keshav Velo MP3 Converter");
    }

    function updateMp3ConverterFolderLabel() {
        updateAppleToolFolderLabel(mp3ConverterState, mp3ConverterFolderStorageKey, "Keshav Velo MP3 Converter", "mp3ConverterFolderPath");
    }

    function chooseMp3ConverterOutputFolder() {
        chooseAppleToolOutputFolder(mp3ConverterState, mp3ConverterFolderStorageKey, "Keshav Velo MP3 Converter", "mp3ConverterFolderPath", "Choose MP3 Output Folder", "MP3 output folder saved.");
    }

    function setMp3ConverterProgress(percent, label) {
        const bar = document.getElementById("mp3ConverterProgressBar");
        const value = document.getElementById("mp3ConverterProgressValue");
        const labelEl = document.getElementById("mp3ConverterProgressLabel");
        let safePercent = Math.max(0, Math.min(100, Math.round(percent || 0)));
        if (mp3ConverterState.busy && safePercent < 100) {
            safePercent = Math.max(mp3ConverterState.lastProgress || 0, safePercent);
        }
        mp3ConverterState.lastProgress = safePercent;
        if (bar) bar.style.width = safePercent + "%";
        if (value) value.textContent = safePercent + "%";
        if (labelEl) labelEl.textContent = label || "Ready";
    }

    function setMp3ConverterBusy(isBusy) {
        mp3ConverterState.busy = !!isBusy;
        if (isBusy) mp3ConverterState.lastProgress = 0;
        ["btnMp3ConverterSelect", "btnMp3Convert", "btnMp3ConverterChooseFolder", "btnMp3ConverterImport", "btnMp3ConverterDelete", "btnMp3ConverterPlay"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.disabled = !!isBusy;
        });
    }

    function clearMp3ConverterTimer() {
        if (mp3ConverterState.progressTimer) {
            window.clearInterval(mp3ConverterState.progressTimer);
            mp3ConverterState.progressTimer = null;
        }
    }

    function startMp3ConverterSmoothProgress(label) {
        clearMp3ConverterTimer();
        let soft = 8;
        setMp3ConverterProgress(soft, label || "Converting");
        mp3ConverterState.progressTimer = window.setInterval(() => {
            if (!mp3ConverterState.busy) return;
            soft = Math.min(92, soft + Math.max(1, (96 - soft) * 0.07));
            setMp3ConverterProgress(soft, label || "Converting");
        }, 350);
    }

    function clearMp3ConverterOutput() {
        stopAudioPreview();
        mp3ConverterState.outputPath = "";
        mp3ConverterState.outputName = "";
        const stack = document.getElementById("mp3ConverterOutput");
        const row = document.getElementById("mp3ConverterOutputRow");
        if (stack) stack.classList.remove("active");
        if (row) row.classList.remove("active");
    }

    function setMp3ConverterSource(filePath) {
        const safePath = String(filePath || "").trim();
        if (!safePath) return;
        mp3ConverterState.sourcePath = safePath;
        mp3ConverterState.sourceName = audioCleanerBasename(safePath) || "Selected media";
        const title = document.getElementById("mp3ConverterDropTitle");
        const hint = document.getElementById("mp3ConverterDropHint");
        if (title) title.textContent = mp3ConverterState.sourceName;
        if (hint) hint.textContent = "Ready for MP3 conversion";
        clearMp3ConverterOutput();
        setMp3ConverterProgress(0, "Ready");
        setAppleStatus("MP3 Converter selected: " + mp3ConverterState.sourceName, false);
    }

    function getMp3ConverterOutputPath() {
        let path;
        try {
            path = require("path");
        } catch (error) {
            return "";
        }
        const dir = getMp3ConverterOutputFolder();
        if (!dir) return "";
        try {
            const fs = require("fs");
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        } catch (error) {}
        return path.join(dir, audioCleanerSafeName(mp3ConverterState.sourceName) + "_converted_" + Date.now() + ".mp3");
    }

    function showMp3ConverterOutput(filePath) {
        const name = audioCleanerBasename(filePath) || "converted.mp3";
        mp3ConverterState.outputPath = filePath;
        mp3ConverterState.outputName = name;
        const stack = document.getElementById("mp3ConverterOutput");
        const row = document.getElementById("mp3ConverterOutputRow");
        const playBtn = document.getElementById("btnMp3ConverterPlay");
        if (playBtn) {
            playBtn.title = "Play preview: " + name;
            playBtn.setAttribute("aria-label", "Play preview: " + name);
            resetAudioPreviewButton(playBtn);
            window.requestAnimationFrame(function() { drawOutputIdleWaveByButton(playBtn); });
        }
        if (stack) stack.classList.add("active");
        if (row) row.classList.add("active");
    }

    function runMp3Converter() {
        if (mp3ConverterState.busy) return;
        if (!mp3ConverterState.sourcePath) {
            setAppleStatus("Drop or select a video/audio file first.", true);
            return;
        }
        if (typeof require !== "function") {
            setAppleStatus("Node.js CEP is not enabled. Reload the extension.", true);
            return;
        }
        let childProcess, fs;
        try {
            childProcess = require("child_process");
            fs = require("fs");
        } catch (error) {
            setAppleStatus("Node modules are unavailable in CEP.", true);
            return;
        }
        const outputPath = getMp3ConverterOutputPath();
        if (!outputPath) {
            setAppleStatus("Could not create MP3 output path.", true);
            return;
        }
        let duration = 0;
        const args = [
            "-hide_banner",
            "-y",
            "-i", mp3ConverterState.sourcePath,
            "-vn",
            "-map", "0:a:0",
            "-ar", "44100",
            "-ac", "2",
            "-b:a", "192k",
            "-codec:a", "libmp3lame",
            outputPath
        ];
        setMp3ConverterBusy(true);
        startMp3ConverterSmoothProgress("Converting MP3");
        setAppleStatus("Converting " + mp3ConverterState.sourceName + " to MP3...", false);
        const proc = childProcess.spawn(getFfmpegExecutable(), args, { windowsHide: true });
        let log = "";
        proc.stderr.on("data", (chunk) => {
            const text = String(chunk || "");
            log += text;
            const detectedDuration = parseFfmpegDuration(text);
            if (detectedDuration) duration = detectedDuration;
            const currentTime = parseFfmpegTime(text);
            if (duration && currentTime) {
                setMp3ConverterProgress(Math.min(96, (currentTime / duration) * 100), "Converting MP3");
            }
        });
        proc.on("error", (error) => {
            clearMp3ConverterTimer();
            setMp3ConverterBusy(false);
            setMp3ConverterProgress(0, "Failed");
            setAppleStatus("FFmpeg failed: " + (error && error.message ? error.message : "Could not start."), true);
        });
        proc.on("close", (code) => {
            clearMp3ConverterTimer();
            setMp3ConverterBusy(false);
            if (code !== 0 || !fs.existsSync(outputPath)) {
                const detail = String(log || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "Check file audio track or FFmpeg.";
                setMp3ConverterProgress(0, "Failed");
                setAppleStatus("MP3 conversion failed: " + detail.substring(0, 120), true);
                return;
            }
            showMp3ConverterOutput(outputPath);
            setMp3ConverterProgress(100, "MP3 ready");
            setAppleStatus("MP3 exported: " + mp3ConverterState.outputName + ". Import to comp when ready.", false);
        });
    }

    function importMp3ConverterOutput() {
        if (!mp3ConverterState.outputPath) {
            setAppleStatus("No MP3 export is ready.", true);
            return;
        }
        setAppleStatus("Importing " + mp3ConverterState.outputName + " to comp...", false);
        csInterface.evalScript("toolkit.importAudioCleanerAsset('" + escapeScriptString(mp3ConverterState.outputPath) + "')", function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setAppleStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "MP3 import failed.", true);
                return;
            }
            setAppleStatus(res.indexOf("success::") === 0 ? res.substring(9) : "MP3 imported.", false);
        });
    }

    function deleteMp3ConverterOutput() {
        stopAudioPreview();
        if (!mp3ConverterState.outputPath) return;
        const oldName = mp3ConverterState.outputName || "MP3";
        try {
            const fs = require("fs");
            if (fs.existsSync(mp3ConverterState.outputPath)) fs.unlinkSync(mp3ConverterState.outputPath);
        } catch (error) {
            setAppleStatus("Could not delete MP3: " + (error && error.message ? error.message : "Unknown error."), true);
            return;
        }
        clearMp3ConverterOutput();
        setMp3ConverterProgress(0, "Ready");
        setAppleStatus(oldName + " export deleted.", false);
    }

    function selectMp3ConverterFile(fileInput) {
        if (!fileInput) return;
        fileInput.value = "";
        fileInput.click();
    }

    function initMp3ConverterPanel() {
        const shell = document.getElementById("appleMp3ConverterShell");
        const toggle = document.getElementById("appleMp3ConverterToggle");
        const dropzone = document.getElementById("mp3ConverterDropzone");
        const fileInput = document.getElementById("mp3ConverterFileInput");
        const selectBtn = document.getElementById("btnMp3ConverterSelect");
        const convertBtn = document.getElementById("btnMp3Convert");
        const folderBtn = document.getElementById("btnMp3ConverterChooseFolder");
        const importBtn = document.getElementById("btnMp3ConverterImport");
        const deleteBtn = document.getElementById("btnMp3ConverterDelete");
        const playBtn = document.getElementById("btnMp3ConverterPlay");

        function setPanelOpen(isOpen) {
            if (!shell) return;
            shell.classList.toggle("collapsed", !isOpen);
            if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }

        if (shell && toggle && !toggle.__mp3ConverterToggleBound) {
            toggle.__mp3ConverterToggleBound = true;
            toggle.onclick = () => setPanelOpen(shell.classList.contains("collapsed"));
            toggle.onkeydown = (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setPanelOpen(shell.classList.contains("collapsed"));
            };
            setPanelOpen(false);
        }
        if (selectBtn && fileInput) selectBtn.onclick = (event) => {
            event.stopPropagation();
            selectMp3ConverterFile(fileInput);
        };
        if (dropzone && fileInput) {
            dropzone.onclick = () => {
                selectMp3ConverterFile(fileInput);
            };
            dropzone.onkeydown = (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                selectMp3ConverterFile(fileInput);
            };
            ["dragenter", "dragover"].forEach((name) => {
                dropzone.addEventListener(name, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.add("is-dragging");
                });
            });
            ["dragleave", "drop"].forEach((name) => {
                dropzone.addEventListener(name, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.remove("is-dragging");
                });
            });
            dropzone.addEventListener("drop", (event) => {
                const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
                setMp3ConverterSource(file && (file.path || file.name));
            });
            fileInput.onchange = () => {
                const file = fileInput.files && fileInput.files[0];
                setMp3ConverterSource(file && (file.path || file.name));
                fileInput.value = "";
            };
        }
        if (convertBtn) convertBtn.onclick = runMp3Converter;
        if (folderBtn) folderBtn.onclick = (event) => {
            event.stopPropagation();
            chooseMp3ConverterOutputFolder();
        };
        if (importBtn) importBtn.onclick = importMp3ConverterOutput;
        if (deleteBtn) deleteBtn.onclick = deleteMp3ConverterOutput;
        if (playBtn) playBtn.onclick = () => playAudioPreview("mp3", mp3ConverterState.outputPath, playBtn);
        updateMp3ConverterFolderLabel();
    }

    const videoConverterState = {
        sourcePath: "",
        sourceName: "",
        outputPath: "",
        outputName: "",
        outputFolder: "",
        busy: false,
        progressTimer: null,
        lastProgress: 0
    };
    const videoConverterFolderStorageKey = "keshavwithvelo.videoConverter.outputFolder.v1";

    function setVideoConverterProgress(percent, label) {
        const bar = document.getElementById("videoConverterProgressBar");
        const value = document.getElementById("videoConverterProgressValue");
        const labelEl = document.getElementById("videoConverterProgressLabel");
        let safePercent = Math.max(0, Math.min(100, Math.round(percent || 0)));
        if (videoConverterState.busy && safePercent < 100) {
            safePercent = Math.max(videoConverterState.lastProgress || 0, safePercent);
        }
        videoConverterState.lastProgress = safePercent;
        if (bar) bar.style.width = safePercent + "%";
        if (value) value.textContent = safePercent + "%";
        if (labelEl) labelEl.textContent = label || "Ready";
    }

    function setVideoConverterBusy(isBusy) {
        videoConverterState.busy = !!isBusy;
        if (isBusy) videoConverterState.lastProgress = 0;
        ["btnVideoConverterSelect", "btnVideoConvert", "btnVideoConverterImport", "btnVideoConverterDelete", "btnVideoConverterChooseFolder"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.disabled = !!isBusy;
        });
    }

    function normalizeVideoConverterPath(filePath) {
        return String(filePath || "").replace(/\\/g, "/");
    }

    function getDefaultVideoConverterFolder() {
        try {
            const path = require("path");
            const os = require("os");
            return path.join(os.homedir(), "Downloads", "Keshav Velo Video Converter");
        } catch (error) {
            try {
                const docs = csInterface.getSystemPath(SystemPath.MY_DOCUMENTS) || "";
                return docs ? docs.replace(/\\/g, "/") + "/Keshav Velo Video Converter" : "";
            } catch (fallbackError) {
                return "";
            }
        }
    }

    function getVideoConverterOutputFolder() {
        if (videoConverterState.outputFolder) return videoConverterState.outputFolder;
        let saved = "";
        try {
            saved = localStorage.getItem(videoConverterFolderStorageKey) || "";
        } catch (error) {}
        videoConverterState.outputFolder = saved || getDefaultVideoConverterFolder();
        return videoConverterState.outputFolder;
    }

    function saveVideoConverterOutputFolder(folderPath) {
        const safePath = String(folderPath || "").trim();
        if (!safePath) return false;
        videoConverterState.outputFolder = safePath;
        try {
            localStorage.setItem(videoConverterFolderStorageKey, safePath);
        } catch (error) {}
        updateVideoConverterFolderLabel();
        return true;
    }

    function ensureVideoConverterFolder(folderPath) {
        if (!folderPath) return false;
        try {
            const fs = require("fs");
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
            return fs.existsSync(folderPath);
        } catch (error) {
            return false;
        }
    }

    function updateVideoConverterFolderLabel() {
        const folder = getVideoConverterOutputFolder();
        const display = normalizeVideoConverterPath(folder || "Choose output folder");
        const label = document.getElementById("videoConverterFolderPath");
        if (label) {
            label.textContent = display;
            label.title = display;
        }
        const button = document.getElementById("btnVideoConverterChooseFolder");
        if (button) button.title = "Folder: " + display;
    }

    function selectVideoConverterFolderNative(title, callback) {
        let childProcess;
        try {
            childProcess = require("child_process");
        } catch (error) {
            callback("");
            return;
        }
        const safeTitle = String(title || "Select Folder").replace(/"/g, "`\"");
        const script = [
            "$code = @\"",
            "using System;",
            "using System.Runtime.InteropServices;",
            "[ComImport, Guid(\"DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7\")]",
            "public class FileOpenDialog {}",
            "[ComImport, Guid(\"42f85136-db7e-439c-85f1-e4075d135fc8\"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]",
            "public interface IFileOpenDialog {",
            "    [PreserveSig] int Show(IntPtr parent);",
            "    void SetFileTypes(uint cFileTypes, IntPtr rgFilterSpec);",
            "    void SetFileTypeIndex(uint iFileType);",
            "    void GetFileTypeIndex(out uint piFileType);",
            "    void Advise(IntPtr pfde, out uint pdwCookie);",
            "    void Unadvise(uint dwCookie);",
            "    void SetOptions(uint fos);",
            "    void GetOptions(out uint fos);",
            "    void SetDefaultFolder(IntPtr psi);",
            "    void SetFolder(IntPtr psi);",
            "    void GetFolder(out IntPtr ppsi);",
            "    void GetCurrentSelection(out IntPtr ppsi);",
            "    void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName);",
            "    void GetFileName(out IntPtr pszName);",
            "    void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle);",
            "    void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText);",
            "    void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel);",
            "    void GetResult(out IShellItem ppsi);",
            "    void AddPlace(IntPtr psi, int fdap);",
            "    void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string pszDefaultExtension);",
            "    void Close(int hr);",
            "    void SetClientGuid(ref Guid guid);",
            "    void ClearClientData();",
            "    void SetFilter(IntPtr pFilter);",
            "    void GetResults(out IntPtr ppenum);",
            "    void GetSelectedItems(out IntPtr ppsai);",
            "}",
            "[ComImport, Guid(\"43826D1E-E718-42EE-BC55-A1E261C37BFE\"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]",
            "public interface IShellItem {",
            "    void BindToHandler(IntPtr pbc, ref Guid bhid, ref Guid riid, out IntPtr ppv);",
            "    void GetParent(out IntPtr ppsi);",
            "    void GetDisplayName(uint sigdnName, out IntPtr ppszName);",
            "    void GetAttributes(uint sfgaoMask, out uint psfgaoAttribs);",
            "    void Compare(IShellItem psi, uint hint, out int piOrder);",
            "}",
            "public class NativeFolderPicker {",
            "    public static string PickFolder() {",
            "        IFileOpenDialog dialog = (IFileOpenDialog)new FileOpenDialog();",
            "        uint options;",
            "        dialog.GetOptions(out options);",
            "        dialog.SetOptions(options | 0x20 | 0x40 | 0x800);",
            "        dialog.SetTitle(\"" + safeTitle + "\");",
            "        dialog.SetOkButtonLabel(\"Select Folder\");",
            "        if (dialog.Show(IntPtr.Zero) != 0) return \"\";",
            "        IShellItem item;",
            "        dialog.GetResult(out item);",
            "        IntPtr pathPtr;",
            "        item.GetDisplayName(0x80058000, out pathPtr);",
            "        string path = Marshal.PtrToStringUni(pathPtr);",
            "        Marshal.FreeCoTaskMem(pathPtr);",
            "        return path;",
            "    }",
            "}",
            "\"@",
            "Add-Type -TypeDefinition $code",
            "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
            "[NativeFolderPicker]::PickFolder()"
        ].join("\n");
        childProcess.execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-STA", "-Command", script], {
            windowsHide: true
        }, (err, stdout) => {
            if (err) {
                callback("");
                return;
            }
            callback(normalizeVideoConverterPath(String(stdout || "").replace(/[\r\n]+$/g, "")));
        });
    }

    function chooseVideoConverterOutputFolder() {
        openAppleFolderDialog("Choose MP4 Output Folder", getVideoConverterOutputFolder(), (folder) => {
            if (!folder) return;
            if (!ensureVideoConverterFolder(folder)) {
                setAppleStatus("Selected output folder cannot be used.", true);
                return;
            }
            saveVideoConverterOutputFolder(folder);
            setAppleStatus("Video output folder saved.", false);
        });
    }

    function clearVideoConverterTimer() {
        if (videoConverterState.progressTimer) {
            window.clearInterval(videoConverterState.progressTimer);
            videoConverterState.progressTimer = null;
        }
    }

    function startVideoConverterSmoothProgress() {
        clearVideoConverterTimer();
        let soft = 7;
        setVideoConverterProgress(soft, "Converting MP4");
        videoConverterState.progressTimer = window.setInterval(() => {
            if (!videoConverterState.busy) return;
            soft = Math.min(92, soft + Math.max(1, (96 - soft) * 0.07));
            setVideoConverterProgress(soft, "Converting MP4");
        }, 350);
    }

    function clearVideoConverterOutput() {
        videoConverterState.outputPath = "";
        videoConverterState.outputName = "";
        const stack = document.getElementById("videoConverterOutput");
        const row = document.getElementById("videoConverterOutputRow");
        if (stack) stack.classList.remove("active");
        if (row) row.classList.remove("active");
    }

    function setVideoConverterSource(filePath) {
        const safePath = String(filePath || "").trim();
        if (!safePath) return;
        videoConverterState.sourcePath = safePath;
        videoConverterState.sourceName = audioCleanerBasename(safePath) || "Selected video";
        const title = document.getElementById("videoConverterDropTitle");
        const hint = document.getElementById("videoConverterDropHint");
        if (title) title.textContent = videoConverterState.sourceName;
        if (hint) hint.textContent = "Ready for AE-compatible MP4 conversion";
        clearVideoConverterOutput();
        setVideoConverterProgress(0, "Ready");
        setAppleStatus("Video selected: " + videoConverterState.sourceName, false);
    }

    function getVideoConverterOutputPath() {
        let path;
        try {
            path = require("path");
        } catch (error) {
            return "";
        }
        const dir = getVideoConverterOutputFolder();
        if (!ensureVideoConverterFolder(dir)) return "";
        return path.join(dir, audioCleanerSafeName(videoConverterState.sourceName) + "_ae_" + Date.now() + ".mp4");
    }

    function showVideoConverterOutput(filePath) {
        videoConverterState.outputPath = filePath;
        videoConverterState.outputName = audioCleanerBasename(filePath) || "converted.mp4";
        const stack = document.getElementById("videoConverterOutput");
        const row = document.getElementById("videoConverterOutputRow");
        if (stack) stack.classList.add("active");
        if (row) row.classList.add("active");
    }

    function isVideoConverterAudioOnlySource(filePath) {
        return /\.(mp3|wav|m4a|aac|flac|ogg|aif|aiff)(?:[?#].*)?$/i.test(String(filePath || ""));
    }

    function buildVideoConverterArgs(sourcePath, partialPath) {
        if (isVideoConverterAudioOnlySource(sourcePath)) {
            return [
                "-hide_banner",
                "-y",
                "-f", "lavfi",
                "-i", "color=c=black:s=1920x1080:r=30",
                "-i", sourcePath,
                "-map", "0:v:0",
                "-map", "1:a:0",
                "-shortest",
                "-sn",
                "-dn",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "20",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                partialPath
            ];
        }

        return [
            "-hide_banner",
            "-y",
            "-i", sourcePath,
            "-map", "0:v:0",
            "-map", "0:a?",
            "-sn",
            "-dn",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            partialPath
        ];
    }

    function runVideoConverter() {
        if (videoConverterState.busy) return;
        if (!videoConverterState.sourcePath) {
            setAppleStatus("Drop or select a video file first.", true);
            return;
        }
        if (typeof require !== "function") {
            setAppleStatus("Node.js CEP is not enabled. Reload the extension.", true);
            return;
        }

        let childProcess, fs;
        try {
            childProcess = require("child_process");
            fs = require("fs");
        } catch (error) {
            setAppleStatus("Node modules are unavailable in CEP.", true);
            return;
        }
        if (!fs.existsSync(videoConverterState.sourcePath)) {
            setAppleStatus("Selected video file was not found.", true);
            return;
        }

        const outputPath = getVideoConverterOutputPath();
        if (!outputPath) {
            setAppleStatus("Could not create MP4 output path.", true);
            return;
        }
        const partialPath = outputPath + ".part.mp4";
        try { if (fs.existsSync(partialPath)) fs.unlinkSync(partialPath); } catch (cleanupErr) {}

        let duration = 0;
        const args = buildVideoConverterArgs(videoConverterState.sourcePath, partialPath);

        setVideoConverterBusy(true);
        startVideoConverterSmoothProgress();
        setAppleStatus("Converting " + videoConverterState.sourceName + " to compatible MP4...", false);
        const proc = childProcess.spawn(getFfmpegExecutable(), args, { windowsHide: true });
        let log = "";
        proc.stderr.on("data", (chunk) => {
            const text = String(chunk || "");
            log += text;
            const detectedDuration = parseFfmpegDuration(text);
            if (detectedDuration) duration = detectedDuration;
            const currentTime = parseFfmpegTime(text);
            if (duration && currentTime) {
                setVideoConverterProgress(Math.min(96, (currentTime / duration) * 100), "Converting MP4");
            }
        });
        proc.on("error", (error) => {
            clearVideoConverterTimer();
            setVideoConverterBusy(false);
            setVideoConverterProgress(0, "Failed");
            setAppleStatus("FFmpeg failed: " + (error && error.message ? error.message : "Could not start."), true);
        });
        proc.on("close", (code) => {
            clearVideoConverterTimer();
            setVideoConverterBusy(false);
            if (code !== 0 || !fs.existsSync(partialPath)) {
                try { if (fs.existsSync(partialPath)) fs.unlinkSync(partialPath); } catch (cleanupErr) {}
                const detail = String(log || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "Check the video codec or FFmpeg.";
                setVideoConverterProgress(0, "Failed");
                setAppleStatus("MP4 conversion failed: " + detail.substring(0, 150), true);
                return;
            }
            try {
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                fs.renameSync(partialPath, outputPath);
            } catch (finalizeErr) {
                setVideoConverterProgress(0, "Failed");
                setAppleStatus("MP4 conversion failed while saving output.", true);
                return;
            }
            showVideoConverterOutput(outputPath);
            setVideoConverterProgress(100, "MP4 ready");
            setAppleStatus("MP4 exported: " + videoConverterState.outputName + ". Import to comp when ready.", false);
        });
    }

    function importVideoConverterOutput() {
        if (!videoConverterState.outputPath) {
            setAppleStatus("No MP4 export is ready.", true);
            return;
        }
        setAppleStatus("Importing " + videoConverterState.outputName + " to comp...", false);
        csInterface.evalScript("toolkit.importConvertedVideoAsset('" + escapeScriptString(videoConverterState.outputPath) + "')", function(res) {
            if (!res || res.indexOf("error::") === 0) {
                setAppleStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "MP4 import failed.", true);
                return;
            }
            setAppleStatus(res.indexOf("success::") === 0 ? res.substring(9) : "MP4 imported.", false);
        });
    }

    function deleteVideoConverterOutput() {
        if (!videoConverterState.outputPath) return;
        const oldName = videoConverterState.outputName || "MP4";
        try {
            const fs = require("fs");
            if (fs.existsSync(videoConverterState.outputPath)) fs.unlinkSync(videoConverterState.outputPath);
        } catch (error) {
            setAppleStatus("Could not delete MP4: " + (error && error.message ? error.message : "Unknown error."), true);
            return;
        }
        clearVideoConverterOutput();
        setVideoConverterProgress(0, "Ready");
        setAppleStatus(oldName + " export deleted.", false);
    }

    function initVideoConverterPanel() {
        const shell = document.getElementById("appleVideoConverterShell");
        const toggle = document.getElementById("appleVideoConverterToggle");
        const dropzone = document.getElementById("videoConverterDropzone");
        const fileInput = document.getElementById("videoConverterFileInput");
        const selectBtn = document.getElementById("btnVideoConverterSelect");
        const convertBtn = document.getElementById("btnVideoConvert");
        const importBtn = document.getElementById("btnVideoConverterImport");
        const deleteBtn = document.getElementById("btnVideoConverterDelete");
        const folderBtn = document.getElementById("btnVideoConverterChooseFolder");

        function setPanelOpen(isOpen) {
            if (!shell) return;
            shell.classList.toggle("collapsed", !isOpen);
            if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }

        if (shell && toggle && !toggle.__videoConverterToggleBound) {
            toggle.__videoConverterToggleBound = true;
            toggle.onclick = () => setPanelOpen(shell.classList.contains("collapsed"));
            toggle.onkeydown = (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setPanelOpen(shell.classList.contains("collapsed"));
            };
            setPanelOpen(false);
        }
        if (selectBtn && fileInput) selectBtn.onclick = (event) => {
            event.stopPropagation();
            fileInput.value = "";
            fileInput.click();
        };
        if (dropzone && fileInput) {
            dropzone.onclick = () => {
                fileInput.value = "";
                fileInput.click();
            };
            dropzone.onkeydown = (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                fileInput.value = "";
                fileInput.click();
            };
            ["dragenter", "dragover"].forEach((name) => {
                dropzone.addEventListener(name, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.add("is-dragging");
                });
            });
            ["dragleave", "drop"].forEach((name) => {
                dropzone.addEventListener(name, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.remove("is-dragging");
                });
            });
            dropzone.addEventListener("drop", (event) => {
                const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
                setVideoConverterSource(file && (file.path || file.name));
            });
            fileInput.onchange = () => {
                const file = fileInput.files && fileInput.files[0];
                setVideoConverterSource(file && (file.path || file.name));
                fileInput.value = "";
            };
        }
        if (convertBtn) convertBtn.onclick = runVideoConverter;
        if (importBtn) importBtn.onclick = importVideoConverterOutput;
        if (deleteBtn) deleteBtn.onclick = deleteVideoConverterOutput;
        if (folderBtn) folderBtn.onclick = (event) => {
            event.stopPropagation();
            chooseVideoConverterOutputFolder();
        };
        updateVideoConverterFolderLabel();
    }

    function configureAppleExtrusion() {
        openAppleSettings("extrusion");
    }

    function configureAppleNumberCounter() {
        openAppleSettings("number");
    }

    function createAppleSettingsField(id, label, value, type, options) {
        const field = document.createElement("div");
        field.className = "apple-settings-field";
        const labelEl = document.createElement("label");
        labelEl.className = "apple-settings-label";
        labelEl.setAttribute("for", id);
        labelEl.textContent = label;
        let input;
        if (type === "select") {
            input = document.createElement("select");
            input.className = "apple-settings-select";
            (options || []).forEach((option) => {
                const opt = document.createElement("option");
                opt.value = option.value;
                opt.textContent = option.label;
                input.appendChild(opt);
            });
        } else {
            input = document.createElement("input");
            input.className = "apple-settings-input";
            input.type = "text";
            if (type === "number") input.inputMode = "numeric";
        }
        input.id = id;
        input.value = String(value == null ? "" : value);
        field.appendChild(labelEl);
        field.appendChild(input);
        return field;
    }

    function setAppleSettingsOpen(isOpen) {
        const overlay = document.getElementById("appleSettingsOverlay");
        if (!overlay) return;
        overlay.classList.toggle("active", !!isOpen);
        overlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }

    function openAppleSettings(kind) {
        const title = document.getElementById("appleSettingsTitle");
        const body = document.getElementById("appleSettingsBody");
        const save = document.getElementById("btnAppleSettingsSave");
        if (!title || !body || !save) return;
        body.innerHTML = "";
        save.__appleSettingsKind = kind;

        if (kind === "carousel") {
            title.textContent = "Orbit Settings";
            body.appendChild(createAppleSettingsField("appleSettingCarouselMode", "Mode", appleActionSettings.carouselMode, "select", [
                { value: "2d", label: "2D" },
                { value: "3d", label: "3D" }
            ]));
        } else if (kind === "extrusion") {
            title.textContent = "3D Extruder Settings";
            body.appendChild(createAppleSettingsField("appleSettingExtrusionDepth", "Depth", appleActionSettings.extrusionDepth, "number"));
        } else {
            title.textContent = "Value Settings";
            body.appendChild(createAppleSettingsField("appleSettingNumberPrefix", "Before", appleActionSettings.numberPrefix, "text"));
            body.appendChild(createAppleSettingsField("appleSettingNumberSuffix", "After", appleActionSettings.numberSuffix, "text"));
        }

        setAppleSettingsOpen(true);
        const firstField = body.querySelector("input, select");
        if (firstField) firstField.focus();
    }

    function saveAppleSettings() {
        const save = document.getElementById("btnAppleSettingsSave");
        const kind = save ? save.__appleSettingsKind : "";
        if (kind === "carousel") {
            const modeInput = document.getElementById("appleSettingCarouselMode");
            const safeMode = String(modeInput ? modeInput.value : "2d").toLowerCase();
            appleActionSettings.carouselMode = safeMode === "3d" ? "3d" : "2d";
            appleActionSettings.carouselCount = 0;
            setAppleStatus("Orbit settings ready: " + appleActionSettings.carouselMode + ".", false);
        } else if (kind === "extrusion") {
            const depthInput = document.getElementById("appleSettingExtrusionDepth");
            appleActionSettings.extrusionDepth = Math.max(1, Math.min(200, parseInt(depthInput ? depthInput.value : "20", 10) || 20));
            setAppleStatus("3D Extruder depth " + appleActionSettings.extrusionDepth + " set.", false);
        } else if (kind === "number") {
            const prefixInput = document.getElementById("appleSettingNumberPrefix");
            const suffixInput = document.getElementById("appleSettingNumberSuffix");
            appleActionSettings.numberFormat = "plain";
            appleActionSettings.numberPrefix = prefixInput ? String(prefixInput.value || "") : "";
            appleActionSettings.numberSuffix = suffixInput ? String(suffixInput.value || "") : "";
            setAppleStatus("Value Counter settings ready.", false);
        }
        setAppleSettingsOpen(false);
    }

    function initAppleSettingsModal() {
        const overlay = document.getElementById("appleSettingsOverlay");
        const close = document.getElementById("btnAppleSettingsClose");
        const cancel = document.getElementById("btnAppleSettingsCancel");
        const save = document.getElementById("btnAppleSettingsSave");
        if (close) close.onclick = () => setAppleSettingsOpen(false);
        if (cancel) cancel.onclick = () => setAppleSettingsOpen(false);
        if (save) save.onclick = saveAppleSettings;
        if (overlay && !overlay.__appleSettingsBound) {
            overlay.__appleSettingsBound = true;
            overlay.onclick = (event) => {
                if (event.target === overlay) setAppleSettingsOpen(false);
            };
        }
    }

    function initAppleActionTools() {
        const extrusion = document.getElementById("btnAppleExtrusion");
        const extrusionSettings = document.getElementById("btnAppleExtrusionSettings");
        const numberCounter = document.getElementById("btnAppleNumberCounter");
        const numberSettings = document.getElementById("btnAppleNumberSettings");
        const silenceDetect = document.getElementById("btnAppleSilenceDetect");
        if (extrusion) extrusion.onclick = runAppleExtrusion;
        if (extrusionSettings) extrusionSettings.onclick = configureAppleExtrusion;
        if (numberCounter) numberCounter.onclick = runAppleNumberCounter;
        if (numberSettings) numberSettings.onclick = configureAppleNumberCounter;
        if (silenceDetect) silenceDetect.onclick = detectAppleSilence;
        initAppleSettingsModal();
    }

    function initAppleSilencePanel() {
        const shell = document.getElementById("appleSilenceShell");
        const toggle = document.getElementById("appleSilenceToggle");
        const folderBtn = document.getElementById("btnSilenceChooseFolder");
        if (!shell || !toggle || toggle.__appleSilenceToggleBound) return;

        function setSilencePanelOpen(isOpen) {
            shell.classList.toggle("collapsed", !isOpen);
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }

        toggle.__appleSilenceToggleBound = true;
        toggle.onclick = () => setSilencePanelOpen(shell.classList.contains("collapsed"));
        toggle.onkeydown = (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            setSilencePanelOpen(shell.classList.contains("collapsed"));
        };
        setSilencePanelOpen(false);
        if (folderBtn) folderBtn.onclick = (event) => {
            event.stopPropagation();
            chooseSilenceOutputFolder();
        };
        updateSilenceFolderLabel();
    }

    function initAppleBeatPanel() {
        const shell = document.getElementById("appleBeatShell");
        const toggle = document.getElementById("appleBeatToggle");
        const refreshMini = document.getElementById("btnRefreshBeatLayersMini");
        if (refreshMini && !refreshMini.__beatRefreshMiniBound) {
            refreshMini.__beatRefreshMiniBound = true;
            refreshMini.onclick = refreshBeatAudioLayers;
        }
        if (!shell || !toggle || toggle.__appleBeatToggleBound) return;

        function setBeatPanelOpen(isOpen) {
            shell.classList.toggle("collapsed", !isOpen);
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
            if (isOpen) refreshBeatAudioLayers();
        }

        toggle.__appleBeatToggleBound = true;
        toggle.onclick = () => setBeatPanelOpen(shell.classList.contains("collapsed"));
        toggle.onkeydown = (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            setBeatPanelOpen(shell.classList.contains("collapsed"));
        };
        setBeatPanelOpen(false);
    }

    function renderTrimPackDock() {
        const list = document.getElementById("trimpackActionList");
        if (!list || list.childNodes.length) return;
        trimPackActions.forEach((action) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "trimpack-action trimpack-tone-" + action.tone;
            button.setAttribute("data-trim-action", action.id);
            button.setAttribute("title", action.title + " | Alt = reverse | Shift = offset");
            button.innerHTML = '<span class="trimpack-action-top">' + action.top + '</span><span class="trimpack-action-bottom">' + action.bottom + '</span>';
            button.onclick = (evt) => runTrimPackAction(action, evt);
            list.appendChild(button);
        });
    }

    function runTrimPackAction(action, evt) {
        if (!action || !action.id) return;
        const title = action.title || "Trim Pack";
        setAppleStatus("Running " + title + "...", false);
        csInterface.evalScript(
            "toolkit.applyTrimPackAction('" + escapeScriptString(action.id) + "', " + (!!(evt && evt.altKey) ? "true" : "false") + ", " + (!!(evt && evt.shiftKey) ? "true" : "false") + ")",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setAppleStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Trim Pack action did not run.", true);
                    return;
                }
                setAppleStatus(res.indexOf("success::") === 0 ? res.substring(9) : title + " complete.", false);
            }
        );
    }

    function initTrimPackDock() {
        const dock = document.getElementById("trimpackDock");
        const toggle = document.getElementById("trimpackToggle");
        const mainWrapper = document.querySelector(".main-wrapper");
        const scrollShell = document.getElementById("trimpackScrollShell");
        const scrollUp = document.getElementById("trimpackScrollUp");
        const scrollDown = document.getElementById("trimpackScrollDown");
        if (!dock || !toggle) return;
        const setTrimPackOpen = (isOpen) => {
            dock.classList.toggle("open", !!isOpen);
            if (mainWrapper) mainWrapper.classList.toggle("trimpack-open", !!isOpen);
        };
        renderTrimPackDock();
        layoutTrimPackDock();
        toggle.onclick = (evt) => {
            if (evt) evt.stopPropagation();
            setTrimPackOpen(!dock.classList.contains("open"));
        };
        if (scrollUp && scrollShell) {
            scrollUp.onclick = () => {
                scrollShell.scrollTop = Math.max(0, scrollShell.scrollTop - 84);
            };
        }
        if (scrollDown && scrollShell) {
            scrollDown.onclick = () => {
                scrollShell.scrollTop = scrollShell.scrollTop + 84;
            };
        }
        document.addEventListener("click", (evt) => {
            if (!dock.classList.contains("open")) return;
            if (dock.contains(evt.target)) return;
            setTrimPackOpen(false);
        });
        window.addEventListener("resize", layoutTrimPackDock);
    }

    function setDonationModalOpen(isOpen) {
        const modal = document.getElementById("donationModal");
        if (!modal) return;
        modal.classList.toggle("active", !!isOpen);
        modal.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }

    function initDonationModal() {
        const openBtn = document.getElementById("btnDonation");
        const closeBtn = document.getElementById("btnDonationClose");
        const modal = document.getElementById("donationModal");
        if (openBtn) openBtn.onclick = () => setDonationModalOpen(true);
        if (closeBtn) closeBtn.onclick = () => setDonationModalOpen(false);
        if (modal && !modal.__donationBound) {
            modal.__donationBound = true;
            modal.onclick = (event) => {
                if (event.target === modal) setDonationModalOpen(false);
            };
        }
    }

    function initLiquidGlassPanel() {
        const buttons = document.querySelectorAll("[data-liquid-shape]");
        if (!buttons.length) return;
        const shell = document.getElementById("appleLiquidShell");
        const toggle = document.getElementById("appleLiquidToggle");
        const widthNumber = document.getElementById("appleWidthNumber");
        const heightNumber = document.getElementById("appleHeightNumber");
        const live = document.getElementById("appleSizeLive");

        function setLiquidPanelOpen(isOpen) {
            if (!shell) return;
            shell.classList.toggle("collapsed", !isOpen);
            if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }

        if (shell && toggle && !toggle.__appleLiquidToggleBound) {
            toggle.__appleLiquidToggleBound = true;
            toggle.onclick = () => setLiquidPanelOpen(shell.classList.contains("collapsed"));
            toggle.onkeydown = (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setLiquidPanelOpen(shell.classList.contains("collapsed"));
            };
            setLiquidPanelOpen(false);
        }

        if (widthNumber) {
            const syncWidth = (value) => syncAppleSizeInput(widthNumber, live, value, 500);
            widthNumber.oninput = () => syncWidth(widthNumber.value);
            widthNumber.onchange = () => syncWidth(widthNumber.value);
            bindAppleSizeDrag(widthNumber, live, 500);
        }
        if (heightNumber) {
            const syncHeight = (value) => syncAppleSizeInput(heightNumber, live, value, 400);
            heightNumber.oninput = () => syncHeight(heightNumber.value);
            heightNumber.onchange = () => syncHeight(heightNumber.value);
            bindAppleSizeDrag(heightNumber, live, 400);
        }
        if (widthNumber && heightNumber) {
            syncAppleSizeInput(widthNumber, live, widthNumber.value, 500);
            syncAppleSizeInput(heightNumber, live, heightNumber.value, 400);
        }
        buttons.forEach((button) => {
            button.onclick = () => buildLiquidGlass(button.getAttribute("data-liquid-shape"));
        });
        const liquidAepBtn = document.getElementById("btnAppleLiquidAep");
        if (liquidAepBtn) liquidAepBtn.onclick = buildLiquidGlassFromAep;
        initAppleActionTools();
        initAppleBeatPanel();
        initAppleSilencePanel();
        initAudioCleanerPanel();
        initMp3ConverterPanel();
        initVideoConverterPanel();
        initTrimPackDock();
    }

    function escapeScriptString(value) {
        return String(value)
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n");
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function wrapHue(value) {
        let hue = value % 360;
        if (hue < 0) hue += 360;
        return hue;
    }

    function hsvToRgb(h, s, v) {
        const hh = wrapHue(h);
        const ss = clamp(s, 0, 100) / 100;
        const vv = clamp(v, 0, 100) / 100;
        const c = vv * ss;
        const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
        const m = vv - c;
        let r = 0, g = 0, b = 0;
        if (hh < 60) { r = c; g = x; }
        else if (hh < 120) { r = x; g = c; }
        else if (hh < 180) { g = c; b = x; }
        else if (hh < 240) { g = x; b = c; }
        else if (hh < 300) { r = x; b = c; }
        else { r = c; b = x; }
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }

    function rgbToHex(rgb) {
        return "#" + rgb.map(value => value.toString(16).padStart(2, "0")).join("").toUpperCase();
    }

    function interpolateRgb(startRgb, endRgb, amount) {
        return [
            Math.round(startRgb[0] + ((endRgb[0] - startRgb[0]) * amount)),
            Math.round(startRgb[1] + ((endRgb[1] - startRgb[1]) * amount)),
            Math.round(startRgb[2] + ((endRgb[2] - startRgb[2]) * amount))
        ];
    }

    function hexToRgb(hex) {
        const clean = String(hex || "").trim().replace("#", "");
        if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
        return [
            parseInt(clean.substring(0, 2), 16),
            parseInt(clean.substring(2, 4), 16),
            parseInt(clean.substring(4, 6), 16)
        ];
    }

    function rgbToHsv(rgb) {
        const r = rgb[0] / 255;
        const g = rgb[1] / 255;
        const b = rgb[2] / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let h = 0;
        if (delta !== 0) {
            if (max === r) h = 60 * (((g - b) / delta) % 6);
            else if (max === g) h = 60 * (((b - r) / delta) + 2);
            else h = 60 * (((r - g) / delta) + 4);
        }
        return {
            h: wrapHue(h),
            s: max === 0 ? 0 : (delta / max) * 100,
            v: max * 100
        };
    }

    let pasteButtonResetTimer = null;
    let quickPasteArmed = false;

    function setPasteStatus(message, isError) {
        const status = document.getElementById("pasteImageStatus");
        if (status) {
            status.textContent = message;
            status.style.color = isError ? "#ff6666" : "#777";
        }
        const button = document.getElementById("btnQuickPasteImage");
        if (!button) return;
        button.textContent = message || "Copy Paste";
        button.style.color = isError ? "#ff8a8a" : "";
        if (pasteButtonResetTimer) {
            window.clearTimeout(pasteButtonResetTimer);
            pasteButtonResetTimer = null;
        }
        if (message === "Copy Paste") return;
        pasteButtonResetTimer = window.setTimeout(() => {
            button.textContent = "Copy Paste";
            button.style.color = "";
        }, isError ? 2200 : 1600);
    }

    function getClipboardTempFolder() {
        const userData = csInterface.getSystemPath(SystemPath.USER_DATA) || "";
        return (userData.replace(/\\/g, "/") + "/KeshavWithVelo/clipboard");
    }

    function getImageExtension(type) {
        if (type === "image/jpeg") return "jpg";
        if (type === "image/webp") return "webp";
        if (type === "image/gif") return "gif";
        if (type === "image/bmp") return "bmp";
        return "png";
    }

    function ensureClipboardFolder() {
        const folder = getClipboardTempFolder();
        if (window.cep && window.cep.fs) {
            const userData = (csInterface.getSystemPath(SystemPath.USER_DATA) || "").replace(/\\/g, "/");
            window.cep.fs.makedir(userData + "/KeshavWithVelo");
            window.cep.fs.makedir(folder);
        }
        return folder;
    }

    function dataUrlToBase64(dataUrl) {
        const parts = String(dataUrl || "").split(",");
        return parts.length > 1 ? parts[1] : "";
    }

    function writeClipboardImageFile(dataUrl, mimeType) {
        const folder = ensureClipboardFolder();
        const ext = getImageExtension(mimeType);
        const filePath = folder + "/paste_" + Date.now() + "." + ext;
        const base64Data = dataUrlToBase64(dataUrl);
        if (!base64Data) return { ok: false, error: "Clipboard image data was empty." };
        const result = window.cep.fs.writeFile(filePath, base64Data, cep.encoding.Base64);
        if (!result || result.err !== 0) return { ok: false, error: "Could not save clipboard image." };
        return { ok: true, path: filePath.replace(/\\/g, "/") };
    }

    function blobToDataUrl(blob, callback) {
        const reader = new FileReader();
        reader.onload = function() { callback(null, reader.result); };
        reader.onerror = function() { callback("Could not read clipboard image."); };
        reader.readAsDataURL(blob);
    }

    function importClipboardImageFile(filePath) {
        setPasteStatus("Importing...", false);
        csInterface.evalScript(
            "toolkit.importPastedImage('" + escapeScriptString(filePath) + "')",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setPasteStatus("Import Failed", true);
                    return;
                }
                quickPasteArmed = false;
                setPasteStatus("Imported", false);
            }
        );
    }

    function saveAndImportClipboardImage(dataUrl, mimeType) {
        const saved = writeClipboardImageFile(dataUrl, mimeType);
        if (!saved.ok) {
            setPasteStatus("Save Failed", true);
            return;
        }
        importClipboardImageFile(saved.path);
    }

    function handleClipboardBlob(blob, mimeType) {
        setPasteStatus("Saving...", false);
        blobToDataUrl(blob, function(error, dataUrl) {
            if (error) {
                setPasteStatus("Read Failed", true);
                return;
            }
            saveAndImportClipboardImage(dataUrl, mimeType || blob.type || "image/png");
        });
    }

    function extractImageFromHtml(html) {
        const match = String(html || "").match(/src=["'](data:image\/[^"']+)["']/i);
        return match ? match[1] : "";
    }

    function handleClipboardData(clipboardData) {
        if (!clipboardData) {
            setPasteStatus("Clipboard Error", true);
            return;
        }

        const items = clipboardData.items || [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item && item.kind === "file" && item.type.indexOf("image/") === 0) {
                const blob = item.getAsFile();
                if (blob) {
                    handleClipboardBlob(blob, item.type);
                    return;
                }
            }
        }

        const htmlData = clipboardData.getData ? clipboardData.getData("text/html") : "";
        const htmlImage = extractImageFromHtml(htmlData);
        if (htmlImage) {
            saveAndImportClipboardImage(htmlImage, htmlImage.substring(5, htmlImage.indexOf(";")) || "image/png");
            return;
        }

        quickPasteArmed = false;
        setPasteStatus("No Image", true);
    }

    function pasteFromNavigatorClipboard() {
        if (!navigator.clipboard || !navigator.clipboard.read) {
            quickPasteArmed = true;
            setPasteStatus("Press Ctrl+V now", false);
            return;
        }

        setPasteStatus("Reading...", false);
        navigator.clipboard.read().then(items => {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                let imageType = "";
                for (let j = 0; j < item.types.length; j++) {
                    if (item.types[j].indexOf("image/") === 0) {
                        imageType = item.types[j];
                        break;
                    }
                }
                if (imageType) {
                    item.getType(imageType).then(blob => handleClipboardBlob(blob, imageType), () => {
                        setPasteStatus("Open Failed", true);
                    });
                    return;
                }
            }
            setPasteStatus("No Image", true);
        }).catch(() => {
            quickPasteArmed = true;
            setPasteStatus("Press Ctrl+V now", false);
        });
    }

    function setCocoStatus(message, isError) {
        const status = document.getElementById("cocoStatus");
        if (!status) return;
        status.textContent = message;
        status.style.color = isError ? "#ff6666" : "#777";
    }

    function roundGraphValue(value) {
        return Math.round(value * 1000) / 1000;
    }

    function getGraphPlotSize() {
        return graphBounds.size - (graphBounds.pad * 2);
    }

    function getGraphX(value) {
        return graphBounds.pad + (clamp(value, 0, 1) * getGraphPlotSize());
    }

    function getGraphStartYValue() {
        return 0;
    }

    function getGraphEndYValue() {
        return 1;
    }

    function getDefaultGraphCurve() {
        return graphState.mode === "speed"
            ? { x1: graphSpeedDefaults.x1, y1: graphSpeedDefaults.y1, x2: graphSpeedDefaults.x2, y2: graphSpeedDefaults.y2 }
            : { x1: graphDefaults.x1, y1: graphDefaults.y1, x2: graphDefaults.x2, y2: graphDefaults.y2 };
    }

    function getGraphDefaultPresetDefinitions(type) {
        const speed = [
            { title: "Speed Burst", curve: { x1: 0.14, y1: 0, x2: 0.46, y2: 0 } },
            { title: "Speed Glide", curve: { x1: 0.18, y1: 0.86, x2: 0.82, y2: 0.86 } },
            { title: "Fast Out", curve: { x1: 0.10, y1: 0.98, x2: 0.56, y2: 0.28 } },
            { title: "Fast In", curve: { x1: 0.44, y1: 0.28, x2: 0.92, y2: 0.98 } },
            { title: "Punch Peak", curve: { x1: 0.22, y1: 1.00, x2: 0.55, y2: 1.00 } },
            { title: "Soft Coast", curve: { x1: 0.30, y1: 0.62, x2: 0.78, y2: 0.48 } },
            { title: "Whip", curve: { x1: 0.07, y1: 1.00, x2: 0.36, y2: 0.72 } },
            { title: "Smooth Stop", curve: { x1: 0.54, y1: 0.74, x2: 0.94, y2: 1.00 } }
        ];
        const value = [
            { title: "Ease Out", curve: { x1: 0.18, y1: 0.90, x2: 0.25, y2: 1.00 } },
            { title: "Ease In", curve: { x1: 0.72, y1: 0.00, x2: 0.84, y2: 0.12 } },
            { title: "Smooth", curve: { x1: 0.42, y1: 0.00, x2: 0.58, y2: 1.00 } },
            { title: "Snap", curve: { x1: 0.08, y1: 0.02, x2: 0.20, y2: 1.00 } },
            { title: "Heavy Out", curve: { x1: 0.22, y1: 0.02, x2: 0.34, y2: 1.00 } },
            { title: "Heavy In", curve: { x1: 0.68, y1: 0.00, x2: 0.88, y2: 0.96 } },
            { title: "Pop", curve: { x1: 0.18, y1: 0.00, x2: 0.18, y2: 1.00 } },
            { title: "Clean S", curve: { x1: 0.35, y1: 0.05, x2: 0.65, y2: 0.95 } }
        ];
        return type === "speed" ? speed : value;
    }

    function createDefaultGraphPresetSlots() {
        const slots = [];
        ["value", "speed"].forEach(function(type) {
            getGraphDefaultPresetDefinitions(type).forEach(function(definition, index) {
                slots.push({ id: type + "_preset" + (index + 1), title: definition.title, type: type, mode: type, curve: normalizeGraphCurve(definition.curve) });
            });
            for (let i = 1; i <= 2; i++) {
                slots.push({ id: type + "_slot" + i, title: type === "value" ? "Value Slot " + i : "Speed Slot " + i, type: type, mode: type, curve: null });
            }
        });
        return slots;
    }

    function normalizeGraphCurve(curve) {
        if (!curve) return null;
        const safeCurve = curve || graphDefaults;
        const normalized = {
            x1: roundGraphValue(clamp(safeCurve.x1, 0, 1)),
            y1: roundGraphValue(clamp(safeCurve.y1, 0, 1)),
            x2: roundGraphValue(clamp(safeCurve.x2, 0, 1)),
            y2: roundGraphValue(clamp(safeCurve.y2, 0, 1))
        };
        if (safeCurve.mode === "speed" || safeCurve.mode === "value") normalized.mode = safeCurve.mode;
        return normalized;
    }

    function getGraphPresetStorageFolder() {
        const userData = csInterface.getSystemPath(SystemPath.USER_DATA) || "";
        return (userData.replace(/\\/g, "/") + "/KeshavWithVelo");
    }

    function getAiHubStorageFilePath() {
        return getGraphPresetStorageFolder() + "/" + aiHubStorageFileName;
    }

    function readAiHubStorageFileData() {
        try {
            if (!(window.cep && window.cep.fs)) return "";
            const result = window.cep.fs.readFile(getAiHubStorageFilePath());
            if (!result || result.err !== 0 || !result.data) return "";
            return String(result.data || "");
        } catch (error) {
            return "";
        }
    }

    function persistAiHubStateToFile(state) {
        try {
            if (!(window.cep && window.cep.fs)) return false;
            ensureGraphPresetStorageFolder();
            const result = window.cep.fs.writeFile(getAiHubStorageFilePath(), JSON.stringify(state || buildAiHubDefaultState()));
            return !!(result && result.err === 0);
        } catch (error) {
            return false;
        }
    }

    function getVideoDownloaderPrefsFilePath() {
        return getGraphPresetStorageFolder() + "/" + videoDownloaderPrefsFileName;
    }

    function readVideoDownloaderPrefs() {
        try {
            if (window.cep && window.cep.fs) {
                const result = window.cep.fs.readFile(getVideoDownloaderPrefsFilePath());
                if (result && result.err === 0 && result.data) {
                    const parsed = JSON.parse(String(result.data || "{}"));
                    if (parsed && typeof parsed === "object") return parsed;
                }
            }
        } catch (error) {}
        try {
            const legacyValue = window.localStorage ? window.localStorage.getItem("kwv_video_downloader_cookies") : "";
            return legacyValue ? { cookies: legacyValue } : {};
        } catch (error) {
            return {};
        }
    }

    function persistVideoDownloaderPrefs(prefs) {
        const safePrefs = prefs && typeof prefs === "object" ? prefs : {};
        let saved = false;
        try {
            if (window.localStorage && typeof safePrefs.cookies === "string") {
                window.localStorage.setItem("kwv_video_downloader_cookies", safePrefs.cookies || "none");
                saved = true;
            }
        } catch (error) {}
        try {
            if (window.cep && window.cep.fs) {
                ensureGraphPresetStorageFolder();
                const result = window.cep.fs.writeFile(getVideoDownloaderPrefsFilePath(), JSON.stringify(safePrefs));
                saved = saved || !!(result && result.err === 0);
            }
        } catch (error) {}
        return saved;
    }

    function getGraphPresetStorageFilePath() {
        return getGraphPresetStorageFolder() + "/" + graphPresetStorageFileName;
    }

    function ensureGraphPresetStorageFolder() {
        if (!(window.cep && window.cep.fs)) return "";
        const folder = getGraphPresetStorageFolder();
        window.cep.fs.makedir(folder);
        return folder;
    }

    function readGraphPresetFileData() {
        try {
            if (!(window.cep && window.cep.fs)) return "";
            const filePath = getGraphPresetStorageFilePath();
            const result = window.cep.fs.readFile(filePath);
            if (!result || result.err !== 0 || !result.data) return "";
            return String(result.data || "");
        } catch (error) {
            return "";
        }
    }

    function readGraphPresetLegacyStorage() {
        try {
            if (!window.localStorage) return "";
            return window.localStorage.getItem(graphPresetStorageKey) || "";
        } catch (error) {
            return "";
        }
    }

    function applyGraphPresetPayload(defaults, raw) {
        if (!raw) return defaults;
        try {
            const saved = JSON.parse(raw);
            if (!saved || !saved.length) return defaults;
            for (let i = 0; i < saved.length; i++) {
                const item = saved[i];
                if (!item) continue;
                let target = defaults.find(function(slot) { return slot.id === item.id; });
                // Migrate the old shared slot1..slot8 format into the
                // correct independent Value/Speed collection.
                if (!target && /^slot[1-8]$/.test(String(item.id || ""))) {
                    const type = item.mode === "value" ? "value" : "speed";
                    target = defaults.find(function(slot) { return slot.id === type + "_" + item.id; });
                }
                if (!target) continue;
                target.curve = normalizeGraphCurve(item.curve);
                // The slot ID decides its collection. Never trust persisted
                // mode/type data enough to move a Value preset into Speed or
                // vice versa.
                target.mode = target.type;
            }
        } catch (error) {}
        return defaults;
    }

    function loadGraphPresetSlots() {
        const defaults = createDefaultGraphPresetSlots();
        const fileRaw = readGraphPresetFileData();
        if (fileRaw) return applyGraphPresetPayload(defaults, fileRaw);

        const legacyRaw = readGraphPresetLegacyStorage();
        const hydrated = applyGraphPresetPayload(defaults, legacyRaw);
        if (legacyRaw) persistGraphPresetSlots(hydrated);
        return hydrated;
    }

    function persistGraphPresetSlots(sourcePresets) {
        const presetsToSave = sourcePresets || graphPresets;
        try {
            const payload = presetsToSave.map(preset => ({
                id: preset.id,
                curve: preset.curve ? normalizeGraphCurve(Object.assign({}, preset.curve, { mode: preset.mode || graphState.mode })) : null,
                type: preset.type || preset.mode || graphState.mode,
                mode: preset.mode || preset.type || graphState.mode
            }));
            const json = JSON.stringify(payload);

            if (window.localStorage) {
                try {
                    window.localStorage.setItem(graphPresetStorageKey, json);
                } catch (storageError) {}
            }

            if (window.cep && window.cep.fs) {
                ensureGraphPresetStorageFolder();
                window.cep.fs.writeFile(getGraphPresetStorageFilePath(), json);
            }
        } catch (error) {}
    }

    function getGraphY(value) {
        return graphBounds.pad + ((1 - clamp(value, 0, 1)) * getGraphPlotSize());
    }

    function getGraphCurveShape(curve, size, pad, mode, forceBaseline) {
        const safeCurve = curve || graphDefaults;
        const plot = size - (pad * 2);
        const startX = pad;
        const valueDirection = mode === "value" && !forceBaseline && safeCurve.direction === -1 ? -1 : 1;
        const y1 = clamp(safeCurve.y1, 0, 1);
        const y2 = clamp(safeCurve.y2, 0, 1);
        const displayY1 = valueDirection < 0 ? 1 - y1 : y1;
        const displayY2 = valueDirection < 0 ? 1 - y2 : y2;
        // Value mode keeps its actual value endpoints. Speed mode uses the
        // fixed zero-speed baseline; its velocity is drawn between them.
        const startY = valueDirection < 0 ? pad : pad + plot;
        const endX = pad + plot;
        const endY = mode === "speed" || forceBaseline
            ? pad + plot
            : (valueDirection < 0 ? pad + plot : pad);
        const handle1X = pad + (clamp(safeCurve.x1, 0, 1) * plot);
        const handle1Y = pad + ((1 - displayY1) * plot);
        const handle2X = pad + (clamp(safeCurve.x2, 0, 1) * plot);
        const handle2Y = pad + ((1 - displayY2) * plot);
        if (mode === "speed") {
            // Temporal ease handles describe a value Bézier. The Speed Graph
            // is its derivative (dy/dx), so sample that derivative instead
            // of drawing the value curve itself. This produces the familiar
            // AE velocity peak even when both endpoint speeds are zero.
            const p1x = clamp(safeCurve.x1, 0, 1);
            const p2x = clamp(safeCurve.x2, 0, 1);
            const p1y = clamp(safeCurve.y1, 0, 1) / 3;
            const p2y = 1 - (clamp(safeCurve.y2, 0, 1) / 3);
            const samples = [];
            let maxSpeed = 0;
            for (let i = 0; i <= 64; i++) {
                const t = i / 64;
                const mt = 1 - t;
                const x = (3 * mt * mt * t * p1x) + (3 * mt * t * t * p2x) + (t * t * t);
                const y = (3 * mt * mt * t * p1y) + (3 * mt * t * t * p2y) + (t * t * t);
                const dx = (3 * mt * mt * p1x) + (6 * mt * t * (p2x - p1x)) + (3 * t * t * (1 - p2x));
                const dy = (3 * mt * mt * p1y) + (6 * mt * t * (p2y - p1y)) + (3 * t * t * (1 - p2y));
                const speed = Math.abs(dy / Math.max(0.0001, Math.abs(dx)));
                if (isFinite(speed)) maxSpeed = Math.max(maxSpeed, speed);
                samples.push({ x: x, speed: speed });
            }
            maxSpeed = Math.max(0.0001, maxSpeed);
            const path = [];
            for (let s = 0; s < samples.length; s++) {
                const sample = samples[s];
                const sx = pad + (clamp(sample.x, 0, 1) * plot);
                const endpointSpeed = s === 0 || s === samples.length - 1 ? 0 : sample.speed;
                const sy = pad + plot - (clamp(endpointSpeed / maxSpeed, 0, 1) * plot);
                path.push((s ? "L " : "M ") + sx + " " + sy);
            }
            return {
                startX,
                startY: pad + plot,
                endX,
                endY: pad + plot,
                handle1X,
                handle1Y,
                handle2X,
                handle2Y,
                curvePath: path.join(" "),
                referencePath: "M " + startX + " " + (pad + plot) + " L " + endX + " " + (pad + plot) + " M " + startX + " " + (pad + plot * 0.5) + " L " + endX + " " + (pad + plot * 0.5)
            };
        }
        return {
            startX,
            startY,
            endX,
            endY,
            handle1X,
            handle1Y,
            handle2X,
            handle2Y,
            curvePath: "M " + startX + " " + startY + " C " + handle1X + " " + handle1Y + ", " + handle2X + " " + handle2Y + ", " + endX + " " + endY,
            referencePath: mode === "speed" || forceBaseline
                ? ("M " + startX + " " + startY + " L " + endX + " " + endY + " M " + startX + " " + (pad + plot * 0.5) + " L " + endX + " " + (pad + plot * 0.5))
                : ("M " + startX + " " + startY + " L " + endX + " " + endY)
        };
    }

    function getCurrentGraphCurve() {
        return {
            x1: graphState.x1,
            y1: graphState.y1,
            x2: graphState.x2,
            y2: graphState.y2,
            direction: graphState.direction,
            mode: graphState.mode
        };
    }

    function rememberCurrentGraphModeCurve() {
        graphState.modeCurves[graphState.mode] = {
            x1: graphState.x1,
            y1: graphState.y1,
            x2: graphState.x2,
            y2: graphState.y2
        };
    }

    function getMatchingGraphPresetId(curve) {
        const safeCurve = curve || getCurrentGraphCurve();
        const allPresets = getRenderableGraphPresets();
        for (let i = 0; i < allPresets.length; i++) {
            const preset = allPresets[i];
            if (!preset.curve) continue;
            if ((preset.type || preset.mode || graphState.mode) !== graphState.mode) continue;
            if (
                Math.abs(safeCurve.x1 - preset.curve.x1) <= 0.015 &&
                Math.abs(safeCurve.y1 - preset.curve.y1) <= 0.015 &&
                Math.abs(safeCurve.x2 - preset.curve.x2) <= 0.015 &&
                Math.abs(safeCurve.y2 - preset.curve.y2) <= 0.015
            ) {
                return preset.id;
            }
        }
        return "";
    }

    function getGraphPresetById(presetId) {
        for (let i = 0; i < graphPresets.length; i++) {
            if (graphPresets[i].id === presetId) return graphPresets[i];
        }
        return null;
    }

    function getSelectedGraphPreset() {
        const id = graphState.selectedPresetIds[graphState.mode] || graphState.selectedPresetId;
        if (!id) return null;
        const saved = getGraphPresetById(id);
        if (saved && saved.curve && (saved.type || saved.mode || graphState.mode) === graphState.mode) return saved;
        return null;
    }

    function selectGraphPreset(id) {
        graphState.selectedPresetId = id || "";
        graphState.selectedPresetIds[graphState.mode] = id || "";
    }

    function saveCurrentGraphToPreset(presetId) {
        const preset = getGraphPresetById(presetId);
        if (!preset || preset.type !== graphState.mode) return;
        preset.curve = normalizeGraphCurve(getCurrentGraphCurve());
        preset.type = graphState.mode;
        preset.mode = graphState.mode;
        selectGraphPreset(presetId);
        graphState.activePresetId = presetId;
        graphState.saveMode = false;
        persistGraphPresetSlots();
        renderGraphEditor();
        setGraphStatus("Current curve saved to slot " + presetId.replace("slot", "") + ".", false);
    }

    function toggleGraphSaveMode(forceState) {
        graphState.saveMode = typeof forceState === "boolean" ? forceState : !graphState.saveMode;
        renderGraphEditor();
        if (graphState.saveMode) {
            setGraphStatus("Save mode active. Click any slot to save the current graph.", false);
        } else {
            setGraphStatus("Save mode off. Click a saved slot to load it.", false);
        }
    }

    let graphContextMenu = null;

    function closeGraphContextMenu() {
        if (graphContextMenu && graphContextMenu.parentNode) graphContextMenu.parentNode.removeChild(graphContextMenu);
        graphContextMenu = null;
    }

    function deleteSavedGraphPreset(presetId, presetType) {
        const preset = getGraphPresetById(presetId);
        // Delete is deliberately ID-based and collection-scoped: no visual
        // index, row, or shared slot name can delete another graph's preset.
        if (!preset || preset.type !== presetType || !preset.curve) return;
        preset.curve = null;
        if (graphState.selectedPresetId === preset.id) graphState.selectedPresetId = "";
        if (graphState.selectedPresetIds[preset.type] === preset.id) graphState.selectedPresetIds[preset.type] = "";
        persistGraphPresetSlots();
        closeGraphContextMenu();
        renderGraphEditor();
        setGraphStatus("Saved graph deleted.", false);
    }

    function showGraphContextMenu(preset, evt) {
        if (!preset || !preset.curve) return;
        if (evt && evt.preventDefault) evt.preventDefault();
        closeGraphContextMenu();
        const menu = document.createElement("div");
        menu.className = "graph-context-menu";
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.onclick = function(clickEvt) {
            if (clickEvt) clickEvt.stopPropagation();
            deleteSavedGraphPreset(preset.id, preset.type);
        };
        menu.appendChild(deleteButton);
        document.body.appendChild(menu);
        const x = evt && typeof evt.clientX === "number" ? evt.clientX : 0;
        const y = evt && typeof evt.clientY === "number" ? evt.clientY : 0;
        menu.style.left = Math.max(4, Math.min(x, window.innerWidth - 126)) + "px";
        menu.style.top = Math.max(4, Math.min(y, window.innerHeight - 48)) + "px";
        graphContextMenu = menu;
    }

    function setGraphStatus(message, isError) {
        const el = document.getElementById("graphStatus");
        if (!el) return;
        el.textContent = message;
        el.style.color = isError ? "#ff6666" : "#7d7d7d";
    }

    function getRenderableGraphPresets() {
        const currentType = graphState.mode;
        return graphPresets.filter(function(preset) {
            return (preset.type || preset.mode || currentType) === currentType;
        });
    }

    function getGraphPresetRenderSignature() {
        const parts = [graphState.mode];
        const presets = getRenderableGraphPresets();
        for (let i = 0; i < presets.length; i++) {
            const preset = presets[i];
            if (!preset.curve) {
                parts.push(preset.id + ":empty");
                continue;
            }
            parts.push(preset.id + ":" + preset.curve.x1 + "," + preset.curve.y1 + "," + preset.curve.x2 + "," + preset.curve.y2 + ":" + (preset.mode || graphState.mode));
        }
        return parts.join("|");
    }

    function ensureGraphGrid() {
        const grid = document.getElementById("graphEditorGrid");
        if (!grid || grid.childNodes.length > 0) return;
        const ns = "http://www.w3.org/2000/svg";
        const plot = getGraphPlotSize();
        for (let i = 0; i <= 4; i++) {
            const offset = graphBounds.pad + ((plot / 4) * i);
            const vertical = document.createElementNS(ns, "line");
            vertical.setAttribute("x1", offset);
            vertical.setAttribute("y1", graphBounds.pad);
            vertical.setAttribute("x2", offset);
            vertical.setAttribute("y2", graphBounds.pad + plot);
            vertical.setAttribute("class", "graph-grid-line" + (i === 0 || i === 4 ? " strong" : ""));
            grid.appendChild(vertical);

            const horizontal = document.createElementNS(ns, "line");
            horizontal.setAttribute("x1", graphBounds.pad);
            horizontal.setAttribute("y1", offset);
            horizontal.setAttribute("x2", graphBounds.pad + plot);
            horizontal.setAttribute("y2", offset);
            horizontal.setAttribute("class", "graph-grid-line" + (i === 0 || i === 4 ? " strong" : ""));
            grid.appendChild(horizontal);
        }
    }

    function updateGraphState(nextState) {
        const curve = nextState || graphDefaults;
        const previousDirection = graphState.direction;
        // Both graph modes use independent handle coordinates. The only UI
        // clamp is the outer graph box; AE ordering is handled at Apply time.
        graphState.x1 = roundGraphValue(clamp(curve.x1, 0, 1));
        graphState.x2 = roundGraphValue(clamp(curve.x2, 0, 1));
        graphState.y1 = roundGraphValue(clamp(curve.y1, 0, 1));
        graphState.y2 = roundGraphValue(clamp(curve.y2, 0, 1));
        if (curve.direction === -1 || curve.direction === 1) graphState.direction = curve.direction;
        if (curve.mode === "speed" || curve.mode === "value") graphState.mode = curve.mode;
        if (graphState.mode === "value" && previousDirection !== graphState.direction) {
            const shell = document.querySelector(".graph-curve-shell");
            if (shell) {
                shell.classList.remove("is-switching");
                void shell.offsetWidth;
                shell.classList.add("is-switching");
                window.clearTimeout(graphState.modeSwitchTimer);
                graphState.modeSwitchTimer = window.setTimeout(function() {
                    shell.classList.remove("is-switching");
                }, 360);
            }
        }
        rememberCurrentGraphModeCurve();
        graphState.activePresetId = getMatchingGraphPresetId(graphState);
        renderGraphEditor();
    }

    function createGraphPresetButton(preset) {
        const button = document.createElement("button");
        button.className = "btn-primary graph-preset-btn";
        button.type = "button";
        button.setAttribute("data-graph-preset", preset.id);
        button.setAttribute("title", preset.curve
            ? preset.title + " | Click to load, or overwrite in Save Graph mode"
            : preset.title + " | Click to save current graph");
        button.setAttribute("aria-label", preset.title);
        button.classList.toggle("empty", !preset.curve);

        if (preset.curve) {
            const preview = document.createElement("span");
            preview.className = "graph-preset-preview";
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const presetMode = preset.type || preset.mode || graphState.mode;
            const shape = getGraphCurveShape(preset.curve, 76, 10, presetMode, presetMode === "speed");
            svg.setAttribute("class", "graph-preset-svg");
            svg.setAttribute("viewBox", "0 0 76 76");
            svg.setAttribute("preserveAspectRatio", "none");

            const refPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            refPath.setAttribute("class", "graph-preset-ref");
            refPath.setAttribute("d", shape.referencePath);
            svg.appendChild(refPath);

            const curvePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            curvePath.setAttribute("class", "graph-preset-curve");
            curvePath.setAttribute("d", shape.curvePath);
            svg.appendChild(curvePath);

            const startDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            startDot.setAttribute("class", "graph-preset-dot");
            startDot.setAttribute("cx", shape.startX);
            startDot.setAttribute("cy", shape.startY);
            startDot.setAttribute("r", "2.4");
            svg.appendChild(startDot);

            const endDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            endDot.setAttribute("class", "graph-preset-dot");
            endDot.setAttribute("cx", shape.endX);
            endDot.setAttribute("cy", shape.endY);
            endDot.setAttribute("r", "2.4");
            svg.appendChild(endDot);

            preview.appendChild(svg);
            button.appendChild(preview);
        } else {
            const plus = document.createElement("span");
            plus.className = "graph-preset-plus";
            plus.textContent = "+";
            button.appendChild(plus);
        }

        button.onclick = (evt) => {
            if (!preset.curve || graphState.saveMode || (evt && evt.shiftKey)) {
                saveCurrentGraphToPreset(preset.id);
                return;
            }
            selectGraphPreset(preset.id);
            // A preset is data for the already-active editor. Loading it must
            // never switch Value <-> Speed mode.
            updateGraphState({ x1: preset.curve.x1, y1: preset.curve.y1, x2: preset.curve.x2, y2: preset.curve.y2, direction: graphState.direction, mode: graphState.mode });
            setGraphStatus("Curve loaded from slot " + preset.id.replace("slot", "") + ".", false);
        };
        button.oncontextmenu = (evt) => {
            if (evt) evt.preventDefault();
            if (!preset.curve) return false;
            showGraphContextMenu(preset, evt);
            return false;
        };

        return button;
    }

    function renderGraphPresetGrid() {
        const container = document.getElementById("graphPresetGrid");
        if (!container) return;
        const signature = getGraphPresetRenderSignature();
        if (container.getAttribute("data-render-signature") !== signature) {
            container.innerHTML = "";
            getRenderableGraphPresets().forEach(preset => container.appendChild(createGraphPresetButton(preset)));
            container.setAttribute("data-render-signature", signature);
        }
        const activePresetId = getMatchingGraphPresetId(graphState);
        graphState.activePresetId = activePresetId;
        const buttons = container.querySelectorAll("[data-graph-preset]");
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            button.classList.toggle("active", button.getAttribute("data-graph-preset") === activePresetId);
        }
        const saveBtn = document.getElementById("btnGraphSaveSlot");
        if (saveBtn) {
            saveBtn.classList.toggle("active", !!graphState.saveMode);
            saveBtn.textContent = graphState.saveMode ? "Choose Slot" : "Save Graph";
            saveBtn.setAttribute("aria-pressed", graphState.saveMode ? "true" : "false");
            saveBtn.setAttribute("title", graphState.saveMode ? "Click an empty or saved slot to store this curve" : "Enable slot save mode");
        }
    }

    function renderGraphEditor() {
        const svg = document.getElementById("graphEditorSvg");
        if (!svg) return;
        ensureGraphGrid();
        const graphShape = getGraphCurveShape(graphState, graphBounds.size, graphBounds.pad, graphState.mode);

        const curvePath = document.getElementById("graphCurvePath");
        const refPath = document.getElementById("graphReferencePath");
        const lineStart = document.getElementById("graphHandleLineStart");
        const lineEnd = document.getElementById("graphHandleLineEnd");
        const startPoint = document.getElementById("graphStartPoint");
        const endPoint = document.getElementById("graphEndPoint");
        const handle1 = document.getElementById("graphHandle1");
        const handle2 = document.getElementById("graphHandle2");
        const launchBtn = document.getElementById("btnGraphPanel");
        const presetsTitle = document.getElementById("graphPresetsTitle");
        const subtitle = document.querySelector(".graph-panel-subtitle");
        const dots = document.getElementById("graphModeDots");

        if (curvePath) curvePath.setAttribute("d", graphShape.curvePath);
        if (refPath) refPath.setAttribute("d", graphShape.referencePath);
        if (lineStart) {
            lineStart.setAttribute("x1", graphShape.startX);
            lineStart.setAttribute("y1", graphShape.startY);
            lineStart.setAttribute("x2", graphShape.handle1X);
            lineStart.setAttribute("y2", graphShape.handle1Y);
        }
        if (lineEnd) {
            lineEnd.setAttribute("x1", graphShape.endX);
            lineEnd.setAttribute("y1", graphShape.endY);
            lineEnd.setAttribute("x2", graphShape.handle2X);
            lineEnd.setAttribute("y2", graphShape.handle2Y);
        }
        if (startPoint) {
            startPoint.setAttribute("cx", graphShape.startX);
            startPoint.setAttribute("cy", graphShape.startY);
        }
        if (endPoint) {
            endPoint.setAttribute("cx", graphShape.endX);
            endPoint.setAttribute("cy", graphShape.endY);
        }
        if (handle1) {
            handle1.setAttribute("cx", graphShape.handle1X);
            handle1.setAttribute("cy", graphShape.handle1Y);
            handle1.classList.toggle("active", graphState.activeHandle === "p1");
        }
        if (handle2) {
            handle2.setAttribute("cx", graphShape.handle2X);
            handle2.setAttribute("cy", graphShape.handle2Y);
            handle2.classList.toggle("active", graphState.activeHandle === "p2");
        }
        svg.classList.toggle("is-dragging", !!graphState.activeHandle);
        if (presetsTitle) presetsTitle.textContent = graphState.mode === "speed" ? "Speed Graph Presets" : "Value Curve Presets";
        if (subtitle) subtitle.textContent = graphState.mode === "speed"
            ? "Speed Graph: shape velocity peaks, then apply it back to selected AE keyframes."
            : "Copy AE graph, tweak the handles, then save your own curves into any slot below.";
        if (dots) dots.setAttribute("data-mode", graphState.mode);
        if (launchBtn) launchBtn.classList.toggle("active", graphState.open);
        renderGraphPresetGrid();
    }

    function setGraphMode(mode) {
        const safeMode = mode === "speed" ? "speed" : "value";
        if (graphState.mode === safeMode) return;
        rememberCurrentGraphModeCurve();
        const shell = document.querySelector(".graph-curve-shell");
        if (shell) {
            shell.classList.remove("is-switching");
            void shell.offsetWidth;
            shell.classList.add("is-switching");
            window.clearTimeout(graphState.modeSwitchTimer);
            graphState.modeSwitchTimer = window.setTimeout(function() {
                shell.classList.remove("is-switching");
            }, 360);
        }
        graphState.mode = safeMode;
        graphState.selectedPresetId = graphState.selectedPresetIds[safeMode] || "";
        graphState.saveMode = false;
        const defaults = graphState.modeCurves[safeMode] || getDefaultGraphCurve();
        updateGraphState({ x1: defaults.x1, y1: defaults.y1, x2: defaults.x2, y2: defaults.y2, direction: graphState.direction, mode: safeMode });
        setGraphStatus(safeMode === "speed" ? "Speed Graph mode ready." : "Value Graph mode ready.", false);
    }

    function switchGraphModeByWheel(evt) {
        if (!graphState.open || graphState.activeHandle) return;
        const delta = evt && typeof evt.deltaY === "number" ? evt.deltaY : 0;
        if (Math.abs(delta) < 2) return;
        if (evt && evt.preventDefault) evt.preventDefault();
        const now = Date.now();
        if (now - graphState.modeWheelAt > 620) graphState.modeWheelDelta = 0;
        graphState.modeWheelDelta += delta;
        graphState.modeWheelAt = now;
        if (Math.abs(graphState.modeWheelDelta) < 38) return;
        const nextMode = graphState.modeWheelDelta > 0 ? "speed" : "value";
        graphState.modeWheelDelta = 0;
        setGraphMode(nextMode);
    }

    function setGraphPanelOpen(shouldOpen) {
        if (shouldOpen) closeAutoCaptionLanguageMenu();
        graphState.open = !!shouldOpen;
        if (!graphState.open) {
            graphState.saveMode = false;
            closeGraphContextMenu();
        }
        const overlay = document.getElementById("graphOverlay");
        if (overlay) {
            overlay.classList.toggle("active", graphState.open);
            overlay.setAttribute("aria-hidden", graphState.open ? "false" : "true");
        }
        renderGraphEditor();
    }

    function setGraphDraggingState(handleName, pointerId) {
        graphState.activeHandle = handleName || "";
        graphState.pointerId = typeof pointerId === "number" ? pointerId : null;
        if (!handleName) {
            graphState.pendingPoint = null;
            graphState.framePending = false;
        }
        renderGraphEditor();
    }

    function normalizeGraphPointerEvent(evt) {
        if (evt && evt.touches && evt.touches.length) return evt.touches[0];
        if (evt && evt.changedTouches && evt.changedTouches.length) return evt.changedTouches[0];
        return evt;
    }

    function getGraphSvgPoint(evt) {
        evt = normalizeGraphPointerEvent(evt);
        if (!evt) return null;
        const svg = document.getElementById("graphEditorSvg");
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        const x = clamp((evt.clientX - rect.left - graphBounds.pad) / (rect.width - (graphBounds.pad * 2)), 0, 1);
        const displayY = clamp(1 - ((evt.clientY - rect.top - graphBounds.pad) / (rect.height - (graphBounds.pad * 2))), 0, 1);
        const y = graphState.mode === "value" && graphState.direction === -1 ? 1 - displayY : displayY;
        if (!isFinite(x) || !isFinite(y)) return null;
        return { x, y };
    }

    function getNearestGraphHandle(point) {
        const distance1 = Math.pow(point.x - graphState.x1, 2) + Math.pow(point.y - graphState.y1, 2);
        const distance2 = Math.pow(point.x - graphState.x2, 2) + Math.pow(point.y - graphState.y2, 2);
        return distance1 <= distance2 ? "p1" : "p2";
    }

    function getGraphHandleFromTarget(target) {
        if (!target || !target.id) return "";
        if (target.id === "graphHandle1") return "p1";
        if (target.id === "graphHandle2") return "p2";
        return "";
    }

    function applyGraphPointerPoint(point) {
        if (!point || !graphState.activeHandle) return;
        if (graphState.activeHandle === "p1") {
            graphState.x1 = clamp(point.x, 0, 1);
            graphState.y1 = clamp(point.y, 0, 1);
        } else if (graphState.activeHandle === "p2") {
            graphState.x2 = clamp(point.x, 0, 1);
            graphState.y2 = clamp(point.y, 0, 1);
        }
        rememberCurrentGraphModeCurve();
        graphState.activePresetId = "";
    }

    function flushGraphPointerUpdate() {
        graphState.framePending = false;
        const point = graphState.pendingPoint;
        graphState.pendingPoint = null;
        if (!point || !graphState.activeHandle) return;
        applyGraphPointerPoint(point);
        renderGraphEditor();
    }

    function queueGraphPointerUpdate(point) {
        graphState.pendingPoint = point;
        if (graphState.framePending) return;
        graphState.framePending = true;
        window.requestAnimationFrame(flushGraphPointerUpdate);
    }

    function startGraphPointerDrag(evt) {
        if (typeof evt.button === "number" && evt.button !== 0) return;
        if (evt && evt.type === "mousedown" && graphState.activeHandle) return;
        if (evt && evt.preventDefault) evt.preventDefault();
        const point = getGraphSvgPoint(evt);
        const svg = document.getElementById("graphEditorSvg");
        if (!point || !svg) return;
        // Prefer the actual circle target. This keeps identity stable when
        // both handles overlap; nearest-distance is only a background fallback.
        const handleName = getGraphHandleFromTarget(evt && evt.target) || getNearestGraphHandle(point);
        setGraphDraggingState(handleName, evt.pointerId);
        if (svg.setPointerCapture && typeof evt.pointerId === "number") {
            try { svg.setPointerCapture(evt.pointerId); } catch (error) {}
        }
        applyGraphPointerPoint(point);
        renderGraphEditor();
    }

    function updateGraphFromPointer(evt) {
        if (!graphState.activeHandle) return;
        if (typeof evt.pointerId === "number" && graphState.pointerId !== null && evt.pointerId !== graphState.pointerId) return;
        const point = getGraphSvgPoint(evt);
        if (!point) return;
        if (evt && evt.preventDefault) evt.preventDefault();
        queueGraphPointerUpdate(point);
    }

    function endGraphPointerDrag(evt) {
        if (!graphState.activeHandle) return;
        if (evt && typeof evt.pointerId === "number" && graphState.pointerId !== null && evt.pointerId !== graphState.pointerId) return;
        const svg = document.getElementById("graphEditorSvg");
        // Do not lose the last rAF-throttled cursor position on pointerup or
        // lostpointercapture.
        if (graphState.pendingPoint) {
            const pending = graphState.pendingPoint;
            graphState.pendingPoint = null;
            graphState.framePending = false;
            applyGraphPointerPoint(pending);
            renderGraphEditor();
        }
        if (svg && svg.releasePointerCapture && graphState.pointerId !== null) {
            try { svg.releasePointerCapture(graphState.pointerId); } catch (error) {}
        }
        setGraphDraggingState("", null);
    }

    function readGraphFromSelection() {
        setGraphStatus("Copying selected AE graph...", false);
        csInterface.evalScript("toolkit.readGraphEaseSelection('" + graphState.mode + "')", function(res) {
            if (!res) {
                setGraphStatus("No response while reading keyframes.", true);
                return;
            }
            if (res.indexOf("error::") === 0) {
                setGraphStatus(res.substring(7), true);
                return;
            }
            try {
                const curve = JSON.parse(res);
                graphState.selectedPresetId = "";
                graphState.selectedPresetIds[graphState.mode] = "";
                updateGraphState(curve);
                setGraphStatus("AE graph copied into panel.", false);
            } catch (error) {
                setGraphStatus("Selected keys were read, but the curve data could not be parsed.", true);
            }
        });
    }

    function applyGraphToSelection() {
        setGraphStatus("Applying graph back to AE...", false);
        csInterface.evalScript(
            "toolkit.applyGraphEase(" + graphState.x1 + ", " + graphState.y1 + ", " + graphState.x2 + ", " + graphState.y2 + ", '" + graphState.mode + "')",
            function(res) {
                if (!res) {
                    setGraphStatus("Apply action did not return a response.", true);
                    return;
                }
                if (res.indexOf("error::") === 0) {
                    setGraphStatus(res.substring(7), true);
                    return;
                }
                setGraphStatus(res.indexOf("success::") === 0 ? res.substring(9) : "Curve applied.", false);
            }
        );
    }

    function initGraphEditor() {
        const launchBtn = document.getElementById("btnGraphPanel");
        const closeBtn = document.getElementById("btnGraphClose");
        const overlay = document.getElementById("graphOverlay");
        const svg = document.getElementById("graphEditorSvg");
        const resetBtn = document.getElementById("btnGraphReset");
        const readBtn = document.getElementById("btnGraphRead");
        const applyBtn = document.getElementById("btnGraphApply");
        const saveSlotBtn = document.getElementById("btnGraphSaveSlot");

        if (launchBtn) launchBtn.onclick = () => setGraphPanelOpen(!graphState.open);
        if (closeBtn) closeBtn.onclick = () => setGraphPanelOpen(false);
        if (overlay) {
            overlay.onclick = (evt) => {
                if (evt.target === overlay) setGraphPanelOpen(false);
            };
        }
        if (resetBtn) resetBtn.onclick = () => {
            const selected = getSelectedGraphPreset();
            const defaults = selected && selected.curve ? selected.curve : getDefaultGraphCurve();
            const resetMode = selected && selected.mode ? selected.mode : graphState.mode;
            updateGraphState({ x1: defaults.x1, y1: defaults.y1, x2: defaults.x2, y2: defaults.y2, direction: graphState.direction, mode: resetMode });
            if (selected) selectGraphPreset(selected.id);
            setGraphStatus(selected ? "Preset graph reset." : "Graph reset.", false);
            applyGraphToSelection();
        };
        if (readBtn) readBtn.onclick = readGraphFromSelection;
        if (applyBtn) applyBtn.onclick = applyGraphToSelection;
        if (saveSlotBtn) saveSlotBtn.onclick = () => toggleGraphSaveMode();
        document.addEventListener("click", (evt) => {
            if (graphContextMenu && evt.target !== graphContextMenu && !graphContextMenu.contains(evt.target)) closeGraphContextMenu();
        });
        if (svg) {
            if (!svg.__kwvGraphWheelBound) {
                svg.__kwvGraphWheelBound = true;
                svg.addEventListener("wheel", switchGraphModeByWheel, { passive: false });
            }
            if (!svg.__kwvGraphDragBound) {
                svg.__kwvGraphDragBound = true;
                // macOS AE CEP can expose PointerEvent but fail to keep SVG
                // pointer capture alive. Bind mouse/touch fallbacks regardless.
                svg.addEventListener("mousedown", startGraphPointerDrag);
                window.addEventListener("mousemove", updateGraphFromPointer);
                window.addEventListener("mouseup", endGraphPointerDrag);
                svg.addEventListener("touchstart", startGraphPointerDrag, { passive: false });
                window.addEventListener("touchmove", updateGraphFromPointer, { passive: false });
                window.addEventListener("touchend", endGraphPointerDrag);
                window.addEventListener("touchcancel", endGraphPointerDrag);
            }
            if (window.PointerEvent && !svg.__kwvGraphPointerBound) {
                svg.__kwvGraphPointerBound = true;
                svg.addEventListener("pointerdown", startGraphPointerDrag);
                window.addEventListener("pointermove", updateGraphFromPointer);
                window.addEventListener("pointerup", endGraphPointerDrag);
                window.addEventListener("pointercancel", endGraphPointerDrag);
                svg.addEventListener("lostpointercapture", endGraphPointerDrag);
            }
        }
        document.addEventListener("keydown", (evt) => {
            if (evt.key === "Escape" && graphContextMenu) closeGraphContextMenu();
            if (evt.key === "Escape" && graphState.open) setGraphPanelOpen(false);
        });
        renderGraphEditor();
    }

    function setStickyNotesOpen(shouldOpen) {
        const panel = document.getElementById("stickyNotesPanel");
        const btn = document.getElementById("btnStickyNotes");
        const textarea = document.getElementById("stickyNotesText");
        const socialDock = document.getElementById("kwvSocialsDock");
        if (!panel) return;
        if (shouldOpen && socialDock) {
            socialDock.classList.remove("open");
            document.body.classList.remove("kwv-socials-open");
        }
        panel.classList.toggle("active", !!shouldOpen);
        panel.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
        if (btn) btn.classList.toggle("active", !!shouldOpen);
        if (shouldOpen && textarea) {
            setTimeout(() => textarea.focus(), 40);
        }
    }

    const stickyNotesState = {
        notes: [],
        activeId: ""
    };

    function getStickyNotesTabsFilePath() {
        return getGraphPresetStorageFolder() + "/" + stickyNotesTabsStorageFileName;
    }

    function createStickyNote(text) {
        return {
            id: "note-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
            title: "",
            text: text || "",
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    function normalizeStickyNotesPayload(payload) {
        const notes = Array.isArray(payload && payload.notes) ? payload.notes : [];
        let totalChars = 0;
        const cleanNotes = notes.map((note, index) => {
            let text = note && typeof note.text === "string" ? note.text : "";
            if (text.length > stickyNotesMaxImportChars) text = text.slice(0, stickyNotesMaxImportChars) + "\n\n[Note was trimmed because it was too large.]";
            totalChars += text.length;
            return {
                id: note && note.id ? String(note.id) : ("note-" + index),
                title: note && typeof note.title === "string" ? note.title.slice(0, 32) : "",
                text,
                createdAt: note && note.createdAt ? note.createdAt : Date.now(),
                updatedAt: note && note.updatedAt ? note.updatedAt : Date.now()
            };
        }).filter(note => totalChars <= stickyNotesMaxStorageChars || note.text.length < stickyNotesMaxImportChars);
        if (totalChars > stickyNotesMaxStorageChars) {
            return normalizeStickyNotesPayload({ notes: [createStickyNote("[Recovered]\nPrevious Sticky Notes data was too large, so it was reset to keep the extension opening safely.")], activeId: "" });
        }
        if (!cleanNotes.length) cleanNotes.push(createStickyNote(""));
        const requestedActiveId = payload && payload.activeId ? payload.activeId : "";
        const activeId = cleanNotes.some(note => note.id === requestedActiveId) ? requestedActiveId : cleanNotes[0].id;
        return { notes: cleanNotes, activeId };
    }

    function readStickyNotesTabsRaw() {
        try {
            if (window.cep && window.cep.fs) {
                const result = window.cep.fs.readFile(getStickyNotesTabsFilePath());
                if (result && result.err === 0 && result.data) {
                    const raw = String(result.data || "");
                    if (raw.length > stickyNotesMaxStorageChars) return "";
                    return raw;
                }
            }
        } catch (error) {}
        try {
            if (window.localStorage) {
                const raw = window.localStorage.getItem(stickyNotesTabsStorageKey) || "";
                if (raw.length > stickyNotesMaxStorageChars) {
                    window.localStorage.removeItem(stickyNotesTabsStorageKey);
                    return "";
                }
                return raw;
            }
        } catch (error) {}
        return "";
    }

    function loadStickyNotesTabs() {
        const raw = readStickyNotesTabsRaw();
        if (raw) {
            try {
                return normalizeStickyNotesPayload(JSON.parse(raw));
            } catch (error) {
                return normalizeStickyNotesPayload({ notes: [createStickyNote("")], activeId: "" });
            }
        }
        const legacyText = loadStickyNotesText();
        return normalizeStickyNotesPayload({ notes: [createStickyNote(legacyText)], activeId: "" });
    }

    function persistStickyNotesTabs() {
        const payload = normalizeStickyNotesPayload(stickyNotesState);
        stickyNotesState.notes = payload.notes;
        stickyNotesState.activeId = payload.activeId;
        const json = JSON.stringify(payload);
        let saved = false;
        try {
            if (window.localStorage) {
                window.localStorage.setItem(stickyNotesTabsStorageKey, json);
                saved = true;
            }
        } catch (error) {}
        try {
            if (window.cep && window.cep.fs) {
                ensureGraphPresetStorageFolder();
                const result = window.cep.fs.writeFile(getStickyNotesTabsFilePath(), json);
                saved = saved || !!(result && result.err === 0);
            }
        } catch (error) {}
        return saved;
    }

    function getActiveStickyNote() {
        return stickyNotesState.notes.find(note => note.id === stickyNotesState.activeId) || stickyNotesState.notes[0] || null;
    }

    function getStickyNoteTabTitle(note, index) {
        const customTitle = String(note && note.title ? note.title : "").replace(/\s+/g, " ").trim();
        if (customTitle) return customTitle.length > 16 ? customTitle.slice(0, 16) + "..." : customTitle;
        const words = String(note && note.text ? note.text : "").replace(/\s+/g, " ").trim();
        if (!words) return "Note " + (index + 1);
        return words.length > 16 ? words.slice(0, 16) + "..." : words;
    }

    function getStickyNoteFullTitle(note, index) {
        const customTitle = String(note && note.title ? note.title : "").replace(/\s+/g, " ").trim();
        if (customTitle) return customTitle;
        return getStickyNoteTabTitle(note, index);
    }

    function renameStickyNoteTab(noteId) {
        const note = stickyNotesState.notes.find(item => item.id === noteId);
        if (!note) return;
        const index = stickyNotesState.notes.findIndex(item => item.id === noteId);
        const current = String(note.title || getStickyNoteFullTitle(note, index) || "").replace(/\s+/g, " ").trim();
        const tab = document.querySelector('.sticky-note-tab[data-note-id="' + noteId + '"]');
        if (!tab || tab.querySelector("input")) return;
        tab.classList.add("renaming");
        tab.innerHTML = "";
        const input = document.createElement("input");
        input.type = "text";
        input.value = current;
        input.maxLength = 32;
        input.spellcheck = false;
        input.setAttribute("aria-label", "Rename note");
        tab.appendChild(input);
        let done = false;
        const finish = (save) => {
            if (done) return;
            done = true;
            if (save) {
                note.title = String(input.value || "").replace(/\s+/g, " ").trim().slice(0, 32);
                note.updatedAt = Date.now();
                const saved = persistStickyNotesTabs();
                syncStickyNotesMeta(note.text || "", saved);
            }
            renderStickyNoteTabs();
        };
        input.addEventListener("keydown", (evt) => {
            evt.stopPropagation();
            if (evt.key === "Enter") {
                evt.preventDefault();
                finish(true);
            } else if (evt.key === "Escape") {
                evt.preventDefault();
                finish(false);
            }
        });
        input.addEventListener("keyup", (evt) => evt.stopPropagation());
        input.addEventListener("click", (evt) => evt.stopPropagation());
        input.addEventListener("dblclick", (evt) => evt.stopPropagation());
        input.addEventListener("blur", () => finish(true));
        window.setTimeout(() => {
            input.focus();
            input.select();
        }, 0);
    }

    function getStickyNotesSearchQuery() {
        const input = document.getElementById("stickyNotesSearch");
        return input ? String(input.value || "").trim().toLowerCase() : "";
    }

    function renderStickyNoteTabs() {
        const tabs = document.getElementById("stickyNotesTabs");
        if (!tabs) return;
        tabs.innerHTML = "";
        const query = getStickyNotesSearchQuery();
        let rendered = 0;
        stickyNotesState.notes.forEach((note, index) => {
            const haystack = (getStickyNoteTabTitle(note, index) + " " + String(note && note.text ? note.text : "")).toLowerCase();
            if (query && haystack.indexOf(query) === -1) return;
            const tab = document.createElement("div");
            tab.setAttribute("role", "button");
            tab.tabIndex = 0;
            tab.className = "sticky-note-tab" + (note.id === stickyNotesState.activeId ? " active" : "");
            tab.setAttribute("data-note-id", note.id);
            tab.textContent = getStickyNoteTabTitle(note, index);
            tab.setAttribute("data-kwv-tooltip", "Open " + getStickyNoteFullTitle(note, index) + " / Double-click to rename");
            tab.onclick = () => switchStickyNote(note.id);
            tab.onkeydown = (evt) => {
                if (evt.key === "Enter" || evt.key === " ") {
                    evt.preventDefault();
                    switchStickyNote(note.id);
                }
            };
            tab.ondblclick = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                renameStickyNoteTab(note.id);
            };
            tabs.appendChild(tab);
            rendered += 1;
        });
        if (query && !rendered) {
            const empty = document.createElement("div");
            empty.className = "sticky-note-tab sticky-note-tab-empty";
            empty.textContent = "No match";
            tabs.appendChild(empty);
        }
    }

    function syncStickyNotesTextarea() {
        const textarea = document.getElementById("stickyNotesText");
        const active = getActiveStickyNote();
        if (!textarea || !active) return;
        textarea.value = active.text || "";
        syncStickyNotesMeta(textarea.value, true);
        renderStickyNoteTabs();
    }

    function switchStickyNote(noteId) {
        const active = stickyNotesState.notes.find(note => note.id === noteId);
        if (!active) return;
        stickyNotesState.activeId = active.id;
        persistStickyNotesTabs();
        syncStickyNotesTextarea();
    }

    function addStickyNoteTab() {
        const note = createStickyNote("");
        stickyNotesState.notes.push(note);
        stickyNotesState.activeId = note.id;
        persistStickyNotesTabs();
        syncStickyNotesTextarea();
        const textarea = document.getElementById("stickyNotesText");
        if (textarea) textarea.focus();
    }

    function insertStickyNoteText(value) {
        const textarea = document.getElementById("stickyNotesText");
        const active = getActiveStickyNote();
        if (!textarea || !active || !value) return;
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || start;
        const current = textarea.value || "";
        const next = current.slice(0, start) + value + current.slice(end);
        textarea.value = next;
        textarea.selectionStart = textarea.selectionEnd = start + value.length;
        active.text = next;
        active.updatedAt = Date.now();
        const saved = persistStickyNotesTabs();
        syncStickyNotesMeta(next, saved);
        renderStickyNoteTabs();
        textarea.focus();
    }

    function insertStickyNoteTimestamp() {
        const now = new Date();
        const pad = value => String(value).padStart(2, "0");
        const day = pad(now.getDate());
        const month = pad(now.getMonth() + 1);
        const year = now.getFullYear();
        let hours = now.getHours();
        const minutes = pad(now.getMinutes());
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (!hours) hours = 12;
        const stamp = day + "-" + month + "-" + year + " " + pad(hours) + ":" + minutes + " " + ampm;
        insertStickyNoteText((getActiveStickyNote() && getActiveStickyNote().text ? "\n" : "") + "[" + stamp + "] ");
    }

    function insertStickyNoteChecklist() {
        insertStickyNoteText((getActiveStickyNote() && getActiveStickyNote().text ? "\n" : "") + "[ ] Task\n[ ] Task\n[ ] Task");
    }

    function duplicateStickyNoteTab() {
        const active = getActiveStickyNote();
        if (!active) return;
        const note = createStickyNote(active.text || "");
        stickyNotesState.notes.push(note);
        stickyNotesState.activeId = note.id;
        const saved = persistStickyNotesTabs();
        syncStickyNotesTextarea();
        syncStickyNotesMeta(note.text || "", saved);
        const textarea = document.getElementById("stickyNotesText");
        if (textarea) textarea.focus();
    }

    function copyStickyNoteToClipboard() {
        const active = getActiveStickyNote();
        const text = active && active.text ? active.text : "";
        const status = document.getElementById("stickyNotesStatus");
        if (!text) {
            if (status) status.textContent = "Nothing to copy";
            return;
        }
        const markCopied = () => {
            if (status) status.textContent = "Copied";
            window.setTimeout(() => syncStickyNotesMeta(text, true), 900);
        };
        const fallbackCopy = () => {
            const helper = document.createElement("textarea");
            helper.value = text;
            helper.style.position = "fixed";
            helper.style.left = "-9999px";
            document.body.appendChild(helper);
            helper.select();
            document.execCommand("copy");
            document.body.removeChild(helper);
            markCopied();
        };
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(markCopied).catch(fallbackCopy);
                return;
            }
        } catch (error) {}
        try {
            fallbackCopy();
        } catch (error) {
            if (status) status.textContent = "Copy failed";
        }
    }

    function importStickyNoteSource() {
        const status = document.getElementById("stickyNotesStatus");
        try {
            if (!window.cep || !window.cep.fs || !window.cep.fs.showOpenDialog) {
                if (status) status.textContent = "Import unavailable";
                return;
            }
            const result = window.cep.fs.showOpenDialog(false, false, "Import Note Source", "", ["txt", "md", "srt", "csv", "json"]);
            const filePath = result && result.data && result.data[0] ? result.data[0] : "";
            if (!filePath) return;
            const ext = (filePath.split(".").pop() || "").toLowerCase();
            if (["mp4", "mov", "mkv", "avi", "mp3", "wav", "m4a", "aac", "flac"].indexOf(ext) !== -1) {
                if (status) status.textContent = "Text only";
                return;
            }
            const read = window.cep.fs.readFile(filePath);
            if (!read || read.err !== 0 || typeof read.data !== "string") {
                if (status) status.textContent = "Import failed";
                return;
            }
            if (read.data.length > stickyNotesMaxImportChars) {
                if (status) status.textContent = "File too large";
                return;
            }
            const fileName = filePath.split(/[\\/]/).pop() || "Imported Source";
            const note = createStickyNote("Source: " + fileName + "\n\n" + read.data);
            stickyNotesState.notes.push(note);
            stickyNotesState.activeId = note.id;
            const saved = persistStickyNotesTabs();
            syncStickyNotesTextarea();
            syncStickyNotesMeta(note.text || "", saved);
            if (status) status.textContent = "Imported";
        } catch (error) {
            if (status) status.textContent = "Import failed";
        }
    }

    function loadStickyNotesText() {
        try {
            if (window.cep && window.cep.fs) {
                const result = window.cep.fs.readFile(getGraphPresetStorageFolder() + "/" + stickyNotesStorageFileName);
                if (result && result.err === 0 && typeof result.data === "string") return result.data;
            }
            if (!window.localStorage) return "";
            return window.localStorage.getItem(stickyNotesStorageKey) || "";
        } catch (error) {
            return "";
        }
    }

    function saveStickyNotesText(value) {
        let saved = false;
        try {
            if (window.localStorage) window.localStorage.setItem(stickyNotesStorageKey, value || "");
            saved = true;
        } catch (error) {}
        try {
            if (window.cep && window.cep.fs) {
                ensureGraphPresetStorageFolder();
                const result = window.cep.fs.writeFile(getGraphPresetStorageFolder() + "/" + stickyNotesStorageFileName, value || "");
                saved = saved || !!(result && result.err === 0);
            }
        } catch (error) {}
        return saved;
    }

    function getDeletedStickyNoteText() {
        try {
            if (!window.localStorage) return "";
            return window.localStorage.getItem(stickyNotesDeletedStorageKey) || "";
        } catch (error) {
            return "";
        }
    }

    function getDeletedStickyNotePayload() {
        const raw = getDeletedStickyNoteText();
        if (!raw) return null;
        try {
            const payload = JSON.parse(raw);
            if (payload && payload.note && typeof payload.note.text === "string") return payload;
        } catch (error) {}
        return { note: createStickyNote(raw), index: stickyNotesState.notes.length };
    }

    function setDeletedStickyNoteText(value) {
        try {
            if (!window.localStorage) return;
            if (value) window.localStorage.setItem(stickyNotesDeletedStorageKey, value);
            else window.localStorage.removeItem(stickyNotesDeletedStorageKey);
        } catch (error) {}
    }

    function syncStickyNotesUndoButton() {
        const undoBtn = document.getElementById("btnStickyNotesUndoDelete");
        if (undoBtn) undoBtn.disabled = !getDeletedStickyNoteText();
    }

    function syncStickyNotesMeta(text, saved) {
        const status = document.getElementById("stickyNotesStatus");
        const count = document.getElementById("stickyNotesCount");
        const length = String(text || "").length;
        const words = String(text || "").trim() ? String(text || "").trim().split(/\s+/).length : 0;
        const lines = String(text || "").split(/\r\n|\r|\n/).length;
        if (status) status.textContent = saved === false ? "Save failed" : "Autosaved";
        if (count) count.textContent = words + " words / " + length + " chars / " + lines + " lines";
    }

    function initStickyNotes() {
        const btn = document.getElementById("btnStickyNotes");
        const addBtn = document.getElementById("btnStickyNotesAdd");
        const closeBtn = document.getElementById("btnStickyNotesClose");
        const undoBtn = document.getElementById("btnStickyNotesUndoDelete");
        const clearBtn = document.getElementById("btnStickyNotesClear");
        const copyBtn = document.getElementById("btnStickyNotesCopy");
        const timeBtn = document.getElementById("btnStickyNotesTime");
        const importBtn = document.getElementById("btnStickyNotesImport");
        const checklistBtn = document.getElementById("btnStickyNotesChecklist");
        const duplicateBtn = document.getElementById("btnStickyNotesDuplicate");
        const searchInput = document.getElementById("stickyNotesSearch");
        const textarea = document.getElementById("stickyNotesText");
        const panel = document.getElementById("stickyNotesPanel");
        if (!btn || !textarea || !panel) return;

        const loaded = loadStickyNotesTabs();
        stickyNotesState.notes = loaded.notes;
        stickyNotesState.activeId = loaded.activeId;
        syncStickyNotesTextarea();
        syncStickyNotesUndoButton();

        btn.onclick = () => setStickyNotesOpen(!panel.classList.contains("active"));
        if (addBtn) addBtn.onclick = addStickyNoteTab;
        if (closeBtn) closeBtn.onclick = () => setStickyNotesOpen(false);
        if (copyBtn) copyBtn.onclick = copyStickyNoteToClipboard;
        if (timeBtn) timeBtn.onclick = insertStickyNoteTimestamp;
        if (importBtn) importBtn.onclick = importStickyNoteSource;
        if (checklistBtn) checklistBtn.onclick = insertStickyNoteChecklist;
        if (duplicateBtn) duplicateBtn.onclick = duplicateStickyNoteTab;
        if (searchInput) searchInput.addEventListener("input", renderStickyNoteTabs);
        if (undoBtn) {
            undoBtn.onclick = () => {
                const deletedPayload = getDeletedStickyNotePayload();
                if (!deletedPayload || !deletedPayload.note) return;
                const note = deletedPayload.note;
                if (stickyNotesState.notes.some(existing => existing.id === note.id)) {
                    note.id = "note-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
                }
                const insertAt = Math.max(0, Math.min(stickyNotesState.notes.length, deletedPayload.index || 0));
                stickyNotesState.notes.splice(insertAt, 0, note);
                stickyNotesState.activeId = note.id;
                textarea.value = note.text || "";
                setDeletedStickyNoteText("");
                const saved = persistStickyNotesTabs();
                syncStickyNotesMeta(textarea.value, saved);
                syncStickyNotesTextarea();
                syncStickyNotesUndoButton();
                textarea.focus();
            };
        }
        if (clearBtn) {
            clearBtn.onclick = () => {
                const active = getActiveStickyNote();
                if (!active) return;
                const deleteIndex = Math.max(0, stickyNotesState.notes.findIndex(note => note.id === active.id));
                setDeletedStickyNoteText(JSON.stringify({ note: active, index: deleteIndex, deletedAt: Date.now() }));
                stickyNotesState.notes = stickyNotesState.notes.filter(note => note.id !== active.id);
                if (!stickyNotesState.notes.length) stickyNotesState.notes.push(createStickyNote(""));
                const nextIndex = Math.min(deleteIndex, stickyNotesState.notes.length - 1);
                stickyNotesState.activeId = stickyNotesState.notes[nextIndex].id;
                const saved = persistStickyNotesTabs();
                syncStickyNotesTextarea();
                syncStickyNotesMeta((getActiveStickyNote() || {}).text || "", saved);
                syncStickyNotesUndoButton();
                textarea.focus();
            };
        }
        textarea.addEventListener("input", () => {
            const active = getActiveStickyNote();
            if (active) {
                active.text = textarea.value;
                active.updatedAt = Date.now();
            }
            const saved = persistStickyNotesTabs();
            syncStickyNotesMeta(textarea.value, saved);
            renderStickyNoteTabs();
        });
        document.addEventListener("keydown", (evt) => {
            if (evt.key === "Escape" && panel.classList.contains("active")) setStickyNotesOpen(false);
        });
    }

    function syncKwvSocialDockVisibility() {
        const dock = document.getElementById("kwvSocialsDock");
        const activeOverlay = document.querySelector(
            "#aiHubModal.active, #kwvSettingsOverlay.active, #graphOverlay.active, #presetSettingsOverlay.active, #appleSettingsOverlay.active, .srt-modal-overlay.active, .apple-preset-settings-overlay.active, .apple-settings-overlay.active"
        );
        const shouldHide = !!activeOverlay;
        document.body.classList.toggle("kwv-socials-hidden", shouldHide);
        if (dock && shouldHide) {
            dock.classList.remove("open");
            document.body.classList.remove("kwv-socials-open");
        }
    }

    function initKwvSocialsPanel() {
        const dock = document.getElementById("kwvSocialsDock");
        const launch = document.getElementById("btnKwvSocials");
        const closeBtn = document.getElementById("btnKwvSocialsClose");
        const setSocialsOpen = (shouldOpen) => {
            if (!dock) return;
            dock.classList.toggle("open", !!shouldOpen);
            document.body.classList.toggle("kwv-socials-open", !!shouldOpen);
            if (shouldOpen) setStickyNotesOpen(false);
        };
        if (launch && dock) {
            launch.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                syncKwvSocialDockVisibility();
                if (document.body.classList.contains("kwv-socials-hidden")) return;
                setSocialsOpen(!dock.classList.contains("open"));
            };
        }
        if (closeBtn && dock) {
            closeBtn.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                setSocialsOpen(false);
            };
        }
        document.querySelectorAll("[data-social-url]").forEach((button) => {
            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                const url = button.getAttribute("data-social-url") || "";
                if (url) openExternalUrl(url);
                setSocialsOpen(false);
            };
        });
        document.addEventListener("click", (event) => {
            if (!dock || dock.contains(event.target)) return;
            setSocialsOpen(false);
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && dock) setSocialsOpen(false);
        });
        if (window.MutationObserver) {
            const observer = new MutationObserver(syncKwvSocialDockVisibility);
            document.querySelectorAll("#aiHubModal, #kwvSettingsOverlay, #graphOverlay, #presetSettingsOverlay, #appleSettingsOverlay, .srt-modal-overlay, .apple-preset-settings-overlay, .apple-settings-overlay").forEach((overlay) => {
                observer.observe(overlay, { attributes: true, attributeFilter: ["class", "aria-hidden"] });
            });
        }
        syncKwvSocialDockVisibility();
    }

    function makeCocoSwatch(config) {
        const h = wrapHue(cocoState.h + config.h);
        const s = clamp((cocoState.s * config.s) + (config.sAdd || 0), 18, 100);
        const v = clamp((cocoState.v * config.v) + (config.vAdd || 0), 24, 100);
        const rgb = hsvToRgb(h, s, v);
        return { h, s, v, rgb, hex: rgbToHex(rgb) };
    }

    function getCocoFormulaConfigs(formulaId) {
        const presets = {
            monochromatic: [
                { h: -6, s: 0.18, v: 1.02, sAdd: 8, vAdd: 2 },
                { h: -2, s: 0.38, v: 0.96, sAdd: 4 },
                { h: 0, s: 1.00, v: 1.00 },
                { h: 4, s: 0.76, v: 0.76, vAdd: -6 },
                { h: 8, s: 0.52, v: 0.52, vAdd: -10 }
            ],
            analogous: [
                { h: -52, s: 0.70, v: 0.84, sAdd: -4 },
                { h: -24, s: 0.88, v: 0.93 },
                { h: 0, s: 1.00, v: 1.00 },
                { h: 20, s: 0.90, v: 0.94 },
                { h: 46, s: 0.72, v: 0.84, sAdd: -6 }
            ],
            complementary: [
                { h: 0, s: 1.00, v: 1.00 },
                { h: 24, s: 0.72, v: 0.80, sAdd: -4 },
                { h: 180, s: 0.92, v: 0.94 },
                { h: 196, s: 0.74, v: 0.74, vAdd: -4 },
                { h: 180, s: 0.42, v: 0.48, sAdd: -6 }
            ],
            splitComplementary: [
                { h: 0, s: 1.00, v: 1.00 },
                { h: 148, s: 0.84, v: 0.92 },
                { h: 208, s: 0.86, v: 0.92 },
                { h: -18, s: 0.70, v: 0.76 },
                { h: 16, s: 0.68, v: 0.74 }
            ],
            triadic: [
                { h: 0, s: 1.00, v: 1.00 },
                { h: 120, s: 0.84, v: 0.92 },
                { h: 238, s: 0.86, v: 0.93 },
                { h: 120, s: 0.50, v: 0.66, sAdd: -2 },
                { h: 238, s: 0.52, v: 0.64, sAdd: -2 }
            ],
            tetradic: [
                { h: 0, s: 1.00, v: 1.00 },
                { h: 54, s: 0.84, v: 0.95 },
                { h: 176, s: 0.86, v: 0.90 },
                { h: 232, s: 0.78, v: 0.80 },
                { h: 304, s: 0.76, v: 0.90 }
            ]
        };
        return presets[formulaId] || presets.analogous;
    }

    function rebuildCocoPalettes() {
        cocoState.palettes = {};
        cocoPaletteMeta.forEach((meta) => {
            cocoState.palettes[meta.id] = getCocoFormulaConfigs(meta.id).map(makeCocoSwatch);
        });
    }

    function buildGradientCss(type, angle, colors) {
        if (type === "radial") return "radial-gradient(circle at 30% 30%, " + colors.join(", ") + ")";
        if (type === "conic") return "conic-gradient(from " + angle + "deg at 50% 50%, " + colors.join(", ") + ")";
        return "linear-gradient(" + angle + "deg, " + colors.join(", ") + ")";
    }

    function getGradientHexSamples(palette, total) {
        const samples = [];
        const source = (palette || []).map((swatch) => swatch && swatch.rgb ? swatch.rgb : hexToRgb(swatch.hex));
        if (source.length === 0 || total <= 0) return samples;
        if (source.length === 1) {
            for (let i = 0; i < total; i++) samples.push(rgbToHex(source[0]));
            return samples;
        }
        for (let i = 0; i < total; i++) {
            const position = total === 1 ? 0 : i / (total - 1);
            const scaled = position * (source.length - 1);
            const index = Math.floor(scaled);
            const nextIndex = Math.min(source.length - 1, index + 1);
            const mix = scaled - index;
            samples.push(rgbToHex(interpolateRgb(source[index], source[nextIndex], mix)));
        }
        return samples;
    }

    function mixHexColors(firstHex, secondHex, amount) {
        const first = hexToRgb(firstHex) || [255, 255, 255];
        const second = hexToRgb(secondHex) || [255, 255, 255];
        return rgbToHex(interpolateRgb(first, second, clamp(amount, 0, 1)));
    }

    function makeCocoGradientHex(h, s, v) {
        return rgbToHex(hsvToRgb(wrapHue(h), clamp(s, 26, 100), clamp(v, 18, 100)));
    }

    function getCocoGradientFamilyConfigs() {
        return [
            {
                id: "smooth",
                label: "Smooth",
                tag: "Soft Fade",
                hueShift: -18,
                hueOffsets: [-12, 22, 138, 220],
                satScale: [0.62, 0.74, 0.68, 0.72],
                valScale: [1.08, 1.00, 0.90, 0.80],
                satAdd: [2, 0, -2, -6],
                valAdd: [12, 4, -4, -10],
                opacity: 100,
                blend: 100,
                jitter: 0,
                spread: 0.44,
                previewBlend: "screen"
            },
            {
                id: "bold",
                label: "Bold",
                tag: "Punch Mix",
                hueShift: 8,
                hueOffsets: [-8, 36, 164, 246],
                satScale: [0.90, 0.88, 0.94, 0.96],
                valScale: [1.00, 0.96, 0.82, 0.76],
                satAdd: [6, 4, 2, 0],
                valAdd: [4, 2, -8, -12],
                opacity: 100,
                blend: 100,
                jitter: 0,
                spread: 0.42,
                previewBlend: "screen"
            },
            {
                id: "neon",
                label: "Neon",
                tag: "Glow Pop",
                hueShift: 24,
                hueOffsets: [0, 74, 170, 254],
                satScale: [1.00, 0.98, 1.00, 1.00],
                valScale: [1.06, 1.00, 0.94, 0.98],
                satAdd: [8, 6, 6, 8],
                valAdd: [10, 4, -2, 2],
                opacity: 100,
                blend: 100,
                jitter: 0,
                spread: 0.40,
                previewBlend: "screen"
            },
            {
                id: "deep",
                label: "Deep",
                tag: "Dark Luxe",
                hueShift: -30,
                hueOffsets: [-6, 30, 192, 268],
                satScale: [0.82, 0.76, 0.84, 0.88],
                valScale: [0.88, 0.72, 0.58, 0.64],
                satAdd: [2, 0, 2, 4],
                valAdd: [0, -10, -18, -12],
                opacity: 100,
                blend: 100,
                jitter: 0,
                spread: 0.46,
                previewBlend: "screen"
            }
        ];
    }

    function getCocoFourColorPresetPoints(index, familyId) {
        const layouts = {
            smooth: [
                [[0.18, 0.16], [0.82, 0.18], [0.28, 0.72], [0.76, 0.82]],
                [[0.22, 0.12], [0.74, 0.24], [0.16, 0.80], [0.84, 0.72]],
                [[0.12, 0.24], [0.84, 0.14], [0.30, 0.84], [0.74, 0.68]],
                [[0.26, 0.18], [0.80, 0.30], [0.20, 0.68], [0.70, 0.86]],
                [[0.14, 0.18], [0.76, 0.18], [0.38, 0.62], [0.84, 0.84]]
            ],
            bold: [
                [[0.10, 0.12], [0.90, 0.12], [0.12, 0.88], [0.90, 0.88]],
                [[0.16, 0.12], [0.88, 0.26], [0.24, 0.84], [0.84, 0.76]],
                [[0.10, 0.18], [0.82, 0.10], [0.34, 0.88], [0.92, 0.78]],
                [[0.22, 0.10], [0.92, 0.22], [0.10, 0.72], [0.74, 0.92]],
                [[0.12, 0.24], [0.90, 0.14], [0.18, 0.78], [0.86, 0.86]]
            ],
            neon: [
                [[0.14, 0.14], [0.88, 0.16], [0.16, 0.86], [0.86, 0.84]],
                [[0.08, 0.22], [0.82, 0.10], [0.28, 0.88], [0.92, 0.72]],
                [[0.22, 0.08], [0.92, 0.28], [0.10, 0.76], [0.78, 0.92]],
                [[0.12, 0.10], [0.78, 0.20], [0.24, 0.92], [0.90, 0.80]],
                [[0.20, 0.14], [0.88, 0.08], [0.12, 0.84], [0.82, 0.90]]
            ],
            deep: [
                [[0.18, 0.14], [0.78, 0.18], [0.22, 0.82], [0.86, 0.78]],
                [[0.24, 0.12], [0.88, 0.24], [0.10, 0.76], [0.74, 0.90]],
                [[0.12, 0.18], [0.82, 0.12], [0.28, 0.86], [0.88, 0.82]],
                [[0.20, 0.20], [0.76, 0.10], [0.16, 0.70], [0.82, 0.88]],
                [[0.10, 0.12], [0.72, 0.22], [0.34, 0.82], [0.90, 0.74]]
            ]
        };
        const familyLayouts = layouts[familyId] || layouts.smooth;
        const layout = familyLayouts[index % familyLayouts.length];
        const driftX = ((Math.floor(index / 5) % 5) - 2) * 0.018;
        const driftY = ((Math.floor(index / 10) % 5) - 2) * 0.015;
        return layout.map((point, pointIndex) => makeUnitPoint(
            point[0] + driftX * (pointIndex % 2 === 0 ? -1 : 1),
            point[1] + driftY * (pointIndex < 2 ? -1 : 1)
        ));
    }

    function buildCocoFourColorPreset(family, variantIndex, globalIndex) {
        const lane = variantIndex % 5;
        const row = Math.floor(variantIndex / 5);
        const drift = (row * 12) + (lane * 4);
        const colors = [];

        for (let i = 0; i < 4; i++) {
            const hue = cocoState.h + family.hueShift + family.hueOffsets[i] + drift + ((i % 2 === 0) ? lane * 2 : -lane * 2);
            const saturation = (cocoState.s * family.satScale[i]) + family.satAdd[i] + (lane * 2) - row;
            const value = (cocoState.v * family.valScale[i]) + family.valAdd[i] - (row * 1.8) + (i === 0 ? 2 : 0);
            colors.push(makeCocoGradientHex(hue, saturation, value));
        }

        const points = getCocoFourColorPresetPoints(variantIndex, family.id);
        const step = makeFourColorGradientStep(
            "KESHAV Gradient " + String(globalIndex + 1).padStart(3, "0"),
            colors,
            points,
            family.opacity,
            family.blend,
            family.spread,
            family.jitter,
            family.previewBlend
        );
        const preview = buildGradientPreviewSurface([step]);

        return {
            key: family.id + "-" + String(variantIndex + 1).padStart(2, "0"),
            title: "G" + String(globalIndex + 1).padStart(3, "0"),
            source: family.label,
            type: family.id,
            angle: 0,
            stopCount: 4,
            styleLabel: family.tag,
            css: preview.image || preview.color,
            colors: colors,
            steps: [step],
            previewColor: preview.color,
            previewImage: preview.image,
            previewBlendMode: preview.blendMode
        };
    }

    function buildCocoGradientColorSet(palette, type) {
        const source = palette || [];
        if (source.length === 0) return [];

        const samples = getGradientHexSamples(source, 4);
        while (samples.length < 4) samples.push(samples[samples.length - 1] || source[0].hex);
        const anchor = source[Math.min(2, source.length - 1)] || source[0];
        const anchorHex = anchor ? anchor.hex : samples[1];

        if (type === "radial") {
            return [
                mixHexColors(anchorHex, "#FFFFFF", 0.16),
                samples[1],
                mixHexColors(samples[2], anchorHex, 0.35),
                mixHexColors(samples[3], "#0D1018", 0.18)
            ];
        }

        if (type === "conic") {
            return [
                anchorHex,
                mixHexColors(samples[1], samples[0], 0.25),
                samples[2],
                mixHexColors(samples[3], anchorHex, 0.18)
            ];
        }

        return [
            samples[0],
            mixHexColors(samples[1], anchorHex, 0.18),
            mixHexColors(samples[2], samples[3], 0.14),
            samples[3]
        ];
    }

    function makeUnitPoint(x, y) {
        return [clamp(x, 0.04, 0.96), clamp(y, 0.04, 0.96)];
    }

    function getGradientStopProgress(index, total) {
        return total <= 1 ? 0.5 : index / (total - 1);
    }

    function getLinearOverlayPoint(angle, progress, offset) {
        const radians = (((angle || 0) - 90) * Math.PI) / 180;
        const reach = 0.64;
        const startX = 0.5 - (Math.cos(radians) * reach);
        const startY = 0.5 - (Math.sin(radians) * reach);
        const endX = 0.5 + (Math.cos(radians) * reach);
        const endY = 0.5 + (Math.sin(radians) * reach);
        const baseX = startX + ((endX - startX) * progress);
        const baseY = startY + ((endY - startY) * progress);
        const perpX = -Math.sin(radians) * (offset || 0);
        const perpY = Math.cos(radians) * (offset || 0);
        return makeUnitPoint(baseX + perpX, baseY + perpY);
    }

    function getCircularOverlayPoint(angle, progress, radius) {
        const radians = ((((angle || 0) - 90) + (progress * 360)) * Math.PI) / 180;
        return makeUnitPoint(
            0.5 + (Math.cos(radians) * radius),
            0.5 + (Math.sin(radians) * radius)
        );
    }

    function makeFourColorGradientStep(name, colors, points, opacity, blend, spread, jitter, previewBlend) {
        return {
            kind: "fourColor",
            name: name,
            opacity: opacity,
            blend: blend,
            jitter: jitter == null ? 0 : jitter,
            spread: spread,
            points: points,
            colors: colors,
            previewBlend: previewBlend || "screen"
        };
    }

    function makeRampGradientStep(name, gradientType, angle, startColor, endColor, previewStops) {
        return {
            kind: "ramp",
            name: name,
            gradientType: gradientType,
            angle: angle,
            startColor: startColor,
            endColor: endColor,
            previewStops: Array.isArray(previewStops) ? previewStops.slice() : null
        };
    }

    function buildLinearGradientPoints(angle) {
        return [
            getLinearOverlayPoint(angle, 0.08, -0.18),
            getLinearOverlayPoint(angle, 0.34, 0.14),
            getLinearOverlayPoint(angle, 0.68, -0.12),
            getLinearOverlayPoint(angle, 0.92, 0.16)
        ];
    }

    function buildRadialGradientPoints(angle) {
        return [
            makeUnitPoint(0.26, 0.26),
            getCircularOverlayPoint(angle + 22, 0.18, 0.22),
            getCircularOverlayPoint(angle + 112, 0.56, 0.28),
            makeUnitPoint(0.78, 0.74)
        ];
    }

    function buildConicGradientPoints(angle) {
        return [0, 0.25, 0.5, 0.75].map((progress, index) => getCircularOverlayPoint(angle + (index * 10), progress, index % 2 === 0 ? 0.36 : 0.28));
    }

    function buildLinearGradientSteps(angle, colors) {
        const first = colors[0];
        const last = colors[colors.length - 1] || colors[0];
        return [
            makeRampGradientStep("KESHAV Gradient Base", "linear", angle, first, last),
            makeFourColorGradientStep("KESHAV Gradient Blend", colors, buildLinearGradientPoints(angle), 88, 78, 0.44, 0, "screen")
        ];
    }

    function buildRadialGradientSteps(angle, colors) {
        const centerColor = colors[1] || colors[0];
        const edgeColor = colors[colors.length - 1] || colors[0];
        return [
            makeRampGradientStep("KESHAV Gradient Base", "radial", angle || 0, centerColor, edgeColor),
            makeFourColorGradientStep("KESHAV Gradient Halo", colors, buildRadialGradientPoints(angle || 0), 86, 82, 0.38, 0, "lighten")
        ];
    }

    function buildConicGradientSteps(angle, colors) {
        return [
            makeRampGradientStep("KESHAV Gradient Base", "linear", angle - 25, colors[0], colors[2] || colors[colors.length - 1] || colors[0]),
            makeFourColorGradientStep("KESHAV Gradient Orbit", colors, buildConicGradientPoints(angle), 92, 88, 0.36, 0, "screen")
        ];
    }

    function buildCocoGradientSteps(type, angle, colors) {
        if (type === "radial") return buildRadialGradientSteps(angle, colors);
        if (type === "conic") return buildConicGradientSteps(angle, colors);
        return buildLinearGradientSteps(angle, colors);
    }

    function hexToRgbaCss(hex, alpha) {
        const rgb = hexToRgb(hex) || [255, 255, 255];
        return "rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", " + clamp(alpha, 0, 1).toFixed(3) + ")";
    }

    function buildGradientPreviewSurface(steps) {
        const overlayImages = [];
        const overlayBlends = [];
        let baseImage = "";
        let baseColor = "#121212";

        (steps || []).forEach((step) => {
            if (!step) return;
            if (step.kind === "ramp") {
                const previewStops = Array.isArray(step.previewStops) && step.previewStops.length > 1
                    ? step.previewStops.slice()
                    : [step.startColor, step.endColor];
                baseImage = buildGradientCss(step.gradientType || "linear", step.angle || 0, previewStops);
                baseColor = step.startColor || baseColor;
                return;
            }
            if (step.kind !== "fourColor") return;

            const opacity = clamp(((step.opacity == null ? 100 : step.opacity) / 100), 0, 1);
            const spread = Math.round(clamp((step.spread || 0.4) * 100, 24, 64));
            const innerStop = Math.max(12, Math.round(spread * 0.35));
            (step.points || []).forEach((point, index) => {
                const color = step.colors && step.colors[index];
                if (!color || !point || point.length < 2) return;
                if (!baseImage && baseColor === "#121212") baseColor = color;
                overlayImages.push(
                    "radial-gradient(circle at " + Math.round(point[0] * 100) + "% " + Math.round(point[1] * 100) + "%, " +
                    hexToRgbaCss(color, opacity) + " 0%, " +
                    hexToRgbaCss(color, opacity * 0.72) + " " + innerStop + "%, " +
                    hexToRgbaCss(color, 0) + " " + spread + "%)"
                );
                overlayBlends.push(step.previewBlend || "screen");
            });
        });

        const images = baseImage ? overlayImages.concat([baseImage]) : overlayImages;
        const blendMode = baseImage ? overlayBlends.concat(["normal"]) : overlayBlends;
        return {
            color: baseColor,
            image: images.join(", "),
            blendMode: blendMode.join(", ")
        };
    }

    function clearCocoSurface(element) {
        if (!element) return;
        element.style.background = "";
        element.style.backgroundColor = "";
        element.style.backgroundImage = "";
        element.style.backgroundBlendMode = "";
        element.style.backgroundRepeat = "";
        element.style.backgroundPosition = "";
        element.style.backgroundSize = "";
    }

    function paintCocoGradientSurface(element, gradient) {
        if (!element || !gradient) return;
        clearCocoSurface(element);
        element.style.backgroundColor = gradient.previewColor || "#121212";
        element.style.backgroundImage = gradient.previewImage || "";
        element.style.backgroundBlendMode = gradient.previewBlendMode || "normal";
        element.style.backgroundRepeat = "no-repeat";
        element.style.backgroundPosition = "center";
        element.style.backgroundSize = "cover";
    }

    function paintCocoPaletteSurface(element, palette) {
        if (!element) return;
        clearCocoSurface(element);
        if (!palette || palette.length === 0) return;
        const stops = [];
        for (let i = 0; i < palette.length; i++) {
            const start = Math.round((i / palette.length) * 100);
            const end = Math.round(((i + 1) / palette.length) * 100);
            stops.push(palette[i].hex + " " + start + "%");
            stops.push(palette[i].hex + " " + end + "%");
        }
        element.style.backgroundImage = [
            "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 24%)",
            "linear-gradient(135deg, " + stops.join(", ") + ")"
        ].join(", ");
        element.style.backgroundColor = palette[0].hex;
        element.style.backgroundBlendMode = "screen, normal";
    }

    function paintCocoSolidSurface(element, hex) {
        if (!element) return;
        clearCocoSurface(element);
        element.style.backgroundColor = hex;
        element.style.backgroundImage = "linear-gradient(180deg, " + mixHexColors(hex, "#FFFFFF", 0.04) + " 0%, " + hex + " 100%)";
        element.style.backgroundBlendMode = "normal";
    }

    function paintCocoFlatSurface(element, hex) {
        if (!element) return;
        clearCocoSurface(element);
        element.style.backgroundColor = hex;
        element.style.backgroundImage = "";
        element.style.backgroundBlendMode = "normal";
    }

    function getHexSortMeta(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return { h: 0, s: 0, v: 0 };
        const hsv = rgbToHsv(rgb);
        return {
            h: roundGraphValue(hsv.h),
            s: roundGraphValue(hsv.s),
            v: roundGraphValue(hsv.v)
        };
    }

    function compareHexAscending(firstHex, secondHex) {
        const first = getHexSortMeta(firstHex);
        const second = getHexSortMeta(secondHex);
        if (first.h !== second.h) return first.h - second.h;
        if (first.s !== second.s) return second.s - first.s;
        return second.v - first.v;
    }

    function sortSolidHexPalette(hexList) {
        return (hexList || []).slice().sort(compareHexAscending);
    }

    function sortGradientHexSet(colors) {
        return (colors || []).slice().sort(compareHexAscending);
    }

    function getGradientItemSortMeta(item) {
        const colors = item && item.gradient && item.gradient.colors ? item.gradient.colors : [];
        const sorted = sortGradientHexSet(colors);
        const primary = sorted[0] || "#000000";
        const secondary = sorted[1] || primary;
        const first = getHexSortMeta(primary);
        const second = getHexSortMeta(secondary);
        return {
            h: first.h,
            s: first.s,
            v: first.v,
            h2: second.h
        };
    }

    function sortGradientItemsAscending(items) {
        return (items || []).slice().sort((a, b) => {
            const first = getGradientItemSortMeta(a);
            const second = getGradientItemSortMeta(b);
            if (first.h !== second.h) return first.h - second.h;
            if (first.h2 !== second.h2) return first.h2 - second.h2;
            if (first.s !== second.s) return second.s - first.s;
            return second.v - first.v;
        });
    }

    function nextCocoBoardKey(prefix) {
        cocoBoardState.keyCounter++;
        return String(prefix || "coco") + "-" + cocoBoardState.keyCounter;
    }

    function createCocoSolidBoardItem(hex, label, source) {
        return {
            key: nextCocoBoardKey("solid"),
            kind: "solid",
            hex: rgbToHex(hexToRgb(hex) || [255, 85, 0]),
            label: label || "",
            source: source || "solid"
        };
    }

    function createCocoPaletteBoardItem(deck, source) {
        const colors = (deck.colors || []).map((hex) => rgbToHex(hexToRgb(hex) || [255, 255, 255]));
        return {
            key: nextCocoBoardKey(source === "brand" ? "brand" : "palette"),
            kind: source === "brand" ? "brand" : "palette",
            label: deck.label || "",
            source: source || "palette",
            colors: colors,
            hex: colors[0] || "#FFFFFF"
        };
    }

    function getCocoBoardPointSets() {
        return [
            [makeUnitPoint(0.12, 0.14), makeUnitPoint(0.88, 0.14), makeUnitPoint(0.18, 0.86), makeUnitPoint(0.86, 0.86)],
            [makeUnitPoint(0.20, 0.10), makeUnitPoint(0.82, 0.22), makeUnitPoint(0.12, 0.76), makeUnitPoint(0.74, 0.90)],
            [makeUnitPoint(0.10, 0.22), makeUnitPoint(0.84, 0.10), makeUnitPoint(0.28, 0.86), makeUnitPoint(0.92, 0.72)],
            [makeUnitPoint(0.24, 0.14), makeUnitPoint(0.92, 0.28), makeUnitPoint(0.10, 0.70), makeUnitPoint(0.78, 0.92)],
            [makeUnitPoint(0.16, 0.12), makeUnitPoint(0.78, 0.18), makeUnitPoint(0.24, 0.84), makeUnitPoint(0.88, 0.78)]
        ];
    }

    function createCocoGradientBoardItem(colors, label, source, layoutIndex) {
        const safeColors = sortGradientHexSet((colors || []).slice(0, 4).map((hex) => rgbToHex(hexToRgb(hex) || [255, 255, 255])));
        while (safeColors.length < 4) safeColors.push(safeColors[safeColors.length - 1] || "#FFFFFF");
        const layouts = getCocoBoardPointSets();
        const step = makeFourColorGradientStep(
            label || "KESHAV Color",
            safeColors,
            layouts[Math.abs(layoutIndex || 0) % layouts.length],
            100,
            100,
            0.42,
            0,
            "screen"
        );
        const preview = buildGradientPreviewSurface([step]);
        return {
            key: nextCocoBoardKey("grad"),
            kind: "gradient",
            label: label || "",
            source: source || "gradient",
            colors: safeColors,
            gradient: {
                key: nextCocoBoardKey("gradfx"),
                title: label || "KESHAV Gradient",
                type: "linear",
                angle: 0,
                colors: safeColors,
                steps: [step],
                previewColor: preview.color,
                previewImage: preview.image,
                previewBlendMode: preview.blendMode
            }
        };
    }

    function createCocoRampGradientItem(startHex, endHex, label, source, angle) {
        const first = rgbToHex(hexToRgb(startHex) || [255, 255, 255]);
        const second = rgbToHex(hexToRgb(endHex) || [255, 255, 255]);
        const rampAngle = parseInt(angle, 10);
        const safeAngle = isNaN(rampAngle) ? 135 : rampAngle;
        const managedName = "KESHAV Gradient - " + (label || "Custom");
        const baseStep = makeRampGradientStep(
            managedName + " Base",
            "linear",
            safeAngle,
            first,
            second
        );
        const accentColors = [
            mixHexColors(first, "#FFFFFF", 0.22),
            mixHexColors(first, second, 0.26),
            mixHexColors(second, first, 0.22),
            mixHexColors(second, "#06080C", 0.22)
        ];
        const accentStep = makeFourColorGradientStep(
            managedName + " Accent",
            accentColors,
            buildLinearGradientPoints(safeAngle + 14),
            84,
            80,
            0.42,
            0,
            "screen"
        );
        const preview = buildGradientPreviewSurface([baseStep, accentStep]);
        return {
            key: nextCocoBoardKey("grad"),
            kind: "gradient",
            label: label || "",
            source: source || "gradient",
            colors: [first, second],
            gradient: {
                key: nextCocoBoardKey("gradfx"),
                title: label || "KESHAV Gradient",
                type: "linear",
                angle: safeAngle,
                colors: [first, second],
                steps: [baseStep, accentStep],
                previewColor: preview.color,
                previewImage: preview.image,
                previewBlendMode: preview.blendMode
            }
        };
    }

    function buildShowcaseSpecFromPair(label, family, startHex, endHex, angle) {
        const start = normalizeShowcaseGradientColor(startHex, "#F2F2F2");
        const end = normalizeShowcaseGradientColor(endHex, "#06070A");
        const safeAngle = parseInt(angle, 10);
        return {
            label: label,
            family: family,
            angle: isNaN(safeAngle) ? 180 : safeAngle,
            top: mixHexColors(start, "#FFFFFF", 0.14),
            mid: mixHexColors(start, end, 0.28),
            low: mixHexColors(end, start, 0.14),
            bottom: mixHexColors(end, "#020202", 0.18)
        };
    }

    function buildShowcaseGradientPoints(index, variant) {
        const drift = ((Math.abs(index || 0) % 5) - 2) * 0.024;
        if (variant === "depth") {
            return [
                makeUnitPoint(0.18 - drift, 0.14),
                makeUnitPoint(0.82 + drift, 0.34),
                makeUnitPoint(0.26 - drift, 0.76),
                makeUnitPoint(0.78 + drift, 0.94)
            ];
        }
        return [
            makeUnitPoint(0.50 + drift, 0.07),
            makeUnitPoint(0.66 - drift, 0.26),
            makeUnitPoint(0.42 + drift, 0.62),
            makeUnitPoint(0.54 - drift, 0.93)
        ];
    }

    function normalizeShowcaseGradientColor(hex, fallback) {
        return rgbToHex(hexToRgb(hex) || hexToRgb(fallback || "#FFFFFF") || [255, 255, 255]);
    }

    function intensifyShowcaseTopHex(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        const hsv = rgbToHsv(rgb);
        if (hsv.s < 18) return hex;
        return rgbToHex(hsvToRgb(hsv.h, 100, 100));
    }

    function nudgeGradientHex(hex, seed, slot) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        const hsv = rgbToHsv(rgb);
        const hueShift = (seed * 7) + (slot === "top" ? 2 : slot === "mid" ? 6 : slot === "low" ? 10 : 14);
        let saturation = hsv.s;
        let value = hsv.v;

        if (slot === "top") {
            saturation = clamp(hsv.s + 2, 52, 100);
            value = clamp(hsv.v + 2, 58, 100);
        } else if (slot === "mid") {
            saturation = clamp(hsv.s + 1, 46, 98);
            value = clamp(hsv.v, 38, 88);
        } else if (slot === "low") {
            saturation = clamp(hsv.s + 2, 36, 92);
            value = clamp(hsv.v - 2, 20, 62);
        } else {
            saturation = clamp(hsv.s + 2, 22, 86);
            value = clamp(hsv.v - 2, 2, 22);
        }

        return rgbToHex(hsvToRgb(hsv.h + hueShift, saturation, value));
    }

    function enforceGradientColorRepeatLimit(specs, limit) {
        const maxRepeats = Math.max(1, parseInt(limit, 10) || 3);
        const usage = {};

        return (specs || []).map((spec) => {
            const next = {
                label: spec.label || "",
                family: spec.family || "Showcase",
                angle: spec.angle
            };

            ["top", "mid", "low", "bottom"].forEach((slot) => {
                let hex = normalizeShowcaseGradientColor(spec[slot], slot === "bottom" ? "#020202" : "#FFFFFF");
                let attempts = 0;
                while ((usage[hex] || 0) >= maxRepeats && attempts < 18) {
                    attempts++;
                    hex = nudgeGradientHex(hex, attempts, slot);
                }
                usage[hex] = (usage[hex] || 0) + 1;
                next[slot] = hex;
            });

            return next;
        });
    }

    function createCocoShowcaseGradientItem(spec, index) {
        const top = intensifyShowcaseTopHex(normalizeShowcaseGradientColor(spec.top, "#61D7FF"));
        const bottom = normalizeShowcaseGradientColor(spec.bottom, "#020202");
        const label = spec.label || ("Gradient " + String((index || 0) + 1).padStart(2, "0"));
        const angleValue = parseInt(spec.angle, 10);
        const angle = isNaN(angleValue) ? 180 : angleValue;
        const managedName = "KESHAV Gradient - " + label;

        const baseStep = makeRampGradientStep(
            managedName + " Base",
            "linear",
            angle,
            top,
            bottom
        );
        const preview = buildGradientPreviewSurface([baseStep]);

        return {
            key: nextCocoBoardKey("grad"),
            kind: "gradient",
            label: label,
            source: (spec.family || "Showcase"),
            colors: [top, bottom],
            gradient: {
                key: nextCocoBoardKey("gradfx"),
                title: label,
                type: "linear",
                angle: angle,
                colors: [top, bottom],
                steps: [baseStep],
                previewColor: preview.color,
                previewImage: preview.image,
                previewBlendMode: preview.blendMode
            }
        };
    }

    function createCocoGradientFromSeed(hex, label, source, variant) {
        const rgb = hexToRgb(hex);
        if (!rgb) return null;
        const hsv = rgbToHsv(rgb);
        const seed = parseInt(variant, 10) || 0;
        const colors = [
            makeCocoGradientHex(hsv.h - 10 + (seed * 4), (hsv.s * 0.98) + 6, Math.min(100, hsv.v + 10)),
            makeCocoGradientHex(hsv.h + 46 + (seed * 3), (hsv.s * 0.88) + 8, Math.min(100, hsv.v + 4)),
            makeCocoGradientHex(hsv.h + 158 + (seed * 5), (hsv.s * 0.84) + 2, Math.max(24, hsv.v - 10)),
            makeCocoGradientHex(hsv.h + 232 + (seed * 6), (hsv.s * 0.90) + 4, Math.max(22, hsv.v - 4))
        ];
        return createCocoGradientBoardItem(colors, label, source, seed);
    }

    function getDefaultCocoCustomItems() {
        return [
            createCocoSolidBoardItem("#00FF59", "Custom 1", "custom"),
            createCocoSolidBoardItem("#FF3A38", "Custom 2", "custom"),
            createCocoSolidBoardItem("#3B8EF1", "Custom 3", "custom"),
            createCocoRampGradientItem("#19E57C", "#1E7BFF", "Custom 4", "custom", 135)
        ];
    }

    function getMarketingSolidPalette() {
        return [
            "#ff0b67", "#16c8f8", "#39ff14", "#ffc813", "#6f10ff", "#175dff", "#f4f4f4", "#1a1a1a", "#ff6b00", "#17d0a7", "#ff7478", "#f2bfd9", "#ff3d63",
            "#f32452", "#cb134c", "#ff9eaf", "#ef9bc9", "#e568b1", "#e64699", "#db257f", "#c41367", "#9f0f59", "#8c194f", "#caa4ef", "#b27ae9", "#9c57e6",
            "#8e37df", "#8028d1", "#6f2bc0", "#64289f", "#b5a6ef", "#9d5de7", "#855ce4", "#733df2", "#6726dd", "#5920b8", "#b7c1f3", "#a18ef1", "#8364ef",
            "#6e3ee4", "#642dd1", "#5921b5", "#4c1f98", "#aacdec", "#90b6ef", "#72a0ff", "#4b87f3", "#316af2", "#2649a8", "#243687", "#8dbcff", "#b3cff7",
            "#8ebdf7", "#67a5f5", "#4d90f2", "#3a7eea", "#2e68d8", "#2b56c1", "#9de8d9", "#7addd6", "#43cdc6", "#27b5aa", "#1ca396", "#17897f", "#157269",
            "#b6f2d2", "#8de7b2", "#4fd39a", "#22c488", "#1ca66f", "#15845a", "#fff0a1", "#ffe15d", "#ffd329", "#ffc408", "#df9f04", "#b67807", "#8f5a12",
            "#ffd126", "#f1bb07", "#d49a00", "#a96d10", "#7f5116", "#060606"
        ];
    }

    function getCocoPaletteDecks() {
        const cocoPalettes = (window.KWV_COCO_PALETTES || []);
        if (cocoPalettes.length) {
            return cocoPalettes.slice(0, COCO_LIBRARY_LIMIT).map((deck, index) => ({
                label: deck.label || ("#" + (deck.id || index + 1) + " palette"),
                colors: (deck.colors || []).slice(0, 6)
            })).filter((deck) => deck.colors.length >= 2);
        }
        return [
            { label: "#1 palette", colors: ["#69999B", "#D5E0D4", "#ECEA91", "#F6E2BE", "#E14447"] },
            { label: "#2 palette", colors: ["#B8A4A3", "#62B6D0", "#3C9BD5", "#A058BF", "#91407B"] },
            { label: "#3 palette", colors: ["#D98285", "#E5A45A", "#EAD0AD", "#5E8C84", "#2D5D62"] },
            { label: "#4 palette", colors: ["#B83952", "#F93F59", "#EC7F55", "#DAD5B8", "#DA8E8D"] },
            { label: "#5 palette", colors: ["#D3336C", "#B8A56E", "#C8D8BF", "#9EC2B9", "#7F7277"] },
            { label: "#6 palette", colors: ["#88D2C9", "#E6D774", "#E5C61A", "#E75D32", "#D84656"] },
            { label: "#7 palette", colors: ["#2F6B83", "#F9F7F3", "#DF7041", "#B53E2A", "#921921"] },
            { label: "#8 palette", colors: ["#A0E9C3", "#71978D", "#87905B", "#B93145", "#D7163D"] },
            { label: "#9 palette", colors: ["#2A4050", "#6C302E", "#2F91BE", "#69BDD3", "#F5F2EC"] },
            { label: "#10 palette", colors: ["#F8F7F2", "#F8E59C", "#AA9EA0", "#2F3F4F", "#25C2A9"] },
            { label: "#11 palette", colors: ["#157B93", "#6A928A", "#D6DB6A", "#D2B23C", "#D94443"] },
            { label: "#12 palette", colors: ["#9D9A67", "#C6C3AD", "#BFB69A", "#D35E32", "#315F3F"] },
            { label: "#13 palette", colors: ["#4D5961", "#393237", "#948D86", "#E5D1AA", "#9A3A33"] },
            { label: "#14 palette", colors: ["#A8C87E", "#9BC4D1", "#4E91BC", "#404447", "#A33C4B"] },
            { label: "#15 palette", colors: ["#EFEFEC", "#173943", "#337C94", "#687D75", "#A6634C"] },
            { label: "#16 palette", colors: ["#1BCAD0", "#12D99A", "#12D2C4", "#18A7DA", "#0787DC"] },
            { label: "#17 palette", colors: ["#FF715B", "#FFB84F", "#F9F871", "#37D67A", "#1AA7EC"] },
            { label: "#18 palette", colors: ["#111827", "#9333EA", "#EC4899", "#F97316", "#FDE047"] }
        ];
    }

    function getCocoBrandDecks() {
        const brandOverrides = {
            "youtube": ["#FF0000", "#282828"],
            "amazon": ["#FF9900", "#146EB4"],
            "apple": ["#000000", "#F5F5F7"],
            "netflix": ["#E50914", "#221F1F"],
            "spotify": ["#1DB954", "#191414"],
            "coca-cola": ["#ED1C16", "#FFFFFF"]
        };
        const cocoBrands = (window.KWV_BRAND_COLORS || []);
        if (cocoBrands.length) {
            return cocoBrands.slice(0, COCO_LIBRARY_LIMIT).map((brand, index) => {
                const label = brand.title || brand.name || ("Brand " + (index + 1));
                const key = String(label).toLowerCase();
                return {
                    label: label,
                    colors: (brandOverrides[key] || brand.colors || []).slice(0, 8)
                };
            }).filter((deck) => deck.colors.length >= 1);
        }
        return [
            { label: "Google", colors: ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853"] },
            { label: "Instagram", colors: ["#405DE6", "#833AB4", "#C13584", "#E1306C", "#FCAF45"] },
            { label: "Netflix", colors: ["#E50914", "#B20710", "#831010", "#221F1F", "#F5F5F1"] },
            { label: "Spotify", colors: ["#1DB954", "#191414", "#1ED760", "#FFFFFF", "#535353"] },
            { label: "YouTube", colors: ["#FF0000", "#282828", "#FFFFFF", "#CC0000", "#0F0F0F"] },
            { label: "Adobe", colors: ["#FF0000", "#FA0F00", "#2C2C2C", "#FFFFFF", "#1473E6"] },
            { label: "Microsoft", colors: ["#F25022", "#7FBA00", "#00A4EF", "#FFB900", "#737373"] },
            { label: "Apple", colors: ["#A2AAAD", "#000000", "#F5F5F7", "#6E6E73", "#FFFFFF"] },
            { label: "Canva", colors: ["#00C4CC", "#7D2AE8", "#8B3DFF", "#00B8B0", "#FFFFFF"] },
            { label: "Amazon", colors: ["#FF9900", "#146EB4", "#232F3E", "#37475A", "#FFFFFF"] },
            { label: "X", colors: ["#000000", "#14171A", "#657786", "#AAB8C2", "#FFFFFF"] }
        ];
    }

    function getGradientGallerySpecs() {
        return [
            { label: "Arctic Blue", family: "Blue", top: "#7FDBFF", mid: "#36BFFF", low: "#1464B0", bottom: "#04101A", angle: 180 },
            { label: "Electric Cobalt", family: "Blue", top: "#7E8FFF", mid: "#3A57FF", low: "#1A2E9A", bottom: "#040812", angle: 180 },
            { label: "Sapphire Beam", family: "Blue", top: "#69A7FF", mid: "#2B7DFF", low: "#1453B4", bottom: "#031328", angle: 180 },
            { label: "Neon Navy", family: "Blue", top: "#6F86FF", mid: "#315CFF", low: "#16338B", bottom: "#02051A", angle: 180 },
            { label: "Ice Reactor", family: "Blue", top: "#A6E8FF", mid: "#59C6FF", low: "#2072A8", bottom: "#071A22", angle: 180 },

            { label: "Cyan Beam", family: "Cyan", top: "#8BFFFF", mid: "#25D9FF", low: "#116A9D", bottom: "#03131E", angle: 180 },
            { label: "Aqua Core", family: "Cyan", top: "#63FFF2", mid: "#17D6C7", low: "#0B7774", bottom: "#021514", angle: 180 },
            { label: "Teal Pop", family: "Cyan", top: "#87FFF7", mid: "#1FD6CF", low: "#0E6E73", bottom: "#031918", angle: 180 },
            { label: "Glacier Mint", family: "Cyan", top: "#B4FFF3", mid: "#63E8D4", low: "#258273", bottom: "#081913", angle: 180 },
            { label: "Sky Laser", family: "Cyan", top: "#A6E6FF", mid: "#4CB5FF", low: "#205CA8", bottom: "#041522", angle: 180 },

            { label: "Neon Green", family: "Green", top: "#79FFA2", mid: "#1FE267", low: "#0E8740", bottom: "#031308", angle: 180 },
            { label: "Acid Lime", family: "Green", top: "#AFFF6F", mid: "#57E500", low: "#2B8600", bottom: "#091402", angle: 180 },
            { label: "Mint Shock", family: "Green", top: "#8FFFD7", mid: "#24E2A2", low: "#11805C", bottom: "#03150D", angle: 180 },
            { label: "Toxic Apple", family: "Green", top: "#C4FF63", mid: "#7EDC00", low: "#447F00", bottom: "#101402", angle: 180 },
            { label: "Emerald Pulse", family: "Green", top: "#A4FFD0", mid: "#33E08A", low: "#157A4F", bottom: "#04160B", angle: 180 },

            { label: "Lemon Volt", family: "Yellow", top: "#FFF67A", mid: "#FFD91A", low: "#A18508", bottom: "#171402", angle: 180 },
            { label: "Solar Gold", family: "Yellow", top: "#FFE45A", mid: "#FFBF00", low: "#A16C00", bottom: "#1A1102", angle: 180 },
            { label: "Amber Punch", family: "Yellow", top: "#FFD56C", mid: "#FFB800", low: "#A56800", bottom: "#1B0D03", angle: 180 },
            { label: "Mango Fire", family: "Yellow", top: "#FFC56D", mid: "#FF9118", low: "#A35308", bottom: "#1A0902", angle: 180 },
            { label: "Honey Bronze", family: "Yellow", top: "#F0D29D", mid: "#D2A457", low: "#8C5927", bottom: "#211408", angle: 180 },

            { label: "Orange Blaze", family: "Orange", top: "#FFB07A", mid: "#FF6A17", low: "#A64408", bottom: "#1B0602", angle: 180 },
            { label: "Peach Burst", family: "Orange", top: "#FFC0A4", mid: "#FF7E4F", low: "#A64626", bottom: "#1A0905", angle: 180 },
            { label: "Copper Ember", family: "Orange", top: "#E8A78D", mid: "#C86E49", low: "#823722", bottom: "#1C0D05", angle: 180 },
            { label: "Clay Sunset", family: "Orange", top: "#E2B7A4", mid: "#BE8066", low: "#744233", bottom: "#181008", angle: 180 },
            { label: "Coral Heat", family: "Orange", top: "#FF9F92", mid: "#FF5A42", low: "#A52A1D", bottom: "#1A0504", angle: 180 },

            { label: "Crimson Pop", family: "Red", top: "#FF8A94", mid: "#FF314D", low: "#A11427", bottom: "#190306", angle: 180 },
            { label: "Ruby Pop", family: "Red", top: "#FF9EA8", mid: "#FF4A61", low: "#A11D34", bottom: "#21040A", angle: 180 },
            { label: "Cherry Flash", family: "Red", top: "#FF7381", mid: "#FF2143", low: "#9A0C25", bottom: "#160205", angle: 180 },
            { label: "Scarlet Glow", family: "Red", top: "#FF7A7A", mid: "#FF2933", low: "#9B1017", bottom: "#120304", angle: 180 },
            { label: "Lava Rush", family: "Red", top: "#FF6F63", mid: "#FF3417", low: "#982007", bottom: "#170402", angle: 180 },

            { label: "Hot Rose", family: "Pink", top: "#FF8ACB", mid: "#FF38A0", low: "#9F1B5D", bottom: "#19040D", angle: 180 },
            { label: "Bubble Pink", family: "Pink", top: "#FFB5E6", mid: "#FF62C0", low: "#A12970", bottom: "#130713", angle: 180 },
            { label: "Rose Pulse", family: "Pink", top: "#FFA0D7", mid: "#FF4FA6", low: "#A02065", bottom: "#15050D", angle: 180 },
            { label: "Magenta Wave", family: "Pink", top: "#FF85F5", mid: "#FF20D5", low: "#9A1180", bottom: "#120313", angle: 180 },
            { label: "Candy Bloom", family: "Pink", top: "#FFC1F0", mid: "#FF74D9", low: "#A12B84", bottom: "#160614", angle: 180 },

            { label: "Violet Surge", family: "Purple", top: "#C58CFF", mid: "#8E33FF", low: "#5517A8", bottom: "#0C0319", angle: 180 },
            { label: "Plum Gallery", family: "Purple", top: "#CF94FF", mid: "#972EFF", low: "#5A17B4", bottom: "#12041B", angle: 180 },
            { label: "Orchid Flash", family: "Purple", top: "#F09CFF", mid: "#D73CFF", low: "#7C1BA4", bottom: "#17041A", angle: 180 },
            { label: "Purple Pop", family: "Purple", top: "#E6A4FF", mid: "#B43BFF", low: "#691FA0", bottom: "#14051D", angle: 180 },
            { label: "Ultra Grape", family: "Purple", top: "#BB7BFF", mid: "#7A1FFF", low: "#470B8E", bottom: "#09001A", angle: 180 },

            { label: "Pearl White", family: "Light Neutral", top: "#FFFFFF", mid: "#E4ECF5", low: "#7B8EA0", bottom: "#0D1014", angle: 180 },
            { label: "Cream Gold", family: "Light Neutral", top: "#FFF7E1", mid: "#E9CC8B", low: "#8F6B28", bottom: "#110D07", angle: 180 },
            { label: "Silver Blue", family: "Light Neutral", top: "#F2F8FF", mid: "#B8D0EB", low: "#587190", bottom: "#091019", angle: 180 },
            { label: "Silver Frost", family: "Light Neutral", top: "#F8FBFF", mid: "#D4E0EC", low: "#70839A", bottom: "#0A1016", angle: 180 },
            { label: "Moon Glow", family: "Light Neutral", top: "#FFFDF8", mid: "#E3DCCF", low: "#83796A", bottom: "#110F0B", angle: 180 },

            { label: "Soft Steel", family: "Dark Neutral", top: "#F2F2F6", mid: "#C3C7D2", low: "#666B77", bottom: "#0D0E11", angle: 180 },
            { label: "Moon Smoke", family: "Dark Neutral", top: "#F7F9FB", mid: "#D2D7DF", low: "#7A7F89", bottom: "#0E0F12", angle: 180 },
            { label: "Graphite Silk", family: "Dark Neutral", top: "#E8E8EE", mid: "#B3B5C0", low: "#5D6170", bottom: "#090A0F", angle: 180 },
            { label: "Slate Smoke", family: "Dark Neutral", top: "#E3EAF2", mid: "#A0AABA", low: "#505B68", bottom: "#081015", angle: 180 },
            { label: "Pearl Shadow", family: "Dark Neutral", top: "#F4F0EC", mid: "#C1B8B0", low: "#6E645E", bottom: "#100D0C", angle: 180 }
        ];
    }

    function buildGradientGalleryItems() {
        const cocoGradients = (window.KWV_COCO_GRADIENTS || []);
        if (cocoGradients.length) {
            return cocoGradients.slice(0, COCO_LIBRARY_LIMIT).map((item, index) => {
                const colors = (item.colors || []).map((hex) => rgbToHex(hexToRgb(hex) || [255, 255, 255]));
                const first = colors[0] || "#FFFFFF";
                const second = colors[1] || first;
                return createCocoRampGradientItem(first, second, item.name || ("Coco " + (index + 1)), "Coco MG", 90);
            });
        }
        const specs = getGradientGallerySpecs();
        const items = [];
        for (let i = 0; i < specs.length; i++) {
            const item = createCocoShowcaseGradientItem(specs[i], i);
            if (item) items.push(item);
        }
        return items.slice(0, COCO_LIBRARY_LIMIT);
    }

    function getCocoBoardItemCodes(item) {
        if (cocoBoardState.activeCodes && cocoBoardState.activeCodes.length) {
            return [cocoBoardState.activeCodes[0] || "", cocoBoardState.activeCodes[1] || ""];
        }
        if (!item) return ["", ""];
        if (item.kind === "gradient" && item.gradient && item.gradient.colors) {
            return [
                item.gradient.colors[0] || "",
                item.gradient.colors[item.gradient.colors.length - 1] || ""
            ];
        }
        if ((item.kind === "palette" || item.kind === "brand") && item.colors) {
            return [item.colors[0] || "", item.colors[1] || ""];
        }
        return [item.hex || "", ""];
    }

    function paintCocoBoardButton(button, item) {
        if (!button || !item) return;
        clearCocoSurface(button);
        if (item.kind === "gradient" && item.gradient) paintCocoGradientSurface(button, item.gradient);
        else paintCocoSolidSurface(button, item.hex || "#FF5500");
    }

    function getCocoGradientPreviewHex(item) {
        const colors = item && item.gradient && item.gradient.colors ? item.gradient.colors : [];
        if (!colors.length) return "#7A7A7A";
        if (colors.length === 1) return colors[0];
        const rgbColors = colors.map((hex) => hexToRgb(hex)).filter((rgb) => !!rgb);
        if (!rgbColors.length) return "#7A7A7A";
        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let strongestHex = colors[0];
        let strongestScore = -1;
        for (let i = 0; i < rgbColors.length; i++) {
            const rgb = rgbColors[i];
            totalR += rgb[0];
            totalG += rgb[1];
            totalB += rgb[2];
            const hsv = rgbToHsv(rgb);
            const score = (hsv.s * 1.15) + (hsv.v * 0.35);
            if (score > strongestScore) {
                strongestScore = score;
                strongestHex = colors[i];
            }
        }
        const averageHex = rgbToHex([
            Math.round(totalR / rgbColors.length),
            Math.round(totalG / rgbColors.length),
            Math.round(totalB / rgbColors.length)
        ]);
        let previewHex = mixHexColors(averageHex, strongestHex, 0.34);
        const previewRgb = hexToRgb(previewHex);
        if (!previewRgb) return previewHex;
        const previewHsv = rgbToHsv(previewRgb);
        previewHex = rgbToHex(hsvToRgb(
            previewHsv.h,
            clamp(previewHsv.s, 48, 96),
            clamp(previewHsv.v, 58, 100)
        ));
        return previewHex;
    }

    function setCocoBoardActiveItem(item) {
        cocoBoardState.activeKey = item ? item.key : "";
        cocoBoardState.activeCodes = null;
    }

    function getCocoBoardActiveItem() {
        const all = cocoBoardState.customItems.concat(cocoBoardState.solidItems, cocoBoardState.paletteItems, cocoBoardState.gradientItems, cocoBoardState.brandItems);
        for (let i = 0; i < all.length; i++) {
            if (all[i].key === cocoBoardState.activeKey) return all[i];
        }
        return null;
    }

    function updateCocoBoardActiveClasses() {
        document.querySelectorAll(".coco-custom-box, .coco-solid-box, .coco-gradient-box, .coco-palette-card, .coco-brand-card").forEach((button) => {
            button.classList.remove("active");
        });
        const activeKey = cocoBoardState.activeKey;
        if (!activeKey) return;
        document.querySelectorAll("[data-coco-key='" + activeKey + "']").forEach((button) => {
            button.classList.add("active");
        });
    }

    function applyCocoBoardItem(item, event) {
        if (!item) return;
        setCocoBoardActiveItem(item);
        renderCocoCodePanel();
        updateCocoBoardActiveClasses();
        if (item.kind === "gradient" && item.gradient) {
            applyCocoGradient(item.gradient, getCocoApplyMode(event));
            return;
        }
        if ((item.kind === "palette" || item.kind === "brand") && item.colors) {
            applyCocoPalette(item.colors, getCocoApplyMode(event));
            return;
        }
        applyCocoColor(item.hex, getCocoApplyMode(event));
    }

    function copyCocoBoardItem(item) {
        if (!item) {
            setCocoStatus("No active color or gradient was found.", true);
            return;
        }
        if (item.kind === "gradient" && item.gradient) {
            copyTextToClipboard(item.gradient.colors.join("  "), "Gradient codes copied.");
            return;
        }
        if ((item.kind === "palette" || item.kind === "brand") && item.colors) {
            copyTextToClipboard(item.colors.join("  "), "Color codes copied.");
            return;
        }
        copyTextToClipboard(item.hex, item.hex + " copied.");
    }

    function getCocoLibraryQuery() {
        return String(cocoBoardState.search || "").replace(/^\s+|\s+$/g, "").toLowerCase();
    }

    function cocoItemMatchesQuery(item) {
        const query = getCocoLibraryQuery();
        if (!query) return true;
        const haystack = [
            item.label || "",
            item.source || "",
            item.hex || "",
            (item.colors || []).join(" "),
            item.gradient && item.gradient.colors ? item.gradient.colors.join(" ") : ""
        ].join(" ").toLowerCase();
        return haystack.indexOf(query) !== -1;
    }

    function applyCocoChipColor(parentItem, hex, event) {
        if (!hex) return;
        setCocoBoardActiveItem(parentItem);
        renderCocoCodePanel();
        const primary = document.getElementById("cocoCodePrimary");
        const secondary = document.getElementById("cocoCodeSecondary");
        if (primary) primary.value = hex;
        if (secondary && parentItem && parentItem.colors) {
            const next = parentItem.colors[(parentItem.colors.indexOf(hex) + 1) % parentItem.colors.length];
            secondary.value = next && next !== hex ? next : "";
            cocoBoardState.activeCodes = [hex, secondary.value || ""];
        }
        updateCocoBoardActiveClasses();
        copyTextToClipboard(hex, hex + " copied.");
        applyCocoColor(hex, getCocoApplyMode(event));
    }

    function makeCocoStripChip(hex, parentItem, className) {
        const chip = document.createElement("span");
        chip.className = (className || "") + " coco-color-chip";
        chip.setAttribute("data-hex", hex);
        chip.style.background = hex;
        chip.onclick = (event) => {
            event.stopPropagation();
            applyCocoChipColor(parentItem, hex, event);
        };
        return chip;
    }

    function renderCocoImageColors() {
        const wrap = document.getElementById("cocoImageColorBoard");
        const title = document.getElementById("cocoImagePasteTitle");
        const clearBtn = document.getElementById("btnCocoImageClear");
        if (!wrap) return;
        wrap.innerHTML = "";
        const colors = cocoBoardState.imageColors || [];
        if (title) title.textContent = colors.length ? "Image Colors" : "Paste Image Colors";
        if (clearBtn) clearBtn.classList.toggle("active", !!colors.length);
        colors.forEach((hex) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "coco-image-color";
            button.style.background = hex;
            button.title = hex + " apply";
            const label = document.createElement("span");
            label.textContent = hex;
            button.appendChild(label);
            button.onclick = (event) => {
                cocoBoardState.activeCodes = [hex, ""];
                renderCocoCodePanel();
                copyTextToClipboard(hex, hex + " copied.");
                applyCocoColor(hex, getCocoApplyMode(event));
            };
            wrap.appendChild(button);
        });
    }

    function clearCocoImageColors() {
        cocoBoardState.imageColors = [];
        cocoBoardState.activeCodes = null;
        renderCocoImageColors();
        renderCocoCodePanel();
        setCocoStatus("Image colors cleared.", false);
    }

    function colorDistanceSq(a, b) {
        const dr = a[0] - b[0];
        const dg = a[1] - b[1];
        const db = a[2] - b[2];
        return dr * dr + dg * dg + db * db;
    }

    function extractDominantCocoColors(imageData, wanted) {
        const data = imageData && imageData.data ? imageData.data : null;
        if (!data) return [];
        const buckets = {};
        const step = Math.max(4, Math.floor(data.length / 4 / 7000) * 4);
        for (let i = 0; i < data.length; i += step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 180) continue;
            const key = (r >> 4) + "," + (g >> 4) + "," + (b >> 4);
            if (!buckets[key]) buckets[key] = { count: 0, r: 0, g: 0, b: 0 };
            buckets[key].count++;
            buckets[key].r += r;
            buckets[key].g += g;
            buckets[key].b += b;
        }
        const sorted = Object.keys(buckets).map((key) => {
            const item = buckets[key];
            return {
                count: item.count,
                rgb: [
                    Math.round(item.r / item.count),
                    Math.round(item.g / item.count),
                    Math.round(item.b / item.count)
                ]
            };
        }).sort((a, b) => b.count - a.count);
        const picked = [];
        const minDistance = 26 * 26;
        for (let i = 0; i < sorted.length && picked.length < (wanted || 12); i++) {
            const rgb = sorted[i].rgb;
            let tooClose = false;
            for (let j = 0; j < picked.length; j++) {
                if (colorDistanceSq(rgb, picked[j]) < minDistance) {
                    tooClose = true;
                    break;
                }
            }
            if (!tooClose) picked.push(rgb);
        }
        return picked.map((rgb) => rgbToHex(rgb));
    }

    function extractCocoImageColorsFromBlob(blob) {
        return new Promise((resolve, reject) => {
            if (!blob) {
                reject(new Error("No image found."));
                return;
            }
            const image = new Image();
            const url = URL.createObjectURL(blob);
            image.onload = () => {
                try {
                    const maxSide = 360;
                    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
                    canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
                    const ctx = canvas.getContext("2d", { willReadFrequently: true });
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    const colors = extractDominantCocoColors(ctx.getImageData(0, 0, canvas.width, canvas.height), 12);
                    URL.revokeObjectURL(url);
                    resolve(colors);
                } catch (err) {
                    URL.revokeObjectURL(url);
                    reject(err);
                }
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Image could not be read."));
            };
            image.src = url;
        });
    }

    function setCocoImageColorsFromBlob(blob) {
        setCocoStatus("Reading image colors...", false);
        extractCocoImageColorsFromBlob(blob).then((colors) => {
            cocoBoardState.imageColors = colors;
            renderCocoImageColors();
            setCocoStatus(colors.length ? "Image colors loaded." : "No clear colors found.", !colors.length);
        }).catch(() => {
            setCocoStatus("Could not read image colors. Copy the image itself, then paste again.", true);
        });
    }

    function fetchCocoImageUrl(url) {
        if (!/^https?:\/\//i.test(String(url || ""))) return false;
        setCocoStatus("Reading image URL...", false);
        fetch(url).then((res) => {
            if (!res.ok) throw new Error("Image request failed.");
            return res.blob();
        }).then((blob) => {
            if (!/^image\//i.test(blob.type || "")) throw new Error("URL is not an image.");
            setCocoImageColorsFromBlob(blob);
        }).catch(() => {
            setCocoStatus("Copy the image itself, then paste here.", true);
        });
        return true;
    }

    function readCocoTextBlob(blob) {
        if (blob && typeof blob.text === "function") return blob.text();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error || new Error("Text read failed."));
            reader.readAsText(blob);
        });
    }

    function handleCocoPasteEvent(event) {
        const clipboard = event && event.clipboardData ? event.clipboardData : null;
        if (!clipboard) return false;
        const items = clipboard.items || [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item && /^image\//i.test(item.type || "")) {
                event.preventDefault();
                setCocoImageColorsFromBlob(item.getAsFile());
                return true;
            }
        }
        const text = clipboard.getData ? clipboard.getData("text/plain") : "";
        if (fetchCocoImageUrl(text)) {
            event.preventDefault();
            return true;
        }
        return false;
    }

    function readCocoClipboardImage() {
        const pasteBtn = document.getElementById("btnCocoImagePaste");
        if (pasteBtn) pasteBtn.focus();
        if (!(navigator.clipboard && navigator.clipboard.read)) {
            setCocoStatus("Press Ctrl+V after copying an image.", false);
            return;
        }
        navigator.clipboard.read().then((items) => {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const types = item.types || [];
                for (let j = 0; j < types.length; j++) {
                    if (/^image\//i.test(types[j])) {
                        return item.getType(types[j]).then(setCocoImageColorsFromBlob);
                    }
                }
                if (types.indexOf("text/plain") !== -1) {
                    return item.getType("text/plain").then(readCocoTextBlob).then((text) => {
                        if (!fetchCocoImageUrl(text)) setCocoStatus("Copy an image, then click paste again.", true);
                    });
                }
            }
            setCocoStatus("Copy an image, then click paste again.", true);
            return null;
        }).catch(() => {
            setCocoStatus("Press Ctrl+V after copying an image.", false);
        });
    }

    function renderCocoPaletteGrid() {
        const wrap = document.getElementById("cocoPaletteBoard");
        if (!wrap) return;
        wrap.innerHTML = "";
        const items = cocoBoardState.paletteItems.filter(cocoItemMatchesQuery);
        items.forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "coco-palette-card" + (item.key === cocoBoardState.activeKey ? " active" : "");
            button.setAttribute("data-coco-key", item.key);
            button.title = item.label + " apply";
            button.onclick = (event) => applyCocoBoardItem(item, event);
            button.oncontextmenu = (event) => {
                event.preventDefault();
                setCocoBoardActiveItem(item);
                copyCocoBoardItem(item);
                renderCocoCodePanel();
                updateCocoBoardActiveClasses();
                return false;
            };

            const strip = document.createElement("div");
            strip.className = "coco-palette-strip";
            item.colors.forEach((hex) => strip.appendChild(makeCocoStripChip(hex, item, "")));
            button.appendChild(strip);

            wrap.appendChild(button);
        });
        if (!items.length) {
            const note = document.createElement("div");
            note.className = "coco-note";
            note.textContent = "No palette found for this search.";
            wrap.appendChild(note);
        }
    }

    function renderCocoBrandGrid() {
        const wrap = document.getElementById("cocoBrandBoard");
        if (!wrap) return;
        wrap.innerHTML = "";
        const items = cocoBoardState.brandItems.filter(cocoItemMatchesQuery);
        items.forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "coco-brand-card" + (item.key === cocoBoardState.activeKey ? " active" : "");
            button.setAttribute("data-coco-key", item.key);
            button.title = item.label + " apply";
            button.onclick = (event) => applyCocoBoardItem(item, event);
            button.oncontextmenu = (event) => {
                event.preventDefault();
                setCocoBoardActiveItem(item);
                copyCocoBoardItem(item);
                renderCocoCodePanel();
                updateCocoBoardActiveClasses();
                return false;
            };

            const strip = document.createElement("div");
            strip.className = "coco-brand-strip";
            item.colors.forEach((hex) => strip.appendChild(makeCocoStripChip(hex, item, "")));
            button.appendChild(strip);

            wrap.appendChild(button);
        });
        if (!items.length) {
            const note = document.createElement("div");
            note.className = "coco-note";
            note.textContent = "No brand color found for this search.";
            wrap.appendChild(note);
        }
    }

    function renderCocoCustomGrid() {
        const wrap = document.getElementById("cocoCustomGrid");
        if (!wrap) return;
        wrap.innerHTML = "";
        cocoBoardState.customItems.forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "coco-custom-box" + (item.key === cocoBoardState.activeKey ? " active" : "");
            button.setAttribute("data-coco-key", item.key);
            button.title = item.kind === "gradient" ? "Apply custom gradient" : (item.hex + " apply");
            paintCocoBoardButton(button, item);
            button.onclick = (event) => applyCocoBoardItem(item, event);
            button.oncontextmenu = (event) => {
                event.preventDefault();
                setCocoBoardActiveItem(item);
                copyCocoBoardItem(item);
                renderCocoCodePanel();
                updateCocoBoardActiveClasses();
                return false;
            };
            wrap.appendChild(button);
        });
    }

    function renderCocoSolidGrid() {
        const wrap = document.getElementById("cocoSolidBoard");
        if (!wrap) return;
        wrap.innerHTML = "";
        cocoBoardState.solidItems.forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "coco-solid-box" + (item.key === cocoBoardState.activeKey ? " active" : "");
            button.setAttribute("data-coco-key", item.key);
            button.title = item.hex;
            paintCocoBoardButton(button, item);
            button.onclick = (event) => applyCocoBoardItem(item, event);
            wrap.appendChild(button);
        });
    }

    function renderCocoGradientGrid() {
        const wrap = document.getElementById("cocoGradientBoard");
        if (!wrap) return;
        wrap.innerHTML = "";
        const items = cocoBoardState.gradientItems.filter(cocoItemMatchesQuery);
        items.forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "coco-gradient-box" + (item.key === cocoBoardState.activeKey ? " active" : "");
            button.setAttribute("data-coco-key", item.key);
            button.title = "Apply gradient";
            paintCocoGradientSurface(button, item.gradient);
            const label = document.createElement("span");
            label.className = "coco-gradient-box-label";
            label.textContent = item.label || "";
            button.appendChild(label);
            button.onclick = (event) => applyCocoBoardItem(item, event);
            button.oncontextmenu = (event) => {
                event.preventDefault();
                setCocoBoardActiveItem(item);
                copyCocoBoardItem(item);
                renderCocoCodePanel();
                updateCocoBoardActiveClasses();
                return false;
            };
            wrap.appendChild(button);
        });
        if (!items.length) {
            const note = document.createElement("div");
            note.className = "coco-note";
            note.textContent = "No gradient found for this search.";
            wrap.appendChild(note);
        }
    }

    function renderCocoCodePanel() {
        const primary = document.getElementById("cocoCodePrimary");
        const secondary = document.getElementById("cocoCodeSecondary");
        const activeItem = getCocoBoardActiveItem();
        const codes = getCocoBoardItemCodes(activeItem);
        if (primary) primary.value = codes[0] || "";
        if (secondary) secondary.value = codes[1] || "";
    }

    function renderCocoLibraryMode() {
        const mode = cocoBoardState.mode || "gradient";
        const meta = {
            palette: {
                title: "Palette Vault",
                kicker: "KWV Color Lab",
                caption: "Tap a strip color to copy, or tap the palette to apply the full set.",
                badge: String(cocoBoardState.paletteItems.filter(cocoItemMatchesQuery).length) + " Sets"
            },
            gradient: {
                title: "Gradient Vault",
                kicker: "KWV Color Lab",
                caption: "Motion-ready blends with editable color codes.",
                badge: String(cocoBoardState.gradientItems.filter(cocoItemMatchesQuery).length) + " Deck"
            },
            brand: {
                title: "Brand Vault",
                kicker: "KWV Color Lab",
                caption: "Brand-inspired sets for quick copy and apply.",
                badge: String(cocoBoardState.brandItems.filter(cocoItemMatchesQuery).length) + " Brands"
            }
        };
        const current = meta[mode] || meta.gradient;
        const title = document.getElementById("cocoLibraryTitle");
        const kicker = document.getElementById("cocoLibraryKicker");
        const caption = document.getElementById("cocoLibraryCaption");
        const badge = document.getElementById("cocoLibraryBadge");
        if (title) title.textContent = current.title;
        if (kicker) kicker.textContent = current.kicker;
        if (caption) caption.textContent = current.caption;
        if (badge) badge.textContent = current.badge;

        document.querySelectorAll(".coco-mode-card").forEach((button) => {
            button.classList.toggle("active", button.getAttribute("data-coco-mode") === mode);
        });
        const panes = {
            palette: document.getElementById("cocoPalettePane"),
            gradient: document.getElementById("cocoGradientPane"),
            brand: document.getElementById("cocoBrandPane")
        };
        Object.keys(panes).forEach((key) => {
            if (panes[key]) panes[key].classList.toggle("active", key === mode);
        });
    }

    function renderCocoBoard() {
        renderCocoCodePanel();
        renderCocoImageColors();
        renderCocoLibraryMode();
        renderCocoPaletteGrid();
        renderCocoCustomGrid();
        renderCocoSolidGrid();
        renderCocoGradientGrid();
        renderCocoBrandGrid();
    }

    function initializeCocoBoardData() {
        cocoBoardState.mode = "gradient";
        cocoBoardState.search = "";
        cocoBoardState.customItems = getDefaultCocoCustomItems();
        cocoBoardState.solidItems = sortSolidHexPalette(getMarketingSolidPalette()).map((hex, index) => createCocoSolidBoardItem(hex, "Solid " + (index + 1), "marketing"));
        cocoBoardState.paletteItems = getCocoPaletteDecks().map((deck) => createCocoPaletteBoardItem(deck, "palette"));
        cocoBoardState.gradientItems = buildGradientGalleryItems();
        cocoBoardState.brandItems = getCocoBrandDecks().map((deck) => createCocoPaletteBoardItem(deck, "brand"));
        cocoBoardState.previewItem = null;
        cocoBoardState.activeKey = "";
    }

    function rebuildCocoGradients() {
        const all = [];
        const families = getCocoGradientFamilyConfigs();
        let globalIndex = 0;

        families.forEach((family) => {
            for (let i = 0; i < 25; i++) {
                all.push(buildCocoFourColorPreset(family, i, globalIndex));
                globalIndex++;
            }
        });

        cocoState.gradients = all;
    }

    function updateCocoPreview() {
        if (document.getElementById("cocoGradientBoard")) {
            renderCocoCodePanel();
            return;
        }
        const preview = document.getElementById("cocoCurrentColor");
        const hexInput = document.getElementById("cocoHexInput");
        const visibleGradients = cocoState.gradients.filter(item => cocoState.gradientFilter === "all" || item.type === cocoState.gradientFilter);
        const visibleGradient = visibleGradients.find(item => item.key === cocoState.activeGradientKey) || visibleGradients[0] || cocoState.gradients[0] || null;
        if (visibleGradient) cocoState.activeGradientKey = visibleGradient.key;
        if (preview && visibleGradient) paintCocoGradientSurface(preview, visibleGradient);
        else if (preview) paintCocoSolidSurface(preview, rgbToHex(hsvToRgb(cocoState.h, cocoState.s, cocoState.v)));
        if (hexInput) hexInput.value = rgbToHex(hsvToRgb(cocoState.h, cocoState.s, cocoState.v));
    }

    function copyTextToClipboard(text, successMessage) {
        const done = () => setCocoStatus(successMessage, false);
        const fallback = () => {
            const area = document.createElement("textarea");
            area.value = text;
            document.body.appendChild(area);
            area.select();
            try { document.execCommand("copy"); done(); }
            catch (e) { setCocoStatus("Copy failed.", true); }
            document.body.removeChild(area);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(fallback);
        } else {
            fallback();
        }
    }

    function getCocoActiveSwatch() {
        const activeBoardItem = getCocoBoardActiveItem();
        if (activeBoardItem && activeBoardItem.kind === "solid") return { hex: activeBoardItem.hex };
        const palette = cocoState.palettes[cocoState.activeFormula] || [];
        return palette[cocoState.activeIndex] || palette[0] || null;
    }

    function getCocoActivePalette() {
        return cocoState.palettes[cocoState.activeFormula] || [];
    }

    function getCocoActiveGradient() {
        const activeBoardItem = getCocoBoardActiveItem();
        if (activeBoardItem && activeBoardItem.kind === "gradient") return activeBoardItem.gradient || null;
        return cocoState.gradients.find(item => item.key === cocoState.activeGradientKey) || null;
    }

    function setCocoMode(mode) {
        cocoState.mode = mode === "gradient" ? "gradient" : "palette";
        const palettePane = document.getElementById("cocoModePalettePane");
        const gradientPane = document.getElementById("cocoModeGradientPane");
        const paletteBtn = document.getElementById("btnCocoModePalette");
        const gradientBtn = document.getElementById("btnCocoModeGradient");

        if (palettePane) palettePane.classList.toggle("active", cocoState.mode === "palette");
        if (gradientPane) gradientPane.classList.toggle("active", cocoState.mode === "gradient");
        if (paletteBtn) paletteBtn.classList.toggle("active", cocoState.mode === "palette");
        if (gradientBtn) gradientBtn.classList.toggle("active", cocoState.mode === "gradient");
        updateCocoPreview();
    }

    function renderCocoPaletteLibrary() {
        rebuildCocoPalettes();
        rebuildCocoGradients();
        const wrap = document.getElementById("cocoPaletteLibrary");
        if (!wrap) return;
        wrap.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = "coco-template-grid";

        cocoPaletteMeta.forEach((meta) => {
            const palette = cocoState.palettes[meta.id] || [];
            const card = document.createElement("div");
            card.className = "coco-template-card" + (meta.id === cocoState.activeFormula ? " active" : "");
            card.title = meta.title;
            card.tabIndex = 0;
            card.onclick = (event) => {
                cocoState.activeFormula = meta.id;
                cocoState.activeIndex = 2;
                updateCocoPreview();
                renderCocoPaletteLibrary();
                applyCocoPalette(palette.map(color => color.hex), getCocoApplyMode(event));
            };
            card.onkeydown = (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    card.click();
                }
            };

            const title = document.createElement("div");
            title.className = "coco-template-name";
            title.textContent = meta.title;
            card.appendChild(title);

            const desc = document.createElement("div");
            desc.className = "coco-template-desc";
            desc.textContent = meta.description;
            card.appendChild(desc);

            const preview = document.createElement("div");
            preview.className = "coco-template-preview";
            palette.forEach((swatch, index) => {
                const bar = document.createElement("div");
                bar.className = "coco-template-bar" + (meta.id === cocoState.activeFormula && index === cocoState.activeIndex ? " active" : "");
                bar.style.background = "linear-gradient(180deg, " + mixHexColors(swatch.hex, "#FFFFFF", 0.18) + " 0%, " + swatch.hex + " 55%, " + mixHexColors(swatch.hex, "#050505", 0.18) + " 100%)";
                bar.tabIndex = 0;
                bar.title = swatch.hex + " apply";
                bar.onclick = (event) => {
                    event.stopPropagation();
                    cocoState.mode = "palette";
                    cocoState.activeFormula = meta.id;
                    cocoState.activeIndex = index;
                    updateCocoPreview();
                    renderCocoPaletteLibrary();
                    applyCocoColor(swatch.hex, getCocoApplyMode(event));
                };
                bar.onkeydown = (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        bar.click();
                    }
                };
                preview.appendChild(bar);
            });
            card.appendChild(preview);

            const codes = document.createElement("div");
            codes.className = "coco-template-codes";
            palette.forEach((swatch, index) => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "coco-template-code";
                chip.textContent = swatch.hex;
                chip.onclick = (e) => {
                    e.stopPropagation();
                    cocoState.activeFormula = meta.id;
                    cocoState.activeIndex = index;
                    updateCocoPreview();
                    renderCocoPaletteLibrary();
                    copyTextToClipboard(swatch.hex, swatch.hex + " copied.");
                };
                codes.appendChild(chip);
            });
            card.appendChild(codes);

            grid.appendChild(card);
        });

        wrap.appendChild(grid);

        updateCocoPreview();
    }

    function renderCocoGradientLibrary() {
        rebuildCocoGradients();
        const wrap = document.getElementById("cocoGradientLibrary");
        if (!wrap) return;
        wrap.innerHTML = "";

        const visible = cocoState.gradients.filter(item => cocoState.gradientFilter === "all" || item.type === cocoState.gradientFilter);
        if ((!cocoState.activeGradientKey || !visible.some(item => item.key === cocoState.activeGradientKey)) && visible.length > 0) {
            cocoState.activeGradientKey = visible[0].key;
        }
        visible.forEach((gradient) => {
            const item = document.createElement("section");
            item.className = "coco-gradient-item" + (gradient.key === cocoState.activeGradientKey ? " active" : "");

            const top = document.createElement("div");
            top.className = "coco-gradient-top";
            top.innerHTML = '<div class="coco-palette-title">' + gradient.title + '</div>';
            item.appendChild(top);

            const meta = document.createElement("div");
            meta.className = "coco-gradient-meta";
            meta.innerHTML = '<span class="coco-gradient-tag">' + gradient.source + '</span><span class="coco-gradient-tag">' + gradient.styleLabel + '</span>';
            item.appendChild(meta);

            const preview = document.createElement("div");
            preview.className = "coco-gradient-preview";
            paintCocoGradientSurface(preview, gradient);
            preview.tabIndex = 0;
            preview.title = gradient.title + " apply";
            preview.onclick = (event) => {
                cocoState.mode = "gradient";
                cocoState.activeGradientKey = gradient.key;
                updateCocoPreview();
                renderCocoGradientLibrary();
                applyCocoGradient(gradient, getCocoApplyMode(event));
            };
            preview.onkeydown = (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    preview.click();
                }
            };
            item.appendChild(preview);

            const codes = document.createElement("div");
            codes.className = "coco-gradient-stop-grid";
            gradient.colors.forEach((hex) => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "coco-template-code";
                chip.textContent = hex;
                chip.onclick = (event) => {
                    event.stopPropagation();
                    cocoState.mode = "gradient";
                    cocoState.activeGradientKey = gradient.key;
                    updateCocoPreview();
                    renderCocoGradientLibrary();
                    copyTextToClipboard(hex, hex + " copied.");
                };
                codes.appendChild(chip);
            });
            item.appendChild(codes);
            wrap.appendChild(item);
        });

        if (!visible.length) {
            const note = document.createElement("div");
            note.className = "coco-note";
            note.textContent = "No gradient was found for this filter.";
            wrap.appendChild(note);
        }

        updateCocoPreview();
    }

    function setCocoFromHex(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) {
            setCocoStatus("Use a valid hex like #FF3366.", true);
            return false;
        }
        const hsv = rgbToHsv(rgb);
        cocoState.h = hsv.h;
        cocoState.s = clamp(hsv.s, 45, 100);
        cocoState.v = clamp(hsv.v, 45, 100);
        renderCocoCodePanel();
        setCocoStatus("Code is ready. Select a swatch to preview auto-fill.", false);
        return true;
    }

    function getCocoApplyMode(event) {
        if (event && (event.ctrlKey || event.metaKey)) return "stroke";
        if (event && event.shiftKey) return "fill";
        return "both";
    }

    function serializeCocoGradientSteps(gradient) {
        if (!gradient || !gradient.steps) return "";
        try {
            return encodeURIComponent(JSON.stringify(gradient.steps));
        } catch (e) {
            return "";
        }
    }

    function applyCocoColor(hex, mode) {
        setCocoStatus("Applying color...", false);
        updateCocoPreview();
        csInterface.evalScript(
            "toolkit.applyCocoColor('" + escapeScriptString(hex) + "', '" + escapeScriptString(mode) + "')",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setCocoStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Color apply failed.", true);
                    return;
                }
                setCocoStatus("Color applied successfully.", false);
            }
        );
    }

    function applyCocoPalette(hexList, mode) {
        const joined = Array.isArray(hexList) ? hexList.join(",") : String(hexList || "");
        setCocoStatus("Applying palette...", false);
        updateCocoPreview();
        csInterface.evalScript(
            "toolkit.applyCocoPalette('" + escapeScriptString(joined) + "', '" + escapeScriptString(mode) + "')",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setCocoStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Palette apply failed.", true);
                    return;
                }
                setCocoStatus("Palette applied successfully.", false);
            }
        );
    }

    function applyCocoGradient(gradient, mode) {
        if (!gradient) {
            setCocoStatus("Gradient data was not available.", true);
            return;
        }
        setCocoStatus("Applying gradient...", false);
        updateCocoPreview();
        csInterface.evalScript(
            "toolkit.applyCocoGradient('" + escapeScriptString(gradient.type) + "', " + (parseInt(gradient.angle, 10) || 0) + ", '" + escapeScriptString(gradient.colors.join(",")) + "', '" + escapeScriptString(mode || "both") + "', '" + escapeScriptString(serializeCocoGradientSteps(gradient)) + "')",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setCocoStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Gradient apply failed.", true);
                    return;
                }
                setCocoStatus("Gradient applied successfully.", false);
            }
        );
    }

    function randomizeCocoBase() {
        cocoState.h = Math.floor(Math.random() * 360);
        cocoState.s = 65 + Math.floor(Math.random() * 35);
        cocoState.v = 60 + Math.floor(Math.random() * 35);
        renderCocoCodePanel();
        setCocoStatus("Random base updated internally.", false);
    }

    function initCocoPaletteStudio() {
        if (cocoInitialized) return;
        cocoInitialized = true;
        const copyPrimaryBtn = document.getElementById("btnCocoCopyPrimary");
        const copySecondaryBtn = document.getElementById("btnCocoCopySecondary");
        const imagePasteBtn = document.getElementById("btnCocoImagePaste");
        const imageClearBtn = document.getElementById("btnCocoImageClear");

        initializeCocoBoardData();
        if (imagePasteBtn) {
            imagePasteBtn.onclick = () => readCocoClipboardImage();
            imagePasteBtn.onkeydown = (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    readCocoClipboardImage();
                }
            };
            imagePasteBtn.onpaste = (event) => handleCocoPasteEvent(event);
        }
        if (imageClearBtn) {
            imageClearBtn.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                clearCocoImageColors();
            };
        }
        document.addEventListener("paste", (event) => {
            const tab = document.getElementById("tab-color");
            if (!tab || !tab.classList.contains("active")) return;
            handleCocoPasteEvent(event);
        });
        document.querySelectorAll(".coco-mode-card").forEach((button) => {
            button.onclick = () => {
                cocoBoardState.mode = button.getAttribute("data-coco-mode") || "gradient";
                renderCocoBoard();
                setCocoStatus(cocoBoardState.mode === "gradient" ? "Click a gradient tile to apply it." : "Tap a color to copy and apply it.", false);
            };
        });
        if (copyPrimaryBtn) {
            copyPrimaryBtn.onclick = () => {
                const codes = getCocoBoardItemCodes(getCocoBoardActiveItem());
                if (!codes[0]) {
                    setCocoStatus("Select a swatch first.", true);
                    return;
                }
                copyTextToClipboard(codes[0], codes[0] + " copied.");
            };
        }
        if (copySecondaryBtn) {
            copySecondaryBtn.onclick = () => {
                const codes = getCocoBoardItemCodes(getCocoBoardActiveItem());
                if (!codes[1]) {
                    setCocoStatus("The second code is not available.", true);
                    return;
                }
                copyTextToClipboard(codes[1], codes[1] + " copied.");
            };
        }
        renderCocoBoard();
    }

    function setBeatProgress(value) {
        const fill = document.getElementById("beatProgressFill");
        if (fill) fill.style.width = Math.max(0, Math.min(100, value)) + "%";
    }

    function setBeatStatus(message, isError) {
        const status = document.getElementById("beatMarkerStatus");
        if (status) {
            status.textContent = message || "";
            status.style.color = isError ? "#ff6b6b" : "#8c8c8c";
        }
        if (message) setAppleStatus(message, !!isError);
    }

    function startBeatProgress() {
        let value = 12;
        clearInterval(beatProgressTimer);
        setBeatProgress(value);
        beatProgressTimer = setInterval(() => {
            if (value < 60) value += 12;
            else if (value < 85) value += 4;
            else if (value < 92) value += 1;
            setBeatProgress(value);
            if (value >= 92) clearInterval(beatProgressTimer);
        }, 180);
    }

    function stopBeatProgress(success) {
        clearInterval(beatProgressTimer);
        if (success) {
            setBeatProgress(100);
            setTimeout(() => setBeatProgress(0), 900);
        } else {
            setBeatProgress(0);
        }
    }

    function setBeatControlsDisabled(disabled) {
        ["btnRefreshBeatLayers", "btnRefreshBeatLayersMini", "beatAudioLayer", "beatMarkerColor", "beatIntensity", "btnGenerateBeatMarkers"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = disabled;
        });
    }

    function fillBeatAudioOptions(res) {
        const select = document.getElementById("beatAudioLayer");
        if (!select) return;
        select.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select an audio layer";
        select.appendChild(placeholder);

        if (!res || res === "none") {
            setBeatStatus("No audio layer found in active comp.", true);
            return;
        }

        const shortenBeatLayerName = (name) => {
            const text = String(name || "").replace(/\s+/g, " ").trim();
            const limit = 28;
            if (text.length <= limit) return text || "Audio Layer";
            const head = Math.max(8, Math.floor((limit - 3) * 0.58));
            const tail = Math.max(6, limit - 3 - head);
            return text.slice(0, head).trimEnd() + "..." + text.slice(-tail).trimStart();
        };

        res.split("\n").forEach(entry => {
            if (!entry) return;
            const parts = entry.split("\t");
            if (parts.length < 2) return;
            const fullName = decodeURIComponent(parts.slice(1).join("\t"));
            const option = document.createElement("option");
            option.value = parts[0];
            option.textContent = shortenBeatLayerName(fullName);
            option.title = fullName;
            option.setAttribute("data-full-name", fullName);
            select.appendChild(option);
        });

        if (select.options.length > 1) select.selectedIndex = 1;
        setBeatStatus((select.options.length - 1) + " audio layer(s) ready.", false);
    }

    function refreshBeatAudioLayers() {
        const select = document.getElementById("beatAudioLayer");
        if (!select) return;
        select.innerHTML = "<option value=''>Loading audio layers...</option>";
        setBeatStatus("Scanning active comp audio layers...", false);
        csInterface.evalScript("toolkit.getAudioLayers()", function(res) {
            fillBeatAudioOptions(res);
        });
    }

    function normalizeBeatIntensity(value) {
        const text = String(value || "Balanced").toLowerCase();
        if (text.indexOf("max") >= 0 || text.indexOf("very high") >= 0) return "max";
        if (text.indexOf("detail") >= 0 || text === "high") return "detailed";
        if (text.indexOf("clean") >= 0 || text === "low") return "clean";
        if (text.indexOf("sparse") >= 0 || text.indexOf("very low") >= 0) return "sparse";
        return "balanced";
    }

    function getBeatAnalysisProfile(value) {
        switch (normalizeBeatIntensity(value)) {
            case "sparse": return { percentile: 0.94, stdFactor: 1.20, minSpacing: 0.36, onsetFactor: 0.55, minRise: 0.008 };
            case "clean": return { percentile: 0.88, stdFactor: 0.85, minSpacing: 0.28, onsetFactor: 0.42, minRise: 0.006 };
            case "detailed": return { percentile: 0.72, stdFactor: 0.36, minSpacing: 0.14, onsetFactor: 0.20, minRise: 0.003 };
            case "max": return { percentile: 0.62, stdFactor: 0.18, minSpacing: 0.10, onsetFactor: 0.12, minRise: 0.002 };
            default: return { percentile: 0.80, stdFactor: 0.55, minSpacing: 0.20, onsetFactor: 0.30, minRise: 0.004 };
        }
    }

    function getPercentileValue(values, amount) {
        if (!values || values.length === 0) return 0;
        const sorted = values.slice(0).sort((a, b) => a - b);
        const index = Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * amount)));
        return sorted[index] || 0;
    }

    function parseBeatSourceResponse(res) {
        if (!res) throw new Error("AE did not return audio source info.");
        if (res.indexOf("error::") === 0) throw new Error(res.substring(7));
        const jsonText = res.indexOf("success::") === 0 ? res.substring(9) : res;
        let data = null;
        try { data = JSON.parse(jsonText); } catch (error) {}
        if (!data || !data.path) throw new Error("Could not read this layer source. Refresh audio layers or relink footage in After Effects.");
        data.sourceOffset = Math.max(0, parseFloat(data.sourceOffset) || 0);
        data.duration = Math.max(0.05, parseFloat(data.duration) || 0);
        data.inPoint = parseFloat(data.inPoint) || 0;
        data.outPoint = parseFloat(data.outPoint) || (data.inPoint + data.duration);
        return data;
    }

    function detectBeatTimesFromFrames(frames, sourceInfo, intensityValue) {
        if (!frames || frames.length < 3) return [];
        const profile = getBeatAnalysisProfile(intensityValue);
        const smoothed = frames.map((frame, index) => {
            const prev = frames[Math.max(0, index - 1)].energy;
            const next = frames[Math.min(frames.length - 1, index + 1)].energy;
            return {
                time: frame.time,
                energy: ((prev * 0.20) + (frame.energy * 0.60) + (next * 0.20))
            };
        });
        const values = smoothed.map(frame => frame.energy);
        const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
        const variance = values.reduce((sum, value) => {
            const diff = value - avg;
            return sum + (diff * diff);
        }, 0) / values.length;
        const std = Math.sqrt(variance);
        const peakFloor = getPercentileValue(values, profile.percentile);
        const threshold = Math.max(peakFloor, avg + (std * profile.stdFactor), avg * 1.08);
        const riseFloor = Math.max(profile.minRise, std * profile.onsetFactor);
        const candidates = [];

        for (let i = 1; i < smoothed.length - 1; i++) {
            const prev = smoothed[i - 1].energy;
            const current = smoothed[i].energy;
            const next = smoothed[i + 1].energy;
            const rise = current - prev;
            const localPeak = current >= prev && current > next;
            if (localPeak && current >= threshold && rise >= riseFloor) {
                candidates.push({
                    time: sourceInfo.inPoint + smoothed[i].time,
                    energy: current,
                    score: current + (rise * 0.85)
                });
            }
        }

        const beats = [];
        candidates.forEach(candidate => {
            if (candidate.time < sourceInfo.inPoint || candidate.time > sourceInfo.outPoint) return;
            if (!beats.length || candidate.time - beats[beats.length - 1].time >= profile.minSpacing) {
                beats.push(candidate);
            } else if (candidate.score > beats[beats.length - 1].score) {
                beats[beats.length - 1] = candidate;
            }
        });

        const maxMarkers = 900;
        const selected = beats.length > maxMarkers
            ? beats.filter((_, index) => index % Math.ceil(beats.length / maxMarkers) === 0).slice(0, maxMarkers)
            : beats;
        return selected.map(beat => Math.round(beat.time * 10000) / 10000);
    }

    function analyzeAudioBeatsWithFfmpeg(sourceInfo, intensityValue) {
        return new Promise((resolve, reject) => {
            if (typeof require !== "function") {
                reject(new Error("Node.js CEP is not enabled. Reload the extension."));
                return;
            }
            let childProcess = null;
            try { childProcess = require("child_process"); } catch (error) {}
            if (!childProcess || !childProcess.spawn) {
                reject(new Error("Node child_process is unavailable. Check CEP Node."));
                return;
            }
            try {
                const fs = require("fs");
                if (fs && fs.existsSync && !fs.existsSync(sourceInfo.path)) {
                    reject(new Error("Source file is missing on disk. Relink footage in After Effects."));
                    return;
                }
            } catch (fsError) {}

            const sampleRate = 1000;
            const frameSamples = 40;
            const frames = [];
            let carry = null;
            let sampleIndex = 0;
            let frameSum = 0;
            let frameCount = 0;
            let stderr = "";
            const duration = Math.max(0.05, sourceInfo.duration || 0);
            const args = ["-hide_banner", "-loglevel", "error"];
            if (sourceInfo.sourceOffset > 0) args.push("-ss", String(sourceInfo.sourceOffset));
            args.push("-t", String(duration), "-i", sourceInfo.path, "-vn", "-ac", "1", "-ar", String(sampleRate), "-f", "s16le", "pipe:1");

            try {
                if (beatAnalysisProcess && beatAnalysisProcess.kill) beatAnalysisProcess.kill();
            } catch (killErr) {}

            const proc = childProcess.spawn(getFfmpegExecutable(), args, { windowsHide: true });
            beatAnalysisProcess = proc;

            proc.stdout.on("data", chunk => {
                let buffer = chunk;
                if (carry !== null) {
                    buffer = Buffer.concat([Buffer.from([carry]), chunk]);
                    carry = null;
                }
                if (buffer.length % 2 === 1) {
                    carry = buffer[buffer.length - 1];
                    buffer = buffer.slice(0, buffer.length - 1);
                }
                for (let offset = 0; offset < buffer.length; offset += 2) {
                    const sample = buffer.readInt16LE(offset) / 32768;
                    frameSum += sample * sample;
                    frameCount += 1;
                    sampleIndex += 1;
                    if (frameCount >= frameSamples) {
                        const frameEndSample = sampleIndex;
                        frames.push({
                            time: Math.max(0, (frameEndSample - frameSamples) / sampleRate),
                            energy: Math.sqrt(frameSum / frameCount)
                        });
                        frameSum = 0;
                        frameCount = 0;
                    }
                }
                const processedSeconds = sampleIndex / sampleRate;
                setBeatProgress(Math.min(92, 18 + ((processedSeconds / duration) * 70)));
            });

            proc.stderr.on("data", chunk => {
                stderr += String(chunk || "");
            });

            proc.on("error", error => {
                beatAnalysisProcess = null;
                reject(error);
            });

            proc.on("close", code => {
                beatAnalysisProcess = null;
                if (frameCount > 0) {
                    frames.push({
                        time: Math.max(0, (sampleIndex - frameCount) / sampleRate),
                        energy: Math.sqrt(frameSum / frameCount)
                    });
                }
                if (code !== 0 && frames.length === 0) {
                    reject(new Error(stderr.trim() || "FFmpeg could not read this audio layer."));
                    return;
                }
                resolve(detectBeatTimesFromFrames(frames, sourceInfo, intensityValue));
            });
        });
    }

    function generateBeatMarkers() {
        const audioLayer = document.getElementById("beatAudioLayer");
        const intensity = document.getElementById("beatIntensity");
        const color = document.getElementById("beatMarkerColor");
        if (!audioLayer || !intensity || !color || !audioLayer.value) {
            setBeatStatus("Select an audio layer first.", true);
            return;
        }

        const layerIndex = parseInt(audioLayer.value, 10);
        const colorIndex = parseInt(color.value, 10);
        if (isNaN(layerIndex) || isNaN(colorIndex)) {
            setBeatStatus("Beat marker settings are invalid. Refresh and try again.", true);
            return;
        }

        setBeatControlsDisabled(true);
        setBeatStatus("Analyzing audio with FFmpeg...", false);
        startBeatProgress();
        csInterface.evalScript(
            "toolkit.getAudioLayerSourceInfo(" + layerIndex + ")",
            function(res) {
                let sourceInfo = null;
                try {
                    sourceInfo = parseBeatSourceResponse(res);
                } catch (error) {
                    stopBeatProgress(false);
                    setBeatControlsDisabled(false);
                    setBeatStatus(error.message || "Could not read audio layer.", true);
                    return;
                }

                analyzeAudioBeatsWithFfmpeg(sourceInfo, intensity.value)
                    .then(times => {
                        setBeatStatus("Placing beat markers...", false);
                        csInterface.evalScript(
                            "toolkit.placeBeatMarkersFromTimes('" + escapeScriptString(JSON.stringify(times)) + "', " + colorIndex + ")",
                            function(placeRes) {
                                const ok = !!placeRes && placeRes.indexOf("success::") === 0;
                                stopBeatProgress(ok);
                                setBeatControlsDisabled(false);
                                if (!ok) {
                                    setBeatStatus(placeRes && placeRes.indexOf("error::") === 0 ? placeRes.substring(7) : (placeRes || "Could not place beat markers."), true);
                                    return;
                                }
                                const total = parseInt(placeRes.split("::")[1], 10) || 0;
                                setBeatStatus(total > 0 ? "Beat markers generated: " + total : "No beats detected. Try Detailed or Max Beats.", total <= 0);
                            }
                        );
                    })
                    .catch(error => {
                        stopBeatProgress(false);
                        setBeatControlsDisabled(false);
                        setBeatStatus(error && error.message ? error.message : "FFmpeg beat analysis failed.", true);
                    });
            }
        );
    }

    function getOverlayFolderPath() {
        const extPath = csInterface.getSystemPath(SystemPath.EXTENSION) || "";
        return (extPath.replace(/\\/g, "/") + "/overlays");
    }

    function getPngFolderPath() {
        const extPath = csInterface.getSystemPath(SystemPath.EXTENSION) || "";
        return (extPath.replace(/\\/g, "/") + "/overlays");
    }

    function getInstagramTemplatePath() {
        return getPngFolderPath() + "/Overlays/Instagram/Template.png";
    }

    function findInstagramTemplatePath() {
        const folder = getPngFolderPath() + "/Overlays/Instagram";
        const preferredNames = ["Template.png", "INSTAGRAM.png", "Instagram.png", "instagram.png"];
        if (!(window.cep && window.cep.fs)) return getInstagramTemplatePath();

        const result = window.cep.fs.readdir(folder);
        if (!result || result.err !== 0 || !result.data) return getInstagramTemplatePath();

        const files = result.data.filter((name) => /\.png$/i.test(String(name || "")));
        for (let i = 0; i < preferredNames.length; i++) {
            const preferred = files.find((name) => String(name || "").toLowerCase() === preferredNames[i].toLowerCase());
            if (preferred) return folder + "/" + preferred;
        }
        return files.length ? folder + "/" + files[0] : getInstagramTemplatePath();
    }

    function ensureOverlayFolder() {
        const folder = getOverlayFolderPath();
        if (window.cep && window.cep.fs) window.cep.fs.makedir(folder);
        return folder;
    }

    function ensurePngFolder() {
        const folder = getPngFolderPath();
        if (window.cep && window.cep.fs) {
            window.cep.fs.makedir(folder);
            window.cep.fs.makedir(folder + "/GIF");
            window.cep.fs.makedir(folder + "/Overlays");
        }
        return folder;
    }

    function overlayFileToUrl(path) {
        const normalized = String(path || "").replace(/\\/g, "/");
        return encodeURI("file:///" + normalized.replace(/^\/+/, ""));
    }

    let overlayMainThumbHolder = null;

    function ensureOverlayMainThumbHolder() {
        if (overlayMainThumbHolder && overlayMainThumbHolder.isConnected) return overlayMainThumbHolder;
        overlayMainThumbHolder = document.getElementById("overlayMainThumbHolder");
        if (!overlayMainThumbHolder) {
            overlayMainThumbHolder = document.createElement("div");
            overlayMainThumbHolder.id = "overlayMainThumbHolder";
            overlayMainThumbHolder.setAttribute("aria-hidden", "true");
            overlayMainThumbHolder.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none;";
            document.body.appendChild(overlayMainThumbHolder);
        }
        return overlayMainThumbHolder;
    }

    function findStaticOverlayPoster(filePath) {
        const normalized = String(filePath || "").replace(/\\/g, "/");
        const dot = normalized.lastIndexOf(".");
        if (dot < 0) return "";
        const base = normalized.slice(0, dot);
        const exts = [".jpg", ".jpeg", ".png", ".webp"];
        for (let i = 0; i < exts.length; i++) {
            const candidate = base + exts[i];
            try {
                if (window.cep && window.cep.fs) {
                    const stat = window.cep.fs.stat(candidate);
                    if (stat && stat.err === 0 && stat.data && !stat.data.isDirectory()) {
                        return candidate.replace(/\\/g, "/");
                    }
                }
            } catch (statErr) {}
        }
        return "";
    }

    function isOverlayVideoFile(name) {
        return /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(String(name || ""));
    }

    function isOverlayImageFile(name) {
        return /\.(gif|jpg|jpeg|webp)$/i.test(String(name || ""));
    }

    function getOverlayKind(name) {
        if (isOverlayVideoFile(name)) return "video";
        if (isOverlayImageFile(name)) return "image";
        return "";
    }

    function getOverlayDisplayName(fileName) {
        return String(fileName || "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    }

    function setOverlayStatus(message, isError) {
        const status = document.getElementById("overlayStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("error", !!isError);
    }

    function setPngStatus(message, isError) {
        const status = document.getElementById("pngStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("error", !!isError);
    }

    function getOverlayItems() {
        ensureOverlayFolder();
        if (!(window.cep && window.cep.fs)) return [];
        const folder = getOverlayFolderPath();
        const result = window.cep.fs.readdir(folder);
        if (!result || result.err !== 0 || !result.data) return [];

        return result.data
            .filter((name) => !!getOverlayKind(name))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
            .map((name) => ({
                name,
                path: folder + "/" + name,
                kind: getOverlayKind(name)
            }));
    }

    function sortPngItems(items) {
        return (items || []).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true, sensitivity: "base" }));
    }

    function sortPngGroups(groups) {
        function getTopFolder(folder) {
            return String(folder || "").split(" / ")[0];
        }
        const priority = { "Overlays": 0, "GIF": 1 };
        return (groups || [])
            .map((group) => ({
                folder: group.folder || "Overlays",
                path: group.path || "",
                items: sortPngItems(group.items || [])
            }))
            .filter((group) => group.items.length)
            .sort((a, b) => {
                const af = getTopFolder(a.folder);
                const bf = getTopFolder(b.folder);
                const ap = priority[af] !== undefined ? priority[af] : 99;
                const bp = priority[bf] !== undefined ? priority[bf] : 99;
                if (ap !== bp) return ap - bp;
                return String(a.folder || "").localeCompare(String(b.folder || ""), undefined, { numeric: true, sensitivity: "base" });
            });
    }

    function getPngItems() {
        ensurePngFolder();
        if (!(window.cep && window.cep.fs)) return [];
        const folder = getPngFolderPath();
        const result = window.cep.fs.readdir(folder);
        if (!result || result.err !== 0 || !result.data) return [];

        return result.data
            .filter((name) => /\.(png|gif)$/i.test(String(name || "")))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
            .map((name) => ({
                name,
                path: folder + "/" + name,
                kind: /\.gif$/i.test(name) ? "gif" : "png"
            }));
    }

    function getFallbackPngGroups() {
        const items = getPngItems();
        return items.length ? [{ folder: "Overlays", path: getPngFolderPath(), items: items }] : [];
    }

    function getRecursivePngGroups() {
        if (typeof require !== "function") return null;
        try {
            const fs = require("fs");
            const pathModule = require("path");
            const basePath = getPngFolderPath();
            const roots = [
                { label: "Overlays", path: pathModule.join(basePath, "Overlays") },
                { label: "GIF", path: pathModule.join(basePath, "GIF") }
            ];
            const groups = [];

            function toPanelPath(filePath) {
                return String(filePath || "").replace(/\\/g, "/");
            }

            function scanFolder(folderPath, labelParts) {
                if (!fs.existsSync(folderPath)) return;
                const entries = fs.readdirSync(folderPath);
                const items = [];
                const folders = [];

                entries.forEach((entry) => {
                    const entryName = String(entry || "");
                    const fullPath = pathModule.join(folderPath, entryName);
                    const stat = fs.statSync(fullPath);
                    if (stat && stat.isDirectory()) {
                        folders.push({ name: entryName, path: fullPath });
                        return;
                    }
                    if (!stat || !stat.isFile() || !/\.(png|gif)$/i.test(entryName)) return;
                    items.push({
                        name: entryName,
                        path: toPanelPath(fullPath),
                        kind: /\.gif$/i.test(entryName) ? "gif" : "png"
                    });
                });

                if (items.length) {
                    groups.push({
                        folder: labelParts.join(" / "),
                        path: toPanelPath(folderPath),
                        items: items
                    });
                }

                folders
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
                    .forEach((folder) => scanFolder(folder.path, labelParts.concat(folder.name)));
            }

            roots.forEach((root) => scanFolder(root.path, [root.label]));
            return sortPngGroups(groups);
        } catch (err) {
            return null;
        }
    }

    function scanPngGroups(done) {
        ensurePngFolder();
        const localGroups = getRecursivePngGroups();
        if (localGroups) {
            done(localGroups, "");
            return;
        }
        if (!csInterface || !csInterface.evalScript) {
            done(getFallbackPngGroups(), "");
            return;
        }
        var basePath = getPngFolderPath();
        var allGroups = [];
        var pending = 2;
        var hasError = false;
        var errorMsg = "";
        function collectResults(path) {
            csInterface.evalScript(
                "toolkit.scanPngLibrary('" + escapeScriptString(path) + "')",
                function(res) {
                    pending--;
                    if (!res || res.indexOf("error::") === 0) {
                        if (!hasError) {
                            hasError = true;
                            errorMsg = res && res.indexOf("error::") === 0 ? res.substring(7) : "";
                        }
                        if (pending === 0) done(sortPngGroups(allGroups), errorMsg);
                        return;
                    }
                    try {
                        var payload = JSON.parse(res);
                        var groups = payload.groups || [];
                        allGroups = allGroups.concat(groups);
                    } catch (parseErr) {
                        if (!hasError) { hasError = true; errorMsg = "Overlay folders could not be scanned."; }
                    }
                    if (pending === 0) done(sortPngGroups(allGroups), errorMsg);
                }
            );
        }
        collectResults(basePath + "/Overlays");
        collectResults(basePath + "/GIF");
    }

    function importOverlayAsset(filePath) {
        if (!filePath) return;
        setOverlayStatus("Importing overlay...", false);
        csInterface.evalScript(
            "toolkit.importOverlayAsset('" + escapeScriptString(filePath) + "')",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setOverlayStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Overlay was not imported.", true);
                    return;
                }
                setOverlayStatus(res.indexOf("success::") === 0 ? res.substring(9) : "Overlay imported.", false);
            }
        );
    }

    function importPngAsset(filePath) {
        if (!filePath) return;
        setPngStatus("Importing overlay...", false);
        csInterface.evalScript(
            "toolkit.importPngAsset('" + escapeScriptString(filePath) + "')",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setPngStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Overlay was not imported.", true);
                    return;
                }
                setPngStatus(res.indexOf("success::") === 0 ? res.substring(9) : "Overlay imported.", false);
            }
        );
    }

    function importInstagramTemplate() {
        const templatePath = findInstagramTemplatePath();
        setPngStatus("Importing Instagram template...", false);
        csInterface.evalScript(
            "toolkit.importInstagramTemplate('" + escapeScriptString(templatePath) + "')",
            function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setPngStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Instagram template was not imported.", true);
                    return;
                }
                setPngStatus(res.indexOf("success::") === 0 ? res.substring(9) : "Instagram template imported.", false);
            }
        );
    }

    function importPngFromCard(item) {
        if (!item || !item.path) return;
        const now = Date.now();
        if (now - pngTapState.importedAt < 500) return;
        pngTapState.importedAt = now;
        if (pngTapState.timer) {
            clearTimeout(pngTapState.timer);
            pngTapState.timer = null;
        }
        closeOverlayFocusPreview();
        importPngAsset(item.path);
    }

    function applyOverlayVideoBudget(video, maxSize) {
        if (!video) return;
        var size = Math.max(96, parseInt(maxSize, 10) || 240);
        try { video.width = size; } catch (widthErr) {}
        try { video.height = size; } catch (heightErr) {}
        try { video.disablePictureInPicture = true; } catch (pipErr) {}
    }

    function getOverlayPreviewMaxSide() {
        return 144;
    }

    function buildOverlayFocusMedia(item) {
        if (!item) return null;
        if (item.kind === "video") {
            const video = document.createElement("video");
            video.className = "overlay-focus-media";
            video.src = overlayFileToUrl(item.path);
            video.loop = true;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            video.preload = "metadata";
            applyOverlayVideoBudget(video, getOverlayPreviewMaxSide());
            video.setAttribute("muted", "muted");
            video.setAttribute("playsinline", "playsinline");
            video.addEventListener("loadeddata", function() {
                const playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") playPromise.catch(function() {});
            });
            return video;
        }

        const image = document.createElement("img");
        image.className = "overlay-focus-media";
        image.src = overlayFileToUrl(item.path);
        image.alt = item.name;
        return image;
    }

    function closeOverlayFocusPreview() {
        const layer = document.getElementById("overlayFocusLayer");
        const mediaShell = document.getElementById("overlayFocusMediaShell");
        if (!layer || !mediaShell) return;
        overlayState.focusItem = null;
        layer.classList.remove("active");
        releaseOverlayMediaShell(mediaShell);
    }

    function openOverlayFocusPreview(item) {
        const layer = document.getElementById("overlayFocusLayer");
        const mediaShell = document.getElementById("overlayFocusMediaShell");
        const title = document.getElementById("overlayFocusTitle");
        if (!layer || !mediaShell || !title || !item) return;
        overlayState.focusItem = item;
        releaseOverlayMediaShell(mediaShell);
        mediaShell.appendChild(buildOverlayFocusMedia(item));
        title.textContent = getOverlayDisplayName(item.name);
        layer.classList.add("active");
    }

    function initOverlayFocusPreview() {
        const layer = document.getElementById("overlayFocusLayer");
        const card = document.getElementById("overlayFocusCard");
        if (!layer || !card) return;

        layer.addEventListener("click", function(e) {
            if (e.target === layer) closeOverlayFocusPreview();
        });
        card.addEventListener("click", function(e) {
            e.stopPropagation();
        });
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && layer.classList.contains("active")) closeOverlayFocusPreview();
        });
    }

    function getOverlayGridRoot() {
        return document.getElementById("overlayGrid") || null;
    }

    function releaseOverlayMediaNode(node) {
        if (!node) return;
        if (node.tagName === "VIDEO") {
            try { node.pause(); } catch (pauseErr) {}
            try { node.removeAttribute("src"); } catch (srcErr) {}
            try { node.load(); } catch (loadErr) {}
        }
    }

    function releaseOverlayMediaShell(container) {
        if (!container) return;
        const mediaNodes = container.querySelectorAll ? container.querySelectorAll("video") : [];
        for (let i = 0; i < mediaNodes.length; i++) releaseOverlayMediaNode(mediaNodes[i]);
        while (container.firstChild) {
            releaseOverlayMediaNode(container.firstChild);
            container.removeChild(container.firstChild);
        }
    }

    function getOverlayGridMetrics() {
        const grid = getOverlayGridRoot();
        if (!grid) return null;
        const styles = window.getComputedStyle ? window.getComputedStyle(grid) : null;
        const gap = styles ? (parseFloat(styles.rowGap || styles.gap || "5") || 5) : 5;
        const columns = 4;
        const availableWidth = Math.max(120, grid.clientWidth || 0);
        const cardWidth = Math.max(24, (availableWidth - (gap * (columns - 1))) / columns);
        const cardHeight = Math.round(cardWidth + 35);
        const rowStep = cardHeight + gap;
        return {
            grid: grid,
            columns: columns,
            gap: gap,
            cardWidth: cardWidth,
            cardHeight: cardHeight,
            rowStep: rowStep,
            viewportHeight: Math.max(1, grid.clientHeight || 325),
            scrollTop: grid.scrollTop || 0
        };
    }

    function createOverlaySpacer(height) {
        const spacer = document.createElement("div");
        spacer.className = "overlay-spacer";
        spacer.style.height = Math.max(0, Math.round(height)) + "px";
        return spacer;
    }

    function ensureOverlayThumbnailObserver() {
        if (!overlayState.loaded) return null;
        if (overlayState.thumbnailObserver || !("IntersectionObserver" in window)) return overlayState.thumbnailObserver;
        overlayState.thumbnailObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                const node = entry.target;
                try { overlayState.thumbnailObserver.unobserve(node); } catch (unobserveErr) {}
                scheduleOverlayThumbnail(node, node.__overlayThumbItem);
            });
        }, {
            root: getOverlayGridRoot(),
            rootMargin: "40px 0px",
            threshold: 0.01
        });
        return overlayState.thumbnailObserver;
    }

    function processOverlayThumbnailQueue() {
        if (!overlayState.loaded) return;
        if (overlayState.isScrolling) return;
        while (overlayState.thumbnailActive < 1 && overlayState.thumbnailQueue.length) {
            const task = overlayState.thumbnailQueue.shift();
            if (!task || !task.node || !task.item || task.node.__overlayThumbDone) continue;
            const sessionId = overlayState.sessionId;
            overlayState.thumbnailActive++;
            generateOverlayThumbnail(task.item, function(dataUrl) {
                overlayState.thumbnailActive = Math.max(0, overlayState.thumbnailActive - 1);
                if (!overlayState.loaded || sessionId !== overlayState.sessionId) return;
                if (dataUrl) overlayState.thumbnailCache[task.item.path] = dataUrl;
                if (task.node && task.node.isConnected && !task.node.__overlayThumbDone) {
                    if (dataUrl) task.node.style.backgroundImage = "url('" + dataUrl + "')";
                    task.node.__overlayThumbDone = true;
                }
                processOverlayThumbnailQueue();
            });
        }
    }

    function scheduleOverlayThumbnail(node, item) {
        if (!overlayState.loaded) return;
        if (!node || !item || item.kind !== "video" || node.__overlayThumbQueued || node.__overlayThumbDone) return;
        const cached = overlayState.thumbnailCache[item.path];
        if (cached) {
            node.style.backgroundImage = "url('" + cached + "')";
            node.__overlayThumbDone = true;
            return;
        }
        node.__overlayThumbQueued = true;
        overlayState.thumbnailQueue.push({ node: node, item: item });
        processOverlayThumbnailQueue();
    }

    function stopActiveOverlayVideoPreview() {
        if (!overlayState.activeVideoCard) return;
        try {
            if (typeof overlayState.activeVideoCard.__overlayDeactivate === "function") overlayState.activeVideoCard.__overlayDeactivate();
        } catch (deactivateErr) {}
        overlayState.activeVideoCard = null;
    }

    function setOverlayGridScrollingState(isScrolling) {
        const grid = getOverlayGridRoot();
        overlayState.isScrolling = !!isScrolling;
        if (grid) grid.classList.toggle("is-scrolling", !!isScrolling);
        if (isScrolling) stopActiveOverlayVideoPreview();
    }

    function initOverlayGridPerformance() {
        const grid = getOverlayGridRoot();
        if (!grid || grid.__overlayPerfBound) return;
        grid.__overlayPerfBound = true;
        grid.addEventListener("scroll", function() {
            setOverlayGridScrollingState(true);
            scheduleOverlayVirtualRender();
            if (overlayState.scrollTimer) clearTimeout(overlayState.scrollTimer);
            overlayState.scrollTimer = setTimeout(function() {
                overlayState.scrollTimer = null;
                setOverlayGridScrollingState(false);
                scheduleOverlayVirtualRender();
                processOverlayThumbnailQueue();
            }, 140);
        }, { passive: true });
        if (!overlayState.resizeBound) {
            overlayState.resizeBound = true;
            window.addEventListener("resize", function() {
                scheduleOverlayVirtualRender(true);
            });
        }
    }

    function generateOverlayThumbnail(item, done) {
        const tempVideo = document.createElement("video");
        const holder = ensureOverlayMainThumbHolder();
        let finished = false;
        let drawTimeout = null;

        function cleanup() {
            if (drawTimeout) {
                clearTimeout(drawTimeout);
                drawTimeout = null;
            }
            try { tempVideo.pause(); } catch (pauseErr) {}
            try {
                if (tempVideo.parentNode) tempVideo.parentNode.removeChild(tempVideo);
            } catch (removeErr) {}
            try {
                tempVideo.removeAttribute("src");
                tempVideo.load();
            } catch (resetErr) {}
        }

        function safeFinish(result) {
            if (finished) return;
            finished = true;
            cleanup();
            done(result || "");
        }

        function drawFrame() {
            try {
                const sourceWidth = tempVideo.videoWidth || 0;
                const sourceHeight = tempVideo.videoHeight || 0;
                if (sourceWidth < 1 || sourceHeight < 1) {
                    safeFinish("");
                    return;
                }
                const maxSide = getOverlayPreviewMaxSide();
                const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
                const width = Math.max(1, Math.round(sourceWidth * scale));
                const height = Math.max(1, Math.round(sourceHeight * scale));
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    safeFinish("");
                    return;
                }
                ctx.drawImage(tempVideo, 0, 0, width, height);
                safeFinish(canvas.toDataURL("image/jpeg", 0.42));
            } catch (drawErr) {
                safeFinish("");
            }
        }

        tempVideo.muted = true;
        tempVideo.preload = "auto";
        tempVideo.playsInline = true;
        tempVideo.setAttribute("muted", "muted");
        tempVideo.setAttribute("playsinline", "playsinline");
        tempVideo.addEventListener("loadeddata", function() {
            try {
                if (tempVideo.duration && isFinite(tempVideo.duration)) {
                    tempVideo.currentTime = getOverlayPreviewSeekTime(tempVideo.duration);
                    return;
                }
            } catch (seekErr) {}
            drawFrame();
        });
        tempVideo.addEventListener("seeked", drawFrame);
        tempVideo.addEventListener("error", function() { safeFinish(""); });
        drawTimeout = setTimeout(drawFrame, 2200);
        holder.appendChild(tempVideo);
        tempVideo.src = overlayFileToUrl(item.path);
        try { tempVideo.load(); } catch (loadErr) { safeFinish(""); }
    }

    function createOverlayStillPreview(item) {
        if (item.kind === "image") {
            const image = document.createElement("img");
            image.className = "overlay-preview";
            image.src = overlayFileToUrl(item.path);
            image.alt = item.name;
            image.loading = "lazy";
            image.decoding = "async";
            return image;
        }

        const posterPath = findStaticOverlayPoster(item.path);
        if (posterPath) {
            const poster = document.createElement("img");
            poster.className = "overlay-preview";
            poster.src = overlayFileToUrl(posterPath);
            poster.alt = item.name;
            poster.loading = "lazy";
            poster.decoding = "async";
            poster.__overlayThumbDone = true;
            return poster;
        }

        const still = document.createElement("div");
        still.className = "overlay-preview overlay-preview-idle";
        still.setAttribute("aria-label", item.name);
        still.__overlayThumbItem = item;
        const cached = overlayState.thumbnailCache[item.path];
        if (cached) {
            still.style.backgroundImage = "url('" + cached + "')";
            still.__overlayThumbDone = true;
            return still;
        }

        const observer = ensureOverlayThumbnailObserver();
        if (observer) observer.observe(still);
        else scheduleOverlayThumbnail(still, item);
        return still;
    }

    function buildOverlayPreview(item, isActive) {
        if (item.kind === "video") {
            return createOverlayStillPreview(item);
        }

        const image = document.createElement("img");
        image.className = "overlay-preview";
        image.src = overlayFileToUrl(item.path);
        image.alt = item.name;
        image.loading = "lazy";
        image.decoding = "async";
        return image;
    }

    function createOverlayCard(item) {
        const card = document.createElement("div");
        card.className = "overlay-item";
        card.title = "Double click to import";

        const previewShell = document.createElement("div");
        previewShell.className = "overlay-preview-shell";

        const badge = document.createElement("span");
        badge.className = "overlay-media-badge";
        badge.textContent = item.kind;

        const body = document.createElement("div");
        body.className = "overlay-item-body";

        const name = document.createElement("p");
        name.className = "overlay-item-name";
        name.textContent = getOverlayDisplayName(item.name);

        body.appendChild(name);
        card.appendChild(previewShell);
        card.appendChild(body);

        function renderPreview(isActive) {
            releaseOverlayMediaShell(previewShell);
            const previewNode = buildOverlayPreview(item, !!isActive);
            previewShell.appendChild(previewNode);
            previewShell.appendChild(badge);
        }

        renderPreview(false);

        card.addEventListener("click", function() {
            if (overlayState.focusClickTimer) clearTimeout(overlayState.focusClickTimer);
            overlayState.focusClickTimer = setTimeout(function() {
                overlayState.focusClickTimer = null;
                openOverlayFocusPreview(item);
            }, 180);
        });
        card.addEventListener("dblclick", function() {
            if (overlayState.focusClickTimer) {
                clearTimeout(overlayState.focusClickTimer);
                overlayState.focusClickTimer = null;
            }
            importOverlayAsset(item.path);
        });
        return card;
    }

    function createPngCard(item) {
        const card = document.createElement("div");
        card.className = "overlay-item";
        card.title = "Double tap to import";
        card.setAttribute("aria-label", getOverlayDisplayName(item.name));

        const previewShell = document.createElement("div");
        previewShell.className = "overlay-preview-shell";

        const isGif = item.kind === "gif";
        const image = document.createElement("img");
        image.className = "overlay-preview";
        image.src = overlayFileToUrl(item.path);
        image.alt = item.name;
        image.loading = "lazy";
        image.decoding = "async";
        if (isGif) image.setAttribute("data-gif", "true");
        image.onerror = function() {
            previewShell.classList.add("png-preview-missing");
        };

        previewShell.appendChild(image);
        card.appendChild(previewShell);

        const badge = document.createElement("span");
        badge.className = "overlay-media-badge";
        badge.textContent = isGif ? "GIF" : "PNG";
        previewShell.appendChild(badge);

        const body = document.createElement("div");
        body.className = "overlay-item-body";

        const name = document.createElement("p");
        name.className = "overlay-item-name";
        name.textContent = getOverlayDisplayName(item.name);

        body.appendChild(name);
        card.appendChild(body);

        card.addEventListener("click", function() {
            const now = Date.now();
            if (pngTapState.path === item.path && now - pngTapState.time < 360) {
                pngTapState.path = "";
                pngTapState.time = 0;
                importPngFromCard(item);
                return;
            }
            pngTapState.path = item.path;
            pngTapState.time = now;
            if (pngTapState.timer) clearTimeout(pngTapState.timer);
            pngTapState.timer = setTimeout(function() {
                pngTapState.timer = null;
                pngTapState.path = "";
                pngTapState.time = 0;
            }, 390);
        });
        card.addEventListener("dblclick", function(e) {
            if (e && e.preventDefault) e.preventDefault();
            importPngFromCard(item);
        });
        return card;
    }

    function createPngFolderSection(group) {
        const section = document.createElement("section");
        section.className = "png-folder-section";

        const head = document.createElement("div");
        head.className = "png-folder-head";

        const title = document.createElement("p");
        title.className = "png-folder-name";
        title.textContent = group.folder || "Overlays";

        const count = document.createElement("span");
        count.className = "png-folder-count";
        count.textContent = (group.items || []).length + " items";

        const folderGrid = document.createElement("div");
        folderGrid.className = "png-folder-grid";
        (group.items || []).forEach((item) => folderGrid.appendChild(createPngCard(item)));

        head.appendChild(title);
        head.appendChild(count);
        section.appendChild(head);
        section.appendChild(folderGrid);
        return section;
    }

    function getPngGroupKey(group) {
        return String((group && group.path) || (group && group.folder) || "");
    }

    function getActivePngGroup() {
        const groups = pngLibraryState.groups || [];
        if (!groups.length) return null;
        for (let i = 0; i < groups.length; i++) {
            if (getPngGroupKey(groups[i]) === pngLibraryState.activeFolderKey) return groups[i];
        }
        pngLibraryState.activeFolderKey = getPngGroupKey(groups[0]);
        return groups[0];
    }

    function initPngFolderSliderScroll(slider) {
        if (!slider || slider.__pngScrollBound) return;
        slider.__pngScrollBound = true;

        slider.addEventListener("wheel", function(e) {
            if (slider.scrollWidth <= slider.clientWidth) return;
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (!delta) return;
            slider.scrollLeft += delta;
            e.preventDefault();
        }, { passive: false });

        let dragging = false;
        let startX = 0;
        let startScrollLeft = 0;
        let moved = false;

        slider.addEventListener("mousedown", function(e) {
            if (e.button !== 0 || slider.scrollWidth <= slider.clientWidth) return;
            dragging = true;
            moved = false;
            startX = e.clientX;
            startScrollLeft = slider.scrollLeft;
            slider.classList.add("dragging");
        });

        document.addEventListener("mousemove", function(e) {
            if (!dragging) return;
            const delta = e.clientX - startX;
            if (Math.abs(delta) > 3) moved = true;
            slider.scrollLeft = startScrollLeft - delta;
            e.preventDefault();
        });

        document.addEventListener("mouseup", function() {
            if (!dragging) return;
            dragging = false;
            slider.classList.remove("dragging");
            if (moved) {
                slider.__pngSuppressClick = true;
                setTimeout(function() {
                    slider.__pngSuppressClick = false;
                }, 80);
            }
        });
    }

    function renderPngFolderSlider() {
        const slider = document.getElementById("pngFolderSlider");
        if (!slider) return;
        initPngFolderSliderScroll(slider);
        slider.innerHTML = "";
        const groups = pngLibraryState.groups || [];
        groups.forEach((group) => {
            const key = getPngGroupKey(group);
            const button = document.createElement("button");
            button.className = "png-folder-tab";
            button.type = "button";
            button.classList.toggle("active", key === pngLibraryState.activeFolderKey);
            button.title = group.folder || "Overlays";

            const name = document.createElement("span");
            name.className = "png-folder-tab-name";
            name.textContent = group.folder || "Overlays";

            const count = document.createElement("span");
            count.className = "png-folder-tab-count";
            count.textContent = (group.items || []).length;

            button.appendChild(name);
            button.appendChild(count);
            button.onclick = function() {
                if (slider.__pngSuppressClick) return;
                pngLibraryState.activeFolderKey = key;
                renderPngFolderSlider();
                renderSelectedPngFolder();
            };
            slider.appendChild(button);
        });
    }

    function renderSelectedPngFolder() {
        const grid = document.getElementById("pngGrid");
        if (!grid) return;
        grid.innerHTML = "";
        const group = getActivePngGroup();
        if (!group) return;
        grid.appendChild(createPngFolderSection(group));
        setPngStatus((group.items || []).length + " file(s) loaded from " + (group.folder || "Overlays") + ".", false);
    }

    function renderOverlayVirtualWindow(force) {
        const grid = document.getElementById("overlayGrid");
        if (!grid || !overlayState.loaded) return;
        const items = overlayState.items || [];

        if (!items.length) {
            grid.innerHTML = "";
            const empty = document.createElement("div");
            empty.className = "overlay-empty";
            empty.textContent = "No overlays were found. Add mp4, mov, webm, gif, jpg, or webp files to the `overlays` folder, then press Refresh.";
            grid.appendChild(empty);
            overlayState.virtualRangeKey = "empty";
            return;
        }

        const metrics = getOverlayGridMetrics();
        if (!metrics) return;

        const totalRows = Math.ceil(items.length / metrics.columns);
        const visibleRows = Math.ceil(metrics.viewportHeight / metrics.rowStep) + 3;
        const startRow = Math.max(0, Math.floor(metrics.scrollTop / metrics.rowStep) - 1);
        const endRow = Math.min(totalRows, startRow + visibleRows);
        const startIndex = startRow * metrics.columns;
        const endIndex = Math.min(items.length, endRow * metrics.columns);
        const rangeKey = [startIndex, endIndex, Math.round(metrics.cardWidth), totalRows].join(":");

        if (!force && overlayState.virtualRangeKey === rangeKey) {
            processOverlayThumbnailQueue();
            return;
        }

        overlayState.virtualRangeKey = rangeKey;
        overlayState.thumbnailQueue = [];
        if (overlayState.thumbnailObserver) {
            try { overlayState.thumbnailObserver.disconnect(); } catch (disconnectErr) {}
            overlayState.thumbnailObserver = null;
        }
        releaseOverlayMediaShell(grid);

        const fragment = document.createDocumentFragment();
        const topRows = startRow;
        const bottomRows = Math.max(0, totalRows - endRow);

        if (topRows > 0) fragment.appendChild(createOverlaySpacer(topRows * metrics.rowStep));
        for (let i = startIndex; i < endIndex; i++) fragment.appendChild(createOverlayCard(items[i]));
        if (bottomRows > 0) fragment.appendChild(createOverlaySpacer(bottomRows * metrics.rowStep));

        grid.appendChild(fragment);
        processOverlayThumbnailQueue();
    }

    function scheduleOverlayVirtualRender(force) {
        if (!overlayState.loaded) return;
        if (overlayState.virtualRenderRaf) cancelAnimationFrame(overlayState.virtualRenderRaf);
        overlayState.virtualRenderRaf = window.requestAnimationFrame(function() {
            overlayState.virtualRenderRaf = 0;
            renderOverlayVirtualWindow(!!force);
        });
    }

    function unloadOverlayLibrary() {
        const grid = getOverlayGridRoot();
        overlayState.sessionId++;
        overlayState.loaded = false;
        overlayState.items = [];
        overlayState.thumbnailQueue = [];
        overlayState.thumbnailCache = {};
        overlayState.thumbnailActive = 0;
        overlayState.virtualRangeKey = "";
        if (overlayState.focusClickTimer) {
            clearTimeout(overlayState.focusClickTimer);
            overlayState.focusClickTimer = null;
        }
        if (overlayState.scrollTimer) {
            clearTimeout(overlayState.scrollTimer);
            overlayState.scrollTimer = null;
        }
        if (overlayState.virtualRenderRaf) {
            cancelAnimationFrame(overlayState.virtualRenderRaf);
            overlayState.virtualRenderRaf = 0;
        }
        setOverlayGridScrollingState(false);
        stopActiveOverlayVideoPreview();
        closeOverlayFocusPreview();
        if (overlayState.thumbnailObserver) {
            try { overlayState.thumbnailObserver.disconnect(); } catch (disconnectErr) {}
            overlayState.thumbnailObserver = null;
        }
        if (grid) {
            releaseOverlayMediaShell(grid);
            grid.scrollTop = 0;
        }
        setOverlayStatus("Overlay panel is on standby. It will reload when opened again.", false);
    }

    function refreshOverlayLibrary() {
        overlayState.sessionId++;
        overlayState.loaded = true;
        overlayState.thumbnailQueue = [];
        overlayState.thumbnailCache = {};
        overlayState.thumbnailActive = 0;
        if (overlayState.scrollTimer) {
            clearTimeout(overlayState.scrollTimer);
            overlayState.scrollTimer = null;
        }
        setOverlayGridScrollingState(false);
        if (overlayState.thumbnailObserver) {
            try { overlayState.thumbnailObserver.disconnect(); } catch (disconnectErr) {}
            overlayState.thumbnailObserver = null;
        }
        overlayState.items = getOverlayItems();
        overlayState.virtualRangeKey = "";
        initOverlayGridPerformance();
        scheduleOverlayVirtualRender(true);
        setOverlayStatus(
            overlayState.items.length
                ? (overlayState.items.length + " overlay(s) loaded from overlays folder.")
                : "Overlays folder is ready. Add files, then press Refresh.",
            false
        );
    }

    function refreshPngLibrary() {
        const grid = document.getElementById("pngGrid");
        const slider = document.getElementById("pngFolderSlider");
        if (!grid) return;
        grid.innerHTML = "";
        if (slider) slider.innerHTML = "";
        setPngStatus("Scanning overlay folders...", false);
        scanPngGroups(function(groups, warning) {
            grid.innerHTML = "";
            if (!groups.length) {
                pngLibraryState.groups = [];
                pngLibraryState.activeFolderKey = "";
                if (slider) slider.innerHTML = "";
                const empty = document.createElement("div");
                empty.className = "overlay-empty";
                empty.textContent = "No overlay files were found. Add .png or .gif files to the `overlays/Overlays` or `overlays/GIF` folders, then press Refresh.";
                grid.appendChild(empty);
                setPngStatus(warning || "Overlays folder is ready. Add files, then press Refresh.", !!warning);
                return;
            }
            const currentKey = pngLibraryState.activeFolderKey;
            pngLibraryState.groups = groups;
            const hasCurrent = groups.some((group) => getPngGroupKey(group) === currentKey);
            pngLibraryState.activeFolderKey = hasCurrent ? currentKey : getPngGroupKey(groups[0]);
            renderPngFolderSlider();
            renderSelectedPngFolder();
        });
    }

    // 3. COLOR PICKER ENGINE
    const cpSV = document.getElementById("colorSatVal");
    const cpH = document.getElementById("colorHue");
    const cpBox = document.getElementById("curColorBox");
    const cpHex = document.getElementById("hexDisplay");
    let hue = 0, sat = 100, val = 100, isSV = false, isH = false;

    function getSolidHexColor() {
        const raw = cpHex && cpHex.value ? String(cpHex.value).trim() : "#FF0000";
        const normalized = raw.charAt(0) === "#" ? raw : ("#" + raw);
        return /^#[0-9A-Fa-f]{6}$/.test(normalized) ? normalized.toUpperCase() : "#FF0000";
    }

    function updateCP() {
        const f = (n, k=(n+hue/60)%6) => (val/100) - (val/100)*(sat/100)*Math.max(Math.min(k, 4-k, 1), 0);
        const r = Math.round(f(5)*255), g = Math.round(f(3)*255), b = Math.round(f(1)*255);
        const hex = "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
        if (cpBox) cpBox.style.background = hex;
        if (cpHex) cpHex.value = hex;
        if (cpSV) cpSV.style.backgroundColor = `hsl(${hue},100%,50%)`;
    }

    function dragSV(e) {
        if (!cpSV) return;
        const r = cpSV.getBoundingClientRect();
        if (!r.width || !r.height) return;
        sat = Math.min(Math.max((e.clientX - r.left) / r.width * 100, 0), 100);
        val = Math.min(Math.max(100 - ((e.clientY - r.top) / r.height * 100), 0), 100);
        updateCP();
    }

    function dragH(e) {
        if (!cpH) return;
        const r = cpH.getBoundingClientRect();
        if (!r.height) return;
        hue = Math.min(Math.max((e.clientY - r.top) / r.height * 360, 0), 360);
        updateCP();
    }

    function onColorPickerMouseMove(e) {
        if (isSV) dragSV(e);
        if (isH) dragH(e);
    }

    function onColorPickerMouseUp() {
        isSV = false;
        isH = false;
    }

    if (cpSV && cpH) {
        cpSV.onmousedown = (e) => { e.preventDefault(); isSV = true; isH = false; dragSV(e); };
        cpH.onmousedown = (e) => { e.preventDefault(); isH = true; isSV = false; dragH(e); };
        document.addEventListener("mousemove", onColorPickerMouseMove);
        document.addEventListener("mouseup", onColorPickerMouseUp);
    }

    if (cpHex) {
        cpHex.oninput = function() {
            let v = this.value.trim().replace("#", "");
            if (v.length === 6) {
                const r = parseInt(v.substring(0, 2), 16), g = parseInt(v.substring(2, 4), 16), b = parseInt(v.substring(4, 6), 16);
                const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
                val = (max / 255) * 100;
                sat = max === 0 ? 0 : (d / max) * 100;
                if (max === min) hue = 0;
                else {
                    switch (max) {
                        case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
                        case g: hue = (b - r) / d + 2; break;
                        case b: hue = (r - g) / d + 4; break;
                    }
                    hue *= 60;
                }
                updateCP();
            }
        };
    }
    updateCP();

    // 4. BIND TOOLS — pass hex without "#" (CEP evalScript can truncate at hash)
    function runCreateColoredSolid() {
        updateCP();
        const hex = getSolidHexColor().replace(/^#/, "");
        run("toolkit.createColoredSolid('" + escapeScriptString(hex) + "')");
    }

    const preCompBtn = document.getElementById("btnPreComp");
    if(preCompBtn) { preCompBtn.onclick = (e) => { if(e.shiftKey) run("toolkit.preCompTogether()"); else run("toolkit.preCompIndividual()"); }; }

    const importSrtBtn = document.getElementById("btnImportSrt");
    const srtImportFileInput = document.getElementById("srtImportFileInput");
    function importSrtPath(path) {
        if (!path) return;
        importSrtIntoTranscript(path);
    }
    if (importSrtBtn) {
        importSrtBtn.onclick = () => {
            if (srtImportFileInput) {
                srtImportFileInput.value = "";
                srtImportFileInput.click();
                return;
            }
            const result = window.cep.fs.showOpenDialog(false, false, "Select SRT", "", ["srt"]);
            if(result.data && result.data.length > 0) importSrtPath(result.data[0]);
        };
    }
    if (srtImportFileInput) {
        srtImportFileInput.onchange = () => {
            const file = srtImportFileInput.files && srtImportFileInput.files[0] ? srtImportFileInput.files[0] : null;
            const path = file ? (file.path || file.name || "") : "";
            srtImportFileInput.value = "";
            importSrtPath(path);
        };
    }
    const autoApiKeyBtn = document.getElementById("btnAutoApiKey");
    if (autoApiKeyBtn) {
        autoApiKeyBtn.onclick = openSrtApiModal;
    }
    const autoGenerateBtn = document.getElementById("btnAutoGenerateCaptions");
    if (autoGenerateBtn) {
        autoGenerateBtn.onclick = () => {
            const options = getAutoCaptionOptions();
            autoCaptionDraft = [];
            autoCaptionEditing = false;
            renderAutoCaptionDraft();
            autoGenerateBtn.textContent = "Generating...";
            autoGenerateBtn.disabled = true;
            setAutoCaptionStatus("Generating automatic captions...", false);
            csInterface.evalScript(`toolkit.prepareAutoCaptions('${escapeScriptString(JSON.stringify(options))}')`, function(res) {
                autoGenerateBtn.disabled = false;
                autoGenerateBtn.textContent = autoCaptionDraft.length ? "Regenerate" : "Generate Captions";
                if (!res || res.indexOf("error::") === 0) {
                    setAutoCaptionStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Automatic captions were not generated.", true);
                    return;
                }
                try {
                    const payload = JSON.parse(res.indexOf("success::") === 0 ? res.substring(9) : res);
                    autoCaptionDraft = Array.isArray(payload.captions) ? payload.captions : [];
                    renderAutoCaptionDraft();
                    autoGenerateBtn.textContent = "Regenerate";
                    setAutoCaptionStatus(autoCaptionDraft.length + " captions loaded in panel. Edit or Add to Comp.", false);
                } catch (err) {
                    setAutoCaptionStatus("Caption data parse failed.", true);
                }
            });
        };
    }
    const autoAddBtn = document.getElementById("btnAutoAddToComp");
    if (autoAddBtn) {
        autoAddBtn.onclick = () => {
            if (autoCaptionAddRun && autoCaptionAddRun.active) {
                requestAutoCaptionAddCancel();
                return;
            }
            if (!autoCaptionDraft.length) {
                setAutoCaptionStatus("Generate captions first.", true);
                return;
            }
            const options = getAutoCaptionOptions();
            addAutoCaptionsToCompWithStyle(options);
        };
    }
    document.addEventListener("keydown", (evt) => {
        if (evt.key !== "Escape") return;
        if (!autoCaptionAddRun || !autoCaptionAddRun.active) return;
        evt.preventDefault();
        evt.stopPropagation();
        requestAutoCaptionAddCancel();
    }, true);
    const autoEditBtn = document.getElementById("btnAutoEditTranscript");
    if (autoEditBtn) {
        autoEditBtn.onclick = () => {
            if (!autoCaptionDraft.length) return;
            if (autoCaptionEditing) syncAutoCaptionEdits();
            autoCaptionEditing = !autoCaptionEditing;
            renderAutoCaptionDraft();
        };
    }
    const autoSrtBtn = document.getElementById("btnAutoDownloadSrt");
    if (autoSrtBtn) autoSrtBtn.onclick = downloadAutoCaptionSrt;
    const autoDeleteBtn = document.getElementById("btnAutoDeleteSubs");
    if (autoDeleteBtn) {
        autoDeleteBtn.onclick = () => {
            csInterface.evalScript("toolkit.deleteSubtitleLayers()", function(res) {
                if (!res || res.indexOf("error::") === 0) {
                    setAutoCaptionStatus(res && res.indexOf("error::") === 0 ? res.substring(7) : "Delete did not run.", true);
                    return;
                }
                setAutoCaptionStatus(res.indexOf("success::") === 0 ? res.substring(9) : res, false);
            });
        };
    }
    const autoSyncBtn = document.getElementById("btnAutoSyncStyle");
    if (autoSyncBtn) autoSyncBtn.onclick = () => run("toolkit.syncSubtitlesStyle()");
    const deepgramBtn = document.getElementById("btnOpenDeepgram");
    if (deepgramBtn) deepgramBtn.onclick = () => openExternalUrl("https://deepgram.com/");

    bind("al-left", "toolkit.align('left')"); bind("al-centerH", "toolkit.align('centerH')"); bind("al-right", "toolkit.align('right')"); bind("al-top", "toolkit.align('top')"); bind("al-centerV", "toolkit.align('centerV')"); bind("al-bottom", "toolkit.align('bottom')");
    bind("al-fitW", "toolkit.fit('width')"); bind("al-fitH", "toolkit.fit('height')"); bind("al-fitStretch", "toolkit.fit('stretch')"); bind("an-TL", "toolkit.setAnchor('TL')"); bind("an-TC", "toolkit.setAnchor('TC')"); bind("an-TR", "toolkit.setAnchor('TR')");
    bind("an-ML", "toolkit.setAnchor('ML')"); bind("an-MC", "toolkit.setAnchor('MC')"); bind("an-MR", "toolkit.setAnchor('MR')"); bind("an-BL", "toolkit.setAnchor('BL')"); bind("an-BC", "toolkit.setAnchor('BC')"); bind("an-BR", "toolkit.setAnchor('BR')");
    bind("btnAePurge", "toolkit.purgeAfterEffectsCache()");
    bind("btnTextExplodeWords", "toolkit.explodeSelectedText('words')");
    bind("btnTextExplodeChars", "toolkit.explodeSelectedText('chars')");
    bind("btnMaskLayerSplitter", "toolkit.splitSelectedLayerMasks()");
    bind("btnUnprecomp", "toolkit.unprecompStable()"); bind("btnSplit", "toolkit.quickSplitX()"); bind("btnSequence", "toolkit.sequenceLayerX()"); bind("btnDuplicator", "toolkit.duplicateCompHierarchy()"); bind("btnOrganize", "toolkit.organize()");
    bind("btnAdj", "toolkit.createAdjustmentLayer()"); bind("btnSmartNull", "toolkit.createSmartNull()"); bind("btnCamera", "toolkit.createCameraWithController()");
    const createSolidBtn = document.getElementById("btnCreateSolid");
    if (createSolidBtn) createSolidBtn.onclick = runCreateColoredSolid;
    bind("btnEmptyText", "toolkit.createEmptyTextX()"); bind("btnKeys", "toolkit.setKeyframesX()"); bind("btnEasyEase", "toolkit.easyEaseX()");
    const applePresetSyncBtn = document.getElementById("btnApplePresetSync");
    if (applePresetSyncBtn) {
        applePresetSyncBtn.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            run("toolkit.setKeyframesX()");
        };
    }
    bind("btnFrameAlignLeft", "toolkit.alignSelectedLayersToPlayhead('out')");
    bind("btnFrameAlignRight", "toolkit.alignSelectedLayersToPlayhead('in')");
    bind("btnFrameStackBackward", "toolkit.stackSelectedLayersByFrame('backward')");
    bind("btnFrameStackForward", "toolkit.stackSelectedLayersByFrame('forward')");
    const bounceBtn = document.getElementById("btnBounce");
    if (bounceBtn) {
        bounceBtn.onclick = () => {
            run("toolkit.applyBounceExpression('hard')");
        };
    }
    const findReplaceBtn = document.getElementById("btnFindReplace");
    if (findReplaceBtn) {
        findReplaceBtn.onclick = () => run(`toolkit.findReplace('${escapeScriptString(document.getElementById("findText").value)}', '${escapeScriptString(document.getElementById("replaceText").value)}')`);
    }
    const pngRefreshBtn = document.getElementById("btnRefreshPng");
    if (pngRefreshBtn) pngRefreshBtn.onclick = refreshPngLibrary;
    const instagramTemplateBtn = document.getElementById("btnInstagramTemplate");
    if (instagramTemplateBtn) instagramTemplateBtn.onclick = importInstagramTemplate;
    const beatRefreshBtn = document.getElementById("btnRefreshBeatLayers");
    if (beatRefreshBtn) beatRefreshBtn.onclick = refreshBeatAudioLayers;
    const beatRefreshMiniBtn = document.getElementById("btnRefreshBeatLayersMini");
    if (beatRefreshMiniBtn) beatRefreshMiniBtn.onclick = refreshBeatAudioLayers;
    const beatGenerateBtn = document.getElementById("btnGenerateBeatMarkers");
    if (beatGenerateBtn) beatGenerateBtn.onclick = generateBeatMarkers;
    initOverlayFocusPreview();
    initSrtApiModal();
    initPanelContextMenuGuard();
    initAiHubModal();
    installBundledCaptionFonts();
    initSrtModeSwitch();
    initAutoCaptionNewControls();
    renderAutoCaptionDraft();
    setSrtMode("manual", false);
    initLiquidGlassPanel();
    initDonationModal();
    initGraphEditor();
    initStickyNotes();
    initKwvSocialsPanel();
    if (document.getElementById("kwvCarouselProGrid")) initCarouselTab();
    if (document.getElementById("cocoGradientBoard")) initCocoPaletteStudio();
    const quickPasteBtn = document.getElementById("btnQuickPasteImage");
    if (quickPasteBtn) quickPasteBtn.onclick = pasteFromNavigatorClipboard;
    document.addEventListener("paste", function(e) {
        const targetTag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
        if (!quickPasteArmed || targetTag === "input" || targetTag === "textarea" || targetTag === "select") return;
        e.preventDefault();
        quickPasteArmed = false;
        handleClipboardData(e.clipboardData || window.clipboardData);
    });
    document.getElementById("btnAbout").onclick = () => window.cep.util.openURLInDefaultBrowser("https://www.youtube.com/@keshavwithvelo");
})();
