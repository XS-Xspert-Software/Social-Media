/**
 * Shared config loader utility
 * Loads config.json once and caches it for reuse
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';
// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let cachedConfig = null;
/**
 * Load and cache the global config.json from project root
 */
export function loadConfig() {
    if (cachedConfig !== null) {
        return cachedConfig;
    }
    const configPath = path.resolve(__dirname, '../../config.json');
    try {
        if (fs.existsSync(configPath)) {
            cachedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        else {
            cachedConfig = {};
        }
    }
    catch (e) {
        log('error', 'Failed to load config.json:', e);
        cachedConfig = {};
    }
    return cachedConfig;
}
/**
 * Get trusted servers from config
 */
export function getTrustedServers() {
    const config = loadConfig();
    return Array.isArray(config.federationTrustedServers)
        ? config.federationTrustedServers
        : [];
}
