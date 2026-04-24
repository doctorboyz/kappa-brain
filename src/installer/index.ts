import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, appendFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import { VERSION, NAME } from "../version.js";
import { resolveProfile } from "../cli/profiles.js";
import { resolveAgent, type AgentTarget } from "../cli/agents.js";

const home = homedir();

interface ManifestEntry {
  action: "install" | "uninstall" | "archive";
  type: "skill" | "agent" | "manifest";
  name: string;
  timestamp: string;
  details?: string;
}

interface InstallManifest {
  version: string;
  installedAt: string;
  skills: string[];
  agents: string[];
  profile?: string;
  updatedAt?: string;
  history?: ManifestEntry[];
}

const MANIFEST_FILE = ".kappa-brain.json";
const HISTORY_FILE = ".kappa-brain-history.jsonl";

function getManifestPath(agent: AgentTarget): string {
  return join(agent.globalSkillsDir, MANIFEST_FILE);
}

export function readManifest(agent: AgentTarget): InstallManifest | null {
  const path = getManifestPath(agent);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function writeManifest(agent: AgentTarget, manifest: InstallManifest): void {
  const path = getManifestPath(agent);
  mkdirSync(agent.globalSkillsDir, { recursive: true });
  manifest.updatedAt = new Date().toISOString();
  const history = readHistory(agent);
  manifest.history = history.slice(-50);
  writeFileSync(path, JSON.stringify(manifest, null, 2), "utf-8");
}

export function appendHistory(agent: AgentTarget, entry: ManifestEntry): void {
  const historyPath = join(agent.globalSkillsDir, HISTORY_FILE);
  mkdirSync(agent.globalSkillsDir, { recursive: true });
  const line = JSON.stringify(entry) + "\n";
  appendFileSync(historyPath, line, "utf-8");
}

export function readHistory(agent: AgentTarget): ManifestEntry[] {
  const historyPath = join(agent.globalSkillsDir, HISTORY_FILE);
  if (!existsSync(historyPath)) return [];
  try {
    const lines = readFileSync(historyPath, "utf-8").trim().split("\n").filter(Boolean);
    return lines.map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function getSkillSourceDir(): string {
  return resolve(import.meta.dir, "..", "skills");
}

function getAgentSourceDir(): string {
  return resolve(import.meta.dir, "..", "agents");
}

export function listAvailableSkills(): string[] {
  const skillDir = getSkillSourceDir();
  if (!existsSync(skillDir)) return [];
  return readdirSync(skillDir).filter((name) => {
    const skillPath = join(skillDir, name);
    return statSync(skillPath).isDirectory() && existsSync(join(skillPath, "SKILL.md"));
  });
}

export function listAvailableAgents(): string[] {
  const agentDir = getAgentSourceDir();
  if (!existsSync(agentDir)) return [];
  return readdirSync(agentDir).filter((name) => name.endsWith(".md"));
}

export async function installSkill(
  skillName: string,
  agent: AgentTarget,
  options: { force?: boolean } = {}
): Promise<{ installed: boolean; reason?: string }> {
  const sourceDir = join(getSkillSourceDir(), skillName);
  const targetDir = join(agent.globalSkillsDir, skillName);

  if (!existsSync(sourceDir) || !existsSync(join(sourceDir, "SKILL.md"))) {
    return { installed: false, reason: `skill not found: ${skillName}` };
  }

  if (existsSync(targetDir) && !options.force) {
    return { installed: false, reason: "already installed" };
  }

  if (existsSync(targetDir)) {
    archiveItem(targetDir, agent, "skill", skillName);
    rmSync(targetDir, { recursive: true, force: true });
  }

  mkdirSync(agent.globalSkillsDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });

  appendHistory(agent, {
    action: "install",
    type: "skill",
    name: skillName,
    timestamp: new Date().toISOString(),
  });

  const skillMdPath = join(targetDir, "SKILL.md");
  if (existsSync(skillMdPath)) {
    let content = readFileSync(skillMdPath, "utf-8");
    if (!content.includes("installer:")) {
      content = content.replace(/^---\n/, `---\ninstaller: ${NAME} v${VERSION}\n`);
    } else {
      content = content.replace(/installer:.*\n/, `installer: ${NAME} v${VERSION}\n`);
    }
    writeFileSync(skillMdPath, content, "utf-8");
  }

  return { installed: true };
}

export async function installAgent(
  agentFile: string,
  target: AgentTarget,
  options: { force?: boolean } = {}
): Promise<{ installed: boolean; reason?: string }> {
  const sourcePath = join(getAgentSourceDir(), agentFile);
  const targetPath = join(target.agentsDir, agentFile);

  if (!existsSync(sourcePath)) {
    return { installed: false, reason: `agent not found: ${agentFile}` };
  }

  if (existsSync(targetPath) && !options.force) {
    return { installed: false, reason: "already installed" };
  }

  mkdirSync(target.agentsDir, { recursive: true });
  cpSync(sourcePath, targetPath);

  appendHistory(target, {
    action: "install",
    type: "agent",
    name: agentFile,
    timestamp: new Date().toISOString(),
  });

  return { installed: true };
}

function getArchiveDir(agent: AgentTarget, type: "skill" | "agent"): string {
  return join(agent.globalSkillsDir, "..", "archive", type === "skill" ? "skills" : "agents");
}

function archiveItem(sourcePath: string, agent: AgentTarget, type: "skill" | "agent", name: string): string | null {
  if (!existsSync(sourcePath)) return null;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveDir = getArchiveDir(agent, type);
  const dest = join(archiveDir, `${name}-${timestamp}`);
  mkdirSync(archiveDir, { recursive: true });
  cpSync(sourcePath, dest, { recursive: true });
  return dest;
}

export async function uninstallSkill(
  skillName: string,
  agent: AgentTarget
): Promise<{ removed: boolean; reason?: string; archivedTo?: string }> {
  const targetDir = join(agent.globalSkillsDir, skillName);
  if (!existsSync(targetDir)) {
    return { removed: false, reason: "not installed" };
  }
  const archivedTo = archiveItem(targetDir, agent, "skill", skillName);
  rmSync(targetDir, { recursive: true, force: true });
  appendHistory(agent, {
    action: "uninstall",
    type: "skill",
    name: skillName,
    timestamp: new Date().toISOString(),
    details: archivedTo || undefined,
  });
  return { removed: true, archivedTo: archivedTo || undefined };
}

export async function uninstallAgent(
  agentFile: string,
  target: AgentTarget
): Promise<{ removed: boolean; reason?: string; archivedTo?: string }> {
  const targetPath = join(target.agentsDir, agentFile);
  if (!existsSync(targetPath)) {
    return { removed: false, reason: "not installed" };
  }
  const archivedTo = archiveItem(targetPath, target, "agent", agentFile.replace(/\.md$/, ""));
  rmSync(targetPath, { force: true });
  appendHistory(target, {
    action: "uninstall",
    type: "agent",
    name: agentFile,
    timestamp: new Date().toISOString(),
    details: archivedTo || undefined,
  });
  return { removed: true, archivedTo: archivedTo || undefined };
}

export async function installAll(options: {
  profile?: string;
  skills?: string[];
  agentNames?: string[];
  force?: boolean;
  yes?: boolean;
  dryRun?: boolean;
}): Promise<{ skillsInstalled: number; agentsInstalled: number; errors: string[] }> {
  const agentTargets = (options.agentNames || ["claude-code"]).map(resolveAgent);
  const errors: string[] = [];
  let skillsInstalled = 0;
  let agentsInstalled = 0;

  let skillNames: string[];
  if (options.skills && options.skills.length > 0) {
    skillNames = options.skills;
  } else if (options.profile) {
    const profile = resolveProfile(options.profile);
    if (profile.skills.includes("*")) {
      skillNames = listAvailableSkills();
    } else {
      skillNames = profile.skills;
    }
  } else {
    const profile = resolveProfile("standard");
    skillNames = profile.skills;
  }

  let agentFiles: string[];
  if (options.profile) {
    const profile = resolveProfile(options.profile);
    if (profile.agents.includes("*")) {
      agentFiles = listAvailableAgents();
    } else {
      agentFiles = profile.agents.map((a) => (a.endsWith(".md") ? a : `${a}.md`));
    }
  } else {
    const profile = resolveProfile("standard");
    agentFiles = profile.agents.map((a) => (a.endsWith(".md") ? a : `${a}.md`));
  }

  for (const agent of agentTargets) {
    for (const skillName of skillNames) {
      if (options.dryRun) {
        console.log(`  [dry-run] would install skill: ${skillName}`);
        skillsInstalled++;
        continue;
      }
      const result = await installSkill(skillName, agent, { force: options.force });
      if (result.installed) {
        console.log(`  ✓ installed skill: ${skillName}`);
        skillsInstalled++;
      } else if (result.reason !== "already installed") {
        console.log(`  ✗ ${skillName}: ${result.reason}`);
        errors.push(`${skillName}: ${result.reason}`);
      } else {
        console.log(`  → already installed: ${skillName}`);
      }
    }

    for (const agentFile of agentFiles) {
      if (options.dryRun) {
        console.log(`  [dry-run] would install agent: ${agentFile}`);
        agentsInstalled++;
        continue;
      }
      const result = await installAgent(agentFile, agent, { force: options.force });
      if (result.installed) {
        console.log(`  ✓ installed agent: ${agentFile}`);
        agentsInstalled++;
      } else if (result.reason !== "already installed") {
        console.log(`  ✗ ${agentFile}: ${result.reason}`);
        errors.push(`${agentFile}: ${result.reason}`);
      } else {
        console.log(`  → already installed: ${agentFile}`);
      }
    }

    if (!options.dryRun) {
      const manifest: InstallManifest = {
        version: VERSION,
        installedAt: new Date().toISOString(),
        skills: skillNames,
        agents: agentFiles,
        profile: options.profile,
      };
      writeManifest(agent, manifest);
      appendHistory(agent, {
        action: "install",
        type: "manifest",
        name: "full-install",
        timestamp: new Date().toISOString(),
        details: `profile: ${options.profile || "custom"}`,
      });
    }
  }

  return { skillsInstalled, agentsInstalled, errors };
}

export async function uninstallAll(options: {
  agentNames?: string[];
  skills?: string[];
  all?: boolean;
}): Promise<{ skillsRemoved: number; agentsRemoved: number; errors: string[] }> {
  const agentTargets = (options.agentNames || ["claude-code"]).map(resolveAgent);
  const errors: string[] = [];
  let skillsRemoved = 0;
  let agentsRemoved = 0;

  for (const agent of agentTargets) {
    if (options.all) {
      const manifest = readManifest(agent);
      const skillsToRemove = manifest?.skills || listAvailableSkills();
      const agentsToRemove = manifest?.agents || listAvailableAgents();

      for (const skillName of skillsToRemove) {
        const result = await uninstallSkill(skillName, agent);
        if (result.removed) {
          console.log(`  ✓ removed skill: ${skillName}${result.archivedTo ? ` (archived)` : ""}`);
          skillsRemoved++;
        }
      }

      for (const agentFile of agentsToRemove) {
        const result = await uninstallAgent(agentFile, agent);
        if (result.removed) {
          console.log(`  ✓ removed agent: ${agentFile}${result.archivedTo ? ` (archived)` : ""}`);
          agentsRemoved++;
        }
      }

      appendHistory(agent, {
        action: "uninstall",
        type: "manifest",
        name: "uninstall-all",
        timestamp: new Date().toISOString(),
        details: `removed ${skillsToRemove.length} skills, ${agentsToRemove.length} agents`,
      });
      if (manifest) {
        writeManifest(agent, {
          version: VERSION,
          installedAt: manifest.installedAt,
          skills: [],
          agents: [],
          profile: manifest.profile,
        });
      }
    } else if (options.skills) {
      for (const skillName of options.skills) {
        const result = await uninstallSkill(skillName, agent);
        if (result.removed) {
          console.log(`  ✓ removed skill: ${skillName}`);
          skillsRemoved++;
        } else {
          errors.push(`${skillName}: ${result.reason}`);
        }
      }
    }
  }

  return { skillsRemoved, agentsRemoved, errors };
}