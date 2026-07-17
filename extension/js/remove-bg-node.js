const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const sharp = require("sharp");
const { removeBackground } = require("@imgly/background-removal-node");

function mimeFromPath(filePath) {
    const ext = path.extname(filePath || "").toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".webp") return "image/webp";
    if (ext === ".bmp") return "image/bmp";
    return "image/png";
}

async function readRgba(filePath) {
    const image = sharp(filePath).ensureAlpha();
    const meta = await image.metadata();
    const data = await image.raw().toBuffer();
    return { data, width: meta.width || 0, height: meta.height || 0, channels: 4 };
}

async function readRgbaBuffer(buffer) {
    const image = sharp(buffer).ensureAlpha();
    const meta = await image.metadata();
    const data = await image.raw().toBuffer();
    return { data, width: meta.width || 0, height: meta.height || 0, channels: 4 };
}

function alphaStats(rgba) {
    const pixels = Math.max(1, rgba.width * rgba.height);
    let transparent = 0;
    let soft = 0;
    for (let i = 3; i < rgba.data.length; i += 4) {
        const a = rgba.data[i];
        if (a < 12) transparent += 1;
        if (a < 245) soft += 1;
    }
    return { transparentRatio: transparent / pixels, softRatio: soft / pixels };
}

function chromaStats(rgba) {
    const { data, width, height } = rgba;
    const pixels = Math.max(1, width * height);
    let green = 0;
    let blue = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 20) continue;
        if (g > 115 && g > r * 1.28 && g > b * 1.18) green += 1;
        if (b > 115 && b > r * 1.25 && b > g * 1.12) blue += 1;
    }
    return { greenRatio: green / pixels, blueRatio: blue / pixels };
}

function colorDistanceSq(data, index, color) {
    const dr = data[index] - color[0];
    const dg = data[index + 1] - color[1];
    const db = data[index + 2] - color[2];
    return dr * dr + dg * dg + db * db;
}

function collectEdgeSeeds(rgba) {
    const { data, width, height } = rgba;
    const samples = [];
    const add = (x, y) => {
        const i = (y * width + x) * 4;
        if (data[i + 3] > 245) samples.push([data[i], data[i + 1], data[i + 2]]);
    };
    const stepX = Math.max(1, Math.floor(width / 20));
    const stepY = Math.max(1, Math.floor(height / 20));
    for (let x = 0; x < width; x += stepX) {
        add(x, 0);
        add(x, height - 1);
    }
    for (let y = 0; y < height; y += stepY) {
        add(0, y);
        add(width - 1, y);
    }
    add(0, 0);
    add(width - 1, 0);
    add(0, height - 1);
    add(width - 1, height - 1);
    return samples;
}

function nearestSeedDistanceSq(data, index, seeds) {
    let best = Infinity;
    for (let i = 0; i < seeds.length; i++) {
        const dist = colorDistanceSq(data, index, seeds[i]);
        if (dist < best) best = dist;
    }
    return best;
}

