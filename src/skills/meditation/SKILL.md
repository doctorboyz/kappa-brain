---
name: meditation
description: Defragment memory tiers — organize, consolidate, and promote knowledge within the cell's memory
origin: Kappa family (medical theme)
profile: standard
aliases: []
---

# Meditation

> "นั่งสมาธิจัดแจงความคิด — เมื่อสมองกระจัดกระจาย ต้องรวบรวม"

In medicine, meditation is the practice of organizing scattered thoughts into clarity — defragmenting the mind. `/meditation` does the same for the cell's memory: reorganizes knowledge between tiers, consolidates fragmented entries, and ensures the cell's memory is coherent and accessible. When memory gets fragmented, meditate.

**Principle 7 Connection**: Meditation is the skill that enforces Keep Tidy at the vault level. Every piece has purpose, every tier has meaning, every document earns its place. If it's stale, demote it. If it's verified, promote it. If it's duplicated, consolidate it.

## Invocation

```
/meditation                    # Full meditation — review all memory tiers
/meditation --tier             # Review and promote/demote knowledge between tiers
/meditation --defrag           # Full defragmentation — reorganize κ/ memory, consolidate duplicates, update references
/meditation --sync             # Sync vault files ↔ DB — import new vault files, export new DB entries
```

## Flags

| Flag | Behavior |
|------|----------|
| `--tier` | Review knowledge in each tier and suggest promotions (knowledge to reference) or demotions (reference back to knowledge if stale). Interactive — human decides each move. |
| `--defrag` | Full defragmentation. Consolidate duplicate entries, reorganize file structure, update cross-references, repair broken links. More aggressive than `--tier`. |
| `--sync` | Bidirectional vault sync. Calls `kappa_sync sync` to import new/changed vault files into DB and export new DB entries to vault files. Use after manual vault edits or to ensure consistency. |

Default (no flag): equivalent to `--tier` — a gentle review of memory tiers.

## Memory Tiers

| Tier | Path | Purpose |
|------|------|---------|
| Instinct | `κ/intrinsic/instinct/` | Philosophy — born with Cell, immutable |
| Inherit | `κ/intrinsic/inherit/` | Inherited from ancestor — chosen at birth |
| Identity | `κ/intrinsic/identity/` | Identity — human-defined, born with Cell |
| Learn | `κ/extrinsic/experience/learn/` | Fresh knowledge from external sources |
| Knowledge | `κ/extrinsic/wisdom/knowledge/` | Synthesized knowledge — cross-referenced, validated |
| Reference | `κ/extrinsic/wisdom/reference/` | Promoted knowledge — immutable, supersede only |
| Retrospective | `κ/extrinsic/wisdom/retrospective/` | Session reflections (append-only, never promoted) |
| Logs | `κ/extrinsic/experience/work/logs/` | System activity + handoff notes (append-only) |
| Work | `κ/extrinsic/experience/work/` | Ephemeral workspace — drafts, lab, logs |
| Archive | `κ/extrinsic/archive/` | Archived/completed work (preserved per Principle 1) |

## Tier Operations

### Promote (Knowledge -> Reference)
When knowledge has been verified across multiple sessions and is stable:
- Use `kappa_promote` to move from `κ/extrinsic/wisdom/knowledge/` to `κ/extrinsic/wisdom/reference/`
- Creates an immutable reference document
- Marks the knowledge as superseded
- Logs the promotion with `human_approved=1`

### Demote (Reference -> Knowledge)
When reference material becomes stale or uncertain:
- Use `kappa_demote` to move from `κ/extrinsic/wisdom/reference/` back to `κ/extrinsic/wisdom/knowledge/`
- Creates a mutable knowledge document
- Marks the reference as superseded by the demoted version
- Logs the demotion with reason (human approves)

### Defragmentation (--defrag)
- Use `kappa_defrag` for automated vault health check
- **Scan for duplicates** — entries with overlapping titles in the same folder
- **Repair orphans** — superseded documents with no supersede_log entry (auto-repaired)
- **Identify stale work/** — work/ items older than 7 days that should be archived or discarded
- **Report** — zone counts, duplicates found, orphans repaired, stale items

## Tool Mapping

| Operation | kappa-brain Tool | Purpose |
|-----------|------------------|---------|
| Promote | `kappa_promote` | knowledge -> reference (immutable) |
| Demote | `kappa_demote` | reference -> knowledge (mutable, re-evaluate) |
| Defrag | `kappa_defrag` | Find duplicates, repair orphans, identify stale |
| Sync | `kappa_sync` | Bidirectional vault ↔ DB synchronization |
| Verify | `kappa_verify` | Health check — counts, orphans, integrity |
| Reflect | `kappa_reflect` | Random wisdom from vault |

## Rules

- NEVER auto-delete during meditation — every entry is preserved (Principle 1: Nothing is Deleted)
- Duplicates are merged, not removed — the consolidated entry preserves all unique content
- Intrinsic entries (instinct, inherit, identity) are sacred — never demote or reorganize them
- Promotions and demotions require human approval (Principle 3)
- All meditation actions are logged to `κ/extrinsic/experience/work/logs/` (Principle 1)
- Defragmentation repairs orphans and identifies stale items but does NOT auto-delete — it reports for human decision (Principle 7: every piece has purpose)
- Medical metaphor: meditation = mental defragmentation — organizing scattered knowledge into coherent understanding

## Notes

New Kappa skill — no Oracle predecessor.
- Addresses memory fragmentation that accumulates over time in active cells
- The tier system provides a natural lifecycle for knowledge: learn -> knowledge -> reference -> (demote) -> knowledge
- Connected to Principle 7 (Keep Tidy) — meditation enforces tidy memory at the vault level
- Medical metaphor: meditation = cognitive defragmentation, aligning scattered neural pathways
- Every tool that meditation describes (`kappa_promote`, `kappa_demote`, `kappa_defrag`, `kappa_verify`) now exists in kappa-brain