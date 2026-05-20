#!/usr/bin/env node
import { access, readdir, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const skillName = "startup-playbook-advisor";
const requiredSkillFiles = [
  "SKILL.md",
  "references/advisor-dialogue.md",
  "references/evidence-standards.md",
  "templates/startup-diagnosis.md",
];

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readText(filePath) {
  return readFile(filePath, "utf8");
}

function assert(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

async function listFiles(root, prefix = "") {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, rel));
    } else {
      files.push(rel.replaceAll(path.sep, "/"));
    }
  }
  return files.sort();
}

async function compareDirs(left, right, errors) {
  const leftFiles = await listFiles(left);
  const rightFiles = await listFiles(right);
  assert(JSON.stringify(leftFiles) === JSON.stringify(rightFiles), "plugin skill files differ from canonical skill files", errors);
  for (const rel of leftFiles) {
    const leftText = await readText(path.join(left, rel));
    const rightText = await readText(path.join(right, rel));
    assert(leftText === rightText, `plugin skill copy differs: ${rel}`, errors);
  }
}

async function main() {
  const errors = [];
  const canonicalSkillDir = path.join(repoRoot, "skills", skillName);
  const pluginSkillDir = path.join(repoRoot, "plugins", skillName, "skills", skillName);
  const pluginManifestPath = path.join(repoRoot, "plugins", skillName, ".codex-plugin", "plugin.json");
  const marketplacePath = path.join(repoRoot, ".agents", "plugins", "marketplace.json");
  const installScript = path.join(repoRoot, "scripts", "install-startup-advisor.mjs");

  for (const rel of requiredSkillFiles) {
    assert(await exists(path.join(canonicalSkillDir, rel)), `missing canonical skill file: ${rel}`, errors);
    assert(await exists(path.join(pluginSkillDir, rel)), `missing plugin skill file: ${rel}`, errors);
  }

  if (await exists(path.join(canonicalSkillDir, "SKILL.md"))) {
    const skillMd = await readText(path.join(canonicalSkillDir, "SKILL.md"));
    assert(skillMd.startsWith("---\n"), "canonical SKILL.md must start with YAML frontmatter", errors);
    assert(skillMd.includes("name: startup-playbook-advisor"), "canonical SKILL.md must declare the skill name", errors);
    assert(skillMd.includes("description: Use when"), "canonical SKILL.md description must be invocation-focused", errors);
    assert(!skillMd.includes("[TODO:"), "canonical SKILL.md contains TODO placeholder", errors);
  }

  if (await exists(pluginManifestPath)) {
    const manifest = JSON.parse(await readText(pluginManifestPath));
    assert(manifest.name === skillName, "plugin name mismatch", errors);
    assert(manifest.skills === "./skills/", "plugin skills path mismatch", errors);
    assert(Array.isArray(manifest.interface?.defaultPrompt), "plugin defaultPrompt should be an array", errors);
    assert(Array.isArray(manifest.interface?.capabilities) && manifest.interface.capabilities.length > 0, "plugin capabilities missing", errors);
    assert(!JSON.stringify(manifest).includes("Local developer"), "plugin manifest still contains scaffold author", errors);
  } else {
    errors.push("missing plugin manifest");
  }

  if (await exists(marketplacePath)) {
    const marketplace = JSON.parse(await readText(marketplacePath));
    assert(Array.isArray(marketplace.plugins), "marketplace plugins must be an array", errors);
    assert(marketplace.plugins.some((plugin) => plugin?.name === skillName), "marketplace is missing startup-playbook-advisor", errors);
  } else {
    errors.push("missing marketplace file");
  }

  if (await exists(installScript)) {
    const script = await readText(installScript);
    for (const token of ["claude", "codex-skill", "codex-plugin", "openclaw", "bundled_local_skills.txt", "skills:sync"]) {
      assert(script.includes(token), `install script missing ${token}`, errors);
    }
  } else {
    errors.push("missing install script");
  }

  if (await exists(pluginSkillDir)) {
    await compareDirs(canonicalSkillDir, pluginSkillDir, errors);
  }

  if (errors.length > 0) {
    console.error("Startup advisor validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Startup advisor validation passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
