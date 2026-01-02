# Grafana Alloy Downloader (Node)

A utility for downloading and caching a specific version of **Grafana Alloy** for use in local development and CI
environments.

Allows sending data to Grafana Cloud instances that are restricted to Mimir rather than Pushgateway.

## Features

- Version-locked Grafana Alloy to ensure predictable CI behavior.
- Allows the executable to be cached in CI environments
- Cross-platform as it automatically determines the appropriate executable to download

## Version Mapping

| Release        | Grafana Alloy |
|----------------|---------------|
| 1.0.0 - latest | 1.12.1        |

## Supported platforms
- Linux
    - x64
    - arm64
- macOS
    - x64
    - arm64
- Windows
    - x64
    - ia32 (Assumes 64-bit host)

## Installation

```shell
npm install @riskidev/grafana-alloy-downloader-node
```

## Basic Usage

```js
import GrafanaAlloyDownloader, {getOrSaveToCache} from "@riskidev/grafana-alloy-downloader-node";
import {ChildProcess} from "node:child_process";

const pathToGrafanaAlloyExecutable = await GrafanaAlloyDownloader.getOrSaveToCache();

// child_process.spawn(pathToGrafanaAlloyExecutable);
```

## API

### `getOrSaveToCache(): Promise<string>`

> This is the primary method to use. All other methods modify behaviour.

Downloads the relevant Grafana Alloy executable and saves it cache if not already there.

Returns the path to the cached executable.

### `setVerbose(boolean): void`

Enables console output for several steps, including download progress (per percent).

### `getCacheDirectory(): string`

> Defaults to `{{process.cwd}}/.cache`

Returns the path to the cache directory.

### `setCacheDirectory(string): void`

Sets the path to a custom cache directory.

###  `isPlatformSupported(): boolean`

Called internally but exposed to prevent an error being thrown if preferred.

Returns `true` if the current platform is supported.

See [Supported platforms](#supported-platforms) for more details.


