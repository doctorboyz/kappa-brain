# kappa-brain

> MCP server for Kappa Cell memory — 21 tools, FTS5 + sqlite-vec, supersede system

## Quick Start

```bash
# Install
bun install

# Run as MCP server (stdio)
bun run src/server.ts

# Type check
bun run typecheck
```

## MCP Config

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "kappa-brain": {
      "command": "bun",
      "args": ["run", "/path/to/kappa-brain/src/server.ts"],
      "env": {
        "KAPPA_VAULT": "/path/to/cell/κ",
        "KAPPA_DB": "/path/to/kappa-brain.db"
      }
    }
  }
}
```

## 21 Tools

### CRITICAL (9)
| Tool | Purpose | Vault Zone |
|------|---------|-----------|
| `kappa_search` | FTS5 full-text search | All |
| `kappa_read` | Read document by path | All |
| `kappa_list` | List documents by zone/folder | All |
| `kappa_learn` | Add knowledge | → learnings/ or reference/ |
| `kappa_supersede` | Update reference/ without delete | reference/ |
| `kappa_reflect` | Random wisdom from vault | memory/ |
| `kappa_handoff` | Session handoff summary | retros/ + learnings/ |
| `kappa_inbox` | Cross-Cell messaging | inbox/ + outbox/ |
| `kappa_verify` | Brain health check | All |

### IMPORTANT (9)
| Tool | Purpose | Vault Zone |
|------|---------|-----------|
| `kappa_log` | System activity log | logs/ |
| `kappa_work` | Manage work/ zone | drafts/ + lab/ + research/ |
| `kappa_archive` | Archive completed docs | archive/ |
| `kappa_promote` | Learnings → reference | learnings/ → reference/ |
| `kappa_schedule_add` | Add scheduled task | — |
| `kappa_schedule_list` | List scheduled tasks | — |
| `kappa_trace` | Record tool call trace | — |
| `kappa_trace_list` | List traces for session | — |
| `kappa_trace_get` | Get specific trace | — |

### NICE-TO-HAVE (4)
| Tool | Purpose |
|------|---------|
| `kappa_concepts` | Concept tag frequency map |
| `kappa_thread` | Create/read discussion threads |
| `kappa_threads` | List active threads |
| `kappa_thread_update` | Add message to thread |
| `kappa_stats` | Vault statistics |

## Database Tables

- `kappa_documents` — Main knowledge index with FTS5
- `kappa_fts` — FTS5 virtual table
- `supersede_log` — Principle 1 audit trail
- `activity_log` — System activity (kappa_log)
- `cell_messages` — Cross-Cell messaging
- `schedule` — Scheduled tasks
- `trace_log` — Tool call traces
- `forum_threads` + `forum_messages` — Discussion threads

## Tech Stack

- Bun + TypeScript
- better-sqlite3 + Drizzle ORM
- @modelcontextprotocol/sdk
- Hono (HTTP API, planned)

## Kappa Family

| Strand | Repo |
|--------|------|
| DNA | [kappa-genome](https://github.com/doctorboyz/kappa-genome) |
| Soul | [Adams-kappa](https://github.com/doctorboyz/Adams-kappa) |
| Skill | [kappa-skill-cli](https://github.com/doctorboyz/kappa-skill-cli) |
| Interface | [KI](https://github.com/doctorboyz/KI) |
| Brain | This repo |

## License

BUSL-1.1