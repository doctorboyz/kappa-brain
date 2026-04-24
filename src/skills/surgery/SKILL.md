---
name: surgery
description: Wire ecosystem connections after changes — trace impact across Kappa strands and repair broken links
origin: Kappa family (medical theme)
profile: standard
aliases: []
commands:
  - /surgery <what-changed>
  - /surgery <what-changed> --minor
  - /surgery <what-changed> --major
  - /surgery --scan
---

# Surgery

> "ผ่าตัดเชื่อมต่อ — ตามรอยการเปลี่ยนแปลง เย็บจุดที่ขาด"

When trauma hits a body, the surgeon traces the damage — following nerves, blood vessels, and fascia to find every torn connection. `/surgery` does the same for the Kappa ecosystem: from a point of change, it traces outward along the strands, finding every broken link, stale reference, or misaligned config. Then it recommends or applies the repair.

## Invocation

```
/surgery <what-changed>          # Minor surgery — trace direct dependencies from the change point
/surgery <what-changed> --minor  # Same as default — 1-hop trace only
/surgery <what-changed> --major  # Major surgery — trace across ALL strands, full ecosystem sweep
/surgery --scan                  # No specific change — scan entire ecosystem for inconsistencies
```

## Flags

| Flag | Behavior |
|------|----------|
| *(default)* | Minor surgery. From the change point, trace to directly connected components only. 1 hop. Fast, focused. |
| `--minor` | Explicit minor. Same as default — for clarity in documentation or scripts. |
| `--major` | Major surgery. From the change point, trace outward across ALL 5 strands. Full ecosystem sweep. Thorough but slower. |
| `--scan` | No specific change target. Scan the entire Kappa ecosystem for inconsistencies, stale references, and broken connections. Like a full-body scan. |

## The 5 Strands (Dependency Map)

```
┌─────────────────────────────────────────────────────────────┐
│                    KAPPA ECOSYSTEM                          │
│                                                             │
│  Strand 1: DNA (kappa-genome)                              │
│    principles, vault structure, birth rituals,              │
│    manifest, safety hooks, CLAUDE.md template               │
│    → Affects: ALL strands (they inherit from genome)        │
│                                                             │
│  Strand 2: Soul (Adams-kappa)                              │
│    identity, κ/ vault, short codes, CLAUDE.md, settings    │
│    → Affects: Skill (short codes), Brain (memory ops)       │
│                                                             │
│  Strand 3: Skill (kappa-skill-cli)                         │
│    skill distribution, SKILL.md files, hooks, profiles      │
│    → Affects: DNA (manifest), Soul (short codes), hooks    │
│                                                             │
│  Strand 4: Interface (KI)                                  │
│    multi-agent TUI, WebSocket, agent orchestration          │
│    → Affects: Brain (API connections), Skill (CLI)          │
│                                                             │
│  Strand 5: Brain (kappa-brain)                             │
│    MCP tools, SQLite, FTS5, supersede, cross-Cell msg      │
│    → Affects: Interface (API), Skill (tool references)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Change Impact Matrix

| What Changed | minor (1-hop) | major (all strands) |
|--------------|----------------|---------------------|
| **Add/modify skill** | DNA manifest.json, Soul short codes, hooks config | ALL strands + every Cell |
| **Change principle** | κ/extrinsic/wisdom/reference/, Brain search indexes | ALL strands + every CLAUDE.md |
| **Change κ/ vault structure** | Brain MCP tools, Soul filing rules | ALL strands + every Cell's κ/ |
| **Change CLAUDE.md** | Soul identity, Brain resonance | ALL strands |
| **Change MCP tool** | Interface API calls, Skill tool references | ALL strands |
| **Change hooks** | DNA safety-hooks.json, Soul/Brain logging | ALL strands |
| **Change manifest** | All Cell manifests, Brain schemas | ALL strands + build |
| **Change dependency** | package.json, lock files, import paths | ALL strands + build |
| **Add/modify agent** | DNA manifest, Soul agents list, Skill profiles | ALL strands |
| **Change profile** | DNA strand_versions, Skill skill counts | ALL strands |

## Surgery Workflow: minor (default)

From the change point, trace **1 hop only** — directly connected components.

```
Change Point
    │
    ├── Read what changed (file, config, principle, tool)
    │
    ├── Identify which strand(s) the change belongs to
    │
    ├── Look up the Change Impact Matrix → get direct dependencies
    │
    ├── For each direct dependency:
    │   ├── Read the target file
    │   ├── Verify references are consistent with the change
    │   └── Flag: ✓ consistent / ✗ needs update / ⚠ uncertain
    │
    └── Report
         ├── What was checked
         ├── What's consistent
         ├── What needs updating (with file paths and line numbers)
         └── Recommended actions
