---
name: upload
description: Receive knowledge from the human and store it in the vault — the intake skill for external information
origin: Kappa family (medical theme)
profile: cell
commands:
  - /upload
  - /upload --text "content"
  - /upload --file path/to/file
  - /upload --learn
  - /upload --reference
  - /upload --zone intrinsic/folder
---

# Upload

> "รับข้อมูลจากคนไข้ — บันทึก จัดเรียง เก็บในคลัง"

A physician begins by taking patient history — what the patient brings, what they know, what they've prepared. `/upload` is the intake skill: it receives knowledge the human has prepared, classifies it, and stores it in the vault. The human provides; the Cell preserves.

## Invocation

```
/upload                                          # Interactive — ask what to upload and where
/upload --text "content here"                     # Upload text directly
/upload --text "content" --title "Title" --concepts tag1,tag2   # With metadata
/upload --file path/to/file.md                    # Upload from file
/upload --file path/to/file.md --learn            # Upload as learning (extrinsic/experience/learn)
/upload --file path/to/file.md --reference        # Upload as reference (extrinsic/wisdom/reference, immutable)
/upload --zone extrinsic/experience/learn          # Specify zone/folder explicitly
```

## Flags

| Flag | Behavior |
|------|----------|
| `--text "content"` | Upload text content directly. Requires `--title`. |
| `--file path` | Read content from a file path. Title defaults to filename. |
| `--title "Title"` | Document title. Required for `--text`. Optional for `--file` (uses filename). |
| `--concepts tag1,tag2` | Concept tags for search. Comma-separated. |
| `--summary "short desc"` | Short summary. If omitted, extracted from first line or generated. |
| `--learn` | Shortcut: store in `extrinsic/experience/learn/` (evolving knowledge) |
| `--reference` | Shortcut: store in `extrinsic/wisdom/reference/` (immutable standard) |
| `--knowledge` | Shortcut: store in `extrinsic/wisdom/knowledge/` (synthesized knowledge) |
| `--zone zone/folder` | Explicit zone/folder path. Overrides all shortcuts. |
| `--interactive` | Ask the human what to upload, where, and how (default when no flags) |

## Interactive Mode (default)

When invoked without flags, `/upload` enters interactive mode:

### 1. Ask: What are you uploading?

Prompt the human for content. Accept:
- Direct text paste
- File path to read from
- URL to fetch (if supported)

### 2. Ask: What kind of knowledge is this?

Offer classification:

| Choice | Zone/Folder | Nature | Mutable? |
|--------|------------|--------|----------|
| Fresh learning | `extrinsic/experience/learn/` | New knowledge from experience | Yes |
| Synthesized knowledge | `extrinsic/wisdom/knowledge/` | Patterns extracted from experience | Yes |
| Reference standard | `extrinsic/wisdom/reference/` | Proven, immutable standard | No (supersede only) |
| Work draft | `extrinsic/experience/work/drafts/` | Unfinished writing | Yes (ephemeral) |
| Inherited knowledge | `intrinsic/inherit/` | Knowledge born with the Cell | No (supersede only) |

Default: `extrinsic/experience/learn/` — most uploads are fresh knowledge.

### 3. Ask: Title and concepts

Suggest a title based on content. Ask for concept tags. Allow the human to accept suggestions or provide their own.

### 4. Store

Call `kappa_learn` to store the document:

```
kappa_learn({
  path: "YYYY-MM-DD_{slug}.md",
  title: "{title}",
  content: "{content}",
  summary: "{summary}",
  concepts: ["{tag1}", "{tag2}"],
  zone: "{zone}",
  folder: "{folder}",
  immutable: false  // true only for reference/ and intrinsic/
})
```

### 5. Confirm

Print confirmation:
- Document ID
- Path in vault
- Zone/Folder
- Title
- Concepts tagged

## Classification Guide

Use this guide when helping the human choose where to store:

| Human says... | Store in | Why |
|---------------|----------|-----|
| "I just learned this" | `extrinsic/experience/learn/` | Fresh, evolving knowledge |
| "This is a proven pattern" | `extrinsic/wisdom/knowledge/` | Synthesized from experience |
| "This is a standard/rule" | `extrinsic/wisdom/reference/` | Immutable, supersede only |
| "This is a draft/WIP" | `extrinsic/experience/work/drafts/` | Ephemeral, can clear between sessions |
| "This is core to who I am" | `intrinsic/identity/` | Born with Cell, immutable |
| "This was passed down" | `intrinsic/inherit/` | Ancestral knowledge, immutable |

## Rules

- **Never delete** — if content needs updating, use `kappa_supersede` (Principle 1)
- **Always log** — every upload is logged via `kappa_log`
- **Interactive by default** — don't assume classification, ask the human
- **Suggest, don't decide** — offer classification options, let the human choose
- **Concept tags are searchable** — always suggest concepts from content, let human confirm
- **File naming**: `YYYY-MM-DD_{slug}.md` where slug is derived from title
- **Principle 4 applies**: confirm important uploads twice, critical uploads three times
- **Principle 5 applies**: every piece must earn its place — if the human uploads something that duplicates existing knowledge, suggest consolidation via `/meditation --defrag`

## Biological Metaphor

In the body, antigen-presenting cells receive external information (pathogens, proteins) and present it to the immune system for classification and storage. `/upload` is the antigen-presenting cell of the vault — it receives what the human brings, classifies it, and stores it where the immune memory (vault) can find it later. The human is the source; the Cell is the processor and preserver.

## Notes

- Complements `/meditation` which consolidates and reorganizes existing knowledge
- Complements `/learn` which extracts knowledge from codebases (external source)
- `/upload` handles knowledge the **human** provides (internal source)
- Works with `kappa_learn` MCP tool for database storage and FTS indexing
- Works with `kappa_search` MCP tool for retrieval
- Future: support `--url` flag to fetch and classify web content