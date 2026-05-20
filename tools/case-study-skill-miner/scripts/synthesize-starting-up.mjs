#!/usr/bin/env node
import {
  parseArgs,
  synthesizeGuideSkillMarkdown,
  writeTextFile,
} from "../src/miner-utils.mjs";
import fs from "node:fs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const input = args.input ?? "output/starting-up-guide.json";
  const skillOut = args["skill-out"] ?? "../../skills/indie-hackers-starting-up/SKILL.md";
  const reportOut = args["report-out"] ?? "../../case-studies/indie-hackers/starting-up-guide.md";
  const guide = JSON.parse(fs.readFileSync(input, "utf8"));
  const markdown = synthesizeGuideSkillMarkdown(guide.sections, {
    sourceUrl: guide.sourceUrl,
    skillName: args["skill-name"] ?? "indie-hackers-starting-up",
  });

  writeTextFile(skillOut, markdown);
  writeTextFile(reportOut, markdown.replace(/^---[\s\S]*?---\n\n/, ""));

  console.log(`Synthesized ${guide.sections.length} guide sections.`);
  console.log(`Wrote ${skillOut}`);
  console.log(`Wrote ${reportOut}`);
}

function printHelp() {
  console.log(`Usage:
  npm run synthesize:starting-up -- [options]

Options:
  --input <path>       Rendered guide JSON. Default: output/starting-up-guide.json
  --skill-out <path>   Skill path. Default: ../../skills/indie-hackers-starting-up/SKILL.md
  --report-out <path>  Report path. Default: ../../case-studies/indie-hackers/starting-up-guide.md
  --skill-name <name>  Skill name. Default: indie-hackers-starting-up
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

