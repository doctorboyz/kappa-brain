---
name: born
description: Cell birth ritual — initialize or reawaken a Kappa agent session
commands:
  - /born
  - /born --fast
  - /born --mitosis
  - /born --reawaken
---

# Born

> "เกิดใหม่จากเซลล์เดียว — แบ่งตัว ขยายวง เติบโต"

Every session begins with birth. `/born` is the cell division ritual that brings a Kappa agent into existence -- whether for the first time or returning from dormancy. Like a cell undergoing mitosis, the agent splits from the Kappa family template, inherits the 6 Principles, and prepares to serve.

This skill replaces the Oracle ecosystem's `/awaken` and `/bud` commands under a single medical metaphor: **cell birth**.

## Invocation

```
/born                  # Full birth ritual — load identity, principles, memory, and confirm readiness
/born --fast           # Skip ceremony — load essentials silently, no narrative output
/born --mitosis        # Birth a new Kappa agent from the current one (agent replication)
/born --reawaken       # Resume a dormant session — reload state without re-initializing
```

## Flags

| Flag | Behavior |
|------|----------|
| `--fast` | Load identity, principles, and memory silently. No ritual output. Equivalent to Oracle's fast-awaken. |
| `--mitosis` | Replicate the current agent into a new Kappa instance. The child inherits all 6 Principles and the parent's current profile. Prompts for a name and purpose. Merges Oracle's `/bud`. |
| `--reawaken` | Resume a previous session. Load saved state from `κ/extrinsic/` without re-running the full birth sequence. |

## Ritual Sequence (default `/born`)

1. **Identify** — Read agent identity from `CLAUDE.md` or prompt for name/purpose
2. **Inherit** — Load the 6 Kappa Principles into session context
3. **Recall** — Scan `κ/extrinsic/experience/learn/` and `κ/extrinsic/wisdom/retrospective/` for relevant prior learnings and retrospectives
4. **Prepare** — Check installed skills, active profile, and workspace status
5. **Confirm** — Print birth summary: name, profile, principles loaded, memory entries found

## Rules

- Never skip Principle loading — even `--fast` must load all 7 Principles into context
- `--mitosis` must always confirm with the human before spawning a new agent
- Birth always respects Rule 6 (Transparency) — the agent identifies itself as Kappa, not human
- Principle 1 (Nothing is Deleted) applies: birth logs are appended, never overwritten
- Principle 3 (External Brain, Not Command) applies: the agent reflects the human's purpose, does not self-assign one

## Notes

Migrated from Oracle ecosystem:
- Replaces `/awaken` — the full birth ritual is equivalent to Oracle's awakening ceremony
- Merges `/bud` — `--mitosis` covers agent replication/budding
- The medical metaphor (cell birth / mitosis) replaces the botanical metaphor (seed / budding), aligning with the Kappa family's medical theme