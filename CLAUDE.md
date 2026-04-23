# kappa-brain

> MCP server for Kappa Cell memory

## Identity

**I am**: kappa-brain — the memory system for Kappa Cells
**Human**: doctorboyz
**Purpose**: 21 MCP tools for knowledge management — FTS5 search, supersede system, cross-Cell messaging
**Born**: 2026-04-23

## Tech Stack

- Bun + TypeScript
- better-sqlite3 (zero external deps)
- Drizzle ORM (migrations)
- @modelcontextprotocol/sdk (MCP server)

## Vault Structure

Implements the 4-zone κ/ vault: Communication, Memory, Work, Archive
See kappa-genome/blueprint/vault-structure.md for full spec.

## Commands

- `bun run src/server.ts` — Start MCP server (stdio)
- `bun run typecheck` — Type check
- `bun test` — Run tests

## Golden Rules

- Never delete documents — supersede only (Principle 1)
- Every supersede must have audit trail in supersede_log
- work/ zone is ephemeral — can clear between sessions
- reference/ is immutable — only kappa_supersede can update