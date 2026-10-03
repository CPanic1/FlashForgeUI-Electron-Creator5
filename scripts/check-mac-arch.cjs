#!/usr/bin/env node
/**
 * @fileoverview Preflight check for Apple Silicon native builds.
 *
 * On macOS, an x64 Node.js install causes pnpm to download the x64 Electron
 * binary, so `pnpm start`, `pnpm dev` and local builds silently run under
 * Rosetta 2. This script fails fast with a fix instead. No-op on Windows/Linux.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.platform !== 'darwin') process.exit(0);

const problems = [];

// 1. Node itself must be arm64 (process.arch reports x64 when Node runs under Rosetta)
if (process.arch !== 'arm64') {
  problems.push(`Node.js is running as ${process.arch}. Install the arm64 build of Node.js.`);
}

// 2. Translated-process check (catches an arm64-capable Node launched from a Rosetta terminal)
try {
  const translated = execSync('sysctl -in sysctl.proc_translated', { encoding: 'utf8' }).trim();
  if (translated === '1') {
    problems.push('This shell is running under Rosetta. Uncheck "Open using Rosetta" on Terminal/iTerm, or run `arch -arm64 zsh`.');
  }
} catch {
  // sysctl key absent on Intel Macs; nothing to check
}

// 3. The downloaded Electron binary must be arm64
try {
  const electronPath = require('electron'); // resolves to the binary path
  if (fs.existsSync(electronPath)) {
    const info = execSync(`file "${electronPath}"`, { encoding: 'utf8' });
    if (!info.includes('arm64')) {
      problems.push(
        'node_modules contains an x64 Electron binary. After fixing Node, run: rm -rf node_modules && pnpm install'
      );
    }
  }
} catch {
  // electron not installed yet (fresh clone); install will fetch the right arch once Node is arm64
}

// 4. go2rtc arm64 binary must exist for packaging/runtime camera streaming
const go2rtc = path.join(__dirname, '..', 'resources', 'bin', 'darwin-arm64', 'go2rtc');
if (!fs.existsSync(go2rtc)) {
  problems.push('resources/bin/darwin-arm64/go2rtc is missing. Run: node scripts/download-go2rtc.cjs');
}

if (problems.length) {
  console.error('\n[check-mac-arch] Not set up for a native Apple Silicon build:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}

console.log('[check-mac-arch] OK: Node, shell, Electron and go2rtc are all arm64.');
