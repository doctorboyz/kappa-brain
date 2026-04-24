import { Command } from "commander";
import { getAllTargets, detectInstalledAgents, saveCustomAgent, removeCustomAgent, type CustomAgentConfig } from "./agents.js";

export const agentsCommand = new Command("agents")
  .description("List supported agent platforms")
  .action(() => {
    console.log(`\n🤖 Supported agent platforms\n`);
    const all = getAllTargets();
    const installed = detectInstalledAgents();
    for (const [name, agent] of Object.entries(all)) {
      const isInstalled = installed.includes(name);
      console.log(`  ${isInstalled ? "✓" : "○"} ${agent.displayName} (${name})`);
      console.log(`    skills: ${agent.globalSkillsDir}`);
      console.log(`    agents: ${agent.agentsDir}`);
      console.log();
    }
  });

agentsCommand
  .command("add")
  .description("Add a custom agent platform")
  .requiredOption("-n, --name <name>", "agent name (kebab-case)")
  .requiredOption("--display-name <displayName>", "display name")
  .requiredOption("--global-skills-dir <path>", "global skills directory path")
  .requiredOption("--agents-dir <path>", "agents directory path")
  .requiredOption("--detect-path <path>", "path to check for installation")
  .option("--skills-dir <path>", "project-local skills directory")
  .option("--commands-dir <path>", "project-local commands directory")
  .option("--global-commands-dir <path>", "global commands directory path")
  .action((opts) => {
    const config: CustomAgentConfig = {
      name: opts.name,
      displayName: opts.displayName,
      skillsDir: opts.skillsDir || `.${opts.name}/skills`,
      globalSkillsDir: opts.globalSkillsDir,
      agentsDir: opts.agentsDir,
      commandsDir: opts.commandsDir,
      globalCommandsDir: opts.globalCommandsDir,
      detectPath: opts.detectPath,
    };
    saveCustomAgent(config);
    console.log(`\n  ✓ added custom agent: ${opts.name} (${opts.displayName})`);
    console.log(`    config: ~/.config/kappa-brain/agents.json\n`);
  });

agentsCommand
  .command("remove")
  .description("Remove a custom agent platform")
  .argument("<name>", "agent name to remove")
  .action((name) => {
    const removed = removeCustomAgent(name);
    if (removed) {
      console.log(`\n  ✓ removed custom agent: ${name}\n`);
    } else {
      console.log(`\n  ✗ custom agent not found: ${name}\n`);
    }
  });