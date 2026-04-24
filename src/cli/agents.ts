import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";

export interface AgentTarget {
  name: string;
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string;
  agentsDir: string;
  commandsDir?: string;
  globalCommandsDir?: string;
  useFlatFiles: boolean;
  commandFormat: "md" | "toml";
  commandsOptIn: boolean;
  detectPath: string;
  detectInstalled: () => boolean;
}

export interface CustomAgentConfig {
  name: string;
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string;
  agentsDir: string;
  commandsDir?: string;
  globalCommandsDir?: string;
  useFlatFiles?: boolean;
  commandFormat?: "md" | "toml";
  commandsOptIn?: boolean;
  detectPath: string;
}

const home = homedir();
const CONFIG_DIR = join(home, ".config", "kappa-brain");
const AGENTS_CONFIG_FILE = join(CONFIG_DIR, "agents.json");

export const AGENT_TARGETS: Record<string, AgentTarget> = {
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    skillsDir: ".claude/skills",
    globalSkillsDir: join(home, ".claude", "skills"),
    agentsDir: join(home, ".claude", "agents"),
    commandsDir: ".claude/commands",
    globalCommandsDir: join(home, ".claude", "commands"),
    useFlatFiles: false,
    commandFormat: "md",
    commandsOptIn: true,
    detectPath: join(home, ".claude", "skills"),
    get detectInstalled() { return () => existsSync(this.detectPath); },
  },
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    skillsDir: ".opencode/skills",
    globalSkillsDir: join(home, ".config", "opencode", "skills"),
    agentsDir: join(home, ".config", "opencode", "agents"),
    commandFormat: "md",
    useFlatFiles: false,
    commandsOptIn: false,
    detectPath: join(home, ".config", "opencode"),
    get detectInstalled() { return () => existsSync(this.detectPath); },
  },
  codex: {
    name: "codex",
    displayName: "Codex",
    skillsDir: ".codex/skills",
    globalSkillsDir: join(home, ".codex", "skills"),
    agentsDir: join(home, ".codex", "agents"),
    commandsDir: ".codex/prompts",
    globalCommandsDir: join(home, ".codex", "prompts"),
    useFlatFiles: true,
    commandFormat: "md",
    commandsOptIn: false,
    detectPath: join(home, ".codex"),
    get detectInstalled() { return () => existsSync(this.detectPath); },
  },
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    skillsDir: ".cursor/skills",
    globalSkillsDir: join(home, ".cursor", "skills"),
    agentsDir: join(home, ".cursor", "agents"),
    useFlatFiles: true,
    commandFormat: "md",
    commandsOptIn: false,
    detectPath: join(home, ".cursor"),
    get detectInstalled() { return () => existsSync(this.detectPath); },
  },
};

export const DEFAULT_AGENTS = ["claude-code"];

function loadCustomAgents(): Record<string, CustomAgentConfig> {
  if (!existsSync(AGENTS_CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(AGENTS_CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function toAgentTarget(config: CustomAgentConfig): AgentTarget {
  return {
    name: config.name,
    displayName: config.displayName,
    skillsDir: config.skillsDir,
    globalSkillsDir: config.globalSkillsDir,
    agentsDir: config.agentsDir,
    commandsDir: config.commandsDir,
    globalCommandsDir: config.globalCommandsDir,
    useFlatFiles: config.useFlatFiles ?? false,
    commandFormat: config.commandFormat ?? "md",
    commandsOptIn: config.commandsOptIn ?? false,
    detectPath: config.detectPath,
    get detectInstalled() { return () => existsSync(this.detectPath); },
  };
}

function mergeCustomAgents(): Record<string, AgentTarget> {
  const merged: Record<string, AgentTarget> = { ...AGENT_TARGETS };
  const custom = loadCustomAgents();
  for (const [name, config] of Object.entries(custom)) {
    merged[name] = toAgentTarget(config);
  }
  return merged;
}

export function getAllTargets(): Record<string, AgentTarget> {
  return mergeCustomAgents();
}

export function resolveAgent(name: string): AgentTarget {
  const all = getAllTargets();
  const agent = all[name];
  if (!agent) {
    throw new Error(
      `Unknown agent: ${name}. Available: ${Object.keys(all).join(", ")}`
    );
  }
  return agent;
}

export function listAgents(): string[] {
  return Object.keys(getAllTargets());
}

export function detectInstalledAgents(): string[] {
  return Object.entries(getAllTargets())
    .filter(([_, agent]) => agent.detectInstalled())
    .map(([name]) => name);
}

export function saveCustomAgent(config: CustomAgentConfig): void {
  const custom = loadCustomAgents();
  custom[config.name] = config;
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(AGENTS_CONFIG_FILE, JSON.stringify(custom, null, 2), "utf-8");
}

export function removeCustomAgent(name: string): boolean {
  const custom = loadCustomAgents();
  if (!custom[name]) return false;
  delete custom[name];
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(AGENTS_CONFIG_FILE, JSON.stringify(custom, null, 2), "utf-8");
  return true;
}