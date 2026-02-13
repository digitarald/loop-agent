#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function fatal(msg) {
  console.error(`${RED}✗${RESET} ${msg}`);
  process.exit(1);
}

const root = __dirname;
const dest = process.cwd();
const pkg = require(path.join(root, "package.json"));
const cmd = process.argv[2];

if (cmd === "--version" || cmd === "-v") {
  console.log(pkg.version);
  process.exit(0);
}

if (cmd === "--help" || cmd === "-h" || cmd === "help") {
  console.log(
    `\n${BOLD}loop-agent${RESET} v${pkg.version} — Self-correcting multi-agent orchestration\n`
  );
  console.log(`Usage: npx github:digitarald/loop-agent [command]\n`);
  console.log(`Commands:`);
  console.log(
    `  ${BOLD}(default)${RESET}  Install Loop agents (skip files that already exist)`
  );
  console.log(
    `  ${BOLD}upgrade${RESET}    Overwrite all agent files with latest version`
  );
  console.log(`  ${BOLD}help${RESET}       Show this help message`);
  console.log(`\nFlags:`);
  console.log(`  ${BOLD}--version, -v${RESET}  Print version`);
  console.log(`  ${BOLD}--help, -h${RESET}     Show help\n`);
  process.exit(0);
}

// Collect all agent files from the package
const agentFiles = fs
  .readdirSync(root)
  .filter((f) => f.endsWith(".agent.md"));

if (agentFiles.length === 0) {
  fatal("No agent files found in package — installation may be corrupted");
}

// Validate destination is writable
try {
  fs.accessSync(dest, fs.constants.W_OK);
} catch {
  fatal(`Cannot write to ${dest} — check directory permissions`);
}

const agentsDir = path.join(dest, ".github", "agents");
fs.mkdirSync(agentsDir, { recursive: true });

const isUpgrade = cmd === "upgrade";
let installed = 0;
let skipped = 0;

for (const file of agentFiles) {
  const src = path.join(root, file);
  const destFile = path.join(agentsDir, file);

  if (fs.existsSync(destFile) && !isUpgrade) {
    console.log(`${DIM}${file} already exists — skipping${RESET}`);
    skipped++;
    continue;
  }

  fs.copyFileSync(src, destFile);
  const label = isUpgrade && fs.existsSync(destFile) ? "upgraded" : "installed";
  console.log(`${GREEN}✓${RESET} ${file}`);
  installed++;
}

console.log();
if (installed > 0) {
  console.log(
    `${BOLD}Loop is ${isUpgrade ? "upgraded" : "ready"}.${RESET} (v${pkg.version})`
  );
  console.log(`${installed} agent file(s) ${isUpgrade ? "upgraded" : "installed"} to .github/agents/`);
} else {
  console.log(
    `${BOLD}Loop is already installed.${RESET} (v${pkg.version})`
  );
  console.log(`Run ${BOLD}npx github:digitarald/loop-agent upgrade${RESET} to update.`);
}

if (!isUpgrade && installed > 0) {
  console.log();
  console.log(`Next steps:`);
  console.log(`  1. Open Copilot in VS Code`);
  console.log(`  2. Select ${BOLD}Loop${RESET} from the agent picker`);
  console.log(`  3. Describe what you want to build`);
}
console.log();
