import { Command } from "commander";
import { readManifest } from "../installer/index.js";
import { getAllTargets } from "./agents.js";
import { existsSync, readdirSync } from "fs";
import { join } from "path";

export const diagnoseCommand = new Command("diagnose")
  .description("Diagnostic scan of installed skills and agents")
  .action(() => {
    console.log(`\n🔍 @kappa/brain-cli diagnose\n`);

    const allTargets = getAllTargets();
    for (const [name, agent] of Object.entries(allTargets)) {
      const manifest = readManifest(agent);
      const skillsDir = agent.globalSkillsDir;
      const agentsDir = agent.agentsDir;

      console.log(`  ${agent.displayName}:`);
      console.log(`    skills dir: ${skillsDir} ${existsSync(skillsDir) ? "✓" : "✗"}`);
      console.log(`    agents dir: ${agentsDir} ${existsSync(agentsDir) ? "✓" : "✗"}`);

      if (manifest) {
        console.log(`    version: ${manifest.version}`);
        console.log(`    installed: ${manifest.installedAt}`);
        console.log(`    profile: ${manifest.profile || "custom"}`);

        if (existsSync(skillsDir)) {
          const onDisk = readdirSync(skillsDir).filter(
            (n) => !n.startsWith(".") && existsSync(join(skillsDir, n, "SKILL.md"))
          );
          const tracked = manifest.skills;
          const orphans = onDisk.filter((s) => !tracked.includes(s));
          if (orphans.length > 0) {
            console.log(`    ⚠ orphaned skills: ${orphans.join(", ")}`);
          }
        }
      } else {
        console.log(`    not installed`);
      }
      console.log();
    }
  });