---
name: on-service
description: Session orientation — get oriented before starting work
commands:
  - /on-service
  - /on-service --lite
  - /on-service --deep
  - /on-service --now
---

# On-Service

> "เข้าเวร — รับคนไข้ ตรวจสถานะ เตรียมตัวทำงาน"

When a physician comes on-service, they first review the patient list, check overnight events, and orient themselves before making decisions. `/on-service` is the session orientation that brings a Kappa agent up to speed on what happened, what's in progress, and what needs attention.

This skill merges the Oracle ecosystem's `/recap` and `/recap-lite` commands.

## Invocation

```
/on-service            # Standard orientation — project status, recent changes, open items
/on-service --lite     # Quick orientation — just the highlights
/on-service --deep     # Thorough recap — full history scan, memory dive, dependency map
/on-service --now      # Mid-session check — what's the current state right now
```

## Flags

| Flag | Behavior |
|------|----------|
| `--lite` | Quick orientation. Top 3 items only: current branch, last commit, outstanding tasks. No deep scanning. Equivalent to Oracle's `/recap-lite`. |
| `--deep` | Thorough recap. Scan git history, memory files, active branches, open PRs, dependency changes, and skill status. Build a full picture of project state. |
| `--now` | Mid-session status check. What has been done in this session so far, what's in progress, what's remaining. Useful when context has drifted. |

## Orientation Checklist (default)

1. **Identity** — Who am I, which project, which profile
2. **Git State** — Current branch, recent commits, uncommitted changes
3. **Memory** — Relevant learnings and retrospectives from `κ/extrinsic/`
4. **Handoff Notes** — Previous shift handoff from `κ/extrinsic/experience/work/logs/`
5. **Open Items** — TODO items, in-progress work, blocked tasks
6. **Skills** — What skills are available and relevant to this session

## Rules

- Always run `/on-service` at the start of a session if no other orientation was performed
- `--lite` should complete in under 30 seconds — no deep file scanning
- `--deep` may take longer but should never modify files — read-only orientation
- `--now` is for mid-session drift correction, not a replacement for starting orientation
- If memory files are empty, say so explicitly rather than fabricating context
- Principle 2 (Patterns Over Intentions) applies: report what the code actually shows, not what was intended

## Notes

Migrated from Oracle ecosystem:
- Replaces `/recap` — the standard orientation covers full project status
- Merges `/recap-lite` — `--lite` provides the quick highlights-only format
- The medical metaphor (on-service = coming on shift, reviewing the board) replaces the recap framing, aligning with the Kappa family's medical theme