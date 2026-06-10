/**
 * Google Trends data source adapter.
 *
 * Uses the `google-trends-api` npm package (~1.2k stars, stable).
 * No auth required, free to use.
 *
 * Config:
 *   - keywords: string[]     — search terms to compare (max 5)
 *   - geo?: string           — country code, e.g. 'US', 'CN' (default worldwide)
 *   - timeframe?: string     — e.g. 'today 3-m', 'today 12-m', 'now 7-d' (default 'today 3-m')
 *   - category?: number      — Google Trends category ID
 *   - relatedQueries?: boolean — also fetch related queries (default true)
 *
 * Note: This adapter returns trend-type data (interest over time + related queries),
 * not the standard Post/Case format. Consumers should handle accordingly.
 */

import { cleanText } from "../http-client.mjs";

export const googleTrendsAdapter = {
  name: "google-trends",
  label: "Google Trends",
  type: "trend",
  requiresAuth: false,
  region: "global",

  async collect(config, http) {
    const keywords = [].concat(config.keywords ?? config.keyword ?? []);
    if (keywords.length === 0) {
      throw new Error("Google Trends adapter requires at least one keyword");
    }

    const geo = config.geo ?? "";
    const timeframe = config.timeframe ?? "today 3-m";
    const fetchRelated = config.relatedQueries !== false;

    let googleTrends;
    try {
      googleTrends = await import("google-trends-api");
    } catch {
      throw new Error(
        "google-trends-api package not installed. Run: npm install google-trends-api"
      );
    }

    const trendsApi = googleTrends.default ?? googleTrends;

    const results = [];

    // Interest over time
    try {
      const interestRaw = await trendsApi.interestOverTime({
        keyword: keywords,
        geo,
        startTime: parseTimeframe(timeframe).start,
        endTime: new Date(),
        category: config.category ?? 0,
      });

      const interestData = JSON.parse(interestRaw);
      const timelineData = interestData?.default?.timelineData ?? [];

      results.push({
        id: `gtrends:interest:${keywords.join("+")}`,
        source: "google-trends",
        type: "interest-over-time",
        keywords,
        geo: geo || "worldwide",
        timeframe,
        dataPoints: timelineData.map((point) => ({
          time: point.formattedTime ?? "",
          values: point.value ?? [],
          isPartial: point.isPartial ?? false,
        })),
        averages: keywords.map((keyword, index) => {
          const values = timelineData.map((p) => p.value?.[index] ?? 0);
          const average = values.length > 0
            ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
            : 0;
          return { keyword, average };
        }),
      });
    } catch (error) {
      results.push({
        id: `gtrends:interest:${keywords.join("+")}`,
        source: "google-trends",
        type: "interest-over-time",
        keywords,
        error: error.message,
      });
    }

    // Related queries
    if (fetchRelated) {
      try {
        const relatedRaw = await trendsApi.relatedQueries({
          keyword: keywords,
          geo,
          startTime: parseTimeframe(timeframe).start,
          endTime: new Date(),
          category: config.category ?? 0,
        });

        const relatedData = JSON.parse(relatedRaw);
        const queryBlocks = relatedData?.default?.rankedList ?? [];

        for (const block of queryBlocks) {
          const rankedKeywords = (block.rankedKeyword ?? []).map((entry) => ({
            query: cleanText(entry.query ?? "", 120),
            value: entry.value ?? 0,
            link: entry.link ?? null,
          }));

          if (rankedKeywords.length > 0) {
            results.push({
              id: `gtrends:related:${keywords.join("+")}:${results.length}`,
              source: "google-trends",
              type: "related-queries",
              keywords,
              geo: geo || "worldwide",
              queries: rankedKeywords.slice(0, 25),
            });
          }
        }
      } catch {
        // Related queries are optional, silently skip on failure
      }
    }

    return results;
  },
};

/**
 * Parse a Google Trends timeframe string to a start date.
 */
function parseTimeframe(timeframe) {
  const now = new Date();
  const match = timeframe.match(/(\d+)-([dmyh])/);

  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const start = new Date(now);

    switch (unit) {
      case "h": start.setHours(start.getHours() - amount); break;
      case "d": start.setDate(start.getDate() - amount); break;
      case "m": start.setMonth(start.getMonth() - amount); break;
      case "y": start.setFullYear(start.getFullYear() - amount); break;
    }

    return { start, end: now };
  }

  // Default: 3 months
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 3);
  return { start: defaultStart, end: now };
}
