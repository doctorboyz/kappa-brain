export interface Profile {
  name: string;
  description: string;
  skills: string[];
  agents: string[];
}

export const PROFILES: Record<string, Profile> = {
  cell: {
    name: "cell",
    description: "Minimal: 5 core skills, 5 core agents — just enough to be a Kappa Cell",
    skills: [
      "born",
      "on-service",
      "off-service",
      "discharge",
      "vitals",
    ],
    agents: [
      "planner",
      "code-reviewer",
      "code-implementer",
      "bug-investigator",
      "build-error-resolver",
    ],
  },
  standard: {
    name: "standard",
    description: "Daily driver — 13 pure kappa skills, 14 agents",
    skills: [
      "born",
      "on-service",
      "off-service",
      "discharge",
      "meditation",
      "vitals",
      "diagnose",
      "cerebro",
      "introduce",
      "consult",
      "surgery",
      "about-kappa",
      "emergency",
    ],
    agents: [
      // cell agents
      "planner",
      "code-reviewer",
      "code-implementer",
      "bug-investigator",
      "build-error-resolver",
      // + standard agents
      "architect",
      "code-explorer",
      "doc-updater",
      "e2e-runner",
      "performance-optimizer",
      "security-reviewer",
      "tdd-guide",
      "test-writer",
      "typescript-reviewer",
    ],
  },
  full: {
    name: "full",
    description: "All 13 pure kappa skills, 14 agents (same as standard)",
    skills: [
      "born",
      "on-service",
      "off-service",
      "discharge",
      "meditation",
      "vitals",
      "diagnose",
      "cerebro",
      "introduce",
      "consult",
      "surgery",
      "about-kappa",
      "emergency",
    ],
    agents: [
      "planner",
      "code-reviewer",
      "code-implementer",
      "bug-investigator",
      "build-error-resolver",
      "architect",
      "code-explorer",
      "doc-updater",
      "e2e-runner",
      "performance-optimizer",
      "security-reviewer",
      "tdd-guide",
      "test-writer",
      "typescript-reviewer",
    ],
  },
};

export function resolveProfile(name: string): Profile {
  const profile = PROFILES[name];
  if (!profile) {
    throw new Error(`Unknown profile: ${name}. Available: ${Object.keys(PROFILES).join(", ")}`);
  }
  return profile;
}

export function listProfiles(): string[] {
  return Object.keys(PROFILES);
}