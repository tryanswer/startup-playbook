#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import {
  analyzePain,
  buildDemandHeatmapSummaryPrompt,
  renderHeatmapHtml,
  renderPainReport,
} from "../src/pain-miner.mjs";
import { summarizeDemandWithOpenAI } from "../src/llm-summary.mjs";

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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeText(filePath, text) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error("Usage: node scripts/analyze-topic.mjs --input output/posts.json [--config data/beauty-log.reddit.json] [--output output/report.md] [--html-output output/heatmap.html] [--llm --llm-output output/summary.md]");
  }

  const input = await readJson(args.input);
  const config = args.config ? await readJson(args.config) : {};
  const output = args.output ?? args.report ?? args.input.replace(/\.json$/i, "-pain-report.md");
  const analysisOutput = args["analysis-output"] ?? args.input.replace(/\.json$/i, "-analysis.json");
  const htmlOutput = args["html-output"];
  const llmOutput = args["llm-output"] ?? (args.llm ? args.input.replace(/\.json$/i, "-llm-summary.md") : null);
  const llmPromptOutput = args["llm-prompt-output"];
  const analysis = analyzePain(input.posts ?? input, {
    project: config.project ?? input.project,
    themes: config.themes,
    thresholds: config.thresholds,
  });
  const llmPrompt = buildDemandHeatmapSummaryPrompt(analysis);
  let llmSummary = "";

  if (llmPromptOutput) {
    await writeText(llmPromptOutput, llmPrompt);
    console.log(`wrote LLM prompt to ${llmPromptOutput}`);
  }

  if (args.llm) {
    llmSummary = await summarizeDemandWithOpenAI(analysis, {
      model: args["llm-model"],
      baseUrl: args["llm-base-url"],
      prompt: llmPrompt,
    });
    await writeText(llmOutput, `${llmSummary}\n`);
    console.log(`wrote LLM summary to ${llmOutput}`);
  }

  await writeText(output, renderPainReport(analysis));
  await writeText(analysisOutput, `${JSON.stringify(analysis, null, 2)}\n`);
  if (htmlOutput) {
    await writeText(htmlOutput, renderHeatmapHtml(analysis, {
      title: args["html-title"] ?? `${analysis.project} Reddit Demand Heatmap`,
      llmSummary,
    }));
    console.log(`wrote HTML heatmap to ${htmlOutput}`);
  }
  console.log(`wrote report to ${output}`);
  console.log(`wrote analysis to ${analysisOutput}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
