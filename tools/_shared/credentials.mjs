#!/usr/bin/env node

/**
 * Unified credential manager for startup-playbook tools.
 *
 * Reads API keys and tokens from:
 *   1. Environment variables (highest priority)
 *   2. ~/.startup-playbook/.env file (user-level defaults)
 *   3. <repo-root>/.env file (project-level defaults)
 *
 * Usage:
 *   import { loadCredentials, getCredential } from '../_shared/credentials.mjs';
 *   await loadCredentials();
 *   const token = getCredential('REDDIT_CLIENT_ID');
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

/** @type {Map<string, string>} */
const store = new Map();

/**
 * Known credential keys and their descriptions.
 * Tools should only request keys listed here.
 */
const KNOWN_KEYS = {
  // Reddit OAuth2
  REDDIT_CLIENT_ID: "Reddit app client ID (script type)",
  REDDIT_CLIENT_SECRET: "Reddit app client secret",
  REDDIT_USERNAME: "Reddit username for user-agent",

  // GitHub
  GITHUB_TOKEN: "GitHub personal access token",

  // Product Hunt
  PRODUCT_HUNT_TOKEN: "Product Hunt developer token",

  // Google
  GOOGLE_APPLICATION_CREDENTIALS: "Path to Google service-account JSON",
  GA4_PROPERTY_ID: "GA4 property ID (e.g. properties/123456789)",
  SEARCH_CONSOLE_SITE_URL: "Search Console verified site URL",

  // Search APIs
  SERPER_API_KEY: "Serper.dev API key for SERP data",
  SERPAPI_KEY: "SerpAPI key (alternative)",

  // Keywords
  KEYWORDS_EVERYWHERE_API_KEY: "Keywords Everywhere API key",

  // Twitter / X
  TWITTER_BEARER_TOKEN: "Twitter API v2 Bearer token",

  // V2EX
  V2EX_TOKEN: "V2EX personal access token (optional, higher rate limits)",

  // China market
  BAIDU_TONGJI_SITE_ID: "Baidu Tongji site ID",
  BAIDU_TONGJI_ACCESS_TOKEN: "Baidu Tongji access token",
  UMENG_APP_KEY: "Umeng+ app key",

  // Proxy
  HTTP_PROXY: "HTTP proxy URL",
  HTTPS_PROXY: "HTTPS proxy URL",
};

/**
 * Parse a .env file into key-value pairs.
 * Supports comments (#), empty lines, and quoted values.
 */
function parseDotEnv(content) {

  const entries = new Map();
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const equalsIndex = line.indexOf('=');
    if (equalsIndex < 1) continue;
    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    entries.set(key, value);
  }
  return entries;
}

/**
 * Try to read and parse a .env file. Returns empty map on failure.
 */
async function tryLoadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    return parseDotEnv(content);
  } catch {
    return new Map();
  }
}

/**
 * Load credentials from all sources.
 * Priority: process.env > ~/.startup-playbook/.env > <repo>/.env
 */
export async function loadCredentials() {
  store.clear();

  // Layer 1: project-level .env (lowest priority)
  const projectEnv = await tryLoadEnvFile(join(REPO_ROOT, ".env"));
  for (const [key, value] of projectEnv) store.set(key, value);

  // Layer 2: user-level .env
  const userEnv = await tryLoadEnvFile(
    join(homedir(), ".startup-playbook", ".env")
  );
  for (const [key, value] of userEnv) store.set(key, value);

  // Layer 3: process.env (highest priority)
  for (const key of Object.keys(KNOWN_KEYS)) {
    if (process.env[key]) store.set(key, process.env[key]);
  }

  return store;
}

/**
 * Get a credential value by key.
 * @param {string} key - One of KNOWN_KEYS
 * @param {object} options
 * @param {boolean} [options.required=false] - Throw if missing
 * @returns {string|undefined}
 */
export function getCredential(key, { required = false } = {}) {
  const value = store.get(key) ?? process.env[key];
  if (required && !value) {
    const description = KNOWN_KEYS[key] ?? key;
    throw new Error(
      `Missing required credential: ${key} (${description}).\n` +
      `Set it via environment variable or in ~/.startup-playbook/.env`
    );
  }
  return value;
}

/**
 * Check which credentials are available and which are missing.
 * Useful for diagnostics.
 */
export function auditCredentials() {
  const result = { available: [], missing: [] };
  for (const [key, description] of Object.entries(KNOWN_KEYS)) {
    const value = store.get(key) ?? process.env[key];
    if (value) {
      result.available.push({ key, description, masked: maskValue(value) });
    } else {
      result.missing.push({ key, description });
    }
  }
  return result;
}

function maskValue(value) {
  if (value.length <= 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

/** List of known credential keys with descriptions */
export { KNOWN_KEYS };
