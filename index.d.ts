/**
 * Sets the directory where the downloaded asset will be cached.
 * @param directory
 */
export function setCacheDirectory(directory: any): void;
/**
 * Returns the directory where the downloaded asset will be cached.
 * @internal
 * @returns {string}
 */
export function getCacheDirectory(): string;
/**
 * Checks if the current platform is supported.
 * @returns {*}
 */
export function isPlatformSupported(): any;
/**
 * Downloads the Grafana Alloy executable to the cache directory if it's not already present.
 * @returns {Promise<string>} Path to Grafana Alloy executable
 */
export function getOrSaveToCache(): Promise<string>;
/**
 * When true, enables console output.
 * @param isVerbose
 */
export function setVerbose(isVerbose: any): void;
declare namespace _default {
    export { getCacheDirectory };
    export { setCacheDirectory };
    export { isPlatformSupported };
    export { getOrSaveToCache };
    export { setVerbose };
}
export default _default;
