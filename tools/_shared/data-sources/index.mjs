/**
 * Unified Data Source Registry
 *
 * Central entry point for all data collection adapters.
 * Each adapter implements the same interface:
 *
 *   { name, label, type, requiresAuth, collect(config, httpClient) }
 *
 * Usage:
 *   import { getSource, collectFromSources } from '../_shared/data-sources/index.mjs';
 *   const reddit = getSource('reddit');
 *   const posts = await reddit.collect(config, httpClient);
 */

import { createHttpClient, dedupeById } from "../http-client.mjs";

/* ------------------------------------------------------------------ */
/*  Adapter imports                                                    */
/* ------------------------------------------------------------------ */

import { redditAdapter } from "./reddit.mjs";
import { hackerNewsAdapter } from "./hacker-news.mjs";
import { githubAdapter } from "./github.mjs";
import { productHuntAdapter } from "./product-hunt.mjs";
import { googleTrendsAdapter } from "./google-trends.mjs";
import { appStoreAdapter } from "./app-store.mjs";
import { twitterAdapter } from "./twitter.mjs";
import { v2exAdapter } from "./v2ex.mjs";
import { zhihuAdapter } from "./zhihu.mjs";
import { xiaohongshuAdapter } from "./xiaohongshu.mjs";
import { googleAutocompleteAdapter } from "./google-autocomplete.mjs";

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

/** @type {Map<string, DataSourceAdapter>} */
const REGISTRY = new Map();

const ALL_ADAPTERS = [
  redditAdapter,
  hackerNewsAdapter,
  githubAdapter,
  productHuntAdapter,
  googleTrendsAdapter,
  appStoreAdapter,
  twitterAdapter,
  v2exAdapter,
  zhihuAdapter,
  xiaohongshuAdapter,
  googleAutocompleteAdapter,
];

for (const adapter of ALL_ADAPTERS) {
  REGISTRY.set(adapter.name, adapter);
}

/**
 * Get a data source adapter by name.
 * @param {string} name - e.g. 'reddit', 'hacker-news', 'github'
 * @returns {DataSourceAdapter|undefined}
 */
export function getSource(name) {
  return REGISTRY.get(name);
}

/**
 * List all registered data sources with their metadata.
 */
export function listSources() {
  return ALL_ADAPTERS.map((adapter) => ({
    name: adapter.name,
    label: adapter.label,
    type: adapter.type,
    requiresAuth: adapter.requiresAuth,
    region: adapter.region ?? "global",
  }));
}

/**
 * Collect data from multiple sources in sequence.
 *
 * @param {Array<SourceConfig>} sources - Array of source configs
 * @param {Object} [options]
 * @param {boolean} [options.failFast=false] - Stop on first error
 * @param {number} [options.delayMs=750] - Delay between requests
 * @param {Function} [options.onProgress] - Progress callback (sourceName, status, count)
 * @param {Object} [options.credentials] - Credential map { KEY: value }
 * @returns {CollectionResult}
 *
 * @typedef {Object} SourceConfig
 * @property {string} type - Adapter name (e.g. 'reddit', 'github')
 * @property {Object} [config] - Adapter-specific config (spread into adapter.collect)
 *
 * @typedef {Object} CollectionResult
 * @property {Array} items - All collected items (deduped)
 * @property {Array} errors - Errors from failed sources
 * @property {Object} coverage - Source coverage stats
 */
export async function collectFromSources(sources, options = {}) {
  const {
    failFast = false,
    delayMs = 750,
    onProgress,
    credentials = {},
  } = options;

  const httpClient = createHttpClient({ delayMs, maxRetries: 3 });

  const allItems = [];
  const errors = [];
  const coverage = {};

  for (const sourceConfig of sources) {
    const adapterName = sourceConfig.type;
    const adapter = REGISTRY.get(adapterName);

    if (!adapter) {
      const error = { source: adapterName, error: `Unknown source: ${adapterName}` };
      errors.push(error);
      if (failFast) throw new Error(error.error);
      continue;
    }

    onProgress?.(adapterName, "collecting", 0);

    try {
      const items = await adapter.collect(sourceConfig, httpClient, credentials);
      allItems.push(...items);

      coverage[adapterName] = {
        label: adapter.label,
        count: items.length,
        status: "ok",
      };

      onProgress?.(adapterName, "done", items.length);
    } catch (error) {
      const errorInfo = {
        source: adapterName,
        error: error.message,
        config: { ...sourceConfig, token: undefined, secret: undefined },
      };
      errors.push(errorInfo);

      coverage[adapterName] = {
        label: adapter.label,
        count: 0,
        status: "error",
        error: error.message,
      };

      onProgress?.(adapterName, "error", 0);

      if (failFast) throw error;
    }
  }

  return {
    items: dedupeById(allItems),
    errors,
    coverage,
    collectedAt: new Date().toISOString(),
  };
}

/**
 * @typedef {Object} DataSourceAdapter
 * @property {string} name - Unique identifier (e.g. 'reddit')
 * @property {string} label - Human-readable name (e.g. 'Reddit')
 * @property {string} type - 'community' | 'case' | 'trend' | 'review'
 * @property {boolean} requiresAuth - Whether API key is needed
 * @property {string} [region] - 'global' | 'china' | 'both'
 * @property {Function} collect - (config, httpClient, credentials) => Promise<Item[]>
 */

export { REGISTRY };
