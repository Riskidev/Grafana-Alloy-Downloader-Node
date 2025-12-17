import {suite, test, beforeEach, afterEach, before} from 'node:test';
import assert from 'node:assert/strict';
import {
    __internal,
    getAssetExecutableName,
    getCacheDirectory,
    getOrSaveToCache,
    isPlatformSupported,
    setCacheDirectory,
    setVerbose
} from "./index.js";
import * as fs from "node:fs";
import path from "node:path";

await suite('grafana-alloy-downloader-node', {concurrency: false}, async () => {

    let originalCacheDirectory;
    before(() => {
        setVerbose(false);
        originalCacheDirectory = getCacheDirectory();
    });

    afterEach(() => {
        fs.rmSync(originalCacheDirectory, { recursive: true, force: true });
        setCacheDirectory(originalCacheDirectory);
        setVerbose(false);
    });

    await suite('Verbose', {concurrency: false}, () => {

        /** @type {import('node:test').Mock} */
        let consoleLogMock;
        beforeEach(t => {
            consoleLogMock = t.mock.method(console, 'log', () => {});
        });

        test('WHEN not verbose THEN does not log', async () => {
            setVerbose(false);
            await getOrSaveToCache();
            assert.strictEqual(consoleLogMock.mock.callCount(), 0);
        });

        test('WHEN verbose THEN logs', async () => {
            setVerbose(true);
            await getOrSaveToCache();
            assert.strictEqual(consoleLogMock.mock.callCount(), 103);
        });

    });

    await suite('Cache', {concurrency: false}, () => {

        const tempDirectory = path.join(process.cwd(), 'TEMP');

        afterEach(() => {
            fs.rmSync(tempDirectory, { recursive: true, force: true });
        });

        test('WHEN set cache directory THEN uses that directory', async () => {
            setCacheDirectory(tempDirectory);
            assert.strictEqual(getCacheDirectory(), tempDirectory);
            await getOrSaveToCache();
            assert.strictEqual(fs.existsSync(path.join(getCacheDirectory(), getAssetExecutableName())), true);
        });

        test('WHEN not set cache directory THEN default cache directory', async () => {
            assert.notStrictEqual(getCacheDirectory(), tempDirectory);
            assert.strictEqual(getCacheDirectory(), originalCacheDirectory);
        });

        test('WHEN not in cache THEN downloads and extracts', async () => {
            assert.strictEqual(fs.existsSync(path.join(getCacheDirectory(), getAssetExecutableName())), false);
            await getOrSaveToCache();
            assert.strictEqual(fs.existsSync(path.join(getCacheDirectory(), getAssetExecutableName())), true);
        });

        test('WHEN in cache THEN does not download or extract', async (t) => {
            assert.strictEqual(fs.existsSync(path.join(getCacheDirectory(), getAssetExecutableName())), false);
            const executable = await getOrSaveToCache();
            assert.strictEqual(fs.existsSync(path.join(getCacheDirectory(), getAssetExecutableName())), true);

            // Run again and verify it does not download or extract
            t.mock.method(globalThis, 'fetch', () => {
                return Promise.reject(new TypeError('Fetch failed'));
            });
            await getOrSaveToCache();
            assert.strictEqual(fs.existsSync(executable), true);
        });

        test('WHEN download fails THEN throws error', async (t) => {
            t.mock.method(globalThis, 'fetch', () => {
                return Promise.reject(new TypeError('Fetch failed'));
            });
            await assert.rejects(getOrSaveToCache(), {message: 'Fetch failed'});
        });

        test('WHEN extract fails THEN throws error', async (t) => {
            t.mock.method(__internal, 'extract', () => {
                return Promise.reject(new TypeError('Extract failed'));
            });
            await assert.rejects(getOrSaveToCache(), {message: 'Extraction failed: Extract failed'});
        });

    });

    await suite('Platform', {concurrency: false}, () => {

        let originalPlatform;
        let originalArch;
        beforeEach(() => {
            originalPlatform = process.platform;
            originalArch = process.arch;
        });

        afterEach(() => {
            Object.defineProperty(process, 'platform', {
                value: originalPlatform,
            });
            Object.defineProperty(process, 'arch', {
                value: originalArch,
            });
        });

        test('WHEN supported platform THEN isPlatformSupported returns true', async () => {
            Object.defineProperty(process, 'platform', {
                value: 'win32',
                configurable: true
            });
            Object.defineProperty(process, 'arch', {
                value: 'x64',
                configurable: true
            });
            await assert.strictEqual(isPlatformSupported(), true);
        });

        test('WHEN unsupported platform THEN isPlatformSupported returns false', async () => {
            Object.defineProperty(process, 'platform', {
                value: 'unsupported-platform',
                configurable: true
            });
            Object.defineProperty(process, 'arch', {
                value: 'unsupported-arch',
                configurable: true
            });
            await assert.strictEqual(isPlatformSupported(), false);
        });

        test('WHEN unsupported platform THEN getOrSaveToCache throws error', async () => {
            Object.defineProperty(process, 'platform', {
                value: 'unsupported-platform',
                configurable: true
            });
            Object.defineProperty(process, 'arch', {
                value: 'unsupported-arch',
                configurable: true
            });
            await assert.rejects(getOrSaveToCache(), {name: 'Error', message: 'Platform unsupported-platform unsupported-arch is not supported'});
        });
    });

});