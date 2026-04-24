import { Command } from "commander";
import { cerebroScan, cerebroLineage, cerebroPing, cerebroRegister } from "../tools/cerebro.js";

export const cerebroCommand = new Command("cerebro")
  .description("Cerebro — KappaNet Cell discovery and lineage");

cerebroCommand
  .command("scan")
  .description("Scan KappaNet for registered Cells")
  .option("-r, --repo <repo>", "GitHub repo to scan (owner/repo)")
  .option("-l, --limit <limit>", "Max results", "50")
  .action((opts) => {
    const result = cerebroScan(opts.repo, parseInt(opts.limit));
    console.log(JSON.stringify(result, null, 2));
  });

cerebroCommand
  .command("lineage")
  .description("Query Cell lineage — ancestors, descendants, or tree")
  .option("-d, --direction <dir>", "ancestors, descendants, or tree", "tree")
  .action((opts) => {
    const result = cerebroLineage(opts.direction);
    console.log(JSON.stringify(result, null, 2));
  });

cerebroCommand
  .command("ping")
  .description("Check Cell presence — update last_seen or check if registered")
  .option("-t, --target <id>", "Target kappanet_id to check")
  .action((opts) => {
    const result = cerebroPing(opts.target);
    console.log(JSON.stringify(result, null, 2));
  });

cerebroCommand
  .command("register")
  .description("Register this Cell in KappaNet")
  .requiredOption("-n, --name <name>", "Cell name")
  .requiredOption("-r, --repo <repo>", "GitHub repo (owner/repo)")
  .option("-p, --parent <id>", "Parent kappanet_id")
  .option("-a, --ancestry <json>", "Ancestry JSON array")
  .requiredOption("-v, --dna-version <ver>", "DNA version")
  .requiredOption("-b, --born <date>", "Birth date (YYYY-MM-DD)")
  .action((opts) => {
    const result = cerebroRegister({
      cellName: opts.name,
      repo: opts.repo,
      parentKappanetId: opts.parent,
      ancestry: opts.ancestry,
      dnaVersion: opts.dnaVersion,
      born: opts.born,
    });
    console.log(JSON.stringify(result, null, 2));
  });