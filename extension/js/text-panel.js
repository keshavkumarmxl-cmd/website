(function () {
    "use strict";

    const csInterface = new CSInterface();
    const run = (script) => csInterface.evalScript(script);

    const presetCategories = ["TEXT", "EFFECTS", "SHAKE", "CC"];
    const presetCategoryLabels = { TEXT: "Text", EFFECTS: "Effects", SHAKE: "Shakes", CC: "CC" };
    const presetDisplayAliases = {
        "bounce animation": "Bounce Animation",
        "fade up words": "Fade Up Words",
        "opacity blur": "Opacity Blur",
        "opacity blur bounce": "Opacity Blur Bounce",
        "pop up expression": "Pop Up Expression",
        "side bounce": "Side Bounce",
        "slide up": "Slide Up",
        "text animtion": "Text Animation",
        "word bounce": "Word Bounce"
    };
    const presetTextCategoryMap = {
        "basic animator (1)": "One Framer",
        "basic animator (2)": "One Framer",
        "basic animator (3)": "One Framer",
        "basic animator (4)": "One Framer",
        "basic animator (5)": "One Framer",
        "basic animator (6)": "One Framer",
        "fade up words": "Time Warp",
        "slide up": "Time Warp",
        "bounce animation": "Warp",
        "side bounce": "Warp",
        "word bounce": "Warp",
        "opacity blur": "Effects",
        "opacity blur bounce": "Effects",
        "pop up expression": "Effects",
        "text animtion": "Effects"
    };
    const presetGroupOrder = {
        TEXT: ["Effects", "One Framer", "Warp", "Time Warp", "More Presets"],
        EFFECTS: ["Effects"],
        SHAKE: ["Camera Shake"],
        CC: ["Color & FX"]
    };
    const presetDefaultsStorageKey = "keshavwithvelo.presetDefaults.v1";
    const presetState = {
        activeCategory: "TEXT",
        lastCategory: "TEXT",
        query: "",
        cache: {},
        missing: {},
        defaults: loadPresetDefaults(),
        settingsItem: null,
        settingsVariant: "in",
        previewLocked: false
    };

    let currentPreviewUrl = null;

    function escapeScriptString(value) {
        return String(value)
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n");
    }

    function overlayFileToUrl(path) {
        const normalized = String(path || "").replace(/\\/g, "/");
        return encodeURI("file:///" + normalized.replace(/^\/+/, ""));
    }

    function getPresetFolderPath(category) {
        const extPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        if (category === "SHAKE") {
            const pathShake = (extPath + "/presets/SHAKE/").replace(/\\/g, "/");
            const pathShakes = (extPath + "/presets/SHAKES/").replace(/\\/g, "/");
            if (window.cep && window.cep.fs && window.cep.fs.readdir(pathShake).err === 0) {
                return pathShake;
            }
            return pathShakes;
        }
        if (category === "EFFECTS") {
            const pathEffects = (extPath + "/presets/EFFECTS/").replace(/\\/g, "/");
            const pathEffectsLower = (extPath + "/presets/effects/").replace(/\\/g, "/");
            if (window.cep && window.cep.fs && window.cep.fs.readdir(pathEffects).err === 0) {
                return pathEffects;
            }
            return pathEffectsLower;
        }
        if (category === "CC") {
            const pathCcLower = (extPath + "/presets/cc/").replace(/\\/g, "/");
            const pathCc = (extPath + "/presets/CC/").replace(/\\/g, "/");
            if (window.cep && window.cep.fs && window.cep.fs.readdir(pathCcLower).err === 0) {
                return pathCcLower;
            }
            return pathCc;
        }
        return (extPath + "/presets/" + category + "/").replace(/\\/g, "/");
    }

    function getPresetDisplayName(fileName) {
        const raw = String(fileName || "").replace(/\.ffx$/i, "").replace(/_/g, " ").trim();
        const basicMatch = raw.match(/^BASIC ANIMATOR\s*\((\d+)\)$/i);
        if (basicMatch) return "Basic Animator " + basicMatch[1];
        const alias = presetDisplayAliases[raw.toLowerCase()];
        if (alias) return alias;
        return raw.replace(/\s+/g, " ");
    }

    function renderPresetMessage(message) {
        const container = document.getElementById("presetList");
        if (!container) return;
        container.innerHTML = "";
        const note = document.createElement("p");
        note.className = "preset-empty";
        note.textContent = message;
        container.appendChild(note);
    }

    function setActivePresetCategory(category) {
        presetState.activeCategory = category;
        document.querySelectorAll(".apple-preset-tab-bar [data-preset-category]").forEach((button) => {
            const buttonCategory = button.getAttribute("data-preset-category");
            const isActive = buttonCategory === category;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", isActive ? "true" : "false");
        });
    }

    function normalizePresetKey(name) {
        return String(name || "")
            .replace(/\.ffx$/i, "")
            .replace(/_/g, " ")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }

    function getPresetGroupName(item) {
        const name = String(item && item.name ? item.name : "");
        const category = item && item.category ? item.category : "";
        if (category === "SHAKE") return "Camera Shake";
        if (category === "EFFECTS") return "Effects";
        if (category === "CC") return "Color & FX";
        if (category === "TEXT") {
            const mapped = presetTextCategoryMap[normalizePresetKey(name)];
            if (mapped) return mapped;
        }
        const normalized = normalizePresetKey(name);
        if (/^basic animator\s*\(\d+\)$/.test(normalized)) return "One Framer";
        if (/fade up words|slide up/.test(normalized)) return "Time Warp";
        if (/opacity blur|pop up expression|text anim/.test(normalized)) return "Effects";
        if (/bounce/.test(normalized)) return "Warp";
        return "More Presets";
    }

    function sortPresetGroupItems(groupName, items) {
        const list = items.slice();
        if (groupName === "One Framer") {
            return list.sort((a, b) => {
                const aMatch = String(a.name).match(/\((\d+)\)/);
                const bMatch = String(b.name).match(/\((\d+)\)/);
                const ai = parseInt(aMatch ? aMatch[1] : "0", 10);
                const bi = parseInt(bMatch ? bMatch[1] : "0", 10);
                return ai - bi;
            });
        }
        return list.sort((a, b) => {
            return getPresetDisplayName(a.name).localeCompare(getPresetDisplayName(b.name), undefined, { numeric: true, sensitivity: "base" });
        });
    }

    function groupPresetItems(items, category, isSearch) {
        if (isSearch) {
            return [{ name: "Search Results", items: sortPresetGroupItems("Search Results", items) }];
        }
        const groups = {};
        items.forEach((item) => {
            const groupName = getPresetGroupName(item);
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(item);
        });
        const preferred = presetGroupOrder[category] || [];
        const ordered = preferred
            .filter((name) => groups[name] && groups[name].length)
            .map((name) => ({ name: name, items: sortPresetGroupItems(name, groups[name]) }));
        Object.keys(groups).forEach((name) => {
            if (preferred.indexOf(name) === -1) {
                ordered.push({ name: name, items: groups[name] });
            }
        });
        return ordered;
    }

    function sortPresetItemsAlphabetically(items) {
        return items.slice().sort((a, b) => {
            const aName = getPresetDisplayName(a.name);
            const bName = getPresetDisplayName(b.name);
            const aBasic = aName.match(/^Basic Animator (\d+)$/i);
            const bBasic = bName.match(/^Basic Animator (\d+)$/i);
            if (aBasic && bBasic) {
                return parseInt(aBasic[1], 10) - parseInt(bBasic[1], 10);
            }
            return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: "base" });
        });
    }

    function flattenPresetItems(items) {
        return sortPresetItemsAlphabetically(items);
    }

    function setPresetRowPreviewState(activeRow) {
        document.querySelectorAll(".apple-preset-row.is-previewing").forEach((row) => row.classList.remove("is-previewing"));
        if (activeRow) activeRow.classList.add("is-previewing");
    }

    function loadPresetDefaults() {
        try {
            const raw = window.localStorage ? window.localStorage.getItem(presetDefaultsStorageKey) : "";
            return raw ? JSON.parse(raw) : {};
        } catch (err) {
            return {};
        }
    }

    function persistPresetDefaults() {
        try {
            if (window.localStorage) {
                window.localStorage.setItem(presetDefaultsStorageKey, JSON.stringify(presetState.defaults || {}));
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    function getPresetItemKey(item) {
        return String(item && item.category ? item.category : "TEXT") + "::" + String(item && item.name ? item.name : "");
    }

    function getPresetDefaultVariant(item) {
        const saved = presetState.defaults[getPresetItemKey(item)];
        if (saved === "in" || saved === "out") return saved;
        return item && item.variants ? "in" : "";
    }

    function setPresetDefaultVariant(item, variantKey) {
        if (!item || !item.variants) return;
        presetState.defaults[getPresetItemKey(item)] = variantKey === "out" ? "out" : "in";
        persistPresetDefaults();
    }

    function resolvePresetVariantPath(item, variantKey) {
        if (item && item.variants && item.variants[variantKey] && item.variants[variantKey].path) {
            return item.variants[variantKey].path;
        }
        return item ? item.path : "";
    }

    function resolvePresetPreviewSource(item, variantKey) {
        if (item && item.variants && item.variants[variantKey] && item.variants[variantKey].preview) {
            return item.variants[variantKey].preview;
        }
        if (item && item.variants && variantKey === "out" && item.variants.out && item.variants.out.preview) {
            return item.variants.out.preview;
        }
        return item ? item.preview : null;
    }

    function getRowActiveVariant(wrap, item) {
        if (!item || !item.variants) return "";
        const active = wrap && wrap.dataset ? wrap.dataset.activeVariant : "";
        return active === "out" ? "out" : (active === "in" ? "in" : (getPresetDefaultVariant(item) || "in"));
    }

    function setRowActiveVariant(wrap, variantKey) {
        if (!wrap) return;
        wrap.dataset.activeVariant = variantKey === "out" ? "out" : "in";
    }

    function attachPresetVariants(items) {
        const inMap = {};
        const outMap = {};
        const plain = [];

        items.forEach((item) => {
            const display = getPresetDisplayName(item.name);
            const inMatch = display.match(/^(.+?)\s+In$/i);
            const outMatch = display.match(/^(.+?)\s+Out$/i);
            if (inMatch) {
                inMap[inMatch[1].trim().toLowerCase()] = item;
            } else if (outMatch) {
                outMap[outMatch[1].trim().toLowerCase()] = item;
            } else {
                plain.push(item);
            }
        });

        const merged = plain.slice();
        const paired = new Set();

        Object.keys(inMap).forEach((base) => {
            if (outMap[base]) {
                const inItem = inMap[base];
                const outItem = outMap[base];
                const baseName = getPresetDisplayName(inItem.name).replace(/\s+In$/i, "").trim();
                merged.push({
                    category: inItem.category,
                    name: baseName,
                    path: inItem.path,
                    preview: inItem.preview || outItem.preview,
                    variants: {
                        in: { path: inItem.path, preview: inItem.preview || null },
                        out: { path: outItem.path, preview: outItem.preview || null }
                    }
                });
                paired.add(base);
            } else {
                merged.push(inMap[base]);
            }
        });

        Object.keys(outMap).forEach((base) => {
            if (!paired.has(base)) merged.push(outMap[base]);
        });

        return merged.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
    }

    function applyPresetItem(item, variantKey) {
        const path = resolvePresetVariantPath(item, variantKey || getPresetDefaultVariant(item) || "in");
        if (!path) return;
        run("toolkit.applyCustomPreset('" + escapeScriptString(path) + "')");
    }

    function getPresetItems(category) {
        if (!category) return [];
        if (presetState.cache[category]) return presetState.cache[category];

        const folderPath = getPresetFolderPath(category);
        const readResult = window.cep && window.cep.fs ? window.cep.fs.readdir(folderPath) : null;
        if (!readResult || readResult.err !== 0 || !readResult.data) {
            presetState.cache[category] = [];
            presetState.missing[category] = true;
            return presetState.cache[category];
        }

        let items = [];
        for (let i = 0; i < readResult.data.length; i++) {
            const subName = readResult.data[i];
            if (subName.indexOf(".") === 0) continue;

            const fullPath = folderPath + subName;
            const subRead = window.cep && window.cep.fs ? window.cep.fs.readdir(fullPath + "/") : null;
            if (subRead && subRead.err === 0 && subRead.data) {
                let ffxFile = null;
                let mp4File = null;
                for (let j = 0; j < subRead.data.length; j++) {
                    const fileName = subRead.data[j];
                    if (/\.ffx$/i.test(fileName)) {
                        ffxFile = fileName;
                    } else if (/\.mp4$/i.test(fileName)) {
                        mp4File = fileName;
                    }
                }
                if (ffxFile) {
                    items.push({
                        category: category,
                        name: subName,
                        path: fullPath + "/" + ffxFile,
                        preview: mp4File ? (fullPath + "/" + mp4File) : null
                    });
                }
            } else if (/\.ffx$/i.test(subName)) {
                const baseName = subName.replace(/\.ffx$/i, "");
                const possibleMp4 = folderPath + baseName + ".mp4";
                const hasMp4 = window.cep && window.cep.fs && window.cep.fs.stat(possibleMp4).err === 0;
                items.push({
                    category: category,
                    name: baseName,
                    path: fullPath,
                    preview: hasMp4 ? possibleMp4 : null
                });
            }
        }

        items = attachPresetVariants(items);
        presetState.missing[category] = false;
        presetState.cache[category] = items;
        return presetState.cache[category];
    }

    function getPresetPreviewPanel() {
        return document.querySelector(".apple-preset-preview-panel");
    }

    function resetPresetPreview() {
        currentPreviewUrl = null;
        const video = document.getElementById("applePreviewVideo");
        const placeholder = document.getElementById("applePreviewPlaceholder");
        const panel = getPresetPreviewPanel();
        if (video) {
            video.pause();
            video.removeAttribute("src");
            video.load();
            video.style.display = "none";
            video.style.opacity = "0";
        }
        if (placeholder) placeholder.style.display = "flex";
        if (panel) panel.classList.remove("is-live");
    }

    function hoverPresetItem(item, variantKey) {
        const video = document.getElementById("applePreviewVideo");
        const placeholder = document.getElementById("applePreviewPlaceholder");
        const panel = getPresetPreviewPanel();
        if (!video) return;

        const previewSource = resolvePresetPreviewSource(item, variantKey || getPresetDefaultVariant(item) || "in");
        const previewUrl = previewSource ? overlayFileToUrl(previewSource) : (item.preview ? overlayFileToUrl(item.preview) : null);
        if (currentPreviewUrl === previewUrl) return;
        currentPreviewUrl = previewUrl;

        video.style.opacity = "0";
        video.pause();
        video.removeAttribute("src");
        video.load();

        if (previewUrl) {
            const statPath = previewSource || item.preview;
            const statResult = window.cep && window.cep.fs && statPath ? window.cep.fs.stat(statPath) : null;
            if (statResult && statResult.err === 0) {
                if (placeholder) placeholder.style.display = "none";
                if (panel) panel.classList.add("is-live");
                video.style.display = "block";
                video.src = previewUrl;
                video.load();
                video.play().catch(() => {});
                return;
            }
        }

        video.style.display = "none";
        if (placeholder) placeholder.style.display = "flex";
        if (panel) panel.classList.remove("is-live");
    }

    function createPresetGearButton(item, wrap) {
        const gear = document.createElement("button");
        gear.type = "button";
        gear.className = "apple-preset-row-gear";
        gear.setAttribute("aria-label", "Open preset settings for " + getPresetDisplayName(item.name));
        gear.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" stroke-width="1.6"/><path d="M19.4 13.5l1 1.7-1.8 3.1-1.9-.5a7.3 7.3 0 0 1-1.6.9l-.3 1.9H9.1l-.3-1.9a7.3 7.3 0 0 1-1.6-.9l-1.9.5-1.8-3.1 1-1.7a7.5 7.5 0 0 1 0-1.8l-1-1.7L4.1 6.9l1.9-.5c.4-.6.9-1.1 1.6-1.6l.3-1.9h5.8l.3 1.9c.6.3 1.1.7 1.6 1.1l1.9-.5 1.8 3.1-1 1.7c.1.6.1 1.2 0 1.8Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
        gear.onclick = (event) => {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            openPresetSettings(item, wrap);
        };
        return gear;
    }

    function syncPresetVariantToggleState(group, variantKey) {
        if (!group) return;
        group.querySelectorAll(".apple-preset-variant-btn").forEach((node) => {
            node.classList.toggle("active", node.dataset.variant === variantKey);
        });
    }

    function createPresetVariantInline(item, wrap, row) {
        const group = document.createElement("div");
        group.className = "apple-preset-variant-inline";
        ["in", "out"].forEach((variantKey) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "apple-preset-variant-btn apple-preset-variant-toggle";
            button.dataset.variant = variantKey;
            button.textContent = variantKey === "in" ? "In" : "Out";
            button.classList.toggle("active", getRowActiveVariant(wrap, item) === variantKey);
            button.onclick = (event) => {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                setRowActiveVariant(wrap, variantKey);
                syncPresetVariantToggleState(group, variantKey);
                setPresetRowPreviewState(row);
                hoverPresetItem(item, variantKey);
            };
            group.appendChild(button);
        });
        return group;
    }

    function createPresetRow(item, showCategoryChip) {
        const wrap = document.createElement("div");
        wrap.className = "apple-preset-row-wrap";
        wrap.dataset.presetKey = getPresetItemKey(item);
        if (item.variants) {
            setRowActiveVariant(wrap, getPresetDefaultVariant(item) || "in");
        }

        const row = document.createElement("div");
        row.className = "apple-preset-row";
        row.setAttribute("role", "button");
        row.tabIndex = 0;
        row.title = getPresetDisplayName(item.name);

        const previewRow = () => hoverPresetItem(item, getRowActiveVariant(wrap, item));
        const applyRow = () => applyPresetItem(item, getRowActiveVariant(wrap, item));

        row.onmouseenter = () => {
            setPresetRowPreviewState(row);
            previewRow();
        };
        row.onmouseleave = () => row.classList.remove("is-previewing");
        row.onclick = applyRow;
        row.onkeydown = (event) => {
            if (!event || (event.key !== "Enter" && event.key !== " ")) return;
            event.preventDefault();
            applyRow();
        };

        const main = document.createElement("span");
        main.className = "apple-preset-row-main";

        const label = document.createElement("span");
        label.className = "apple-preset-row-label";
        label.textContent = getPresetDisplayName(item.name);
        main.appendChild(label);

        if (showCategoryChip) {
            const chip = document.createElement("span");
            chip.className = "apple-preset-row-chip";
            chip.textContent = presetCategoryLabels[item.category] || item.category;
            main.appendChild(chip);
        }

        row.appendChild(main);
        const gear = createPresetGearButton(item, wrap);
        if (item.variants) {
            row.appendChild(createPresetVariantInline(item, wrap, row));
        } else {
            gear.classList.add("apple-preset-row-gear-end");
        }
        row.appendChild(gear);
        wrap.appendChild(row);

        return wrap;
    }

    function setPresetSettingsOpen(isOpen) {
        const overlay = document.getElementById("presetSettingsOverlay");
        if (!overlay) return;
        overlay.classList.toggle("active", !!isOpen);
        overlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }

    function buildPresetSettingsVariantPicker(item, selectedVariant) {
        const field = document.createElement("div");
        field.className = "apple-preset-settings-field";

        const label = document.createElement("div");
        label.className = "apple-preset-settings-label";
        label.textContent = "Default Variant";

        const grid = document.createElement("div");
        grid.className = "apple-preset-settings-variant-grid";

        ["in", "out"].forEach((variantKey) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "apple-preset-variant-btn";
            button.dataset.variant = variantKey;
            button.textContent = variantKey === "in" ? "In" : "Out";
            button.classList.toggle("active", selectedVariant === variantKey);
            button.onclick = () => {
                presetState.settingsVariant = variantKey;
                grid.querySelectorAll(".apple-preset-variant-btn").forEach((node) => {
                    node.classList.toggle("active", node.dataset.variant === variantKey);
                });
                hoverPresetItem(item, variantKey);
            };
            grid.appendChild(button);
        });

        field.appendChild(label);
        field.appendChild(grid);
        return field;
    }

    function openPresetSettings(item, wrap) {
        const title = document.getElementById("presetSettingsTitle");
        const body = document.getElementById("presetSettingsBody");
        if (!title || !body || !item) return;

        presetState.settingsItem = item;
        presetState.settingsVariant = wrap ? getRowActiveVariant(wrap, item) : (getPresetDefaultVariant(item) || "in");
        title.textContent = getPresetDisplayName(item.name);
        body.innerHTML = "";

        const copy = document.createElement("p");
        copy.className = "apple-preset-settings-copy";
        copy.textContent = item.variants
            ? "Choose the default In/Out variant, then apply this preset to the first selected layer in After Effects."
            : "Apply this animation preset to the first selected layer in After Effects.";
        body.appendChild(copy);

        if (item.variants) {
            body.appendChild(buildPresetSettingsVariantPicker(item, presetState.settingsVariant));
        }

        setPresetSettingsOpen(true);
        hoverPresetItem(item, presetState.settingsVariant);
    }

    function closePresetSettings() {
        presetState.settingsItem = null;
        setPresetSettingsOpen(false);
    }

    function applyPresetSettings() {
        const item = presetState.settingsItem;
        if (!item) {
            closePresetSettings();
            return;
        }
        if (item.variants) {
            setPresetDefaultVariant(item, presetState.settingsVariant);
            const presetKey = getPresetItemKey(item);
            document.querySelectorAll('.apple-preset-row-wrap[data-preset-key="' + presetKey + '"]').forEach((wrap) => {
                setRowActiveVariant(wrap, presetState.settingsVariant);
                syncPresetVariantToggleState(wrap.querySelector(".apple-preset-variant-inline"), presetState.settingsVariant);
            });
        }
        applyPresetItem(item, presetState.settingsVariant);
        closePresetSettings();
    }

    function initPresetSettingsPopover() {
        const overlay = document.getElementById("presetSettingsOverlay");
        const closeBtn = document.getElementById("btnPresetSettingsClose");
        const cancelBtn = document.getElementById("btnPresetSettingsCancel");
        const applyBtn = document.getElementById("btnPresetSettingsApply");
        if (!overlay || overlay.__presetSettingsBound) return;
        overlay.__presetSettingsBound = true;

        if (closeBtn) closeBtn.onclick = closePresetSettings;
        if (cancelBtn) cancelBtn.onclick = closePresetSettings;
        if (applyBtn) applyBtn.onclick = applyPresetSettings;
        overlay.onclick = (event) => {
            if (event && event.target === overlay) closePresetSettings();
        };
    }

    function renderPresetButtons(items, showCategoryChip) {
        const container = document.getElementById("presetList");
        if (!container) return;
        container.innerHTML = "";
        setPresetRowPreviewState(null);
        if (!items || items.length === 0) {
            renderPresetMessage(presetState.query ? "No matching preset found." : "No presets found.");
            return;
        }
        const flatItems = flattenPresetItems(items);

        const list = document.createElement("div");
        list.className = "apple-preset-flat-list";
        flatItems.forEach((item) => list.appendChild(createPresetRow(item, showCategoryChip)));
        container.appendChild(list);
    }

    function renderPresetCategory(category) {
        setActivePresetCategory(category);
        const items = getPresetItems(category);
        if (presetState.missing[category]) {
            renderPresetMessage("Folder missing.");
            return;
        }
        renderPresetButtons(items, false);
    }

    function ensureAllPresetCategoriesLoaded() {
        presetCategories.forEach((category) => getPresetItems(category));
    }

    function getPresetSearchResults(query) {
        const term = String(query || "").toLowerCase();
        const results = [];
        presetCategories.forEach((category) => {
            const items = getPresetItems(category);
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const displayName = getPresetDisplayName(item.name).toLowerCase();
                if (displayName.indexOf(term) !== -1) results.push(item);
            }
        });
        return results.sort((a, b) => {
            const first = getPresetDisplayName(a.name);
            const second = getPresetDisplayName(b.name);
            return first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" });
        });
    }

    function setPresetSearchOpen(isOpen) {
        const shell = document.getElementById("presetSearchShell");
        const toggle = document.getElementById("presetSearchToggle");
        if (shell) shell.classList.toggle("active", !!isOpen);
        if (toggle) {
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
            toggle.classList.toggle("active", !!isOpen || !!presetState.query);
        }
    }

    function applyPresetSearch(rawQuery) {
        const query = String(rawQuery || "").replace(/^\s+|\s+$/g, "");
        presetState.query = query;
        if (!query) {
            renderPresetCategory(presetState.lastCategory || "TEXT");
            setPresetSearchOpen(false);
            return;
        }
        ensureAllPresetCategoriesLoaded();
        renderPresetButtons(getPresetSearchResults(query), true);
        setPresetSearchOpen(true);
    }

    function initPresetSearch() {
        const toggle = document.getElementById("presetSearchToggle");
        const input = document.getElementById("presetSearchInput");
        if (toggle) {
            toggle.onclick = (event) => {
                if (event) event.stopPropagation();
                const searchShell = document.getElementById("presetSearchShell");
                const isOpen = searchShell && searchShell.classList.contains("active");
                if (isOpen) {
                    if (input) input.value = "";
                    applyPresetSearch("");
                    return;
                }
                setPresetSearchOpen(true);
                if (input) {
                    input.focus();
                    input.select();
                }
            };
        }
        if (input) {
            input.oninput = () => applyPresetSearch(input.value);
            input.onkeydown = (event) => {
                if (event.key !== "Escape") return;
                input.value = "";
                applyPresetSearch("");
            };
        }
    }

    function setApplePresetPanelOpen(isOpen) {
        const shell = document.getElementById("applePresetShell");
        const toggle = document.getElementById("applePresetToggle");
        if (!shell) return;
        shell.classList.toggle("collapsed", !isOpen);
        if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (!isOpen) setPresetSearchOpen(false);
    }

    function initPreviewLock() {
        const btn = document.getElementById("btnPreviewLock");
        if (!btn || btn.__previewLockBound) return;
        btn.__previewLockBound = true;
        btn.onclick = (event) => {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            presetState.previewLocked = !presetState.previewLocked;
            btn.classList.toggle("active", presetState.previewLocked);
            btn.setAttribute("aria-pressed", presetState.previewLocked ? "true" : "false");
            btn.setAttribute("aria-label", presetState.previewLocked ? "Unlock preview" : "Lock preview");
            btn.title = presetState.previewLocked ? "Unlock preview" : "Lock preview";
        };
    }

    function initApplePresetToggle() {
        const shell = document.getElementById("applePresetShell");
        const toggle = document.getElementById("applePresetToggle");
        if (!shell || !toggle || toggle.__applePresetToggleBound) return;
        toggle.__applePresetToggleBound = true;
        toggle.onclick = () => setApplePresetPanelOpen(shell.classList.contains("collapsed"));
        toggle.onkeydown = (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            setApplePresetPanelOpen(shell.classList.contains("collapsed"));
        };
        setApplePresetPanelOpen(false);
    }

    function loadCategory(category) {
        presetState.lastCategory = category;
        const input = document.getElementById("presetSearchInput");
        if (input) input.value = "";
        presetState.query = "";
        setPresetSearchOpen(false);
        renderPresetCategory(category);
    }

    function init() {
        const list = document.getElementById("presetList");
        if (!list) return;

        initPresetSearch();
        initPresetSettingsPopover();

        const presetBody = document.querySelector(".apple-preset-body");
        if (presetBody && !presetBody.__presetPreviewResetBound) {
            presetBody.__presetPreviewResetBound = true;
            presetBody.addEventListener("mouseout", (event) => {
                const next = event.relatedTarget;
                if (next && presetBody.contains(next)) return;
                setPresetRowPreviewState(null);
                if (!presetState.previewLocked) {
                    resetPresetPreview();
                }
            });
        }

        initPreviewLock();

        document.querySelectorAll(".apple-preset-tab-bar .apple-preset-tab-btn").forEach((btn) => {
            btn.onclick = () => {
                const cat = btn.getAttribute("data-preset-category");
                loadCategory(cat);
            };
        });

        const video = document.getElementById("applePreviewVideo");
        if (video) {
            video.addEventListener("loadeddata", () => {
                video.style.opacity = "1";
            });
        }

        resetPresetPreview();
        loadCategory("TEXT");
        initApplePresetToggle();
    }

    window.loadCategory = loadCategory;
    window.TextPanel = { init: init, loadCategory: loadCategory };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
