# kappa-brain

> MCP server for Kappa Cell memory

## Identity

**I am**: kappa-brain — the memory system for Kappa Cells
**Human**: doctorboyz
**Purpose**: 28 MCP tools for knowledge management — FTS5 search, supersede system, cross-Cell messaging, Cerebro lineage tracking
**Born**: 2026-04-23

## Tech Stack

- Bun + TypeScript
- bun:sqlite (zero external deps)
- @modelcontextprotocol/sdk (MCP server)

## Vault Structure

Implements the 4-zone κ/ vault: Communication, Memory, Work, Archive
See kappa-genome/blueprint/vault-structure.md for full spec.

## Cerebro — Cell Registry & Lineage

kappa-brain รวม Cerebro tools สำหรับ lineage tracking และ Cell discovery ผ่าน KappaNet protocol

### Database Tables

| Table | Purpose |
|-------|---------|
| `cell_registry` | Cell identity — kappanet_id, name, repo, parent, ancestry, status |
| `cell_lineage` | Closure table for family tree queries (ancestor_id, descendant_id, depth) |

### Cerebro MCP Tools

| Tool | Purpose |
|------|---------|
| `cerebro_scan` | Scan KappaNet — list registered cells, find children |
| `cerebro_lineage` | Query lineage — ancestors, descendants, or full tree |
| `cerebro_ping` | Cell presence — update last_seen or check if Cell is registered |
| `cerebro_register` | Register this Cell in the KappaNet registry |

### KappaNet Protocol

Defined in `kappa-genome/kappanet/protocol.md`:
- Cell identity: `kappa:{owner}:{cell_name}`
- Birth announcements: GitHub Issues with `kappanet:birth` label
- Lineage chains: `ancestry` array in manifest.json
- Discovery: `kappanet:birth` issues in parent repos

## Tool Summary (28 tools)

### Critical (9)
kappa_search, kappa_read, kappa_list, kappa_learn, kappa_supersede, kappa_reflect, kappa_handoff, kappa_inbox, kappa_verify

### Important (11)
kappa_log, kappa_work, kappa_archive, kappa_promote, kappa_demote, kappa_defrag, kappa_schedule_add, kappa_schedule_list, kappa_trace, kappa_trace_list, kappa_trace_get

### Nice-to-have (4)
kappa_concepts, kappa_thread, kappa_threads, kappa_thread_update, kappa_stats

### Cerebro (4)
cerebro_scan, cerebro_lineage, cerebro_ping, cerebro_register

## Commands

- `bun run src/server.ts` — Start MCP server (stdio)
- `bun run typecheck` — Type check
- `bun test` — Run tests

## Golden Rules

- Never delete documents — supersede only (Principle 1)
- Every supersede must have audit trail in supersede_log
- work/ zone is ephemeral — can clear between sessions
- reference/ is immutable — only kappa_supersede can update