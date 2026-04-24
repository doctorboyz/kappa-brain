import { Command } from "commander";
import { VERSION, NAME } from "../version.js";
import { listAvailableSkills, listAvailableAgents } from "../installer/index.js";

export const aboutCommand = new Command("about")
  .description("Show @kappa/brain-cli identity and stats")
  .option("--en", "English output", false)
  .action((opts) => {
    const skills = listAvailableSkills();
    const agents = listAvailableAgents();

    if (opts.en) {
      console.log(`\n🧬 ${NAME} v${VERSION}\n`);
      console.log(`  "From the first knowledge, the Kappa family grows"`);
      console.log(`  Skills: ${skills.length} pure kappa`);
      console.log(`  Agents: ${agents.length}`);
      console.log(`  MCP Tools: 28 (kappa_search, kappa_read, ... cerebro_register)`);
      console.log(`  License: MIT`);
      console.log(`  Repo: https://github.com/doctorboyz/kappa-brain`);
      console.log();
    } else {
      console.log(`\n🧬 ${NAME} v${VERSION}\n`);
      console.log(`  "จากความรู้แรก สู่ทัพ Kappa — โค้ดเป็นราก ข้อมูลเป็นใบ"`);
      console.log(`  Skills: ${skills.length} pure kappa`);
      console.log(`  Agents: ${agents.length}`);
      console.log(`  MCP Tools: 28 (kappa_search, kappa_read, ... cerebro_register)`);
      console.log(`  License: MIT`);
      console.log(`  Repo: https://github.com/doctorboyz/kappa-brain`);
      console.log();
    }
  });