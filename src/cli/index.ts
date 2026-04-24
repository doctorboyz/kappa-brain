#!/usr/bin/env bun
import { Command } from "commander";
import { VERSION, NAME } from "../version.js";
import { installCommand } from "./install.js";
import { uninstallCommand } from "./uninstall.js";
import { listCommand } from "./list.js";
import { profilesCommand } from "./profiles-cmd.js";
import { agentsCommand } from "./agents-cmd.js";
import { aboutCommand } from "./about.js";
import { diagnoseCommand } from "./diagnose-cmd.js";
import { cerebroCommand } from "./cerebro-cmd.js";

export const program = new Command();

program
  .name(NAME)
  .description("Kappa Cell brain — MCP server (28 tools) + skill installer (13 pure kappa skills)")
  .version(VERSION);

program.addCommand(installCommand);
program.addCommand(uninstallCommand);
program.addCommand(listCommand);
program.addCommand(profilesCommand);
program.addCommand(agentsCommand);
program.addCommand(aboutCommand);
program.addCommand(diagnoseCommand);
program.addCommand(cerebroCommand);