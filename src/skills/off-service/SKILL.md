---
name: off-service
description: Session handoff — forward context to the next session or agent
commands:
  - /off-service
  - /off-service --lite
---

# Off-Service

> "ส่งต่อ — สรุปสถานะ ส่งมอบงาน ให้คนเวรต่อ"

When a physician goes off-service, they write a handoff note for the next doctor on call. `/off-service` is the session handoff that packages current context, in-progress work, and next steps so the next session or agent can pick up seamlessly.

This skill merges the Oracle ecosystem's `/forward` and `/forward-lite` commands.

## Invocation

```
/off-service           # Full handoff — enter plan mode, write comprehensive handoff note
/off-service --lite    # Quick handoff — write a brief handoff without entering plan mode
```

## Flags

| Flag | Behavior |
|------|----------|
| `--lite` | Quick handoff. Write a brief summary to `κ/extrinsic/experience/work/logs/` without entering plan mode. Covers: current task, blockers, next steps. Equivalent to Oracle's `/forward-lite`. |

## Handoff Contents (default)

1. **Current Task** — What was being worked on
2. **Progress** — What was completed, what remains
3. **Blockers** — Any issues preventing completion
4. **Context** — Key decisions, technical details the next agent needs
5. **Next Steps** — Prioritized list of what to do next
6. **Principle Flags** — Any Kappa Principles that were challenged or need attention

## Rules

- Default `/off-service` enters plan mode to write a thorough handoff note
- The handoff note is saved to `κ/extrinsic/experience/work/logs/` — never sent directly without human review
- `--lite` skips plan mode and writes a 5-10 line handoff directly
- Principle 1 (Nothing is Deleted) applies: handoff notes are preserved, never overwritten
- The handoff should be written for a stranger — the next agent may have no prior context
- Include git state (branch, uncommitted changes) so the next session can resume safely
- Rule 6 (Transparency) applies: flag any unresolved issues honestly, do not minimize them

## Notes

Migrated from Oracle ecosystem:
- Replaces `/forward` — the full handoff enters plan mode for thoroughness
- Merges `/forward-lite` — `--lite` provides quick handoff without plan mode
- The medical metaphor (off-service = handoff note for the next doctor on call) replaces the forwarding framing, aligning with the Kappa family's medical theme