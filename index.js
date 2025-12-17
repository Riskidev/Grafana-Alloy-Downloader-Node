import path from 'node:path';
import process from 'node:process';
import * as fs from "node:fs";
import {pipeline} from "node:stream/promises";
import {createWriteStream} from "node:fs";
import {Transform} from "node:stream";
import extract from "extract-zip";
import {unlink} from "node:fs/promises";

const repositoryReleaseAssetUrl = "https://github.com/grafana/alloy/releases/download/v1.12.1"
let cacheDirectory = path.join(process.cwd(), '.cache');
let verbose = false;

/** @internal */
export const __internal = {
    extract: extract
}

/**
 * Sets the directory where the downloaded asset will be cached.
 * @param directory
 */
export function setCacheDirectory(directory) {
    cacheDirectory = directory;
}

/**
 * Returns the directory where the downloaded asset will be cached.
 * @internal
 * @returns {string}
 */
export function getCacheDirectory() {
    return cacheDirectory;
}

/**
 * Returns the name of the asset to download.
 * @internal
 * @returns {string}
 */
export function getAssetName() {
    const [platform, arch] = [process.platform, process.arch];
    if (platform === 'win32') {
        // Only 64 bit is supported, but 32-bit Node installs can return ia32 despite the host OS being able to execute.
        return "alloy-windows-amd64.exe.zip";
    }
    const rebindArch = arch === 'x64' ? 'amd64' : arch;
    return `alloy-${platform}-${rebindArch}.zip`;
}

/**
 * Returns the name of the executable file in the downloaded asset.
 * @internal
 * @returns {string}
 */
export function getAssetExecutableName() {
    return path.basename(getAssetName(), '.zip');
}

/**
 * Logs a line to stdout if verbose is enabled.
 * @internal
 * @param line
 */
function logLine(line) {
    if (verbose) {
        console.log(line);
    }
}

/**
 * Downloads an asset from the given URL and saves it to the cache directory.
 * @internal
 * @param url
 * @returns {Promise<void>}
 */
async function downloadAndSaveAsset(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch from ${url}: ${response.status}, ${response.statusText}`);
    }
    if (!response.body) {
        throw new Error(`Response body is empty for ${url}`);
    }

    if (!fs.existsSync(cacheDirectory)) {
        fs.mkdirSync(cacheDirectory);
    }
    if (fs.existsSync(path.join(cacheDirectory, getAssetName()))) {
        await unlink(path.join(cacheDirectory, getAssetName()));
    }

    const writer = createWriteStream(path.join(cacheDirectory, getAssetName()));

    const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
    let downloadedBytes = 0;
    const progressTracker = new Transform({
        transform(chunk, encoding, callback) {
            const oldPercent = Number(((downloadedBytes / totalBytes) * 100).toFixed(2));
            downloadedBytes += chunk.length;
            const newPercent = Number(((downloadedBytes / totalBytes) * 100).toFixed(2));

            if (totalBytes > 0 && Math.floor(oldPercent) !== Math.floor(newPercent)) {
                logLine(`\rDownloading: ${Math.floor(newPercent)}% (${downloadedBytes}b / ${totalBytes}b)`);
            }
            callback(null, chunk);
        }
    });

    await pipeline(response.body, progressTracker, writer);
}

/**
 * Extracts the downloaded asset to the cache directory.
 * @internal
 * @returns {Promise<void>}
 */
async function extractAsset() {
    try {
        const zipPath = path.join(cacheDirectory, getAssetName());
        logLine(`Extracting ${zipPath}`);
        await __internal.extract(
            zipPath,
            { dir: path.resolve(cacheDirectory) }
        );
        await unlink(zipPath);
    } catch (err) {
        throw new Error(`Extraction failed: ${err.message}`);
    }
}

/**
 * Checks if the current platform is supported.
 * @returns {*}
 */
export function isPlatformSupported() {
    const platform = process.platform;
    const arch = process.arch;

    /** @type {Partial<Record<NodeJS.Platform, NodeJS.Architecture[]>>} */
    const supportCombinations = {
        win32: ['x64', 'ia32'],
        linux: ['x64', 'arm64'],
        darwin: ['x64', 'arm64']
    }

    return (supportCombinations[platform] && supportCombinations[platform].includes(arch)) === true;
}

/**
 * Downloads the Grafana Alloy executable to the cache directory if it's not already present.
 * @returns {Promise<string>} Path to Grafana Alloy executable
 */
export async function getOrSaveToCache() {
    if (!isPlatformSupported()) {
        throw new Error(`Platform ${process.platform} ${process.arch} is not supported`);
    }

    const assetExecutableName = getAssetExecutableName();
    const assetName = getAssetName();
    logLine(`Checking cache for ${assetExecutableName}`);
    if (fs.existsSync(path.join(cacheDirectory, assetExecutableName))) {
        logLine(`Found ${assetExecutableName} in cache`);
    } else {
        logLine(`${assetExecutableName} was not found in cache`);
        await downloadAndSaveAsset(`${repositoryReleaseAssetUrl}/${assetName}`);
        await extractAsset();
    }

    if (!fs.existsSync(path.join(cacheDirectory, getAssetExecutableName()))) {
        throw new Error(`${assetName} was extracted but ${assetExecutableName} was not found.`);
    }

    return path.resolve(path.join(cacheDirectory, assetExecutableName));
}

export function setVerbose(isVerbose) {
    verbose = isVerbose;
}