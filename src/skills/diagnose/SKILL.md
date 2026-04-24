---
name: diagnose
description: System diagnosis and discovery — trace, xray, and dig into the codebase
commands:
  - /diagnose <query>
  - /diagnose <query> --deep
  - /diagnose <query> --timeline
  - /diagnose <query> --session
---

# Diagnose

> "ตรวจวินิจฉัย — ตามรอย หาสาเหตุ แก้ที่ราก"

A physician diagnoses by tracing symptoms to their root cause. `/diagnose` is the Kappa agent's discovery and tracing skill — it follows threads across repos, sessions, and files to find what's really going on. From quick traces to deep x-rays, diagnose surfaces the truth beneath the surface.

This skill merges the Oracle ecosystem's `/xray`, `/trace`, and `/dig` commands.

## Invocation

```
/diagnose <query>              # Trace and discover — follow the query across repos and files
/diagnose <query> --deep       # Full xray + trace — thorough structural analysis and deep search
/diagnose <query> --timeline   # Session mining — search session history for patterns (like /dig)
/diagnose <query> --session    # Session internals — inspect current session state (like /xray)
```

## Flags

| Flag | Behavior |
|------|----------|
| `--deep` | Full diagnosis. Run structural xray (dependencies, architecture, file map) combined with deep trace across all repos. Thorough but slower. Merges Oracle's `/xray` + `/trace`. |
| `--timeline` | Session mining. Search through session history, logs, and retrospectives for patterns related to the query. Finds recurring issues and historical context. Merges Oracle's `/dig`. |
| `--session` | Session internals. Inspect the current session's context: loaded files, tool calls, token usage, and context budget. Merges Oracle's `/xray` for current session inspection. |

## Diagnosis Workflow (default)

1. **Parse query** — Extract key terms and intent from the user's question
2. **Search** — Grep across known repos for files, functions, and references matching the query
3. **Trace** — Follow imports, calls, and dependencies from matched items
4. **Summarize** — Present findings: what was found, where it lives, how it connects
5. **Recommend** — Suggest next steps based on what the trace reveals

## Rules

- `<query>` is required — diagnose always needs something to search for
- Default behavior is a broad trace: find and follow, not deep analysis
- `--deep` may take significant time on large codebases — warn the user
- `--timeline` searches `κ/extrinsic/` for historical context — respects Principle 1 (Nothing is Deleted)
- `--session` is read-only — never modify session state during diagnosis
- Diagnosis results should be factual: report what exists, not what should exist
- Principle 2 (Patterns Over Intentions) applies: trace actual dependencies, not assumed ones
- If the query yields no results, say so explicitly — do not fabricate findings

## Notes

Migrated from Oracle ecosystem:
- Replaces `/trace` — the default trace/discover behavior is the primary diagnose mode
- Merges `/xray` — `--deep` and `--session` cover structural and session xray
- Merges `/dig` — `--timeline` covers the session mining / goldminer behavior
- The medical metaphor (diagnose = clinical diagnosis, tracing symptoms to cause) replaces the technical tracing framing, aligning with the Kappa family's medical theme