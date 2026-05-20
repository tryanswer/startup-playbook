#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const skillName = "startup-playbook-advisor";
const canonicalSkillDir = path.join(repoRoot, "skills", skillName);
const pluginDir = path.join(repoRoot, "plugins", skillName);
const agentFile = path.join(repoRoot, "agents", `${skillName}.md`);

const defaultOpenClawRoot = "/Users/neal/Documents/Projects/fatclaw/openclaw-monorepo";

function usage() {
  return `
Usage:
  node scripts/install-startup-advisor.mjs --target <claude|codex-skill|codex-plugin|openclaw|all> [options]

Options:
  --dry-run                 Print actions without writing files.
  --openclaw-root <path>    OpenClaw monorepo root. Defaults to ${defaultOpenClawRoot}
  --run-openclaw-sync       Run pnpm run skills:sync in packages/openclaw-app after OpenClaw install.
  --help                    Show this help.

Environment overrides:
  CLAUDE_SKILLS_DIR         Defaults to ~/.claude/skills
  CODEX_HOME                Defaults to ~/.codex
  CODEX_PLUGIN_HOME         Defaults to ~
  AGENTS_HOME               Defaults to ~/.agents
`.trim();
}

function parseArgs(argv) {
  const args = {
    target: null,
    dryRun: false,
    openclawRoot: defaultOpenClawRoot,
    runOpenClawSync: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--target") {
      args.target = argv[++i];
    } else if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--openclaw-root") {
      args.openclawRoot = path.resolve(argv[++i]);
    } else if (value === "--run-openclaw-sync") {
      args.runOpenClawSync = true;
    } else if (value === "--help" || value === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  return args;
}

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function requirePath(filePath, label) {
  if (!(await exists(filePath))) {
    throw new Error(`${label} does not exist: ${filePath}`);
  }
}

async function copyDir(src, dest, dryRun) {
  await requirePath(src, "source");
  if (dryRun) {
    console.log(`[dry-run] copy ${src} -> ${dest}`);
    return;
  }
  await mkdir(path.dirname(dest), { recursive: true });
  await rm(dest, { recursive: true, force: true });
  await cp(src, dest, {
    recursive: true,
    force: true,
    filter: (source) => {
      const base = path.basename(source);
      return ![".DS_Store", "node_modules", ".git"].includes(base);
    },
  });
  console.log(`copied ${dest}`);
}

async function copyFileTo(src, dest, dryRun) {
  await requirePath(src, "source");
  if (dryRun) {
    console.log(`[dry-run] copy ${src} -> ${dest}`);
    return;
  }
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(src, dest, { force: true });
  console.log(`copied ${dest}`);
}

async function readJson(filePath, fallback) {
  if (!(await exists(filePath))) {
    return fallback;
  }
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, data, dryRun) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  if (dryRun) {
    console.log(`[dry-run] write ${filePath}`);
    return;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, json, "utf8");
  console.log(`wrote ${filePath}`);
}

async function ensureLine(filePath, line, dryRun) {
  const current = (await exists(filePath)) ? await readFile(filePath, "utf8") : "";
  const lines = current.split(/\r?\n/).filter(Boolean);
  if (lines.includes(line)) {
    console.log(`already listed ${line} in ${filePath}`);
    return;
  }
  const next = `${lines.concat(line).join("\n")}\n`;
  if (dryRun) {
    console.log(`[dry-run] append ${line} to ${filePath}`);
    return;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, next, "utf8");
  console.log(`updated ${filePath}`);
}

function expandHome(filePath) {
  if (filePath === "~") {
    return os.homedir();
  }
  if (filePath.startsWith("~/")) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

async function installClaude(args) {
  const skillsDir = expandHome(process.env.CLAUDE_SKILLS_DIR || "~/.claude/skills");
  await copyDir(canonicalSkillDir, path.join(skillsDir, skillName), args.dryRun);
  await copyFileTo(agentFile, path.join(skillsDir, skillName, "AGENT.md"), args.dryRun);
}

async function installCodexSkill(args) {
  const codexHome = expandHome(process.env.CODEX_HOME || "~/.codex");
  await copyDir(canonicalSkillDir, path.join(codexHome, "skills", skillName), args.dryRun);
  await copyFileTo(agentFile, path.join(codexHome, "skills", skillName, "AGENT.md"), args.dryRun);
}

async function installCodexPlugin(args) {
  const pluginHome = expandHome(process.env.CODEX_PLUGIN_HOME || "~");
  const agentsHome = expandHome(process.env.AGENTS_HOME || "~/.agents");
  const installedPluginDir = path.join(pluginHome, "plugins", skillName);
  await copyDir(pluginDir, installedPluginDir, args.dryRun);

  const marketplacePath = path.join(agentsHome, "plugins", "marketplace.json");
  const marketplace = await readJson(marketplacePath, {
    name: "personal",
    interface: { displayName: "Personal" },
    plugins: [],
  });
  marketplace.plugins = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];
  const entry = {
    name: skillName,
    source: {
      source: "local",
      path: `./plugins/${skillName}`,
    },
    policy: {
      installation: "AVAILABLE",
      authentication: "ON_INSTALL",
    },
    category: "Productivity",
  };
  marketplace.plugins = marketplace.plugins.filter((plugin) => plugin?.name !== skillName);
  marketplace.plugins.push(entry);
  await writeJson(marketplacePath, marketplace, args.dryRun);
}

async function installOpenClaw(args) {
  const root = args.openclawRoot;
  const appRoot = path.join(root, "packages", "openclaw-app");
  const appSkillDir = path.join(appRoot, "local-skills", "skills", skillName);
  const communitySkillDir = path.join(root, "packages", "skills", "skills", skillName);
  const curatedFile = path.join(appRoot, "config", "bundled_local_skills.txt");

  await requirePath(appRoot, "OpenClaw app root");
  await requirePath(path.join(root, "packages", "skills", "skills"), "OpenClaw community skills root");

  await copyDir(canonicalSkillDir, appSkillDir, args.dryRun);
  await copyFileTo(agentFile, path.join(appSkillDir, "AGENT.md"), args.dryRun);
  await copyDir(canonicalSkillDir, communitySkillDir, args.dryRun);
  await copyFileTo(agentFile, path.join(communitySkillDir, "AGENT.md"), args.dryRun);
  await ensureLine(curatedFile, skillName, args.dryRun);

  if (args.runOpenClawSync) {
    if (args.dryRun) {
      console.log(`[dry-run] run pnpm run skills:sync in ${appRoot}`);
      return;
    }
    const result = spawnSync("pnpm", ["run", "skills:sync"], {
      cwd: appRoot,
      stdio: "inherit",
      shell: false,
    });
    if (result.status !== 0) {
      throw new Error(`OpenClaw skills sync failed with status ${result.status}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.target) {
    console.log(usage());
    return;
  }

  await requirePath(canonicalSkillDir, "canonical skill");
  await requirePath(pluginDir, "plugin");
  await requirePath(agentFile, "agent file");

  const targets = args.target === "all"
    ? ["claude", "codex-skill", "codex-plugin", "openclaw"]
    : [args.target];

  for (const target of targets) {
    if (target === "claude") {
      await installClaude(args);
    } else if (target === "codex-skill") {
      await installCodexSkill(args);
    } else if (target === "codex-plugin") {
      await installCodexPlugin(args);
    } else if (target === "openclaw") {
      await installOpenClaw(args);
    } else {
      throw new Error(`Unsupported target: ${target}`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
