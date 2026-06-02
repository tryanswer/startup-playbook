#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderPlaybookIndex } from "../../../scripts/render-playbook-index.mjs";
import { analyzeOpportunityRadar } from "../src/radar.mjs";
import { fetchRadarSources } from "../src/sources.mjs";
import {
  updatePlaybookManifest,
  writeDiscoverArtifacts,
} from "../src/artifacts.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const name = token.slice(2);
    const value = argv[index + 1]?.startsWith("--") ? true : argv[index + 1] ?? true;
    if (value !== true) index += 1;
    args[name] = value;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error("Usage: node scripts/run-radar.mjs --input data/radar-input.json [--playbook-dir ../../playbook] [--render-index]");
  }

  const input = JSON.parse(await readFile(args.input, "utf8"));
  const playbookDir = path.resolve(args["playbook-dir"] ?? path.join(repoRoot, "playbook"));
  const fetched = input.sources?.length
    ? await fetchRadarSources(input.sources, {
        userAgent: args["user-agent"],
        delayMs: args.delay,
        githubToken: args["github-token"] ?? process.env.GITHUB_TOKEN,
        productHuntToken: args["product-hunt-token"] ?? process.env.PRODUCT_HUNT_TOKEN,
      })
    : { communities: [], cases: [] };
  input.communities = [...(input.communities ?? []), ...fetched.communities];
  input.cases = [...(input.cases ?? []), ...fetched.cases];
  const analysis = analyzeOpportunityRadar(input);
  const artifacts = await writeDiscoverArtifacts(analysis, {
    playbookDir,
    projectId: args["project-id"] ?? input.projectId ?? "project-id",
    sourceErrors: fetched.errors,
    sourceInputs: [
      {
        type: "file",
        path: args.input,
      },
    ],
  });

  await updatePlaybookManifest(playbookDir, artifacts.report);

  if (args["render-index"]) {
    await renderPlaybookIndex({ playbookDir });
  }

  console.log(`wrote discover report to ${path.join(playbookDir, "stages", "discover", "report.json")}`);
  console.log(`preserved run at ${artifacts.runPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
