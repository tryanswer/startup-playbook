#!/usr/bin/env node

/**
 * CLI entry point for the Unified Data Collection Layer.
 *
 * Commands:
 *   list                — List all available data sources
 *   collect <sources>   — Collect data from specified sources
 *   test <source>       — Quick test a single source with minimal config
 *   credentials         — Audit available API credentials for data sources
 *
 * Examples:
 *   node scripts/collect-data.mjs list
 *   node scripts/collect-data.mjs list --region china
 *   node scripts/collect-data.mjs collect --sources reddit,hacker-news --query "ai saas"
 *   node scripts/collect-data.mjs collect --config collect-config.json
 *   node scripts/collect-data.mjs test reddit --community SaaS --limit 5
 *   node scripts/collect-data.mjs test hacker-news --query "side project" --limit 5
 *   node scripts/collect-data.mjs test github --query "ai tool" --limit 5
 *   node scripts/collect-data.mjs test v2ex --node create --limit 5
 *   node scripts/collect-data.mjs credentials
 */

import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  listSources,
  getSource,
  collectFromSources,
} from "../tools/_shared/data-sources/index.mjs";

import {
  loadCredentials,
  auditCredentials,
  getCredential,
} from "../tools/_shared/credentials.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    sources: { type: "string", default: "" },
    query: { type: "string", short: "q", default: "" },
    config: { type: "string", short: "c", default: "" },
    output: { type: "string", short: "o", default: "" },
    limit: { type: "string", short: "l", default: "20" },
    region: { type: "string", default: "" },
    community: { type: "string", default: "" },
    node: { type: "string", default: "" },
    keyword: { type: "string", default: "" },
    json: { type: "boolean", default: false },
    verbose: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

const command = positionals[0] ?? "help";

async function main() {
  if (values.help || command === "help") {
    printHelp();
    return;
  }

  switch (command) {
    case "list":
      commandList();
      break;
    case "collect":
      await commandCollect();
      break;
    case "test":
      await commandTest();
      break;
    case "credentials":
      await commandCredentials();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/*  Commands                                                           */
/* ------------------------------------------------------------------ */

function commandList() {
  const sources = listSources();
  const regionFilter = values.region?.toLowerCase();

  const filtered = regionFilter
    ? sources.filter((s) => s.region === regionFilter || s.region === "both")
    : sources;

  if (values.json) {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }

  console.log("\n📡 Available Data Sources\n");
  console.log(
    padRight("Name", 22) +
    padRight("Label", 22) +
    padRight("Type", 12) +
    padRight("Region", 10) +
    "Auth"
  );
  console.log("─".repeat(76));

  for (const source of filtered) {
    console.log(
      padRight(source.name, 22) +
      padRight(source.label, 22) +
      padRight(source.type, 12) +
      padRight(source.region, 10) +
      (source.requiresAuth ? "🔑 required" : "✅ free")
    );
  }

  console.log(`\nTotal: ${filtered.length} sources`);
  if (regionFilter) console.log(`Filtered by region: ${regionFilter}`);
  console.log("");
}

async function commandCollect() {
  await loadCredentials();
  const credentials = buildCredentialsMap();

  let sourceConfigs;

  if (values.config) {
    // Load config from JSON file
    const configPath = resolve(REPO_ROOT, values.config);
    const configText = await readFile(configPath, "utf-8");
    const configData = JSON.parse(configText);
    sourceConfigs = configData.sources ?? configData;
  } else if (values.sources) {
    // Build configs from CLI flags
    const sourceNames = values.sources.split(",").map((s) => s.trim());
    const query = values.query;
    const limit = parseInt(values.limit, 10) || 20;

    sourceConfigs = sourceNames.map((name) => ({
      type: name,
      query,
      limit,
      community: values.community || undefined,
      communities: values.community ? [values.community] : undefined,
      node: values.node || undefined,
    }));
  } else {
    console.error("Error: --sources or --config is required for collect command");
    console.error("Example: node scripts/collect-data.mjs collect --sources reddit,hacker-news --query 'ai saas'");
    process.exit(1);
  }

  console.log(`\n🚀 Collecting data from ${sourceConfigs.length} source(s)...\n`);

  const result = await collectFromSources(sourceConfigs, {
    credentials,
    onProgress: (sourceName, status, count) => {
      if (status === "collecting") {
        process.stdout.write(`  ⏳ ${sourceName}...`);
      } else if (status === "done") {
        console.log(` ✅ ${count} items`);
      } else if (status === "error") {
        console.log(` ❌ failed`);
      }
    },
  });

  // Print summary
  console.log("\n📊 Collection Summary");
  console.log("─".repeat(50));

  for (const [sourceName, info] of Object.entries(result.coverage)) {
    const statusIcon = info.status === "ok" ? "✅" : "❌";
    console.log(`  ${statusIcon} ${padRight(info.label, 22)} ${info.count} items`);
    if (info.error) console.log(`     └─ ${info.error}`);
  }

  console.log(`\n  Total: ${result.items.length} items (deduped)`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.length}`);
  }
  console.log(`  Collected at: ${result.collectedAt}\n`);

  // Output results
  if (values.output) {
    const outputPath = resolve(REPO_ROOT, values.output);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Results saved to: ${values.output}\n`);
  } else if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (values.verbose) {
    console.log("\n📋 Collected Items:\n");
    for (const item of result.items.slice(0, 10)) {
      console.log(`  [${item.source}] ${item.title ?? item.query ?? item.id}`);
      if (item.url) console.log(`    └─ ${item.url}`);
    }
    if (result.items.length > 10) {
      console.log(`  ... and ${result.items.length - 10} more`);
    }
  }
}

