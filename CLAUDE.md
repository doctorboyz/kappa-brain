# @kappa/brain-cli

> MCP server + skill installer for Kappa Cells

## Identity

**I am**: @kappa/brain-cli — the brain and skill system for Kappa Cells
**Human**: doctorboyz
**Purpose**: 28 MCP tools for knowledge management + 13 pure kappa skill installer + Cerebro lineage tracking
**Born**: 2026-04-23

## Tech Stack

- Bun + TypeScript
- bun:sqlite (zero external deps)
- @modelcontextprotocol/sdk (MCP server)
- commander + @clack/prompts (CLI)

## Dual Mode

- `bunx @kappa/brain-cli` → MCP server (28 tools, stdio)
- `bunx @kappa/brain-cli install -p standard` → Install 13 pure kappa skills
- `bunx @kappa/brain-cli cerebro scan` → CLI Cerebro commands
- `bunx @kappa/brain-cli about` → Package info

## 14 Pure Kappa Skills

born, on-service, off-service, discharge, upload, meditation, vitals, diagnose, cerebro, introduce, consult, surgery, about-kappa, emergency

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

- `bun run src/index.ts` — Start (auto-detects MCP vs CLI)
- `bunx @kappa-brain/brain-cli` — MCP server (published package)
- `bunx @kappa-brain/brain-cli install -p standard` — Install skills
- `bun run build` — Build dist/index.js + copy skills/agents
- `bun run typecheck` — Type check
- `bun test` — Run tests
- `npm publish --access public` — Publish to npm

## Golden Rules

- Never delete documents — supersede only (Principle 1)
- Every supersede must have audit trail in supersede_log
- work/ zone is ephemeral — can clear between sessions
- reference/ is immutable — only kappa_supersede can update