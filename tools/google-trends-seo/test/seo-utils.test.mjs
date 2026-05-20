import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCsv,
  buildProxyEnv,
  chunk,
  extractCookieHeader,
  groupBy,
  hasUseEnvProxyFlag,
  parseArgs,
  parseCsv,
  selectKeywordRows,
  shouldReexecForProxy,
  summarizeTrendRows,
} from "../src/seo-utils.mjs";

const csv = `group,market,country,language,keyword,intent,priority,notes
core,global,us,en,personal color analysis,diagnosis,1,head term
core,global,us,en,"what colors look good on me",problem,2,"question, high intent"
japan,jp,jp,ja,パーソナルカラー診断,diagnosis,1,
korea,kr,kr,ko,퍼스널 컬러,diagnosis,1,
`;

test("parseCsv handles quoted commas and unicode keyword rows", () => {
  const rows = parseCsv(csv);

  assert.equal(rows.length, 4);
  assert.equal(rows[1].keyword, "what colors look good on me");
  assert.equal(rows[1].notes, "question, high intent");
  assert.equal(rows[2].keyword, "パーソナルカラー診断");
});

test("buildCsv quotes fields that need escaping", () => {
  const output = buildCsv([
    { keyword: "what colors look good on me", notes: "question, high intent" },
  ]);

  assert.equal(output, 'keyword,notes\nwhat colors look good on me,"question, high intent"\n');
});

test("selectKeywordRows filters by country, market, group, and limit", () => {
  const rows = parseCsv(csv);
  const selected = selectKeywordRows(rows, {
    countries: ["us"],
    markets: ["global"],
    groups: ["core"],
    limit: 1,
  });

  assert.deepEqual(
    selected.map((row) => row.keyword),
    ["personal color analysis"],
  );
});

test("groupBy and chunk preserve row order", () => {
  const rows = parseCsv(csv);
  const grouped = groupBy(rows, (row) => row.country);

  assert.deepEqual(
    [...grouped.keys()],
    ["us", "jp", "kr"],
  );
  assert.deepEqual(chunk(rows, 2).map((part) => part.length), [2, 2]);
});

test("parseArgs supports flags, repeated list flags, and booleans", () => {
  const args = parseArgs([
    "--input",
    "data.csv",
    "--country",
    "us,jp",
    "--group",
    "core",
    "--group",
    "japan",
    "--dry-run",
  ]);

  assert.equal(args.input, "data.csv");
  assert.deepEqual(args.country, ["us", "jp"]);
  assert.deepEqual(args.group, ["core", "japan"]);
  assert.equal(args["dry-run"], true);
});

test("proxy helpers prepare env and detect reexec need", () => {
  const args = parseArgs(["--proxy", "http://127.0.0.1:26001"]);
  const env = buildProxyEnv(args.proxy, { PATH: "/bin" });

  assert.equal(env.HTTP_PROXY, "http://127.0.0.1:26001");
  assert.equal(env.HTTPS_PROXY, "http://127.0.0.1:26001");
  assert.equal(env.ALL_PROXY, "http://127.0.0.1:26001");
  assert.equal(hasUseEnvProxyFlag(["--use-env-proxy"]), true);
  assert.equal(shouldReexecForProxy(args, [], {}), true);
  assert.equal(shouldReexecForProxy(args, ["--use-env-proxy"], {}), true);
  assert.equal(shouldReexecForProxy(args, [], { SEO_PROXY_REEXEC: "1" }), false);
});

test("extractCookieHeader keeps only cookie name-value pairs", () => {
  const header = extractCookieHeader([
    "NID=abc; expires=Thu, 19-Nov-2026 12:36:53 GMT; path=/; HttpOnly",
    "SID=def; path=/; Secure",
  ]);

  assert.equal(header, "NID=abc; SID=def");
});

test("summarizeTrendRows calculates average, latest, max, and momentum", () => {
  const summary = summarizeTrendRows([
    { country: "us", language: "en", keyword: "personal color analysis", value: "10" },
    { country: "us", language: "en", keyword: "personal color analysis", value: "20" },
    { country: "us", language: "en", keyword: "personal color analysis", value: "30" },
    { country: "us", language: "en", keyword: "personal color analysis", value: "40" },
    { country: "us", language: "en", keyword: "personal color analysis", value: "50" },
    { country: "us", language: "en", keyword: "personal color analysis", value: "60" },
    { country: "us", language: "en", keyword: "personal color analysis", value: "70" },
    { country: "us", language: "en", keyword: "personal color analysis", value: "80" },
  ]);

  const row = summary.get("us\u0000en\u0000personal color analysis");
  assert.equal(row.average, 45);
  assert.equal(row.latest, 80);
  assert.equal(row.max, 80);
  assert.equal(row.momentum4, 40);
});
