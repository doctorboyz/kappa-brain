---
name: discharge
description: Session retrospective — capture learnings before the session ends
commands:
  - /discharge
  - /discharge --lite
  - /discharge --auto
  - /discharge --deep
  - /discharge --detail
  - /discharge --dig
---

# Discharge

> "จ่ายตัวออก — สรุปผล ถอดบทเรียน ส่งต่อคนต่อไป"

Before a patient leaves, the physician writes a discharge summary. `/discharge` is the session retrospective that captures what happened, what was learned, and what should carry forward. No session should end without one.

This skill merges the Oracle ecosystem's `/rrr`, `/rrr-lite`, and `/auto-retrospective` commands.

## Invocation

```
/discharge              # Full retrospective using the standard template
/discharge --lite       # Quick retro — 3-question summary
/discharge --auto       # Configure auto-retrospective behavior
/discharge --deep       # Deep retro — 5 parallel subagents analyze the session
/discharge --detail     # Full template with all sections (same as default)
/discharge --dig        # Session goldminer — extract hidden value from session
```

## Flags

| Flag | Behavior |
|------|----------|
| `--lite` | Quick retrospective. Three questions only: What worked? What didn't? What to carry forward? Equivalent to Oracle's `/rrr-lite`. |
| `--auto` | Configure auto-retrospective: set triggers, template, and output path. The retrospective runs automatically when a session ends or at scheduled intervals. Merges Oracle's `/auto-retrospective`. |
| `--deep` | Deploy 5 parallel subagents to analyze the session from different angles: (1) technical accuracy, (2) process efficiency, (3) missed opportunities, (4) principle adherence, (5) communication quality. |
| `--detail` | Full template retrospective. All sections completed. Same behavior as default `/discharge`. |
| `--dig` | Session goldminer. Actively search for insights, patterns, and reusable knowledge buried in the session transcript. Extracts hidden value that a standard retro might miss. |

## Discharge Template (default)

1. **Session Summary** — What was accomplished
2. **Key Decisions** — Choices made and rationale
3. **Learnings** — What the agent learned (written to `κ/extrinsic/experience/learn/`)
4. **Failures** — What didn't work and why
5. **Carry Forward** — What the next session should know
6. **Log** — Session end recorded in `κ/extrinsic/experience/work/logs/` (auto via kappa_log or manual entry)
6. **Principle Check** — Did any Kappa Principle get challenged or reinforced?

## Rules

- Every `/discharge` output is saved to `κ/extrinsic/wisdom/retrospective/` — never discarded
- `/discharge` must also log session end to `κ/extrinsic/experience/work/logs/` via `kappa_log`
- Principle 1 (Nothing is Deleted) applies: retros are append-only
- `--deep` subagents must not modify files — analysis only
- `--dig` should look for patterns the human might not have noticed
- The retrospective should be honest, not flattering. If something went wrong, say so
- Rule 6 (Transparency) applies: if the agent failed, admit it in the retro

## Notes

Migrated from Oracle ecosystem:
- Replaces `/rrr` — the full retrospective is the default discharge
- Merges `/rrr-lite` — `--lite` provides the quick 3-question format
- Merges `/auto-retrospective` — `--auto` handles automatic retro configuration
- The medical metaphor (discharge = discharge summary) replaces the journaling framing, aligning with the Kappa family's medical theme