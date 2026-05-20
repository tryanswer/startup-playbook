import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headerRow, ...dataRows] = rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
  if (!headerRow) {
    return [];
  }

  const headers = headerRow.map((header) => header.trim());
  return dataRows.map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? "").trim();
    });
    return record;
  });
}

export function buildCsv(rows, headers = inferHeaders(rows)) {
  const lines = [headers.map(escapeCsvField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvField(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function readCsvFile(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

export function writeCsvFile(filePath, rows, headers) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buildCsv(rows, headers), "utf8");
}

export function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const [rawName, inlineValue] = token.slice(2).split(/=(.*)/s, 2);
    const value = inlineValue ?? (argv[index + 1]?.startsWith("--") ? true : argv[index + 1] ?? true);
    if (inlineValue === undefined && value !== true) {
      index += 1;
    }

    const normalizedValue = normalizeArgValue(rawName, value);
    if (result[rawName] === undefined) {
      result[rawName] = normalizedValue;
    } else if (Array.isArray(result[rawName])) {
      result[rawName].push(...arrayify(normalizedValue));
    } else {
      result[rawName] = [result[rawName], ...arrayify(normalizedValue)];
    }
  }

  return result;
}

export function selectKeywordRows(rows, options = {}) {
  const countries = normalizeSet(options.countries ?? options.country);
  const markets = normalizeSet(options.markets ?? options.market);
  const groups = normalizeSet(options.groups ?? options.group);
  const languages = normalizeSet(options.languages ?? options.language);
  const intents = normalizeSet(options.intents ?? options.intent);
  const minPriority = Number(options["min-priority"] ?? options.minPriority ?? 0);
  const maxPriority = Number(options["max-priority"] ?? options.maxPriority ?? Number.POSITIVE_INFINITY);
  const limit = toPositiveInteger(options.limit);
  const seen = new Set();

  const selected = rows.filter((row) => {
    if (!row.keyword) return false;
    if (countries && !countries.has(row.country?.toLowerCase())) return false;
    if (markets && !markets.has(row.market?.toLowerCase())) return false;
    if (groups && !groups.has(row.group?.toLowerCase())) return false;
    if (languages && !languages.has(row.language?.toLowerCase())) return false;
    if (intents && !intents.has(row.intent?.toLowerCase())) return false;

    const priority = Number(row.priority || 999);
    if (priority < minPriority || priority > maxPriority) return false;

    const dedupeKey = `${row.country ?? ""}\u0000${row.language ?? ""}\u0000${row.keyword.toLowerCase()}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });

  return limit ? selected.slice(0, limit) : selected;
}

export function groupBy(items, keyFn) {
  const grouped = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const values = grouped.get(key) ?? [];
    values.push(item);
    grouped.set(key, values);
  }
  return grouped;
}

export function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function timestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function parseJsonishGooglePayload(text) {
  const cleaned = text.replace(/^\)\]\}',?\n?/, "");
  return JSON.parse(cleaned);
}

export function toNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : "";
}

export function buildProxyEnv(proxyUrl, baseEnv = process.env) {
  if (!proxyUrl) return { ...baseEnv };
  return {
    ...baseEnv,
    HTTP_PROXY: proxyUrl,
    HTTPS_PROXY: proxyUrl,
    ALL_PROXY: proxyUrl,
    http_proxy: proxyUrl,
    https_proxy: proxyUrl,
    all_proxy: proxyUrl,
  };
}

export function hasUseEnvProxyFlag(execArgv = process.execArgv) {
  return execArgv.includes("--use-env-proxy");
}

export function shouldReexecForProxy(args, execArgv = process.execArgv, env = process.env) {
  return Boolean(args.proxy) && env.SEO_PROXY_REEXEC !== "1";
}

export function reexecWithProxyIfNeeded(args, scriptPath, argv = process.argv.slice(2)) {
  if (!shouldReexecForProxy(args)) return false;

  const result = spawnSync(process.execPath, ["--use-env-proxy", scriptPath, ...argv], {
    env: {
      ...buildProxyEnv(args.proxy),
      SEO_PROXY_REEXEC: "1",
    },
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}

export function extractCookieHeader(setCookieHeaders) {
  return arrayify(setCookieHeaders)
    .flatMap(splitSetCookieHeader)
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

export function trendRowKey(row) {
  return `${row.country ?? ""}\u0000${row.language ?? ""}\u0000${String(row.keyword ?? "").toLowerCase()}`;
}

export function summarizeTrendRows(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const key = trendRowKey(row);
    const values = grouped.get(key) ?? [];
    const value = Number(row.value);
    if (Number.isFinite(value)) {
      values.push({ row, value });
    }
    grouped.set(key, values);
  }

  const summary = new Map();
  for (const [key, values] of grouped.entries()) {
    if (values.length === 0) continue;
    const firstRow = values[0].row;
    const numbers = values.map((item) => item.value);
    const latestWindow = numbers.slice(-4);
    const previousWindow = numbers.slice(-8, -4);
    const latestAverage = average(latestWindow);
    const previousAverage = average(previousWindow);
    summary.set(key, {
      group: firstRow.group,
      market: firstRow.market,
      country: firstRow.country,
      language: firstRow.language,
      keyword: firstRow.keyword,
      average: round1(average(numbers)),
      latest: numbers.at(-1) ?? "",
      max: Math.max(...numbers),
      min: Math.min(...numbers),
      momentum4: previousWindow.length > 0 ? round1(latestAverage - previousAverage) : "",
      samples: numbers.length,
    });
  }
  return summary;
}

export function scoreTrendSummary(row) {
  const priority = Number(row.priority || 3);
  const latest = Number(row.latest || 0);
  const max = Number(row.max || 0);
  const averageValue = Number(row.average || 0);
  const momentum = Number(row.momentum4 || 0);
  const score = latest * 0.35 + max * 0.2 + averageValue * 0.25 + momentum * 0.2 - (priority - 1) * 6;
  return round1(score);
}

function inferHeaders(rows) {
  const headers = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    }
  }
  return headers;
}

function escapeCsvField(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function normalizeArgValue(name, value) {
  if (value === true) return true;
  if (["country", "market", "group", "language", "intent"].includes(name)) {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}

function normalizeSet(value) {
  const values = arrayify(value)
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return values.length > 0 ? new Set(values) : null;
}

function arrayify(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function splitSetCookieHeader(header) {
  if (!header) return [];
  if (Array.isArray(header)) return header;
  return String(header).split(/,(?=\s*[^;,=\s]+=[^;,]+)/g);
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}
