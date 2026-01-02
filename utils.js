/** @internal */
/** @packageDocumentation */
import extract from "extract-zip";
import path from "node:path";

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

export const __internal = {
    extract: extract,
}