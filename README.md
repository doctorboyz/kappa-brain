# @kappa-brain/brain-cli

> Kappa Cell brain — MCP server (28 tools) + skill installer (13 pure kappa skills) + Cerebro lineage

## Quick Start

```bash
# MCP server (default mode, no args)
bunx @kappa-brain/brain-cli

# Install skills
bunx @kappa-brain/brain-cli install -p standard

# Cerebro CLI
bunx @kappa-brain/brain-cli cerebro scan
```

## Dual Mode

| Mode | Command | Purpose |
|------|---------|---------|
| MCP server | `bunx @kappa-brain/brain-cli` | 28 tools via stdio |
| MCP server | `bunx @kappa-brain/brain-cli --mcp` | Explicit MCP mode |
| Install | `bunx @kappa-brain/brain-cli install -p cell` | 5 core skills |
| Install | `bunx @kappa-brain/brain-cli install -p standard` | 13 skills + 14 agents |
| Uninstall | `bunx @kappa-brain/brain-cli uninstall --all` | Archive + remove |
| List | `bunx @kappa-brain/brain-cli list --available` | Show available skills |
| Cerebro | `bunx @kappa-brain/brain-cli cerebro scan` | KappaNet discovery |
| About | `bunx @kappa-brain/brain-cli about` | Package info |

## MCP Config

Add to `.claude/settings.json` or `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "kappa-brain": {
      "command": "bunx",
      "args": ["@kappa-brain/brain-cli"],
      "env": {
        "KAPPA_VAULT": "/path/to/cell/κ",
        "KAPPA_DB": "/path/to/cell/κ/kappa-brain.db"
      }
    }
  }
}
```

## 28 MCP Tools

### Critical (9)
kappa_search, kappa_read, kappa_list, kappa_learn, kappa_supersede, kappa_reflect, kappa_handoff, kappa_inbox, kappa_verify

### Important (11)
kappa_log, kappa_work, kappa_archive, kappa_promote, kappa_demote, kappa_defrag, kappa_schedule_add, kappa_schedule_list, kappa_trace, kappa_trace_list, kappa_trace_get

### Nice-to-have (4)
kappa_concepts, kappa_thread, kappa_threads, kappa_thread_update, kappa_stats

### Cerebro (4)
cerebro_scan, cerebro_lineage, cerebro_ping, cerebro_register

## 13 Pure Kappa Skills

| Skill | Purpose |
|-------|---------|
| born | Cell birth ritual |
| on-service | Session start |
| off-service | Session end |
| discharge | Emergency session close |
| meditation | Vault reflection and cleanup |
| vitals | Cell health check |
| diagnose | Diagnostic scan |
| cerebro | KappaNet lineage and discovery |
| introduce | Cell introduction |
| consult | Cross-Cell consultation |
| surgery | Structural vault changes |
| about-kappa | Kappa family info |
| emergency | Emergency protocols |

## 3 Install Profiles

| Profile | Skills | Agents | Description |
|---------|--------|--------|-------------|
| cell | 5 | 5 | Minimal — just enough to be a Kappa Cell |
| standard | 13 | 14 | Daily driver — all pure kappa skills |
| full | 13 | 14 | Same as standard (all pure kappa skills included) |

## kappa-skill-cli

The full [kappa-skill-cli](https://github.com/doctorboyz/kappa-skill-cli) package contains 53 skills including user-specific and tech-pattern skills (Laravel, PyTorch, Python stack, etc.). This package (`@kappa-brain/brain-cli`) includes only the 13 pure kappa skills that apply to every Cell. For the full catalog, use kappa-skill-cli separately.

## Database Tables

| Table | Purpose |
|-------|---------|
| `kappa_documents` | Main knowledge index with FTS5 |
| `kappa_fts` | FTS5 virtual table |
| `supersede_log` | Principle 1 audit trail |
| `activity_log` | System activity |
| `cell_messages` | Cross-Cell messaging |
| `schedule` | Scheduled tasks |
| `trace_log` | Tool call traces |
| `forum_threads` + `forum_messages` | Discussion threads |
| `cell_registry` | Cerebro Cell identity |
| `cell_lineage` | Closure table for family tree |

## Tech Stack

- Bun + TypeScript
- bun:sqlite (zero external deps)
- @modelcontextprotocol/sdk (MCP server)
- commander + @clack/prompts (CLI)

## Kappa Family

| Strand | Repo | Purpose |
|--------|------|---------|
| DNA | [kappa-genome](https://github.com/doctorboyz/kappa-genome) | แบบพิมพ์พันธุกรรม |
| Soul | [Adams-kappa](https://github.com/doctorboyz/Adams-kappa) | เซลล์ตัวแรก — identity + κ/ vault |
| Skill | [kappa-skill-cli](https://github.com/doctorboyz/kappa-skill-cli) | ทักษะเต็ม 53 อย่าง |
| Interface | [KI](https://github.com/doctorboyz/KI) | ระบบประสาท — multi-agent TUI |
| Brain | This repo | สมองความจำ — MCP + CLI |

## License

MIT