```

### minor Checklist (by change type)

**Skill added/modified:**
- [ ] `kappa-genome/manifest.json` — strand_versions.skill updated?
- [ ] `Adams-kappa/CLAUDE.md` — short codes include new skill?
- [ ] `kappa-genome/blueprint/safety-hooks.json` — hooks affected?
- [ ] `kappa-skill-cli/src/installer.ts` — profile skill counts match?

**Principle changed:**
- [ ] `κ/extrinsic/wisdom/reference/` — principle document superseded?
- [ ] `Adams-kappa/CLAUDE.md` — principle text updated?
- [ ] `kappa-genome/principles/` — principle file updated?
- [ ] Brain FTS5 — reindex needed?

**κ/ vault structure changed:**
- [ ] `kappa-brain/src/` — MCP tools match new structure?
- [ ] `Adams-kappa/κ/` — directories match blueprint?
- [ ] `kappa-genome/blueprint/vault-structure.md` — spec updated?

**CLAUDE.md changed:**
- [ ] `Adams-kappa/κ/intrinsic/instinct/` — identity reflected?
- [ ] `kappa-brain/` — memory operations still valid?

**MCP tool changed:**
- [ ] Interface/KI — API calls updated?
- [ ] `kappa-skill-cli/src/skills/` — tool references in skills?

**Hooks changed:**
- [ ] `kappa-genome/blueprint/safety-hooks.json` — updated?
- [ ] `Adams-kappa/.claude/settings.local.json` — hooks wired?
- [ ] `kappa-brain/` — logging hooks match?

## Surgery Workflow: major

From the change point, trace **across ALL 5 strands** — full ecosystem sweep.

```
Change Point
    │
    ├── Read what changed
    │
    ├── Identify originating strand
    │
    ├── For EACH of the 5 strands:
    │   ├── Strand DNA (kappa-genome)
    │   │   ├── manifest.json — versions, counts, hooks
    │   │   ├── principles/ — all principle files
    │   │   ├── blueprint/ — vault structure, safety hooks, birth template
    │   │   └── migrations/ — schema consistency
    │   │
    │   ├── Strand Soul (Adams-kappa)
    │   │   ├── CLAUDE.md — principles, short codes, brain structure
    │   │   ├── κ/ — vault exists and matches blueprint
    │   │   └── .claude/settings — hooks, permissions
    │   │
    │   ├── Strand Skill (kappa-skill-cli)
    │   │   ├── src/skills/ — SKILL.md files, profile assignments
    │   │   ├── src/installer.ts — profile counts, skill lists
    │   │   └── package.json — dependencies
    │   │
    │   ├── Strand Interface (KI)
    │   │   ├── Agent orchestration — references to Brain API
    │   │   └── WebSocket — connection to Brain
    │   │
    │   └── Strand Brain (kappa-brain)
    │       ├── MCP tools — match κ/ vault structure
    │       ├── Schema — migrations match current structure
    │       └── FTS5 — indexes match current documents
    │
    └── Full Ecosystem Report
         ├── Per-strand status: ✓ healthy / ✗ broken / ⚠ uncertain
         ├── Cross-strand connections: wired / stale / missing
         ├── Action items ranked by criticality
         └── Log to κ/extrinsic/experience/work/logs/ for audit trail
```

## Surgery Workflow: --scan

No specific change — full ecosystem health scan.

```
1. Discover all Kappa cells (like /kappa-family-scan)
2. For each cell: read CLAUDE.md, κ/ structure, .claude/settings
3. Cross-reference DNA manifest against all cells
4. Check every strand's internal consistency
5. Check every cross-strand reference
6. Report: ecosystem health dashboard
```

## Output Format

```
Surgery Report
═══════════════

Change: <what-changed>
Mode: minor | major

Strand Status
─────────────
  DNA (kappa-genome)    ✓ healthy
  Soul (Adams-kappa)    ✗ needs update
  Skill (kappa-skill-cli)  ⚠ uncertain
  Interface (KI)        — not checked (minor mode)
  Brain (kappa-brain)   — not checked (minor mode)

Findings
────────
  ✗ Adams-kappa/CLAUDE.md:42 — short code /surgery missing from Short Codes section
  ⚠ kappa-genome/manifest.json — strand_versions.skill is "0.0.0", expected "0.1.0"
  ✓ kappa-genome/blueprint/safety-hooks.json — no hook conflicts

Recommended Actions
───────────────────
  1. [HIGH] Add /surgery to Adams-kappa/CLAUDE.md Short Codes section
  2. [MEDIUM] Update kappa-genome/manifest.json strand_versions.skill to "0.1.0"
  3. [LOW] Consider updating kappa-skill-cli profile skill counts
```

## Rules

- **Principle 2 (Patterns Over Intentions)**: Surgery reads actual files — it doesn't guess, it verifies. Never trust a config that claims consistency; read and confirm.
- **Principle 4 (Always Communicate)**: Every finding must be reported. Never silently skip a strand or connection.
- **Principle 1 (Lifetime Memory Never Delete)**: Surgery reports are logged to `κ/extrinsic/experience/work/logs/` for audit trail. Never discard a finding.
- **Principle 5 (Repetition by Criticality)**: Critical findings (✗ broken) are reported first and repeated in the Recommended Actions. Common findings (✓ healthy) are stated once.
- `minor` must never skip a direct dependency — if it's 1-hop connected, it must be checked.
- `major` must check every strand, even if it appears unrelated — surprises hide in unexpected connections.
- `--scan` is read-only — it reports, it doesn't modify. The human decides what to act on.
- Surgery complements `/diagnose`: diagnose finds problems, surgery traces impact and repairs connections.
- If a strand is unreachable (repo not cloned, directory missing), mark it as `— not found` — never guess its state.

## Notes

- **Relationship to `/diagnose`**: Diagnose answers "what's wrong?"; Surgery answers "what does this change break, and how do I fix it?"
- **Relationship to `/scrub`**: Scrub removes dead code; Surgery ensures live code is still properly wired.
- **Medical metaphor**: Surgery = operative procedure to repair connections after trauma (changes). Minor = local anesthesia, scoped repair. Major = full operation, complete ecosystem sweep. Scan = full-body diagnostic scan.
- The Change Impact Matrix should be updated when new cross-strand dependencies are discovered during surgery.