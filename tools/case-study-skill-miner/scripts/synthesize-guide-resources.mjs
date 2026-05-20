#!/usr/bin/env node
import fs from "node:fs";

import {
  parseArgs,
  readJsonlFile,
  synthesizeGuideResourceMarkdown,
  writeTextFile,
} from "../src/miner-utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const guideInput = args["guide-input"] ?? "output/starting-up-guide.json";
  const resourcesInput = args["resources-input"] ?? "output/guide-resources/guide-resources.jsonl";
  const skillOut = args["skill-out"] ?? "../../skills/indie-hackers-starting-up/SKILL.md";
  const reportOut = args["report-out"] ?? "../../case-studies/indie-hackers/starting-up-guide.md";
  const guide = JSON.parse(fs.readFileSync(guideInput, "utf8"));
  const resources = readJsonlFile(resourcesInput);
  const markdown = synthesizeGuideResourceMarkdown(guide, resources, {
    skillName: args["skill-name"] ?? "indie-hackers-starting-up",
  });

  writeTextFile(skillOut, markdown);
  writeTextFile(reportOut, markdown.replace(/^---[\s\S]*?---\n\n/, ""));

  console.log(`Synthesized ${resources.length} guide resources.`);
  console.log(`Wrote ${skillOut}`);
  console.log(`Wrote ${reportOut}`);
}

function printHelp() {
  console.log(`Usage:
  npm run synthesize:starting-up-resources -- [options]

Options:
  --guide-input <path>      Rendered guide JSON. Default: output/starting-up-guide.json
  --resources-input <path>  Guide resource JSONL. Default: output/guide-resources/guide-resources.jsonl
  --skill-out <path>        Skill path. Default: ../../skills/indie-hackers-starting-up/SKILL.md
  --report-out <path>       Report path. Default: ../../case-studies/indie-hackers/starting-up-guide.md
  --skill-name <name>       Skill name. Default: indie-hackers-starting-up
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
