import { Command } from "commander";
import { PROFILES, listProfiles } from "./profiles.js";

export const profilesCommand = new Command("profiles")
  .description("List available profiles")
  .action(() => {
    console.log(`\n🧬 @kappa/brain-cli profiles\n`);
    for (const [name, profile] of Object.entries(PROFILES)) {
      console.log(`  ${name}`);
      console.log(`    ${profile.description}`);
      console.log(`    skills: ${profile.skills.length}, agents: ${profile.agents.length}`);
      console.log();
    }
  });