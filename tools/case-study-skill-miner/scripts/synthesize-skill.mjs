#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import {
  parseArgs,
  readJsonlFile,
  synthesizeSkillMarkdown,
} from "../src/miner-utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const input = args.input ?? "output/cases/cases.jsonl";
  const skillOut = args["skill-out"] ?? "../../skills/founder-case-patterns/SKILL.md";
  const reportOut = args["report-out"] ?? "../../case-studies/indie-hackers/patterns.md";
  const skillName = args["skill-name"] ?? "founder-case-patterns";
  const cases = readJsonlFile(input);
  const markdown = synthesizeSkillMarkdown(cases, { skillName });

  writeText(skillOut, markdown);
  writeText(reportOut, markdown.replace(/^---[\s\S]*?---\n\n/, ""));

  console.log(`Synthesized ${cases.length} cases.`);
  console.log(`Wrote ${skillOut}`);
  console.log(`Wrote ${reportOut}`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf8");
}

function printHelp() {
  console.log(`Usage:
  npm run synthesize -- --input output/cases/cases.jsonl [options]

Options:
  --input <path>        Case JSONL. Default: output/cases/cases.jsonl
  --skill-out <path>    Generated skill path. Default: ../../skills/founder-case-patterns/SKILL.md
  --report-out <path>   Generated report path. Default: ../../case-studies/indie-hackers/patterns.md
  --skill-name <name>   Skill name. Default: founder-case-patterns
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

