/**
 * Google Autocomplete data source adapter.
 *
 * Uses Google's suggest API (free, no auth required).
 * Great for discovering what people are searching for around a topic.
 *
 * Config:
 *   - queries: string[]       — seed queries to get suggestions for
 *   - language?: string       — language code, e.g. 'en', 'zh-CN' (default 'en')
 *   - country?: string        — country code, e.g. 'us', 'cn' (default 'us')
 *   - expandSuffixes?: boolean — also try appending a-z to each query (default false)
 */

import { cleanText } from "../http-client.mjs";

const SUGGEST_BASE = "https://suggestqueries.google.com/complete/search";

export const googleAutocompleteAdapter = {
  name: "google-autocomplete",
  label: "Google Autocomplete",
  type: "trend",
  requiresAuth: false,
  region: "global",

  async collect(config, http) {
    const queries = [].concat(config.queries ?? config.query ?? []);
    if (queries.length === 0) {
      throw new Error("Google Autocomplete adapter requires at least one query");
    }

    const language = config.language ?? "en";
    const country = config.country ?? "us";
    const expandSuffixes = config.expandSuffixes === true;

    const allSuggestions = [];
    const seen = new Set();

    // Build full list of queries to fetch
    const queryList = [...queries];
    if (expandSuffixes) {
      for (const baseQuery of queries) {
        for (let charCode = 97; charCode <= 122; charCode++) {
          queryList.push(`${baseQuery} ${String.fromCharCode(charCode)}`);
        }
      }
    }

    for (const query of queryList) {
      const suggestions = await fetchSuggestions(http, query, language, country);

      for (const suggestion of suggestions) {
        const normalizedSuggestion = suggestion.toLowerCase().trim();
        if (seen.has(normalizedSuggestion)) continue;
        seen.add(normalizedSuggestion);

        allSuggestions.push({
          id: `gac:${hashString(normalizedSuggestion)}`,
          source: "google-autocomplete",
          type: "suggestion",
          query: cleanText(suggestion, 200),
          seedQuery: query,
          language,
          country,
        });
      }
    }

    return allSuggestions;
  },
};

async function fetchSuggestions(http, query, language, country) {
  const params = new URLSearchParams({
    q: query,
    client: "firefox",
    hl: language,
    gl: country,
  });

  const url = `${SUGGEST_BASE}?${params}`;

  try {
    const json = await http.getJson(url);
    // Response format: ["query", ["suggestion1", "suggestion2", ...]]
    if (Array.isArray(json) && Array.isArray(json[1])) {
      return json[1].filter((item) => typeof item === "string");
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Simple hash for generating unique IDs from suggestion strings.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
