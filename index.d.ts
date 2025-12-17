declare module '@riskidev/grafana-alloy-downloader-node';

export function getCacheDirectory(): string;
export function setCacheDirectory(directory: string): void;
export function isPlatformSupported(): boolean
export function getOrSaveToCache(): Promise<string>;
export function setVerbose(verbose: boolean): void;