async function commandTest() {
  const sourceName = positionals[1];
  if (!sourceName) {
    console.error("Error: source name required. Example: node scripts/collect-data.mjs test reddit --community SaaS");
    process.exit(1);
  }

  const adapter = getSource(sourceName);
  if (!adapter) {
    console.error(`Error: unknown source '${sourceName}'`);
    console.error(`Available: ${listSources().map((s) => s.name).join(", ")}`);
    process.exit(1);
  }

  await loadCredentials();
  const credentials = buildCredentialsMap();
  const limit = parseInt(values.limit, 10) || 5;

  const testConfig = {
    type: sourceName,
    query: values.query || values.keyword || "startup",
    limit,
    community: values.community || undefined,
    communities: values.community ? [values.community] : undefined,
    node: values.node || undefined,
    keywords: values.keyword ? [values.keyword] : undefined,
    queries: values.query ? [values.query] : undefined,
  };

  console.log(`\n🧪 Testing ${adapter.label} (${adapter.name})`);
  console.log(`   Type: ${adapter.type} | Region: ${adapter.region ?? "global"} | Auth: ${adapter.requiresAuth ? "required" : "free"}`);
  console.log(`   Config: ${JSON.stringify({ query: testConfig.query, limit, community: testConfig.community, node: testConfig.node })}`);
  console.log("");

  const result = await collectFromSources([testConfig], {
    credentials,
    onProgress: (name, status, count) => {
      if (status === "collecting") process.stdout.write(`  ⏳ Fetching from ${name}...`);
      else if (status === "done") console.log(` ✅ ${count} items`);
      else if (status === "error") console.log(` ❌ failed`);
    },
  });

  if (result.errors.length > 0) {
    console.log(`\n❌ Error: ${result.errors[0].error}`);
    if (values.verbose) {
      console.log(JSON.stringify(result.errors[0], null, 2));
    }
    process.exit(1);
  }

  console.log(`\n📋 Results (${result.items.length} items):\n`);

  for (const item of result.items.slice(0, 10)) {
    const label = item.title ?? item.query ?? item.id;
    const meta = [];
    if (item.score != null) meta.push(`score:${item.score}`);
    if (item.comments != null) meta.push(`comments:${item.comments}`);
    if (item.community) meta.push(item.community);

    console.log(`  • ${label}`);
    if (meta.length > 0) console.log(`    ${meta.join(" | ")}`);
    if (item.url) console.log(`    ${item.url}`);
    console.log("");
  }

  if (result.items.length > 10) {
    console.log(`  ... and ${result.items.length - 10} more\n`);
  }

  if (values.output) {
    const outputPath = resolve(REPO_ROOT, values.output);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Results saved to: ${values.output}\n`);
  }
}

async function commandCredentials() {
  await loadCredentials();
  const audit = auditCredentials();

  if (values.json) {
    console.log(JSON.stringify(audit, null, 2));
    return;
  }

  // Also show which sources need which credentials
  const sources = listSources();
  const authSources = sources.filter((s) => s.requiresAuth);

  console.log("\n🔑 Data Source Credentials\n");
  console.log(padRight("Source", 22) + padRight("Required Key", 28) + "Status");
  console.log("─".repeat(64));

  const credentialMap = {
    "product-hunt": "PRODUCT_HUNT_TOKEN",
    twitter: "TWITTER_BEARER_TOKEN",
    github: "GITHUB_TOKEN",
  };

  const availableKeys = new Set(audit.available.map((a) => a.key));

  for (const source of authSources) {
    const keyName = credentialMap[source.name] ?? "";
    const status = availableKeys.has(keyName) ? "✅ set" : "❌ missing";
    console.log(padRight(source.label, 22) + padRight(keyName, 28) + status);
  }

  console.log("\nOptional credentials (for higher rate limits):");
  const optionalKeys = ["GITHUB_TOKEN", "V2EX_TOKEN"];
  for (const key of optionalKeys) {
    const status = availableKeys.has(key) ? "✅ set" : "⚪ not set";
    console.log(`  ${padRight(key, 28)} ${status}`);
  }

  console.log(`\nTotal: ${audit.available.length} available, ${audit.missing.length} missing\n`);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildCredentialsMap() {
  const keys = [
    "GITHUB_TOKEN",
    "PRODUCT_HUNT_TOKEN",
    "TWITTER_BEARER_TOKEN",
    "V2EX_TOKEN",
    "SERPER_API_KEY",
    "SERPAPI_KEY",
    "REDDIT_CLIENT_ID",
    "REDDIT_CLIENT_SECRET",
    "REDDIT_USERNAME",
  ];
  const map = {};
  for (const key of keys) {
    const value = getCredential(key);
    if (value) map[key] = value;
  }
  return map;
}

function padRight(str, length) {
  return String(str ?? "").padEnd(length);
}

function printHelp() {
  console.log(`
📡 Startup Playbook — Data Collection CLI

Usage: node scripts/collect-data.mjs <command> [options]

Commands:
  list                    List all available data sources
  collect                 Collect data from multiple sources
  test <source>           Quick test a single source
  credentials             Audit API credentials status

Options:
  --sources <list>        Comma-separated source names (for collect)
  --query, -q <text>      Search query
  --config, -c <path>     JSON config file for collection
  --output, -o <path>     Save results to JSON file
  --limit, -l <number>    Max results per source (default: 20)
  --region <name>         Filter by region: global, china
  --community <name>      Subreddit name (for reddit)
  --node <name>           V2EX node name (for v2ex)
  --keyword <text>        Keyword (for trends/autocomplete)
  --json                  Output raw JSON
  --verbose, -v           Show detailed output
  --help, -h              Show this help message

Examples:
  node scripts/collect-data.mjs list
  node scripts/collect-data.mjs list --region china
  node scripts/collect-data.mjs test reddit --community SaaS -l 5
  node scripts/collect-data.mjs test hacker-news -q "ai startup" -l 5
  node scripts/collect-data.mjs test github -q "ai tool" -l 5
  node scripts/collect-data.mjs test v2ex --node create -l 5
  node scripts/collect-data.mjs collect --sources reddit,hacker-news -q "saas" -o data/output.json
  node scripts/collect-data.mjs collect --config collect-config.json -o data/output.json
  node scripts/collect-data.mjs credentials
  `);
}

main().catch((error) => {
  console.error(`\n💥 Fatal error: ${error.message}`);
  if (values.verbose) console.error(error.stack);
  process.exit(1);
});
