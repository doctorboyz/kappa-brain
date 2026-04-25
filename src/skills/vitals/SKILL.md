---
name: vitals
description: System health check and skill profile switching — check the pulse, change the mode
commands:
  - /vitals
  - /vitals [cell|standard|full]
  - /vitals --skills
---

# Vitals

> "ตรวจชีพจร — ดูสุขภาพระบบ เปลี่ยนโหมดทำงาน"

Checking vitals is the first thing a physician does. `/vitals` is the Kappa agent's health check and profile management skill — it shows what's running, what's available, and can switch between skill profiles to change the agent's operating mode.

This skill merges the Oracle ecosystem's `/skills-list` and `/go` commands.

## Invocation

```
/vitals                        # Show system health: PM2, ports, services, installed skills
/vitals cell                   # Switch to cell profile (minimal, essential skills only)
/vitals standard               # Switch to standard profile (default skill set)
/vitals full                   # Switch to full profile (all skills enabled)
/vitals --skills               # List all installed skills with their status and profile
```

## Flags

| Flag | Behavior |
|------|----------|
| `--skills` | List all installed skills. Show each skill's name, profile assignment, and enabled/disabled status. Equivalent to Oracle's `/skills-list`. |

## Health Check Output (default, no arguments)

1. **PM2 Processes** — Running services, status, CPU/memory usage
2. **Port Usage** — Which ports are occupied and by what
3. **Service Status** — Key services (databases, caches, API servers) up/down
4. **Skill Summary** — Count of installed skills per profile
5. **Current Profile** — Which skill profile is active
6. **Vault Sync Status** — Are vault files and DB in sync? Run `kappa_verify` to check document counts and `kappa_sync sync --dry-run` to preview differences

## Profile Switching (with profile argument)

When a profile name is given as an argument:
- **cell** — Minimal profile. Only essential skills loaded. Low token overhead. For focused work.
- **standard** — Default profile. Balanced skill set. General-purpose operation.
- **full** — All skills enabled. Maximum capability. Higher token overhead.

Profile switching behavior:
1. Validate the requested profile exists
2. Deactivate skills not in the target profile
3. Activate skills in the target profile
4. Confirm the switch with a summary of changes

## Rules

- No arguments = health check only, no profile changes
- Profile names must be exact: `cell`, `standard`, `full`
- `--skills` can be combined with a profile name to preview what would change before switching
- Health check should complete quickly — it's a pulse check, not a full exam
- If PM2 is not installed, skip the PM2 section gracefully
- If a service is unreachable, report it as DOWN — do not hang or retry
- Principle 2 (Patterns Over Intentions) applies: report actual service states, not expected ones
- Profile switches are logged to `κ/extrinsic/` — Principle 1 (Nothing is Deleted)

## Notes

Migrated from Oracle ecosystem:
- Replaces `/skills-list` — `--skills` provides the full skill inventory
- Merges `/go` — profile name argument triggers the profile switch behavior
- The medical metaphor (vitals = checking pulse, changing treatment mode) replaces the technical listing/go framing, aligning with the Kappa family's medical theme