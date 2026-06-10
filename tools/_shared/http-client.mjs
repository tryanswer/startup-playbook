/**
 * Enhanced HTTP client for data collection.
 *
 * Features:
 *   - Automatic retry with exponential backoff
 *   - Per-host rate limiting (token bucket)
 *   - Proxy support via HTTP_PROXY/HTTPS_PROXY (undici ProxyAgent)
 *   - Configurable delay between requests
 *   - Timeout support
 *   - Unified error handling
 *
 * Usage:
 *   import { createHttpClient } from '../_shared/http-client.mjs';
 *   const http = createHttpClient({ delayMs: 800, maxRetries: 3 });
 *   const data = await http.getJson('https://api.example.com/data');
 */

import { ProxyAgent, fetch as undiciFetch } from "undici";

const DEFAULT_USER_AGENT = "startup-playbook-collector/0.1";
const DEFAULT_DELAY_MS = 750;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 15_000;
const BACKOFF_BASE_MS = 1000;

/**
 * Simple per-host rate limiter.
 * Ensures minimum interval between requests to the same host.
 */
class RateLimiter {
  /** @type {Map<string, number>} */
  #lastRequestTime = new Map();
  #minIntervalMs;

  constructor(minIntervalMs = DEFAULT_DELAY_MS) {
    this.#minIntervalMs = minIntervalMs;
  }

  async waitForSlot(host) {
    const now = Date.now();
    const lastTime = this.#lastRequestTime.get(host) ?? 0;
    const elapsed = now - lastTime;

    if (elapsed < this.#minIntervalMs) {
      const waitTime = this.#minIntervalMs - elapsed;
      await sleep(waitTime);
    }

    this.#lastRequestTime.set(host, Date.now());
  }
}

/**
 * Create an enhanced HTTP client instance.
 *
 * @param {Object} options
 * @param {number} [options.delayMs=750] - Minimum delay between requests to same host
 * @param {number} [options.maxRetries=3] - Max retry attempts for failed requests
 * @param {number} [options.timeoutMs=15000] - Request timeout in milliseconds
 * @param {string} [options.userAgent] - Custom User-Agent header
 * @param {Function} [options.fetchImpl] - Custom fetch implementation (for testing)
 * @param {boolean|'auto'} [options.useProxy='auto'] - Proxy mode: true=force, false=disable, 'auto'=detect from env
 * @param {Function} [options.onRequest] - Callback before each request (url, options)
 * @param {Function} [options.onResponse] - Callback after each response (url, response, durationMs)
 * @param {Function} [options.onError] - Callback on error (url, error, attempt)
 */
export function createHttpClient(options = {}) {
  const {
    delayMs = DEFAULT_DELAY_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    userAgent = DEFAULT_USER_AGENT,
    fetchImpl,
    useProxy = "auto",
    onRequest,
    onResponse,
    onError,
  } = options;

  // Resolve proxy-aware fetch implementation
  const resolvedFetch = resolveFetchWithProxy(fetchImpl, useProxy);

  const rateLimiter = new RateLimiter(delayMs);

  /**
   * Make an HTTP request with retry, rate limiting, and timeout.
   *
   * @param {string} url
   * @param {RequestInit} [fetchOptions]
   * @returns {Promise<Response>}
   */
  async function request(url, fetchOptions = {}) {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;

    // Merge default headers
    const headers = {
      "user-agent": userAgent,
      accept: "application/json",
      ...fetchOptions.headers,
    };

    const finalOptions = { ...fetchOptions, headers };

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Rate limiting
        await rateLimiter.waitForSlot(host);

        onRequest?.(url, finalOptions);

        // Timeout via AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        finalOptions.signal = controller.signal;

        const startTime = Date.now();
        const response = await resolvedFetch(url, finalOptions);
        clearTimeout(timeoutId);

        const durationMs = Date.now() - startTime;
        onResponse?.(url, response, durationMs);

        // Retry on server errors (5xx) and rate limits (429)
        if (response.status === 429) {
          const retryAfter = parseRetryAfter(response);
          const waitTime = retryAfter ?? BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
          onError?.(url, new Error(`Rate limited (429). Waiting ${waitTime}ms`), attempt);
          await sleep(waitTime);
          continue;
        }

        if (response.status >= 500 && attempt < maxRetries) {
          const waitTime = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
          onError?.(url, new Error(`Server error ${response.status}. Retrying in ${waitTime}ms`), attempt);
          await sleep(waitTime);
          continue;
        }

        return response;
      } catch (error) {
        lastError = error;
        onError?.(url, error, attempt);

        if (error.name === "AbortError") {
          lastError = new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
        }

        if (attempt < maxRetries) {
          const waitTime = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
          await sleep(waitTime);
        }
      }
    }

    throw lastError ?? new Error(`Request failed after ${maxRetries} attempts: ${url}`);
  }

  /**
   * GET request, return parsed JSON.
   */
  async function getJson(url, fetchOptions = {}) {
    const response = await request(url, { ...fetchOptions, method: "GET" });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `HTTP ${response.status} ${response.statusText} for ${url}` +
        (body ? `\n${body.slice(0, 500)}` : "")
      );
    }

    return response.json();
  }

  /**
   * GET request, return raw text.
   */
  async function getText(url, fetchOptions = {}) {
    const response = await request(url, { ...fetchOptions, method: "GET" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }

    return response.text();
  }

  /**
   * POST request with JSON body, return parsed JSON.
   */
  async function postJson(url, body, fetchOptions = {}) {
    const response = await request(url, {
      ...fetchOptions,
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...fetchOptions.headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      throw new Error(
        `HTTP ${response.status} ${response.statusText} for POST ${url}` +
        (responseBody ? `\n${responseBody.slice(0, 500)}` : "")
      );
    }

    return response.json();
  }

  return {
    request,
    getJson,
    getText,
    postJson,
  };
}

/* ------------------------------------------------------------------ */
/*  Proxy Support                                                      */
/* ------------------------------------------------------------------ */

/**
 * Resolve a fetch implementation that respects proxy environment variables.
 *
 * - If `fetchImpl` is provided (e.g. for testing), use it directly.
 * - If `useProxy` is 'auto', detect HTTP_PROXY/HTTPS_PROXY from env.
 * - If `useProxy` is true, require proxy env vars to be set.
 * - If `useProxy` is false, use globalThis.fetch without proxy.
 *
 * Uses undici's ProxyAgent + fetch for proxy support, since Node.js
 * native fetch does not read HTTP_PROXY/HTTPS_PROXY automatically.
 */
function resolveFetchWithProxy(fetchImpl, useProxy) {
  // Custom fetch provided (e.g. for tests) — use it as-is
  if (fetchImpl) return fetchImpl;

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;

  const shouldUseProxy =
    useProxy === true ||
    (useProxy === "auto" && !!proxyUrl);

  if (!shouldUseProxy || !proxyUrl) {
    return globalThis.fetch;
  }

  // Create a ProxyAgent-backed fetch via undici
  const proxyAgent = new ProxyAgent(proxyUrl);

  return function proxyFetch(url, options = {}) {
    return undiciFetch(url, { ...options, dispatcher: proxyAgent });
  };
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(response) {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  if (!isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

/**
 * Clean and truncate text for standardized output.
 */
export function cleanText(value, maxLength = 360) {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Safely convert to number with fallback.
 */
export function toNumber(value, fallback = 0) {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Deduplicate items by id field.
 */
export function dedupeById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export { sleep };
