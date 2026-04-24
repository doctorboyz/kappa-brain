#!/usr/bin/env bun
// @kappa/brain-cli — MCP server + skill installer
// No args → MCP server mode
// Subcommands → CLI mode

const args = process.argv.slice(2);

const CLI_COMMANDS = [
  "install", "uninstall", "list", "profiles", "agents",
  "about", "diagnose", "init", "cerebro",
];

async function main() {
  const firstArg = args[0];

  // MCP server mode: no args, --mcp flag, or "serve" subcommand
  if (!firstArg || firstArg === "--mcp" || firstArg === "serve") {
    const { startMcpServer } = await import("./mcp/server.js");
    await startMcpServer();
    return;
  }

  // CLI mode
  const { program } = await import("./cli/index.js");
  program.parse();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});