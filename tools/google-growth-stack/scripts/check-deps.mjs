#!/usr/bin/env node

/**
 * Check system dependencies required for the Google Growth Stack.
 * Auto-installs gcloud CLI if missing and user confirms, or prints install instructions.
 *
 * Usage: node scripts/check-deps.mjs [--auto-install]
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline';

const autoInstall = process.argv.includes('--auto-install');

const dependencies = [
  {
    name: 'node',
    command: 'node --version',
    minVersion: '20.0.0',
    installHint: 'Install Node.js >= 20: https://nodejs.org or `nvm install 20`',
    installCommand: null, // node must already be running
  },
  {
    name: 'gcloud',
    command: 'gcloud --version',
    minVersion: null,
    installHint: 'Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install',
    installCommand: detectGcloudInstallCommand(),
  },
  {
    name: 'gcloud-auth',
    command: 'gcloud auth application-default print-access-token',
    minVersion: null,
    installHint: 'Run: gcloud auth application-default login',
    installCommand: 'gcloud auth application-default login',
  },
];

function detectGcloudInstallCommand() {
  const platform = process.platform;
  if (platform === 'darwin') {
    return 'brew install --cask google-cloud-sdk';
  }
  if (platform === 'linux') {
    return 'curl https://sdk.cloud.google.com | bash';
  }
  return null;
}

function checkCommand(command) {
  try {
    const output = execSync(command, { stdio: 'pipe', timeout: 15000 }).toString().trim();
    return { ok: true, output };
  } catch {
    return { ok: false, output: '' };
  }
}

function parseVersion(versionString) {
  const match = versionString.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

function versionGte(current, minimum) {
  const currentParts = current.split('.').map(Number);
  const minimumParts = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((currentParts[i] || 0) > (minimumParts[i] || 0)) return true;
    if ((currentParts[i] || 0) < (minimumParts[i] || 0)) return false;
  }
  return true;
}

async function askUserConfirm(question) {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

async function runInstall(dep) {
  if (!dep.installCommand) {
    console.log(`  ⚠  No auto-install available. ${dep.installHint}`);
    return false;
  }

  const shouldInstall = autoInstall || await askUserConfirm(`  Install ${dep.name} now? (${dep.installCommand}) [y/N] `);
  if (!shouldInstall) {
    console.log(`  ⏭  Skipped. ${dep.installHint}`);
    return false;
  }

  console.log(`  ⏳ Running: ${dep.installCommand}`);
  try {
    execSync(dep.installCommand, { stdio: 'inherit', timeout: 300000 });
    console.log(`  ✅ ${dep.name} installed.`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to install ${dep.name}. ${dep.installHint}`);
    return false;
  }
}

async function main() {
  console.log('\n🔍 Checking Google Growth Stack dependencies...\n');

  let allPassed = true;
  const results = [];

  for (const dep of dependencies) {
    process.stdout.write(`  ${dep.name}: `);
    const result = checkCommand(dep.command);

    if (result.ok) {
      if (dep.minVersion) {
        const version = parseVersion(result.output);
        if (version && versionGte(version, dep.minVersion)) {
          console.log(`✅ ${version}`);
          results.push({ name: dep.name, status: 'ok', version });
        } else {
          console.log(`❌ ${version || 'unknown'} (need >= ${dep.minVersion})`);
          console.log(`     ${dep.installHint}`);
          allPassed = false;
          results.push({ name: dep.name, status: 'version-mismatch', version });
        }
      } else {
        console.log('✅');
        results.push({ name: dep.name, status: 'ok' });
      }
    } else {
      console.log('❌ not found');
      allPassed = false;
      results.push({ name: dep.name, status: 'missing' });

      const installed = await runInstall(dep);
      if (installed) {
        results[results.length - 1].status = 'installed';
        // Re-check after install
        const recheck = checkCommand(dep.command);
        if (!recheck.ok) {
          console.log(`  ⚠  ${dep.name} installed but not yet in PATH. Restart your terminal.`);
        }
      }
    }
  }

  // Check for GA4 property config
  process.stdout.write('  GA4 property config: ');
  if (existsSync(new URL('../config.json', import.meta.url))) {
    console.log('✅');
    results.push({ name: 'config', status: 'ok' });
  } else {
    console.log('⚠  not found (optional, create config.json with ga4PropertyId and searchConsoleSiteUrl)');
    results.push({ name: 'config', status: 'optional-missing' });
  }

  console.log('');
  if (allPassed) {
    console.log('🎉 All dependencies ready. You can run the growth stack tools.\n');
  } else {
    console.log('⚠  Some dependencies are missing. Fix them above and re-run check-deps.\n');
  }

  return allPassed ? 0 : 1;
}

process.exit(await main());