function edgeFloodRemove(rgba) {
    const { data, width, height } = rgba;
    const pixels = width * height;
    if (!width || !height || !pixels) return null;

    const seeds = collectEdgeSeeds(rgba);
    if (!seeds.length) return null;
    const visited = new Uint8Array(pixels);
    const queue = new Int32Array(pixels);
    const out = Buffer.from(data);
    const threshold = 42 * 42;
    const softThreshold = 70 * 70;
    let head = 0;
    let tail = 0;
    let removed = 0;

    function tryPush(x, y) {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const p = y * width + x;
        if (visited[p]) return;
        const i = p * 4;
        if (out[i + 3] < 20 || nearestSeedDistanceSq(out, i, seeds) <= threshold) {
            visited[p] = 1;
            queue[tail++] = p;
        }
    }

    for (let x = 0; x < width; x++) {
        tryPush(x, 0);
        tryPush(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
        tryPush(0, y);
        tryPush(width - 1, y);
    }

    while (head < tail) {
        const p = queue[head++];
        const x = p % width;
        const y = Math.floor(p / width);
        const i = p * 4;
        const dist = nearestSeedDistanceSq(out, i, seeds);
        if (dist <= threshold || out[i + 3] < 20) {
            out[i + 3] = 0;
            removed += 1;
            tryPush(x + 1, y);
            tryPush(x - 1, y);
            tryPush(x, y + 1);
            tryPush(x, y - 1);
        } else if (dist <= softThreshold) {
            out[i + 3] = Math.min(out[i + 3], Math.round(255 * ((dist - threshold) / (softThreshold - threshold))));
        }
    }

    if (removed / pixels < 0.015) return null;
    return { data: out, width, height, channels: 4 };
}

function chromaKeyRemove(rgba) {
    const stats = chromaStats(rgba);
    const mode = stats.greenRatio >= 0.10 ? "green" : (stats.blueRatio >= 0.10 ? "blue" : "");
    if (!mode) return null;

    const { data, width, height } = rgba;
    const out = Buffer.from(data);
    const pixels = Math.max(1, width * height);
    let removed = 0;

    for (let i = 0; i < out.length; i += 4) {
        const r = out[i];
        const g = out[i + 1];
        const b = out[i + 2];
        const a = out[i + 3];
        if (a < 20) continue;

        let strength = 0;
        if (mode === "green") {
            const dominance = g - Math.max(r, b);
            const saturation = g - Math.min(r, b);
            strength = Math.min(1, Math.max(0, (dominance - 18) / 78)) * Math.min(1, Math.max(0, (saturation - 24) / 92));
        } else {
            const dominance = b - Math.max(r, g);
            const saturation = b - Math.min(r, g);
            strength = Math.min(1, Math.max(0, (dominance - 18) / 78)) * Math.min(1, Math.max(0, (saturation - 24) / 92));
        }

        if (strength > 0.12) {
            out[i + 3] = Math.max(0, Math.round(a * (1 - strength)));
            if (out[i + 3] < 35) {
                out[i + 3] = 0;
                removed += 1;
            }
            if (mode === "green") out[i + 1] = Math.min(out[i + 1], Math.round((r + b) * 0.42));
            else out[i + 2] = Math.min(out[i + 2], Math.round((r + g) * 0.42));
        }
    }

    if (removed / pixels < 0.04) return null;
    return { data: out, width, height, channels: 4 };
}

async function encodePng(rgba) {
    return sharp(rgba.data, {
        raw: { width: rgba.width, height: rgba.height, channels: 4 }
    }).png({ compressionLevel: 9 }).toBuffer();
}

async function runMlRemoval(inputPath) {
    const distPath = path.resolve(__dirname, "..", "node_modules", "@imgly", "background-removal-node", "dist") + path.sep;
    const inputBuffer = fs.readFileSync(inputPath);
    const inputBlob = new Blob([inputBuffer], { type: mimeFromPath(inputPath) });
    const resultBlob = await removeBackground(inputBlob, {
        publicPath: pathToFileURL(distPath).href,
        model: "medium",
        output: { format: "image/png", quality: 1 }
    });
    return Buffer.from(await resultBlob.arrayBuffer());
}

async function createBestCutout(inputPath) {
    const original = await readRgba(inputPath);
    const originalStats = alphaStats(original);
    if (originalStats.transparentRatio > 0.02 || originalStats.softRatio > 0.06) {
        return encodePng(original);
    }

    const chromaCutout = chromaKeyRemove(original);
    if (chromaCutout) return encodePng(chromaCutout);

    let mlBuffer = null;
    try {
        mlBuffer = await runMlRemoval(inputPath);
        const ml = await readRgbaBuffer(mlBuffer);
        const mlStats = alphaStats(ml);
        const mlChroma = chromaStats(ml);
        if ((mlStats.transparentRatio > 0.03 || mlStats.softRatio > 0.08) && mlChroma.greenRatio < 0.08 && mlChroma.blueRatio < 0.08) {
            return mlBuffer;
        }
        const mlChromaCutout = chromaKeyRemove(ml);
        if (mlChromaCutout) return encodePng(mlChromaCutout);
    } catch (err) {
        // The edge fallback below handles icons and graphics if the neural model fails.
    }

    const edgeCutout = edgeFloodRemove(original);
    if (edgeCutout) return encodePng(edgeCutout);
    if (mlBuffer) return mlBuffer;
    return encodePng(original);
}

async function main() {
    const inputPath = process.argv[2];
    const outputPath = process.argv[3];
    if (!inputPath || !outputPath) throw new Error("Usage: node remove-bg-node.js <input> <output>");

    const resultBuffer = await createBestCutout(inputPath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, resultBuffer);
    process.stdout.write(outputPath);
}

main().catch(function(err) {
    process.stderr.write(err && err.stack ? err.stack : String(err || "Remove BG failed."));
    process.exit(1);
});
